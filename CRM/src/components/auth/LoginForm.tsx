"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/data-access";

export function LoginForm() {
  const router = useRouter();
  const demo = isDemoMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    setLoading(true);
    const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/workspace");
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={demo}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={demo}
          />
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading || demo}>
          {loading ? <Loader2 className="animate-spin" /> : "Acceder"}
          {!loading && <ArrowRight />}
        </Button>
      </form>

      <div className="mt-4 border-t border-border pt-4">
        {demo ? (
          <>
            <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5 text-[var(--tenant-primary)]" />
              Supabase no está configurado: entra al modo demo con datos locales.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                router.push("/workspace");
                router.refresh();
              }}
            >
              Explorar el CRM en modo demo
            </Button>
          </>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Demo: <code className="text-mono text-[11px]">demo@zimplifai.app</code> /{" "}
            <code className="text-mono text-[11px]">demo123456</code>
          </p>
        )}
      </div>
    </div>
  );
}
