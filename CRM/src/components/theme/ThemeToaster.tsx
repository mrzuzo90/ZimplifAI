"use client";

import { Toaster } from "sonner";
import { useTheme } from "./ThemeProvider";

/** Toaster que sigue el tema activo (claro/oscuro). */
export function ThemeToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-right" richColors closeButton />;
}
