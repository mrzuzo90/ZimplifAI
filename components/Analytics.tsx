"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

const STORAGE_KEY = "zimplifai-analytics-consent";
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";

type Consent = "idle" | "yes" | "no";

/** Analytics de Vercel con consentimiento opt-in y sin terceros pesados. */
export default function AnalyticsConsent() {
  const [consent, setConsent] = useState<Consent>("idle");

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "yes" || stored === "no") {
      setConsent(stored);
    }
  }, []);

  if (!ANALYTICS_ENABLED) return null;

  const decide = (value: Consent) => {
    localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  };

  return (
    <>
      {consent === "yes" && <Analytics />}
      {consent === "idle" && (
        <div className="fixed bottom-4 left-4 z-[90] flex max-w-xs flex-col gap-3 rounded-2xl border border-line bg-surface/90 p-4 text-xs text-muted backdrop-blur-md">
          <p>
            ZimplifAI usa estadísticas anónimas para mejorar. ¿Las permites? (Sin rastreadores de
            terceros.)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => decide("yes")}
              className="rounded-full bg-volt px-3 py-1.5 font-semibold text-bg transition-colors hover:bg-[#d2ff55]"
            >
              Sí, claro
            </button>
            <button
              onClick={() => decide("no")}
              className="rounded-full border border-line-strong px-3 py-1.5 text-ink transition-colors hover:border-volt/50"
            >
              No
            </button>
          </div>
        </div>
      )}
    </>
  );
}
