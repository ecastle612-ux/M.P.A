# 31 — COM-001 Slice B Authorization

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **B — Implementation progress + trial experience**  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **COMPLETE** ([32](./32-slice-b-implementation.md)) · Validation ✅ **PASS** ([33](./33-slice-b-validation.md))  
**Authorization date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE COM-001 SLICE B
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE COM-001 SLICE B
```

**Program record:** [CORE-003 §48](../113-core-003-implementation-master-plan/48-com-001-slice-b-authorization.md)  
**Prior slice:** [30 — Slice A Validation](./30-slice-a-validation.md) · ✅ **PASS**  
**Slice catalog:** [26 — Implementation slices](./26-implementation-slices.md)  
**Package approval:** [27 — Approval record](./27-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) (**Accepted**)  
**Design SoT:** [18 — Implementation progress](./18-implementation-progress.md) · [24 — Trial experience](./24-trial-experience.md) · [05 — Implementation workflows](./05-implementation-workflows.md) · [04 — Billing state machine](./04-billing-state-machine.md) · [03 — Subscription architecture](./03-subscription-architecture.md) · [26](./26-implementation-slices.md) Slice B · IP-01…IP-04 · TR-01…TR-04 · P-05 · P-06 (Finish Setup handoff portion in scope only as score gate)  
**AUTH foundation:** AUTH-001 A–E ✅ **COMPLETE** (org provision, wizard/Finish Setup, recovery contact gates reused — not redesigned)  
**COM foundation:** COM-001 Slice A ✅ **VALIDATED** (activation · org↔opportunity · Won↛org preserved)  
**OPS foundation:** OPS-001 Slice A ✅ **VALIDATED** — secret-free bus for progress/trial outcomes  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only  
**Billing boundary:** BILL-001 remains SaaS money rail (trial convert / upgrade Checkout)  
**Program order:** CORE-003 **M3.2** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE COM-001 SLICE B` issued**. Implementation may begin **only** within the scope below.  
> COM-001 Slice C · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| COM-001 Approved with Amendments | [27](./27-approval-record.md) · A01–A09 | ✅ |
| ADR-027 Accepted | [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) | ✅ |
| Implementation slices finalized | [26](./26-implementation-slices.md) | ✅ |
| Slice B design SoT (A02 · A05) | [18](./18-implementation-progress.md) · [24](./24-trial-experience.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slice A Validated | [30](./30-slice-a-validation.md) · **PASS** · [CORE-003 §47](../113-core-003-implementation-master-plan/47-com-001-slice-a-validation.md) | ✅ |
| CORE-003 M3.2 dependency (COM-A Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| No unfinished Authorized COM slice blocking serial rule | COM-A Validated | ✅ |
| COM-001 Slice C | Not authorized | ✅ (correct) |
| OPS-001 Slice B | Not authorized | ✅ (correct — not issued by this phrase) |
| UX-012 Slice B | Not authorized | ✅ (correct) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice B?** ❌ **None.**

**Order note:** CORE-003 also lists OPS-001 Slice B at **M2.3**. This phrase authorizes **COM-001 Slice B (M3.2)** only because COM-A is Validated and gate owners issued `AUTHORIZE COM-001 SLICE B`. OPS-001 Slice B remains **eligible separately** and is **not** authorized here.

---

## 2. Authorization scope

### In scope (Slice B)

| Deliverable | Binding source |
|-------------|----------------|
| **Implementation score model** (0–100%) with canonical milestones Purchased → … → Production Ready | [18](./18-implementation-progress.md) · IP-01…IP-04 |
| **Milestone tracking persistence** org-scoped; updated by setup / wizard / deferral signals | [18](./18-implementation-progress.md) · [05](./05-implementation-workflows.md) |
| **Visibility** — score (and next step / blockers) available to Customer (Org Admin / entitled implementers), Support, CS, and AI org context | [18](./18-implementation-progress.md) · IP-02 |
| **Production Ready gate** — score cannot claim 100% without Finish Setup + recovery contact requirements | [18](./18-implementation-progress.md) · IP-03 · IP-04 · AUTH-001 Finish Setup / recovery contact reuse |
| **Trial experience** — length, feature/entitlement limits, reminders/conversion sequence, expiry + trial grace, upgrade path | [24](./24-trial-experience.md) · TR-01…TR-04 |
| **Trial convert path** via BILL-001 Checkout / attach payment (no new org on upgrade of same workspace) | [24](./24-trial-experience.md) · BILL-001 boundary |
| **Invitation-only preserved** — trials still originate from COM activation / AUTH provision (no public signup) | [24](./24-trial-experience.md) · TR-04 · C6 · COM-A CA-09 |
| **Secret-free OPS events** for implementation progress and trial lifecycle outcomes (reuse OPS-001 Slice A bus) | OPS-001 Slice A |
| **Ops-minimum / customer-facing surfaces** sufficient to show score and trial status — not Slice E commercial dashboard | [26](./26-implementation-slices.md) |

### Implementation boundaries

1. Work is limited to **implementation progress + trial experience** — not health scoring, feature discovery productization, communication timeline productization, offboarding, or staff commercial dashboard.  
2. **Preserve COM-001 Slice A** — Won↛org, activation handoff, org↔opportunity link, AUTH provision path unchanged in semantics.  
3. **Reuse AUTH-001** Finish Setup / recovery contact / entitlements — do not invent a parallel identity or provision stack.  
4. **BILL-001** remains the money rail for trial convert / upgrade — do not redesign Stripe Billing.  
5. Trial still requires COM activation / Payment Successful (including $0 trial Checkout) before Organization Created ([24](./24-trial-experience.md)).  
6. Public self-registration remains **forbidden** (C6).  
7. Any **UI** must consume UX-012 Slice A tokens (`--mpa-*`) — no UX-012 Slice B chrome / Command Center productization.  
8. OPS events are **secret-free** (ids / scores / trial status / reason codes only).  
9. Reminder delivery may emit events / schedule hooks compatible with BILL-001 and existing notification rails; **OPS-001 Slice B notify/automation productization is out of scope**.  
10. Material scope beyond Slice B requires a new authorize phrase (COM-C+ / other packages).

### Includes (explicit)

- Persistable org-scoped implementation milestone state and derived 0–100% score  
- Customer-visible progress (minimum: score + next recommended step or equivalent)  
- CS/Support/AI-readable score surface or API (org-scoped; no cross-tenant leakage)  
- Trial clock / status aligned to [24](./24-trial-experience.md) defaults (14-day trial · 3-day grace) unless Implement records an approved default choice where [24] allows one  
- Trial reminder / conversion prompt hooks (in-app and/or secret-free events) for the documented sequence  
- Trial expiry → grace → convert-or-cancel path wiring (cancel/archive deep productization remains Slice D)  
- Upgrade CTA → BILL-001 convert without creating a duplicate organization  
- Secret-free OPS domain events for score/trial transitions on OPS Slice A bus  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| COM-001 Slice C (health · discovery · communication timeline) | Separate authorize |
| COM-001 Slice D (offboarding · CS automation productization) | Separate authorize |
| COM-001 Slice E (staff commercial dashboard · marketplace prep) | Separate authorize |
| OPS-001 Slice B (notify / automation productization) | Separate authorize |
| UX-012 Slice B (role chrome / Command Center productization) | Separate authorize |
| PMX-004 Phase 2 | `AUTHORIZE PMX-004 PHASE 2` |
| Full health-score coupling productization ([19](./19-customer-health-score.md)) | Slice C |
| Feature discovery productization ([20](./20-feature-discovery.md)) | Slice C |
| Customer communication timeline productization ([23](./23-customer-communication-timeline.md)) | Slice C |
| Certified partner marketplace UI | Post–E / separate |
| New BILL-001 / Stripe Checkout redesign | BILL-001 gates |
| AUTH-001 new identity/recovery productization | AUTH A–E already Validated — reuse only |
| Public signup / open registration | Forbidden permanently under C6 |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| COM-001 Approved with Amendments · ADR-027 | Commercial SoT |
| COM-001 Slice A Validated | Activation / org link / commercial foundation |
| CORE-003 M0 = GO · M3.2 order | Program unlock / sequence slot |
| AUTH-001 A–E COMPLETE | Org, wizard/Finish Setup, recovery contact, entitlements |
| OPS-001 Slice A Validated | Secret-free event bus |
| UX-012 Slice A Validated | Token foundation if any UI |
| BILL-001 boundary | Trial convert / upgrade Checkout |

**Does not depend on:** OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · COM-001 Slice C+ · FIN-003 C.

---

## 5. Acceptance criteria (Slice B) — CB-01 … CB-10

| ID | Criterion |
|----|-----------|
| **CB-01** | **Score model** — org-scoped implementation score supports the canonical milestone ladder 0%→100% from [18](./18-implementation-progress.md) (IP-01). |
| **CB-02** | **Milestone tracking** — milestones are persistable and update from setup/wizard/deferral signals without cross-org leakage. |
| **CB-03** | **Visibility** — score (and next step / blockers as designed) is available to Customer and to Support/CS/AI org context (IP-02). |
| **CB-04** | **Production Ready gate** — score cannot reach 100% without Finish Setup + recovery contact requirements (IP-03 · IP-04). |
| **CB-05** | **Trial parameters** — trial length, restricted feature/entitlement posture, and watermark policy are implemented per [24](./24-trial-experience.md) (TR-01). |
| **CB-06** | **Reminders / conversion** — documented reminder + conversion sequence has implementable hooks (in-app and/or secret-free events) (TR-02). |
| **CB-07** | **Expiry + grace + upgrade** — trial expiry, trial grace, and upgrade/convert path via BILL-001 work without creating a new organization (TR-03). |
| **CB-08** | **Activation / invitation-only** — trial orgs still originate from COM activation / AUTH provision; public self-registration remains forbidden (TR-04 · C6); COM-A Won↛org preserved. |
| **CB-09** | **OPS / secrets / regression** — progress/trial OPS payloads are secret-free; AUTH-001 A–E and COM-001 Slice A behaviors remain green (no duplicate provision paths). |
| **CB-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no COM-C / OPS-B / UX-012 B / PMX-004 Phase 2 / unauthorized workflows shipped under this authorize. |

---

## 6. Exit criteria (Validation)

Slice B exits **Validated** only when **all** are true:

1. Acceptance criteria **CB-01–CB-10** PASS.  
2. Implementation score visible to customer and CS/support/AI context as scoped.  
3. Trial convert path certified (BILL-001 compatible; no duplicate org).  
4. No unresolved **critical** defects.  
5. Documentation updated (implementation summary + validation report + board status).  
6. Governance recommendation recorded.  
7. Validation phrase recorded:

```
VALIDATE COM-001 SLICE B
```

Until Validation is recorded: COM-001 Slice C and other packages remain subject to their own authorize phrases. OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain locked regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE COM-001 SLICE B` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (CB-xx / IP-xx / TR-xx).  
3. Produce a **remediation** record limited to fixing authorized Slice B defects — no scope expansion into COM-C / OPS-B / UX-012 B / other packages.  
4. Re-run validation under phrase **`VALIDATE COM-001 SLICE B`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 8. Deferred / outside Slice B

| Item | Disposition |
|------|-------------|
| COM-001 Slice C | Eligible after Slice B Validated · **not** authorized by this document |
| OPS-001 Slice B | Eligible separately (M2.3) · **not** authorized |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| Health / discovery / comms timeline | Slice C |
| Offboarding / CS automation productization | Slice D |
| Commercial dashboard / marketplace | Slice E / post–E |

---

## 9. Recommendation

1. ✅ Phrase **`AUTHORIZE COM-001 SLICE B` issued** (this document).  
2. ✅ **Recommend begin** COM-001 Slice B **implementation** within the scope above.  
3. ❌ Do **not** authorize or begin COM-001 Slice C · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 under this phrase.  
4. After implementation: issue **`VALIDATE COM-001 SLICE B`** in a separate session.
