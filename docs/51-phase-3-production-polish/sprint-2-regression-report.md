# Sprint 2 — Regression Report

**Date:** 2026-08-09  
**Branch:** `cursor/phase3-sprint2-guided-setup-polish-afef`  

## Commercial / journey regression

| Path | Expectation | Result |
|------|-------------|--------|
| Checkout | Stripe session create + Confirm Plan unchanged | Pass — no Stripe/checkout create edits |
| Provisioning | Checkpoints / status API unchanged | Pass — Continue uses presentation map only |
| Claim | claim-password + claim APIs unchanged | Pass — error display humanized only |
| Email verification messaging | Purchase-email claim path clarified | Pass — copy only |
| Guided Setup | Checklist keys + finish → MC | Pass — keys and redirect unchanged |
| Mission Control | Existing nextAction / daily ops | Pass — presentation + empty-state copy only |

## Technical checks

| Check | Result |
|-------|--------|
| `pnpm typecheck` (`apps/web`) | Pass |
| Product Constitution / ADR-019 | Untouched |
| Pricing / catalog | Untouched this sprint |
| Database schema | Untouched |
| Auth architecture | Untouched |

## Commercial certification

Commercial certification suite must continue to **PASS** in CI. This sprint does not alter provisioning, Stripe webhooks, or checkout session creation. Any CI failure should be treated as environmental / flaky unless claim/setup API contracts were modified (they were not).

## Manual smoke (agent environment)

| Surface | Note |
|---------|------|
| `/checkout/success` | Loads; missing session alert |
| `/commerce/continue` | Missing session empty state + CTAs |
| `/login?mode=sign_up&saas_checkout_session=…` | Commerce claim copy + CTAs |
| `/setup`, `/pm/mission-control` | Auth-gated (307 → `/login`) — polish verified in code review + typecheck |

## STOP

Owner acceptance required before Sprint 3.
