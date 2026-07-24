-- FIN-003 Phase E (R-D1): owner-row SELECT hardening for payout visibility tables.
-- Staff retain org-wide read: payout:manage · financial:admin · property_manager (is_org_manager).
-- Owners with financial:read see only their own owner_user_id rows.

drop policy if exists transfer_intents_select on public.transfer_intents;
create policy transfer_intents_select on public.transfer_intents for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:admin')
  or public.is_org_manager(organization_id)
  or (
    owner_user_id = auth.uid()
    and public.has_org_capability(organization_id, 'financial:read')
  )
);

drop policy if exists payout_remittance_records_select on public.payout_remittance_records;
create policy payout_remittance_records_select on public.payout_remittance_records for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:admin')
  or public.is_org_manager(organization_id)
  or (
    owner_user_id = auth.uid()
    and public.has_org_capability(organization_id, 'financial:read')
  )
);

drop policy if exists payout_allocations_select on public.payout_allocations;
create policy payout_allocations_select on public.payout_allocations for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:admin')
  or public.is_org_manager(organization_id)
  or (
    owner_user_id = auth.uid()
    and public.has_org_capability(organization_id, 'financial:read')
  )
);

drop policy if exists payout_attempts_select on public.payout_attempts;
create policy payout_attempts_select on public.payout_attempts for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:admin')
  or public.is_org_manager(organization_id)
  or exists (
    select 1
    from public.transfer_intents ti
    where ti.id = payout_attempts.transfer_intent_id
      and ti.organization_id = payout_attempts.organization_id
      and ti.owner_user_id = auth.uid()
      and public.has_org_capability(ti.organization_id, 'financial:read')
  )
);

-- Mutations remain service-role only (no authenticated INSERT/UPDATE policies).
