/**
 * MA-6 — Platform Operations pure helpers (read-only).
 * Reuses MA-2 WO/vendor status buckets. Overdue = due_at < now when due_at present.
 * Do not invent SLA age thresholds.
 */

import { scrubUnknown } from "../observability/scrub";
import { parseErrorTimeRange } from "./platform-errors";
import type { HealthTone } from "./command-center-metrics";

export type Ma6DiagTone = "healthy" | "attention" | "unknown";

export type Ma6Anomaly = {
  code: string;
  severity: "attention" | "info";
  reason: string;
  organizationId: string | null;
  objectType: string;
  objectId: string;
  at: string | null;
  href?: string;
};

export const OPEN_WO_STATUSES = new Set(["submitted", "triaged", "assigned"]);
export const IN_PROGRESS_WO_STATUSES = new Set(["in_progress"]);
export const COMPLETED_WO_STATUSES = new Set(["completed", "closed"]);
export const CANCELLED_WO_STATUSES = new Set(["cancelled"]);
export const TERMINAL_WO_STATUSES = new Set([...COMPLETED_WO_STATUSES, ...CANCELLED_WO_STATUSES]);

export type Ma6WorkOrderRow = {
  id: string;
  organizationId: string;
  organizationName: string | null;
  propertyId: string | null;
  propertyName: string | null;
  unitId: string | null;
  unitLabel: string | null;
  title: string;
  status: string;
  priority: string;
  assigneeType: string | null;
  technicianUserId: string | null;
  vendorId: string | null;
  vendorName: string | null;
  workSurface: string | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  ageDays: number | null;
  overdue: boolean;
  unassigned: boolean;
  health: Ma6DiagTone;
};

export type Ma6PropertyRow = {
  id: string;
  organizationId: string;
  organizationName: string | null;
  name: string;
  status: string;
  unitCount: number;
};

export type Ma6UnitRow = {
  id: string;
  organizationId: string;
  organizationName: string | null;
  propertyId: string;
  propertyName: string | null;
  unitLabel: string;
  status: string;
};

export type Ma6VendorRow = {
  id: string;
  organizationId: string;
  organizationName: string | null;
  name: string;
  status: string;
  email: string | null;
  phone: string | null;
  outstandingWorkOrders: number;
  health: Ma6DiagTone;
};

export type Ma6NotificationRow = {
  id: string;
  organizationId: string;
  organizationName: string | null;
  notificationKey: string | null;
  title: string;
  channel: string | null;
  emailDeliveryStatus: string | null;
  emailDeliveryError: string | null;
  workOrderId: string | null;
  createdAt: string;
  emailAttemptedAt: string | null;
  health: Ma6DiagTone;
};

export type Ma6OrgOpsRow = {
  organizationId: string;
  organizationName: string;
  propertyCount: number;
  unitCount: number;
  openWorkOrders: number;
  overdueWorkOrders: number;
  inProgressWorkOrders: number;
  vendorCount: number;
  notificationFailures: number;
  anomalyCount: number;
  health: Ma6DiagTone;
};

export type Ma6OpsFilters = {
  q?: string;
  organizationId?: string;
  status?: string;
  priority?: string;
  propertyId?: string;
  vendorId?: string;
  overdue?: "yes" | "no";
  assigned?: "assigned" | "unassigned";
  channel?: string;
  workSurface?: string;
  range?: string;
  since?: string;
  rangeLabel?: string;
  page: number;
  pageSize: number;
};

export type Ma6Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

const DEFAULT_PAGE = 50;
const MAX_PAGE = 100;

