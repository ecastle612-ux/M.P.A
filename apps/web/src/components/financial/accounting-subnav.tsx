"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavList, navItemClassName } from "@mpa/ui";

const ITEMS = [
  { href: "/financials", label: "Dashboard", exact: true },
  { href: "/financials/transactions", label: "Transactions", exact: false },
  { href: "/financials/expenses", label: "Expenses", exact: false },
  { href: "/financials/charges", label: "Rent", exact: false },
  { href: "/financials/owner-statements", label: "Owner Statements", exact: false },
  { href: "/vendors", label: "Vendors", exact: false },
  { href: "/financials/reports", label: "Reports", exact: false }
] as const;

export function AccountingSubnav() {
  const pathname = usePathname();

  return (
    <NavList
      aria-label="Accounting"
      className="border-b border-[var(--mpa-color-border-default)] pb-[var(--mpa-space-3)]"
    >
      <span className="mr-[var(--mpa-space-3)] self-center font-display text-[var(--mpa-font-size-micro)] font-[var(--mpa-font-weight-semibold)] uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
        Accounting
      </span>
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={navItemClassName(active)}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </NavList>
  );
}
