# UX-007 Visual Certification Report

**Date:** 2026-07-20  
**Scope:** Final visual QA pass against the running local application plus generated email/report artifacts.  
**Verdict:** **Production-ready for UX-007 branding.**

UX-007 architecture is in place, reachable app surfaces route logo rendering through the adaptive system, and the follow-up certification pass resolved the production asset, registration, theme switching, and protected portal blockers.

## Screens Inspected

| Surface | Result | Evidence |
| --- | --- | --- |
| Login / landing | Pass | `logo-light.png` on dark auth shell, 260 x 260, centered, no distortion. |
| Register | Pass | Mouse and keyboard activation switch to `Create Account`; desktop, mobile, light, and dark checks pass. |
| Forgot Password | Pass | `logo-light.png` on dark auth shell, 260 x 260, centered, no distortion. |
| Password Recovery | Partial pass | Branded recovery shell and invalid/no-token state pass; live token success state was not available in this session. |
| Dashboard | Pass after fixes | Sidebar expanded and collapsed states inspected. Collapsed clipping was corrected. |
| Sidebar expanded | Pass | `logo-light.png`, 140 x 140, dark sidebar surface. |
| Sidebar collapsed | Pass after fix | `logo-light.png`, 56 x 56, x=3, fully inside rail. |
| Header | Pass after fix | Mobile header logo corrected to 56 x 56, x=14, y=0. |
| Mobile Navigation | Pass | Header logo and drawer logo inspected; drawer uses `logo-dark.png`, 96 x 96. |
| Tenant Portal | Pass | Dev-only certification route reuses `RolePortalFrame`/`PortalShell` with seeded data; light uses `logo-dark.png`, dark uses `logo-light.png`, desktop and mobile pass. |
| Owner Portal | Pass | Dev-only certification route reuses `RolePortalFrame`/`PortalShell` with seeded data; light uses `logo-dark.png`, dark uses `logo-light.png`, desktop and mobile pass. |
| Vendor Portal | Pass | Dev-only certification route reuses `RolePortalFrame`/`PortalShell` with seeded data; light uses `logo-dark.png`, dark uses `logo-light.png`, desktop and mobile pass. |
| Accounting | Pass | Shell branding and accounting subnav inspected. |
| Maintenance | Pass | Shell branding plus empty table state inspected. |
| Reports | Pass | Reports catalog inspected. |
| PDF / Report Preview | Pass | Preview rendered in modal; document logo uses `logo-dark.png`, 96 x 96 on light report surface. |
| AI Operations Center | Pass | Loading state and resolved page inspected. |
| Loading Screens | Pass where reachable | AI Operations loading and dashboard sub-loading cards inspected; no stray logo usage. |
| Empty States | Pass | Maintenance empty table and AI empty conversation/recommendation states inspected. |
| Error Pages | Pass after fix | Unauthorized, not-found, shared friendly errors, and global fallback updated for UX-007 branding. |
| Offline Page | Pass | Static fallback uses `logo-light.png`, 160 x 160 on dark surface. |
| Marketing Website | Not present | `/` redirects to `/login`; no separate marketing site is exposed in the running app. Login shell serves as the current public landing surface. |
| Email Templates | Pass | Generated HTML references `https://www.my-property-assistant.com/branding/logo-light.png`; production now returns HTTP 200 for both approved assets. |

## Issues Found And Corrected

1. **Collapsed sidebar logo clipping**
   - Before: collapsed logo was 72 x 72 with bounding box `x=-5`, allowing left-edge clipping in the rail.
   - Fix: changed `MPA_LOGO_WIDTH.sidebarCollapsed` from `72` to `56`.
   - After: collapsed logo is 56 x 56 with bounding box `x=3`, fully inside the sidebar rail.
   - Screenshots:
     - Before: `/var/folders/hf/ykw1py4d6js8vw7r68sv8k440000gn/T/cursor/screenshots/ux007-before-collapsed-sidebar.png`
     - After: `/var/folders/hf/ykw1py4d6js8vw7r68sv8k440000gn/T/cursor/screenshots/ux007-after-collapsed-sidebar.png`

