# 02 — Workflow Audit (Priority 1)

**Package:** UX-009  
**Method:** For each major surface — 90% actions, immediate info, secondary info, rare → More/accordion.  
**Constraint:** Actions must already exist as routes/permissions; toolbelt only **relocates** entry points.

---

## Dashboard

| | |
| --- | --- |
| **90% actions** | Triage urgent WO · Open unread messages · Complete approvals · Jump to overdue rent / maintenance · Create (property / WO / resident) |
| **Immediate** | Today’s priorities, urgent count, overdue maintenance, unread messages, outstanding approvals |
| **Secondary** | Analytics widgets, AI ops embed, migration health, deep portfolio charts |
| **Rare → disclose** | Full ops score detail, provider health strips, secondary KPIs |

## Properties (list)

| | |
| --- | --- |
| **90% actions** | Open property · Add property · Search/filter · Jump to units/residents for a property |
| **Immediate** | Property name, address, unit/resident counts, open WO signal |
| **Secondary** | Financial summaries, QR, media |
| **Rare → disclose** | Bulk tools, advanced filters, export |

## Property (detail)

| | |
| --- | --- |
| **90% actions** | Add unit · Add resident · Create WO · Message/announce · View units · View financial snapshot |
| **Immediate** | Name, address, status, occupancy signal, open WO count |
| **Secondary** | Timeline, documents, facility records, QR, deep financials |
| **Rare → disclose** | Advanced settings, full repair history, vault browser |

**Toolbelt:** Add Unit · Add Resident · Inspection (or WO) · Report · More  

## Units (list + detail)

| | |
| --- | --- |
| **90% actions** | Open unit · Add unit · Assign/move resident · Create WO |
| **Immediate** | Unit label, status, current resident, rent signal |
| **Secondary** | Lease history, documents, assets |
| **Rare → disclose** | Bulk generator controls (list), full facility timeline |

## Residents / Tenants (list + detail)

| | |
| --- | --- |
| **90% actions** | Message · Collect rent / view charges · Create WO · View/open lease · Open unit/property |
| **Immediate** | Name, unit, lease status, balance/alert, contact |
| **Secondary** | Documents, lifecycle history, preferences |
| **Rare → disclose** | Audit/advanced panels, bulk lifecycle tools |

**Toolbelt:** Message · Collect Rent · Maintenance · Lease · More  

## Applicants

| | |
| --- | --- |
| **90% actions** | Open applicant · Advance status · Screening · Message · Convert / lease path |
| **Immediate** | Name, status, property/unit target, screening signal |
| **Secondary** | Documents, full history |
| **Rare → disclose** | Low-frequency admin tools |

## Maintenance (list + WO detail)

| | |
| --- | --- |
| **90% actions** | Open WO · Create WO · Assign vendor · Complete / progress · Add photos · View timeline |
| **Immediate** | Title, priority/status, property/unit, assignee, age |
| **Secondary** | Full timeline, cost, related facility records |
| **Rare → disclose** | Advanced workflow admin, deep audit |

**Toolbelt:** Assign Vendor · Complete · Timeline · Photos · More  

## Messages / Communications

| | |
| --- | --- |
| **90% actions** | Open thread · Reply/send · Compose · Filter unread |
| **Immediate** | Unread, latest preview, counterparty |
| **Secondary** | Announcement analytics, QR enrollment |
| **Rare → disclose** | Readership deep panels, template libraries |

## Accounting / Financials

| | |
| --- | --- |
| **90% actions** | Record payment · View charges · Open report · Generate statement |
| **Immediate** | Aging / due signal, recent activity, primary CTA |
| **Secondary** | Full transaction tables, report library |
| **Rare → disclose** | Advanced report configs, secondary ledgers |

## Reports

| | |
| --- | --- |
| **90% actions** | Open/generate common report · Filter period · Export/share if exists |
| **Immediate** | Report picker + period + generate |
| **Secondary** | Historical runs, previews |
| **Rare → disclose** | Advanced parameter sets |

## Settings

| | |
| --- | --- |
| **90% actions** | Org profile · Team · Notifications · Integrations status |
| **Immediate** | Section nav + current section purpose |
| **Secondary** | Document vault, appearance |
| **Rare → disclose** | Master-admin-only / low-frequency ops |

## AI Operations (dedicated route)

| | |
| --- | --- |
| **90% actions** | Ask contextual question · Resume conversation · Run suggested prompt |
| **Immediate** | Composer + context label (post UX-009: also reachable via floating assistant) |
| **Secondary** | Prompt library, activity feed, metrics |
| **Rare → disclose** | Full library / history (Pattern: do not embed AI into every page body) |

---

## Audit rule for implementation

Before changing a page: fill the four rows above (or confirm this table), then apply [03-pattern-system.md](./03-pattern-system.md). If a “90% action” has no existing route/permission, **do not invent a feature** — omit from toolbelt or link to nearest existing surface.
