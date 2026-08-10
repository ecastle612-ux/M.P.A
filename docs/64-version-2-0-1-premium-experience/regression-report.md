# Version 2.0.1 — Regression Report

**Date:** 2026-08-10  
**Branch:** `cursor/version-2-0-1-premium-experience-7697`

## Automated

| Check | Result |
|-------|--------|
| `apps/web` typecheck | PASS |
| `apps/web` lint | PASS |
| `packages/shared` vitest (131) | PASS — includes FO nav + View As href assertions |

## Surfaces intentionally unchanged

- Stripe Checkout / Confirm Plan commercial flow order  
- Provisioning architecture (only email honesty + notices)  
- Authentication model  
- Leasing Sprint 1 workflows (copy only)  
- No Background Screening / Capital Projects / Marketplace  

## Risk notes

| Change | Regression risk | Mitigation |
|--------|-----------------|------------|
| Email fail-closed | Medium | Vitest still stubs offline; production never stubs |
| FO nav hide planned | Medium | Routes remain for entitlement; MC roadmap visible |
| Search dedupe | Medium | ⌘K retains property/resident search |
| View As path move | Low | Legacy redirect preserved |

## Manual LIVE (after Owner merge + deploy)

- [ ] System Health Email card truthful  
- [ ] Complete Platform sidebar: FO = Mission Control only  
- [ ] Resident home: no Coming soon / Soon  
- [ ] Support Center → Support actions / View As  
- [ ] Authenticated route shows skeleton on slow nav  
- [ ] Vendor portal bottom nav on phone  
- [ ] Marketing: trust strip, annual badge, Confirm {Product}  
- [ ] Commercial / PM / FO MC / Documents / Reporting / Leasing still load  

**STOP** after Owner LIVE acceptance. No 2.0.2 until authorized.
