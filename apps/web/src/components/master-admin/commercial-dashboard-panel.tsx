"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { CommercialDashboardSnapshot } from "../../lib/commercial/dashboard-types";
import type { ImplementationEngagement } from "../../lib/commercial/marketplace-types";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2">
      <p className="text-xs uppercase tracking-[0.08em] text-[var(--mpa-color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

/**
 * COM-001 Slice E — staff commercial dashboard (Master Admin HQ composition).
 * Control-plane only; not a customer product.
 */
export function CommercialDashboardPanel() {
  const [dashboard, setDashboard] = useState<CommercialDashboardSnapshot | null>(null);
  const [engagements, setEngagements] = useState<ImplementationEngagement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [path, setPath] = useState<"ai_guided" | "professional">("professional");
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (emitOpened = false) => {
    setLoading(true);
    setError(null);
    const qs = emitOpened ? "?emitOpened=1" : "";
    const [dashRes, engRes] = await Promise.all([
      fetch(`/api/master-admin/commercial/dashboard${qs}`, { cache: "no-store" }),
      fetch("/api/master-admin/commercial/engagements", { cache: "no-store" })
    ]);
    const dashPayload = (await dashRes.json()) as {
      dashboard?: CommercialDashboardSnapshot;
      message?: string;
      error?: string;
    };
    const engPayload = (await engRes.json()) as {
      engagements?: ImplementationEngagement[];
    };
    setLoading(false);
    if (!dashRes.ok) {
      setError(dashPayload.message ?? dashPayload.error ?? "Unable to load dashboard");
      return;
    }
    setDashboard(dashPayload.dashboard ?? null);
    setEngagements(engPayload.engagements ?? []);
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  async function createInternalEngagement() {
    if (!orgId.trim()) return;
    setLoading(true);
    setNotice(null);
    const response = await fetch("/api/master-admin/commercial/engagements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_engagement",
        organizationId: orgId.trim(),
        path,
        providerType: "mpa_internal",
        status: "requested"
      })
    });
    const payload = (await response.json()) as { message?: string; error?: string };
    setLoading(false);
    if (!response.ok) {
      setNotice(payload.message ?? payload.error ?? "Engagement failed");
      return;
    }
    setNotice("mpa_internal engagement recorded (marketplace prep — no partner UI)");
    await load(false);
  }

  const d = dashboard;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
              COM-001 Slice E · Staff only
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
              Commercial dashboard
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
              Control-plane aggregates from COM-001 A–D and BILL-001. Customers never see this
              surface.
            </p>
          </div>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void load(false)}>
            Refresh
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p>
        ) : null}
        {notice ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p>
        ) : null}

        {d ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="New customers (30d)" value={d.newCustomersLast30Days} />
              <Metric label="Active organizations" value={d.organizations.active} />
              <Metric label="Trials (commercial)" value={d.trials.commercialTrialStatus} />
              <Metric label="SaaS trialing" value={d.trials.saasTrialing} />
              <Metric label="Implementation queue" value={d.implementation.queueBelow100} />
              <Metric label="AI guided prefs" value={d.implementation.aiGuidedPath} />
              <Metric label="Past due subs" value={d.billing.pastDueSubscriptions} />
              <Metric label="Est. list MRR" value={`$${d.billing.estimatedListMrr}`} />
              <Metric label="Health critical" value={d.health.critical} />
              <Metric label="Health at risk" value={d.health.atRisk} />
              <Metric label="Renewals due/emitted" value={d.renewals.dueOrEmitted} />
              <Metric label="T-30 milestones" value={d.renewals.t30} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
                <p className="font-medium text-[var(--mpa-color-text-primary)]">Organizations</p>
                <p>
                  Trial {d.organizations.trial} · Pending setup {d.organizations.pendingSetup} ·
                  Cancelled {d.organizations.cancelled} · Archived {d.organizations.archived}
                </p>
                <p>
                  Health — Healthy {d.health.healthy} · Needs attention {d.health.needsAttention} ·
                  Unscored {d.health.unscored}
                </p>
              </div>
              <div className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
                <p className="font-medium text-[var(--mpa-color-text-primary)]">Secondary</p>
                <p>
                  Offboarding in-flight {d.offboarding.inFlight} (export {d.offboarding.exportWindow}
                  · frozen {d.offboarding.frozen})
                </p>
                <p>
                  Discovery open {d.discovery.openImpressions} · accepted {d.discovery.accepted}
                </p>
                <p>
                  Support tickets:{" "}
                  {d.support.available
                    ? d.support.openTickets
                    : "unavailable (linked system not connected)"}
                </p>
                <p>
                  Marketplace prep — engagements {d.marketplace.engagementsTotal} (open{" "}
                  {d.marketplace.engagementsOpen}) · partner stubs {d.marketplace.partnersStub}
                </p>
              </div>
            </div>

            {Object.keys(d.pipeline).length > 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Pipeline:{" "}
                {Object.entries(d.pipeline)
                  .map(([stage, count]) => `${stage}=${count}`)
                  .join(" · ")}
              </p>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-display text-lg text-[var(--mpa-color-text-primary)]">
          Marketplace prep (data model only)
        </h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Record mpa_internal Professional / AI Guided engagements. Partner picker UI and marketplace
          activation are deferred.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            aria-label="Organization id for engagement"
            className="h-10 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm text-[var(--mpa-color-text-primary)]"
            placeholder="Organization UUID"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          />
          <select
            aria-label="Implementation path"
            className="h-10 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm text-[var(--mpa-color-text-primary)]"
            value={path}
            onChange={(e) => setPath(e.target.value as "ai_guided" | "professional")}
          >
            <option value="professional">professional</option>
            <option value="ai_guided">ai_guided</option>
          </select>
          <Button
            type="button"
            disabled={loading || !orgId.trim()}
            onClick={() => void createInternalEngagement()}
          >
            Record engagement
          </Button>
        </div>
        {engagements.length > 0 ? (
          <ul className="divide-y divide-[var(--mpa-color-border-default)] text-sm">
            {engagements.slice(0, 8).map((row) => (
              <li key={row.id} className="py-2 text-[var(--mpa-color-text-secondary)]">
                {row.path} · {row.providerType} · {row.status} · score {row.progressScore}% · org{" "}
                {row.organizationId.slice(0, 8)}…
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No engagements yet.</p>
        )}
      </Card>
    </div>
  );
}
