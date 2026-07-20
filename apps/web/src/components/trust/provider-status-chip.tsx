"use client";

import Link from "next/link";
import { Badge } from "@mpa/ui";
import {
  getProviderStatusCenter,
  type ProviderConnectionStatus
} from "../../lib/integrations/provider-status";

function toneForStatus(status: ProviderConnectionStatus): "success" | "warning" | "danger" | "info" {
  if (status === "production_ready") return "success";
  if (status === "connected") return "info";
  if (status === "sandbox") return "warning";
  return "danger";
}

/**
 * UX-003 — never silently fail on provider mode; surface meaningful status.
 */
export function ProviderStatusChip({
  providerId,
  compact = true
}: {
  providerId: string;
  compact?: boolean;
}) {
  const item = getProviderStatusCenter().find((entry) => entry.id === providerId);
  if (!item) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={toneForStatus(item.status)}>
        {item.name}: {item.statusLabel}
      </Badge>
      {!compact ? (
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.guidance}</p>
      ) : null}
      <Link
        href="/settings/integrations"
        className="text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
      >
        Provider settings
      </Link>
    </div>
  );
}

export function ProviderStatusBanner({ providerIds }: { providerIds: string[] }) {
  const items = getProviderStatusCenter().filter((entry) => providerIds.includes(entry.id));
  const attention = items.filter(
    (entry) =>
      entry.status === "disabled" ||
      entry.status === "configuration_required" ||
      entry.status === "sandbox"
  );
  if (attention.length === 0) return null;

  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
      role="status"
    >
      <p className="font-medium">Provider notice</p>
      <ul className="mt-1 space-y-1 text-xs">
        {attention.map((entry) => (
          <li key={entry.id}>
            <span className="font-medium">{entry.name}:</span> {entry.statusLabel} — {entry.guidance}
          </li>
        ))}
      </ul>
      <Link
        href="/settings/integrations"
        className="mt-2 inline-block text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
      >
        Review integrations
      </Link>
    </div>
  );
}
