"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload, RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/data-access";
import { subscribeDb } from "@/lib/mock-store";
import { useBranding } from "@/hooks/useBranding";

/**
 * Contador GLOBAL de canales realtime (módulo). Un ref por instancia se reinicia
 * en cada montaje y colisiona con el canal previo aún en `unsubscribe()`: realtime-js
 * `channel(topic)` devuelve el canal EXISTENTE si el topic coincide, y llamar
 * `.on("postgres_changes")` sobre un canal ya suscrito lanza el error
 * "cannot add postgres_changes callbacks ... after subscribe()".
 * El contador global garantiza topics únicos entre instancias del hook.
 */
let channelSeq = 0;

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

  // Validar orgId contra el contexto de branding para evitar acceso cruzado de tenants
  const { organization } = useBranding();
  const validatedOrgId = orgId && organization?.id === orgId ? orgId : null;

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
    if (!validatedOrgId) {
      setData([]);
      return;
    }
    try {
      const rows = await fetcherRef.current(validatedOrgId);
      setData(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Error al cargar datos"));
    }
  }, [validatedOrgId]);

  // Carga inicial
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = validatedOrgId ? await fetcherRef.current(validatedOrgId) : [];
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
  }, [validatedOrgId]);

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
  // Mutex para serializar cleanup → create (evita race condition en React 18 Strict Mode)
  const cleanupLockRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    let sb: ReturnType<typeof getSupabaseBrowserClient> = null;

    (async () => {
      try {
        // Esperar a que termine cualquier cleanup previo ANTES de crear el nuevo canal
        // Esto serializa: cleanup anterior → create nuevo → subscribe
        const currentLock = cleanupLockRef.current;
        cleanupLockRef.current = currentLock.then(async () => {
          // Cleanup SÍNCRONO del canal anterior ANTES de crear el nuevo
          if (channelRef.current) {
            const oldChannel = channelRef.current;
            channelRef.current = null;
            // unsubscribe() retorna Promise; await garantiza que termine antes de continuar
            await oldChannel.unsubscribe();
            sb?.removeChannel(oldChannel);
          }
        });

        // Esperar al lock antes de proceder
        await currentLock;

        if (cancelled) return;

        if (isDemoMode() || !validatedOrgId || !table) return;
        sb = getSupabaseBrowserClient();
        if (!sb) return;

        const channelKey = filter ? filter.replace(/[^A-Za-z0-9]/g, "-") : "all";
        // Nombre único global (módulo): evita que realtime-js reutilice un topic en
        // unsubscribe de otra instancia → "postgres_changes after subscribe()".
        const channelId = ++channelSeq;
        const channelName = `realtime:${table}:${validatedOrgId}:${channelKey}:${channelId}`;

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

        // Suscribir al final (después de TODOS los .on())
        channel.subscribe();

        channelRef.current = channel;
      } catch (e) {
        if (!cancelled) console.error("Realtime setup error:", e);
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (channelRef.current) {
        const ch = channelRef.current;
        channelRef.current = null;
        ch.unsubscribe().then(() => sb?.removeChannel(ch));
      }
    };
  }, [validatedOrgId, table, filter]);

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