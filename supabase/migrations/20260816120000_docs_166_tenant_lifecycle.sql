-- docs/166 tenant lifecycle — occupancy, invitation binding, authorization helpers
-- In-repo only. Do not apply to Production from this package.
-- Additive. Does not mutate FIN-OPS money, July, Stripe execution, or M5.

-- ---------------------------------------------------------------------------
-- A. Occupancy on lease_residents
-- ---------------------------------------------------------------------------

alter table public.lease_residents
  add column if not exists pm_resident_id uuid references public.pm_residents (id) on delete set null;

alter table public.lease_residents
  add column if not exists occupancy_status text;

alter table public.lease_residents
  add column if not exists occupy_from date;

alter table public.lease_residents
  add column if not exists occupy_to date;

update public.lease_residents occupancy
set pm_resident_id = profiles.id
from public.pm_residents profiles
where occupancy.pm_resident_id is null
  and occupancy.organization_id = profiles.organization_id
  and lower(coalesce(occupancy.email, '')) = lower(coalesce(profiles.email, ''))
  and coalesce(occupancy.email, '') <> '';

update public.lease_residents occupancy
set
  occupancy_status = coalesce(
    occupancy.occupancy_status,
    case
      when leases.status = 'ended' then 'moved_out'
      else 'occupying'
    end
  ),
  occupy_from = coalesce(occupancy.occupy_from, leases.start_date),
  occupy_to = case
    when occupancy.occupy_to is not null then occupancy.occupy_to
    when leases.status = 'ended' then leases.end_date
    else occupancy.occupy_to
  end
from public.lease_agreements leases
where leases.id = occupancy.lease_id;

alter table public.lease_residents
  alter column occupancy_status set default 'occupying';

alter table public.lease_residents
  alter column occupy_from set default (timezone('utc', now()))::date;

update public.lease_residents
set occupancy_status = 'occupying'
where occupancy_status is null;

update public.lease_residents
set occupy_from = (timezone('utc', now()))::date
where occupy_from is null;

alter table public.lease_residents
  alter column occupancy_status set not null;

alter table public.lease_residents
  alter column occupy_from set not null;

alter table public.lease_residents
  drop constraint if exists lease_residents_occupancy_status_check;

alter table public.lease_residents
  add constraint lease_residents_occupancy_status_check
  check (occupancy_status = any (array['scheduled'::text, 'occupying'::text, 'moved_out'::text]));

create index if not exists lease_residents_pm_resident_idx
  on public.lease_residents (organization_id, pm_resident_id);

create index if not exists lease_residents_occupancy_user_idx
  on public.lease_residents (organization_id, user_id, occupancy_status);

-- ---------------------------------------------------------------------------
-- B. Tenant invitation binding (docs/135 transport; server-owned occupancy)
-- ---------------------------------------------------------------------------

