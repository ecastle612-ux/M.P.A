# 15 — Phase 2 Verification

**Package:** OWNER-001  
**Phase:** 2 — Dashboard Data  
**Date:** 2026-07-22  
**Verdict:** **PASS** (with known scoping interim)

---

## Quality tools

| Check | Result |
|-------|--------|
| Typecheck (`@mpa/web`) | **PASS** |
| ESLint (Phase 2 owner dashboard files) | **PASS** |
| Build | See delivery notes / CI |

---

## Widgets — live data

| Widget | Live? | Source |
|--------|-------|--------|
| Properties (count) | Yes | `resolveOwnerPropertyScope` → `getPropertiesForOrganization` |
| Occupancy | Yes | Unit/occupancy counts on scoped properties |
| Recent collections | Yes | Sum of `getPropertyFinancialSummary.monthlyIncome` (MTD) |
| Expenses | Yes | Sum of `getPropertyFinancialSummary.monthlyExpenses` (MTD) |
| Outstanding balance | Yes | Sum of `getPropertyFinancialSummary.outstandingBalance` |
| Latest statement | Yes | `getOwnerStatementsForOrganization` filtered to scope |
| Recent vendor expenses | Yes | `getExpensesForOrganization` filtered to scope |
| Recent messages | Yes | `getThreadsForOrganization` filtered to scoped property IDs |
| Recent documents | Yes | Vault docs with `entityType=property` in scope |
| Recent reports | Yes | Scoped owner statements list |
| Notifications | Yes | `getNotificationsForUser` (user-scoped; property filter when present) |

## Widgets — placeholders (intentional)

| Widget | Reason |
|--------|--------|
| Pending payout | FIN-003 / Future Release — non-operational copy only |

---

## RBAC / scoping summary

| Control | Status |
|---------|--------|
| Capability gates (`property:read`, `financial:read`, `message:read`, `document:read`, `notification:read`) | Enforced per widget |
| Organization isolation | Via existing org-scoped services |
| `owner_property_access` table | **Not migrated** — interim scoping via `owner_contact_email` match, else org-role property set (Q1-A) |
| Cross-owner / admin surfaces | Not queried |
| Fabricated data | None |

**Blocker for perfect property ACL:** `owner_property_access` remains architectural (docs 09 / ADR-003) and is not in Supabase types/migrations. Phase 2 documents this interim explicitly in `lib/owner-portal/access.ts`.

---

## Out of scope respected

No Property/Financial/Documents/Messages/Reports/Settings page builds; no Stripe/ACH/payouts; no schema; no new APIs; no AI/analytics.
