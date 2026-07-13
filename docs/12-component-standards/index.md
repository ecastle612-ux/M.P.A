# 12 — Component Standards

## Component Hierarchy

```
design-system/          → Primitives (Button, Input, Badge, Dialog)
  └── patterns/         → Composed patterns (DataTable, FormSection, StatusChip)

components/             → App-wide (CommandPalette, OperationsConsole)
  └── layout/           → Portal shells, navigation

workflows/*/components/ → Workflow-specific (LeasingPipeline, VendorBidPanel)

domains/*/components/   → Domain display (PropertySummaryCard) — shared across workflows
```

### Import Direction (Strict)

```
workflows → domains → components → design-system
```

Never: `design-system → workflows` or `domains → workflows`

---

## Component Categories

### Primitives (`design-system/`)

| Component | Responsibility |
|-----------|----------------|
| `Button` | Action trigger with variant system |
| `Input`, `Select`, `Textarea` | Form controls |
| `Dialog`, `Drawer`, `Popover` | Overlay surfaces |
| `Badge`, `StatusChip` | State indicators |
| `Skeleton` | Loading placeholders |
| `Tooltip` | Contextual help |

**Rules:**
- Zero business logic
- Zero Supabase imports
- All styling via design tokens (06)
- Every primitive has Storybook story (when Storybook adopted)

### Patterns (`design-system/patterns/`)

| Pattern | Responsibility |
|---------|----------------|
| `DataTable` | Virtualized, sortable, filterable, bulk actions |
| `FormSection` | Grouped fields with title and description |
| `EmptyState` | Actionable empty state with CTA |
| `TimelineView` | Chronological event display |
| `FileUpload` | Drag-drop with progress |
| `CurrencyDisplay` | Formatted financial values |

### Signature Patterns (`components/patterns/`)

| Pattern | Responsibility |
|---------|----------------|
| `WorkflowRail` | Stage indicator for multi-step workflows |
| `OperationsConsole` | Queue + detail master-detail layout |
| `CommandPalette` | ⌘K search and action launcher |
| `ContextHeader` | Entity context bar (property, tenant, owner) |
| `AIInsightPanel` | Inline AI suggestions with accept/dismiss |

---

## Component API Design

### Props

```typescript
type WorkOrderCardProps = {
  workOrder: WorkOrder
  onAssign?: (id: string) => void
  variant?: 'compact' | 'full'
  className?: string
}
```

- Required data props are explicit types from `domains/`
- Callbacks named `on{Action}`
- `className` accepted on all outermost elements
- No `any` props

### Composition Over Configuration

```tsx
// ✅ Composable
<Drawer>
  <Drawer.Header title="Work Order #123" />
  <Drawer.Body><WorkOrderDetail /></Drawer.Body>
  <Drawer.Footer><AssignVendorButton /></Drawer.Footer>
</Drawer>

// ❌ Over-configured
<Drawer title="..." body="..." footer="..." showAssignButton={true} />
```

---

## Styling Rules

| Rule | Detail |
|------|--------|
| Tailwind only | No CSS modules, no styled-components |
| Design tokens | `bg-surface-elevated`, not `bg-gray-100` |
| Responsive | Mobile-first classes, desktop overrides with `lg:` |
| Dark mode | Design tokens support from day one (even if light-only v1) |
| No inline styles | Except dynamic values (coordinates, calculated widths) |

---

## Data Table Requirements

All entity list views at scale must use `DataTable` pattern:

- Server-side pagination
- Server-side filtering and sorting
- Virtualized rows (1000+ items)
- Sticky header
- Bulk selection with action bar
- Row click → detail panel (not page navigation on desktop)
- Empty state with workflow CTA

---

## Form Standards

| Rule | Detail |
|------|--------|
| Library | React Hook Form + Zod resolver |
| Validation | Zod schema in `domains/shared/schemas/` |
| Submit | Calls Edge Function or Server Action wrapper |
| Errors | Field-level + summary; PM-language messages |
| Autosave | Draft forms autosave to DB where appropriate |

---

## AI Component Standards

AI-generated content uses consistent visual treatment:

```tsx
<AIInsightPanel
  suggestion={draft}
  source={['work_order:123', 'property:456']}
  onAccept={handleAccept}
  onEdit={handleEdit}
  onDismiss={handleDismiss}
/>
```

- Always show sources
- Always require explicit accept for high-stakes
- Never auto-apply AI output to financial or legal records

---

## Accessibility Requirements

| Requirement | Standard |
|-------------|----------|
| Keyboard navigation | All actions reachable via keyboard |
| Focus management | Trap focus in modals; restore on close |
| ARIA labels | All icon-only buttons labeled |
| Color | Status never conveyed by color alone |
| Motion | Respect `prefers-reduced-motion` |

---

## Testing Components

| Tier | Test Type |
|------|-----------|
| Primitives | Unit + visual regression |
| Patterns | Unit + interaction tests |
| Workflow components | Integration tests with MSW |
| Layouts | E2E smoke per portal |

---

## Anti-Patterns

- God components (> 300 lines — decompose)
- Fetching data in primitives
- Feature-specific logic in `design-system/`
- Prop drilling > 3 levels (use composition or context)
- Multiple primary buttons per view
- Generic card grid for every entity

---

## Related Documents

- **06** Design Language — Canopy ([Component Philosophy](../06-design-language/component-philosophy.md), [Token System](../06-design-language/design-token-system.md))
- **07** UX Principles
- **11** Coding Standards

**Gate:** Do not implement primitives until Phase 1.5 Canopy docs are approved.
