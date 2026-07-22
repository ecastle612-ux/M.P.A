-- DPX-002 bugfix:
-- Resident PM threads looked up portal users via user_profiles.email (column does not exist).
-- Provide a service-role RPC to resolve auth.users by email for tenant ↔ portal linking.

create or replace function public.resolve_auth_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = auth, public
as $$
  select id
  from auth.users
  where email is not null
    and lower(email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.resolve_auth_user_id_by_email(text) from public;
grant execute on function public.resolve_auth_user_id_by_email(text) to service_role;
