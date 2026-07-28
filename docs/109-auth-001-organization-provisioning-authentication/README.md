# AUTH-001 — Organization Provisioning, Authentication & Account Hierarchy

**Status:** ✅ **APPROVED WITH AMENDMENTS** · Slices A–E ✅ **VALIDATED** ([49](./49-slice-e-validation.md) · **PASS**) · approved workstream **COMPLETE**  
**Initiative ID:** AUTH-001  
**Priority:** CRITICAL (platform foundation)  
**Type:** Enterprise authentication & account provisioning architecture  
**Gate:** Design → Document → **Approve** → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**ADR:** [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md) (**Accepted**)  
**Approval record:** [32 — Approval record](./32-approval-record.md)  
**Date:** 2026-07-23  
**Author:** Lead Enterprise Software Architect  
**Gate owners:** Product + Lead Architect + Security  
**Last Updated:** 2026-07-24 (Slice E **VALIDATED PASS** · [49](./49-slice-e-validation.md))

> **Slice E Validated PASS** ([49](./49-slice-e-validation.md)). AUTH-001 approved slices A–E are **complete**.  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain locked (separate authorize phrases).  
> **CORE-003 note:** Organization Administrator / Leasing Agent / Facility Technician certification is **complete under Slice D** ([CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)).

---

## Vision (binding)

Customers purchase a **private M.P.A. workspace (Organization)**. The subscriber becomes the **Organization Administrator**. Everything inside that organization belongs to them. Every additional user is created and managed by the Organization Administrator. M.P.A. employees never create day-to-day users after onboarding.

**M.P.A. is invitation-only** — never an open registration platform ([27](./27-invitation-only-platform.md)).

```
Purchase → Payment succeeds → Organization created → Plan + modules assigned
  → Organization Administrator provisioned (MPA-generated username + temporary password)
  → Welcome email → First login → Password change → Setup Wizard
  → Professional Implementation OR AI Guided Setup → Organization Active
```

---

## Binding decisions

| # | Decision | Binding |
|---|----------|---------|
| D1 | Workspace ownership | Subscriber becomes **Organization Administrator** |
| D2 | Identity | **Username** is permanent login identity; email is **not** identity |
| D3 | Username issuance | Generated **only by M.P.A.**; never changed; never reused |
| D4 | Subaccount creation | **Only** Organization Administrator (or delegated grant) / Level 3 for org provision |
| D5 | Org Admin recovery | **Only** Master Admin (L3) after identity verification (+ secondary recovery contact) |
| D6 | Subaccount recovery | **Only** Organization Administrator |
| D7 | Dashboards | **Never** user-selectable; subscription → org type → role → permissions |
| D8 | First-run | Mandatory Setup Wizard; Professional **or** AI Guided |
| D9 | Tenancy | Hard org isolation |
| D10 | Multi-org | Principal ↔ many orgs; switcher architecture now ([18](./18-multi-organization-future.md)) |
| D11 | Auth provider | **Supabase Auth** behind **Identity Adapter** |
| D12 | Entitlements | BILL-001 post-AuthZ; see capability matrix ([26](./26-subscription-capability-matrix.md)) |
| D13 | Invitation-only | **No public self-registration** ([27](./27-invitation-only-platform.md)) |
| D14 | See only what you bought | Unpurchased capabilities must not appear ([26](./26-subscription-capability-matrix.md)) |
| D15 | Org commercial lifecycle | Prospect → Trial → Pending Setup → Active → Suspended / Past Due → Cancelled → Archived ([28](./28-organization-status-lifecycle.md)) |
| D16 | Privileged audit | Permanent audit with timestamp, actor, org, IP/device, reason ([20](./20-audit-compliance.md)) |

---

## Amendments (A01–A08)

| ID | Title | Doc |
|----|-------|-----|
| A01 | Subscription plans drive capabilities | [26](./26-subscription-capability-matrix.md) |
| A02 | Invitation-only platform | [27](./27-invitation-only-platform.md) |
| A03 | Organization status lifecycle | [28](./28-organization-status-lifecycle.md) |
| A04 | Employee offboarding | [29](./29-employee-offboarding.md) |
| A05 | Organization switching | [18](./18-multi-organization-future.md) |
| A06 | Support escalation levels | [30](./30-support-escalation-levels.md) |
| A07 | Audit requirements | [20](./20-audit-compliance.md) |
| A08 | Implementation slices | [31](./31-implementation-slices.md) |

