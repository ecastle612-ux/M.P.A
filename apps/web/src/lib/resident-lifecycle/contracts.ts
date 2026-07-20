export const RESIDENT_LIFECYCLE_STATUSES = [
  "awaiting_move_in",
  "awaiting_signature",
  "active",
  "notice_given",
  "moving_out",
  "former"
] as const;

export type ResidentLifecycleStatus = (typeof RESIDENT_LIFECYCLE_STATUSES)[number];

export type MoveInChecklist = {
  screeningComplete: boolean;
  leaseGenerated: boolean;
  leaseSigned: boolean;
  depositReceived: boolean;
  portalReady: boolean;
  welcomeEmail: boolean;
  welcomeSms: boolean;
  pushEnabled: boolean;
  documentsUploaded: boolean;
};

export type MoveOutChecklist = {
  finalInspectionCompleted: boolean;
  inspectionPhotosUploaded: boolean;
  keysReturned: boolean;
  finalBalanceSettled: boolean;
  depositResolved: boolean;
  documentsArchived: boolean;
  accessDisabled: boolean;
};

export type MoveInDraftInput = {
  source: "applicant" | "direct";
  applicantId?: string | null;
  propertyId: string;
  unitId: string;
  overrideOccupied?: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  moveInDate: string;
  leaseStartDate: string;
  leaseEndDate: string;
  rentAmount: number;
  securityDeposit: number;
  pets?: string | null;
  vehicles?: string | null;
  coResidents?: string | null;
  guarantors?: string | null;
  notes?: string | null;
  sendWelcome?: boolean;
  activateLease?: boolean;
};

export type MoveOutDraftInput = {
  tenantId: string;
  leaseId?: string | null;
  moveOutDate: string;
  reason?: string | null;
  forwardingAddress?: string | null;
  depositDisposition?: "refund" | "partial_refund" | "withheld" | "pending" | null;
  finalChargesAmount?: number | null;
  finalChargesNote?: string | null;
  checklist?: Partial<MoveOutChecklist>;
};

export type ResidentLifecycleOpsMetrics = {
  pendingMoveIns: number;
  pendingMoveOuts: number;
  awaitingInvitation: number;
  missingLease: number;
  missingDeposit: number;
  missingDocuments: number;
  unitsBecomingVacant: number;
  upcomingLeaseExpirations: number;
};

export type BulkLifecycleAction =
  | { action: "invite"; tenantIds: string[] }
  | { action: "activate_portal"; tenantIds: string[] }
  | { action: "mark_awaiting_move_in"; tenantIds: string[] }
  | { action: "send_welcome"; tenantIds: string[] };

export type TransferUnitInput = {
  tenantId: string;
  leaseId?: string | null;
  propertyId: string;
  unitId: string;
  overrideOccupied?: boolean;
  reason?: string | null;
};

export function parseTransferUnitInput(payload: unknown): TransferUnitInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const tenantId = typeof value["tenantId"] === "string" ? value["tenantId"] : null;
  const propertyId = typeof value["propertyId"] === "string" ? value["propertyId"] : null;
  const unitId = typeof value["unitId"] === "string" ? value["unitId"] : null;
  if (!tenantId || !propertyId || !unitId) return null;
  return {
    tenantId,
    leaseId: typeof value["leaseId"] === "string" ? value["leaseId"] : null,
    propertyId,
    unitId,
    overrideOccupied: value["overrideOccupied"] === true,
    reason: typeof value["reason"] === "string" ? value["reason"] : null
  };
}

export function toLifecycleStatusLabel(status: ResidentLifecycleStatus): string {
  const labels: Record<ResidentLifecycleStatus, string> = {
    awaiting_move_in: "Awaiting move-in",
    awaiting_signature: "Awaiting signature",
    active: "Active resident",
    notice_given: "Notice given",
    moving_out: "Moving out",
    former: "Former resident"
  };
  return labels[status];
}

export function emptyMoveInChecklist(): MoveInChecklist {
  return {
    screeningComplete: false,
    leaseGenerated: false,
    leaseSigned: false,
    depositReceived: false,
    portalReady: false,
    welcomeEmail: false,
    welcomeSms: false,
    pushEnabled: false,
    documentsUploaded: false
  };
}

export function emptyMoveOutChecklist(): MoveOutChecklist {
  return {
    finalInspectionCompleted: false,
    inspectionPhotosUploaded: false,
    keysReturned: false,
    finalBalanceSettled: false,
    depositResolved: false,
    documentsArchived: false,
    accessDisabled: false
  };
}

