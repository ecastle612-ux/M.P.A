/**
 * PMX-004 Phase 7 — IndexedDB `mpa-outbox` (`items` + `blobs`).
 */

import {
  OUTBOX_DB_NAME,
  OUTBOX_DB_VERSION,
  type OutboxBlobRecord,
  type OutboxItem,
  type OutboxStatus
} from "./types";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(OUTBOX_DB_NAME, OUTBOX_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("items")) {
        const items = db.createObjectStore("items", { keyPath: "id" });
        items.createIndex("by_status", "status", { unique: false });
        items.createIndex("by_created", "createdAt", { unique: false });
        items.createIndex("by_org", "organizationId", { unique: false });
        items.createIndex("by_idempotency", "idempotencyKey", { unique: true });
      }
      if (!db.objectStoreNames.contains("blobs")) {
        db.createObjectStore("blobs", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open outbox DB"));
  });
}

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export async function putOutboxItem(item: OutboxItem): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("items", "readwrite");
  tx.objectStore("items").put(item);
  await txDone(tx);
  db.close();
}

export async function putOutboxBlob(record: OutboxBlobRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("blobs", "readwrite");
  tx.objectStore("blobs").put(record);
  await txDone(tx);
  db.close();
}

export async function getOutboxItem(id: string): Promise<OutboxItem | null> {
  const db = await openDb();
  const tx = db.transaction("items", "readonly");
  const item = await req<OutboxItem | undefined>(tx.objectStore("items").get(id));
  db.close();
  return item ?? null;
}

export async function getOutboxBlob(key: string): Promise<OutboxBlobRecord | null> {
  const db = await openDb();
  const tx = db.transaction("blobs", "readonly");
  const blob = await req<OutboxBlobRecord | undefined>(tx.objectStore("blobs").get(key));
  db.close();
  return blob ?? null;
}

export async function listOutboxItems(): Promise<OutboxItem[]> {
  const db = await openDb();
  const tx = db.transaction("items", "readonly");
  const all = await req<OutboxItem[]>(tx.objectStore("items").getAll());
  db.close();
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function listActiveOutboxItems(): Promise<OutboxItem[]> {
  const all = await listOutboxItems();
  return all.filter((item) => item.status === "pending" || item.status === "failed" || item.status === "syncing");
}

export async function listFlushableOutboxItems(organizationId: string | null): Promise<OutboxItem[]> {
  const all = await listOutboxItems();
  return all
    .filter((item) => item.status === "pending" || item.status === "failed")
    .filter((item) => !organizationId || item.organizationId === organizationId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateOutboxItemStatus(
  id: string,
  status: OutboxStatus,
  patch: Partial<Pick<OutboxItem, "error" | "attempts" | "updatedAt">> = {}
): Promise<OutboxItem | null> {
  const existing = await getOutboxItem(id);
  if (!existing) return null;
  const next: OutboxItem = {
    ...existing,
    status,
    updatedAt: patch.updatedAt ?? Date.now(),
    attempts: patch.attempts ?? existing.attempts
  };
  if (patch.error !== undefined) {
    next.error = patch.error;
  } else if (status === "pending" || status === "syncing" || status === "acked") {
    delete next.error;
  }
  await putOutboxItem(next);
  return next;
}

export async function deleteOutboxItem(id: string): Promise<void> {
  const existing = await getOutboxItem(id);
  const db = await openDb();
  const tx = db.transaction(["items", "blobs"], "readwrite");
  tx.objectStore("items").delete(id);
  if (existing?.blobKeys?.length) {
    for (const key of existing.blobKeys) {
      tx.objectStore("blobs").delete(key);
    }
  }
  await txDone(tx);
  db.close();
}

export async function clearOutboxForOrganization(organizationId: string | null): Promise<number> {
  const items = await listOutboxItems();
  const targets = organizationId
    ? items.filter((item) => item.organizationId === organizationId)
    : items;
  for (const item of targets) {
    await deleteOutboxItem(item.id);
  }
  return targets.length;
}

export async function clearEntireOutbox(): Promise<number> {
  const items = await listOutboxItems();
  for (const item of items) {
    await deleteOutboxItem(item.id);
  }
  return items.length;
}

export async function findByIdempotencyKey(idempotencyKey: string): Promise<OutboxItem | null> {
  const db = await openDb();
  const tx = db.transaction("items", "readonly");
  const index = tx.objectStore("items").index("by_idempotency");
  const item = await req<OutboxItem | undefined>(index.get(idempotencyKey));
  db.close();
  return item ?? null;
}
