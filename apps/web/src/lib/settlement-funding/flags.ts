/**
 * PAY-001 env kill switch (S6).
 * Independent of FIN-003 transfer enablement — this module never flips FIN-003 flags.
 */

export function isPay001DestinationFundingEnvEnabled(): boolean {
  const value = process.env["PAY001_DESTINATION_FUNDING_ENABLED"]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}
