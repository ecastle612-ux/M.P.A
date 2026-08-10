# Mobile Audit — Product Readiness v2

**Date:** 2026-08-10  
**Code changes:** None  
**Focus:** Resident · Technician/Vendor · Property Manager

## Resident

| Aspect | Assessment |
|--------|------------|
| Bottom navigation | Present with `aria-current` — strong |
| Safe-area | Considered in portal shell |
| Touch targets | Generally adequate on primary tabs |
| Home content | Glance cards; Packages Coming soon hurts polish |
| Billing / Maintenance / Documents | Dedicated routes; need Owner device session for camera/upload LIVE |

**Gaps:** Camera/photo capture and keyboard-on-upload not LIVE-verified (AUTH_BLOCKED). Code indicates maintenance request flows exist; deep mobile QA needs Owner phone.

## Technician / Vendor

| Aspect | Assessment | Severity |
|--------|------------|----------|
| Nav | Home + Profile only | P1 |
| Bottom nav | Missing (unlike resident) | P1 |
| Job inbox UX | Thin vs field-tech expectations | P1 |
| Accept / update / complete as thumb-first actions | Not peer-premium | P1 |

## Property Manager

| Aspect | Assessment | Severity |
|--------|------------|----------|
| Sidebar | `lg+` only; mobile uses `<details>` Menu | P1 |
| Density | Desktop-ops first | Expected; menu needs close-on-navigate + search |
| Maintenance | Dual pane at `xl` only — phone/tablet stack risk | P1 |
| Plan badge | Hidden below `md` | P3 |

## Marketing (public LIVE)

Desktop audited; layout is single-column friendly. Comparison tables use `min-w-[40rem]` → horizontal scroll risk on phone (**P2**). Full 390px LIVE pass partially covered by computerUse desktop session — Owner should recheck on device.

## Verdict

Resident is the only **intentionally mobile-first** surface. Technician and PM mobile feel like desktop shrinks — a major premium gap vs incumbents’ field apps.
