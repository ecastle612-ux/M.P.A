# 01 — Experience Architecture

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval  
**Surface:** Public token route `/v/[token]` (name TBD) + PM work-order share affordances

---

## Vendor (no login)

### A — Job card (post-scan)

| Element | Required |
|---------|----------|
| Work order id / title | ✔ |
| Property address | ✔ |
| Job description | ✔ |
| Estimated time | ✔ if present on WO |
| Manager contact | ✔ (name + phone/email) |
| Primary CTA | **Start Job** |

Returning recognized vendor: “Welcome back, {Business Name}” above the same card.

### B — Complete job

| Element | Required |
|---------|----------|
| Notes | Optional |
| Photos | Optional (media upload via existing media rail) |
| Invoice upload | Optional (file + amount) |
| Primary CTA | **Finish Job** → status Awaiting Approval |

### C — First invoice / payment profile (only when needed)

Triggered when invoice is submitted and no profile exists:

- Business name (optional)  
- Preferred payment method: ACH / Check / Other  
- Email  
- Phone  

No password. No bank account number fields in M.P.A. UI.

---

## Property Manager

| Capability | UX |
|------------|----|
| QR | Show/print/copy/share on approved assigned WO |
| SMS / Email share | Deep link = same token URL |
| Notifications | Vendor on site; job finished; invoice submitted |
| Invoice queue | Approve / Reject |
| Pay | Pay via provider **or** Mark as Paid (external) |
| Vendor payment history | Simple table on vendor record |
| Property history | Vendor payments on property |

---

## Optional authenticated vendor dashboard (Phase D)

Outstanding / Awaiting Approval / Approved / Paid / Payment history only — does not replace token QR flow.
