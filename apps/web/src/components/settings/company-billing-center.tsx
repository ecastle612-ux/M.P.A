"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input, Modal } from "@mpa/ui";
import type { SaasBillingInterval, SaasPlanCode } from "../../lib/integrations/saas-billing/contracts";
import type { SaasOrgSubscriptionSnapshot } from "../../lib/saas/contracts";
import type { SaasUsageSnapshot } from "../../lib/saas/usage";
import {
  PLAN_DISPLAY,
  formatDate,
  formatUsd,
  founderMonthlySavings,
  intervalLabel,
  listPrice,
  planDisplay,
  planLabel,
  statusPresentation,
  trialDaysRemaining
} from "../../lib/saas/plan-display";

type Props = {
  initialSnapshot: SaasOrgSubscriptionSnapshot;
  usage: SaasUsageSnapshot;
  canManage: boolean;
  organizationName: string;
  notice?: string | null;
};

type ConfirmKind = "plan_change" | "leave_founder" | "cancel" | "reactivate" | null;

export function CompanyBillingCenter({
  initialSnapshot,
  usage,
  canManage,
  organizationName,
  notice
}: Props) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(notice ?? null);
  const [intervalFilter, setIntervalFilter] = useState<SaasBillingInterval>(
    snapshot.subscription?.billingInterval === "year" ? "year" : "month"
  );
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [invoiceSort, setInvoiceSort] = useState<"date_desc" | "date_asc" | "amount_desc">("date_desc");
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [pendingPlan, setPendingPlan] = useState<{
    planCode: SaasPlanCode;
    billingInterval: SaasBillingInterval;
  } | null>(null);
  const [founderConfirmText, setFounderConfirmText] = useState("");

  const subscription = snapshot.subscription;
  const status = statusPresentation(subscription?.status ?? null);
  const display = planDisplay(subscription?.planCode ?? null);
  const isFounder = subscription?.planCode === "founder";
  const trialDays = trialDaysRemaining(subscription?.trialEndsAt);
  const hasOpenSub = Boolean(
    subscription && ["trialing", "active", "past_due", "unpaid", "paused", "incomplete"].includes(subscription.status)
  );
  const nextAmount =
    snapshot.invoices.find((inv) => inv.status === "open")?.amountDue ??
    (subscription ? listPrice(subscription.planCode === "trial" ? "professional" : subscription.planCode, subscription.billingInterval) : null);

  const invoices = useMemo(() => {
    const q = invoiceQuery.trim().toLowerCase();
    let rows = [...snapshot.invoices];
    if (q) {
      rows = rows.filter(
        (inv) =>
          inv.externalInvoiceId.toLowerCase().includes(q) ||
          inv.status.toLowerCase().includes(q) ||
          String(inv.amountPaid).includes(q) ||
          String(inv.amountDue).includes(q)
      );
    }
    rows.sort((a, b) => {
      if (invoiceSort === "amount_desc") return b.amountPaid - a.amountPaid || b.amountDue - a.amountDue;
      const aTime = new Date(a.paidAt ?? a.periodEnd ?? a.periodStart ?? 0).getTime();
      const bTime = new Date(b.paidAt ?? b.periodEnd ?? b.periodStart ?? 0).getTime();
      return invoiceSort === "date_asc" ? aTime - bTime : bTime - aTime;
    });
    return rows;
  }, [snapshot.invoices, invoiceQuery, invoiceSort]);

  async function refreshSnapshot() {
    const res = await fetch("/api/saas", { cache: "no-store" });
    const json = (await res.json()) as { snapshot?: SaasOrgSubscriptionSnapshot; error?: { message?: string } };
    if (res.ok && json.snapshot) setSnapshot(json.snapshot);
  }

  async function postAction(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch("/api/saas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = (await res.json()) as {
      session?: { url?: string };
      portal?: { url?: string };
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(json.error?.message ?? "Billing request failed");
    return json;
  }

  function openPortal() {
    if (!canManage) return;
    startTransition(async () => {
      try {
        const json = await postAction({
          action: "portal",
          returnUrl: `${window.location.origin}/settings/billing`
        });
        if (json.portal?.url) {
          window.location.assign(json.portal.url);
          return;
        }
        throw new Error("Portal URL missing");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to open Customer Portal");
      }
    });
  }

  function startCheckout(planCode: SaasPlanCode, billingInterval: SaasBillingInterval, withTrial = false) {
    if (!canManage) return;
    startTransition(async () => {
      try {
        const json = await postAction({
          action: "checkout",
          planCode,
          billingInterval,
          withTrial,
          successUrl: `${window.location.origin}/settings/billing?saas=success`,
          cancelUrl: `${window.location.origin}/settings/billing?saas=cancel`
        });
        if (json.session?.url) {
          window.location.assign(json.session.url);
          return;
        }
        throw new Error("Checkout URL missing");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to start Checkout");
      }
    });
  }

  function requestPlanChange(planCode: SaasPlanCode, billingInterval: SaasBillingInterval) {
    if (!canManage) return;
    setPendingPlan({ planCode, billingInterval });
    if (isFounder && planCode !== "founder") {
      setFounderConfirmText("");
      setConfirmKind("leave_founder");
      return;
    }
    setConfirmKind("plan_change");
  }

  function confirmPendingAction() {
    if (confirmKind === "leave_founder" && founderConfirmText.trim().toUpperCase() !== "LEAVE FOUNDER") {
      setError('Type LEAVE FOUNDER to confirm permanently leaving founder pricing.');
      return;
    }
    const plan = pendingPlan;
    setConfirmKind(null);
    setFounderConfirmText("");

    if (confirmKind === "cancel" || confirmKind === "reactivate") {
      openPortal();
      return;
    }

    if (!plan) return;
    if (hasOpenSub) {
      // Existing subscriptions: plan changes / cancel flow through Stripe Customer Portal.
      openPortal();
      return;
    }
    if (plan.planCode === "founder") {
      setError("Founder pricing is invite-only. Contact M.P.A. support or your Master Admin.");
      return;
    }
    startCheckout(plan.planCode, plan.billingInterval, false);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            Billing
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
            Manage the M.P.A. subscription for {organizationName}. Payment details stay in Stripe — never stored in
            M.P.A.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {hasOpenSub ? (
              <Button onClick={() => openPortal()} disabled={pending}>
                {pending ? "Opening…" : "Manage in Stripe"}
              </Button>
            ) : (
              <Button
                onClick={() => startCheckout("professional", "month", true)}
                disabled={pending}
              >
                {pending ? "Starting…" : "Start trial"}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">View only — billing admins can make changes.</p>
        )}
      </header>

      {banner ? (
        <div className="rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-status-info-subtle)] px-4 py-3 text-sm text-[var(--mpa-color-text-primary)]">
          {banner}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => {
              setBanner(null);
              router.replace("/settings/billing");
            }}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      {/* Current plan — primary composition */}
      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
                {planLabel(subscription?.planCode ?? null)}
              </h2>
              <Badge variant={status.variant} showDot>
                {status.label}
              </Badge>
              {isFounder ? (
                <span className="rounded-md bg-[var(--mpa-color-brand-primary-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--mpa-color-brand-primary)]">
                  ★ Founder plan
                </span>
              ) : null}
              {subscription?.cancelAtPeriodEnd ? (
                <Badge variant="warning">Cancels at period end</Badge>
              ) : null}
            </div>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {display?.description ?? "Subscribe to unlock your organization workspace."}
            </p>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Billing cycle" value={intervalLabel(subscription?.billingInterval)} />
          <Fact label="Renewal date" value={formatDate(subscription?.currentPeriodEnd)} />
          <Fact
            label="Next invoice"
            value={nextAmount != null ? formatUsd(nextAmount, snapshot.invoices[0]?.currency ?? "usd") : "—"}
          />
          <Fact label="Billing contact" value={snapshot.customer?.email ?? "Set in Stripe Portal"} />
          <Fact
            label="Payment method"
            value="Managed in Stripe Customer Portal"
          />
          {subscription?.status === "trialing" ? (
            <Fact label="Trial days remaining" value={trialDays != null ? `${trialDays} day${trialDays === 1 ? "" : "s"}` : "—"} />
          ) : null}
        </dl>

        {isFounder ? (
          <div className="rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-muted)] px-4 py-3 text-sm">
            <p className="font-medium text-[var(--mpa-color-text-primary)]">Lifetime pricing</p>
            <p className="mt-1 text-[var(--mpa-color-text-secondary)]">
              Founder since {formatDate(subscription?.currentPeriodStart)}. Current savings vs Professional:{" "}
              <span className="font-medium text-[var(--mpa-color-text-primary)]">
                {formatUsd(founderMonthlySavings(subscription?.billingInterval))}
                {subscription?.billingInterval === "year" ? "/yr" : "/mo"}
              </span>
              .
            </p>
          </div>
        ) : null}

        {canManage && hasOpenSub ? (
          <div className="flex flex-wrap gap-2 border-t border-[var(--mpa-color-border-default)] pt-4">
            <Button variant="secondary" disabled={pending} onClick={() => openPortal()}>
              Update payment method
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setConfirmKind("reactivate");
                setPendingPlan(null);
              }}
            >
              Reactivate / resume
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setConfirmKind("cancel");
                setPendingPlan(null);
              }}
            >
              Cancel subscription
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Plans */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">Plans</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Compare features, then confirm price and billing impact before changing.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-[var(--mpa-color-border-default)] p-1">
            {(["month", "year"] as SaasBillingInterval[]).map((iv) => (
              <button
                key={iv}
                type="button"
                onClick={() => setIntervalFilter(iv)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  intervalFilter === iv
                    ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)]"
                    : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
                }`}
              >
                {iv === "month" ? "Monthly" : "Annual"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_DISPLAY.map((plan) => {
            const price = intervalFilter === "year" ? plan.listPriceAnnual : plan.listPriceMonthly;
            const current =
              subscription?.planCode === plan.planCode &&
              (subscription.billingInterval ?? "month") === intervalFilter;
            return (
              <Card key={plan.planCode} className="flex h-full flex-col space-y-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">
                      {plan.name}
                    </h3>
                    {plan.founderProtected ? (
                      <span className="text-xs font-semibold text-[var(--mpa-color-brand-primary)]">★</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{plan.description}</p>
                </div>
                <p className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
                  {formatUsd(price)}
                  <span className="text-sm font-normal text-[var(--mpa-color-text-secondary)]">
                    /{intervalFilter === "year" ? "yr" : "mo"}
                  </span>
                </p>
                <ul className="grow space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  {plan.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                {canManage ? (
                  current ? (
                    <Button variant="secondary" disabled>
                      Current plan
                    </Button>
                  ) : plan.planCode === "founder" && !isFounder ? (
                    <Button variant="secondary" disabled>
                      Invite only
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      disabled={pending}
                      onClick={() => requestPlanChange(plan.planCode, intervalFilter)}
                    >
                      {hasOpenSub ? "Change plan" : "Subscribe"}
                    </Button>
                  )
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Payment + portal */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Payment method
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Primary card, billing address, brand, last four, and expiration are stored only by Stripe. Use the Customer
            Portal to view or update them.
          </p>
          {canManage ? (
            <Button variant="secondary" disabled={pending || !snapshot.customer} onClick={() => openPortal()}>
              Open payment settings
            </Button>
          ) : null}
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Customer Portal
          </h2>
          <ul className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            <li>· Update payment method</li>
            <li>· Download receipts</li>
            <li>· Manage billing details & tax</li>
            <li>· Subscription management</li>
          </ul>
          <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
            Return URL preserves your M.P.A. session at Settings → Billing.
          </p>
          {canManage ? (
            <Button disabled={pending || !snapshot.customer} onClick={() => openPortal()}>
              Open Stripe Customer Portal
            </Button>
          ) : null}
        </Card>
      </div>

      {/* Invoices */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">Invoices</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">History from your M.P.A. SaaS subscription.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              placeholder="Search invoices"
              aria-label="Search invoices"
              className="sm:w-48"
            />
            <select
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
              value={invoiceSort}
              onChange={(e) => setInvoiceSort(e.target.value as typeof invoiceSort)}
              aria-label="Sort invoices"
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="amount_desc">Amount high → low</option>
            </select>
          </div>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--mpa-color-border-default)] text-[var(--mpa-color-text-tertiary)]">
                  <th className="py-2 pr-3 font-medium">Invoice</th>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="py-3 pr-3 font-mono text-xs">{inv.externalInvoiceId}</td>
                    <td className="py-3 pr-3">{formatDate(inv.paidAt ?? inv.periodEnd ?? inv.periodStart)}</td>
                    <td className="py-3 pr-3">
                      {formatUsd(inv.status === "paid" ? inv.amountPaid : inv.amountDue, inv.currency)}
                    </td>
                    <td className="py-3 pr-3 capitalize">{inv.status}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {inv.invoicePdf ? (
                          <a
                            className="text-[var(--mpa-color-brand-primary)] underline"
                            href={inv.invoicePdf}
                            target="_blank"
                            rel="noreferrer"
                          >
                            PDF
                          </a>
                        ) : null}
                        {inv.hostedInvoiceUrl ? (
                          <a
                            className="text-[var(--mpa-color-brand-primary)] underline"
                            href={inv.hostedInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Stripe invoice
                          </a>
                        ) : null}
                        {!inv.invoicePdf && !inv.hostedInvoiceUrl ? (
                          <span className="text-[var(--mpa-color-text-tertiary)]">—</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Button variant="secondary" disabled={pending} onClick={() => void refreshSnapshot()}>
          Refresh invoices
        </Button>
      </Card>

      {/* Usage */}
      <Card className="space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">Usage</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{usage.planLimitsNote}</p>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Organizations" value={String(usage.organizations)} />
          <Fact label="Properties" value={String(usage.properties)} />
          <Fact label="Units" value={String(usage.units)} />
          <Fact label="Residents" value={String(usage.residents)} />
          <Fact label="Storage" value={usage.storage} />
          <Fact label="AI usage" value={usage.aiUsage} />
          <Fact label="API usage" value={usage.apiUsage} />
          <Fact label="Plan limits" value="Not enforced yet" />
        </dl>
      </Card>

      <ConfirmModals
        kind={confirmKind}
        pendingPlan={pendingPlan}
        founderConfirmText={founderConfirmText}
        setFounderConfirmText={setFounderConfirmText}
        onClose={() => {
          setConfirmKind(null);
          setPendingPlan(null);
          setFounderConfirmText("");
        }}
        onConfirm={confirmPendingAction}
        pending={pending}
        isFounderLeaving={confirmKind === "leave_founder"}
        hasOpenSub={hasOpenSub}
      />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-tertiary)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--mpa-color-text-primary)]">{value}</dd>
    </div>
  );
}

function ConfirmModals({
  kind,
  pendingPlan,
  founderConfirmText,
  setFounderConfirmText,
  onClose,
  onConfirm,
  pending,
  isFounderLeaving,
  hasOpenSub
}: {
  kind: ConfirmKind;
  pendingPlan: { planCode: SaasPlanCode; billingInterval: SaasBillingInterval } | null;
  founderConfirmText: string;
  setFounderConfirmText: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
  isFounderLeaving: boolean;
  hasOpenSub: boolean;
}) {
  if (!kind) return null;

  if (kind === "cancel") {
    return (
      <Modal
        open
        onClose={onClose}
        title="Cancel subscription"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Keep subscription
            </Button>
            <Button onClick={onConfirm} disabled={pending}>
              Continue to Stripe
            </Button>
          </div>
        }
      >
        <p>
          Cancellation is completed in the Stripe Customer Portal. Access typically continues until the end of the
          current billing period.
        </p>
      </Modal>
    );
  }

  if (kind === "reactivate") {
    return (
      <Modal
        open
        onClose={onClose}
        title="Reactivate subscription"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onConfirm} disabled={pending}>
              Continue to Stripe
            </Button>
          </div>
        }
      >
        <p>Use the Customer Portal to resume a canceled or ending subscription, or update billing so access continues.</p>
      </Modal>
    );
  }

  const price =
    pendingPlan != null
      ? listPrice(pendingPlan.planCode === "founder" ? "founder" : pendingPlan.planCode, pendingPlan.billingInterval)
      : null;

  return (
    <Modal
      open
      onClose={onClose}
      title={isFounderLeaving ? "Leave Founder pricing?" : "Confirm plan change"}
      {...(isFounderLeaving ? { className: "max-w-xl" } : {})}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={
              pending ||
              (isFounderLeaving && founderConfirmText.trim().toUpperCase() !== "LEAVE FOUNDER")
            }
          >
            {hasOpenSub ? "Continue to Stripe" : "Continue to Checkout"}
          </Button>
        </div>
      }
    >
      {isFounderLeaving ? (
        <div className="space-y-3 rounded-lg border border-[var(--mpa-color-status-danger)]/40 bg-[var(--mpa-color-status-danger-subtle)] p-3">
          <p className="font-semibold text-[var(--mpa-color-status-danger)]">High-visibility warning</p>
          <p>
            Changing away from Founder may permanently remove lifetime Founder pricing. This cannot be undone from
            self-serve billing.
          </p>
          <label className="block text-sm">
            Type <span className="font-mono font-semibold">LEAVE FOUNDER</span> to confirm
            <Input
              className="mt-1"
              value={founderConfirmText}
              onChange={(e) => setFounderConfirmText(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
      ) : null}
      <dl className="mt-3 space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--mpa-color-text-secondary)]">Plan</dt>
          <dd className="font-medium">{pendingPlan ? planLabel(pendingPlan.planCode) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--mpa-color-text-secondary)]">Price</dt>
          <dd className="font-medium">
            {price != null ? formatUsd(price) : "—"}
            {pendingPlan ? ` / ${pendingPlan.billingInterval === "year" ? "year" : "month"}` : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--mpa-color-text-secondary)]">Effective date</dt>
          <dd className="font-medium">{hasOpenSub ? "Per Stripe (often immediate or period end)" : "On Checkout completion"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--mpa-color-text-secondary)]">Proration</dt>
          <dd className="font-medium text-right">
            {hasOpenSub ? "Stripe calculates any proration in the Portal" : "None — new subscription"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--mpa-color-text-secondary)]">Billing impact</dt>
          <dd className="max-w-[14rem] text-right font-medium">
            {hasOpenSub
              ? "Your next invoice reflects the selected plan after Portal confirmation"
              : "First invoice charged when Checkout succeeds"}
          </dd>
        </div>
      </dl>
    </Modal>
  );
}
