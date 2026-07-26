import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type CardVariant = "default" | "elevated" | "muted" | "ghost";
type CardPadding = "none" | "sm" | "md" | "lg";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

/**
 * UX-012 Slice B — Card (interaction / list container).
 * Padding uses space tokens only.
 */
export function Card({ className, variant = "default", padding = "md", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--mpa-radius-lg)] border transition-shadow duration-[var(--mpa-duration-normal)]",
        variant === "default" &&
          "border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)]",
        variant === "elevated" &&
          "border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-md)]",
        variant === "muted" && "border-transparent bg-[var(--mpa-color-bg-surface-muted)]",
        variant === "ghost" && "border-transparent bg-transparent shadow-none",
        padding === "none" && "p-0",
        padding === "sm" && "p-[var(--mpa-space-3)]",
        padding === "md" && "p-[var(--mpa-space-4)]",
        padding === "lg" && "p-[var(--mpa-space-5)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-[var(--mpa-space-3)] space-y-[var(--mpa-space-1)]", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-[var(--mpa-font-size-subheading)] font-[var(--mpa-font-weight-semibold)] tracking-tight text-[var(--mpa-color-text-primary)]",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[var(--mpa-font-size-body)] text-[var(--mpa-color-text-secondary)]", className)} {...props} />
  );
}
