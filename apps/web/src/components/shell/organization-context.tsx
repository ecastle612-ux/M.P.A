"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { OrganizationSummary } from "../../lib/organization/contracts";

const STORAGE_KEY = "mpa_active_organization_id";
const ORG_CHANGE_EVENT = "mpa:active-organization";

type OrganizationContextValue = {
  organizations: OrganizationSummary[];
  activeOrganizationId: string | null;
  activeOrganization: OrganizationSummary | null;
  setActiveOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

function subscribeStoredOrganization(onStoreChange: () => void) {
  const onLocalChange = () => onStoreChange();
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(ORG_CHANGE_EVENT, onLocalChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(ORG_CHANGE_EVENT, onLocalChange);
  };
}

function getStoredOrganizationSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getStoredOrganizationServerSnapshot(): string | null {
  return null;
}

export function OrganizationProvider({
  children,
  organizations,
  defaultOrganizationId,
  onRefreshOrganizations
}: {
  children: ReactNode;
  organizations: OrganizationSummary[];
  defaultOrganizationId: string | null;
  onRefreshOrganizations: () => Promise<void>;
}) {
  const router = useRouter();
  const storedOrganizationId = useSyncExternalStore(
    subscribeStoredOrganization,
    getStoredOrganizationSnapshot,
    getStoredOrganizationServerSnapshot
  );

  const activeOrganizationId =
    storedOrganizationId && organizations.some((organization) => organization.id === storedOrganizationId)
      ? storedOrganizationId
      : defaultOrganizationId;

  const activeOrganization =
    organizations.find((organization) => organization.id === activeOrganizationId) ?? null;

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      activeOrganizationId,
      activeOrganization,
      setActiveOrganization: async (organizationId) => {
        const response = await fetch("/api/organizations/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId })
        });
        if (!response.ok) {
          return;
        }
        try {
          window.localStorage.setItem(STORAGE_KEY, organizationId);
          window.dispatchEvent(new Event(ORG_CHANGE_EVENT));
        } catch {
          // Non-fatal preference persistence failure.
        }
        router.refresh();
      },
      refreshOrganizations: onRefreshOrganizations
    }),
    [activeOrganization, activeOrganizationId, onRefreshOrganizations, organizations, router]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganizationContext(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganizationContext must be used within OrganizationProvider");
  }
  return context;
}
