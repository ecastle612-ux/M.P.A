# 30 — REG-COV-001 QA Fixture Certification (M0-REG-003)

**Package:** CORE-003 · M0 · Authenticated Regression  
**Authorization:** M0-REG-003 — QA fixture provisioning & regression coverage (LIMITED)  
**Date:** 2026-07-24  
**Production URL:** `https://www.my-property-assistant.com`  
**Evidence:** [`m0-reg-003/`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-003/)  
**Related:** [28](./28-m0-authenticated-regression-certification.md) · [29](./29-reg-stor-001-remediation.md) · [31](./31-role-model-reconciliation.md) · [33](./33-core-003-amd-m0-auth-role-cert-defer.md) ✅ APPROVED

> UX-012 / OPS / AUTH / COM / FIN-003 · device certification: 🔒 not authorized.  
> No product UX redesign. No new product functionality. No architecture invention.

---

## 1. Executive Summary

Dedicated production QA organization **MPA QA Certification** and membership-role accounts were provisioned. Authenticated login + portal routing were exercised for every role that exists in the current architecture.

**REG-COV-001 does not PASS.**

| Verdict | Result |
|---------|--------|
| **QA fixtures provisioned (architecturally valid roles)** | ✅ Done |
| **Full 8-role coverage required by cert matrix** | ❌ **FAIL** — 3 roles require architecture changes (STOP) |
| **Authenticated regression suite overall** | ❌ **FAIL** |
| **New HIGH defect discovered** | ✅ **REG-ACL-001** (documented; not fixed under this auth) |
| **Recommend UX-012 unlock?** | ❌ **NO** |
| **Recommend device certification?** | ❌ **NO** — wait for explicit authorization after suite PASS |

---

## 2. QA Organization

| Field | Value |
|-------|--------|
| Name | **MPA QA Certification** |
| Slug | `mpa-qa-certification` |
| Organization ID | `86547058-1166-4e7d-94b6-7ff17632f989` |
| Isolation control org | **MPA QA Isolation Control** (`mpa-qa-isolation` · `e399ec77-5062-460e-b180-9d80081a76c6`) |
| Customer org? | **No** — dedicated QA asset |
| Credentials | `qa/e2e/.env.local` (gitignored via `.env*`) — **not committed** |
| Seed script | `qa/e2e/scripts/seed-m0-qa-certification.ts` |

Safety labels applied in fixture metadata: `qa_certification`, `exclude_from_analytics`, `suppress_notifications`. Emails use `@qa.mpa.local`.

---

## 3. QA Accounts

| Required role (cert matrix) | Provisioned? | Account / mapping | Notes |
|----------------------------|:------------:|-------------------|-------|
| Master Administrator | ✅ | `qa-master-admin@qa.mpa.local` | `app_metadata.dev_master_admin=true` (+ empty membership roles) |
| Organization Administrator | ❌ STOP | Proxy only: `qa-org-admin@qa.mpa.local` → **`property_manager`** | No `organization_admin` in DB CHECK / `USER_ROLES` |
| Property Manager | ✅ | `qa-pm@qa.mpa.local` | Membership `property_manager` |
| Property Owner | ✅ | `qa-owner@qa.mpa.local` | Membership `property_owner` |
| Leasing Agent | ❌ STOP | — | Not in `organization_memberships_roles_check` / `USER_ROLES` |
| Facility Technician | ❌ STOP | — | Not in `organization_memberships_roles_check` / `USER_ROLES` |
| Vendor | ✅ | `qa-vendor@qa.mpa.local` | Membership `vendor` |
| Tenant | ✅ | `qa-tenant@qa.mpa.local` | Membership `tenant` |

### Architecture STOP (do not invent)

Canonical membership roles today:

```text
property_manager | property_owner | tenant | vendor
```

Sources:

- DB: `organization_memberships_roles_check`
- Code: `packages/shared/src/types/roles.ts` (`USER_ROLES`)

Master Admin is **not** an org membership role; it uses `app_metadata.dev_master_admin`.

