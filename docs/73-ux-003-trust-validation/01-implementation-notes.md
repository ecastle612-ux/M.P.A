# 01 — Implementation Notes

**Package:** UX-003 · EP-007 Approved

## Shared primitives

| Artifact | Role |
| --- | --- |
| `lib/trust/validation.ts` | ValidationIssue + field helpers (email, phone, dates, money) |
| `components/trust/validation-alert.tsx` | What / why / how-to-fix alert |
| `components/trust/confirm-action-dialog.tsx` | Modal confirm with consequence + cancel |
| `components/trust/operational-status.tsx` | “Saving…” / progress strip |
| `components/trust/provider-status-chip.tsx` | Contextual provider status |
| `hooks/use-undoable-action.ts` | Soft action + toast Undo → existing restore |
| `@mpa/ui` Progress | Deterministic / indeterminate bar |
| Toast action button | Undo recovery window |

## Form wiring

Lease, unit, tenant, work order, announcement, expense, rent charge, statement, bulk units — structured validation + submission guard + readApiError.

## Confirmations

Complete WO, archive WO, archive announcement, bulk create units, report generate (where UI already exists).

## Errors

Segment `error.tsx` → `FriendlyErrorState`.

## Undo (safe only)

Archive announcement / archive WO / archive property-vendor-unit table actions → toast Undo calling existing `restore` actions. **Not** payments/charges/statements.
