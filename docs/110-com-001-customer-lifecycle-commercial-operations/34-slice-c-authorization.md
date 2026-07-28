# 34 — COM-001 Slice C Authorization

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **C — Health score + feature discovery + communication timeline**  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **COMPLETE** ([35](./35-slice-c-implementation.md)) · Validation ✅ **PASS** ([36](./36-slice-c-validation.md))  
**Authorization date:** 2026-07-25  
**Binding phrase (issued):**

```
AUTHORIZE COM-001 SLICE C
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE COM-001 SLICE C
```

**Program record:** [CORE-003 §50](../113-core-003-implementation-master-plan/50-com-001-slice-c-authorization.md)  
**Prior slice:** [33 — Slice B Validation](./33-slice-b-validation.md) · ✅ **PASS**  
**Slice catalog:** [26 — Implementation slices](./26-implementation-slices.md)  
**Package approval:** [27 — Approval record](./27-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) (**Accepted**)  
**Design SoT:** [19 — Customer health score](./19-customer-health-score.md) · [20 — Feature discovery](./20-feature-discovery.md) · [23 — Customer communication timeline](./23-customer-communication-timeline.md) · [18 — Implementation progress](./18-implementation-progress.md) (health input) · [03 — Subscription architecture](./03-subscription-architecture.md) (entitlement-safe discovery) · [26](./26-implementation-slices.md) Slice C · HS-01…HS-04 · FD-01…FD-04 · CT-01…CT-04 · A03 · A04 · A09  
**AUTH foundation:** AUTH-001 A–E ✅ **COMPLETE** (org-scoped identity / entitlements reused — not redesigned)  
**COM foundation:** COM-001 Slice A ✅ **VALIDATED** · Slice B ✅ **VALIDATED** (progress score · trial · activation preserved)  
**OPS foundation:** OPS-001 Slice A ✅ **VALIDATED** — secret-free bus for health / discovery / timeline outcomes  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only  
**Billing boundary:** BILL-001 remains SaaS money rail (payment status as health input — no BILL redesign)  
**Program order:** CORE-003 **M4.2** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE COM-001 SLICE C` issued**. Implementation may begin **only** within the scope below.  
> COM-001 Slice D · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| COM-001 Approved with Amendments | [27](./27-approval-record.md) · A01–A09 | ✅ |
| ADR-027 Accepted | [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) | ✅ |
| Implementation slices finalized | [26](./26-implementation-slices.md) | ✅ |
| Slice C design SoT (A03 · A04 · A09) | [19](./19-customer-health-score.md) · [20](./20-feature-discovery.md) · [23](./23-customer-communication-timeline.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slice A Validated | [30](./30-slice-a-validation.md) · **PASS** · [CORE-003 §47](../113-core-003-implementation-master-plan/47-com-001-slice-a-validation.md) | ✅ |
| COM-001 Slice B Validated | [33](./33-slice-b-validation.md) · **PASS** · [CORE-003 §49](../113-core-003-implementation-master-plan/49-com-001-slice-b-validation.md) | ✅ |
| CORE-003 M4.2 dependency (COM-B Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| No unfinished Authorized COM slice blocking serial rule | COM-B Validated | ✅ |
| COM-001 Slice D | Not authorized | ✅ (correct) |
| OPS-001 Slice B | Not authorized | ✅ (correct — not issued by this phrase) |
| UX-012 Slice B | Not authorized | ✅ (correct) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice C?** ❌ **None.**

**Order note:** CORE-003 lists COM-001 Slice C at **M4.2** (depends on COM-B Validated). This phrase authorizes **COM-001 Slice C (M4.2)** only. OPS-001 Slice B · UX-012 Slice B · COM-001 Slice D · PMX-004 Phase 2 remain **not** authorized here.

---

## 2. Authorization scope

### In scope (Slice C)

| Deliverable | Binding source |
|-------------|----------------|
| **Customer health score** — automatic org-scoped score with Healthy → Needs Attention → At Risk → Critical bands | [19](./19-customer-health-score.md) · HS-01…HS-04 |
| **Input factors** — login frequency, feature adoption, AI usage, property/setup completion (Slice B score), payment status, support signals, outstanding onboarding, notification engagement (as available); high weight on payment + login silence | [19](./19-customer-health-score.md) · HS-02 |
| **Explainable drivers** — CS/operators see top drivers (not a black box) | [19](./19-customer-health-score.md) · HS-04 |
| **CS prioritization posture** — band → outreach cadence rules operable for CS priority | [19](./19-customer-health-score.md) · HS-03 |
| **Feature discovery** — entitlement-aware, one-primary-job prompts with dismiss/snooze memory | [20](./20-feature-discovery.md) · FD-01…FD-04 |
| **Discovery surfaces (minimum)** — in-app coach/banner (and/or equivalent org-scoped surface); CS visibility of open discoveries; AI may surface next best action when entitled | [20](./20-feature-discovery.md) |
| **Suppression rules** — cooldown after dismiss; suppress during Past Due/Suspended except billing CTAs; concurrent cap (design default: 1 primary) | [20](./20-feature-discovery.md) |
| **Customer communication timeline** — unified per-org commercial/success timeline with minimum fields; no credential secrets | [23](./23-customer-communication-timeline.md) · CT-01…CT-04 |
| **Timeline unification** — commercial/success communications emitted by M.P.A. in this slice’s scope appear on the timeline; discovery impressions/accepts/dismissals logged | [23](./23-customer-communication-timeline.md) · [20](./20-feature-discovery.md) · FD-03 |
| **Pre-org linkability** — opportunity-linked comms remain linkable through Won → org where applicable | [23](./23-customer-communication-timeline.md) · CT-04 · COM-A |
| **Secret-free OPS events** for health recalculation, discovery lifecycle, and timeline append outcomes (reuse OPS-001 Slice A bus) | OPS-001 Slice A |
| **Ops-minimum / staff surfaces** sufficient to show health band/drivers, open discoveries, and timeline — not Slice E commercial dashboard productization | [26](./26-implementation-slices.md) |

### Implementation boundaries

1. Work is limited to **health score + feature discovery + communication timeline** — not offboarding, CS 30/90 automation productization, or staff commercial dashboard.  
2. **Preserve COM-001 Slice A** — Won↛org, activation handoff, org↔opportunity link unchanged in semantics.  
3. **Preserve COM-001 Slice B** — implementation score / trial / BILL convert paths remain authoritative inputs and behaviors; do not replace the progress model.  
4. **Reuse AUTH-001** org scoping / entitlements — do not invent a parallel identity stack.  
5. **BILL-001** remains the money rail; payment status is a **health input** only — no Stripe Billing redesign.  
6. Exact numeric health thresholds may be set at Implement with Product sign-off ([19](./19-customer-health-score.md)); bands Healthy→Critical remain binding.  
7. Feature discovery must remain **entitlement-aware** (C4) — never pitch unpurchased features as available.  
8. Timeline storage must **never** persist temporary passwords or other credential secrets (CT-03 · AUTH-001).  
9. Any **UI** must consume UX-012 Slice A tokens (`--mpa-*`) — no UX-012 Slice B chrome / Command Center productization.  
10. OPS events are **secret-free** (ids / bands / scores / discovery keys / delivery status codes only).  
11. Reminder/email **delivery productization** via OPS-001 Slice B notify/automation remains **out of scope** — Slice C may append timeline entries and emit secret-free events / hooks compatible with existing rails.  
12. Material scope beyond Slice C requires a new authorize phrase (COM-D+ / other packages).

### Includes (explicit)

- Persistable org-scoped health score + band + explainable drivers; recalculation on schedule and/or material events  
- CS-priority use of bands (Healthy→Critical) with documented cadence posture  
- Entitlement-safe feature discovery catalog (minimum set from [20](./20-feature-discovery.md) trigger examples implementable) with dismiss/snooze + cooldown  
- Unified customer communication timeline persistence and staff-readable surface (ops minimum)  
- Logging of discovery impressions / accepts / dismissals onto the timeline  
- Coupling: Slice B implementation score feeds health; discovery adoption gaps may feed health; outreach/discoveries appear on timeline  
- Secret-free OPS domain events for health / discovery / timeline transitions on OPS Slice A bus  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| COM-001 Slice D (offboarding · CS motions automation productization) | Separate authorize |
| COM-001 Slice E (staff commercial dashboard · marketplace prep) | Separate authorize |
| OPS-001 Slice B (notify / automation productization) | Separate authorize |
| UX-012 Slice B (role chrome / Command Center productization) | Separate authorize |
| PMX-004 Phase 2 | `AUTHORIZE PMX-004 PHASE 2` |
| Full offboarding export/freeze/archive path ([21](./21-customer-offboarding.md)) | Slice D |
| Certified partner marketplace UI | Post–E / separate |
| New BILL-001 / Stripe Checkout redesign | BILL-001 gates |
| AUTH-001 new identity/recovery productization | AUTH A–E already Validated — reuse only |
| Public signup / open registration | Forbidden permanently under C6 |
| Redesign of Slice A pipeline / activation or Slice B progress/trial models | Preserve; consume as inputs |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| COM-001 Approved with Amendments · ADR-027 | Commercial SoT |
| COM-001 Slice A Validated | Activation / org link / commercial foundation |
| COM-001 Slice B Validated | Implementation score + trial (health inputs; progress coupling) |
| CORE-003 M0 = GO · M4.2 order | Program unlock / sequence slot |
| AUTH-001 A–E COMPLETE | Org scoping, entitlements |
| OPS-001 Slice A Validated | Secret-free event bus |
| UX-012 Slice A Validated | Token foundation if any UI |
| BILL-001 boundary | Payment status as health input; no money-rail redesign |

**Does not depend on:** OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · COM-001 Slice D+ · FIN-003 C.

---

## 5. Acceptance criteria (Slice C) — CC-01 … CC-10

| ID | Criterion |
|----|-----------|
| **CC-01** | **Health bands** — automatic org-scoped health score maps to Healthy → Needs Attention → At Risk → Critical (HS-01). |
| **CC-02** | **Health factors** — scoring incorporates the designed factor set from [19](./19-customer-health-score.md) as available (login, adoption, AI, setup/progress, payment, support, onboarding, notifications), with payment status and login silence treated as high-weight (HS-02). |
| **CC-03** | **CS prioritization** — band → CS posture/cadence rules are defined and operable for operator priority (HS-03). |
| **CC-04** | **Explainable drivers** — operators can see top drivers for the current score/band (HS-04). |
| **CC-05** | **Entitlement-safe discovery** — continuous-adoption prompts are defined and never pitch unpurchased features as available (FD-01 · FD-02 · C4). |
| **CC-06** | **Dismiss / snooze + logging** — discoveries support dismiss/snooze with memory/cooldown; impressions/accepts/dismissals are logged on the communication timeline (FD-03). |
| **CC-07** | **Unified timeline** — per-org (and pre-org opportunity-linkable) commercial/success timeline exists with required minimum fields (CT-01 · CT-04). |
| **CC-08** | **Timeline coverage + secrets** — entry types cover the commercial/success set in scope (welcome, implementation, invoice/billing notices as available, renewal/past-due hooks as available, feature/discovery, support/CS notes as available); no credential secrets stored (CT-02 · CT-03). |
| **CC-09** | **OPS / secrets / regression** — health/discovery/timeline OPS payloads are secret-free; AUTH-001 A–E and COM-001 Slices A–B behaviors remain green (Won↛org, progress/trial convert preserved). |
| **CC-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no COM-D / OPS-B / UX-012 B / PMX-004 Phase 2 / unauthorized workflows shipped under this authorize. |

---

## 6. Exit criteria (Validation)

Slice C exits **Validated** only when **all** are true:

1. Acceptance criteria **CC-01–CC-10** PASS.  
2. Health bands drive CS priority posture as scoped.  
3. Feature discoveries are entitlement-safe; dismiss/snooze + timeline logging work.  
4. Commercial/success communications in scope are logged on the unified timeline without credential secrets.  
5. No unresolved **critical** defects.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE COM-001 SLICE C
```

Until Validation is recorded: COM-001 Slice D and other packages remain subject to their own authorize phrases. OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain locked regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE COM-001 SLICE C` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (CC-xx / HS-xx / FD-xx / CT-xx).  
3. Produce a **remediation** record limited to fixing authorized Slice C defects — no scope expansion into COM-D / OPS-B / UX-012 B / other packages.  
4. Re-run validation under phrase **`VALIDATE COM-001 SLICE C`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 8. Deferred / outside Slice C

| Item | Disposition |
|------|-------------|
| COM-001 Slice D | Eligible after Slice C Validated · **not** authorized by this document |
| OPS-001 Slice B | Eligible separately (M2.3) · **not** authorized |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| Offboarding / CS automation productization | Slice D |
| Commercial dashboard / marketplace | Slice E / post–E |
| OPS notify/automation productization | OPS-001 Slice B |

---

## 9. Recommendation

1. ✅ Phrase **`AUTHORIZE COM-001 SLICE C` issued** (this document).  
2. ✅ **Recommend begin** COM-001 Slice C **implementation** within the scope above.  
3. ❌ Do **not** authorize or begin COM-001 Slice D · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 under this phrase.  
4. After implementation: issue **`VALIDATE COM-001 SLICE C`** in a separate session.
