export const APPLICANT_STATUSES = [
  "draft",
  "submitted",
  "awaiting_documents",
  "screening_in_progress",
  "pending_review",
  "approved",
  "declined",
  "withdrawn",
  "converted_to_resident"
] as const;

export type ApplicantStatus = (typeof APPLICANT_STATUSES)[number];

export const APPLICANT_TASK_STATUSES = ["open", "completed", "cancelled"] as const;
export type ApplicantTaskStatus = (typeof APPLICANT_TASK_STATUSES)[number];

export type ApplicantEmployment = {
  employer: string | null;
  jobTitle: string | null;
  startDate: string | null;
  monthlyIncome: number | null;
  supervisorName: string | null;
  supervisorPhone: string | null;
};

export type ApplicantIncome = {
  source: string | null;
  amount: number | null;
  frequency: "monthly" | "annual" | "weekly" | "other" | null;
  notes: string | null;
};

export type ApplicantEmergencyContact = {
  name: string | null;
  phone: string | null;
  relationship: string | null;
};

export type ApplicantPet = {
  name: string | null;
  species: string | null;
  breed: string | null;
  weight: string | null;
};

export type ApplicantVehicle = {
  make: string | null;
  model: string | null;
  year: string | null;
  licensePlate: string | null;
  color: string | null;
};

export type ApplicantHouseholdMember = {
  firstName: string;
  lastName: string;
  relationship: string | null;
  dateOfBirth: string | null;
  email: string | null;
};

export type ApplicantMoveInChecklist = {
  keysIssued: boolean;
  utilitiesTransferred: boolean;
  welcomePacketSent: boolean;
  orientationScheduled: boolean;
  notes: string | null;
};

export type ApplicantProfile = {
  employment: ApplicantEmployment;
  income: ApplicantIncome;
  emergency: ApplicantEmergencyContact;
  pets: ApplicantPet[];
  vehicles: ApplicantVehicle[];
  householdMembers: ApplicantHouseholdMember[];
  moveInChecklist: ApplicantMoveInChecklist;
};

