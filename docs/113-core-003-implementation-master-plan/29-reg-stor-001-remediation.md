# 29 — REG-STOR-001 Remediation

**Package:** CORE-003 · M0 · REG-STOR-001  
**Date:** 2026-07-24  
**Authorization:** M0-REG-001 — REG-STOR-001 Remediation (limited)  
**Regression:** REG-STOR-001 (High)  
**Evidence:** [`docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-stor-001/validation.txt`](../106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-stor-001/validation.txt)

> UX-012 / OPS / AUTH / COM / FIN-003 · unrelated refactors: 🔒 not authorized.

---

## 9. PASS / FAIL

| Field | Result |
|-------|--------|
| **REG-STOR-001 remediation** | ✅ **PASS** |
| **No public `media` bucket created** | ✅ Confirmed |
| **Hard-coded `storage.from("media")` in app src** | ✅ **None remaining** |
| **Production deploy of this commit** | ⏳ **Required** before live UI vendor-upload re-cert on the Vercel bundle |

---

## 1. Executive Summary

Vendor payments and vendor job photo uploads referenced a non-existent production bucket `"media"`. Production architecture uses private bucket **`media-private`** (`MEDIA_PRIVATE_BUCKET` / `mediaBucket()`).

Remediation routes both call sites through the existing `mediaBucket()` abstraction. No new bucket was created. Upload → signed URL → download validated against production Supabase storage using vendor-like org/work-order paths and allowed MIME (`application/pdf`).

---

## 2. Files modified

| Path | Change |
|------|--------|
| `apps/web/src/lib/vendor-payments/server.ts` | Import `mediaBucket`; signed URL + invoice upload use `mediaBucket()` |
| `apps/web/src/lib/vendor-jobs/server.ts` | Import `mediaBucket`; job photo upload uses `mediaBucket()` |
| `docs/113-core-003-implementation-master-plan/29-reg-stor-001-remediation.md` | **Added** — this record |
| `docs/113-core-003-implementation-master-plan/28-m0-authenticated-regression-certification.md` | Updated for REG-STOR-001 closeout |
| Governance indexes | Pointers to [29](./29-reg-stor-001-remediation.md) |

---

## 3. Root cause

| Item | Value |
|------|--------|
| Approved prod bucket | `media-private` (`public=false`) |
| Incorrect code | `admin.storage.from("media")` |
| Symptom | `Bucket not found` |
| Wrong fix (forbidden) | Creating a new `media` bucket |

---

## 4. Bucket reference audit

| Occurrence | Classification | Action |
|------------|----------------|--------|
| `vendor-payments/server.ts` `from("media")` ×2 | **INVALID (prod)** | → `mediaBucket()` |
| `vendor-jobs/server.ts` `from("media")` ×1 | **INVALID (prod)** | → `mediaBucket()` |
| `media/constants.ts` `MEDIA_PRIVATE_BUCKET` | **VALID** | Unchanged |
| `media/paths.ts` `mediaBucket()` | **VALID** | Used as SoT |
| `media/server.ts`, `reporting/vault.ts` | **VALID** | Already `MEDIA_PRIVATE_BUCKET` |
| Migration `api002a_*` bucket_id / capabilities named `media:*` | **VALID** | Capability namespace ≠ storage bucket |
| Owner/vault `documentTypeIncludes: ["media"]` | **VALID** | Document type taxonomy, not bucket |
| Docs / prior cert mentioning `"media"` | **LEGACY (docs)** | Historical evidence only |
| `storage.from("media")` after fix | — | **None in `apps/web/src`** |

---

## 5. Changes applied

```ts
import { mediaBucket } from "../media/paths";
// ...
admin.storage.from(mediaBucket()).createSignedUrl(...)
admin.storage.from(mediaBucket()).upload(...)
```

No new constants. No RLS / bucket policy changes. No public access.

---

## 6. Validation results

Against production Supabase (`mpa-prod`), service role, vendor-shaped path  
`{orgUuid}/{workOrderUuid}/invoice-reg-stor-001-*.pdf`:

| Check | Result |
|-------|--------|
| `mediaBucket()` → `media-private` | ✅ |
| Upload PDF | ✅ OK |
| Signed URL create | ✅ OK |
| Download via signed URL | ✅ HTTP 200 · `application/pdf` · `%PDF` |
| Existing object signed fetch | ✅ HTTP 200 |
| Cleanup remove probe object | ✅ OK |
| Legacy `from("media")` upload | ✅ Still `Bucket not found` (correct — no bucket created) |
| `listBuckets` | ✅ only `media-private:public=false` |
| Media unit tests | ✅ 5/5 PASS (`src/lib/media`) |

UI preview in browser / tokenized vendor portal upload against **deployed** Vercel bundle: ⏳ pending deploy of this change.

---

## 7. Security verification

| Check | Result |
|-------|--------|
| Bucket remains private | ✅ `public=false` |
| No public bucket added | ✅ |
| RLS policies unchanged | ✅ No migration |
| Signed URLs still work | ✅ |
| Secrets not exposed | ✅ |
| Permissions not weakened | ✅ |

---

## 8. Regression results

| Area | Result |
|------|--------|
| Hard-coded `"media"` storage bucket in src | ✅ Cleared |
| Vendor payments storage path | ✅ Uses `mediaBucket()` |
| Vendor jobs photo path | ✅ Uses `mediaBucket()` |
| Media module tests | ✅ PASS |
| Unrelated modules | ✅ Not modified |

---

## Next gate

**STOP** for this authorization.

1. **Deploy** this remediation to Production (Deploy Ops).  
2. Re-run / continue [28 — Authenticated Regression](./28-m0-authenticated-regression-certification.md) (updated for REG-STOR-001). Full suite PASS still requires multi-role coverage + post-deploy UI checks.  
3. Only after authenticated regression **PASS** is PMX-004 Real Device Certification the final M0 gate.  
4. Do **not** authorize UX-012 from this document.
