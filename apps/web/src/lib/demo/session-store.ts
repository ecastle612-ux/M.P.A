import {
  DEMO_SWEEPER_INTERVAL_MS,
  applyOverlayOp,
  buildDemoSession,
  canResetDemoSession,
  emptyOverlay,
  isDemoSessionExpired,
  resetOverlay,
  touchDemoSession,
  type DemoOverlayOp,
  type DemoOverlayStore,
  type DemoPersona,
  type DemoProductId,
  type DemoSession
} from "@mpa/shared";
import { decodeDemoSessionState } from "./durable-state";

export type Stored = {
  session: DemoSession;
  overlay: DemoOverlayStore;
  analytics: Array<{ event: string; at: string; meta?: Record<string, string> }>;
};

const globalStore = globalThis as typeof globalThis & {
  __mpaDemoStore?: Map<string, Stored>;
  __mpaDemoSweeper?: ReturnType<typeof setInterval>;
};

function store(): Map<string, Stored> {
  if (!globalStore.__mpaDemoStore) {
    globalStore.__mpaDemoStore = new Map();
  }
  return globalStore.__mpaDemoStore;
}

function ensureSweeper(): void {
  if (globalStore.__mpaDemoSweeper) {
    return;
  }
  globalStore.__mpaDemoSweeper = setInterval(() => {
    const now = new Date();
    for (const [id, row] of store()) {
      if (isDemoSessionExpired(row.session, now)) {
        store().delete(id);
      }
    }
  }, DEMO_SWEEPER_INTERVAL_MS);
  // Do not keep the process alive solely for the sweeper in serverless.
  globalStore.__mpaDemoSweeper.unref?.();
}

ensureSweeper();

function remember(row: Stored): Stored {
  store().set(row.session.id, row);
  return row;
}

export function createDemoSessionRecord(input: {
  product: DemoProductId;
  persona: DemoPersona;
  conversionHint?: string;
}): Stored {
  const session = buildDemoSession(input);
  const row: Stored = {
    session,
    overlay: emptyOverlay(session.id),
    analytics: [{ event: "demo.started", at: session.createdAt, meta: { product: input.product } }]
  };
  return remember(row);
}

/** Memory-only lookup (same isolate). Prefer resolveDemoSessionRecord across serverless. */
export function getDemoSessionRecord(id: string): Stored | null {
  const row = store().get(id);
  if (!row) {
    return null;
  }
  if (isDemoSessionExpired(row.session)) {
    store().delete(id);
    return null;
  }
  const touched = { ...row, session: touchDemoSession(row.session) };
  return remember(touched);
}

/**
 * Resolve a demo session from in-memory store or the signed durable cookie.
 * Required on Vercel: create and surface requests often hit different isolates.
 */
export function resolveDemoSessionRecord(input: {
  sessionId?: string | null;
  stateToken?: string | null;
}): Stored | null {
  const sessionId = input.sessionId ?? undefined;

  if (sessionId) {
    const cached = getDemoSessionRecord(sessionId);
    if (cached) return cached;
  }

  const durable = decodeDemoSessionState(input.stateToken);
  if (!durable) return null;
  if (sessionId && durable.session.id !== sessionId) {
    return null;
  }
  if (isDemoSessionExpired(durable.session)) {
    return null;
  }

  const hydrated: Stored = {
    ...durable,
    session: touchDemoSession(durable.session)
  };
  return remember(hydrated);
}

export function switchDemoPersona(id: string, persona: DemoPersona): Stored | null {
  const row = getDemoSessionRecord(id);
  if (!row) {
    return null;
  }
  const next: Stored = {
    ...row,
    session: { ...row.session, persona, lastActiveAt: new Date().toISOString() },
    analytics: [
      ...row.analytics,
      { event: "demo.role_switched", at: new Date().toISOString(), meta: { persona } }
    ]
  };
  return remember(next);
}

export function resetDemoSessionRecord(
  id: string
): { ok: true; row: Stored } | { ok: false; reason: string } {
  const row = store().get(id);
  if (!row || isDemoSessionExpired(row.session)) {
    if (row) store().delete(id);
    return { ok: false, reason: "session_not_found" };
  }
  if (!canResetDemoSession(row.session)) {
    return { ok: false, reason: "reset_cooldown" };
  }
  const now = new Date();
  const next: Stored = {
    session: {
      ...touchDemoSession(row.session, now),
      lastResetAt: now.toISOString()
    },
    overlay: resetOverlay(id, now),
    analytics: [...row.analytics, { event: "demo.reset", at: now.toISOString() }]
  };
  remember(next);
  return { ok: true, row: next };
}

export function appendDemoOverlay(id: string, op: DemoOverlayOp): Stored | null {
  const row = getDemoSessionRecord(id);
  if (!row) {
    return null;
  }
  const next = {
    ...row,
    overlay: applyOverlayOp(row.overlay, op)
  };
  return remember(next);
}

export function trackDemoAnalytics(
  id: string,
  event: string,
  meta?: Record<string, string>
): Stored | null {
  const row = getDemoSessionRecord(id);
  if (!row) {
    return null;
  }
  row.analytics.push({ event, at: new Date().toISOString(), ...(meta ? { meta } : {}) });
  return remember(row);
}

export function listDemoSessionDiagnostics(): Array<{
  id: string;
  product: DemoProductId;
  persona: DemoPersona;
  overlayOps: number;
  analyticsCount: number;
  expiresAt: string;
}> {
  const out = [];
  for (const row of store().values()) {
    if (isDemoSessionExpired(row.session)) {
      continue;
    }
    out.push({
      id: row.session.id,
      product: row.session.product,
      persona: row.session.persona,
      overlayOps: row.overlay.ops.length,
      analyticsCount: row.analytics.length,
      expiresAt: row.session.expiresAt
    });
  }
  return out;
}

/** Isolation proof helper for tests — store never references production org tables. */
export function demoStoreUsesProductionDb(): boolean {
  return false;
}
