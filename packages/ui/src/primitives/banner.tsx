import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type BannerTone = "info" | "success" | "warning" | "danger";

export type BannerProps = HTMLAttributes<HTMLDivElement> & {
  tone?: BannerTone;
  title?: ReactNode;
  children?: ReactNode;
};

/**
 * UX-012 Slice B — Banner (persistent status strip; Toast remains transient).
 */
export function Banner({
  className,
  tone = "info",
  title,
  children,
  ...props
}: BannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--mpa-radius-md)] border px-[var(--mpa-space-4)] py-[var(--mpa-space-3)]",
        tone === "info" &&
          "border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-primary)]",
        tone === "success" &&
          "border-[var(--mpa-color-status-success)]/30 bg-[var(--mpa-color-status-success)]/10 text-[var(--mpa-color-text-primary)]",
        tone === "warning" &&
          "border-[var(--mpa-color-status-warning)]/30 bg-[var(--mpa-color-status-warning)]/10 text-[var(--mpa-color-text-primary)]",
        tone === "danger" &&
          "border-[var(--mpa-color-status-danger)]/30 bg-[var(--mpa-color-status-danger)]/10 text-[var(--mpa-color-text-primary)]",
        className
      )}
      {...props}
    >
      {title ? (
        <p className="mpa-text-caption font-[var(--mpa-font-weight-medium)]">{title}</p>
      ) : null}
      {children ? (
        <div className={cn("mpa-text-caption text-[var(--mpa-color-text-secondary)]", title && "mt-[var(--mpa-space-1)]")}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