**Required to provision the three missing distinct roles (out of scope):** Design → Document → Approve for role-model expansion (CHECK constraint, `USER_ROLES`, auth/session, portals/nav, permission grants). This authorization forbids inventing that architecture.

---

## 4. QA Dataset

Official regression baseline (minimal, QA-labeled):

| Asset | Count | Identity |
|-------|------:|----------|
| Property | 1 | QA Certification Property (`QA-PROP-001`) |
| Building | N/A | No `buildings` table — property is the portfolio root |
| Units | 2 | 101 (occupied), 102 (vacant_ready) |
| Tenants | 2 | Linked QA tenant + second placeholder |
| Vendor | 1 | QA Certification Vendor |
| Facility Technician | 0 | Role does not exist |
| Maintenance request | 1 | `QA-WO-001` |
| Vendor job token | 1 | Hashed token on WO (no real payout) |
| Document | 1 | QA Certification Document (vault) |
| Message thread | 1 | QA Certification Thread + baseline message |
| Report / statement | 1 | Owner statement `QA-STMT-001` (draft) |
| Lease | 1 | `QA-LEASE-001` (required for SetupGate completion for PM) |

Inventory artifact: `m0-reg-003/dataset-inventory.json` · `provision-summary.json`

---

## 5. Coverage Matrix

| Area | Result | Evidence |
|------|--------|----------|
| Authentication (password login) | ✅ PASS | PM login → `/dashboard`; storage states for 5 roles |
| Master Admin routing | ✅ PASS | `/master-admin` Mission Control |
| Property Manager routing / ops surfaces | ✅ PASS | `/dashboard`, `/properties`, `/units`, `/tenants`, `/maintenance`, `/vendors`, `/leases`, `/financials` |
| Property Owner portal | ✅ PASS | `/portal/owner` (+ properties / financials / documents) |
| Tenant portal | ✅ PASS | `/portal/tenant` shows QA property/unit + thread |
| Vendor portal | ✅ PASS | `/portal/vendor` shows QA vendor work queue |
| Organization Administrator (distinct) | ❌ NOT POSSIBLE | Architecture STOP |
| Leasing Agent | ❌ NOT POSSIBLE | Architecture STOP |
| Facility Technician | ❌ NOT POSSIBLE | Architecture STOP |
| Storage (`media-private`) | ✅ PASS (prior) | REG-STOR-001 closed on prod deploy — not reopened |
| Vendor payments / real payouts | ✅ Not exercised live | Fixtures suppress; no customer payments |
| Org isolation (QA vs isolation control) | ⚠ Partial | Isolation org empty; PM list shows QA property (manual probe) and not isolation branding |
| No privilege escalation | ❌ FAIL | **REG-ACL-001** (tenant/vendor → Ops shell) |

Playwright storage states: `qa/e2e/playwright/.auth/*.json` (gitignored).  
Runner: `qa/e2e/scripts/run-m0-reg-003-regression.ts` → `m0-reg-003/regression-results.json`.  
Deep probe: `m0-reg-003/post-lease-probe.json`.

---

## 6. Regression Results

### By role

| Role | Login / home | Workflow access | PASS/FAIL |
|------|--------------|-----------------|-----------|
| Master Administrator | Mission Control | HQ surfaces load | ✅ PASS |
| Organization Administrator | — | — | ❌ FAIL (architecture gap) |
| Property Manager | Ops Center | Core ops routes + QA property visible (probe) | ✅ PASS |
| Property Owner | Owner portal | Portal OK; Ops `/properties` readable via `property:read` grant | ✅ PASS (portal) / ⚠ Ops shell shared |
| Leasing Agent | — | — | ❌ FAIL (architecture gap) |
| Facility Technician | — | — | ❌ FAIL (architecture gap) |
| Vendor | Vendor portal | Portal OK; Ops `/properties` → SetupGate shell | ❌ FAIL (REG-ACL-001) |
| Tenant | Tenant portal | Portal OK; Ops `/properties` not denied cleanly | ❌ FAIL (REG-ACL-001) |

### By workflow

