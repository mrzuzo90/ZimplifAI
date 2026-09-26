import { describe, expect, it } from "vitest";
import AuditoriaGeoHosteleriaPage, { metadata } from "./page";

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
});
