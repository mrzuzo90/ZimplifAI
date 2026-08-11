"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload, RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/data-access";
import { subscribeDb } from "@/lib/mock-store";

/**
 * Hook genérico de colección con realtime:
 *  - Modo demo: se suscribe al store mock (subscribeDb), igual que useCollection.
 *  - Producción: abre un canal Supabase con `postgres_changes` sobre la tabla,
 *    filtrado por tenant (organization_id=eq.<orgId>) y aplica INSERT/UPDATE/DELETE
 *    sobre el estado local sin recargar.
 * Expone la misma API que useCollection: { data, loading, error, refresh }.
 */
export function useRealtimeCollection<T extends { id: string }>(
  fetcher: (orgId: string) => Promise<T[]>,
  orgId: string | null,
  opts?: { table?: string; filter?: string; sortKey?: (a: T, b: T) => number }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Ref con el sortKey vigente: el handler del canal lo lee sin re-suscribirse.
  const sortKeyRef = useRef<((a: T, b: T) => number) | undefined>(undefined);
  useEffect(() => {
    sortKeyRef.current = opts?.sortKey;
  });

  // Ref con el fetcher vigente: la carga lee la última referencia sin
  // re-ejecutar el effect cada vez que el caller pasa un fetcher inline
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refresh = useCallback(async () => {
    if (!orgId) {
      setData([]);
      return;
    }
    try {
      const rows = await fetcherRef.current(orgId);
      setData(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Error al cargar datos"));
    }
  }, [orgId]);

  // Carga inicial
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = orgId ? await fetcherRef.current(orgId) : [];
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
  }, [orgId]);

  // Modo demo: el store mock emite cambios → refrescamos.
  useEffect(() => {
    if (!isDemoMode()) return;
    const unsub = subscribeDb(() => void refresh());
    return unsub;
  }, [refresh]);

  // Producción: realtime via postgres_changes.
  const table = opts?.table;
  const filter = opts?.filter;

  // Ref para el canal actual y flag de montaje
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(false);
  // Contador para generar nombres de canal únicos y evitar colisiones en React 18 Strict Mode
  const channelIdRef = useRef(0);

  useEffect(() => {
    if (isDemoMode() || !orgId || !table) return;
    const sb = getSupabaseBrowserClient();
    if (!sb) return;

    const channelKey = filter ? filter.replace(/[^A-Za-z0-9]/g, "-") : "all";
    // Nombre único por montaje: evita colisiones con canales previos no liberados por Supabase
    const channelId = ++channelIdRef.current;
    const channelName = `realtime:${table}:${orgId}:${channelKey}:${channelId}`;

    // Cleanup del canal anterior (si existe)
    if (channelRef.current) {
      sb.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    mountedRef.current = true;

    const channel = sb.channel(channelName);

    // Configurar TODOS los callbacks ANTES de subscribe
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: filter ?? undefined },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (!mountedRef.current) return;
        if (payload.eventType === "DELETE") {
          const oldId = String(payload.old?.id ?? "");
          if (oldId) setData((cur) => cur.filter((r) => r.id !== oldId));
          return;
        }
        setData((cur) => upsertRow(payload.new, cur, sortKeyRef.current));
      }
    );

    // Suscribir al final
    channel.subscribe();

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        sb.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [orgId, table, filter]);

  return { data, loading, error, refresh };
}

/** Inserta o reemplaza una fila por id y re-aplica el sort si existe. Función pura. */
function upsertRow<T extends { id: string }>(
  row: Record<string, unknown>,
  current: T[],
  sortKey?: (a: T, b: T) => number
): T[] {
  const next = row as unknown as T;
  const idx = current.findIndex((r) => r.id === next.id);
  const list = idx >= 0 ? current.map((r) => (r.id === next.id ? next : r)) : [next, ...current];
  return sortKey ? [...list].sort(sortKey) : list;
}