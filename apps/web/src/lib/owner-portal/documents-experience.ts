import type { User } from "@supabase/supabase-js";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import type { createAuthServerComponentClient } from "../auth/server";
import { getVaultDocumentsForEntity } from "../vault/server";
import type { VaultDocumentRecord } from "../vault/contracts";
import {
  cappedOwnerPropertyIds,
  isPropertyInOwnerScope,
  resolveOwnerPropertyScope,
  type OwnerPropertyScope
} from "./access";
import {
  resolveOwnerDocumentCategory,
  type OwnerDocumentListItem
} from "./documents-shared";

export type {
  OwnerDocumentCategoryId,
  OwnerDocumentListItem
} from "./documents-shared";
export {
  OWNER_DOCUMENT_CATEGORIES,
  matchesOwnerDocumentCategory,
  resolveOwnerDocumentCategory
} from "./documents-shared";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type OwnerDocumentsExperienceModel = {
  scope: OwnerPropertyScope;
  documents: OwnerDocumentListItem[];
  properties: Array<{ id: string; name: string }>;
  documentTypes: string[];
  loadNotes: string[];
};

async function safeLoad<T>(loader: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load data."
    };
  }
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function formatFileSizeLabel(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readMetadataNumber(metadata: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function readMetadataString(metadata: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Exclude internal / non-owner vault rows using existing metadata + type signals only.
 * Property-entity fetch is the primary ACL gate; this is defense in depth.
 */
export function isOwnerVisibleVaultDocument(document: VaultDocumentRecord): boolean {
  if (document.entityType !== "property") return false;
  if (document.deletedAt) return false;

  const meta = document.metadata ?? {};
  const visibility = readMetadataString(meta, [
    "visibility",
    "audience",
    "access",
    "accessLevel",
    "ownerVisibility"
  ])?.toLowerCase();

  if (visibility) {
    if (
      ["internal", "private", "pm_only", "admin", "admin_only", "vendor", "vendor_only", "staff"].includes(
        visibility
      )
    ) {
      return false;
    }
  }

  if (meta["ownerVisible"] === false || meta["owner_visible"] === false) return false;
  if (meta["internal"] === true || meta["pmOnly"] === true || meta["adminOnly"] === true) return false;

  const type = document.documentType.toLowerCase();
  const blockedTypeTokens = [
    "internal",
    "admin_note",
    "admin-note",
    "pm_only",
    "pm-only",
    "vendor_only",
    "vendor-only",
    "private_attachment",
    "accounting_only",
    "accounting-only"
  ];
  if (blockedTypeTokens.some((token) => type.includes(token))) return false;

  return true;
}

export function toOwnerDocumentListItem(
  document: VaultDocumentRecord,
  propertyName: string
): OwnerDocumentListItem {
  const category = resolveOwnerDocumentCategory(document.documentType);
  const byteSize = readMetadataNumber(document.metadata, ["byteSize", "byte_size", "fileSize", "file_size"]);
  const status = readMetadataString(document.metadata, ["status", "documentStatus", "state"]);
  const downloadHref = document.fileUrl?.trim() || null;

  return {
    id: document.id,
    title: document.title,
    documentType: document.documentType,
    propertyId: document.entityId,
    propertyName,
    categoryLabel: category.label,
    categoryId: category.id,
    uploadedAt: document.createdAt,
    uploadedAtLabel: formatDateLabel(document.createdAt),
    updatedAt: document.updatedAt,
    updatedAtLabel: formatDateLabel(document.updatedAt),
    fileSizeLabel: byteSize === null ? null : formatFileSizeLabel(byteSize),
    statusLabel: status,
    downloadHref,
    available: Boolean(downloadHref)
  };
}

/**
 * OWNER-001 Phase 5 — property-scoped vault documents only (no org-wide vault list).
 */
export async function loadOwnerDocumentsExperience(input: {
  user: User;
  organizationId: string;
  supabase: SupabaseClient;
  /** When set, only that property (must be in owner scope). */
  propertyId?: string;
}): Promise<OwnerDocumentsExperienceModel> {
  const { user, organizationId, supabase, propertyId } = input;
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "document:read")) {
    throw new Error("Document access is not enabled for this account.");
  }

  const scope = await resolveOwnerPropertyScope({ organizationId, user, supabase });
  const loadNotes: string[] = [];

  let targetIds: string[];
  if (propertyId) {
    if (!isPropertyInOwnerScope(propertyId, scope)) {
      return {
        scope,
        documents: [],
        properties: [],
        documentTypes: [],
        loadNotes: ["This property is not in your owner access."]
      };
    }
    targetIds = [propertyId];
  } else {
    targetIds = cappedOwnerPropertyIds(scope, 40);
    if (scope.propertyIds.length > targetIds.length) {
      loadNotes.push(
        `Showing documents for the first ${targetIds.length} of ${scope.propertyIds.length} properties.`
      );
    }
  }

  const propertyNameById = new Map(scope.properties.map((property) => [property.id, property.name]));
  const documents: OwnerDocumentListItem[] = [];

  const bundles = await Promise.all(
    targetIds.map(async (id) => {
      const result = await safeLoad(() =>
        getVaultDocumentsForEntity(organizationId, "property", id, supabase)
      );
      return { propertyId: id, result };
    })
  );

  for (const { propertyId: id, result } of bundles) {
    if (!result.ok) {
      loadNotes.push(`Documents could not be loaded for ${propertyNameById.get(id) ?? "a property"}.`);
      continue;
    }
    const propertyName = propertyNameById.get(id) ?? "Property";
    for (const doc of result.data) {
      if (!isOwnerVisibleVaultDocument(doc)) continue;
      if (!isPropertyInOwnerScope(doc.entityId, scope)) continue;
      documents.push(toOwnerDocumentListItem(doc, propertyName));
    }
  }

  documents.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : a.uploadedAt > b.uploadedAt ? -1 : 0));

  const documentTypes = [...new Set(documents.map((doc) => doc.documentType))].sort((a, b) =>
    a.localeCompare(b)
  );

  const properties = targetIds.map((id) => ({
    id,
    name: propertyNameById.get(id) ?? "Property"
  }));

  return {
    scope,
    documents,
    properties,
    documentTypes,
    loadNotes: [...new Set(loadNotes)]
  };
}
