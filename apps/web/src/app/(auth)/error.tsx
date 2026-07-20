"use client";

import { useEffect } from "react";
import { FriendlyErrorState } from "../../components/trust/friendly-error-state";

export default function AuthError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[auth]", error);
  }, [error]);

  return (
    <FriendlyErrorState
      title="Sign-in interrupted"
      whatHappened="We couldn’t finish this authentication step."
      howToFix="Retry sign-in. Check your email link hasn’t expired, then try again."
      error={error}
      onRetry={reset}
      secondaryHref="/login"
      secondaryLabel="Back to sign in"
    />
  );
}
