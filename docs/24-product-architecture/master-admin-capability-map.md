# Master Admin Capability Map

**Status:** Approved  
**Parent:** [24 Product Architecture](./index.md)

Master Admin is **not a customer product**. It is the operator OS for running M.P.A.

**Mandate:** Expose every capability in the platform — customer modules, Shared Platform, and operator tools — in a discoverable, correctly grouped system.

---

## Audit Against Mandate

### What Is Missing

| Area | Gap |
|------|-----|
| Master Admin shell / routes | No operator portal in app |
| Capability catalog | No browsable inventory of all modules/entitlements |
| Subscription control | Cannot assign Property Manager / Facility / Complete to an org |
| Entitlement overrides UI | DB override table exists; no operator OS |
| SaaS billing ops | Undefined |
| Support impersonation | Undefined |
| Marketplace verification queue | Philosophy only |
| Trust & safety / abuse | Undefined |
| Facility module visibility | Facility product absent entirely |
| Cross-product work inspector | Cannot see PM + Facility objects in one operator view |
| Audit log explorer | Intent in schema; no OS |
| Feature flags console | Roadmap mention only |
| Guided Setup / Mission Control previews | No operator simulation of customer IA |
| Documentation sync | Operator OS not documented before this package |

### What Is Duplicated (Risk)

| Duplication risk | Why it matters |
|------------------|----------------|
| “Internal Admin” persona vs future Master Admin | Two names for one OS — consolidate on Master Admin |
| Foundation dashboard vs portal homes vs future Mission Controls | Operator must not mirror customer confusion |
| Permission overrides vs future entitlements | Easy to conflate user permissions with product SKUs |
| Maintenance vs Facility if both appear without grouping | Operator will mis-route support |

### What Is Difficult to Discover

| Surface today | Discoverability issue |
|---------------|----------------------|
| Foundation sidebar placeholders | No signal of commercial products |
| Capability grants in DB | Engineer-only; not an OS |
| Blueprint docs vs app | Product truth lives in docs; app does not reflect SKUs |
| Vendor marketplace admin tasks | No home |
| Which org has which product | Impossible to answer in-product |

### What Is Organized Incorrectly

| Current framing | Correct Master Admin framing |
|-----------------|------------------------------|
| “PM portal is the product” | Three SKUs + Shared + Operator |
| Role portals as top architecture story | Roles are access planes under products |
| Workflow roadmap without SKU lens | Roadmap must be product-scoped after reset |
| Single Ops Console as whole platform home | PM Mission Control is one product home |

### What Should Be Grouped Differently

Recommended Master Admin IA:

```
MASTER ADMIN OS
├── Command Center              ← platform health, queues needing operators
├── Customers
│     ├── Organizations
│     ├── Subscriptions         ← PM / Facility / Complete
│     ├── Entitlements
│     └── Billing
├── Products & Catalog
│     ├── Property Manager modules
│     ├── Facility Operations modules
│     ├── Shared Platform capabilities
│     └── Entitlement dictionary
├── Marketplace Trust
│     ├── Vendor verification
│     ├── Compliance docs review
│     └── Abuse / disputes
├── Support
│     ├── Org 360
│     ├── Impersonation (audited)
│     └── Ticket context
├── Platform
│     ├── Feature flags
│     ├── Integrations health
│     ├── Observability
│     └── Audit log
└── Knowledge
      ├── Capability map
      └── Environment / release notes
```

---

## Capability Exposure Matrix

Master Admin must be able to **view** (and where noted **operate**) every customer capability:

| Capability | View | Operate | Customer owner |
|------------|:----:|:-------:|----------------|
| Organizations | ● | ● (support) | Shared |
| Properties | ● | ○ support | PM |
| Residents | ● | ○ support | PM |
| Leasing | ● | ○ support | PM |
| Maintenance | ● | ○ support | PM |
| Vendors / Marketplace | ● | ● verify | Shared + PM |
| Financial Operations | ● | ○ support | PM |
| Documents | ● | ○ support | Shared |
| Communications | ● | ○ support | Shared |
| Facility Operations | ● | ○ support | Facility |
| Assets | ● | ○ support | Facility |
| Inventory / Parts | ● | ○ support | Facility |
| Preventive Maintenance | ● | ○ support | Facility |
| Inspections (facility) | ● | ○ support | Facility |
| Safety | ● | ○ support | Facility |
| Compliance (facility) | ● | ○ support | Facility |
| Building Systems | ● | ○ support | Facility |
| Capital Projects | ● | — (future) | Facility |
| Subscriptions | ● | ● | Shared / Admin |
| Entitlements | ● | ● | Shared / Admin |
| Permissions | ● | ● (break-glass) | Shared |
| Mission Controls | ● preview | — | Per product |
| Guided Setup state | ● | ● reset/reopen | Shared |
| Search index health | ● | ● | Shared |

● = required · ○ = limited audited support actions · — = not applicable yet

---

## Operator Principles

1. **Never hide a customer module** because it is hard to build the admin view — stub the catalog entry.
2. **SKU is first-class** — every org 360 shows Property Manager / Facility / Complete.
3. **Entitlement ≠ permission** — admin UI labels must not mix them.
4. **Audited break-glass** — support actions write audit events.
5. **Same names as customer product** — do not invent parallel operator jargon for modules.

---

## Immediate Doc Outcomes (No Code)

- Rename persona “M.P.A. Internal Admin” → **Master Admin (Operator)** in Personas after approval.
- Treat Master Admin as a permanent Blueprint surface in this package.
- Block any customer feature that cannot be represented in the Master Admin catalog entry list above.
