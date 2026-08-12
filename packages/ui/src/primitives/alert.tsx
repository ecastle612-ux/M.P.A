import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type AlertVariant = "info" | "success" | "warning" | "danger" | "neutral";

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
};

const variantClasses: Record<AlertVariant, string> = {
  info: "border-[var(--mpa-color-status-info,#1D6AA5)]/30 bg-[var(--mpa-color-status-info-subtle,#E5F1FA)] text-[var(--mpa-color-status-info,#1D6AA5)]",
  success:
    "border-[var(--mpa-color-status-success,#0E7A57)]/30 bg-[var(--mpa-color-status-success-subtle,#E3F5EE)] text-[var(--mpa-color-status-success,#0E7A57)]",
  warning:
    "border-[var(--mpa-color-status-warning,#B45309)]/30 bg-[var(--mpa-color-status-warning-subtle,#FEF3C7)] text-[var(--mpa-color-status-warning,#B45309)]",
  danger:
    "border-[var(--mpa-color-status-danger,#C0392B)]/30 bg-[var(--mpa-color-status-danger-subtle,#FCE8E6)] text-[var(--mpa-color-status-danger,#C0392B)]",
  neutral:
    "border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted,#EEF0F3)] text-[var(--mpa-color-text-primary)]"
};

/**
 * Canopy status callout (PPS1-016). Prefer this over emerald/amber/red Tailwind boxes.
 */
export function Alert({
  className,
  variant = "neutral",
  title,
  children,
  action,
  role,
  ...props
}: AlertProps) {
  const resolvedRole = role ?? (variant === "danger" || variant === "warning" ? "alert" : "status");
  return (
    <div
      role={resolvedRole}
      className={cn("rounded-md border px-3 py-2 text-sm", variantClasses[variant], className)}
      {...props}
    >
      {title ? <p className="font-semibold text-current">{title}</p> : null}
      {children ? (
        <div className={cn(title ? "mt-1" : undefined, "text-current [&_p]:text-current")}>{children}</div>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
