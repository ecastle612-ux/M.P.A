/**
 * Short-lived server-side capacity authorization intents.
 * Created when a capacity-increasing action is blocked; authorize consumes intentId only.
 */

export type CapacityAuthorizationIntent = {
  id: string;
  organizationId: string;
  /** Server-projected managed units after the blocked action. */
  projectedUnits: number;
  additionalUnits: number;
  createdAt: string;
  expiresAt: string;
  source: string;
};

type GlobalIntent = typeof globalThis & {
  __mpaCapacityIntents?: Map<string, CapacityAuthorizationIntent>;
  __mpaCapacityAuthLocks?: Set<string>;
  __mpaCapacityAuthIdempotency?: Map<string, string>;
};

function intents(): Map<string, CapacityAuthorizationIntent> {
  const g = globalThis as GlobalIntent;
  if (!g.__mpaCapacityIntents) {
    g.__mpaCapacityIntents = new Map();
  }
  return g.__mpaCapacityIntents;
}

function locks(): Set<string> {
  const g = globalThis as GlobalIntent;
  if (!g.__mpaCapacityAuthLocks) {
    g.__mpaCapacityAuthLocks = new Set();
  }
  return g.__mpaCapacityAuthLocks;
}

function idempotency(): Map<string, string> {
  const g = globalThis as GlobalIntent;
  if (!g.__mpaCapacityAuthIdempotency) {
    g.__mpaCapacityAuthIdempotency = new Map();
  }
  return g.__mpaCapacityAuthIdempotency;
}

const INTENT_TTL_MS = 60 * 60 * 1000;

export function createCapacityAuthorizationIntent(input: {
  organizationId: string;
  projectedUnits: number;
  additionalUnits: number;
  source: string;
}): CapacityAuthorizationIntent {
  const now = Date.now();
  const row: CapacityAuthorizationIntent = {
    id: `capint_${crypto.randomUUID().replace(/-/g, "")}`,
    organizationId: input.organizationId,
    projectedUnits: Math.max(0, Math.floor(input.projectedUnits)),
    additionalUnits: Math.max(0, Math.floor(input.additionalUnits)),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INTENT_TTL_MS).toISOString(),
    source: input.source
  };
  intents().set(row.id, row);
  return row;
}

export function getCapacityAuthorizationIntent(
  intentId: string
): CapacityAuthorizationIntent | null {
  const row = intents().get(intentId);
  if (!row) return null;
  if (Date.parse(row.expiresAt) < Date.now()) {
    intents().delete(intentId);
    return null;
  }
  return row;
}

export function consumeCapacityAuthorizationIntent(
  intentId: string
): CapacityAuthorizationIntent | null {
  const row = getCapacityAuthorizationIntent(intentId);
  if (!row) return null;
  intents().delete(intentId);
  return row;
}

export function tryAcquireCapacityAuthLock(organizationId: string): boolean {
  const set = locks();
  if (set.has(organizationId)) return false;
  set.add(organizationId);
  return true;
}

export function releaseCapacityAuthLock(organizationId: string): void {
  locks().delete(organizationId);
}

export function rememberCapacityAuthIdempotency(
  key: string,
  resultToken: string
): void {
  idempotency().set(key, resultToken);
}

export function getCapacityAuthIdempotency(key: string): string | null {
  return idempotency().get(key) ?? null;
}

export function clearCapacityIntentStoreForTests(): void {
  intents().clear();
  locks().clear();
  idempotency().clear();
}
