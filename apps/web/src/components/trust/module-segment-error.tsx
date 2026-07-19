"use client";

import { FriendlyErrorState } from "./friendly-error-state";

/**
 * UX-003 — consistent segment error boundary presentation.
 */
export function ModuleSegmentError({
  title,
  error,
  reset,
  howToFix = "Retry this page. If it keeps failing, refresh once or return to Operations and try again."
}: {
  title: string;
  error: Error & { digest?: string };
  reset: () => void;
  howToFix?: string;
}) {
  return (
    <FriendlyErrorState
      title={title}
      error={error}
      howToFix={howToFix}
      onRetry={reset}
    />
  );
}
