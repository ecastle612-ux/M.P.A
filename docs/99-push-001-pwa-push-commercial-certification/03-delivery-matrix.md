# 03 — Delivery Matrix (Phase 3)

**Package:** PUSH-001  
**Status:** Draft — awaiting Approve  

---

## Rule

Every row must be tested on at least one enrolled real device for that role. Mark N/A only if the event is not implemented in product yet — then record as **deferred with owner**, not silent PASS.

---

## Tenant

| Event | Trigger | Expected push | Deep link (Phase 5) | Pass |
| --- | --- | --- | --- | --- |
| Announcement | Publish announcement | ✓ | Announcement detail | ☐ |
| New message | Staff/vendor message to resident | ✓ | Conversation (tenant path) | ☐ |
| Payment reminder | Charge / reminder notify | ✓ | Payments / ledger | ☐ |
| Payment received | Settlement success | ✓ | Payments | ☐ |
| Payment failed | Settlement failure | ✓ | Payments / retry | ☐ |
| Maintenance update | WO status change for resident | ✓ | Tenant WO detail | ☐ |

## Property Manager

| Event | Trigger | Expected push | Deep link | Pass |
| --- | --- | --- | --- | --- |
| New maintenance request | WO created | ✓ | WO detail | ☐ |
| Vendor accepted | Assignment accepted | ✓ | WO detail | ☐ |
| Vendor declined | Assignment declined | ✓ | WO detail | ☐ |
| Vendor completed | WO completed | ✓ | WO detail | ☐ |
| Resident message | Inbound resident thread | ✓ | Thread | ☐ |
| Rent payment | Payment recorded | ✓ | Financials / charge | ☐ |

## Owner

| Event | Trigger | Expected push | Deep link | Pass |
| --- | --- | --- | --- | --- |
| Statement ready | Owner statement published | ✓ | Statement | ☐ |
| Payout initiated | Payout started | ✓ | Payout / financial surface | ☐ |
| Payout completed | Payout settled | ✓ | Payout / financial surface | ☐ |

## Master Admin

| Event | Trigger | Expected push | Deep link | Pass |
| --- | --- | --- | --- | --- |
| Platform alert | Platform health / ops alert | ✓ | Relevant MA surface | ☐ |
| Failed integration | Provider health failure path | ✓ | Providers / diagnostics | ☐ |
| Failed email | Email provider failure notify | ✓ | Providers / email ops | ☐ |
| Failed webhook | Webhook failure notify | ✓ | Providers / webhooks | ☐ |

---

## Baseline always available

| Event | Path | Pass |
| --- | --- | --- |
| Test notification | Settings or Master Admin diagnostics “Send Test” | ☐ |

If a matrix row’s domain notify path does not exist, implement only the **minimum wiring** needed for commercial honesty (still via `notify()`), or defer with explicit FAIL→deferred — do not fake PASS.
