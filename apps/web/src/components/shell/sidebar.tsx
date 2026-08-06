"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCommercialContext } from "./commercial-context";

export function Sidebar() {
  const pathname = usePathname();
  const { productLabel, productSku, navigationGroups } = useCommercialContext();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] lg:block">
      <div className="border-b border-[var(--mpa-color-border-sidebar)] px-4 py-4">
        <p className="font-display text-lg font-semibold text-[var(--mpa-color-text-sidebar-active)]">M.P.A.</p>
        <p className="mt-1 text-xs text-[var(--mpa-color-text-sidebar)]">
          {productLabel ?? "No product selected"}
        </p>
        {!productSku ? (
          <p className="mt-2 text-xs text-[var(--mpa-color-text-sidebar)]/90">Complete Guided Setup to activate modules.</p>
        ) : null}
      </div>
      <nav className="space-y-6 px-3 py-4">
        {navigationGroups.map((group) => (
          <div key={group.id}>
            <p className="mb-2 px-2 text-xs uppercase tracking-wide text-[var(--mpa-color-text-sidebar)]/80">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={`${group.id}-${item.href}`}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)] ${
                        active
                          ? "bg-[var(--mpa-color-bg-sidebar-elevated)] text-[var(--mpa-color-text-sidebar-active)]"
                          : ""
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.readiness === "planned" ? (
                        <span className="text-[10px] uppercase tracking-wide opacity-70">Planned</span>
                      ) : null}
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