---

## Relationship to existing packages

| Package | Relationship |
|---------|--------------|
| [Phase 3 Identity](../23-phase-3-identity-foundation/index.md) · [ADR-014](../18-decision-log/adr-014-phase-3-identity-multitenant-foundation.md) | Foundation to extend; AUTH-001 supersedes commercial provisioning rules |
| [ADR-003 Four-Plane Authorization](../18-decision-log/adr-003-four-plane-authorization.md) | Remains; AUTH-001 defines how principals enter each plane |
| [BILL-001 SaaS Billing](../100-bill-001-saas-subscription-billing/README.md) | Payment rail; capability money/status; AUTH-001 owns see-what-you-bought chain |
| [COM-001 Customer Lifecycle](../110-com-001-customer-lifecycle-commercial-operations/README.md) | **Commercial SoT** — how orgs become customers; AUTH provision only after Payment Successful |
| [OPS-001 Platform Operations](../111-ops-001-platform-operations-architecture/README.md) | Event bus / notifications / automation; AUTH emits identity events (no secrets) |
| [UX-005 Auth Experience](../70-ux-005-authentication-experience/README.md) | Must align: username login, **no open signup** |
| [ADMIN-001 Impersonation](../71-admin-001-master-admin-impersonation/README.md) | L3 support plane; audited |
| [ADMIN-003 Ops Center](../95-admin-003-master-admin-operations-center/README.md) | Org lifecycle / plan surfaces |
| [EML-001 Transactional Email](../81-eml-001-transactional-email-experience/README.md) | Welcome / invite / recovery email |
| [MIG-001 Migration](../74-mig-001-design-partner-migration/README.md) | Import inside Setup Wizard / AI Guided Setup |
| [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) | Owner dashboard assigned, not selected |

