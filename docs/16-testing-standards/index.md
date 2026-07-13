# 16 — Testing Standards

## Testing Philosophy

M.P.A. handles money, legal documents, and personal data. Tests are not optional polish — they are the safety net that allows rapid development without breaking production.

**Priority:** Security (RLS) > Financial integrity > Workflow correctness > UI polish.

---

## Test Pyramid

```
         ┌───────────┐
         │    E2E    │  Playwright — critical user journeys
         ├───────────┤
         │ Integration│  Supabase local — RLS, events, Edge Functions
         ├───────────┤
         │   Unit     │  Vitest — schemas, utils, hooks, components
         └───────────┘
```

---

## Unit Tests (Vitest)

### What to Test

| Category | Examples |
|----------|----------|
| Zod schemas | Valid/invalid inputs, edge cases |
| Pure utilities | `formatCurrency`, `calculateLateFee`, date helpers |
| Domain logic | Workflow state transitions, validation rules |
| Hooks | `useWorkOrders` with MSW mock |
| Components (primitives) | Button variants, form validation display |

### What NOT to Unit Test

- Supabase client calls (integration tests)
- Tailwind styling
- Third-party library internals

### Conventions

- Colocate: `format-currency.test.ts` next to `format-currency.ts`
- MSW for API mocking in hook/component tests
- No snapshot tests on components (brittle, low value)

---

## Integration Tests (Supabase Local)

### RLS Policy Tests (Mandatory)

Every table with RLS must have tests verifying access boundaries.

```typescript
describe('property_properties RLS', () => {
  it('org member can read own org properties', async () => { ... })
  it('org member cannot read other org properties', async () => { ... })
  it('owner can read only assigned properties', async () => { ... })
  it('tenant cannot read property records', async () => { ... })
  it('unauthenticated user cannot read any properties', async () => { ... })
})
```

**CI gate:** PRs touching migrations must include RLS tests. No merge without them.

### Domain Event Tests

```typescript
describe('lease.signed event', () => {
  it('creates move-in tasks', async () => { ... })
  it('activates rent schedule', async () => { ... })
  it('is idempotent on replay', async () => { ... })
})
```

### Edge Function Tests

- Deno test runner for Edge Functions
- Test with local Supabase instance
- Verify JWT validation, input validation, error responses
- Webhook tests with fixture payloads

---

## End-to-End Tests (Playwright)

### Critical Journeys (v1)

| Journey | Portal | Priority |
|---------|--------|----------|
| PM signup → create org → add property | PM | P0 |
| Tenant submit maintenance request | Tenant | P0 |
| PM triage → assign vendor → close work order | PM | P0 |
| Rent payment via Stripe test mode | Tenant | P1 |
| Owner views published report | Owner | P1 |
| Vendor accepts job → submits invoice | Vendor | P1 |
| Lease application → screening → signing | PM + Tenant | P2 |

### Conventions

- Page Object Model for portal pages
- Test against local Supabase + Stripe test mode
- Run on `main` merge and nightly
- Screenshots on failure
- No E2E tests for AI output content (non-deterministic) — test UI flow only

---

## Financial Integrity Tests

| Test | Detail |
|------|--------|
| Payment idempotency | Duplicate webhook does not double-charge |
| Refund correctness | Partial and full refunds update ledger |
| Late fee calculation | Matches configured rules per lease |
| Stripe Connect payout | Vendor receives correct amount minus platform fee |

---

## AI Testing

| What | How |
|------|-----|
| Prompt registry | Unit test template rendering with fixture data |
| Suggestion storage | Integration test: AI output saved before display |
| Feedback loop | Integration test: accept/edit/dismiss updates records |
| AI output content | NOT tested (non-deterministic) — test workflow, not text |
| Token budget | Unit test: org limit enforcement |

---

## CI Pipeline

```yaml
# On every PR
jobs:
  lint-typecheck:     # ESLint + tsc --noEmit
  unit-tests:         # Vitest
  rls-tests:          # Supabase local + integration
  build:              # Next.js build succeeds

# On merge to main
  e2e-smoke:          # Playwright critical journeys
  staging-deploy:     # Vercel preview → staging

# Nightly
  e2e-full:           # All Playwright journeys
  performance-check:  # Lighthouse CI on key pages
```

---

## Test Data

| Source | Purpose |
|--------|---------|
| `supabase/seed.sql` | Local dev data: 1 org, 3 properties, 5 work orders |
| `src/testing/factories/` | Programmatic test data generation |
| `src/testing/fixtures/` | Webhook payloads, API responses |

### Seed Data Rules

- Realistic but fake PII (no real names/emails)
- Covers all four authorization planes
- Includes marketplace vendor linked to test org

---

## Coverage Targets

| Category | Target |
|----------|--------|
| RLS policies | 100% — every policy has tests |
| Zod schemas | 100% |
| Edge Functions | 90% — all paths including errors |
| Domain event consumers | 90% |
| UI primitives | 80% |
| Workflow components | 60% — key interactions |
| E2E critical journeys | 100% of P0/P1 journeys |

**No global coverage percentage target.** Coverage of critical paths matters; coverage of UI boilerplate does not.

---

## Related Documents

- **09** Database Architecture — RLS requirements
- **10** API Standards — Edge Function contracts
- **14** Security Standards — security test requirements
- **15** Performance Standards — load testing
