import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import Image from "next/image";

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
          <Image
            src="/imagotipo.png"
            alt="ZimplifAI"
            width={140}
            height={56}
            className="h-14 w-auto"
            priority
          />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
