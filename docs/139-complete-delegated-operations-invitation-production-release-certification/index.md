# 139 — Complete Delegated Operations Invitation Remediation Production Release Certification

**Title:** COMPLETE DELEGATED OPERATIONS INVITATION REMEDIATION PRODUCTION RELEASE CERTIFICATION  
**Status:** **PRODUCTION RELEASE SUCCESSFUL**  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations (invitation workflow only)  
**Authority:** Owner authorization to merge, deploy, and run controlled Production UAT · [docs/135](../135-complete-delegated-operations-invitation-remediation/index.md) **Approved** · [docs/136](../136-complete-delegated-operations-invitation-implementation-certification/index.md) · [docs/137](../137-complete-delegated-operations-invitation-production-migration-certification/index.md) · [docs/138](../138-complete-delegated-operations-invitation-production-migration-application-certification/index.md)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · `www.my-property-assistant.com`  
**This package:** Merge + Production deploy + controlled UAT. **No additional migration. No FIN-OPS. No Stripe/SKU changes.**

---

## Verdict

**PRODUCTION RELEASE SUCCESSFUL**

docs/135 invitation create/accept remediation is live in Production schema **and** application. Controlled Complete invitations now persist `property_manager` + the server-owned `operating_scope` and accept through trusted `service_role`.

---

## What this package did not do

- Did not apply another migration (`20260815220000` / `20260815200000` / `20260815210000` unused as apply stamps)
- Did not modify Stripe, billing, prices, subscriptions, SKUs, roles, or entitlement keys
- Did not implement FIN-OPS or create `financial_charges`
- Did not reset Gmail / real-customer passwords
- Did not destructively test last-BOTH against real Complete Gmail admins
- Did not send invitations to real customers

---

## 1. Pre-merge validation

Implementation PR corresponding to docs/136:

| Field | Value |
|-------|--------|
| PR | **#240** |
| Branch | `cursor/complete-delegated-operations-invitation-remediation-b7a1` |
| Implementation HEAD | `ff44c93c21a39a22ba0e4ef4887be5d7045f869f` |
| Mergeable | **CLEAN** |
| Drift since docs/136 | **None** — HEAD is the docs/136 commit |

CI `verify` run `31911523714`: **success** (lint, typecheck, production build, 51 shared + 84 web test files). Vercel Preview: **success** (`4UtDaVsuxmXGdhGVpZejY8pSwZ9H`).

Changed files were limited to invitation transport, create/list/resend, trusted accept, grant-cap / last-BOTH helpers, technician CHECK SQL, tests, and docs/135–136. No FIN-OPS / Stripe / SKU / unrelated schema.

---

## 2. Merge evidence

| Field | Value |
|-------|--------|
| PR | #240 |
| Method | GitHub merge commit (`gh pr merge --merge`) |
| Merged at | `2026-08-15T22:27:23Z` |
| Resulting `main` SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` |
| Post-merge CI | run `31912175237` **success** |

No force push. No CI bypass. No cherry-pick. Preview was not promoted as a Production substitute.

---

## 3. Production deploy evidence

| Field | Value |
|-------|--------|
| GitHub Production deployment | `5925325108` |
| SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` |
| Created | `2026-08-15T22:28:34Z` |
| Status | **success** (`Deployment has completed`) |
| Vercel target | `https://m-p-a-7vzsp7s52-ecastle612-uxs-projects.vercel.app` |
| Aliases | `www.my-property-assistant.com` **200** · `my-property-assistant.com` **200** |

Ledger after deploy (unchanged; no migration this package):

**`20260815222252` / `docs_135_invitation_acceptance_remediation`**

Do not apply `20260815220000` later. The successor repo file `supabase/migrations/20260815222252_docs_135_invitation_acceptance_remediation.sql` is the byte-identical Production stamp.

---

## 4. Existing ADR-033 regression

Controlled Complete org `a11ce001-0001-4000-8000-00000000c11c` (`M.P.A. UAT Clinic Demo`).

| Actor | Check | Result |
|-------|--------|--------|
| Erick BOTH | `/launcher` | **200** |
| Erick | `/pm/mission-control` | **200** |
| Erick | `/facility/mission-control` | **200** |
| Erick | `/api/pm/maintenance` + `/api/facility/assets` | **200** |
| Sarah Property | `/pm/mission-control` | **200** |
| Sarah | `/facility/mission-control` | unauthorized `facility.mission_control` |
| Sarah | `/api/facility/assets` | **403** |
| Mike Facility | `/facility/mission-control` | **200** |
| Mike | `/pm/mission-control` | unauthorized `pm.mission_control` |
| Mike | `/api/pm/maintenance` | **403** |
| Mike | tenant inbox `/api/shared/communications/conversations` | **403** |
| Mike | `/api/finance/snapshot` | **403** (authorization, not schema gap) |

