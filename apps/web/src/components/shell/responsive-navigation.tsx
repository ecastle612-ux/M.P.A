"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Drawer } from "@mpa/ui";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher } from "./organization-switcher";
import { RoleSwitcher } from "./role-switcher";
import { SHELL_NAVIGATION_GROUPS, isRouteActive } from "./navigation-config";

export function ResponsiveNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <Button
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((value) => !value)}
      >
        Menu
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Navigation" className="max-w-sm">
        <div id="mobile-nav-drawer" className="space-y-6">
          <nav aria-label="Mobile primary navigation" className="space-y-5">
            {SHELL_NAVIGATION_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs uppercase tracking-[0.08em] text-[var(--mpa-color-text-secondary)]">
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
                          onClick={() => setOpen(false)}
                          className={[
                            "block rounded-md px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-[var(--mpa-color-bg-app)] font-medium text-[var(--mpa-color-text-primary)]"
                              : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)] hover:text-[var(--mpa-color-text-primary)]"
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

          <section aria-label="Workspace controls" className="space-y-3 border-t border-[var(--mpa-color-border-default)] pt-4">
            <OrganizationSwitcher compact />
            <RoleSwitcher compact />
          </section>
        </div>
      </Drawer>
    </div>
  );
}
