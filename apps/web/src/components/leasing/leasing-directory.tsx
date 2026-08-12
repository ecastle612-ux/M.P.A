"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  APPLICATION_STATUS_LABELS,
  LEASE_STATUS_LABELS,
  LEASING_PIPELINE_SECTION_LABELS,
  RESIDENT_STATUS_LABELS,
  type ApplicationStatus,
  type LeaseStatus,
  type LeasingPipelineSection,
  type ResidentStatus
} from "@mpa/shared";
import { Button, EmptyState, Skeleton } from "@mpa/ui";
import { LeaseCreateWizard } from "./lease-create-wizard";
import { ApplicationCreateForm } from "./application-create-form";
import { ConfirmActionModal } from "../shell/confirm-action-modal";
import {
  PmDirectoryToolbar,
  PmDocumentsStrip,
  PmEntityCard,
  PmErrorRetry,
  PmPageChrome,
  PmQuickActions,
  documentsHref
} from "../shell/pm-workspace";
import { applicationDenyConfirmation } from "../../lib/ui/destructive-confirm-copy";

type DirectoryLease = {
  id: string;
  status: string;
  rent_amount: number;
  currency: string;
  start_date?: string | null;
  end_date?: string | null;
  property_properties?: { name: string } | null;
  property_units?: { unit_label: string } | null;
  pm_residents?: { display_name: string; email: string; status?: string } | null;
};

type PipelineApplication = {
  id: string;
  resident_id: string;
  status: string;
  screening_status: string | null;
  desired_move_in: string | null;
  incomplete_reason: string | null;
  pm_residents?: { display_name: string; email: string; status: string } | null;
  property_properties?: { name: string } | null;
  property_units?: { unit_label: string } | null;
};

type PipelinePerson = {
  id: string;
  display_name: string;
  email: string;
  status: string;
  lease_id?: string | null;
  property_properties?: { name: string } | null;
  property_units?: { unit_label: string } | null;
};

type LeasingPipeline = {
  prospects: PipelinePerson[];
  applications: PipelineApplication[];
  awaitingReview: PipelineApplication[];
  screeningPending: PipelineApplication[];
  approvals: PipelineApplication[];
  readyForLease: PipelinePerson[];
  leaseSigning: DirectoryLease[];
  moveIns: PipelinePerson[];
  renewals: DirectoryLease[];
  moveOuts: PipelinePerson[];
};

function leaseStatusLabel(status: string): string {
  if (status in LEASE_STATUS_LABELS) {
    return LEASE_STATUS_LABELS[status as LeaseStatus];
  }
  return status;
}

function applicationStatusLabel(status: string): string {
  if (status in APPLICATION_STATUS_LABELS) {
    return APPLICATION_STATUS_LABELS[status as ApplicationStatus];
  }
  return status;
}

function personStatusLabel(status: string): string {
  if (status in RESIDENT_STATUS_LABELS) {
    return RESIDENT_STATUS_LABELS[status as ResidentStatus];
  }
  return status;
}

