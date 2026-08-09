# Sprint 1.1 Authorization — Commercial Conversion Polish

| Field | Value |
|-------|--------|
| Status | **Authorized** |
| Date | 2026-08-09 |
| Owner instruction | `AUTHORIZE PHASE 3 — PRODUCTION POLISH SPRINT 1.1` · Commercial Conversion Polish |
| Parent | Phase 3 Production Polish (Sprint 1 delivered) |

## Objective

Improve the public commercial experience by making Live Demo demonstrate M.P.A. value and by making pricing transparent — polish only.

## In scope

1. **Live Demo** — presentation improvements from existing demo snapshot data (PM / FO / Complete)  
2. **Pricing transparency** — display amounts from configured Stripe Price IDs  
3. **Confirm Plan** — same live Stripe pricing before Checkout  
4. **Regression** — public surfaces + Stripe Checkout path unchanged in architecture  

## Out of scope (forbidden)

- Architecture changes  
- ADR-019 / Product Constitution edits  
- Workflow changes  
- Product changes  
- Inventing pricing  
- Stripe architecture changes  
- Sprint 2  

## Constraints

- Demo: existing snapshots only; no production data; no fabricated unrealistic entities  
- Pricing: read Stripe Price objects via configured env Price IDs; if unavailable, show explicit warning  
- Never show “Amount confirmed in Stripe” without the actual amount  
- Public funnel remains Modules → Pricing → Confirm Plan → Stripe → Account  

## Deliverables

- Sprint 1.1 Commercial Polish Report  
- Demo Improvement Report  
- Pricing Transparency Report  
- Before/After screenshots  
- Regression Report  
- **STOP** for Owner acceptance before Sprint 2  
