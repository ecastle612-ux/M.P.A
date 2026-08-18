"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useReducer } from "react";
import {
  completeSurfaceOptions,
  operationalSurfaceFromPath,
  presentNavigationGroups,
  surfaceLabelForPath
} from "@mpa/shared";
import { useFocusTrap } from "@mpa/ui";
import { reduceDismissibleMenu } from "../../lib/ui/dismissible-menu";
import { AccountMenu } from "./account-menu";
import { AppNavRail, SidebarBrandLockup } from "./app-nav-rail";
import { useCommercialContext } from "./commercial-context";
import { useOrganizationContext } from "./organization-context";
import { useRoleContext } from "./role-context";
import { SurfaceSwitcher } from "./sidebar";

export function MobileNavDrawer() {
  const pathname = usePathname() ?? "";
  const { productLabel, productSku, navigationGroups } = useCommercialContext();
  const { activeOrganization } = useOrganizationContext();
  const { activeRoleLabel } = useRoleContext();
  const [menu, dispatch] = useReducer(reduceDismissibleMenu, { open: false, pathname });
  const panelRef = useFocusTrap<HTMLDivElement>(menu.open, () => dispatch({ type: "close" }));

  useEffect(() => {
    dispatch({ type: "pathname", pathname });
  }, [pathname]);

  useEffect(() => {
    if (!menu.open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menu.open]);

  const presented = useMemo(
    () =>
      presentNavigationGroups(navigationGroups, {
        roles: activeOrganization?.roles ?? [],
        pathname
      }),
    [activeOrganization?.roles, navigationGroups, pathname]
  );
  const surfaceOptions = useMemo(() => completeSurfaceOptions(navigationGroups), [navigationGroups]);
  const surfaceLabel = surfaceLabelForPath(pathname, productLabel, surfaceOptions);
  const brandHref =
    operationalSurfaceFromPath(pathname) === "facility"
      ? "/facility/mission-control"
      : operationalSurfaceFromPath(pathname) === "property"
        ? "/pm/mission-control"
        : "/launcher";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
        aria-expanded={menu.open}
        aria-haspopup="dialog"
        aria-controls="app-mobile-nav-drawer"
        onClick={() => dispatch({ type: "toggle" })}
      >
        Menu
      </button>
      {menu.open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[var(--mpa-color-bg-overlay)] motion-safe:transition-opacity"
            onClick={() => dispatch({ type: "close" })}
          />
          <div
            ref={panelRef}
            id="app-mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Workspace navigation"
            className="absolute inset-y-0 left-0 flex h-full w-[min(20rem,100%)] motion-safe:animate-[mpa-rise_200ms_ease-out] motion-reduce:animate-none"
          >
            <AppNavRail
              mobile
              collapsed={false}
              pathname={pathname}
              groups={presented}
              showProductTitles={surfaceOptions.length > 1}
              brand={
                <SidebarBrandLockup
                  href={productSku ? brandHref : "/setup"}
                  collapsed={false}
                  organizationName={activeOrganization?.name ?? null}
                  surfaceLabel={surfaceLabel}
                />
              }
              context={<SurfaceSwitcher options={surfaceOptions} pathname={pathname} />}
              footer={<AccountMenu placement="sidebar" roleLabel={activeRoleLabel} />}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
