"use client";

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  buildAiPageContext,
  getAiPageContextSnapshot,
  setAiPageContext,
  subscribeAiPageContext,
  type AiPageContextValue,
  type AiPageEntityType
} from "../../lib/ai/ai-page-context-store";

export type { AiPageContextValue, AiPageEntityType };
export { buildAiPageContext };

/** @deprecated SH-002 — no React provider; store is module-scoped. Kept as passthrough. */
export function AiPageContextProvider({ children }: { children: ReactNode }) {
  return children;
}

/** Subscribe only where needed (FloatingAiCopilot). Does not wrap the shell. */
export function useAiPageContext(): AiPageContextValue {
  return useSyncExternalStore(subscribeAiPageContext, getAiPageContextSnapshot, getAiPageContextSnapshot);
}

/**
 * Register route context for the floating copilot.
 * Writes to an external store — does not re-render ApplicationShell / drawer / search.
 */
export function AiPageContextBridge(props: AiPageContextValue) {
  const serialized = useMemo(() => JSON.stringify(props), [props]);

  useEffect(() => {
    setAiPageContext(JSON.parse(serialized) as AiPageContextValue);
    return () => setAiPageContext(null);
  }, [serialized]);

  return null;
}
