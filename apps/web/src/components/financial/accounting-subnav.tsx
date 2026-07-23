"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navPillClassName } from "@mpa/ui";

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
    <nav
      aria-label="Accounting"
      className="flex flex-wrap gap-1 border-b border-[var(--mpa-color-border-default)] pb-3"
    >
      <span className="mr-3 self-center font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
        Accounting
      </span>
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={navPillClassName(active)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
