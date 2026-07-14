# M.P.A. — My Property Assistant

**Status:** Phase 2.1 — Foundation Hardening (in development)

M.P.A. is an AI Property Operations Platform designed to become the operating system for property managers.

## Implementation Gate

**Nothing gets implemented until it has been designed, documented, and approved.**

`Design → Document → Approve → Implement`

Policy: [docs/00-governance/implementation-gate.md](./docs/00-governance/implementation-gate.md)

## Current Phase

1. ✅ Blueprint v1.0 approved
2. ✅ Canopy v1.0 approved
3. ✅ Experience Architecture v1.0 approved
4. ✅ Phase 2 foundation scaffold complete (no business features)
5. 🚧 Phase 2.1 foundation hardening (quality + readiness)

## Documentation

The permanent source of truth for this project is:

**[docs/README.md](./docs/README.md)** — MPA Blueprint index

## Development Setup

Prerequisites:

- Node.js 22+
- pnpm
- Supabase CLI (for local backend and generated types)

Commands:

```bash
pnpm install
pnpm lint
pnpm check:boundaries
pnpm check:circular
pnpm deps:validate
pnpm typecheck
pnpm build
pnpm dev
```
