import type { DemoProductId } from "../products";
import { COMPLETE_SNAPSHOT_BUNDLE } from "./complete";
import { FO_SNAPSHOT_BUNDLE } from "./fo";
import { PM_SNAPSHOT_BUNDLE } from "./pm";
import type { DemoSnapshotBundle } from "./types";

export * from "./types";
export { PM_DEMO_SNAPSHOT, PM_SNAPSHOT_BUNDLE } from "./pm";
export { FO_DEMO_SNAPSHOT, FO_SNAPSHOT_BUNDLE } from "./fo";
export { COMPLETE_SNAPSHOT_BUNDLE } from "./complete";

export function getDemoSnapshot(product: DemoProductId): DemoSnapshotBundle {
  switch (product) {
    case "mpa_facility_operations":
      return FO_SNAPSHOT_BUNDLE;
    case "mpa_complete_platform":
      return COMPLETE_SNAPSHOT_BUNDLE;
    case "mpa_property_manager":
    default:
      return PM_SNAPSHOT_BUNDLE;
  }
}

export function assertSnapshotIntegrity(bundle: DemoSnapshotBundle): string[] {
  const issues: string[] = [];
  if (!bundle.version) {
    issues.push("missing_version");
  }
  if (!bundle.watermark.includes("SYNTHETIC")) {
    issues.push("missing_watermark");
  }
  if (bundle.product === "mpa_property_manager" || bundle.product === "mpa_complete_platform") {
    if (!bundle.pm) {
      issues.push("pm_snapshot_missing");
    } else {
      if (bundle.pm.properties.length < 1) issues.push("pm_properties_empty");
      if (bundle.pm.residents.length < 1) issues.push("pm_residents_empty");
      if (bundle.pm.workOrders.length < 1) issues.push("pm_work_orders_empty");
      if (bundle.pm.attention.length < 1) issues.push("pm_attention_empty");
    }
  }
  if (bundle.product === "mpa_facility_operations" || bundle.product === "mpa_complete_platform") {
    if (!bundle.fo) {
      issues.push("fo_snapshot_missing");
    } else {
      if (bundle.fo.sites.length < 1) issues.push("fo_sites_empty");
      if (bundle.fo.assets.length < 1) issues.push("fo_assets_empty");
      if (bundle.fo.correctiveWork.length < 1) issues.push("fo_corrective_empty");
    }
  }
  return issues;
}
