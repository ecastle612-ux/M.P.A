# 14 — Phase A Implementation Notes

**Package:** VENDOR-001  
**Status:** Implemented (pending certification)  
**Date:** 2026-07-22

## Shipped

| Area | Deliverable |
|------|-------------|
| Schema | `vendor_work_order_tokens`, `vendor_job_sessions`; WO statuses `vendor_on_site`, `awaiting_approval`; activity event types |
| Server | Mint / verify hashed token; Start (optional GPS); Finish (notes/photos); audit + PM notify |
| Public UI | `/v/[token]` — job card, Start Job, Finish Job |
| Public API | `GET/POST /api/vendor-jobs/[token]` (+ `/start`, `/complete`, `/photo`) |
| PM UI | Work order **Vendor job link / QR** panel — Generate, Copy, SMS, Email, Download QR |
| PM API | `GET/POST /api/maintenance/[workOrderId]/vendor-token` |

## Arrival verification

- Always records server + client timestamp on Start.  
- Requests browser geolocation; denial does not block Start.  
- When granted: lat/lng (+ accuracy) stored on session + activity details.  
- Optional device summary from User-Agent.

## Explicitly not in this build

- Invoice upload, payment profile, Pay Vendor, expense/owner reports (Phase B+)  
- Storing bank secrets  
- Requiring `/portal/vendor` login for Start/Finish

## Share-link note

Raw tokens are hashed at rest. Regenerating a link revokes prior tokens and returns a new shareable URL/QR for the current browser session.
