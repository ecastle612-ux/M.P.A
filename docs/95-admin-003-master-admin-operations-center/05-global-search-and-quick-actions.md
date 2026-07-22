# 05 — Global Search and Quick Actions

**Package:** ADMIN-003  
**Status:** Draft

---

## Global Search

### Placement

Always visible on Operations Center home and workspace routes under `/master-admin/*` (excluding deep-linked product pages outside the console).

Keyboard: design for a dedicated shortcut (align with shell Command Center patterns where safe; do not break AI launcher or focus traps — see SH-002 / ADMIN-001 constraints).

### Entity set (vision)

| Entity | Result actions (examples) |
| --- | --- |
| Organizations | Open org HQ · Switch active org · View client health · Onboarding status |
| Properties | Open property · Switch org context · Create work order |
| Residents | Open profile · Impersonate · Message · Portal |
| Owners | Open profile · Impersonate · Owner portal |
| Vendors | Open profile · Impersonate · Vendor portal |
| Work Orders | Open WO · Jump to maintenance |
| Messages / threads | Open thread / inbox |
| Leases | Open lease · Related resident / unit |
| Payments / charges | Open financial record |
| Audit Logs | Open Audit Viewer filtered to match |

Duplicate “Organizations” in product ask is intentional emphasis — search treats org as a first-class entity once.

### Behavior

| Rule | Detail |
| --- | --- |
| Scope | Master Admin only; cross-org by default with clear org labels on results |
| Empty query | Show recent destinations + Quick Actions shortcuts |
| Partial failure | Return available entity groups; label failed groups |
| Privacy | No results for users without `master_admin`; server-side enforcement |
| Reuse | May extend shell Command Center indexing; HQ search is allowed to be broader |

### Slice guidance

| Slice | Search scope |
| --- | --- |
| A | Organizations, people (managers/owners/residents/vendors), properties — scaffold UI + best-effort queries |
| B | + migration jobs, setup status hooks |
| C | + work orders, messages, leases, payments, audit log hits |

---

## Quick Actions

One-click (or one-sheet) actions from home. Prefer launching existing flows over building parallel create UIs.

### Catalog

| Action | Status | Target flow |
| --- | --- | --- |
| New Organization | Extend / New | Org create → optionally enter New Client Wizard |
| Import Client | Exists | `/migration/new` (ensure active org; prompt if missing) |
| Impersonate User | Exists | `/master-admin/impersonation` with search focused |
| Open Any Portal | Exists | Portal Test Mode launcher / `/portal` |
| Send Announcement | Exists | `/communications/new` (org-scoped) |
| Create Property | Exists | Property create route (org-scoped) |
| Create Resident | Exists | Resident / tenant create (org-scoped) |
| Create Work Order | Exists | `/maintenance/new` (org-scoped) |
| Launch Demo | Extend | Seed demo data → Portal Test Mode or demo org walk |

### Rules

1. Org-scoped actions require an active organization; otherwise prompt to select org (do not fail silently).  
2. Destructive or high-impact actions (seed reset, impersonation) keep existing confirmations / banners from ADMIN-001.  
3. Quick Actions never bypass `master_admin` or ADMIN-001 audit rules.  
4. “Launch Demo” must remain clearly labeled as demo / test — never confuse with a real customer session.

### Home vs workspace

| Surface | Actions shown |
| --- | --- |
| Home | Full primary catalog (above) |
| Onboarding workspace | New Organization, Import Client, Invite*, Seed Demo |
| Support workspace | Impersonate, Open Any Portal, Emergency Login |
| Operations workspace | Create Property / Resident / WO, Send Announcement |

---

## New Client Wizard (Quick Action + Onboarding)

Orchestration only — does not replace MIG-001 or PX-006:

```
Create / select Organization
    → Organization Setup (/setup)
    → Import Existing Software (/migration) [optional]
    → Invite Team / Owners / Residents
    → Seed Demo Data [optional]
    → Handoff checklist (open Ops, portals, notes)
```

Designed in Slice B; Slice A may deep-link the steps as separate Quick Actions.
