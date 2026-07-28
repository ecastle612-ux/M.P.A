-- COM-001 Slice C — health score · feature discovery · communication timeline.
-- Org-scoped commercial success surfaces; secret-free; OPS Slice A bus for outcomes.

-- ---------------------------------------------------------------------------
-- 1) Customer health score (org-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_health_scores (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  score integer not null default 100 check (score >= 0 and score <= 100),
  band text not null default 'healthy' check (
    band in ('healthy', 'needs_attention', 'at_risk', 'critical')
  ),
  drivers jsonb not null default '[]'::jsonb,
  factor_breakdown jsonb not null default '{}'::jsonb,
  cs_cadence_key text not null default 'standard_30_90',
  computed_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.commercial_health_scores is
  'COM-001 Slice C org health score (0–100) with Healthy→Critical bands. Secret-free drivers.';

create index if not exists commercial_health_scores_band_idx
  on public.commercial_health_scores (band, score asc, updated_at desc);

drop trigger if exists trg_commercial_health_scores_updated_at on public.commercial_health_scores;
create trigger trg_commercial_health_scores_updated_at
before update on public.commercial_health_scores
for each row
execute function public.set_updated_at();

alter table public.commercial_health_scores enable row level security;

drop policy if exists commercial_health_scores_select_member on public.commercial_health_scores;
create policy commercial_health_scores_select_member
  on public.commercial_health_scores
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_health_scores.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Feature discovery memory (org-scoped, entitlement-safe evaluation in app)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_feature_discovery_states (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  discovery_key text not null,
  status text not null default 'open' check (
    status in ('open', 'impressed', 'accepted', 'dismissed', 'snoozed')
  ),
  impressed_count integer not null default 0 check (impressed_count >= 0),
  last_impressed_at timestamptz,
  accepted_at timestamptz,
  dismissed_at timestamptz,
  snoozed_until timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, discovery_key)
);

comment on table public.commercial_feature_discovery_states is
  'COM-001 Slice C feature discovery dismiss/snooze/accept memory. Entitlement checks in application.';

create index if not exists commercial_feature_discovery_states_org_status_idx
  on public.commercial_feature_discovery_states (organization_id, status);

drop trigger if exists trg_commercial_feature_discovery_states_updated_at
  on public.commercial_feature_discovery_states;
create trigger trg_commercial_feature_discovery_states_updated_at
before update on public.commercial_feature_discovery_states
for each row
execute function public.set_updated_at();

alter table public.commercial_feature_discovery_states enable row level security;

drop policy if exists commercial_feature_discovery_states_select_member
  on public.commercial_feature_discovery_states;
create policy commercial_feature_discovery_states_select_member
  on public.commercial_feature_discovery_states
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_feature_discovery_states.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 3) Customer communication timeline (commercial/success — distinct from OPS activity)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_communication_timeline (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  opportunity_id uuid references public.commercial_opportunities (id) on delete set null,
  occurred_at timestamptz not null default timezone('utc', now()),
  channel text not null check (
    channel in ('email', 'in_app', 'sms', 'call_note', 'push', 'system')
  ),
  entry_type text not null,
  template_key text not null,
  direction text not null check (direction in ('outbound', 'inbound_note')),
  actor_type text not null check (actor_type in ('system', 'cs_user', 'ai')),
  actor_user_id uuid,
  related_object_type text,
  related_object_id text,
  delivery_status text not null default 'n_a' check (
    delivery_status in (
      'queued', 'sent', 'delivered', 'bounced', 'opened', 'clicked', 'n_a'
    )
  ),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint commercial_communication_timeline_org_or_opportunity_chk check (
    organization_id is not null or opportunity_id is not null
  )
);

comment on table public.commercial_communication_timeline is
  'COM-001 Slice C unified commercial/success communication timeline. No credential secrets.';

create index if not exists commercial_communication_timeline_org_occurred_idx
  on public.commercial_communication_timeline (organization_id, occurred_at desc)
  where organization_id is not null;

create index if not exists commercial_communication_timeline_opportunity_occurred_idx
  on public.commercial_communication_timeline (opportunity_id, occurred_at desc)
  where opportunity_id is not null;

alter table public.commercial_communication_timeline enable row level security;

-- Org members can read their org timeline; opportunity-only rows are staff via service role.
drop policy if exists commercial_communication_timeline_select_member
  on public.commercial_communication_timeline;
create policy commercial_communication_timeline_select_member
  on public.commercial_communication_timeline
  for select
  to authenticated
  using (
    organization_id is not null
    and exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_communication_timeline.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
