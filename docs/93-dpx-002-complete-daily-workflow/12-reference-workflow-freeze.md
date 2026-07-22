# 12 — Reference Workflow Freeze

**Package:** DPX-002  
**Status:** Binding after DPX-002 PASS  
**Approved intent:** 2026-07-21 with `APPROVE DPX-002`

---

## Rule

After DPX-002 passes, the Property → Resident → Lease → Payment → Maintenance → Vendor → Communication path is the **gold standard** for the platform.

| Rule | Meaning |
| --- | --- |
| Freeze | Do not regress continuity, next-action surfacing, AI partnership, or momentum on this path |
| Reference | Every future workflow copies this standard — never a lower one |
| Ship gate | If a new surface is not “as smooth as DPX-002,” **block ship** |

## PR / Approve checklist (post-PASS)

1. Does this change make the reference path worse? → Reject  
2. Is the new workflow as smooth as DPX-002? → Evidence required  
3. Does it replace friction (DPX-001)? → Required  

## Successor workflow certifications (roadmap)

Do **not** start until DPX-002 = PASS.

| ID | Workflow | Scope |
| --- | --- | --- |
| **DPX-002** | Core daily ops (this package) | Property → Resident → Lease → Payment → Maintenance → Vendor → Communication |
| **DPX-003** | Commercial Product Experience | Premium polish for Design Partner — see [96](../96-dpx-003-commercial-product-experience/README.md) *(supersedes prior “Leasing” slot; renumbering in DPX-003 [12](../96-dpx-003-commercial-product-experience/12-roadmap-amendment.md))* |
| **DPX-004** | Leasing | Applicant → Screening → Lease → Move-in |
| **DPX-005** | Maintenance lifecycle | Issue → Vendor → Completion → Owner communication |
| **DPX-006** | Accounting lifecycle | Rent → Reconciliation → Owner statement → Reporting |

Each successor inherits Amendments A–G and the freeze comparison gate. Do not start DPX-004+ until DPX-003 = PASS.
