import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "inline" | "standalone";
  children: ReactNode;
};

/**
 * UX-012 Slice B — Link primitive.
 * Variants: inline (in prose) / standalone.
 */
export function Link({
  className,
  variant = "inline",
  children,
  ...props
}: LinkProps) {
  return (
    <a
      className={cn(
        "rounded-[var(--mpa-radius-sm)] text-[var(--mpa-color-text-link)] transition-colors duration-[var(--mpa-duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2",
        variant === "inline" && "underline underline-offset-2 hover:text-[var(--mpa-color-text-primary)]",
        variant === "standalone" &&
          "font-[var(--mpa-font-weight-medium)] no-underline hover:underline hover:text-[var(--mpa-color-text-primary)]",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
