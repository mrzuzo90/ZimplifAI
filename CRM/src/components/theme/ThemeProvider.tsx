"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "zimplifai:theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const raw = localStorage.getItem(THEME_KEY);
  if (raw === "light" || raw === "dark") return raw;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme === "light" ? "light" : "";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f6f7f4" : "#0B0D0C");
}

/**
 * Tema claro/oscuro. Default = oscuro (sin atributo en <html>).
 * Persiste en localStorage y respeta prefers-color-scheme como fallback;
 * el script anti-FOUC del layout aplica el atributo antes de hidratar.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "dark");

  // Aplica el tema al <html> y al meta theme-color. No es estado de React,
  // solo DOM → permitido en effect.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_KEY, next);
    // El evento storage no se dispara en la misma pestaña → lo emitimos
    // manualmente para que el snapshot se actualice al instante.
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY, newValue: next }));
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
