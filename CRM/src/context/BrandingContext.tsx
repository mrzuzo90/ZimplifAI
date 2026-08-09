"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ModuleKey, Organization, Profile, UserRole } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getDb,
  getImpersonatingOrgId,
  getOrg,
  listModules,
  setActiveOrgId as setMockActiveOrg,
  setDemoRole,
  setImpersonatingOrgId,
  subscribeDb,
  upsertOrg,
} from "@/lib/mock-store";
import { getContrastForeground, isValidHex } from "@/lib/branding";
import { enabledModuleKeys } from "@/lib/modules";
import { fetchModules, setModuleEnabled, setModuleSettings } from "@/lib/data-access";

const ACTIVE_ORG_KEY = "zimplifai-crm-active-org";

interface BrandingContextValue {
  /** Organización activa (tenant) del contexto actual. */
  organization: Organization | null;
  role: UserRole;
  profile: Profile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  /** SuperAdmin sin impersonar → contexto de agencia global. */
  isAgencyMode: boolean;
  demoMode: boolean;
  /** Módulos habilitados de la organización activa (feature flags). */
  enabledModules: ModuleKey[];
  /** Cambia la organización activa (org switcher / impersonación). */
  setActiveOrg: (orgId: string) => Promise<void>;
  /** Actualiza logo / color primario (white-label). */
  updateBranding: (patch: Pick<Organization, "primary_color" | "logo_url" | "name">) => Promise<void>;
  /** Comprueba si un módulo está habilitado para la org activa. */
  isModuleEnabled: (moduleKey: ModuleKey) => boolean;
  /** Conmuta un módulo de la org activa en tiempo real. */
  toggleModule: (moduleKey: ModuleKey, enabled: boolean) => Promise<void>;
  /** Guarda settings de configuración de un módulo de la org activa. */
  updateModuleSettings: (moduleKey: ModuleKey, settings: Record<string, unknown>) => Promise<void>;
  /** Recarga el contexto de sesión / organización. */
  refresh: () => Promise<void>;
  /** Salir del modo impersonación (solo demo / super_admin). */
  stopImpersonation: () => Promise<void>;
  /** Conmutar rol demo (cliente ⇄ super_admin) en modo demo. */
  switchDemoRole: (role: UserRole) => void;
  /** Color primario resuelto (fallback Volt). */
  primaryColor: string;
  /** URL del logo resuelta (fallback null → isotipo ZimplifAI). */
  logoUrl: string | null;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>("client_member");
  const [enabledModules, setEnabledModules] = useState<ModuleKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const initialized = useRef(false);

  const demoMode = typeof window !== "undefined" && !getSupabaseBrowserClient();

  const loadModules = useCallback(async (orgId: string | null) => {
    if (!orgId) {
      setEnabledModules([]);
      return;
    }
    try {
      const rows = await fetchModules(orgId);
      setEnabledModules(enabledModuleKeys(rows));
    } catch {
      setEnabledModules([]);
    }
  }, []);

