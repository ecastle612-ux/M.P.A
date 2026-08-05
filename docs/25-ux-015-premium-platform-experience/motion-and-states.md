# UX-015 Motion and State Patterns

**Status:** Approved  
**Parent:** [UX-015 Index](./index.md)

Motion improves perceived quality. It must not invent a new animation language.
Use Canopy motion tokens from
[Design Token System §7](../06-design-language/design-token-system.md).

## Allowed Motion (Phase 1)

| Interaction | Behavior | Duration |
|-------------|----------|----------|
| Page / content transition | Cross-fade content; do not slide the whole app shell | `normal` (200ms) |
| Hover elevation / chrome | Color, border, or subtle elevation only — no scale bounce | `fast` (120ms) |
| Button press feedback | Opacity/color active state | `fast` |
| Modal | Fade + scale 0.98→1 | `normal` |
| Drawer | Slide from edge + scrim fade | `moderate` (280ms) |
| Toast | Slide from top-right + fade | `moderate` |
| Skeleton | Soft shimmer opacity pulse | 1.2s loop |
| Loading swap | Cross-fade skeleton → content | `normal` |
| Dropdown / menu | Fade + 4px rise | `normal` |

## Forbidden Motion

- Bounce / spring gimmicks on primary chrome
- Parallax or decorative background motion
- Layout thrash that shifts focus unexpectedly
- Motion that is required to understand state
- Any animation that ignores `prefers-reduced-motion`

## State Patterns

### Loading

- Prefer skeleton structures that match final layout geometry.
- Spinners only for small local actions (button submit, switch org).
- Workspace-level loading should not flash empty chrome.

### Empty

- One headline, one short supporting sentence, optional single CTA.
- No fake charts, decorative illustration noise, or multi-card filler.

### Error

- Plain language, what failed, what to do next.
- Preserve layout stability; do not replace the whole shell unless fatal.

### Success / Toast

- Quiet confirmation; auto-dismiss with manual dismiss available.
- No celebratory confetti or blocking success modals for ordinary saves.

## Reduced Motion

When `prefers-reduced-motion: reduce`:

- Durations → instant / near-zero
- No shimmer (static skeleton blocks)
- Modals/drawers/toasts appear without slide/scale
- Page transitions become instant content replacement
