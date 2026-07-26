import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { navPillClassName } from "../lib/nav-pill";

/** Class helper for Next.js Link / custom anchors (selected = current). */
export function navItemClassName(selected = false, className?: string) {
  return navPillClassName(
    selected,
    cn("inline-flex items-center gap-[var(--mpa-space-2)]", className)
  );
}

export type NavItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  selected?: boolean;
  children: ReactNode;
  /** Optional leading icon node (already sized). */
  icon?: ReactNode;
};

/**
 * UX-012 Slice B — shared navigation item (pill pattern).
 * For App Router, prefer `navItemClassName` + `next/link`.
 */
export function NavItem({
  className,
  selected = false,
  children,
  icon,
  ...props
}: NavItemProps) {
  return (
    <a aria-current={selected ? "page" : undefined} className={navItemClassName(selected, className)} {...props}>
      {icon}
      <span>{children}</span>
    </a>
  );
}

export type NavListProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/** Horizontal / wrap nav list for subnav patterns. */
export function NavList({ children, className, ...props }: NavListProps) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-[var(--mpa-space-1)]", className)}
      {...props}
    >
      {children}
    </nav>
  );
}
