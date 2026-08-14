# COM-002 UAT DATA PROVISIONING CERTIFICATION

**Title:** COM-002 UAT DATA PROVISIONING CERTIFICATION  
**Status:** READY FOR AUTHENTICATED UAT  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T01:50:00Z  
**Release:** `main` @ `14dc7b4d37ae4d6d35ef5df5b640bb2656fb0941`  
**Project:** `mpa-prod` (`vahnmcrpnuggxkivynvo`)  
**Prior release cert:** docs/87 (deploy of `14dc7b4d` READY; authenticated UAT was blocked on missing data)  
**Application / schema / Stripe / billing / commercial flow:** **Unchanged**

Identifier note: COM-002 Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial.

---

## Final verdict

**READY FOR AUTHENTICATED UAT**

Controlled internal UAT data exists on production. Property Manager and tenant logins work. Resident, lease, and unit relationships are populated. Messaging UAT was **not** run.

Stop here. No application, migration, Stripe, billing, or commercial change is authorized by this record.

---

## Constraints honored

| Constraint | Result |
|------------|--------|
| No application code changes | **Pass** — data + this record only |
| No migrations | **Pass** |
| No Stripe changes | **Pass** — `stripe_subscription_id` and `stripe_customer_id` are null |
| No billing / price / SKU catalog changes | **Pass** |
| No customer organizations | **Pass** — `organization_type = internal_uat` |
| No real tenant data | **Pass** — synthetic UAT names and emails only |
| No production feature changes | **Pass** |
| Messaging UAT | **Not run** |

A local `organization_subscriptions` row (`mpa_property_manager` / `active`, no Stripe IDs) was added so the internal org has a Property Manager product home. That is entitlement assignment for UAT, not a Stripe or commercial-flow change.

---

## 1. Organization

| Field | Value |
|-------|--------|
| Name | M.P.A. UAT Property Demo |
| Slug | `mpa-uat-property-demo` |
| ID | `a11ce002-0001-4000-8000-0000000000c2` |
| Type | `internal_uat` |
| Commercial status | `active` |
| Product SKU (local) | `mpa_property_manager` |
| Guided Setup | Completed (`completed_at` set) |
| Purpose | Internal COM-002 validation only |

---

## 2. Property data

| Object | Value |
|--------|--------|
| Property | M.P.A. Demo Apartments |
| Property ID | `a11ce002-0001-4000-8000-000000000101` |
| Unit label | `Unit 101` |
| Unit ID | `a11ce002-0001-4000-8000-000000000201` |
| Unit status | `occupied` |
| Tables | `property_properties` + `property_units` (new model used by COM-002) |

The Residents UI prefixes the label, so the directory may show `Unit Unit 101`. The stored label is `Unit 101`.

---

## 3. Users

Property Operations maps to role `property_manager` (not a separate role).

| Actor | Email | Auth user ID | Membership |
|-------|-------|--------------|------------|
| Property Manager | `uat.pm.property.demo@my-property-assistant.com` | `0e1fc6e4-278b-4de5-a9e5-2e13acba7371` | `property_manager`, owner, active |
| Tenant | `uat.tenant.property.demo@my-property-assistant.com` | `6cde6423-ad9b-49fb-aadd-3ea93ec8b040` | `tenant`, active |

Passwords are **not** stored in this blueprint. Product Owner holds the controlled credentials from the provisioning run.

---

## 4. Lease relationship

| Object | Value |
|--------|--------|
| Lease | Unit 101 · status `active` · rent `$0` (not a real tenancy) |
| Lease ID | `a11ce002-0001-4000-8000-000000000401` |
| Resident | UAT Tenant |
| Resident ID | `a11ce002-0001-4000-8000-000000000301` |
| `pm_residents.user_id` | Tenant auth user |
| `pm_residents.lease_id` | Lease ID above |
| `lease_residents` | Primary · `user_id` linked · email matches tenant |

---

## 5. Readiness validation

### Database (`mpa-prod`)

| Check | Result |
|-------|--------|
| `pm_residents` populated | **Pass** — 1 row in the UAT org (also the only production `pm_residents` row) |
| `lease_residents` populated | **Pass** — 1 row in the UAT org (also the only production `lease_residents` row) |
| `lease_agreements` | 1 active lease |
| Customer orgs created in this record | **0** |

### Login

| Check | Result |
|-------|--------|
| Tenant password grant | **200** — user `6cde6423-…` |
| PM password grant | **200** — user `0e1fc6e4-…` |
| Tenant production UI | **Pass** — `/portal/tenant` · “Hi, UAT Tenant” · M.P.A. Demo Apartments · Unit 101 · lease **Active** |
| PM production UI | **Pass** — `/pm/mission-control` · M.P.A. UAT Property Demo · 1 property · not `/setup` |

### Relationship access

| Check | Result |
|-------|--------|
| PM can access resident | **Pass** — RLS `pm_residents` n=1; UI `/pm/residents` shows UAT Tenant on M.P.A. Demo Apartments · Unit 101 |
| Tenant can access own portal | **Pass** — `/portal/tenant` |
| Tenant lease access | **Pass** — RLS `lease_agreements` n=1; portal “Your lease” **Active** |

Tenant JWT sees only the tenant membership. PM JWT sees both memberships in the UAT org. Messaging APIs were not called.

---

## 6. Incident status

| Item | Status |
|------|--------|
| Production incident | **None** |
| Application deploy | Unchanged — still `14dc7b4d` |
| Stripe / billing | Unchanged |
| Legacy communication tables | Untouched |
| COM-002 conversations created | **0** |

---

## Next authorized step

Authenticated COM-002 messaging UAT (PM desk, tenant inbox, media, work-order link, notifications, isolation) may now run against this controlled org.

No feature additions, migrations, billing, Stripe, commercial-flow, or legacy comms mapping are authorized by this record.
