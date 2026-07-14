"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { OrganizationSummary } from "../../lib/organization/contracts";

const STORAGE_KEY = "mpa_active_organization_id";

type OrganizationContextValue = {
  organizations: OrganizationSummary[];
  activeOrganizationId: string | null;
  activeOrganization: OrganizationSummary | null;
  setActiveOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

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
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return defaultOrganizationId;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && organizations.some((organization) => organization.id === stored)) {
        return stored;
      }
    } catch {
      // Ignore localStorage failures and fall back to server default.
    }
    return defaultOrganizationId;
  });

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
        setActiveOrganizationId(organizationId);
        try {
          window.localStorage.setItem(STORAGE_KEY, organizationId);
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
