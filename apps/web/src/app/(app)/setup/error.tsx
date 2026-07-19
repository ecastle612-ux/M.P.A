"use client";

import { ModuleSegmentError } from "../../../components/trust/module-segment-error";

export default function ModuleError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ModuleSegmentError
      title="Setup unavailable"
      error={error}
      reset={reset}
    />
  );
}
