-- COM-001 Slice D — offboarding · CS 30/90 motions · renewal alert hooks.
-- No surprise purge on cancel; BILL-001 remains money rail; OPS Slice A for outcomes.

-- ---------------------------------------------------------------------------
-- 0) Extend organizations.commercial_status for Cancelled / Archived
-- ---------------------------------------------------------------------------
alter table public.organizations
  drop constraint if exists organizations_commercial_status_check;

alter table public.organizations
  add constraint organizations_commercial_status_check
  check (
    commercial_status is null
    or commercial_status in (
      'trial',
      'pending_setup',
      'active',
      'cancelled',
      'archived'
    )
  );

comment on column public.organizations.commercial_status is
  'COM commercial posture: trial | pending_setup | active | cancelled | archived (COM-001 Slice D).';

-- ---------------------------------------------------------------------------
-- 1) Offboarding state machine (org-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_offboarding_states (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  stage text not null default 'none' check (
    stage in (
      'none',
      'cancel_confirmed',
      'retention_offer',
      'final_billing',
      'export_window',
      'frozen',
      'archive_scheduled',
      'archived',
      'recovered'
    )
  ),
  cancel_confirmed_at timestamptz,
  effective_cancel_at timestamptz,
  cancel_reason text,
  retention_offer_status text not null default 'none' check (
    retention_offer_status in ('none', 'offered', 'accepted', 'declined', 'skipped')
  ),
  retention_offer_notes text,
  final_billing_coordinated_at timestamptz,
  billing_cancel_mode text check (
    billing_cancel_mode is null
    or billing_cancel_mode in ('cancel_at_period_end', 'immediate_mirror', 'portal_required')
  ),
  export_window_ends_at timestamptz,
  export_ready_at timestamptz,
  export_inventory jsonb not null default '{}'::jsonb,
  frozen_at timestamptz,
  archive_scheduled_at timestamptz,
  archived_at timestamptz,
  deletion_scheduled_at timestamptz,
  recovery_window_ends_at timestamptz,
  legal_hold boolean not null default false,
  purge_allowed boolean not null default false,
  recovered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.commercial_offboarding_states is
  'COM-001 Slice D offboarding sequence. Cancel never sets purge_allowed immediately.';

create index if not exists commercial_offboarding_states_stage_idx
  on public.commercial_offboarding_states (stage, updated_at desc);

drop trigger if exists trg_commercial_offboarding_states_updated_at
  on public.commercial_offboarding_states;
create trigger trg_commercial_offboarding_states_updated_at
before update on public.commercial_offboarding_states
for each row
execute function public.set_updated_at();

alter table public.commercial_offboarding_states enable row level security;

drop policy if exists commercial_offboarding_states_select_member
  on public.commercial_offboarding_states;
create policy commercial_offboarding_states_select_member
  on public.commercial_offboarding_states
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_offboarding_states.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 2) CS motions (30 / 90 day)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_cs_motions (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  motion_key text not null check (motion_key in ('day_30', 'day_90')),
  status text not null default 'scheduled' check (
    status in ('scheduled', 'due', 'completed', 'skipped')
  ),
  due_at timestamptz not null,
  completed_at timestamptz,
  due_emitted_at timestamptz,
  health_band_at_due text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, motion_key)
);

comment on table public.commercial_cs_motions is
  'COM-001 Slice D CS 30/90 motion schedule. Idempotent due emission.';

create index if not exists commercial_cs_motions_due_idx
  on public.commercial_cs_motions (status, due_at);

drop trigger if exists trg_commercial_cs_motions_updated_at on public.commercial_cs_motions;
create trigger trg_commercial_cs_motions_updated_at
before update on public.commercial_cs_motions
for each row
execute function public.set_updated_at();

alter table public.commercial_cs_motions enable row level security;

drop policy if exists commercial_cs_motions_select_member on public.commercial_cs_motions;
create policy commercial_cs_motions_select_member
  on public.commercial_cs_motions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_cs_motions.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 3) Renewal alert hooks (secret-free due keys)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_renewal_alerts (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  milestone_key text not null check (
    milestone_key in ('t90', 't60', 't30', 't14', 't7')
  ),
  period_end_at timestamptz not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (
    status in ('pending', 'due', 'emitted', 'dismissed')
  ),
  emitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, milestone_key, period_end_at)
);

comment on table public.commercial_renewal_alerts is
  'COM-001 Slice D renewal alert hooks keyed by BILL period end. Secret-free.';

create index if not exists commercial_renewal_alerts_due_idx
  on public.commercial_renewal_alerts (status, due_at);

drop trigger if exists trg_commercial_renewal_alerts_updated_at
  on public.commercial_renewal_alerts;
create trigger trg_commercial_renewal_alerts_updated_at
before update on public.commercial_renewal_alerts
for each row
execute function public.set_updated_at();

alter table public.commercial_renewal_alerts enable row level security;

drop policy if exists commercial_renewal_alerts_select_member
  on public.commercial_renewal_alerts;
create policy commercial_renewal_alerts_select_member
  on public.commercial_renewal_alerts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_renewal_alerts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
