"use client";

import { useEffect, useState, type FormEvent } from "react";
import UF0894App from "@/components/uf0894/UF0894App";
import {
  clearAccessUnlocked,
  isAccessUnlocked,
  setAccessUnlocked,
  verifyAccessCode,
} from "@/lib/uf0894/auth";

/**
 * NOTA TÉCNICA:
 * La comprobación del código de acceso para el módulo formativo UF0894 se realiza
 * íntegramente de forma local en el navegador del cliente.
 *
 * El código de acceso ("ELEE0109") actúa como una barrera casual / filtro pedagógico
 * y NO proporciona seguridad criptográfica real: es visible al inspeccionar el bundle
 * JavaScript o los recursos descargados en el navegador.
 *
 * Por diseño, la contraseña se mantiene fuera del placeholder y del copy visible de la interfaz.
 */

export default function UF0894Gate() {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAccessUnlocked()) {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);

    // Comparación local en el navegador
    if (verifyAccessCode(code)) {
      setAccessUnlocked();
      setUnlocked(true);
      setLoading(false);
    } else {
      setError("Código incorrecto. Comprueba la clave del certificado.");
      setLoading(false);
    }
  };

  const handleLock = () => {
    clearAccessUnlocked();
    setUnlocked(false);
    setCode("");
    setError(null);
  };

  if (unlocked) {
    return <UF0894App onLock={handleLock} />;
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16">
      {/* Resplandor ambiental de marca */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-volt/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 w-80 h-80 rounded-full bg-plasma/10 blur-[100px]" />

      <div className="relative w-full max-w-lg rounded-3xl border border-line bg-surface/90 p-7 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-volt/15 text-volt font-mono font-bold text-sm border border-volt/30">
              BT
            </span>
            <div>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-volt">
                Área privada · Certificado profesional
              </span>
              <h2 className="font-display text-lg font-bold text-ink">UF0894 Redes Subterráneas</h2>
            </div>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface-2 text-muted">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="mt-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Acceso al entorno de estudio
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Introduce la clave de acceso del módulo formativo para consultar el banco de 63
            preguntas originales, resolver casos de cálculo interactivos y exportar cuestionarios.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="accessCode"
              className="block font-mono text-xs font-medium text-muted uppercase tracking-wider"
            >
              Código de verificación
            </label>
            <div className="mt-2 relative">
              <input
                id="accessCode"
                name="code"
                type="text"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Código de acceso"
                className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 font-mono text-base font-semibold tracking-wider text-ink uppercase placeholder:text-muted/50 focus:border-volt focus:outline-none focus:ring-1 focus:ring-volt transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
              <svg
                className="h-4 w-4 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
              </svg>
              <div>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-volt py-3.5 px-6 font-display text-sm font-bold text-bg transition-all hover:bg-[#d8ff1a] hover:shadow-[0_0_24px_rgba(206,255,0,0.35)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <span>Desbloquear experiencia</span>
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-line flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-plasma"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Validación local en navegador</span>
          </div>
          <span className="font-mono text-[11px] text-muted/70">ZimplifAI Labs</span>
        </div>
      </div>
    </div>
  );
}
