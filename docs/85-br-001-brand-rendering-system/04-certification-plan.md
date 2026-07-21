# BR-001 — Certification Plan

## Certification page (required)

Ship a **dev-only** branding audit route (pattern may extend `/portal/certification` or a dedicated `/dev/brand-certification`) that verifies every logo location and reports:

- **PASS** or **FAIL** overall
- Violation list (surface, purpose expected, observed asset, observed size, notes)

The page must exercise light and dark surfaces and phone / tablet / desktop widths where applicable.

## Surfaces to audit

| Surface | Expected purpose / channel |
| --- | --- |
| Login | `authentication` |
| Sign up | `authentication` |
| Password reset / forgot password | `authentication` |
| Navigation drawer | `navigation` |
| Dashboard (shell brand if present) | `sidebar` / `header` |
| Header | `header` or Command Center chrome (no rogue marks) |
| Settings | no unofficial logos |
| Emails | `email` helper + correct contrast asset |
| Splash | `splash` |
| Loading screen | `loading` |
| PWA install / manifest icons | browser icons only |
| Browser icons / favicons | browser icons only |
| Mobile / tablet / desktop shells | responsive lockup rules |
| Error / unauthorized / not-found / offline | centralized `BrandLogo` |
| Portals (tenant / owner / vendor) | centralized `BrandLogo` |
| PDF / report preview | `pdf` helper |

## Automated / semi-automated checks

| ID | Check | FAIL if |
| --- | --- | --- |
| A1 | Direct asset path scan clean | Any `logo-light/dark` / `mpa-logo` outside branding package |
| A2 | No favicon-as-logo in UI | `/icons/*` used as product logo |
| A3 | Purpose floors honored | Mark rendered below Rule 6 mins without lockup |
| A4 | Contrast correct | Wrong asset for light/dark surface |
| A5 | Single implementation | Duplicate brand renderers remain |

## Visual certification (Rule 11) — all required

| Gate | Criterion |
| --- | --- |
| V1 | Logo crisp on Retina |
| V2 | “M.P.A.” readable on every supported mobile device |
| V3 | Correct logo selected automatically for light and dark backgrounds |
| V4 | No stretched, blurry, pixelated, or favicon-sized logos on product surfaces |
| V5 | Zero duplicated branding implementations |
| V6 | One shared `BrandLogo` powers every screen |
| V7 | Login, navigation, dashboard, emails, password reset, and PWA policy all align with the branding system |
| V8 | New screens require no manual brand asset/size/tone decisions |

## Verdict rule

BR-001 is **Complete** only when:

1. Migration exit criteria pass  
2. Certification page shows **PASS** with empty violation list  
3. All Rule 11 visual gates pass  
4. Build protection is enabled and green in CI  

Any open violation = **FAIL** (not “mostly done”).
