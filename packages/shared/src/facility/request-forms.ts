import { FACILITY_MANAGER_ROLES } from "./schemas";
import { WORK_ORDER_CATEGORIES, type WorkOrderCategory, type WorkOrderStatus } from "../maintenance/schemas";
import {
  MEDIA_MAX_IMAGE_BYTES,
  MEDIA_MAX_VIDEO_BYTES,
  isMediaAllowedMimeType,
  mediaFileTypeForMime
} from "../media/schemas";
import type { UserRole } from "../types/roles";

export const FACILITY_REQUEST_FORM_STATUSES = ["draft", "active", "inactive"] as const;
export type FacilityRequestFormStatus = (typeof FACILITY_REQUEST_FORM_STATUSES)[number];

export const FACILITY_REQUEST_ACCESS_POLICIES = ["contact_required", "authenticated_only"] as const;
export type FacilityRequestAccessPolicy = (typeof FACILITY_REQUEST_ACCESS_POLICIES)[number];

export const FACILITY_REQUEST_FIELD_REQUIREMENTS = ["required", "optional", "hidden"] as const;
export type FacilityRequestFieldRequirement = (typeof FACILITY_REQUEST_FIELD_REQUIREMENTS)[number];

export const FACILITY_REQUEST_CUSTOM_TYPES = [
  "short_text",
  "long_text",
  "select",
  "yes_no",
  "number",
  "date"
] as const;
export type FacilityRequestCustomType = (typeof FACILITY_REQUEST_CUSTOM_TYPES)[number];

export const FACILITY_REQUEST_STANDARD_KEYS = [
  "requester_name",
  "requester_email",
  "requester_phone",
  "building",
  "floor",
  "department",
  "room",
  "contact_person",
  "issue_title",
  "issue_description",
  "category",
  "requester_urgency",
  "asset",
  "image",
  "video",
  "date_observed",
  "safety_concern"
] as const;
export type FacilityRequestStandardKey = (typeof FACILITY_REQUEST_STANDARD_KEYS)[number];

export const FACILITY_REQUEST_CONTEXT_KINDS = [
  "general",
  "building",
  "floor",
  "department",
  "room",
  "asset"
] as const;
export type FacilityRequestContextKind = (typeof FACILITY_REQUEST_CONTEXT_KINDS)[number];

export const FACILITY_REQUEST_INTAKE_CHANNELS = [
  "internal",
  "qr",
  "public_link",
  "authenticated"
] as const;
export type FacilityRequestIntakeChannel = (typeof FACILITY_REQUEST_INTAKE_CHANNELS)[number];

export const FACILITY_REQUEST_COARSE_STATUSES = [
  "received",
  "in_progress",
  "completed",
  "closed",
  "cancelled"
] as const;
export type FacilityRequestCoarseStatus = (typeof FACILITY_REQUEST_COARSE_STATUSES)[number];

export const FACILITY_REQUEST_FORMS_ENTITLEMENT = "facility.request_forms" as const;

export const STANDARD_FIELD_DEFAULT_LABELS: Record<FacilityRequestStandardKey, string> = {
  requester_name: "Your name",
  requester_email: "Email",
  requester_phone: "Phone",
  building: "Building",
  floor: "Floor",
  department: "Department",
  room: "Room / area",
  contact_person: "Person to contact",
  issue_title: "Problem",
  issue_description: "Description",
  category: "Category",
  requester_urgency: "How urgent is this?",
  asset: "Asset / equipment",
  image: "Photo",
  video: "Video",
  date_observed: "Date observed",
  safety_concern: "Safety concern"
};

export type FacilityRequestFieldDef = {
  key: string;
  kind: "standard" | "custom";
  standardKey?: FacilityRequestStandardKey;
  customType?: FacilityRequestCustomType;
  requirement: FacilityRequestFieldRequirement;
  label: string;
  helperText?: string;
  placeholder?: string;
  order: number;
  options?: string[];
};

export type FacilityRequestFieldSnapshot = {
  fields: FacilityRequestFieldDef[];
};

export type FacilityRequestLockedContext = {
  propertyId?: string;
  propertyLabel?: string;
  facilityAssetId?: string;
  facilityAssetLabel?: string;
  floorLabel?: string;
  departmentLabel?: string;
  roomLabel?: string;
};

