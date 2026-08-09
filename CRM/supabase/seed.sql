-- ============================================================
-- ZimplifAI CRM — Seed de demostración
-- Snapshots verticales + tenant demo + datos de ejemplo.
-- No es una migración: ejecutar manualmente en entorno dev/staging.
-- ============================================================

-- ----- Snapshots verticales (plantillas del motor de provisión) -----
insert into public.vertical_snapshots (id, name, vertical_type, default_pipeline_stages, default_ai_prompt, enabled_modules) values
(
  '00000000-0000-0000-0000-000000000001',
  'Snapshot Hostelería / Reservas WhatsApp',
  'restaurant_booking',
  '["Nuevo","Contactado por IA","Cualificado","Reservado","Cerrado ganado","Cerrado perdido"]'::jsonb,
  'Eres el asistente de reservas de un restaurante. Hablas en español, con tono cercano y eficiente. Objetivos: confirmar mesa, nº de comensales, fecha y hora, y pedir email/teléfono. Si el usuario quiere algo fuera de horario, ofrécele alternativas. Nunca inventes disponibilidad.',
  '["pipeline","bookings","automations","branding"]'::jsonb
),
(
  '00000000-0000-0000-0000-000000000002',
  'Snapshot Servicios Captación Leads',
  'service_lead_gen',
  '["Nuevo","Contactado por IA","Cualificado","Propuesta enviada","Cerrado ganado","Cerrado perdido"]'::jsonb,
  'Eres el cualificador comercial de una agencia de servicios. En español. Objetivo: entender la necesidad, presupuesto aproximado y urgencia; clasifica el lead como A (listo), B (requiere seguimiento) o C (frío). Pide nombre y teléfono. Deriva a humano si lo pide.',
  '["pipeline","automations","branding"]'::jsonb
),
(
  '00000000-0000-0000-0000-000000000003',
  'Snapshot Agencia a medida',
  'custom_agency',
  '["Nuevo","Contactado por IA","Cualificado","Cerrado ganado","Cerrado perdido"]'::jsonb,
  'Eres el asistente de una agencia a medida. En español. Detecta el sector del cliente, prioridad y entregables. Recoge email y teléfono para que un consultor dé continuidad.',
  '["pipeline","automations","branding"]'::jsonb
);

-- ----- Tenant demo -----
insert into public.organizations (id, name, slug, vertical_type, primary_color, status, api_key_hash)
values (
  '00000000-0000-0000-0000-000000000010',
  'Brasa & Carbón · Restaurante',
  'brasa-carbon',
  'restaurant_booking',
  '#CEFF00',
  'active',
  null
);

-- ----- Usuario demo (password: demo123456) -----
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role)
values (
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-000000000000',
  'demo@zimplifai.app',
  crypt('demo123456', gen_salt('bf', 10)),
  now(),
  '{"full_name":"Zuzo · Admin Demo"}'::jsonb,
  '{"provider":"email","providers":["email"],"role":"client_admin","organization_id":"00000000-0000-0000-0000-000000000010"}'::jsonb,
  'authenticated',
  'authenticated'
);

-- El trigger on_auth_user_created crea el perfil; actualizamos su org y rol:
update public.profiles
set organization_id = '00000000-0000-0000-0000-000000000010',
    role = 'client_admin',
    full_name = 'Zuzo · Admin Demo'
where id = '00000000-0000-0000-0000-0000000000a1';

