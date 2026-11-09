import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("Robots and Sitemap privacy enforcement", () => {
  it("disallows /redes-bt-uf0894 in robots.txt rules", () => {
    const robotsConfig = robots();
    const rules = Array.isArray(robotsConfig.rules)
      ? robotsConfig.rules
      : [robotsConfig.rules];

    const generalRule = rules.find((r) => r.userAgent === "*" || !r.userAgent);
    expect(generalRule).toBeDefined();

    const disallow = Array.isArray(generalRule?.disallow)
      ? generalRule?.disallow
      : [generalRule?.disallow];

    expect(disallow).toContain("/redes-bt-uf0894");
    expect(disallow).toContain("/redes-bt-uf0894/");
  });

  it("ensures sitemap never lists the private /redes-bt-uf0894 slug", async () => {
    const sitemapEntries = await sitemap();
    const urls = sitemapEntries.map((e) => e.url);

    const hasPrivateSlug = urls.some((url) => url.includes("redes-bt-uf0894"));
    expect(hasPrivateSlug).toBe(false);
  });
});
