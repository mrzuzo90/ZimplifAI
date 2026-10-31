import type { Metadata } from "next";
import CVClient from "@/components/cv/CVClient";

export const metadata: Metadata = {
  title: "Acceso a documento privado · ZimplifAI",
  description: "Consulta de documento privado protegido mediante cifrado local.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
  alternates: {
    canonical: "/cv",
  },
};

export default function CVPage() {
  return <CVClient />;
}
