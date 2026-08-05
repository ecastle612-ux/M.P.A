# 18 — Master Admin Experience (Slice B)

**Package:** UX-016  
**Slice:** B  
**Status:** ✅ **Authorized** (see [17](./17-slice-b-authorization.md))  
**Date:** 2026-08-05  
**Routes:** `/master-admin` (Mission Control) · `/portal` (Portal Launcher for Master Admin) · `/master-admin/dashboards` (Surface Switcher / launcher mirror)  
**Constraint:** Presentation only — ADMIN-001 / ADMIN-003 contracts preserved.

---

## Purpose

Make Master Admin the **platform operator command surface**:

1. Immediate visibility into platform health and attention  
2. One-click access to every role / dashboard  
3. View As and Test Mode without changing production permissions  

---

## 1. Portal Launcher

### Groups and cards (binding inventory)

| Group | Cards |
|-------|-------|
| **Operations** | Organization Admin · Property Manager · Regional Manager |
| **Maintenance** | Maintenance Manager · Maintenance Technician · Vendor |
| **Leasing** | Leasing Manager · Leasing Agent · Applicant |
| **Residents** | Resident |
| **Owners** | Owner |
| **Accounting** | Accounting Manager · Accounts Payable · Accounts Receivable |
| **Executive** | Executive Dashboard · Portfolio Dashboard |
| **Support** | Support Dashboard · Customer Success · Platform Operations |
| **Internal** | Mission Control · Platform Health · Feature Flags · Integrations · Audit Explorer |

### Card actions (every card)

| Action | Behavior |
|--------|----------|
| **Open Portal** | Navigate to the closest **existing** product or HQ route for that surface |
| **View As** | Navigate to Impersonation Center (`/master-admin/impersonation`) so the operator can select a real user — no parallel impersonation engine |
| **Launch in Test Mode** | Call existing `POST /api/master-admin/portal-test` when the card maps to `resident` \| `owner` \| `manager`; otherwise open the surface via Open Portal semantics and point operators to Impersonation / Testing utilities (no API enum expansion under this authorize) |

### Existing portal-test mapping (unchanged)

| Card | `MasterAdminPortal` |
|------|---------------------|
| Resident | `resident` → `/portal/tenant` |
| Owner | `owner` → `/portal/owner` |
| Property Manager | `manager` → `/portal/manager` |

All other cards use deep links + View As (Impersonation Center) only.

### Non-goals

- Do not add Vendor Portal (retired — Vendor Directory / tokenized access remain)  
- Do not change AUTH assigned homes  
- Do not expand portal-test contract without a security-sensitive authorize  

---

## 2. Mission Control → Universal Dashboard Framework

Mission Control remounts onto Slice A hierarchy:

```
1. Greeting
2. Immediate Attention
3. Today’s Mission
4. Quick Actions
5. Recent Activity
6. Insights          (below the fold)
```

### Content mapping (existing signals only)

| UX-016 section | Master Admin content |
|----------------|----------------------|
| Greeting | Operator name · active org · platform place signal · date · status line including **Platform Health** summary |
| Immediate Attention | Existing Mission Control attention queue (≤ 5 on home) |
| Today’s Mission | Recovery / commercial / support / health / portal-testing work counts derived from attention + KPI availability |
| Quick Actions | Open Any Portal · Impersonate User · Platform Health · Seed Demo · Integrations · Search org (existing catalog) |
| Recent Activity | Meaningful attention / health / support events already available (no new activity API) |
| Insights | Organizations · Users · Properties · Open Work Orders · Leases · Support · Billing · Integrations · Platform Health (below fold) |

Universal Search and Operational Workspaces remain available as supportive chrome **below** the framework sections (not replacing the hierarchy).

---

## 3. Consistency

- Same framework components as Ops `/dashboard` (Slice A)  
- Labels adapt; section order does not  
- Canopy / UX-012 tokens only  

---

## 4. Preserve

| Must not change |
|-----------------|
| Authentication |
| Authorization / capabilities |
| Routing tables / AUTH dashboard assignment |
| portal-test / impersonation API contracts |
| Database / RLS |
| Security model |
