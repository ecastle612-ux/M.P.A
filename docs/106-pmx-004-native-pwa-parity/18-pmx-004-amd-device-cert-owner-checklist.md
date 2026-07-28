# 18 — PMX-004 Amendment: Device Certification Owner Checklist

**Amendment ID:** `PMX-004-AMD-DEVICE-CERT-OWNER-CHECKLIST`  
**Status:** ✅ **APPROVED** (governance revision)  
**Effective date:** 2026-07-24 (this revision forward)  
**Package:** PMX-004 · Phase 1 Production Validation  
**Related M0 gate:** CORE-003 M0.1 ([35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md))  
**Checklist template:** [`owner-device-certification-checklist.md`](./artifacts/phase-1-production/m0-pmx-004-device-cert/owner-device-certification-checklist.md)  
**Code / UX-012 / AUTH deferred roles:** ❌ **Not authorized** by this amendment

---

## 1. Purpose

Replace the **mandatory screenshot/video artifact** requirement for PMX-004 Phase 1 real-device certification (Tests 1–7 / Groups A–G) with a **signed manual certification checklist** completed by the **Project Owner**, while retaining the requirement that testing occur on the mandatory physical devices.

This is a **governance evidence-form change**, not a waiver of physical-device testing and not a claim that prior incomplete certifications PASS.

---

## 2. Official decision

| Field | Decision |
|-------|----------|
| Amendment | `PMX-004-AMD-DEVICE-CERT-OWNER-CHECKLIST` |
| Status | ✅ **APPROVED** |
| Effective | **2026-07-24 forward** (does not rewrite historical FAIL records) |
| Prior evidence form | Mandatory screenshots/videos under `test-1`…`test-7` for Galaxy · Pixel · iPhone |
| Replacement evidence form | **Signed Project Owner Device Certification Checklist** covering Tests 1–7 / Groups A–G on each required device |
| Physical devices still required? | **Yes** — Samsung Galaxy · Google Pixel · iPhone (real devices; no emulator / desktop substitute) |
| Screenshots/videos | **Optional supporting** artifacts (encouraged); **not** mandatory for PASS under this amendment |
| Historical intakes (pre-effective) | **Unchanged** — prior FAIL / BLOCKED / empty `test-*` records remain accurate |
| M0 overall | Unchanged by this amendment alone — still requires a **completed signed checklist** (or prior media form) for M0.1 PASS |

---

## 3. Binding replacement text

### Evidence acceptance (Phase 1 Production Validation — Tests 1–7)

**Effective 2026-07-24 forward:**

1. The Project Owner (or designee named in the checklist) SHALL execute Tests 1–7 / Groups A–G on each mandatory physical device against Production.  
2. Acceptance evidence for PASS SHALL be a **completed, signed** Owner Device Certification Checklist filed under `artifacts/phase-1-production/m0-pmx-004-device-cert/`.  
3. The checklist SHALL record, for each required device: model, OS, browser, mode (installed PWA / A2HS), Production URL, deploy ID (when known), and PASS/FAIL per test group.  
4. Screenshots, videos, and device logs are **optional** supporting materials. Their absence SHALL NOT alone cause FAIL when a complete signed checklist attests PASS.  
5. Emulators, desktop browser simulation, server-only probes, and Lighthouse desktop reports remain **insufficient** as substitutes for physical-device execution.  
6. Agents and engineers SHALL NOT mark device rows PASS without either:  
   - (legacy path, pre-amendment intakes) physical media evidence on file, **or**  
   - (this amendment forward) a complete signed Owner Device Certification Checklist on file.  
7. Empty checklist / unsigned checklist / checklist asserting PASS without device metadata = **FAIL**.

### Forbidden false PASS (amended)

Marking PASS from task-brief assertion, chat claims, or unsigned templates is forbidden. Fabricating checklist signatures, timestamps, or device rows is forbidden.

---

## 4. What this amendment does not change

1. Mandatory device set (Galaxy · Pixel · iPhone).  
2. Ban on emulator / desktop simulation as device substitutes.  
3. Requirement to run against Production HTTPS (not localhost).  
4. Server-side PWA preconditions (manifest / SW / offline) as complementary probes.  
5. Lighthouse Test 8 rules.  
6. Phase 2 unlock still requires Phase 1 Final PASS under the amended evidence form.  
7. CORE-003 serial authorize discipline; UX-012 remains locked until M0 = GO.  
8. **Historical documentation** of FAIL / BLOCKED / empty `test-*` folders — those records stay as written for their dates.

---

## 5. Audit trail

| Date | Event |
|------|-------|
| 2026-07-24 (prior) | Intakes under screenshot/video rule → FAIL / BLOCKED · GATE-DEVICE-001 · `test-*` empty |
| 2026-07-24 (this revision) | **This amendment APPROVED** · evidence form → signed owner checklist · effective forward |
| Post-amendment | M0.1 PASS requires filed signed checklist; historical FAIL not retroactively rewritten |

---

## 6. Transition procedure (post-amendment)

1. Project Owner completes physical Tests 1–7 on Galaxy · Pixel · iPhone.  
2. Owner fills and **signs** [`owner-device-certification-checklist.md`](./artifacts/phase-1-production/m0-pmx-004-device-cert/owner-device-certification-checklist.md) (or dated copy).  
3. Optional: attach supporting screenshots/videos under `test-*`.  
4. Authorize PMX-004 evidence intake to adjudicate checklist → update [17](./17-phase-1-production-validation.md) / [35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md) only from checklist contents.  
5. If PASS → may recommend Final M0 Review re-run.  
6. If FAIL or unsigned → M0.1 remains open.

---

## 7. Sign-off

| Role | Decision | Date |
|------|----------|------|
| Product Owner / Governance authority | ✅ **APPROVED** — evidence-form amendment effective this revision | 2026-07-24 |
| Binding protocol updated | [17](./17-phase-1-production-validation.md) §0 | 2026-07-24 |

---

## 8. Document map

| Doc | Role |
|-----|------|
| This file | Authoritative amendment record |
| [17](./17-phase-1-production-validation.md) | Binding production validation protocol (amended evidence form) |
| Owner checklist template | Acceptance artifact under this amendment |
| [35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md) | M0.1 cert report — historical FAIL preserved; forward criteria note |
| [08](./08-testing-strategy.md) | Testing strategy — evidence form pointer |
| [README](./README.md) | Package index |
