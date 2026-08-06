/**
 * LAUNCH-001 J8 — Owner Portfolio Review helpers (operational insight only).
 * Rule-based summary of existing FO / WO / leasing / activity signals.
 */

import { formatMoney } from "../finance/billing";

export type OwnerPortfolioBriefingInput = {
  propertyCount: number;
  unitsOccupied: number;
  unitsTotal: number;
  occupancyRate: number;
  currentMonthIncome: number;
  outstandingRent: number;
  vendorPayments: number;
  openMaintenanceCount: number;
  activeLeaseCount: number;
  recentPaymentCount: number;
};

export function buildOwnerPortfolioAssistantSummary(input: OwnerPortfolioBriefingInput): string {
  const occupancy =
    input.unitsTotal > 0
      ? `${input.occupancyRate}% occupied (${input.unitsOccupied}/${input.unitsTotal})`
      : "no units yet";

  const rentLine =
    input.outstandingRent > 0
      ? `${formatMoney(input.outstandingRent)} still outstanding`
      : "rent looks current";

  const maintenanceLine =
    input.openMaintenanceCount > 0
      ? `${input.openMaintenanceCount} open maintenance item(s)`
      : "no open maintenance";

  return [
    `Portfolio: ${input.propertyCount} propert${input.propertyCount === 1 ? "y" : "ies"}, ${occupancy}.`,
    `This month collected ${formatMoney(input.currentMonthIncome)}; ${rentLine}.`,
    `Vendor spend recorded ${formatMoney(input.vendorPayments)}; ${maintenanceLine}; ${input.activeLeaseCount} active lease(s).`,
    input.recentPaymentCount > 0
      ? `${input.recentPaymentCount} recent payment(s) to review.`
      : "No recent payments yet."
  ].join(" ");
}

export function buildOwnerPortfolioReadyAssistantCopy(): string {
  return "I can confidently monitor my investment portfolio using M.P.A.";
}

export function buildOwnerPortfolioGreeting(input: {
  displayName?: string | null;
  hour?: number;
}): string {
  const hour = input.hour ?? new Date().getHours();
  const name = input.displayName?.trim() || "there";
  const part =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}. Here's how your portfolio is performing.`;
}
