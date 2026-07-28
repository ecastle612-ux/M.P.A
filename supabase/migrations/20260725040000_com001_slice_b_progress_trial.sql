-- COM-001 Slice B — implementation progress score + trial lifecycle state.
-- Score 0–100% milestone ladder; trial reminders/grace (BILL-001 convert remains money rail).

-- ---------------------------------------------------------------------------
-- 1) Implementation progress (org-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_implementation_progress (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  score integer not null default 0 check (score >= 0 and score <= 100),
  highest_milestone text not null default 'none' check (
    highest_milestone in (
      'none',
      'purchased',
      'organization_created',
      'stripe_connected',
      'properties_imported',
      'units_imported',
      'tenants_imported',
      'team_invited',
      'production_ready'
    )
  ),
  milestones jsonb not null default '{}'::jsonb,
  next_step text,
  blockers jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.commercial_implementation_progress is
  'COM-001 Slice B org implementation score (0–100%). Secret-free milestone snapshot.';

create index if not exists commercial_implementation_progress_score_idx
  on public.commercial_implementation_progress (score desc, updated_at desc);

drop trigger if exists trg_commercial_implementation_progress_updated_at
  on public.commercial_implementation_progress;
create trigger trg_commercial_implementation_progress_updated_at
before update on public.commercial_implementation_progress
for each row
execute function public.set_updated_at();

alter table public.commercial_implementation_progress enable row level security;

-- Org members can read their own progress; writes via service role / server APIs.
drop policy if exists commercial_implementation_progress_select_member
  on public.commercial_implementation_progress;
create policy commercial_implementation_progress_select_member
  on public.commercial_implementation_progress
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_implementation_progress.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Trial lifecycle state (org-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_trial_states (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  status text not null default 'not_trial' check (
    status in (
      'not_trial',
      'trial_active',
      'trial_grace',
      'converted',
      'expired_cancelled'
    )
  ),
  clock_started_at timestamptz,
  trial_ends_at timestamptz,
  grace_ends_at timestamptz,
  reminders_emitted jsonb not null default '{}'::jsonb,
  converted_at timestamptz,
  watermark_policy text not null default 'pm_ui_badge' check (
    watermark_policy in ('pm_ui_badge', 'none')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.commercial_trial_states is
  'COM-001 Slice B trial lifecycle. BILL-001 remains convert rail; no payment secrets.';

create index if not exists commercial_trial_states_status_idx
  on public.commercial_trial_states (status, trial_ends_at);

drop trigger if exists trg_commercial_trial_states_updated_at on public.commercial_trial_states;
create trigger trg_commercial_trial_states_updated_at
before update on public.commercial_trial_states
for each row
execute function public.set_updated_at();

alter table public.commercial_trial_states enable row level security;

drop policy if exists commercial_trial_states_select_member on public.commercial_trial_states;
create policy commercial_trial_states_select_member
  on public.commercial_trial_states
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_trial_states.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
