# 30.09 — Motion Guidelines

## Status

**Proposed (awaiting implementation approval)**

## Objective

Define subtle, functional motion that increases clarity and confidence in
enterprise workflows without visual noise.

## Motion Principles

1. Motion communicates state change, not decoration.
2. Keep transitions short and calm.
3. Prioritize responsiveness over flourish.
4. Respect reduced-motion user preference at all times.

## Timing Tokens (Proposed)

- `fast`: 120ms (hover/focus micro transitions)
- `base`: 180ms (panel/card/control transitions)
- `slow`: 240ms (overlay enter/exit)

## Easing Tokens (Proposed)

- Standard: `ease-out` for entrances
- Exit: `ease-in` for dismissals
- No aggressive elastic/bounce curves in enterprise surfaces

## Allowed Motion Patterns

- Button/trigger state transitions
- Card hover elevation shift (subtle)
- Drawer/popover fade + translate
- Skeleton shimmer (reduced intensity)
- Inline feedback fade-in

## Disallowed Motion Patterns

- Large parallax effects
- Long onboarding animations
- Continuous looping decorative motion
- Motion tied to non-essential branding flourish

## Context-Specific Guidance

### Navigation

- Sidebar expand/collapse: short, predictable, no content jump
- Mobile drawer: slide + fade with clear focus transfer

### Dashboard

- KPI cards: static by default; no animated counters unless justified
- Activity/task refresh: subtle content replacement transitions only

### Forms

- Error and success messaging should appear with brief fade/slide
- Avoid layout thrash on validation feedback

## Reduced Motion Requirements

- Honor `prefers-reduced-motion` for all animations/transitions.
- Replace animated transitions with instant state changes where necessary.
- Keep focus cues intact even when motion is disabled.

