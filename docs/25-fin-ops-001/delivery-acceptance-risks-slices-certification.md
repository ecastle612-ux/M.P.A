# FIN-OPS-001 — Delivery, Acceptance, Risks, Slices & Certification

**Status:** Approved (FIN-OPS-001) · S0–S2 delivered · S3+ blocked  
**Date:** 2026-08-06

---

## 1. Acceptance criteria (package approval)

Before **APPROVE FIN-OPS-001**, reviewers confirm:

1. FO is Property Manager (and Complete) only — not Facility Ops product scope.
2. Scope is operational finance for Customer #1 — not ERP/GL (ADR-010 / ADR-016).
3. Launch-critical / Phase 2 / Post-launch lists are explicit and sufficient for Customer #1.
4. Canonical workflows and state machines are implementable without CORE-004 changes.
5. Subscription ownership (`pm.financial_operations`) and permissions matrix are clear.
6. Property / resident / vendor integrations do not duplicate CRM entities.
7. Stripe Connect + Checkout + webhook truth model is clear; SaaS billing stays separate.
8. Dashboard, notifications, audit, search, mobile are specified at design depth.
9. Implementation slices are ordered; certification plan is fail-closed.
10. No application code is required or implied as part of this approval — approval unlocks implementation only.

---

## 2. Launch-critical acceptance (implementation gate — after approval)

| ID | Criterion |
|----|-----------|
| L-01 | Entitled PM/Complete orgs can open `/pm/financial-operations`; Facility-only orgs cannot. |
| L-02 | Staff can create rent / recurring / one-time charges against resident + property. |
| L-03 | Resident ledger shows charges, payments, adjustments, running balance. |
| L-04 | Residents can pay open charges via Stripe Checkout; webhook posts payment. |
| L-05 | Payment history is queryable by resident, property, period. |
| L-06 | Late fee policy can be configured and fees posted to past-due charges. |
| L-07 | Vendor invoices support submit → approve/reject → pay (or mark paid). |
| L-08 | Vendor payments record Stripe (or external) settlement against invoices. |
| L-09 | Property and owner financial summaries show Launch cash metrics. |
| L-10 | Operational reports: A/R aging, collections, late fees, vendor spend. |
| L-11 | FO mutations are audited; Stripe secrets never in client. |
| L-12 | Search surfaces FO entities only when entitled. |
| L-13 | Connect-not-ready blocks charge creation with clear CTA. |
| L-14 | SaaS plan billing (`/billing`) remains distinct and operator-controlled for SKU. |

---

## 3. Phase phasing reminder

| Phase | Capabilities |
|-------|----------------|
| **Launch-critical** | Rent collection, recurring & one-time charges, resident ledger, payment history, late fees, vendor invoice approval & payments, property/owner summaries, operational reporting |
| **Phase 2** | Autopay, payment plans, deposit automation, owner portal digests, SMS reminders, scheduled report email, partial payments UX polish |
| **Post-launch** | QBO/Xero export, trust accounting, multi-currency, capital/project costing, advanced GL mapping |

---

## 4. Risks & mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Accidental ERP scope creep | High | ADR-016 + gate; reject GL/trust until post-launch ADRs |
| Duplicate “billing” confusion (SaaS vs rent) | High | Separate nav labels, docs, tables (`financial_*` vs subscription) |
| Webhook race / double-post | High | Idempotent webhook handlers keyed by Stripe event id |
| Connect onboarding incomplete | Medium | Hard block + Setup checklist item |
| Permission leaks across properties | High | Property-scoped RLS; tests for cross-property deny |
| Late fee legal variance by jurisdiction | Medium | Policy config per org/property; no hard-coded fee law |
| Vendor pay without approval | High | State machine enforce; no skip without elevated role |
| CORE-004 / Mission Control conflation | Medium | Do not modify CORE-004; FO under `/pm/financial-operations` only |
| Facility Ops premature start | High | Explicit block until separate authorization |
| Stripe dispute / chargeback gaps | Medium | Launch: alert + freeze; Phase 2: dispute workflow |

---

## 5. Implementation slices (post-approval only)

Ordered for Customer #1 value; each slice is certifiable.

| Slice | Name | Delivers | Depends |
|-------|------|----------|---------|
| **S0** | Financial Foundation | Domain, permissions, Command Center shell, events/audit/notify/search, Connect linkage, flags — **delivered** | Approved package |
| **S1** | Resident Billing & Rent Collection | Charges, ledger, manual + online pay, receipts, portal — **delivered** | S0 |
| **S2** | Delinquency, Late Fees & Vendor AP | Aging, late fees, arrangements, vendor invoice approve/schedule/mark paid — **delivered** | S1 |
| **S3** | Autopay & Payment Plans Polish | Autopay / plans polish — **blocked** | S2 |
| **S4** | Advanced Owner/Property Reports | Property/owner summaries; Launch reports — **blocked** | S2 |
| **S5** | Notifications, Search & Audit Polish | `finance.*` polish; search entities — **blocked** | S2–S4 |
| **S6** | Launch Certification Hardening | Fail-closed tests; Connect empty states; permission matrix — **blocked** | S5 |

**Out of slices until Phase 2 auth:** autopay, payment plans, QBO, trust accounting.

**Forbidden in these slices:** Facility Ops modules; CORE-004 redesign; customer self-serve SKU change.

---

## 6. Certification plan

### 6.1 Design certification (this package)

| Check | Pass condition |
|-------|----------------|
| Gate docs linked | Index + implementation-gate reference FIN-OPS-001 |
| ADR-016 Proposed | Decision recorded |
| No code in package | Diff is documentation only until APPROVE |
| Scope boundary | Explicit non-goals and Facility exclusion |

### 6.2 Implementation certification (after APPROVE FIN-OPS-001)

| Gate | Evidence |
|------|----------|
| Unit / shared | Ledger math, state transitions, entitlement helpers |
| API | Charge/payment/invoice permission + idempotency tests |
| RLS | Cross-org and cross-property deny |
| Webhook | Replay and duplicate event safe |
| E2E smoke | Staff posts charge → resident pays → ledger updates; invoice approve → pay |
| Commercial | Facility-only SKU cannot open FO; Complete can |
| Re-cert commercial P0 | Entitlement, search, setup still green |

**GO for production FO:** all L-01…L-14 + slice S8 pass.  
**NO-GO:** any Launch-critical criterion fail, or webhook non-idempotent, or SKU leak.

### 6.3 Stop conditions

- Do not start Facility Operations from FO work.
- Do not modify CORE-004 under FO slices.
- Material scope change → restart Design → Document → Approve.

---

## 7. Approval checklist (human)

```
[ ] Product vision & scope reviewed
[ ] Workflows & state machines reviewed
[ ] Ownership, permissions, integrations reviewed
[ ] Stripe & ledger architecture reviewed
[ ] Surfaces / dashboard / notifications / search / mobile reviewed
[ ] Acceptance, risks, slices, certification reviewed
[ ] ADR-016 accepted (or revised)
[ ] Explicit message: APPROVE FIN-OPS-001
```

Until the explicit approval message, **implementation remains blocked**.

---

## Related docs

- [Package index](./index.md)
- [ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md)
