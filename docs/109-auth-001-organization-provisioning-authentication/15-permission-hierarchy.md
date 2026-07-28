# 15 — Permission Hierarchy

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## Model

```
Level 0 Master Admin
  └── Control-plane capabilities (orgs, plans, modules, recovery, health)

Level 1 Organization Administrator
  └── Full tenant-plane administration inside ONE organization

Delegated staff roles
  └── Capability subsets + property scopes

External roles (Owner / Tenant / Vendor)
  └── Plane-specific access tables (ADR-003)
```

Capabilities are evaluated server-side (`evaluatePermission` / equivalent). UI hiding is not security.

---

## Level 0 capability groups (illustrative)

| Group | Examples |
|-------|----------|
| `platform:org:*` | create, suspend, reactivate, delete |
| `platform:billing:*` | assign plan, view SaaS metrics |
| `platform:modules:*` | enable/disable modules |
| `platform:recovery:org_admin` | recover Org Admin |
| `master_admin` | Gate for ADMIN-001 / ADMIN-003 |

Level 0 **does not** receive blanket `tenant:*` on all orgs.

---

## Organization Administrator capability groups

| Group | May |
|-------|-----|
| `org:users:*` | create, edit, disable, archive, unlock, reset password |
| `org:roles:*` | assign roles/permissions within catalog |
| `org:properties:assign` | assign property scopes |
| `org:settings:*` | company profile, branding, notifications |
| `org:billing:saas` | manage SaaS subscription via BILL-001 portal (if entitled) |
| `org:setup:*` | wizard completion |

### Hard bans

| Ban |
|-----|
| Cannot grant `master_admin` |
| Cannot access other organizations |
| Cannot change usernames |
| Cannot read password hashes / plaintext |
| Cannot disable the last primary Org Admin without Level 0 transfer |

---

## Subaccount rules

| Rule |
|------|
| Cannot elevate beyond grants |
| Cannot assign themselves Org Admin |
| Cannot change `organization_id` |
| Cannot invite users unless granted `org:users:create` |
| Cannot reset Org Admin password |

---

## Role templates (MVP catalog)

| Role | Dashboard | Default scope |
|------|-----------|---------------|
| Organization Administrator | Manager or Owner (by org type) | Entire org |
| Assistant Manager | Manager | Org or property set |
| Employee | Manager (limited) | Assigned properties |
| Leasing Agent | Leasing | Assigned properties |
| Facility Technician | Technician | Assigned properties |
| Maintenance Staff | Technician | Assigned properties |
| Vendor | Vendor | Assigned work orders / properties |
| Tenant | Tenant Portal | Lease-scoped |
| Owner | Owner Dashboard | Property-scoped |

Future roles require catalog Approve; hierarchy rules still apply.

---

## Property assignment

For roles that are property-scoped, AuthZ checks **intersection** of:

1. Membership active  
2. Role capabilities  
3. Property assignment set  
4. Entitlements  

Empty property assignment ⇒ no property data (fail closed), except org-wide roles.