function getParam(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export function parseOpsFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Ma6OpsFilters {
  const pageRaw = Number(getParam(params, "page") ?? "1");
  const sizeRaw = Number(getParam(params, "pageSize") ?? String(DEFAULT_PAGE));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(sizeRaw)
    ? Math.min(MAX_PAGE, Math.max(1, Math.floor(sizeRaw)))
    : DEFAULT_PAGE;

  const range = getParam(params, "range") ?? "7d";
  const parsedRange = parseErrorTimeRange(range);
  const out: Ma6OpsFilters = { page, pageSize, range, rangeLabel: parsedRange.label };
  if (parsedRange.since) out.since = parsedRange.since;

  const q = getParam(params, "q")?.trim();
  const organizationId = getParam(params, "organizationId")?.trim();
  const status = getParam(params, "status")?.trim();
  const priority = getParam(params, "priority")?.trim();
  const propertyId = getParam(params, "propertyId")?.trim();
  const vendorId = getParam(params, "vendorId")?.trim();
  const overdue = getParam(params, "overdue")?.trim();
  const assigned = getParam(params, "assigned")?.trim();
  const channel = getParam(params, "channel")?.trim();
  const workSurface = getParam(params, "workSurface")?.trim();

  if (q) out.q = q;
  if (organizationId) out.organizationId = organizationId;
  if (status) out.status = status;
  if (priority) out.priority = priority;
  if (propertyId) out.propertyId = propertyId;
  if (vendorId) out.vendorId = vendorId;
  if (overdue === "yes" || overdue === "no") out.overdue = overdue;
  if (assigned === "assigned" || assigned === "unassigned") out.assigned = assigned;
  if (channel) out.channel = channel;
  if (workSurface) out.workSurface = workSurface;
  return out;
}

export function paginationMeta(total: number, page: number, pageSize: number): Ma6Pagination {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasMore: safePage < totalPages
  };
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function scrubMa6Payload(payload: unknown): Record<string, unknown> {
  const scrubbed = scrubUnknown(payload ?? {});
  if (scrubbed && typeof scrubbed === "object" && !Array.isArray(scrubbed)) {
    return scrubbed as Record<string, unknown>;
  }
  return {};
}

export function ageInDays(fromIso: string | null | undefined, nowMs = Date.now()): number | null {
  if (!fromIso) return null;
  const t = Date.parse(fromIso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / (24 * 60 * 60 * 1000)));
}

export function isWorkOrderOpen(status: string): boolean {
  return OPEN_WO_STATUSES.has(status) || IN_PROGRESS_WO_STATUSES.has(status);
}

/** Authoritative overdue: due_at present and past, and WO not terminal. */
export function isWorkOrderOverdue(
  status: string,
  dueAt: string | null | undefined,
  nowMs = Date.now()
): boolean {
  if (!dueAt || TERMINAL_WO_STATUSES.has(status)) return false;
  const due = Date.parse(dueAt);
  if (!Number.isFinite(due)) return false;
  return due < nowMs;
}

export function isWorkOrderUnassigned(status: string, assigneeType: string | null | undefined): boolean {
  if (TERMINAL_WO_STATUSES.has(status)) return false;
  return !assigneeType || assigneeType === "unassigned";
}

export function mapWorkOrderRow(input: {
  id: string;
  organization_id: string;
  organization_name?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  unit_id?: string | null;
  unit_label?: string | null;
  title: string;
  status: string;
  priority: string;
  assignee_type?: string | null;
  technician_user_id?: string | null;
  vendor_id?: string | null;
  vendor_name?: string | null;
  work_surface?: string | null;
  created_at: string;
  updated_at: string;
  due_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  nowMs?: number;
}): Ma6WorkOrderRow {
  const nowMs = input.nowMs ?? Date.now();
  const overdue = isWorkOrderOverdue(input.status, input.due_at, nowMs);
  const unassigned = isWorkOrderUnassigned(input.status, input.assignee_type);
  let health: Ma6DiagTone = "healthy";
  if (isWorkOrderOpen(input.status) && (overdue || unassigned)) health = "attention";
  if (!input.status) health = "unknown";

  return {
    id: input.id,
    organizationId: input.organization_id,
    organizationName: input.organization_name ?? null,
    propertyId: input.property_id ?? null,
    propertyName: input.property_name ?? null,
    unitId: input.unit_id ?? null,
    unitLabel: input.unit_label ?? null,
    title: input.title,
    status: input.status,
    priority: input.priority,
    assigneeType: input.assignee_type ?? null,
    technicianUserId: input.technician_user_id ?? null,
    vendorId: input.vendor_id ?? null,
    vendorName: input.vendor_name ?? null,
    workSurface: input.work_surface ?? null,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    dueAt: input.due_at ?? null,
    completedAt: input.completed_at ?? null,
    cancelledAt: input.cancelled_at ?? null,
    ageDays: ageInDays(input.created_at, nowMs),
    overdue,
    unassigned,
    health
  };
}

