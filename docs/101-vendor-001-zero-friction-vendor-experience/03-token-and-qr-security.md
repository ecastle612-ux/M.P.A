# 03 — Token & QR Security

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

---

## Token properties

| Property | Rule |
|----------|------|
| Scope | Exactly one `work_order_id` (+ org id) |
| Entropy | ≥ 128-bit random; stored hashed at rest |
| Delivery | Path `/v/{token}` (or `/vendor/job/{token}`) |
| TTL | Configurable (default: WO open + 30 days after completion) |
| Revocation | PM revoke / reassign regenerates token; old token 410 |
| Rate limits | Per IP + per token on mutations |
| CSRF | Mutation endpoints require token + Origin checks / double-submit |

## QR

- Payload = absolute HTTPS URL to token page.  
- Generated when WO is **approved** and has an **active vendor assignment**.  
- Share channels: print PNG/PDF, SMS, email, copy link from WO detail.  
- Reuse property-QR **rendering** utilities; do **not** reuse `building_qr_codes` enrollment tokens.

## No-login trust boundary

- Token proves capability for that WO only.  
- Soft recognition: verified email/phone → attach `vendor_payment_profiles` for return “Welcome back”.  
- Escalation: authenticated `/portal/vendor` remains available; never required for Start/Finish.

## Explicitly out of scope for Phase A

- Cross-WO vendor SSO without email/phone verification.  
- Public listing of open jobs by QR (one WO per token).
