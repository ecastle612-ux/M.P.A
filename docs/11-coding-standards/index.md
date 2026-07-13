# 11 — Coding Standards

## Language & Runtime

| Item | Standard |
|------|----------|
| Language | TypeScript (strict mode) |
| Runtime (web) | Node.js LTS via Next.js |
| Runtime (functions) | Deno (Supabase Edge Functions) |
| Package manager | pnpm (preferred) or npm — decided at scaffold, locked thereafter |

---

## TypeScript Configuration

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "forceConsistentCasingInFileNames": true
}
```

- **No `any`** without explicit `// @justified-any: reason` comment
- Prefer `type` over `interface` for data shapes; `interface` for extensible contracts
- Generated DB types are authoritative — do not hand-write duplicate entity types

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| React component | `PascalCase.tsx` | `WorkflowRail.tsx` |
| Hook | `use-kebab-case.ts` | `use-work-orders.ts` |
| Utility | `kebab-case.ts` | `format-currency.ts` |
| Schema | `kebab-case.schema.ts` | `assign-vendor.schema.ts` |
| Edge Function | `kebab-case/` directory | `assign-vendor/index.ts` |
| Test | `*.test.ts(x)` colocated | `WorkflowRail.test.tsx` |

### Code

| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PropertyCard` |
| Functions | camelCase | `calculateLateFee` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE_MB` |
| DB tables | snake_case, prefixed | `work_order_requests` |
| Domain events | dot.notation | `lease.signed` |
| Env vars | SCREAMING_SNAKE | `STRIPE_SECRET_KEY` |

---

## Import Order

```typescript
// 1. External packages
import { useQuery } from '@tanstack/react-query'

// 2. Internal absolute imports
import { Button } from '@/design-system'

// 3. Relative imports
import { useWorkOrders } from './hooks'

// 4. Types
import type { WorkOrder } from '@/domains/work-order/types'
```

---

## React Standards

| Rule | Detail |
|------|--------|
| Server Components default | Client Components only when interactivity required |
| `"use client"` | Minimal scope — leaf components, not layout wrappers |
| No business logic in components | Validation and rules in domains/ or Edge Functions |
| Props interfaces | Named `{ComponentName}Props` |
| Children typing | `React.PropsWithChildren` when applicable |

---

## Error Handling

```typescript
// Edge Functions — always return structured errors
return new Response(JSON.stringify({ error: { code, message, details } }), {
  status: 400,
  headers: { 'Content-Type': 'application/json' },
})

// Client — TanStack Query error boundaries per portal
// Never swallow errors silently
```

---

## Git Standards

### Branches

```
feature/MPA-{ticket}-{short-description}
fix/MPA-{ticket}-{short-description}
docs/MPA-{ticket}-{short-description}
```

### Commits (Conventional Commits)

```
feat(maintenance): add vendor assignment workflow
fix(rls): correct owner property access policy
docs(blueprint): update AI strategy
chore(ci): add RLS integration test gate
```

### Pull Requests

- One workflow feature per PR where possible
- Description must reference workflow stage (05)
- Must pass CI before merge
- Squash merge to `main`
- ADR linked if architectural

---

## Code Review Checklist

- [ ] Maps to a business workflow stage
- [ ] Satisfies product philosophy goal (02)
- [ ] RLS policies for new tables
- [ ] RLS integration tests included
- [ ] No secrets in code
- [ ] No business logic in React components
- [ ] Zod validation on Edge Function inputs
- [ ] Domain event emitted for workflow transitions
- [ ] Error messages in PM language
- [ ] Types generated/updated from DB

---

## Dependencies

| Rule | Detail |
|------|--------|
| New dependency requires justification | Bundle size, maintenance, license |
| No duplicate libraries | One date library, one form library, etc. |
| Pin major versions | Renovate/Dependabot for updates |
| AI/ML SDKs server-only | Never in client bundle |

---

## Comments

- Code should be self-explanatory
- Comments explain **why**, not **what**
- JSDoc on public API exports and complex functions
- No commented-out code in merged PRs

---

## Related Documents

- **10** API Standards
- **12** Component Standards
- **16** Testing Standards
- **18** Decision Log
