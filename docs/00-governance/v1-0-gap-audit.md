# M.P.A. Version 1.0 Gap Audit

**Type:** Read-only completeness inventory against [V1.0 Implementation Mission](./v1-0-implementation-mission.md)  
**Date:** 2026-07-25  
**Baseline:** git HEAD `checkpoint/pre-phase5` @ `95e5044` (shippable / Production tip at audit time)  
**Does not authorize implementation**  
**Policy:** [Implementation Gate](./implementation-gate.md) · [Definition of Done](./definition-of-done.md)

---

## 1. How to read this audit

| Status | Meaning |
|--------|---------|
| **SHIPPED** | Present on HEAD; usable toward V1.0 with known limitations noted |
| **PARTIAL** | Real surface exists but fails V1.0 completeness bar (§2 of mission) |
| **WIP-ONLY** | Substantial work exists locally / in docs as CERTIFIED, **not** on shippable HEAD |
| **MISSING** | No meaningful product surface on HEAD |
| **OPS-GATED** | Code/cert exist; production enable still kill-switched or ops checklist |

**V1.0 COMPLETE** (mission) is stricter than package CERTIFIED PASS. A package may be CERT PASS in docs while HEAD still serves Future Release — that is **WIP-ONLY / integrity risk**, not COMPLETE.

Working tree at audit time contained large untracked AUTH-001 / COM-001 / OPS-001 / Owner Portal expansions and uncommitted migrations. Those do **not** count as SHIPPED until committed, gated, and deployed.

---

## 2. Executive summary

| Module | V1.0 readiness (HEAD) | Headline |
|--------|----------------------|----------|
| Core Platform | **PARTIAL** | Shell, settings, auth foundations, reporting exist; push cert FAIL; AUTH depth WIP-ONLY |
| Property Operations | **PARTIAL** | Strong money-in/out + tenant portal; **Owner Portal home still FutureRelease on HEAD** |
| Facility Operations | **PARTIAL → large MISSING** | Work orders + vendors strong; PM, inventory, calendar, inspections, tech dashboard MISSING/thin |
| Subscriptions / licensing | **PARTIAL** | BILL-001 Phase A only; full module entitlements incomplete |
| Commercial Launch (CORE-002) | **Not authorized** | Blockers 1–4 CLOSED (docs); Blocker 5 PUSH-001 FAIL/OPEN; Blocker 6 queued |

**Integrity finding:** Governance claims OWNER-001 / AUTH-001 / OPS-001 / COM-001 validated or CERT PASS while significant implementation remains **untracked vs HEAD**. V1.0 claims must follow **what Production ships**.

---

## 3. Core Platform

| Requirement | Status | Evidence (HEAD unless noted) | Gap vs V1.0 COMPLETE |
|-------------|--------|------------------------------|----------------------|
| Organization Management | PARTIAL | `/settings/organization`, `lib/organization/`, phase3 org foundation | Full provisioning / commercial activate = WIP-ONLY (AUTH-001 / COM-001) |
| User Management | PARTIAL | `/settings/team`, invitations | Offboard / recovery / role tooling largely WIP-ONLY |
| Authentication | PARTIAL | Login, forgot/reset, Supabase auth | Contact verify, first-login, recovery depth = WIP-ONLY |
| Role & Permission Management | PARTIAL | `lib/auth/authorization.ts`, phase3 authz | Capability matrix / role templates WIP-ONLY |
| Dashboard Framework | SHIPPED | `/dashboard`, `lib/dashboard/` | Continues polish under DPX; PM calendar not here |
| Notifications | PARTIAL | OneSignal stack, notification settings | **PUSH-001 commercial cert FAIL** (Blocker 5) |
| Document Management | PARTIAL | Vault, settings/documents, tenant docs | Owner docs browser WIP-ONLY; WO photo path still partial |
| Reporting Engine | SHIPPED | `lib/reporting/`, financial reports | Facility report catalog incomplete |
| Settings | SHIPPED | `/settings/*` (org, team, billing, appearance, etc.) | — |
| Security | PARTIAL | RLS, hardening migs, ADMIN-001 | Launch security checklist still open |
| Audit Logging | PARTIAL | Impersonation audit, Connect audit | Privileged recovery audit WIP-ONLY |
| Mobile Support | PARTIAL | PWA / PMX-004; responsive web | Native `apps/mobile` placeholder; push FAIL |
| Desktop Support | PARTIAL | Responsive web + PWA | No separate desktop shell product |

---

## 4. Property Operations module

