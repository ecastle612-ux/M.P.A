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
  propertyId?: string | null;
  propertyName: string | null;
  occupancyStatus: string;
  status: string;
};

type ApplicantRecord = {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  propertyName: string | null;
  status: string;
};

type ScreeningCaseRecord = {
  id: string;
  caseNumber: string;
  applicantId: string;
  status: string;
  resultSummary: string | null;
};

type SignatureRequestRecord = {
  id: string;
  requestNumber: string;
  applicantId: string;
  status: string;
  requestType: string;
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

export const applicantsProvider: CommandCenterProvider = {
  id: "applicants",
  category: "applicants",
  sectionTitle: "Applicants",
  priority: 58,
  enabled: (context) => evaluateCapability(context.permissions, "applicant:read"),
  search: async (context) => searchApplicants(context.query, context.signal)
};

export const screeningProvider: CommandCenterProvider = {
  id: "screening",
  category: "applicants",
  sectionTitle: "Screening Cases",
  priority: 57,
  enabled: (context) => evaluateCapability(context.permissions, "screening:read"),
  search: async (context) => searchScreeningCases(context.query, context.signal)
};

export const signaturesProvider: CommandCenterProvider = {
  id: "signatures",
  category: "applicants",
  sectionTitle: "Signature Requests",
  priority: 56,
  enabled: (context) => evaluateCapability(context.permissions, "signature:read"),
  search: async (context) => searchSignatureRequests(context.query, context.signal)
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

export const facilityRecordsProvider: CommandCenterProvider = {
  id: "facility-records",
  category: "facility",
  sectionTitle: "Facility Memory",
  priority: 66,
  enabled: (context) => evaluateCapability(context.permissions, "maintenance:read"),
  search: async (context) => searchFacilityMemoryProvider(context.query, context.signal)
};

export const facilityTimelineProvider: CommandCenterProvider = {
  id: "facility-timeline",
  category: "facility",
  sectionTitle: "Timeline Events",
  priority: 67,
  enabled: (context) => evaluateCapability(context.permissions, "maintenance:read"),
  search: async (context) => searchFacilityTimeline(context.query, context.signal)
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

export const announcementsProvider: CommandCenterProvider = {
  id: "announcements",
  category: "announcements",
  sectionTitle: "Announcements",
  priority: 62,
  enabled: (context) => evaluateCapability(context.permissions, "communication:read"),
  search: async (context) => searchAnnouncements(context.query, context.signal)
};

export const messagesProvider: CommandCenterProvider = {
  id: "messages",
  category: "messages",
  sectionTitle: "Messages",
  priority: 61,
  enabled: (context) => evaluateCapability(context.permissions, "message:read"),
  search: async (context) => searchMessages(context.query, context.signal)
};

export const conversationsProvider: CommandCenterProvider = {
  id: "conversations",
  category: "conversations",
  sectionTitle: "Conversations",
  priority: 60,
  enabled: (context) => evaluateCapability(context.permissions, "message:read"),
  search: async (context) => searchConversations(context.query, context.signal)
};

export const notificationsProvider: CommandCenterProvider = {
  id: "notifications",
  category: "notifications",
  sectionTitle: "Notifications",
  priority: 59,
  enabled: (context) => evaluateCapability(context.permissions, "notification:read"),
  search: async (context) => searchNotifications(context.query, context.signal, "all")
};

export const unreadNotificationsProvider: CommandCenterProvider = {
  id: "unread-notifications",
  category: "notifications",
  sectionTitle: "Unread Notifications",
  priority: 58,
  enabled: (context) => evaluateCapability(context.permissions, "notification:read"),
  search: async (context) => {
    const query = context.query.trim().toLowerCase();
    if (query && !["unread", "notification", "notifications", "alert", "alerts"].some((term) => query.includes(term) || term.includes(query))) {
      return searchNotifications(context.query, context.signal, "unread");
    }
    return searchNotifications(context.query || " ", context.signal, "unread");
  }
};

export const alertsProvider: CommandCenterProvider = {
  id: "alerts",
  category: "alerts",
  sectionTitle: "Alerts",
  priority: 57,
  enabled: (context) => evaluateCapability(context.permissions, "notification:read"),
  search: async (context) => searchNotifications(context.query, context.signal, "critical")
};

export const emergencyNotificationsProvider: CommandCenterProvider = {
  id: "emergency-notifications",
  category: "alerts",
  sectionTitle: "Emergency Notifications",
  priority: 56,
  enabled: (context) => evaluateCapability(context.permissions, "notification:read"),
  search: async (context) => searchNotifications(context.query, context.signal, "emergency")
};

export const pushDevicesProvider: CommandCenterProvider = {
  id: "push-devices",
  category: "notifications",
  sectionTitle: "Push Registrations",
  priority: 55,
  enabled: (context) =>
    evaluateCapability(context.permissions, "notification:read") ||
    evaluateCapability(context.permissions, "communication:read"),
  search: async (context) => searchPushDevices(context.query, context.signal, "all")
};

export const pushDeviceHealthProvider: CommandCenterProvider = {
  id: "push-device-health",
  category: "notifications",
  sectionTitle: "Device Health",
  priority: 54,
  enabled: (context) =>
    evaluateCapability(context.permissions, "notification:read") ||
    evaluateCapability(context.permissions, "communication:read"),
  search: async (context) => searchPushDevices(context.query, context.signal, "health")
};

export const failedPushRegistrationsProvider: CommandCenterProvider = {
  id: "failed-push-registrations",
  category: "alerts",
  sectionTitle: "Failed Registrations",
  priority: 53,
  enabled: (context) => evaluateCapability(context.permissions, "notification:read"),
  search: async (context) => searchFailedPush(context.query, context.signal)
};

export const testNotificationHistoryProvider: CommandCenterProvider = {
  id: "test-notification-history",
  category: "notifications",
  sectionTitle: "Test Notifications",
  priority: 52,
  enabled: (context) => evaluateCapability(context.permissions, "notification:read"),
  search: async (context) => searchTestNotifications(context.query, context.signal)
};

export const rentChargesProvider: CommandCenterProvider = {
  id: "rent-charges",
  category: "rent-charges",
  sectionTitle: "Rent Charges",
  priority: 61,
  enabled: (context) => evaluateCapability(context.permissions, "financial:read"),
  search: async (context) => searchRentCharges(context.query, context.signal)
};

export const paymentsProvider: CommandCenterProvider = {
  id: "payments",
  category: "payments",
  sectionTitle: "Payments",
  priority: 60,
  enabled: (context) => evaluateCapability(context.permissions, "financial:read"),
  search: async (context) => searchPayments(context.query, context.signal)
};

export const collectionsProvider: CommandCenterProvider = {
  id: "collections",
  category: "payments",
  sectionTitle: "Collections",
  priority: 57,
  enabled: (context) => evaluateCapability(context.permissions, "financial:read"),
  search: async (context) => searchCollections(context.query, context.signal)
};

export const billingEventsProvider: CommandCenterProvider = {
  id: "billing-events",
  category: "payments",
  sectionTitle: "Billing Events",
  priority: 56,
  enabled: (context) => evaluateCapability(context.permissions, "financial:read"),
  search: async (context) => searchBillingEvents(context.query, context.signal)
};

export const expensesProvider: CommandCenterProvider = {
  id: "expenses",
  category: "expenses",
  sectionTitle: "Expenses",
  priority: 59,
  enabled: (context) => evaluateCapability(context.permissions, "financial:read"),
  search: async (context) => searchExpenses(context.query, context.signal)
};

export const ownerStatementsProvider: CommandCenterProvider = {
  id: "owner-statements",
  category: "owner-statements",
  sectionTitle: "Owner Statements",
  priority: 58,
  enabled: (context) => evaluateCapability(context.permissions, "financial:read"),
  search: async (context) => searchOwnerStatements(context.query, context.signal)
};

export const migrationJobsProvider: CommandCenterProvider = {
  id: "migration-jobs",
  category: "migration",
  sectionTitle: "Migration Jobs",
  priority: 54,
  enabled: (context) => evaluateCapability(context.permissions, "migration:read"),
  search: async (context) => searchMigrationJobs(context.query, context.signal)
};

export const migrationReviewProvider: CommandCenterProvider = {
  id: "migration-review",
  category: "migration",
  sectionTitle: "Migration Review Queue",
  priority: 53,
  enabled: (context) => evaluateCapability(context.permissions, "migration:read"),
  search: async (context) => searchMigrationReview(context.query, context.signal)
};

export const migrationHistoryProvider: CommandCenterProvider = {
  id: "migration-history",
  category: "migration",
  sectionTitle: "Migration History",
  priority: 52,
  enabled: (context) => evaluateCapability(context.permissions, "migration:read"),
  search: async (context) => searchMigrationHistory(context.query, context.signal)
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

  const results: CommandCenterResult[] = [];
  for (const { item, score } of matches.slice(0, 4)) {
    results.push({
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
      score: score + 20,
      favoriteKey: `property:${item.id}`
    });
    if (query.trim()) {
      results.push(
        actionResult({
          id: `property-${item.id}-units`,
          label: `${item.name} · Open units`,
          subtitle: "Recommended",
          href: `/units?propertyId=${encodeURIComponent(item.id)}`,
          score: score + 10,
          icon: "→"
        }),
        actionResult({
          id: `property-${item.id}-wo`,
          label: `${item.name} · Create work order`,
          subtitle: "Recommended",
          href: `/maintenance/new?propertyId=${encodeURIComponent(item.id)}`,
          score: score + 8,
          icon: "+"
        })
      );
    }
  }
  return results;
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

  const results: CommandCenterResult[] = [];
  for (const { item, score } of matches.slice(0, 4)) {
    results.push({
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
      score: score + 20,
      favoriteKey: `unit:${item.id}`
    });
    if (query.trim() && item.occupancyStatus !== "occupied") {
      const moveInHref =
        item.propertyId
          ? `/residents/move-in?propertyId=${encodeURIComponent(item.propertyId)}&unitId=${encodeURIComponent(item.id)}`
          : `/residents/move-in?unitId=${encodeURIComponent(item.id)}`;
      results.push(
        actionResult({
          id: `unit-${item.id}-move-in`,
          label: `Unit ${item.unitNumber} · Continue Move In`,
          subtitle: "Recommended",
          href: moveInHref,
          score: score + 15,
          icon: "▶"
        })
      );
    }
  }
  return results;
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

  const results: CommandCenterResult[] = [];
  for (const { item, score } of matches.slice(0, 4)) {
    const name = item.preferredName || `${item.firstName} ${item.lastName}`;
    results.push({
      id: `tenant-${item.id}`,
      kind: "tenant",
      category: "tenants",
      label: name,
      subtitle: item.email,
      context: item.propertyName,
      badge: "Resident",
      status: item.status,
      statusVariant: item.status === "active" ? "success" : "neutral",
      icon: "👤",
      href: `/tenants/${item.id}`,
      shortcut: null,
      score: score + 20,
      favoriteKey: `tenant:${item.id}`
    });
    if (trimmed) {
      results.push(
        actionResult({
          id: `tenant-${item.id}-message`,
          label: `${name} · Message Resident`,
          subtitle: "Recommended",
          href: `/communications/resident/${encodeURIComponent(item.id)}`,
          score: score + 16,
          icon: "▶"
        }),
        actionResult({
          id: `tenant-${item.id}-collect`,
          label: `${name} · Collect Rent`,
          subtitle: "Recommended",
          href: `/financials/payments/new?tenantId=${encodeURIComponent(item.id)}`,
          score: score + 15,
          icon: "▶"
        }),
        actionResult({
          id: `tenant-${item.id}-lease`,
          label: `${name} · Create Lease`,
          subtitle: "Recommended",
          href: `/leases/new?tenantId=${encodeURIComponent(item.id)}`,
          score: score + 14,
          icon: "▶"
        }),
        actionResult({
          id: `tenant-${item.id}-ledger`,
          label: `${name} · Open Ledger`,
          subtitle: "Recommended",
          href: `/financials/charges?tenantId=${encodeURIComponent(item.id)}`,
          score: score + 12,
          icon: "→"
        }),
        actionResult({
          id: `tenant-${item.id}-maintenance`,
          label: `${name} · Open Maintenance`,
          subtitle: "Recommended",
          href: `/maintenance?status=open&q=${encodeURIComponent(name)}`,
          score: score + 10,
          icon: "→"
        })
      );
    }
  }
  return results;
}

type FacilitySearchHit = {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  context: string | null;
  href: string;
  occurredAt: string | null;
  score: number;
};

type TimelineSearchItem = {
  id: string;
  title: string;
  summary: string;
  eventType: string;
  propertyId: string;
  propertyName?: string | null;
  unitNumber?: string | null;
  facilityRecordId: string | null;
  href: string | null;
  occurredAt: string;
  serviceProviderDisplayName: string | null;
};

async function searchFacilityMemoryProvider(
  query: string,
  signal: AbortSignal
): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const response = await fetch(`/api/facility/search?q=${encodeURIComponent(trimmed)}&limit=16`, {
    signal,
    cache: "no-store"
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: FacilitySearchHit[] };
  const items = payload.items ?? [];
  const results: CommandCenterResult[] = [];

  for (const item of items.slice(0, 10)) {
    const kind =
      item.kind === "timeline_event"
        ? ("timeline-event" as const)
        : item.kind === "service_provider"
          ? ("service-provider" as const)
          : item.kind === "facility_record"
            ? ("facility-record" as const)
            : item.kind === "facility_asset"
              ? ("facility-asset" as const)
              : item.kind === "property"
                ? ("property" as const)
                : item.kind === "unit"
                  ? ("unit" as const)
                  : ("maintenance" as const);

    results.push({
      id: item.id,
      kind,
      category: "facility",
      label: item.title,
      subtitle: item.subtitle,
      context: item.context,
      badge:
        item.kind === "facility_record"
          ? "Recent Repair"
          : item.kind === "facility_asset"
            ? "Asset"
            : item.kind === "timeline_event"
              ? "Timeline"
              : item.kind === "service_provider"
                ? "Service Provider"
                : item.kind === "property"
                  ? "Property History"
                  : item.kind === "work_order"
                    ? "Work Order"
                    : "Facility",
      status: item.occurredAt ? new Date(item.occurredAt).toLocaleDateString() : null,
      statusVariant: item.kind === "facility_asset" ? "info" : "success",
      icon:
        item.kind === "service_provider"
          ? "🔧"
          : item.kind === "timeline_event"
            ? "⏱"
            : item.kind === "facility_record"
              ? "🧾"
              : item.kind === "facility_asset"
                ? "⚙️"
                : "🏘",
      href: item.href,
      shortcut: null,
      score: item.score + (item.kind === "facility_asset" ? 14 : 10),
      favoriteKey: item.id
    });

    if (item.kind === "facility_asset") {
      results.push(
        actionResult({
          id: `${item.id}-repairs`,
          label: `View repair history · ${item.title}`,
          subtitle: "Asset repairs",
          href: `${item.href}#repair-history`,
          score: item.score + 12,
          icon: "🧾"
        }),
        actionResult({
          id: `${item.id}-timeline`,
          label: `View timeline · ${item.title}`,
          subtitle: "Asset timeline",
          href: `${item.href}#asset-timeline`,
          score: item.score + 11,
          icon: "⏱"
        })
      );
    }

    if (item.kind === "property") {
      results.push(
        actionResult({
          id: `${item.id}-timeline`,
          label: `${item.title} · Open Timeline`,
          subtitle: "Property history",
          href: item.href.includes("#") ? item.href : `${item.href}#property-timeline`,
          score: item.score + 8,
          icon: "⏱"
        })
      );
    }
    if (item.kind === "service_provider") {
      results.push(
        actionResult({
          id: `${item.id}-repairs`,
          label: `${item.title} · Recent repairs`,
          subtitle: "Service provider intelligence",
          href: item.href,
          score: item.score + 6,
          icon: "▶"
        })
      );
    }
  }

  return results;
}

async function searchFacilityTimeline(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const response = await fetch(
    `/api/facility/timeline?search=${encodeURIComponent(trimmed)}&limit=12`,
    { signal, cache: "no-store" }
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: TimelineSearchItem[] };
  const items = payload.items ?? [];
  return items.slice(0, 4).map((item, index) => ({
    id: `timeline-event-${item.id}`,
    kind: "timeline-event" as const,
    category: "facility" as const,
    label: item.title,
    subtitle: item.propertyName ?? null,
    context: [
      item.unitNumber ? `Unit ${item.unitNumber}` : null,
      item.serviceProviderDisplayName,
      item.summary
    ]
      .filter(Boolean)
      .join(" · ") || null,
    badge: "Timeline Event",
    status: new Date(item.occurredAt).toLocaleDateString(),
    statusVariant: "info" as const,
    icon: "⏱",
    href:
      item.href ??
      (item.facilityRecordId
        ? `/facility/records/${item.facilityRecordId}`
        : `/properties/${item.propertyId}#property-timeline`),
    shortcut: null,
    score: 28 - index,
    favoriteKey: `timeline:${item.id}`
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

  const results: CommandCenterResult[] = [];
  for (const { item, score } of matches.slice(0, 4)) {
    results.push({
      id: `maintenance-${item.id}`,
      kind: "maintenance",
      category: "maintenance",
      label: `${item.workOrderNumber} · ${item.title}`,
      subtitle: item.propertyName,
      context: [item.unitNumber ? `Unit ${item.unitNumber}` : null, item.tenantName].filter(Boolean).join(" · ") || null,
      badge: "Work Order",
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
      score: score + 20,
      favoriteKey: `maintenance:${item.id}`
    });
    if (trimmed) {
      if (item.status === "submitted" || item.status === "triaged") {
        results.push(
          actionResult({
            id: `maintenance-${item.id}-assign`,
            label: `${item.workOrderNumber} · Assign Vendor`,
            subtitle: "Recommended",
            href: `/maintenance/${item.id}#vendor`,
            score: score + 16,
            icon: "▶"
          })
        );
      } else if (item.status === "in_progress" || item.status === "on_hold") {
        results.push(
          actionResult({
            id: `maintenance-${item.id}-complete`,
            label: `${item.workOrderNumber} · Complete Work Order`,
            subtitle: "Recommended",
            href: `/maintenance/${item.id}`,
            score: score + 16,
            icon: "▶"
          })
        );
      } else {
        results.push(
          actionResult({
            id: `maintenance-${item.id}-workflow`,
            label: `${item.workOrderNumber} · Continue workflow`,
            subtitle: "Recommended",
            href: `/maintenance/${item.id}`,
            score: score + 12,
            icon: "▶"
          })
        );
      }
    }
  }
  return results;
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

  const results: CommandCenterResult[] = [];
  for (const { item, score } of matches.slice(0, 4)) {
    results.push({
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
      score: score + 20,
      favoriteKey: `vendor:${item.id}`
    });
    if (trimmed) {
      results.push(
        actionResult({
          id: `vendor-${item.id}-assign-queue`,
          label: `${item.businessName} · Assign to unassigned WO`,
          subtitle: "Recommended",
          href: "/maintenance?status=unassigned",
          score: score + 12,
          icon: "▶"
        })
      );
    }
  }
  return results;
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

  const results: CommandCenterResult[] = [];
  for (const { item, score } of matches.slice(0, 4)) {
    results.push({
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
      score: score + 20,
      favoriteKey: `lease:${item.id}`
    });
    if (trimmed && item.status === "draft") {
      results.push(
        actionResult({
          id: `lease-${item.id}-sign`,
          label: `${item.leaseNumber} · Continue Lease Signing`,
          subtitle: "Recommended",
          href: `/leases/${item.id}`,
          score: score + 16,
          icon: "▶"
        })
      );
    }
  }
  return results;
}

type AnnouncementRecord = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  propertyName?: string | null;
};

type ThreadSearchRecord = {
  id: string;
  subject: string;
  status: string;
  threadType: string;
  propertyName?: string | null;
  lastMessagePreview?: string | null;
};

async function searchConversations(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint = trimmed
    ? `/api/messaging/threads?search=${encodeURIComponent(trimmed)}&limit=12`
    : "/api/messaging/threads?limit=12&status=unread";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: ThreadSearchRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(query, items, (item) => [item.subject, item.threadType, item.status, item.propertyName ?? "", item.lastMessagePreview ?? ""], 8)
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `conversation-${item.id}`,
    kind: "conversation",
    category: "conversations",
    label: item.subject,
    subtitle: item.threadType.replaceAll("_", " "),
    context: item.propertyName ?? "Workflow conversation",
    badge: "Conversation",
    status: item.status,
    statusVariant: item.status === "unread" ? "warning" : "neutral",
    icon: "💬",
    href: `/communications/threads/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `conversation:${item.id}`
  }));
}

async function searchMessages(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return searchConversations("", signal);
  const response = await fetch(`/api/messaging/threads?search=${encodeURIComponent(trimmed)}&limit=12`, {
    signal,
    cache: "no-store"
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: ThreadSearchRecord[] };
  const items = payload.items ?? [];
  const matches = fuzzyFilter(
    query,
    items,
    (item) => [item.subject, item.lastMessagePreview ?? "", item.propertyName ?? ""],
    8
  );

  return matches.map(({ item, score }) => ({
    id: `message-thread-${item.id}`,
    kind: "message",
    category: "messages",
    label: item.lastMessagePreview ? item.lastMessagePreview.slice(0, 80) : item.subject,
    subtitle: item.subject,
    context: item.propertyName ?? "Message thread",
    badge: "Message",
    status: item.status,
    statusVariant: item.status === "unread" ? "warning" : "info",
    icon: "✉",
    href: `/communications/threads/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `message-thread:${item.id}`
  }));
}

async function searchAnnouncements(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint =
    trimmed.length > 0
      ? `/api/announcements?search=${encodeURIComponent(trimmed)}&limit=12`
      : "/api/announcements?limit=12&status=published";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: AnnouncementRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(query, items, (item) => [item.title, item.status, item.priority, item.category], 8)
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `announcement-${item.id}`,
    kind: "announcement",
    category: "announcements",
    label: item.title,
    subtitle: item.category,
    context: item.propertyName ?? "Resident communication",
    badge: "Announcement",
    status: item.status,
    statusVariant: item.priority === "emergency" ? "danger" : item.status === "published" ? "success" : "neutral",
    icon: "📣",
    href: `/communications/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `announcement:${item.id}`
  }));
}

type NotificationSearchRecord = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  href: string | null;
  readAt: string | null;
  pushDeliveryStatus?: string | null;
  pushLastError?: string | null;
};

async function searchNotifications(
  query: string,
  signal: AbortSignal,
  mode: "all" | "unread" | "critical" | "emergency"
): Promise<CommandCenterResult[]> {
  const params = new URLSearchParams({ limit: "20" });
  if (mode === "unread") params.set("unreadOnly", "true");
  if (mode === "critical") params.set("priority", "critical");
  if (mode === "emergency") params.set("priority", "emergency");
  const trimmed = query.trim();
  if (trimmed && trimmed !== " ") params.set("q", trimmed);

  const response = await fetch(`/api/notifications?${params.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: NotificationSearchRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed && trimmed !== " "
    ? fuzzyFilter(query, items, (item) => [item.title, item.body, item.category, item.priority], 8)
    : items.slice(0, 8).map((item) => ({ item, score: mode === "emergency" ? 3 : mode === "unread" ? 2 : 1 }));

  return matches.map(({ item, score }) => {
    const isEmergency = item.priority === "emergency" || item.category === "emergency";
    const unreadBoost = item.readAt ? 0 : 1;
    return {
      id: `notification-${item.id}`,
      kind: isEmergency || mode === "critical" || mode === "emergency" ? ("alert" as const) : ("notification" as const),
      category: isEmergency || mode === "critical" || mode === "emergency" ? ("alerts" as const) : ("notifications" as const),
      label: item.title,
      subtitle: item.body.slice(0, 80),
      context: `${item.category} · ${item.priority}`,
      badge: isEmergency ? "Emergency" : item.readAt ? "Notification" : "Unread",
      status: item.priority,
      statusVariant: isEmergency ? ("danger" as const) : item.readAt ? ("neutral" as const) : ("warning" as const),
      icon: isEmergency ? "🚨" : "🔔",
      href: item.href ?? "/dashboard#todays-work",
      shortcut: null,
      score: score + unreadBoost + (isEmergency ? 2 : 0),
      favoriteKey: `notification:${item.id}`
    };
  });
}

type OrgDeviceRecord = {
  id: string;
  userId: string;
  platform: string;
  deviceLabel: string | null;
  externalSubscriptionId: string | null;
  providerKey: string;
  isActive: boolean;
  enrolledVia: string;
  lastRegistrationAt: string;
  hasSubscription: boolean;
};

async function searchPushDevices(
  query: string,
  signal: AbortSignal,
  mode: "all" | "health"
): Promise<CommandCenterResult[]> {
  const trimmed = query.trim().toLowerCase();
  const intent =
    !trimmed ||
    ["push", "device", "devices", "registration", "subscription", "enroll", "onesignal", "health", "active", "inactive"].some(
      (term) => trimmed.includes(term) || term.includes(trimmed)
    );
  if (!intent && mode === "health") return [];

  const params = new URLSearchParams();
  if (trimmed) params.set("q", trimmed);
  const response = await fetch(`/api/notifications/devices/org?${params.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { devices?: OrgDeviceRecord[] };
  let items = payload.devices ?? [];
  if (mode === "health") {
    items = items.filter((device) => !device.isActive || !device.hasSubscription);
  }
  const matches = trimmed
    ? fuzzyFilter(
        query,
        items,
        (item) => [item.deviceLabel ?? "", item.platform, item.enrolledVia, item.isActive ? "active" : "inactive"],
        8
      )
    : items.slice(0, 8).map((item) => ({ item, score: item.isActive ? 1 : 2 }));

  return matches.map(({ item, score }) => {
    const unhealthy = !item.isActive || !item.hasSubscription;
    return {
      id: `push-device-${item.id}`,
      kind: "notification" as const,
      category: "notifications" as const,
      label: item.deviceLabel ?? `${item.platform} device`,
      subtitle: `${item.platform} · ${item.enrolledVia}`,
      context: item.hasSubscription ? "Subscribed" : "Missing subscription",
      badge: unhealthy ? "Device health" : "Push device",
      status: item.isActive ? "active" : "inactive",
      statusVariant: unhealthy ? ("warning" as const) : ("success" as const),
      icon: "📱",
      href: "/settings/notifications",
      shortcut: null,
      score: score + (unhealthy ? 2 : 0),
      favoriteKey: `push-device:${item.id}`
    };
  });
}

async function searchFailedPush(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (
    trimmed &&
    !["fail", "failed", "registration", "push", "device", "subscription", "error"].some(
      (term) => trimmed.includes(term)
    )
  ) {
    return [];
  }
  const params = new URLSearchParams({ limit: "20", q: trimmed || " " });
  const response = await fetch(`/api/notifications?${params.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: NotificationSearchRecord[] };
  const failed = (payload.items ?? []).filter(
    (item) => item.pushDeliveryStatus === "failed" || item.title.toLowerCase().includes("registration")
  );
  return failed.slice(0, 8).map((item, index) => ({
    id: `failed-push-${item.id}`,
    kind: "alert" as const,
    category: "alerts" as const,
    label: item.title,
    subtitle: item.pushLastError ?? item.body.slice(0, 80),
    context: "Failed push / registration",
    badge: "Failed",
    status: "failed",
    statusVariant: "danger" as const,
    icon: "⚠",
    href: item.href ?? "/settings/notifications",
    shortcut: null,
    score: 3 - index * 0.1,
    favoriteKey: `failed-push:${item.id}`
  }));
}

async function searchTestNotifications(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed && !["test", "push", "notification", "verify"].some((term) => trimmed.includes(term))) {
    return [];
  }
  const params = new URLSearchParams({ limit: "20", q: "Test notification" });
  const response = await fetch(`/api/notifications?${params.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: NotificationSearchRecord[] };
  const items = (payload.items ?? []).filter(
    (item) => item.title.toLowerCase().includes("test") || item.category === "system"
  );
  return items.slice(0, 8).map((item, index) => ({
    id: `test-notification-${item.id}`,
    kind: "notification" as const,
    category: "notifications" as const,
    label: item.title,
    subtitle: item.body.slice(0, 80),
    context: "Test notification history",
    badge: "Test",
    status: item.pushDeliveryStatus ?? "unknown",
    statusVariant: item.pushDeliveryStatus === "sent" ? ("success" as const) : ("neutral" as const),
    icon: "🧪",
    href: item.href ?? "/settings/notifications",
    shortcut: null,
    score: 2 - index * 0.1,
    favoriteKey: `test-notification:${item.id}`
  }));
}

type RentChargeRecord = {
  id: string;
  chargeNumber: string;
  description: string;
  status: string;
  amount: number;
  tenantName?: string | null;
  propertyName?: string | null;
  dueDate: string;
};

type PaymentRecord = {
  id: string;
  paymentNumber: string;
  amount: number;
  status: string;
  paymentDate: string;
  tenantId?: string | null;
  rentChargeId?: string | null;
};

type ExpenseRecord = {
  id: string;
  expenseNumber: string;
  description: string;
  amount: number;
  status: string;
  category: string;
  propertyName?: string | null;
  expenseDate: string;
};

type OwnerStatementRecord = {
  id: string;
  statementNumber: string;
  status: string;
  propertyName?: string | null;
  statementPeriodStart: string;
  statementPeriodEnd: string;
  netIncome: number;
};

async function searchRentCharges(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint = trimmed
    ? `/api/rent-charges?search=${encodeURIComponent(trimmed)}&limit=12`
    : "/api/rent-charges?limit=12";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: RentChargeRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(query, items, (item) => [item.chargeNumber, item.description, item.status, item.tenantName ?? "", item.propertyName ?? ""], 8)
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `rent-charge-${item.id}`,
    kind: "rent-charge",
    category: "rent-charges",
    label: item.description,
    subtitle: item.chargeNumber,
    context: [item.tenantName, item.propertyName].filter(Boolean).join(" · ") || "Rent charge",
    badge: "Rent",
    status: item.status,
    statusVariant: item.status === "overdue" ? "danger" : item.status === "paid" ? "success" : "warning",
    icon: "💵",
    href: `/financials/charges/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `rent-charge:${item.id}`
  }));
}

async function searchPayments(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint = trimmed
    ? `/api/payments?search=${encodeURIComponent(trimmed)}&limit=12`
    : "/api/payments?limit=12";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: PaymentRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(query, items, (item) => [item.paymentNumber, item.status, String(item.amount), item.paymentDate], 8)
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => {
    const href = item.rentChargeId
      ? `/financials/charges/${item.rentChargeId}`
      : item.tenantId
        ? `/financials/charges?tenantId=${encodeURIComponent(item.tenantId)}`
        : "/financials/charges";
    return {
      id: `payment-${item.id}`,
      kind: "payment",
      category: "payments",
      label: item.paymentNumber,
      subtitle: `$${item.amount.toFixed(2)}`,
      context: item.paymentDate,
      badge: "Payment",
      status: item.status,
      statusVariant: item.status === "completed" ? "success" : "neutral",
      icon: "💳",
      href,
      shortcut: null,
      score,
      favoriteKey: `payment:${item.id}`
    };
  });
}

