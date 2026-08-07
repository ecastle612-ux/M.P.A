# Facility Operations — Customer Promise Certification

**Package:** FAC-OPS-001  
**Promise source:** [01 Vision & Customer Promise](../../01-vision-and-customer-promise.md)  
**Date:** 2026-08-07  
**Audience:** Master Admin / commercial product decision  

---

## Promise statement

> “I can see every critical asset and system, know what preventive and compliance work is due, open corrective work without losing context, and prove to leadership that the facility is under control — in one operating system that already runs my organization.”

---

## Verdict

### Feature delivery: **GO** (with observations)  
### Operational / staging Customer Promise: **CONDITIONAL GO**

All FAC-OPS-001 authorized capabilities for E.1–E.6 are delivered as product homes. Customer Promise **Pass** (parity with Property Manager’s signed GO) requires Master Admin staging evidence on journeys J-F0–J-F8.

---

## Promise checklist

| # | Promise rule | Result | Evidence |
|---|--------------|--------|----------|
| 1 | One OS — not a bolted-on second identity | **Pass** | Shared org/roles/entitlements; FO modules on same shell |
| 2 | Program vs execution | **Pass** | FO creates/contextualizes; shared `maintenance_work_orders` |
| 3 | Honest SKU | **Pass** | PM-only denied FO routes; FO-only denied PM leasing/rent |
| 4 | Master Admin can test everything | **Conditional** | E1–E6 panels + customer routes; Pass not yet recorded on staging |
| 5 | Extend, never duplicate | **Pass** | Reuses Mission Control pattern, Documents, Communications, Search, Audit, Assistant |

---

## Advertised capability scoreboard

| Capability | Discoverable | Begin→End | Matches ad | MA validate | Verdict | Friction |
|------------|:------------:|:---------:|:----------:|:-----------:|---------|----------|
| Facility Mission Control | Yes | Yes | Yes | Yes | **Pass*** | Staging ranking witness |
| Facility Operations (corrective) | Yes | Yes | Yes | Yes | **Pass*** | — |
| Assets | Yes | Partial | Partial | Yes | **Conditional** | Relocate/history P1 |
| Building Systems | Yes | Yes | Yes | Yes | **Pass*** | — |
| Preventive Maintenance | Yes | Yes | Yes | Yes | **Pass*** | — |
| Inventory / Parts | Yes | Yes | Yes | Yes | **Pass*** | — |
| Inspections | Yes | Partial | Partial | Yes | **Conditional** | Docs attach UX P1 |
| Safety | Yes | Yes | Yes | Yes | **Pass*** | Docs UX P2 |
| Compliance | Yes | Yes | Yes | Yes | **Pass*** | Evidence picker P2 |
| Capital Projects | Planned only | No | Off | N/A | **NO-GO** | Future gate |
| Search / Timeline / Audit / Notifications / Assistant | Yes | Yes | Yes | Yes | **Pass*** | Platform reuse |

\*Code Pass pending staging MA Pass recording.

---

## Customer understanding

| Role | Understanding after FO |
|------|------------------------|
| Facility Manager | I can run plant readiness from Facility Mission Control and FO workspaces. |
| Maintenance Manager | Facility work arrives as labeled shared work orders I execute — no second queue product. |
| Executive | I can see risk posture on FO Mission Control; dedicated Reports/export is not yet a separate home. |
| Master Admin | I can certify FO via Launch Readiness E.1–E.6 panels on a test org. |

---

## Remaining friction

1. ~~Staging MA Pass not yet filed~~ — **cleared** ([p1-remediation](./p1-remediation/))  
2. ~~Asset relocate + location history~~ — **cleared** (P1-2)  
3. ~~Maintenance CC / Vendor facility labels~~ — **cleared** (P1-3)  
4. ~~Inspection document attach UX~~ — **cleared** (P1-4); compliance picker polish remains P2  
5. No separate FO Reports/export module (honesty allowed for later — P2)  

---

## Hard stops

```
STOP
Do not implement Capital Projects.
Do not expand post-FAC-OPS roadmap.
Await next authorization before any post-FAC-OPS work.
```
