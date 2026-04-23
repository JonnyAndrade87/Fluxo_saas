--
-- PostgreSQL database dump
--

\restrict 0c7C5oXZWhxAc4lAMxlufXTknXR6yBInGUyPGhgK3GYXfyvweAmcsty8uxSEt70

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public._prisma_migrations DISABLE TRIGGER ALL;

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ca822c7d-48b6-4f43-88d4-8eb92acf0285	2c1aed2256c8299d606bf353705350233cfd23b1be30a9f88350fc3190a7bbac	2026-03-24 15:59:49.060955+00	20260324125854_baseline_production_schema		\N	2026-03-24 15:59:49.060955+00	0
297b2193-764e-4b38-96a2-533f819cdb5e	8be023d6eb194dd431c5525bf9a73f72faca182726f7053995ee2bc972635e9f	\N	20260320201540_init_fluxo_schema	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260320201540_init_fluxo_schema\n\nDatabase error code: 42704\n\nDatabase error:\nERROR: type "datetime" does not exist\n\nPosition:\n[1m  2[0m CREATE TABLE "tenants" (\n[1m  3[0m     "id" TEXT NOT NULL PRIMARY KEY,\n[1m  4[0m     "name" TEXT NOT NULL,\n[1m  5[0m     "document_number" TEXT NOT NULL,\n[1m  6[0m     "plan_type" TEXT NOT NULL DEFAULT 'starter',\n[1m  7[1;31m     "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42704), message: "type \\"datetime\\" does not exist", detail: None, hint: None, position: Some(Original(206)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_type.c"), line: Some(270), routine: Some("typenameType") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260320201540_init_fluxo_schema"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260320201540_init_fluxo_schema"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-03-24 16:11:11.220131+00	2026-03-23 23:52:45.911534+00	0
422d53ca-8ed7-4d69-986a-9614d64bf2ba	65886a0bf08a5a2bf9233056248492c1f56d53dc8620c1ebd2c9b5cb854516a0	2026-04-14 12:36:05.875368+00	20260414000000_add_rate_limit_table		\N	2026-04-14 12:36:05.875368+00	0
c24ebcc2-9a86-4ac1-aa92-456b652ec97c	be18dfc29fa309e110ca9cb256a71ce9a6a927f1ef25e84e9abef44c33a3ab84	2026-04-14 16:01:02.385073+00	20260414150000_audit_log_json_metadata	\N	\N	2026-04-14 16:01:01.618702+00	1
6f511b59-6e01-4e8c-adec-50d91e141a2d	1c819e42594a707f1474b7f815aeac7741727b1e7d92e26cf28e5afe003da8b3	2026-04-15 05:52:17.640343+00	20260415160000_add_tenant_billing_base	\N	\N	2026-04-15 05:52:17.612343+00	1
dcab2a1f-aa16-45bb-b523-6afa90b206b5	a65039cf195e4fb4b5c6dfcf1212d1a80c74add0736637efcc28f9e4e0660a3d	2026-04-15 19:46:21.141649+00	20260415_stripe_billing_cycle	\N	\N	2026-04-15 19:46:21.112589+00	1
\.


ALTER TABLE public._prisma_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.tenants DISABLE TRIGGER ALL;

COPY public.tenants (id, name, document_number, plan_type, created_at, updated_at, subscription_status, stripe_customer_id, stripe_subscription_id, max_users, max_customers, max_invoices, support_level, onboarding_tier, stripe_price_id, current_period_end) FROM stdin;
252d8962-4d0f-4dba-9a26-c3976dfdf98d	elephill	19.947.775/0001-05	starter	2026-03-25 02:04:36.673	2026-03-25 02:04:36.673	trialing	\N	\N	1	300	1000	standard	basic	\N	\N
a02174f2-a96e-4a4f-a76f-ce1a26f05e23	Lucia Helena C S P Batista Ltda	05.914.764/0001-06	starter	2026-04-08 22:20:55.242	2026-04-08 22:20:55.242	trialing	\N	\N	1	300	1000	standard	basic	\N	\N
2fecfd7a-4aea-4bf4-a7d2-51c04ea42866	Test Corp	12.345.678/0001-90	starter	2026-04-10 07:02:07.106	2026-04-10 07:02:07.106	trialing	\N	\N	1	300	1000	standard	basic	\N	\N
06260406-bad1-4a35-8a3b-5a17c98cdfe9	Admin Tenant	00.000.000/0000-00	starter	2026-03-24 01:16:51.177	2026-04-16 04:42:24.232	trialing	cus_ULOY5m6whsxvH1	\N	1	300	1000	standard	basic	\N	\N
\.


ALTER TABLE public.tenants ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, email, full_name, password, created_at, updated_at, google_id, email_verified, is_active, mfa_enabled, mfa_secret) FROM stdin;
189840d9-f2d2-4174-b2c3-7a0c8472b7e9	luciahelenacspbatista@gmail.com	Lucia Helena C S P Batista	$2b$10$nqh3lWVY0G9r8N2DHG4h4OO45pZRVSdWEm12MXB5h.HCzdxjcRLJ.	2026-04-08 22:20:55.25	2026-04-08 22:21:10.367	\N	t	t	f	\N
8967ff7a-355e-4929-9b0f-171dbcc266b2	test@example.com	Test User	$2b$10$hxZ19Axr9xTeA66rfqhFX.VrLb/UzjsWZ0nlT72JWsk2IYauTB7Za	2026-04-10 07:02:07.546	2026-04-15 01:10:49.683	\N	t	t	f	\N
22672733-2d9b-458e-8f91-ade32bcc49a3	jonattan.passos@gmail.com	Jonattan Passos	$2b$10$qEGpaf6L40x./X0AB.wZEOZFR3b5YGX4YliN.1tsdaEZrB.ZGt1V2	2026-03-25 02:04:36.689	2026-04-15 01:10:49.683	116343437190807294137	t	t	f	\N
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs DISABLE TRIGGER ALL;

COPY public.activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at) FROM stdin;
930e85d2-ea20-49a9-84d7-9cf01364de72	252d8962-4d0f-4dba-9a26-c3976dfdf98d	22672733-2d9b-458e-8f91-ade32bcc49a3	AUTH_LOGIN_SUCCESS	AUTH	22672733-2d9b-458e-8f91-ade32bcc49a3	{"email": "jonattan.passos@gmail.com", "context": {"ip": "172.69.138.40", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3.1 Safari/605.1.15"}}	2026-04-15 13:31:56.142
0c2bb602-1962-46dc-ae67-a76681640fbb	252d8962-4d0f-4dba-9a26-c3976dfdf98d	22672733-2d9b-458e-8f91-ade32bcc49a3	AUTH_LOGIN_SUCCESS	AUTH	22672733-2d9b-458e-8f91-ade32bcc49a3	{"email": "jonattan.passos@gmail.com", "context": {"ip": "172.71.239.49", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3.1 Safari/605.1.15"}}	2026-04-16 04:11:13.484
\.


ALTER TABLE public.activity_logs ENABLE TRIGGER ALL;

--
-- Data for Name: billing_flows; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.billing_flows DISABLE TRIGGER ALL;

COPY public.billing_flows (id, tenant_id, name, description, is_active, rules, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.billing_flows ENABLE TRIGGER ALL;

--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.customers DISABLE TRIGGER ALL;

COPY public.customers (id, tenant_id, name, document_number, status, email, phone, address, notes, tags, assigned_user_id, custom_data, created_at, updated_at) FROM stdin;
90b4edc5-3642-43f3-b25c-c585fed15e8c	06260406-bad1-4a35-8a3b-5a17c98cdfe9	Jonattan E2E Test	00000000000	active	\N	5541984598392	\N	\N	\N	\N	\N	2026-04-02 18:18:24.911	2026-04-02 18:18:24.911
\.


ALTER TABLE public.customers ENABLE TRIGGER ALL;

--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.invoices DISABLE TRIGGER ALL;

COPY public.invoices (id, tenant_id, customer_id, invoice_number, amount, balance_due, due_date, issue_date, status, external_reference_id, created_at, updated_at, cancel_reason, canceled_at, fine_amount, interest_amount, paid_amount, paid_at, promise_date, promise_note, updated_amount) FROM stdin;
187cb8df-32b3-45ad-b2bd-7b0c76ae142a	06260406-bad1-4a35-8a3b-5a17c98cdfe9	90b4edc5-3642-43f3-b25c-c585fed15e8c	E2E-1775153977405	15.99	15.99	2026-04-03 18:19:37.405	2026-04-02 18:19:37.408	OPEN	\N	2026-04-02 18:19:37.408	2026-04-02 18:19:37.408	\N	\N	0	0	\N	\N	\N	\N	0
d14eab5c-771a-463a-8eac-fc27052f049b	06260406-bad1-4a35-8a3b-5a17c98cdfe9	90b4edc5-3642-43f3-b25c-c585fed15e8c	E2EMANUAL-1775486303970	25.5	25.5	2026-04-03 14:38:23.968	2026-04-06 14:38:23.972	OPEN	\N	2026-04-06 14:38:23.972	2026-04-06 14:38:23.972	\N	\N	0	0	\N	\N	\N	\N	0
\.


ALTER TABLE public.invoices ENABLE TRIGGER ALL;

--
-- Data for Name: communication_logs; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.communication_logs DISABLE TRIGGER ALL;

COPY public.communication_logs (id, tenant_id, customer_id, invoice_id, rule_type, channel, message, status, scheduled_for, sent_at, metadata, created_at, updated_at) FROM stdin;
1daf2585-f211-423b-a37f-c558cbe7b2d6	06260406-bad1-4a35-8a3b-5a17c98cdfe9	90b4edc5-3642-43f3-b25c-c585fed15e8c	d14eab5c-771a-463a-8eac-fc27052f049b	overdue_3d	whatsapp_manual	Olá, *Jonattan E2E Test*.\n\nA fatura *#E2EMANUAL-1775486303970* da *Admin Tenant* (R$ *R$ 25,50*) está em aberto há *3 dias*.\nVencimento original: 03/04/2026.\n\nPedimos que regularize sua pendência com urgência para manter seu cadastro em dia.\n\nEstamos à disposição para negociar.	sent	2026-04-06 03:00:00	2026-04-06 14:38:27.291	{"daysOverdue":3,"phone":"5541984598392","waLink":"https://wa.me/5541984598392?text=Ol%C3%A1%2C%20*Jonattan%20E2E%20Test*.%0A%0AA%20fatura%20*%23E2EMANUAL-1775486303970*%20da%20*Admin%20Tenant*%20(R%24%20*R%24%C2%A025%2C50*)%20est%C3%A1%20em%20aberto%20h%C3%A1%20*3%20dias*.%0AVencimento%20original%3A%2003%2F04%2F2026.%0A%0APedimos%20que%20regularize%20sua%20pend%C3%AAncia%20com%20urg%C3%AAncia%20para%20manter%20seu%20cadastro%20em%20dia.%0A%0AEstamos%20%C3%A0%20disposi%C3%A7%C3%A3o%20para%20negociar."}	2026-04-06 14:38:25.524	2026-04-06 14:38:27.292
7c7c38ae-4777-4864-ba75-a8b7eb9274bf	06260406-bad1-4a35-8a3b-5a17c98cdfe9	90b4edc5-3642-43f3-b25c-c585fed15e8c	187cb8df-32b3-45ad-b2bd-7b0c76ae142a	overdue_3d	whatsapp_manual	Olá, *Jonattan E2E Test*.\n\nA fatura *#E2E-1775153977405* da *Admin Tenant* (R$ *R$ 15,99*) está em aberto há *3 dias*.\nVencimento original: 03/04/2026.\n\nPedimos que regularize sua pendência com urgência para manter seu cadastro em dia.\n\nEstamos à disposição para negociar.	pending	2026-04-06 00:00:00	\N	{"daysOverdue":3,"phone":"5541984598392","waLink":"https://wa.me/5541984598392?text=Ol%C3%A1%2C%20*Jonattan%20E2E%20Test*.%0A%0AA%20fatura%20*%23E2E-1775153977405*%20da%20*Admin%20Tenant*%20(R%24%20*R%24%C2%A015%2C99*)%20est%C3%A1%20em%20aberto%20h%C3%A1%20*3%20dias*.%0AVencimento%20original%3A%2003%2F04%2F2026.%0A%0APedimos%20que%20regularize%20sua%20pend%C3%AAncia%20com%20urg%C3%AAncia%20para%20manter%20seu%20cadastro%20em%20dia.%0A%0AEstamos%20%C3%A0%20disposi%C3%A7%C3%A3o%20para%20negociar."}	2026-04-06 21:44:37.242	2026-04-06 21:44:37.242
220255fd-334a-4061-8bd7-b35724519ca5	06260406-bad1-4a35-8a3b-5a17c98cdfe9	90b4edc5-3642-43f3-b25c-c585fed15e8c	187cb8df-32b3-45ad-b2bd-7b0c76ae142a	overdue_7d	whatsapp_manual	Prezado(a) *Jonattan E2E Test*,\n\nSua fatura *#E2E-1775153977405* referente à *Admin Tenant* permanece em aberto há *7 dias*.\nValor: *R$ 15,99* | Vencimento: 03/04/2026.\n\n⚠️ Solicitamos a regularização imediata para evitar medidas administrativas.\n\nContate-nos para encontrar a melhor solução.	pending	2026-04-10 00:00:00	\N	{"daysOverdue":7,"phone":"5541984598392","waLink":"https://wa.me/5541984598392?text=Prezado(a)%20*Jonattan%20E2E%20Test*%2C%0A%0ASua%20fatura%20*%23E2E-1775153977405*%20referente%20%C3%A0%20*Admin%20Tenant*%20permanece%20em%20aberto%20h%C3%A1%20*7%20dias*.%0AValor%3A%20*R%24%C2%A015%2C99*%20%7C%20Vencimento%3A%2003%2F04%2F2026.%0A%0A%E2%9A%A0%EF%B8%8F%20Solicitamos%20a%20regulariza%C3%A7%C3%A3o%20imediata%20para%20evitar%20medidas%20administrativas.%0A%0AContate-nos%20para%20encontrar%20a%20melhor%20solu%C3%A7%C3%A3o."}	2026-04-10 07:49:35.046	2026-04-10 07:49:35.046
c7032483-8a86-48eb-b176-e97642cc9b66	06260406-bad1-4a35-8a3b-5a17c98cdfe9	90b4edc5-3642-43f3-b25c-c585fed15e8c	d14eab5c-771a-463a-8eac-fc27052f049b	overdue_7d	whatsapp_manual	Prezado(a) *Jonattan E2E Test*,\n\nSua fatura *#E2EMANUAL-1775486303970* referente à *Admin Tenant* permanece em aberto há *7 dias*.\nValor: *R$ 25,50* | Vencimento: 03/04/2026.\n\n⚠️ Solicitamos a regularização imediata para evitar medidas administrativas.\n\nContate-nos para encontrar a melhor solução.	pending	2026-04-10 00:00:00	\N	{"daysOverdue":7,"phone":"5541984598392","waLink":"https://wa.me/5541984598392?text=Prezado(a)%20*Jonattan%20E2E%20Test*%2C%0A%0ASua%20fatura%20*%23E2EMANUAL-1775486303970*%20referente%20%C3%A0%20*Admin%20Tenant*%20permanece%20em%20aberto%20h%C3%A1%20*7%20dias*.%0AValor%3A%20*R%24%C2%A025%2C50*%20%7C%20Vencimento%3A%2003%2F04%2F2026.%0A%0A%E2%9A%A0%EF%B8%8F%20Solicitamos%20a%20regulariza%C3%A7%C3%A3o%20imediata%20para%20evitar%20medidas%20administrativas.%0A%0AContate-nos%20para%20encontrar%20a%20melhor%20solu%C3%A7%C3%A3o."}	2026-04-10 07:49:35.078	2026-04-10 07:49:35.078
\.


ALTER TABLE public.communication_logs ENABLE TRIGGER ALL;

--
-- Data for Name: communications; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.communications DISABLE TRIGGER ALL;

COPY public.communications (id, tenant_id, customer_id, invoice_id, channel, message_type, content, status, external_id, error_message, retry_count, sent_at, delivered_at, read_at, created_at) FROM stdin;
\.


ALTER TABLE public.communications ENABLE TRIGGER ALL;

--
-- Data for Name: customer_notes; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.customer_notes DISABLE TRIGGER ALL;

COPY public.customer_notes (id, tenant_id, customer_id, user_id, content, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.customer_notes ENABLE TRIGGER ALL;

--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.email_verification_tokens DISABLE TRIGGER ALL;

COPY public.email_verification_tokens (id, email, token, expires, created_at) FROM stdin;
2ac9932f-8734-4316-9505-6ca66409ac05	test@example.com	84d54232-8513-4c7c-a098-591a7e9d63b0	2026-04-11 07:02:10.672	2026-04-10 07:02:10.676
\.


ALTER TABLE public.email_verification_tokens ENABLE TRIGGER ALL;

--
-- Data for Name: financial_contacts; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.financial_contacts DISABLE TRIGGER ALL;

COPY public.financial_contacts (id, tenant_id, customer_id, name, email, phone, is_primary, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.financial_contacts ENABLE TRIGGER ALL;

--
-- Data for Name: invoice_installments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.invoice_installments DISABLE TRIGGER ALL;

COPY public.invoice_installments (id, tenant_id, invoice_id, installment_number, amount, due_date, status, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.invoice_installments ENABLE TRIGGER ALL;

--
-- Data for Name: message_queue; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.message_queue DISABLE TRIGGER ALL;

COPY public.message_queue (id, tenant_id, channel, "to", subject, body, metadata, status, retry_count, max_retries, error_log, scheduled_at, sent_at, created_at, idempotency_key, is_dlq, fallback_from, next_retry_at, processing_started_at) FROM stdin;
\.


ALTER TABLE public.message_queue ENABLE TRIGGER ALL;

--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.password_reset_tokens DISABLE TRIGGER ALL;

COPY public.password_reset_tokens (id, email, token, expires, created_at) FROM stdin;
3c2ae71b-a89e-40b7-91d2-18cff836a893	jonattan.passos@gmail.com	3d41a65d-450a-4286-ae2a-38a621d3918d	2026-04-02 19:27:28.739	2026-04-02 17:27:28.74
e2c94f49-338c-4d62-9529-72913c04686c	luciahelenacspbatista@gmail.com	dbd51908-dc7a-4ffc-a8f8-3e01d57e6fe5	2026-04-13 20:36:46.292	2026-04-13 18:36:46.297
\.


ALTER TABLE public.password_reset_tokens ENABLE TRIGGER ALL;

--
-- Data for Name: payment_promises; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.payment_promises DISABLE TRIGGER ALL;

COPY public.payment_promises (id, tenant_id, invoice_id, user_id, promised_date, amount, notes, status, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.payment_promises ENABLE TRIGGER ALL;

--
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits DISABLE TRIGGER ALL;

COPY public.rate_limits (key, count, reset_at, created_at, updated_at) FROM stdin;
login:172.69.138.40	1	2026-04-15 13:41:55.692	2026-04-15 13:31:55.956	2026-04-15 13:31:55.956
login:172.71.239.49	2	2026-04-16 04:20:50.753	2026-04-16 04:10:50.977	2026-04-16 04:11:13.352
\.


ALTER TABLE public.rate_limits ENABLE TRIGGER ALL;

--
-- Data for Name: stripe_events; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.stripe_events DISABLE TRIGGER ALL;

COPY public.stripe_events (id, type, processed_at) FROM stdin;
\.


ALTER TABLE public.stripe_events ENABLE TRIGGER ALL;

--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.tasks DISABLE TRIGGER ALL;

COPY public.tasks (id, tenant_id, customer_id, invoice_id, title, description, status, due_date, assignee_id, completed_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.tasks ENABLE TRIGGER ALL;

--
-- Data for Name: tenant_users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.tenant_users DISABLE TRIGGER ALL;

COPY public.tenant_users (id, tenant_id, user_id, role, created_at) FROM stdin;
f4ccec80-85d1-494a-95fe-c8ca443b2f65	252d8962-4d0f-4dba-9a26-c3976dfdf98d	22672733-2d9b-458e-8f91-ade32bcc49a3	admin	2026-03-25 02:04:36.705
88bb0322-3a42-4f13-b4e3-4ac1803dd694	06260406-bad1-4a35-8a3b-5a17c98cdfe9	22672733-2d9b-458e-8f91-ade32bcc49a3	admin	2026-04-06 20:27:02.485
888ad474-0d63-42a7-ac55-ce49cc864bb6	a02174f2-a96e-4a4f-a76f-ce1a26f05e23	189840d9-f2d2-4174-b2c3-7a0c8472b7e9	admin	2026-04-08 22:20:55.258
098d5413-2ff4-49f5-812a-104a555583cc	2fecfd7a-4aea-4bf4-a7d2-51c04ea42866	8967ff7a-355e-4929-9b0f-171dbcc266b2	admin	2026-04-10 07:02:09.569
\.


ALTER TABLE public.tenant_users ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

\unrestrict 0c7C5oXZWhxAc4lAMxlufXTknXR6yBInGUyPGhgK3GYXfyvweAmcsty8uxSEt70

