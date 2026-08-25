-- PARTNER-005 / docs/243 — Partner onboarding, invitations, and activation.
-- Additive invitation + capability model only. Canonical partner remains platform_partners.
-- Do not apply this file to Production from the implement package.

create table if not exists public.platform_partner_invitations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.platform_partners (id) on delete cascade,
  email text not null,
  token_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  source text not null default 'direct_invite'
    check (source in ('application_approval', 'direct_invite', 'resend')),
  expires_at timestamptz not null,
  invited_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_partner_invitations_token_hash_uidx unique (token_hash)
);

create unique index if not exists platform_partner_invitations_pending_partner_uidx
  on public.platform_partner_invitations (partner_id)
  where status = 'pending';

create unique index if not exists platform_partner_invitations_pending_email_uidx
  on public.platform_partner_invitations (lower(email))
  where status = 'pending';

create index if not exists platform_partner_invitations_partner_idx
  on public.platform_partner_invitations (partner_id, created_at desc);

create index if not exists platform_partner_invitations_email_idx
  on public.platform_partner_invitations (lower(email), created_at desc);

drop trigger if exists trg_platform_partner_invitations_updated_at on public.platform_partner_invitations;
create trigger trg_platform_partner_invitations_updated_at
before update on public.platform_partner_invitations
for each row
execute function public.set_updated_at();

alter table public.platform_partner_invitations enable row level security;

drop policy if exists platform_partner_invitations_select_operator on public.platform_partner_invitations;
create policy platform_partner_invitations_select_operator
on public.platform_partner_invitations
for select
using (public.is_platform_operator());

revoke all on public.platform_partner_invitations from public, anon;
grant select on public.platform_partner_invitations to authenticated;

comment on table public.platform_partner_invitations is
  'PARTNER-005 hashed partner invitations. Service-role writes only. Token is never stored in plaintext.';

-- Bound partner members may read their own partner row so /partner entitlement
-- can be granted without a commercial SKU. Writes remain service-role only.
drop policy if exists platform_partners_select_bound_member on public.platform_partners;
create policy platform_partners_select_bound_member
on public.platform_partners
for select
using (
  organization_id is not null
  and exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = platform_partners.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

insert into public.permission_capabilities (key, namespace, description)
values
  ('partner.services:read', 'partner.services', 'Read Partner Command Center, requests, referrals, and onboarding'),
  ('partner.services:write', 'partner.services', 'Update partner profile, portals, and onboarding acknowledgements')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'partner.services:read'),
  ('organization_admin', 'partner.services:write'),
  ('property_manager', 'partner.services:read'),
  ('property_manager', 'partner.services:write')
on conflict (role, capability_key) do nothing;
