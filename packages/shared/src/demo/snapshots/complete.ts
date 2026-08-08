import { DEMO_SNAPSHOT_VERSION } from "../session";
import { FO_DEMO_SNAPSHOT } from "./fo";
import { PM_DEMO_SNAPSHOT } from "./pm";
import type { DemoSnapshotBundle } from "./types";

/** Complete Platform — realistic cross-product relationships. */
export const COMPLETE_SNAPSHOT_BUNDLE: DemoSnapshotBundle = {
  version: DEMO_SNAPSHOT_VERSION,
  product: "mpa_complete_platform",
  watermark: "SYNTHETIC DEMO DATA — Complete Platform (PM + Facility)",
  pm: {
    ...PM_DEMO_SNAPSHOT,
    organizationName: "Summit Portfolio & Facilities (Demo)",
    assistantBrief:
      "Complete Platform demo: Property Manager desks are interactive; Facility areas demonstrate product shape. Switch personas or products without logging out."
  },
  fo: {
    ...FO_DEMO_SNAPSHOT,
    organizationName: "Summit Portfolio & Facilities (Demo)",
    assistantBrief:
      "Facility side of Complete Platform — linked portfolio context with Harborline/Summit synthetic sites."
  }
};