2. **Mobile header logo clipping**
   - Before: mobile header logo was 108 x 108 with bounding box `y=-26` inside a 64px header.
   - Fix: changed `MPA_LOGO_WIDTH.mobile` from `108` to `56`.
   - After: mobile header logo is 56 x 56 with bounding box `x=14`, `y=0`, no clipping.
   - Screenshots:
     - Before: `/var/folders/hf/ykw1py4d6js8vw7r68sv8k440000gn/T/cursor/screenshots/ux007-before-mobile-header.png`
     - After: `/var/folders/hf/ykw1py4d6js8vw7r68sv8k440000gn/T/cursor/screenshots/ux007-after-mobile-header.png`

3. **Error pages missing branded logo**
   - Before: `/unauthorized`, not-found, and shared friendly error states were text-only and did not render the adaptive logo system.
   - Fix: added centralized `<Logo size="navigation" />` to reachable error states and added the approved shared asset path to the minimal global fallback.
   - After: `/unauthorized` and not-found render `logo-dark.png` at 96 x 96 on light surfaces.

4. **Production logo assets returned 404**
   - Before: `https://www.my-property-assistant.com/branding/logo-light.png` and `logo-dark.png` returned HTTP 404.
   - Root cause: production alias pointed to an older deployment that did not include the UX-007 PNG assets; see `08-production-asset-404-audit.md`.
   - Fix: built and deployed the current Vercel output without changing asset paths.
   - After: both production asset URLs return HTTP 200 with `content-type: image/png`.

5. **Register state appeared unreachable in local certification**
   - Root cause: local checks used `127.0.0.1`, which Next.js 16 blocks as a dev resource origin unless configured.
   - Fix: added `allowedDevOrigins: ["127.0.0.1"]` and verified the existing `LoginForm` state transition.
   - After: mouse and keyboard activation render `Create Account` and `confirm-password` on desktop/mobile and light/dark checks.

6. **Theme switching did not update tokens or logos**
   - Before: app providers disabled dark mode and token overrides were not applied as a live runtime theme.
   - Fix: enabled dark mode, added system/persisted preference handling, root theme initialization, active-mode CSS variables, and theme-aware brand surface propagation.
   - After: `data-theme`, `color-scheme`, colors, backgrounds, typography tokens, and adaptive logo source update when the browser theme changes.

7. **Protected portal shells could not be inspected**
   - Before: real tenant, owner, and vendor routes correctly redirected without matching roles.
   - Fix: added `/portal/certification?role=tenant|owner|vendor` as a development-only certification surface with seeded visual data. Middleware only exempts that route in `development`; the page returns 404 outside development.
   - After: all three portal shells pass desktop/mobile and light/dark branding checks with no production authorization bypass.

## Remaining Notes

- Password recovery was visually checked for the branded shell and invalid/no-token state. A live recovery-token success state was not reproduced during this pass.
- The approved PNG files must be included in the next repository commit so future Git-based deployments keep serving them.

## Validation

- IDE diagnostics for edited files: **Pass**
- Focused web ESLint for edited files: **Pass**
- `@mpa/shared` lint: **Pass**
- `@mpa/shared` typecheck: **Pass**
- Local `/branding/logo-light.png`: **Pass, HTTP 200**
- Local `/branding/logo-dark.png`: **Pass, HTTP 200**
- Production `/branding/logo-light.png`: **Pass, HTTP 200**
- Production `/branding/logo-dark.png`: **Pass, HTTP 200**
- Registration mouse/keyboard interaction: **Pass**
- Registration desktop/mobile light/dark checks: **Pass**
- Theme token and adaptive logo switching: **Pass**
- Tenant/Owner/Vendor portal certification route: **Pass**

## Final Certification Status

**UX-007 branding certification is closed.**

Reachable local app surfaces, deployed static branding assets, generated email references, registration state, dark/light theme switching, and protected portal shells now pass UX-007 branding certification. Branding is **production-ready** subject to committing the approved PNG assets with the rest of the UX-007 changes.
