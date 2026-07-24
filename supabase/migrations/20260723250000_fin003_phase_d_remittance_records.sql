-- FIN-003 Phase D: transfer remittance records (read/notify projections; no money movement)

create table if not exists public.payout_remittance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  transfer_intent_id uuid not null references public.transfer_intents (id) on delete cascade,
  payout_run_id uuid not null references public.payout_runs (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'usd',
  external_transfer_id text,
  status text not null default 'issued' check (status in ('issued', 'void')),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (transfer_intent_id)
);

create index if not exists payout_remittance_records_owner_idx
  on public.payout_remittance_records (organization_id, owner_user_id, created_at desc);

create index if not exists payout_remittance_records_run_idx
  on public.payout_remittance_records (payout_run_id);

alter table public.payout_remittance_records enable row level security;

create policy payout_remittance_records_select on public.payout_remittance_records for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:read')
);

-- Mutations via service role only (OwnerPayoutService).