export type FacilityRequestSubmittedAttachment = {
  kind: "image" | "video";
  mimeType: string;
  fileSize: number;
  mediaId?: string;
};

export type FacilityRequestValueMap = Record<string, unknown>;

export function isFacilityRequestFormStatus(value: unknown): value is FacilityRequestFormStatus {
  return typeof value === "string" && (FACILITY_REQUEST_FORM_STATUSES as readonly string[]).includes(value);
}

export function isFacilityRequestAccessPolicy(value: unknown): value is FacilityRequestAccessPolicy {
  return typeof value === "string" && (FACILITY_REQUEST_ACCESS_POLICIES as readonly string[]).includes(value);
}

export function isFacilityRequestContextKind(value: unknown): value is FacilityRequestContextKind {
  return typeof value === "string" && (FACILITY_REQUEST_CONTEXT_KINDS as readonly string[]).includes(value);
}

export function memberCanAdministerRequestForms(roles: readonly string[]): boolean {
  return roles.some((role) => (FACILITY_MANAGER_ROLES as readonly string[]).includes(role as UserRole));
}

export function formatFacilityRequestNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Invalid request-number year");
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999999) {
    throw new Error("Invalid request-number sequence");
  }
  return `FR-${year}-${String(sequence).padStart(5, "0")}`;
}

export function isFacilityRequestNumber(value: unknown): value is string {
  return typeof value === "string" && /^FR-\d{4}-\d{5}$/.test(value);
}

export function publicRequestPath(publicToken: string, via?: "qr" | "link"): string {
  const base = `/request/${publicToken}`;
  if (via === "qr") return `${base}?via=qr`;
  if (via === "link") return `${base}?via=link`;
  return base;
}

export function publicRequestStatusPath(statusToken: string): string {
  return `/request/status/${statusToken}`;
}

export function resolveIntakeChannel(input: {
  via?: string | null;
  accessPolicy: FacilityRequestAccessPolicy;
}): FacilityRequestIntakeChannel {
  if (input.via === "qr") return "qr";
  if (input.accessPolicy === "authenticated_only") return "authenticated";
  return "public_link";
}

export function intakeChannelLabel(channel: FacilityRequestIntakeChannel): string {
  switch (channel) {
    case "qr":
      return "Submitted via QR";
    case "public_link":
      return "Submitted via public link";
    case "authenticated":
      return "Submitted by signed-in requester";
    default:
      return "Created internally";
  }
}

export function coarseStatusForWorkOrder(status: WorkOrderStatus): FacilityRequestCoarseStatus {
  if (status === "cancelled") return "cancelled";
  if (status === "closed") return "closed";
  if (status === "completed") return "completed";
  if (status === "in_progress" || status === "assigned" || status === "triaged") return "in_progress";
  return "received";
}

export function coarseStatusLabel(status: FacilityRequestCoarseStatus): string {
  switch (status) {
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "closed":
      return "Closed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Received";
  }
}

export function sortRequestFields(fields: readonly FacilityRequestFieldDef[]): FacilityRequestFieldDef[] {
  return [...fields].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
}

export function visibleRequestFields(fields: readonly FacilityRequestFieldDef[]): FacilityRequestFieldDef[] {
  return sortRequestFields(fields).filter((field) => field.requirement !== "hidden");
}

function isStandardKey(value: string): value is FacilityRequestStandardKey {
  return (FACILITY_REQUEST_STANDARD_KEYS as readonly string[]).includes(value);
}

