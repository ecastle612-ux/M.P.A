# Property Manager — Definitive Module Map

**Status:** Approved  
**SKU:** Product 1 — Property Manager  
**Also included in:** Product 3 — Complete Platform  
**Parent:** [24 Product Architecture](./index.md)

---

## Included Modules

| Module | Purpose | Primary workflows |
|--------|---------|-------------------|
| Organizations | Company, team, roles (platform) | Org setup, invites |
| Properties | Portfolio properties & units | Property Setup |
| Residents | People living in units (PM operational view) | Move In, Rent, Maintenance, Move Out |
| Leasing | Vacancy → lease | Marketing, Application, Screening, Lease, Move In |
| Maintenance | Unit/resident work orders | Maintenance, Turnover make-ready |
| Vendors | Assign and manage service providers | Maintenance, Vendor Marketplace ops |
| Financial Operations | Rent, charges, collections, PM money ops | Rent Collection, Deposit accounting |
| Documents | Leases, agreements, evidence | All PM workflows |
| Communications | Threads, notices, notifications | All PM workflows |

---

## Navigation (Target)

Product-area navigation for a Property Manager subscription (Complete adds Facility group — see Navigation Map).

```
PROPERTY MANAGER
├── Mission Control          ← default home (Operations Console)
├── Properties
│     └── Units
├── Residents
├── Leasing
│     ├── Pipeline
│     ├── Listings
│     ├── Applications
│     └── Leases
├── Maintenance
│     ├── Work Orders
│     └── Make-Ready / Turnover
├── Vendors
│     ├── Directory
│     └── Marketplace
├── Financial Operations
│     ├── Rent & Charges
│     ├── Collections
│     └── Ledgers (ops — not full GL)
├── Documents
├── Communications
├── Reports                  ← owner/ops reporting (not Mission Control)
└── Settings
      ├── Organization
      ├── Team & Permissions
      ├── Billing (plan visibility)
      └── Integrations
```

Global chrome (Shared): Workspace Launcher, Search (⌘K), Quick Actions, Notifications, Profile, Org switcher.

---

## Workspaces

| Workspace | Job | Entry |
|-----------|-----|-------|
| Mission Control | What needs attention now | Default home |
| Property Workspace | Single property deep work | Properties → open |
| Leasing Pipeline | Move vacancies to signed leases | Leasing |
| Maintenance Triage | Clear work orders | Maintenance |
| Collections Desk | Clear delinquency | Financial Operations |
| Vendor Desk | Assign / bid / pay vendors | Vendors |
| Owner Report Studio | Review & publish owner reports | Reports |
| Guided Setup | Activate first PM wins | First login / incomplete setup |

---

## Workflow Map (Canonical)

From Business Workflows (05), owned entirely by Property Manager unless noted:

```
Property Setup
     ↓
  Marketing
     ↓
 Application → Screening → Lease Signing
     ↓
  Move In
     ↓
Rent Collection (continuous) ←──┐
     ↓                          │
 Maintenance (continuous)       │
     ↓                          │
Vendor Assignment               │
     ↓                          │
Owner Reporting                 │
     ↓                          │
  Move Out ─────────────────────┘
     ↓
 Turnover → Marketing
```

| Workflow | Module home | Shared dependencies |
|----------|-------------|---------------------|
| Property Setup | Properties | Documents, Organizations |
| Marketing & Listing | Leasing | Properties, Documents |
| Application → Lease | Leasing | Documents, Communications, Residents |
| Move In | Leasing / Residents | Documents, Inspections (lease), Communications |
| Rent Collection | Financial Operations | Residents, Communications |
| Maintenance | Maintenance | Vendors, Documents, Communications |
| Vendor Marketplace | Vendors | Shared marketplace identity |
| Owner Reporting | Reports | Financial Operations, Maintenance, Documents |
| Move Out & Turnover | Leasing + Maintenance | Financial Operations (deposit), Documents |

---

## Explicitly Out of Product 1

| Capability | Belongs to |
|------------|------------|
| Assets / Inventory / Parts | Facility Operations |
| Preventive Maintenance (asset/system) | Facility Operations |
| Facility Inspections / Safety / Building Systems | Facility Operations |
| Capital Projects | Facility Operations (future) |
| Facility Mission Control | Facility Operations |
| Master Admin OS | Master Admin |

Residents requesting “maintenance” never enter Facility product navigation unless the org has Complete **and** the work is facility-typed.

---

## Portals Served by Property Manager Subscription

| Portal | Relationship |
|--------|--------------|
| Manager Portal | Primary Product 1 shell |
| Owner Portal | Enabled with PM/Complete; not separately sold |
| Tenant / Resident Portal | Enabled with PM/Complete |
| Vendor Portal | Enabled when marketplace/vendors used |

---

## Implementation Note

Financial Operations is **in** this module map commercially.  
**Implementation is stopped** until this Product Architecture package is approved and Financial Operations is re-gated Design → Document → Approve.
