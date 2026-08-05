"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { site } from "@/data/site";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";

type Status = "idle" | "sending" | "success" | "error" | "not-configured";

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-muted/50 outline-none transition-colors focus:border-volt/60";

function WhatsAppLink() {
  if (!site.whatsapp) return null;
  return (
    <a
      href={`https://wa.me/${site.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-2 border-b border-line/60 pb-3 text-sm text-ink/85 transition-colors hover:text-volt"
    >
      WhatsApp <span aria-hidden="true">↗</span>
    </a>
  );
}

function SocialLinks() {
  const socials = [
    site.social.github && { label: "GitHub", href: site.social.github },
    site.social.linkedin && { label: "LinkedIn", href: site.social.linkedin },
    site.social.x && { label: "X", href: site.social.x },
  ].filter((s): s is { label: string; href: string } => Boolean(s));

  if (!socials.length) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-volt/50 hover:text-volt"
        >
          {s.label}
        </a>
      ))}
    </div>
  );
}

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });
      const json = (await res.json().catch(() => null)) as { message?: string } | null;

      if (res.status === 503) {
        setStatus("not-configured");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setError(json?.message ?? "No se ha podido enviar el mensaje. Inténtalo de nuevo.");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setError("Ha ocurrido un error inesperado. Inténtalo de nuevo o escríbeme por email.");
    }
  }

  return (
    <section id="contacto" className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <SectionLabel index="05" label="Contacto" className="mb-12 md:mb-16" />

      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              ¿Tienes una empresa que <span className="text-volt">quiere simplificarse?</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          >
            <p className="mt-6 max-w-md leading-relaxed text-muted">
              Cuéntame tu proceso, tu cuello de botella o esa idea que no sabes por dónde empezar. Te
              digo con franqueza si la IA tiene sentido aquí, y cuánto costaría.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          >
            <div className="mt-10 space-y-4">
              <a
                href={`mailto:${site.email}`}
                className="block border-b border-line/60 pb-3 text-lg text-ink transition-colors hover:text-volt"
              >
                {site.email}
              </a>
              <WhatsAppLink />
              <SocialLinks />
            </div>
          </motion.div>
        </div>

        <div className="md:col-span-7">
          {/* El formulario usa initial={false}: siempre visible en su estado natural,
              la animación solo es un refuerzo, nunca lo oculta. */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
          >
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4 rounded-3xl border border-line bg-surface p-6 md:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                    Nombre *
                  </span>
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Tu nombre"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                    Email *
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="tu@empresa.com"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                  Empresa <span className="text-muted/50">(opcional)</span>
                </span>
                <input name="company" maxLength={200} placeholder="Acme S.L." className={inputClass} />
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                  Mensaje *
                </span>
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  placeholder="¿Qué proceso quieres automatizar?"
                  className={cn(inputClass, "resize-none")}
                />
              </label>

              {/* honeypot anti-spam */}
              <input
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                aria-hidden="true"
              />

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-3 rounded-full px-7 py-4 text-sm font-semibold transition-colors duration-300",
                    status === "sending"
                      ? "cursor-wait bg-muted/20 text-muted"
                      : "bg-volt text-bg hover:bg-[#d2ff55]",
                  )}
                >
                  {status === "sending" ? "Enviando…" : "Enviar mensaje"}
                  <span aria-hidden="true">→</span>
                </button>

                {status === "success" && (
                  <p
                    className="rounded-xl border border-volt/40 bg-volt/10 px-4 py-3 text-sm text-volt"
                    role="status"
                  >
                    Recibido. Te respondo en menos de 48h.
                  </p>
                )}
                {status === "not-configured" && (
                  <p
                    className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-300"
                    role="status"
                  >
                    El formulario aún no está conectado. Escríbeme directamente a {site.email}.
                  </p>
                )}
                {status === "error" && (
                  <p
                    className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
