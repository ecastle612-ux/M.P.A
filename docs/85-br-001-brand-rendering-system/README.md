# BR-001 — M.P.A. Brand Rendering System (Permanent Logo Architecture)

**Initiative ID:** BR-001  
**Status:** Design - Approved · Document - Approved · **ADR-021 Accepted** · Implement unlocked  
**Type:** Platform architecture (not a screen patch)  
**Depends on:** UX-007 / ADR-019 (Accepted — two approved PNG assets + adaptive contrast mapping)

---

## Decision intent

Exactly one way to render M.P.A. branding: `<BrandLogo purpose="…" />`.  
Pages never choose asset, size, theme, typography, or spacing.

## Approved amendments

See [`07-amendments.md`](./07-amendments.md) — A (modes), B (80px lockup), C (purpose API), D (visual CI), E (Design Partner standard).

## Package documents

| Doc | Purpose |
| --- | --- |
| [01-context-and-problem.md](./01-context-and-problem.md) | Why regressions recur |
| [02-system-spec.md](./02-system-spec.md) | Core architecture |
| [03-migration-plan.md](./03-migration-plan.md) | Migration plan |
| [04-certification-plan.md](./04-certification-plan.md) | Audit surfaces |
| [05-build-protection.md](./05-build-protection.md) | ESLint + CI |
| [06-approval.md](./06-approval.md) | Gate sign-off |
| [07-amendments.md](./07-amendments.md) | Amendments A–E |

## Related ADR

- [ADR-021](../18-decision-log/adr-021-permanent-brandlogo-rendering-architecture.md) — **Accepted**
- [ADR-019](../18-decision-log/adr-019-adaptive-two-logo-brand-system.md) — Accepted (assets)

## Approval recorded

```text
APPROVE BR-001
ACCEPT ADR-021
```
