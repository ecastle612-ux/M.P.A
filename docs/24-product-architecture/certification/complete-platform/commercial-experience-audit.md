# Commercial Experience Audit — Complete Platform

**Package:** Complete Platform Certification  
**Date:** 2026-08-07  
**SKU:** `mpa_complete_platform`  

---

## Subscription promise

Customer purchases **one** subscription: Complete Platform.  
Entitlement engine enables Property Manager ∪ Facility Operations ∪ Shared Platform.  
Capital Projects remains future / entitlement-off.

| Check | Result | Evidence |
|-------|--------|----------|
| SKU exists and labeled | **Pass** | `PRODUCT_SKUS` / `toSkuLabel` → “Complete Platform” |
| Entitlements = union | **Pass** | `entitlementsForSku` + `commercial.test.ts` |
| Capital not granted | **Pass** | `facility.capital_projects` in future set only |
| Route guards allow both product homes | **Pass** | Hardening + `evaluatePathEntitlement` Complete cases |
| PM-only / FO-only denial still fail-closed | **Pass** | Hardening report |
| Billing presents Complete as current plan | **Pass** | `/billing` + plan badge |
| Customer cannot self-assign SKU | **Pass** | Hardening (self-serve mutation closed) |
| Upgrade cues for single-product SKUs point to Complete | **Pass** | `upgradeCuesForSku` |

---

## Advertised capability delivery

| Capability family | Included in Complete? | Delivered? |
|-------------------|----------------------|------------|
| PM Mission Control + Properties / Residents / Leasing / Maintenance / Vendors / Financial Ops (S0–S3) | Yes | **Yes** (PM GO) |
| FO Mission Control + Sites / Assets / Systems / Ops / PM / Inventory / Parts / Inspections / Safety / Compliance | Yes | **Yes on FO candidate**; **No on main tip** |
| Shared Documents / Communications | Yes | **Yes** |
| Capital Projects | Future only | **Not included** (correct) |
| Generative Assistant | Rule-based recommendations | **Yes** (design-satisfied) |

---

## No-duplicate commercial rules

| Rule | Result |
|------|--------|
| No duplicate navigation trees for same module href | **Pass** — one href per module; groups separated |
| No duplicate workflows for same business outcome | **Pass** — composition table honored (resident repair vs facility corrective) |
| No conflicting product terminology (systemic) | **Conditional** — “FO ·” Financial Ops vs Facility Operations |
| One cohesive OS chrome | **Pass** structure / **Conditional** depth until FO on main |

---

## Comparison to prior subscription certification

Baseline [subscription-certification.md](../subscription-certification.md) recorded Complete as Conditional (shells, search fail, gating fail).  

**Update after commercial hardening + PM GO + FO candidate GO:**

| Area | Baseline | Now |
|------|----------|-----|
| Entitlement model | Pass | **Pass** |
| Deep-link / SKU gating | Fail | **Pass** (hardening) |
| Search | Fail | **Pass (candidate)** with terminology P1 |
| Empty / alignment shells | Fail | **Pass for PM**; FO candidate real; **Fail on main FO** |
| Composition chrome | Pass | **Pass** |

---

## Commercial verdict

| Gate | Decision |
|------|----------|
| Complete Platform SKU integrity | **GO** |
| Sold promise vs delivered (candidate) | **CONDITIONAL GO** — FO must land on stable main |
| Capital sold as included | **NO-GO / not sold** — correct |