---

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Goals, non-goals, success |
| [01 — Organization architecture](./01-organization-architecture.md) | Org as private workspace |
| [02 — Authentication architecture](./02-authentication-architecture.md) | Identity planes, adapter, sessions |
| [03 — Organization hierarchy](./03-organization-hierarchy.md) | Platform Level 0 / Org Admin |
| [04 — User hierarchy](./04-user-hierarchy.md) | Org Admin → subaccounts |
| [05 — Subscription activation](./05-subscription-activation-workflow.md) | Purchase → provision handoff |
| [06 — Organization provisioning](./06-organization-provisioning-workflow.md) | Auto-create org + Org Admin |
| [07 — Dashboard assignment](./07-dashboard-assignment-rules.md) | Deterministic surface rules |
| [08 — Username policy](./08-username-policy.md) | Generation, immutability |
| [09 — Email policy](./09-email-policy.md) | Contact channel, not identity |
| [10 — Password lifecycle](./10-password-lifecycle.md) | Temp → first change → reset |
| [11 — Account lifecycle](./11-account-lifecycle.md) | Principal lifecycle |
| [12 — Organization Setup Wizard](./12-organization-setup-wizard.md) | Mandatory first-run |
| [13 — AI Guided Onboarding](./13-ai-guided-onboarding.md) | AI onboarding specialist |
| [14 — Professional Implementation](./14-professional-implementation-workflow.md) | Human specialist path |
| [15 — Permission hierarchy](./15-permission-hierarchy.md) | Roles, capabilities |
| [16 — Recovery workflows](./16-recovery-workflows.md) | Org Admin vs subaccount |
| [17 — Emergency recovery](./17-emergency-recovery.md) | Secondary recovery contact |
| [18 — Multi-organization + switching](./18-multi-organization-future.md) | A05 switcher architecture |
| [19 — Security model](./19-security-model.md) | Isolation, hashing |
| [20 — Audit & compliance](./20-audit-compliance.md) | A07 permanent privileged audit |
| [21 — Sequence diagrams](./21-sequence-diagrams.md) | End-to-end sequences |
| [22 — Edge cases](./22-edge-cases.md) | Failure matrix |
| [23 — Acceptance criteria](./23-acceptance-criteria.md) | Pass/fail |
| [24 — Open questions](./24-open-questions.md) | Deferred defaults |
| [25 — Approval checklist](./25-approval-checklist.md) | Sign-off form |
| [26 — Subscription capability matrix](./26-subscription-capability-matrix.md) | A01 |
| [27 — Invitation-only platform](./27-invitation-only-platform.md) | A02 |
| [28 — Organization status lifecycle](./28-organization-status-lifecycle.md) | A03 |
| [29 — Employee offboarding](./29-employee-offboarding.md) | A04 |
| [30 — Support escalation levels](./30-support-escalation-levels.md) | A06 |
| [31 — Implementation slices](./31-implementation-slices.md) | A08 |
| [32 — Approval record](./32-approval-record.md) | Governance binding |
| [33 — Slice A Authorization](./33-slice-a-authorization.md) | ✅ **AUTHORIZED** · Identity foundation |
| [34 — Slice A Implementation](./34-slice-a-implementation.md) | ✅ **IMPLEMENTED** |
| [35 — Slice A Validation](./35-slice-a-validation.md) | ✅ **VALIDATED** · **PASS** |
| [36 — Slice B Authorization](./36-slice-b-authorization.md) | ✅ **AUTHORIZED** · org provisioning |
| [37 — Slice B Implementation](./37-slice-b-implementation.md) | ✅ **IMPLEMENTED** |
| [38 — Slice B Validation](./38-slice-b-validation.md) | ❌ **FAIL** (historical) |
| [39 — Slice B Remediation](./39-slice-b-remediation.md) | ✅ **REMEDIATED** · R1–R2 |
| [40 — Slice B Validation Re-Run](./40-slice-b-validation-rerun.md) | ✅ **PASS** · authoritative |
| [41 — Slice C Authorization](./41-slice-c-authorization.md) | ✅ **AUTHORIZED** · invitations & credentials |
| [42 — Slice C Implementation](./42-slice-c-implementation.md) | ✅ **IMPLEMENTED** |
| [43 — Slice C Validation](./43-slice-c-validation.md) | ✅ **VALIDATED** · **PASS** |
| [44 — Slice D Authorization](./44-slice-d-authorization.md) | ✅ **AUTHORIZED** · deferred-role enablement & certification |
| [45 — Slice D Implementation](./45-slice-d-implementation.md) | ✅ **IMPLEMENTED** |
| [46 — Slice D Validation](./46-slice-d-validation.md) | ✅ **VALIDATED** · **PASS** |
| [47 — Slice E Authorization](./47-slice-e-authorization.md) | ✅ **AUTHORIZED** · recovery · audit · support |
| [48 — Slice E Implementation](./48-slice-e-implementation.md) | ✅ **IMPLEMENTED** |
| [49 — Slice E Validation](./49-slice-e-validation.md) | ✅ **VALIDATED** · **PASS** |

---

## Gate status

| Stage | Status |
|-------|--------|
| Design | ✔ |
| Document | ✔ (incl. A01–A08) |
| **Approve** | ✔ **APPROVED WITH AMENDMENTS** (2026-07-23) |
| **Authorize Slice A** | ✔ **AUTHORIZED** (2026-07-24) · [33](./33-slice-a-authorization.md) |
| **Implement Slice A** | ✔ **IMPLEMENTED** (2026-07-24) · [34](./34-slice-a-implementation.md) |
| **Validate Slice A** | ✔ **PASS** (2026-07-24) · [35](./35-slice-a-validation.md) |
| **Authorize Slice B** | ✔ **AUTHORIZED** (2026-07-24) · [36](./36-slice-b-authorization.md) |
| **Implement Slice B** | ✔ **IMPLEMENTED** (2026-07-24) · [37](./37-slice-b-implementation.md) |
| **Validate Slice B** | ❌ FAIL (historical) · [38](./38-slice-b-validation.md) → ✅ **PASS** (2026-07-24) · [40](./40-slice-b-validation-rerun.md) |
| Remediate Slice B | ✅ **DONE** (2026-07-24) · [39](./39-slice-b-remediation.md) |
| **Authorize Slice C** | ✅ **AUTHORIZED** (2026-07-24) · [41](./41-slice-c-authorization.md) |
| **Implement Slice C** | ✅ **IMPLEMENTED** (2026-07-24) · [42](./42-slice-c-implementation.md) |
| **Validate Slice C** | ✅ **PASS** (2026-07-24) · [43](./43-slice-c-validation.md) |
| **Authorize Slice D** | ✅ **AUTHORIZED** (2026-07-24) · [44](./44-slice-d-authorization.md) |
| **Implement Slice D** | ✅ **IMPLEMENTED** (2026-07-24) · [45](./45-slice-d-implementation.md) |
| **Validate Slice D** | ✅ **PASS** (2026-07-24) · [46](./46-slice-d-validation.md) |
| **Authorize Slice E** | ✅ **AUTHORIZED** (2026-07-24) · [47](./47-slice-e-authorization.md) |
| **Implement Slice E** | ✅ **IMPLEMENTED** (2026-07-24) · [48](./48-slice-e-implementation.md) |
| **Validate Slice E** | ✅ **PASS** (2026-07-24) · [49](./49-slice-e-validation.md) |
| **AUTH-001 slices A–E** | ✅ **COMPLETE** (approved workstream) |

