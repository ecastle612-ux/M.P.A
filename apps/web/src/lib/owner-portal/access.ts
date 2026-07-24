import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createAuthServerComponentClient } from "../auth/server";
import { getPropertiesForOrganization, type PropertyListItem } from "../property/server";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

// =============================================================================
// Public types (stable for Owner Portal consumers)
// =============================================================================

export type OwnerPropertyScopeMode =
  /** Interim: properties.owner_contact_email matches the signed-in user. */
  | "contact_email"
  /**
   * Interim: owner_property_access missing; org properties visible to property_owner.
   * Still organization-isolated via membership + RBAC.
   */
  | "organization_role_interim"
  /** Future: rows from owner_property_access for this user. */
  | "owner_property_access"
  | "empty";

export type OwnerPropertyScope = {
  organizationId: string;
  userId: string;
  properties: PropertyListItem[];
  /** Stable ordered IDs — reuse for all widget queries in the request. */
  propertyIds: string[];
  propertyIdSet: Set<string>;
  scopeMode: OwnerPropertyScopeMode;
  /**
   * True while architectural owner_property_access is not available.
   * Flip to false when Future implementation path is active.
   */
  ownerPropertyAccessTableMissing: boolean;
};

/**
 * Future schema contract (not migrated — do not query).
 * When the table lands, map rows → property IDs inside resolveFutureOwnerPropertyAccessScope.
 */
export type OwnerPropertyAccessRow = {
  ownerId: string;
  propertyId: string;
  organizationId: string;
  permissions?: string[] | null;
};

// =============================================================================
// A. Current implementation (interim ACL)
// =============================================================================

function normalizeEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function buildScope(input: {
  organizationId: string;
  userId: string;
  properties: PropertyListItem[];
  scopeMode: OwnerPropertyScopeMode;
  ownerPropertyAccessTableMissing: boolean;
}): OwnerPropertyScope {
  const propertyIds = input.properties.map((property) => property.id);
  return {
    organizationId: input.organizationId,
    userId: input.userId,
    properties: input.properties,
    propertyIds,
    propertyIdSet: new Set(propertyIds),
    scopeMode: input.scopeMode,
    ownerPropertyAccessTableMissing: input.ownerPropertyAccessTableMissing
  };
}

/**
 * CURRENT — interim owner property resolution.
 *
 * Order:
 * 1) Match properties.owner_contact_email to the user email.
 * 2) Else org-role interim (all org properties the membership can read).
 *
 * Always loaded via getPropertiesForOrganization (org-scoped).
 */
async function resolveCurrentInterimOwnerPropertyScope(input: {
  organizationId: string;
  userId: string;
  userEmail: string | null;
  supabase: SupabaseClient;
}): Promise<OwnerPropertyScope> {
  const properties = await getPropertiesForOrganization(input.organizationId, input.supabase, {
    limit: 100
  });

  const byContactEmail = input.userEmail
    ? properties.filter((property) => normalizeEmail(property.ownerContactEmail) === input.userEmail)
    : [];

  if (byContactEmail.length > 0) {
    return buildScope({
      organizationId: input.organizationId,
      userId: input.userId,
      properties: byContactEmail,
      scopeMode: "contact_email",
      ownerPropertyAccessTableMissing: true
    });
  }

  if (properties.length === 0) {
    return buildScope({
      organizationId: input.organizationId,
      userId: input.userId,
      properties: [],
      scopeMode: "empty",
      ownerPropertyAccessTableMissing: true
    });
  }

  return buildScope({
    organizationId: input.organizationId,
    userId: input.userId,
    properties,
    scopeMode: "organization_role_interim",
    ownerPropertyAccessTableMissing: true
  });
}

// =============================================================================
// B. Future implementation (owner_property_access) — interface only
// =============================================================================

