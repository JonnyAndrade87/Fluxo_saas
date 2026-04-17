-- ============================================================
-- Fluxeer — Migração de Dados: Railway -> Supabase
-- Cole este arquivo inteiro no SQL Editor do Supabase
-- ============================================================

-- 1. Corrigir _prisma_migrations com checksums reais do Railway
TRUNCATE TABLE public._prisma_migrations;

INSERT INTO public._prisma_migrations
  (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
  -- baseline schema
  ('ca822c7d-48b6-4f43-88d4-8eb92acf0285',
   '2c1aed2256c8299d606bf353705350233cfd23b1be30a9f88350fc3190a7bbac',
   '2026-03-24 15:59:49.060955+00', '20260324125854_baseline_production_schema',
   NULL, NULL, '2026-03-24 15:59:49.060955+00', 0),

  -- rate_limit table
  ('422d53ca-8ed7-4d69-986a-9614d64bf2ba',
   '65886a0bf08a5a2bf9233056248492c1f56d53dc8620c1ebd2c9b5cb854516a0',
   '2026-04-14 12:36:05.875368+00', '20260414000000_add_rate_limit_table',
   NULL, NULL, '2026-04-14 12:36:05.875368+00', 0),

  -- audit log jsonb
  ('c24ebcc2-9a86-4ac1-aa92-456b652ec97c',
   'be18dfc29fa309e110ca9cb256a71ce9a6a927f1ef25e84e9abef44c33a3ab84',
   '2026-04-14 16:01:02.385073+00', '20260414150000_audit_log_json_metadata',
   NULL, NULL, '2026-04-14 16:01:01.618702+00', 1),

  -- tenant billing base
  ('6f511b59-6e01-4e8c-adec-50d91e141a2d',
   '1c819e42594a707f1474b7f815aeac7741727b1e7d92e26cf28e5afe003da8b3',
   '2026-04-15 05:52:17.640343+00', '20260415160000_add_tenant_billing_base',
   NULL, NULL, '2026-04-15 05:52:17.612343+00', 1),

  -- stripe billing cycle
  ('dcab2a1f-aa16-45bb-b523-6afa90b206b5',
   'a65039cf195e4fb4b5c6dfcf1212d1a80c74add0736637efcc28f9e4e0660a3d',
   '2026-04-15 19:46:21.141649+00', '20260415_stripe_billing_cycle',
   NULL, NULL, '2026-04-15 19:46:21.112589+00', 1);


-- 2. Tenants (4 registros)
INSERT INTO public.tenants
  (id, name, document_number, plan_type, subscription_status,
   stripe_customer_id, stripe_subscription_id,
   max_users, max_customers, max_invoices,
   support_level, onboarding_tier,
   stripe_price_id, current_period_end, created_at, updated_at)
VALUES
  ('252d8962-4d0f-4dba-9a26-c3976dfdf98d',
   'elephill', '19.947.775/0001-05', 'starter', 'trialing',
   NULL, NULL, 1, 300, 1000, 'standard', 'basic', NULL, NULL,
   '2026-03-25 02:04:36.673', '2026-03-25 02:04:36.673'),

  ('a02174f2-a96e-4a4f-a76f-ce1a26f05e23',
   'Lucia Helena C S P Batista Ltda', '05.914.764/0001-06', 'starter', 'trialing',
   NULL, NULL, 1, 300, 1000, 'standard', 'basic', NULL, NULL,
   '2026-04-08 22:20:55.242', '2026-04-08 22:20:55.242'),

  ('2fecfd7a-4aea-4bf4-a7d2-51c04ea42866',
   'Test Corp', '12.345.678/0001-90', 'starter', 'trialing',
   NULL, NULL, 1, 300, 1000, 'standard', 'basic', NULL, NULL,
   '2026-04-10 07:02:07.106', '2026-04-10 07:02:07.106'),

  ('06260406-bad1-4a35-8a3b-5a17c98cdfe9',
   'Admin Tenant', '00.000.000/0000-00', 'starter', 'trialing',
   'cus_ULOY5m6whsxvH1', NULL, 1, 300, 1000, 'standard', 'basic', NULL, NULL,
   '2026-03-24 01:16:51.177', '2026-04-16 04:42:24.232')
ON CONFLICT DO NOTHING;


-- 3. Users (3 registros)
INSERT INTO public.users
  (id, email, full_name, password, google_id,
   email_verified, is_active, mfa_enabled, mfa_secret, created_at, updated_at)
VALUES
  ('189840d9-f2d2-4174-b2c3-7a0c8472b7e9',
   'luciahelenacspbatista@gmail.com', 'Lucia Helena C S P Batista',
   '$2b$10$nqh3lWVY0G9r8N2DHG4h4OO45pZRVSdWEm12MXB5h.HCzdxjcRLJ.',
   NULL, true, true, false, NULL,
   '2026-04-08 22:20:55.25', '2026-04-08 22:21:10.367'),

  ('8967ff7a-355e-4929-9b0f-171dbcc266b2',
   'test@example.com', 'Test User',
   '$2b$10$hxZ19Axr9xTeA66rfqhFX.VrLb/UzjsWZ0nlT72JWsk2IYauTB7Za',
   NULL, true, true, false, NULL,
   '2026-04-10 07:02:07.546', '2026-04-15 01:10:49.683'),

  ('22672733-2d9b-458e-8f91-ade32bcc49a3',
   'jonattan.passos@gmail.com', 'Jonattan Passos',
   '$2b$10$qEGpaf6L40x./X0AB.wZEOZFR3b5YGX4YliN.1tsdaEZrB.ZGt1V2',
   '116343437190807294137', true, true, false, NULL,
   '2026-03-25 02:04:36.689', '2026-04-15 01:10:49.683')
ON CONFLICT DO NOTHING;


-- 4. Tenant-User links (4 registros)
INSERT INTO public.tenant_users (id, tenant_id, user_id, role, created_at)
VALUES
  ('f4ccec80-85d1-494a-95fe-c8ca443b2f65',
   '252d8962-4d0f-4dba-9a26-c3976dfdf98d',
   '22672733-2d9b-458e-8f91-ade32bcc49a3', 'admin', '2026-03-25 02:04:36.705'),

  ('88bb0322-3a42-4f13-b4e3-4ac1803dd694',
   '06260406-bad1-4a35-8a3b-5a17c98cdfe9',
   '22672733-2d9b-458e-8f91-ade32bcc49a3', 'admin', '2026-04-06 20:27:02.485'),

  ('888ad474-0d63-42a7-ac55-ce49cc864bb6',
   'a02174f2-a96e-4a4f-a76f-ce1a26f05e23',
   '189840d9-f2d2-4174-b2c3-7a0c8472b7e9', 'admin', '2026-04-08 22:20:55.258'),

  ('098d5413-2ff4-49f5-812a-104a555583cc',
   '2fecfd7a-4aea-4bf4-a7d2-51c04ea42866',
   '8967ff7a-355e-4929-9b0f-171dbcc266b2', 'admin', '2026-04-10 07:02:09.569')
ON CONFLICT DO NOTHING;


-- 5. Customers (1 registro)
INSERT INTO public.customers
  (id, tenant_id, name, document_number, status, email, phone,
   address, notes, tags, assigned_user_id, custom_data, created_at, updated_at)
VALUES
  ('90b4edc5-3642-43f3-b25c-c585fed15e8c',
   '06260406-bad1-4a35-8a3b-5a17c98cdfe9',
   'Jonattan E2E Test', '00000000000', 'active',
   NULL, '5541984598392', NULL, NULL, NULL, NULL, NULL,
   '2026-04-02 18:18:24.911', '2026-04-02 18:18:24.911')
ON CONFLICT DO NOTHING;


-- 6. Invoices (2 registros)
INSERT INTO public.invoices
  (id, tenant_id, customer_id, invoice_number, amount, balance_due,
   due_date, issue_date, status, external_reference_id,
   cancel_reason, canceled_at, fine_amount, interest_amount,
   paid_amount, paid_at, promise_date, promise_note, updated_amount,
   created_at, updated_at)
VALUES
  ('187cb8df-32b3-45ad-b2bd-7b0c76ae142a',
   '06260406-bad1-4a35-8a3b-5a17c98cdfe9',
   '90b4edc5-3642-43f3-b25c-c585fed15e8c',
   'E2E-1775153977405', 15.99, 15.99,
   '2026-04-03 18:19:37.405', '2026-04-02 18:19:37.408', 'OPEN', NULL,
   NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, 0,
   '2026-04-02 18:19:37.408', '2026-04-02 18:19:37.408'),

  ('d14eab5c-771a-463a-8eac-fc27052f049b',
   '06260406-bad1-4a35-8a3b-5a17c98cdfe9',
   '90b4edc5-3642-43f3-b25c-c585fed15e8c',
   'E2EMANUAL-1775486303970', 25.5, 25.5,
   '2026-04-03 14:38:23.968', '2026-04-06 14:38:23.972', 'OPEN', NULL,
   NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, 0,
   '2026-04-06 14:38:23.972', '2026-04-06 14:38:23.972')
ON CONFLICT DO NOTHING;


-- 7. Activity Logs (2 registros)
INSERT INTO public.activity_logs
  (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
VALUES
  ('930e85d2-ea20-49a9-84d7-9cf01364de72',
   '252d8962-4d0f-4dba-9a26-c3976dfdf98d',
   '22672733-2d9b-458e-8f91-ade32bcc49a3',
   'AUTH_LOGIN_SUCCESS', 'AUTH', '22672733-2d9b-458e-8f91-ade32bcc49a3',
   '{"email":"jonattan.passos@gmail.com","context":{"ip":"172.69.138.40","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3.1 Safari/605.1.15"}}',
   '2026-04-15 13:31:56.142'),

  ('0c2bb602-1962-46dc-ae67-a76681640fbb',
   '252d8962-4d0f-4dba-9a26-c3976dfdf98d',
   '22672733-2d9b-458e-8f91-ade32bcc49a3',
   'AUTH_LOGIN_SUCCESS', 'AUTH', '22672733-2d9b-458e-8f91-ade32bcc49a3',
   '{"email":"jonattan.passos@gmail.com","context":{"ip":"172.71.239.49","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3.1 Safari/605.1.15"}}',
   '2026-04-16 04:11:13.484')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIM DA MIGRAÇÃO DE DADOS
-- Todos os registros essenciais foram migrados.
-- ============================================================
