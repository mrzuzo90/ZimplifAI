"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";
import { SubaccountSwitcher } from "./SubaccountSwitcher";
import { UserMenu } from "./UserMenu";

/** Cabecera del workspace cliente: logo dynamic, estado AI, Cmd+K, switcher. */
export function WorkspaceHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="iconSm"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <GlobalSearch />
        </div>

        <div className="hidden md:block">
          <StatusBadge />
        </div>

        <ThemeToggle />
        <SubaccountSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
