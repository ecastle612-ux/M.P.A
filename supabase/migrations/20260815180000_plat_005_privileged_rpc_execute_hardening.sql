-- PLAT-005 privileged RPC EXECUTE hardening
-- Approved: docs/118-plat-005-privileged-rpc-execute-hardening
-- ADR-026 remains authoritative. No new ADR.
--
-- Successor after Production ledger 20260814233536 / ops_001_operational_workspace.
-- GRANT / REVOKE EXECUTE only. Idempotent. Full signatures.
-- Does not replace function bodies, alter tables, mutate rows, or change roles/SKUs.
-- Do not apply to Production from the implementation task.

-- =============================================================================
-- Class B — service_role only (P0 privileged resolvers / claimers)
-- =============================================================================

revoke all on function public.resolve_auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.resolve_auth_user_id_by_email(text) to service_role;

revoke all on function public.auth_resolve_login_identifier(text) from public, anon, authenticated;
grant execute on function public.auth_resolve_login_identifier(text) to service_role;

revoke all on function public.auth_register_username(text, uuid) from public, anon, authenticated;
grant execute on function public.auth_register_username(text, uuid) to service_role;

revoke all on function public.ops_claim_domain_events(integer, text) from public, anon, authenticated;
grant execute on function public.ops_claim_domain_events(integer, text) to service_role;

revoke all on function public.ops_claim_due_reminders(integer, text) from public, anon, authenticated;
grant execute on function public.ops_claim_due_reminders(integer, text) to service_role;

revoke all on function public.ops_acquire_scheduler_leader(text, integer) from public, anon, authenticated;
grant execute on function public.ops_acquire_scheduler_leader(text, integer) to service_role;

-- =============================================================================
-- Class A leftovers — keep authenticated + service_role; revoke PUBLIC / anon
-- =============================================================================

revoke all on function public.has_org_capability(uuid, text) from public, anon;
grant execute on function public.has_org_capability(uuid, text) to authenticated, service_role;

revoke all on function public.is_org_member(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;

revoke all on function public.is_org_manager(uuid) from public, anon;
grant execute on function public.is_org_manager(uuid) to authenticated, service_role;

revoke all on function public.is_platform_operator() from public, anon;
grant execute on function public.is_platform_operator() to authenticated, service_role;

revoke all on function public.is_maintenance_manager(uuid) from public, anon;
grant execute on function public.is_maintenance_manager(uuid) to authenticated, service_role;

revoke all on function public.is_maintenance_technician(uuid) from public, anon;
grant execute on function public.is_maintenance_technician(uuid) to authenticated, service_role;

revoke all on function public.is_lease_resident(uuid) from public, anon;
grant execute on function public.is_lease_resident(uuid) to authenticated, service_role;

revoke all on function public.is_leasing_writer(uuid) from public, anon;
grant execute on function public.is_leasing_writer(uuid) to authenticated, service_role;

revoke all on function public.is_resident_writer(uuid) from public, anon;
grant execute on function public.is_resident_writer(uuid) to authenticated, service_role;

revoke all on function public.is_linked_vendor_for_work_order(uuid) from public, anon;
grant execute on function public.is_linked_vendor_for_work_order(uuid) to authenticated, service_role;

revoke all on function public.is_work_order_resident(uuid) from public, anon;
grant execute on function public.is_work_order_resident(uuid) to authenticated, service_role;

revoke all on function public.is_conversation_thread_participant(uuid, uuid) from public, anon;
grant execute on function public.is_conversation_thread_participant(uuid, uuid) to authenticated, service_role;

-- =============================================================================
-- Class A already hardened in repo history — idempotent restatement
-- PUBLIC / anon revoked; authenticated + service_role retained.
-- =============================================================================

revoke all on function public.apply_facility_stock_movement(uuid, text, numeric, text, uuid) from public, anon;
grant execute on function public.apply_facility_stock_movement(uuid, text, numeric, text, uuid) to authenticated, service_role;

revoke all on function public.can_manage_facility_ops(uuid) from public, anon;
grant execute on function public.can_manage_facility_ops(uuid) to authenticated, service_role;

revoke all on function public.can_select_facility_asset(uuid) from public, anon;
grant execute on function public.can_select_facility_asset(uuid) to authenticated, service_role;

revoke all on function public.can_select_facility_stock_item(uuid) from public, anon;
grant execute on function public.can_select_facility_stock_item(uuid) to authenticated, service_role;

revoke all on function public.can_select_work_order(uuid) from public, anon;
grant execute on function public.can_select_work_order(uuid) to authenticated, service_role;

revoke all on function public.can_access_tenant_conversation(uuid, uuid, uuid) from public, anon;
grant execute on function public.can_access_tenant_conversation(uuid, uuid, uuid) to authenticated, service_role;

revoke all on function public.is_pm_comms_staff(uuid) from public, anon;
grant execute on function public.is_pm_comms_staff(uuid) to authenticated, service_role;

revoke all on function public.org_sku(uuid) from public, anon;
grant execute on function public.org_sku(uuid) to authenticated, service_role;

revoke all on function public.org_allows_work_surface(uuid, text) from public, anon;
grant execute on function public.org_allows_work_surface(uuid, text) to authenticated, service_role;

-- =============================================================================
-- Class D — remove client EXECUTE. Do not drop functions.
-- Trigger / event-trigger runtime still invokes as owner.
-- =============================================================================

revoke all on function public.is_pm_staff(uuid) from public, anon, authenticated;

revoke all on function public.resolve_building_qr_token(text) from public, anon, authenticated;

revoke all on function public.create_building_qr_code_for_property() from public, anon, authenticated, service_role;

revoke all on function public.rls_auto_enable() from public, anon, authenticated, service_role;
