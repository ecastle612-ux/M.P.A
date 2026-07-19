"use client";

import { useRef, useState } from "react";
import { createRecentActionDedupe, createSubmissionGuard } from "../lib/trust/submission-guard";

/**
 * React helper: disable duplicate form submits and identical mutation keys.
 */
export function useSubmissionGuard(dedupeWindowMs = 2500) {
  const guardRef = useRef(createSubmissionGuard());
  const dedupeRef = useRef(createRecentActionDedupe(dedupeWindowMs));
  const [busy, setBusy] = useState(false);

  async function run<T>(key: string | null, action: () => Promise<T>): Promise<T | undefined> {
    if (!guardRef.current.begin()) return undefined;
    if (key && !dedupeRef.current.claim(key)) {
      guardRef.current.end();
      return undefined;
    }
    setBusy(true);
    try {
      return await action();
    } finally {
      guardRef.current.end();
      setBusy(false);
    }
  }

  return { busy, run };
}
