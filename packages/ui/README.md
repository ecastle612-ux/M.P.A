# @mpa/ui

Canopy UI foundation package.

## Scope

Foundation-only primitives with no business logic:

- `Button`
- `Input`, `Textarea`, `Select`
- `Checkbox`, `Switch`
- `Modal`, `Drawer`, `Tooltip`
- `Badge`, `Avatar`, `Card`
- `Table` primitives
- `Tabs`
- `ToastProvider`
- `Skeleton`, `Spinner`
- `CommandPaletteShell`

## Rules

- All components must be keyboard-accessible
- All components must be fully typed
- No Supabase calls or domain workflows in this package
- Use Canopy design tokens only

## Token Source

- `src/tokens/canopy.ts`
- `src/providers/theme-provider.tsx`
