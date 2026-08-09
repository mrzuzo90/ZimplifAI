"use client";

import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, ShieldCheck, UserRound, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/useBranding";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resetMockDb } from "@/lib/mock-store";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "SuperAdmin",
  client_admin: "Admin de organización",
  client_member: "Miembro",
};

export function UserMenu() {
  const router = useRouter();
  const { profile, role, demoMode, switchDemoRole } = useBranding();

  const handleLogout = async () => {
    const sb = getSupabaseBrowserClient();
    if (sb) {
      await sb.auth.signOut();
      router.push("/login");
      router.refresh();
      return;
    }
    switchDemoRole("client_member");
    toast.info("Sesión demo cerrada");
  };

  const handleReset = () => {
    resetMockDb();
    router.refresh();
    toast.success("Datos demo restablecidos");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="iconSm" className="rounded-full" aria-label="Cuenta">
          <Avatar className="h-8 w-8">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
            <AvatarFallback className="bg-accent text-[var(--tenant-primary)]">
              {(profile?.full_name ?? "U").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{profile?.full_name ?? "Usuario"}</span>
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {demoMode ? (
          <>
            <DropdownMenuItem onSelect={() => switchDemoRole("client_admin")} className="gap-2">
              <Users className="text-muted-foreground" />
              <span>Vista Cliente</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => switchDemoRole("super_admin")} className="gap-2">
              <ShieldCheck className="text-[var(--tenant-primary)]" />
              <span>Vista SuperAdmin</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleReset} className="gap-2">
              <RefreshCw className="text-muted-foreground" />
              <span>Restablecer datos demo</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={handleLogout} className="gap-2">
            <LogOut className="text-muted-foreground" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="gap-2">
          <UserRound className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">ZimplifAI CRM · v1.0</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
