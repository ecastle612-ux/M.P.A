"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buttonClassName, Alert, Badge, Button, Skeleton, TimelineView } from "@mpa/ui";
import { formatMoney, MPA_ASSISTANT_KIND, MPA_ASSISTANT_LABEL } from "@mpa/shared";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { ErrorRetry } from "../shell/error-retry";
import { PmDocumentsStrip, PmQuickActions, documentsHref } from "../shell/pm-workspace";

type CommandCenter = {
  lease: {
    id: string;
    status: string;
    statusLabel: string;
    rentAmount: number;
    currency: string;
    startDate: string;
    dayOfMonth: number;
    signingChannel: string | null;
    signwellDocumentId: string | null;
    signwellStatus: string | null;
    signwellError: string | null;
    documentName: string | null;
    documentBody: string | null;
    requireManagerSignature: boolean;
    managerName: string | null;
    managerEmail: string | null;
    signedAt: string | null;
    activatedAt: string | null;
    propertyId: string;
    propertyName: string;
    unitLabel: string;
    residentId: string | null;
    residentName: string;
    residentEmail: string | null;
    residentStatus: string | null;
    portalStatus: string | null;
  };
  schedule: { id: string; nextRunOn: string; amount: number; dayOfMonth: number } | null;
  signWellConfigured: boolean;
  timeline: Array<{ id: string; title: string; detail: string; occurredAt: string; kind: string }>;
  assistantRecommendation: string;
  readyMessage: string | null;
  nextJourney: { title: string; href: string; detail: string };
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function LeaseCommandCenter({ leaseId }: { leaseId: string }) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const [data, setData] = useState<CommandCenter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [portalHandoff, setPortalHandoff] = useState<{
    firstLoginMessage: string;
    loginHref: string;
    magicLink: string | null;
    email: string;
  } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/pm/leasing/${leaseId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load lease");
    }
    setData(body as CommandCenter);
  }, [leaseId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load lease");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function runAction(path: string, successFallback: string) {
    setBusy(true);
    setActionMessage(null);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Action failed");
      }
      setActionMessage(body.notice ?? body.readyMessage ?? body.assistantRecommendation ?? successFallback);
      if (body.portalHandoff?.firstLoginMessage) {
        setPortalHandoff({
          firstLoginMessage: body.portalHandoff.firstLoginMessage as string,
          loginHref: (body.portalHandoff.loginHref as string) ?? "/login?next=/portal/tenant",
          magicLink: (body.portalHandoff.magicLink as string | null) ?? null,
          email: (body.portalHandoff.email as string) ?? ""
        });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 p-4 md:p-6">
        <ErrorRetry
          title="Lease unavailable"
          description={error ?? "We couldn’t load this lease. Check your connection and try again."}
          onRetry={() => {
            void (async () => {
              setLoading(true);
              setError(null);
              try {
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load lease");
              } finally {
                setLoading(false);
              }
            })();
          }}
        />
      </main>
    );
  }

  const active = data.lease.status === "active";
  const canSend = data.lease.status === "draft" || data.lease.status === "pending_signature";
  const canOffline = ["draft", "pending_signature", "signed"].includes(data.lease.status) && !active;
  const canSync = Boolean(data.lease.signwellDocumentId) && !active;

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { href: "/pm/leasing", label: "Leasing" },
          { label: data.lease.residentName }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Lease Command Center
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {data.lease.residentName}
          </h1>
          <Badge variant={active ? "success" : "neutral"}>{data.lease.statusLabel}</Badge>
          {data.lease.portalStatus === "active" ? (
            <Badge variant="success">Portal Active</Badge>
          ) : (
            <Badge variant="warning">Portal Pending Activation</Badge>
          )}
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {data.lease.propertyName} · Unit {data.lease.unitLabel} ·{" "}
          {formatMoney(data.lease.rentAmount, data.lease.currency)} / month
        </p>
        <PmQuickActions
          actions={[
            ...(data.lease.residentId
              ? [{ href: `/pm/residents/${data.lease.residentId}`, label: "Resident" }]
              : []),
            { href: documentsHref("lease", data.lease.residentName), label: "Lease documents" },
            { href: "/pm/financial-operations", label: "Record payment" }
          ]}
        />
      </header>

      <PmDocumentsStrip
        entityType="lease"
        title="Lease agreements"
        detail="Generated agreements and SignWell records stay in Documents with this lease — ready for Document Intelligence."
      />

      {justCreated || data.readyMessage ? (
        <Alert
          variant="success"
          className="max-w-3xl"
          title={data.readyMessage ?? "Lease draft is ready."}
          aria-live="polite"
        >
          <p>
            {active
              ? "Resident, portal, occupancy, and recurring rent are active."
              : "Review the generated document, then send through SignWell."}
          </p>
        </Alert>
      ) : null}

      <section
        aria-label="M.P.A. Assistant"
        className="max-w-3xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {MPA_ASSISTANT_LABEL}
        </p>
        <p className="text-xs text-[var(--mpa-color-text-muted)]">{MPA_ASSISTANT_KIND}</p>
        <p className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          {data.assistantRecommendation}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{data.nextJourney.detail}</p>
        {active && data.nextJourney.href.startsWith("/") ? (
          <Link
            href={data.nextJourney.href}
            className={buttonClassName()}
          >
            {data.nextJourney.title}
          </Link>
        ) : null}
      </section>

      <section
        id="send"
        className="max-w-3xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
      >
        <h2 className="text-base font-semibold">Signature workflow</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          SignWell {data.signWellConfigured ? "is configured" : "is not configured"}. One signature
          workflow — no parallel paths. Offline completion is the honesty fallback when SignWell is
          unavailable.
        </p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--mpa-color-text-secondary)]">Channel</dt>
            <dd>{data.lease.signingChannel ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--mpa-color-text-secondary)]">SignWell status</dt>
            <dd>{data.lease.signwellStatus ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--mpa-color-text-secondary)]">Document</dt>
            <dd>{data.lease.documentName ?? "—"}</dd>
          </div>
          {data.lease.requireManagerSignature ? (
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Manager signer</dt>
              <dd>
                {data.lease.managerName} · {data.lease.managerEmail}
              </dd>
            </div>
          ) : null}
        </dl>
        {data.lease.signwellError ? (
          <p className="text-sm text-[#C0392B]">{data.lease.signwellError}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {canSend ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() => void runAction(`/api/pm/leasing/${leaseId}/send`, "Sent for signature.")}
            >
              {busy ? "Working…" : "Send through SignWell"}
            </Button>
          ) : null}
          {canSync ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void runAction(`/api/pm/leasing/${leaseId}/sync`, "Synced SignWell.")}
            >
              Sync SignWell status
            </Button>
          ) : null}
          {canOffline ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void runAction(
                  `/api/pm/leasing/${leaseId}/complete-offline`,
                  "Lease activated via offline signed path."
                )
              }
            >
              Record signed offline
            </Button>
          ) : null}
        </div>
        {actionMessage ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{actionMessage}</p> : null}
        {portalHandoff ? (
          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] p-3 text-sm">
            <p className="font-medium text-[var(--mpa-color-text-primary)]">Resident portal first login</p>
            <p className="mt-1 text-[var(--mpa-color-text-secondary)]">{portalHandoff.firstLoginMessage}</p>
            <p className="mt-2">
              <Link
                href={portalHandoff.loginHref}
                className="text-[var(--mpa-color-brand-primary)] underline"
              >
                Open resident login path
              </Link>
            </p>
            {portalHandoff.magicLink ? (
              <p className="mt-2 break-all text-xs text-[var(--mpa-color-text-secondary)]">
                Magic link: {portalHandoff.magicLink}
              </p>
            ) : null}
          </div>
        ) : null}
        {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      </section>

      <section className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold">Lease document</h2>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-[var(--mpa-color-bg-app)] p-3 text-xs text-[var(--mpa-color-text-primary)]">
            {data.lease.documentBody ?? "No document generated."}
          </pre>
        </div>
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold">Activation & money</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Resident status</dt>
              <dd>{data.lease.residentStatus ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Portal</dt>
              <dd>{data.lease.portalStatus ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Next rent</dt>
              <dd>{data.schedule?.nextRunOn ?? (active ? "Scheduled" : "After activation")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Property</dt>
              <dd>
                <Link
                  href={`/pm/properties/${data.lease.propertyId}`}
                  className="text-[var(--mpa-color-brand-primary)] underline"
                >
                  {data.lease.propertyName}
                </Link>
              </dd>
            </div>
            {data.lease.residentId ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--mpa-color-text-secondary)]">Resident</dt>
                <dd>
                  <Link
                    href={`/pm/residents/${data.lease.residentId}`}
                    className="text-[var(--mpa-color-brand-primary)] underline"
                  >
                    Command Center
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Timeline</h3>
            <TimelineView
              items={data.timeline.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.detail,
                occurredAtLabel: formatWhen(item.occurredAt)
              }))}
              empty={<p className="text-sm text-[var(--mpa-color-text-secondary)]">No events yet.</p>}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
