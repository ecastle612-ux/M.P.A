import { fuzzyFilter } from "../fuzzy";
import type { CommandCenterProvider, CommandCenterResult } from "../types";

type PropertyRecord = {
  id: string;
  name: string;
  city: string;
  stateRegion: string;
  status: string;
  unitCount?: number;
  occupiedUnits?: number;
};

type UnitRecord = {
  id: string;
  unitNumber: string;
  propertyName: string | null;
  occupancyStatus: string;
  status: string;
};

type TenantRecord = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  propertyName: string | null;
  status: string;
};

type MaintenanceRecord = {
  id: string;
  workOrderNumber: string;
  title: string;
  propertyName: string | null;
  unitNumber: string | null;
  tenantName: string | null;
  status: string;
  priority: string;
};

type VendorRecord = {
  id: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  primaryContactName: string | null;
  status: string;
  services: string[];
  preferredVendor: boolean;
  rating: number | null;
};

type LeaseRecord = {
  id: string;
  leaseNumber: string;
  propertyName: string | null;
  unitNumber: string | null;
  tenantName: string | null;
  status: string;
  renewalStatus: string;
  endDate: string;
};

export const propertiesProvider: CommandCenterProvider = {
  id: "properties",
  category: "properties",
  sectionTitle: "Properties",
  priority: 40,
  enabled: (context) => evaluateCapability(context.permissions, "property:read"),
  search: async (context) => searchProperties(context.query, context.signal)
};

export const unitsProvider: CommandCenterProvider = {
  id: "units",
  category: "units",
  sectionTitle: "Units",
  priority: 50,
  enabled: (context) => evaluateCapability(context.permissions, "unit:read"),
  search: async (context) => searchUnits(context.query, context.signal)
};

export const tenantsProvider: CommandCenterProvider = {
  id: "tenants",
  category: "tenants",
  sectionTitle: "Tenants",
  priority: 60,
  enabled: (context) => evaluateCapability(context.permissions, "tenant:read"),
  search: async (context) => searchTenants(context.query, context.signal)
};

export const maintenanceProvider: CommandCenterProvider = {
  id: "maintenance",
  category: "maintenance",
  sectionTitle: "Maintenance",
  priority: 65,
  enabled: (context) => evaluateCapability(context.permissions, "maintenance:read"),
  search: async (context) => searchMaintenance(context.query, context.signal)
};

export const vendorsProvider: CommandCenterProvider = {
  id: "vendors",
  category: "vendors",
  sectionTitle: "Vendors",
  priority: 68,
  enabled: (context) => evaluateCapability(context.permissions, "vendor:read"),
  search: async (context) => searchVendors(context.query, context.signal)
};

export const leasesProvider: CommandCenterProvider = {
  id: "leases",
  category: "leases",
  sectionTitle: "Leases",
  priority: 63,
  enabled: (context) => evaluateCapability(context.permissions, "lease:read"),
  search: async (context) => searchLeases(context.query, context.signal)
};

export const organizationsProvider: CommandCenterProvider = {
  id: "organizations",
  category: "organizations",
  sectionTitle: "Organizations",
  priority: 55,
  enabled: (context) => evaluateCapability(context.permissions, "organization:read"),
  search: async (context) => {
    const matches = fuzzyFilter(
      context.query,
      context.organizations,
      (organization) => [organization.name, organization.slug],
      6
    );

    return matches.map(({ item, score }) => ({
      id: `organization-${item.id}`,
      kind: "organization" as const,
      category: "organizations" as const,
      label: item.name,
      subtitle: item.slug,
      context: "Switch organization context",
      badge: "Organization",
      status: "Workspace",
      statusVariant: "info" as const,
      icon: "🏛",
      href: null,
      shortcut: null,
      score,
      favoriteKey: `organization:${item.id}`
    }));
  }
};

async function searchProperties(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/properties?limit=100", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: PropertyRecord[] };
  const matches = fuzzyFilter(
    query,
    payload.items ?? [],
    (item) => [item.name, item.city, item.stateRegion, item.status],
    8
  );

  return matches.map(({ item, score }) => ({
    id: `property-${item.id}`,
    kind: "property",
    category: "properties",
    label: item.name,
    subtitle: `${item.city}, ${item.stateRegion}`,
    context:
      item.unitCount !== undefined
        ? `${item.occupiedUnits ?? 0}/${item.unitCount ?? 0} units occupied`
        : "Property record",
    badge: "Property",
    status: item.status,
    statusVariant: item.status === "active" ? "success" : "neutral",
    icon: "🏢",
    href: `/properties/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `property:${item.id}`
  }));
}

async function searchUnits(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/units?limit=100", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: UnitRecord[] };
  const matches = fuzzyFilter(
    query,
    payload.items ?? [],
    (item) => [item.unitNumber, item.propertyName ?? "", item.occupancyStatus, item.status],
    8
  );

  return matches.map(({ item, score }) => ({
    id: `unit-${item.id}`,
    kind: "unit",
    category: "units",
    label: `Unit ${item.unitNumber}`,
    subtitle: item.propertyName,
    context: "Unit inventory",
    badge: "Unit",
    status: item.occupancyStatus.replaceAll("_", " "),
    statusVariant: item.occupancyStatus === "occupied" ? "success" : "warning",
    icon: "🚪",
    href: `/units/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `unit:${item.id}`
  }));
}

