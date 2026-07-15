export const LEASE_STATUSES = ["draft", "signed", "active", "expired", "terminated"] as const;

export const LEASE_TYPES = ["residential", "commercial", "month_to_month", "corporate", "other"] as const;

export const LEASE_RENEWAL_STATUSES = [
  "none",
  "offered",
  "pending",
  "renewed",
  "declined",
  "notice_given"
] as const;

export const LEASE_EVENT_TYPES = [
  "lease_created",
  "signed",
  "activated",
  "renewal_offered",
  "renewed",
  "notice_given",
  "expired",
  "terminated",
  "move_out"
] as const;

export const LEASE_DOCUMENT_TYPES = ["lease_pdf", "signed_lease", "amendment", "addendum"] as const;

export type LeaseStatus = (typeof LEASE_STATUSES)[number];
export type LeaseType = (typeof LEASE_TYPES)[number];
export type LeaseRenewalStatus = (typeof LEASE_RENEWAL_STATUSES)[number];
export type LeaseEventType = (typeof LEASE_EVENT_TYPES)[number];
export type LeaseDocumentType = (typeof LEASE_DOCUMENT_TYPES)[number];

export type LeaseRecord = {
  id: string;
  organizationId: string;
  leaseNumber: string;
  propertyId: string;
  unitId: string;
  primaryTenantId: string;
  coTenantPlaceholder: string | null;
  leaseType: LeaseType;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  moveInDate: string | null;
  moveOutDate: string | null;
  rentAmount: number;
  securityDeposit: number;
  lateFeePlaceholder: string | null;
  renewalOption: boolean;
  noticePeriodDays: number | null;
  renewalStatus: LeaseRenewalStatus;
  internalNotes: string | null;
  signedAt: string | null;
  activatedAt: string | null;
  expiredAt: string | null;
  terminatedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type LeaseDocumentRecord = {
  id: string;
  organizationId: string;
  leaseId: string;
  documentType: LeaseDocumentType;
  title: string;
  fileUrlPlaceholder: string | null;
  ocrReady: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type LeaseEventRecord = {
  id: string;
  organizationId: string;
  leaseId: string;
  eventType: LeaseEventType;
  summary: string;
  payload: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type CreateLeaseInput = Omit<
  LeaseRecord,
  | "id"
  | "organizationId"
  | "leaseNumber"
  | "signedAt"
  | "activatedAt"
  | "expiredAt"
  | "terminatedAt"
  | "createdAt"
  | "updatedAt"
  | "archivedAt"
  | "deletedAt"
> & {
  leaseNumber?: string;
};

export type UpdateLeaseInput = Partial<
  Omit<CreateLeaseInput, "status" | "renewalStatus">
>;

export type LeaseMutationInput =
  | { action: "archive" }
  | { action: "restore" }
  | { action: "soft_delete" }
  | { action: "update"; updates: UpdateLeaseInput }
  | { action: "sign" }
  | { action: "activate" }
  | { action: "offer_renewal" }
  | { action: "renew"; extensionMonths?: number }
  | { action: "give_notice" }
  | { action: "expire" }
  | { action: "terminate"; reason?: string | null }
  | { action: "move_out"; moveOutDate?: string | null };

export function toLeaseStatusLabel(status: LeaseStatus): string {
  const labels: Record<LeaseStatus, string> = {
    draft: "Draft",
    signed: "Signed",
    active: "Active",
    expired: "Expired",
    terminated: "Terminated"
  };
  return labels[status];
}

export function toLeaseTypeLabel(type: LeaseType): string {
  const labels: Record<LeaseType, string> = {
    residential: "Residential",
    commercial: "Commercial",
    month_to_month: "Month-to-month",
    corporate: "Corporate",
    other: "Other"
  };
  return labels[type];
}

export function toLeaseRenewalStatusLabel(status: LeaseRenewalStatus): string {
  const labels: Record<LeaseRenewalStatus, string> = {
    none: "None",
    offered: "Renewal offered",
    pending: "Renewal pending",
    renewed: "Renewed",
    declined: "Declined",
    notice_given: "Notice given"
  };
  return labels[status];
}

export function toLeaseEventTypeLabel(eventType: LeaseEventType): string {
  const labels: Record<LeaseEventType, string> = {
    lease_created: "Lease created",
    signed: "Signed",
    activated: "Activated",
    renewal_offered: "Renewal offered",
    renewed: "Renewed",
    notice_given: "Notice given",
    expired: "Expired",
    terminated: "Terminated",
    move_out: "Move out"
  };
  return labels[eventType];
}

export function toLeaseDocumentTypeLabel(type: LeaseDocumentType): string {
  const labels: Record<LeaseDocumentType, string> = {
    lease_pdf: "Lease PDF",
    signed_lease: "Signed lease",
    amendment: "Amendment",
    addendum: "Addendum"
  };
  return labels[type];
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return readString(value);
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readLeaseType(value: unknown): LeaseType | undefined {
  return typeof value === "string" && (LEASE_TYPES as readonly string[]).includes(value)
    ? (value as LeaseType)
    : undefined;
}

function readLeaseStatus(value: unknown): LeaseStatus | undefined {
  return typeof value === "string" && (LEASE_STATUSES as readonly string[]).includes(value)
    ? (value as LeaseStatus)
    : undefined;
}

function readRenewalStatus(value: unknown): LeaseRenewalStatus | undefined {
  return typeof value === "string" && (LEASE_RENEWAL_STATUSES as readonly string[]).includes(value)
    ? (value as LeaseRenewalStatus)
    : undefined;
}

export function parseCreateLeaseInput(payload: unknown): CreateLeaseInput | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const propertyId = readString(body["propertyId"]);
  const unitId = readString(body["unitId"]);
  const primaryTenantId = readString(body["primaryTenantId"]);
  const startDate = readString(body["startDate"]);
  const endDate = readString(body["endDate"]);
  const rentAmount = readNumber(body["rentAmount"]);
  if (!propertyId || !unitId || !primaryTenantId || !startDate || !endDate || rentAmount === undefined) {
    return null;
  }
  if (endDate < startDate) return null;
  if (rentAmount < 0) return null;

  const securityDeposit = readNumber(body["securityDeposit"]) ?? 0;
  if (securityDeposit < 0) return null;

  const leaseNumber = readString(body["leaseNumber"]);
  const leaseType = readLeaseType(body["leaseType"]) ?? "residential";
  const status = readLeaseStatus(body["status"]) ?? "draft";
  const renewalStatus = readRenewalStatus(body["renewalStatus"]) ?? "none";

  return {
    ...(leaseNumber ? { leaseNumber } : {}),
    propertyId,
    unitId,
    primaryTenantId,
    coTenantPlaceholder: readNullableString(body["coTenantPlaceholder"]) ?? null,
    leaseType,
    status,
    startDate,
    endDate,
    moveInDate: readNullableString(body["moveInDate"]) ?? null,
    moveOutDate: readNullableString(body["moveOutDate"]) ?? null,
    rentAmount,
    securityDeposit,
    lateFeePlaceholder: readNullableString(body["lateFeePlaceholder"]) ?? null,
    renewalOption: readBoolean(body["renewalOption"]) ?? false,
    noticePeriodDays: readNumber(body["noticePeriodDays"]) ?? null,
    renewalStatus,
    internalNotes: readNullableString(body["internalNotes"]) ?? null,
    metadata: typeof body["metadata"] === "object" && body["metadata"] !== null ? (body["metadata"] as Record<string, unknown>) : {}
  };
}

export function parseUpdateLeaseInput(payload: unknown): UpdateLeaseInput | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const updates: UpdateLeaseInput = {};

  const propertyId = readString(body["propertyId"]);
  if (propertyId) updates.propertyId = propertyId;
  const unitId = readString(body["unitId"]);
  if (unitId) updates.unitId = unitId;
  const primaryTenantId = readString(body["primaryTenantId"]);
  if (primaryTenantId) updates.primaryTenantId = primaryTenantId;
  if ("coTenantPlaceholder" in body) updates.coTenantPlaceholder = readNullableString(body["coTenantPlaceholder"]) ?? null;
  const leaseType = readLeaseType(body["leaseType"]);
  if (leaseType) updates.leaseType = leaseType;
  const startDate = readString(body["startDate"]);
  if (startDate) updates.startDate = startDate;
  const endDate = readString(body["endDate"]);
  if (endDate) updates.endDate = endDate;
  if ("moveInDate" in body) updates.moveInDate = readNullableString(body["moveInDate"]) ?? null;
  if ("moveOutDate" in body) updates.moveOutDate = readNullableString(body["moveOutDate"]) ?? null;
  const rentAmount = readNumber(body["rentAmount"]);
  if (rentAmount !== undefined) updates.rentAmount = rentAmount;
  const securityDeposit = readNumber(body["securityDeposit"]);
  if (securityDeposit !== undefined) updates.securityDeposit = securityDeposit;
  if ("lateFeePlaceholder" in body) updates.lateFeePlaceholder = readNullableString(body["lateFeePlaceholder"]) ?? null;
  const renewalOption = readBoolean(body["renewalOption"]);
  if (renewalOption !== undefined) updates.renewalOption = renewalOption;
  if ("noticePeriodDays" in body) updates.noticePeriodDays = readNumber(body["noticePeriodDays"]) ?? null;
  if ("internalNotes" in body) updates.internalNotes = readNullableString(body["internalNotes"]) ?? null;

  return Object.keys(updates).length > 0 ? updates : null;
}

export function parseLeaseMutationInput(payload: unknown): LeaseMutationInput | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const action = readString(body["action"]);
  if (!action) return null;

  if (action === "archive" || action === "restore" || action === "soft_delete") {
    return { action };
  }
  if (action === "sign" || action === "activate" || action === "offer_renewal" || action === "give_notice" || action === "expire") {
    return { action };
  }
  if (action === "renew") {
    return { action: "renew", extensionMonths: readNumber(body["extensionMonths"]) ?? 12 };
  }
  if (action === "terminate") {
    return { action: "terminate", reason: readNullableString(body["reason"]) ?? null };
  }
  if (action === "move_out") {
    return { action: "move_out", moveOutDate: readNullableString(body["moveOutDate"]) ?? null };
  }
  if (action === "update") {
    const updates = parseUpdateLeaseInput(body["updates"]);
    return updates ? { action: "update", updates } : null;
  }

  return null;
}
