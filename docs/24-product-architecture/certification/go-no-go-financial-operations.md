# GO / NO-GO — Begin Financial Operations?

**Parent:** [Commercial Experience Certification](./index.md) · [Hardening Report](./commercial-hardening-report.md)  
**Updated:** 2026-08-06 (after P0 Commercial Experience Hardening)

---

## Recommendation

# GO (conditional)

Commercial Experience Hardening P0 is **Pass**.

Financial Operations may now enter the normal gate:

**Design → Document → Approve → Implement**

under Property Manager ownership only.

Facility Operations feature work remains **deferred / NO-GO**.

---

## Why GO now

| Prior NO-GO reason | Status after hardening |
|--------------------|------------------------|
| Deep links bypass entitlements | **Fixed** — middleware fail-closed |
| Customers could change SKU | **Fixed** — operator-only writes + RLS |
| Dead header Search | **Fixed** — entitlement-aware Global Search |
| Guided Setup auto-complete | **Fixed** — billing + home required; exits to product home |
| Master Admin visible to all | **Fixed** — operator-only visibility + route gate |

Success criteria from hardening authorization:

| Criterion | Met? |
|-----------|------|
| PM customer cannot accidentally experience Facility | Yes |
| Facility customer cannot accidentally experience PM | Yes |
| Complete customer sees one cohesive commercial OS | Yes |
| Master Admin only for platform operators | Yes |

---

## Conditions on the GO

1. **No Facility implementation** in the FO package.  
2. **FO scope** must be designed/documented/approved as its own package (Implementation Gate).  
3. FO surfaces must continue to require `pm.financial_operations` entitlement.  
4. Do not reopen CORE-004 / UX-016 inside FO without separate approval.  
5. Apply migrations `20260806010000_*` and `20260806020000_*` before production use.

---

## Still NO-GO

| Workstream | Decision |
|------------|----------|
| Facility Operations features | NO-GO / deferred |
| Capital Projects | Future |
| CORE-004 / UX-016 | Stopped unless re-authorized |

---

## Sign-off block

| Role | Decision |
|------|----------|
| Commercial Experience Hardening P0 | **Pass** |
| Begin Financial Operations (design gate) | **GO** |
| Begin Facility Operations features | **NO-GO** |
