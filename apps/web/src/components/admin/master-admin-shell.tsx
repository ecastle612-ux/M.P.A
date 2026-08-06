"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MASTER_ADMIN_NAV } from "@mpa/shared";
import type { ReactNode } from "react";

export function MasterAdminShell({ children, operatorEmail }: { children: ReactNode; operatorEmail: string }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--mpa-color-bg-app)]">
      <aside className="hidden w-80 shrink-0 border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] lg:block">
        <div className="border-b border-[var(--mpa-color-border-sidebar)] px-4 py-4">
          <p className="font-display text-lg font-semibold text-[var(--mpa-color-text-sidebar-active)]">
            Master Admin
          </p>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-sidebar)]">Platform operating system</p>
          <p className="mt-2 text-xs text-[var(--mpa-color-text-sidebar)]/90">{operatorEmail}</p>
        </div>
        <nav className="space-y-5 px-3 py-4">
          {MASTER_ADMIN_NAV.map((group) => (
            <div key={group.id}>
              <p className="mb-2 px-2 text-xs uppercase tracking-wide text-[var(--mpa-color-text-sidebar)]/80">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-md px-2 py-2 text-sm hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)] ${
                          active
                            ? "bg-[var(--mpa-color-bg-sidebar-elevated)] text-[var(--mpa-color-text-sidebar-active)]"
                            : ""
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span>{item.label}</span>
                          {item.status === "planned" ? (
                            <span className="text-[10px] uppercase tracking-wide opacity-70">Planned</span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-[var(--mpa-color-border-default)] bg-white px-4">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Mission Control · every product · every subscription · every capability
          </p>
          <Link href="/launcher" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Exit to customer app
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
