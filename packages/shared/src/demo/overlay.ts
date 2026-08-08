/**
 * Session write overlay — mutations never touch the shared snapshot.
 */

export type DemoOverlayOp =
  | { op: "set"; path: string; value: unknown }
  | { op: "delete"; path: string }
  | { op: "append"; path: string; value: unknown };

export type DemoOverlayStore = {
  sessionId: string;
  ops: DemoOverlayOp[];
  updatedAt: string;
};

export function emptyOverlay(sessionId: string, now = new Date()): DemoOverlayStore {
  return {
    sessionId,
    ops: [],
    updatedAt: now.toISOString()
  };
}

export function applyOverlayOp(
  overlay: DemoOverlayStore,
  op: DemoOverlayOp,
  now = new Date()
): DemoOverlayStore {
  return {
    ...overlay,
    ops: [...overlay.ops, op],
    updatedAt: now.toISOString()
  };
}

export function resetOverlay(sessionId: string, now = new Date()): DemoOverlayStore {
  return emptyOverlay(sessionId, now);
}

/** Shallow merge helper for list/map snapshots + overlay sets. */
export function mergeOverlayValue<T extends Record<string, unknown>>(
  base: T,
  overlay: DemoOverlayStore,
  rootPath: string
): T {
  const next: Record<string, unknown> = { ...base };
  for (const op of overlay.ops) {
    if (!op.path.startsWith(rootPath)) {
      continue;
    }
    const key = op.path.slice(rootPath.length).replace(/^\./, "");
    if (!key) {
      continue;
    }
    if (op.op === "set") {
      next[key] = op.value;
    } else if (op.op === "delete") {
      delete next[key];
    }
  }
  return next as T;
}
