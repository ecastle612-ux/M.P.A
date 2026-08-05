# 17 — Slice B Authorization

**Package:** UX-016  
**Slice:** B — Master Admin Experience (role-surface specialization)  
**Status:** ✅ **AUTHORIZED**  
**Phrase:** `AUTHORIZE UX-016 SLICE B – Master Admin Experience`  
**Date:** 2026-08-05  
**Depends on:** [12 — Approval record](./12-approval-record.md) · [16 — Slice A](./16-slice-a-authorization.md) · [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Accepted**)  
**Design SoT:** [18 — Master Admin Experience](./18-master-admin-experience.md) · [03 — Role dashboard specializations](./03-role-dashboard-specializations.md) (Support / Master Admin) · [02 — Dashboard standard](./02-dashboard-standard.md)

---

## Binding phrase (issued)

```
AUTHORIZE UX-016 SLICE B – Master Admin Experience
```

> Phrase issued. Implementation may begin **only** within the scope below.  
> UX-016 Slices C–D remain **locked**.  
> Do **not** modify authentication, authorization, routing tables, APIs, database, or security.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| UX-016 Approved | [12](./12-approval-record.md) | ✅ |
| ADR-032 Accepted | [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) | ✅ |
| Slice A Authorized + shipped | [16](./16-slice-a-authorization.md) · Universal Dashboard Framework | ✅ |
| Canopy / Experience Architecture | Approved | ✅ |
| ADMIN-001 / ADMIN-003 substrates | Portal Test Mode · Impersonation · Mission Control | ✅ |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice B?** ❌ **None.**

---

## 2. Authorization scope

### In scope (Slice B — Master Admin Experience)

| Deliverable | Binding source |
|-------------|----------------|
| **Expanded Master Admin Portal Launcher** — launch cards for every supported role/surface, grouped (Operations · Maintenance · Leasing · Residents · Owners · Accounting · Executive · Support · Internal) | [18](./18-master-admin-experience.md) |
| **Card actions** — every portal card exposes **Open Portal**, **View As**, and **Launch in Test Mode** using existing portal-test / impersonation / deep-link routes (no new permission model) | [18](./18-master-admin-experience.md) · ADMIN-001 |
| **Mission Control redesign** — remount `/master-admin` onto the UX-016 Universal Dashboard Framework as the platform command center | [02](./02-dashboard-standard.md) · [03](./03-role-dashboard-specializations.md) · [18](./18-master-admin-experience.md) |
| **Mission Control content** — Greeting · Platform Health · Immediate Attention · Today’s Mission · Organizations · Users · Properties · Open Work Orders · Leases · Support · Billing · Integrations · Recent Activity (presentation mapping of existing Mission Control / dashboard signals) | [18](./18-master-admin-experience.md) |
| **Dashboard consistency** — Master Admin home uses the same six-section hierarchy established in Slice A | [02](./02-dashboard-standard.md) · Slice A framework |

### Implementation boundaries

1. **Presentation and navigation enhancement only** — no business logic, permission, entitlement, or security model changes.  
2. **Reuse existing** portal-test (`resident` \| `owner` \| `manager`), impersonation start/end/event, search, and Mission Control snapshot signals.  
3. **Do not** add routes, APIs, schema, RLS, or AUTH dashboard reassignment.  
4. Role cards without a dedicated portal deep-link to the closest **existing** product / HQ surface; Test Mode uses portal-test only where the contract already supports the portal.  
5. View As navigates to Impersonation Center (existing ADMIN-001) — does not invent a parallel impersonation engine.  
6. Other role homes (PM already on Slice A; Technician, Leasing, Resident, Vendor, Owner, Support end-user) remain available for later Slice B follow-ons unless separately authorized with a narrowed phrase.  
7. Sidebar regrouping remains Slice C; Notification Center / AI briefing remains Slice D.

### Includes (explicit)

- Portal launcher catalog + Master Admin hub presentation  
- Mission Control → Universal Dashboard Framework adapter + remount  
- Surface Switcher (`/master-admin/dashboards`) aligned to the same launcher catalog  
- Unit tests for Master Admin view-model mapping  
- Authorization + design + implementation summary docs under this package  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| Auth / authorization / RLS / capability matrix changes | Forbidden in UX-016 |
| New portal-test portal enums / API contract expansion | Separate authorize (would change security surface) |
| New routes or AUTH assigned-home changes | Forbidden |
| Schema / database / new APIs | Forbidden |
| Sidebar workflow regrouping | Slice C |
| Notification Center Critical/Today/Later · AI daily briefing | Slice D |
| Full rewrite of every non–Master Admin role home in this phrase | Later Slice B follow-on authorize if needed |
| Production permission elevation via UI | Forbidden — Test Mode / View As only through existing ADMIN-001 |

---

## 4. Acceptance criteria (Slice B) — MB-01 … MB-10

| ID | Criterion |
|----|-----------|
| **MB-01** | Portal Launcher lists every required role/surface card under the specified groups. |
| **MB-02** | Every portal card exposes Open Portal · View As · Launch in Test Mode. |
| **MB-03** | Open Portal deep-links to an existing surface (no new routes). |
| **MB-04** | View As routes to Impersonation Center (existing) without changing production permissions. |
| **MB-05** | Launch in Test Mode uses existing portal-test for resident/owner/manager; other cards do not invent new test-mode APIs. |
| **MB-06** | Mission Control (`/master-admin`) uses Universal Dashboard Framework section order. |
| **MB-07** | Mission Control surfaces Greeting, Platform Health signal, Immediate Attention, Today’s Mission, platform/org insights (Organizations · Users · Properties · Open Work Orders · Leases · Support · Billing · Integrations), and Recent Activity from existing signals. |
| **MB-08** | No changes to authentication, authorization, routing tables, APIs, database, or security contracts. |
| **MB-09** | Slice A Ops `/dashboard` framework remains green; Master Admin is an additional consumer. |
| **MB-10** | Docs: authorization · Master Admin design · implementation summary recorded; Slices C–D stay locked. |

---

## 5. Success standard

The Master Admin should feel like the operator of the entire M.P.A. platform, with immediate visibility into system health and one-click access to every role and dashboard in Test Mode — without changing production permissions.
