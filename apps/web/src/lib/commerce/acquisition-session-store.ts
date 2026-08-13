/**
 * Acquisition quote + snapshot store.
 * Process memory is an optional cache. Durable backend (shared Map in tests;
 * signed cookie hydration in Production) is authoritative across isolates.
 */

import type {
  AcquisitionSnapshot,
  CommercialQuote,
  ValidatedAcquisitionAnswers
} from "@mpa/shared";
import {
  createMemoryAcquisitionDurableBackend,
  recordFromStateToken,
  recordFromStateTokenBySnapshot,
  type AcquisitionDurableBackend
} from "./acquisition-durable";

export type StoredAcquisitionRecord = {
  quote: CommercialQuote;
  snapshot: AcquisitionSnapshot;
  answers: ValidatedAcquisitionAnswers;
  /** Optional pre-auth ownership marker for isolation tests / future binding. */
  ownerKey?: string | null;
};

export type AcquisitionLookupOptions = {
  /** Signed mpa_acquisition_quote_state cookie value from the request. */
  stateToken?: string | null;
  /** When set, rejects records bound to a different owner. */
  ownerKey?: string | null;
};

const globalStore = globalThis as typeof globalThis & {
  __mpaAcquisitionQuotes?: Map<string, StoredAcquisitionRecord>;
  __mpaAcquisitionSnapshots?: Map<string, StoredAcquisitionRecord>;
  __mpaAcquisitionDurable?: AcquisitionDurableBackend;
  __mpaAcquisitionMemoryDurable?: AcquisitionDurableBackend;
};

function quotes(): Map<string, StoredAcquisitionRecord> {
  if (!globalStore.__mpaAcquisitionQuotes) {
    globalStore.__mpaAcquisitionQuotes = new Map();
  }
  return globalStore.__mpaAcquisitionQuotes;
}

function snapshots(): Map<string, StoredAcquisitionRecord> {
  if (!globalStore.__mpaAcquisitionSnapshots) {
    globalStore.__mpaAcquisitionSnapshots = new Map();
  }
  return globalStore.__mpaAcquisitionSnapshots;
}

function memoryDurable(): AcquisitionDurableBackend {
  if (!globalStore.__mpaAcquisitionMemoryDurable) {
    globalStore.__mpaAcquisitionMemoryDurable = createMemoryAcquisitionDurableBackend();
  }
  return globalStore.__mpaAcquisitionMemoryDurable;
}

function durable(): AcquisitionDurableBackend {
  if (!globalStore.__mpaAcquisitionDurable) {
    // Default: process-local durable Map. Production recovery uses signed cookies;
    // tests inject a shared backend to prove cross-instance reads.
    globalStore.__mpaAcquisitionDurable = memoryDurable();
  }
  return globalStore.__mpaAcquisitionDurable;
}

function putCache(record: StoredAcquisitionRecord): void {
  quotes().set(record.quote.quote_id, record);
  snapshots().set(record.snapshot.snapshot_id, record);
}

function ownerAllowed(
  record: StoredAcquisitionRecord,
  ownerKey: string | null | undefined
): boolean {
  if (ownerKey == null || ownerKey === "") return true;
  if (record.ownerKey == null || record.ownerKey === "") return true;
  return record.ownerKey === ownerKey;
}

/** Clear process cache only — simulates serverless cold start / new instance. */
export function simulateAcquisitionColdStartForTests(): void {
  globalStore.__mpaAcquisitionQuotes = new Map();
  globalStore.__mpaAcquisitionSnapshots = new Map();
}

/**
 * Replace the durable backend (shared "database") for cross-instance tests.
 * Does not clear the provided backend contents.
 */
export function setAcquisitionDurableBackendForTests(backend: AcquisitionDurableBackend): void {
  globalStore.__mpaAcquisitionDurable = backend;
  globalStore.__mpaAcquisitionMemoryDurable = backend;
  simulateAcquisitionColdStartForTests();
}

export function createSharedAcquisitionDurableBackendForTests(): AcquisitionDurableBackend {
  return createMemoryAcquisitionDurableBackend();
}

export function clearAcquisitionSessionStoreForTests(): void {
  simulateAcquisitionColdStartForTests();
  memoryDurable().clear();
  globalStore.__mpaAcquisitionDurable = memoryDurable();
}

export async function rememberAcquisitionRecord(
  record: StoredAcquisitionRecord
): Promise<StoredAcquisitionRecord> {
  putCache(record);
  await durable().upsert(record);
  return record;
}

export async function getAcquisitionByQuoteId(
  quoteId: string,
  opts: AcquisitionLookupOptions = {}
): Promise<StoredAcquisitionRecord | null> {
  const cached = quotes().get(quoteId);
  if (cached) {
    return ownerAllowed(cached, opts.ownerKey) ? cached : null;
  }

  const fromDurable = await durable().getByQuoteId(quoteId);
  if (fromDurable) {
    if (!ownerAllowed(fromDurable, opts.ownerKey)) return null;
    putCache(fromDurable);
    return fromDurable;
  }

  const fromToken = recordFromStateToken(quoteId, opts.stateToken);
  if (fromToken) {
    if (!ownerAllowed(fromToken, opts.ownerKey)) return null;
    putCache(fromToken);
    await durable().upsert(fromToken);
    return fromToken;
  }

  return null;
}

export async function getAcquisitionBySnapshotId(
  snapshotId: string,
  opts: AcquisitionLookupOptions = {}
): Promise<StoredAcquisitionRecord | null> {
  const cached = snapshots().get(snapshotId);
  if (cached) {
    return ownerAllowed(cached, opts.ownerKey) ? cached : null;
  }

  const fromDurable = await durable().getBySnapshotId(snapshotId);
  if (fromDurable) {
    if (!ownerAllowed(fromDurable, opts.ownerKey)) return null;
    putCache(fromDurable);
    return fromDurable;
  }

  const fromToken = recordFromStateTokenBySnapshot(snapshotId, opts.stateToken);
  if (fromToken) {
    if (!ownerAllowed(fromToken, opts.ownerKey)) return null;
    putCache(fromToken);
    await durable().upsert(fromToken);
    return fromToken;
  }

  return null;
}
