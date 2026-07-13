# ADR-009: Turborepo Monorepo from Day One

## Status
Accepted (supersedes ADR-001)

## Date
2026-07-11

## Context
ADR-001 deferred monorepo adoption until mobile development began, recommending a single Next.js repository with future extraction. Stakeholder review accepted the architecture review with revisions: M.P.A. is a long-term commercial platform and should avoid a future monorepo migration. Shared code (types, validators, design tokens, Supabase clients) must be centralized from day one even if `apps/mobile` remains empty initially.

## Decision
Adopt a **Turborepo monorepo** from project scaffolding:

```
mpa/
├── apps/
│   ├── web/          # Next.js PWA (primary client)
│   └── mobile/       # Expo placeholder (empty until native development)
├── packages/
│   ├── ui/           # Design system primitives and patterns
│   ├── shared/       # Zod schemas, types, constants, pure utilities
│   ├── supabase/     # Generated DB types, typed client helpers
│   └── config/       # ESLint, TypeScript, Tailwind shared configs
├── supabase/         # Migrations, Edge Functions, seed
├── docs/             # MPA Blueprint
└── turbo.json
```

## Consequences
**Easier:** No monorepo migration sprint later. Shared packages enforced by tooling. Mobile onboarding is additive, not structural. CI can use Turborepo remote caching.

**More difficult:** Higher initial setup complexity. Package boundary discipline required from day one. Empty `apps/mobile` must be documented to prevent confusion.

## Alternatives Considered
- **Single repo with deferred extraction (ADR-001):** Superseded — migration cost and shared-code drift risk outweigh early tooling overhead for a long-term commercial platform.
- **Nx monorepo:** Rejected — Turborepo pairs better with Vercel deployment and has lower configuration overhead for this stack.
