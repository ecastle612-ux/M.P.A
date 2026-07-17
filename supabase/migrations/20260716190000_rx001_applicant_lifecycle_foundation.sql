-- RX-001 foundation: applicant lifecycle, document vault, screening & signature stubs.

-- ---------------------------------------------------------------------------
-- Applicants
-- ---------------------------------------------------------------------------

create table if not exists public.applicants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  application_number text not null,
  application_group_id uuid not null default gen_random_uuid(),
  is_primary boolean not null default true,
  property_id uuid references public.properties (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  assigned_pm_id uuid references auth.users (id) on delete set null,
  tenant_id uuid references public.tenants (id) on delete set null,
  status text not null default 'draft' check (
    status in (
      'draft',
      'submitted',
      'awaiting_documents',
      'screening_in_progress',
      'pending_review',
      'approved',
      'declined',
      'withdrawn',
      'converted_to_resident'
    )
  ),
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text not null,
  phone text,
  date_of_birth date,
  planned_move_in_date date,
  profile jsonb not null default '{}'::jsonb,
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  approved_at timestamptz,
  declined_at timestamptz,
  converted_at timestamptz,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, application_number)
);

create index if not exists applicants_org_status_idx
  on public.applicants (organization_id, status)
  where deleted_at is null;

create index if not exists applicants_org_group_idx
  on public.applicants (organization_id, application_group_id)
  where deleted_at is null;

create index if not exists applicants_org_property_idx
  on public.applicants (organization_id, property_id)
  where deleted_at is null;

create index if not exists applicants_org_unit_idx
  on public.applicants (organization_id, unit_id)
  where deleted_at is null;

create index if not exists applicants_org_move_in_idx
  on public.applicants (organization_id, planned_move_in_date)
  where deleted_at is null and status = 'approved';

create index if not exists applicants_org_tenant_idx
  on public.applicants (organization_id, tenant_id)
  where deleted_at is null;

create index if not exists applicants_org_number_idx
  on public.applicants (organization_id, application_number)
  where deleted_at is null;

drop trigger if exists trg_applicants_updated_at on public.applicants;
create trigger trg_applicants_updated_at
before update on public.applicants
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Applicant notes & tasks
-- ---------------------------------------------------------------------------

create table if not exists public.applicant_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  applicant_id uuid not null,
  body text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint applicant_notes_applicant_fk
    foreign key (applicant_id, organization_id)
    references public.applicants (id, organization_id)
    on delete cascade
);

create table if not exists public.applicant_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  applicant_id uuid not null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  due_date date,
  assigned_to uuid references auth.users (id) on delete set null,
  completed_at timestamptz,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint applicant_tasks_applicant_fk
    foreign key (applicant_id, organization_id)
    references public.applicants (id, organization_id)
    on delete cascade
);

create index if not exists applicant_notes_org_applicant_idx
  on public.applicant_notes (organization_id, applicant_id, created_at desc);

create index if not exists applicant_tasks_org_applicant_idx
  on public.applicant_tasks (organization_id, applicant_id, status)
  where status = 'open';

drop trigger if exists trg_applicant_tasks_updated_at on public.applicant_tasks;
create trigger trg_applicant_tasks_updated_at
before update on public.applicant_tasks
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Applicant timeline events
-- ---------------------------------------------------------------------------

create table if not exists public.applicant_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  applicant_id uuid not null,
  event_type text not null check (
    event_type in (
      'application_created',
      'submitted',
      'documents_requested',
      'documents_received',
      'screening_started',
      'screening_completed',
      'pending_review',
      'approved',
      'declined',
      'withdrawn',
      'signature_requested',
      'signature_completed',
      'converted_to_resident',
      'note_added',
      'task_completed',
      'status_changed',
      'assignment_changed'
    )
  ),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint applicant_events_applicant_fk
    foreign key (applicant_id, organization_id)
    references public.applicants (id, organization_id)
    on delete cascade
);

create index if not exists applicant_events_org_applicant_idx
  on public.applicant_events (organization_id, applicant_id, created_at desc);

create index if not exists applicant_events_org_type_idx
  on public.applicant_events (organization_id, event_type, created_at desc);

-- ---------------------------------------------------------------------------
-- Polymorphic document vault
-- ---------------------------------------------------------------------------

create table if not exists public.vault_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null check (
    entity_type in ('applicant', 'tenant', 'lease', 'property', 'unit', 'vendor', 'maintenance')
  ),
  entity_id uuid not null,
  document_type text not null,
  title text not null,
  file_url text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists vault_documents_org_entity_idx
  on public.vault_documents (organization_id, entity_type, entity_id)
  where deleted_at is null;

