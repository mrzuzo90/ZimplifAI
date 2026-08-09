"use client";

import { useCallback, useEffect, useState } from "react";
import { isDemoMode } from "@/lib/data-access";
import { subscribeDb } from "@/lib/mock-store";

/**
 * Hook genérico de colección: carga vía data-access, expone loading/error
 * y se suscribe al store mock para simular realtime en modo demo.
 */
export function useCollection<T>(fetcher: (orgId: string) => Promise<T[]>, orgId?: string | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) {
      setData([]);
      return;
    }
    try {
      const rows = await fetcher(orgId);
      setData(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Error al cargar datos"));
    }
  }, [orgId, fetcher]);

  // Carga inicial: el setState se produce tras el await (continuación async),
  // nunca de forma síncrona dentro del effect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = orgId ? await fetcher(orgId) : [];
        if (!cancelled) {
          setData(rows);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error("Error al cargar datos"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, fetcher]);

  useEffect(() => {
    if (!isDemoMode()) return;
    const unsub = subscribeDb(() => void refresh());
    return unsub;
  }, [refresh]);

  return { data, loading, error, refresh };
}
