-- COM-001 Slice A — commercial opportunities, activation ledger, org link.
-- Won does not create organizations; activation → AUTH-001 provision does.

-- ---------------------------------------------------------------------------
-- 1) Opportunities (pipeline)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_opportunities (
  id uuid primary key default gen_random_uuid(),
  stage text not null default 'lead' check (
    stage in (
      'lead',
      'mql',
      'sql',
      'discovery',
      'demo',
      'proposal',
      'negotiation',
      'won',
      'subscription_purchased',
      'organization_created',
      'customer_active',
      'lost'
    )
  ),
  company_name text not null,
  contact_email text not null,
  contact_name text,
  source text not null default 'unknown',
  sales_owner_id uuid references auth.users (id) on delete set null,
  expected_close date,
  probability integer not null default 5 check (probability >= 0 and probability <= 100),
  lost_reason text,
  acquisition_cost_cents integer,
  referral_source text,
  demo_completed_at timestamptz,
  plan_code text,
  organization_type text default 'property_manager',
  implementation_preference text check (
    implementation_preference is null
    or implementation_preference in ('professional', 'ai_guided')
  ),
  organization_id uuid references public.organizations (id) on delete set null,
  external_crm_opportunity_id text,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id)
);

create index if not exists commercial_opportunities_stage_idx
  on public.commercial_opportunities (stage, updated_at desc);

create index if not exists commercial_opportunities_email_idx
  on public.commercial_opportunities (lower(contact_email));

create index if not exists commercial_opportunities_sales_owner_idx
  on public.commercial_opportunities (sales_owner_id);

comment on table public.commercial_opportunities is
  'COM-001 Slice A sales pipeline opportunities. Won does not create orgs.';

comment on column public.commercial_opportunities.organization_id is
  'Set only after AUTH-001 provision from activation (CA-06). Unique when set.';

drop trigger if exists trg_commercial_opportunities_updated_at on public.commercial_opportunities;
create trigger trg_commercial_opportunities_updated_at
before update on public.commercial_opportunities
for each row
execute function public.set_updated_at();

alter table public.commercial_opportunities enable row level security;

-- Platform commercial data: no tenant-member policies. Service role / Master Admin APIs only.

-- ---------------------------------------------------------------------------
-- 2) Activation requests (idempotent COM handoff ledger)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_activation_requests (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  opportunity_id uuid not null references public.commercial_opportunities (id) on delete cascade,
  status text not null check (status in ('pending', 'completed', 'failed')),
  organization_id uuid references public.organizations (id) on delete set null,
  auth_idempotency_key text not null,
  packet jsonb not null default '{}'::jsonb,
  failure_reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists commercial_activation_requests_opportunity_idx
  on public.commercial_activation_requests (opportunity_id, created_at desc);

comment on table public.commercial_activation_requests is
  'COM-001 Slice A activation handoff ledger. Never store passwords or payment secrets.';

comment on column public.commercial_activation_requests.packet is
  'Secret-free activation packet snapshot (ids, plan, emails, preference).';

drop trigger if exists trg_commercial_activation_requests_updated_at on public.commercial_activation_requests;
create trigger trg_commercial_activation_requests_updated_at
before update on public.commercial_activation_requests
for each row
execute function public.set_updated_at();

alter table public.commercial_activation_requests enable row level security;
