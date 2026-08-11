/**
 * MA-4 Capacity fleet — same durable source as subscriptions (organization_subscriptions).
 * Read-only; capacity math via shared unit-volume / unit-capacity.
 */

import {
  loadMa4SubscriptionDetail,
  loadMa4SubscriptionsDirectory,
  type Ma4SubscriptionsDirectory
} from "./load-ma4-subscriptions";
import type { Ma4SubscriptionDetail, Ma4SubscriptionRow } from "./ma4-commercial";

export type Ma4CapacityDirectory = Ma4SubscriptionsDirectory & {
  anomaliesOnly: boolean;
};

export async function loadMa4CapacityDirectory(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> = {}
): Promise<Ma4CapacityDirectory> {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
    const raw = searchParams[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const anomaliesOnly = get("anomalies") === "1" || get("health") === "attention";
  const merged: Record<string, string | string[] | undefined> =
    searchParams instanceof URLSearchParams
      ? Object.fromEntries(searchParams.entries())
      : { ...searchParams };

  if (anomaliesOnly) merged["health"] = "attention";

  const directory = await loadMa4SubscriptionsDirectory(merged);
  return { ...directory, anomaliesOnly };
}

export async function loadMa4CapacityDetail(organizationId: string): Promise<{
  detail: Ma4SubscriptionDetail | null;
  row: Ma4SubscriptionRow | null;
  degraded: string[];
}> {
  const { detail, degraded } = await loadMa4SubscriptionDetail(organizationId);
  return {
    detail,
    row: detail?.commercial ?? null,
    degraded
  };
}
