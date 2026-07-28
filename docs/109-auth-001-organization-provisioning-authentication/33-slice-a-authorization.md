# 33 — AUTH-001 Slice A Authorization

**Package:** AUTH-001 — Organization Provisioning, Authentication & Account Hierarchy  
**Slice:** **A — Identity foundation**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([34](./34-slice-a-implementation.md)) · ✅ **VALIDATED** ([35](./35-slice-a-validation.md))  
**Authorization date:** 2026-07-24  
**Implementation date:** 2026-07-24  
**Validation date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE AUTH-001 SLICE A
```

**Validation phrase (issued):**

```
VALIDATE AUTH-001 SLICE A
```

**Program record:** [CORE-003 §40](../113-core-003-implementation-master-plan/40-auth-001-slice-a-authorization.md)  
**Implementation summary:** [34 — Slice A Implementation](./34-slice-a-implementation.md)  
**Validation report:** [35 — Slice A Validation](./35-slice-a-validation.md)  
**Slice catalog:** [31 — Implementation slices](./31-implementation-slices.md)  
**Package approval:** [32 — Approval record](./32-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md)  
**Design SoT:** [02 — Authentication architecture](./02-authentication-architecture.md) · [08 — Username policy](./08-username-policy.md) · [10 — Password lifecycle](./10-password-lifecycle.md) · [27 — Invitation-only](./27-invitation-only-platform.md)  
**UX foundation (any auth UI):** UX-012 Slice A ✅ **VALIDATED** ([UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md))  
**Program prerequisite:** OPS-001 Slice A ✅ **VALIDATED** ([OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md))

> Slice A is **Validated** ([35](./35-slice-a-validation.md) · **PASS**).  
> Subsequent authorize: **`AUTHORIZE AUTH-001 SLICE B`** issued ([36](./36-slice-b-authorization.md)).  
> Slices C–E, AUTH-001 Slice D deferred-role certification (Org Admin / Leasing Agent / Facility Technician surfaces), OPS-001 Slice B, UX-012 Slice B, and PMX-004 Phase 2 remain **locked** until their own authorize phrases.

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
| OPS-001 Slice B | Not authorized | ✅ (correct — not a blocker for AUTH-A) |
| AUTH-001 Slice D roles | Deferred ([33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) | ✅ **excluded from Slice A** |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| CORE-003 M1.3 order | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice A?** ❌ **None.**

---

## 2. Authorization scope

### In scope (Slice A)

| Deliverable | Binding source |
|-------------|----------------|
| **Identity Adapter** (Supabase Auth behind adapter) | [02](./02-authentication-architecture.md) |
| **Username authentication** (username + password login; email not identity) | [02](./02-authentication-architecture.md) · [08](./08-username-policy.md) · [09](./09-email-policy.md) |
| **First login** (verify / terms / force password change as designed) | [10](./10-password-lifecycle.md) · package A-04 |
| **Password change** (temp → permanent; session revoke on change) | [10](./10-password-lifecycle.md) |
| **Invitation-only entrypoint hardening** (remove/disable public signup that creates accounts) | [27](./27-invitation-only-platform.md) · [31](./31-implementation-slices.md) |
| Dual-run / migration hooks for existing design-partner accounts as needed for Slice A | [24](./24-open-questions.md) Q10 |

### Implementation boundaries

1. Work is limited to **Identity foundation** plumbing and the minimum schema/API/UI needed for username login, first-login password change, and closing public self-registration.  
2. Prefer extending Phase 3 identity / existing auth surfaces rather than inventing a parallel identity system.  
3. Any **UI** touched under Slice A **must** consume UX-012 Slice A tokens (Canopy / `--mpa-*`) — no competing design systems.  
4. Slice A **does not** implement Org Admin / Leasing Agent / Facility Technician first-class role surfaces or their certification (Slice D).  
5. Slice A **does not** implement org provisioning, invitation delivery emails, recovery, or permission-engine redesign (later slices).  
6. Material scope beyond Slice A requires a new authorize phrase (Slice B+).

### Includes (explicit)

- Username principal model (login identity)  
- Login by username + password  
- Temporary → permanent password flow on first login  
- Session revoke on password change  
- Invitation-only entrypoint hardening (no public signup creates accounts)  
- Identity Adapter boundary over Supabase Auth  
- Minimum auth UX alignment with UX-005 / username login (tokenized with UX-012 A)

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| Organization provisioning · Org Admin provision · Subscription assignment | Slice B |
| Invitation system · Temp password email delivery · Accept-invite UX completion beyond A hardening | Slice C |
| Permission engine · Role management · Dashboard assignment | Slice D |
| **Organization Administrator / Leasing Agent / Facility Technician** implementation & certification | **Slice D** (deferred — [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) |
| Recovery · Emergency recovery · Privileged audit completion · Support escalation | Slice E |
| AI Guided Setup / Professional Implementation orchestration | Post–E / separate |
| Multi-org switcher UX exposure | Separate unlock ([18](./18-multi-organization-future.md)) |
| SSO / SAML | Future |
| OPS-001 Slice B+ | Separate authorize |
| UX-012 Slice B+ | Separate authorize |
| PMX-004 Phase 2+ | `AUTHORIZE PMX-004 PHASE 2` |
| COM-001 / BILL-001 / FIN-003 implementation | Separate package gates |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| AUTH-001 Approved with Amendments · ADR-026 | Identity architecture SoT |
| CORE-003 M0 = GO | Program unlock |
| UX-012 Slice A Validated | Design-token foundation for any auth UI |
| OPS-001 Slice A Validated | Program order M1.2 complete (event bus available for future identity events without secrets) |
| Existing Phase 3 identity / Supabase Auth | Substrate |

**Does not depend on:** OPS-001 Slice B · AUTH-001 B–E · UX-012 Slice B · PMX-004 Phase 2 · COM-001 · Slice D deferred roles.

---

## 5. Acceptance criteria (Slice A)

| ID | Criterion |
|----|-----------|
| AA-01 | Identity Adapter (or equivalent boundary) mediates auth provider operations for the commercial login path per [02](./02-authentication-architecture.md). |
| AA-02 | Login uses **username + password**; email is not the login identity ([08](./08-username-policy.md) · package A-01). |
| AA-03 | First-login path enforces required verify/terms/password-change steps per [10](./10-password-lifecycle.md) (package A-04). |
| AA-04 | Temporary password cannot be reused after successful change; sessions are revoked on password change (package A-05 · Slice A includes). |
| AA-05 | Public self-registration / open signup that creates accounts is disabled or removed for the commercial platform entrypoint ([27](./27-invitation-only-platform.md)). |
| AA-06 | Passwords / temp credentials are never logged, returned in APIs, or placed on OPS event payloads (package A-06 · OPS-001 no-secrets rule). |
| AA-07 | Username immutability / non-reuse rules for newly issued principals are enforced or fail closed where Slice A touches issuance ([08](./08-username-policy.md) · package A-03 as applicable to A scope). |
| AA-08 | No Org Admin / Leasing Agent / Facility Technician Slice D surfaces or certification work shipped under this authorize. |
| AA-09 | Any Slice A auth UI uses UX-012 Slice A tokens only. |
| AA-10 | Package fail conditions in [23](./23-acceptance-criteria.md) applicable to Slice A not violated (no email-as-identity commercial path; no open signup). |

---

## 6. Exit criteria (Validation)

Slice A exits **Validated** only when **all** are true:

1. Acceptance criteria AA-01–AA-10 satisfied.  
2. Username login / first-login / password-change certification path passes for the Slice A scope.  
3. No public signup creates accounts.  
4. Validation phrase recorded:

```
VALIDATE AUTH-001 SLICE A
```

Until Validation is recorded: AUTH-001 Slice B remains **locked** (default). AUTH-001 Slice D deferred roles remain locked regardless.

---

## 7. Deferred / outside Slice A

| Item | Disposition |
|------|-------------|
| AUTH-001 Slices B–E | Locked until each `AUTHORIZE AUTH-001 SLICE …` |
| Org Admin / Leasing / Facility Tech certification | Slice D only · [CORE-003 §33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) |
| OPS-001 Slice B | Eligible separately · **not** authorized by this document |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| COM-001 | Separate package gate |

---

## 8. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice A?** | ✅ **YES — AUTHORIZED** |
| **Recommend begin Slice A implementation?** | ✅ **YES** — in a **separate implementation session** |
| **Begin implementation in this governance session?** | ❌ **NO** |
| **Authorize Slice D / deferred roles?** | ❌ **NO** |
| **Next after Validation** | ✅ Issued subsequently: `AUTHORIZE AUTH-001 SLICE B` · [36](./36-slice-b-authorization.md) |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE AUTH-001 SLICE A** | 2026-07-24 |
| Implementation | ✅ **IMPLEMENTED** · [34](./34-slice-a-implementation.md) | 2026-07-24 |
| Validation | ✅ **PASS** · `VALIDATE AUTH-001 SLICE A` · [35](./35-slice-a-validation.md) | 2026-07-24 |
