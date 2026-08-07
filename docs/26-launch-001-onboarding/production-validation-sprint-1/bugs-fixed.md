# Bugs Fixed — Production Validation Sprint 1

Every fix restores advertised experience only. No new features.

---

## PV-C1 — Resident portal home/documents empty after first login

| Field | Detail |
|-------|--------|
| **Root cause** | Tenant home/docs read only `mpa_active_organization_id` cookie; magic-link first login often has no cookie. Maintenance API already fell back to `pm_residents`. |
| **Scope** | `resolve-active-organization.ts` (new); tenant home + documents pages; tenant maintenance API; owner portfolio APIs; middleware cookie bootstrap |
| **Regression** | `@mpa/shared` 79 tests; `@mpa/web` typecheck + lint |
| **Production verification** | Staging: activate lease → open resident magic link → Welcome shows lease + documents (not “appear after activation”) |

---

## PV-C2 — Active org cookie / shell / localStorage diverge

| Field | Detail |
|-------|--------|
| **Root cause** | Client preferred localStorage over server-resolved org; cookie not set on login. |
| **Scope** | `organization-context.tsx` (server default canonical); middleware membership cookie bootstrap; org-scoped main remount on switch |
| **Regression** | typecheck + lint |
| **Production verification** | Staging: login as multi-org user; header org matches API data; switch org remounts Mission Control for new org |

---

## PV-C3 — Empty membership roles invent Property Manager

| Field | Detail |
|-------|--------|
| **Root cause** | `get-shell-context` used `?? "property_manager"`; portal index routed invented PM home. |
| **Scope** | `get-shell-context.ts`; app layout unauthorized redirect; portal index |
| **Regression** | typecheck + lint |
| **Production verification** | Staging: membership with empty roles → `/unauthorized?reason=role` with recovery (not Mission Control) |

---

## PV-P1 (fixed this sprint)

| ID | Root cause | Scope |
|----|------------|-------|
| PV-P1-1 Nav SKU-only | Nav ignored role capabilities | `navigationGroupsForSku(sku, roles)` + commercial context |
| PV-P1-2 Org switch stale body | Client desks ignored org id | `OrgScopedMain` key + MC refetch on org id |
| PV-P1-3 MC GET marks daily ops for any reader | Side-effect on GET for leasing/tech | `getMissionControlState` manager-only mark |
| PV-P1-4 Checkout omits Org Admin | `isManager` checked PM only | `checkout/route.ts` |
| PV-P1-5 Team 403 empty state | Failed fetch left null forever | `team-invite-panel.tsx` |
| PV-P1-6 Notifications hide errors | `!ok` cleared error | `notification-center.tsx` |
| PV-P1-7 Active role ≠ primaryRole | `resolveActiveRole` used `roles[0]` | `authorization.ts` + test |

Also: manager portal allows Org Admin; unauthorized recovery links trimmed for role/entitlement/admin reasons; login preserves safe `?next=`.

---

## Explicitly not changed

Customer journeys, commercial architecture, navigation architecture (structure), Financial Operations expansion, Facility Operations, subscription model.
