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
import { buildAiPageContextFromPathname } from "../../lib/ai/ai-route-context";

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
 * On unmount, restores pathname-derived context (not a hard wipe to generic default).
 */
export function AiPageContextBridge(props: AiPageContextValue) {
  const serialized = useMemo(
    () =>
      JSON.stringify({
        entityType: props.entityType,
        entityId: props.entityId ?? null,
        entityLabel: props.entityLabel ?? null,
        launcherLabel: props.launcherLabel,
        suggestions: props.suggestions
      }),
    [props.entityType, props.entityId, props.entityLabel, props.launcherLabel, props.suggestions]
  );

  useEffect(() => {
    setAiPageContext(JSON.parse(serialized) as AiPageContextValue);
    return () => {
      if (typeof window === "undefined") {
        setAiPageContext(null);
        return;
      }
      setAiPageContext(buildAiPageContextFromPathname(window.location.pathname));
    };
  }, [serialized]);

  return null;
}
