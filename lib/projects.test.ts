import { describe, expect, it } from "vitest";
import { projects } from "@/data/projects";
import { getProjectBySlug, getProjectPath, getProjectSeoDescription } from "@/lib/projects";

describe("project SEO helpers", () => {
  it("returns a project for its public slug", () => {
    expect(getProjectBySlug("elektrizia")?.name).toBe("ElektriZIA");
  });

  it("does not expose unknown projects", () => {
    expect(getProjectBySlug("not-a-project")).toBeUndefined();
  });

  it("creates canonical case-study paths", () => {
    expect(getProjectPath(projects[0])).toBe("/proyectos/elektrizia");
  });

  it("creates a concise description from real project data", () => {
    expect(getProjectSeoDescription(projects[0])).toContain("ElektriZIA");
  });
});
