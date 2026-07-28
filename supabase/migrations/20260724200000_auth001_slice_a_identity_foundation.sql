-- AUTH-001 Slice A: Identity foundation (principals, username registry, password state).
-- Dual-run: existing auth.users are backfilled with generated usernames (permanent_set).

create table if not exists public.username_registry (
  username text primary key,
  principal_id uuid,
  status text not null check (status in ('active', 'tombstone')),
  created_at timestamptz not null default timezone('utc', now()),
  retired_at timestamptz
);

create table if not exists public.identity_principals (
  principal_id uuid primary key default gen_random_uuid(),
  username text not null,
  auth_provider_subject uuid not null unique references auth.users (id) on delete cascade,
  status text not null default 'active'
    check (status in ('pending', 'active', 'locked', 'disabled', 'archived')),
  password_state text not null default 'permanent_set'
    check (password_state in ('temporary_issued', 'permanent_set', 'reset_required')),
  must_accept_terms boolean not null default false,
  terms_accepted_at timestamptz,
  temporary_password_expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint identity_principals_username_fkey
    foreign key (username) references public.username_registry (username)
);

create unique index if not exists identity_principals_username_uidx
  on public.identity_principals (username);

create index if not exists identity_principals_provider_subject_idx
  on public.identity_principals (auth_provider_subject);

comment on table public.identity_principals is
  'AUTH-001 Slice A Identity Principal. Username is login identity; email is contact only.';

comment on table public.username_registry is
  'AUTH-001 username registry with tombstones — usernames are never reused.';

-- Issue / reserve username (immutable once active)
create or replace function public.auth_register_username(
  p_username text,
  p_principal_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(trim(p_username));
begin
  if v_username is null or length(v_username) < 6 or length(v_username) > 32 then
    raise exception 'invalid username length';
  end if;
  if v_username !~ '^[a-z0-9]+$' then
    raise exception 'invalid username charset';
  end if;
  if v_username in ('admin', 'root', 'support', 'mpa', 'system', 'master', 'null', 'undefined') then
    raise exception 'reserved username';
  end if;

  if exists (
    select 1 from public.username_registry r
    where r.username = v_username and r.status = 'tombstone'
  ) then
    raise exception 'username retired';
  end if;

  insert into public.username_registry (username, principal_id, status)
  values (v_username, p_principal_id, 'active')
  on conflict (username) do update
    set principal_id = excluded.principal_id,
        status = 'active',
        retired_at = null
  where public.username_registry.status = 'active'
    and public.username_registry.principal_id is not distinct from excluded.principal_id;

  if not exists (
    select 1 from public.username_registry r
    where r.username = v_username and r.status = 'active' and r.principal_id = p_principal_id
  ) then
    raise exception 'username unavailable';
  end if;

  return v_username;
end;
$$;

revoke all on function public.auth_register_username(text, uuid) from public;
grant execute on function public.auth_register_username(text, uuid) to service_role;

-- Resolve login identifier → auth subject + provider email (service role only)
create or replace function public.auth_resolve_login_identifier(p_identifier text)
returns table (
  principal_id uuid,
  username text,
  auth_provider_subject uuid,
  password_state text,
  status text,
  must_accept_terms boolean,
  provider_email text,
  dual_run_email boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := lower(trim(p_identifier));
begin
  if v_id is null or length(v_id) = 0 then
    return;
  end if;

  -- Preferred: username principal
  if exists (select 1 from public.identity_principals p where p.username = v_id) then
    return query
    select
      p.principal_id,
      p.username,
      p.auth_provider_subject,
      p.password_state,
      p.status,
      p.must_accept_terms,
      u.email::text as provider_email,
      false as dual_run_email
    from public.identity_principals p
    join auth.users u on u.id = p.auth_provider_subject
    where p.username = v_id
    limit 1;
    return;
  end if;

  -- Dual-run (AUTH-001 Q10): legacy email identifier during migration window.
  if position('@' in v_id) > 0 then
    return query
    select
      p.principal_id,
      p.username,
      coalesce(p.auth_provider_subject, u.id) as auth_provider_subject,
      coalesce(p.password_state, 'permanent_set'),
      coalesce(p.status, 'active'),
      coalesce(p.must_accept_terms, false),
      u.email::text as provider_email,
      true as dual_run_email
    from auth.users u
    left join public.identity_principals p on p.auth_provider_subject = u.id
    left join public.user_profiles up on up.user_id = u.id
    where lower(u.email) = v_id
       or lower(coalesce(up.contact_email, '')) = v_id
    limit 1;
  end if;
end;
$$;

revoke all on function public.auth_resolve_login_identifier(text) from public;
grant execute on function public.auth_resolve_login_identifier(text) to service_role;

-- RLS
alter table public.identity_principals enable row level security;
alter table public.username_registry enable row level security;

drop policy if exists identity_principals_select_self on public.identity_principals;
create policy identity_principals_select_self
on public.identity_principals
for select
using (auth_provider_subject = auth.uid());

drop policy if exists username_registry_select_active on public.username_registry;
create policy username_registry_select_active
on public.username_registry
for select
using (status = 'active');

-- Backfill principals for existing auth users (design-partner dual-run)
do $$
declare
  r record;
  v_base text;
  v_candidate text;
  v_principal uuid;
  v_suffix int;
begin
  for r in
    select u.id as user_id, u.email
    from auth.users u
    where not exists (
      select 1 from public.identity_principals p where p.auth_provider_subject = u.id
    )
  loop
    v_base := lower(regexp_replace(split_part(coalesce(r.email, 'user'), '@', 1), '[^a-z0-9]', '', 'g'));
    if length(v_base) < 6 then
      v_base := rpad(v_base || 'user', 6, '0');
    end if;
    if length(v_base) > 24 then
      v_base := substr(v_base, 1, 24);
    end if;
    if v_base in ('admin', 'root', 'support', 'mpa', 'system', 'master') then
      v_base := 'user' || substr(replace(r.user_id::text, '-', ''), 1, 8);
    end if;

    v_candidate := v_base;
    v_suffix := 1;
    while exists (select 1 from public.username_registry ur where ur.username = v_candidate) loop
      v_candidate := v_base || lpad(v_suffix::text, 2, '0');
      v_suffix := v_suffix + 1;
      if v_suffix > 99 then
        v_candidate := 'u' || substr(replace(r.user_id::text, '-', ''), 1, 12);
        exit;
      end if;
    end loop;

    v_principal := gen_random_uuid();
    insert into public.username_registry (username, principal_id, status)
    values (v_candidate, v_principal, 'active');

    insert into public.identity_principals (
      principal_id,
      username,
      auth_provider_subject,
      status,
      password_state,
      must_accept_terms,
      terms_accepted_at
    ) values (
      v_principal,
      v_candidate,
      r.user_id,
      'active',
      'permanent_set',
      false,
      timezone('utc', now())
    );
  end loop;
end $$;