create index if not exists vault_documents_org_type_idx
  on public.vault_documents (organization_id, document_type)
  where deleted_at is null;

drop trigger if exists trg_vault_documents_updated_at on public.vault_documents;
create trigger trg_vault_documents_updated_at
before update on public.vault_documents
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Screening cases (provider abstraction stub)
-- ---------------------------------------------------------------------------

create table if not exists public.screening_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  applicant_id uuid not null,
  case_number text not null,
  provider text not null default 'noop',
  status text not null default 'pending' check (
    status in ('pending', 'in_progress', 'completed', 'failed', 'cancelled')
  ),
  external_reference text,
  result_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, case_number),
  constraint screening_cases_applicant_fk
    foreign key (applicant_id, organization_id)
    references public.applicants (id, organization_id)
    on delete cascade
);

create index if not exists screening_cases_org_applicant_idx
  on public.screening_cases (organization_id, applicant_id);
create index if not exists screening_cases_org_status_idx
  on public.screening_cases (organization_id, status);

drop trigger if exists trg_screening_cases_updated_at on public.screening_cases;
create trigger trg_screening_cases_updated_at
before update on public.screening_cases
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Signature requests (provider abstraction stub)
-- ---------------------------------------------------------------------------

create table if not exists public.signature_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  applicant_id uuid not null,
  request_number text not null,
  provider text not null default 'noop',
  request_type text not null default 'lease_agreement' check (
    request_type in ('lease_agreement', 'application_consent', 'addendum', 'other')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'viewed', 'signed', 'declined', 'expired', 'cancelled')
  ),
  external_reference text,
  signed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, request_number),
  constraint signature_requests_applicant_fk
    foreign key (applicant_id, organization_id)
    references public.applicants (id, organization_id)
    on delete cascade
);

create index if not exists signature_requests_org_applicant_idx
  on public.signature_requests (organization_id, applicant_id);
create index if not exists signature_requests_org_status_idx
  on public.signature_requests (organization_id, status);

