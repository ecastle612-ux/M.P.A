# 10 — Amendment: Mission Control (binding)

**Package:** ADMIN-003  
**Status:** Approved with package (2026-07-21)  
**Effect:** Supersedes conflicting home / AI / slice wording in docs 03 and 07 where they disagree.

---

## Principle

Do **not** build another dashboard.

Build **Mission Control**.

When the Master Admin logs in, they should not have to decide where to go first. The page immediately surfaces what needs action.

---

## Four levels of information (home)

### 1. Immediate Attention (top — always visible)

Critical / actionable items only, for example:

- Platform alerts  
- Failed integrations  
- Failed emails  
- Failed push notifications  
- Companies needing onboarding  
- Support issues waiting  
- Critical errors  
- Aging / stuck maintenance or vendor workflows (when signal exists)  

Deployments succeeded/failed: surface when a trustworthy signal exists; never invent status.

### 2. Business Snapshot

Live KPIs, for example:

- Organizations  
- Active Property Managers  
- Properties  
- Residents  
- Vendors  
- Occupancy  
- Open Maintenance  
- Revenue  
- Monthly Growth (when available; otherwise mark unavailable)  

### 3. Operational Workspaces

Everything grouped by responsibility — **no random cards**. Everything has a home.

Workspaces (approved amendment list):

- Platform  
- Customers  
- Operations  
- Support  
- Sales  
- Development  
- Analytics  

Onboarding tools (migration, setup, invites, seed) live under **Customers** and/or **Support** quick paths in Slice A; denser Onboarding workspace panels ship with Slice B.

### 4. Quick Actions

One-click constant jobs, for example:

- New Organization  
- Launch Migration  
- Impersonate User  
- Open Any Portal  
- Invite Company  
- Launch Demo  
- Send Announcement  
- View Integrations  
- Platform Health  

---

## AI — Executive Operations Brief (not chat)

AI on this surface is **not** a chat window.

It is an **Executive Operations Brief**, e.g.:

> Good morning, Erick.  
> Today: 2 companies are onboarding. 1 integration requires attention. …

Then allow follow-up questions.

**Implement:** Slice C only — do not build in Slice A.

---

## Search — universal

One search. No module switching.

Entities (vision): Organizations, Managers, Residents, Owners, Vendors, Properties, Work Orders, Leases, Payments, Audit Logs, Messages, Documents.

**Slice A:** Scaffold + Organizations, Managers, Residents, Owners, Vendors, Properties (best-effort).  
**Later slices:** Expand remaining entities.

---

## Revised slice order (binding)

| Slice | Name | Status |
| --- | --- | --- |
| **A** | Headquarters shell | **Unlocked** |
| **B** | Workspaces (density) | Locked |
| **C** | Executive AI Brief | Locked |
| **D** | Advanced analytics and automation | Locked |

Do not jump ahead. Perfect Slice A first.

---

## Long-term vision

Eventually run almost the entire company from this page — not only administer the software, but **operate the business**.
