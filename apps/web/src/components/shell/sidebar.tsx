"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MpaLogo } from "../branding/mpa-logo";
import { SHELL_NAVIGATION_GROUPS, isRouteActive } from "./navigation-config";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-[17rem] shrink-0 border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] lg:block"
      aria-label="Primary application sidebar"
    >
      <div className="border-b border-[var(--mpa-color-border-sidebar)] px-5 py-5">
        <MpaLogo className="h-9 w-auto" alt="M.P.A. logo" />
      </div>
      <nav className="space-y-7 px-3 py-5" aria-label="Primary">
        {SHELL_NAVIGATION_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-xs uppercase tracking-[0.08em] text-[var(--mpa-color-text-sidebar)]/70">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isRouteActive(pathname, item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-[var(--mpa-color-bg-sidebar-elevated)] font-medium text-[var(--mpa-color-text-sidebar-active)]"
                          : "text-[var(--mpa-color-text-sidebar)] hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                      ].join(" ")}
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
  );
}
