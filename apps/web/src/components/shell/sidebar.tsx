"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@mpa/ui";

const NAV_GROUPS = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "#", label: "Queue (placeholder)" },
      { href: "#", label: "Search (placeholder)" }
    ]
  },
  {
    title: "Platform",
    items: [
      { href: "#", label: "Notifications (placeholder)" },
      { href: "/profile", label: "Settings" }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] lg:flex lg:flex-col">
      <div className="border-b border-[var(--mpa-color-border-sidebar)] px-4 py-5">
        <p className="font-display text-xl font-semibold tracking-tight text-[var(--mpa-color-text-sidebar-active)]">
          M.P.A.
        </p>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-sidebar)]">Operations foundation</p>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--mpa-color-text-sidebar)]/70">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.href !== "#" && pathname.startsWith(item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex min-h-11 items-center rounded-[var(--mpa-radius-md)] px-3 py-2 text-sm transition-[background-color,color] duration-[var(--mpa-motion-fast)] ease-[var(--mpa-ease-standard)]",
                        active
                          ? "bg-[var(--mpa-color-bg-sidebar-elevated)] text-[var(--mpa-color-text-sidebar-active)]"
                          : "hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]",
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--mpa-color-sidebar-accent)]"
                        />
                      ) : null}
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