export function validatePublishedFieldSnapshot(snapshot: FacilityRequestFieldSnapshot):
  | { ok: true; fields: FacilityRequestFieldDef[] }
  | { ok: false; error: string } {
  if (!Array.isArray(snapshot.fields) || snapshot.fields.length === 0) {
    return { ok: false, error: "A published form needs at least one field." };
  }
  const keys = new Set<string>();
  let hasTitle = false;
  let hasDescription = false;
  for (const field of snapshot.fields) {
    if (!field.key || keys.has(field.key)) {
      return { ok: false, error: "Each field needs a unique key." };
    }
    keys.add(field.key);
    if (!field.label?.trim()) {
      return { ok: false, error: "Each field needs a label." };
    }
    if (!(FACILITY_REQUEST_FIELD_REQUIREMENTS as readonly string[]).includes(field.requirement)) {
      return { ok: false, error: "Field requirement is invalid." };
    }
    if (field.kind === "standard") {
      if (!field.standardKey || !isStandardKey(field.standardKey)) {
        return { ok: false, error: "Standard field key is invalid." };
      }
      if (field.standardKey === "issue_title" && field.requirement !== "hidden") hasTitle = true;
      if (field.standardKey === "issue_description" && field.requirement !== "hidden") hasDescription = true;
    } else if (field.kind === "custom") {
      if (!field.customType || !(FACILITY_REQUEST_CUSTOM_TYPES as readonly string[]).includes(field.customType)) {
        return { ok: false, error: "Custom field type is invalid." };
      }
      if (field.customType === "select") {
        const options = (field.options ?? []).map((option) => option.trim()).filter(Boolean);
        if (options.length < 2) {
          return { ok: false, error: "Select fields need at least two options." };
        }
      }
    } else {
      return { ok: false, error: "Field kind is invalid." };
    }
  }
  if (!hasTitle || !hasDescription) {
    return { ok: false, error: "Every published form must collect a problem title and description." };
  }
  return { ok: true, fields: sortRequestFields(snapshot.fields) };
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function fieldLooksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function standardKeyForField(field: FacilityRequestFieldDef): FacilityRequestStandardKey | null {
  return field.kind === "standard" && field.standardKey ? field.standardKey : null;
}

export type FacilityRequestValidationFailure = {
  ok: false;
  error: string;
  code:
    | "missing_required"
    | "hidden_injection"
    | "unknown_field"
    | "malformed_value"
    | "invalid_select"
    | "invalid_attachment"
    | "forged_context"
    | "contact_required"
    | "anonymous_forbidden";
};

export type FacilityRequestValidationSuccess = {
  ok: true;
  values: Record<string, string | number | boolean>;
  title: string;
  description: string;
  category: WorkOrderCategory;
  requesterName: string | null;
  requesterEmail: string | null;
  requesterPhone: string | null;
  propertyId: string | null;
  propertyLabel: string | null;
  facilityAssetId: string | null;
  facilityAssetLabel: string | null;
  floorLabel: string | null;
  departmentLabel: string | null;
  roomLabel: string | null;
};

export function validateFacilityRequestSubmission(input: {
  snapshot: FacilityRequestFieldSnapshot;
  values: FacilityRequestValueMap;
  attachments?: FacilityRequestSubmittedAttachment[];
  lockedContext?: FacilityRequestLockedContext;
  accessPolicy: FacilityRequestAccessPolicy;
  clientOrganizationId?: unknown;
  clientPropertyId?: unknown;
  clientAssetId?: unknown;
}): FacilityRequestValidationSuccess | FacilityRequestValidationFailure {
  if (input.clientOrganizationId != null) {
    return { ok: false, error: "Organization cannot be chosen by the browser.", code: "forged_context" };
  }

  const published = validatePublishedFieldSnapshot(input.snapshot);
  if (!published.ok) {
    return { ok: false, error: published.error, code: "malformed_value" };
  }

  const locked = input.lockedContext ?? {};
  if (input.clientPropertyId != null && locked.propertyId && input.clientPropertyId !== locked.propertyId) {
    return { ok: false, error: "Building context cannot be changed.", code: "forged_context" };
  }
  if (input.clientAssetId != null && locked.facilityAssetId && input.clientAssetId !== locked.facilityAssetId) {
    return { ok: false, error: "Asset context cannot be changed.", code: "forged_context" };
  }

  const allowedKeys = new Set(published.fields.map((field) => field.key));
  for (const key of Object.keys(input.values)) {
    if (!allowedKeys.has(key)) {
      return { ok: false, error: "Unknown field.", code: "unknown_field" };
    }
  }

  const normalized: Record<string, string | number | boolean> = {};
  const attachments = input.attachments ?? [];

  for (const field of published.fields) {
    const raw = input.values[field.key];
    const standardKey = standardKeyForField(field);

    if (field.requirement === "hidden") {
      if (raw != null && raw !== "") {
        const lockedValue =
          (standardKey === "building" && locked.propertyLabel) ||
          (standardKey === "floor" && locked.floorLabel) ||
          (standardKey === "department" && locked.departmentLabel) ||
          (standardKey === "room" && locked.roomLabel) ||
          (standardKey === "asset" && locked.facilityAssetLabel);
        if (!lockedValue || asTrimmedString(raw) !== lockedValue) {
          return { ok: false, error: `${field.label} cannot be submitted.`, code: "hidden_injection" };
        }
      }
      continue;
    }

    if (standardKey === "image" || standardKey === "video") {
      const kind = standardKey === "image" ? "image" : "video";
      const match = attachments.filter((item) => item.kind === kind);
      if (field.requirement === "required" && match.length < 1) {
        return { ok: false, error: `${field.label} is required.`, code: "missing_required" };
      }
      continue;
    }

    if (field.requirement === "required" && (raw == null || asTrimmedString(String(raw ?? "")) == null) && raw !== false && raw !== 0) {
      return { ok: false, error: `${field.label} is required.`, code: "missing_required" };
    }
    if ((raw == null || raw === "") && field.requirement === "optional") {
      continue;
    }

    if (field.kind === "custom" && field.customType === "select") {
      const value = asTrimmedString(raw);
      if (!value || !(field.options ?? []).includes(value)) {
        return { ok: false, error: `${field.label} is not a valid option.`, code: "invalid_select" };
      }
      normalized[field.key] = value;
      continue;
    }
    if (field.kind === "custom" && field.customType === "yes_no") {
      if (raw !== true && raw !== false && raw !== "yes" && raw !== "no") {
        return { ok: false, error: `${field.label} must be yes or no.`, code: "malformed_value" };
      }
      normalized[field.key] = raw === true || raw === "yes";
      continue;
    }
    if (field.kind === "custom" && field.customType === "number") {
      const numberValue = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(numberValue)) {
        return { ok: false, error: `${field.label} must be a number.`, code: "malformed_value" };
      }
      normalized[field.key] = numberValue;
      continue;
    }
    if (field.kind === "custom" && field.customType === "date") {
      const value = asTrimmedString(raw);
      if (!value || Number.isNaN(Date.parse(value))) {
        return { ok: false, error: `${field.label} must be a date.`, code: "malformed_value" };
      }
      normalized[field.key] = value;
      continue;
    }

    const text = asTrimmedString(typeof raw === "string" || typeof raw === "number" ? String(raw) : raw === true ? "yes" : null);
    if (field.requirement === "required" && !text) {
      return { ok: false, error: `${field.label} is required.`, code: "missing_required" };
    }
    if (!text) continue;

    if (standardKey === "requester_email" && !fieldLooksLikeEmail(text)) {
      return { ok: false, error: "Enter a valid email.", code: "malformed_value" };
    }
    if (standardKey === "category" && !(WORK_ORDER_CATEGORIES as readonly string[]).includes(text)) {
      return { ok: false, error: "Category is not valid.", code: "invalid_select" };
    }
    if (standardKey === "building" && locked.propertyLabel && text !== locked.propertyLabel) {
      return { ok: false, error: "Building is locked for this request link.", code: "forged_context" };
    }
    if (standardKey === "floor" && locked.floorLabel && text !== locked.floorLabel) {
      return { ok: false, error: "Floor is locked for this request link.", code: "forged_context" };
    }
    if (standardKey === "department" && locked.departmentLabel && text !== locked.departmentLabel) {
      return { ok: false, error: "Department is locked for this request link.", code: "forged_context" };
    }
    if (standardKey === "room" && locked.roomLabel && text !== locked.roomLabel) {
      return { ok: false, error: "Room is locked for this request link.", code: "forged_context" };
    }
    if (standardKey === "asset" && locked.facilityAssetLabel && text !== locked.facilityAssetLabel) {
      return { ok: false, error: "Asset is locked for this request link.", code: "forged_context" };
    }
    normalized[field.key] = text;
  }

  if (input.accessPolicy === "contact_required") {
    const nameField = published.fields.find((field) => standardKeyForField(field) === "requester_name");
    const emailField = published.fields.find((field) => standardKeyForField(field) === "requester_email");
    const phoneField = published.fields.find((field) => standardKeyForField(field) === "requester_phone");
    const name = nameField ? asTrimmedString(String(normalized[nameField.key] ?? "")) : asTrimmedString(String(input.values["requester_name"] ?? ""));
    const email = emailField ? asTrimmedString(String(normalized[emailField.key] ?? "")) : asTrimmedString(String(input.values["requester_email"] ?? ""));
    const phone = phoneField ? asTrimmedString(String(normalized[phoneField.key] ?? "")) : asTrimmedString(String(input.values["requester_phone"] ?? ""));
    if (!name) {
      return { ok: false, error: "Name is required.", code: "contact_required" };
    }
    const emailConfigured = emailField && emailField.requirement !== "hidden";
    const phoneConfigured = phoneField && phoneField.requirement !== "hidden";
    if ((emailConfigured || phoneConfigured) && !email && !phone) {
      return { ok: false, error: "Email or phone is required.", code: "contact_required" };
    }
    if (!emailConfigured && !phoneConfigured && !email && !phone) {
      return { ok: false, error: "Email or phone is required.", code: "contact_required" };
    }
  }

  for (const attachment of attachments) {
    if (!isMediaAllowedMimeType(attachment.mimeType)) {
      return { ok: false, error: "Attachment type is not allowed.", code: "invalid_attachment" };
    }
    const kind = mediaFileTypeForMime(attachment.mimeType);
    if (kind !== attachment.kind) {
      return { ok: false, error: "Attachment type is not allowed.", code: "invalid_attachment" };
    }
    const max = kind === "video" ? MEDIA_MAX_VIDEO_BYTES : MEDIA_MAX_IMAGE_BYTES;
    if (attachment.fileSize <= 0 || attachment.fileSize > max) {
      return { ok: false, error: "Attachment is too large.", code: "invalid_attachment" };
    }
  }

  const titleField = published.fields.find((field) => standardKeyForField(field) === "issue_title");
  const descriptionField = published.fields.find((field) => standardKeyForField(field) === "issue_description");
  const categoryField = published.fields.find((field) => standardKeyForField(field) === "category");
  const title = titleField ? String(normalized[titleField.key] ?? "") : "";
  const description = descriptionField ? String(normalized[descriptionField.key] ?? "") : "";
  const categoryRaw = categoryField ? String(normalized[categoryField.key] ?? "general") : "general";
  const category = (WORK_ORDER_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as WorkOrderCategory)
    : "general";

  const nameField = published.fields.find((field) => standardKeyForField(field) === "requester_name");
  const emailField = published.fields.find((field) => standardKeyForField(field) === "requester_email");
  const phoneField = published.fields.find((field) => standardKeyForField(field) === "requester_phone");
  const buildingField = published.fields.find((field) => standardKeyForField(field) === "building");
  const floorField = published.fields.find((field) => standardKeyForField(field) === "floor");
  const departmentField = published.fields.find((field) => standardKeyForField(field) === "department");
  const roomField = published.fields.find((field) => standardKeyForField(field) === "room");
  const assetField = published.fields.find((field) => standardKeyForField(field) === "asset");

  return {
    ok: true,
    values: normalized,
    title,
    description,
    category,
    requesterName: nameField ? asTrimmedString(String(normalized[nameField.key] ?? "")) : null,
    requesterEmail: emailField ? asTrimmedString(String(normalized[emailField.key] ?? "")) : null,
    requesterPhone: phoneField ? asTrimmedString(String(normalized[phoneField.key] ?? "")) : null,
    propertyId: locked.propertyId ?? null,
    propertyLabel:
      locked.propertyLabel ??
      (buildingField ? asTrimmedString(String(normalized[buildingField.key] ?? "")) : null),
    facilityAssetId: locked.facilityAssetId ?? null,
    facilityAssetLabel:
      locked.facilityAssetLabel ??
      (assetField ? asTrimmedString(String(normalized[assetField.key] ?? "")) : null),
    floorLabel:
      locked.floorLabel ?? (floorField ? asTrimmedString(String(normalized[floorField.key] ?? "")) : null),
    departmentLabel:
      locked.departmentLabel ??
      (departmentField ? asTrimmedString(String(normalized[departmentField.key] ?? "")) : null),
    roomLabel: locked.roomLabel ?? (roomField ? asTrimmedString(String(normalized[roomField.key] ?? "")) : null)
  };
}

