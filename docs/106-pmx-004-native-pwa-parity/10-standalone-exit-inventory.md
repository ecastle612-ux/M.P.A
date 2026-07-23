# 10 — Standalone Exit Inventory

**Package:** PMX-004 · Phase 4  
**Status:** Draft — Ready for Approval  
**Rule:** Every exit must be Mitigated, Same-tab, In-app viewer, or Accepted-with-return.

---

## 1. Inventory (static audit 2026-07-23)

| ID | Location | Mechanism | User impact in standalone | Proposed disposition |
| --- | --- | --- | --- | --- |
| E01 | `owner-document-row.tsx` | `target="_blank"` | Leaves PWA for document | In-app viewer or same-tab |
| E02 | `owner-reports-browser.tsx` | `target="_blank"` | Leaves PWA | In-app viewer or same-tab |
| E03 | `owner-statement-row.tsx` | `target="_blank"` | Leaves PWA | In-app viewer or same-tab |
| E04 | `document-vault-browser.tsx` | `target="_blank"` | Leaves PWA | In-app viewer or same-tab |
| E05 | `portal/tenant/documents/page.tsx` | `target="_blank"` | Leaves PWA | In-app viewer or same-tab |
| E06 | `facility/assets/[assetId]/page.tsx` | `target="_blank"` | Leaves PWA | In-app viewer or same-tab |
| E07 | `facility/records/[recordId]/page.tsx` | `target="_blank"` | Leaves PWA | In-app viewer or same-tab |
| E08 | `property-overview-panels.tsx` | `target="_blank"` | Leaves PWA | In-app / same-tab |
| E09 | `vendor-invoice-review-panel.tsx` | `target="_blank"` | Leaves PWA | In-app PDF viewer |
| E10 | `signing-progress-view.tsx` | `target="_blank"` to provider | Leaves PWA for e-sign | Same-window assign preferred; else Accepted-with-return |
| E11 | `reports-view.tsx` | `window.open` + `_blank` | May block or exit | Download/`<a download>` or in-app |
| E12 | `resident-payments-view.tsx` | `location.assign` Stripe | Unavoidable exit | Accepted-with-return (absolute success URL) |
| E13 | `company-billing-center.tsx` | `location.assign` Stripe + `_blank` | Exit / new context | Accepted-with-return + audit blanks |
| E14 | `deployment-badge.tsx` | `target="_blank"` | Admin/dev only | Acceptable external |
| E15 | Email templates | `target="_blank"` links | Opens browser; may miss PWA | Document OS limitation; use HTTPS app URLs |

Re-scan `apps/web` at Phase 4 start — inventory is living.

---

## 2. Mitigation patterns

### Pattern A — In-app document viewer

Route or modal: `/documents/view?src=…` (signed URL) using iframe or object **if CSP `frame-src` allows storage host**. May require CSP amend (Approve note). Fallback: same-tab navigation to signed URL (still leaves chrome-less PWA if cross-origin — prefer blob fetch + object URL same-origin viewer).

### Pattern B — Same-tab navigation

Replace `_blank` with `router.push` or `<a>` without blank for same-origin; for cross-origin signed files prefer Pattern A.

### Pattern C — Accepted-with-return

Stripe / OAuth-like:

1. Absolute `return_url` / `success_url` / `cancel_url` → `NEXT_PUBLIC_APP_URL` paths.  
2. Landing route restores session (existing cookies).  
3. Optional “Welcome back” toast.  
4. Test on iOS standalone specifically.

### Pattern D — Confirm before leave

For rare external links: bottom sheet “Open outside M.P.A.?” → Continue / Cancel.

---

## 3. Auth / deep link notes

| Flow | Standalone risk | Plan |
| --- | --- | --- |
| Password login | Low | No change |
| Invite / reset email | Opens Safari | Keep HTTPS links; document re-open from Home Screen; consider Universal Links later (out of scope) |
| Push deep link | Medium | Absolute URL; Phase 6 verify |
| OAuth | N/A today | If added later, COOP `same-origin` may block popups — use redirect |

---

## 4. Phase 4 exit criteria

- [ ] All E01–E13 dispositioned  
- [ ] Device test: owner docs + vault + reports in standalone  
- [ ] Stripe resident or company billing return PASS on Android + iPhone  
- [ ] E-sign path documented with evidence  
- [ ] CSP changes (if any) security-reviewed  
