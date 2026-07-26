/**
 * PMX-004 Phase 7 — offline-aware fetch for allowlisted JSON mutations.
 */

import { isExplicitlyBlockedOffline, matchAllowlistedRequest } from "./allowlist";
import { enqueueJsonRequest } from "./enqueue";
import { REQUIRES_CONNECTION_MESSAGE } from "./types";
import { requestOutboxBackgroundSync } from "../sw-client";

export type OfflineAwareFetchResult =
  | { kind: "network"; response: Response }
  | { kind: "queued"; outboxId: string; idempotencyKey: string };

export async function offlineAwareJsonFetch(input: {
  organizationId: string;
  method: "POST" | "PATCH" | "PUT";
  url: string;
  body: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<OfflineAwareFetchResult> {
  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  if (online) {
    const response = await fetch(input.url, {
      method: input.method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
        ...(input.headers ?? {})
      },
      body: JSON.stringify(input.body)
    });
    return { kind: "network", response };
  }

  if (isExplicitlyBlockedOffline(input.method, input.url)) {
    throw new Error(REQUIRES_CONNECTION_MESSAGE);
  }

  const match = matchAllowlistedRequest(input.method, input.url, input.body);
  if (!match) {
    throw new Error(REQUIRES_CONNECTION_MESSAGE);
  }

  const item = await enqueueJsonRequest({
    organizationId: input.organizationId,
    method: input.method,
    url: input.url,
    body: input.body,
    workflow: match.workflow,
    label: match.label,
    ...(input.headers ? { headers: input.headers } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {})
  });
  requestOutboxBackgroundSync();
  return { kind: "queued", outboxId: item.id, idempotencyKey: item.idempotencyKey };
}
