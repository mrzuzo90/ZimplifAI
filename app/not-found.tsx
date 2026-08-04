import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.22em] text-volt">404 · error</p>
      <h1 className="text-5xl font-bold tracking-tight md:text-7xl">Corriente no encontrada</h1>
      <p className="max-w-md text-muted">
        La página que buscas no existe o se ha movido. Vuelve al inicio.
      </p>
      <Link
        href="/"
        className="rounded-full bg-volt px-7 py-3.5 text-sm font-semibold text-bg transition-colors hover:bg-[#d2ff55]"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
