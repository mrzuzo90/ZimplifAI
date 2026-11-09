import { describe, expect, it } from "vitest";
import RedesBtUf0894Page, { metadata } from "./page";

describe("Protected /redes-bt-uf0894 Page", () => {
  it("exports strict noindex and nofollow metadata to prevent indexing", () => {
    expect(metadata.title).toContain("UF0894");
    expect(metadata.robots).toBeDefined();

    if (typeof metadata.robots === "object" && metadata.robots !== null) {
      expect(metadata.robots.index).toBe(false);
      expect(metadata.robots.follow).toBe(false);

      const googleBot = metadata.robots.googleBot;
      if (typeof googleBot === "object" && googleBot !== null) {
        expect(googleBot.index).toBe(false);
        expect(googleBot.follow).toBe(false);
      }
    }
  });

  it("exports a valid default page component function", () => {
    expect(typeof RedesBtUf0894Page).toBe("function");
    expect(RedesBtUf0894Page.name).toBe("RedesBtUf0894Page");
  });
});
