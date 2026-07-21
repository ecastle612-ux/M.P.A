# 04 — Certification Report

**Package:** AI-001  
**Status:** **Awaiting User Verification** (not PASS)

## Root cause

The floating launcher stacked at **`z-40` under the keepMounted mobile Drawer (`z-50`)**, so the OS bubble could paint but fail reliable hit-testing on device. Portals also omitted the launcher entirely, and most list routes never set page context.

## Runtime fixes

See [02-fix-log.md](./02-fix-log.md) (F1–F6).

## Evidence (engineering)

| Check | Result |
| --- | --- |
| Typecheck / unit tests | PASS (`ai-route-context.test.ts`) |
| Production deploy | **READY** |
| User interaction matrix | **Required for PASS** |

## Ship record

| Field | Value |
| --- | --- |
| Commit | `1ca232d` |
| Deployment ID | `dpl_BCDTPXnheuj3fwqXqeNuaCLjcpKo` |
| Production URL | https://www.my-property-assistant.com |

## PASS criteria

User confirms protocol A–C on phone + desktop. Until then: **do not mark PASS**.