export function parseMoveInDraftInput(payload: unknown): MoveInDraftInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const source = value["source"] === "applicant" || value["source"] === "direct" ? value["source"] : null;
  const propertyId = typeof value["propertyId"] === "string" ? value["propertyId"] : null;
  const unitId = typeof value["unitId"] === "string" ? value["unitId"] : null;
  const firstName = typeof value["firstName"] === "string" ? value["firstName"].trim() : "";
  const lastName = typeof value["lastName"] === "string" ? value["lastName"].trim() : "";
  const email = typeof value["email"] === "string" ? value["email"].trim().toLowerCase() : "";
  const moveInDate = typeof value["moveInDate"] === "string" ? value["moveInDate"] : null;
  const leaseStartDate = typeof value["leaseStartDate"] === "string" ? value["leaseStartDate"] : null;
  const leaseEndDate = typeof value["leaseEndDate"] === "string" ? value["leaseEndDate"] : null;
  const rentAmount = typeof value["rentAmount"] === "number" ? value["rentAmount"] : Number(value["rentAmount"]);
  const securityDeposit =
    typeof value["securityDeposit"] === "number" ? value["securityDeposit"] : Number(value["securityDeposit"] ?? 0);

  if (
    !source ||
    !propertyId ||
    !unitId ||
    firstName.length < 1 ||
    lastName.length < 1 ||
    !email.includes("@") ||
    !moveInDate ||
    !leaseStartDate ||
    !leaseEndDate ||
    !Number.isFinite(rentAmount) ||
    rentAmount < 0 ||
    !Number.isFinite(securityDeposit) ||
    securityDeposit < 0 ||
    leaseEndDate < leaseStartDate
  ) {
    return null;
  }

  return {
    source,
    applicantId: typeof value["applicantId"] === "string" ? value["applicantId"] : null,
    propertyId,
    unitId,
    overrideOccupied: value["overrideOccupied"] === true,
    firstName,
    lastName,
    email,
    phone: typeof value["phone"] === "string" ? value["phone"] : null,
    emergencyContactName: typeof value["emergencyContactName"] === "string" ? value["emergencyContactName"] : null,
    emergencyContactPhone: typeof value["emergencyContactPhone"] === "string" ? value["emergencyContactPhone"] : null,
    moveInDate,
    leaseStartDate,
    leaseEndDate,
    rentAmount,
    securityDeposit,
    pets: typeof value["pets"] === "string" ? value["pets"] : null,
    vehicles: typeof value["vehicles"] === "string" ? value["vehicles"] : null,
    coResidents: typeof value["coResidents"] === "string" ? value["coResidents"] : null,
    guarantors: typeof value["guarantors"] === "string" ? value["guarantors"] : null,
    notes: typeof value["notes"] === "string" ? value["notes"] : null,
    sendWelcome: value["sendWelcome"] !== false,
    activateLease: value["activateLease"] !== false
  };
}

export function parseMoveOutDraftInput(payload: unknown): MoveOutDraftInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const tenantId = typeof value["tenantId"] === "string" ? value["tenantId"] : null;
  const moveOutDate = typeof value["moveOutDate"] === "string" ? value["moveOutDate"] : null;
  if (!tenantId || !moveOutDate) return null;

  const disposition = value["depositDisposition"];
  const parsed: MoveOutDraftInput = {
    tenantId,
    leaseId: typeof value["leaseId"] === "string" ? value["leaseId"] : null,
    moveOutDate,
    reason: typeof value["reason"] === "string" ? value["reason"] : null,
    forwardingAddress: typeof value["forwardingAddress"] === "string" ? value["forwardingAddress"] : null,
    depositDisposition:
      disposition === "refund" ||
      disposition === "partial_refund" ||
      disposition === "withheld" ||
      disposition === "pending"
        ? disposition
        : null,
    finalChargesAmount:
      typeof value["finalChargesAmount"] === "number"
        ? value["finalChargesAmount"]
        : value["finalChargesAmount"] != null
          ? Number(value["finalChargesAmount"])
          : null,
    finalChargesNote: typeof value["finalChargesNote"] === "string" ? value["finalChargesNote"] : null
  };
  if (value["checklist"] && typeof value["checklist"] === "object") {
    parsed.checklist = value["checklist"] as Partial<MoveOutChecklist>;
  }
  return parsed;
}

export function parseBulkLifecycleAction(payload: unknown): BulkLifecycleAction | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const action = value["action"];
  const tenantIds = Array.isArray(value["tenantIds"])
    ? value["tenantIds"].filter((id): id is string => typeof id === "string")
    : [];
  if (tenantIds.length === 0) return null;
  if (
    action === "invite" ||
    action === "activate_portal" ||
    action === "mark_awaiting_move_in" ||
    action === "send_welcome"
  ) {
    return { action, tenantIds };
  }
  return null;
}
