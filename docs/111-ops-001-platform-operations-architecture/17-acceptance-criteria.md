# 17 — Acceptance Criteria

**Package:** OPS-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## A) Design package acceptance (Approve gate)

| ID | Criterion | Status |
|----|-----------|--------|
| D-01 | Docs 00–29 present and consistent | ✔ |
| D-02 | Event architecture + catalog standardized | ✔ |
| D-03 | Notification Center sole origin | ✔ |
| D-04 | Timeline, Automation, Tasks, Jobs, Queues designed | ✔ |
| D-05 | AI triggers + Operations Director + Priority + Workflows | ✔ |
| D-06 | Inbox, Command Center, Search, Quick Actions | ✔ |
| D-07 | Smart reminders + Operational analytics | ✔ |
| D-08 | Health + failure recovery + sequences/edges | ✔ |
| D-09 | ADR-028 Accepted; slices A–E finalized; implement locked | ✔ |
| D-10 | Amendments A01–A09 incorporated | ✔ |

---

## B) Platform acceptance (post-implement)

| ID | Criterion |
|----|-----------|
| P-01 | Listed core events emit with standard envelope |
| P-02 | Maintenance chain appears on org timeline end-to-end |
| P-03 | Notifications respect preferences; in-app SoT |
| P-04 | Lease expiry automation creates notify + task + AI draft gate |
| P-05 | Overdue maintenance automation escalates + notifies + task |
| P-06 | Jobs retry then DLQ with health signal |
| P-07 | AI only via trigger router; org-scoped |
| P-08 | Unified Inbox shows notify/tasks/announcements/AI/system |
| P-09 | No domain module calls channel SDKs directly |
| P-10 | Slice authorizations required before code |
| P-11 | Command Center is role homepage composed from OPS |
| P-12 | AI Director mutations/outbound require human gates |
| P-13 | Priority Engine drives notify/task/AI/escalation |
| P-14 | Modules use workflow orchestration; no private bypass buses |

---

## Explicit fail conditions

- Parallel ad-hoc event buses per domain  
- Direct OneSignal/Resend calls from feature modules  
- Secrets in event payloads or timeline  
- Automation loops without circuit break  
- Silent drop of notifications with no in-app record for critical items  
- Ungated AI sending resident messages or assigning vendors  
- Alternate module homepages bypassing Command Center  
- Implementation without `AUTHORIZE OPS-001 SLICE …`  
