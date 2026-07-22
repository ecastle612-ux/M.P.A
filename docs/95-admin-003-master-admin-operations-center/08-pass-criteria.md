# 08 — Pass Criteria

**Package:** ADMIN-003  
**Status:** Approved (Slice A unlocked)  
**Amendment:** [10-amendment-mission-control.md](./10-amendment-mission-control.md)

PASS is evaluated **per unlocked slice**. Vision Approve alone is not product PASS.

---

## Slice A — Headquarters shell

| # | Criterion |
| --- | --- |
| A1 | `/master-admin` is Mission Control with four levels in order: Immediate Attention → Business Snapshot → Operational Workspaces → Quick Actions — not an equal-card hub |
| A2 | Seven workspaces reachable in one tap: Platform, Customers, Operations, Support, Sales, Development, Analytics |
| A3 | Impersonation, Migration, Setup, Providers, Flags, Testing reachable from workspaces without memorizing routes |
| A4 | Quick Actions: Impersonate, Open Any Portal, Launch Migration, Launch Demo work end-to-end (with active org when required) |
| A5 | Global Search returns organizations, people (roles), and properties at minimum |
| A6 | Immediate Attention loads critical items or a clear all-clear state (no silent blank) |
| A7 | Business Snapshot shows live values or explicit unavailable labels — not decorative fake data |
| A8 | Users without `master_admin` cannot access HQ |
| A9 | Desktop + mobile: Attention and primary Quick Actions reachable without tribal knowledge of URLs |
| A10 | ADMIN-001 banners and audit rules still apply during portal test / impersonation |
| A11 | No Executive AI Brief / chat on HQ in Slice A |

---

## Slice B — Support + Onboarding

| # | Criterion |
| --- | --- |
| B1 | New Client Wizard can take an operator through org → setup → import (optional) → invite → seed (optional) → handoff |
| B2 | Migration Status shows in-progress / failed / complete jobs for Master Admin use |
| B3 | Audit Viewer lists recent impersonation / support sessions |
| B4 | Session Viewer shows active effective Master Admin session when present |

---

## Slice C — Platform + Analytics

| # | Criterion |
| --- | --- |
| C1 | Cross-org KPIs render with explicit scope labels |
| C2 | System Alerts or equivalent feed Attention with at least integration / health signals |
| C3 | Search includes work orders or messages (at least one operational entity beyond people/orgs/properties) |

---

## Slice D — Sales

| # | Criterion |
| --- | --- |
| D1 | Design Partners list is usable for daily founder workflow |
| D2 | Customer Notes can be created and viewed per organization |
| D3 | Demo Mode launch remains clearly labeled demo / test |

---

## Hard fails (any slice)

- Non–Master Admin can open HQ or Master Admin APIs  
- Second undocumented impersonation path  
- Fake CRM / Deployments UI that pretends to work  
- Removing ADMIN-001 security banners during effective sessions  

---

## Certification note

User verification (desktop + mobile smoke) is required before marking a slice **PASS**, consistent with ADMIN-001 certification discipline.
