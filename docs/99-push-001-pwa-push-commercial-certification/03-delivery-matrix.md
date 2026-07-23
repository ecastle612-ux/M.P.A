# 03 — Delivery Matrix (Phase 3)

**Package:** PUSH-001  
**Status:** Approved package · wiring audited 2026-07-23 · device Pass ☐ pending  

---

## Rule

Every row must be tested on at least one enrolled real device for that role. Mark N/A only if the event is not implemented in product yet — then record as **deferred with owner**, not silent PASS.

---

## Tenant

| Event | Trigger | Expected push | Deep link (Phase 5) | Pass |
| --- | --- | --- | --- | --- |
| Announcement | Publish announcement | ✓ Wired | Announcement detail | ☐ Device |
| New message | Staff/vendor message to resident | ✓ Wired | Conversation (tenant path) | ☐ Device |
| Payment reminder | Charge / reminder notify | ✓ Wired (`charge_created`) | Payments | ☐ Device |
| Payment received | Settlement success | ✓ Wired (role-correct href) | `/portal/tenant/payments` | ☐ Device |
| Payment failed | Settlement failure | ✓ Wired (2026-07-23) | `/portal/tenant/payments` | ☐ Device |
| Maintenance update | WO status change for resident | ✓ Wired | Tenant WO detail | ☐ Device |

## Property Manager

| Event | Trigger | Expected push | Deep link | Pass |
| --- | --- | --- | --- | --- |
| New maintenance request | WO created | ✓ Wired | WO detail | ☐ Device |
| Vendor accepted | Assignment accepted | ✓ Wired | WO detail | ☐ Device |
| Vendor declined | Assignment cancelled | ✓ Wired (2026-07-23) | WO detail | ☐ Device |
| Vendor completed | WO completed | ✓ Wired | WO detail | ☐ Device |
| Resident message | Inbound resident thread | ✓ Wired | Thread | ☐ Device |
| Rent payment | Payment recorded | ✓ Wired (role-correct href) | Financials / charge | ☐ Device |

## Owner

| Event | Trigger | Expected push | Deep link | Pass |
| --- | --- | --- | --- | --- |
| Statement ready | Owner statement published | ✓ Wired → `/portal/owner` | Owner portal | ☐ Device |
| Payout initiated | Payout started | ⏸ Deferred — FIN-003 Phase C+ | — | N/A |
| Payout completed | Payout settled | ⏸ Deferred — FIN-003 Phase C+ | — | N/A |

## Master Admin

| Event | Trigger | Expected push | Deep link | Pass |
| --- | --- | --- | --- | --- |
| Platform alert | Platform health / ops alert | ⏸ Deferred — no dedicated catalog; use Send Test | Relevant MA surface | N/A |
| Failed integration | Provider health failure path | ⏸ Deferred — Providers UI health | Providers / diagnostics | N/A |
| Failed email | Email provider failure notify | ⏸ Deferred | Providers / email ops | N/A |
| Failed webhook | Webhook failure notify | ⏸ Deferred | Providers / webhooks | N/A |

---

## Baseline always available

| Event | Path | Pass |
| --- | --- | --- |
| Test notification | Settings or Master Admin diagnostics “Send Test” | ☐ Device |

If a matrix row’s domain notify path does not exist, implement only the **minimum wiring** needed for commercial honesty (still via `notify()`), or defer with explicit FAIL→deferred — do not fake PASS.