create table if not exists public.organization_invitation_tenant_bindings (
  invitation_id uuid primary key references public.organization_invitations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete restrict,
  unit_id uuid not null references public.property_units (id) on delete restrict,
  lease_id uuid not null references public.lease_agreements (id) on delete restrict,
  resident_id uuid not null references public.pm_residents (id) on delete restrict,
  lease_resident_id uuid not null references public.lease_residents (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists organization_invitation_tenant_bindings_org_idx
  on public.organization_invitation_tenant_bindings (organization_id, lease_id);

alter table public.organization_invitation_tenant_bindings enable row level security;

drop policy if exists invitation_tenant_bindings_select_authorized
  on public.organization_invitation_tenant_bindings;
create policy invitation_tenant_bindings_select_authorized
on public.organization_invitation_tenant_bindings
for select
using (public.is_resident_writer(organization_id));

drop policy if exists invitation_tenant_bindings_write_authorized
  on public.organization_invitation_tenant_bindings;
create policy invitation_tenant_bindings_write_authorized
on public.organization_invitation_tenant_bindings
for all
using (public.is_resident_writer(organization_id))
with check (public.is_resident_writer(organization_id));

-- Invitees have no insert policy. Acceptance mutations use trusted service_role.

-- ---------------------------------------------------------------------------
-- C. Occupancy helpers
-- ---------------------------------------------------------------------------

create or replace function public.utc_today()
returns date
language sql
stable
set search_path = public
as $$
  select (timezone('utc', now()))::date;
$$;

create or replace function public.member_is_tenant_only(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and memberships.roles && array['tenant']::text[]
      and memberships.roles <@ array['tenant']::text[]
  );
$$;

create or replace function public.tenant_occupancy_is_current(
  occupy_from date,
  occupy_to date,
  occupancy_status text
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    occupancy_status in ('occupying', 'scheduled')
    and occupy_from <= public.utc_today()
    and (occupy_to is null or occupy_to >= public.utc_today());
$$;

create or replace function public.tenant_occupancy_is_historical(
  occupy_from date,
  occupy_to date
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    occupy_from <= public.utc_today()
    and occupy_to is not null
    and occupy_to < public.utc_today();
$$;

create or replace function public.tenant_occupies_lease(target_org_id uuid, target_lease_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents occupancy
    where occupancy.organization_id = target_org_id
      and occupancy.lease_id = target_lease_id
      and occupancy.user_id = auth.uid()
      and public.tenant_occupancy_is_current(
        occupancy.occupy_from,
        occupancy.occupy_to,
        occupancy.occupancy_status
      )
  );
$$;

create or replace function public.tenant_occupied_lease(target_org_id uuid, target_lease_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents occupancy
    where occupancy.organization_id = target_org_id
      and occupancy.lease_id = target_lease_id
      and occupancy.user_id = auth.uid()
      and public.tenant_occupancy_is_historical(occupancy.occupy_from, occupancy.occupy_to)
  );
$$;

create or replace function public.tenant_finance_charge_date(
  period_start date,
  due_at date,
  created_at timestamptz
)
returns date
language sql
immutable
set search_path = public
as $$
  select coalesce(period_start, due_at, (timezone('utc', created_at))::date);
$$;

create or replace function public.finance_resident_can_select_charge(
  target_org_id uuid,
  target_lease_id uuid,
  period_start date,
  due_at date,
  created_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents occupancy
    where occupancy.organization_id = target_org_id
      and occupancy.lease_id = target_lease_id
      and occupancy.user_id = auth.uid()
      and (
        public.tenant_occupancy_is_current(
          occupancy.occupy_from,
          occupancy.occupy_to,
          occupancy.occupancy_status
        )
        or (
          public.tenant_occupancy_is_historical(occupancy.occupy_from, occupancy.occupy_to)
          and public.tenant_finance_charge_date(period_start, due_at, created_at)
            between occupancy.occupy_from and occupancy.occupy_to
        )
      )
  );
$$;

-- Occupying-only. Historical money uses finance_resident_can_select_charge.
create or replace function public.finance_resident_owns_lease(
  target_org_id uuid,
  target_lease_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.tenant_occupies_lease(target_org_id, target_lease_id);
$$;

create or replace function public.is_lease_resident(target_lease_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents occupancy
    where occupancy.lease_id = target_lease_id
      and occupancy.user_id = auth.uid()
      and public.tenant_occupancy_is_current(
        occupancy.occupy_from,
        occupancy.occupy_to,
        occupancy.occupancy_status
      )
  );
$$;

create or replace function public.can_access_tenant_conversation(
  target_org_id uuid,
  target_lease_id uuid,
  target_tenant_account_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_pm_comms_staff(target_org_id)
    or (
      exists (
        select 1
        from public.pm_residents residents
        where residents.id = target_tenant_account_id
          and residents.organization_id = target_org_id
          and residents.user_id = auth.uid()
      )
      and (
        public.tenant_occupies_lease(target_org_id, target_lease_id)
        or public.tenant_occupied_lease(target_org_id, target_lease_id)
      )
    );
$$;

create or replace function public.tenant_can_write_conversation(
  target_org_id uuid,
  target_lease_id uuid,
  target_tenant_account_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.pm_residents residents
      where residents.id = target_tenant_account_id
        and residents.organization_id = target_org_id
        and residents.user_id = auth.uid()
    )
    and public.tenant_occupies_lease(target_org_id, target_lease_id);
$$;

create or replace function public.tenant_can_select_document(
  target_org_id uuid,
  entity_type text,
  entity_id uuid,
  created_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents occupancy
    where occupancy.organization_id = target_org_id
      and occupancy.user_id = auth.uid()
      and (
        (
          entity_type = 'lease'
          and occupancy.lease_id = entity_id
        )
        or (
          entity_type = 'resident'
          and occupancy.pm_resident_id = entity_id
        )
      )
      and (
        public.tenant_occupancy_is_current(
          occupancy.occupy_from,
          occupancy.occupy_to,
          occupancy.occupancy_status
        )
        or (
          public.tenant_occupancy_is_historical(occupancy.occupy_from, occupancy.occupy_to)
          and (timezone('utc', created_at))::date <= occupancy.occupy_to
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- D. RLS — close tenant org-wide leaks; occupancy-date FIN-OPS
-- ---------------------------------------------------------------------------

drop policy if exists pm_residents_select_member on public.pm_residents;
create policy pm_residents_select_member
on public.pm_residents
for select
using (
  user_id = auth.uid()
  or (
    public.is_org_member(organization_id)
    and not public.member_is_tenant_only(organization_id)
  )
);

drop policy if exists lease_agreements_select_member on public.lease_agreements;
create policy lease_agreements_select_member
on public.lease_agreements
for select
using (
  public.tenant_occupies_lease(organization_id, id)
  or public.tenant_occupied_lease(organization_id, id)
  or (
    public.is_org_member(organization_id)
    and not public.member_is_tenant_only(organization_id)
  )
);

drop policy if exists lease_residents_select on public.lease_residents;
create policy lease_residents_select
on public.lease_residents
for select
using (
  user_id = auth.uid()
  or (
    public.is_org_member(organization_id)
    and not public.member_is_tenant_only(organization_id)
  )
);

drop policy if exists document_documents_select_member on public.document_documents;
create policy document_documents_select_member
on public.document_documents
for select
using (
  public.tenant_can_select_document(organization_id, entity_type, entity_id, created_at)
  or (
    public.is_org_member(organization_id)
    and not public.member_is_tenant_only(organization_id)
  )
);

drop policy if exists financial_charges_select_resident on public.financial_charges;
create policy financial_charges_select_resident
on public.financial_charges
for select
using (
  public.finance_resident_can_select_charge(
    organization_id,
    lease_id,
    period_start,
    due_at,
    created_at
  )
);

drop policy if exists financial_payments_select_resident on public.financial_payments;
create policy financial_payments_select_resident
on public.financial_payments
for select
using (
  public.finance_resident_can_select_charge(
    organization_id,
    lease_id,
    null,
    null,
    created_at
  )
);

drop policy if exists financial_receipts_select_resident on public.financial_receipts;
create policy financial_receipts_select_resident
on public.financial_receipts
for select
using (
  public.finance_resident_can_select_charge(
    organization_id,
    lease_id,
    null,
    null,
    issued_at
  )
);

drop policy if exists financial_charge_schedules_select_resident on public.financial_charge_schedules;
create policy financial_charge_schedules_select_resident
on public.financial_charge_schedules
for select
using (public.tenant_occupies_lease(organization_id, lease_id));

drop policy if exists financial_ledger_entries_select_resident on public.financial_ledger_entries;
create policy financial_ledger_entries_select_resident
on public.financial_ledger_entries
for select
using (
  lease_id is not null
  and public.finance_resident_can_select_charge(
    organization_id,
    lease_id,
    null,
    null,
    created_at
  )
  and entry_type in ('charge', 'payment', 'allocation')
);

drop policy if exists financial_payment_allocations_select_resident on public.financial_payment_allocations;
create policy financial_payment_allocations_select_resident
on public.financial_payment_allocations
for select
using (
  exists (
    select 1
    from public.financial_payments payments
    where payments.id = financial_payment_allocations.payment_id
      and public.finance_resident_can_select_charge(
        payments.organization_id,
        payments.lease_id,
        null,
        null,
        payments.created_at
      )
  )
);

drop policy if exists comms_thread_messages_insert on public.comms_conversation_messages;
create policy comms_thread_messages_insert
on public.comms_conversation_messages
for insert
with check (
  exists (
    select 1
    from public.comms_conversations conversations
    where conversations.id = conversation_id
      and (
        public.is_pm_comms_staff(conversations.organization_id)
        or public.tenant_can_write_conversation(
          conversations.organization_id,
          conversations.lease_id,
          conversations.tenant_account_id
        )
      )
  )
);

drop policy if exists maintenance_work_orders_insert_resident on public.maintenance_work_orders;
create policy maintenance_work_orders_insert_resident
on public.maintenance_work_orders
for insert
with check (
  requested_by_user_id = auth.uid()
  and exists (
    select 1
    from public.pm_residents residents
    join public.lease_residents occupancy
      on occupancy.pm_resident_id = residents.id
     and occupancy.organization_id = residents.organization_id
    where residents.id = resident_id
      and residents.organization_id = organization_id
      and residents.user_id = auth.uid()
      and occupancy.user_id = auth.uid()
      and public.tenant_occupancy_is_current(
        occupancy.occupy_from,
        occupancy.occupy_to,
        occupancy.occupancy_status
      )
      and occupancy.lease_id in (
        select leases.id
        from public.lease_agreements leases
        where leases.organization_id = organization_id
          and leases.property_id = maintenance_work_orders.property_id
          and (leases.unit_id is null or leases.unit_id = maintenance_work_orders.unit_id)
      )
  )
);

revoke all on function public.utc_today() from public, anon;
revoke all on function public.member_is_tenant_only(uuid) from public, anon;
revoke all on function public.tenant_occupancy_is_current(date, date, text) from public, anon;
revoke all on function public.tenant_occupancy_is_historical(date, date) from public, anon;
revoke all on function public.tenant_occupies_lease(uuid, uuid) from public, anon;
revoke all on function public.tenant_occupied_lease(uuid, uuid) from public, anon;
revoke all on function public.tenant_finance_charge_date(date, date, timestamptz) from public, anon;
revoke all on function public.finance_resident_can_select_charge(uuid, uuid, date, date, timestamptz) from public, anon;
revoke all on function public.tenant_can_write_conversation(uuid, uuid, uuid) from public, anon;
revoke all on function public.tenant_can_select_document(uuid, text, uuid, timestamptz) from public, anon;

grant execute on function public.utc_today() to authenticated;
grant execute on function public.member_is_tenant_only(uuid) to authenticated;
grant execute on function public.tenant_occupancy_is_current(date, date, text) to authenticated;
grant execute on function public.tenant_occupancy_is_historical(date, date) to authenticated;
grant execute on function public.tenant_occupies_lease(uuid, uuid) to authenticated;
grant execute on function public.tenant_occupied_lease(uuid, uuid) to authenticated;
grant execute on function public.tenant_finance_charge_date(date, date, timestamptz) to authenticated;
grant execute on function public.finance_resident_can_select_charge(uuid, uuid, date, date, timestamptz) to authenticated;
grant execute on function public.tenant_can_write_conversation(uuid, uuid, uuid) to authenticated;
grant execute on function public.tenant_can_select_document(uuid, text, uuid, timestamptz) to authenticated;
grant execute on function public.finance_resident_owns_lease(uuid, uuid) to authenticated;
grant execute on function public.is_lease_resident(uuid) to authenticated;
grant execute on function public.can_access_tenant_conversation(uuid, uuid, uuid) to authenticated;
