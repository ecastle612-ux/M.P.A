# ADR-022: Perception-Based Brand Certification

## Status

Accepted

## Date

2026-07-20

## Context

BR-001 / ADR-021 established a single `BrandLogo` architecture. Technical PASS can still fail human perception on real devices. Design Partner readiness requires certifying the visual experience.

## Decision

Adopt **BR-002 — Visual Brand Certification (Human Standard)** including **BR-002A — “Looks Great” Standard**:

1. **Design Director test** — Would I proudly demo this screen to a paying customer? Anything less than immediate yes = FAIL.
2. **PASS checklist** — Recognizable, readable, correct contrast, correct visual weight, balanced spacing, premium alignment, intentional, comparable to premium SaaS.
3. **Scorecard** — Readability, Balance, Contrast, Premium Feel, First Impression — each /10; any score below 9 = FAIL.
4. **Purpose-optimized presentation** — Loading = elegant house mark (never tiny full-logo wordmark); drawer = house + large typography M.P.A. + tagline; login = hero; email = horizontal lockup; browser = icon only.
5. **Brand recognition over logo fidelity** — If shrinking artwork makes the brand unreadable, switch presentation rather than faithfully rendering an unreadable image.
6. **Evidence** — Before/after, device/theme matrix, human PASS/FAIL per surface.
7. **Single system** — All changes remain inside BrandLogo / branding helpers.

Authoritative package: `docs/86-br-002-visual-brand-certification/` (including `07-amendment-br-002a.md`).

**Success criterion:** After certification, branding stops being a recurring sprint topic.

## Consequences

### Easier

- Clear human FAIL reasons; one system to fix them
- Purpose-appropriate density without page-local hacks

### Harder

- Requires human scorecards ≥ 9/10, not CI alone
- Typography-first compact surfaces may look different from “scaled logo” habits

## Alternatives Considered

1. Technical BR-001 PASS only — Rejected.  
2. Per-page visual tweaks — Rejected.  
3. New artwork — Out of scope unless ADR-019 is amended.  
