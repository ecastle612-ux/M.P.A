"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { buildStorageKey, recordRecentItem } from "../../lib/command-center/storage";
import type { CommandCenterItemKind } from "../../lib/command-center/types";

const ENTITY_PATTERNS: Array<{
  pattern: RegExp;
  kind: CommandCenterItemKind;
  badge: string;
}> = [
  { pattern: /^\/properties\/([^/]+)$/, kind: "property", badge: "Property" },
  { pattern: /^\/units\/([^/]+)$/, kind: "unit", badge: "Unit" },
  { pattern: /^\/tenants\/([^/]+)$/, kind: "tenant", badge: "Tenant" },
  { pattern: /^\/maintenance\/([^/]+)$/, kind: "maintenance", badge: "Maintenance" },
  { pattern: /^\/vendors\/([^/]+)$/, kind: "vendor", badge: "Vendor" },
  { pattern: /^\/leases\/([^/]+)$/, kind: "lease", badge: "Lease" },
  { pattern: /^\/dashboard$/, kind: "dashboard", badge: "Dashboard" }
];

export function CommandCenterTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/properties" || pathname === "/units" || pathname === "/tenants" || pathname === "/leases" || pathname === "/maintenance" || pathname === "/vendors") {
      return;
    }

    for (const entry of ENTITY_PATTERNS) {
      const match = pathname.match(entry.pattern);
      if (!match?.[1] && entry.kind !== "dashboard") {
        continue;
      }

      const entityId = match?.[1] ?? "dashboard";
      void trackEntityVisit(pathname, entry.kind, entityId, entry.badge);
      break;
    }
  }, [pathname]);

  return null;
}

async function trackEntityVisit(
  pathname: string,
  kind: CommandCenterItemKind,
  entityId: string,
  badge: string
) {
  const endpoint =
    kind === "property"
      ? `/api/properties/${entityId}`
      : kind === "unit"
        ? `/api/units/${entityId}`
        : kind === "tenant"
          ? `/api/tenants/${entityId}`
          : kind === "maintenance"
            ? `/api/maintenance/${entityId}`
            : kind === "vendor"
              ? `/api/vendors/${entityId}`
              : kind === "lease"
                ? `/api/leases/${entityId}`
              : null;

  if (!endpoint) {
    recordRecentItem({
      key: buildStorageKey(kind, entityId),
      kind,
      label: "Operations Center",
      subtitle: "Dashboard",
      context: "Recently viewed",
      badge,
      status: "Live",
      href: pathname
    });
    return;
  }

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    const label = resolveLabel(kind, payload);
    const subtitle = resolveSubtitle(kind, payload);
    const context = resolveContext(kind, payload);
    const status = resolveStatus(kind, payload);

    recordRecentItem({
      key: buildStorageKey(kind, entityId),
      kind,
      label,
      subtitle,
      context,
      badge,
      status,
      href: pathname
    });
  } catch {
    // Ignore tracking failures.
  }
}

function resolveLabel(kind: CommandCenterItemKind, payload: Record<string, unknown>): string {
  if (kind === "property") {
    const property = payload["property"] as { name?: string } | undefined;
    return property?.name ?? "Property";
  }
  if (kind === "unit") {
    const unit = payload["unit"] as { unitNumber?: string } | undefined;
    return unit?.unitNumber ? `Unit ${unit.unitNumber}` : "Unit";
  }
  if (kind === "tenant") {
    const tenant = payload["tenant"] as
      | { preferredName?: string | null; firstName?: string; lastName?: string }
      | undefined;
    return tenant?.preferredName || `${tenant?.firstName ?? ""} ${tenant?.lastName ?? ""}`.trim() || "Tenant";
  }
  if (kind === "maintenance") {
    const workOrder = payload["workOrder"] as { workOrderNumber?: string; title?: string } | undefined;
    return workOrder?.workOrderNumber ? `${workOrder.workOrderNumber} · ${workOrder.title ?? "Work order"}` : "Work order";
  }
  if (kind === "vendor") {
    const vendor = payload["vendor"] as { businessName?: string } | undefined;
    return vendor?.businessName ?? "Vendor";
  }
  if (kind === "lease") {
    const lease = payload["lease"] as { leaseNumber?: string; tenantName?: string | null } | undefined;
    return lease?.leaseNumber
      ? `${lease.leaseNumber}${lease.tenantName ? ` · ${lease.tenantName}` : ""}`
      : "Lease";
  }
  return "Operations Center";
}

