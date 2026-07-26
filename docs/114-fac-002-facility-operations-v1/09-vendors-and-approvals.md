# 09 — Vendors & Approvals

**Package:** FAC-002  
**Rule:** Extend [VENDOR-001](../101-vendor-001-zero-friction-vendor-experience/README.md). Vendors **never** require accounts.

---

## Keep as-is

- Vendor directory CRUD  
- Secure token job page `/v/[token]`  
- Vendor start / photos / notes / invoice / mark vendor complete  
- Manager review → approve / pay  

---

## V1.0 design gaps to close

| Gap | Design |
|-----|--------|
| Accept / Decline | Explicit actions on token job (status + notify manager) |
| SMS workflow | Prefer existing messaging/SMS channel when enabled; fallback email link always |
| Email workflow | Ensure invite/resend uses transactional email with secure link |
| Only staff complete WO | Enforce in WO transition rules (already product law — verify in implement) |

---

## Non-goals

- Vendor login portal accounts  
- Vendor marketplace ratings engine  
- Connect payouts to vendors (separate ADR)  
