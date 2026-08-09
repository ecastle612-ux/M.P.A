export const DOCUMENT_ENTITY_TYPES = [
  "property",
  "unit",
  "resident",
  "lease",
  "maintenance",
  "vendor",
  "organization",
  "asset",
  "inspection",
  "compliance",
  "financial",
  "building",
  "application"
] as const;

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export const DOCUMENT_ENTITY_LABELS: Record<DocumentEntityType, string> = {
  property: "Property",
  unit: "Unit",
  resident: "Resident",
  lease: "Lease",
  maintenance: "Work Order",
  vendor: "Vendor",
  organization: "Organization",
  asset: "Asset",
  inspection: "Inspection",
  compliance: "Compliance",
  financial: "Financial Record",
  building: "Building",
  application: "Application"
};

export const DOCUMENT_CATEGORIES = [
  "general",
  "lease",
  "agreement",
  "evidence",
  "maintenance",
  "vendor",
  "financial",
  "identity",
  "inspection",
  "compliance",
  "warranty",
  "invoice",
  "report",
  "photo",
  "other"
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  general: "General",
  lease: "Lease",
  agreement: "Agreement",
  evidence: "Evidence",
  maintenance: "Maintenance",
  vendor: "Vendor",
  financial: "Financial",
  identity: "Identity",
  inspection: "Inspection",
  compliance: "Compliance",
  warranty: "Warranty",
  invoice: "Invoice",
  report: "Report",
  photo: "Photo",
  other: "Other"
};

export const DOCUMENT_SOURCES = ["upload", "generated", "signwell", "offline"] as const;

export type DocumentSource = (typeof DOCUMENT_SOURCES)[number];

export const DOCUMENT_STATUSES = ["active", "archived", "draft", "superseded"] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const PDF_EXPORT_TEMPLATES = [
  "lease",
  "work_order",
  "inspection",
  "maintenance",
  "move_in",
  "move_out",
  "vendor_work_order",
  "purchase_order",
  "invoice",
  "property_report",
  "asset_report",
  "compliance",
  "resident_statement",
  "financial_report",
  "organization_report",
  "rental_application",
  "approval_letter",
  "denial_letter",
  "lease_summary",
  "move_in_checklist",
  "generic"
] as const;

export type PdfExportTemplate = (typeof PDF_EXPORT_TEMPLATES)[number];

export type DocumentLink = {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  label: string | null;
  createdAt: string;
};

export type DocumentVersion = {
  id: string;
  versionNumber: number;
  title: string;
  mimeType: string;
  fileName: string | null;
  byteSize: number;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
};

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
  tags?: string[];
  notes?: string | null;
  status?: DocumentStatus;
  keywords?: string | null;
  versionNumber?: number;
  links?: DocumentLink[];
};

export function isDocumentEntityType(value: string): value is DocumentEntityType {
  return (DOCUMENT_ENTITY_TYPES as readonly string[]).includes(value);
}

export function isDocumentCategory(value: string): value is DocumentCategory {
  return (DOCUMENT_CATEGORIES as readonly string[]).includes(value);
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return (DOCUMENT_STATUSES as readonly string[]).includes(value);
}

export function isPdfExportTemplate(value: string): value is PdfExportTemplate {
  return (PDF_EXPORT_TEMPLATES as readonly string[]).includes(value);
}

export function inferMimeKind(mimeType: string): "pdf" | "image" | "office" | "text" | "cad" | "video" | "other" {
  const mime = mimeType.toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("powerpoint") ||
    mime.includes("officedocument") ||
    mime.includes("msword") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation")
  ) {
    return "office";
  }
  if (mime.startsWith("text/") || mime.includes("json")) return "text";
  if (mime.includes("dwg") || mime.includes("dxf") || mime.includes("cad")) return "cad";
  if (mime.startsWith("video/")) return "video";
  return "other";
}
