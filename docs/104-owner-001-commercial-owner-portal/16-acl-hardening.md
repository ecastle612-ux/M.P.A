# 16 — ACL Hardening (Interim Owner Access)

**Package:** OWNER-001  
**Status:** Hardening complete (pre–Phase 3)  
**Date:** 2026-07-22  
**Scope:** Isolate interim owner ACL for a future `owner_property_access` swap — **no schema, no Phase 3 features**

---

## 1. Current ACL

**Single module:** `apps/web/src/lib/owner-portal/access.ts`

| Piece | Role |
|-------|------|
| `resolveOwnerPropertyScope` | Sole public resolver for owner-accessible properties |
| `resolveCurrentInterimOwnerPropertyScope` | **A. Current implementation** |
| `resolveFutureOwnerPropertyAccessScope` | **B. Future stub** (returns `null` until schema lands) |
| Filter helpers | Shared predicates so callers do not re-implement ACL |

### Current resolution order (interim)

1. Load org properties via `getPropertiesForOrganization` (already org-scoped + RBAC at call sites).
2. If `properties.owner_contact_email` matches the signed-in user email → `scopeMode: "contact_email"`.
3. Else if org has properties → `scopeMode: "organization_role_interim"` (all org properties the membership can read).
4. Else → `scopeMode: "empty"`.

`ownerPropertyAccessTableMissing` remains `true` while the interim path is active.

### Consumers (must use resolver / helpers)

| Surface | Enforcement |
|---------|-------------|
| Dashboard (`lib/owner-portal/dashboard.ts`) | Resolve once; filter finance / messages / vault / notifications via helpers |
| `/portal/owner/properties` | `scope.properties` only |
| `/portal/owner/financials` | Per-property summaries + filtered expenses/statements (no org-wide metrics) |
| `/portal/owner/documents` | `filterVaultDocumentsForOwnerScope` |
| `/portal/owner/reports` | Statements via `filterByOwnerPropertyScope` |
| `/portal/owner/messages` | Threads via `filterByOwnerPropertyScope` |

---

## 2. Known limitations

| Limitation | Impact | Mitigation path |
|------------|--------|-----------------|
| `organization_role_interim` | In multi-owner orgs without `owner_contact_email` matches, an owner may see **all** org properties their role can read | Replace with `owner_property_access` |
| Email-match ACL | Relies on contact email hygiene; aliases / shared inboxes can mis-scope | Explicit access rows |
| Post-fetch filtering | Org-wide list APIs still load broader rows; UI filters to scope | Acceptable interim; prefer ID-filtered queries when APIs support them |
| Report catalog | Catalog metadata is type list only (no per-org data leak) | N/A |
| Notifications without `propertyId` | Kept if already user-targeted | Revisit when notification taxonomy is owner-scoped |
| Cap of 20 properties for fan-out summaries | Large portfolios may under-count financial KPIs | Raise cap or add aggregate service later |

---

## 3. Future migration plan

Target table (not migrated): `owner_property_access` (+ related owner account model when designed).

```
Design/schema lands → Implement resolveFutureOwnerPropertyAccessScope
  → Flip cached resolver switch
  → Remove or demote interim fallback
  → Set ownerPropertyAccessTableMissing: false
```

Callers (`dashboard.ts`, section pages) **do not change** if they continue to use `resolveOwnerPropertyScope` and the filter helpers.

---

## 4. Replacement steps

When schema + types exist:

1. Implement `resolveFutureOwnerPropertyAccessScope` in `access.ts`:
   - Query `owner_property_access` for `(organization_id, owner_user_id)` (exact column names per migration).
   - Enforce org + user equality in the query; rely on RLS.
   - Map rows → property IDs → `PropertyListItem[]` (reuse property service).
   - `buildScope({ …, scopeMode: "owner_property_access", ownerPropertyAccessTableMissing: false })`.
2. In `resolveOwnerPropertyScopeCached`, uncomment the future switch:
   - Call future first; return if non-null.
   - Optionally keep interim as emergency fallback behind a feature flag (default off in production).
3. Delete or quarantine `resolveCurrentInterimOwnerPropertyScope` once production traffic uses access rows.
4. Add integration tests: owner A cannot see owner B property within same org.
5. No changes required in section pages if they already call the public resolver/helpers.

---

## 5. Risk assessment

| Risk | Severity | Notes |
|------|----------|-------|
| Interim org-role overshare | **High** (multi-owner orgs) | Documented; primary reason for future table |
| Contact-email spoof / mismatch | Medium | Ops hygiene; not cryptographically bound to account |
| Missed call site bypassing ACL | Medium → **Low after hardening** | Audit found section pages unscoped; now wired |
| Global cache of property IDs | N/A | Only React `cache()` per request |
| Client-trusted filters | Low | All filtering is server-side RSC |

---

## 6. Performance notes

| Technique | Detail |
|-----------|--------|
| Request-scoped `cache()` | `resolveOwnerPropertyScopeCached` dedupes property list load within one RSC request |
| Reuse `propertyIds` / `propertyIdSet` | Built once in `buildScope`; filters use O(1) set membership |
| `cappedOwnerPropertyIds` | Limits fan-out of `getPropertyFinancialSummary` |
| No global/cross-request cache | Avoids stale ACL across users/sessions |

Remaining cost: org list APIs still fetch then filter. Acceptable until property-scoped list options are standardized.

---

## 7. Security verification

### Enforcement points

| Control | Where |
|---------|-------|
| Auth session | Each owner page + dashboard loader |
| Active org | `resolveActiveOrganizationIdForUser` |
| Capability RBAC | `evaluatePermission` (`property:read`, `financial:read`, `document:read`, `message:read`, `notification:read`) |
| Property ACL | `resolveOwnerPropertyScope` + helpers only |
| Org boundary | Underlying services `.eq("organization_id", …)` |
| Vault non-property entities | Excluded by `filterVaultDocumentsForOwnerScope` |
| Financial org-wide metrics | **Removed** from owner financials page (was a leak path) |

### Threat checks (post-hardening)

| Threat | Result |
|--------|--------|
| Another owner's property (when contact email matches) | Blocked — only matched properties |
| Another owner's property (org-role interim) | **Not blocked** — known interim limitation |
| Another organization's data | Blocked — org context + service filters |
| Unrestricted vault documents | Blocked — property-entity + scope filter |
| Unrestricted financial summaries | Blocked — per-property summaries in scope |
| Unrestricted reports/statements | Blocked — statement `propertyId` filter |
| Unrestricted notifications | Partially scoped — property-linked filtered; user-targeted null-`propertyId` kept |
| Unrestricted messages | Blocked — thread `propertyId` filter |

---

## 8. Confirmation

The Owner Portal ACL layer is **migration-ready**: replacing interim resolution with `owner_property_access` requires changes primarily inside `access.ts` (implement future resolver + flip the switch). Dashboard and section pages already depend on the public API surface.
