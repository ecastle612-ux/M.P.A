# 09 — Approval Checklist

**Package:** PAY-001 — Settlement Funding Foundation  
**Status:** ✅ **Approved** (2026-07-23 · Product Owner) · ✅ **Verified** ([32](./32-package-certification.md))  
**Gate:** Design → Document → **Approve** → Implement → **Verify**  
**Architecture amendments:** [11](./11-architecture-amendments.md) (R1–R12 addressed)  
**Architecture review:** [10](./10-architecture-review.md) (**CONDITIONAL GO** → amendments applied)  
**Approval readiness:** [12](./12-approval-readiness.md)

> **Governance package APPROVED** by Product Owner (2026-07-23).  
> **Slice 1 PASS** ([18](./18-slice-1-final-certification.md)).  
> **Slice 2 PASS** ([26](./26-slice-2-final-certification.md)).  
> **Slice 3 COMPLETE** ([27](./27-slice-3-verification.md) · [28](./28-slice-3-completion.md)).  
> **Package: ✅ VERIFIED** ([32](./32-package-certification.md)).  
> **FIN-003 Phase C remains LOCKED** (eligible to authorize separately). **Blocker 4 remains OPEN.**

---

## Preconditions

| Check | Status |
|-------|--------|
| ADR-023 Accepted | ✅ |
| ADR-024 Accepted | ✅ |
| API-005 resident payments exist | ✅ |
| FIN-003 org settlement **mechanism** exists (accounts created via FIN-003 Phase A/B path) | ✅ Mechanism — **each org still gated at runtime** |
| FIN-003 §33 recommends dedicated package | ✅ |
| Document package complete (00–12) | ✅ Amended Draft + [12 Approval readiness](./12-approval-readiness.md) |
| Design Review / Approval Readiness | ✅ **GO for Approval** ([12](./12-approval-readiness.md)) |
| Open questions resolved or deferred with defaults | ✅ Design defaults in [08](./08-open-questions.md); Q4 / Q3b recorded as Approve follow-up notes below |

---

## Approve scope (what Approve means)

Approving PAY-001 accepts:

1. **Locked** destination charge model (platform PI/Checkout + `transfer_data.destination` + `application_fee_amount`) → org settlement.  
2. Explicit exclusion of owner payouts / transfers / allocation from this package.  
3. Binding kill-switch / legacy coexistence rules ([03](./03-payment-routing.md)).  
4. Roadmap: **PAY-001 → FIN-003 C → D → E → Blocker 4 CLOSE**.  
5. **FIN-003 Phase C SHALL NOT be authorized until PAY-001 is Verified.**  
6. Implementation still requires post-Approve slice authorize + kickoff (no code from Approve alone).

Approving PAY-001 does **not**:

- Authorize FIN-003 Phase C  
- Authorize Connect transfers  
- Close Blocker 4  
- Enable production destination charges without implement + verify  
- Authorize Slices 2+  

---

## Sign-off table

| Role | Name | Date | Decision |
|------|------|------|----------|
| Product Owner | Product Owner | 2026-07-23 | **Approve** |
| Lead Architect | — | — | Covered by Product Owner Approval (governance package) |
| Security | — | — | Covered by Product Owner Approval (governance package) |
| Finance / Commercial | — | — | Covered by Product Owner Approval (governance package) |

### Official approval record

| Field | Value |
|-------|-------|
| **Decision** | **APPROVED** |
| **Approved By** | Product Owner |
| **Date** | 2026-07-23 |
| **Scope** | PAY-001 Settlement Funding Foundation governance package |
| **Slice 1** | ✅ **PASS** ([18](./18-slice-1-final-certification.md)) |
| **Slice 2** | ✅ **PASS** ([26](./26-slice-2-final-certification.md)) |
| **Slice 3** | ✅ **COMPLETE** ([27](./27-slice-3-verification.md) · [28](./28-slice-3-completion.md)) |
| **Package** | ✅ **Verified** ([32](./32-package-certification.md)) |

### Finance / Security Approve follow-up notes (preserved)

| ID | Note | Status |
|----|------|--------|
| **Q4** | Stripe dispute-fee liability for locked destination-charge shape: design default remains **platform** bears dispute fees unless live Stripe Connect docs assign otherwise. Confirm against current Stripe docs before production enable. | ⏳ **Follow-up** — does not reopen package Approve; must complete before production destination enable |
| **Q3b** | Commercial application-fee rates (bps/flat per plan/org) remain Finance commercial inputs via per-org config. Exact rate values to be recorded before production fee disclosure / enable. | ⏳ **Follow-up** — does not reopen package Approve; required before production honesty |

---

## Post-Approve implementation gate

| Step | Status |
|------|--------|
| Package Approve | ✅ **Approved** (2026-07-23 · Product Owner) |
| **Slice 1** | ✅ **PASS** — [18](./18-slice-1-final-certification.md) |
| **Slice 2 authorize** | ✅ **AUTHORIZED** — [19](./19-slice-2-authorization.md) |
| Slice 2 kickoff + implement + final cert | ✅ **PASS** — [26](./26-slice-2-final-certification.md) |
| **Slice 3 authorize** | ✅ **AUTHORIZED** — [23](./23-slice-3-authorization.md) |
| Slice 3 kickoff + implement | ✅ **COMPLETE** — [27](./27-slice-3-verification.md) · [28](./28-slice-3-completion.md) |
| PAY-001 verification / PASS (A1–A21) | ✅ **Verified** — [32](./32-package-certification.md) · Q3b/Q4 still required before production destination enable |
| FIN-003 Phase C Authorize | 🔒 **eligible to consider** — separate FIN-003 authorize required (not granted by PAY-001) |

### Slice boundary (binding)

| Slice | Scope (per [08](./08-open-questions.md) Q8 · [23](./23-slice-3-authorization.md)) | Gate |
|-------|---------------------------------------------|------|
| **Slice 1** | Destination routing + charge→settlement mapping + settlement readiness gating | ✅ **PASS** |
| **Slice 2** | Refunds / disputes / ACH / settlement adjustments / money-in reconcile / correction audits | ✅ **PASS** |
| **Slice 3** | Ops runbooks (A12) / production readiness / reconcile procedures / A1–A21 / package cert support | ✅ **COMPLETE** |

---

## Rejection / defer criteria (examples)

- Product wants platform float model (conflicts ADR-023)  
- Scope creeps into FIN-003 transfers  
- Re-opens “destination or equivalent” without ADR-023 analysis  
- Q4 attestation refused without alternate documented liability  

---

## Related

- [README](./README.md)  
- [07 — Acceptance criteria](./07-acceptance-criteria.md)  
- [10 — Architecture review](./10-architecture-review.md)  
- [11 — Architecture amendments](./11-architecture-amendments.md)  
- [12 — Approval readiness](./12-approval-readiness.md)  
- [FIN-003 §32 Prerequisites](../98-fin-003-owner-payout-stripe-connect/32-phase-c-prerequisites.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
