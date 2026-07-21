# BR-001 — Approved Amendments A–E

**Status:** Approved with BR-001 (2026-07-20)  
**Binding for implementation**

---

## Amendment A — Responsive Brand Lockup

Four presentation modes:

### Hero (Authentication / Landing)

```
🏠 House Mark
M.P.A.
My Property Assistant
Property Operations OS
```

**Purposes:** `login`, `marketing`, `splash`, `onboarding`

### Standard (Desktop Sidebar)

```
🏠  M.P.A.
My Property Assistant
```

**Purpose:** `sidebar` (expanded)

### Compact (Mobile Navigation / Header / Collapsed chrome)

```
🏠  M.P.A.
```

**Purposes:** `drawer`, `header`, collapsed `sidebar`

### Icon Only

```
🏠
```

**Only** for genuinely constrained surfaces: browser tab, PWA icon, notification icon, launcher icon (`purpose="browser"` / icon pipeline).

**Never** icon-only on a full navigation drawer or login page.

---

## Amendment B — No Embedded Text Rule

If the logo image contains text that becomes unreadable below **80px**, `BrandLogo` must automatically switch to the responsive lockup instead of shrinking the image.

**No exceptions** on product UI surfaces.

---

## Amendment C — Single Source of Truth

Exactly one place owns branding decisions: **`BrandLogo`** (plus branding-package helpers for email/PDF).

Screens ask for a **purpose**, not an asset:

```tsx
<BrandLogo purpose="login" />
<BrandLogo purpose="drawer" />
<BrandLogo purpose="email" />
<BrandLogo purpose="header" />
<BrandLogo purpose="splash" />
```

The system determines: logo asset, variant/mode, size, theme, typography, spacing.

---

## Amendment D — Visual Regression Protection

CI must screenshot and compare against approved references:

- Login
- Mobile drawer
- Desktop sidebar
- Header
- Password reset
- Emails

Unexpected branding drift **fails the build** before Vercel.

Implementation: extend Playwright `@visual` suite (`pnpm qa:e2e:visual`) plus email HTML assertions tied to branding helpers.

---

## Amendment E — Design Partner Standard

Before any design partner demo, branding must meet:

1. Brand immediately recognizable  
2. “M.P.A.” readable on every supported device  
3. No blurry or pixelated logos  
4. No incorrect light/dark asset combinations  
5. No inconsistent spacing  
6. No duplicate logo implementations  
7. Every surface uses shared `BrandLogo` architecture  

Certification page + visual suite evidence required.
