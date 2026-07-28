# 06 — Resource Plan

**Package:** CORE-003  
**Units:** Person-weeks (PW) are planning estimates for a senior eng-week (design already done). Ranges assume focused capacity, not calendar weeks with thrash.

Scale: **S** ≤ 2 PW · **M** 2–5 · **L** 5–10 · **XL** > 10

---

## Per-unit estimates

| Unit | Eng | Test | Regression risk | Rollback complexity | Deployment risk |
|------|-----|------|-----------------|---------------------|-----------------|
| **UX-012 A** | S–M | S | Low | Low (token revert) | Low |
| **UX-012 B** | M | M | Med | Med (component API) | Low–Med |
| **UX-012 C** | L | M–L | Med | Med | Med (wide UI) |
| **UX-012 D** | M | L (a11y) | Med | Low–Med | Low |
| **UX-012 E** | S–M | M | Low | Low | Low |
| **OPS-001 A** | L | L | **High** | **High** (event contract) | Med |
| **OPS-001 B** | L | L | High | Med–High | Med (notify) |
| **OPS-001 C** | L–XL | L | High | High | Med |
| **OPS-001 D** | XL | L | High | High | Med–High (AI/auto) |
| **OPS-001 E** | XL | L | High | Med | Med (surface blast) |
| **AUTH-001 A** | L | L | **Critical** | **High** | **High** |
| **AUTH-001 B** | L | L | **Critical** | High | High |
| **AUTH-001 C** | M–L | L | High | Med | Med (email) |
| **AUTH-001 D** | L | L | High | Med–High | Med |
| **AUTH-001 E** | M–L | M–L | High | Med | Med (privileged) |
| **COM-001 A** | M | M–L | High | Med | Med |
| **COM-001 B** | M | M | Med | Med | Low–Med |
| **COM-001 C** | M–L | M | Med | Med | Low–Med |
| **COM-001 D** | M–L | L | High | Med–High (data freeze) | Med |
| **COM-001 E** | M | M | Med | Low | Low–Med |
| **PMX-1 Final PASS** | S (ops) | L (devices) | — | — | N/A (evidence) |
| **PMX-004 P2–3** | M | M | Med | Med | Med |
| **PMX-004 P4** | M | L | High | Med | Med |
| **PMX-004 P6** | M | L | High | Med | Med (push) |
| **PMX-004 P7** | L | L | **Critical** | High | High |
| **PMX-004 P8–9** | M | M | Med | Low | Low |
| **PMX-004 P10–11** | S–M | **XL** (pilot) | High | Low | Med |
| **PAY-001 remainder** | M–L | L | **Critical** | High | **High** |
| **FIN-003 C** | L–XL | **XL** | **Critical** | **Critical** | **Critical** |
| **FIN-003 D** | M | M–L | High | Med | Med |
| **FIN-003 E** | M | L | High | Low | Med |

---

## Program rollup (rough)

| Stream | Eng PW | Test PW | Notes |
|--------|--------|---------|-------|
| Foundation M1 | 12–20 | 10–16 | AUTH-A + OPS-A dominate |
| Customer (AUTH+COM full) | 35–55 | 30–45 | Security/cert heavy |
| OPS full | 40–60 | 30–45 | Longest eng pole |
| UX full | 18–28 | 16–24 | FE + a11y |
| Money (PAY rem + FIN C–E) | 20–35 | 25–40 | Review calendar > coding |
| PMX remaining | 15–25 | 25–40 | Device lab is the tax |
| **Total (if all complete)** | **~140–220** | **~135–210** | Not all must finish before revenue ops |

---

## Capacity model (recommended)

| Role | Count | Assignment |
|------|-------|------------|
| Platform eng | 1 | OPS stream lead |
| Auth/security eng | 1 | AUTH + COM activation |
| Commercial/backend | 1 | COM slices + BILL touchpoints |
| FE / UX eng | 1 | UX-012 + PMX UI |
| Money eng (part-time OK early) | 1 | PAY → FIN-C |
| QA / device | 0.5–1 | PMX + AUTH + money cert |
| Architect / CTO oversight | 0.25 | Weekly integration + Authorize gates |

**Minimum parallel viable:** 3 eng (Auth/COM, OPS, UX) + money on demand after PAY reviews.

---

## Risk-weighted sequencing note

Spend **test budget first** on: AUTH-A/B, OPS-A, PAY/FIN-C, PMX-1 devices, PMX-7.  
Under-testing UX-E or COM-E is recoverable; under-testing FIN-C or AUTH-A is not.
