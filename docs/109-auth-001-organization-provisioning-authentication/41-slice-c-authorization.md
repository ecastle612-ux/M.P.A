# 41 — AUTH-001 Slice C Authorization

**Package:** AUTH-001 — Organization Provisioning, Authentication & Account Hierarchy  
**Slice:** **C — Invitations & credentials delivery**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([42](./42-slice-c-implementation.md)) · ✅ **VALIDATED** ([43](./43-slice-c-validation.md) · **PASS**)  
**Authorization date:** 2026-07-24  
**Implementation date:** 2026-07-24  
**Validation date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE AUTH-001 SLICE C
```

**Validation phrase (issued):**

```
VALIDATE AUTH-001 SLICE C
```

**Program record:** [CORE-003 §42](../113-core-003-implementation-master-plan/42-auth-001-slice-c-authorization.md)  
**Implementation summary:** [42 — Slice C Implementation](./42-slice-c-implementation.md)  
**Validation report:** [43 — Slice C Validation](./43-slice-c-validation.md)  
**Slice catalog:** [31 — Implementation slices](./31-implementation-slices.md)  
**Prior slice:** Slice B ✅ **VALIDATED** ([40](./40-slice-b-validation-rerun.md) · **PASS**)  
**Package approval:** [32 — Approval record](./32-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md)  
**Design SoT:** [27 — Invitation-only platform](./27-invitation-only-platform.md) · [09 — Email policy](./09-email-policy.md) · [10 — Password lifecycle](./10-password-lifecycle.md) · [06 — Organization provisioning](./06-organization-provisioning-workflow.md) · [05 — Subscription activation](./05-subscription-activation-workflow.md) · [11 — Account lifecycle](./11-account-lifecycle.md) · [21 — Sequence diagrams](./21-sequence-diagrams.md) · [23 — Acceptance criteria](./23-acceptance-criteria.md) (P-04 / P-05)  
**Email experience SoT:** [EML-001](../81-eml-001-transactional-email-experience/README.md) (Approved · Implemented)  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** ([UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md))  
**Identity / provision foundation:** AUTH-001 Slice A ✅ **VALIDATED** ([35](./35-slice-a-validation.md)) · Slice B ✅ **VALIDATED** ([40](./40-slice-b-validation-rerun.md))  
**Program order:** CORE-003 M3.1 ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Slice C **VALIDATED PASS** ([43](./43-slice-c-validation.md)). Slice D subsequently **AUTHORIZED** ([44](./44-slice-d-authorization.md)).  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · Slice E remain locked.

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
| AUTH-001 Slice B Validated | [40](./40-slice-b-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slice B → C serial rule | Prior slice Validated before next Authorize | ✅ |
| EML-001 Approved / Implemented | [EML-001 README](../81-eml-001-transactional-email-experience/README.md) | ✅ |
| OPS-001 Slice B | Not authorized | ✅ (correct — not a blocker for AUTH-C) |
| UX-012 Slice B | Not authorized | ✅ (correct — not a blocker for AUTH-C) |
| AUTH-001 Slice D role certification | Deferred ([CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) | ✅ **excluded from Slice C scope** |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| CORE-003 M3.1 order | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice C?** ❌ **None.**

---

## 2. Authorization scope

### In scope (Slice C)

| Deliverable | Binding source |
|-------------|----------------|
| **Org Admin welcome / credential delivery** after Slice B provision (`temporary_issued` → email channel) | [05](./05-subscription-activation-workflow.md) · [06](./06-organization-provisioning-workflow.md) · P-04 / P-05 |
| **Subaccount invitation system** — invite issued → email → accept → activate | [27](./27-invitation-only-platform.md) · [11](./11-account-lifecycle.md) · [21](./21-sequence-diagrams.md) §3 |
| **Temporary password issuance / TTL / single-consumption** with hash-only retention | [10](./10-password-lifecycle.md) · [19](./19-security-model.md) · P-04 |
| **EML-001 welcome / invite / temp-credential templates** wired to AUTH flows | [09](./09-email-policy.md) · [EML-001](../81-eml-001-transactional-email-experience/README.md) |
| **Contact-email verification** productization (Org Admin checkout email + invitee email) | [09](./09-email-policy.md) |
| **Accept-invitation completion path** (beyond Slice A invitation-only hardening) | [27](./27-invitation-only-platform.md) · UX-005 alignment |
| **Delivery failure / retry with ops visibility** (no duplicate-welcome spam) | [05](./05-subscription-activation-workflow.md) · OPS-001 Slice A bus |
| **Invite lifecycle ops** — edit/resend, expire, revoke per edge cases | [22](./22-edge-cases.md) · [27](./27-invitation-only-platform.md) |

### Implementation boundaries

1. Work is limited to **credential delivery** and the **invitation join path** — not org provisioning (Slice B) and not role/dashboard certification (Slice D).  
2. Reuse AUTH-001 Slice A Identity Adapter / username registry and Slice B provisioned principals — do not invent a parallel identity or provision path.  
3. Temporary plaintext credentials may exist **only** in the send pipeline; never on OPS event payloads, audit dumps, or Level 0 tooling screens ([19](./19-security-model.md) · AA-06 continuity).  
4. Any **UI** touched under Slice C **must** consume UX-012 Slice A tokens (Canopy / `--mpa-*`) — no competing design systems.  
5. Slice C **does not** ship Org Admin / Leasing Agent / Facility Technician product surfaces or **certification** (Slice D · [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)).  
6. Slice C **does not** implement Org Admin self-serve recovery, emergency recovery, or privileged audit completion (Slice E).  
7. Public signup remains **forbidden** ([27](./27-invitation-only-platform.md)).  
8. Material scope beyond Slice C requires a new authorize phrase (Slice D+).

### Includes (explicit)

- Welcome email to Org Admin after successful provision (or retry with ops-visible failure)  
- Temporary password generation / re-issue by authorized actors; TTL (design default 72h); single-use after first-login change  
- Subaccount invite create / deliver / accept / activate within an organization  
- Contact email capture + verification on invite / first-login path  
- EML-001 template integration for welcome, invite, and temp-credential messages  
- Idempotent / anti-spam delivery semantics for welcome & invite sends  
- Secret-free domain events for invite/delivery outcomes (status only — never plaintext secrets)

### Delivery vs certification (binding)

| Aspect | Slice C | Slice D |
|--------|---------|---------|
| Deliver Org Admin / invitee credentials via email | ✅ In scope | — |
| Accept-invite → first-login-ready principal | ✅ In scope | — |
| Org Admin / Leasing / Facility Tech product surfaces & certification | ❌ Out of scope | ✅ Required for Slice D COMPLETE |
| Permission engine · dashboard assignment UX | ❌ Out of scope | ✅ Required for Slice D COMPLETE |

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| Organization create · plan/module bind · Org Admin principal **provision** | Slice B (Validated) |
| Identity Adapter / username login / first-login gate mechanics (already shipped) | Slice A (Validated) — C enables E2E by delivering credentials |
| Permission engine · role templates · property scopes · dashboard assignment UX | Slice D |
| **Organization Administrator / Leasing Agent / Facility Technician certification & first-class surfaces** | **Slice D** (deferred — [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) |
| Org Admin self-serve forgot-password · Level 0 Org Admin recovery · emergency recovery · privileged audit completion · support escalation | Slice E |
| Subaccount reset-by-Org-Admin as **recovery** productization | Slice E |
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
| AUTH-001 Slice B Validated | Provisioned org + Org Admin principal in `temporary_issued` (or equivalent) |
| AUTH-001 Slice A Validated | Identity Adapter · username principals · first-login gate |
| AUTH-001 Approved with Amendments · ADR-026 | Invitation / credential architecture SoT |
| EML-001 Approved · Implemented | Transactional email templates / send pipeline |
| CORE-003 M0 = GO | Program unlock |
| UX-012 Slice A Validated | Design-token foundation for any touched UI |
| OPS-001 Slice A Validated | Event bus for secret-free delivery / invite outcome events |
| Phase 3 organization / membership substrate | Extend, do not fork |

**Does not depend on:** OPS-001 Slice B · UX-012 Slice B · AUTH-001 D–E · PMX-004 Phase 2 · COM-001 implementation · Slice D deferred-role certification.

---

## 5. Acceptance criteria (Slice C)

| ID | Criterion |
|----|-----------|
| **AC-01** | After Slice B provision, Org Admin receives (or ops-visible retry of) a **welcome / credential email** containing the temporary credential channel — plaintext never persisted beyond send pipeline (package P-04 / P-05 · [06](./06-organization-provisioning-workflow.md)). |
| **AC-02** | Temporary passwords are **system-generated**, **TTL-bounded**, **single-consumption**, and stored as **hash + metadata only** ([10](./10-password-lifecycle.md)). |
| **AC-03** | Subaccount **invite → email → accept → activate** path works without public self-registration ([27](./27-invitation-only-platform.md)). |
| **AC-04** | Invitee usernames remain **MPA-generated** via Identity Adapter / registry — invitee does not choose or self-originate identity ([08](./08-username-policy.md) · [27](./27-invitation-only-platform.md)). |
| **AC-05** | Contact-email **verification** is enforced on Org Admin / invitee first-login (or equivalent gate) per [09](./09-email-policy.md); email change never becomes login identity. |
| **AC-06** | Delivery failures are **retried** and/or ops-visible; duplicate welcome/invite spam is prevented ([05](./05-subscription-activation-workflow.md)). |
| **AC-07** | Invite lifecycle supports authorized **resend / expire / revoke** (and typo-edit + resend) without creating duplicate principals for the same invite ([22](./22-edge-cases.md)). |
| **AC-08** | Domain events / OPS payloads for invite & delivery **never** include passwords or temporary credentials (AA-06 continuity · OPS-001 no-secrets). |
| **AC-09** | No Leasing Agent / Facility Technician surfaces; no Org Admin **certification** / first-class Slice D role UI shipped under this authorize ([CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)). |
| **AC-10** | Any Slice C UI uses UX-012 Slice A tokens only; invitation-only / username-identity invariants remain unbroken ([27](./27-invitation-only-platform.md) · [35](./35-slice-a-validation.md) · [40](./40-slice-b-validation-rerun.md)). |

---

## 6. Exit criteria (Validation)

Slice C exits **Validated** only when **all** are true:

1. Acceptance criteria AC-01–AC-10 satisfied.  
2. Org Admin welcome credential path demonstrably closes Slice B → first-login (Slice A gate) end-to-end without exposing secrets on OPS payloads.  
3. Subaccount invite-only join path certified (no public signup regression).  
4. No Slice D deferred-role certification work shipped under Slice C.  
5. Validation phrase recorded:

```
VALIDATE AUTH-001 SLICE C
```

Validation recorded: [43](./43-slice-c-validation.md) · **PASS**. AUTH-001 Slice D subsequently **AUTHORIZED** ([44](./44-slice-d-authorization.md)).

---

## 7. Deferred / outside Slice C

| Item | Disposition |
|------|-------------|
| AUTH-001 Slices D–E | Locked until each `AUTHORIZE AUTH-001 SLICE …` |
| Org Admin / Leasing / Facility Tech **certification & first-class surfaces** | Slice D only · [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) |
| Org Admin recovery · emergency recovery · privileged audit · support escalation | Slice E |
| OPS-001 Slice B | Eligible separately · **not** authorized by this document |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| COM-001 | Separate package gate |

---

## 8. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice C?** | ✅ **YES — AUTHORIZED** |
| **Recommend begin Slice C implementation?** | ✅ **DONE** ([42](./42-slice-c-implementation.md)) |
| **Validate Slice C?** | ✅ **PASS** ([43](./43-slice-c-validation.md)) |
| **Authorize Slice D / deferred roles?** | ✅ **AUTHORIZED** (separate session) · [44](./44-slice-d-authorization.md) |
| **Authorize OPS-001 Slice B / UX-012 Slice B?** | ❌ **NO** |
| **Next** | Implement Slice D · then `VALIDATE AUTH-001 SLICE D` |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE AUTH-001 SLICE C** | 2026-07-24 |
| Implementation | ✅ **IMPLEMENTED** · [42](./42-slice-c-implementation.md) | 2026-07-24 |
| Validation | ✅ **`VALIDATE AUTH-001 SLICE C`** · **PASS** · [43](./43-slice-c-validation.md) | 2026-07-24 |
