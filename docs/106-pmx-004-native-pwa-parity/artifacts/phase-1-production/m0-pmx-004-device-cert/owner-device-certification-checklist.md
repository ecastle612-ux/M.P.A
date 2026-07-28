# PMX-004 Phase 1 — Owner Device Certification Checklist

**Amendment:** `PMX-004-AMD-DEVICE-CERT-OWNER-CHECKLIST` ([18](../../../18-pmx-004-amd-device-cert-owner-checklist.md))  
**Production URL:** `https://www.my-property-assistant.com`  
**Deploy ID (if known):** `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf`  
**Status of this file:** ✅ **COMPLETED** — signed Project Owner certification under `PMX-004-AMD-DEVICE-CERT-OWNER-CHECKLIST`

> Executed on **physical** Samsung Galaxy, Google Pixel, and iPhone only.  
> Emulators / desktop browsers were not used as substitutes.  
> Screenshots/videos are optional supporting attachments.

**Audit trail:** This certification is executed under amendment `PMX-004-AMD-DEVICE-CERT-OWNER-CHECKLIST` (effective 2026-07-24 forward). Historical FAIL / BLOCKED intakes and empty `test-*` media folders under prior evidence rules remain unchanged.

---

## A. Certification metadata

| Field | Value |
|-------|-------|
| Project Owner name | Erick Castillo |
| Role / title | Founder & Project Owner |
| Date of device testing (local) | July 24, 2026 |
| Date of signature | July 24, 2026 |
| Production URL confirmed | ☑ `https://www.my-property-assistant.com` |
| Notes | Physical-device testing completed on Samsung Galaxy, Google Pixel, and Apple iPhone. All required PMX-004 Tests 1–7 completed successfully under the amended Owner Device Certification process. No blocking defects observed during certification. |

---

## B. Device matrix

| Device | Model | OS version | Browser | Mode | Tester initials |
|--------|-------|------------|---------|------|-----------------|
| Samsung Galaxy (required) | Samsung Galaxy S24 | Android 15 | Chrome | Installed PWA standalone | EC |
| Google Pixel (required) | Google Pixel 9 | Android 15 | Chrome | Installed PWA standalone | EC |
| iPhone (required) | iPhone 16 Pro | iOS 26.0 | Safari | Add to Home Screen standalone | EC |
| iPad (optional) | — | — | Safari | A2HS standalone | — |

---

## C. Tests 1–7 / Groups A–G (mark PASS / FAIL / N/A)

For each required device, attest every row. Use **PASS** only if executed on that physical device.

### Samsung Galaxy

| Test | Group | Scope (summary) | Result (PASS/FAIL) | Notes |
|------|-------|-----------------|--------------------|-------|
| T1 | A Install | Fresh install / icon / splash / standalone / no browser chrome | PASS | |
| T2 | D Service worker | Single active SW; registration; no fatal SW errors | PASS | |
| T3 | F Offline | Airplane / offline page or shell; reconnect | PASS | |
| T4 | E Push | Permission / enroll / delivery / tap routing (as applicable) | PASS | |
| T5 | C Update | Update / reload path acceptable | PASS | |
| T6 | B Auth | Login / logout / session persistence / refresh | PASS | |
| T7 | G + regression | Navigation, deep links, touch/rotation, no blocking defects | PASS | |

**Galaxy overall:** ☑ PASS · ☐ FAIL

### Google Pixel

| Test | Group | Scope (summary) | Result (PASS/FAIL) | Notes |
|------|-------|-----------------|--------------------|-------|
| T1 | A Install | Fresh install / icon / splash / standalone | PASS | |
| T2 | D Service worker | Single active SW | PASS | |
| T3 | F Offline | Airplane / offline / reconnect | PASS | |
| T4 | E Push | Permission / enroll / delivery / tap | PASS | |
| T5 | C Update | Update / reload | PASS | |
| T6 | B Auth | Login / logout / session | PASS | |
| T7 | G + regression | Navigation / UX / no blocking defects | PASS | |

**Pixel overall:** ☑ PASS · ☐ FAIL

### iPhone

| Test | Group | Scope (summary) | Result (PASS/FAIL) | Notes |
|------|-------|-----------------|--------------------|-------|
| T1 | A Install | A2HS / icon / splash / standalone | PASS | |
| T2 | D Service worker | SW behavior as supported on iOS installed PWA | PASS | |
| T3 | F Offline | Airplane / offline / reconnect | PASS | |
| T4 | E Push | Permission / enroll / delivery / tap (iOS installed constraints noted) | PASS | |
| T5 | C Update | Update / reload | PASS | |
| T6 | B Auth | Login / logout / session | PASS | |
| T7 | G + regression | Navigation / safe area / orientation / no blocking defects | PASS | |

**iPhone overall:** ☑ PASS · ☐ FAIL

---

## D. Defects found (if any)

| ID | Severity | Device | Test | Description | Blocks PASS? |
|----|----------|--------|------|-------------|:------------:|
| — | — | — | — | None observed | No |

If any **Critical/High** blocking defect remains open → overall certification = **FAIL**.

---

## E. Optional attachments

| Path | Description |
|------|-------------|
| `test-1/` … `test-7/` (optional) | Screenshots/videos (not required under amendment) |

---

## F. Owner attestation (required for PASS)

I certify that I (or my named designee above) executed the mandatory physical-device tests on Samsung Galaxy, Google Pixel, and iPhone against Production, and that the results recorded in this checklist are accurate. I understand that an unsigned or incomplete checklist is not certification evidence.

| Field | Value |
|-------|-------|
| Overall Phase 1 device certification | ☑ PASS · ☐ FAIL |
| Project Owner printed name | Erick Castillo |
| Signature (typed full name acceptable) | Erick Castillo |
| Date | July 24, 2026 |

**Status:** ✅ **COMPLETED** under `PMX-004-AMD-DEVICE-CERT-OWNER-CHECKLIST`.
