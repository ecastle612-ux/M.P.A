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
| Typecheck | Pending in ship step |
| Production deploy | Pending in ship step |
| User interaction matrix | **Required for PASS** |

## Ship record

| Field | Value |
| --- | --- |
| Commit | _(filled on ship)_ |
| Deployment ID | _(filled on ship)_ |
| Production URL | https://www.my-property-assistant.com |

## PASS criteria

User confirms protocol A–C on phone + desktop. Until then: **do not mark PASS**.