async function searchCollections(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/billing?collections=1", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    items?: Array<{
      tenantId: string;
      tenantName: string;
      outstandingBalance: number;
      status: string;
      overdueChargeCount: number;
    }>;
  };
  const items = payload.items ?? [];
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? items.filter(
        (item) =>
          item.tenantName.toLowerCase().includes(trimmed) ||
          item.status.toLowerCase().includes(trimmed) ||
          item.tenantId.includes(trimmed)
      )
    : items;
  return filtered.slice(0, 8).map((item, index) => ({
    id: `collection-${item.tenantId}`,
    kind: "payment",
    category: "payments",
    label: item.tenantName,
    subtitle: `$${item.outstandingBalance.toFixed(2)} outstanding`,
    context: `${item.status} · ${item.overdueChargeCount} overdue`,
    badge: "Collections",
    status: item.status,
    statusVariant: "danger" as const,
    icon: "⚠️",
    href: `/tenants/${item.tenantId}`,
    shortcut: null,
    score: 1 - index * 0.01,
    favoriteKey: `collection:${item.tenantId}`
  }));
}

async function searchBillingEvents(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/billing?ops=1", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    ops?: {
      todaysPaymentsCount: number;
      failedPaymentsCount: number;
      outstandingBalance: number;
      collectionsQueueCount: number;
      autopayEnrollmentPercent: number;
      processingHealth: string;
      awaitingReconciliationCount: number;
      provider: string;
    };
  };
  const ops = payload.ops;
  if (!ops) return [];
  const rows = [
    {
      id: "billing-today",
      label: "Today's payments",
      subtitle: String(ops.todaysPaymentsCount),
      status: ops.processingHealth
    },
    {
      id: "billing-failed",
      label: "Failed payments",
      subtitle: String(ops.failedPaymentsCount),
      status: ops.failedPaymentsCount > 0 ? "attention" : "ok"
    },
    {
      id: "billing-outstanding",
      label: "Outstanding balance",
      subtitle: `$${ops.outstandingBalance.toFixed(2)}`,
      status: "open"
    },
    {
      id: "billing-collections",
      label: "Collections queue",
      subtitle: String(ops.collectionsQueueCount),
      status: "queue"
    },
    {
      id: "billing-autopay",
      label: "AutoPay enrollment",
      subtitle: `${ops.autopayEnrollmentPercent}%`,
      status: ops.provider
    },
    {
      id: "billing-reconcile",
      label: "Awaiting reconciliation",
      subtitle: String(ops.awaitingReconciliationCount),
      status: ops.awaitingReconciliationCount > 0 ? "awaiting_reconciliation" : "clear"
    }
  ];
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? rows.filter((row) => row.label.toLowerCase().includes(trimmed) || row.status.toLowerCase().includes(trimmed))
    : rows;
  return filtered.map((row, index) => ({
    id: row.id,
    kind: "payment" as const,
    category: "payments" as const,
    label: row.label,
    subtitle: row.subtitle,
    context: `Provider ${ops.provider}`,
    badge: "Billing",
    status: row.status,
    statusVariant: "neutral" as const,
    icon: "📊",
    href: "/financials",
    shortcut: null,
    score: 1 - index * 0.01,
    favoriteKey: `billing-event:${row.id}`
  }));
}

