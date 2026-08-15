"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  entitlementsForMember,
  hasEntitlement,
  navigationGroupsForSku,
  type EntitlementKey,
  type NavGroup,
  type ProductSku
} from "@mpa/shared";
import { useOrganizationContext } from "./organization-context";

type CommercialContextValue = {
  productSku: ProductSku | null;
  productLabel: string | null;
  setupComplete: boolean;
  entitlements: EntitlementKey[];
  navigationGroups: NavGroup[];
  canAccess: (entitlement: EntitlementKey | string) => boolean;
};

const CommercialContext = createContext<CommercialContextValue | null>(null);

export function CommercialProvider({ children }: { children: ReactNode }) {
  const { activeOrganization } = useOrganizationContext();

  const value = useMemo<CommercialContextValue>(() => {
    const productSku = activeOrganization?.productSku ?? null;
    const roles = activeOrganization?.roles ?? [];
    const storedScope = activeOrganization?.operatingScope ?? null;
    const entitlements = entitlementsForMember({
      sku: productSku,
      roles,
      storedScope
    });

    return {
      productSku,
      productLabel: activeOrganization?.productLabel ?? null,
      setupComplete: activeOrganization?.setupComplete ?? false,
      entitlements,
      navigationGroups: navigationGroupsForSku(productSku, roles, storedScope),
      canAccess: (entitlement) => hasEntitlement(entitlements, entitlement)
    };
  }, [activeOrganization]);

  return <CommercialContext.Provider value={value}>{children}</CommercialContext.Provider>;
}

export function useCommercialContext(): CommercialContextValue {
  const value = useContext(CommercialContext);
  if (!value) {
    throw new Error("useCommercialContext must be used within CommercialProvider");
  }
  return value;
}
