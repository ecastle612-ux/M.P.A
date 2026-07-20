import type { VaultDocumentRecord, VaultEntityType } from "./contracts";

export type VaultBrowserCategoryId =
  | "all"
  | "leases"
  | "reports"
  | "invoices"
  | "facility"
  | "photos"
  | "permits"
  | "warranties"
  | "applicants"
  | "residents"
  | "maintenance"
  | "vendors";

export type VaultBrowserCategory = {
  id: VaultBrowserCategoryId;
  label: string;
  entityTypes?: VaultEntityType[];
  documentTypeIncludes?: string[];
};

export const VAULT_BROWSER_CATEGORIES: VaultBrowserCategory[] = [
  { id: "all", label: "All" },
  { id: "leases", label: "Leases", entityTypes: ["lease"] },
  { id: "reports", label: "Reports", documentTypeIncludes: ["report"] },
  { id: "invoices", label: "Invoices", documentTypeIncludes: ["invoice", "bill"] },
  { id: "facility", label: "Facility Documents", entityTypes: ["property", "unit", "asset"] },
  { id: "photos", label: "Photos", documentTypeIncludes: ["photo", "image", "media"] },
  { id: "permits", label: "Permits", documentTypeIncludes: ["permit"] },
  { id: "warranties", label: "Warranties", documentTypeIncludes: ["warranty"] },
  { id: "applicants", label: "Applicants", entityTypes: ["applicant"] },
  { id: "residents", label: "Residents", entityTypes: ["tenant"] },
  { id: "maintenance", label: "Maintenance", entityTypes: ["maintenance"] },
  { id: "vendors", label: "Vendors", entityTypes: ["vendor"] }
];

export function matchesVaultBrowserCategory(
  document: VaultDocumentRecord,
  categoryId: VaultBrowserCategoryId
): boolean {
  if (categoryId === "all") return true;
  const category = VAULT_BROWSER_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return true;

  const type = document.documentType.toLowerCase();
  const entityMatch = category.entityTypes?.includes(document.entityType) ?? false;
  const typeMatch =
    category.documentTypeIncludes?.some((token) => type.includes(token.toLowerCase())) ?? false;

  if (category.entityTypes && category.documentTypeIncludes) {
    return entityMatch || typeMatch;
  }
  if (category.entityTypes) return entityMatch;
  if (category.documentTypeIncludes) return typeMatch;
  return true;
}

export function formatVaultEntityLabel(entityType: string): string {
  if (entityType === "tenant") return "Resident";
  if (entityType === "maintenance") return "Maintenance";
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}
