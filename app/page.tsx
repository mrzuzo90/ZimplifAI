import Hero from "@/components/Hero";
import Manifesto from "@/components/Manifesto";
import Services from "@/components/Services";
import Process from "@/components/Process";
import Showroom from "@/components/Showroom";
import KineticType from "@/components/KineticType";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";
import { siteUrl } from "@/lib/site";
import { site } from "@/data/site";

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
      "@type": "ProfessionalService",
      "@id": `${siteUrl}/#organization`,
      name: site.name,
      url: siteUrl,
      email: site.email,
      description: site.description,
      founder: { "@id": `${siteUrl}/#person` },
    },
    ...[
      "Implantación de IA en empresas",
      "Automatización y agentes a medida",
      "Desarrollo de aplicaciones web full-stack",
      "Consultoría técnica y transformación con IA",
    ].map((name) => ({ "@type": "Service", name, provider: { "@id": `${siteUrl}/#organization` } })),
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Manifesto />
      <Services />
      <Process />
      <Showroom />
      <KineticType />
      <Skills />
      <Contact />
    </>
  );
}
