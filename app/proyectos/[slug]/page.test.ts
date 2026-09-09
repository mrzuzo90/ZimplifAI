import { describe, expect, it } from "vitest";
import { generateMetadata } from "./page";

describe("case-study metadata", () => {
  it("publishes a unique canonical title and URL for a project", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "elektrizia" }),
    });

    expect(metadata.title).toBe("ElektriZIA · Proyecto de ZimplifAI");
    expect(metadata.alternates?.canonical).toBe("/proyectos/elektrizia");
  });
});
