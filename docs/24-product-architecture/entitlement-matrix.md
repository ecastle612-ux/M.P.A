# Entitlement Matrix

**Status:** Approved  
**Parent:** [24 Product Architecture](./index.md)

Entitlements gate **what an organization may use**.  
Permissions gate **which users** may use an entitled capability.

Foundation today (`identity:*`, `organization:*`, etc.) is Shared Platform only. Product entitlements below are the target dictionary.

---

## Layers

```
Subscription SKU
      ↓ enables
Entitlement keys (org)
      ↓ allows evaluation of
Permission grants (role / user)
      ↓ allows
UI nav + API + RLS
```

Fail closed at every layer.

---

## Entitlement Key Dictionary (Target)

### Shared Platform

| Key | Meaning |
|-----|---------|
| `platform.org` | Organization foundation |
| `platform.documents` | Documents |
| `platform.communications` | Communications |
| `platform.search` | Search |
| `platform.quick_actions` | Quick Actions |
| `platform.launcher` | Workspace Launcher |
| `platform.guided_setup` | Guided Setup |
| `platform.billing_self` | View/manage own subscription |
| `platform.marketplace_vendor_consume` | Assign/use marketplace vendors |
| `platform.ai` | Embedded AI features |

### Property Manager

| Key | Meaning |
|-----|---------|
| `pm.mission_control` | PM Mission Control |
| `pm.properties` | Properties & units |
| `pm.residents` | Residents |
| `pm.leasing` | Leasing pipeline |
| `pm.maintenance` | Residential maintenance |
| `pm.vendors` | Vendor ops desk |
| `pm.financial_operations` | Rent/charges/collections |
| `pm.reports_owner` | Owner reporting |
| `pm.portal_owner` | Owner portal enablement |
| `pm.portal_tenant` | Tenant portal enablement |

### Facility Operations

| Key | Meaning |
|-----|---------|
| `facility.mission_control` | Facility Mission Control |
| `facility.operations` | Facility corrective ops |
| `facility.assets` | Assets |
| `facility.inventory` | Inventory |
| `facility.parts` | Parts |
| `facility.preventive` | Preventive Maintenance |
| `facility.inspections` | Facility inspections |
| `facility.safety` | Safety |
| `facility.compliance` | Facility compliance |
| `facility.building_systems` | Building Systems |
| `facility.capital_projects` | Capital Projects (future — off by default) |

### Master Admin (operator grants, not org SKU)

| Key | Meaning |
|-----|---------|
| `admin.*` | Operator capabilities (support, subscriptions, trust, flags, audit) |

---

## SKU → Entitlement Grants

| Entitlement | Property Manager | Facility Operations | Complete |
|-------------|:----------------:|:-------------------:|:--------:|
| All `platform.*` (except notes) | ● | ● | ● |
| `platform.marketplace_vendor_consume` | ● | ○ optional | ● |
| All `pm.*` | ● | — | ● |
| All `facility.*` except capital | — | ● | ● |
| `facility.capital_projects` | — | future flag | future flag |

○ optional = enable when Facility org uses external vendors

---

## Permission Namespace Alignment

Future permission capabilities should nest under the same prefixes:

Examples:

- `pm.maintenance:read` / `pm.maintenance:assign`
- `facility.assets:write`
- `platform.documents:read`

Do not create permissions for modules the org is not entitled to use.

---

## UI / API Enforcement Points

| Surface | Entitlement check |
|---------|-------------------|
| Sidebar assembly | Hide modules |
| Workspace Launcher | Hide products/workspaces |
| Mission Control widgets | Only entitled attention types |
| Guided Setup | Product-specific steps |
| Search / Quick Actions | Filter catalog |
| Routes / middleware | Reject unentitled namespaces |
| Edge Functions / mutations | Reject unentitled operations |
| RLS | Org entitlement claims or join tables (design TBD) |
| Billing page | Show included vs upgrade modules |

---

## Relationship to Existing Foundation

| Existing | Remains | Does not replace |
|----------|---------|------------------|
| `FOUNDATION_CAPABILITIES` | Shared identity/org | Product entitlements |
| `role_permission_grants` | User/role permissions | SKU grants |
| `organization_permission_overrides` | Exception permissions | Subscription assignment |

New artifacts required after approval (design only until then): `subscriptions`, `entitlement_grants`, SKU catalog.

---

## Financial Operations Entitlement

`pm.financial_operations` is part of Property Manager and Complete.

**Implementation of Financial Operations remains stopped** until Product Architecture approval and a dedicated Financial Operations design package pass the gate.