export function filterWorkOrders(rows: Ma6WorkOrderRow[], filters: Ma6OpsFilters): Ma6WorkOrderRow[] {
  const q = filters.q?.toLowerCase();
  return rows.filter((row) => {
    if (filters.since && row.createdAt < filters.since) return false;
    if (filters.organizationId && row.organizationId !== filters.organizationId) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.priority && row.priority !== filters.priority) return false;
    if (filters.propertyId && row.propertyId !== filters.propertyId) return false;
    if (filters.vendorId && row.vendorId !== filters.vendorId) return false;
    if (filters.workSurface && row.workSurface !== filters.workSurface) return false;
    if (filters.overdue === "yes" && !row.overdue) return false;
    if (filters.overdue === "no" && row.overdue) return false;
    if (filters.assigned === "unassigned" && !row.unassigned) return false;
    if (filters.assigned === "assigned" && row.unassigned) return false;
    if (q) {
      const hay = [
        row.id,
        row.title,
        row.organizationId,
        row.organizationName ?? "",
        row.propertyName ?? "",
        row.unitLabel ?? "",
        row.vendorName ?? ""
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function mapNotificationRow(input: {
  id: string;
  organization_id: string;
  organization_name?: string | null;
  notification_key?: string | null;
  title: string;
  channel?: string | null;
  email_delivery_status?: string | null;
  email_delivery_error?: string | null;
  work_order_id?: string | null;
  created_at: string;
  email_attempted_at?: string | null;
}): Ma6NotificationRow {
  const status = input.email_delivery_status ?? null;
  let health: Ma6DiagTone = "unknown";
  if (status === "failed") health = "attention";
  else if (status === "sent" || status === "skipped_no_email" || status === "skipped_not_configured") {
    health = "healthy";
  } else if (status === "queued") health = "attention";
  else if (status == null) health = "unknown";

  return {
    id: input.id,
    organizationId: input.organization_id,
    organizationName: input.organization_name ?? null,
    notificationKey: input.notification_key ?? null,
    title: input.title,
    channel: input.channel ?? null,
    emailDeliveryStatus: status,
    emailDeliveryError: input.email_delivery_error
      ? String(scrubMa6Payload({ e: input.email_delivery_error })["e"] ?? input.email_delivery_error)
      : null,
    workOrderId: input.work_order_id ?? null,
    createdAt: input.created_at,
    emailAttemptedAt: input.email_attempted_at ?? null,
    health
  };
}

export function filterNotifications(
  rows: Ma6NotificationRow[],
  filters: Ma6OpsFilters
): Ma6NotificationRow[] {
  const q = filters.q?.toLowerCase();
  return rows.filter((row) => {
    if (filters.since && row.createdAt < filters.since) return false;
    if (filters.organizationId && row.organizationId !== filters.organizationId) return false;
    if (filters.status && row.emailDeliveryStatus !== filters.status) return false;
    if (filters.channel && row.channel !== filters.channel) return false;
    if (q) {
      const hay = `${row.id} ${row.title} ${row.organizationId} ${row.organizationName ?? ""} ${row.workOrderId ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function detectOperationalAnomalies(input: {
  workOrders: Ma6WorkOrderRow[];
  notifications: Ma6NotificationRow[];
  nowMs?: number;
}): Ma6Anomaly[] {
  const anomalies: Ma6Anomaly[] = [];
  for (const wo of input.workOrders) {
    if (wo.overdue) {
      anomalies.push({
        code: "overdue_work_order",
        severity: "attention",
        reason: `Work order due ${wo.dueAt} is past due (status ${wo.status}).`,
        organizationId: wo.organizationId,
        objectType: "work_order",
        objectId: wo.id,
        at: wo.dueAt,
        href: `/admin/operations/work-orders/${wo.id}`
      });
    }
    if (wo.unassigned && isWorkOrderOpen(wo.status)) {
      anomalies.push({
        code: "unassigned_work_order",
        severity: "attention",
        reason: `Open work order is unassigned (status ${wo.status}).`,
        organizationId: wo.organizationId,
        objectType: "work_order",
        objectId: wo.id,
        at: wo.updatedAt,
        href: `/admin/operations/work-orders/${wo.id}`
      });
    }
  }
  for (const n of input.notifications) {
    if (n.emailDeliveryStatus === "failed") {
      anomalies.push({
        code: "failed_notification",
        severity: "attention",
        reason: n.emailDeliveryError
          ? `Notification email delivery failed: ${n.emailDeliveryError}`
          : "Notification email delivery failed.",
        organizationId: n.organizationId,
        objectType: "notification",
        objectId: n.id,
        at: n.emailAttemptedAt ?? n.createdAt,
        href: `/admin/operations/notifications?q=${encodeURIComponent(n.id)}`
      });
    }
  }

  // Org backlog: orgs with many open WOs — factual count anomaly only when open > 0 and overdue > 0
  const byOrg = new Map<string, { open: number; overdue: number; name: string | null }>();
  for (const wo of input.workOrders) {
    if (!isWorkOrderOpen(wo.status)) continue;
    const cur = byOrg.get(wo.organizationId) ?? {
      open: 0,
      overdue: 0,
      name: wo.organizationName
    };
    cur.open += 1;
    if (wo.overdue) cur.overdue += 1;
    byOrg.set(wo.organizationId, cur);
  }
  for (const [orgId, stats] of byOrg) {
    if (stats.overdue > 0) {
      anomalies.push({
        code: "organization_operational_backlog",
        severity: "attention",
        reason: `${stats.name ?? orgId}: ${stats.open} open work order(s), ${stats.overdue} overdue.`,
        organizationId: orgId,
        objectType: "organization",
        objectId: orgId,
        at: null,
        href: `/admin/operations/work-orders?organizationId=${encodeURIComponent(orgId)}&overdue=yes`
      });
    }
  }

  return anomalies;
}

export function buildOrgOpsRows(input: {
  organizations: Array<{ id: string; name: string }>;
  propertyCountByOrg: Map<string, number>;
  unitCountByOrg: Map<string, number>;
  workOrders: Ma6WorkOrderRow[];
  vendorCountByOrg: Map<string, number>;
  notificationFailuresByOrg: Map<string, number>;
  anomalies: Ma6Anomaly[];
}): Ma6OrgOpsRow[] {
  const anomalyCountByOrg = new Map<string, number>();
  for (const a of input.anomalies) {
    if (!a.organizationId) continue;
    anomalyCountByOrg.set(a.organizationId, (anomalyCountByOrg.get(a.organizationId) ?? 0) + 1);
  }

  return input.organizations.map((org) => {
    const wos = input.workOrders.filter((w) => w.organizationId === org.id);
    const open = wos.filter((w) => OPEN_WO_STATUSES.has(w.status)).length;
    const inProgress = wos.filter((w) => IN_PROGRESS_WO_STATUSES.has(w.status)).length;
    const overdue = wos.filter((w) => w.overdue).length;
    const notifFail = input.notificationFailuresByOrg.get(org.id) ?? 0;
    const anomalyCount = anomalyCountByOrg.get(org.id) ?? 0;
    let health: Ma6DiagTone = "healthy";
    if (overdue > 0 || notifFail > 0 || anomalyCount > 0) health = "attention";
    return {
      organizationId: org.id,
      organizationName: org.name,
      propertyCount: input.propertyCountByOrg.get(org.id) ?? 0,
      unitCount: input.unitCountByOrg.get(org.id) ?? 0,
      openWorkOrders: open,
      overdueWorkOrders: overdue,
      inProgressWorkOrders: inProgress,
      vendorCount: input.vendorCountByOrg.get(org.id) ?? 0,
      notificationFailures: notifFail,
      anomalyCount,
      health
    };
  });
}

export function summarizeOperationsOverview(input: {
  propertyCount: number;
  unitCount: number;
  workOrders: Ma6WorkOrderRow[];
  vendors: Ma6VendorRow[];
  notifications: Ma6NotificationRow[];
  orgRows: Ma6OrgOpsRow[];
  degraded: boolean;
}): {
  properties: number;
  units: number;
  openWorkOrders: number;
  overdueWorkOrders: number;
  inProgressWorkOrders: number;
  completedWorkOrders: number;
  activeVendors: number;
  notificationFailed: number;
  notificationSent: number;
  orgsAttention: number;
  health: Ma6DiagTone;
  availability: "authoritative" | "partial" | "unavailable";
} {
  if (input.degraded && input.workOrders.length === 0 && input.propertyCount === 0) {
    return {
      properties: 0,
      units: 0,
      openWorkOrders: 0,
      overdueWorkOrders: 0,
      inProgressWorkOrders: 0,
      completedWorkOrders: 0,
      activeVendors: 0,
      notificationFailed: 0,
      notificationSent: 0,
      orgsAttention: 0,
      health: "unknown",
      availability: "unavailable"
    };
  }
  const open = input.workOrders.filter((w) => OPEN_WO_STATUSES.has(w.status)).length;
  const inProgress = input.workOrders.filter((w) => IN_PROGRESS_WO_STATUSES.has(w.status)).length;
  const completed = input.workOrders.filter((w) => COMPLETED_WO_STATUSES.has(w.status)).length;
  const overdue = input.workOrders.filter((w) => w.overdue).length;
  const notifFailed = input.notifications.filter((n) => n.emailDeliveryStatus === "failed").length;
  const notifSent = input.notifications.filter((n) => n.emailDeliveryStatus === "sent").length;
  const orgsAttention = input.orgRows.filter((o) => o.health === "attention").length;
  const health: Ma6DiagTone =
    overdue > 0 || notifFailed > 0 || orgsAttention > 0 ? "attention" : "healthy";

  return {
    properties: input.propertyCount,
    units: input.unitCount,
    openWorkOrders: open,
    overdueWorkOrders: overdue,
    inProgressWorkOrders: inProgress,
    completedWorkOrders: completed,
    activeVendors: input.vendors.filter((v) => v.status === "active").length,
    notificationFailed: notifFailed,
    notificationSent: notifSent,
    orgsAttention,
    health,
    availability: input.degraded ? "partial" : "authoritative"
  };
}

export function healthToneToBadge(tone: Ma6DiagTone): HealthTone {
  if (tone === "healthy") return "ok";
  if (tone === "attention") return "warn";
  return "unknown";
}

export function diagLabel(tone: Ma6DiagTone): string {
  if (tone === "healthy") return "HEALTHY";
  if (tone === "attention") return "ATTENTION";
  return "UNKNOWN";
}

export const MA6_WO_SELECT = [
  "id",
  "organization_id",
  "property_id",
  "unit_id",
  "title",
  "status",
  "priority",
  "assignee_type",
  "technician_user_id",
  "vendor_id",
  "work_surface",
  "created_at",
  "updated_at",
  "due_at",
  "completed_at",
  "cancelled_at"
].join(", ");
