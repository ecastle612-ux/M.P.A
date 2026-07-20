-- API-004 — Electronic Signatures & Digital Lease Execution foundation
-- Extends RX-001 signature_requests into SignatureService package domain.

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permission_capabilities (key, namespace, description)
values
  ('signature:send', 'signature', 'Send, remind, and resend signature packages'),
  ('signature:cancel', 'signature', 'Cancel in-flight signature packages'),
  ('signature:read_full', 'signature', 'Download executed PDFs and certificates'),
  ('signature:admin', 'signature', 'Manage signature settings, retention, and void packages')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'signature:create'),
  ('property_manager', 'signature:read'),
  ('property_manager', 'signature:update'),
  ('property_manager', 'signature:send'),
  ('property_manager', 'signature:cancel'),
  ('property_manager', 'signature:read_full'),
  ('property_manager', 'signature:admin')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- Org signature settings (configurable retention — Q6)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_signature_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  provider text not null default 'noop',
  default_order_mode text not null default 'sequential'
    check (default_order_mode in ('sequential', 'parallel', 'hybrid')),
  pm_countersign text not null default 'required_last'
    check (pm_countersign in ('required_last', 'optional', 'none')),
  owner_required boolean not null default false,
  expiration_days integer not null default 14
    check (expiration_days >= 1 and expiration_days <= 365),
  reminder_hours integer[] not null default array[24, 72],
  max_reminders integer not null default 3
    check (max_reminders >= 0 and max_reminders <= 20),
  retention_days integer not null default 2555
    check (retention_days >= 30 and retention_days <= 3650),
  activate_resident_on_complete boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.organization_signature_settings enable row level security;

drop policy if exists organization_signature_settings_select on public.organization_signature_settings;
create policy organization_signature_settings_select on public.organization_signature_settings for select
using (public.has_org_capability(organization_id, 'signature:read'));

drop policy if exists organization_signature_settings_insert on public.organization_signature_settings;
create policy organization_signature_settings_insert on public.organization_signature_settings for insert
with check (public.has_org_capability(organization_id, 'signature:admin'));

drop policy if exists organization_signature_settings_update on public.organization_signature_settings;
create policy organization_signature_settings_update on public.organization_signature_settings for update
using (public.has_org_capability(organization_id, 'signature:admin'))
with check (public.has_org_capability(organization_id, 'signature:admin'));

drop trigger if exists trg_organization_signature_settings_updated_at on public.organization_signature_settings;
create trigger trg_organization_signature_settings_updated_at
before update on public.organization_signature_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Document templates (M.P.A.-owned — Q2)
-- ---------------------------------------------------------------------------
create table if not exists public.signature_document_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  template_key text not null,
  name text not null,
  document_type text not null check (
    document_type in (
      'lease_agreement',
      'lease_renewal',
      'pet_agreement',
      'parking_agreement',
      'move_in_form',
      'inspection_form',
      'owner_agreement',
      'vendor_agreement',
      'general_pdf',
      'application_consent',
      'addendum',
      'other'
    )
  ),
  version integer not null default 1,
  body_template text not null,
  required_fields text[] not null default '{}',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, template_key, version)
);

create index if not exists signature_document_templates_org_key_idx
  on public.signature_document_templates (organization_id, template_key)
  where is_active = true;

alter table public.signature_document_templates enable row level security;

drop policy if exists signature_document_templates_select on public.signature_document_templates;
create policy signature_document_templates_select on public.signature_document_templates for select
using (public.has_org_capability(organization_id, 'signature:read'));

drop policy if exists signature_document_templates_write on public.signature_document_templates;
create policy signature_document_templates_write on public.signature_document_templates for all
using (public.has_org_capability(organization_id, 'signature:admin'))
with check (public.has_org_capability(organization_id, 'signature:admin'));

