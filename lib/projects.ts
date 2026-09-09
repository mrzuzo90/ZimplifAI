import { projects, type Project } from "@/data/projects";

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.id === slug);
}

export function getProjectPath(project: Pick<Project, "id">): string {
  return `/proyectos/${project.id}`;
}

export function getProjectSeoDescription(project: Project): string {
  const content = `${project.name}: ${project.tagline} ${project.description}`;
  if (content.length <= 155) return content;

  const truncated = content.slice(0, 155);
  return `${truncated.slice(0, truncated.lastIndexOf(" "))}…`;
}
