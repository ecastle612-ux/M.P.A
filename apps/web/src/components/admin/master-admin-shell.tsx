"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MASTER_ADMIN_NAV } from "@mpa/shared";
import type { ReactNode } from "react";
import { SkipToContent } from "../shell/skip-to-content";

export function MasterAdminShell({ children, operatorEmail }: { children: ReactNode; operatorEmail: string }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--mpa-color-bg-app)]">
      <SkipToContent />
      <aside className="hidden w-72 shrink-0 border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] lg:block">
        <div className="border-b border-[var(--mpa-color-border-sidebar)] px-4 py-4">
          <p className="font-display text-lg font-semibold text-[var(--mpa-color-text-sidebar-active)]">
            Owner Operations
          </p>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-sidebar)]">Platform console</p>
          <p className="mt-2 text-xs text-[var(--mpa-color-text-sidebar)]/90">{operatorEmail}</p>
        </div>
        <nav aria-label="Owner Operations" className="space-y-5 px-3 py-4">
          {MASTER_ADMIN_NAV.map((group) => (
            <div key={group.id}>
              <p className="mb-2 px-2 text-xs uppercase tracking-wide text-[var(--mpa-color-text-sidebar)]/80">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                        {item.label}
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
        <header className="flex h-14 items-center justify-between gap-3 border-b border-[var(--mpa-color-border-default)] bg-white px-4">
          <div className="flex min-w-0 items-center gap-3">
            <details className="relative lg:hidden">
              <summary className="cursor-pointer list-none rounded-md border border-[var(--mpa-color-border-default)] px-3 py-1.5 text-sm text-[var(--mpa-color-text-secondary)]">
                Menu
              </summary>
              <nav
                aria-label="Owner Operations mobile"
                className="absolute left-0 top-10 z-40 max-h-[70vh] w-72 overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 shadow-lg"
              >
                {MASTER_ADMIN_NAV.map((group) => (
                  <div key={group.id} className="mb-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                      {group.title}
                    </p>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="block rounded-md px-2 py-1.5 text-sm text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-app)]"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </details>
            <p className="truncate text-sm text-[var(--mpa-color-text-secondary)]">
              Diagnose · verify · support every customer from one place
            </p>
          </div>
          <Link href="/launcher" className="shrink-0 text-sm text-[var(--mpa-color-brand-primary)] underline">
            Exit to customer app
          </Link>
        </header>
        <div id="main-content">{children}</div>
      </div>
    </div>
  );
}
