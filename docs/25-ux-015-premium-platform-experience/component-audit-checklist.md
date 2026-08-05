# UX-015 Component Audit Checklist

**Status:** Draft — Proposed  
**Parent:** [UX-015 Index](./index.md)

Use this checklist during the post-approval implementation pass. Every shared
component in `@mpa/ui` and every shell component in `apps/web` must pass before
Phase 1 is considered complete.

## Standardization Dimensions

For each component, verify:

| Dimension | Pass criteria |
|-----------|---------------|
| Spacing | Internal padding and gaps use `space.*` only |
| Padding | Matches component philosophy (buttons/inputs/cards) |
| Typography | Correct role (display/title/heading/body/caption/mono) |
| Icon sizing | `icon.size.sm|md|lg|xl` only; stroke weight consistent |
| Corner radius | Matches token role (`sm` inputs, `md` buttons/panels) |
| Elevation | Borders first; shadows only for floating layers |
| Hover | Color/border within `120ms`; no bounce/scale gimmicks |
| Focus | Visible focus ring using interactive focus tokens |
| Disabled | Disabled bg/text tokens; no click-through |
| Loading | Width-stable; spinner or skeleton per pattern |
| Error | Danger border + caption message pattern |
| Mobile | Touch targets adequate; no hover-only critical actions |
| Reduced motion | No required motion; shimmer disabled when requested |
| API surface | No behavior/prop breaking changes unless documented |

## Primitive Pass List

- [ ] Button
- [ ] Input
- [ ] Textarea
- [ ] Select
- [ ] Checkbox
- [ ] Switch
- [ ] Tabs
- [ ] Badge
- [ ] Avatar
- [ ] Card
- [ ] Table
- [ ] Modal
- [ ] Drawer
- [ ] Toast
- [ ] Tooltip
- [ ] Skeleton
- [ ] Spinner
- [ ] Command palette shell

## Shell Pass List

- [ ] Application shell
- [ ] Sidebar
- [ ] Top navigation
- [ ] Responsive navigation
- [ ] Breadcrumbs
- [ ] Profile menu
- [ ] Organization switcher
- [ ] Role switcher chrome
- [ ] Dashboard shell
- [ ] Portal shell / role portal frame
- [ ] Auth forms (login, forgot, reset, accept invite)
- [ ] Profile / settings form layout
- [ ] Unauthorized / not-found

## Inconsistency Elimination Rules

1. No one-off hex colors in feature/shell UI when a token exists.
2. No mixed button radii or heights for the same size token.
3. No mixed input heights across forms.
4. No card elevation on non-interactive static text blocks unless the unit is interactive.
5. No competing primary buttons in one view.
6. Icon-only controls always have accessible names.
