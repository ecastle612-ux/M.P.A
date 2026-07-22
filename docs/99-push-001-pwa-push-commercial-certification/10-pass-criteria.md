# 10 — Pass Criteria & Deliverables

**Package:** PUSH-001  
**Status:** Approved · Implementation in progress (PASS requires real-device evidence)  

---

## Hard PASS (all required)

| Gate | Criterion |
| --- | --- |
| G1 | Android PWA receives notifications |
| G2 | iPhone PWA receives notifications (within Apple-supported capabilities) |
| G3 | Desktop browsers receive notifications (Chrome + Edge; Safari where supported) |
| G4 | Every role receives correct notification for implemented matrix rows |
| G5 | Deep links always open the correct destination (no generic home) |
| G6 | No duplicate notifications for the same event key |
| G7 | Notification diagnostics show healthy registrations |
| G8 | Test notifications succeed from Master Admin |
| G9 | Real physical devices verify delivery (evidence packaged) |
| G10 | Ship ladder: `pnpm typecheck` · `pnpm --filter @mpa/web build` · production deploy verified |

## Deliverables (closeout)

| Artifact | Location |
| --- | --- |
| Architecture diagram | This package / artifacts |
| Notification flow | [README](./README.md) + artifacts |
| Service Worker audit | [01](./01-system-audit.md) evidence |
| OneSignal audit | artifacts |
| Environment audit | artifacts (no secrets) |
| Device matrix | [02](./02-device-registration.md) completed |
| Deep link matrix | [05](./05-deep-linking.md) completed |
| Failure matrix + RCAs | [06](./06-failure-analysis.md) |
| Files changed · commit · deployment ID · prod verify | Certification report at closeout |

## Quality before commit

```
pnpm typecheck
pnpm --filter @mpa/web build
```

Do **not** mark PASS until every platform has been tested on physical devices.
