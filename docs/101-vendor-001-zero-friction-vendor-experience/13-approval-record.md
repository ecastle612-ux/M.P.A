# 13 — Approval Record

**Package:** VENDOR-001  
**Recorded:** 2026-07-22

---

## Gate decision

| Item | Value |
|------|-------|
| Decision | **APPROVE VENDOR-001** |
| ADR-025 | **Accepted** |
| Unlocked | **Phase A only** |
| Locked | Phases B–D until Phase A certification PASS |

## Binding scope (approved)

- Tokenized QR/link for a **single** work order  
- No login to Start / Finish  
- PM work-order system unchanged except additive share + statuses  
- Share: SMS, email, QR, copy link  
- Phase A: Start → Vendor On Site; Finish → Awaiting Approval (notes/photos optional)  
- **No invoice / payment in Phase A**  
- Arrival verification: timestamp always; GPS if permitted (never blocks)

## Amendment — Arrival Verification

On Start Job, record:

| Field | Rule |
|-------|------|
| Timestamp | Always (device + server) |
| GPS lat/lng | If browser grants permission; approximate only |
| Device type | Optional user-agent summary |

Deny location → proceed with timestamp only. Not vendor tracking — PM confidence only.
