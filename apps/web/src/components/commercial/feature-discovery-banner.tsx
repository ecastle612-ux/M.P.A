"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { FeatureDiscoverySnapshot } from "../../lib/commercial/discovery-types";

type Props = {
  organizationId: string;
  canManage?: boolean;
};

export function FeatureDiscoveryBanner({ organizationId, canManage = true }: Props) {
  const [discoveries, setDiscoveries] = useState<FeatureDiscoverySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [impressed, setImpressed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/organizations/${organizationId}/discoveries`, {
      cache: "no-store"
    });
    const payload = (await response.json()) as {
      discoveries?: FeatureDiscoverySnapshot;
      message?: string;
      error?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to load discoveries");
      return;
    }
    setDiscoveries(payload.discoveries ?? null);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const primary = discoveries?.primary;
    if (!primary || impressed || !canManage) return;
    setImpressed(true);
    void fetch(`/api/organizations/${organizationId}/discoveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "impress", discoveryKey: primary.key })
    }).catch(() => undefined);
  }, [discoveries?.primary, impressed, canManage, organizationId]);

  async function act(action: "dismiss" | "snooze" | "accept") {
    const primary = discoveries?.primary;
    if (!primary) return;
    setLoading(true);
    const response = await fetch(`/api/organizations/${organizationId}/discoveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, discoveryKey: primary.key })
    });
    const payload = (await response.json()) as {
      discoveries?: FeatureDiscoverySnapshot;
      message?: string;
      error?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Update failed");
      return;
    }
    setDiscoveries(payload.discoveries ?? null);
    setImpressed(false);
  }

  const primary = discoveries?.primary;
  if (!primary && !error) return null;

  return (
    <Card className="space-y-3 border-[var(--mpa-color-border-default)]">
      {error ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{error}</p>
      ) : null}
      {primary ? (
        <>
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
              Next step
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
              {primary.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{primary.body}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={primary.ctaHref}
              className="inline-flex h-10 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-action-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-inverse)]"
            >
              {primary.ctaLabel}
            </Link>
            {canManage ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void act("accept")}
                >
                  Got it
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void act("snooze")}
                >
                  Snooze
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void act("dismiss")}
                >
                  Dismiss
                </Button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </Card>
  );
}
