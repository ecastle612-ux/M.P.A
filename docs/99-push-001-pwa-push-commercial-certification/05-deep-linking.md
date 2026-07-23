# 05 — Deep Linking (Phase 5)

**Package:** PUSH-001  
**Status:** Approved package · code paths repaired 2026-07-23 · cold-launch device Pass ☐ pending  

---

## Rule

No generic homepage redirects. Absolute URLs on OneSignal `url` (via `NEXT_PUBLIC_APP_URL`).

---

## Target matrix

| Notification | Correct destination | Known current risk |
| --- | --- | --- |
| Maintenance (PM) | `/maintenance/{workOrderId}` | OK if recipient is staff |
| Maintenance (tenant) | `/portal/tenant/maintenance/{workOrderId}` | Must not use PM path for residents |
| Resident / staff message | Role-correct thread URL | Messaging currently uses `/communications/threads/...` for all — verify tenant path |
| Announcement | `/portal/tenant/announcements/{id}` (tenant) | Confirm staff/owner variants if notified |
| Payment (tenant) | `/portal/tenant/payments` (or charge detail if available) | Prefer entity detail when exists |
| Payment (PM) | Charge or `/financials` | Prefer charge detail over generic list when possible |
| Owner statement | Statement detail route | Must not home |
| Payout | Payout / statement financial surface | Must not home |
| Test | `/settings/notifications` | OK |
| Master Admin alerts | Specific MA page | Not Mission Control home unless that is the only correct surface |

---

## Verification method

1. Send notification with known entity id  
2. Cold-kill app / close tab  
3. Tap notification  
4. Assert URL + visible entity  

Record before/after URL in `artifacts/deep-links/`.
