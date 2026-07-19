/**
 * Prevents duplicate submissions from double-clicks / rapid retries.
 * Call `begin()` before an async action; if false, skip. Always `end()` in finally.
 */
export function createSubmissionGuard() {
  let locked = false;

  return {
    get isLocked() {
      return locked;
    },
    begin(): boolean {
      if (locked) return false;
      locked = true;
      return true;
    },
    end(): void {
      locked = false;
    }
  };
}

/**
 * In-memory dedupe for identical mutation keys within a short window
 * (e.g. same payment payload, same notification send).
 */
export function createRecentActionDedupe(windowMs = 2500) {
  const recent = new Map<string, number>();

  return {
    claim(key: string): boolean {
      const now = Date.now();
      for (const [k, at] of recent) {
        if (now - at > windowMs) recent.delete(k);
      }
      if (recent.has(key)) return false;
      recent.set(key, now);
      return true;
    }
  };
}
