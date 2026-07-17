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

  return matches.map(({ item, score }) => ({
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
    href: "/financials/charges",
    shortcut: null,
    score,
    favoriteKey: `payment:${item.id}`
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

  return matches.map(({ item, score }) => ({
    id: `applicant-${item.id}`,
    kind: "applicant",
    category: "applicants",
    label: item.preferredName || `${item.firstName} ${item.lastName}`,
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
    score,
    favoriteKey: `applicant:${item.id}`
  }));
}

async function searchScreeningCases(query: string, signal: AbortSignal): Promise<CommandCenterResult[]> {
  const response = await fetch("/api/screening", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: Array<Record<string, unknown>> };
  const items: ScreeningCaseRecord[] = (payload.items ?? []).map((row) => ({
    id: String(row["id"]),
    caseNumber: String(row["case_number"]),
    applicantId: String(row["applicant_id"]),
    status: String(row["status"]),
    resultSummary: typeof row["result_summary"] === "string" ? row["result_summary"] : null
  }));
  const matches = fuzzyFilter(
    query,
    items,
    (item) => [item.caseNumber, item.status, item.resultSummary ?? ""],
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
    statusVariant: item.status === "completed" ? "success" : item.status === "failed" ? "danger" : "info",
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
    requestNumber: String(row["request_number"]),
    applicantId: String(row["applicant_id"]),
    status: String(row["status"]),
    requestType: String(row["request_type"])
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
    context: "E-signature request",
    badge: "Signature",
    status: item.status,
    statusVariant: item.status === "signed" ? "success" : item.status === "declined" ? "danger" : "warning",
    icon: "✍",
    href: `/applicants/${item.applicantId}`,
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

function evaluateCapability(permissions: readonly string[], capability: string): boolean {
  if (permissions.includes(capability)) return true;
  const [namespace] = capability.split(":");
  return permissions.includes(`${namespace}:*`);
}
