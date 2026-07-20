"use client";

import { useEffect } from "react";
import { FriendlyErrorState } from "../components/trust/friendly-error-state";
import { captureException } from "../lib/observability/errors";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    captureException(error, { surface: "app-error-boundary" });
  }, [error]);

  return (
    <FriendlyErrorState
      title="This page couldn’t load"
      whatHappened="Something unexpected interrupted this screen. Your data was not deleted."
      howToFix="Retry this page. If it still fails, go back to Operations Center and try the same action again."
      error={error}
      onRetry={reset}
    />
  );
}
