import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type IconSize = "sm" | "md" | "lg";

export type IconProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  /** Accessible name when the icon is actionable / meaningful. Decorative → omit and aria-hidden. */
  label?: string;
  size?: IconSize;
};

/**
 * UX-012 Slice B — Icon wrapper (sized + labeled when actionable).
 */
export function Icon({
  children,
  label,
  size = "md",
  className,
  ...props
}: IconProps) {
  const decorative = !label;
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={label}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-[var(--mpa-color-text-secondary)]",
        size === "sm" && "h-[var(--mpa-icon-size-sm)] w-[var(--mpa-icon-size-sm)]",
        size === "md" && "h-[var(--mpa-icon-size-md)] w-[var(--mpa-icon-size-md)]",
        size === "lg" && "h-[var(--mpa-icon-size-lg)] w-[var(--mpa-icon-size-lg)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
