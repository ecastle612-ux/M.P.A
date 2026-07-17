import type { PortfolioActionTask, PortfolioCounts } from "./types";

export function buildPortfolioActionTasks(
  counts: PortfolioCounts,
  inviteSkipped: boolean
): PortfolioActionTask[] {
  return [
    { id: "organization", label: "Organization", complete: counts.organizations > 0 },
    { id: "property", label: "Property", complete: counts.properties > 0, href: "/properties/new" },
    { id: "units", label: "Units", complete: counts.units > 0, href: "/units/new" },
    { id: "tenants", label: "Tenants", complete: counts.tenants > 0, href: "/tenants/new" },
    {
      id: "lease",
      label: "Active Lease",
      complete: counts.activeLeases > 0,
      href: "/leases/new"
    },
    {
      id: "payment",
      label: "Record First Payment",
      complete: counts.payments > 0,
      href: "/financials/charges"
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
  if (counts.tenants === 0) return "Add a tenant to connect someone to a unit.";
  if (counts.leases === 0) return "Create a lease to formalize occupancy and rent terms.";
  if (counts.activeLeases === 0) return "Activate a lease to start collecting rent.";
  if (counts.payments === 0) return "Record your first payment to close the financial loop.";
  if (counts.vendors === 0) return "Add a vendor so you can assign maintenance work.";
  return null;
}
