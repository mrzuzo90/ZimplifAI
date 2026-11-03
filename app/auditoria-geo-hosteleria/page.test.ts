import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AuditoriaGeoHosteleriaPage, { metadata } from "./page";

(globalThis as unknown as { React: typeof React }).React = React;

describe("Auditoría GEO Hostelería Page", () => {
  it("exports correct metadata and canonical alternate", () => {
    expect(metadata.title).toContain("Auditoría GEO para Restaurantes y Hoteles");
    expect(metadata.description).toContain("ChatGPT, Perplexity y Gemini");
    expect(metadata.alternates?.canonical).toBe(
      "https://zimplifai.es/auditoria-geo-hosteleria",
    );
  });

  it("exports a valid default page component", () => {
    expect(typeof AuditoriaGeoHosteleriaPage).toBe("function");
    expect(AuditoriaGeoHosteleriaPage.name).toBe("AuditoriaGeoHosteleriaPage");
  });

  it("renders the honest monthly GEO tracking commercial block and prefilled contact CTA", () => {
    const html = renderToStaticMarkup(AuditoriaGeoHosteleriaPage());

    expect(html).toContain("Seguimiento GEO mensual");
    expect(html).toContain("49 €/mes");
    expect(html).toContain("+ IVA");
    expect(html).toContain("facturación mensual, cancelable");
    expect(html).toContain(
      "8 consultas de intención de reserva en ChatGPT, Perplexity y Gemini",
    );
    expect(html).toContain(
      "registro de aparición, fuentes citadas/competidores y 3 acciones priorizadas",
    );
    expect(html).toContain(
      "no incluye implementar cambios ni garantiza rankings/reservas",
    );
    expect(html).toContain("diagnóstico externo sin acceso a sistemas");

    expect(html).toContain(
      "mailto:contacto@zuzo.es?subject=Seguimiento%20GEO%20mensual%20(49%20%E2%82%AC%2Fmes%20%2B%20IVA)&amp;body=Hola%20Zuzo",
    );
    expect(html).toContain('href="/#contacto"');
    expect(html).not.toContain("Escrito por IA");
  });
});
