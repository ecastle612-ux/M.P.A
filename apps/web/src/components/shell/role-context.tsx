"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { isUserRole, toRoleLabel, type UserRole } from "@mpa/shared";

type RoleContextValue = {
  availableRoles: UserRole[];
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeRoleLabel: string;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "mpa_active_role";

export function RoleProvider({
  children,
  availableRoles,
  defaultRole
}: {
  children: ReactNode;
  availableRoles: UserRole[];
  defaultRole: UserRole;
}) {
  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    if (typeof window === "undefined") {
      return defaultRole;
    }
    try {
      const storedRoleRaw = window.localStorage.getItem(STORAGE_KEY);
      const storedRole = storedRoleRaw && isUserRole(storedRoleRaw) ? storedRoleRaw : null;
      return storedRole && availableRoles.includes(storedRole) ? storedRole : defaultRole;
    } catch {
      return defaultRole;
    }
  });

  const value = useMemo<RoleContextValue>(
    () => ({
      availableRoles,
      activeRole,
      activeRoleLabel: toRoleLabel(activeRole),
      setActiveRole: (role) => {
        setActiveRoleState(role);
        try {
          window.localStorage.setItem(STORAGE_KEY, role);
        } catch {
          // Non-fatal: role preference persistence failed.
        }
      }
    }),
    [activeRole, availableRoles],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleContext(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRoleContext must be used within RoleProvider");
  return context;
}