Generic `/api/shared/communications` history remains a platform entitlement (200 for Complete staff). Tenant Communications Center inbox is the binding COM-002 denial and is **403** for Facility-scoped members.

---

## 5–6. Invitation create

From Erick (BOTH admin), official `POST /api/organizations/{id}/invitations`.

| Invite | HTTP | Persisted role | Persisted scope | `delivery_status` | `status` |
|--------|------|----------------|-----------------|-------------------|----------|
| Property | **201** | `property_manager` | `property_operations` | `failed` | `pending` then accepted |
| Facility | **201** | `property_manager` | `facility_operations` | `failed` | `pending` then accepted |

No `email_status` schema error. List GET returned 200 (old app failed on missing `email_status`). Business `status` stayed `pending` until accept. `last_delivered_at` stayed NULL because the provider did not accept the send. Computed API notice: “Invitation created but email failed — copy the accept link.” That is transport failure, not membership failure. No `facility_manager` role. No membership created before accept.

Ids: Property `e63f477f-…` · Facility `93fa76cc-…`.

---

## 7. Grant-cap negative tests

All **403** with approved copy:

| Inviter | Attempt | Result |
|---------|---------|--------|
| Sarah Property | grant `facility_operations` | 403 “You can only assign operational responsibility you hold.” |
| Sarah | grant `both` | 403 same |
| Sarah | grant `organization_admin` | 403 “Only an Organization Admin can invite another Organization Admin.” |
| Mike Facility | grant `property_operations` | 403 scope cap |
| Mike | grant `both` | 403 scope cap |
| Mike | grant `organization_admin` | 403 admin cap |

---

## 8. Invitee tamper

Pending Property invitation PATCH via PostgREST as the invitee JWT (roles → `organization_admin`, scope → `both`): **0 rows** (RLS). Live row unchanged: still `property_manager` + `property_operations`. Jwt-email UPDATE bypass is gone.

---

## 9–10. Trusted accept

`POST /api/invitations/{token}/accept` with a forged body. Server ignored the body.

| Invite | HTTP | Membership role | Membership scope | Retry |
|--------|------|-----------------|------------------|-------|
| Property | **200** | `property_manager` | `property_operations` | **200** `idempotent: true` |
| Facility | **200** | `property_manager` | `facility_operations` | **200** `idempotent: true` |

One `invitation.accepted` event each. No duplicate memberships. Accept `homeHref` was `/setup` because Guided Setup is incomplete on the UAT Clinic org (ADR-032). Direct homes after accept: Property → `/pm/mission-control` **200**; Facility → `/facility/mission-control` **200**.

---

## 11. Acceptance negatives

| Case | Result |
|------|--------|
| Wrong signed-in email (Sarah × Property token) | **403** “Sign in with the invited email address…” |
| Expired controlled invitation | **410** |
| Revoked controlled invitation | **409** |
| Already-accepted retry | **200** idempotent; no second membership; unique accepted-event index held (5 accepted events / 5 invitation ids) |
| Concurrent accept | **AUTOMATED** — `accept.route.test.ts` / invitation-service race (docs/136) |

---

## 12. Resulting Property member UAT

New member `uat.docs135.property@…`:

| Surface | Result |
|---------|--------|
| Home `/pm/mission-control` | **200** |
| `/api/pm/maintenance` | **200** |
| `/api/pm/reports/work-orders` | **200** |
| `/api/shared/communications` + tenant inbox | **200** |
| `/api/shared/tables` | **200** (workspace list) |
| FAC-003 assets / inventory / FO reports | **403** |
| `/facility/mission-control` | unauthorized `facility.mission_control` |
| OPS-001 FAC-003 asset connection create | **403** “platform.documents is not permission…” |
| `/api/finance/snapshot` | **400** `financial_charges` missing — **after** authorization (known docs/126 gap) |

---

## 13. Resulting Facility member UAT

New member `uat.docs135.facility@…`:

