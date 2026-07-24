# 18 — Amendments Approval (Binding Product Rules)

**Package:** FIN-003  
**Status:** ✅ **APPROVED** (2026-07-23 · Product Owner)  
**Referenced by:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md)

These amendments bind FIN-003 product behavior. Changing them after Approve requires a new gate cycle.

---

## A1 — Custody

1. M.P.A. **never** becomes a money transmitter in product architecture.  
2. M.P.A. **never** holds customer funds / rent float.  
3. Stripe Connect performs **all** money movement.  
4. Property accounting / operational ledger remains the **system of record** for rent and allocation inputs.  
5. SaaS billing remains **completely independent** (ADR-024).

---

## A2 — Transparency

1. Owners see net payout amounts and material fee/reserve deductions.  
2. Pending vs Paid language is honest (no fabricated success).  
3. Platform application fees are disclosed as platform revenue.  
4. Distinguish transfer-to-Express vs bank deposit when both are shown.

---

## A3 — Owner dashboard / portal

1. FIN-003 wires existing OWNER-001 payout placeholders — **no portal redesign**.  
2. Owner reads are property-scoped via existing ACL.  
3. Onboarding is available from Owner Portal without requiring a second product surface.

---

## A4 — Manual overrides

1. Manual retries, cancels (pre-transfer), and compensating actions are capability-gated.  
2. Every override requires actor + reason + audit record.  
3. Paid history is immutable; corrections are new compensating records.

---

## A5 — Certification list (Blocker 4)

Commercial PASS requires evidence for:

- Org settlement onboarding  
- Owner onboarding + eligibility  
- Happy-path paid payout  
- Failed + returned paths  
- Webhook signature + replay safety  
- Cross-owner negative ACL test  
- No platform rent float  

Full bar: [11 — Acceptance Criteria](./11-acceptance-criteria.md).

---

## A6 — Phase lock

1. Implement only the Approve-authorized phase slice (**Phase A** authorized; B–E locked).  
2. Vendor Connect payouts (ADR-004) are **out of product scope** for FIN-003.  
3. Instant payouts, international expansion, and 1099 automation require explicit Approve amendments.  
4. Do not begin Phase A code until `BEGIN FIN-003 PHASE A IMPLEMENTATION`.

---

## Amendment log

| Date | Amendment | Decision |
|------|-----------|----------|
| 2026-07-22 | ADR-023 custody / Express / provider boundary | Accepted (ADR) |
| 2026-07-23 | Full FIN-003 Draft package restored | Document complete |
| 2026-07-23 | Design Review + Decision Record (D1–D14) | Design Review complete |
| 2026-07-23 | Approval summary + Phase A readiness ([16](./16-approval-summary.md) · [17](./17-phase-a-readiness.md)) | Package finalized |
| 2026-07-23 | **Product Owner Approval** — governance package | ✅ **APPROVED** · Phase A ✅ **AUTHORIZED** · Phases B–E 🔒 **LOCKED** |
