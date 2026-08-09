"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { BrandingSettingsPage } from "@/components/settings/BrandingSettingsPage";
import { ProtectedModule } from "@/components/guards/ProtectedModule";

export default function WorkspaceBrandingPage() {
  return (
    <ProtectedModule moduleKey="light_web_menu">
      <div className="space-y-6">
        <PageHeader
          index="05"
          label="Marca"
          title="Personalización white-label"
          description="Configura el logo, color y nombre que verán tus clientes en este CRM."
        />
        <BrandingSettingsPage />
      </div>
    </ProtectedModule>
  );
}
