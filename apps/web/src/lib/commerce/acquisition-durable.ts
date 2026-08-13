/**
 * Durable acquisition-quote backend.
 * Signed cookie (and optional injectable Map for tests) is authoritative across
 * serverless isolates; process memory is only a cache.
 */

import type { DurableAcquisitionRecord } from "./acquisition-durable-state";
import { decodeAcquisitionQuoteState } from "./acquisition-durable-state";

export type AcquisitionDurableBackend = {
  getByQuoteId(quoteId: string): Promise<DurableAcquisitionRecord | null>;
  getBySnapshotId(snapshotId: string): Promise<DurableAcquisitionRecord | null>;
  upsert(record: DurableAcquisitionRecord): Promise<void>;
  clear(): void;
};

function cloneRecord(record: DurableAcquisitionRecord): DurableAcquisitionRecord {
  return structuredClone(record);
}

/** Process-independent durable Map for tests / shared cross-instance simulation. */
export function createMemoryAcquisitionDurableBackend(): AcquisitionDurableBackend {
  const byQuote = new Map<string, DurableAcquisitionRecord>();
  const bySnapshot = new Map<string, string>();

  return {
    async getByQuoteId(quoteId) {
      const row = byQuote.get(quoteId);
      return row ? cloneRecord(row) : null;
    },
    async getBySnapshotId(snapshotId) {
      const quoteId = bySnapshot.get(snapshotId);
      if (!quoteId) {
        for (const row of byQuote.values()) {
          if (row.snapshot.snapshot_id === snapshotId) return cloneRecord(row);
        }
        return null;
      }
      const row = byQuote.get(quoteId);
      return row ? cloneRecord(row) : null;
    },
    async upsert(record) {
      const stored = cloneRecord(record);
      byQuote.set(stored.quote.quote_id, stored);
      bySnapshot.set(stored.snapshot.snapshot_id, stored.quote.quote_id);
    },
    clear() {
      byQuote.clear();
      bySnapshot.clear();
    }
  };
}

/**
 * Resolve a durable record from an opaque quote id + optional signed state token.
 * Token path is the Production serverless recovery mechanism (same browser).
 */
export function recordFromStateToken(
  quoteId: string,
  stateToken: string | null | undefined
): DurableAcquisitionRecord | null {
  const decoded = decodeAcquisitionQuoteState(stateToken);
  if (!decoded) return null;
  if (decoded.quote.quote_id !== quoteId) return null;
  return decoded;
}

export function recordFromStateTokenBySnapshot(
  snapshotId: string,
  stateToken: string | null | undefined
): DurableAcquisitionRecord | null {
  const decoded = decodeAcquisitionQuoteState(stateToken);
  if (!decoded) return null;
  if (decoded.snapshot.snapshot_id !== snapshotId) return null;
  return decoded;
}
