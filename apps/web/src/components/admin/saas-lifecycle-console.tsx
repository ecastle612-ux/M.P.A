import {
  COM_002_FLAGS,
  customerLifecyclePhase,
  hasLifecycleModuleAccess
} from "@mpa/shared";
import { listLifecycleSubscriptions } from "../../lib/saas-lifecycle/lifecycle-store";
import { listSaasLifecycleEventsFromDb } from "../../lib/saas-lifecycle/lifecycle-events-store";
import { listSaasWebhookEvents } from "../../lib/saas-stripe/purchase-store";
import { EnforceGraceButton } from "./enforce-grace-button";

export async function SaasLifecycleConsole() {
  const subs = listLifecycleSubscriptions();
  const onboardingEvents = await listSaasLifecycleEventsFromDb(40);
  const events = listSaasWebhookEvents().filter((e) =>
    [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
      "invoice.payment_action_required",
      "charge.refunded",
      "charge.dispute.created",
      "charge.dispute.closed"
    ].includes(e.eventType)
  );

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">Subscription Lifecycle</h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          COM-002 Slice E verification — Property Manager Professional / Business renewals, grace,
          failures, cancellation, and reactivation. Facility Operations and Complete remain Enterprise
          only (FO_READY false).
        </p>
      </header>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Flag label="sliceE_subscriptionLifecycle" value={COM_002_FLAGS.sliceE_subscriptionLifecycle} />
        <Flag label="sliceF_customerPortal" value={COM_002_FLAGS.sliceF_customerPortal} />
        <Flag label="foReady" value={COM_002_FLAGS.foReady} />
        <Flag label="subscriptions_tracked" value={subs.length > 0} />
      </section>

      <section className="flex items-center gap-3">
        <EnforceGraceButton />
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Runs the grace-expiration sweeper (Day 7 → expired / access off).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Subscriptions</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Count: {subs.length}</p>
        {subs.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No lifecycle rows in this instance.</p>
        ) : (
          <ul className="space-y-3">
            {subs.slice(0, 40).map((sub) => {
              const phase = customerLifecyclePhase(sub);
              return (
                <li
                  key={sub.id}
                  className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-3 text-sm"
                >
                  <p className="font-mono text-xs">
                    {sub.stripeSubscriptionId} · org={sub.organizationId ?? "—"}
                  </p>
                  <p>
                    status={sub.status} · phase={phase} · modules=
                    {String(hasLifecycleModuleAccess(sub))} · {sub.planTier}/{sub.billingCycle}
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-muted)]">
                    capacity=unit-volume (no seat/property limits) grace=
                    {sub.graceStartedAt ?? "—"} cancelAtPeriodEnd={String(sub.cancelAtPeriodEnd)}
                  </p>
                  <details className="text-xs text-[var(--mpa-color-text-muted)]">
                    <summary>Audit ({sub.audit.length}) · payments ({sub.paymentHistory.length})</summary>
                    <ul className="mt-1 space-y-1 font-mono">
                      {sub.audit.slice(-10).map((entry, index) => (
                        <li key={`${entry.at}-${index}`}>
                          {entry.at} {entry.from}→{entry.to} ({entry.reason})
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
        <h2 className="font-display text-lg font-semibold">Onboarding lifecycle events</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Events: {onboardingEvents.length}
        </p>
        {onboardingEvents.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No onboarding lifecycle rows yet.</p>
        ) : (
          <ul className="space-y-2 text-xs font-mono">
            {onboardingEvents.map((event) => (
              <li
                key={event.stripeEventId}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2"
              >
                {event.eventType} · org={event.organizationId ?? "—"} · {event.summary ?? ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Lifecycle webhook events</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Events: {events.length}</p>
        {events.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No lifecycle events yet.</p>
        ) : (
          <ul className="space-y-2 text-xs font-mono">
            {events.slice(0, 30).map((event) => (
              <li
                key={event.stripeEventId}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2"
              >
                {event.stripeEventId} · {event.eventType} · processed=
                {event.processedAt ? "yes" : "no"}
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
          <li>Successful renewal → active + renewal email</li>
          <li>Failed renewal → past_due + grace access + dunning emails</li>
          <li>Grace expiration → expired / modules off</li>
          <li>Recovery / reactivate → active + restored email</li>
          <li>Cancel at period end + reactivation</li>
          <li>Webhook replay / duplicates do not double-apply side effects</li>
          <li>Entitlements / limits follow plan tier automatically</li>
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
