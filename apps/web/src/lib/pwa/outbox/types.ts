/**
 * PMX-004 Phase 7 — offline outbox types ([11-offline-queue-design.md]).
 */

export type OutboxStatus = "pending" | "syncing" | "failed" | "acked";

export type OutboxBodyType = "json" | "form" | "multipart-meta";

export type OutboxWorkflow =
  | "maintenance_notes"
  | "maintenance_photo"
  | "vendor_photo"
  | "message_send"
  | "inspection_item"
  | "form_draft";

export type OutboxItem = {
  id: string;
  idempotencyKey: string;
  createdAt: number;
  updatedAt: number;
  status: OutboxStatus;
  method: "POST" | "PATCH" | "PUT";
  url: string;
  headers: Record<string, string>;
  bodyType: OutboxBodyType;
  body: unknown;
  blobKeys: string[];
  error?: string;
  attempts: number;
  workflow: OutboxWorkflow;
  organizationId: string;
  label: string;
};

export type OutboxBlobRecord = {
  key: string;
  blob: Blob;
  mime: string;
  name: string;
};

/** Media upload queued while offline — sync rebuilds intent → PUT → confirm. */
export type MediaOutboxBody = {
  kind: string;
  mimeType: string;
  byteSize: number;
  originalFilename: string;
  contentHash: string;
  organizationId: string | null;
  entityType: string | null;
  entityId: string | null;
  replaceAssetId: string | null;
};

export type OutboxSnapshot = {
  pendingCount: number;
  failedCount: number;
  syncing: boolean;
  pausedForAuth: boolean;
  items: OutboxItem[];
};

export const OUTBOX_DB_NAME = "mpa-outbox";
export const OUTBOX_DB_VERSION = 1;
export const OUTBOX_CHANNEL = "mpa-outbox";
export const OUTBOX_SYNC_TAG = "mpa-outbox-sync";

export const REQUIRES_CONNECTION_MESSAGE =
  "This action requires a connection. Reconnect and try again.";
