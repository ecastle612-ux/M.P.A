# REG-ACL-001 Production Verification — Checklist

**Date:** 2026-07-24  
**Deploy:** `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf`  
**SoT:** [34](../../../../113-core-003-implementation-master-plan/34-reg-acl-001-production-verification.md)  
**Results:** `verification-results.json` · `adjudication.json`

## Authentication

- [x] Anonymous blocked from protected routes
- [x] Authenticated login (Master Admin, PM, Owner, Vendor, Tenant)
- [x] Session refresh (reload) retains surface
- [x] Session expiration (cleared cookies) → login
- [x] Logout API + redirect + post-logout API 401
- [x] Re-login (PM)

## Route protection

- [x] Protected Ops routes (anon)
- [x] Protected portal routes (anon)
- [x] Master Admin routes (anon + PM deny + Master allow)
- [x] Portal → Ops immediate redirect (no Ops shell, no SetupGate)
- [x] History / refresh on denied Ops URL
- [x] Wrong-portal → `/unauthorized`

## API protection

- [x] Anonymous `/api/properties` → 401
- [x] Authorized PM `/api/properties` → 200
- [x] Post-logout → 401
- [x] Portal role API access consistent with grants (not Ops UI escalation)

## Authorization

- [x] Role resolution / assigned home
- [x] Permission enforcement (Ops membership gate)
- [x] Organization / portal isolation
- [x] Access denial behavior

## Production integrity

- [x] No REG-ACL auth regressions
- [x] No broken navigation from REG-ACL-001
- [x] Console/runtime: React #418 hydration adjudicated non-blocking

## Governance

- [x] No UX-012 / PMX-004 / AUTH deferred roles begun
- [x] No product code changes under this auth
- [x] PASS/FAIL recommendation recorded
- [ ] Implemented-Role Regression Rerun — **next gate (not begun)**
