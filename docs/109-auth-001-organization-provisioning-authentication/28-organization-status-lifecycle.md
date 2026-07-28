# 28 — Organization Status Lifecycle

**Package:** AUTH-001  
**Amendment:** A03  
**Status:** Binding (Approved with Amendments)  
**Supersedes:** Informal state tables in [01](./01-organization-architecture.md) / [11](./11-account-lifecycle.md) for **commercial org status** (those docs defer here)

---

## Canonical lifecycle

```
Prospect
    ↓
Trial
    ↓
Pending Setup
    ↓
Active
    ↓
Suspended  ←→  Past Due  ←→  Active (recovery)
    ↓
Cancelled
    ↓
Archived
```

Internal technical substates (e.g. credential issuance) may exist under `Pending Setup` but must map to this commercial lifecycle for product, billing, and support.

---

## State definitions

### Prospect

| Dimension | Behavior |
|-----------|----------|
| Meaning | Sales / marketing interest; no paid workspace yet |
| Login | No org tenant login |
| Billing | No SaaS subscription (or checkout not completed) |
| User access | None |
| Notifications | Marketing / sales only (outside tenant product) |
| Recovery | N/A — convert via purchase or Level 0 manual provision |

### Trial

| Dimension | Behavior |
|-----------|----------|
| Meaning | BILL-001 `trialing` (or founder trial grant) |
| Login | Org Admin + invited users per AuthZ |
| Billing | Trial clock; no (or $0) invoice until convert |
| User access | Entitled to trial capability matrix ([26](./26-subscription-capability-matrix.md)) |
| Notifications | Trial reminders, upgrade prompts |
| Recovery | Standard Auth; convert or expire → Cancelled / Archived path |

### Pending Setup

| Dimension | Behavior |
|-----------|----------|
| Meaning | Org provisioned; first-login and/or Setup Wizard not finished |
| Login | Org Admin (first-login gate); invited setup helpers as allowed |
| Billing | Subscription may be trialing/active; commercial clock can run |
| User access | Setup-scoped routes; full product locked until Finish |
| Notifications | Welcome, setup nudges, incomplete-wizard reminders |
| Recovery | Org Admin via Level 0; continue wizard after restore |

### Active

| Dimension | Behavior |
|-----------|----------|
| Meaning | Production workspace |
| Login | All active memberships |
| Billing | Normal SaaS collection |
| User access | Full AuthZ + entitlements |
| Notifications | Operational + billing |
| Recovery | Standard AUTH-001 recovery split |

### Suspended

| Dimension | Behavior |
|-----------|----------|
| Meaning | Compliance, abuse, or ops hold (may be non-billing) |
| Login | **Blocked** for tenant principals (Level 0 support tools excepted) |
| Billing | May continue or pause per reason; documented on suspend |
| User access | None in tenant plane |
| Notifications | Suspension notice to Org Admin + recovery contact |
| Recovery | Level 0 clears reason → return to prior productive state (usually Active or Pending Setup) |

### Past Due

| Dimension | Behavior |
|-----------|----------|
| Meaning | BILL-001 payment failure / dunning |
| Login | **Allowed** (default) so Org Admin can update payment method |
| Billing | Dunning in progress; invoices past due |
| User access | Entitlements **restricted** per BILL-001 policy; core billing portal reachable |
| Notifications | Past-due, card update, grace warnings |
| Recovery | Successful payment → Active; dunning exhausted → Suspended or Cancelled |

### Cancelled

| Dimension | Behavior |
|-----------|----------|
| Meaning | Subscription ended; workspace not production |
| Login | Blocked or read-only export window (product policy) |
| Billing | No further charges except legally owed |
| User access | No operational mutations; optional time-boxed export |
| Notifications | Cancellation confirmation, export deadline |
| Recovery | Level 0 / sales reactivation → Trial or Active + new subscription bind |

### Archived

| Dimension | Behavior |
|-----------|----------|
| Meaning | Terminal commercial tombstone after retention window |
| Login | None |
| Billing | Historical invoices retained per finance policy |
| User access | None |
| Notifications | None (except legal notices if required) |
| Recovery | Not routine; legal/compliance restore only with Level 0 + audit |

---

## Transition authority

| Transition | Typical actor |
|------------|---------------|
| Prospect → Trial / Pending Setup | Checkout success / Level 0 provision |
| Trial → Pending Setup / Active | Provision + wizard progress |
| Pending Setup → Active | Org Admin Finish Setup |
| Active → Past Due | Billing automation |
| Active → Suspended | Level 0 / policy automation |
| Past Due → Active | Payment success |
| Past Due → Suspended / Cancelled | Dunning policy |
| * → Cancelled | Billing cancel / Level 0 |
| Cancelled → Archived | Retention elapsed |
| Cancelled → Active | Level 0 + new/restored subscription |

All transitions emit permanent audit events ([20](./20-audit-compliance.md)).

---

## Mapping from earlier AUTH-001 draft states

| Earlier draft | Canonical |
|---------------|-----------|
| `provisioning` / `pending_activation` / `setup_in_progress` | **Pending Setup** |
| `active` | **Active** |
| `suspended` | **Suspended** |
| (billing past due) | **Past Due** |
| `pending_deletion` / `deleted` | **Cancelled** → **Archived** |
| (pre-purchase) | **Prospect** |
| `trialing` binding | **Trial** |

---

## Acceptance (A03)

| ID | Criterion |
|----|-----------|
| ORG-01 | Every org has exactly one canonical commercial status |
| ORG-02 | Login / billing / access / notifications / recovery defined per state |
| ORG-03 | Past Due allows billing recovery login; Suspended blocks tenant login |
| ORG-04 | State changes are audited |
