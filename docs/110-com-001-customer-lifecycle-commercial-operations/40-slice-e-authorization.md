# 40 — COM-001 Slice E Authorization

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **E — Commercial dashboard (+ marketplace prep)**  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **IMPLEMENTED** ([41](./41-slice-e-implementation.md)) · Validation ✅ **PASS** ([42](./42-slice-e-validation.md))  
**Authorization date:** 2026-07-25  
**Binding phrase (issued):**

```
AUTHORIZE COM-001 SLICE E
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE COM-001 SLICE E
```

**Program record:** [CORE-003 §54](../113-core-003-implementation-master-plan/54-com-001-slice-e-authorization.md)  
**Prior slice:** [39 — Slice D Validation](./39-slice-d-validation.md) · ✅ **PASS**  
**Slice catalog:** [26 — Implementation slices](./26-implementation-slices.md)  
**Package approval:** [27 — Approval record](./27-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) (**Accepted**)  
**Design SoT:** [22 — Commercial dashboard](./22-commercial-dashboard.md) (A08) · [25 — Implementation marketplace](./25-implementation-marketplace.md) (A07 — data-model prep only) · [17 — Sales pipeline](./17-sales-pipeline.md) · [18 — Implementation progress](./18-implementation-progress.md) · [19 — Customer health](./19-customer-health-score.md) · [24 — Trial experience](./24-trial-experience.md) · [07 — Renewals](./07-renewal-workflows.md) · [21 — Offboarding](./21-customer-offboarding.md) (dashboard widgets consume Slice D state) · [26](./26-implementation-slices.md) Slice E · CD-01…CD-04 (A08 design) · IM-01…IM-04 (A07 prep)  
**AUTH foundation:** AUTH-001 A–E ✅ **COMPLETE** (staff capability / org isolation reused — not redesigned)  
**COM foundation:** COM-001 Slices A–D ✅ **VALIDATED** (pipeline · progress/trial · health/discovery/timeline · offboarding/CS/renewals preserved and aggregated)  
**OPS foundation:** OPS-001 Slice A ✅ **VALIDATED** — secret-free bus for dashboard/marketplace prep outcomes as needed  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only  
**ADMIN alignment:** ADMIN-003 ✅ **Approved** — compose commercial widgets into Master Admin / HQ control-plane patterns (not a full ADMIN-003 redesign)  
**Billing boundary:** BILL-001 remains SaaS money rail for revenue / past-due / renewal period metrics (no BILL redesign)  
**Program order:** CORE-003 **M6.1** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE COM-001 SLICE E` issued**. Implementation may begin **only** within the scope below.  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| COM-001 Approved with Amendments | [27](./27-approval-record.md) · A01–A09 | ✅ |
| ADR-027 Accepted | [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) | ✅ |
| Implementation slices finalized | [26](./26-implementation-slices.md) | ✅ |
| Slice E design SoT (A08 dashboard · A07 marketplace prep) | [22](./22-commercial-dashboard.md) · [25](./25-implementation-marketplace.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slice A Validated | [30](./30-slice-a-validation.md) · **PASS** · [CORE-003 §47](../113-core-003-implementation-master-plan/47-com-001-slice-a-validation.md) | ✅ |
| COM-001 Slice B Validated | [33](./33-slice-b-validation.md) · **PASS** · [CORE-003 §49](../113-core-003-implementation-master-plan/49-com-001-slice-b-validation.md) | ✅ |
| COM-001 Slice C Validated | [36](./36-slice-c-validation.md) · **PASS** · [CORE-003 §51](../113-core-003-implementation-master-plan/51-com-001-slice-c-validation.md) | ✅ |
| COM-001 Slice D Validated | [39](./39-slice-d-validation.md) · **PASS** · [CORE-003 §53](../113-core-003-implementation-master-plan/53-com-001-slice-d-validation.md) | ✅ |
| ADMIN-003 alignment available | [ADMIN-003](../95-admin-003-master-admin-operations-center/README.md) · **Approved** · Master Admin HQ patterns exist | ✅ |
| CORE-003 M6.1 dependency (COM-D Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| No unfinished Authorized COM slice blocking serial rule | COM-D Validated | ✅ |
| OPS-001 Slice B | Not authorized | ✅ (correct — not issued by this phrase) |
| UX-012 Slice B | Not authorized | ✅ (correct) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Deferred post–E | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice E?** ❌ **None.**

**Order note:** CORE-003 lists COM-001 Slice E at **M6.1** (depends on COM-D Validated; ADMIN-003 alignment). This phrase authorizes **COM-001 Slice E (M6.1)** only. OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · partner marketplace UI remain **not** authorized here.

---

## 2. Authorization scope

### In scope (Slice E)

| Deliverable | Binding source |
|-------------|----------------|
| **Staff commercial dashboard (control plane)** — internal M.P.A. operations surface for commercial health; **not** a customer product | [22](./22-commercial-dashboard.md) · A08 · CD-01…CD-04 |
| **Staff-only access** — Master Admin full; CS / Support / Finance / Sales views as entitled; **no** customer / Org Admin access path | [22](./22-commercial-dashboard.md) |
| **Primary widget catalog productization** (minimum operable set from design) — New Customers · Trials · Active Organizations · Implementation Queue · AI Setup Progress · Support Tickets (as available) · Past Due Accounts · Customer Health · Revenue (BILL metrics) · Renewals | [22](./22-commercial-dashboard.md) |
| **Secondary widgets as available** — Sales pipeline funnel · Offboarding / cancels in-flight · Feature discovery CTR · Partner implementation load (stub/empty until marketplace live) | [22](./22-commercial-dashboard.md) |
| **Real aggregates** — widgets populated from COM-001 Slices A–D + BILL-001 metrics (and linked support system **as available**); no fake demo-only SoT for PASS | [26](./26-implementation-slices.md) · [22](./22-commercial-dashboard.md) |
| **ADMIN-003 alignment** — compose into Master Admin / HQ control-plane patterns; do not replace ADMIN-003 or invent a parallel staff shell | [22](./22-commercial-dashboard.md) · ADMIN-003 |
| **Marketplace data-model prep (stubs)** — persistable `ImplementationEngagement`-shaped model (or equivalent) supporting `ai_guided` \| `professional`, `mpa_internal` \| `certified_partner`, status lifecycle, progress link, nullable `partner_id` — ready for future partner program without redesign | [25](./25-implementation-marketplace.md) · IM-01…IM-04 |
| **Marketplace MVP posture** — partner picker / certified-partner directory UI may remain hidden; M.P.A. internal Professional path remains valid | [25](./25-implementation-marketplace.md) |
| **Secret-free OPS events** for dashboard material opens / marketplace engagement transitions as designed (reuse OPS-001 Slice A bus) | OPS-001 Slice A |
| **UX-012 Slice A tokens** for any UI (`--mpa-*`) | UX-012 Slice A |

### Implementation boundaries

1. Work is limited to **staff commercial dashboard + marketplace data-model prep** — not partner certification program UI, not OPS notify productization, not UX-012 Command Center chrome.  
2. **Preserve COM-001 Slices A–D** — pipeline, progress/trial, health/discovery/timeline, offboarding/CS/renewals semantics unchanged; dashboard **consumes** them.  
3. **Never mix planes** — customers must not access cross-org commercial aggregates.  
4. **BILL-001** remains the money rail for MRR/ARR / past-due / period-end renewal inputs — no Stripe Billing redesign.  
5. Support-ticket widgets use linked systems **as available**; do not invent a new ticketing product under COM-E.  
6. Marketplace Slice E delivers **architecture-ready stubs / engagement model**, not the full certified-partner marketplace UI (explicitly deferred).  
7. Time-boxed partner access grants remain AUTH-001 Professional semantics when partners are later enabled — Slice E must not invent a parallel identity stack.  
8. Any **UI** must consume UX-012 Slice A tokens (`--mpa-*`) — no UX-012 Slice B chrome / Command Center productization.  
9. OPS events are **secret-free** (ids / counts / band / stage / engagement status codes only — no Stripe secrets or credentials).  
10. Email/SMS **delivery productization** via OPS-001 Slice B remains **out of scope**.  
11. Material scope beyond Slice E requires a new authorize phrase (partner marketplace UI / other packages).

### Includes (explicit)

- Staff-only commercial dashboard surface (Master Admin HQ composition) with operable primary widgets from [22]  
- Aggregation services / APIs that read org-scoped COM + BILL data into staff-safe cross-org summaries  
- Access checks preventing customer/org roles from reading dashboard aggregates  
- Marketplace engagement data model (tables/types/services stubs) matching [25] architecture slots  
- Optional secondary widgets when data exists; empty/unavailable states allowed where systems are not linked  
- Secret-free OPS domain events for material commercial-dashboard / engagement outcomes on OPS Slice A bus  
- Implementation summary + validation evidence under CE-01…CE-10  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| OPS-001 Slice B (notify / automation productization) | Separate authorize |
| UX-012 Slice B (role chrome / Command Center productization) | Separate authorize |
| PMX-004 Phase 2 | `AUTHORIZE PMX-004 PHASE 2` |
| Certified partner marketplace UI / partner picker / rating network | Post–E · separate Authorize |
| Partner certification program operations (certify/suspend partners at scale) | Post–E / separate |
| Full ADMIN-003 redesign / replacement | ADMIN-003 package |
| New BILL-001 / Stripe Checkout redesign | BILL-001 gates |
| AUTH-001 new identity/recovery productization | AUTH A–E already Validated — reuse only |
| Public signup / open registration | Forbidden permanently under C6 |
| Customer-facing analytics product | Forbidden (plane separation) |
| Redesign of Slices A–D models | Preserve; aggregate as inputs |
| Full multi-channel notify delivery productization | OPS-001 Slice B |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| COM-001 Approved with Amendments · ADR-027 | Commercial SoT |
| COM-001 Slices A–D Validated | Pipeline · progress/trial · health/discovery/timeline · offboarding/CS/renewals as widget inputs |
| CORE-003 M0 = GO · M6.1 order | Program unlock / sequence slot |
| AUTH-001 A–E COMPLETE | Staff capability · org isolation · Professional grant semantics for future partners |
| OPS-001 Slice A Validated | Secret-free event bus |
| UX-012 Slice A Validated | Token foundation for UI |
| ADMIN-003 Approved (alignment) | HQ / Master Admin composition patterns |
| BILL-001 boundary | Revenue / past-due / period metrics |

**Does not depend on:** OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · certified partner marketplace UI · FIN-003 C.

---

## 5. Acceptance criteria (Slice E) — CE-01 … CE-10

| ID | Criterion |
|----|-----------|
| **CE-01** | **Staff-only commercial dashboard** — an operable internal commercial dashboard exists in the M.P.A. control plane; customers / Org Admins have **no** access path (A08 · CD-01 · CD-03). |
| **CE-02** | **Primary widget coverage** — dashboard exposes operable widgets covering at minimum: New Customers · Trials · Active Organizations · Implementation Queue · Past Due · Customer Health · Revenue · Renewals (AI Setup / Support as available) (A08 · CD-02). |
| **CE-03** | **Real aggregates** — primary widgets are populated from real COM-001 A–D / BILL-001 (and linked support **as available**) aggregates — not placeholder-only SoT for validation PASS. |
| **CE-04** | **Plane separation & entitlements** — Master Admin / entitled staff roles can access; customer roles cannot; sensitive lists respect staff entitlement boundaries (no raw Stripe secrets). |
| **CE-05** | **ADMIN-003 alignment** — dashboard composes into Master Admin / HQ patterns; does not invent a parallel staff shell or replace ADMIN-003. |
| **CE-06** | **Marketplace data-model prep** — ImplementationEngagement-shaped (or equivalent) model supports professional/ai paths, `mpa_internal` \| `certified_partner`, status lifecycle, org link, nullable partner — MVP may hide partner UI (A07 · IM-01 · IM-04). |
| **CE-07** | **AUTH / Finish Setup invariants preserved** — Org Admin Finish Setup remains mandatory for Professional path; partner cannot become standing Org Admin by default; time-boxed grant semantics reserved (IM-02 · IM-03). |
| **CE-08** | **COM A–D + BILL reuse** — dashboard/marketplace prep consume Slices A–D and BILL-001 without redesigning activation, progress/trial, health/discovery/timeline, or offboarding/CS/renewal models. |
| **CE-09** | **OPS / UX / regression** — any OPS payloads are secret-free; UI uses UX-012 `--mpa-*` tokens only; AUTH-001 A–E and COM-001 A–D behaviors remain green. |
| **CE-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no OPS-B / UX-012 B / PMX-004 Phase 2 / certified partner marketplace UI / unauthorized workflows shipped under this authorize. |

---

## 6. Exit criteria (Validation)

Slice E exits **Validated** only when **all** are true:

1. Acceptance criteria **CE-01–CE-10** PASS.  
2. Staff-only commercial dashboard certified; no customer access path.  
3. Primary widgets populated from real aggregates as scoped.  
4. Marketplace data-model prep operable (stubs / engagement model) without shipping full partner marketplace UI.  
5. No unresolved **critical** defects.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE COM-001 SLICE E
```

Until Validation is recorded: OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · certified partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE COM-001 SLICE E` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (CE-xx / A08 CD-xx / A07 IM-xx).  
3. Produce a **remediation** record limited to fixing authorized Slice E defects — no scope expansion into OPS-B / UX-012 B / partner marketplace UI / other packages.  
4. Re-run validation under phrase **`VALIDATE COM-001 SLICE E`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 8. Deferred / outside Slice E

| Item | Disposition |
|------|-------------|
| OPS-001 Slice B | Eligible separately (M2.3) · **not** authorized |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| Certified partner marketplace UI / partner picker | Post–E · separate Authorize |
| Partner certification program at scale | Later Approve / separate |
| OPS notify/automation productization | OPS-001 Slice B |
| UX-012 Command Center productization | UX-012 Slice B |

---

## 9. Recommendation

1. ✅ Phrase **`AUTHORIZE COM-001 SLICE E` issued** (this document).  
2. ✅ **Recommend begin** COM-001 Slice E **implementation** within the scope above.  
3. ❌ Do **not** authorize OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · partner marketplace UI under this phrase.  
4. After implementation: issue **`VALIDATE COM-001 SLICE E`** in a separate session.  
5. **Stop** after authorization — no implementation in this governance session.
