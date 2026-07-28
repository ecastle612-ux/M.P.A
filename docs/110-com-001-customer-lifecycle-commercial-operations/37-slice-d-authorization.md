# 37 — COM-001 Slice D Authorization

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **D — Offboarding + success automation**  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **IMPLEMENTED** ([38](./38-slice-d-implementation.md)) · Validation ✅ **PASS** ([39](./39-slice-d-validation.md))  
**Authorization date:** 2026-07-25  
**Binding phrase (issued):**

```
AUTHORIZE COM-001 SLICE D
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE COM-001 SLICE D
```

**Program record:** [CORE-003 §52](../113-core-003-implementation-master-plan/52-com-001-slice-d-authorization.md)  
**Prior slice:** [36 — Slice C Validation](./36-slice-c-validation.md) · ✅ **PASS**  
**Slice catalog:** [26 — Implementation slices](./26-implementation-slices.md)  
**Package approval:** [27 — Approval record](./27-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) (**Accepted**)  
**Design SoT:** [21 — Customer offboarding](./21-customer-offboarding.md) · [08 — Cancellation workflows](./08-cancellation-workflows.md) · [06 — Customer success model](./06-customer-success-model.md) · [07 — Renewal workflows](./07-renewal-workflows.md) · [09 — Reactivation](./09-reactivation-workflows.md) (recovery-window / win-back portion only) · [23 — Communication timeline](./23-customer-communication-timeline.md) · [04 — Billing state machine](./04-billing-state-machine.md) · [15](./15-open-questions.md) Q4/Q5 defaults · [26](./26-implementation-slices.md) Slice D · OB-01…OB-04 · CS-01…CS-04 · A06  
**AUTH foundation:** AUTH-001 A–E ✅ **COMPLETE** (Cancelled / export-window / membership disable semantics reused — not redesigned)  
**COM foundation:** COM-001 Slices A–C ✅ **VALIDATED** (activation · progress/trial · health/discovery/timeline preserved)  
**OPS foundation:** OPS-001 Slice A ✅ **VALIDATED** — secret-free bus for offboarding / CS-motion / renewal-alert outcomes  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only  
**Billing boundary:** BILL-001 remains SaaS money rail (cancel / stop future charges / final invoice — no BILL redesign)  
**Program order:** CORE-003 **M5.2** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE COM-001 SLICE D` issued**. Implementation may begin **only** within the scope below.  
> COM-001 Slice E · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| COM-001 Approved with Amendments | [27](./27-approval-record.md) · A01–A09 | ✅ |
| ADR-027 Accepted | [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) | ✅ |
| Implementation slices finalized | [26](./26-implementation-slices.md) | ✅ |
| Slice D design SoT (A06 · CS motions · renewals) | [21](./21-customer-offboarding.md) · [08](./08-cancellation-workflows.md) · [06](./06-customer-success-model.md) · [07](./07-renewal-workflows.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slice A Validated | [30](./30-slice-a-validation.md) · **PASS** · [CORE-003 §47](../113-core-003-implementation-master-plan/47-com-001-slice-a-validation.md) | ✅ |
| COM-001 Slice B Validated | [33](./33-slice-b-validation.md) · **PASS** · [CORE-003 §49](../113-core-003-implementation-master-plan/49-com-001-slice-b-validation.md) | ✅ |
| COM-001 Slice C Validated | [36](./36-slice-c-validation.md) · **PASS** · [CORE-003 §51](../113-core-003-implementation-master-plan/51-com-001-slice-c-validation.md) | ✅ |
| CORE-003 M5.2 dependency (COM-C Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| No unfinished Authorized COM slice blocking serial rule | COM-C Validated | ✅ |
| COM-001 Slice E | Not authorized | ✅ (correct) |
| OPS-001 Slice B | Not authorized | ✅ (correct — not issued by this phrase) |
| UX-012 Slice B | Not authorized | ✅ (correct) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice D?** ❌ **None.**

**Order note:** CORE-003 lists COM-001 Slice D at **M5.2** (depends on COM-C Validated). This phrase authorizes **COM-001 Slice D (M5.2)** only. OPS-001 Slice B · UX-012 Slice B · COM-001 Slice E · PMX-004 Phase 2 remain **not** authorized here.

---

## 2. Authorization scope

### In scope (Slice D)

| Deliverable | Binding source |
|-------------|----------------|
| **Offboarding sequence productization** — controlled Cancellation → Retention offers (hooks) → Final billing → Export → Final reports → Freeze → Archive → Deletion schedule → Recovery window | [21](./21-customer-offboarding.md) · OB-01…OB-04 · [08](./08-cancellation-workflows.md) |
| **No surprise purge** — cancel does **not** immediately hard-delete customer data | [21](./21-customer-offboarding.md) · OB-04 |
| **Export path** — org-scoped export package / inventory for properties, units, tenants, leases, documents inventory, financial summaries, user list; default export window **30 days** ([15] Q4) | [21](./21-customer-offboarding.md) |
| **Final billing coordination** — stop future SaaS charges at effective date via BILL-001; finalize open invoices posture (refunds remain Finance policy annotations) | [21](./21-customer-offboarding.md) · [08](./08-cancellation-workflows.md) · BILL-001 |
| **Account freeze** — mutations blocked; login blocked or export-only; maps to AUTH Cancelled + export window semantics (reuse AUTH-001) | [21](./21-customer-offboarding.md) · AUTH-001 |
| **Archive + deletion schedule + recovery window** — commercial Archived after retention clock (default **180 days** per [15] Q5); recovery/win-back same-org while pre-Archive; legal hold pauses deletion | [21](./21-customer-offboarding.md) · [09](./09-reactivation-workflows.md) win-back portion |
| **Offboarding communications on timeline** — cancel confirm, export ready, freeze warning, archive notice (secret-free) | [21](./21-customer-offboarding.md) · [23](./23-customer-communication-timeline.md) |
| **CS motions automation — 30-day check-in** — schedule/due/complete (or equivalent) after Active Customer | [06](./06-customer-success-model.md) · CS-01 |
| **CS motions automation — 90-day review** — schedule/due/complete (or equivalent) after Active | [06](./06-customer-success-model.md) · CS-01 |
| **Renewal alerts automation** — secret-free due hooks for renewal milestones (minimum: T-90, T-30, T-7; T-60/T-14 as available) | [07](./07-renewal-workflows.md) · [06](./06-customer-success-model.md) |
| **Health-aware prioritization reuse** — CS motion / renewal alert priority may consume Slice C health band (do not redesign health model) | [19](./19-customer-health-score.md) · Slice C |
| **Secret-free OPS events** for offboarding stage changes, export/freeze/archive outcomes, CS motion due/complete, renewal alert due (reuse OPS-001 Slice A bus) | OPS-001 Slice A |
| **Ops-minimum / customer-facing surfaces** sufficient to run cancel/export/freeze status and show CS motion / renewal due state — not Slice E commercial dashboard | [26](./26-implementation-slices.md) |

### Implementation boundaries

1. Work is limited to **offboarding + CS success automation (30/90 + renewal alerts)** — not staff commercial dashboard or marketplace prep.  
2. **Preserve COM-001 Slices A–C** — Won↛org, progress/trial convert, health/discovery/timeline semantics unchanged.  
3. **Reuse AUTH-001** Cancelled / membership disable / export-window posture — do not invent a parallel identity stack.  
4. **BILL-001** remains the money rail for subscription cancel / stop future charges / final invoices — no Stripe Billing redesign.  
5. Retention offers are **CS playbook hooks / recorded offer state**, not a new Finance pricing engine.  
6. Defaults at Implement: export window **30 days**; archive retention **180 days** unless Product records an approved alternate consistent with [15](./15-open-questions.md).  
7. Hard-deletion / anonymize jobs may be **scheduled and gated** (with legal hold); Slice D must prove **no surprise immediate purge on cancel**. Full multi-class purge completeness may finish asynchronously but must not violate OB-04.  
8. Full reactivation productization for all [09](./09-reactivation-workflows.md) types is **out of scope** except **recovery-window / win-back same-org restore path** tied to offboarding retention.  
9. Any **UI** must consume UX-012 Slice A tokens (`--mpa-*`) — no UX-012 Slice B chrome / Command Center productization.  
10. OPS events are **secret-free** (ids / stage / due keys / export status codes only).  
11. Email/SMS **delivery productization** via OPS-001 Slice B remains **out of scope** — Slice D may append timeline entries and emit secret-free events / schedule hooks compatible with existing rails.  
12. Material scope beyond Slice D requires a new authorize phrase (COM-E / other packages).

### Includes (explicit)

- Persistable org-scoped offboarding state machine covering the [21](./21-customer-offboarding.md) sequence (at minimum: cancel confirmed → export window → freeze → archive scheduled/complete; retention-offer and final-billing stages as operable states/hooks)  
- Export initiation + readiness signal (package or inventory + time-bounded access) before freeze completes  
- Freeze that blocks operational mutations; export-only or blocked login per AUTH Cancelled semantics  
- Deletion schedule + recovery window fields; legal-hold flag that pauses deletion  
- Timeline entries for key offboarding notices  
- Automated 30-day and 90-day CS motion due hooks (schedule from Active / Finish Setup handoff as designed)  
- Automated renewal alert due hooks (T-90 / T-30 / T-7 minimum)  
- Secret-free OPS domain events for offboarding / CS motion / renewal-alert transitions on OPS Slice A bus  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| COM-001 Slice E (staff commercial dashboard · marketplace prep) | Separate authorize |
| OPS-001 Slice B (notify / automation productization) | Separate authorize |
| UX-012 Slice B (role chrome / Command Center productization) | Separate authorize |
| PMX-004 Phase 2 | `AUTHORIZE PMX-004 PHASE 2` |
| Full commercial dashboard widgets ([22](./22-commercial-dashboard.md)) | Slice E |
| Certified partner marketplace UI | Post–E / separate |
| New BILL-001 / Stripe Checkout redesign | BILL-001 gates |
| AUTH-001 new identity/recovery productization | AUTH A–E already Validated — reuse only |
| Full reactivation matrix for all [09] types beyond recovery-window win-back | Separate / later as needed |
| Public signup / open registration | Forbidden permanently under C6 |
| Redesign of Slices A–C models | Preserve; consume as inputs |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| COM-001 Approved with Amendments · ADR-027 | Commercial SoT |
| COM-001 Slices A–C Validated | Activation · progress/trial · health/discovery/timeline |
| CORE-003 M0 = GO · M5.2 order | Program unlock / sequence slot |
| AUTH-001 A–E COMPLETE | Cancelled / export-window / membership semantics |
| OPS-001 Slice A Validated | Secret-free event bus |
| UX-012 Slice A Validated | Token foundation if any UI |
| BILL-001 boundary | Cancel / stop charges / final invoice rail |

**Does not depend on:** OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · COM-001 Slice E · FIN-003 C.

---

## 5. Acceptance criteria (Slice D) — CD-01 … CD-10

| ID | Criterion |
|----|-----------|
| **CD-01** | **Offboarding sequence** — org-scoped persistable stages cover the controlled Cancellation → … → Archive path from [21](./21-customer-offboarding.md) (OB-01). |
| **CD-02** | **Export before freeze** — export path exists with default **30-day** window; freeze does not complete without export opportunity / readiness posture (OB-02). |
| **CD-03** | **Final billing coordination** — BILL-001 cancel / stop-future-charges at effective date is wired; no Slice D invents a parallel money rail (OB-02 · [08](./08-cancellation-workflows.md)). |
| **CD-04** | **Account freeze** — operational mutations blocked; login blocked or export-only using AUTH Cancelled / export-window semantics (OB-02). |
| **CD-05** | **Archive · deletion schedule · recovery · no surprise purge** — archive/retention clock (default **180 days**), deletion schedule, recovery window, and legal-hold pause are explicit; cancel does **not** immediately purge data (OB-03 · OB-04). |
| **CD-06** | **Timeline logging** — cancel confirm, export ready, freeze warning, and archive notice (as applicable) appear on the Slice C communication timeline without credential secrets. |
| **CD-07** | **30/90 CS motions** — automated schedule/due/complete (or equivalent) hooks for 30-day check-in and 90-day review after Active (CS-01 · [06](./06-customer-success-model.md)). |
| **CD-08** | **Renewal alerts** — secret-free due hooks for renewal milestones (minimum T-90, T-30, T-7) aligned to [07](./07-renewal-workflows.md). |
| **CD-09** | **OPS / secrets / regression** — offboarding/CS/renewal OPS payloads are secret-free; AUTH-001 A–E and COM-001 Slices A–C behaviors remain green (Won↛org, progress/trial convert, health/discovery/timeline preserved). |
| **CD-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no COM-E / OPS-B / UX-012 B / PMX-004 Phase 2 / unauthorized workflows shipped under this authorize. |

---

## 6. Exit criteria (Validation)

Slice D exits **Validated** only when **all** are true:

1. Acceptance criteria **CD-01–CD-10** PASS.  
2. Export / freeze / archive path certified; **no surprise purge** on cancel.  
3. 30/90 CS motions and renewal alert hooks operable as scoped.  
4. Offboarding notices logged on communication timeline without credential secrets.  
5. No unresolved **critical** defects.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE COM-001 SLICE D
```

