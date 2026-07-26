# 28 — Operational Analytics

**Package:** OPS-001  
**Amendment:** A08  
**Status:** Binding (Approved with Amendments)

---

## Purpose

Platform **operational KPIs** derived from OPS events/jobs/notifications — powering Command Center insights, staff health, and Customer Success (COM-001) without a parallel shadow metrics bus.

---

## KPI catalog (examples)

| KPI | Meaning |
|-----|---------|
| Average Work Order Completion | Time request → complete |
| Average Vendor Response Time | Assign → accept/decline |
| Tenant Satisfaction | Survey / CSAT when collected |
| Inspection Completion Rate | Due vs completed in period |
| Occupancy | From property/unit facts |
| Rent Collection | Collected vs due (resident rail facts) |
| AI Resolution Rate | AI recommendations accepted / useful |
| Automation Success Rate | Rules fired successfully vs failed |
| Notification Success Rate | Delivered / attempted by channel |
| Queue Processing Time | Outbox/job lag percentiles |

---

## Principles

| Principle | Design |
|-----------|--------|
| Event-sourced where possible | Aggregate from catalog events |
| Org-scoped | Tenant dashboards see only their org |
| Staff cross-org | OPS health / COM CS only with capability |
| No PII in aggregate exports | Rollups |
| Entitlement-aware | Advanced analytics may be plan-gated |

---

## Consumers

| Consumer | Use |
|----------|-----|
| Command Center | Role-appropriate KPI tiles |
| OPS System Health | Queue/notification/AI platform KPIs |
| COM Customer Success | Adoption / ops health inputs |
| AI Operations Director | Trend detection inputs |
| Reports module | Formal report jobs |

---

## Freshness

| Class | Target |
|-------|--------|
| Operational lag KPIs | Near real-time / minutes |
| Occupancy / collection | Hourly or nightly materialization |
| Satisfaction | As surveys arrive |

---

## Acceptance (A08)

| ID | Criterion |
|----|-----------|
| OA-01 | KPI catalog covers listed examples |
| OA-02 | Derived from OPS events/jobs where possible |
| OA-03 | Org-scoped for tenants; staff cross-org gated |
| OA-04 | Feeds Command Center + CS + health |
