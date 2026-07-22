"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { isUserRole, toRoleLabel, type UserRole } from "@mpa/shared";
import { useOrganizationContext } from "./organization-context";

type RoleContextValue = {
  availableRoles: UserRole[];
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeRoleLabel: string;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "mpa_active_role";
const ROLE_CHANGE_EVENT = "mpa:active-role";

function subscribeStoredRole(onStoreChange: () => void) {
  const onLocalChange = () => onStoreChange();
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(ROLE_CHANGE_EVENT, onLocalChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(ROLE_CHANGE_EVENT, onLocalChange);
  };
}

function getStoredRoleSnapshot(): UserRole | null {
  try {
    const storedRoleRaw = window.localStorage.getItem(STORAGE_KEY);
    return storedRoleRaw && isUserRole(storedRoleRaw) ? storedRoleRaw : null;
  } catch {
    return null;
  }
}

function getStoredRoleServerSnapshot(): UserRole | null {
  return null;
}

export function RoleProvider({
  children,
  fallbackRoles,
  defaultRole
}: {
  children: ReactNode;
  fallbackRoles: UserRole[];
  defaultRole: UserRole;
}) {
  const { activeOrganization } = useOrganizationContext();
  const availableRoles =
    activeOrganization?.roles && activeOrganization.roles.length > 0
      ? activeOrganization.roles
      : fallbackRoles;

  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    setStorageReady(true);
  }, []);

  const storedRole = useSyncExternalStore(
    subscribeStoredRole,
    getStoredRoleSnapshot,
    getStoredRoleServerSnapshot
  );

  const preferredStoredRole = storageReady ? storedRole : null;
  const preferredRole =
    preferredStoredRole && availableRoles.includes(preferredStoredRole)
      ? preferredStoredRole
      : defaultRole;

  const activeRole =
    availableRoles.includes(preferredRole) ? preferredRole : (availableRoles[0] ?? defaultRole);

  const value = useMemo<RoleContextValue>(
    () => ({
      availableRoles,
      activeRole,
      activeRoleLabel: toRoleLabel(activeRole),
      setActiveRole: (role) => {
        try {
          window.localStorage.setItem(STORAGE_KEY, role);
          window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
        } catch {
          // Non-fatal: role preference persistence failed.
        }
      }
    }),
    [activeRole, availableRoles]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleContext(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRoleContext must be used within RoleProvider");
  return context;
}
