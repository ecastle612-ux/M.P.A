# 19 — Open Questions

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

| ID | Question | Options | Proposed default |
|----|----------|---------|------------------|
| Q1 | Outbox table naming | Extend `event_domain_events` / new `ops_*` | **Extend ADR-005 table with OPS envelope fields** where possible |
| Q2 | External broker timing | Never in v1 / optional later | **Postgres queues v1**; broker when scale requires |
| Q3 | SMS provider | Twilio / other / defer | **Defer channel**; design slot now |
| Q4 | Customer-visible org timeline depth | 90d / 1y / unlimited | **1 year hot**; archive colder |
| Q5 | Org Admin automation authoring MVP | Toggles only / full builder | **Seeded templates + toggles** |
| Q6 | AI auto-apply assignments | Never / limited | **Never auto-assign vendors without human** |
| Q7 | Inbox vs MHF threads IA | Merge / tabs | **Inbox hub + threads detail** |
| Q8 | Staff health home | ADMIN-003 only / OPS page | **ADMIN-003 widgets fed by OPS** |
| Q9 | Event catalog governance | Central OPS only / domain appendices | **Central catalog + domain PRs citing OPS** |
| Q10 | Quiet hours default | Off / 21:00–08:00 local | **Off until user sets**; org can recommend |

---

## Dependencies at Approve

| Dependency | Owner |
|------------|-------|
| ADR-005 Accepted | Done |
| API-001 / EML-001 channel adapters | Notifications slices |
| AUTH-001 / COM-001 event producers | Their slices |
| AI runtime (AI-001) | AI trigger slice |
