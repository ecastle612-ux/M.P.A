/**
 * FIN-003 Phase E (R-D1) — mirrors SQL owner-row SELECT policy for unit/integration tests.
 * Staff: payout:manage · financial:admin · property_manager (is_org_manager).
 * Owners: financial:read AND owner_user_id = viewer.
 */
export function canSelectOwnerPayoutRow(input: {
  viewerUserId: string;
  rowOwnerUserId: string;
  isPayoutManage: boolean;
  isFinancialAdmin: boolean;
  isOrgManager: boolean;
  hasFinancialRead: boolean;
}): boolean {
  if (input.isPayoutManage || input.isFinancialAdmin || input.isOrgManager) return true;
  return input.hasFinancialRead && input.rowOwnerUserId === input.viewerUserId;
}
