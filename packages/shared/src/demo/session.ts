import type { DemoPersona } from "./personas";
import type { DemoProductId } from "./products";

export const DEMO_SESSION_COOKIE = "mpa_demo_session";
export const DEMO_SNAPSHOT_VERSION = "v1.0.0";

/** TTL 2h · idle 30m (COM-002 live-demo-architecture). */
export const DEMO_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
export const DEMO_SESSION_IDLE_MS = 30 * 60 * 1000;
export const DEMO_RESET_COOLDOWN_MS = 30 * 1000;
export const DEMO_SWEEPER_INTERVAL_MS = 5 * 60 * 1000;

export type DemoSession = {
  id: string;
  product: DemoProductId;
  persona: DemoPersona;
  snapshotVersion: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  writeOverlayRef: string;
  conversionHint?: string;
  lastResetAt?: string;
};

export function createDemoSessionId(): string {
  return `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildDemoSession(input: {
  id?: string;
  product: DemoProductId;
  persona: DemoPersona;
  now?: Date;
  conversionHint?: string;
}): DemoSession {
  const now = input.now ?? new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + DEMO_SESSION_TTL_MS).toISOString();
  const id = input.id ?? createDemoSessionId();
  return {
    id,
    product: input.product,
    persona: input.persona,
    snapshotVersion: DEMO_SNAPSHOT_VERSION,
    createdAt,
    expiresAt,
    lastActiveAt: createdAt,
    writeOverlayRef: `overlay:${id}`,
    ...(input.conversionHint ? { conversionHint: input.conversionHint } : {})
  };
}

export function isDemoSessionExpired(session: DemoSession, now = new Date()): boolean {
  const t = now.getTime();
  if (t >= Date.parse(session.expiresAt)) {
    return true;
  }
  if (t - Date.parse(session.lastActiveAt) >= DEMO_SESSION_IDLE_MS) {
    return true;
  }
  return false;
}

export function touchDemoSession(session: DemoSession, now = new Date()): DemoSession {
  return {
    ...session,
    lastActiveAt: now.toISOString()
  };
}

export function canResetDemoSession(session: DemoSession, now = new Date()): boolean {
  if (!session.lastResetAt) {
    return true;
  }
  return now.getTime() - Date.parse(session.lastResetAt) >= DEMO_RESET_COOLDOWN_MS;
}
