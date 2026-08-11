-- ============================================================
-- ZimplifAI CRM — Super admin inicial + primer tenant
-- Ejecuta DESPUÉS del esquema completo (setup_full_schema.sql)
-- y DESPUÉS de crear tu usuario en Supabase Auth.
--
-- Pasos:
--   1) Crea tu usuario en  Auth → Users → "Add user"
--      (o regístrate desde la propia app en /login).
--   2) Sustituye TU_EMAIL en el UPDATE de abajo.
--   3) Ejecuta este bloque en el SQL Editor.
-- ============================================================

-- 1. Promueve tu usuario a super_admin (RLS lo comprueba vía profiles.role)
update public.profiles
   set role = 'super_admin'
 where id in (select id from auth.users where email = 'TU_EMAIL@example.com');

-- 2. (Opcional) Crea el tenant de la agencia para tener dónde operar.
--    Omitir si prefieres crear la organización desde la UI como super_admin.
insert into public.organizations (name, slug, vertical_type, status)
values ('ZimplifAI', 'zimplifai', 'custom_agency', 'active')
on conflict (slug) do nothing;

-- 3. (Opcional) Asigna el tenant de la agencia a tu perfil.
update public.profiles
   set organization_id = (select id from public.organizations where slug = 'zimplifai'),
       role = 'super_admin'
 where id in (select id from auth.users where email = 'TU_EMAIL@example.com');

-- 4. Verificación (debe devolver 'super_admin'):
-- select p.role, o.name from public.profiles p
--   left join public.organizations o on o.id = p.organization_id
--  where p.id = (select id from auth.users where email = 'TU_EMAIL@example.com');
