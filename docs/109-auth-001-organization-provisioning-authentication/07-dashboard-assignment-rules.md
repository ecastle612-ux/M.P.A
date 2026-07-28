# 07 — Dashboard Assignment Rules

**Package:** AUTH-001  
**Status:** ✅ Approved with Amendments · Slice D ✅ **VALIDATED** ([46](./46-slice-d-validation.md) · **PASS**)

---

## Binding rule

```
Dashboards are NEVER user-selectable.

Subscription → Organization Type → Enabled Modules → Dashboard
  → Max Users / Properties / Storage / AI / Marketplace / Add-ons
```

Full capability chain: [26 — Subscription capability matrix](./26-subscription-capability-matrix.md).

```
Dashboard =
  f(Subscription SKU → Organization Type → Assigned Role → Permissions)
```


Any UI that lets a user “pick a portal” for themselves is a **defect** under AUTH-001 (ADMIN-001 Master Admin role switcher / impersonation is a Level 0 support tool, not end-user dashboard choice).

---

## Resolution algorithm

```
1. Authenticate principal
2. Resolve allowed organization memberships
3. Select active organization (single-org MVP default; multi-org switcher later)
4. Resolve membership role(s) + permissions in that org
5. Resolve authorization plane (ADR-003)
6. Map to Dashboard Surface
7. Apply entitlements (module may hide sections, not reassign dashboard family)
```

If multiple roles exist in one org, use **priority order** below unless Org Admin sets an explicit default role for that membership.

### Role priority (default)

1. Organization Administrator  
2. Assistant Manager / Property Manager staff  
3. Leasing Agent  
4. Facility Technician / Maintenance  
5. Owner (property-scoped)  
6. Vendor  
7. Tenant  

Product may Approve a different priority later; users still do not free-select.

---

## Surface map

| Organization type | Role | Dashboard surface |
|-------------------|------|-------------------|
| `property_owner` | Organization Administrator | Owner Dashboard |
| `property_management_company` | Organization Administrator | Property Manager Dashboard |
| `property_management_company` | Property Manager / Assistant Manager | Manager Dashboard |
| `property_management_company` | Leasing Agent | Leasing Dashboard |
| `property_management_company` | Facility Technician / Maintenance Staff | Technician Dashboard |
| `property_management_company` | Vendor (legacy membership only) | **No dashboard** — Vendor Portal retired; secure action links only (`/vendor-access` notice) |
| `property_management_company` | Tenant | Tenant Portal |
| `property_management_company` | Owner (subaccount) | Owner Dashboard |
| any | Disabled / archived membership | No dashboard (access denied) |

---

## Entitlements interaction

| Entitlement off | Effect |
|-----------------|--------|
| Module disabled | Hide/disable module routes inside assigned dashboard |
| Org suspended | Block all tenant dashboards |
| Setup incomplete | Org Admin forced into Setup Wizard shell |

Entitlements **do not** move a Tenant to Manager Dashboard.

---

## Deep links

Deep links must validate assigned surface. If a user opens a URL for a non-assigned dashboard family, redirect to their assigned home with a safe error — never silently elevate.