function formatRent(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

async function runApplicationAction(applicationId: string, action: string, extra?: Record<string, string>) {
  const response = await fetch(`/api/pm/leasing/applications/${applicationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra })
  });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Action failed");
  }
}

function PipelineHeading({
  id,
  section,
  count
}: {
  id: string;
  section: LeasingPipelineSection;
  count: number;
}) {
  return (
    <div id={id} className="flex items-baseline justify-between gap-3 pt-2">
          <h2 className="font-display text-lg text-[var(--mpa-color-text-primary)]">
        {LEASING_PIPELINE_SECTION_LABELS[section]}
      </h2>
      <span className="text-xs text-[var(--mpa-color-text-secondary)]">{count}</span>
    </div>
  );
}

export function LeasingDirectory() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const [leases, setLeases] = useState<DirectoryLease[]>([]);
  const [pipeline, setPipeline] = useState<LeasingPipeline | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [denyTarget, setDenyTarget] = useState<{ id: string; name: string } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [leasesRes, pipelineRes] = await Promise.all([
          fetch("/api/pm/leasing"),
          fetch("/api/pm/leasing/applications?pipeline=1")
        ]);
        const leasesBody = (await leasesRes.json()) as {
          leases?: DirectoryLease[];
          error?: string;
        };
        const pipelineBody = (await pipelineRes.json()) as {
          pipeline?: LeasingPipeline;
          error?: string;
        };
        if (!leasesRes.ok) {
          throw new Error(leasesBody.error ?? "Unable to load leases.");
        }
        if (!pipelineRes.ok) {
          throw new Error(pipelineBody.error ?? "Unable to load leasing pipeline.");
        }
        if (!cancelled) {
          setLeases(leasesBody.leases ?? []);
          setPipeline(pipelineBody.pipeline ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load leasing.");
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
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leases;
    return leases.filter((lease) =>
      `${lease.pm_residents?.display_name ?? ""} ${lease.pm_residents?.email ?? ""} ${lease.status} ${lease.property_properties?.name ?? ""} ${lease.property_units?.unit_label ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [leases, query]);

  const empty = !loading && !error && leases.length === 0 && !(pipeline?.applications.length);
  const showWizard = manualOpen || ((startWithWizard || empty) && !wizardDismissed);
  const activeCount = leases.filter((l) => l.status === "active").length;

  async function onAction(applicationId: string, action: string, extra?: Record<string, string>) {
    setBusyId(applicationId);
    setActionError(null);
    try {
      await runApplicationAction(applicationId, action, extra);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PmPageChrome
      crumbs={[
        { href: "/pm/mission-control", label: "Mission Control" },
        { label: "Leasing" }
      ]}
      eyebrow="Property Manager · Occupancy"
      title="Leasing"
      description="Prospect through move-out on one person record. Applications, manual screening status, lease signing (SignWell), and renewals live in this workspace."
      actions={
        <Button
          type="button"
          onClick={() => {
            setWizardDismissed(false);
            setManualOpen(true);
          }}
        >
          Create lease
        </Button>
      }
    >
      <PmQuickActions
        actions={[
          { href: "#prospects", label: "Prospects" },
          { href: "#applications", label: "Applications" },
          { href: "#lease-signing", label: "Lease signing" },
          { href: "/pm/residents", label: "Residents" },
          { href: documentsHref("lease"), label: "Lease agreements" },
          { href: "/pm/mission-control", label: "Mission Control" }
        ]}
      />

      {!loading && !error && leases.length > 0 ? (
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          {leases.length} leases · {activeCount} active
          {pipeline ? ` · ${pipeline.applications.length} applications` : ""}
        </p>
      ) : null}

      {actionError ? (
        <p className="text-sm text-[var(--mpa-color-danger)]" role="alert">
          {actionError}
        </p>
      ) : null}

      {!loading && !error ? <ApplicationCreateForm onCreated={reload} /> : null}

      {showWizard ? (
        <LeaseCreateWizard
          {...(empty
            ? {}
            : {
                onCancel: () => {
                  setManualOpen(false);
                  setWizardDismissed(true);
                }
              })}
        />
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? (
        <PmErrorRetry
          title="Unable to load leasing"
          description={error}
          onRetry={reload}
        />
      ) : null}

      {!loading && !error && pipeline ? (
        <div className="space-y-8">
          <section className="space-y-3" aria-labelledby="prospects-heading">
            <PipelineHeading
              id="prospects"
              section="prospects"
              count={pipeline.prospects.length}
            />
            <p id="prospects-heading" className="sr-only">
              Prospects
            </p>
            {pipeline.prospects.length === 0 ? (
              <EmptyState
                title="No prospects"
                description="Prospects are the same person record — status Prospect until an application starts."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {pipeline.prospects.map((person) => (
                  <PmEntityCard
                    key={person.id}
                    title={person.display_name}
                    href={`/pm/residents/${person.id}`}
                    meta={`${person.property_properties?.name ?? "Property"} · ${person.email}`}
                    status={personStatusLabel(person.status)}
                    footer="Open the person record — do not create a duplicate."
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="applications-heading">
            <PipelineHeading
              id="applications"
              section="applications"
              count={pipeline.applications.length}
            />
            <p id="applications-heading" className="sr-only">
              Applications
            </p>
            {pipeline.applications.length === 0 ? (
              <EmptyState
                title="No applications"
                description="Applications attach to the applicant, property, and later the lease — documents stay in Document Intelligence."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {pipeline.applications.map((app) => (
                  <PmEntityCard
                    key={app.id}
                    title={app.pm_residents?.display_name ?? "Application"}
                    href={`/pm/residents/${app.resident_id}`}
                    meta={`${app.property_properties?.name ?? "Property"} · Unit ${app.property_units?.unit_label ?? "—"}`}
                    status={applicationStatusLabel(app.status)}
                    footer={
                      app.status === "screening_pending"
                        ? "Screening pending (manual)"
                        : app.incomplete_reason
                          ? `Incomplete: ${app.incomplete_reason}`
                          : "Review, screen (placeholder), approve, then create lease."
                    }
                  >
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["draft", "incomplete"].includes(app.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId === app.id}
                          onClick={() => void onAction(app.id, "submit")}
                        >
                          Submit
                        </Button>
                      ) : null}
                      {["submitted", "incomplete"].includes(app.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busyId === app.id}
                          onClick={() => void onAction(app.id, "screening")}
                        >
                          Mark screening pending
                        </Button>
                      ) : null}
                      {["submitted", "screening_pending", "incomplete"].includes(app.status) ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={busyId === app.id}
                            onClick={() => void onAction(app.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busyId === app.id}
                            onClick={() =>
                              void onAction(app.id, "incomplete", {
                                reason: "Missing required documents"
                              })
                            }
                          >
                            Mark incomplete
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busyId === app.id}
                            onClick={() =>
                              setDenyTarget({
                                id: app.id,
                                name: app.pm_residents?.display_name ?? "this applicant"
                              })
                            }
                          >
                            Deny
                          </Button>
                        </>
                      ) : null}
                      <a
                        href={documentsHref("application", app.pm_residents?.display_name)}
                        className="self-center text-xs text-[var(--mpa-color-brand-primary)] underline"
                      >
                        Application documents
                      </a>
                    </div>
                  </PmEntityCard>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="approvals-heading">
            <PipelineHeading id="approvals" section="approvals" count={pipeline.approvals.length} />
            <p id="approvals-heading" className="sr-only">
              Approvals
            </p>
            {pipeline.approvals.length === 0 && pipeline.readyForLease.length === 0 ? (
              <EmptyState
                title="No approvals waiting"
                description="Approved applicants stay on the same person record — ready for lease creation."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {pipeline.approvals.map((app) => (
                  <PmEntityCard
                    key={app.id}
                    title={app.pm_residents?.display_name ?? "Approved"}
                    href="/pm/leasing?new=1"
                    meta={app.property_properties?.name ?? "Property"}
                    status="Approved"
                    footer="Create lease — SignWell path is unchanged."
                  />
                ))}
                {pipeline.readyForLease.map((person) => (
                  <PmEntityCard
                    key={person.id}
                    title={person.display_name}
                    href="/pm/leasing?new=1"
                    meta={`${person.property_properties?.name ?? "Property"} · ${person.email}`}
                    status={personStatusLabel(person.status)}
                    footer="Ready for lease create wizard."
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="lease-signing-heading">
            <PipelineHeading
              id="lease-signing"
              section="lease_signing"
              count={pipeline.leaseSigning.length}
            />
            <p id="lease-signing-heading" className="sr-only">
              Lease Signing
            </p>
            {pipeline.leaseSigning.length === 0 ? (
              <EmptyState
                title="No leases in signing"
                description="Draft and pending-signature leases use the existing SignWell integration."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {pipeline.leaseSigning.map((lease) => (
                  <PmEntityCard
                    key={lease.id}
                    title={lease.pm_residents?.display_name ?? "Lease"}
                    href={`/pm/leasing/${lease.id}`}
                    meta={`${lease.property_properties?.name ?? "Property"} · ${formatRent(lease.rent_amount, lease.currency)}`}
                    status={leaseStatusLabel(lease.status)}
                    footer="Open lease command center to send or sync SignWell."
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="move-ins-heading">
            <PipelineHeading id="move-ins" section="move_ins" count={pipeline.moveIns.length} />
            <p id="move-ins-heading" className="sr-only">
              Move-ins
            </p>
            {pipeline.moveIns.length === 0 ? (
              <EmptyState
                title="No pending move-ins"
                description="After lease send, the person status becomes Pending Move-In until activation."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {pipeline.moveIns.map((person) => (
                  <PmEntityCard
                    key={person.id}
                    title={person.display_name}
                    href={person.lease_id ? `/pm/leasing/${person.lease_id}` : `/pm/residents/${person.id}`}
                    meta={person.property_properties?.name ?? "Property"}
                    status={personStatusLabel(person.status)}
                    footer="Complete signature and activation to become Resident."
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="renewals-heading">
            <PipelineHeading id="renewals" section="renewals" count={pipeline.renewals.length} />
            <p id="renewals-heading" className="sr-only">
              Renewals
            </p>
            {pipeline.renewals.length === 0 ? (
              <EmptyState
                title="No renewals in window"
                description="Active leases with an end date in the next 60 days appear here."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {pipeline.renewals.map((lease) => (
                  <PmEntityCard
                    key={lease.id}
                    title={lease.pm_residents?.display_name ?? "Lease"}
                    href={`/pm/leasing/${lease.id}`}
                    meta={`${lease.property_properties?.name ?? "Property"} · Ends ${lease.end_date ?? "—"}`}
                    status={leaseStatusLabel(lease.status)}
                    footer="Renewal outreach — same lease and person records."
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="move-outs-heading">
            <PipelineHeading id="move-outs" section="move_outs" count={pipeline.moveOuts.length} />
            <p id="move-outs-heading" className="sr-only">
              Move-outs
            </p>
            {pipeline.moveOuts.length === 0 ? (
              <EmptyState
                title="No former residents listed"
                description="Former and archived people stay on the same record — status only."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {pipeline.moveOuts.map((person) => (
                  <PmEntityCard
                    key={person.id}
                    title={person.display_name}
                    href={`/pm/residents/${person.id}`}
                    meta={person.property_properties?.name ?? "Property"}
                    status={personStatusLabel(person.status)}
                    footer="Historical person record — not a duplicate."
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {!loading && !error && leases.length > 0 ? (
        <section className="space-y-3 pt-4" aria-labelledby="all-leases-heading">
          <h2
            id="all-leases-heading"
            className="font-display text-lg text-[var(--mpa-color-text-primary)]"
          >
            All leases
          </h2>
          <PmDirectoryToolbar
            id="pm-leasing-search"
            value={query}
            onChange={setQuery}
            placeholder="Search resident, property, unit, or status…"
            showing={filtered.length}
            total={leases.length}
          />
          {filtered.length === 0 ? (
            <EmptyState title="No matching leases" description="Try a different search." />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filtered.map((lease) => (
                <PmEntityCard
                  key={lease.id}
                  title={lease.pm_residents?.display_name ?? "Lease"}
                  href={`/pm/leasing/${lease.id}`}
                  meta={`${lease.property_properties?.name ?? "Property"} · Unit ${lease.property_units?.unit_label ?? "—"} · ${formatRent(lease.rent_amount, lease.currency)}`}
                  status={leaseStatusLabel(lease.status)}
                  footer="Open lease to review, send for signature, or activate."
                >
                  <div className="mt-3">
                    <a
                      href={documentsHref("lease", lease.pm_residents?.display_name)}
                      className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                    >
                      Lease documents
                    </a>
                  </div>
                </PmEntityCard>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {!loading && !error ? (
        <PmDocumentsStrip entityType="lease" title="Lease agreements" />
      ) : null}

      {denyTarget ? (
        <ConfirmActionModal
          open
          onClose={() => setDenyTarget(null)}
          busy={busyId === denyTarget.id}
          confirmLabel="Confirm denial"
          cancelLabel="Keep application"
          title={applicationDenyConfirmation({ applicantName: denyTarget.name }).title}
          onConfirm={() => {
            const target = denyTarget;
            void (async () => {
              await onAction(target.id, "deny");
              setDenyTarget(null);
            })();
          }}
        >
          {(() => {
            const copy = applicationDenyConfirmation({ applicantName: denyTarget.name });
            return (
              <div className="space-y-2 text-[var(--mpa-color-text-secondary)]">
                <p>{copy.what}</p>
                <p>{copy.when}</p>
                <p className="font-medium text-[var(--mpa-color-text-primary)]">{copy.irreversible}</p>
              </div>
            );
          })()}
        </ConfirmActionModal>
      ) : null}
    </PmPageChrome>
  );
}