export function publicTrackingView(input: {
  requestNumber: string;
  submittedAt: string;
  title: string;
  category?: string | null;
  locationLabel: string | null;
  status: WorkOrderStatus;
}): {
  requestNumber: string;
  submittedAt: string;
  title: string;
  category: string | null;
  location: string | null;
  status: FacilityRequestCoarseStatus;
  statusLabel: string;
} {
  return {
    requestNumber: input.requestNumber,
    submittedAt: input.submittedAt,
    title: input.title,
    category: input.category ?? null,
    location: input.locationLabel,
    status: coarseStatusForWorkOrder(input.status),
    statusLabel: coarseStatusLabel(coarseStatusForWorkOrder(input.status))
  };
}

export function wendyFurnitureFormSnapshot(): FacilityRequestFieldSnapshot {
  return {
    fields: [
      {
        key: "floor",
        kind: "standard",
        standardKey: "floor",
        requirement: "required",
        label: "Floor",
        order: 10
      },
      {
        key: "department",
        kind: "standard",
        standardKey: "department",
        requirement: "required",
        label: "Department",
        order: 20
      },
      {
        key: "requester_name",
        kind: "standard",
        standardKey: "requester_name",
        requirement: "required",
        label: "Your name",
        order: 30
      },
      {
        key: "issue_title",
        kind: "standard",
        standardKey: "issue_title",
        requirement: "required",
        label: "Problem",
        order: 40
      },
      {
        key: "issue_description",
        kind: "standard",
        standardKey: "issue_description",
        requirement: "required",
        label: "Description",
        order: 50
      },
      {
        key: "image",
        kind: "standard",
        standardKey: "image",
        requirement: "required",
        label: "Photo",
        order: 60
      },
      {
        key: "room",
        kind: "standard",
        standardKey: "room",
        requirement: "optional",
        label: "Room",
        order: 70
      },
      {
        key: "requester_email",
        kind: "standard",
        standardKey: "requester_email",
        requirement: "optional",
        label: "Email",
        order: 80
      },
      {
        key: "requester_phone",
        kind: "standard",
        standardKey: "requester_phone",
        requirement: "optional",
        label: "Phone",
        order: 90
      }
    ]
  };
}

