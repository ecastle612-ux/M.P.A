-- AUTH-001 Slice C: invitations, credential delivery ledger, contact verification.
-- Temporary plaintext credentials are never stored here.

alter table public.user_profiles
  add column if not exists contact_email_verified_at timestamptz;

comment on column public.user_profiles.contact_email_verified_at is
  'AUTH-001 Slice C: when contact email was verified (not login identity).';

alter table public.identity_principals
  add column if not exists must_verify_contact boolean not null default false;

comment on column public.identity_principals.must_verify_contact is
  'AUTH-001 Slice C: require contact-email verification before product access after first-login.';

alter table public.organization_invitations
  add column if not exists provisioned_user_id uuid references auth.users (id) on delete set null;

alter table public.organization_invitations
  add column if not exists username text;

alter table public.organization_invitations
  add column if not exists delivery_status text
    check (delivery_status is null or delivery_status in ('pending', 'sent', 'failed'));

alter table public.organization_invitations
  add column if not exists last_delivered_at timestamptz;

alter table public.organization_invitations
  add column if not exists activated_at timestamptz;

create index if not exists organization_invitations_provisioned_user_idx
  on public.organization_invitations (provisioned_user_id)
  where provisioned_user_id is not null;

create unique index if not exists organization_invitations_pending_email_org_uidx
  on public.organization_invitations (organization_id, lower(email))
  where status = 'pending';

comment on column public.organization_invitations.provisioned_user_id is
  'AUTH-001 Slice C: invitee auth subject provisioned at invite time (MPA username).';

-- Idempotent credential / welcome delivery (never stores plaintext secrets).
create table if not exists public.credential_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  delivery_kind text not null check (
    delivery_kind in ('org_admin_welcome', 'invitation_credentials', 'temp_reissue')
  ),
  idempotency_key text not null unique,
  status text not null check (status in ('pending', 'sent', 'failed')),
  attempt_count integer not null default 0,
  last_error text,
  invitation_id uuid references public.organization_invitations (id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists credential_deliveries_org_user_idx
  on public.credential_deliveries (organization_id, user_id, delivery_kind);

comment on table public.credential_deliveries is
  'AUTH-001 Slice C delivery ledger. Never store passwords or temporary credentials.';

drop trigger if exists trg_credential_deliveries_updated_at on public.credential_deliveries;
create trigger trg_credential_deliveries_updated_at
before update on public.credential_deliveries
for each row
execute function public.set_updated_at();

alter table public.credential_deliveries enable row level security;

-- Contact email verification tokens (hashed).
create table if not exists public.contact_email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists contact_email_verifications_user_idx
  on public.contact_email_verifications (user_id, created_at desc);

comment on table public.contact_email_verifications is
  'AUTH-001 Slice C contact verification. Store token hash only.';

alter table public.contact_email_verifications enable row level security;
