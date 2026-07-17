export const VAULT_ENTITY_TYPES = [
  "applicant",
  "tenant",
  "lease",
  "property",
  "unit",
  "vendor",
  "maintenance"
] as const;

export type VaultEntityType = (typeof VAULT_ENTITY_TYPES)[number];

export const APPLICANT_DOCUMENT_TYPES = [
  "id_document",
  "pay_stub",
  "bank_statement",
  "reference_letter",
  "pet_documentation",
  "application_form",
  "other"
] as const;

export type ApplicantDocumentType = (typeof APPLICANT_DOCUMENT_TYPES)[number];

export type VaultDocumentRecord = {
  id: string;
  organizationId: string;
  entityType: VaultEntityType;
  entityId: string;
  documentType: string;
  title: string;
  fileUrl: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreateVaultDocumentInput = {
  entityType: VaultEntityType;
  entityId: string;
  documentType: string;
  title: string;
  fileUrl?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateVaultDocumentInput = Partial<
  Pick<CreateVaultDocumentInput, "documentType" | "title" | "fileUrl" | "notes" | "metadata">
>;

export function parseCreateVaultDocumentInput(payload: unknown): CreateVaultDocumentInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const entityType = readEntityType(value["entityType"]);
  const entityId = readUuid(value["entityId"]);
  const documentType = readString(value["documentType"], 1, 80);
  const title = readString(value["title"], 1, 200);
  if (!entityType || !entityId || !documentType || !title) return null;

  return {
    entityType,
    entityId,
    documentType,
    title,
    fileUrl: readUrl(value["fileUrl"]),
    notes: readString(value["notes"], 0, 2000),
    metadata: readJsonObject(value["metadata"])
  };
}

export function parseUpdateVaultDocumentInput(payload: unknown): UpdateVaultDocumentInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const updates: UpdateVaultDocumentInput = {};

  const documentType = readString(value["documentType"], 1, 80);
  if (documentType !== null) updates.documentType = documentType;
  const title = readString(value["title"], 1, 200);
  if (title !== null) updates.title = title;
  if (value["fileUrl"] !== undefined) updates.fileUrl = readUrl(value["fileUrl"]);
  const notes = readString(value["notes"], 0, 2000);
  if (notes !== null) updates.notes = notes;
  if (value["metadata"] !== undefined) updates.metadata = readJsonObject(value["metadata"]);

  return Object.keys(updates).length > 0 ? updates : null;
}

export function isVaultEntityType(value: unknown): value is VaultEntityType {
  return typeof value === "string" && VAULT_ENTITY_TYPES.includes(value as VaultEntityType);
}

function readEntityType(value: unknown): VaultEntityType | null {
  return isVaultEntityType(value) ? value : null;
}

function readString(value: unknown, min: number, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 && min > 0) return null;
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed.length === 0 ? null : trimmed;
}

function readUrl(value: unknown): string | null {
  if (value === null) return null;
  const candidate = readString(value, 0, 400);
  if (candidate === null) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function readUuid(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function readJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