drop trigger if exists trg_signature_document_templates_updated_at on public.signature_document_templates;
create trigger trg_signature_document_templates_updated_at
before update on public.signature_document_templates
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Expand signature_requests → packages
-- ---------------------------------------------------------------------------
alter table public.signature_requests drop constraint if exists signature_requests_status_check;
alter table public.signature_requests drop constraint if exists signature_requests_request_type_check;

update public.signature_requests set status = 'draft' where status = 'pending';
update public.signature_requests set status = 'in_progress' where status = 'viewed';
update public.signature_requests set status = 'completed' where status = 'signed';

alter table public.signature_requests
  alter column applicant_id drop not null;

alter table public.signature_requests
  add column if not exists lease_id uuid,
  add column if not exists property_id uuid,
  add column if not exists unit_id uuid,
  add column if not exists tenant_id uuid,
  add column if not exists screening_case_id uuid,
  add column if not exists supersedes_package_id uuid,
  add column if not exists order_mode text not null default 'sequential',
  add column if not exists subject text,
  add column if not exists message text,
  add column if not exists expires_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists vault_status text not null default 'not_required',
  add column if not exists vault_retry_count integer not null default 0,
  add column if not exists vault_last_error text,
  add column if not exists resident_activated_at timestamptz,
  add column if not exists certificate_vault_document_id uuid,
  add column if not exists last_error text,
  add column if not exists retry_count integer not null default 0;

