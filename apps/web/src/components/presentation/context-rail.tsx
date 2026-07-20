import type { ReactNode } from "react";
import { Card } from "@mpa/ui";

export function ContextRail({
  children,
  title = "Context",
  className = ""
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <aside
      className={`mpa-workspace-rail space-y-3 ${className}`.trim()}
      aria-label={title}
    >
      {children}
    </aside>
  );
}

export function ContextRailSection({
  title,
  children,
  emptyMessage,
  variant = "elevated"
}: {
  title: string;
  children?: ReactNode;
  emptyMessage?: string;
  variant?: "elevated" | "muted" | "plain";
}) {
  const hasContent = children !== undefined && children !== null && children !== false;

  if (variant === "plain") {
    return (
      <div className="space-y-1.5 border-b border-[var(--mpa-color-border-subtle)] pb-3 last:border-b-0 last:pb-0">
        <h3 className="mpa-section-label">{title}</h3>
        {hasContent ? (
          <div className="text-sm text-[var(--mpa-color-text-secondary)]">{children}</div>
        ) : emptyMessage ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">{emptyMessage}</p>
        ) : null}
      </div>
    );
  }

  return (
    <Card variant={variant === "muted" ? "default" : "elevated"} className="space-y-2">
      <h3 className="mpa-section-title text-[0.9375rem]">{title}</h3>
      {hasContent ? (
        <div className="text-sm text-[var(--mpa-color-text-secondary)]">{children}</div>
      ) : emptyMessage ? (
        <p className="text-sm text-[var(--mpa-color-text-muted)]">{emptyMessage}</p>
      ) : null}
    </Card>
  );
}
