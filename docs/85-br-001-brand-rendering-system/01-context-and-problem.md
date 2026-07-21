# BR-001 — Context and Problem

## Recurring failure mode

Despite UX-007 / ADR-019, brand regressions still recur because screens retain too much rendering authority:

| Failure | Example |
| --- | --- |
| Manual asset choice | Page picks `logo-light` / `logo-dark` incorrectly for its background |
| Arbitrary sizing | Drawer/header shrinks the square mark until “M.P.A.” inside the PNG is unreadable |
| Favicon-as-logo | `/icons/*` used where brand presentation is required |
| Duplicated lockups | Mobile navigation invents its own mark + typography composition |
| Partial migration | Some surfaces use `<Logo />`, others still hardcode paths in HTML/email/static fallbacks |
| No build brake | Direct `/branding/logo-*.png` references can re-enter without failing CI |

## Root cause

UX-007 centralized **assets and tone mapping**, but callers still decide:

- which size token to pass
- whether to force tone
- whether to invent a separate lockup
- how spacing/scale behave under collapse

That remaining freedom is enough to recreate unreadability and inconsistency.

## Platform requirement

There must be **exactly one** approved way to render M.P.A. branding:

```tsx
<BrandLogo purpose="…" />
```

No page may decide asset, size, light/dark, spacing, or scale. Those decisions belong only to the branding system.

## Constraints carried forward

1. Only ADR-019 assets: `logo-light.png` (dark backgrounds), `logo-dark.png` (light backgrounds).
2. Routes, permissions, APIs, and schema are out of scope.
3. Email/PDF non-React channels must use the same purpose/tone contract (helpers inside the branding package), not page-local URLs.
4. Browser favicons / PWA icons remain derived app icons — they are never substitutes for `BrandLogo` on product surfaces.
