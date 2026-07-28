"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Card, Input } from "@mpa/ui";
import type { CommercialOpportunity, CommercialPipelineStage } from "../../lib/commercial/types";
import type {
  ImplementationProgressSnapshot,
  TrialLifecycleSnapshot
} from "../../lib/commercial/progress-types";
import type { HealthScoreSnapshot } from "../../lib/commercial/health-types";
import type { FeatureDiscoverySnapshot } from "../../lib/commercial/discovery-types";
import type { CommunicationTimelineEntry } from "../../lib/commercial/timeline";
import type { OffboardingSnapshot } from "../../lib/commercial/offboarding-types";
import type { CsMotionSnapshot } from "../../lib/commercial/cs-motions";
import type { RenewalAlertSnapshot } from "../../lib/commercial/renewal-alerts";

type Notice = { kind: "error" | "ok"; text: string };

export function CommercialOpsPanel() {
  const [opportunities, setOpportunities] = useState<CommercialOpportunity[]>([]);
  const [stages, setStages] = useState<CommercialPipelineStage[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [source, setSource] = useState("manual");
  const [planCode, setPlanCode] = useState("professional");
  const [implementationPreference, setImplementationPreference] = useState("ai_guided");
  const [selectedId, setSelectedId] = useState("");
  const [toStage, setToStage] = useState("won");
  const [lostReason, setLostReason] = useState("");
  const [activateIdempotencyKey, setActivateIdempotencyKey] = useState("");
  const [progressOrgId, setProgressOrgId] = useState("");
  const [progress, setProgress] = useState<ImplementationProgressSnapshot | null>(null);
  const [trial, setTrial] = useState<TrialLifecycleSnapshot | null>(null);
  const [health, setHealth] = useState<HealthScoreSnapshot | null>(null);
  const [discoveries, setDiscoveries] = useState<FeatureDiscoverySnapshot | null>(null);
  const [timeline, setTimeline] = useState<CommunicationTimelineEntry[]>([]);
  const [offboarding, setOffboarding] = useState<OffboardingSnapshot | null>(null);
  const [csMotions, setCsMotions] = useState<CsMotionSnapshot[]>([]);
  const [renewalAlerts, setRenewalAlerts] = useState<RenewalAlertSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/master-admin/commercial/opportunities", {
      cache: "no-store"
    });
    const payload = (await response.json()) as {
      opportunities?: CommercialOpportunity[];
      stages?: CommercialPipelineStage[];
      message?: string;
      error?: string;
    };
    if (!response.ok) {
      setNotice({
        kind: "error",
        text: payload.message ?? payload.error ?? "Failed to load opportunities"
      });
      return;
    }
    setOpportunities(payload.opportunities ?? []);
    setStages(payload.stages ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function createOpportunity(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    const response = await fetch("/api/master-admin/commercial/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        contactEmail,
        contactName,
        source,
        planCode,
        implementationPreference
      })
    });
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
      opportunity?: CommercialOpportunity;
    };
    setLoading(false);
    if (!response.ok) {
      setNotice({ kind: "error", text: payload.message ?? payload.error ?? "Create failed" });
      return;
    }
    setNotice({
      kind: "ok",
      text: `Created opportunity ${payload.opportunity?.id ?? ""}`.trim()
    });
    setCompanyName("");
    setContactEmail("");
    setContactName("");
    await refresh();
  }

  async function transitionStage(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    const response = await fetch("/api/master-admin/commercial/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "transition",
        opportunityId: selectedId,
        toStage,
        lostReason: toStage === "lost" ? lostReason : null
      })
    });
    const payload = (await response.json()) as { message?: string; error?: string };
    setLoading(false);
    if (!response.ok) {
      setNotice({ kind: "error", text: payload.message ?? payload.error ?? "Transition failed" });
      return;
    }
    setNotice({
      kind: "ok",
      text: `Stage moved to ${toStage}. Won does not create an organization.`
    });
    await refresh();
  }

  async function activateSelected(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    const selected = opportunities.find((row) => row.id === selectedId);
    if (!selected) {
      setLoading(false);
      setNotice({ kind: "error", text: "Select an opportunity first" });
      return;
    }
    const response = await fetch("/api/master-admin/commercial/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: activateIdempotencyKey || `ma-${selected.id}-${Date.now()}`,
        opportunityId: selected.id,
        buyerCompanyName: selected.companyName,
        buyerContactEmail: selected.contactEmail,
        buyerLegalName: selected.contactName,
        planCode: selected.planCode || planCode,
        organizationType: selected.organizationType || "property_manager",
        implementationPreference: selected.implementationPreference || implementationPreference,
        salesOwnerId: selected.salesOwnerId
      })
    });
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
      organizationId?: string;
      stage?: string;
      idempotentReplay?: boolean;
    };
    setLoading(false);
    if (!response.ok) {
      setNotice({ kind: "error", text: payload.message ?? payload.error ?? "Activation failed" });
      return;
    }
    setNotice({
      kind: "ok",
      text: `Activated org ${payload.organizationId ?? ""} · stage ${payload.stage ?? ""}${
        payload.idempotentReplay ? " (replay)" : ""
      }`
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
          COM-001 Slice A
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Commercial pipeline (ops minimum)
        </h1>
        <p className="max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Opportunity stages and activation handoff only. Won does not create organizations —
          activation (Payment Successful / Master Admin exception) provisions via AUTH-001.
        </p>
      </header>

      {notice ? (
        <p
          className={
            notice.kind === "ok"
              ? "text-sm text-[var(--mpa-color-text-secondary)]"
              : "text-sm text-[var(--mpa-color-text-primary)]"
          }
        >
          {notice.text}
        </p>
      ) : null}

      <Card className="space-y-4">
        <h2 className="font-display text-lg text-[var(--mpa-color-text-primary)]">
          Create opportunity
        </h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => void createOpportunity(e)}>
          <Input
            aria-label="Company"
            placeholder="Company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
          <Input
            aria-label="Contact email"
            type="email"
            placeholder="Contact email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
          <Input
            aria-label="Contact name"
            placeholder="Contact name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input
            aria-label="Source"
            placeholder="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <label className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            <span>Plan</span>
            <select
              className="h-10 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
            >
              <option value="trial">trial</option>
              <option value="founder">founder</option>
              <option value="professional">professional</option>
              <option value="business">business</option>
              <option value="enterprise">enterprise</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            <span>Implementation</span>
            <select
              className="h-10 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm"
              value={implementationPreference}
              onChange={(e) => setImplementationPreference(e.target.value)}
            >
              <option value="ai_guided">ai_guided</option>
              <option value="professional">professional</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              Create lead
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg text-[var(--mpa-color-text-primary)]">
          Stage / activate
        </h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => void transitionStage(e)}>
          <label className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)] md:col-span-2">
            <span>Opportunity</span>
            <select
              className="h-10 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {opportunities.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.companyName} · {row.stage}
                  {row.organizationId ? ` · org ${row.organizationId.slice(0, 8)}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            <span>To stage</span>
            <select
              className="h-10 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm"
              value={toStage}
              onChange={(e) => setToStage(e.target.value)}
            >
              {(stages.length ? stages : ["won", "lost"]).map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <Input
            aria-label="Lost reason"
            placeholder="Lost reason (required for Lost)"
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={loading || !selectedId}>
              Transition stage
            </Button>
          </div>
        </form>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => void activateSelected(e)}>
          <Input
            aria-label="Activation idempotency key"
            placeholder="Activation idempotency key"
            value={activateIdempotencyKey}
            onChange={(e) => setActivateIdempotencyKey(e.target.value)}
          />
          <div className="flex items-end">
            <Button type="submit" disabled={loading || !selectedId}>
              Activate → AUTH provision
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg text-[var(--mpa-color-text-primary)]">
          Implementation / trial lookup (Slice B)
        </h2>
        <form
          className="grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setLoading(true);
              setNotice(null);
              const response = await fetch(
                `/api/master-admin/commercial/progress?organizationId=${encodeURIComponent(progressOrgId)}`,
                { cache: "no-store" }
              );
              const payload = (await response.json()) as {
                progress?: ImplementationProgressSnapshot;
                trial?: TrialLifecycleSnapshot;
                message?: string;
                error?: string;
              };
              setLoading(false);
              if (!response.ok) {
                setNotice({
                  kind: "error",
                  text: payload.message ?? payload.error ?? "Lookup failed"
                });
                return;
              }
              setProgress(payload.progress ?? null);
              setTrial(payload.trial ?? null);
              setNotice({ kind: "ok", text: "Progress loaded" });
            })();
          }}
        >
          <Input
            aria-label="Organization id"
            placeholder="Organization UUID"
            value={progressOrgId}
            onChange={(e) => setProgressOrgId(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading || !progressOrgId.trim()}>
            Lookup
          </Button>
        </form>
        {progress ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Score {progress.score}% · {progress.highestMilestone}
            {progress.nextStep ? ` · Next: ${progress.nextStep}` : ""}
          </p>
        ) : null}
        {trial ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Trial {trial.status}
            {trial.daysRemaining != null ? ` · ${trial.daysRemaining}d left` : ""}
            {trial.featureRestricted ? " · features restricted" : ""}
          </p>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg text-[var(--mpa-color-text-primary)]">
          Health / discovery / timeline (Slice C)
        </h2>
        <form
          className="grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setLoading(true);
              setNotice(null);
              const response = await fetch(
                `/api/master-admin/commercial/health?organizationId=${encodeURIComponent(progressOrgId)}`,
                { cache: "no-store" }
              );
              const payload = (await response.json()) as {
                health?: HealthScoreSnapshot;
                discoveries?: FeatureDiscoverySnapshot;
                timeline?: CommunicationTimelineEntry[];
                message?: string;
                error?: string;
              };
              setLoading(false);
              if (!response.ok) {
                setNotice({
                  kind: "error",
                  text: payload.message ?? payload.error ?? "Lookup failed"
                });
                return;
              }
              setHealth(payload.health ?? null);
              setDiscoveries(payload.discoveries ?? null);
              setTimeline(payload.timeline ?? []);
              setNotice({ kind: "ok", text: "Health / discovery / timeline loaded" });
            })();
          }}
        >
          <Input
            aria-label="Organization id for health"
            placeholder="Organization UUID (same as progress lookup)"
            value={progressOrgId}
            onChange={(e) => setProgressOrgId(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading || !progressOrgId.trim()}>
            Lookup Slice C
          </Button>
        </form>
        {health ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Health {health.band} · score {health.score} · {health.csCadenceLabel}
            {health.drivers[0] ? ` · Driver: ${health.drivers[0].label}` : ""}
          </p>
        ) : null}
        {discoveries ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Primary discovery: {discoveries.primary?.key ?? "none"}
            {discoveries.suppressedBilling ? " · billing suppress active" : ""}
            {` · ${discoveries.open.length} open`}
          </p>
        ) : null}
        {timeline.length > 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Timeline entries: {timeline.length} (latest: {timeline[0]?.entryType})
          </p>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg text-[var(--mpa-color-text-primary)]">
          Offboarding / CS / renewals (Slice D)
        </h2>
        <form
          className="grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setLoading(true);
              setNotice(null);
              const response = await fetch(
                `/api/master-admin/commercial/offboarding?organizationId=${encodeURIComponent(progressOrgId)}`,
                { cache: "no-store" }
              );
              const payload = (await response.json()) as {
                offboarding?: OffboardingSnapshot;
                motions?: CsMotionSnapshot[];
                alerts?: RenewalAlertSnapshot[];
                message?: string;
                error?: string;
              };
              setLoading(false);
              if (!response.ok) {
                setNotice({
                  kind: "error",
                  text: payload.message ?? payload.error ?? "Lookup failed"
                });
                return;
              }
              setOffboarding(payload.offboarding ?? null);
              setCsMotions(payload.motions ?? []);
              setRenewalAlerts(payload.alerts ?? []);
              setNotice({ kind: "ok", text: "Slice D state loaded" });
            })();
          }}
        >
          <Input
            aria-label="Organization id for offboarding"
            placeholder="Organization UUID (same as progress lookup)"
            value={progressOrgId}
            onChange={(e) => setProgressOrgId(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading || !progressOrgId.trim()}>
            Lookup Slice D
          </Button>
        </form>
        {offboarding ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Offboarding {offboarding.stage} · purge {offboarding.purgeAllowed ? "allowed" : "blocked"}
            {offboarding.exportReadyAt ? " · export ready" : ""}
            {offboarding.frozenAt ? " · frozen" : ""}
            {offboarding.archivedAt ? " · archived" : ""}
          </p>
        ) : null}
        {csMotions.length > 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            CS motions:{" "}
            {csMotions.map((m) => `${m.motionKey}=${m.status}`).join(" · ")}
          </p>
        ) : null}
        {renewalAlerts.length > 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Renewals:{" "}
            {renewalAlerts
              .slice(0, 5)
              .map((a) => `${a.milestoneKey}=${a.status}`)
              .join(" · ")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !progressOrgId.trim()}
            onClick={() => {
              void (async () => {
                setLoading(true);
                setNotice(null);
                const response = await fetch("/api/master-admin/commercial/offboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    organizationId: progressOrgId.trim(),
                    action: "confirm_cancel",
                    skipRetentionOffer: true
                  })
                });
                const payload = (await response.json()) as {
                  offboarding?: OffboardingSnapshot;
                  message?: string;
                  error?: string;
                };
                setLoading(false);
                if (!response.ok) {
                  setNotice({
                    kind: "error",
                    text: payload.message ?? payload.error ?? "Cancel failed"
                  });
                  return;
                }
                setOffboarding(payload.offboarding ?? null);
                setNotice({ kind: "ok", text: "Cancellation confirmed (no purge)" });
              })();
            }}
          >
            Confirm cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !progressOrgId.trim()}
            onClick={() => {
              void (async () => {
                setLoading(true);
                setNotice(null);
                const response = await fetch("/api/master-admin/commercial/offboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    organizationId: progressOrgId.trim(),
                    action: "coordinate_billing"
                  })
                });
                const payload = (await response.json()) as {
                  offboarding?: OffboardingSnapshot;
                  message?: string;
                  error?: string;
                };
                setLoading(false);
                if (!response.ok) {
                  setNotice({
                    kind: "error",
                    text: payload.message ?? payload.error ?? "Billing/export failed"
                  });
                  return;
                }
                setOffboarding(payload.offboarding ?? null);
                setNotice({ kind: "ok", text: "Final billing + export window opened" });
              })();
            }}
          >
            Billing + export
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !progressOrgId.trim()}
            onClick={() => {
              void (async () => {
                setLoading(true);
                setNotice(null);
                const response = await fetch("/api/master-admin/commercial/offboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    organizationId: progressOrgId.trim(),
                    action: "freeze"
                  })
                });
                const payload = (await response.json()) as {
                  offboarding?: OffboardingSnapshot;
                  message?: string;
                  error?: string;
                };
                setLoading(false);
                if (!response.ok) {
                  setNotice({
                    kind: "error",
                    text: payload.message ?? payload.error ?? "Freeze failed"
                  });
                  return;
                }
                setOffboarding(payload.offboarding ?? null);
                setNotice({ kind: "ok", text: "Organization frozen" });
              })();
            }}
          >
            Freeze
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !progressOrgId.trim()}
            onClick={() => {
              void (async () => {
                setLoading(true);
                setNotice(null);
                const response = await fetch("/api/master-admin/commercial/offboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    organizationId: progressOrgId.trim(),
                    action: "archive"
                  })
                });
                const payload = (await response.json()) as {
                  offboarding?: OffboardingSnapshot;
                  message?: string;
                  error?: string;
                };
                setLoading(false);
                if (!response.ok) {
                  setNotice({
                    kind: "error",
                    text: payload.message ?? payload.error ?? "Archive failed"
                  });
                  return;
                }
                setOffboarding(payload.offboarding ?? null);
                setNotice({ kind: "ok", text: "Organization archived" });
              })();
            }}
          >
            Archive
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !progressOrgId.trim()}
            onClick={() => {
              void (async () => {
                setLoading(true);
                setNotice(null);
                const response = await fetch("/api/master-admin/commercial/offboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    organizationId: progressOrgId.trim(),
                    action: "refresh_cs"
                  })
                });
                const payload = (await response.json()) as {
                  motions?: CsMotionSnapshot[];
                  message?: string;
                  error?: string;
                };
                setLoading(false);
                if (!response.ok) {
                  setNotice({
                    kind: "error",
                    text: payload.message ?? payload.error ?? "CS refresh failed"
                  });
                  return;
                }
                setCsMotions(payload.motions ?? []);
                setNotice({ kind: "ok", text: "CS motions refreshed" });
              })();
            }}
          >
            Refresh CS
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !progressOrgId.trim()}
            onClick={() => {
              void (async () => {
                setLoading(true);
                setNotice(null);
                const response = await fetch("/api/master-admin/commercial/offboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    organizationId: progressOrgId.trim(),
                    action: "refresh_renewals"
                  })
                });
                const payload = (await response.json()) as {
                  alerts?: RenewalAlertSnapshot[];
                  message?: string;
                  error?: string;
                };
                setLoading(false);
                if (!response.ok) {
                  setNotice({
                    kind: "error",
                    text: payload.message ?? payload.error ?? "Renewal refresh failed"
                  });
                  return;
                }
                setRenewalAlerts(payload.alerts ?? []);
                setNotice({ kind: "ok", text: "Renewal alerts refreshed" });
              })();
            }}
          >
            Refresh renewals
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg text-[var(--mpa-color-text-primary)]">
            Pipeline ({opportunities.length})
          </h2>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>
        <ul className="divide-y divide-[var(--mpa-color-border-default)]">
          {opportunities.map((row) => (
            <li key={row.id} className="py-3 text-sm">
              <p className="font-medium text-[var(--mpa-color-text-primary)]">
                {row.companyName}{" "}
                <span className="text-[var(--mpa-color-text-muted)]">· {row.stage}</span>
              </p>
              <p className="text-[var(--mpa-color-text-secondary)]">
                {row.contactEmail}
                {row.organizationId ? ` · org ${row.organizationId}` : " · no organization"}
              </p>
            </li>
          ))}
          {opportunities.length === 0 ? (
            <li className="py-3 text-sm text-[var(--mpa-color-text-muted)]">No opportunities yet.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
