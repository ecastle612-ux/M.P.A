# 02 — Information Architecture

**Package:** ADMIN-003  
**Status:** Draft

---

## Primary route

| Route | Role |
| --- | --- |
| `/master-admin` | Operations Center home (mission control) |
| `/master-admin/*` | Workspace destinations (existing + new under this package) |

All routes remain gated by `master_admin` (same as UX-001 Slice A / ADMIN-001).

---

## Composition model

```
┌─────────────────────────────────────────────────────────────┐
│ Shell header (org switcher · ADMIN-002 Role Switcher · …)   │
├──────────────┬──────────────────────────────────────────────┤
│ Workspace    │ Mission control / workspace content          │
│ rail         │  Global Search                               │
│              │  Attention strip                             │
│ PLATFORM     │  Live KPI strip                              │
│ CUSTOMERS    │  Quick Actions                               │
│ ONBOARDING   │  Active workspace panel / queues             │
│ SUPPORT      │                                              │
│ OPERATIONS   │                                              │
│ SALES        │                                              │
│ DEVELOPMENT  │                                              │
│ ANALYTICS    │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Rules

1. **One composition** — First viewport is a single mission-control surface, not a grid of equal cards.  
2. **Workspace rail is persistent** on `/master-admin` and workspace child routes under this package.  
3. **Deep-links into product** (e.g. `/dashboard`, `/migration`) may leave the rail; return is always one click via sidebar “Master Admin” or browser back to HQ.  
4. **Sidebar Master Admin section** remains for discoverability; IA should converge labels with workspace names over time (no conflicting duplicate destinations).  
5. **ADMIN-002 Role Switcher** lives in shell chrome globally — it does not replace Support workspace tools.

---

## Workspace definitions

| ID | Label | Job |
| --- | --- | --- |
| `platform` | PLATFORM | Keep the product running |
| `customers` | CUSTOMERS | Know and reach every customer entity |
| `onboarding` | ONBOARDING | Bring clients from zero → live |
| `support` | SUPPORT | Reproduce, assist, emergency access |
| `operations` | OPERATIONS | Enter day-to-day product surfaces |
| `sales` | SALES | Design Partners, trials, demos, notes |
| `development` | DEVELOPMENT | Build, certify, configure platform tooling |
| `analytics` | ANALYTICS | Live KPIs and trend attention |

Full item catalog: [04-workspace-catalog.md](./04-workspace-catalog.md).

---

## Navigation principles

| Principle | Detail |
| --- | --- |
| No hunting | Every daily tool is in a workspace or Quick Action |
| No route memory | Labels are plain language (“Import Existing Software”, not job IDs) |
| Prefer orchestration | New Client Wizard sequences existing setup + migration + invite + seed |
| Honest inventory | Items marked Exists / Extend / New; deferred items labeled Future, not fake buttons |

---

## Coexistence

| Surface | Rule |
| --- | --- |
| Shell sidebar | Keep Master Admin entry; may collapse to “Operations Center” + key shortcuts after Approve |
| ADMIN-001 banner | Remains authoritative during Test Mode / Impersonation |
| ADMIN-002 switcher | Header-only role / portal switch; links into Impersonation Center when needed |
| PM Operations Center (`/dashboard`) | Unchanged for PMs; Master Admin reaches it via OPERATIONS workspace |
| Command Center (shell) | Patterns may be reused for Global Search; HQ search is Master Admin–scoped and richer |

---

## Mobile

- Workspace rail becomes a horizontal chip strip or “Workspaces” sheet — one tap from HQ.  
- Attention + KPIs stack vertically; Quick Actions become a compact action row.  
- Floating AI launcher and mobile drawer rules from ADMIN-001 / shell stability docs still apply.  
- Prefer sheets for Quick Actions that would open multi-step flows.

---

## Org context

| Context | Use |
| --- | --- |
| **Platform (cross-org)** | Attention aggregates, Analytics KPIs, Customers directory, Sales lists |
| **Active organization** (shell org switcher) | Seed, health table counts, migration jobs, setup, ops deep-links that are org-scoped |

HQ must always show which context applies to the current panel (platform vs active org). Switching org in the shell updates org-scoped panels without leaving HQ when possible.
