/** Client-safe Owner document types and helpers (no server imports). */

export const OWNER_DOCUMENT_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "statements", label: "Statements", documentTypeIncludes: ["statement", "owner_statement"] },
  { id: "reports", label: "Reports", documentTypeIncludes: ["report"] },
  { id: "leases", label: "Leases", documentTypeIncludes: ["lease"] },
  { id: "inspections", label: "Inspections", documentTypeIncludes: ["inspection"] },
  { id: "invoices", label: "Invoices", documentTypeIncludes: ["invoice", "bill"] },
  { id: "photos", label: "Photos", documentTypeIncludes: ["photo", "image", "media"] },
  { id: "permits", label: "Permits", documentTypeIncludes: ["permit"] },
  { id: "warranties", label: "Warranties", documentTypeIncludes: ["warranty"] },
  { id: "maintenance", label: "Maintenance", documentTypeIncludes: ["maintenance", "work_order"] },
  { id: "facility", label: "Facility", documentTypeIncludes: ["facility", "property"] }
] as const;

export type OwnerDocumentCategoryId = (typeof OWNER_DOCUMENT_CATEGORIES)[number]["id"];

export type OwnerDocumentListItem = {
  id: string;
  title: string;
  documentType: string;
  propertyId: string;
  propertyName: string;
  categoryLabel: string;
  categoryId: OwnerDocumentCategoryId;
  uploadedAt: string;
  uploadedAtLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  fileSizeLabel: string | null;
  statusLabel: string | null;
  downloadHref: string | null;
  available: boolean;
};

export function resolveOwnerDocumentCategory(documentType: string): {
  id: OwnerDocumentCategoryId;
  label: string;
} {
  const type = documentType.toLowerCase();
  for (const category of OWNER_DOCUMENT_CATEGORIES) {
    if (category.id === "all") continue;
    if ("documentTypeIncludes" in category) {
      const tokens = category.documentTypeIncludes;
      if (tokens.some((token) => type.includes(token))) {
        return { id: category.id, label: category.label };
      }
    }
  }
  return { id: "facility", label: "Facility" };
}

export function matchesOwnerDocumentCategory(
  item: OwnerDocumentListItem,
  categoryId: OwnerDocumentCategoryId
): boolean {
  if (categoryId === "all") return true;
  return item.categoryId === categoryId;
}
