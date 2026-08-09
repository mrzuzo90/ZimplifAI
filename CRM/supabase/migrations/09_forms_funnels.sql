-- ============================================================
-- ZimplifAI CRM — Fase D · Forms, funnels y atribución UTM
--
-- 1) forms: formularios de captación (standalone o embebidos).
-- 2) form_submissions: cada captura (lead creado) con payload +
--    atribución UTM completa (source/medium/campaign/term/content,
--    landing page y referrer).
-- 3) funnels: embudos de marketing que apuntan a un formulario.
-- 4) leads: se enriquecen con la atribución UTM del canal.
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;

alter publication supabase_realtime add table public.forms;
alter publication supabase_realtime add table public.form_submissions;
alter publication supabase_realtime add table public.funnels;

-- ----- forms -----
create table public.forms (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  slug            text not null,
  description     text,
  -- { fields: [{key,label,type,required}], button_text, success_message, redirect_url }
  config          jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index forms_org_idx on public.forms (organization_id);
create index forms_slug_idx on public.forms (slug);

-- ----- form_submissions -----
create table public.form_submissions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  form_id         uuid references public.forms (id) on delete set null,
  lead_id         uuid references public.leads (id) on delete set null,
  payload         jsonb not null default '{}'::jsonb,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  landing_page    text,
  referrer        text,
  created_at      timestamptz not null default now()
);
create index form_submissions_org_idx on public.form_submissions (organization_id);
create index form_submissions_form_idx on public.form_submissions (form_id);

-- ----- funnels -----
create table public.funnels (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  slug            text not null,
  description     text,
  landing_form_id uuid references public.forms (id) on delete set null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index funnels_org_idx on public.funnels (organization_id);
create index funnels_slug_idx on public.funnels (slug);

-- ----- leads: atribución UTM del canal -----
alter table public.leads add column utm_source   text;
alter table public.leads add column utm_medium   text;
alter table public.leads add column utm_campaign text;
alter table public.leads add column utm_term     text;
alter table public.leads add column utm_content  text;
alter table public.leads add column landing_page text;
alter table public.leads add column referrer     text;

-- ======================== RLS ========================

alter table public.forms enable row level security;
create policy "forms_super_admin_all"
  on public.forms for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "forms_tenant_all"
  on public.forms for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.form_submissions enable row level security;
create policy "form_submissions_super_admin_all"
  on public.form_submissions for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "form_submissions_tenant_all"
  on public.form_submissions for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.funnels enable row level security;
create policy "funnels_super_admin_all"
  on public.funnels for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "funnels_tenant_all"
  on public.funnels for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.forms to authenticated, service_role;
grant all on table public.form_submissions to authenticated, service_role;
grant all on table public.funnels to authenticated, service_role;
grant all on table public.leads to authenticated, service_role;

commit;
