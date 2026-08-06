-- P0 commercial integrity + Master Admin read access.

-- Only platform operators may change an existing subscription SKU.
-- Organization managers may still INSERT the initial subscription at org creation.
drop policy if exists organization_subscriptions_update_manager on public.organization_subscriptions;
create policy organization_subscriptions_update_operator
on public.organization_subscriptions
for update
using (public.is_platform_operator())
with check (public.is_platform_operator());

-- Operators can list all customer organizations for commercial management.
drop policy if exists organizations_select_operator on public.organizations;
create policy organizations_select_operator
on public.organizations
for select
using (public.is_platform_operator());

-- Operators can read all setup states.
drop policy if exists organization_setup_state_select_operator on public.organization_setup_state;
create policy organization_setup_state_select_operator
on public.organization_setup_state
for select
using (public.is_platform_operator());
