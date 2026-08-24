import { tenantOnlinePayAvailable } from "@mpa/shared";

/**
 * Tenant Portal online-pay presentation.
 * Server checkout authorization remains authoritative (docs/178 P1-01, docs/188).
 */
export function residentOnlinePayAvailable(input: {
  stripePaymentExecutionEnabled: boolean;
  occupancyAccess: string;
  connectReady?: boolean;
}): boolean {
  return tenantOnlinePayAvailable({
    stripePaymentExecutionEnabled: input.stripePaymentExecutionEnabled,
    occupancyAccess: input.occupancyAccess,
    connectReady: input.connectReady === true
  });
}