export type ApplicantRecord = {
  id: string;
  organizationId: string;
  applicationNumber: string;
  applicationGroupId: string;
  isPrimary: boolean;
  propertyId: string | null;
  unitId: string | null;
  assignedPmId: string | null;
  tenantId: string | null;
  status: ApplicantStatus;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  plannedMoveInDate: string | null;
  profile: ApplicantProfile;
  internalNotes: string | null;
  metadata: Record<string, unknown>;
  submittedAt: string | null;
  approvedAt: string | null;
  declinedAt: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type ApplicantNoteRecord = {
  id: string;
  organizationId: string;
  applicantId: string;
  body: string;
  createdBy: string;
  createdAt: string;
};

export type ApplicantTaskRecord = {
  id: string;
  organizationId: string;
  applicantId: string;
  title: string;
  description: string | null;
  status: ApplicantTaskStatus;
  dueDate: string | null;
  assignedTo: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicantEventRecord = {
  id: string;
  organizationId: string;
  applicantId: string;
  eventType: string;
  summary: string;
  payload: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type CreateApplicantInput = Omit<
  ApplicantRecord,
  | "id"
  | "organizationId"
  | "applicationNumber"
  | "submittedAt"
  | "approvedAt"
  | "declinedAt"
  | "convertedAt"
  | "createdAt"
  | "updatedAt"
  | "archivedAt"
  | "deletedAt"
  | "tenantId"
> & {
  applicationNumber?: string;
};

export type UpdateApplicantInput = Partial<
  Omit<CreateApplicantInput, "applicationGroupId" | "isPrimary">
>;

export type ApplicantMutationInput =
  | { action: "archive" }
  | { action: "restore" }
  | { action: "soft_delete" }
  | { action: "submit" }
  | { action: "request_documents" }
  | { action: "start_screening" }
  | { action: "mark_pending_review" }
  | { action: "approve" }
  | { action: "decline"; reason?: string }
  | { action: "withdraw"; reason?: string }
  | { action: "convert_to_resident" }
  | { action: "add_note"; body: string }
  | { action: "add_task"; title: string; description?: string; dueDate?: string }
  | { action: "complete_task"; taskId: string }
  | { action: "update"; updates: UpdateApplicantInput };

export function defaultApplicantProfile(): ApplicantProfile {
  return {
    employment: {
      employer: null,
      jobTitle: null,
      startDate: null,
      monthlyIncome: null,
      supervisorName: null,
      supervisorPhone: null
    },
    income: { source: null, amount: null, frequency: null, notes: null },
    emergency: { name: null, phone: null, relationship: null },
    pets: [],
    vehicles: [],
    householdMembers: [],
    moveInChecklist: {
      keysIssued: false,
      utilitiesTransferred: false,
      welcomePacketSent: false,
      orientationScheduled: false,
      notes: null
    }
  };
}

export function parseApplicantProfile(value: unknown): ApplicantProfile {
  const defaults = defaultApplicantProfile();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaults;
  }
  const raw = value as Record<string, unknown>;
  return {
    employment: parseEmployment(raw["employment"]),
    income: parseIncome(raw["income"]),
    emergency: parseEmergency(raw["emergency"]),
    pets: parsePets(raw["pets"]),
    vehicles: parseVehicles(raw["vehicles"]),
    householdMembers: parseHouseholdMembers(raw["householdMembers"]),
    moveInChecklist: parseMoveInChecklist(raw["moveInChecklist"])
  };
}

export function parseCreateApplicantInput(payload: unknown): CreateApplicantInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const firstName = readString(value["firstName"], 1, 120);
  const lastName = readString(value["lastName"], 1, 120);
  const email = readEmail(value["email"]);
  if (!firstName || !lastName || !email) return null;

  const propertyId = readUuid(value["propertyId"]);
  const unitId = readUuid(value["unitId"]);
  if (unitId && !propertyId) return null;

  const applicationGroupId = readUuid(value["applicationGroupId"]);

  const applicationNumber = readString(value["applicationNumber"], 1, 40);

  const result: CreateApplicantInput = {
    applicationGroupId: applicationGroupId ?? crypto.randomUUID(),
    isPrimary: value["isPrimary"] === false ? false : true,
    propertyId,
    unitId,
    assignedPmId: readUuid(value["assignedPmId"]),
    status: isApplicantStatus(value["status"]) ? value["status"] : "draft",
    firstName,
    lastName,
    preferredName: readString(value["preferredName"], 0, 120),
    email,
    phone: readString(value["phone"], 0, 40),
    dateOfBirth: readDate(value["dateOfBirth"]),
    plannedMoveInDate: readDate(value["plannedMoveInDate"]),
    profile: parseApplicantProfile(value["profile"]),
    internalNotes: readString(value["internalNotes"], 0, 4000),
    metadata: readJsonObject(value["metadata"])
  };
  if (applicationNumber) result.applicationNumber = applicationNumber;
  return result;
}

export function parseApplicantMutationInput(payload: unknown): ApplicantMutationInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const action = typeof value["action"] === "string" ? value["action"] : "update";

  if (action === "archive" || action === "restore" || action === "soft_delete") {
    return { action };
  }
  if (action === "submit" || action === "request_documents" || action === "start_screening") {
    return { action };
  }
  if (action === "mark_pending_review" || action === "approve" || action === "convert_to_resident") {
    return { action };
  }
  if (action === "decline" || action === "withdraw") {
    const reason = readString(value["reason"], 0, 2000);
    return reason ? { action, reason } : { action };
  }
  if (action === "add_note") {
    const body = readString(value["body"], 1, 4000);
    return body ? { action, body } : null;
  }
  if (action === "add_task") {
    const title = readString(value["title"], 1, 200);
    if (!title) return null;
    const task: { action: "add_task"; title: string; description?: string; dueDate?: string } = { action, title };
    const description = readString(value["description"], 0, 2000);
    if (description) task.description = description;
    const dueDate = readDate(value["dueDate"]);
    if (dueDate) task.dueDate = dueDate;
    return task;
  }
  if (action === "complete_task") {
    const taskId = readUuid(value["taskId"]);
    return taskId ? { action, taskId } : null;
  }

  const updates = parseUpdateApplicantInput(value);
  if (!updates) return null;
  return { action: "update", updates };
}

export function isApplicantStatus(value: unknown): value is ApplicantStatus {
  return typeof value === "string" && APPLICANT_STATUSES.includes(value as ApplicantStatus);
}

