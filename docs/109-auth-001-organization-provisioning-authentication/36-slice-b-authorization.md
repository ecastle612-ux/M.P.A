# 36 — AUTH-001 Slice B Authorization

**Package:** AUTH-001 — Organization Provisioning, Authentication & Account Hierarchy  
**Slice:** **B — Organization provisioning**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([37](./37-slice-b-implementation.md)) · ✅ **VALIDATED** ([40](./40-slice-b-validation-rerun.md) · **PASS**)  
**Authorization date:** 2026-07-24  
**Implementation date:** 2026-07-24  
**Validation date:** 2026-07-24 (re-run PASS)  
**Remediation date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE AUTH-001 SLICE B
```

**Validation phrase (issued):**

```
VALIDATE AUTH-001 SLICE B
```

**Program record:** [CORE-003 §41](../113-core-003-implementation-master-plan/41-auth-001-slice-b-authorization.md)  
**Implementation summary:** [37 — Slice B Implementation](./37-slice-b-implementation.md)  
**Validation report (authoritative):** [40 — Slice B Validation Re-Run](./40-slice-b-validation-rerun.md) · ✅ **PASS**  
**Prior FAIL (preserved):** [38](./38-slice-b-validation.md) · Remediation [39](./39-slice-b-remediation.md)  
**Slice catalog:** [31 — Implementation slices](./31-implementation-slices.md)  
**Prior slice:** Slice A ✅ **VALIDATED** ([35](./35-slice-a-validation.md) · **PASS**)  
**Package approval:** [32 — Approval record](./32-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md)  
**Design SoT:** [05 — Subscription activation](./05-subscription-activation-workflow.md) · [06 — Organization provisioning](./06-organization-provisioning-workflow.md) · [26 — Capability matrix](./26-subscription-capability-matrix.md) · [28 — Org status lifecycle](./28-organization-status-lifecycle.md) · [08 — Username policy](./08-username-policy.md)  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** ([UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md))  
**Identity foundation:** AUTH-001 Slice A ✅ **VALIDATED** ([35](./35-slice-a-validation.md))  
**Program order:** CORE-003 M2.1 ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Slice B **Validated PASS** ([40](./40-slice-b-validation-rerun.md)). Slice C **Authorized** ([41](./41-slice-c-authorization.md)).  
> Slice D deferred-role certification · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain locked.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| AUTH-001 Approved with Amendments | [32](./32-approval-record.md) · A01–A08 | ✅ |
| ADR-026 Accepted | [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md) | ✅ |
| Implementation slices finalized | [31](./31-implementation-slices.md) | ✅ |
| M0 = GO | [36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) | ✅ |
| AUTH-001 Slice A Validated | [35](./35-slice-a-validation.md) · **PASS** | ✅ |
| AUTH-001 Slice A → B serial rule | Prior slice Validated before next Authorize | ✅ |
| OPS-001 Slice B | Not authorized | ✅ (correct — not a blocker for AUTH-B) |
| UX-012 Slice B | Not authorized | ✅ (correct — not a blocker for AUTH-B) |
| AUTH-001 Slice D role certification | Deferred ([CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) | ✅ **excluded from Slice B certification scope** |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| CORE-003 M2.1 order | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice B?** ❌ **None.**

---

## 2. Authorization scope

### In scope (Slice B)

| Deliverable | Binding source |
|-------------|----------------|
| **Organization provisioning saga** from BILL-001 / SaaS activation (idempotent) | [05](./05-subscription-activation-workflow.md) · [06](./06-organization-provisioning-workflow.md) · package P-01 / P-06 |
| **Subscription / plan / modules bind** at provision | [05](./05-subscription-activation-workflow.md) · [26](./26-subscription-capability-matrix.md) · P-02 |
| **Organization Administrator provision** (principal + ownership membership) | [06](./06-organization-provisioning-workflow.md) · [08](./08-username-policy.md) · Slice A Identity Adapter · P-03 |
| **Commercial org status** `Trial` / `Pending Setup` (as designed) | [28](./28-organization-status-lifecycle.md) |
| **Capability matrix enforcement hooks** (entitlement snapshot / server-side assert hooks for purchased plan) | [26](./26-subscription-capability-matrix.md) · A01 |
| **Safe domain event** on provision (no secrets on OPS payloads) | [06](./06-organization-provisioning-workflow.md) · OPS-001 Slice A bus · AA-06 continuity |

### Implementation boundaries

1. Work is limited to **organization provisioning** and the minimum schema/API/service plumbing to create one org, bind plan/modules, and provision exactly one Org Admin principal/membership from a verified activation input.  
2. Reuse AUTH-001 Slice A Identity Adapter / username registry for Org Admin username issuance — do not invent a parallel identity path.  
3. Any **UI** touched under Slice B **must** consume UX-012 Slice A tokens (Canopy / `--mpa-*`) — no competing design systems.  
4. Slice B **provisions** the Organization Administrator account (membership + ownership). It does **not** ship Org Admin first-class product surfaces or **certification** (Slice D · [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)).  
5. Slice B does **not** implement Leasing Agent or Facility Technician roles, surfaces, or certification.  
6. Credential **delivery** (welcome email / temp password channel via EML-001), subaccount invitation system, and temp-password TTL email flows remain **Slice C**. Slice B may create the principal in a first-login-ready state (`temporary_issued` / equivalent) so Slice A first-login works after credentials are delivered in C — but must not claim Slice C complete.  
7. Material scope beyond Slice B requires a new authorize phrase (Slice C+).

### Includes (explicit)

- Idempotent org create from BILL-001 activation / Level 0 manual create per [06](./06-organization-provisioning-workflow.md)  
- Plan + enabled modules / entitlement snapshot bind  
- Exactly one Organization Administrator principal (MPA-generated username) + ownership membership  
- Org commercial status transition into `Trial` and/or `Pending Setup` as designed  
- Capability matrix enforcement hooks (server-side; see-what-you-bought foundation)  
- Provision failure handling (`provisioning_failed` / ops-visible failure path without leaking secrets)  
- Emit `organization.provisioned` (or equivalent) **without** passwords/temp credentials on the payload  

### Org Admin — provision vs certification (binding)

| Aspect | Slice B | Slice D |
|--------|---------|---------|
| Create Org Admin principal + ownership membership | ✅ In scope | — |
| MPA-generated username via Identity Adapter | ✅ In scope | — |
| Org Admin product surfaces, nav, dashboard certification | ❌ Out of scope | ✅ Required for Slice D COMPLETE |
| Leasing Agent / Facility Technician | ❌ Out of scope | ✅ Required for Slice D COMPLETE |

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| Welcome / invite email delivery · temp password plaintext channel · EML-001 templates | Slice C |
| Subaccount invitation system · accept-invite completion beyond Slice A hardening | Slice C |
| Temp password TTL email / contact-email verification productization | Slice C |
| Permission engine redesign · role templates · property scopes · dashboard assignment UX | Slice D |
| **Organization Administrator / Leasing Agent / Facility Technician certification & first-class surfaces** | **Slice D** (deferred — [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) |
| Org Admin self-serve recovery · emergency recovery · privileged audit completion · support escalation | Slice E |
| AI Guided Setup / Professional Implementation orchestration | Post–E / separate |
| Multi-org switcher UX exposure | Separate unlock ([18](./18-multi-organization-future.md)) |
| SSO / SAML | Future |
| BILL-001 / Stripe Checkout ownership | BILL-001 (AUTH consumes verified activation) |
| COM-001 commercial lifecycle implementation | Separate package gate |
| OPS-001 Slice B+ | Separate authorize |
| UX-012 Slice B+ | Separate authorize |
| PMX-004 Phase 2+ | `AUTHORIZE PMX-004 PHASE 2` |
| FIN-003 implementation | Separate package gate |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| AUTH-001 Slice A Validated | Identity Adapter · username principals · first-login gate |
| AUTH-001 Approved with Amendments · ADR-026 | Provisioning architecture SoT |
| CORE-003 M0 = GO | Program unlock |
| UX-012 Slice A Validated | Design-token foundation for any touched UI |
| OPS-001 Slice A Validated | Event bus for secret-free provision events |
| BILL-001 activation event / inputs | Commercial trigger (consume, do not re-own Checkout) |
| Phase 3 organization / membership substrate | Extend, do not fork |

**Does not depend on:** OPS-001 Slice B · UX-012 Slice B · AUTH-001 C–E · PMX-004 Phase 2 · COM-001 implementation · Slice D deferred-role certification.

---

## 5. Acceptance criteria (Slice B)

| ID | Criterion |
|----|-----------|
| **AB-01** | Verified SaaS / BILL-001 activation (or Level 0 manual create per [06](./06-organization-provisioning-workflow.md)) provisions **exactly one** Organization for a given idempotency key (package P-01 / P-06). |
| **AB-02** | Plan code + enabled modules / entitlement snapshot are bound at provision (package P-02 · [26](./26-subscription-capability-matrix.md)). |
| **AB-03** | Exactly one Organization Administrator principal is provisioned with an **MPA-generated username** via Slice A Identity Adapter / username registry (package P-03 · [08](./08-username-policy.md)). |
| **AB-04** | Org Admin is attached with ownership / primary admin membership for the new organization; no additional day-to-day users are auto-created at provision ([06](./06-organization-provisioning-workflow.md)). |
| **AB-05** | Organization commercial status is set to **`Trial` and/or `Pending Setup`** per [28](./28-organization-status-lifecycle.md) (not silently marked `Active` without setup path). |
| **AB-06** | Capability matrix **enforcement hooks** exist for the provisioned plan (server-side entitlement assert / snapshot path) so unpurchased capabilities are not treated as available ([26](./26-subscription-capability-matrix.md)). |
| **AB-07** | Provision domain events / OPS payloads never include passwords or temporary credentials (package A-06 continuity · OPS-001 no-secrets). |
| **AB-08** | Retry / duplicate activation is **idempotent** — no duplicate orgs or duplicate Org Admin principals for the same activation key (P-06). |
| **AB-09** | No Leasing Agent / Facility Technician surfaces; no Org Admin **certification** / first-class Slice D role UI shipped under this authorize ([CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)). |
| **AB-10** | Any Slice B UI uses UX-012 Slice A tokens only; Slice A invitation-only / username-identity invariants remain unbroken ([27](./27-invitation-only-platform.md) · [35](./35-slice-a-validation.md)). |

---

## 6. Exit criteria (Validation)

Slice B exits **Validated** only when **all** are true:

1. Acceptance criteria AB-01–AB-10 satisfied.  
2. Idempotent provision certification path passes (one org · one Org Admin · plan/modules bound).  
3. Capability matrix hooks demonstrably attached to the provisioned subscription.  
4. No Slice D deferred-role certification work shipped under Slice B.  
5. Validation phrase recorded:

```
VALIDATE AUTH-001 SLICE B
```

Until Validation is recorded: AUTH-001 Slice C remains **locked** (default). AUTH-001 Slice D deferred-role certification remains locked regardless.

---

## 7. Deferred / outside Slice B

| Item | Disposition |
|------|-------------|
| AUTH-001 Slices C–E | Locked until each `AUTHORIZE AUTH-001 SLICE …` |
| Org Admin / Leasing / Facility Tech **certification & first-class surfaces** | Slice D only · [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) |
| Welcome email / temp credential delivery | Slice C |
| OPS-001 Slice B | Eligible separately · **not** authorized by this document |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| COM-001 | Separate package gate |

---

## 8. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice B?** | ✅ **YES — AUTHORIZED** |
| **Recommend begin Slice B implementation?** | ✅ **YES** — in a **separate implementation session** |
| **Begin implementation in this governance session?** | ❌ **NO** |
| **Authorize Slice D / deferred roles?** | ❌ **NO** |
| **Authorize OPS-001 Slice B / UX-012 Slice B?** | ❌ **NO** |
| **Next after Validation** | `AUTHORIZE AUTH-001 SLICE C` (default) |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE AUTH-001 SLICE B** | 2026-07-24 |
| Implementation | ✅ **IMPLEMENTED** · [37](./37-slice-b-implementation.md) | 2026-07-24 |
| Validation (first) | ❌ **FAIL** · [38](./38-slice-b-validation.md) | 2026-07-24 |
| Remediation | ✅ R1 + R2 · [39](./39-slice-b-remediation.md) | 2026-07-24 |
| Re-validation | ✅ **PASS** · `VALIDATE AUTH-001 SLICE B` · [40](./40-slice-b-validation-rerun.md) | 2026-07-24 |