| Requirement | Status | Evidence | Gap vs V1.0 COMPLETE |
|-------------|--------|----------|----------------------|
| Property Management | SHIPPED | `/properties/*`, `lib/property/` | — |
| Building Management | PARTIAL | Property-level building QR / assets | No dedicated buildings CRUD product |
| Unit Management | SHIPPED | `/units/*` | — |
| Tenant Management | SHIPPED | `/tenants/*` | — |
| Owner Management | PARTIAL | Owner roles + Connect accounts | `owner_property_access` deferred; interim ACL risk |
| Lease Management | SHIPPED | `/leases/*` | — |
| Tenant Portal | SHIPPED | `/portal/tenant/*` | Push prefs incomplete copy/path |
| Owner Portal | **WIP-ONLY** (integrity) | HEAD home = `FutureReleaseNotice`; financials exist; docs CERT PASS | **Must land certified MVP on HEAD/Production** |
| Rent Collection | SHIPPED / OPS-GATED | API-005, billing; Blocker 1 CLOSED | Live path ops/cert constrained |
| Stripe | SHIPPED | Payments + Connect + SaaS adapters | Keep rails separated (ADR-024) |
| ACH | PARTIAL | `us_bank_account` / ACH return handling | Full ACH product cert thinner than card |
| Credit Card | SHIPPED | Stripe card PaymentIntent path | — |
| Owner Payouts | SHIPPED / OPS-GATED | `lib/owner-payouts/`, FIN-003 CERT PASS | `FIN003_TRANSFERS_ENABLED` kill switch |
| Communication Center | SHIPPED | `/communications/*`, MHF-001 | SMS delivery weaker than positioning |
| Property Reports | SHIPPED | Reporting engine + statements | Owner reports browser WIP-ONLY |

---

## 5. Facility Operations module

| Requirement | Status | Evidence | Gap vs V1.0 COMPLETE |
|-------------|--------|----------|----------------------|
| Facility Technician Dashboard | PARTIAL / WIP | Role exists; maintenance list as stand-in | Dedicated tech dashboard MISSING on HEAD |
| Work Orders | SHIPPED | `/maintenance/*`, phase6 | Photo/materials depth vs mission |
| Preventive Maintenance | **MISSING** | FAC-001 deferred; placeholders | Full PM scheduler + auto WO |
| Building Asset Management | PARTIAL | FAC-001 Slice C assets | Warranty / replacement planning deferred |
| Facility Inventory | **MISSING** | No inventory routes/lib/mig | Photo → Name → Save product |
| Vendor Directory | SHIPPED | `/vendors/*` | — |
| Vendor SMS Workflow | PARTIAL | Channel modeled; token/QR primary | First-class SMS vendor journey |
| Vendor Email Workflow | PARTIAL | Email + secure token paths | Align to mission Accept/Decline/photos |
| Vendor Completion Workflow | SHIPPED | VENDOR-001 A/B; `/v/[token]` | — |
| Manager Approval Workflow | SHIPPED | Vendor invoice approve/pay | — |
| Inspections | **MISSING** | Reserved types / “coming soon” | Full inspection product |
| Receipts | PARTIAL | Events + vendor invoices | General receipt capture |
| Expense Tracking | SHIPPED | `/financials/expenses/*` | — |
| Photo Documentation | PARTIAL | API-002A media; vendor photos | WO universal photo UX |
| Technician Reports | **MISSING** | No tech report catalog | Printable/exportable |
| Monthly Building Reports | PARTIAL | Maintenance Summary period reports | Branded monthly building product |
| Calendar | **MISSING** | No `/calendar` | PM + facility calendar |
| Scheduling | **MISSING** | Due dates only | Recurring / assignment scheduler |

---

## 6. Cross-cutting

| Requirement | Status | Notes |
|-------------|--------|-------|
| Subscriptions / module licensing | PARTIAL | BILL-001 Phase A; B–E locked; entitlements incomplete |
| Permissions on every feature | PARTIAL | Core evaluatePermission; AUTH-001 Slice D WIP-ONLY |
| Notifications where appropriate | PARTIAL | Stack exists; commercial push FAIL |
| Reporting where appropriate | PARTIAL | Strong finance/ops; facility catalog thin |
| No placeholders on advertised surfaces | **FAILING integrity** | Owner home FutureRelease; manager portal notice; asset FutureRelease; inspection coming soon |
| Performance “extremely fast” | PARTIAL / QUEUED | EP-019 Blocker 6 Not Approved |

---

## 7. Top 10 risks for paying customers

