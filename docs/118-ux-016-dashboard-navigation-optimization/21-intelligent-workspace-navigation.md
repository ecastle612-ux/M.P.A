# 21 — Intelligent Workspace Navigation (Slice C)

**Package:** UX-016  
**Slice:** C  
**Status:** ✅ **Authorized** (see [20](./20-slice-c-authorization.md))  
**Date:** 2026-08-05  
**Constraint:** Presentation, organization, and navigation chrome only.

---

## Philosophy

Every primary nav item must answer:

> Why would I click this right now?

If it does not support an active workflow, it does not belong in primary navigation.

---

## Universal sidebar structure

| Order | Group | Role |
|------:|-------|------|
| 1 | **Dashboard** | Always first — user’s home (`/dashboard` or HQ home) |
| 2 | **My Work** | Highest-priority work destinations |
| 3 | **Operations** | Property · Maintenance · Leasing · Residents · Vendors · Inspections · Work Orders |
| 4 | **Financial** | Accounting · invoices/payments/expenses/reports (existing financial routes) |
| 5 | **Documents** | Vault · leases · related document surfaces |
| 6 | **Communication** | Messages · announcements · activity · notifications settings entry |
| 7 | **Analytics** | KPIs / reports / performance (existing report surfaces) |
| 8 | **Administration** | Users/team · orgs · billing · settings · integrations · flags (entitled) |

Empty groups (no entitled items) are omitted — never show locked teasers.

### My Work mapping (existing hrefs)

| Label | Existing destination |
|-------|----------------------|
| Assigned Today | `/inbox` |
| Waiting on Me | `/inbox` (ops queue) |
| High Priority | `/maintenance` |
| Scheduled Today | `/facility/calendar` (when entitled) else `/inbox` |
| Completed Today | `/activity` |

Role / entitlement filters still apply via existing capability/module fields.

---

## Contextual navigation

### Property context (`/properties/:propertyId…`)

Replace the generic secondary emphasis with property-focused links:

| Label | Existing pattern |
|-------|------------------|
| Overview | `/properties/:id` |
| Residents | `/tenants?propertyId=` |
| Maintenance | `/maintenance?propertyId=` |
| Leases | `/leases` (portfolio; property filter when already supported in UI) |
| Documents | `/settings/documents` |
| Financial | `/financials/reports?propertyId=` |
| Activity | `/activity` |
| Settings | `/properties/:id` (property page settings region) |

### Vendor context (`/vendors/:vendorId…`)

| Label | Existing pattern |
|-------|------------------|
| Jobs | `/vendors/:id` / `/maintenance` |
| Invoices | `/financials/expenses` |
| Messages | `/communications/inbox` |
| Documents | `/settings/documents` |
| Performance | `/vendors/:id` |

No new nested route trees.

---

## Favorites & Recent

- Reuse `mpa_command_center_favorites` / `mpa_command_center_recents`
- Surface Favorites near top of desktop sidebar + mobile drawer
- Recent: recently viewed destinations already recorded by Command Center tracker

Pin targets are existing destinations (properties, orgs, dashboards, reports, documents, vendors) as already favoritable via Command Center keys.

---

## Global search

Existing Command Center remains SoT. Slice C polishes:

- Command-first copy (“Create Work Order”, “Invite User”, “New Lease”, “Add Property”)
- Navigation labels aligned to workspace IA
- No new search APIs

---

## Quick Create

Persistent create control (desktop FAB / mobile bottom-adjacent) listing existing create hrefs:

- `/maintenance/new`
- `/leases` / lease create entry already entitled
- `/tenants/new`
- `/settings/documents` (upload via vault)
- `/settings/team` (invite)
- `/properties/new`

Hidden for Master Admin–only shell when PM create routes are not relevant (existing pattern).

---

## Mobile bottom navigation

| Slot | Destination / action |
|------|----------------------|
| Dashboard | `/dashboard` (or HQ home) |
| My Work | `/inbox` |
| Search | Open Command Center (`mpa:open-command-center`) |
| Notifications | Open Notification Center control / focus |
| Profile | `/profile` |

Everything else remains in the organized drawer.

---

## Accessibility

- Keyboard reachable controls  
- `aria-current` on active items  
- Focus-visible rings  
- Respect `prefers-reduced-motion`  
- Screen-reader labels on icon-only bottom nav / FAB  

---

## Preserve

No changes to business logic, routing tables, permissions, APIs, database, security, or workflows.
