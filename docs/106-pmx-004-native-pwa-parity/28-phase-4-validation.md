# 28 — PMX-004 Phase 4 Validation Report

**Package:** PMX-004 — Native PWA Parity  
**Phase:** 4 — Standalone Compliance  
**Authorization:** [25](./25-phase-4-authorization.md)  
**Implementation:** [27](./27-phase-4-implementation.md)  
**Status:** ✅ **VALIDATED** · **PASS**  
**Date:** 2026-07-26  
**Binding phrase (issued):**

```
VALIDATE PMX-004 PHASE 4
```

**Program record:** [CORE-003 §68](../113-core-003-implementation-master-plan/68-pmx-004-phase-4-validation.md)  
**Package phase minimum:** **A8–A9** — [06](./06-acceptance-criteria.md) §3  
**Inventory SoT:** [10](./10-standalone-exit-inventory.md)  
**Design SoT:** [05](./05-implementation-order.md) Phase 4 · [02](./02-proposed-architecture.md) §6

> Validation only. No product-code changes in this validation record.  
> PMX-004 Phases 5–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI **not** authorized under this phrase.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Phase 4 Validation** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE PMX-004 PHASE 4` recorded |
| **Remediation required before PASS?** | ❌ **No** |
| **Phase 4 approved for program progression?** | ✅ **YES** — Phase 4 **Validated** |
| **Recommend `AUTHORIZE PMX-004 PHASE 5`?** | ✅ **Eligible** after this Validation — subsequently **AUTHORIZED** ([29](./29-phase-5-authorization.md)) |
| **Begin Phase 5 / UX-C / OPS-C / FIN-C / marketplace under this validate phrase?** | ❌ **NO** — Phase 5 requires its own authorize (issued separately); peers remain locked |

---

## 2. Production ship evidence

| Field | Value |
|-------|-------|
| **Ship SHA** | `521fa1f6bd016a2e50bbd27fd02b501ad5206a49` |
| **Deploy** | `dpl_9zkFEhVyiEYUYA5Gc1UW6CEChCfo` |
| **State** | READY |
| **URL** | https://www.my-property-assistant.com |
| **CSP Production** | `frame-src 'self' blob:` present; `object-src 'none'` retained |

---

## 3. Scope verified against [25] / [27]

| In-scope deliverable | Evidence | Result |
|----------------------|----------|--------|
| Exit inventory E01–E13 dispositioned | [10](./10-standalone-exit-inventory.md) closed | ✅ |
| Primary document opens in-app / same-tab | E01–E09 consumers → `StandaloneOpenLink` / viewer; no `_blank` in those files | ✅ |
| Report flows no `window.open` / unexpected `_blank` | `reports-view.tsx` viewer + `StandaloneOpenLink`; owner reports/statements wired | ✅ |
| Stripe absolute returns | Resident `paid=1` via stripe-provider; company `successUrl`/`cancelUrl`/`returnUrl` origin-absolute | ✅ |
| Return interstitial | `ReturnToMpaBanner` + billing welcome-back notice | ✅ |
| E-sign | leave-confirm + same-tab assign | ✅ |
| External leave confirm | Stripe / e-sign / hosted invoice | ✅ |
| Auth deep-link notes | [26](./26-auth-deep-link-notes.md) | ✅ |
| CSP security note | blob frame-src only; no third-party frame hosts | ✅ |
| Preserve Phases 1–3 | SW / install / shell not redesigned | ✅ |
| No Phases 5–11 / unauthorized packages | No UX-C / OPS-C / FIN-C / marketplace / schema / IA | ✅ |

**Evidence mode:** Production deploy + CSP header + code inventory scan + unit tests (`standalone-open.test.ts` 6/6). Real-device standalone smoke remains recommended ops hygiene, not a Phase 4 code fail (exit criteria allow documented layout/flow evidence).

---

## 4. Acceptance checklist (P4-01 … P4-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **P4-01** | Inventory living & dispositioned | ✅ PASS | [10] E01–E15 closed; re-scan clean |
| **P4-02** | Primary document opens stay in-app / same-tab | ✅ PASS | Owner/vault/tenant/facility/vendor → viewer; exit scan CLEAN |
| **P4-03** | Primary report flows | ✅ PASS | Owner reports/statements + ops `reports-view` viewer; no `window.open` |
| **P4-04** | Stripe return compliance | ✅ PASS | Absolute origin / `NEXT_PUBLIC_APP_URL` success·cancel·return paths |
| **P4-05** | Optional return interstitial | ✅ PASS | `ReturnToMpaBanner` + billing welcome-back copy |
| **P4-06** | E-sign path | ✅ PASS | Leave-confirm + same-window assign (Accepted-with-return) |
| **P4-07** | External leave confirm | ✅ PASS | Pattern D for Stripe/e-sign/hosted invoice; E14 Acceptable |
| **P4-08** | Auth deep-link notes | ✅ PASS | [26](./26-auth-deep-link-notes.md) |
| **P4-09** | Regression / non-negotiables | ✅ PASS | Phases 1–3 preserved; no schema/IA; COM TrialStatusBanner collision removed before READY ship |
| **P4-10** | Documentation & scope | ✅ PASS | [27] + this report; Phases 5–11 / UX-C–E / OPS-C–E / FIN-C–E / marketplace not shipped |

**All P4-01–P4-10:** ✅ **PASS**

---

## 5. Exit criteria ([25] §6)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | P4-01–P4-10 PASS | ✅ |
| 2 | Inventory E01–E13 dispositioned | ✅ |
| 3 | Primary doc/report paths evidenced | ✅ code + Production |
| 4 | Stripe return evidenced (absolute URLs) | ✅ resident + company |
| 5 | E-sign dispositioned | ✅ |
| 6 | No critical defects; Phases 1–3 not regressed | ✅ |
| 7 | CSP changes security-reviewed | ✅ blob-only `frame-src` |
| 8 | Documentation updated | ✅ |
| 9 | Governance recommendation recorded | ✅ |
| 10 | Phrase recorded | ✅ |

---

## 6. Recommendation

| Field | Result |
|-------|--------|
| **Validate Phase 4?** | ✅ **PASS** |
| **Authorize Phase 5 under this validate phrase?** | ❌ **NO** at validation time — follow-on: ✅ **AUTHORIZED** ([29](./29-phase-5-authorization.md)) |
| **Authorize UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** |

**Next (at validation time):** Dedicated `AUTHORIZE PMX-004 PHASE 5` — **issued** ([29](./29-phase-5-authorization.md) · [CORE-003 §69](../113-core-003-implementation-master-plan/69-pmx-004-phase-5-authorization.md)). Implementation remains a dedicated session.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation | ✅ **VALIDATE PMX-004 PHASE 4 → PASS** | 2026-07-26 |
| Implementation ship | ✅ `521fa1f` · `dpl_9zkFEhVyiEYUYA5Gc1UW6CEChCfo` READY | 2026-07-26 |
