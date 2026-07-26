-- OPS-001 Slice A: Event Bus (ADR-005 outbox) + Activity Timeline read model.
-- Extends ADR-005 `event_domain_events` with OPS envelope + dispatch status.
-- No parallel bus. Notification / automation consumers deferred to later slices.

create table if not exists public.event_domain_events (
  event_id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_version integer not null default 1,
  occurred_at timestamptz not null default timezone('utc', now()),
  organization_id uuid references public.organizations (id) on delete cascade,
  actor jsonb not null default '{}'::jsonb,
  subject jsonb not null default '{}'::jsonb,
  correlation_id uuid not null default gen_random_uuid(),
  causation_id uuid,
  payload jsonb not null default '{}'::jsonb,
  visibility text not null default 'ops' check (visibility in ('ops', 'tenant', 'staff_only')),
  sensitivity text not null default 'normal' check (sensitivity in ('normal', 'restricted', 'privileged')),
  dispatch_status text not null default 'pending' check (
    dispatch_status in ('pending', 'processing', 'processed', 'failed', 'dead')
  ),
  attempts integer not null default 0,
  available_at timestamptz not null default timezone('utc', now()),
  claimed_at timestamptz,
  claimed_by text,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists event_domain_events_dispatch_claim_idx
  on public.event_domain_events (dispatch_status, available_at, created_at)
  where dispatch_status in ('pending', 'failed');

create index if not exists event_domain_events_org_occurred_idx
  on public.event_domain_events (organization_id, occurred_at desc);

create index if not exists event_domain_events_type_idx
  on public.event_domain_events (event_type, occurred_at desc);

comment on table public.event_domain_events is
  'OPS-001 / ADR-005 domain event outbox. Single platform bus — do not create parallel outboxes.';

-- Org Activity Timeline (projected read model)
create table if not exists public.ops_activity_timeline (
  entry_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid not null references public.event_domain_events (event_id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null,
  actor_label text not null default 'System',
  summary text not null,
  category text not null default 'ops',
  visibility text not null default 'ops' check (visibility in ('ops', 'tenant', 'staff_only')),
  subject_type text,
  subject_id uuid,
  property_id uuid,
  unit_id uuid,
  href text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, event_id)
);

create index if not exists ops_activity_timeline_org_occurred_idx
  on public.ops_activity_timeline (organization_id, occurred_at desc);

create index if not exists ops_activity_timeline_org_category_idx
  on public.ops_activity_timeline (organization_id, category, occurred_at desc);

create index if not exists ops_activity_timeline_org_subject_idx
  on public.ops_activity_timeline (organization_id, subject_type, subject_id, occurred_at desc)
  where subject_id is not null;

create index if not exists ops_activity_timeline_org_property_idx
  on public.ops_activity_timeline (organization_id, property_id, occurred_at desc)
  where property_id is not null;

comment on table public.ops_activity_timeline is
  'OPS-001 Slice A Activity Timeline read model. Written only by TimelineProjector.';

-- Consumer idempotency receipts (at-least-once dispatch)
create table if not exists public.ops_event_consumer_receipts (
  event_id uuid not null references public.event_domain_events (event_id) on delete cascade,
  consumer_name text not null,
  processed_at timestamptz not null default timezone('utc', now()),
  primary key (event_id, consumer_name)
);

-- Claim batch for dispatcher (SKIP LOCKED)
create or replace function public.ops_claim_domain_events(
  p_limit integer default 25,
  p_claimer text default 'dispatcher'
)
returns setof public.event_domain_events
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimed as (
    select e.event_id
    from public.event_domain_events e
    where e.dispatch_status in ('pending', 'failed')
      and e.available_at <= timezone('utc', now())
      and e.attempts < 8
    order by e.available_at asc, e.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  )
  update public.event_domain_events e
  set
    dispatch_status = 'processing',
    claimed_at = timezone('utc', now()),
    claimed_by = p_claimer,
    attempts = e.attempts + 1
  from claimed
  where e.event_id = claimed.event_id
  returning e.*;
end;
$$;

revoke all on function public.ops_claim_domain_events(integer, text) from public;
grant execute on function public.ops_claim_domain_events(integer, text) to service_role;

-- RLS
alter table public.event_domain_events enable row level security;
alter table public.ops_activity_timeline enable row level security;
alter table public.ops_event_consumer_receipts enable row level security;

drop policy if exists event_domain_events_select_member on public.event_domain_events;
create policy event_domain_events_select_member
on public.event_domain_events
for select
using (
  organization_id is not null
  and exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = event_domain_events.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists event_domain_events_insert_member on public.event_domain_events;
create policy event_domain_events_insert_member
on public.event_domain_events
for insert
with check (
  organization_id is not null
  and exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = event_domain_events.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists ops_activity_timeline_select_member on public.ops_activity_timeline;
create policy ops_activity_timeline_select_member
on public.ops_activity_timeline
for select
using (
  exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = ops_activity_timeline.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

-- Writes to timeline / receipts / dispatch updates: service_role only (bypass RLS)

-- OA-02: legacy maintenance activity + outbox insert in a single Postgres transaction.
-- Used by Slice A pilot emitters (maintenance / vendor-jobs).
create or replace function public.ops_record_maintenance_activity_with_outbox(
  p_organization_id uuid,
  p_work_order_id uuid,
  p_legacy_event_type text,
  p_summary text,
  p_details jsonb,
  p_actor_user_id uuid,
  p_catalog_event_type text,
  p_event_id uuid,
  p_event_version integer,
  p_occurred_at timestamptz,
  p_actor jsonb,
  p_subject jsonb,
  p_correlation_id uuid,
  p_causation_id uuid,
  p_payload jsonb,
  p_visibility text,
  p_sensitivity text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid := coalesce(p_event_id, gen_random_uuid());
begin
  if p_catalog_event_type is null or length(trim(p_catalog_event_type)) = 0 then
    raise exception 'catalog event type is required for same-TX outbox emit';
  end if;

  insert into public.maintenance_activity_events (
    organization_id,
    work_order_id,
    event_type,
    summary,
    details,
    actor_user_id
  ) values (
    p_organization_id,
    p_work_order_id,
    p_legacy_event_type,
    p_summary,
    coalesce(p_details, '{}'::jsonb),
    p_actor_user_id
  );

  insert into public.event_domain_events (
    event_id,
    event_type,
    event_version,
    occurred_at,
    organization_id,
    actor,
    subject,
    correlation_id,
    causation_id,
    payload,
    visibility,
    sensitivity,
    dispatch_status
  ) values (
    v_event_id,
    p_catalog_event_type,
    coalesce(p_event_version, 1),
    coalesce(p_occurred_at, timezone('utc', now())),
    p_organization_id,
    coalesce(p_actor, '{}'::jsonb),
    coalesce(p_subject, '{}'::jsonb),
    coalesce(p_correlation_id, gen_random_uuid()),
    p_causation_id,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_visibility, 'ops'),
    coalesce(p_sensitivity, 'normal'),
    'pending'
  );

  return v_event_id;
end;
$$;

comment on function public.ops_record_maintenance_activity_with_outbox is
  'OPS-001 Slice A OA-02: insert maintenance_activity_events + event_domain_events in one transaction.';

revoke all on function public.ops_record_maintenance_activity_with_outbox(
  uuid, uuid, text, text, jsonb, uuid, text, uuid, integer, timestamptz, jsonb, jsonb, uuid, uuid, jsonb, text, text
) from public;
grant execute on function public.ops_record_maintenance_activity_with_outbox(
  uuid, uuid, text, text, jsonb, uuid, text, uuid, integer, timestamptz, jsonb, jsonb, uuid, uuid, jsonb, text, text
) to authenticated, service_role;
