"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PARTNER_COMMAND_CENTER_NAV, PARTNER_COMMAND_CENTER_SUBTITLE, PARTNER_COMMAND_CENTER_TITLE } from "@mpa/shared";

export function PartnerCommandCenterShell({
  title = PARTNER_COMMAND_CENTER_TITLE,
  subtitle = PARTNER_COMMAND_CENTER_SUBTITLE,
  children
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
      </div>
      <nav
        aria-label="Partner Command Center"
        className="-mx-1 flex gap-2 overflow-x-auto pb-1"
      >
        {PARTNER_COMMAND_CENTER_NAV.map((item) => {
          const active =
            item.href === "/partner" ? pathname === "/partner" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium ${
                active
                  ? "bg-[var(--mpa-color-brand-primary)] text-white"
                  : "border border-[var(--mpa-color-border-default)] bg-white text-[var(--mpa-color-text-primary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </main>
  );
}
