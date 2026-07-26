# 10 — Standalone Exit Inventory

**Package:** PMX-004 · Phase 4  
**Status:** ✅ **Implemented dispositions** (2026-07-26) — living inventory  
**Rule:** Every exit must be Mitigated, Same-tab, In-app viewer, or Accepted-with-return.  
**Authorize SoT:** [25 — Phase 4 Authorization](./25-phase-4-authorization.md)  
**Implementation:** [27 — Phase 4 Implementation](./27-phase-4-implementation.md)

---

## 1. Inventory (audit 2026-07-23 · closed 2026-07-26)

| ID | Location | Mechanism (was) | Disposition | Status |
| --- | --- | --- | --- | --- |
| E01 | `owner-document-row.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E02 | `owner-reports-browser.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E03 | `owner-statement-row.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E04 | `document-vault-browser.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E05 | `portal/tenant/documents/page.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E06 | `facility/assets/[assetId]/page.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E07 | `facility/records/[recordId]/page.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E08 | `property-overview-panels.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E09 | `vendor-invoice-review-panel.tsx` | `target="_blank"` | **In-app viewer** — `StandaloneOpenLink` | ✅ Mitigated |
| E10 | `signing-progress-view.tsx` | `target="_blank"` | **Accepted-with-return** — confirm + same-window `location.assign` | ✅ Mitigated |
| E11 | `reports-view.tsx` | `window.open` + `_blank` | **In-app viewer** — viewer state + `StandaloneOpenLink`; no `window.open` | ✅ Mitigated |
| E12 | `resident-payments-view.tsx` | `location.assign` Stripe | **Accepted-with-return** — confirm + absolute success/cancel URLs + `ReturnToMpaBanner` | ✅ Mitigated |
| E13 | `company-billing-center.tsx` | Stripe assign + `_blank` invoices | **Accepted-with-return** (Checkout/Portal) · invoice PDF **viewer** · hosted invoice **leave-confirm** | ✅ Mitigated |
| E14 | `deployment-badge.tsx` | `target="_blank"` | **Acceptable external** (admin/dev feedback) | ✅ Acceptable |
| E15 | Email templates | `target="_blank"` in mail HTML | **Documented** — HTTPS `NEXT_PUBLIC_APP_URL` CTAs; iOS reopen notes ([26](./26-auth-deep-link-notes.md)) | ✅ Documented |

Re-scan 2026-07-26: no additional in-app `_blank` / `window.open` exits beyond E14–E15.

---

## 2. Mitigation patterns (shipped)

| Pattern | Implementation |
|---------|----------------|
| **A — In-app viewer** | `StandaloneDocumentViewer` — fetch → blob object URL → iframe/img; CSP `frame-src 'self' blob:` |
| **B — Same-tab** | Fallback “Open in this tab” + `triggerSameWindowDownload` |
| **C — Accepted-with-return** | Absolute Stripe URLs + `ReturnToMpaBanner` + same-window assign after confirm |
| **D — Confirm before leave** | `LeaveAppConfirm` Modal |

---

## 3. Auth / deep link notes

See [26 — Auth / deep-link notes](./26-auth-deep-link-notes.md).

---

## 4. Phase 4 exit criteria

- [x] All E01–E13 dispositioned  
- [x] Owner docs + vault + reports standalone path — ✅ **PASS** via code + unit tests + documented flow evidence ([28](./28-phase-4-validation.md)); real-device smoke remains recommended ops hygiene  
- [x] Stripe resident / company billing return path — ✅ **PASS** via absolute return URLs + confirm + `ReturnToMpaBanner` evidence ([28](./28-phase-4-validation.md)); real-device Android/iPhone smoke remains recommended ops hygiene  
- [x] E-sign path documented with evidence (confirm + same-window)  
- [x] CSP change (`frame-src 'self' blob:`) security-reviewed as Phase 4 scope (narrow amend; blob only)  
- [x] Phase 4 **Validated PASS** — [28](./28-phase-4-validation.md) · [CORE-003 §68](../113-core-003-implementation-master-plan/68-pmx-004-phase-4-validation.md) 