  const load = useCallback(async () => {
    const sb = getSupabaseBrowserClient();

    if (!sb) {
      const db = getDb();
      setOrganization(getOrg(db.activeOrgId) ?? null);
      setRole(db.demoRole);
      setIsImpersonating(getImpersonatingOrgId() !== null);
      setEnabledModules(enabledModuleKeys(listModules(db.activeOrgId)));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setOrganization(null);
        setRole("client_member");
        setLoading(false);
        return;
      }
      const { data: prof } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof ?? null);
      setRole(prof?.role ?? "client_member");

      let orgId: string | null =
        prof?.organization_id ??
        (typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_ORG_KEY) : null);
      if (!orgId && prof?.role === "super_admin") {
        const { data: orgs } = await sb.from("organizations").select("id").limit(1);
        orgId = orgs?.[0]?.id ?? null;
      }
      if (orgId) {
        const { data: org } = await sb
          .from("organizations")
          .select("*")
          .eq("id", orgId)
          .single();
        setOrganization(org ?? null);
        await loadModules(orgId);
      } else {
        setOrganization(null);
        setEnabledModules([]);
      }
    } catch (err) {
      console.error("[BrandingContext] error al cargar tenant", err);
      setOrganization(null);
      setEnabledModules([]);
    } finally {
      setLoading(false);
    }
  }, [loadModules]);

  // Carga inicial (una sola vez).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load();
  }, [load]);

  // En modo demo, reacciona a cambios del store (impersonación, provisión, rol).
  useEffect(() => {
    if (!demoMode) return;
    return subscribeDb(() => {
      const db = getDb();
      setOrganization(getOrg(db.activeOrgId) ?? null);
      setRole(db.demoRole);
      setIsImpersonating(getImpersonatingOrgId() !== null);
      setEnabledModules(enabledModuleKeys(listModules(db.activeOrgId)));
    });
  }, [demoMode]);

  // Inyección de variables CSS del tenant (motor white-label).
  useEffect(() => {
    const root = document.documentElement;
    const color = organization?.primary_color;
    if (color && isValidHex(color)) {
      root.style.setProperty("--tenant-primary", color);
      root.style.setProperty("--tenant-primary-foreground", getContrastForeground(color));
    } else {
      root.style.setProperty("--tenant-primary", "#CEFF00");
      root.style.setProperty("--tenant-primary-foreground", "#0B0D0C");
    }
  }, [organization?.primary_color]);

  const setActiveOrg = useCallback(
    async (orgId: string) => {
      if (demoMode) {
        setMockActiveOrg(orgId);
        return;
      }
      if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_ORG_KEY, orgId);
      const sb = getSupabaseBrowserClient();
      if (!sb) return;
      const { data, error } = await sb.from("organizations").select("*").eq("id", orgId).single();
      if (error) throw error;
      setOrganization(data);
      await loadModules(orgId);
    },
    [demoMode, loadModules]
  );

  const updateBranding = useCallback(
    async (patch: Pick<Organization, "primary_color" | "logo_url" | "name">) => {
      if (!organization) return;
      const next: Organization = { ...organization, ...patch };
      setOrganization(next);
      const sb = getSupabaseBrowserClient();
      if (sb) {
        const { error } = await sb.from("organizations").update(patch).eq("id", organization.id);
        if (error) {
          setOrganization(organization);
          throw error;
        }
        return;
      }
      upsertOrg(next);
    },
    [organization]
  );

  const isModuleEnabled = useCallback(
    (moduleKey: ModuleKey) => enabledModules.includes(moduleKey),
    [enabledModules]
  );

  const toggleModule = useCallback(
    async (moduleKey: ModuleKey, enabled: boolean) => {
      if (!organization) return;
      const prev = enabledModules;
      setEnabledModules((cur) =>
        enabled ? Array.from(new Set([...cur, moduleKey])) : cur.filter((k) => k !== moduleKey)
      );
      try {
        await setModuleEnabled(organization.id, moduleKey, enabled);
      } catch (err) {
        setEnabledModules(prev);
        throw err;
      }
    },
    [organization, enabledModules]
  );

  const updateModuleSettings = useCallback(
    async (moduleKey: ModuleKey, settings: Record<string, unknown>) => {
      if (!organization) return;
      await setModuleSettings(organization.id, moduleKey, settings);
    },
    [organization]
  );

  const stopImpersonation = useCallback(async () => {
    if (demoMode) {
      setImpersonatingOrgId(null);
      return;
    }
    const res = await fetch("/api/admin/impersonate", { method: "DELETE" });
    if (!res.ok) throw new Error("No se pudo salir de la impersonación");
    await load();
  }, [demoMode, load]);

  const switchDemoRole = useCallback((nextRole: UserRole) => {
    setDemoRole(nextRole);
  }, []);

  const value = useMemo<BrandingContextValue>(
    () => ({
      organization,
      role,
      profile,
      loading,
      isSuperAdmin: role === "super_admin",
      isImpersonating,
      isAgencyMode: role === "super_admin" && !isImpersonating,
      demoMode,
      enabledModules,
      setActiveOrg,
      updateBranding,
      isModuleEnabled,
      toggleModule,
      updateModuleSettings,
      refresh: load,
      stopImpersonation,
      switchDemoRole,
      primaryColor: organization?.primary_color ?? "#CEFF00",
      logoUrl: organization?.logo_url ?? null,
    }),
    [organization, role, profile, loading, isImpersonating, demoMode, enabledModules, setActiveOrg, updateBranding, isModuleEnabled, toggleModule, updateModuleSettings, load, stopImpersonation, switchDemoRole]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding debe usarse dentro de <BrandingProvider>");
  return ctx;
}
