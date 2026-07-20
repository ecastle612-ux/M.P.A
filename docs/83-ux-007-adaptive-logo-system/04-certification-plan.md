# UX-007 - Certification Plan

## Certification goal

Prove that all logo rendering paths use approved assets and correct contrast logic, with zero legacy fallback.

## PASS criteria

1. Only approved files are referenced at runtime:
   - `/branding/logo-light.png`
   - `/branding/logo-dark.png`
2. Dark backgrounds always render light logo.
3. Light backgrounds always render dark logo.
4. Email templates and PDF outputs use explicit tone mapping.
5. No deprecated logo asset imports remain.
6. No regressions in auth, portal, app shell, and loading screens.

## Automatic FAIL conditions

- Any use of legacy logo files
- Direct per-page logo file imports bypassing branding primitive
- Wrong contrast pairing on any audited screen
- Missing logo on any required surface
- Distorted logo dimensions
- Email/PDF output using incorrect logo for background

## Test matrix

| Area | Checks |
| --- | --- |
| App shell | Sidebar expanded/collapsed, top nav, mobile header, loading |
| Auth | Login, forgot password, reset password, invitation |
| Portals | Tenant, owner, vendor shell/header |
| Feature pages | Representative dark and light cards/pages/dialogs |
| Email | At least one dark-background template and one light-background template |
| PDF | Statement/report export with logo |

## Evidence package required before Production Ready

- Screenshot set for each matrix area
- Email HTML evidence showing selected logo path
- PDF artifact evidence
- Search/lint output proving no banned logo paths
- Final sign-off note from UX + QA
