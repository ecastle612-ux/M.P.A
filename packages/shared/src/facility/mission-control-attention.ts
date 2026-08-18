/**
 * FO-EFF Slice 2 — Mission Control "Needs Attention" pure builders.
 * Canonical source: facility maintenance_work_orders only (no second inbox).
 */

export const FACILITY_ATTENTION_CATEGORIES = [
  "overdue",
  "urgent",
  "public_request",
  "unassigned",
  "due_today"
] as const;

export type FacilityAttentionCategory = (typeof FACILITY_ATTENTION_CATEGORIES)[number];

export const FACILITY_ATTENTION_CATEGORY_LABELS: Record<FacilityAttentionCategory, string> = {
  overdue: "Overdue",
  urgent: "High priority / urgent",
  public_request: "New public requests",
  unassigned: "Unassigned submitted work",
  due_today: "Due today"
};

export type FacilityAttentionSourceRow = {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  assignee_type?: string | null;
  technician_user_id?: string | null;
  due_at?: string | null;
  submitted_at?: string | null;
  intake_channel?: string | null;
  request_number?: string | null;
  floor_label?: string | null;
  department_label?: string | null;
  room_label?: string | null;
  facility_asset_label?: string | null;
  property_properties?: { name?: string | null } | null;
};

export type FacilityAttentionItem = {
  id: string;
  category: FacilityAttentionCategory;
  title: string;
  referenceLabel: string;
  locationLine: string | null;
  metaLine: string;
  priority: string;
  status: string;
  href: string;
  dueAt: string | null;
  submittedAt: string | null;
  intakeChannel: string | null;
};

export type FacilityAttentionSection = {
  category: FacilityAttentionCategory;
  label: string;
  total: number;
  items: FacilityAttentionItem[];
};

const OPEN_STATUSES = new Set(["submitted", "triaged", "assigned", "in_progress"]);
const EARLY_STATUSES = new Set(["submitted", "triaged"]);
const PUBLIC_CHANNELS = new Set(["qr", "public_link", "authenticated"]);
const URGENT_PRIORITIES = new Set(["emergency", "high"]);

const MAX_ITEMS_PER_CATEGORY = 5;

