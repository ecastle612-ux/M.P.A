/**
 * PMX-004 Phase 7 — enqueue allowlisted offline mutations.
 */

import { matchAllowlistedRequest } from "./allowlist";
import { findByIdempotencyKey, putOutboxBlob, putOutboxItem } from "./db";
import {
  REQUIRES_CONNECTION_MESSAGE,
  type MediaOutboxBody,
  type OutboxItem,
  type OutboxWorkflow
} from "./types";

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function notifyOutboxChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mpa:outbox-changed"));
  try {
    const channel = new BroadcastChannel("mpa-outbox");
    channel.postMessage({ type: "changed" });
    channel.close();
  } catch {
    // BroadcastChannel optional
  }
}

export type EnqueueJsonInput = {
  organizationId: string;
  method: "POST" | "PATCH" | "PUT";
  url: string;
  body: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  label?: string;
  workflow?: OutboxWorkflow;
};

export async function enqueueJsonRequest(input: EnqueueJsonInput): Promise<OutboxItem> {
  const match = matchAllowlistedRequest(input.method, input.url, input.body);
  if (!match && !input.workflow) {
    throw new Error(REQUIRES_CONNECTION_MESSAGE);
  }

  const idempotencyKey = input.idempotencyKey ?? newId();
  const existing = await findByIdempotencyKey(idempotencyKey);
  if (existing && existing.status !== "acked") {
    return existing;
  }

  const now = Date.now();
  const item: OutboxItem = {
    id: newId(),
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    method: input.method,
    url: input.url,
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      ...(input.headers ?? {})
    },
    bodyType: "json",
    body: input.body,
    blobKeys: [],
    attempts: 0,
    workflow: input.workflow ?? match!.workflow,
    organizationId: input.organizationId,
    label: input.label ?? match?.label ?? "Queued change"
  };

  await putOutboxItem(item);
  notifyOutboxChanged();
  return item;
}

export type EnqueueMediaInput = {
  organizationId: string;
  blob: Blob;
  filename: string;
  mimeType: string;
  contentHash: string;
  kind: string;
  entityType: string | null;
  entityId: string | null;
  replaceAssetId: string | null;
  idempotencyKey?: string;
};

export async function enqueueMediaUpload(input: EnqueueMediaInput): Promise<OutboxItem> {
  const idempotencyKey = input.idempotencyKey ?? newId();
  const existing = await findByIdempotencyKey(idempotencyKey);
  if (existing && existing.status !== "acked") {
    return existing;
  }

  const blobKey = `blob-${newId()}`;
  await putOutboxBlob({
    key: blobKey,
    blob: input.blob,
    mime: input.mimeType,
    name: input.filename
  });

  const body: MediaOutboxBody = {
    kind: input.kind,
    mimeType: input.mimeType,
    byteSize: input.blob.size,
    originalFilename: input.filename,
    contentHash: input.contentHash,
    organizationId: input.organizationId || null,
    entityType: input.entityType,
    entityId: input.entityId,
    replaceAssetId: input.replaceAssetId
  };

  const now = Date.now();
  const item: OutboxItem = {
    id: newId(),
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    method: "POST",
    url: "/api/media/intent",
    headers: {
      "Idempotency-Key": idempotencyKey
    },
    bodyType: "multipart-meta",
    body,
    blobKeys: [blobKey],
    attempts: 0,
    workflow: "maintenance_photo",
    organizationId: input.organizationId,
    label: `Photo: ${input.filename}`
  };

  await putOutboxItem(item);
  notifyOutboxChanged();
  return item;
}

export type EnqueueVendorPhotoInput = {
  organizationId: string;
  token: string;
  blob: Blob;
  filename: string;
  mimeType: string;
  idempotencyKey?: string;
};

export async function enqueueVendorPhoto(input: EnqueueVendorPhotoInput): Promise<OutboxItem> {
  const idempotencyKey = input.idempotencyKey ?? newId();
  const existing = await findByIdempotencyKey(idempotencyKey);
  if (existing && existing.status !== "acked") {
    return existing;
  }

  const blobKey = `blob-${newId()}`;
  await putOutboxBlob({
    key: blobKey,
    blob: input.blob,
    mime: input.mimeType,
    name: input.filename
  });

  const now = Date.now();
  const item: OutboxItem = {
    id: newId(),
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    method: "POST",
    url: `/api/vendor-jobs/${encodeURIComponent(input.token)}/photo`,
    headers: {
      "Idempotency-Key": idempotencyKey
    },
    bodyType: "form",
    body: { fieldName: "file", filename: input.filename },
    blobKeys: [blobKey],
    attempts: 0,
    workflow: "vendor_photo",
    organizationId: input.organizationId,
    label: `Vendor photo: ${input.filename}`
  };

  await putOutboxItem(item);
  notifyOutboxChanged();
  return item;
}
