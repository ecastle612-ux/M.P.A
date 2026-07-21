import type { MasterAdminPortal } from "./contracts";

/** Display-only demo fixtures for Portal Test Mode (never shown to non–Master Admin). */
export function getPortalDemoFixture(portal: MasterAdminPortal) {
  switch (portal) {
    case "resident":
      return {
        title: "Demo resident home",
        summary: "You have 1 active demo lease and a $1,250.00 balance due on the 1st.",
        cards: [
          { label: "Lease", value: "Demo lease · Unit 101 · Ends Dec 31" },
          { label: "Balance", value: "$1,250.00 due" },
          { label: "Maintenance", value: "1 open demo request — Kitchen faucet drip" }
        ]
      };
    case "vendor":
      return {
        title: "Demo vendor schedule",
        summary: "2 assigned demo work orders for this week.",
        cards: [
          { label: "WO-DEMO-01", value: "HVAC filter · Due tomorrow · In progress" },
          { label: "WO-DEMO-02", value: "Unit turn paint · Scheduled Friday" }
        ]
      };
    case "owner":
      return {
        title: "Demo owner portfolio",
        summary: "1 property · 12 units · 91% occupancy · Net operating snapshot.",
        cards: [
          { label: "Portfolio", value: "Harbor Demo Residences" },
          { label: "Financials", value: "Collected $42,800 · Outstanding $1,250" },
          { label: "Vacancies", value: "1 vacant-ready unit" }
        ]
      };
    case "manager":
      return {
        title: "Demo manager desk",
        summary: "Operations Center remains the primary manager workspace. This portal shell is Test Mode only.",
        cards: [
          { label: "Attention", value: "3 work orders · 1 lease expiring · 1 vacancy" },
          { label: "Next", value: "Open Operations Center for live workflows" }
        ]
      };
  }
}
