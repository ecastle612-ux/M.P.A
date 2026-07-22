# 03 — Mission Control Home

**Package:** ADMIN-003  
**Status:** Approved (amended)  
**Route:** `/master-admin`  
**Binding amendment:** [10-amendment-mission-control.md](./10-amendment-mission-control.md)

---

## Purpose

Mission Control. Not a dashboard of equal cards.

On load, the operator immediately knows what needs attention and can act in one click. They should not have to decide where to go first.

---

## Four levels (locked)

### 1. Immediate Attention (top — always visible)

Critical / actionable only: platform alerts, failed integrations, failed email/push, onboarding companies, support waiting, critical errors, stuck vendor/workflows when known. Deployment outcomes only when a real signal exists.

### 2. Business Snapshot

Live KPIs: Organizations, Active Property Managers, Properties, Residents, Vendors, Occupancy, Open Maintenance, Revenue, Monthly Growth (or unavailable).

### 3. Operational Workspaces

Grouped by responsibility — Platform, Customers, Operations, Support, Sales, Development, Analytics. No random cards. Everything has a home.

### 4. Quick Actions

New Organization, Launch Migration, Impersonate User, Open Any Portal, Invite Company, Launch Demo, Send Announcement, View Integrations, Platform Health — one click.

---

## Also on home

| Element | Role |
| --- | --- |
| Global Search | Universal; Slice A: orgs + people + properties |
| Active org chip | Clarifies org-scoped KPIs and Quick Actions |
| Executive AI Brief | **Slice C only** — not a chat window |

---

## States

| State | Behavior |
| --- | --- |
| Loading | Skeleton for Attention + Snapshot; Search + Quick Actions usable if static |
| Partial failure | Show available data; label failed sources |
| No active org | Org-scoped actions prompt; platform panels still work |
| All clear | Attention shows calm empty state; Snapshot + Workspaces + Actions remain |
| Non–Master Admin | Unauthorized |

---

## Mobile

1. Search → 2. Immediate Attention (compact) → 3. Snapshot scroll → 4. Quick Actions → 5. Workspaces. Attention and primary actions reachable without drawer tribal knowledge.
