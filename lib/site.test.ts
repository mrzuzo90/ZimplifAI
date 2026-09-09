import { afterEach, describe, expect, it, vi } from "vitest";

describe("public site URL", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalUrl;
    vi.resetModules();
  });

  it("uses the canonical ZimplifAI domain when no deployment override is present", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    const { siteUrl } = await import("./site");

    expect(siteUrl).toBe("https://zimplifai.es");
  });
});
