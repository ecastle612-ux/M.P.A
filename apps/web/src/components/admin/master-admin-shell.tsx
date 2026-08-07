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
      <aside className="hidden w-80 shrink-0 border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] lg:block">
        <div className="border-b border-[var(--mpa-color-border-sidebar)] px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-sidebar)]/80">
            Platform headquarters
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-[var(--mpa-color-text-sidebar-active)]">
            Master Admin
          </p>
          <p className="mt-2 truncate text-xs text-[var(--mpa-color-text-sidebar)]/90">{operatorEmail}</p>
        </div>
        <nav aria-label="Master Admin" className="space-y-5 px-3 py-4">
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
                        className={`block rounded-md px-2 py-2 text-sm transition-colors hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)] ${
                          active
                            ? "bg-[var(--mpa-color-bg-sidebar-elevated)] text-[var(--mpa-color-text-sidebar-active)]"
                            : ""
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span>{item.label}</span>
                          {item.status === "planned" ? (
                            <span className="rounded-sm bg-[var(--mpa-color-bg-surface)]/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide opacity-80">
                              Planned
                            </span>
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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <details className="relative lg:hidden">
              <summary className="cursor-pointer list-none rounded-md border border-[var(--mpa-color-border-default)] px-3 py-1.5 text-sm text-[var(--mpa-color-text-secondary)]">
                Menu
              </summary>
              <nav
                aria-label="Master Admin mobile"
                className="absolute left-0 top-10 z-40 max-h-[70vh] w-72 overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 shadow-lg"
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
                            className="block rounded-md px-2 py-1.5 text-sm text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-subtle)]"
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
              Certify · operate · observe every commercial product
            </p>
          </div>
          <Link
            href="/launcher"
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm font-medium text-[var(--mpa-color-text-primary)] transition-colors hover:bg-[var(--mpa-color-bg-subtle)]"
          >
            Exit to customer app
          </Link>
        </header>
        <div id="main-content">{children}</div>
      </div>
    </div>
  );
}
