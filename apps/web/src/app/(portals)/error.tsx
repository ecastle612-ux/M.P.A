"use client";

import { useEffect } from "react";
import { FriendlyErrorState } from "../../components/trust/friendly-error-state";

export default function PortalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[portal]", error);
  }, [error]);

  return (
    <FriendlyErrorState
      title="Portal unavailable"
      whatHappened="We couldn’t load this portal page right now."
      howToFix="Retry. If you still can’t get in, sign out and sign back in."
      error={error}
      onRetry={reset}
      secondaryHref="/portal"
      secondaryLabel="Portal home"
    />
  );
}
