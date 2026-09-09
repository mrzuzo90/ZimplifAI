"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSmoothScroll } from "@/components/providers";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";
import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { label: "Manifiesto", target: "#manifiesto" },
  { label: "Servicios", target: "#servicios" },
  { label: "Proyectos", target: "#proyectos" },
  { label: "Habilidades", target: "#habilidades" },
  { label: "Blog", target: "/blog" },
  { label: "Contacto", target: "#contacto" },
];

export default function Nav() {
  const { scrollTo } = useSmoothScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (target: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    const isHome = pathname === "/";

    window.setTimeout(() => {
      if (target.startsWith("/")) {
        router.push(target);
      } else if (target === "#top") {
        if (isHome) scrollTo(0, { duration: 1.2 });
        else router.push("/");
      } else {
        if (isHome) scrollTo(target);
        else router.push("/" + target);
      }
    }, open ? 360 : 0);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        className={cn(
          "fixed inset-x-0 top-0 z-[100] transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled
            ? "border-b border-line bg-bg/70 backdrop-blur-md"
            : "border-b border-transparent",
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link
            href="/"
            onClick={go("#top")}
            className="flex items-center gap-2"
            aria-label="ZimplifAI - Inicio"
          >
            <Image
              src="/isotipo.png"
              alt=""
              width={40}
              height={40}
              className="size-10 md:size-12"
              priority={false}
            />
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <li key={l.target}>
                <a
                  href={l.target.startsWith("/") ? l.target : (pathname === "/" ? l.target : `/${l.target}`)}
                  onClick={go(l.target)}
                  className={cn(
                    "group relative font-mono text-xs uppercase tracking-[0.18em] transition-colors hover:text-ink",
                    (pathname.startsWith("/blog") && l.target === "/blog")
                      ? "text-volt font-semibold"
                      : "text-muted",
                  )}
                >
                  {l.label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-px w-full origin-left bg-volt transition-transform duration-300",
                      pathname.startsWith("/blog") && l.target === "/blog"
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100",
                    )}
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">

            <a
              href="https://crm.zimplifai.es"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-line px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-volt/60 hover:text-volt md:inline-flex"
            >
              Acceso CRM ↗
            </a>
            <button
              onClick={go("#contacto")}
              className="hidden rounded-full border border-volt/50 px-5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-volt transition-colors hover:bg-volt hover:text-bg md:inline-flex"
            >
              Solicitar diagnóstico
            </button>

            {/* Burger */}
            <button
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((v) => !v)}
              className="relative z-[120] flex h-10 w-10 flex-col items-center justify-center gap-[6px] md:hidden"
            >
              <span
                className={cn(
                  "h-px w-6 bg-ink transition-transform duration-300",
                  open && "translate-y-[3.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-px w-6 bg-ink transition-transform duration-300",
                  open && "-translate-y-[3.5px] -rotate-45",
                )}
              />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Menú móvil */}
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            className="fixed inset-0 z-[110] flex flex-col justify-end bg-bg md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <ul className="flex flex-col gap-1 px-6 pb-14">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.target}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.06 * i }}
                >
                  <a
                    href={l.target.startsWith("/") ? l.target : (pathname === "/" ? l.target : `/${l.target}`)}
                    onClick={go(l.target)}
                    className={cn(
                      "block py-2 text-4xl font-bold tracking-tight",
                      (pathname.startsWith("/blog") && l.target === "/blog")
                        ? "text-volt"
                        : "text-ink",
                    )}
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
              <motion.li
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.06 * LINKS.length }}
                className="mt-4 pt-4 border-t border-line/40"
              >
                <a
                  href="https://crm.zimplifai.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 text-2xl font-bold tracking-tight text-volt"
                >
                  Acceso CRM ↗
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
