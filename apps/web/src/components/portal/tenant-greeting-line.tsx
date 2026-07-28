"use client";

import { useSyncExternalStore } from "react";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function subscribe() {
  return () => undefined;
}

function getClientSnapshot() {
  return new Date().getHours();
}

function getServerSnapshot() {
  return 12;
}

export function TenantGreetingLine({
  firstName,
  propertyName,
  unitNumber,
  hasLinkedTenant
}: {
  firstName: string;
  propertyName: string | null;
  unitNumber: string | null;
  hasLinkedTenant: boolean;
}) {
  const hour = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const greeting = greetingForHour(hour);
  const name = firstName.trim() || "there";
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());

  const property = propertyName?.trim() || null;
  const unit = unitNumber?.trim() || null;
  const hasHomeContext = Boolean(property || unit);

  return (
    <header className="space-y-2">
      <div className="space-y-1">
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-[var(--mpa-color-text-primary)] sm:text-3xl">
          {greeting}, {name}
        </h1>
        {hasLinkedTenant && hasHomeContext ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Welcome home.</p>
        ) : null}
      </div>

      {hasLinkedTenant && hasHomeContext ? (
        <div className="space-y-0.5 pt-1">
          {property ? (
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{property}</p>
          ) : null}
          {unit ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">Unit {unit}</p>
          ) : null}
          <p className="pt-1 text-xs text-[var(--mpa-color-text-secondary)]">{dateLabel}</p>
        </div>
      ) : hasLinkedTenant ? (
        <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/50 px-4 py-3">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Your home details are on the way</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
            We&apos;ll show your property and unit here once they&apos;re linked. You can still use rent,
            messages, and maintenance below.
          </p>
          <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">{dateLabel}</p>
        </div>
      ) : (
        <div className="rounded-[var(--mpa-radius-lg)] border border-amber-200/80 bg-amber-50/90 px-4 py-3">
          <p className="text-sm font-medium text-amber-950">Let&apos;s finish setting up your home</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
            Accept your invitation or ask your property manager to link your resident profile. Then this
            screen becomes your personal home base.
          </p>
          <p className="mt-2 text-xs text-amber-900/70">{dateLabel}</p>
        </div>
      )}
    </header>
  );
}
