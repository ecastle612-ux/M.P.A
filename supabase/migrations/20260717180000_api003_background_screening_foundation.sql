-- API-003 — Background Screening & Applicant Verification foundation
-- Extends RX-001 screening_cases stub into full ScreeningService domain.

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permission_capabilities (key, namespace, description)
values
  ('screening:decide', 'screening', 'Approve, reject, or conditionally approve screening'),
  ('screening:read_full', 'screening', 'View full consumer reports and sensitive screening PII'),
  ('screening:admin', 'screening', 'Manage screening packages, retention, and provider settings')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'screening:decide'),
  ('property_manager', 'screening:read_full'),
  ('property_manager', 'screening:admin')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- Org screening settings (configurable retention — Q6)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_screening_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  provider text not null default 'noop',
  package_code text not null default 'standard_rental',
  report_retention_days integer not null default 365
    check (report_retention_days >= 30 and report_retention_days <= 3650),
  summary_retention_days integer not null default 2555
    check (summary_retention_days >= 30 and summary_retention_days <= 3650),
  audit_retention_days integer not null default 2555
    check (audit_retention_days >= 365 and audit_retention_days <= 3650),
  adverse_action_required boolean not null default true,
  adverse_action_wait_hours integer not null default 72
    check (adverse_action_wait_hours >= 0 and adverse_action_wait_hours <= 720),
  auto_start_on_submit boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.organization_screening_settings enable row level security;

drop policy if exists organization_screening_settings_select on public.organization_screening_settings;
create policy organization_screening_settings_select on public.organization_screening_settings for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists organization_screening_settings_insert on public.organization_screening_settings;
create policy organization_screening_settings_insert on public.organization_screening_settings for insert
with check (public.has_org_capability(organization_id, 'screening:admin'));

drop policy if exists organization_screening_settings_update on public.organization_screening_settings;
create policy organization_screening_settings_update on public.organization_screening_settings for update
using (public.has_org_capability(organization_id, 'screening:admin'))
with check (public.has_org_capability(organization_id, 'screening:admin'));

drop trigger if exists trg_organization_screening_settings_updated_at on public.organization_screening_settings;
create trigger trg_organization_screening_settings_updated_at
before update on public.organization_screening_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Expand screening_cases
-- ---------------------------------------------------------------------------
alter table public.screening_cases drop constraint if exists screening_cases_status_check;

update public.screening_cases set status = 'ready_for_review' where status = 'completed';
update public.screening_cases set status = 'draft' where status = 'pending';
update public.screening_cases set status = 'screening_in_progress' where status = 'in_progress';

alter table public.screening_cases
  add column if not exists package_code text not null default 'standard_rental',
  add column if not exists supersedes_case_id uuid,
  add column if not exists expires_at timestamptz,
  add column if not exists consent_completed_at timestamptz,
  add column if not exists submitted_to_provider_at timestamptz,
  add column if not exists ready_for_review_at timestamptz,
  add column if not exists decided_at timestamptz,
  add column if not exists decision text
    check (decision is null or decision in ('approve', 'reject', 'conditional')),
  add column if not exists lease_id uuid,
  add column if not exists normalized_summary jsonb not null default '{}'::jsonb,
  add column if not exists retry_count integer not null default 0,
  add column if not exists last_error text;

alter table public.screening_cases
  add constraint screening_cases_status_check check (
    status in (
      'draft',
      'awaiting_consent',
      'consent_complete',
      'identity_in_progress',
      'screening_in_progress',
      'partial_results',
      'ready_for_review',
      'in_review',
      'approved',
      'conditionally_approved',
      'rejected',
      'adverse_action_pending',
      'adverse_action_complete',
      'expired',
      'cancelled',
      'failed'
    )
  );

create index if not exists screening_cases_org_expires_idx
  on public.screening_cases (organization_id, expires_at)
  where expires_at is not null;

-- ---------------------------------------------------------------------------
-- Consent disclosure versions (org-scoped, versioned legal text)
-- ---------------------------------------------------------------------------
create table if not exists public.screening_consent_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  version integer not null,
  disclosure_title text not null,
  disclosure_body text not null,
  authorization_body text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, version)
);

alter table public.screening_consent_versions enable row level security;

drop policy if exists screening_consent_versions_select on public.screening_consent_versions;
create policy screening_consent_versions_select on public.screening_consent_versions for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_consent_versions_insert on public.screening_consent_versions;
create policy screening_consent_versions_insert on public.screening_consent_versions for insert
with check (public.has_org_capability(organization_id, 'screening:admin'));

