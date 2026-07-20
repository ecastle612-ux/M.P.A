-- WF-002: Ensure pgcrypto is available for invitation tokens and related defaults.
-- Observed blocker during Day 1 UI simulation: "function gen_random_bytes(integer) does not exist"

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'gen_random_bytes' and n.nspname = 'public'
  ) and exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'gen_random_bytes' and n.nspname = 'extensions'
  ) then
    create or replace function public.gen_random_bytes(integer)
    returns bytea
    language sql
    as $fn$ select extensions.gen_random_bytes($1) $fn$;
  end if;
end $$;
