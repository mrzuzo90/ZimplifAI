"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "default" | "interactive" | "project";

/** Cursor nodo eléctrico: punto + anillo con lag y modos contextuales.
 *  - interactive (botones/enlaces): el anillo crece.
 *  - project (tarjetas del showroom): anillo volt + etiqueta "ver caso".
 *  Solo en punteros finos y sin reduced-motion. */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setEnabled(true);
    document.documentElement.classList.add("has-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let mode: Mode = "default";
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-cursor="project"]')) mode = "project";
      else if (target?.closest("a, button, input, textarea, select, [data-cursor='hover']"))
        mode = "interactive";
      else mode = "default";
    };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
      }

      if (ringRef.current) {
        const scale = mode === "project" ? 2.4 : mode === "interactive" ? 1.8 : 1;
        ringRef.current.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0) scale(${scale})`;
        ringRef.current.style.borderColor =
          mode === "project" ? "rgba(185, 255, 42, 0.95)" : "rgba(232, 230, 225, 0.7)";
      }

      if (labelRef.current) {
        const show = mode === "project";
        labelRef.current.style.transform = `translate3d(${x + 22}px, ${y + 22}px, 0) scale(${show ? 1 : 0.6})`;
        labelRef.current.style.opacity = show ? "1" : "0";
      }

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[999] size-2 rounded-full bg-ink mix-blend-difference"
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[999] size-9 rounded-full border border-ink/70 mix-blend-difference transition-[border-color] duration-300"
        aria-hidden="true"
      />
      {/* Etiqueta contextual sobre proyectos */}
      <div
        ref={labelRef}
        className="pointer-events-none fixed left-0 top-0 z-[999] origin-top-left rounded-full bg-volt px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bg opacity-0"
        aria-hidden="true"
      >
        ver caso →
      </div>
    </>
  );
}