function startOfUtcDay(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function endOfUtcDay(start: Date) {
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function isOpenFacilityAttentionStatus(status: string) {
  return OPEN_STATUSES.has(status);
}

export function facilityOperationsWorkOrderHref(
  workOrderId: string,
  options?: { from?: "mission-control" }
) {
  const params = new URLSearchParams({ workOrderId });
  if (options?.from) {
    params.set("from", options.from);
  }
  return `/facility/operations?${params.toString()}`;
}

export function facilityMyWorkOrderHref(workOrderId: string) {
  return `/facility/my-work?workOrderId=${encodeURIComponent(workOrderId)}`;
}

export function formatFacilityAttentionLocation(row: FacilityAttentionSourceRow): string | null {
  const parts = [
    row.property_properties?.name,
    row.floor_label,
    row.department_label,
    row.room_label,
    row.facility_asset_label
  ].filter((part): part is string => Boolean(part && String(part).trim()));
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function formatFacilityAttentionReference(row: FacilityAttentionSourceRow): string {
  if (row.request_number && row.request_number.trim()) {
    return row.request_number.trim();
  }
  return `WO-${row.id.slice(0, 8)}`;
}

function relativeAge(iso: string | null | undefined, now: Date): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const deltaMs = Math.max(0, now.getTime() - then);
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function overduePhrase(dueAt: string, now: Date): string {
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return "Overdue";
  const days = Math.max(1, Math.ceil((now.getTime() - due) / (24 * 60 * 60 * 1000)));
  return `${days} day${days === 1 ? "" : "s"} overdue`;
}

function assigneePhrase(row: FacilityAttentionSourceRow): string {
  if (row.assignee_type === "technician" && row.technician_user_id) {
    return "Assigned to technician";
  }
  if (row.assignee_type === "vendor") {
    return "Assigned to vendor";
  }
  return "Unassigned";
}

function classifyAttentionCategory(
  row: FacilityAttentionSourceRow,
  now: Date
): FacilityAttentionCategory | null {
  if (!isOpenFacilityAttentionStatus(String(row.status))) {
    return null;
  }

  const due = row.due_at ? new Date(String(row.due_at)) : null;
  const startToday = startOfUtcDay(now);
  const endToday = endOfUtcDay(startToday);

  if (due && !Number.isNaN(due.getTime()) && due < now) {
    return "overdue";
  }

  if (URGENT_PRIORITIES.has(String(row.priority ?? ""))) {
    return "urgent";
  }

  const isPublic = PUBLIC_CHANNELS.has(String(row.intake_channel ?? ""));
  const unassigned = (row.assignee_type ?? "unassigned") === "unassigned";
  const early = EARLY_STATUSES.has(String(row.status));

  if (isPublic && early) {
    return "public_request";
  }

  if (unassigned && early) {
    return "unassigned";
  }

  if (due && !Number.isNaN(due.getTime()) && due >= startToday && due < endToday) {
    return "due_today";
  }

  return null;
}

function metaForCategory(
  category: FacilityAttentionCategory,
  row: FacilityAttentionSourceRow,
  now: Date
): string {
  switch (category) {
    case "overdue":
      return [row.due_at ? overduePhrase(String(row.due_at), now) : "Overdue", assigneePhrase(row)]
        .filter(Boolean)
        .join(" · ");
    case "urgent":
      return [
        String(row.priority) === "emergency" ? "Emergency" : "High priority",
        assigneePhrase(row),
        relativeAge(row.submitted_at, now) ? `Submitted ${relativeAge(row.submitted_at, now)}` : null
      ]
        .filter(Boolean)
        .join(" · ");
    case "public_request":
      return [
        "Public request",
        relativeAge(row.submitted_at, now) ? `Submitted ${relativeAge(row.submitted_at, now)}` : null,
        assigneePhrase(row)
      ]
        .filter(Boolean)
        .join(" · ");
    case "unassigned":
      return [
        "Needs assignment",
        relativeAge(row.submitted_at, now) ? `Submitted ${relativeAge(row.submitted_at, now)}` : null
      ]
        .filter(Boolean)
        .join(" · ");
    case "due_today":
      return ["Due today", assigneePhrase(row)].join(" · ");
  }
}

function actionLabel(category: FacilityAttentionCategory): string {
  if (category === "unassigned" || category === "public_request") {
    return "Review / Assign";
  }
  return "Open";
}

export function buildFacilityAttentionSections(
  rows: FacilityAttentionSourceRow[],
  nowInput: Date = new Date(),
  options?: { maxPerCategory?: number; hrefFrom?: "mission-control" }
): FacilityAttentionSection[] {
  const now = nowInput;
  const maxPerCategory = options?.maxPerCategory ?? MAX_ITEMS_PER_CATEGORY;
  const buckets = new Map<FacilityAttentionCategory, FacilityAttentionItem[]>();
  const totals = new Map<FacilityAttentionCategory, number>();

  for (const category of FACILITY_ATTENTION_CATEGORIES) {
    buckets.set(category, []);
    totals.set(category, 0);
  }

  const ranked = [...rows].sort((a, b) => {
    const aDue = a.due_at ? new Date(String(a.due_at)).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.due_at ? new Date(String(b.due_at)).getTime() : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    const aSub = a.submitted_at ? new Date(String(a.submitted_at)).getTime() : 0;
    const bSub = b.submitted_at ? new Date(String(b.submitted_at)).getTime() : 0;
    return bSub - aSub;
  });

  for (const row of ranked) {
    const category = classifyAttentionCategory(row, now);
    if (!category) continue;
    totals.set(category, (totals.get(category) ?? 0) + 1);
    const bucket = buckets.get(category)!;
    if (bucket.length >= maxPerCategory) continue;
    bucket.push({
      id: row.id,
      category,
      title: row.title,
      referenceLabel: formatFacilityAttentionReference(row),
      locationLine: formatFacilityAttentionLocation(row),
      metaLine: metaForCategory(category, row, now),
      priority: String(row.priority ?? "normal"),
      status: String(row.status),
      href: facilityOperationsWorkOrderHref(row.id, {
        from: options?.hrefFrom ?? "mission-control"
      }),
      dueAt: row.due_at ? String(row.due_at) : null,
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
      intakeChannel: row.intake_channel ? String(row.intake_channel) : null
    });
  }

  return FACILITY_ATTENTION_CATEGORIES.map((category) => ({
    category,
    label: FACILITY_ATTENTION_CATEGORY_LABELS[category],
    total: totals.get(category) ?? 0,
    items: buckets.get(category) ?? []
  })).filter((section) => section.total > 0);
}

export function facilityAttentionActionLabel(category: FacilityAttentionCategory) {
  return actionLabel(category);
}

export function countFacilityAttentionItems(sections: FacilityAttentionSection[]) {
  return sections.reduce((sum, section) => sum + section.total, 0);
}
