"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UniversalDashboard, UniversalDashboardSkeleton } from "../dashboard-framework";
import { buildCommercialUniversalDashboardViewModel } from "../../lib/commercial/ux016-view-model";
import type { CommercialDashboardSnapshot } from "../../lib/commercial/dashboard-types";
import { CommercialDashboardPanel } from "./commercial-dashboard-panel";
import { CommercialOpsPanel } from "./commercial-ops-panel";

/**
 * STD-001 remediation — Commercial ops command center on Universal Dashboard Framework.
 * Interactive ops tools remain below Insights (not a competing first-viewport dashboard).
 */
export function CommercialUniversalDashboard({
  userName
}: {
  userName: string | null;
}) {
  const [snapshot, setSnapshot] = useState<CommercialDashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/master-admin/commercial/dashboard?emitOpened=1", {
        cache: "no-store"
      });
      const payload = (await response.json()) as {
        dashboard?: CommercialDashboardSnapshot;
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(payload.message ?? payload.error ?? "Unable to load commercial dashboard");
        setSnapshot(null);
        return;
      }
      setSnapshot(payload.dashboard ?? null);
    } catch {
      setError("Unable to load commercial dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const model = useMemo(() => {
    if (!snapshot) return null;
    return buildCommercialUniversalDashboardViewModel({
      snapshot,
      userName
    });
  }, [snapshot, userName]);

  if (loading && !model) {
    return <UniversalDashboardSkeleton />;
  }

  if (error && !model) {
    return (
      <div className="space-y-4" data-std001="commercial-universal-dashboard">
        <p className="text-sm text-[var(--mpa-color-status-danger)]" role="alert">
          {error}
        </p>
        <button
          type="button"
          className="text-sm font-semibold text-[var(--mpa-color-brand-primary)]"
          onClick={() => void load()}
        >
          Retry
        </button>
        <CommercialDashboardPanel embedded emitOpenedOnMount={false} />
        <CommercialOpsPanel />
      </div>
    );
  }

  if (!model) {
    return <UniversalDashboardSkeleton />;
  }

  return (
    <div className="space-y-8" data-std001="commercial-universal-dashboard">
      <UniversalDashboard model={model} />
      <section aria-labelledby="commercial-tools-heading" className="space-y-4">
        <h2
          id="commercial-tools-heading"
          className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Commercial tools
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Aggregates, marketplace prep, pipeline, and engagement controls — after the operational
          briefing.
        </p>
        <CommercialDashboardPanel embedded emitOpenedOnMount={false} />
        <CommercialOpsPanel />
      </section>
    </div>
  );
}