1. **Owner Portal HEAD ≠ CERT claim** — customers may see Future Release while docs say PASS.  
2. **PUSH-001 FAIL** — unreliable urgent alerts.  
3. **AUTH/COM/OPS WIP-ONLY** — onboarding/recovery/ops backbone not on ship baseline.  
4. **Money-out ops-gated** — payouts certified but may not run live.  
5. **Facility depth gap** — PM, inventory, calendar, inspections table-stakes for facility buyers.  
6. **SMS weakness** vs “communication platform” claims.  
7. **Incomplete module licensing** — hard to sell Core vs Property vs Facility cleanly.  
8. **Multi-owner ACL interim** — overshare risk.  
9. **Manager Portal FutureRelease** vs sales language.  
10. **Mega dirty tree** — cert evidence can diverge from deployable SHA.

---

## 8. Already strong (do not rebuild)

Treat as extend-only unless mission forces a new approved package:

| Area | Evidence |
|------|----------|
| Live rent path | CORE-002 Blocker 1 CLOSED |
| Vendor zero-account + manager pay | VENDOR-001 A/B PASS (HEAD) |
| Owner payouts package | FIN-003 CERT PASS (HEAD code; ops-gated live) |
| Settlement foundation | PAY-001 Verified |
| Tenant portal | HEAD `/portal/tenant/*` |
| Property / unit / tenant / lease / WO / vendors | Phase foundations on HEAD |
| Reporting engine | FIN-001 / `lib/reporting/` |
| Canopy + shell | Approved; ship SoT = root AppProviders + `@mpa/ui` |
| PWA shell | PMX-004 Phase 1 device PASS (docs) |

---

## 9. Recommended priority slices (item 3 — for Product Owner choose)

Ordered for **integrity first**, then commercial blocker, then V1.0 facility depth. Each slice still needs gate phrases where packages require them.

### Slice A — **Ship integrity: Owner Portal MVP on Production** (recommended first)

**Goal:** HEAD/Production match OWNER-001 CERTIFIED PASS (remove FutureRelease home; commit only approved OWNER-001 surfaces).

**Why first:** Largest customer-trust failure. Money rails already certified; owner self-serve must be real on the shippable branch.

**Exit:** Production SHA serves owner home/properties/docs/messages/reports/settings per OWNER-001; role-path smoke PASS; no FutureRelease on advertised owner MVP.

### Slice B — **CORE-002 Blocker 5: PUSH-001 real-device cert**

**Goal:** Commercial push PASS; enrollment + role-correct deep links verified on real devices.

**Why second:** Only remaining serial commercial blocker before launch certification path; notifications are Core Platform required.

### Slice C — **Park & land AUTH-001 / OPS-001 / COM-001 on ship lane (authorized slices only)**

**Goal:** Stop WIP-ONLY drift; commit validated slices after Authorize/Validate phrases; clean ship tree.

**Why third:** Paying-customer onboarding and recovery depend on it; currently mostly untracked.

### Slice D — **Facility V1.0 foundation package (FAC-002)**

**Status:** Design package drafted + **Facility independence amended** — [FAC-002](../114-fac-002-facility-operations-v1/README.md) · [Subscription Architecture](./v1-0-subscription-architecture.md) · Awaiting `APPROVE FAC-002`  
**Goal:** Inventory / PM / calendar / tech dashboard / inspections; **Core + Facility** without Property; implement only after Approve + slice Authorize.

### Slice E — **BILL-001 module entitlements**

**Goal:** Enforce Core / Property / Facility licensing in product.

**Depends on:** Clear module boundaries from mission + Slice D scoping.

---

## 10. Product Owner decisions (2026-07-25)

| Decision | Result |
|----------|--------|
| PUSH-001 real-device certification | **Abandoned** — [push-001-real-device-cert-abandoned.md](./push-001-real-device-cert-abandoned.md) |
| Next slice | **Slice A IN PROGRESS** — `BEGIN V1.0 SLICE A — OWNER PORTAL SHIP INTEGRITY` · [slice A](./v1-0-slice-a-owner-portal-ship-integrity.md) |

Facility Inventory / PM / Calendar still require a **new Design package** before Implement (Slice D).

---

## 11. Evidence pointers

| Topic | Path |
|-------|------|
| Mission SoT | [v1-0-implementation-mission.md](./v1-0-implementation-mission.md) |
| Commercial spine | [commercial-launch-master-plan.md](./commercial-launch-master-plan.md) |
| Package matrix | [project-roadmap-status.md](./project-roadmap-status.md) |
| Owner Portal package | [104-owner-001…](../104-owner-001-commercial-owner-portal/README.md) |
| Push cert | [99-push-001…/14-…](../99-push-001-pwa-push-commercial-certification/14-commercial-certification-report.md) |
| Facility foundation | [65-fac-001…](../65-fac-001-facility-operations-foundation/README.md) |
| HEAD Owner Portal home | `apps/web/src/app/(portals)/portal/owner/page.tsx` → `FutureReleaseNotice` |

---

**End of audit — documentation only; no code changes authorized by this file.**