export function warehouseDockFormSnapshot(): FacilityRequestFieldSnapshot {
  return {
    fields: [
      {
        key: "building",
        kind: "standard",
        standardKey: "building",
        requirement: "required",
        label: "Building",
        order: 10
      },
      {
        key: "zone",
        kind: "custom",
        customType: "short_text",
        requirement: "required",
        label: "Zone",
        order: 20
      },
      {
        key: "asset",
        kind: "standard",
        standardKey: "asset",
        requirement: "optional",
        label: "Asset ID",
        order: 30
      },
      {
        key: "category",
        kind: "standard",
        standardKey: "category",
        requirement: "required",
        label: "Issue category",
        order: 40
      },
      {
        key: "issue_title",
        kind: "standard",
        standardKey: "issue_title",
        requirement: "required",
        label: "Problem",
        order: 45
      },
      {
        key: "issue_description",
        kind: "standard",
        standardKey: "issue_description",
        requirement: "required",
        label: "Description",
        order: 50
      },
      {
        key: "safety_concern",
        kind: "standard",
        standardKey: "safety_concern",
        requirement: "required",
        label: "Safety concern",
        order: 60
      },
      {
        key: "image",
        kind: "standard",
        standardKey: "image",
        requirement: "optional",
        label: "Photo",
        order: 70
      },
      {
        key: "requester_name",
        kind: "standard",
        standardKey: "requester_name",
        requirement: "required",
        label: "Your name",
        order: 75
      },
      {
        key: "requester_phone",
        kind: "standard",
        standardKey: "requester_phone",
        requirement: "optional",
        label: "Phone",
        order: 76
      },
      {
        key: "department",
        kind: "standard",
        standardKey: "department",
        requirement: "hidden",
        label: "Department",
        order: 80
      },
      {
        key: "contact_person",
        kind: "standard",
        standardKey: "contact_person",
        requirement: "hidden",
        label: "Person",
        order: 90
      }
    ]
  };
}

export function defaultStandardFieldCatalog(): FacilityRequestFieldDef[] {
  return FACILITY_REQUEST_STANDARD_KEYS.map((key, index) => ({
    key,
    kind: "standard" as const,
    standardKey: key,
    requirement:
      key === "issue_title" || key === "issue_description" || key === "requester_name"
        ? "required"
        : key === "image" || key === "requester_email" || key === "requester_phone"
          ? "optional"
          : "hidden",
    label: STANDARD_FIELD_DEFAULT_LABELS[key],
    order: (index + 1) * 10
  }));
}
