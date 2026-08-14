-- COM-002 UAT remediation (ADR-024 preserved)
-- Tenant conversation and residential work-order writes already persist, then fail
-- when the same actor inserts audit_events / event_domain_events (manager-only).
-- Add a second INSERT policy (Postgres ORs policies). Do not replace or weaken
-- the existing manager policies. No public / anon insert. Org isolation stays
-- on organization_id + active membership. Actor must be the signed-in tenant.

-- ---------------------------------------------------------------------------
-- audit_events: tenant self-actor insert for approved entity types
-- ---------------------------------------------------------------------------

drop policy if exists audit_events_insert_self_tenant on public.audit_events;
create policy audit_events_insert_self_tenant
on public.audit_events
for insert
to authenticated
with check (
  organization_id is not null
  and actor_id is not null
  and actor_id = auth.uid()
  and public.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = audit_events.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and 'tenant' = any (memberships.roles)
  )
  and entity_type in (
    'comms_conversations',
    'maintenance_work_orders',
    'pm_residents',
    'property_properties'
  )
);

-- ---------------------------------------------------------------------------
-- event_domain_events: same self-actor + tenant + allowlist pattern
-- ---------------------------------------------------------------------------

drop policy if exists event_domain_events_insert_self_tenant on public.event_domain_events;
create policy event_domain_events_insert_self_tenant
on public.event_domain_events
for insert
to authenticated
with check (
  organization_id is not null
  and actor_id is not null
  and actor_id = auth.uid()
  and public.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = event_domain_events.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and 'tenant' = any (memberships.roles)
  )
  and aggregate_type in (
    'comms_conversations',
    'maintenance_work_orders',
    'pm_residents',
    'property_properties'
  )
);
