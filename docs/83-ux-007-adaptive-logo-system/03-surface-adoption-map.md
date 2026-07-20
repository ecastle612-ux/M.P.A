# UX-007 - Surface Adoption Map

## Coverage requirement

Every user-visible logo surface must resolve through the adaptive system.

## Surface map

| Surface group | Examples | Tone source | Required output |
| --- | --- | --- | --- |
| App shell | Sidebar, top nav, command center, loading | Shell layout branding context | Correct logo by surface background |
| Auth | Login, forgot password, reset password, invitation | Auth shell context | Correct logo for auth backgrounds |
| Portals | Tenant/owner/vendor portal headers and shells | Portal layout context | Correct logo by portal surface theme |
| Public/marketing | Home/landing/static pages | Page-level explicit tone or theme token | Correct logo per page background |
| Dialogs/drawers | Modals, sheets, overlays | Parent surface context + explicit override | No contrast mistakes on overlays |
| Email | Transactional templates + auth-adjacent branded content | Template background contract (explicit) | Correct logo embedded in outgoing HTML |
| PDF | Statements/reports/export docs | Document theme contract (explicit) | Correct logo in generated document |
| PWA/meta | Splash/loading shortcuts where applicable | Asset mapping policy | Approved logo only |

## Migration sequence

1. Branding primitive + context foundation
2. Global shells and auth
3. Portal and app feature surfaces
4. Email and PDF pipelines
5. Legacy logo hard deprecation

## Ownership

- UX owner: validates contrast and visual parity
- Frontend owner: implements primitives/context migration
- Platform owner: enforces lint and asset guardrails
- QA owner: certifies matrix in `04-certification-plan.md`
