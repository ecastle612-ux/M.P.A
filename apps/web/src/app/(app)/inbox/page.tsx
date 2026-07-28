import { Suspense } from "react";
import { UnifiedInboxPanel } from "../../../components/ops/unified-inbox-panel";

export default function UnifiedInboxPage() {
  return (
    <div className="mpa-page space-y-[var(--mpa-space-6)]">
      <Suspense
        fallback={
          <p className="text-sm text-[var(--mpa-color-text-tertiary)]">Loading Unified Inbox…</p>
        }
      >
        <UnifiedInboxPanel />
      </Suspense>
    </div>
  );
}
