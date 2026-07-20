# ADR-019: Adaptive Two-Logo Brand System

## Status
Accepted - Implemented and Operational

## Date
2026-07-20

## Context

M.P.A. branding now has two official logo assets:

- `apps/web/public/branding/logo-light.png`
- `apps/web/public/branding/logo-dark.png`

The product currently spans many rendering channels (app shell, auth, portal, marketing, email, PDF). Without a shared adaptive selection layer, teams must apply manual per-surface logo choices, which creates drift and contrast regressions.

Prior branding documentation included single-logo assumptions that no longer match the new policy.

## Decision

Adopt an adaptive branding architecture with these mandatory rules:

1. Only two logo assets are approved and allowed in production usage:
   - `logo-light.png` for dark backgrounds
   - `logo-dark.png` for light backgrounds
2. All logo rendering must go through a central branding primitive and tone-selection contract.
3. Per-page direct logo imports are deprecated and blocked.
4. Non-React rendering channels (email/PDF) must pass explicit tone to the same asset mapping policy.
5. Production readiness requires certification evidence that no legacy logo paths remain and all audited surfaces render correct contrast.
6. Future surfaces (pages, features, email templates, PDFs, marketing pages) must use the centralized adaptive logo system; direct logo file imports outside that system are prohibited unless approved by a future ADR.

## Consequences

### Easier

- Consistent branding across every surface and channel
- Lower regression risk when themes/layouts evolve
- Enforceable governance via one mapping contract

### Harder

- Initial migration cost across many UI/rendering surfaces
- Need lint/guardrails and certification evidence before final cutover

## Implementation Record

UX-007 completed implementation, migration, certification, production validation, and source-control release on 2026-07-20.

Operational facts:

- `apps/web/public/branding/logo-light.png` and `apps/web/public/branding/logo-dark.png` are the only approved logo assets.
- The retired `apps/web/public/branding/mpa-logo.svg` asset has been removed.
- Runtime logo URLs remain root-relative:
  - `/branding/logo-light.png`
  - `/branding/logo-dark.png`
- Production serves both approved assets with HTTP 200 from `https://www.my-property-assistant.com`.
- The centralized adaptive logo system is the permanent branding foundation for app UI, portals, email, PDF/report, loading, error, offline, and future M.P.A. surfaces.

## Alternatives Considered

1. **Manual one-by-one replacement**
   - Rejected: high regression risk, no enforceable long-term policy.
2. **Single universal logo for all backgrounds**
   - Rejected: contrast and legibility fail on mixed-tone surfaces.
3. **Allow multiple unofficial variants by team**
   - Rejected: breaks brand consistency and governance.
