# 07 — Notifications

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

---

| Event | Who | Channel |
|-------|-----|---------|
| Vendor On Site | Assigned PM / org maintenance watchers | In-app + push/email per prefs |
| Job finished / Awaiting Approval | PM | In-app + push/email |
| Invoice submitted | PM | In-app + email |
| Invoice approved / rejected | Vendor email/SMS on profile | Email / SMS |
| Payment recorded | Vendor | Email / SMS |

Reuse NotificationProvider (OneSignal / email). No new provider required for Phase A.
