# FIN-OPS-001 Slice S1 — Resident Billing & Rent Collection

**Status:** Delivered — awaiting human review  
**Authorized:** 2026-08-06 (`AUTHORIZE FIN-OPS-001 SLICE S1`)  
**Package:** [FIN-OPS-001](../index.md) (Approved) · ADR-016 Accepted · S0 certified

---

## Documents

| Report | Purpose |
|--------|---------|
| [S1 Certification Report](./certification-report.md) | Overall slice verdict |
| [Workflow verification](./workflow-verification.md) | Canonical lease → pay → ledger path |
| [Stripe verification](./stripe-verification.md) | Checkout + webhook + receipts |
| [Resident billing verification](./resident-billing-verification.md) | Portal experience |
| [Property Manager verification](./property-manager-verification.md) | FO desk + Command Center |
| [Master Admin verification](./master-admin-verification.md) | Discovery + progress |
| [Implementation status](./implementation-status.md) | What shipped / what remains |

---

## Stop notice

| Next | Instruction |
|------|-------------|
| S2 Payment Enhancements | **Do not implement** until `AUTHORIZE FIN-OPS-001 SLICE S2` |
| Late fees (S3) | **Blocked** |
| Vendor AP (S4–S5) | **Blocked** |
| Facility Operations | **Do not begin** |
| CORE-004 | **Do not modify** |

---

## Verdict

**S1 Resident Billing & Rent Collection: Pass (implementation complete)**  
**S2+: NO-GO** until explicitly authorized.
