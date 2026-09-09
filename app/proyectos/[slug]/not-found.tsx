import Link from "next/link";

export default function ProjectNotFound() {
  return <div className="mx-auto max-w-3xl px-5 py-40 md:px-8"><p className="font-mono text-xs uppercase tracking-[0.2em] text-volt">404</p><h1 className="mt-4 text-5xl font-bold tracking-tight">Este proyecto no existe.</h1><Link href="/#proyectos" className="mt-8 inline-block text-volt hover:underline">Volver al showroom</Link></div>;
}
