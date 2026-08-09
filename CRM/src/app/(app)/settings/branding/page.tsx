"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { BrandingSettingsPage } from "@/components/settings/BrandingSettingsPage";

/** Alias de la URL del spec: /settings/branding */
export default function SettingsBrandingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        index="04"
        label="Marca"
        title="Ajustes de marca del CRM"
        description="White-label engine: logo, color primario y preview en vivo."
      />
      <BrandingSettingsPage />
    </div>
  );
}
