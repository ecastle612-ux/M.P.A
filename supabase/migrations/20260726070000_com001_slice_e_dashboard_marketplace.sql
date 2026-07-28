-- COM-001 Slice E — marketplace data-model prep (A07) for commercial dashboard (A08).
-- Partner marketplace UI is NOT productized here; partners table is a stub directory.

-- ---------------------------------------------------------------------------
-- 1) Partner directory stubs (future certified partners)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_implementation_partners (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  certification_status text not null default 'stub' check (
    certification_status in ('stub', 'pending', 'active', 'suspended')
  ),
  regions text[] not null default '{}'::text[],
  languages text[] not null default '{}'::text[],
  services text[] not null default '{}'::text[],
  capacity_limit integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.commercial_implementation_partners is
  'COM-001 Slice E partner directory stubs. No partner UI / activation in Slice E.';

drop trigger if exists trg_commercial_implementation_partners_updated_at
  on public.commercial_implementation_partners;
create trigger trg_commercial_implementation_partners_updated_at
before update on public.commercial_implementation_partners
for each row
execute function public.set_updated_at();

alter table public.commercial_implementation_partners enable row level security;
-- Staff-only via service role; no authenticated member policies (control-plane table).

-- ---------------------------------------------------------------------------
-- 2) Implementation engagements (ImplementationEngagement-shaped)
-- ---------------------------------------------------------------------------
create table if not exists public.commercial_implementation_engagements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  path text not null check (path in ('ai_guided', 'professional')),
  provider_type text not null check (provider_type in ('mpa_internal', 'certified_partner')),
  partner_id uuid references public.commercial_implementation_partners (id) on delete set null,
  status text not null default 'requested' check (
    status in ('requested', 'matched', 'in_progress', 'complete', 'cancelled')
  ),
  progress_score integer not null default 0 check (progress_score >= 0 and progress_score <= 100),
  access_grant_id text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint commercial_implementation_engagements_partner_consistency check (
    (provider_type = 'mpa_internal' and partner_id is null)
    or (provider_type = 'certified_partner')
  )
);

comment on table public.commercial_implementation_engagements is
  'COM-001 Slice E marketplace engagement model. Partner UI deferred; mpa_internal Professional valid.';

create index if not exists commercial_implementation_engagements_org_idx
  on public.commercial_implementation_engagements (organization_id, status);

create index if not exists commercial_implementation_engagements_status_idx
  on public.commercial_implementation_engagements (status, updated_at desc);

drop trigger if exists trg_commercial_implementation_engagements_updated_at
  on public.commercial_implementation_engagements;
create trigger trg_commercial_implementation_engagements_updated_at
before update on public.commercial_implementation_engagements
for each row
execute function public.set_updated_at();

alter table public.commercial_implementation_engagements enable row level security;

drop policy if exists commercial_implementation_engagements_select_member
  on public.commercial_implementation_engagements;
create policy commercial_implementation_engagements_select_member
  on public.commercial_implementation_engagements
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = commercial_implementation_engagements.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
