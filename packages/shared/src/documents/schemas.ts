export const DOCUMENT_ENTITY_TYPES = [
  "property",
  "resident",
  "lease",
  "maintenance",
  "vendor",
  "organization"
] as const;

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export const DOCUMENT_CATEGORIES = [
  "general",
  "lease",
  "agreement",
  "evidence",
  "maintenance",
  "vendor",
  "financial",
  "identity",
  "other"
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_SOURCES = ["upload", "generated", "signwell", "offline"] as const;

export type DocumentSource = (typeof DOCUMENT_SOURCES)[number];

export type DocumentRecord = {
  id: string;
  organizationId: string;
  entityType: DocumentEntityType;
  entityId: string;
  title: string;
  category: DocumentCategory;
  source: DocumentSource;
  mimeType: string;
  fileName: string | null;
  byteSize: number;
  signwellDocumentId: string | null;
  externalUrl: string | null;
  propertyId: string | null;
  entityLabel?: string | null;
  createdAt: string;
  hasContent: boolean;
};

export function isDocumentEntityType(value: string): value is DocumentEntityType {
  return (DOCUMENT_ENTITY_TYPES as readonly string[]).includes(value);
}

export function isDocumentCategory(value: string): value is DocumentCategory {
  return (DOCUMENT_CATEGORIES as readonly string[]).includes(value);
}
