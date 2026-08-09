"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "./ThemeProvider";

/** Alterna tema claro/oscuro con tooltip. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setTheme(next)}
            aria-label={`Cambiar a tema ${next === "light" ? "claro" : "oscuro"}`}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Cambiar tema</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