do $$ begin
  alter table public.signature_requests
    add constraint signature_requests_status_check check (
      status in (
        'draft',
        'ready_to_send',
        'sent',
        'in_progress',
        'partially_signed',
        'completed',
        'declined',
        'expired',
        'cancelled',
        'failed',
        'voided',
        'awaiting_vault_sync'
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.signature_requests
    add constraint signature_requests_request_type_check check (
      request_type in (
        'lease_agreement',
        'lease_renewal',
        'pet_agreement',
        'parking_agreement',
        'move_in_form',
        'inspection_form',
        'owner_agreement',
        'vendor_agreement',
        'general_pdf',
        'application_consent',
        'addendum',
        'other'
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.signature_requests
    add constraint signature_requests_order_mode_check check (
      order_mode in ('sequential', 'parallel', 'hybrid')
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.signature_requests
    add constraint signature_requests_vault_status_check check (
      vault_status in ('not_required', 'pending', 'synced', 'awaiting_vault_sync', 'failed')
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.signature_requests
    add constraint signature_requests_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete set null;
exception when duplicate_object then null;
end $$;

create index if not exists signature_requests_org_lease_idx
  on public.signature_requests (organization_id, lease_id)
  where lease_id is not null;
create index if not exists signature_requests_org_vault_idx
  on public.signature_requests (organization_id, vault_status)
  where vault_status in ('pending', 'awaiting_vault_sync', 'failed');

-- ---------------------------------------------------------------------------
-- Package documents
-- ---------------------------------------------------------------------------
create table if not exists public.signature_package_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  signature_request_id uuid not null,
  template_id uuid,
  document_type text not null,
  title text not null,
  version integer not null default 1,
  content_hash text not null,
  content_text text not null,
  content_base64 text,
  is_preview boolean not null default false,
  sort_order integer not null default 0,
  vault_document_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint signature_package_documents_package_fk
    foreign key (signature_request_id, organization_id)
    references public.signature_requests (id, organization_id)
    on delete cascade
);

create index if not exists signature_package_documents_pkg_idx
  on public.signature_package_documents (organization_id, signature_request_id);

alter table public.signature_package_documents enable row level security;

drop policy if exists signature_package_documents_select on public.signature_package_documents;
create policy signature_package_documents_select on public.signature_package_documents for select
using (public.has_org_capability(organization_id, 'signature:read'));

drop policy if exists signature_package_documents_write on public.signature_package_documents;
create policy signature_package_documents_write on public.signature_package_documents for all
using (
  public.has_org_capability(organization_id, 'signature:create')
  or public.has_org_capability(organization_id, 'signature:update')
)
with check (
  public.has_org_capability(organization_id, 'signature:create')
  or public.has_org_capability(organization_id, 'signature:update')
);

-- ---------------------------------------------------------------------------
-- Recipients
-- ---------------------------------------------------------------------------
create table if not exists public.signature_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  signature_request_id uuid not null,
  role text not null check (
    role in (
      'primary_applicant',
      'co_applicant',
      'guarantor',
      'property_manager',
      'property_owner',
      'witness',
      'cc_viewer'
    )
  ),
  full_name text not null,
  email text,
  user_id uuid references auth.users (id) on delete set null,
  applicant_id uuid,
  tenant_id uuid,
  signing_order integer not null default 1,
  signing_group integer not null default 1,
  is_required boolean not null default true,
  auth_method text not null default 'email',
  status text not null default 'pending' check (
    status in ('pending', 'invited', 'viewed', 'signed', 'declined', 'expired', 'skipped')
  ),
  progress_token text,
  progress_token_expires_at timestamptz,
  external_recipient_id text,
  signing_url text,
  invited_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  declined_at timestamptz,
  last_reminder_at timestamptz,
  reminder_count integer not null default 0,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint signature_recipients_package_fk
    foreign key (signature_request_id, organization_id)
    references public.signature_requests (id, organization_id)
    on delete cascade
);

create unique index if not exists signature_recipients_progress_token_uidx
  on public.signature_recipients (progress_token)
  where progress_token is not null;

create index if not exists signature_recipients_pkg_idx
  on public.signature_recipients (organization_id, signature_request_id, signing_order);

alter table public.signature_recipients enable row level security;

drop policy if exists signature_recipients_select on public.signature_recipients;
create policy signature_recipients_select on public.signature_recipients for select
using (public.has_org_capability(organization_id, 'signature:read'));

drop policy if exists signature_recipients_write on public.signature_recipients;
create policy signature_recipients_write on public.signature_recipients for all
using (
  public.has_org_capability(organization_id, 'signature:create')
  or public.has_org_capability(organization_id, 'signature:update')
  or public.has_org_capability(organization_id, 'signature:send')
)
with check (
  public.has_org_capability(organization_id, 'signature:create')
  or public.has_org_capability(organization_id, 'signature:update')
  or public.has_org_capability(organization_id, 'signature:send')
);

drop trigger if exists trg_signature_recipients_updated_at on public.signature_recipients;
create trigger trg_signature_recipients_updated_at
before update on public.signature_recipients
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Immutable audit events (Q5)
-- ---------------------------------------------------------------------------
create table if not exists public.signature_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  signature_request_id uuid not null,
  recipient_id uuid,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  summary text not null,
  ip_address text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint signature_audit_events_package_fk
    foreign key (signature_request_id, organization_id)
    references public.signature_requests (id, organization_id)
    on delete cascade
);

create index if not exists signature_audit_events_pkg_idx
  on public.signature_audit_events (organization_id, signature_request_id, created_at desc);

alter table public.signature_audit_events enable row level security;

drop policy if exists signature_audit_events_select on public.signature_audit_events;
create policy signature_audit_events_select on public.signature_audit_events for select
using (public.has_org_capability(organization_id, 'signature:read'));

drop policy if exists signature_audit_events_insert on public.signature_audit_events;
create policy signature_audit_events_insert on public.signature_audit_events for insert
with check (
  public.has_org_capability(organization_id, 'signature:create')
  or public.has_org_capability(organization_id, 'signature:update')
  or public.has_org_capability(organization_id, 'signature:send')
  or public.has_org_capability(organization_id, 'signature:admin')
);

-- ---------------------------------------------------------------------------
-- Expand vault document types used by signatures (metadata only; type is free text)
-- No schema change required for vault_documents.document_type.
-- ---------------------------------------------------------------------------