/**
 * FUTURE — replace interim resolution when `owner_property_access` is migrated.
 *
 * Replacement steps (see docs/104-owner-001…/16-acl-hardening.md):
 * 1. Implement this function against Supabase (RLS + org + owner_id = user).
 * 2. Load PropertyListItem[] for those IDs (reuse getPropertiesForOrganization or by-id helper).
 * 3. Switch resolveOwnerPropertyScopeCached to call this first; keep interim as fallback only if needed.
 * 4. Set ownerPropertyAccessTableMissing: false and scopeMode: "owner_property_access".
 *
 * TODO(OWNER-001 / schema): Implement when owner_property_access + owner_accounts land.
 * TODO(OWNER-001 / schema): Do not call this until types/migrations exist — it must stay unused.
 */
export async function resolveFutureOwnerPropertyAccessScope(input: {
  organizationId: string;
  userId: string;
  supabase: SupabaseClient;
}): Promise<OwnerPropertyScope | null> {
  void input;
  // Intentionally unimplemented — table not in schema.
  // When ready: query owner_property_access → property IDs → buildScope(...).
  return null;
}

// =============================================================================
// Request-scoped entry point (single module for all Owner Portal property ACL)
// =============================================================================

/**
 * React `cache` dedupes within one RSC/request — avoids repeated property list queries
 * when dashboard + sibling loaders resolve scope. Not a global/cross-request cache.
 */
const resolveOwnerPropertyScopeCached = cache(
  async (organizationId: string, userId: string, userEmail: string | null): Promise<OwnerPropertyScope> => {
    const supabase = await createAuthServerComponentClient();

    // --- Future switch point ---
    // const future = await resolveFutureOwnerPropertyAccessScope({ organizationId, userId, supabase });
    // if (future) return future;

    return resolveCurrentInterimOwnerPropertyScope({
      organizationId,
      userId,
      userEmail,
      supabase
    });
  }
);

/**
 * Sole public resolver for owner-accessible properties.
 * All Owner Portal surfaces must call this (or filter helpers below) — no ad-hoc ACL.
 */
export async function resolveOwnerPropertyScope(input: {
  organizationId: string;
  user: User;
  /** Accepted for call-site convenience; resolution uses request-cached auth client. */
  supabase?: SupabaseClient;
}): Promise<OwnerPropertyScope> {
  return resolveOwnerPropertyScopeCached(
    input.organizationId,
    input.user.id,
    normalizeEmail(input.user.email)
  );
}

// =============================================================================
// Shared filter helpers (no duplicated predicate logic in callers)
// =============================================================================

export function isPropertyInOwnerScope(
  propertyId: string | null | undefined,
  scope: OwnerPropertyScope
): boolean {
  if (!propertyId) return false;
  return scope.propertyIdSet.has(propertyId);
}

/** Filter records that carry a propertyId foreign key. */
export function filterByOwnerPropertyScope<T>(
  items: readonly T[],
  scope: OwnerPropertyScope,
  getPropertyId: (item: T) => string | null | undefined
): T[] {
  if (scope.propertyIds.length === 0) return [];
  return items.filter((item) => isPropertyInOwnerScope(getPropertyId(item), scope));
}

/**
 * Vault documents: only property-entity rows in scope.
 * Non-property entity types are excluded (owner must not see org-wide / other entities).
 */
export function filterVaultDocumentsForOwnerScope<
  T extends { entityType: string; entityId: string }
>(documents: readonly T[], scope: OwnerPropertyScope): T[] {
  if (scope.propertyIds.length === 0) return [];
  return documents.filter(
    (doc) => doc.entityType === "property" && isPropertyInOwnerScope(doc.entityId, scope)
  );
}

/**
 * Notifications: user-targeted rows only (caller must already query by userId).
 * Rows with propertyId must be in scope; rows without propertyId remain (personal/org alerts for that user).
 */
export function filterNotificationsForOwnerScope<
  T extends { propertyId: string | null }
>(notifications: readonly T[], scope: OwnerPropertyScope): T[] {
  return notifications.filter((item) => {
    if (!item.propertyId) return true;
    return isPropertyInOwnerScope(item.propertyId, scope);
  });
}

/** Cap property IDs for fan-out reads (e.g. per-property financial summaries). */
export function cappedOwnerPropertyIds(scope: OwnerPropertyScope, limit = 20): string[] {
  return scope.propertyIds.slice(0, limit);
}
