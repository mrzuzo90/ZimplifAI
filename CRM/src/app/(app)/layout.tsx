"use client";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";

/** Layout compartido de la app (workspace cliente + SuperAdmin). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
