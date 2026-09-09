import { describe, it, expect } from "vitest";
import { isAiAuthor, getAuthorInfo } from "./blog";

describe("Blog Authors System", () => {
  describe("isAiAuthor", () => {
    it("identifies 'Nexo' as an AI author", () => {
      expect(isAiAuthor("Nexo")).toBe(true);
      expect(isAiAuthor("nexo")).toBe(true);
      expect(isAiAuthor(" NEXO ")).toBe(true);
    });

    it("identifies 'Zuzo' as a human author", () => {
      expect(isAiAuthor("Zuzo")).toBe(false);
      expect(isAiAuthor("zuzo")).toBe(false);
      expect(isAiAuthor(" ZUZO ")).toBe(false);
    });

    it("identifies 'Equipo ZimplifAI' as not an individual AI author", () => {
      expect(isAiAuthor("Equipo ZimplifAI")).toBe(false);
      expect(isAiAuthor("equipo zimplifai")).toBe(false);
    });

    it("defaults other delegated agent names to AI authors", () => {
      expect(isAiAuthor("Agente-Ops")).toBe(true);
    });
  });

  describe("getAuthorInfo", () => {
    it("resolves correct metadata for human founder Zuzo", () => {
      const author = getAuthorInfo("Zuzo");
      expect(author.name).toBe("Zuzo");
      expect(author.isAi).toBe(false);
      expect(author.schemaType).toBe("Person");
      expect(author.avatarText).toBe("Z");
      expect(author.bio).toContain("Ayudo a empresas a transformar procesos lentos");
    });

    it("resolves correct metadata for autonomous AI agent Nexo", () => {
      const author = getAuthorInfo("Nexo");
      expect(author.name).toBe("Nexo");
      expect(author.isAi).toBe(true);
      expect(author.schemaType).toBe("Organization");
      expect(author.avatarText).toBe("N");
      expect(author.role).toBe("Agente de IA Autónomo · ZimplifAI");
      expect(author.bio).toContain("Nexo es el agente de IA autónomo que investiga, escribe y publica el contenido de este blog");
      expect(author.bio).toContain("demostración en vivo");
    });

    it("resolves correct metadata for Equipo ZimplifAI", () => {
      const author = getAuthorInfo("Equipo ZimplifAI");
      expect(author.name).toBe("Equipo ZimplifAI");
      expect(author.isAi).toBe(false);
      expect(author.schemaType).toBe("Organization");
    });

    it("resolves fallback AI agent metadata for arbitrary agent names", () => {
      const author = getAuthorInfo("Sintetizador");
      expect(author.name).toBe("Sintetizador");
      expect(author.isAi).toBe(true);
      expect(author.schemaType).toBe("Organization");
      expect(author.avatarText).toBe("S");
      expect(author.bio).toContain("Sintetizador es el agente de IA autónomo");
    });
  });
});
