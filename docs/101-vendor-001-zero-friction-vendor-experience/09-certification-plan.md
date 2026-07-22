# 09 — Certification Plan

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

---

Automated tests do **not** replace device certification.

| ID | Check | Evidence |
|----|-------|----------|
| V01 | QR opens correct WO on iPhone Camera → Safari | Screenshot + WO id |
| V02 | QR opens correct WO on Android Camera → Chrome | Screenshot |
| V03 | Desktop Chrome / Safari / Edge job card usable | Screenshots |
| V04 | Tablet layout no clipped CTAs | Screenshots |
| V05 | Start Job → status + arrival audit + PM notify | DB + notification |
| V06 | Finish Job → awaiting approval + completion audit | DB |
| V07 | First invoice asks only name?/method/email/phone | Screenshot |
| V08 | Return visit welcome + profile reuse | Screenshot |
| V09 | PM approve + Mark Paid → history on vendor & property | Screenshots |
| V10 | Revoked token fails closed | 410 response |
| V11 | No regression to PM work-order create/edit | Smoke |

**PASS** only when V01–V11 pass for the approved phase scope.
