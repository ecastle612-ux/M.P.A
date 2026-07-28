# 11 — Reporting Matrix

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval  
**Engine:** Existing reporting / Ops widgets / Command Center — **no new reporting product**

---

## Required V1.0 views

| Report / widget | Source filter | Surface |
|-----------------|---------------|---------|
| Outstanding signatures | Packages in `sent` / `in_progress` / `partially_signed` | Ops Signature widget · Command Center · module lists |
| Leases awaiting signature | A1/A2 outstanding | Leasing reports / Ops |
| Vendor agreements awaiting signature | B1/B2 outstanding | Facility / Vendors |
| Expiring agreements | Packages near `expires_at` OR leases/vendors with agreement end metadata | Ops + leasing |
| Completed agreements (period) | `completed` in range | Ops · reports |
| Outstanding acknowledgements | A4/A5/C1/C2 outstanding | Lifecycle · Team · Ops |
| Signature turnaround time | `sent_at` → `completed_at` percentiles | Ops / reporting framework metrics |
| Compliance summary | Counts by workflow id / document_type / status | Org admin report |

---

## Rules

1. Reuse API-004 Ops snapshot fields where present (pending, completed today, expired, reminder queue, failures, awaiting vault).  
2. Module reports compose `document_type` + metadata `kind` — do not fork metrics per provider.  
3. Export/PDF of reports follows existing reporting presentation standards — no signature-specific engine.
