-- FIN-003 Phase B: capability refinement (least privilege)
-- PMs use payout:manage for org settlement; owners keep payout:onboard.
-- Removes redundant property_manager → payout:onboard grant from Phase A.

delete from public.role_permission_grants
where role = 'property_manager'
  and capability_key = 'payout:onboard';