async function searchTenants(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint =
    trimmed.length > 0
      ? `/api/tenants?search=${encodeURIComponent(trimmed)}&limit=12`
      : "/api/tenants?limit=12";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: TenantRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(
        query,
        items,
        (item) => [
          item.preferredName ?? "",
          item.firstName,
          item.lastName,
          item.email,
          item.propertyName ?? "",
          item.status
        ],
        8
      )
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `tenant-${item.id}`,
    kind: "tenant",
    category: "tenants",
    label: item.preferredName || `${item.firstName} ${item.lastName}`,
    subtitle: item.email,
    context: item.propertyName,
    badge: "Tenant",
    status: item.status,
    statusVariant: item.status === "active" ? "success" : "neutral",
    icon: "👤",
    href: `/tenants/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `tenant:${item.id}`
  }));
}

async function searchMaintenance(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint =
    trimmed.length > 0
      ? `/api/maintenance?search=${encodeURIComponent(trimmed)}&limit=12&status=all`
      : "/api/maintenance?limit=12&status=open";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: MaintenanceRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(
        query,
        items,
        (item) => [
          item.workOrderNumber,
          item.title,
          item.propertyName ?? "",
          item.unitNumber ?? "",
          item.tenantName ?? "",
          item.status,
          item.priority
        ],
        8
      )
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `maintenance-${item.id}`,
    kind: "maintenance",
    category: "maintenance",
    label: `${item.workOrderNumber} · ${item.title}`,
    subtitle: item.propertyName,
    context: [item.unitNumber ? `Unit ${item.unitNumber}` : null, item.tenantName].filter(Boolean).join(" · ") || null,
    badge: "Maintenance",
    status: item.status.replaceAll("_", " "),
    statusVariant:
      item.priority === "emergency" || item.priority === "high"
        ? "danger"
        : item.status === "completed"
          ? "success"
          : "info",
    icon: "🛠",
    href: `/maintenance/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `maintenance:${item.id}`
  }));
}

async function searchVendors(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint =
    trimmed.length > 0
      ? `/api/vendors?search=${encodeURIComponent(trimmed)}&limit=12`
      : "/api/vendors?limit=12&status=active";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: VendorRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(
        query,
        items,
        (item) => [
          item.businessName,
          item.primaryContactName ?? "",
          item.phone ?? "",
          item.email ?? "",
          item.status,
          ...item.services
        ],
        8
      )
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `vendor-${item.id}`,
    kind: "vendor",
    category: "vendors",
    label: item.businessName,
    subtitle: item.primaryContactName ?? item.phone ?? item.email,
    context: item.services.length > 0 ? item.services.join(", ") : "Vendor profile",
    badge: "Vendor",
    status: item.preferredVendor ? "Preferred" : item.status,
    statusVariant: item.status === "active" ? "success" : "neutral",
    icon: "🔧",
    href: `/vendors/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `vendor:${item.id}`
  }));
}

async function searchLeases(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint =
    trimmed.length > 0
      ? `/api/leases?search=${encodeURIComponent(trimmed)}&limit=12`
      : "/api/leases?limit=12&status=active";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: LeaseRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(
        query,
        items,
        (item) => [
          item.leaseNumber,
          item.tenantName ?? "",
          item.propertyName ?? "",
          item.unitNumber ?? "",
          item.status,
          item.renewalStatus,
          item.endDate
        ],
        8
      )
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `lease-${item.id}`,
    kind: "lease",
    category: "leases",
    label: `${item.leaseNumber}${item.tenantName ? ` · ${item.tenantName}` : ""}`,
    subtitle: item.propertyName,
    context: [item.unitNumber ? `Unit ${item.unitNumber}` : null, item.endDate ? `Ends ${item.endDate}` : null]
      .filter(Boolean)
      .join(" · ") || null,
    badge: "Lease",
    status: item.renewalStatus !== "none" ? item.renewalStatus.replaceAll("_", " ") : item.status,
    statusVariant:
      item.status === "active" ? "success" : item.status === "expired" ? "warning" : "neutral",
    icon: "📄",
    href: `/leases/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `lease:${item.id}`
  }));
}

function evaluateCapability(permissions: readonly string[], capability: string): boolean {
  if (permissions.includes(capability)) return true;
  const [namespace] = capability.split(":");
  return permissions.includes(`${namespace}:*`);
}
