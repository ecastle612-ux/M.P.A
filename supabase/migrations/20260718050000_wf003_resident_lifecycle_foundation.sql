-- WF-003: Resident lifecycle statuses, checklist metadata, and audit events

alter table public.tenants
  add column if not exists lifecycle_status text not null default 'awaiting_move_in'
  check (
    lifecycle_status in (
      'awaiting_move_in',
      'awaiting_signature',
      'active',
      'notice_given',
      'moving_out',
      'former'
    )
  );

create index if not exists tenants_org_lifecycle_status_idx
  on public.tenants (organization_id, lifecycle_status)
  where deleted_at is null;

-- Backfill from existing CRM status
update public.tenants
set lifecycle_status = case
  when status = 'archived' or status = 'inactive' then 'former'
  when move_out_date is not null and move_out_date <= current_date then 'former'
  when move_in_date is not null and move_in_date <= current_date then 'active'
  else 'awaiting_move_in'
end
where lifecycle_status = 'awaiting_move_in';

create table if not exists public.resident_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tenant_id uuid not null,
  lease_id uuid,
  event_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint resident_lifecycle_events_tenant_fk
    foreign key (tenant_id, organization_id)
    references public.tenants (id, organization_id)
    on delete cascade
);

create index if not exists resident_lifecycle_events_org_tenant_idx
  on public.resident_lifecycle_events (organization_id, tenant_id, created_at desc);

alter table public.resident_lifecycle_events enable row level security;

drop policy if exists resident_lifecycle_events_select on public.resident_lifecycle_events;
create policy resident_lifecycle_events_select
on public.resident_lifecycle_events for select
using (public.has_org_capability(organization_id, 'tenant:read'));

drop policy if exists resident_lifecycle_events_insert on public.resident_lifecycle_events;
create policy resident_lifecycle_events_insert
on public.resident_lifecycle_events for insert
with check (
  public.has_org_capability(organization_id, 'tenant:update')
  or public.has_org_capability(organization_id, 'tenant:create')
  or public.has_org_capability(organization_id, 'lease:update')
);
