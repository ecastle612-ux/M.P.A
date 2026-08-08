import { DEMO_SNAPSHOT_VERSION } from "../session";
import type { DemoFoSnapshot, DemoSnapshotBundle } from "./types";

export const FO_DEMO_SNAPSHOT: DemoFoSnapshot = {
  organizationName: "Northbridge Facilities (Demo)",
  sites: [
    {
      id: "site_hq",
      name: "Northbridge HQ",
      city: "Dallas, TX",
      locations: 12,
      assets: 86
    },
    {
      id: "site_plant",
      name: "East Plant",
      city: "Garland, TX",
      locations: 8,
      assets: 124
    }
  ],
  assets: [
    {
      id: "asset_chiller",
      name: "Chiller Plant A",
      siteId: "site_hq",
      system: "HVAC",
      status: "attention"
    },
    {
      id: "asset_gen",
      name: "Emergency Generator 2",
      siteId: "site_plant",
      system: "Electrical",
      status: "operational"
    },
    {
      id: "asset_pump",
      name: "Fire Pump House",
      siteId: "site_hq",
      system: "Life Safety",
      status: "operational"
    }
  ],
  correctiveWork: [
    {
      id: "cw_1",
      title: "Chiller vibration above threshold",
      propertyId: "site_hq",
      status: "in_progress",
      priority: "urgent",
      assignee: "Chris Patel"
    },
    {
      id: "cw_2",
      title: "Dock leveler sensor fault",
      propertyId: "site_plant",
      status: "open",
      priority: "normal",
      assignee: "Unassigned"
    }
  ],
  preventiveTasks: [
    {
      id: "pm_1",
      title: "Quarterly generator load test",
      due: "2026-08-12",
      siteId: "site_plant"
    },
    {
      id: "pm_2",
      title: "Monthly fire pump churn",
      due: "2026-08-09",
      siteId: "site_hq"
    }
  ],
  inventory: [
    {
      id: "inv_1",
      sku: "FLT-20",
      name: "HVAC filter 20x25",
      qty: 48,
      location: "HQ Stores"
    },
    {
      id: "inv_2",
      sku: "BELT-A",
      name: "Drive belt A-series",
      qty: 6,
      location: "East Plant Cage"
    }
  ],
  inspections: [
    {
      id: "insp_1",
      title: "Life safety walkthrough",
      status: "scheduled",
      siteId: "site_hq"
    },
    {
      id: "insp_2",
      title: "Roof condition survey",
      status: "in_progress",
      siteId: "site_plant"
    }
  ],
  safetyItems: [
    { id: "saf_1", title: "Near-miss: wet dock floor", severity: "medium" },
    { id: "saf_2", title: "Lockout/tagout kit audit due", severity: "low" }
  ],
  complianceItems: [
    { id: "cmp_1", title: "Boiler permit renewal", due: "2026-09-01" },
    { id: "cmp_2", title: "Elevator certificate posting", due: "2026-08-20" }
  ],
  attention: [
    {
      id: "fo_att_1",
      title: "Chiller Plant A needs diagnosis",
      severity: "immediate",
      module: "Building Systems",
      detail: "Corrective work in progress with Chris Patel"
    },
    {
      id: "fo_att_2",
      title: "Fire pump preventive done this week",
      severity: "waiting",
      module: "Preventive Maintenance",
      detail: "Due 2026-08-09"
    },
    {
      id: "fo_att_3",
      title: "Compliance: elevator certificate",
      severity: "waiting",
      module: "Compliance",
      detail: "Due 2026-08-20"
    }
  ],
  assistantBrief:
    "Facility demo surfaces show product shape with synthetic sites, assets, and work. Enterprise implementation deepens operational workflows."
};

export const FO_SNAPSHOT_BUNDLE: DemoSnapshotBundle = {
  version: DEMO_SNAPSHOT_VERSION,
  product: "mpa_facility_operations",
  watermark: "SYNTHETIC DEMO DATA — Facility product demonstration",
  pm: null,
  fo: FO_DEMO_SNAPSHOT
};
