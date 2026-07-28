# 44 — AUTH-001 Slice D Authorization

**Package:** AUTH-001 — Organization Provisioning, Authentication & Account Hierarchy  
**Slice:** **D — Authorization surfaces · deferred-role enablement & certification**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([45](./45-slice-d-implementation.md)) · ✅ **VALIDATED** ([46](./46-slice-d-validation.md) · **PASS**)  
**Authorization date:** 2026-07-24  
**Implementation date:** 2026-07-24  
**Validation date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE AUTH-001 SLICE D
```

**Validation phrase (issued):**

```
VALIDATE AUTH-001 SLICE D
```

**Program record:** [CORE-003 §43](../113-core-003-implementation-master-plan/43-auth-001-slice-d-authorization.md)  
**Implementation summary:** [45 — Slice D Implementation](./45-slice-d-implementation.md)  
**Validation report:** [46 — Slice D Validation](./46-slice-d-validation.md)  
**Slice catalog:** [31 — Implementation slices](./31-implementation-slices.md)  
**Prior slice:** Slice C ✅ **VALIDATED** ([43](./43-slice-c-validation.md) · **PASS**)  
**Package approval:** [32 — Approval record](./32-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md) · [ADR-003](../18-decision-log/adr-003-four-plane-authorization.md)  
**Design SoT:** [04 — User hierarchy](./04-user-hierarchy.md) · [07 — Dashboard assignment](./07-dashboard-assignment-rules.md) · [15 — Permission hierarchy](./15-permission-hierarchy.md) · [26 — Subscription capability matrix](./26-subscription-capability-matrix.md) · [19 — Security model](./19-security-model.md) · [20 — Audit & compliance](./20-audit-compliance.md) · [23 — Acceptance criteria](./23-acceptance-criteria.md) (H-06–H-08) · [31](./31-implementation-slices.md) Slice D COMPLETE criteria  
**M0 deferral:** [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) · `CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` ✅ APPROVED  
**Identity / invite foundation:** Slice A ✅ **VALIDATED** ([35](./35-slice-a-validation.md)) · Slice B ✅ **VALIDATED** ([40](./40-slice-b-validation-rerun.md)) · Slice C ✅ **VALIDATED** ([43](./43-slice-c-validation.md))  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** ([UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md))  
**OPS foundation:** OPS-001 Slice A ✅ **VALIDATED** ([OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md)) — Activity Timeline / secret-free bus  
**Program order:** CORE-003 M4.1 ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Slice D **VALIDATED PASS** ([46](./46-slice-d-validation.md)). Slice E subsequently **AUTHORIZED** ([47](./47-slice-e-authorization.md)).  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain **locked**.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| AUTH-001 Approved with Amendments | [32](./32-approval-record.md) · A01–A08 | ✅ |
| ADR-026 Accepted | [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md) | ✅ |
| Implementation slices finalized | [31](./31-implementation-slices.md) | ✅ |
| M0 = GO | [36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slice A Validated | [35](./35-slice-a-validation.md) · **PASS** | ✅ |
| AUTH-001 Slice B Validated | [40](./40-slice-b-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slice C Validated | [43](./43-slice-c-validation.md) · **PASS** | ✅ |
| AUTH-001 Slice C → D serial rule | Prior slice Validated before next Authorize | ✅ |
| CORE-003 M4.1 order | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| Deferred-role ownership assigned to Slice D | [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) | ✅ |
| OPS-001 Slice B | Not authorized | ✅ (correct — not a blocker for AUTH-D) |
| UX-012 Slice B | Not authorized | ✅ (correct — not a blocker for AUTH-D) |
| AUTH-001 Slice E | Not authorized | ✅ (correct — excluded) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice D?** ❌ **None.**

---

## 2. Authorization scope

### In scope (Slice D)

| Deliverable | Binding source |
|-------------|----------------|
| **Organization Administrator** first-class membership role implementation | [04](./04-user-hierarchy.md) · [15](./15-permission-hierarchy.md) · [31](./31-implementation-slices.md) · [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) |
| **Organization Administrator certification** (authenticated regression / role AC) | H-06 · [31] Slice D COMPLETE · [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) |
| **Leasing Agent** role implementation | [04](./04-user-hierarchy.md) · [07](./07-dashboard-assignment-rules.md) · [15](./15-permission-hierarchy.md) |
| **Leasing Agent certification** | H-07 · [31] Slice D COMPLETE |
| **Facility Technician** role implementation | [04](./04-user-hierarchy.md) · [07](./07-dashboard-assignment-rules.md) · [15](./15-permission-hierarchy.md) |
| **Facility Technician certification** | H-08 · [31] Slice D COMPLETE |
| **Role activation** through AUTH-001 identity foundation (Slices A–C) | [02](./02-authentication-architecture.md) · [11](./11-account-lifecycle.md) · [27](./27-invitation-only-platform.md) |
| **Role permissions** via approved authorization model (server-side; ADR-003 planes) | [15](./15-permission-hierarchy.md) · [ADR-003](../18-decision-log/adr-003-four-plane-authorization.md) |
| **Role entry routing** / deterministic dashboard resolution | [07](./07-dashboard-assignment-rules.md) · [26](./26-subscription-capability-matrix.md) |
| **Role lifecycle activation** (assign → activate → land on correct surface; disable/archive membership rules) | [11](./11-account-lifecycle.md) · [29](./29-employee-offboarding.md) (hooks only — not Slice E recovery) |
| **Internal role assignment flows** (Org Admin / authorized actors assign roles within catalog; no public signup) | [04](./04-user-hierarchy.md) · [15](./15-permission-hierarchy.md) · [27](./27-invitation-only-platform.md) |
| **Role audit events** (secret-free) | [20](./20-audit-compliance.md) · OPS-001 Slice A envelope |
| **OPS Activity Timeline integration** where already approved for Slice A bus / projector | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) |

### Implementation boundaries

1. Work is limited to **role enablement, permissions, entry routing, assignment flows, and certification** for Organization Administrator · Leasing Agent · Facility Technician — not recovery (Slice E) and not credential/invite delivery (Slice C, already Validated).  
2. Reuse AUTH-001 Slices A–C identity, provision, and invitation paths — do **not** invent a parallel identity, signup, or provision path.  
3. Dashboards remain **non-selectable** by end users ([07](./07-dashboard-assignment-rules.md)). Route to the surface assigned by org type + role + entitlements.  
4. Permissions are enforced **server-side**; UI hiding is not security ([15](./15-permission-hierarchy.md)).  
5. Any **UI** touched under Slice D **must** consume UX-012 Slice A tokens (`--mpa-*`) — no competing design systems; no UX-012 Slice B chrome.  
6. Role / membership OPS payloads remain **secret-free** (no passwords, temp credentials, hashes, or tokens).  
7. Unpurchased modules remain hidden/disabled per [26](./26-subscription-capability-matrix.md) — do not invent new commercial SKUs or billing rails.  
8. **Do not** ship Org Admin self-serve recovery, emergency recovery, Level-0 Org Admin reset productization, or privileged-audit completion (Slice E).  
9. Public signup remains **forbidden** ([27](./27-invitation-only-platform.md)).  
10. Material scope beyond Slice D requires a new authorize phrase (Slice E+ / other packages).

### Includes (explicit)

- First-class membership roles: `organization_admin` (or approved catalog equivalent), `leasing_agent`, `facility_technician`  
- Migration / schema / membership-check updates required for those roles  
- Role templates + default capability grants per [15](./15-permission-hierarchy.md)  
- Property-scoped assignment for Leasing Agent / Facility Technician where required  
- Deterministic post-login / deep-link entry routing to approved dashboard families (Owner / Manager / Leasing / Technician per [07](./07-dashboard-assignment-rules.md))  
- Internal assignment APIs / Org Admin (or delegated grant) flows to assign/change roles within catalog  
- Activation of provisioned / invited principals into these roles without public registration  
- Hard elevation bans (no self-elevate to Org Admin; no grant of `master_admin`; no cross-org access)  
- Authenticated regression fixtures + certification evidence for the three deferred roles  
- Secret-free role lifecycle events on OPS-001 Slice A bus; timeline labels where projector already supports auth/ops categories  
- Regression guard that existing implemented roles (Master Admin · Property Manager · Property Owner · Vendor · Tenant) remain green

### Delivery vs certification (binding)

| Aspect | Slice D requirement |
|--------|---------------------|
| Role implemented in membership / AuthZ | ✅ Required |
| Role entry routing + permission boundaries | ✅ Required |
| Authenticated regression / role AC PASS for Org Admin · Leasing · Facility Tech | ✅ Required for COMPLETE ([31](./31-implementation-slices.md) · [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) |
| New commercial dashboards outside approved surface map | ❌ Forbidden |
| Slice E recovery / privileged audit completion | ❌ Forbidden under this authorize |

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| AUTH-001 Slice E (Org Admin recovery · emergency recovery · privileged audit completion · support escalation productization) | Locked until `AUTHORIZE AUTH-001 SLICE E` |
| OPS-001 Slice B | Separate authorize |
| UX-012 Slice B (role chrome / Command Center productization beyond Slice A tokens) | Separate authorize |
| PMX-004 Phase 2 | `AUTHORIZE PMX-004 PHASE 2` |
| New billing / Stripe / plan SKU functionality | BILL-001 / COM-001 gates |
| New AI capabilities / AI Guided Setup orchestration | Post–E / separate |
| New dashboards outside already approved surface map ([07](./07-dashboard-assignment-rules.md)) | Design → Document → Approve again |
| Workflow redesign / maintenance Task Engine redesign | OPS / product packages |
| Public signup / open registration | Forbidden permanently under [27](./27-invitation-only-platform.md) |
| Invite/credential delivery productization | Slice C (Validated) — reuse only |
| Org create / subscription bind / Org Admin principal provision | Slice B (Validated) — reuse only |
| Identity Adapter / username login / first-login gates | Slice A (Validated) — reuse only |
| Multi-org switcher UX exposure | Separate unlock ([18](./18-multi-organization-future.md)) |
| SSO / SAML | Future |
| FIN-003 / COM-001 implementation | Separate package gates |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| AUTH-001 Slice C Validated | Invitation / credential / contact-verify path for role holders |
| AUTH-001 Slice B Validated | Org + primary Org Admin provision substrate |
| AUTH-001 Slice A Validated | Identity Adapter · username principals · first-login |
| AUTH-001 Approved with Amendments · ADR-026 · ADR-003 | Role / AuthZ architecture SoT |
| CORE-003 M0 = GO | Program unlock |
| UX-012 Slice A Validated | Design-token foundation for any touched UI |
| OPS-001 Slice A Validated | Secret-free event bus · Activity Timeline integration surface |
| Phase 3 organization / membership substrate | Extend membership roles — do not fork tenancy |

**Does not depend on:** OPS-001 Slice B · UX-012 Slice B · AUTH-001 Slice E · PMX-004 Phase 2 · new billing · COM-001 Slice B+ implementation.

---

## 5. Acceptance criteria (Slice D) — SD-01 … SD-10

| ID | Criterion |
|----|-----------|
| **SD-01** | **Role provisioning** — Organization Administrator, Leasing Agent, and Facility Technician can be provisioned as first-class membership roles via approved internal assignment / invite activation paths (no public signup) ([04](./04-user-hierarchy.md) · [27](./27-invitation-only-platform.md)). |
| **SD-02** | **Role activation** — Assigned principals activate into the correct membership state and receive the role’s capability template; inactive/disabled/archived memberships cannot exercise the role ([11](./11-account-lifecycle.md)). |
| **SD-03** | **Permission enforcement** — Server-side AuthZ enforces role capability groups and property scopes; elevation bans hold (no self-elevate to Org Admin; no `master_admin` grant; no cross-org access) ([15](./15-permission-hierarchy.md) · [19](./19-security-model.md)). |
| **SD-04** | **Authentication integration** — Role holders authenticate only through AUTH-001 username identity foundation (Slices A–C); email is not login identity; invitation-only invariants unbroken ([08](./08-username-policy.md) · [35](./35-slice-a-validation.md) · [43](./43-slice-c-validation.md)). |
| **SD-05** | **Role routing** — Post-login and deep links resolve to the deterministic dashboard surface for org type + role; wrong-family URLs redirect without silent elevation ([07](./07-dashboard-assignment-rules.md)). |
| **SD-06** | **Audit events** — Role assign / activate / change / disable (as implemented) emit secret-free OPS domain events; payloads never include passwords or credentials; events are processable on the OPS-001 Slice A bus ([20](./20-audit-compliance.md)). |
| **SD-07** | **Organization isolation** — Role holders cannot read or mutate another organization’s data; property-scoped roles cannot exceed assigned properties ([19](./19-security-model.md)). |
| **SD-08** | **Security** — UI hiding is not treated as AuthZ; unpurchased modules remain hidden/disabled per entitlements; no plaintext secrets in logs, events, or role-assignment payloads ([26](./26-subscription-capability-matrix.md) · AA-06 continuity). |
| **SD-09** | **Regression protection** — Authenticated regression for Master Admin · Property Manager · Property Owner · Vendor · Tenant remains PASS; no public-signup regression; Slice A–C gates remain green. |
| **SD-10** | **Documentation completeness** — Implementation summary, certification evidence for Org Admin / Leasing / Facility Tech, and governance board updates are recorded; Slice E / OPS-B / UX-012 B / PMX-004 Phase 2 not shipped under this authorize. |

**Slice D COMPLETE additionally requires** the binding checklist in [31](./31-implementation-slices.md) (dashboard routing · permission boundaries · org isolation · authenticated regression for the three roles · role-specific AC for landing / denied routes / redirects) and H-06–H-08 in [23](./23-acceptance-criteria.md).

---

## 6. Exit criteria (Validation)

Slice D exits **Validated** only when **all** are true:

1. Acceptance criteria **SD-01–SD-10** PASS.  
2. Organization Administrator · Leasing Agent · Facility Technician **implemented and certified** per [31] Slice D COMPLETE and [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md).  
3. No unresolved **critical** defects.  
4. Documentation updated (implementation summary + validation report + board status).  
5. Governance recommendation recorded (approve Slice D / eligibility of next units).  
6. Validation phrase recorded:

```
VALIDATE AUTH-001 SLICE D
```

Validation recorded: [46](./46-slice-d-validation.md) · **PASS**. AUTH-001 Slice E subsequently **AUTHORIZED** ([47](./47-slice-e-authorization.md)). OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain locked regardless.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE AUTH-001 SLICE D` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity (critical / major / observation) and binding criterion IDs (SD-xx / H-06–H-08).  
3. Produce a **remediation** record (AUTH-001 § next) limited to fixing authorized Slice D defects — no scope expansion into Slice E or other packages.  
4. Re-run validation under phrase **`VALIDATE AUTH-001 SLICE D`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Slice E and other packages stay locked until Slice D Validated PASS + their own authorize phrases.

