# GO / NO-GO — Begin Financial Operations?

**Parent:** [Commercial Experience Certification](./index.md)  
**Question:** May implementation begin Financial Operations after Phase 1 commercial alignment?

---

## Recommendation

# NO-GO

Do **not** begin Financial Operations.

Do **not** begin Facility Operations feature work.

---

## Why NO-GO

Financial Operations is a Property Manager commercial module. Starting it now would add business capability on top of an experience that is **not yet certified** for:

1. **Fail-closed entitlements** — deep links bypass SKU boundaries (P0-1)  
2. **Purchase integrity** — customers can change their own SKU (P0-2)  
3. **Basic chrome trust** — dead Search control (P0-3)  
4. **Onboarding comprehension** — Guided Setup does not force “what’s included” (P0-4)  
5. **Operator supportability** — Master Admin cannot manage Customer #1 subscriptions operationally (P1-7+)

Shipping Financial Operations into this state would teach Customer #1 money workflows inside a product still learning how to explain and enforce what they bought.

---

## What would change this to GO

Minimum certification flips from Fail → Pass:

| Gate | Required outcome |
|------|------------------|
| P0-1 | Unentitled `/pm/*` and `/facility/*` routes redirect or 403 |
| P0-2 | Customer Billing/Setup show **read-only** plan; only Master Admin assigns SKU |
| P0-3 | Header Search removed **or** entitlement-aware |
| P0-4 | Guided Setup requires Billing acknowledgment + deep-links to correct Mission Control |
| P0-5 | Master Admin entry only for operators |

Strongly recommended before FO (not optional for Customer #1 support):

| Gate | Required outcome |
|------|------------------|
| P1-7 / P1-8 | Admin can list orgs and assign/inspect subscriptions |
| P1-1 | Single manager entry path (portal vs launcher reconciled) |

Then: Financial Operations may re-enter **Design → Document → Approve → Implement** as its own gated package under Property Manager ownership.

---

## Explicitly out of scope for the GO decision

- Facility feature depth  
- Capital Projects  
- Full Impersonation  
- Real rent/ledger workflows (those **are** Financial Operations — forbidden until GO)

---

## Sign-off block

| Role | Decision |
|------|----------|
| Commercial Experience Certification | **NO-GO** |
| Next authorized theme | Commercial experience hardening (P0 list) |
| Financial Operations | **Blocked** |
| Facility Operations features | **Blocked** |
