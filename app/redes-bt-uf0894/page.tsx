import type { Metadata } from "next";
import UF0894Gate from "@/components/uf0894/UF0894Gate";

/**
 * NOTA TÉCNICA:
 * Esta ruta (/redes-bt-uf0894) corresponde a un recurso educativo privado sin enlaces
 * públicos desde la navegación principal ni desde el índice del sitio.
 *
 * Dispone de directivas robots estrictas (noindex, nofollow) y validación de acceso
 * local en el navegador del cliente (filtro pedagógico mediante código ELEE0109),
 * sin requerir cookies de servidor ni variables de entorno secretas en producción.
 */

export const metadata: Metadata = {
  title: "Redes Subterráneas BT · UF0894 | ZimplifAI",
  description:
    "Área privada de estudio y cálculo técnico para el módulo UF0894 (Certificado ELEE0109).",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RedesBtUf0894Page() {
  return <UF0894Gate />;
}