---

## Implementation slices

Authoritative board: **[31](./31-implementation-slices.md)** · A: [33](./33-slice-a-authorization.md)/[34](./34-slice-a-implementation.md)/[35](./35-slice-a-validation.md) · B: [36](./36-slice-b-authorization.md)/[37](./37-slice-b-implementation.md)/[38](./38-slice-b-validation.md)/[39](./39-slice-b-remediation.md)/[40](./40-slice-b-validation-rerun.md) · C: [41](./41-slice-c-authorization.md)/[42](./42-slice-c-implementation.md)/[43](./43-slice-c-validation.md) · D: [44](./44-slice-d-authorization.md)/[45](./45-slice-d-implementation.md)/[46](./46-slice-d-validation.md) · E: [47](./47-slice-e-authorization.md)/[48](./48-slice-e-implementation.md)/[49](./49-slice-e-validation.md)

| Slice | Scope | Status |
|-------|-------|--------|
| **A** | Identity Adapter · Username auth · First login · Password change | ✅ **VALIDATED** |
| **B** | Org provisioning · Org Admin provision · Subscription assignment | ✅ **VALIDATED** ([40](./40-slice-b-validation-rerun.md)) |
| **C** | Invitations · Temp passwords · Email flow | ✅ **VALIDATED** ([43](./43-slice-c-validation.md) · **PASS**) |
| **D** | Permission engine · Roles · Dashboard assignment · deferred-role cert | ✅ **VALIDATED** ([46](./46-slice-d-validation.md) · **PASS**) |
| **E** | Recovery · Emergency recovery · Audit · Support escalation | ✅ **VALIDATED** ([49](./49-slice-e-validation.md) · **PASS**) |

```
AUTHORIZE AUTH-001 SLICE A   ← issued 2026-07-24
VALIDATE AUTH-001 SLICE A    ← issued 2026-07-24 · PASS
AUTHORIZE AUTH-001 SLICE B   ← issued 2026-07-24
VALIDATE AUTH-001 SLICE B    ← issued 2026-07-24 · FAIL → re-run PASS ([40](./40-slice-b-validation-rerun.md))
AUTHORIZE AUTH-001 SLICE C   ← issued 2026-07-24
VALIDATE AUTH-001 SLICE C    ← issued 2026-07-24 · PASS ([43](./43-slice-c-validation.md))
AUTHORIZE AUTH-001 SLICE D   ← issued 2026-07-24
VALIDATE AUTH-001 SLICE D    ← issued 2026-07-24 · PASS ([46](./46-slice-d-validation.md))
AUTHORIZE AUTH-001 SLICE E   ← issued 2026-07-24
VALIDATE AUTH-001 SLICE E    ← issued 2026-07-24 · PASS ([49](./49-slice-e-validation.md))
```

AUTH-001 approved implementation slices **A–E are complete**.

Each slice: **Design → Approval/Authorize → Implementation → Validation** before the next begins.

---

## PASS criteria (product)

A paying subscriber receives a private Organization, logs in with an M.P.A.-generated username and temporary password, completes first-login hardening, finishes setup via Professional or AI path, manages all subaccounts without public self-registration, sees only purchased capabilities, and never accesses another organization's data.
