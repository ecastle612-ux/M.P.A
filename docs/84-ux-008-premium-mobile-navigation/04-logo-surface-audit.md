# UX-008 — Logo Surface Audit (UX-007 Consistency)

## Why this audit is in UX-008

The mobile drawer regression is partly an **information design** problem (tiny square mark in a narrow chrome) and partly a **consistency** risk: Design Partner testing will fail if login looks crisp while navigation looks like a favicon.

UX-007 already established the adaptive two-logo system. UX-008 requires a certification-grade audit of every brand-bearing surface before Design Partner kickoff.

## Audit inventory

For each surface, record: component/path, asset used, size token, tone, readable “M.P.A.”?, notes.

| Surface | Expected control | Pass criteria |
| --- | --- | --- |
| Login / auth shell | Central `Logo` + auth brand shell | Readable mark; UX-007 paths only |
| Mobile drawer header | UX-008 brand lockup | “M.P.A.” clearly readable; no favicon-scale mark as sole brand |
| Mobile app header | `Logo` size token appropriate for 64px bar | Sharp; no clip |
| Desktop sidebar expanded | `Logo` sidebarExpanded | Sharp; contrast correct |
| Desktop sidebar collapsed | `Logo` sidebarCollapsed | Not clipped; still intentional |
| Portal shells | `Logo` via portal shell | Matches theme |
| Loading screens | Shared loading brand if present | UX-007 only |
| Empty states | No ad-hoc logo imports | Consistent or intentionally logo-less |
| Error pages / unauthorized / not-found / global-error | Central branding | UX-007 paths |
| Offline page | Static approved path | Documented non-React mapping |
| Email templates | Shared email logo token | `logo-light.png` on dark headers |
| PDF / report covers | `Logo` pdf token | Correct tone |
| Favicon / browser tab | PWA/app icons | May be derived icons; **not** used as nav brand |
| PWA icons / splash | `/public/icons` | Documented derivation from UX-007; not drawer brand |
| Marketing / landing | Auth landing currently | Same adaptive system |

## Certification searches (post-implementation)

```bash
# Banned legacy marks
rg "mpa-logo|logo-horizontal|logo-stacked|MpaLogo" apps packages docs/public -g '!**/node_modules/**'

# Direct image imports of branding files outside branding primitive
rg "from ['\"].*branding/.*\.(png|svg)|/branding/logo-" apps/web/src --glob '!**/branding/**'
```

## Outcomes required before Design Partner PASS

1. Drawer brand lockup passes readability review on iPhone-class viewport.
2. No surface renders a competing unofficial logo file.
3. Any remaining non-React static fallbacks are documented as UX-007-compliant exceptions.
4. Favicon/PWA icons are explicitly classified as **app icons**, not navigation logos.

## Note on “different logo files”

If audit finds mixed sources, remediation is:

1. Route React surfaces through `Logo` / shared branding helpers.
2. Align static/email/PDF to shared path tokens.
3. Do **not** introduce a third logo asset without a new ADR.
