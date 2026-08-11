-- ============================================================
-- ZimplifAI CRM — Motor de Sitio Web Vertical (light_web_editor)
-- Micro-websites white-label por subcuenta: carta digital,
-- catálogo de servicios o funnel de captación.
--
-- 1) tenant_sites: un sitio por subcuenta (o varios con slug único),
--    contenido estructurado en content_payload JSONB.
-- 2) RLS: lectura pública para sitios publicados + gestión del tenant.
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;


-- ----- tenant_sites -----
create table public.tenant_sites (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  title              text not null default 'Mi Sitio Web',
  slug               text not null unique,
  -- restaurant_menu | service_catalog | lead_funnel
  vertical_template  text not null default 'restaurant_menu',
  is_published       boolean not null default true,
  custom_domain      text,
  seo_metadata       jsonb not null default '{"meta_title": "", "meta_description": ""}'::jsonb,
  content_payload    jsonb not null default '{
    "hero": {
      "headline": "Bienvenidos a nuestro negocio",
      "subheadline": "La mejor experiencia culinaria de la ciudad.",
      "badge": "Reserva online disponible",
      "bg_image": "",
      "cta_text": "Reservar Mesa"
    },
    "sections": {
      "show_menu": true,
      "show_hours": true,
      "show_location": true,
      "show_booking": true
    },
    "menu_items": [
      {"category": "Entrantes", "name": "Croquetas de Jamón", "description": "Caseras y cremosas (6 ud)", "price": 12.50, "image": ""},
      {"category": "Principales", "name": "Chuletón de Vaca madurada", "description": "1kg a la piedra con guarnición", "price": 58.00, "image": ""}
    ],
    "business_hours": [
      {"day": "Lunes a Viernes", "hours": "13:00 - 16:30 | 20:00 - 23:30"},
      {"day": "Sábados y Domingos", "hours": "13:00 - 24:00"}
    ],
    "contact": {
      "address": "Calle Principal 123, Madrid",
      "phone": "+34 600 000 000",
      "whatsapp": "+34 600 000 000",
      "google_maps_url": ""
    }
  }'::jsonb,
  created_at         timestamptz not null default timezone('utc'::text, now()),
  updated_at         timestamptz not null default timezone('utc'::text, now())
);
create index tenant_sites_org_idx on public.tenant_sites (organization_id);
create index tenant_sites_slug_idx on public.tenant_sites (slug);

-- ======================== RLS ========================

alter table public.tenant_sites enable row level security;

-- Sitios publicados: visibles por cualquiera (página pública).
create policy "tenant_sites_public_read"
  on public.tenant_sites for select
  using (is_published = true);

-- El tenant gestiona su propio sitio; super_admin gestiona todos.
create policy "tenant_sites_tenant_all"
  on public.tenant_sites for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "tenant_sites_super_admin_all"
  on public.tenant_sites for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ======================== Grants ========================

grant all on table public.tenant_sites to authenticated, anon, service_role;


alter publication supabase_realtime add table public.tenant_sites;
commit;
