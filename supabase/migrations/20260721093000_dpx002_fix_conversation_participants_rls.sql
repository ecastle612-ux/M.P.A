-- DPX-002 / MHF-001 bugfix:
-- conversation_participants SELECT policy self-referenced the same table,
-- causing "infinite recursion detected in policy" on participant insert/read.

create or replace function public.is_conversation_thread_participant(
  p_organization_id uuid,
  p_thread_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants p
    where p.organization_id = p_organization_id
      and p.thread_id = p_thread_id
      and p.user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_thread_participant(uuid, uuid) from public;
grant execute on function public.is_conversation_thread_participant(uuid, uuid) to authenticated;

drop policy if exists conversation_participants_select on public.conversation_participants;
create policy conversation_participants_select
on public.conversation_participants for select
using (
  public.has_org_capability(organization_id, 'message:read')
  or user_id = auth.uid()
  or public.is_conversation_thread_participant(organization_id, thread_id)
);
