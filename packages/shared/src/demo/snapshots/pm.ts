import { DEMO_SNAPSHOT_VERSION } from "../session";
import type { DemoPmSnapshot, DemoSnapshotBundle } from "./types";

export const PM_DEMO_SNAPSHOT: DemoPmSnapshot = {
  organizationName: "Harborline Properties (Demo)",
  properties: [
    {
      id: "prop_oak",
      name: "Oak Street Apartments",
      address: "120 Oak St, Austin, TX",
      units: 48,
      occupancyPct: 94,
      openWorkOrders: 3
    },
    {
      id: "prop_river",
      name: "Riverfront Lofts",
      address: "88 River Rd, Austin, TX",
      units: 36,
      occupancyPct: 89,
      openWorkOrders: 5
    },
    {
      id: "prop_cedar",
      name: "Cedar Court",
      address: "15 Cedar Ct, Round Rock, TX",
      units: 24,
      occupancyPct: 100,
      openWorkOrders: 1
    }
  ],
  residents: [
    {
      id: "res_maya",
      name: "Maya Chen",
      unit: "204",
      propertyId: "prop_oak",
      leaseStatus: "active",
      balance: 0
    },
    {
      id: "res_jordan",
      name: "Jordan Blake",
      unit: "12B",
      propertyId: "prop_river",
      leaseStatus: "notice",
      balance: 1850
    },
    {
      id: "res_priya",
      name: "Priya Nair",
      unit: "3A",
      propertyId: "prop_cedar",
      leaseStatus: "active",
      balance: 120
    },
    {
      id: "res_sam",
      name: "Sam Ortiz",
      unit: "118",
      propertyId: "prop_oak",
      leaseStatus: "pending",
      balance: 0
    }
  ],
  leases: [
    {
      id: "lease_maya",
      residentId: "res_maya",
      propertyId: "prop_oak",
      unit: "204",
      startDate: "2025-09-01",
      endDate: "2026-08-31",
      rent: 1650
    },
    {
      id: "lease_jordan",
      residentId: "res_jordan",
      propertyId: "prop_river",
      unit: "12B",
      startDate: "2024-04-01",
      endDate: "2026-03-31",
      rent: 2100
    },
    {
      id: "lease_priya",
      residentId: "res_priya",
      propertyId: "prop_cedar",
      unit: "3A",
      startDate: "2025-01-15",
      endDate: "2026-01-14",
      rent: 1425
    }
  ],
  workOrders: [
    {
      id: "wo_hvac",
      title: "HVAC not cooling — Unit 12B",
      propertyId: "prop_river",
      status: "in_progress",
      priority: "urgent",
      assignee: "Alex Rivera (Tech)"
    },
    {
      id: "wo_leak",
      title: "Kitchen faucet drip — Unit 204",
      propertyId: "prop_oak",
      status: "scheduled",
      priority: "normal",
      assignee: "Summit Plumbing"
    },
    {
      id: "wo_gate",
      title: "Gate keypad intermittent",
      propertyId: "prop_cedar",
      status: "open",
      priority: "low",
      assignee: "Unassigned"
    }
  ],
  invoices: [
    {
      id: "inv_summit",
      vendor: "Summit Plumbing",
      amount: 420,
      status: "pending_approval",
      propertyId: "prop_oak"
    },
    {
      id: "inv_green",
      vendor: "GreenScape Lawn",
      amount: 980,
      status: "approved",
      propertyId: "prop_river"
    }
  ],
  documents: [
    {
      id: "doc_lease",
      name: "Lease — Maya Chen 204.pdf",
      category: "Leasing",
      updatedAt: "2025-09-01"
    },
    {
      id: "doc_coi",
      name: "COI — Summit Plumbing.pdf",
      category: "Vendors",
      updatedAt: "2026-06-12"
    },
    {
      id: "doc_owner",
      name: "Owner summary — June 2026.csv",
      category: "Financial",
      updatedAt: "2026-07-02"
    }
  ],
  messages: [
    {
      id: "msg_1",
      from: "Jordan Blake",
      subject: "Move-out inspection timing",
      preview: "Can we schedule the inspection for next Tuesday afternoon?",
      at: "2026-08-06T14:22:00Z"
    },
    {
      id: "msg_2",
      from: "Summit Plumbing",
      subject: "Parts delayed for faucet job",
      preview: "Cartridge arrives tomorrow; proposing Wednesday 10am.",
      at: "2026-08-07T09:05:00Z"
    }
  ],
  attention: [
    {
      id: "att_1",
      title: "Past-due balance — Jordan Blake",
      severity: "immediate",
      module: "Financial Operations",
      detail: "$1,850 open · collections path ready"
    },
    {
      id: "att_2",
      title: "Urgent work order — HVAC 12B",
      severity: "immediate",
      module: "Maintenance",
      detail: "In progress with Alex Rivera"
    },
    {
      id: "att_3",
      title: "Lease ending in 45 days — Priya Nair",
      severity: "waiting",
      module: "Leasing",
      detail: "Renewal outreach not started"
    },
    {
      id: "att_4",
      title: "Vendor invoice awaiting approval",
      severity: "waiting",
      module: "Financial Operations",
      detail: "Summit Plumbing · $420"
    }
  ],
  assistantBrief:
    "Three properties need attention today: collect on Riverfront 12B, keep HVAC moving, and start Cedar Court renewal outreach. No card payments run in demo."
};

export const PM_SNAPSHOT_BUNDLE: DemoSnapshotBundle = {
  version: DEMO_SNAPSHOT_VERSION,
  product: "mpa_property_manager",
  watermark: "SYNTHETIC DEMO DATA — not a real organization",
  pm: PM_DEMO_SNAPSHOT,
  fo: null
};
