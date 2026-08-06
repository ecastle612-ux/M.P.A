-- FIN-OPS-001 Slice S0 — Financial Operations foundation.
-- Registers permissions, domain events, audit log, Connect linkage, and module settings.
-- Does NOT create charge/payment/ledger operational tables (S1+).

-- ---------------------------------------------------------------------------
-- Permissions: pm.finance:*
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('pm.finance:read', 'pm.finance', 'Read Financial Operations surfaces, queues, and summaries'),
  ('pm.finance:charge.write', 'pm.finance', 'Create and void resident charges (S1+)'),
  ('pm.finance:payment.refund', 'pm.finance', 'Issue payment refunds (S2+)'),
  ('pm.finance:late_fee.manage', 'pm.finance', 'Configure and post late fees (S3+)'),
  ('pm.finance:vendor_invoice.review', 'pm.finance', 'Approve or reject vendor invoices (S4+)'),
  ('pm.finance:vendor_payment.release', 'pm.finance', 'Release vendor payments (S5+)'),
  ('pm.finance:reports.read', 'pm.finance', 'Read property and owner financial reports (S6+)'),
  ('pm.finance:settings.manage', 'pm.finance', 'Manage FO settings and Connect readiness')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'pm.finance:read'),
  ('property_manager', 'pm.finance:charge.write'),
  ('property_manager', 'pm.finance:payment.refund'),
  ('property_manager', 'pm.finance:late_fee.manage'),
  ('property_manager', 'pm.finance:vendor_invoice.review'),
  ('property_manager', 'pm.finance:vendor_payment.release'),
  ('property_manager', 'pm.finance:reports.read'),
  ('property_manager', 'pm.finance:settings.manage'),
  ('property_owner', 'pm.finance:read'),
  ('property_owner', 'pm.finance:reports.read'),
  ('tenant', 'pm.finance:read'),
  ('vendor', 'pm.finance:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- Domain events outbox (ADR-005)
-- ---------------------------------------------------------------------------

create table if not exists public.event_domain_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  organization_id uuid references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  error text
);

create index if not exists event_domain_events_type_created_idx
  on public.event_domain_events (event_type, created_at desc);

create index if not exists event_domain_events_unprocessed_idx
  on public.event_domain_events (processed_at)
  where processed_at is null;

create index if not exists event_domain_events_org_idx
  on public.event_domain_events (organization_id, created_at desc);

alter table public.event_domain_events enable row level security;

drop policy if exists event_domain_events_select_member on public.event_domain_events;
create policy event_domain_events_select_member
on public.event_domain_events
for select
using (
  organization_id is null
  or exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = event_domain_events.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

-- Inserts are service-role / Edge Function owned; authenticated members do not insert directly.
drop policy if exists event_domain_events_insert_manager on public.event_domain_events;
create policy event_domain_events_insert_manager
on public.event_domain_events
for insert
with check (
  organization_id is not null
  and public.is_org_manager(organization_id)
);

-- ---------------------------------------------------------------------------
-- Audit events (append-only)
-- ---------------------------------------------------------------------------

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_events_org_created_idx
  on public.audit_events (organization_id, created_at desc);

create index if not exists audit_events_action_idx
  on public.audit_events (action, created_at desc);

create index if not exists audit_events_entity_idx
  on public.audit_events (entity_type, entity_id);

alter table public.audit_events enable row level security;

drop policy if exists audit_events_select_member on public.audit_events;
create policy audit_events_select_member
on public.audit_events
for select
using (
  organization_id is null
  or exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = audit_events.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists audit_events_insert_manager on public.audit_events;
create policy audit_events_insert_manager
on public.audit_events
for insert
with check (
  organization_id is not null
  and public.is_org_manager(organization_id)
);

-- No update/delete policies — append-only by omission.

-- ---------------------------------------------------------------------------
-- Stripe Connect account linkage (no payment execution)
-- ---------------------------------------------------------------------------

create table if not exists public.financial_connect_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stripe_account_id text,
  status text not null default 'not_started'
    check (status in ('not_started', 'pending', 'restricted', 'ready', 'disabled')),
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id)
);

create index if not exists financial_connect_accounts_status_idx
  on public.financial_connect_accounts (status);

alter table public.financial_connect_accounts enable row level security;

drop policy if exists financial_connect_accounts_select_member on public.financial_connect_accounts;
create policy financial_connect_accounts_select_member
on public.financial_connect_accounts
for select
using (
  exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = financial_connect_accounts.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists financial_connect_accounts_manage_manager on public.financial_connect_accounts;
create policy financial_connect_accounts_manage_manager
on public.financial_connect_accounts
for all
using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

-- ---------------------------------------------------------------------------
-- FO module settings / feature flag overrides (org-scoped)
-- ---------------------------------------------------------------------------

create table if not exists public.financial_module_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  foundation_enabled boolean not null default true,
  -- Operational flags remain false until later slices are authorized + enabled.
  charges_enabled boolean not null default false,
  payments_enabled boolean not null default false,
  late_fees_enabled boolean not null default false,
  vendor_invoices_enabled boolean not null default false,
  vendor_payments_enabled boolean not null default false,
  reports_enabled boolean not null default false,
  stripe_payment_execution_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id)
);

alter table public.financial_module_settings enable row level security;

drop policy if exists financial_module_settings_select_member on public.financial_module_settings;
create policy financial_module_settings_select_member
on public.financial_module_settings
for select
using (
  exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = financial_module_settings.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists financial_module_settings_manage_manager on public.financial_module_settings;
create policy financial_module_settings_manage_manager
on public.financial_module_settings
for all
using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));
