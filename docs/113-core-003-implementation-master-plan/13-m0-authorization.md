# 13 — M0 Production Readiness Authorization

**Package:** CORE-003  
**Phase:** M0 — Production Readiness  
**Status:** ✅ **AUTHORIZED** (2026-07-23)  
**Scope:** M0 checklist only  

---

## Authorization

M0 Production Readiness execution is **AUTHORIZED** as the first activity permitted under CORE-003.

### Explicitly NOT authorized

| Unit | Status |
|------|--------|
| UX-012 Slice A | ✅ Later authorized 2026-07-24 ([38](./38-ux-012-slice-a-authorization.md)) — **not** part of original M0 authorize |
| OPS-001 Slice A | ✅ Later authorized 2026-07-24 ([39](./39-ops-001-slice-a-authorization.md)) — **not** part of original M0 authorize |
| AUTH-001 Slice A | 🔒 NOT authorized |
| COM-001 (any) | 🔒 NOT authorized |
| FIN-003 (any) | 🔒 NOT authorized |
| Any other M1–M6 implementation | 🔒 NOT authorized |

### Unlock to UX-012 Slice A

Requires **all** of:

1. PMX-004 Phase 1 Final PASS  
2. Real-device certification complete  
3. Infrastructure validation PASS  
4. PAY-001 verification complete (M0 scope)  
5. No critical regressions  
6. Production Readiness Report marked **GO**  
7. Explicit phrase: `AUTHORIZE UX-012 SLICE A`

Until then: **STOP** after reporting — do not begin UX-012 Slice A.

---

## Execution report

See [14 — M0 Production Readiness Report](./14-m0-production-readiness-report.md).
