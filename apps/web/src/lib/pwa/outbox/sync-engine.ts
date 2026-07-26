/**
 * PMX-004 Phase 7 — page-driven outbox sync engine.
 * SW only wakes clients via MPA_SYNC_REQUEST (auth cookies stay in-page).
 */

import {
  deleteOutboxItem,
  getOutboxBlob,
  getOutboxItem,
  listFlushableOutboxItems,
  putOutboxItem
} from "./db";
import { notifyOutboxChanged } from "./enqueue";
import type { MediaOutboxBody, OutboxItem } from "./types";
import { requestOutboxBackgroundSync } from "../sw-client";

let syncing = false;
let pausedForAuth = false;
let syncLockTab: string | null = null;

const TAB_ID =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `tab-${Date.now()}`;

export function isOutboxSyncing(): boolean {
  return syncing;
}

export function isOutboxPausedForAuth(): boolean {
  return pausedForAuth;
}

export function resumeOutboxAfterAuth(): void {
  pausedForAuth = false;
  notifyOutboxChanged();
}

async function claimSyncLock(): Promise<boolean> {
  if (typeof BroadcastChannel === "undefined") return true;
  return new Promise((resolve) => {
    const channel = new BroadcastChannel("mpa-outbox-lock");
    let claimed = false;
    const timeout = window.setTimeout(() => {
      if (!claimed) {
        claimed = true;
        syncLockTab = TAB_ID;
        channel.postMessage({ type: "claim", tabId: TAB_ID });
        channel.close();
        resolve(true);
      }
    }, 40);
    channel.onmessage = (event: MessageEvent<{ type?: string; tabId?: string }>) => {
      const data = event.data;
      if (data?.type === "claim" && data.tabId && data.tabId !== TAB_ID) {
        if (!claimed) {
          claimed = true;
          window.clearTimeout(timeout);
          channel.close();
          resolve(false);
        }
      }
    };
    channel.postMessage({ type: "ping", tabId: TAB_ID });
  });
}

function releaseSyncLock(): void {
  if (syncLockTab === TAB_ID) syncLockTab = null;
  try {
    const channel = new BroadcastChannel("mpa-outbox-lock");
    channel.postMessage({ type: "release", tabId: TAB_ID });
    channel.close();
  } catch {
    // optional
  }
}

async function flushJsonItem(item: OutboxItem): Promise<"ok" | "conflict" | "network" | "auth"> {
  try {
    const response = await fetch(item.url, {
      method: item.method,
      credentials: "same-origin",
      headers: item.headers,
      body: JSON.stringify(item.body)
    });
    if (response.status === 401) return "auth";
    if (response.status === 409 || response.status === 422) return "conflict";
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      throw new Error(payload?.message ?? payload?.error ?? `HTTP ${response.status}`);
    }
    return "ok";
  } catch (error) {
    if (error instanceof TypeError) return "network";
    throw error;
  }
}

