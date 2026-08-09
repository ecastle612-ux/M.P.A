# Sprint 2 — Guided Setup Polish Report

**Status:** Complete — awaiting Owner acceptance before Sprint 3  
**Date:** 2026-08-09  
**Scope:** UX polish only · Claim → Guided Setup → Mission Control first-run handoff  

## Mission

Every screen answers **“What should I do next?”**

## Surfaces polished

| Step | Route / component | Changes |
|------|-------------------|---------|
| Checkout success | `/checkout/success` | Customer “What to do next”; hide raw session/status jargon |
| Continue / claim | `/commerce/continue` | Customer phase titles; friendly step labels; progress bar; missing-session empty state; claim CTA clarity |
| Claim password | `/login` + commerce params | Commerce headlines; humanized claim errors; “Setting password…” loading; stronger alerts |
| Guided Setup | `/setup` | Sticky next-step callout; X of N progress; elevated alerts; hydrate skeleton/error; checklist chrome; finish success |
| Mission Control handoff | `/pm/mission-control` | Congratulations / operational welcome; Where to begin; empty-state alignment; successCopy; Getting started eyebrow |

## Issue resolution

| ID | Sev | Result |
|----|-----|--------|
| GS-001 | P0 | Fixed — customer step labels + phase (presentation map only) |
| GS-002 | P1 | Fixed — claim copy clarifies set password with purchase email |
| GS-003 | P1 | Fixed — `friendlyCommerceClaimError` |
| GS-004 | P2 | Fixed — commerce-specific button/loading copy |
| GS-005 | P2 | Fixed — missing `session_id` empty state |
| GS-006 | P2 | Fixed — softer recovery / status errors |
| GS-007 | P3 | Fixed — progress proportion on Continue |
| GS-008 | P0 | Fixed — “What to do next” on Setup |
| GS-009 | P1 | Fixed — Step X of N + progressbar |
| GS-010 | P1 | Fixed — alerts elevated with `role="alert"` |
| GS-011 | P2 | Fixed — hydrate skeleton + failed-load notice |
| GS-012 | P2 | Fixed — done/pending checklist chrome + sr-only |
| GS-013 | P2 | Fixed — stronger finish notice |
| GS-014 | P3 | Fixed — billing return helper copy |
| GS-015 | P2 | Fixed — stacked hierarchy / max-width sections |
| GS-016–GS-020 | P0–P3 | Fixed — see First Run Experience Report |

## Explicit non-changes (verified)

- ADR-019 / Product Constitution  
- Stripe checkout create, webhooks, Price IDs  
- Provisioning checkpoints / machine  
- Auth architecture / claim API contracts (presentation of errors only)  
- Setup checklist schema keys  
- Finish redirect remains `/pm/mission-control`  
- No new Guided Setup steps or Mission Control workflows  

## Files touched

- `apps/web/src/components/marketing/commerce-continue-page.tsx`
- `apps/web/src/components/marketing/checkout-success-page.tsx`
- `apps/web/src/components/shell/login-form.tsx`
- `apps/web/src/components/commercial/guided-setup-page.tsx`
- `apps/web/src/components/commercial/mission-control-page.tsx`
- `docs/51-phase-3-production-polish/sprint-2-*.md`

## STOP

Await Owner acceptance. **Do not begin Sprint 3** (Mission Control polish program).
