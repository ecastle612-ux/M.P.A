# 25 — Phase 5 Design: Vendor Operations

**Package:** CORE-004  
**Phase:** 5  
**Status:** ✅ Authorized · Implemented  
**Date:** 2026-08-06  
**Authorize:** [24](./24-phase-5-authorization.md)

---

## Permanent rules

**Every external contractor enters the same operational lifecycle.**  
Vendor data is never duplicated across modules.

`workflow_stage` on `vendors` is authoritative. Legacy CRM `status` (`active` · `inactive` · `archived`) remains synced.

---

## Reuse (ARCH-001)

| Extend | Do not create |
|--------|---------------|
| `vendors` as sole vendor carrier | Second vendor CRM |
| Phase 2 `vendor_escalation` + assignments + `/v/[token]` | Parallel maintenance workflow |
| `vendor-payments` invoice/mark-paid | Duplicate accounting |
| Vault / documents | Parallel document store |
| STD-001 UDF on `/vendors` | Custom dashboard |

---

## Transition graph (summary)

Happy path: prospective → invited → application_submitted → compliance_review → insurance_verification → approved → available → assigned → work_in_progress → invoice_submitted → payment_pending → paid → performance_review → available

Branches:
- `performance_review` → `preferred_vendor` | `available`
- `preferred_vendor` → `assigned` | `available`
- `available` | `preferred_vendor` → `suspended`
- `suspended` → `available` | `inactive`
- `available` | `inactive` → `inactive` → `archived` (terminal)

Job-cycle stages (`assigned` … `paid`) are operational focus on the same vendor identity; after `performance_review` the vendor returns to `available` or `preferred_vendor`.

---

## Integrations

| Domain | Integration |
|--------|-------------|
| Maintenance | Assign only when stage ∈ assignable (`available`, `preferred_vendor`); reuse assignment + tokenized job |
| Financial | Invoice review / mark-paid advances payment stages |
| Property | Open vendor work count / compliance signals on Property Command Center |
| Search | business name · trade · insurance · status · workflow |

---

## Stage definitions

Authoritative: `apps/web/src/lib/vendor/workflow.ts` (`VENDOR_WORKFLOW_DEFINITIONS`).
