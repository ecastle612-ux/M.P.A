"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { SaasBillingInterval } from "../../lib/integrations/saas-billing/contracts";
import { isPublicSelfServePlan, type AcqSelfServePlan } from "../../lib/acquire/decisions";
import { buildPublicPlanCards, formatListPrice } from "../../lib/acquire/catalog";
import {
  moduleSelectionLabel,
  parseAcqModuleSelection,
  type AcqModuleSelection
} from "../../lib/acquire/modules";

export function CheckoutIntentForm({
  plan,
  interval,
  modules: modulesProp
}: {
  plan: string;
  interval: SaasBillingInterval;
  modules?: string | null;
}) {
  const modules = parseAcqModuleSelection(modulesProp ?? undefined);
  const selfServe = isPublicSelfServePlan(plan);
  const cards = useMemo(() => buildPublicPlanCards(interval, modules), [interval, modules]);
  const card = cards.find((item) => item.planCode === plan);
  const [companyName, setCompanyName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!modules) {
    return (
      <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-6">
        <h1 className="font-display text-2xl font-semibold">Choose modules first</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Select Property Operations, Facility Operations, or both before starting Checkout.
        </p>
        <Link
          href="/modules"
          className="mt-6 inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)]"
        >
          Choose modules
        </Link>
      </div>
    );
  }

  if (!selfServe || !card) {
    return (
      <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-6">
        <h1 className="font-display text-2xl font-semibold">Sales-assisted plan</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Enterprise and special grants are not available through self-serve Checkout.
        </p>
        <Link
          href="/contact-sales"
          className="mt-6 inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)]"
        >
          Contact sales
        </Link>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!companyName.trim() || !workEmail.includes("@")) {
      setError("Company name and a valid work email are required.");
      return;
    }

    const selection = modules as AcqModuleSelection;
    const intent = {
      plan: plan as AcqSelfServePlan,
      interval,
      modules: selection,
      companyName: companyName.trim(),
      workEmail: workEmail.trim().toLowerCase(),
      capturedAt: new Date().toISOString()
    };
    try {
      window.sessionStorage.setItem("mpa.acq.checkoutIntent", JSON.stringify(intent));
      window.sessionStorage.setItem("mpa.acq.moduleSelection", selection);
    } catch {
      // Non-fatal
    }

    setPending(true);
    try {
      const origin = window.location.origin;
      const response = await fetch("/api/acquire/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: plan,
          billingInterval: interval,
          companyName: intent.companyName,
          workEmail: intent.workEmail,
          successUrl: `${origin}/acquire/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/acquire/canceled`
        })
      });
      const payload = (await response.json()) as {
        session?: { url?: string; sessionId?: string };
        error?: string;
        code?: string;
      };
      if (!response.ok) {
        if (payload.code === "SUBSCRIPTION_EXISTS") {
          window.location.href = "/acquire/error?reason=subscription_exists";
          return;
        }
        setError(payload.error ?? "Unable to start Checkout");
        setPending(false);
        return;
      }
      if (payload.session?.url) {
        window.location.href = payload.session.url;
        return;
      }
      setError("Checkout URL missing");
      setPending(false);
    } catch {
      setError("Network error starting Checkout. Please try again.");
      setPending(false);
    }
  }

  const amount = interval === "year" ? card.listPriceAnnual : card.listPriceMonthly;

  return (
    <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-6">
      <h1 className="font-display text-2xl font-semibold">Continue to Checkout</h1>
      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
        {card.name} · {moduleSelectionLabel(modules)} · {formatListPrice(amount, interval)} ·{" "}
        {interval === "year" ? "Annual" : "Monthly"}
      </p>
      <form className="mt-8 space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
        <div>
          <label htmlFor="companyName" className="mpa-text-caption font-medium text-[var(--mpa-color-text-secondary)]">
            Company name <span className="text-[var(--mpa-color-feedback-error)]">*</span>
          </label>
          <input
            id="companyName"
            name="companyName"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="mt-1 h-11 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-interactive-focus-ring)]"
          />
        </div>
        <div>
          <label htmlFor="workEmail" className="mpa-text-caption font-medium text-[var(--mpa-color-text-secondary)]">
            Work email <span className="text-[var(--mpa-color-feedback-error)]">*</span>
          </label>
          <input
            id="workEmail"
            name="workEmail"
            type="email"
            required
            value={workEmail}
            onChange={(event) => setWorkEmail(event.target.value)}
            className="mt-1 h-11 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-interactive-focus-ring)]"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-[var(--mpa-color-feedback-error)]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 min-h-11 w-full items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Starting Checkout…" : "Continue to Stripe Checkout"}
        </button>
      </form>
      <p className="mt-4 text-xs text-[var(--mpa-color-text-muted)]">
        Organization provisioning happens only after successful payment. You will not be signed in automatically.
      </p>
      <p className="mt-2 text-xs text-[var(--mpa-color-text-muted)]">
        <Link href={`/pricing?modules=${modules}`} className="underline underline-offset-4">
          Back to pricing
        </Link>
      </p>
    </div>
  );
}