| Workflow | Result |
|----------|--------|
| Auth login | ✅ PASS |
| Role routing (existing roles) | ✅ PASS |
| Permissions (portal wrong-role) | ✅ PASS (tenant → owner portal unauthorized) |
| Permissions (tenant/vendor → Ops properties) | ❌ FAIL — REG-ACL-001 |
| Storage | ✅ PASS (unchanged) |
| Vendor jobs (portal visibility) | ✅ PASS (baseline WO visible in vendor portal) |
| Documents (owner portal route) | ✅ PASS (route loads) |
| Navigation | ⚠ Some PM aliases 404 (`/inbox`, `/documents`, `/reports`, `/notifications`) — not HIGH; known route alias gaps |
| Organization isolation | ⚠ Partial |
| Privilege escalation | ❌ FAIL — REG-ACL-001 |

---

## 7. Security Validation

| Check | Result |
|-------|--------|
| QA org distinct from customers | ✅ |
| QA emails / naming identifiable | ✅ `@qa.mpa.local`, “QA Certification *” |
| Credentials not committed | ✅ `.env*` gitignore |
| No real payment processing in fixtures | ✅ Draft/synthetic only |
| Notification suppression flags on messages/WO | ✅ Metadata set (runtime notifier behavior not re-certified here) |
| Analytics exclusion flags | ✅ Metadata set (pipeline exclusion not re-certified here) |
| Removable | ✅ Dedicated slug orgs + labeled rows |
| Cross-portal ACL | ⚠ Owner/tenant portals enforce unauthorized for wrong portal |
| Ops shell ACL for portal-only roles | ❌ **REG-ACL-001** |

### REG-ACL-001 (HIGH) — STOP; not fixed

**Finding:** Tenant and Vendor sessions that open Ops `/properties` are not cleanly denied. Observed behavior:

- **Vendor** → redirected to `/setup` while the **Operations Center** shell remains visible.
- **Tenant** → can remain on `/properties` with Operations Center navigation (or SetupGate path), instead of `/unauthorized`.

Likely mechanism: `SetupGate` + `(app)` shell treat incomplete setup as a redirect to `/setup` without portal-role isolation; portfolio count RLS may keep portal roles “incomplete” forever.

**Severity:** HIGH (surface / privilege boundary).  
**Action under M0-REG-003:** Document only.  
**Follow-up:** Code remediated under M0-GOV-001 ([31](./31-role-model-reconciliation.md)); Production verify still required for M0.5.

---

## 8. PASS / FAIL

| Gate | Result |
|------|--------|
| QA organization created | ✅ PASS |
| QA users created (architecturally valid set) | ✅ PASS |
| QA users created (full 8-role matrix) | ❌ FAIL |
| Coverage achieved for suite PASS | ❌ FAIL |
| No HIGH/CRITICAL open | ❌ FAIL — **REG-ACL-001** |
| **REG-COV-001 (three AUTH-001 roles as M0 blocker)** | ⏸ **DEFERRED** — [33](./33-core-003-amd-m0-auth-role-cert-defer.md) ✅ APPROVED |
| **M0.5 implemented-role coverage (fixtures)** | ✅ PASS (Master Admin · PM · Owner · Vendor · Tenant) |
| **Authenticated Regression Certification ([28](./28-m0-authenticated-regression-certification.md))** | ❌ Still **FAIL** until REG-ACL Production verify + re-run |

---

## Governance update (post [33](./33-core-003-amd-m0-auth-role-cert-defer.md))

Organization Administrator / Leasing Agent / Facility Technician are **no longer M0 exit criteria**. They are mandatory AUTH-001 Slice D acceptance items. This document’s historical FAIL for full 8-role REG-COV-001 remains accurate as a snapshot; disposition is now **Deferred Slice D**, not an open M0 defect.

---

## Next gate

**STOP** (M0 still NO-GO).

1. Deploy REG-ACL-001 → Production verify → re-run implemented-role regression ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)).  
2. Then PMX-004 real-device certification → Final M0 review.  
3. Do **not** begin UX-012 or AUTH-001 from this document.