drop trigger if exists trg_signature_requests_updated_at on public.signature_requests;
create trigger trg_signature_requests_updated_at
before update on public.signature_requests
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('applicant:create', 'applicant', 'Create applicants'),
  ('applicant:read', 'applicant', 'Read applicants'),
  ('applicant:update', 'applicant', 'Update applicants'),
  ('applicant:archive', 'applicant', 'Archive and restore applicants'),
  ('applicant:delete', 'applicant', 'Soft-delete applicants'),
  ('document:create', 'document', 'Create vault documents'),
  ('document:read', 'document', 'Read vault documents'),
  ('document:update', 'document', 'Update vault documents'),
  ('document:delete', 'document', 'Delete vault documents'),
  ('screening:create', 'screening', 'Create screening cases'),
  ('screening:read', 'screening', 'Read screening cases'),
  ('screening:update', 'screening', 'Update screening cases'),
  ('signature:create', 'signature', 'Create signature requests'),
  ('signature:read', 'signature', 'Read signature requests'),
  ('signature:update', 'signature', 'Update signature requests')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'applicant:create'),
  ('property_manager', 'applicant:read'),
  ('property_manager', 'applicant:update'),
  ('property_manager', 'applicant:archive'),
  ('property_manager', 'applicant:delete'),
  ('property_manager', 'document:create'),
  ('property_manager', 'document:read'),
  ('property_manager', 'document:update'),
  ('property_manager', 'document:delete'),
  ('property_manager', 'screening:create'),
  ('property_manager', 'screening:read'),
  ('property_manager', 'screening:update'),
  ('property_manager', 'signature:create'),
  ('property_manager', 'signature:read'),
  ('property_manager', 'signature:update'),
  ('property_owner', 'applicant:read'),
  ('property_owner', 'document:read'),
  ('property_owner', 'screening:read'),
  ('property_owner', 'signature:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.applicants enable row level security;
alter table public.applicant_notes enable row level security;
alter table public.applicant_tasks enable row level security;
alter table public.applicant_events enable row level security;
alter table public.vault_documents enable row level security;
alter table public.screening_cases enable row level security;
alter table public.signature_requests enable row level security;

-- applicants
drop policy if exists applicants_select_authorized on public.applicants;
create policy applicants_select_authorized on public.applicants for select
using (public.has_org_capability(organization_id, 'applicant:read'));

drop policy if exists applicants_insert_authorized on public.applicants;
create policy applicants_insert_authorized on public.applicants for insert
with check (public.has_org_capability(organization_id, 'applicant:create') and created_by = auth.uid());

drop policy if exists applicants_update_authorized on public.applicants;
create policy applicants_update_authorized on public.applicants for update
using (
  public.has_org_capability(organization_id, 'applicant:update')
  or public.has_org_capability(organization_id, 'applicant:archive')
  or public.has_org_capability(organization_id, 'applicant:delete')
)
with check (
  public.has_org_capability(organization_id, 'applicant:update')
  or public.has_org_capability(organization_id, 'applicant:archive')
  or public.has_org_capability(organization_id, 'applicant:delete')
);

drop policy if exists applicants_delete_authorized on public.applicants;
create policy applicants_delete_authorized on public.applicants for delete
using (public.has_org_capability(organization_id, 'applicant:delete'));

-- applicant_notes
drop policy if exists applicant_notes_select on public.applicant_notes;
create policy applicant_notes_select on public.applicant_notes for select
using (public.has_org_capability(organization_id, 'applicant:read'));

drop policy if exists applicant_notes_insert on public.applicant_notes;
create policy applicant_notes_insert on public.applicant_notes for insert
with check (public.has_org_capability(organization_id, 'applicant:update') and created_by = auth.uid());

-- applicant_tasks
drop policy if exists applicant_tasks_select on public.applicant_tasks;
create policy applicant_tasks_select on public.applicant_tasks for select
using (public.has_org_capability(organization_id, 'applicant:read'));

drop policy if exists applicant_tasks_insert on public.applicant_tasks;
create policy applicant_tasks_insert on public.applicant_tasks for insert
with check (public.has_org_capability(organization_id, 'applicant:update') and created_by = auth.uid());

drop policy if exists applicant_tasks_update on public.applicant_tasks;
create policy applicant_tasks_update on public.applicant_tasks for update
using (public.has_org_capability(organization_id, 'applicant:update'))
with check (public.has_org_capability(organization_id, 'applicant:update'));

-- applicant_events (append-only via update capability)
drop policy if exists applicant_events_select on public.applicant_events;
create policy applicant_events_select on public.applicant_events for select
using (public.has_org_capability(organization_id, 'applicant:read'));

drop policy if exists applicant_events_insert on public.applicant_events;
create policy applicant_events_insert on public.applicant_events for insert
with check (public.has_org_capability(organization_id, 'applicant:update') and created_by = auth.uid());

-- vault_documents
drop policy if exists vault_documents_select on public.vault_documents;
create policy vault_documents_select on public.vault_documents for select
using (public.has_org_capability(organization_id, 'document:read'));

drop policy if exists vault_documents_insert on public.vault_documents;
create policy vault_documents_insert on public.vault_documents for insert
with check (public.has_org_capability(organization_id, 'document:create') and created_by = auth.uid());

drop policy if exists vault_documents_update on public.vault_documents;
create policy vault_documents_update on public.vault_documents for update
using (
  public.has_org_capability(organization_id, 'document:update')
  or public.has_org_capability(organization_id, 'document:delete')
)
with check (
  public.has_org_capability(organization_id, 'document:update')
  or public.has_org_capability(organization_id, 'document:delete')
);

drop policy if exists vault_documents_delete on public.vault_documents;
create policy vault_documents_delete on public.vault_documents for delete
using (public.has_org_capability(organization_id, 'document:delete'));

-- screening_cases
drop policy if exists screening_cases_select on public.screening_cases;
create policy screening_cases_select on public.screening_cases for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_cases_insert on public.screening_cases;
create policy screening_cases_insert on public.screening_cases for insert
with check (public.has_org_capability(organization_id, 'screening:create') and created_by = auth.uid());

drop policy if exists screening_cases_update on public.screening_cases;
create policy screening_cases_update on public.screening_cases for update
using (public.has_org_capability(organization_id, 'screening:update'))
with check (public.has_org_capability(organization_id, 'screening:update'));

-- signature_requests
drop policy if exists signature_requests_select on public.signature_requests;
create policy signature_requests_select on public.signature_requests for select
using (public.has_org_capability(organization_id, 'signature:read'));

drop policy if exists signature_requests_insert on public.signature_requests;
create policy signature_requests_insert on public.signature_requests for insert
with check (public.has_org_capability(organization_id, 'signature:create') and created_by = auth.uid());

drop policy if exists signature_requests_update on public.signature_requests;
create policy signature_requests_update on public.signature_requests for update
using (public.has_org_capability(organization_id, 'signature:update'))
with check (public.has_org_capability(organization_id, 'signature:update'));
