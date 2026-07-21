# BR-001 — System Spec

## Rule 1 — One brand component

### Public API (React)

```tsx
<BrandLogo purpose="login" />
<BrandLogo purpose="drawer" />
<BrandLogo purpose="sidebar" collapsed />
<BrandLogo purpose="email" />
<BrandLogo purpose="header" />
<BrandLogo purpose="splash" />
<BrandLogo purpose="loading" />
<BrandLogo purpose="onboarding" />
```

Presentation modes (Amendment A): **Hero** · **Standard** · **Compact** · **Icon Only** (browser/PWA only).

Optional props (non-decision props only):

| Prop | Allowed | Forbidden |
| --- | --- | --- |
| `purpose` | Required enum | Custom pixel widths from pages |
| `collapsed` | Navigation/sidebar collapse hint | Forcing arbitrary sizes |
| `priority` | LCP hint for auth/splash | — |
| `decorative` / `aria-*` | A11y | — |
| `className` | Layout alignment only (no width/height overrides that defeat mins) | `w-*` / `h-*` that shrink below floors |

**Deprecated after BR-001 cutover:** `<Logo size="…" />`, `MobileBrandLockup` mark-size choices, and any page-local lockup that selects assets or widths.

Compatibility shim (optional, time-boxed): `<Logo />` may re-export `BrandLogo` with a mapped purpose during migration, then be removed.

---

## Rule 2 — Zero direct image usage outside branding package

Forbidden outside `packages/shared` branding module + the single BrandLogo implementation package/path:

- `logo-light.png`
- `logo-dark.png`
- `mpa-logo.*`
- SVG logo assets used as product logos
- Favicon / PWA icon paths used as logos on app/auth/portal/email surfaces

Allowed exceptions (documented, not “logos”):

- `/icons/*` as **browser / PWA icons only** (`purpose: "browser"` is metadata for audit — never rendered via `BrandLogo` as UI artwork)
- Certification pages that assert paths programmatically inside the branding audit harness

---

## Rule 3 — Automatic theme / background detection

`BrandLogo` selects the ADR-019 asset from **surface tone context**, not from page props in normal UI:

| Surface background | Asset |
| --- | --- |
| Light | `logo-dark.png` |
| Dark | `logo-light.png` |

Mechanism:

1. App shells / auth shells / portal shells provide `BrandSurfaceTone` (or successor) around brand-bearing regions.
2. `BrandLogo` reads context; default fails closed to a certified surface tone for that shell.
3. Non-React channels (email/PDF) call branding helpers with an explicit surface tone — still inside the branding package, never a raw path chosen by a feature module.

Developers must not manually choose light/dark logos on screens.

---

## Rule 4 — Purpose-based rendering

Do **not** stretch one presentation everywhere. Purpose drives mark size, lockup mode, and spacing:

| Purpose | Presentation intent | Typical mark band |
| --- | --- | --- |
| `authentication` | Large premium | ≥ 160px mark or auth lockup |
| `splash` | Hero | ≥ 220px mark or splash lockup |
| `loading` | Calm interim | loading band (readable; not favicon) |
| `navigation` | Medium readable drawer/header | ≥ 80px mark or nav lockup |
| `sidebar` | Compact rail | sidebar band; collapsed → icon + “M.P.A.” lockup |
| `header` | Compact topbar if needed | never below navigation readability |
| `email` | Email-optimized | email token via branding helper |
| `pdf` | Report/document | pdf token via branding helper |
| `browser` | Favicon/PWA only | **not** a UI `BrandLogo` render |

Exact pixel tokens live in `packages/shared` branding constants owned by BR-001 (replacing free-form page `size` selection).

---

## Rule 5 — Readability-first lockup

If rendering the square mark would make the embedded “M.P.A.” wordmark unreadable for that purpose/viewport, `BrandLogo` **must not shrink further**. It automatically switches to a responsive brand lockup:

```
[ House / approved mark at readable size ]

M.P.A.
My Property Assistant
Property Operations OS   ← where purpose warrants (auth, splash, expanded nav)
```

Collapsed navigation / collapsed sidebar:

```
[ Mark ]  M.P.A.
```

Lockup typography uses Canopy tokens. No page invents alternate lockup copy or assets.

---

## Rule 6 — Minimum sizes (hard floors)

Never render the brand mark smaller than:

| Mode | Minimum |
| --- | --- |
| Icon-only mark | **48px** |
| Navigation | **80px** |
| Authentication | **160px** |
| Splash | **220px** |

Implementation must **reject** (dev assert / clamp-up / switch to lockup) any request that would go below these floors. Silent shrink is a FAIL.

Note: UX-007 tokens such as `mobile: 56` / `sidebarCollapsed: 56` are **superseded** where they conflict; BR-001 floors win after approval.

---

## Rule 7 — Background certification

Every `BrandLogo` render must use the contrast-correct asset for its surface. Violations are certification FAILs:

- White / light background → never `logo-light.png`
- Dark background → never `logo-dark.png`

No exceptions for “it looked fine once.”

---

## Rule 8 — Responsive behavior

Within a purpose, `BrandLogo` adapts lockup density:

| Viewport / chrome | Behavior |
| --- | --- |
| Desktop | Larger lockup where purpose allows |
| Tablet | Medium lockup |
| Phone | Compact lockup |
| Collapsed navigation / sidebar | Icon + “M.P.A.” (never tiny unreadable artwork alone) |

Pages pass `purpose` (+ optional `collapsed`), not breakpoint-specific widths.

---

## Ownership layout (post-approval)

| Concern | Location |
| --- | --- |
| Paths, floors, purpose tokens, tone mapping | `packages/shared` branding module |
| React `BrandLogo` + surface tone provider | Single branding component module under `apps/web` (or shared UI package if preferred in implementation) |
| Email/PDF helpers | Branding package helpers only |
| ESLint / CI guards | Repo lint + script (see [05-build-protection.md](./05-build-protection.md)) |
| Certification route | Dev-only audit page (see [04-certification-plan.md](./04-certification-plan.md)) |

---

## Success criterion

Replace or redesign the logo assets **once** under ADR-019 paths; every surface updates through `BrandLogo` with **zero** per-page brand edits.
