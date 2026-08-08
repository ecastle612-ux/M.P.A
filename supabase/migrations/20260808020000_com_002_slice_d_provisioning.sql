-- COM-002 Slice D: automatic provisioning jobs + saas customers.
-- Relaxes Slice C hard locks so completed purchases may bind org/user.

alter table public.saas_checkout_sessions
  drop constraint if exists saas_checkout_sessions_provisioned_check;

alter table public.saas_checkout_sessions
  drop constraint if exists saas_checkout_no_org_yet;

alter table public.saas_checkout_sessions
  drop constraint if exists saas_checkout_no_user_yet;

-- Allow created_by to be set at claim time for provisioned orgs (service role creates with placeholder).
-- Keep NOT NULL: provisioner creates auth user before org insert.

create table if not exists public.saas_customers (
  id uuid primary key default gen_random_uuid(),
  stripe_customer_id text not null unique,
  email text not null,
  checkout_session_id text not null,
  organization_id uuid references public.organizations (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saas_customers_email_idx on public.saas_customers (lower(email));
create index if not exists saas_customers_checkout_idx on public.saas_customers (checkout_session_id);

create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  checkout_session_id text not null unique,
  idempotency_key text not null unique,
  checkpoint text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  catalog_offer_id text not null,
  product_sku text not null,
  plan_tier text not null,
  billing_cycle text not null,
  owner_email text not null,
  owner_user_id uuid references auth.users (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  organization_name text,
  bind_token_hash text,
  bind_expires_at timestamptz,
  attempt_count integer not null default 0,
  last_error text,
  audit jsonb not null default '[]'::jsonb,
  emails_sent jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provisioning_jobs_checkpoint_idx
  on public.provisioning_jobs (checkpoint);

alter table public.saas_customers enable row level security;
alter table public.provisioning_jobs enable row level security;

drop policy if exists saas_customers_operator_select on public.saas_customers;
create policy saas_customers_operator_select
  on public.saas_customers for select to authenticated
  using (
    exists (
      select 1 from public.platform_operators po
      where po.user_id = auth.uid() and po.status = 'active'
    )
  );

drop policy if exists provisioning_jobs_operator_select on public.provisioning_jobs;
create policy provisioning_jobs_operator_select
  on public.provisioning_jobs for select to authenticated
  using (
    exists (
      select 1 from public.platform_operators po
      where po.user_id = auth.uid() and po.status = 'active'
    )
  );