async function searchExpenses(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint = trimmed
    ? `/api/expenses?search=${encodeURIComponent(trimmed)}&limit=12`
    : "/api/expenses?limit=12";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: ExpenseRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(query, items, (item) => [item.expenseNumber, item.description, item.category, item.propertyName ?? "", item.status], 8)
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `expense-${item.id}`,
    kind: "expense",
    category: "expenses",
    label: item.description,
    subtitle: item.category,
    context: item.propertyName ?? "Property expense",
    badge: "Expense",
    status: item.status,
    statusVariant: item.status === "paid" ? "success" : "neutral",
    icon: "🧾",
    href: "/financials/expenses",
    shortcut: null,
    score,
    favoriteKey: `expense:${item.id}`
  }));
}

async function searchOwnerStatements(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint = trimmed
    ? `/api/owner-statements?search=${encodeURIComponent(trimmed)}&limit=12`
    : "/api/owner-statements?limit=12";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: OwnerStatementRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(query, items, (item) => [item.statementNumber, item.status, item.propertyName ?? ""], 8)
    : items.slice(0, 8).map((item) => ({ item, score: 1 }));

  return matches.map(({ item, score }) => ({
    id: `owner-statement-${item.id}`,
    kind: "owner-statement",
    category: "owner-statements",
    label: item.statementNumber,
    subtitle: item.propertyName ?? "Owner statement",
    context: `${item.statementPeriodStart} – ${item.statementPeriodEnd}`,
    badge: "Statement",
    status: item.status,
    statusVariant: item.status === "generated" || item.status === "sent" ? "success" : "neutral",
    icon: "📊",
    href: `/financials/owner-statements/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `owner-statement:${item.id}`
  }));
}

async function searchApplicants(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const trimmed = query.trim();
  const endpoint =
    trimmed.length > 0
      ? `/api/applicants?search=${encodeURIComponent(trimmed)}&limit=12`
      : "/api/applicants?limit=12";
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: ApplicantRecord[] };
  const items = payload.items ?? [];
  const matches = trimmed
    ? fuzzyFilter(
        query,
        items,
        (item) => [
          item.applicationNumber,
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

  const results: CommandCenterResult[] = [];
  for (const { item, score } of matches.slice(0, 4)) {
    const name = item.preferredName || `${item.firstName} ${item.lastName}`;
    results.push({
      id: `applicant-${item.id}`,
      kind: "applicant",
      category: "applicants",
      label: name,
      subtitle: `${item.applicationNumber} · ${item.email}`,
      context: item.propertyName,
      badge: "Applicant",
      status: item.status.replaceAll("_", " "),
      statusVariant:
        item.status === "approved" || item.status === "converted_to_resident"
          ? "success"
          : item.status === "declined"
            ? "danger"
            : "neutral",
      icon: "📋",
      href: `/applicants/${item.id}`,
      shortcut: null,
      score: score + 20,
      favoriteKey: `applicant:${item.id}`
    });
    if (trimmed) {
      if (item.status === "approved") {
        results.push(
          actionResult({
            id: `applicant-${item.id}-move-in`,
            label: `${name} · Continue Move In`,
            subtitle: "Recommended",
            href: `/residents/move-in?applicantId=${encodeURIComponent(item.id)}`,
            score: score + 16,
            icon: "▶"
          })
        );
      } else {
        results.push(
          actionResult({
            id: `applicant-${item.id}-review`,
            label: `${name} · Continue Applicant Review`,
            subtitle: "Recommended",
            href: `/applicants/${item.id}`,
            score: score + 14,
            icon: "▶"
          })
        );
      }
    }
  }
  return results;
}

async function searchScreeningCases(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/screening", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: Array<Record<string, unknown>> };
  const items: ScreeningCaseRecord[] = (payload.items ?? []).map((row) => ({
    id: String(row["id"]),
    caseNumber: String(row["caseNumber"] ?? row["case_number"] ?? ""),
    applicantId: String(row["applicantId"] ?? row["applicant_id"] ?? ""),
    status: String(row["status"]),
    resultSummary:
      typeof row["resultSummary"] === "string"
        ? row["resultSummary"]
        : typeof row["result_summary"] === "string"
          ? row["result_summary"]
          : null
  }));
  const matches = fuzzyFilter(
    query,
    items,
    (item) => [item.caseNumber, item.status, item.resultSummary ?? "", item.applicantId],
    8
  );

  return matches.map(({ item, score }) => ({
    id: `screening-${item.id}`,
    kind: "applicant",
    category: "applicants",
    label: item.caseNumber,
    subtitle: item.resultSummary ?? "Screening case",
    context: "Background screening",
    badge: "Screening",
    status: item.status.replaceAll("_", " "),
    statusVariant:
      item.status === "approved" || item.status === "ready_for_review"
        ? "success"
        : item.status === "failed" || item.status === "rejected"
          ? "danger"
          : "info",
    icon: "🔍",
    href: `/applicants/${item.applicantId}`,
    shortcut: null,
    score,
    favoriteKey: `screening:${item.id}`
  }));
}

async function searchSignatureRequests(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/signatures", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: Array<Record<string, unknown>> };
  const items: SignatureRequestRecord[] = (payload.items ?? []).map((row) => ({
    id: String(row["id"]),
    requestNumber: String(row["requestNumber"] ?? row["request_number"] ?? ""),
    applicantId: String(row["applicantId"] ?? row["applicant_id"] ?? ""),
    status: String(row["status"]),
    requestType: String(row["requestType"] ?? row["request_type"] ?? "")
  }));
  const matches = fuzzyFilter(
    query,
    items,
    (item) => [item.requestNumber, item.status, item.requestType],
    8
  );

  return matches.map(({ item, score }) => ({
    id: `signature-${item.id}`,
    kind: "applicant",
    category: "applicants",
    label: item.requestNumber,
    subtitle: item.requestType.replaceAll("_", " "),
    context: "E-signature package",
    badge: "Signature",
    status: item.status,
    statusVariant:
      item.status === "completed" || item.status === "signed"
        ? "success"
        : item.status === "declined" || item.status === "failed"
          ? "danger"
          : "warning",
    icon: "✍",
    href: item.applicantId ? `/applicants/${item.applicantId}` : "/leases",
    shortcut: null,
    score,
    favoriteKey: `signature:${item.id}`
  }));
}

async function searchMigrationJobs(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/migration/jobs", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    items?: Array<{ id: string; jobNumber: string; name: string; status: string; completionPct: number }>;
  };
  const items = payload.items ?? [];
  const matches = fuzzyFilter(query, items, (item) => [item.name, item.jobNumber, item.status], 8);
  return matches.map(({ item, score }) => ({
    id: `migration-job-${item.id}`,
    kind: "migration",
    category: "migration",
    label: item.name,
    subtitle: item.jobNumber,
    context: "Migration job",
    badge: "Migration",
    status: item.status.replaceAll("_", " "),
    statusVariant: item.status === "completed" ? "success" : item.status === "failed" ? "danger" : "info",
    icon: "📦",
    href: `/migration/${item.id}`,
    shortcut: null,
    score,
    favoriteKey: `migration-job:${item.id}`
  }));
}

async function searchMigrationReview(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const jobsResponse = await fetch("/api/migration/jobs", { signal, cache: "no-store" });
  if (!jobsResponse.ok) return [];
  const jobsPayload = (await jobsResponse.json()) as { items?: Array<{ id: string; jobNumber: string }> };
  const results: CommandCenterResult[] = [];

  for (const job of (jobsPayload.items ?? []).slice(0, 5)) {
    const response = await fetch(`/api/migration/jobs/${job.id}/review`, { signal, cache: "no-store" });
    if (!response.ok) continue;
    const payload = (await response.json()) as {
      items?: Array<{ id: string; title: string; itemType: string; status: string }>;
    };
    const pending = (payload.items ?? []).filter((item) => item.status === "pending");
    const matches = fuzzyFilter(query, pending, (item) => [item.title, item.itemType, item.status], 4);
    results.push(
      ...matches.map(({ item, score }) => ({
        id: `migration-review-${item.id}`,
        kind: "migration" as const,
        category: "migration" as const,
        label: item.title,
        subtitle: job.jobNumber,
        context: item.itemType.replaceAll("_", " "),
        badge: "Review",
        status: "pending",
        statusVariant: "warning" as const,
        icon: "⚠",
        href: `/migration/${job.id}?step=review_exceptions`,
        shortcut: null,
        score,
        favoriteKey: `migration-review:${item.id}`
      }))
    );
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

async function searchMigrationHistory(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/migration/dashboard", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    metrics?: {
      recentActivity?: Array<{ id: string; jobId: string; jobNumber: string; summary: string; eventType: string }>;
    };
  };
  const items = payload.metrics?.recentActivity ?? [];
  const matches = fuzzyFilter(query, items, (item) => [item.summary, item.jobNumber, item.eventType], 8);
  return matches.map(({ item, score }) => ({
    id: `migration-history-${item.id}`,
    kind: "migration",
    category: "migration",
    label: item.summary,
    subtitle: item.jobNumber,
    context: "Migration activity",
    badge: "History",
    status: item.eventType.replaceAll("_", " "),
    statusVariant: "neutral",
    icon: "🕘",
    href: `/migration/${item.jobId}`,
    shortcut: null,
    score,
    favoriteKey: `migration-history:${item.id}`
  }));
}

function actionResult(args: {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  score: number;
  icon: string;
}): CommandCenterResult {
  return {
    id: args.id,
    kind: "action",
    category: "actions",
    label: args.label,
    subtitle: args.subtitle,
    context: "Recommended next step",
    badge: "Action",
    status: "Next",
    statusVariant: "info",
    icon: args.icon,
    href: args.href,
    shortcut: null,
    score: args.score,
    favoriteKey: `action:${args.id}`
  };
}

function evaluateCapability(permissions: readonly string[], capability: string): boolean {
  if (permissions.includes(capability)) return true;
  const [namespace] = capability.split(":");
  return permissions.includes(`${namespace}:*`);
}
