# 15 — Approval Checklist

**Package:** BILL-001  
**Status:** Approved (2026-07-22) — see [16-approval-record.md](./16-approval-record.md)

Silence is not approval. On approval: README → **Approved**, ADR-024 → **Accepted**, unlock **Phase A only**.

---

## Decisions

| ID | Decision | Accept? |
|----|----------|---------|
| D1 | Stripe **Billing** for SaaS (not Payments/Connect) | ☑ |
| D2 | Strict separation of three Stripe rails | ☑ |
| D3 | Exactly one subscription per organization | ☑ |
| D4 | Plans: Trial, Founder, Professional, Business, Enterprise (mo/yr) | ☑ |
| D5 | Checkout + Customer Portal for self-serve | ☑ |
| D6 | Dedicated `/api/webhooks/saas/*` | ☑ |
| D7 | Entitlements separate from Auth | ☑ |
| D8 | Master Admin KPIs via ADMIN-003 later slice; model now | ☑ |
| D9 | Same Stripe account OK for v1 with logical separation (or dual-account if preferred) | ☑ |
| D10 | Implementation phases A–E; no skipping | ☑ |
| D11 | Certification S01–S12 binding for PASS | ☑ |
| D12 | typecheck + production build required before deploy claim | ☑ |

---

## Sign-off

| Role | Name | Date | Approval |
|------|------|------|----------|
| Product | | | |
| Lead Architect | | | |
| Security / Finance | | | |

---

## After Approve

Reply **APPROVE BILL-001** (and note any amendments). Implementation starts at **Phase A only**.
