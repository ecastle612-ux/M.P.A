/**
 * Tenant Portal online-pay presentation.
 * Server checkout authorization remains authoritative (docs/178 P1-01).
 */
export function residentOnlinePayAvailable(input: {
  stripePaymentExecutionEnabled: boolean;
  occupancyAccess: string;
}): boolean {
  return input.stripePaymentExecutionEnabled === true && input.occupancyAccess === "active";
}
