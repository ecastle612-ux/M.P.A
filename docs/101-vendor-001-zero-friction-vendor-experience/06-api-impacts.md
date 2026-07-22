# 06 — API Impacts

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

---

## Public (token) API — no session cookie required

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/vendor-jobs/[token]` | Job card payload |
| POST | `/api/vendor-jobs/[token]/start` | Start Job |
| POST | `/api/vendor-jobs/[token]/complete` | Finish Job (+ notes/photos/invoice refs) |
| POST | `/api/vendor-jobs/[token]/profile` | Upsert minimal payment profile |
| POST | `/api/vendor-jobs/[token]/invoice` | Submit / replace invoice |

All verify hashed token, org/WO binding, status preconditions, rate limits.

## PM (authenticated) API

| Method | Path | Action |
|--------|------|--------|
| POST | `/api/maintenance/work-orders/[id]/vendor-token` | Mint / rotate QR token |
| GET | `/api/maintenance/work-orders/[id]/vendor-token` | QR URL + image meta |
| GET | `/api/vendors/[id]/payments` | Payment history |
| POST | `/api/vendor-invoices/[id]/approve` | Approve |
| POST | `/api/vendor-invoices/[id]/reject` | Reject |
| POST | `/api/vendor-invoices/[id]/pay` | Pay or mark paid |

## UI routes

| Route | Audience |
|-------|----------|
| `/v/[token]` | Vendor mobile-first job UI |
| Existing WO detail | PM share QR / copy link |
| Vendor detail | Payment history |
| Property detail | Vendor payment slice |

## Explicit non-touch

- Do not change Stripe SaaS (`BILL-001`) or rent payments webhooks.  
- Do not require `/portal/vendor` auth for Start/Finish.