export function toApplicantStatusLabel(status: ApplicantStatus): string {
  return status
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function parseUpdateApplicantInput(value: Record<string, unknown>): UpdateApplicantInput | null {
  const updates: UpdateApplicantInput = {};

  if (value["propertyId"] === null) updates.propertyId = null;
  else {
    const propertyId = readUuid(value["propertyId"]);
    if (propertyId !== null) updates.propertyId = propertyId;
  }

  if (value["unitId"] === null) updates.unitId = null;
  else {
    const unitId = readUuid(value["unitId"]);
    if (unitId !== null) updates.unitId = unitId;
  }

  const assignedPmId = readUuid(value["assignedPmId"]);
  if (assignedPmId !== null) updates.assignedPmId = assignedPmId;
  if (value["assignedPmId"] === null) updates.assignedPmId = null;

  const firstName = readString(value["firstName"], 1, 120);
  if (firstName !== null) updates.firstName = firstName;
  const lastName = readString(value["lastName"], 1, 120);
  if (lastName !== null) updates.lastName = lastName;
  const preferredName = readString(value["preferredName"], 0, 120);
  if (preferredName !== null) updates.preferredName = preferredName;
  const email = readEmail(value["email"]);
  if (email !== null) updates.email = email;
  const phone = readString(value["phone"], 0, 40);
  if (phone !== null) updates.phone = phone;
  const dateOfBirth = readDate(value["dateOfBirth"]);
  if (dateOfBirth !== null) updates.dateOfBirth = dateOfBirth;
  const plannedMoveInDate = readDate(value["plannedMoveInDate"]);
  if (plannedMoveInDate !== null) updates.plannedMoveInDate = plannedMoveInDate;
  const internalNotes = readString(value["internalNotes"], 0, 4000);
  if (internalNotes !== null) updates.internalNotes = internalNotes;

  if (isApplicantStatus(value["status"])) updates.status = value["status"];
  if (value["profile"] !== undefined) updates.profile = parseApplicantProfile(value["profile"]);
  if (value["metadata"] !== undefined) updates.metadata = readJsonObject(value["metadata"]);

  if (updates.unitId && updates.propertyId === null) return null;
  return Object.keys(updates).length > 0 ? updates : null;
}

function parseEmployment(value: unknown): ApplicantEmployment {
  const defaults = defaultApplicantProfile().employment;
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const raw = value as Record<string, unknown>;
  return {
    employer: readString(raw["employer"], 0, 200),
    jobTitle: readString(raw["jobTitle"], 0, 120),
    startDate: readDate(raw["startDate"]),
    monthlyIncome: readNumber(raw["monthlyIncome"]),
    supervisorName: readString(raw["supervisorName"], 0, 160),
    supervisorPhone: readString(raw["supervisorPhone"], 0, 40)
  };
}

function parseIncome(value: unknown): ApplicantIncome {
  const defaults = defaultApplicantProfile().income;
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const raw = value as Record<string, unknown>;
  const frequency = raw["frequency"];
  const validFrequency =
    frequency === "monthly" || frequency === "annual" || frequency === "weekly" || frequency === "other"
      ? frequency
      : null;
  return {
    source: readString(raw["source"], 0, 200),
    amount: readNumber(raw["amount"]),
    frequency: validFrequency,
    notes: readString(raw["notes"], 0, 1000)
  };
}

function parseEmergency(value: unknown): ApplicantEmergencyContact {
  const defaults = defaultApplicantProfile().emergency;
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const raw = value as Record<string, unknown>;
  return {
    name: readString(raw["name"], 0, 160),
    phone: readString(raw["phone"], 0, 40),
    relationship: readString(raw["relationship"], 0, 80)
  };
}

function parsePets(value: unknown): ApplicantPet[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as Record<string, unknown>;
      return {
        name: readString(raw["name"], 0, 80),
        species: readString(raw["species"], 0, 80),
        breed: readString(raw["breed"], 0, 80),
        weight: readString(raw["weight"], 0, 40)
      };
    })
    .filter((entry): entry is ApplicantPet => entry !== null);
}

function parseVehicles(value: unknown): ApplicantVehicle[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as Record<string, unknown>;
      return {
        make: readString(raw["make"], 0, 80),
        model: readString(raw["model"], 0, 80),
        year: readString(raw["year"], 0, 4),
        licensePlate: readString(raw["licensePlate"], 0, 20),
        color: readString(raw["color"], 0, 40)
      };
    })
    .filter((entry): entry is ApplicantVehicle => entry !== null);
}

function parseHouseholdMembers(value: unknown): ApplicantHouseholdMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as Record<string, unknown>;
      const firstName = readString(raw["firstName"], 1, 120);
      const lastName = readString(raw["lastName"], 1, 120);
      if (!firstName || !lastName) return null;
      return {
        firstName,
        lastName,
        relationship: readString(raw["relationship"], 0, 80),
        dateOfBirth: readDate(raw["dateOfBirth"]),
        email: readEmail(raw["email"])
      };
    })
    .filter((entry): entry is ApplicantHouseholdMember => entry !== null);
}

function parseMoveInChecklist(value: unknown): ApplicantMoveInChecklist {
  const defaults = defaultApplicantProfile().moveInChecklist;
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const raw = value as Record<string, unknown>;
  return {
    keysIssued: raw["keysIssued"] === true,
    utilitiesTransferred: raw["utilitiesTransferred"] === true,
    welcomePacketSent: raw["welcomePacketSent"] === true,
    orientationScheduled: raw["orientationScheduled"] === true,
    notes: readString(raw["notes"], 0, 2000)
  };
}

function readString(value: unknown, min: number, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 && min > 0) return null;
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed.length === 0 ? null : trimmed;
}

function readEmail(value: unknown): string | null {
  const candidate = readString(value, 3, 200);
  if (candidate === null) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate.toLowerCase() : null;
}

function readDate(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function readUuid(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function readNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function readJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