-- ---------------------------------------------------------------------------
-- Parties (primary, co-applicant, guarantor, co-signer, adult_occupant)
-- ---------------------------------------------------------------------------
create table if not exists public.screening_parties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  screening_case_id uuid not null,
  applicant_id uuid,
  role text not null check (
    role in ('primary', 'co_applicant', 'guarantor', 'co_signer', 'adult_occupant')
  ),
  full_name text not null,
  email text,
  phone text,
  status text not null default 'pending_consent' check (
    status in (
      'pending_consent',
      'consent_granted',
      'identity_in_progress',
      'screening_in_progress',
      'ready',
      'failed',
      'cancelled'
    )
  ),
  consent_token text unique,
  consent_token_expires_at timestamptz,
  external_candidate_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint screening_parties_case_fk
    foreign key (screening_case_id, organization_id)
    references public.screening_cases (id, organization_id)
    on delete cascade
);

create index if not exists screening_parties_case_idx
  on public.screening_parties (organization_id, screening_case_id);
create index if not exists screening_parties_token_idx
  on public.screening_parties (consent_token)
  where consent_token is not null;

alter table public.screening_parties enable row level security;

drop policy if exists screening_parties_select on public.screening_parties;
create policy screening_parties_select on public.screening_parties for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_parties_insert on public.screening_parties;
create policy screening_parties_insert on public.screening_parties for insert
with check (public.has_org_capability(organization_id, 'screening:create'));

drop policy if exists screening_parties_update on public.screening_parties;
create policy screening_parties_update on public.screening_parties for update
using (
  public.has_org_capability(organization_id, 'screening:update')
  or public.has_org_capability(organization_id, 'screening:create')
)
with check (
  public.has_org_capability(organization_id, 'screening:update')
  or public.has_org_capability(organization_id, 'screening:create')
);

drop trigger if exists trg_screening_parties_updated_at on public.screening_parties;
create trigger trg_screening_parties_updated_at
before update on public.screening_parties
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Consent records (immutable after grant)
-- ---------------------------------------------------------------------------
create table if not exists public.screening_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  screening_case_id uuid not null,
  screening_party_id uuid not null,
  consent_version_id uuid not null references public.screening_consent_versions (id),
  signed_name text not null,
  attested_disclosure boolean not null default false,
  attested_authorization boolean not null default false,
  ip_address text,
  user_agent text,
  vault_document_id uuid,
  granted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (screening_party_id),
  constraint screening_consents_case_fk
    foreign key (screening_case_id, organization_id)
    references public.screening_cases (id, organization_id)
    on delete cascade,
  constraint screening_consents_party_fk
    foreign key (screening_party_id, organization_id)
    references public.screening_parties (id, organization_id)
    on delete cascade
);

alter table public.screening_consents enable row level security;

drop policy if exists screening_consents_select on public.screening_consents;
create policy screening_consents_select on public.screening_consents for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_consents_insert on public.screening_consents;
create policy screening_consents_insert on public.screening_consents for insert
with check (public.has_org_capability(organization_id, 'screening:create'));

-- ---------------------------------------------------------------------------
-- Component results (structured — Q3 SoR)
-- ---------------------------------------------------------------------------
create table if not exists public.screening_components (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  screening_case_id uuid not null,
  screening_party_id uuid,
  component_type text not null check (
    component_type in ('identity', 'credit', 'criminal', 'eviction', 'sex_offender', 'income')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'not_requested', 'clear', 'review', 'fail', 'error')
  ),
  flags jsonb not null default '[]'::jsonb,
  provider_reference text,
  summary text,
  completed_at timestamptz,
  vault_document_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (screening_case_id, screening_party_id, component_type),
  constraint screening_components_case_fk
    foreign key (screening_case_id, organization_id)
    references public.screening_cases (id, organization_id)
    on delete cascade
);

create index if not exists screening_components_case_idx
  on public.screening_components (organization_id, screening_case_id);

alter table public.screening_components enable row level security;

drop policy if exists screening_components_select on public.screening_components;
create policy screening_components_select on public.screening_components for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_components_write on public.screening_components;
create policy screening_components_insert on public.screening_components for insert
with check (public.has_org_capability(organization_id, 'screening:create')
  or public.has_org_capability(organization_id, 'screening:update'));

create policy screening_components_update on public.screening_components for update
using (public.has_org_capability(organization_id, 'screening:update'))
with check (public.has_org_capability(organization_id, 'screening:update'));

drop trigger if exists trg_screening_components_updated_at on public.screening_components;
create trigger trg_screening_components_updated_at
before update on public.screening_components
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Decisions & conditions
-- ---------------------------------------------------------------------------
create table if not exists public.screening_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  screening_case_id uuid not null,
  decision text not null check (decision in ('approve', 'reject', 'conditional')),
  reason_codes text[] not null default '{}',
  notes text,
  decided_by uuid not null references auth.users (id) on delete cascade,
  decided_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (screening_case_id),
  constraint screening_decisions_case_fk
    foreign key (screening_case_id, organization_id)
    references public.screening_cases (id, organization_id)
    on delete cascade
);

