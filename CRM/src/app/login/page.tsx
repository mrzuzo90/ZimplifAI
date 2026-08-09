import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { ZMark } from "@/components/shared/ZLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const metadata: Metadata = { title: "Acceso" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-grid px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_-10%,rgba(206,255,0,0.08),transparent)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <ZMark className="h-10 w-10" />
          <div>
            <p className="text-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground">
              Zimplif<span className="text-[var(--tenant-primary)]">AI</span> CRM
            </p>
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Multi-tenant · White-label · AI Orchestrator
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