async function flushMediaItem(item: OutboxItem): Promise<"ok" | "conflict" | "network" | "auth"> {
  const meta = item.body as MediaOutboxBody;
  const blobKey = item.blobKeys[0];
  if (!blobKey) throw new Error("Missing photo blob");
  const blobRecord = await getOutboxBlob(blobKey);
  if (!blobRecord) throw new Error("Photo blob not found in outbox");

  try {
    const intentResponse = await fetch("/api/media/intent", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": item.idempotencyKey
      },
      body: JSON.stringify({
        kind: meta.kind,
        mimeType: meta.mimeType,
        byteSize: meta.byteSize,
        originalFilename: meta.originalFilename,
        contentHash: meta.contentHash,
        organizationId: meta.organizationId,
        entityType: meta.entityType,
        entityId: meta.entityId,
        replaceAssetId: meta.replaceAssetId
      })
    });
    if (intentResponse.status === 401) return "auth";
    if (intentResponse.status === 409 || intentResponse.status === 422) return "conflict";
    if (!intentResponse.ok) {
      const payload = (await intentResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? `Intent failed (HTTP ${intentResponse.status})`);
    }
    const intentPayload = (await intentResponse.json()) as {
      uploadUrl: string;
      asset: { id: string };
    };

    const uploadResponse = await fetch(intentPayload.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": meta.mimeType,
        "x-upsert": "true"
      },
      body: blobRecord.blob
    });
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed (HTTP ${uploadResponse.status})`);
    }

    const confirmResponse = await fetch(`/api/media/${intentPayload.asset.id}?action=confirm`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Idempotency-Key": item.idempotencyKey
      }
    });
    if (confirmResponse.status === 401) return "auth";
    if (confirmResponse.status === 409 || confirmResponse.status === 422) return "conflict";
    if (!confirmResponse.ok) {
      const payload = (await confirmResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Could not confirm upload");
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mpa:outbox-media-acked", {
          detail: { outboxId: item.id, assetId: intentPayload.asset.id }
        })
      );
    }
    return "ok";
  } catch (error) {
    if (error instanceof TypeError) return "network";
    throw error;
  }
}

async function flushVendorPhoto(item: OutboxItem): Promise<"ok" | "conflict" | "network" | "auth"> {
  const blobKey = item.blobKeys[0];
  if (!blobKey) throw new Error("Missing vendor photo blob");
  const blobRecord = await getOutboxBlob(blobKey);
  if (!blobRecord) throw new Error("Vendor photo blob not found");
  const form = new FormData();
  const fieldName =
    item.body && typeof item.body === "object" && item.body !== null && "fieldName" in item.body
      ? String((item.body as { fieldName?: string }).fieldName ?? "file")
      : "file";
  form.append(fieldName, blobRecord.blob, blobRecord.name);
  try {
    const response = await fetch(item.url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Idempotency-Key": item.idempotencyKey
      },
      body: form
    });
    if (response.status === 401) return "auth";
    if (response.status === 409 || response.status === 422) return "conflict";
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      throw new Error(payload?.message ?? payload?.error ?? `HTTP ${response.status}`);
    }
    return "ok";
  } catch (error) {
    if (error instanceof TypeError) return "network";
    throw error;
  }
}

async function flushItem(item: OutboxItem): Promise<"ok" | "conflict" | "network" | "auth"> {
  if (item.bodyType === "multipart-meta" && item.workflow === "maintenance_photo") {
    return flushMediaItem(item);
  }
  if (item.bodyType === "form" && item.workflow === "vendor_photo") {
    return flushVendorPhoto(item);
  }
  return flushJsonItem(item);
}

export type FlushResult = {
  synced: number;
  failed: number;
  pausedForAuth: boolean;
};

export async function flushOutbox(organizationId: string | null): Promise<FlushResult> {
  if (typeof window === "undefined") {
    return { synced: 0, failed: 0, pausedForAuth: false };
  }
  if (!navigator.onLine) {
    return { synced: 0, failed: 0, pausedForAuth: pausedForAuth };
  }
  if (pausedForAuth) {
    return { synced: 0, failed: 0, pausedForAuth: true };
  }
  if (syncing) {
    return { synced: 0, failed: 0, pausedForAuth: false };
  }

  const claimed = await claimSyncLock();
  if (!claimed) {
    return { synced: 0, failed: 0, pausedForAuth: false };
  }

  syncing = true;
  notifyOutboxChanged();

  let synced = 0;
  let failed = 0;

  try {
    const items = await listFlushableOutboxItems(organizationId);
    for (const item of items) {
      // Drop cross-org if active org changed
      if (organizationId && item.organizationId && item.organizationId !== organizationId) {
        continue;
      }

      const syncingItem: OutboxItem = {
        ...item,
        status: "syncing",
        updatedAt: Date.now(),
        attempts: item.attempts + 1,
        error: undefined
      };
      await putOutboxItem(syncingItem);
      notifyOutboxChanged();

      try {
        const result = await flushItem(syncingItem);
        if (result === "ok") {
          await deleteOutboxItem(item.id);
          synced += 1;
        } else if (result === "auth") {
          pausedForAuth = true;
          await putOutboxItem({
            ...syncingItem,
            status: "pending",
            error: "Sign in again to sync queued changes.",
            updatedAt: Date.now()
          });
          break;
        } else if (result === "conflict") {
          await putOutboxItem({
            ...syncingItem,
            status: "failed",
            error: "Conflict — review this item and retry or discard.",
            updatedAt: Date.now()
          });
          failed += 1;
        } else {
          await putOutboxItem({
            ...syncingItem,
            status: "pending",
            error: "Network error — will retry when online.",
            updatedAt: Date.now()
          });
          break;
        }
      } catch (error) {
        await putOutboxItem({
          ...syncingItem,
          status: "failed",
          error: error instanceof Error ? error.message : "Sync failed",
          updatedAt: Date.now()
        });
        failed += 1;
      }
      notifyOutboxChanged();
    }
  } finally {
    syncing = false;
    releaseSyncLock();
    notifyOutboxChanged();
    void requestOutboxBackgroundSync();
  }

  return { synced, failed, pausedForAuth };
}

export async function retryOutboxItem(id: string, organizationId: string | null): Promise<void> {
  const item = await getOutboxItem(id);
  if (!item) return;
  const next: OutboxItem = {
    ...item,
    status: "pending",
    updatedAt: Date.now()
  };
  delete next.error;
  await putOutboxItem(next);
  notifyOutboxChanged();
  await flushOutbox(organizationId);
}