function resolveSubtitle(kind: CommandCenterItemKind, payload: Record<string, unknown>): string | null {
  if (kind === "property") {
    const property = payload["property"] as { city?: string; stateRegion?: string } | undefined;
    return property?.city ? `${property.city}, ${property.stateRegion ?? ""}`.trim() : null;
  }
  if (kind === "unit") {
    const unit = payload["unit"] as { propertyName?: string | null } | undefined;
    return unit?.propertyName ?? null;
  }
  if (kind === "tenant") {
    const tenant = payload["tenant"] as { email?: string } | undefined;
    return tenant?.email ?? null;
  }
  if (kind === "maintenance") {
    const workOrder = payload["workOrder"] as { propertyName?: string | null } | undefined;
    return workOrder?.propertyName ?? null;
  }
  if (kind === "vendor") {
    const vendor = payload["vendor"] as { phone?: string | null; email?: string | null } | undefined;
    return vendor?.phone ?? vendor?.email ?? null;
  }
  if (kind === "lease") {
    const lease = payload["lease"] as { propertyName?: string | null } | undefined;
    return lease?.propertyName ?? null;
  }
  return "Dashboard";
}

function resolveContext(kind: CommandCenterItemKind, payload: Record<string, unknown>): string | null {
  if (kind === "tenant") {
    const tenant = payload["tenant"] as { propertyName?: string | null } | undefined;
    return tenant?.propertyName ?? null;
  }
  if (kind === "maintenance") {
    const workOrder = payload["workOrder"] as { unitNumber?: string | null; tenantName?: string | null } | undefined;
    return [workOrder?.unitNumber ? `Unit ${workOrder.unitNumber}` : null, workOrder?.tenantName].filter(Boolean).join(" · ") || null;
  }
  if (kind === "vendor") {
    const vendor = payload["vendor"] as { services?: string[] } | undefined;
    return vendor?.services?.slice(0, 3).join(", ") ?? null;
  }
  if (kind === "lease") {
    const lease = payload["lease"] as { unitNumber?: string | null; endDate?: string } | undefined;
    return [lease?.unitNumber ? `Unit ${lease.unitNumber}` : null, lease?.endDate ? `Ends ${lease.endDate}` : null]
      .filter(Boolean)
      .join(" · ") || null;
  }
  return "Recently viewed";
}

function resolveStatus(kind: CommandCenterItemKind, payload: Record<string, unknown>): string | null {
  if (kind === "property") {
    return (payload["property"] as { status?: string } | undefined)?.status ?? null;
  }
  if (kind === "unit") {
    return (payload["unit"] as { occupancyStatus?: string } | undefined)?.occupancyStatus?.replaceAll("_", " ") ?? null;
  }
  if (kind === "tenant") {
    return (payload["tenant"] as { status?: string } | undefined)?.status ?? null;
  }
  if (kind === "maintenance") {
    return (payload["workOrder"] as { status?: string } | undefined)?.status?.replaceAll("_", " ") ?? null;
  }
  if (kind === "vendor") {
    return (payload["vendor"] as { status?: string } | undefined)?.status ?? null;
  }
  if (kind === "lease") {
    const lease = payload["lease"] as { status?: string; renewalStatus?: string } | undefined;
    return lease?.renewalStatus && lease.renewalStatus !== "none"
      ? lease.renewalStatus.replaceAll("_", " ")
      : lease?.status ?? null;
  }
  return "Live";
}