-- ----- Leads demo -----
insert into public.leads (id, organization_id, first_name, last_name, email, phone, status, deal_value, tags, created_at) values
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 'Laura', 'García', 'laura@example.com', '+34 612 000 001', 'new', 0, '{WhatsApp,Ig}', now() - interval '2 hours'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 'Marc', 'Vidal', 'marc@example.com', '+34 612 000 002', 'ai_contacted', 0, '{AI-Qualified,WhatsApp}', now() - interval '5 hours'),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010', 'Sofía', 'Martínez', 'sofia@example.com', '+34 612 000 003', 'ai_contacted', 40, '{AI-Qualified}', now() - interval '1 day'),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000010', 'Jorge', 'Navarro', 'jorge@example.com', '+34 612 000 004', 'qualified', 120, '{Mesa-vip,Aniversario}', now() - interval '2 days'),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000010', 'Elena', 'Rojas', 'elena@example.com', '+34 612 000 005', 'booked', 250, '{Evento,10-pax}', now() - interval '3 days'),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000010', 'Iván', 'Soler', 'ivan@example.com', '+34 612 000 006', 'closed_won', 800, '{Catering,Recurrente}', now() - interval '6 days'),
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000010', 'Paula', 'Díaz', 'paula@example.com', '+34 612 000 007', 'closed_lost', 0, '{No-por-precio}', now() - interval '8 days'),
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000010', 'Álex', 'Rubio', 'alex@example.com', '+34 612 000 008', 'new', 0, '{Ig}', now() - interval '30 minutes');

-- ----- Bookings demo -----
insert into public.bookings (id, organization_id, lead_id, booking_date, party_size_or_service, status, notes) values
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000014', now() + interval '1 day' + interval '13 hours', '4 personas · Terraza', 'confirmed', 'Confirmado por bot de WhatsApp'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000015', now() + interval '2 days' + interval '15 hours', 'Evento · 10 pax · Salón privado', 'pending', 'Esperando confirmación de precio'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000010', null, now() + interval '3 hours', '2 personas', 'confirmed', 'Reserva directa por web'),
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000012', now() - interval '1 day', '6 personas', 'completed', 'Cumpleaños'),
('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000010', null, now() - interval '3 days', '3 personas', 'cancelled', 'Cliente canceló por WhatsApp');

-- ----- Agentes IA demo -----
insert into public.ai_agents (id, organization_id, name, model, system_prompt, is_active) values
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000010', 'WhatsApp Qualifier Bot', 'claude-sonnet-5', 'Eres el asistente de reservas de Brasa & Carbón. Hablas en español, con tono cercano y eficiente. Objetivos: confirmar mesa, nº de comensales, fecha y hora, y pedir email/teléfono. Nunca inventes disponibilidad.', true),
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000010', 'Lead Scorer (n8n → CRM)', 'gpt-4o-mini', 'Clasifica cada lead entrante con score 0-100 y etiquetas relevantes para el sector hostelería.', false);

-- ----- Audit logs demo -----
insert into public.ai_audit_logs (id, organization_id, lead_id, agent_name, input_payload, output_payload, tokens_used, status, created_at) values
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000012', 'WhatsApp Qualifier Bot', '{"type":"inbound","channel":"whatsapp","message":"Hola, ¿tenéis mesa para 4 el viernes?"}'::jsonb, '{"action":"confirm_availability","reply":"¡Hola Marc! Sí, tenemos mesa para 4 el viernes a las 21:00. ¿Te reservo?","intent":"booking_request"}'::jsonb, 412, 'success', now() - interval '40 minutes'),
('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000010', null, 'WhatsApp Qualifier Bot', '{"type":"inbound","channel":"whatsapp","message":"Hola, ¿hacéis menú vegano?"}'::jsonb, '{"action":"answer_faq","reply":"Sí, tenemos opciones veganas. ¿Te ayudo a reservar?","intent":"faq"}'::jsonb, 268, 'success', now() - interval '28 minutes'),
('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000013', 'Lead Scorer (n8n → CRM)', '{"lead":{"email":"sofia@example.com","source":"instagram"}}'::jsonb, '{"score":87,"tags":["AI-Qualified","Alta-intención"],"next_step":"contactar_hoy"}'::jsonb, 150, 'success', now() - interval '19 minutes'),
('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000010', null, 'WhatsApp Qualifier Bot', '{"type":"inbound","channel":"whatsapp","message":"quiero montar un catering"}'::jsonb, null, 96, 'error', now() - interval '12 minutes');
