"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  depth: number;
}

/** Cometa de luz que viaja de A→B por una conexión (volt entre partículas, plasma desde el cursor). */
interface Pulse {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  t: number;
  speed: number;
  rgb: string;
}

const CONNECT_DIST = 130;
const MOUSE_DIST = 170;
const COUNT_CAP = 150;
const MAX_PULSES = 46;
/** Probabilidad por par y por frame de lanzar un pulso volt. */
const PULSE_SPAWN = 0.018;
/** Probabilidad por partícula-cursor y por frame de lanzar un pulso plasma. */
const MOUSE_PULSE_SPAWN = 0.05;

const VOLT = "185, 255, 42";
const PLASMA = "69, 229, 255";

/**
 * Red eléctrica viva en canvas 2D: constelación donde la corriente fluye.
 * Cometas de luz (volt) viajan por las conexiones entre partículas y desde
 * el cursor (plasma) como una descarga. Respeta prefers-reduced-motion.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let pulses: Pulse[] = [];

    const spawn = () => {
      const count = Math.min(COUNT_CAP, Math.max(40, Math.floor((width * height) / 14000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        depth: Math.random(),
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
      pulses = [];
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const drawPulse = (p: Pulse) => {
      p.t += p.speed;
      if (p.t >= 1) return false;

      const x = p.ax + (p.bx - p.ax) * p.t;
      const y = p.ay + (p.by - p.ay) * p.t;
      // La intensidad sube y baja con la posición: nace, viaja y se disipa.
      const alpha = Math.sin(p.t * Math.PI);

      // Estela corta (cometa)
      const tx = x - (p.bx - p.ax) * p.speed;
      const ty = y - (p.by - p.ay) * p.speed;
      ctx.strokeStyle = `rgba(${p.rgb}, ${0.75 * alpha})`;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Núcleo con halo
      ctx.fillStyle = `rgba(${p.rgb}, ${0.22 * alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${p.rgb}, ${0.95 * alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();

      return true;
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        const parallax = 1 + p.depth * 0.6;
        p.x += p.vx * parallax;
        p.y += p.vy * parallax;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_DIST && dist > 0.01) {
          const force = (1 - dist / MOUSE_DIST) * 0.02;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
          p.vx *= 0.995;
          p.vy *= 0.995;
        } else {
          p.vx *= 0.99;
          p.vy *= 0.99;
        }
      }

      // Conexiones entre partículas cercanas + pulsos de corriente volt
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.1;
            ctx.strokeStyle = `rgba(185, 255, 42, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            if (pulses.length < MAX_PULSES && Math.random() < PULSE_SPAWN) {
              pulses.push({
                ax: a.x,
                ay: a.y,
                bx: b.x,
                by: b.y,
                t: 0,
                speed: 0.016 + Math.random() * 0.02,
                rgb: VOLT,
              });
            }
          }
        }

        // Conexión con el cursor (plasma) + descargas desde el cursor
        const adx = a.x - mouse.x;
        const ady = a.y - mouse.y;
        const ad = Math.hypot(adx, ady);
        if (ad < CONNECT_DIST) {
          const alpha = (1 - ad / CONNECT_DIST) * 0.4;
          ctx.strokeStyle = `rgba(69, 229, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();

          if (pulses.length < MAX_PULSES && Math.random() < MOUSE_PULSE_SPAWN) {
            pulses.push({
              ax: mouse.x,
              ay: mouse.y,
              bx: a.x,
              by: a.y,
              t: 0,
              speed: 0.02 + Math.random() * 0.02,
              rgb: PLASMA,
            });
          }
        }
      }

      // Actualizar y dibujar pulsos (los terminados se eliminan)
      for (let i = pulses.length - 1; i >= 0; i--) {
        if (!drawPulse(pulses[i])) pulses.splice(i, 1);
      }

      for (const p of particles) {
        ctx.fillStyle =
          p.depth > 0.6 ? "rgba(232, 230, 225, 0.85)" : "rgba(185, 255, 42, 0.7)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