create table if not exists public.screening_conditions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  screening_case_id uuid not null,
  decision_id uuid not null references public.screening_decisions (id) on delete cascade,
  condition_type text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'satisfied', 'waived', 'cancelled')),
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint screening_conditions_case_fk
    foreign key (screening_case_id, organization_id)
    references public.screening_cases (id, organization_id)
    on delete cascade
);

alter table public.screening_decisions enable row level security;
alter table public.screening_conditions enable row level security;

drop policy if exists screening_decisions_select on public.screening_decisions;
create policy screening_decisions_select on public.screening_decisions for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_decisions_insert on public.screening_decisions;
create policy screening_decisions_insert on public.screening_decisions for insert
with check (public.has_org_capability(organization_id, 'screening:decide'));

drop policy if exists screening_conditions_select on public.screening_conditions;
create policy screening_conditions_select on public.screening_conditions for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_conditions_write on public.screening_conditions;
create policy screening_conditions_insert on public.screening_conditions for insert
with check (public.has_org_capability(organization_id, 'screening:decide'));

create policy screening_conditions_update on public.screening_conditions for update
using (public.has_org_capability(organization_id, 'screening:decide')
  or public.has_org_capability(organization_id, 'screening:update'))
with check (public.has_org_capability(organization_id, 'screening:decide')
  or public.has_org_capability(organization_id, 'screening:update'));

-- ---------------------------------------------------------------------------
-- Adverse action
-- ---------------------------------------------------------------------------
create table if not exists public.screening_adverse_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  screening_case_id uuid not null,
  stage text not null check (stage in ('pre_adverse', 'final_adverse')),
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'waiting', 'completed', 'cancelled')
  ),
  notice_body text not null,
  vault_document_id uuid,
  sent_at timestamptz,
  wait_until timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint screening_adverse_case_fk
    foreign key (screening_case_id, organization_id)
    references public.screening_cases (id, organization_id)
    on delete cascade
);

alter table public.screening_adverse_actions enable row level security;

drop policy if exists screening_adverse_select on public.screening_adverse_actions;
create policy screening_adverse_select on public.screening_adverse_actions for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_adverse_write on public.screening_adverse_actions;
create policy screening_adverse_insert on public.screening_adverse_actions for insert
with check (public.has_org_capability(organization_id, 'screening:decide'));

create policy screening_adverse_update on public.screening_adverse_actions for update
using (public.has_org_capability(organization_id, 'screening:decide'))
with check (public.has_org_capability(organization_id, 'screening:decide'));

drop trigger if exists trg_screening_adverse_updated_at on public.screening_adverse_actions;
create trigger trg_screening_adverse_updated_at
before update on public.screening_adverse_actions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Screening audit (access + state — Q5)
-- ---------------------------------------------------------------------------
create table if not exists public.screening_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  screening_case_id uuid,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists screening_audit_case_idx
  on public.screening_audit_events (organization_id, screening_case_id, created_at desc);

alter table public.screening_audit_events enable row level security;

drop policy if exists screening_audit_select on public.screening_audit_events;
create policy screening_audit_select on public.screening_audit_events for select
using (public.has_org_capability(organization_id, 'screening:read'));

drop policy if exists screening_audit_insert on public.screening_audit_events;
create policy screening_audit_insert on public.screening_audit_events for insert
with check (
  public.has_org_capability(organization_id, 'screening:create')
  or public.has_org_capability(organization_id, 'screening:update')
  or public.has_org_capability(organization_id, 'screening:decide')
  or public.has_org_capability(organization_id, 'screening:admin')
);

-- ---------------------------------------------------------------------------
-- Webhook idempotency store
-- ---------------------------------------------------------------------------
create table if not exists public.integrations_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  organization_id uuid references public.organizations (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  headers jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (
    status in ('received', 'processed', 'failed', 'ignored')
  ),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (provider, external_event_id)
);

create index if not exists integrations_webhook_events_created_idx
  on public.integrations_webhook_events (created_at desc);

alter table public.integrations_webhook_events enable row level security;

-- Service role only for webhooks; authenticated admins may read
drop policy if exists integrations_webhook_events_select on public.integrations_webhook_events;
create policy integrations_webhook_events_select on public.integrations_webhook_events for select
using (
  organization_id is not null
  and public.has_org_capability(organization_id, 'screening:admin')
);
