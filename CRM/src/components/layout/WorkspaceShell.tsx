"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { ImpersonationBanner } from "@/components/shared/ImpersonationBanner";

/** Shell del workspace: sidebar fija + cabecera + contenido. Responsive. */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <ImpersonationBanner />

      <div className="flex">
        {/* Sidebar escritorio */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-pitch lg:block">
          <Sidebar />
        </aside>

        {/* Sidebar móvil */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-pitch/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-pitch shadow-xl animate-in slide-in-from-left">
              <Button
                variant="ghost"
                size="iconSm"
                className="absolute right-2 top-3 z-10"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
              </Button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
          <WorkspaceHeader onMenuClick={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
