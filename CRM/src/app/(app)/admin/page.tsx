"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiGrid } from "@/components/admin/KpiGrid";
import { TenantsTable } from "@/components/admin/TenantsTable";
import { FeatureManagementDrawer } from "@/components/admin/FeatureManagementDrawer";
import { Button } from "@/components/ui/button";
import { fetchAdminOverview } from "@/lib/data-access";
import type { AdminOverview, OrganizationWithStats } from "@/types/database";
import { AdminGuard } from "@/components/admin/AdminGuard";

/** Panel SuperAdmin: KPIs globales + tabla de tenants + provisión 1-Click. */
export default function AdminPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [manageOrg, setManageOrg] = useState<OrganizationWithStats | null>(null);

  const load = useCallback(async () => {
    try {
      setOverview(await fetchAdminOverview());
    } catch {
      // El error se muestra en el estado vacío de la tabla
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = await fetchAdminOverview();
        if (!cancelled) setOverview(overview);
      } catch {
        // El error se muestra en el estado vacío de la tabla
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminGuard>
      <div className="space-y-6">
        <PageHeader
        index="ADM"
        label="SuperAdmin"
        title="Panel de control"
        description="Operación global del sistema: subcuentas, agentes IA, MRR e ingesta de leads en tiempo real."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                void load();
              }}
              disabled={loading}
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Refrescar
            </Button>
            <Button size="sm" onClick={() => router.push("/admin/provision")}>
              <Plus />
              Provisionar
            </Button>
          </>
        }
      />

      <KpiGrid overview={overview} loading={loading} />

      <div className="flex items-center justify-between">
        <h2 className="text-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Subcuentas · {overview?.tenants.length ?? "—"}
        </h2>
      </div>

      <TenantsTable tenants={overview?.tenants ?? []} loading={loading} onManageFeatures={setManageOrg} />

      {manageOrg && (
        <FeatureManagementDrawer
          org={manageOrg}
          open={manageOrg !== null}
          onOpenChange={(open) => {
            if (!open) setManageOrg(null);
          }}
          onChanged={() => {
            setLoading(true);
            void load();
          }}
        />
      )}
    </div>
    </AdminGuard>
  );
}
