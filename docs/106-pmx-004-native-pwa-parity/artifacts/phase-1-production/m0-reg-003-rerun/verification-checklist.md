# Implemented-Role Regression Rerun — Checklist

**Date:** 2026-07-24  
**Deploy:** `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf`  
**SoT:** [28a](../../../../113-core-003-implementation-master-plan/28a-implemented-role-regression-rerun.md)  
**Results:** `regression-results.json` · `adjudication.json` · `pm-properties-requal.json`

## Authentication

- [x] Login (all implemented roles)
- [x] Logout
- [x] Session refresh
- [x] Session expiration
- [x] Anonymous route / API protection
- [x] Re-login

## Navigation

- [x] Correct landing pages
- [x] Route protection (Ops / portal / Master Admin)
- [x] Unauthorized redirects
- [x] Browser history after denied Ops URL

## Permissions

- [x] Allowed PM / portal / Master actions functional
- [x] Restricted actions blocked
- [x] Organization isolation preserved

## Core workflows

- [x] PM Ops surfaces end-to-end navigation
- [x] Owner / Tenant / Vendor portals
- [x] QA dataset visible (requalified)
- [x] No REG-ACL-001 regressions

## API

- [x] Expected success (PM)
- [x] Expected auth failures (anon / logout)
- [x] No Ops permission escalation

## UI stability

- [x] No material runtime / console errors
- [x] No broken navigation
- [x] Loading states resolve

## Governance

- [x] Deferred AUTH roles SKIP only
- [x] No PMX-004 / Final M0 / UX-012 begun
- [x] PASS/FAIL recommendation recorded
