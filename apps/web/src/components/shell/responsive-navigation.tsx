"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Drawer } from "@mpa/ui";
import { usePathname } from "next/navigation";
import { Logo } from "../branding/logo";
import { NAV_ICON_MAP } from "../presentation/nav-icons";
import { OrganizationSwitcher } from "./organization-switcher";
import { RoleSwitcher } from "./role-switcher";
import { SHELL_NAVIGATION_GROUPS, isRouteActive } from "./navigation-config";
import { useSessionPermissions } from "./use-session-permissions";

export function ResponsiveNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { canAccess } = useSessionPermissions();

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
          <Link
            href="/dashboard"
            className="flex items-center px-1"
            aria-label="M.P.A. My Property Assistant"
            onClick={() => setOpen(false)}
          >
            <Logo size="navigation" />
          </Link>
          <nav aria-label="Mobile primary navigation" className="space-y-5">
            {SHELL_NAVIGATION_GROUPS.map((group) => {
              const items = group.items.filter((item) => canAccess(item.requiredCapability));
              if (items.length === 0) return null;
              return (
              <div key={group.title}>
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)]">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = isRouteActive(pathname, item.href, item.exact);
                    const Icon = NAV_ICON_MAP[item.href];
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setOpen(false)}
                          className={[
                            "group flex items-center gap-3 rounded-[var(--mpa-radius-md)] px-2.5 py-3 text-sm transition-colors",
                            active
                              ? "bg-[var(--mpa-color-bg-app)] font-medium text-[var(--mpa-color-text-primary)] shadow-[inset_3px_0_0_0_var(--mpa-color-brand-primary)]"
                              : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)] hover:text-[var(--mpa-color-text-primary)]"
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--mpa-radius-sm)] transition-colors",
                              active
                                ? "bg-[var(--mpa-color-brand-primary)]/10 text-[var(--mpa-color-brand-primary)]"
                                : "text-[var(--mpa-color-text-secondary)] group-hover:text-[var(--mpa-color-text-primary)]"
                            ].join(" ")}
                          >
                            {Icon ? <Icon className="h-4 w-4" /> : <span aria-hidden="true">•</span>}
                          </span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              );
            })}
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
