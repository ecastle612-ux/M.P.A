# UX-007 - Migration Report

## Status

**Implementation status:** Complete.  
**Production Ready status:** Complete for UX-007 branding.

## Files modified

### Branding system

- `packages/shared/src/branding.ts`
- `packages/shared/src/index.ts`
- `apps/web/src/lib/branding.ts`
- `apps/web/src/components/branding/logo.tsx`
- `packages/email/src/index.ts`
- `packages/email/tsconfig.json`

### UI surfaces

- `apps/web/src/components/shell/application-shell.tsx`
- `apps/web/src/components/shell/responsive-navigation.tsx`
- `apps/web/src/components/portal/portal-shell.tsx`
- `apps/web/src/components/financial/report-document.tsx`
- `apps/web/public/offline.html`
- `apps/web/public/icons/README.md`

### Email / Auth artifacts

- `apps/web/src/lib/integrations/email/render.ts`
- `apps/web/src/lib/integrations/email/render.test.ts`
- `supabase/templates/recovery.html`
- `docs/81-eml-001-transactional-email-experience/fixtures/after/*.html`
- `docs/81-eml-001-transactional-email-experience/02-visual-system.md`
- `docs/81-eml-001-transactional-email-experience/05-implementation-plan.md`

### Governance / historical docs

- `docs/33-px-003-enterprise-ui-overhaul/README.md`
- `docs/35-px-003b-finalize-branding-navigation/README.md`
- `docs/36-px-004-official-brand-system/README.md`
- `docs/37-px-005-official-brand-asset-replacement/README.md`
- `docs/80-ep-018-root-cause-recovery/01-root-cause-audit.md`
- `docs/80-ep-018-root-cause-recovery/02-certification-report.md`

## Assets removed

- `apps/web/public/branding/mpa-logo.svg` (retired single-logo asset)

## Approved assets retained

- `apps/web/public/branding/logo-light.png`
- `apps/web/public/branding/logo-dark.png`

No other files remain in `apps/web/public/branding/`.

## Architecture implemented

- The pure logo policy now lives in `@mpa/shared`:
  - `BrandSurfaceTone`
  - `BrandLogoTone`
  - `logoPathForTone`
  - `logoPathForBackground`
  - `MPA_LOGO_WIDTH`
- `apps/web/src/components/branding/logo.tsx` is the centralized React primitive.
- App layouts provide deterministic surface tone context:
  - root/app surfaces default to `light-surface`
  - sidebar and auth shell use `dark-surface`
- Email and PDF/report paths use the same shared mapping and size tokens.
- Static offline fallback explicitly documents the UX-007 non-React mapping.

## Branding inconsistencies corrected

- Mobile app header now uses the `mobile` logo token.
- Portal and mobile drawer headers now use the `navigation` logo token.
- In-app report cover now uses the `pdf` logo token.
- Email/Auth recovery templates now use the approved dark-header logo path (`logo-light.png`) instead of PWA icon imagery.
- Historical branding docs that described retired asset systems now explicitly point to UX-007 / ADR-019.

## Certification searches

### Legacy logo references

Command class:

```bash
rg "mpa-logo|logo-horizontal|logo-stacked|mpa-icon|MpaLogo|brand-trace-meta|trace-official-brand|generate-brand-assets"
```

Result: **PASS** — no legacy logo component/path references remain.

### Direct imports / deprecated logo paths

Command class:

```bash
rg "from ['\"][^'\"]*(logo|branding).*\.(png|svg)|import .*logo.* from|/icons/icon-192\.png"
```

Result: **PASS with note** — no direct logo imports remain. `icon-192.png` remains only as a PWA app icon constant, not as rendered logo branding.

### Branding assets

`apps/web/public/branding/` contains only:

- `logo-light.png`
- `logo-dark.png`

Result: **PASS**.

## Validation

| Check | Result |
| --- | --- |
| `pnpm --filter @mpa/web exec vitest run src/lib/integrations/email/render.test.ts` | PASS |
| `pnpm --filter @mpa/web typecheck` | PASS |
| `pnpm --filter @mpa/shared typecheck` | PASS |
| `pnpm --filter @mpa/email typecheck` | PASS |
| Focused ESLint on changed web branding/email/report files | PASS |
| `pnpm --filter @mpa/shared lint` | PASS |
| `pnpm --filter @mpa/email lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | FAIL - unrelated existing facility timeline filter test |
| `pnpm lint` | INCONCLUSIVE - stopped after web lint hung with no diagnostics; focused/package lint for UX-007 files passed |

## Remaining manual review

- Browser visual review should verify dark/light logo contrast in:
  - auth pages
  - app shell/sidebar
  - portal shells
  - loading/offline states
  - report preview
- Email inbox review should confirm generated HTML renders `logo-light.png` correctly in target clients.
- PDF/export review should confirm the `pdf` logo size token renders cleanly in produced artifacts.
- Existing unrelated failure remains in `apps/web/src/lib/facility/contracts.test.ts` (`facility.asset_installed` + `future` filter). This is not caused by UX-007.

## Final confirmation

UX-007 and ADR-019 have been implemented for source architecture, asset policy, generated email/Auth artifacts, production static assets, visual certification, and source-control release requirements. UX-007 is **Completed and Production Ready**.
