# 01 — Problem and Vision

**Package:** ADMIN-003  
**Status:** Draft

---

## Problem

Master Admin today is a **thin console hub**: a short list of cards linking to Dashboard Switcher, Provider Status, Testing Utilities, System Health, and Feature Flags. Impersonation Center exists in the sidebar but is easy to miss. Migration, setup / onboarding, communications, and daily ops live elsewhere under different capabilities and routes.

Daily founder / platform-admin reality:

1. Migrate or onboard a Design Partner from another PMS  
2. Seed or launch a demo  
3. Play any role / open any portal  
4. Check whether systems and integrations are healthy  
5. Jump into a customer org to support them  
6. Invite owners, residents, or team  
7. Scan what needs attention across the platform  

Today that requires **remembering routes**, switching org context, and hunting through menus. The hub does not behave like headquarters.

---

## Vision

`/master-admin` is the **Operations Center** — the place the Master Admin lands and stays oriented from.

It is mission control for:

| Job | Outcome |
| --- | --- |
| Build | Flags, seed, certification, branding / email / push tooling |
| Support | Impersonation, portal testing, emergency login, audit / errors |
| Operate | Platform health, integrations, alerts, jobs, live KPIs |
| Demonstrate | Demo mode, seed data, portal walks, founder / trial accounts |
| Grow | New client wizard, migration, invites, Design Partner tracking |

Success is measured by **time-to-action**, not by how many cards exist:

- Under 5 seconds to know what needs attention  
- One tap from HQ to any workspace tool  
- One search to find any org, person, property, or operational object in scope  
- One-click Quick Actions for the highest-frequency jobs  

---

## Audience

| Role | Use |
| --- | --- |
| Founder / CEO (Master Admin) | Daily headquarters |
| Platform operator (Master Admin) | Support, demos, onboarding, health |
| Non–Master Admin users | **No access** — unchanged |

---

## Success definition

ADMIN-003 succeeds when a Master Admin can run a full workday from HQ without:

- Opening a bookmark list of internal URLs  
- Asking “where is migration / impersonation / flags?”  
- Treating `/master-admin` as a dead-end link page  

Pass criteria: [08-pass-criteria.md](./08-pass-criteria.md).

---

## Explicit non-vision

- A second PM Operations Center for all users  
- A generic analytics dashboard with no actionability  
- Replacing product surfaces (Maintenance, Financials, etc.) — HQ deep-links and orchestrates; it does not fork those products  
