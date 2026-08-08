import {
  COM_002_FLAGS,
  canAccessWorkspaceModules,
  operatorStepStatuses
} from "@mpa/shared";
import { listSaasCustomers } from "../../lib/saas-provisioning/customers-store";
import { listProvisioningJobsFromDb } from "../../lib/saas-provisioning/jobs-store";
import { listSaasPurchases } from "../../lib/saas-stripe/purchase-store";
import { RetryProvisioningButton } from "./retry-provisioning-button";

export async function SaasProvisioningConsole() {
  const jobs = await listProvisioningJobsFromDb(40);
  const purchases = listSaasPurchases();
  const customers = listSaasCustomers();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">Commercial Provisioning</h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          COM-002 Slice D verification — automatic customer provisioning after Stripe SaaS payment.
          Checkpoints are recoverable, idempotent, observable, retryable, and compensatable.
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Status: aligned · continue /commerce/continue · claim /api/commerce/provision/claim
        </p>
      </header>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Flag label="sliceD_automaticProvisioning" value={COM_002_FLAGS.sliceD_automaticProvisioning} />
        <Flag label="sliceE_lifecycle" value={COM_002_FLAGS.sliceE_subscriptionLifecycle} />
        <Flag label="sliceF_portal" value={COM_002_FLAGS.sliceF_customerPortal} />
        <Flag label="jobs_in_memory" value={jobs.length > 0} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Provisioning jobs</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Count: {jobs.length}</p>
        {jobs.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No provisioning jobs in this instance.</p>
        ) : (
          <ul className="space-y-3">
            {jobs.slice(0, 30).map((job) => {
              const steps = operatorStepStatuses(job);
              return (
                <li
                  key={job.id}
                  className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 font-mono text-xs">
                      <p>{job.checkoutSessionId}</p>
                      <p>
                        checkpoint={job.checkpoint} · attempts={job.attemptCount} · modules=
                        {String(canAccessWorkspaceModules(job.checkpoint))}
                      </p>
                      <p>
                        email={job.ownerEmail} · org={job.organizationId ?? "—"} · user=
                        {job.ownerUserId ?? "—"}
                      </p>
                      {job.lastError ? <p className="text-red-700">error={job.lastError}</p> : null}
                    </div>
                    {(job.checkpoint === "failed_retryable" || job.checkpoint === "failed_dead") && (
                      <RetryProvisioningButton checkoutSessionId={job.checkoutSessionId} />
                    )}
                  </div>
                  <ol className="grid gap-1 text-xs sm:grid-cols-3">
                    {steps.map((step) => (
                      <li key={step.key}>
                        {step.done ? "✓" : step.current ? "→" : "·"} {step.label}
                      </li>
                    ))}
                  </ol>
                  <details className="text-xs text-[var(--mpa-color-text-muted)]">
                    <summary>Audit ({job.audit.length})</summary>
                    <ul className="mt-1 space-y-1 font-mono">
                      {job.audit.slice(-12).map((entry, index) => (
                        <li key={`${entry.at}-${index}`}>
                          {entry.at} {entry.from}→{entry.to}
                          {entry.reason ? ` (${entry.reason})` : ""}
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Linked SaaS customers</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Count: {customers.length}</p>
        {customers.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No saas_customers rows in memory.</p>
        ) : (
          <ul className="space-y-2 text-xs font-mono">
            {customers.slice(0, 20).map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2"
              >
                {row.stripeCustomerId} · {row.email} · session={row.checkoutSessionId} · org=
                {row.organizationId ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Purchases (provisioned flag)</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Count: {purchases.length}. provisioned becomes true at checkpoint ready.
        </p>
        {purchases.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No purchases yet.</p>
        ) : (
          <ul className="space-y-2 text-xs font-mono">
            {purchases.slice(0, 20).map((row) => (
              <li
                key={row.stripeCheckoutSessionId}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2"
              >
                {row.stripeCheckoutSessionId} · {row.status} · provisioned={String(row.provisioned)} ·
                org={row.organizationId ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Verification checklist
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stripe purchase validated at checkpoint received → customer_linked</li>
          <li>Identity + saas_customers linked without duplicates</li>
          <li>Organization created once (idempotent slug / session key)</li>
          <li>Product activation at entitled; no second subscription invent</li>
          <li>Owner claim after email proof → owner_bound → welcome → ready</li>
          <li>Webhook replay / retry does not duplicate identity or org</li>
          <li>Failure recovery emails + safe resume from failed_retryable</li>
          <li>Audit trail on every checkpoint transition</li>
        </ul>
      </section>
    </main>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm">
      <p className="font-mono text-xs text-[var(--mpa-color-text-muted)]">{label}</p>
      <p className="mt-1 font-semibold">{value ? "true" : "false"}</p>
    </div>
  );
}
