"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import { RoleProvider } from "./role-context";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { ResponsiveNavigation } from "./responsive-navigation";

export function ApplicationShell({
  children,
  availableRoles,
  defaultRole
}: {
  children: ReactNode;
  availableRoles: UserRole[];
  defaultRole: UserRole;
}) {
  return (
    <RoleProvider availableRoles={availableRoles} defaultRole={defaultRole}>
      <div className="flex min-h-screen bg-[var(--mpa-color-bg-app)]">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-4 pt-3 lg:hidden">
            <p className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">M.P.A.</p>
            <ResponsiveNavigation />
          </div>
          <TopNavigation />
          {children}
        </div>
      </div>
    </RoleProvider>
  );
}