| Surface | Result |
|---------|--------|
| Home `/facility/mission-control` | **200** |
| FAC-003 assets / inventory / FO work-order reports | **200** |
| `/api/pm/maintenance` | **403** |
| `/api/pm/reports/work-orders` | **403** |
| Tenant inbox | **403** |
| `/pm/mission-control` | unauthorized `pm.mission_control` |
| OPS-001 residential work-order connection | **403** |
| `/api/finance/snapshot` | **403 Forbidden** |
| `/api/finance/charges` | **403 Forbidden** |

**CRITICAL:** Facility-scoped PM finance fails at authorization **before** the docs/126 `financial_charges` schema gap.

---

## 14. Last-BOTH admin safety

**AUTOMATED/CONTROLLED FIXTURE PASS** — `wouldLeaveCompleteWithoutBothAdmin` + membership PATCH + accept overwrite tests in docs/136 (operating-scope + invitation-service suites).

Live destructive tests against real Complete Gmail admins were **not** run.

A live PATCH against controlled Erick was **invalid** as a last-BOTH proof: two existing Gmail `organization_admin` rows on the same UAT org have `operating_scope` NULL, which Complete compatibility treats as Both. The helper correctly allowed the change. Erick was restored immediately to `organization_admin` + `both` + `active`. Gmail admin rows were not modified.

---

## 15. Support resend

Create already invoked the real invitation sender (`sendInvitationEmail`). Provider result: `delivery_status = failed`, `last_delivered_at` NULL, computed notice `failed`. No `email_status` column write. Business status remained `pending` until accept.

Support route `/api/admin/support/resend-invitation` is platform-operator-only (Erick **403**). Operator send path is covered by `resend-invitation.route.test.ts` (docs/136). Inbox delivery is **not** claimed.

---

## 16. Single-product compatibility

Live PM org `a11ce002-0001-4000-8000-0000000000c2` (`M.P.A. UAT Property Demo`):

| Requested scope | Stored scope | HTTP |
|-----------------|--------------|------|
| omitted | `property_operations` | 201 |
| `both` | `property_operations` | 201 — **did not expand SKU** |
| `facility_operations` | `property_operations` | 201 — **did not expand SKU** |

FO SKU: **0** live FO subscriptions. Implied Facility scope remains **AUTOMATED/HELPER PASS** (`validateInviteOperatingScope` / invitation-service tests). No paid FO subscription was created.

---

## 17. Security regression

| Check | Result |
|-------|--------|
| Invitee PostgREST membership INSERT | **403** |
| No invitation/accept `SECURITY DEFINER` function | **none** |
| PLAT-005 | no new client GRANT / no new privileged RPC |
| PLAT-002 fail-closed | unauthenticated APIs 401; missing entitlement 403 |
| ADR-033 scope | Property/Facility denials above |
| COM-002 Facility tenant inbox | **403** |
| FAC-003 Property | **403** |
| OPS-001 source isolation | **403** both directions |

---

## 18. Data safety

| Object | Before | After | Explanation |
|--------|--------|-------|-------------|
| organizations | 21 | 21 | — |
| memberships | 34 | **36** | +2 controlled accepts (`uat.docs135.property` / `facility`) |
| invitations | 7 | **14** | +2 Complete accepted, +2 Complete expired/revoked fixtures, +3 PM implied-scope fixtures |
| operating-scope events | 8 | **19** | +7 `invitation.created`, +2 `invitation.accepted`, +2 `membership.updated` from the invalid Erick PATCH (restored) |
| subscriptions | 6 | 6 | same SKU mix |
| work orders | 33 | 33 | — |
| FAC-003 assets / stock / movements | 6 / 2 / 9 | 6 / 2 / 9 | — |
| COM-002 conversations / messages | 2 / 0 | 2 / 0 | — |
| OPS-001 documents / tables | 1 / 7 | 1 / 7 | connection POSTs denied; no table created |
| July `financial_activity` | 12 | 12 | — |
| `financial_charges` | absent | **absent** | — |

No real customer memberships rewritten. Gmail Complete admin rows unchanged.

---

## 19. FIN-OPS hard stop

docs/126 remains **AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**.

No `financial_charges`. No S0/S1/S2 replay. July finance unchanged. No `pm.finance:*` grant changes. No Stripe/billing writes.

---

## 20. Incident status

**Contained UAT fixture restore — not a customer incident.**

During last-BOTH exploration, controlled Erick was PATCHed because he was not actually the last Both admin (NULL-scope Gmail admins still count as Both). Restored the same session to `organization_admin` + `both` + `active`. Verified live. No Production rollback. No additional migration.

---

## Final verdict

**PRODUCTION RELEASE SUCCESSFUL**
