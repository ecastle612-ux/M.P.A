"use client";

import Link from "next/link";
import { useCommercialContext } from "./commercial-context";

export function ResponsiveNavigation() {
  const { navigationGroups } = useCommercialContext();

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm">
        Menu
      </summary>
      <div className="absolute right-0 z-40 mt-2 max-h-[70vh] w-72 overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 shadow-lg">
        {navigationGroups.map((group) => (
          <div key={group.id} className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={`${group.id}-${item.href}`}>
                  <Link href={item.href} className="block rounded px-2 py-1 text-sm hover:bg-[var(--mpa-color-bg-app)]">
                    {item.label}
                    {item.readiness === "planned" ? " (Planned)" : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
