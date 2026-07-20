# UX-007 - System Spec

## Canonical policy

Only these assets are allowed:

- `apps/web/public/branding/logo-light.png`
- `apps/web/public/branding/logo-dark.png`

Selection rule:

- Dark background -> `logo-light.png`
- Light background -> `logo-dark.png`

## Required architecture

Implementation must use a reusable branding system, not per-page custom swaps.

### 1) Central logo primitive

Create one canonical UI primitive (name flexible, e.g. `BrandLogo`) that:

- Accepts a background/tone intent
- Selects one approved asset path
- Applies consistent sizing presets
- Exposes accessibility-safe defaults (`alt`, decorative mode)

No page/component should import logo files directly.

### 2) Tone model

Define explicit tone inputs:

- `dark-surface` (use light logo)
- `light-surface` (use dark logo)
- `auto` (resolve from provider/theme/background contract)

`auto` must resolve deterministically and never silently pick deprecated assets.

### 3) Surface tone source of truth

Tone should come from one of the following, in order:

1. Explicit surface prop (highest priority)  
2. Branding context provider in layout/shell  
3. Theme token or background token mapping (fallback)  

If unresolved, fail-safe defaults must prefer legibility and emit a development warning.

### 4) Non-React channels

Emails and PDFs cannot rely on client theme detection. They must pass explicit tone during render:

- Email render pipeline picks logo by template background
- PDF render pipeline picks logo by document background

### 5) Legacy asset containment

Introduce a migration guardrail:

- Deprecate legacy logo exports
- Add lint/search checks for banned logo paths
- Block new direct imports of logo files outside branding primitives

## Backward compatibility strategy

Rollout should be controlled:

1. Introduce new primitive + mapping layer
2. Update shared shells/layouts first (highest blast radius)
3. Update remaining feature surfaces
4. Remove legacy logo paths after coverage is complete

## Accessibility and visual constraints

- Minimum contrast must remain readable on every mapped background
- Logo dimensions must use predefined size tokens/presets
- No stretch/distort behavior
- Alt text policy must be consistent (`M.P.A. My Property Assistant` unless decorative)