Until Validation is recorded: COM-001 Slice E and other packages remain subject to their own authorize phrases. OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain locked regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE COM-001 SLICE D` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (CD-xx / OB-xx / CS-xx).  
3. Produce a **remediation** record limited to fixing authorized Slice D defects — no scope expansion into COM-E / OPS-B / UX-012 B / other packages.  
4. Re-run validation under phrase **`VALIDATE COM-001 SLICE D`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 8. Deferred / outside Slice D

| Item | Disposition |
|------|-------------|
| COM-001 Slice E | Eligible after Slice D Validated · **not** authorized by this document |
| OPS-001 Slice B | Eligible separately (M2.3) · **not** authorized |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| Staff commercial dashboard / marketplace | Slice E / post–E |
| OPS notify/automation productization | OPS-001 Slice B |
| Full [09] reactivation matrix beyond recovery-window win-back | Later / separate as needed |

---

## 9. Recommendation

1. ✅ Phrase **`AUTHORIZE COM-001 SLICE D` issued** (this document).  
2. ✅ **Recommend begin** COM-001 Slice D **implementation** within the scope above.  
3. ❌ Do **not** authorize or begin COM-001 Slice E · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 under this phrase.  
4. After implementation: issue **`VALIDATE COM-001 SLICE D`** in a separate session.
