import Link from "next/link";
import type { ReactNode } from "react";
import { Card, EmptyState } from "@mpa/ui";

export function OwnerSectionHeader({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
        {title}
      </h1>
      <p className="max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
    </div>
  );
}

export function OwnerFoundationNote({ children }: { children: ReactNode }) {
  return (
    <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
      {children}
    </Card>
  );
}

export function OwnerListEmpty({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return <EmptyState title={title} description={description} />;
}

export function OwnerSimpleLinkList({
  items
}: {
  items: Array<{ href: string; title: string; description: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 transition-colors hover:border-[var(--mpa-color-border-strong)]"
        >
          <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{item.title}</p>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
