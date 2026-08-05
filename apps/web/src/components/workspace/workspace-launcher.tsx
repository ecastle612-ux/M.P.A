"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";
import type { MasterAdminPortal } from "../../lib/master-admin/contracts";
import type {
  PortalLauncherCard,
  PortalLauncherGroup
} from "../../lib/master-admin/portal-launcher-catalog";

/**
 * ARCH-001 / NAV-001 / MAC-002 — reusable Workspace Launcher.
 * Test Mode is shown only when a portal-test API mapping exists (no fake actions).
 */
export function WorkspaceLauncher({
  groups,
  title = "Workspace Launcher",
  description = "Open surfaces, View As real users, or launch Test Mode — without leaving this hub.",
  embedded = false,
  sectionId = "workspace-launcher",
  testModeEndpoint = "/api/master-admin/portal-test"
}: {
  groups: readonly PortalLauncherGroup[];
  title?: string;
  description?: string;
  embedded?: boolean;
  sectionId?: string;
  testModeEndpoint?: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function launchTestMode(card: PortalLauncherCard) {
    if (!card.testModePortal) return;
    setError(null);
    setPendingId(card.id);
    try {
      const response = await fetch(testModeEndpoint, {
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

  const HeadingTag = embedded ? "h2" : "h1";

  return (
    <div
      id={sectionId}
      className="space-y-8 scroll-mt-24"
      data-arch001="workspace-launcher"
      data-mac002="workspace-launcher"
    >
      <header className="space-y-2">
        {!embedded ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-tertiary)]">
            Workspace
          </p>
        ) : null}
        <HeadingTag
          className={
            embedded
              ? "font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
              : "font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl"
          }
        >
          {title}
        </HeadingTag>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      </header>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-status-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`${sectionId}-${group.id}`} className="space-y-3">
            <h3
              id={`${sectionId}-${group.id}`}
              className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]"
            >
              {group.label}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.cards.map((card) => (
                <article
                  key={card.id}
                  className="flex h-full flex-col gap-3 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)] shadow-[var(--mpa-shadow-xs)]"
                >
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                      {card.title}
                    </h4>
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
                        Open
                      </Button>
                    </Link>
                    <Link href={card.viewAsHref}>
                      <Button type="button" size="sm" variant="secondary">
                        View As
                      </Button>
                    </Link>
                    {card.testModePortal ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pendingId === card.id}
                        onClick={() => void launchTestMode(card)}
                        title="Launch simulated portal Test Mode"
                      >
                        {pendingId === card.id ? "Launching…" : "Test Mode"}
                      </Button>
                    ) : null}
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
