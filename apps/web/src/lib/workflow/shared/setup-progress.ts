import type { PortfolioActionTask, PortfolioCounts } from "./types";

export function buildPortfolioActionTasks(
  counts: PortfolioCounts,
  inviteSkipped: boolean
): PortfolioActionTask[] {
  return [
    { id: "organization", label: "Organization", complete: counts.organizations > 0 },
    { id: "property", label: "Property", complete: counts.properties > 0, href: "/properties/new" },
    { id: "units", label: "Units", complete: counts.units > 0, href: "/units/new" },
    { id: "tenants", label: "Residents", complete: counts.tenants > 0, href: "/residents/move-in" },
    {
      id: "lease",
      label: "Active Lease",
      complete: counts.activeLeases > 0,
      href: "/residents/move-in"
    },
    {
      id: "payment",
      label: "Record First Payment",
      complete: counts.payments > 0,
      href: "/financials/payments/new"
    },
    {
      id: "invite",
      label: "Invite Team",
      complete: inviteSkipped || counts.invitations > 0,
      href: "/setup",
      optional: true
    }
  ];
}

export function estimateSetupMinutesRemaining(tasks: PortfolioActionTask[]): number {
  const incomplete = tasks.filter((task) => !task.complete && !task.optional);
  return incomplete.length * 2;
}

export function contextualPortfolioRecommendation(counts: PortfolioCounts): string | null {
  if (counts.properties === 0) return "Let's create your first property.";
  if (counts.units === 0) return "Add units so you can track occupancy and rent.";
  if (counts.tenants === 0) return "Start guided Move in to place your first resident.";
  if (counts.leases === 0) return "Continue Move in to generate and activate the lease.";
  if (counts.activeLeases === 0) return "Finish Move in activation so rent collection can start.";
  if (counts.payments === 0) return "Record your first payment to close the financial loop.";
  if (counts.vendors === 0) return "Add a vendor so you can assign maintenance work.";
  return null;
}
