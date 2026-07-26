export const PM_CADENCES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
  "custom"
] as const;

export type PmCadence = (typeof PM_CADENCES)[number];

export const PM_OCCURRENCE_STATUSES = ["pending", "materialized", "skipped", "cancelled"] as const;
export type PmOccurrenceStatus = (typeof PM_OCCURRENCE_STATUSES)[number];

export type FacilityPmSchedule = {
  id: string;
  organizationId: string;
  propertyId: string;
  assetId: string | null;
  title: string;
  cadence: PmCadence;
  customIntervalDays: number | null;
  nextDue: string;
  defaultAssigneeUserId: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FacilityPmScheduleListItem = FacilityPmSchedule & {
  propertyName: string | null;
  assetName: string | null;
  overdue: boolean;
};

export type FacilityPmOccurrence = {
  id: string;
  organizationId: string;
  scheduleId: string;
  dueOn: string;
  status: PmOccurrenceStatus;
  workOrderId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreatePmScheduleInput = {
  title: string;
  propertyId: string;
  cadence: PmCadence;
  nextDue: string;
  assetId?: string | null;
  customIntervalDays?: number | null;
  defaultAssigneeUserId?: string | null;
  active?: boolean;
};

export type UpdatePmScheduleInput = {
  title?: string;
  propertyId?: string;
  assetId?: string | null;
  cadence?: PmCadence;
  customIntervalDays?: number | null;
  nextDue?: string;
  defaultAssigneeUserId?: string | null;
  active?: boolean;
};

export function isPmCadence(value: string): value is PmCadence {
  return (PM_CADENCES as readonly string[]).includes(value);
}

export function formatPmCadenceLabel(cadence: PmCadence): string {
  switch (cadence) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "semiannual":
      return "Semiannual";
    case "annual":
      return "Annual";
    case "custom":
      return "Custom";
    default:
      return cadence;
  }
}

function asTrimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseCreatePmScheduleInput(payload: unknown): CreatePmScheduleInput | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const title = asTrimmed(record["title"]);
  const propertyId = asTrimmed(record["propertyId"]);
  const cadenceRaw = asTrimmed(record["cadence"]);
  const nextDue = asTrimmed(record["nextDue"]);
  if (!title || !propertyId || !cadenceRaw || !isPmCadence(cadenceRaw) || !nextDue) return null;

  const customRaw = record["customIntervalDays"];
  const customIntervalDays =
    typeof customRaw === "number" && Number.isFinite(customRaw)
      ? Math.trunc(customRaw)
      : typeof customRaw === "string" && customRaw.trim()
        ? Number.parseInt(customRaw, 10)
        : null;

  if (cadenceRaw === "custom" && (!customIntervalDays || customIntervalDays <= 0)) return null;
  if (cadenceRaw !== "custom" && customIntervalDays) return null;

  return {
    title,
    propertyId,
    cadence: cadenceRaw,
    nextDue: nextDue.slice(0, 10),
    assetId: asTrimmed(record["assetId"]),
    customIntervalDays: cadenceRaw === "custom" ? customIntervalDays : null,
    defaultAssigneeUserId: asTrimmed(record["defaultAssigneeUserId"]),
    active: record["active"] === false ? false : true
  };
}

export function parseUpdatePmScheduleInput(payload: unknown): UpdatePmScheduleInput | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const next: UpdatePmScheduleInput = {};

  if ("title" in record) {
    const title = asTrimmed(record["title"]);
    if (!title) return null;
    next.title = title;
  }
  if ("propertyId" in record) {
    const propertyId = asTrimmed(record["propertyId"]);
    if (!propertyId) return null;
    next.propertyId = propertyId;
  }
  if ("assetId" in record) next.assetId = asTrimmed(record["assetId"]);
  if ("cadence" in record) {
    const cadence = asTrimmed(record["cadence"]);
    if (!cadence || !isPmCadence(cadence)) return null;
    next.cadence = cadence;
  }
  if ("customIntervalDays" in record) {
    const customRaw = record["customIntervalDays"];
    if (customRaw === null) next.customIntervalDays = null;
    else if (typeof customRaw === "number" && Number.isFinite(customRaw)) {
      next.customIntervalDays = Math.trunc(customRaw);
    } else if (typeof customRaw === "string" && customRaw.trim()) {
      next.customIntervalDays = Number.parseInt(customRaw, 10);
    } else return null;
  }
  if ("nextDue" in record) {
    const nextDue = asTrimmed(record["nextDue"]);
    if (!nextDue) return null;
    next.nextDue = nextDue.slice(0, 10);
  }
  if ("defaultAssigneeUserId" in record) {
    next.defaultAssigneeUserId = asTrimmed(record["defaultAssigneeUserId"]);
  }
  if ("active" in record) {
    if (typeof record["active"] !== "boolean") return null;
    next.active = record["active"];
  }

  return Object.keys(next).length > 0 ? next : null;
}

export function advanceDueDate(
  fromDue: string,
  cadence: PmCadence,
  customIntervalDays: number | null
): string {
  const base = new Date(`${fromDue.slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(base.getTime())) return fromDue.slice(0, 10);

  switch (cadence) {
    case "daily":
      base.setUTCDate(base.getUTCDate() + 1);
      break;
    case "weekly":
      base.setUTCDate(base.getUTCDate() + 7);
      break;
    case "monthly":
      base.setUTCMonth(base.getUTCMonth() + 1);
      break;
    case "quarterly":
      base.setUTCMonth(base.getUTCMonth() + 3);
      break;
    case "semiannual":
      base.setUTCMonth(base.getUTCMonth() + 6);
      break;
    case "annual":
      base.setUTCFullYear(base.getUTCFullYear() + 1);
      break;
    case "custom":
      base.setUTCDate(base.getUTCDate() + Math.max(1, customIntervalDays ?? 1));
      break;
    default:
      break;
  }

  return base.toISOString().slice(0, 10);
}
