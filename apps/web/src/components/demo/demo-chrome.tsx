"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  DEMO_ANALYTICS_EVENTS,
  demoComparePlatformsHref,
  demoConversionHref,
  demoConversionLabel,
  demoHonestyBanner,
  demoHref,
  demoNavFor,
  personasForDemoProduct,
  primaryDemoConversionCta,
  toDemoPersonaLabel,
  toDemoProductLabel,
  type DemoPersona,
  type DemoProductId,
  type DemoSession
} from "@mpa/shared";

export function DemoChrome({
  session,
  surface,
  children
}: {
  session: DemoSession;
  surface: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [persona, setPersona] = useState<DemoPersona>(session.persona);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const product = session.product as DemoProductId;
  const nav = demoNavFor(product, persona);
  const honesty = demoHonestyBanner(product);
  const primaryCta = primaryDemoConversionCta(product);

  // Refresh durable cookies / idle clock on this isolate after hydration.
  useEffect(() => {
    try {
      sessionStorage.removeItem(`mpa_demo_boot:${product}:${surface}`);
    } catch {
      // ignore storage failures
    }
    void fetch(`/api/demo/session?id=${encodeURIComponent(session.id)}`, {
      method: "GET",
      credentials: "same-origin"
    }).catch(() => undefined);
  }, [session.id, product, surface]);

  async function track(event: string, meta?: Record<string, string>) {
    await fetch("/api/demo/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, event, meta })
    }).catch(() => undefined);
  }

  async function onPersonaChange(next: DemoPersona) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/demo/persona", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, persona: next })
    });
    setBusy(false);
    if (!res.ok) {
      setMessage("Could not switch persona.");
      return;
    }
    setPersona(next);
    await track(DEMO_ANALYTICS_EVENTS.role_switched, { persona: next });
    const home = demoNavFor(product, next)[0]?.surface ?? "mission-control";
    router.push(demoHref(product, home));
    router.refresh();
  }

  async function onReset() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/demo/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id })
    });
    setBusy(false);
    if (!res.ok) {
      setMessage("Reset cooling down — try again shortly.");
      return;
    }
    await track(DEMO_ANALYTICS_EVENTS.reset);
    setMessage("Demo reset — temporary changes cleared.");
    router.refresh();
  }

  async function onCta(cta: "start_subscription" | "request_enterprise" | "schedule_consultation") {
    await track(DEMO_ANALYTICS_EVENTS.cta_clicked, { cta });
    if (cta === "start_subscription") {
      await track(DEMO_ANALYTICS_EVENTS.convert_to_subscription, { product });
    }
    router.push(demoConversionHref(product, cta, session.id));
  }

  return (
    <div className="min-h-screen bg-[var(--mpa-color-bg-app)] text-[var(--mpa-color-text-primary)]">
      <div className="sticky top-0 z-40 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
              Demo Environment
            </p>
            <p className="truncate text-sm text-[var(--mpa-color-text-secondary)]">
              {toDemoProductLabel(product)} · Changes are temporary and automatically reset.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-[var(--mpa-color-text-secondary)]">
              <span className="whitespace-nowrap">View as</span>
              <select
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-1.5 text-sm"
                value={persona}
                disabled={busy}
                onChange={(event) => void onPersonaChange(event.target.value as DemoPersona)}
                aria-label="Demonstration roles — not your real team"
              >
                {personasForDemoProduct(product).map((item) => (
                  <option key={item} value={item}>
                    {toDemoPersonaLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onReset()}
              className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-1.5 text-sm font-medium"
            >
              Reset demo
            </button>
            <button
              type="button"
              onClick={() => void onCta(primaryCta)}
              className="rounded-md bg-[var(--mpa-color-brand-primary)] px-3 py-1.5 text-sm font-semibold text-white"
            >
              {demoConversionLabel(product, primaryCta)}
            </button>
            <button
              type="button"
              onClick={() => void onCta("schedule_consultation")}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-text-secondary)]"
            >
              Schedule Consultation
            </button>
            <Link href="/demo" className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">
              All demos
            </Link>
          </div>
        </div>
        {honesty ? (
          <p className="border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-4 py-1.5 text-xs text-[var(--mpa-color-text-secondary)] md:px-6">
            {honesty}
          </p>
        ) : null}
        {message ? (
          <p className="border-t border-[var(--mpa-color-border-subtle)] px-4 py-1.5 text-xs text-[var(--mpa-color-text-secondary)] md:px-6">
            {message}
          </p>
        ) : null}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:gap-6 md:px-6">
        <div className="md:hidden">
          <label className="block space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
            <span className="font-semibold uppercase tracking-wide">Demo modules</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm"
              value={surface}
              aria-label="Demo modules"
              onChange={(event) => {
                const next = event.target.value;
                void track(DEMO_ANALYTICS_EVENTS.module_visited, { moduleId: next });
                router.push(demoHref(product, next));
              }}
            >
              {nav.map((item) => (
                <option key={item.id} value={item.surface}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <aside className="hidden w-56 shrink-0 md:block">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
            Demonstration roles — not your real team
          </p>
          <nav aria-label="Demo modules" className="space-y-1">
            {nav.map((item) => {
              const active = item.surface === surface;
              return (
                <Link
                  key={item.id}
                  href={demoHref(product, item.surface)}
                  onClick={() =>
                    void track(DEMO_ANALYTICS_EVENTS.module_visited, { moduleId: item.id })
                  }
                  className={`block rounded-md px-3 py-2 text-sm ${
                    active
                      ? "bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] font-semibold text-[var(--mpa-color-brand-primary)]"
                      : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 space-y-8">
          {children}
          <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h2 className="font-display text-lg font-semibold">
              Ready to run your operation with M.P.A.?
            </h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              You&apos;ve been exploring a read-only demo with synthetic data. Get Started begins
              plan evaluation — separate from this demo.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void onCta(primaryCta)}
                className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                Get Started
              </button>
              <Link
                href={demoComparePlatformsHref()}
                className="rounded-md border border-[var(--mpa-color-border-default)] px-4 py-2 text-sm font-medium"
              >
                Compare platforms
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
