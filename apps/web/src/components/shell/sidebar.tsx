"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  completeSurfaceOptions,
  operationalSurfaceFromPath,
  presentNavigationGroups,
  surfaceLabelForPath
} from "@mpa/shared";
import { cn } from "@mpa/ui";
import { AccountMenu } from "./account-menu";
import { AppNavRail, SidebarBrandLockup } from "./app-nav-rail";
import { useCommercialContext } from "./commercial-context";
import { useOrganizationContext } from "./organization-context";
import { useRoleContext } from "./role-context";
import { useSidebarCollapse } from "./use-sidebar-collapse";

export function SurfaceSwitcher({
  options,
  pathname
}: {
  options: ReturnType<typeof completeSurfaceOptions>;
  pathname: string;
}) {
  if (options.length < 2) {
    return null;
  }
  const surface = operationalSurfaceFromPath(pathname);
  return (
    <div
      role="group"
      aria-label="Operational surface"
      className="grid grid-cols-2 gap-1 rounded-md bg-[var(--mpa-color-bg-sidebar-elevated)] p-1"
    >
      {options.map((option) => {
        const current = surface === option.id;
        return (
          <Link
            key={option.id}
            href={option.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "min-h-10 rounded px-2 text-center text-[11px] font-medium leading-tight motion-safe:transition-colors motion-safe:duration-[var(--mpa-motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]",
              current
                ? "bg-[var(--mpa-color-bg-sidebar-active)] text-[var(--mpa-color-text-sidebar-active)]"
                : "text-[var(--mpa-color-text-sidebar)] hover:text-[var(--mpa-color-text-sidebar-active)]"
            )}
          >
            <span className="flex h-full items-center justify-center">{option.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const { productLabel, productSku, navigationGroups } = useCommercialContext();
  const { activeOrganization } = useOrganizationContext();
  const { activeRoleLabel } = useRoleContext();
  const { collapsed, toggleCollapsed } = useSidebarCollapse();

  const presented = useMemo(
    () =>
      presentNavigationGroups(navigationGroups, {
        roles: activeOrganization?.roles ?? [],
        pathname
      }),
    [activeOrganization?.roles, navigationGroups, pathname]
  );
  const surfaceOptions = useMemo(() => completeSurfaceOptions(navigationGroups), [navigationGroups]);
  const showProductTitles = surfaceOptions.length > 1;
  const surfaceLabel = surfaceLabelForPath(pathname, productLabel, surfaceOptions);
  const brandHref =
    operationalSurfaceFromPath(pathname) === "facility"
      ? "/facility/mission-control"
      : operationalSurfaceFromPath(pathname) === "property"
        ? "/pm/mission-control"
        : "/launcher";

  return (
    <div className="hidden h-screen shrink-0 lg:sticky lg:top-0 lg:block lg:self-start">
      <AppNavRail
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        pathname={pathname}
        groups={presented}
        showProductTitles={showProductTitles}
        brand={
          <SidebarBrandLockup
            href={productSku ? brandHref : "/setup"}
            collapsed={collapsed}
            organizationName={activeOrganization?.name ?? null}
            surfaceLabel={surfaceLabel}
          />
        }
        context={<SurfaceSwitcher options={surfaceOptions} pathname={pathname} />}
        footer={<AccountMenu placement="sidebar" roleLabel={activeRoleLabel} collapsed={collapsed} />}
      />
    </div>
  );
}
