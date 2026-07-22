# 04 — Workspace Catalog

**Package:** ADMIN-003  
**Status:** Draft

Inventory status:

| Status | Meaning |
| --- | --- |
| **Exists** | Deep-link or wrap a current route / API |
| **Extend** | Partial surface needs Master Admin framing or cross-org scope |
| **New** | Net-new Master Admin surface (design now; implement per phasing) |
| **Future** | Designed in IA; deferred unless Approve expands slice |

---

## PLATFORM

| Item | Status | Target / notes |
| --- | --- | --- |
| Platform Health | Extend | `/master-admin/health` — expand beyond org table counts |
| Production Status | New / Future | Env readiness, deploy channel summary (ties PR packages; not fake green lights) |
| Integrations | Exists | `/master-admin/providers` (+ `/settings/integrations` patterns) |
| Notifications | Extend | `/api/notifications/ops` + settings — Master Admin ops panel |
| Deployments | Future | Deploy / release visibility; out of Slice A–C unless separately approved |
| Audit Logs | New | Browseable Audit Viewer (ADMIN-001 writes today; no browse UI) |
| Background Jobs | Future / Extend | Migration jobs exist under `/migration`; full jobs console deferred |
| System Alerts | New | Aggregated alerts feeding Attention strip |

---

## CUSTOMERS

| Item | Status | Target / notes |
| --- | --- | --- |
| Organizations | Extend | Impersonation Center org list → full Organizations HQ |
| Property Managers | Extend | Directory filtered by role / membership |
| Owners | Extend | Directory + deep-link owner portal / impersonate |
| Residents | Extend | Directory + deep-link resident portal / impersonate |
| Vendors | Extend | Directory + deep-link vendor portal / impersonate |
| Search Everyone | New / Extend | HQ Global Search + Impersonation people search |
| Client Health | New / Future | Scoring / signals per org; advanced scoring deferred (Slice C+) |
| Active Sessions | New | Master Admin effective sessions + (later) notable user sessions |

---

## ONBOARDING

| Item | Status | Target / notes |
| --- | --- | --- |
| New Client Wizard | New | Orchestrates org → setup → import → invite → seed → handoff |
| Organization Setup | Exists | `/setup` (PX-006) |
| Import Existing Software | Exists | `/migration` · `/migration/new` (MIG-001 / MX-001) |
| Migration Status | Extend | `/api/migration/dashboard` + job list framed for Master Admin |
| Invite Team | Exists | `/settings/team` · org invitations API |
| Invite Owners | Extend | Invitation flows with owner role targeting from HQ |
| Invite Residents | Extend | Invitation / resident lifecycle entry from HQ |
| Seed Demo Data | Exists | `/master-admin/testing` · `POST /api/master-admin/seed` |

---

## SUPPORT

| Item | Status | Target / notes |
| --- | --- | --- |
| Impersonation Center | Exists | `/master-admin/impersonation` (ADMIN-001) |
| Portal Testing | Exists | Portal Test Mode · `/portal` CTAs · `POST /api/master-admin/portal-test` |
| Emergency Login | Exists | Emergency Support Mode / portal emergency launch (ADMIN-001) |
| Audit Viewer | New | Read path for impersonation / support audit events |
| Session Viewer | New | Active / recent Master Admin effective sessions |
| Error Reports | New | Operator-facing error queue (Slice C) |
| Activity Timeline | New | Per-org or per-user support timeline (Slice B/C) |

---

## OPERATIONS

Deep-links into product (Exists). HQ does not fork these apps.

| Item | Status | Target |
| --- | --- | --- |
| Dashboard | Exists | `/dashboard` |
| Properties | Exists | `/properties` |
| Residents | Exists | Tenants / residents product routes |
| Maintenance | Exists | `/maintenance` |
| Messages | Exists | `/communications` · inbox |
| Financials | Exists | `/financials` |
| Reports | Exists | Financial / reporting routes |
| AI Operations | Exists | `/ai-operations` |

Also: existing `/master-admin/dashboards` switcher becomes an OPERATIONS convenience panel (may fold into workspace).

---

## SALES

| Item | Status | Target / notes |
| --- | --- | --- |
| Design Partners | New | List / status of Design Partner orgs |
| Founder Accounts | New | Privileged / internal accounts inventory |
| Trial Companies | New | Trial org tracking |
| Demo Mode | Extend | Testing utilities + Portal Test Mode + demo seed |
| CRM | Future | Explicitly future; not silent scope |
| Customer Notes | New | Freeform notes on orgs (Slice D) |

---

## DEVELOPMENT

| Item | Status | Target / notes |
| --- | --- | --- |
| Feature Flags | Exists | `/master-admin/flags` |
| Testing Utilities | Exists | `/master-admin/testing` |
| Seed Data | Exists | Same testing / seed APIs |
| Certification Center | Extend | Trust / portal certification surfaces (`/portal/certification`, trust APIs) |
| Performance | Extend / Future | Link EP-019 / performance tooling when available |
| Branding | Exists (deep-link) | Brand / logo settings routes |
| Email | Exists (deep-link) | Email / EML settings and templates entry |
| Push Notifications | Exists (deep-link) | Notification settings + test send ops |

---

## ANALYTICS

Live KPIs on home + dedicated workspace panel.

| KPI | Status | Likely source |
| --- | --- | --- |
| Organizations | Extend | Health / org directory counts |
| Properties | Extend | Health + dashboard APIs |
| Residents | Extend | Health + dashboard APIs |
| Occupancy | Extend | `GET /api/dashboard` |
| Late Rent | Extend | Financial dashboard |
| Open Work Orders | Extend | Dashboard / maintenance |
| Unread Messages | Extend | Messaging / notifications ops |
| Online Users | New | Requires session signal (Slice C) |
| Revenue | Extend | `GET /api/financial/dashboard` |
| API Health | Extend | Providers + future probes |
| Integrations | Exists | Provider status |
| Recent Errors | New | Error Reports (Slice C) |

---

## Sidebar convergence (post-Approve)

Current sidebar items map into workspaces:

| Today | Workspace |
| --- | --- |
| Master Admin (hub) | Home |
| Dashboard Switcher | OPERATIONS |
| Provider Status | PLATFORM |
| Testing Utilities | DEVELOPMENT |
| Impersonation Center | SUPPORT |
| System Health | PLATFORM |
| Feature Flags | DEVELOPMENT |

Migration and Setup are **not** in the Master Admin sidebar today — Onboarding workspace corrects that.
