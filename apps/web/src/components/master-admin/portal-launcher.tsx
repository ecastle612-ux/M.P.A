"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";
import type { MasterAdminPortal } from "../../lib/master-admin/contracts";
import {
  PORTAL_LAUNCHER_GROUPS,
  type PortalLauncherCard
} from "../../lib/master-admin/portal-launcher-catalog";

export function PortalLauncher({
  title = "Portal Launcher",
  description = "One-click access to every role and dashboard. View As and Test Mode use existing Master Admin tooling — production permissions stay unchanged."
}: {
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function launchTestMode(card: PortalLauncherCard) {
    if (!card.testModePortal) {
      router.push(card.openHref);
      return;
    }
    setError(null);
    setPendingId(card.id);
    try {
      const response = await fetch("/api/master-admin/portal-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ portal: card.testModePortal as MasterAdminPortal })
      });
      const payload = (await response.json().catch(() => null)) as
        | { redirectTo?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to launch Test Mode.");
      }
      router.push(payload?.redirectTo ?? card.openHref);
      router.refresh();
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : "Unable to launch Test Mode.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8" data-ux016="portal-launcher">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-tertiary)]">
          Master Admin
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
          {title}
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      </header>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}

      <div className="space-y-8">
        {PORTAL_LAUNCHER_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`launcher-${group.id}`} className="space-y-3">
            <h2
              id={`launcher-${group.id}`}
              className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
            >
              {group.label}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.cards.map((card) => (
                <article
                  key={card.id}
                  className="flex h-full flex-col gap-3 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)] shadow-[var(--mpa-shadow-xs)]"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                      {card.title}
                    </h3>
                    <p className="text-sm text-[var(--mpa-color-text-secondary)]">{card.description}</p>
                    {card.testModePortal ? (
                      <p className="text-xs font-medium text-[var(--mpa-color-brand-primary)]">
                        Test Mode supported
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
                        {card.testModeFallbackLabel}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link href={card.openHref}>
                      <Button type="button" size="sm">
                        Open Portal
                      </Button>
                    </Link>
                    <Link href={card.viewAsHref}>
                      <Button type="button" size="sm" variant="secondary">
                        View As
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pendingId === card.id}
                      onClick={() => void launchTestMode(card)}
                      title={
                        card.testModePortal
                          ? "Launch in portal Test Mode"
                          : card.testModeFallbackLabel
                      }
                    >
                      {pendingId === card.id ? "Launching…" : "Launch in Test Mode"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
