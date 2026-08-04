import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { SmoothScrollProvider } from "@/components/providers";
import Preloader from "@/components/Preloader";
import CustomCursor from "@/components/CustomCursor";
import GrainOverlay from "@/components/GrainOverlay";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AnalyticsConsent from "@/components/Analytics";
import { siteUrl } from "@/lib/site";
import { site } from "@/data/site";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZimplifAI — Simplifico procesos. Implanto IA.",
    template: "%s · ZimplifAI",
  },
  description: site.description,
  keywords: [
    "ZimplifAI",
    "implantación de IA",
    "automatización de procesos",
    "agentes de IA",
    "desarrollo web",
    "Next.js",
    "full-stack",
    "consultoría IA",
  ],
  authors: [{ name: site.author.name }],
  creator: site.author.name,
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: site.name,
    title: "ZimplifAI — Simplifico procesos. Implanto IA.",
    description: site.description,
    images: [
      { url: `${siteUrl}/og.svg`, width: 1200, height: 630, alt: site.name },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZimplifAI — Simplifico procesos. Implanto IA.",
    description: site.description,
    images: [`${siteUrl}/og.svg`],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: site.author.name,
      description:
        "Especialista en automatización: full-stack, IA y automatismos industriales (ELEE0109). Creador de ZimplifAI.",
      knowsAbout: [
        "Inteligencia artificial",
        "Automatización de procesos",
        "Desarrollo full-stack",
        "Automatismos industriales",
      ],
      worksFor: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: site.name,
      url: siteUrl,
      email: site.email,
      description: site.description,
      founder: { "@id": `${siteUrl}/#person` },
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${mono.variable} ${serif.variable}`}>
      <body>
        <a
          href="#proyectos"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-volt focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-bg"
        >
          Saltar al contenido
        </a>

        <SmoothScrollProvider>
          <Preloader />
          <CustomCursor />
          <GrainOverlay />
          <Nav />
          <main>{children}</main>
          <Footer />
        </SmoothScrollProvider>

        <AnalyticsConsent />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
