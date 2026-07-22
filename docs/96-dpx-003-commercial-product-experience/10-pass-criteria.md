# 10 — Pass Criteria & Deliverables

**Package:** DPX-003  
**Status:** Approved · Implementation in progress (PASS not yet certified)

---

## Hard PASS (all required)

| Gate | Criterion |
| --- | --- |
| G1 | Application feels calm instead of cluttered |
| G2 | Empty UI eliminated (guide or hide) |
| G3 | Tenants immediately see communications (Priority 1 stack) |
| G4 | Push works on **real** Desktop / Android / iPhone devices |
| G5 | Theme never changes unexpectedly |
| G6 | Desktop and mobile both feel polished |
| G7 | Every change demonstrably reduces friction for PM, owner, resident, or vendor |
| G8 | No new modules / nav / architecture / feature creep |
| G9 | DPX-002 gold path not regressed |
| G10 | Ship ladder: typecheck · web build · lint changed files · deploy · prod verify |

## Deliverables (closeout)

| Artifact | Location |
| --- | --- |
| Before/after screenshots | `artifacts/before/`, `artifacts/after/` |
| Pages decluttered + scroll deltas | Measurement note in package |
| Empty states replaced | [03](./03-empty-state-certification.md) checklist |
| Tenant dashboard improvements | [04](./04-tenant-experience.md) |
| Push certification + RCAs | [05](./05-push-notification-certification.md) |
| Theme root cause + fix | [06](./06-theme-certification.md) |
| Mobile improvements | [08](./08-mobile-experience.md) |
| Files changed · commit · deployment ID · prod verify | Certification report at closeout |

## Quality gate (before commit)

```
pnpm typecheck
pnpm --filter @mpa/web build
```

Lint changed files. Verify desktop + mobile. Verify production deployment.
