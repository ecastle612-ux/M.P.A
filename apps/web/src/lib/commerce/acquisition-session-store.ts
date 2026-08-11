/**
 * Slice 2 acquisition quote + snapshot store.
 * Process memory for local/test; no Stripe objects; no Production env changes.
 */

import type {
  AcquisitionSnapshot,
  CommercialQuote,
  ValidatedAcquisitionAnswers
} from "@mpa/shared";

export type StoredAcquisitionRecord = {
  quote: CommercialQuote;
  snapshot: AcquisitionSnapshot;
  answers: ValidatedAcquisitionAnswers;
};

const globalStore = globalThis as typeof globalThis & {
  __mpaAcquisitionQuotes?: Map<string, StoredAcquisitionRecord>;
  __mpaAcquisitionSnapshots?: Map<string, StoredAcquisitionRecord>;
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

export function rememberAcquisitionRecord(record: StoredAcquisitionRecord): StoredAcquisitionRecord {
  quotes().set(record.quote.quote_id, record);
  snapshots().set(record.snapshot.snapshot_id, record);
  return record;
}

export function getAcquisitionByQuoteId(quoteId: string): StoredAcquisitionRecord | null {
  return quotes().get(quoteId) ?? null;
}

export function getAcquisitionBySnapshotId(snapshotId: string): StoredAcquisitionRecord | null {
  return snapshots().get(snapshotId) ?? null;
}

export function clearAcquisitionSessionStoreForTests(): void {
  globalStore.__mpaAcquisitionQuotes = new Map();
  globalStore.__mpaAcquisitionSnapshots = new Map();
}