Pattern precedent: Slice B FAIL → remediation → re-run PASS ([38](./38-slice-b-validation.md) · [39](./39-slice-b-remediation.md) · [40](./40-slice-b-validation-rerun.md)).

---

## 8. Deferred / outside Slice D

| Item | Disposition |
|------|-------------|
| AUTH-001 Slice E | Locked until `AUTHORIZE AUTH-001 SLICE E` |
| OPS-001 Slice B | Eligible separately · **not** authorized by this document |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| COM-001 / FIN-003 / BILL-001 new work | Separate package gates |
| Multi-org switcher UX | Separate unlock |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice D?** | ✅ **YES — AUTHORIZED** |
| **Recommend begin Slice D implementation?** | ✅ **DONE** ([45](./45-slice-d-implementation.md)) |
| **Validate Slice D?** | ✅ **PASS** ([46](./46-slice-d-validation.md)) |
| **Authorize Slice E?** | ✅ **AUTHORIZED** (separate session) · [47](./47-slice-e-authorization.md) |
| **Authorize OPS-001 Slice B / UX-012 Slice B / PMX-004 Phase 2?** | ❌ **NO** |
| **Next** | Implement Slice E · then `VALIDATE AUTH-001 SLICE E` |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE AUTH-001 SLICE D** | 2026-07-24 |
| Implementation | ✅ **IMPLEMENTED** · [45](./45-slice-d-implementation.md) | 2026-07-24 |
| Validation | ✅ **`VALIDATE AUTH-001 SLICE D`** · **PASS** · [46](./46-slice-d-validation.md) | 2026-07-24 |
