"use client";

import { useCallback, useRef } from "react";
import { useToast } from "@mpa/ui";

const DEFAULT_WINDOW_MS = 8000;

/**
 * UX-003 — run a soft destructive action, then offer Undo via toast.
 * Caller supplies existing restore/undo API call. Not for financial posts.
 */
export function useUndoableAction() {
  const { notify } = useToast();
  const pendingRef = useRef<Map<string, { undo: () => Promise<void>; timer: ReturnType<typeof setTimeout> }>>(
    new Map()
  );

  const runWithUndo = useCallback(
    async (input: {
      key: string;
      doAction: () => Promise<void>;
      undoAction: () => Promise<void>;
      successTitle: string;
      successDescription?: string;
      windowMs?: number;
    }) => {
      await input.doAction();
      const existing = pendingRef.current.get(input.key);
      if (existing) clearTimeout(existing.timer);

      const windowMs = input.windowMs ?? DEFAULT_WINDOW_MS;
      const timer = setTimeout(() => {
        pendingRef.current.delete(input.key);
      }, windowMs);
      pendingRef.current.set(input.key, { undo: input.undoAction, timer });

      notify({
        title: input.successTitle,
        description: input.successDescription ?? "You can undo this for a few seconds.",
        variant: "success",
        durationMs: windowMs,
        actionLabel: "Undo",
        onAction: () => {
          const pending = pendingRef.current.get(input.key);
          if (!pending) return;
          clearTimeout(pending.timer);
          pendingRef.current.delete(input.key);
          void pending.undo().catch(() => {
            notify({
              title: "Couldn’t undo",
              description: "Refresh and restore from the archived list if needed.",
              variant: "warning"
            });
          });
        }
      });
    },
    [notify]
  );

  return { runWithUndo };
}
