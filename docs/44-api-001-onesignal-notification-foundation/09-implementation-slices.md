# 09 — Implementation Slices

**Package:** API-001  
**Status:** Draft — awaiting Approve  
**Constraint:** Each slice independently deployable; no slice starts until package **Approved** and ADR-017 **Accepted**.

---

## Slice overview

| Slice | Name | Deployable outcome |
|-------|------|--------------------|
| 0 | Provider abstraction + NotificationService skeleton | `noop` provider live; call-site migration begins; no OneSignal required |
| 1 | OneSignal integration | Real push send + device registration when configured |
| 2 | Notification Center extensions | Archive, delete, search, filters, deep links polish |
| 3 | User preferences enforcement | Quiet hours, emergency override, category/property prefs enforced |
| 4 | Operations Center widgets | Unread / critical / emergency / health widgets |
| 5 | Command Center indexing | Notification + alert + emergency search |
| 6 | Hardening & verification | Tests, boundaries, load/failure paths, docs closeout |

---

## Slice 0 — Provider abstraction + NotificationService

**Includes**

- `NotificationProvider` interface + `noop` implementation + registry
- `NotificationService.notify` API
- Migrate `createInAppNotification` call sites to service (behavior-preserving with noop push)
- Feature flag / env `NOTIFICATION_PROVIDER=noop`

**Excludes**

- OneSignal SDK, secrets, schema for delivery columns (minimal if needed for compile)

**Done when**

- Business modules do not import provider adapters
- Unit tests cover service preference hooks (stubs) and noop send
- `pnpm check:boundaries` passes for new packages/paths

---

## Slice 1 — OneSignal integration

**Includes**

- `OneSignalProvider` (server REST)
- Env wiring (`ONESIGNAL_*`, document `.env.example`)
- Device registration API + client permission/registration flow
- Persist external subscription ids on `resident_devices`
- Delivery status fields migration as designed in 04
- Map subset of event routing table (messages, maintenance, announcements) end-to-end

**Excludes**

- Full Ops/Command widgets
- Email/SMS
- Native mobile

**Done when**

- Test send reaches OneSignal for a registered device in a non-prod app
- Invalid credentials fail closed with health signal
- No API key in client bundle (static analysis / review)

---

## Slice 2 — Notification Center

**Includes**

- Archive / soft delete mutations
- Search + category + property + priority filters
- Unread badge correctness with new states
- Deep link resolver coverage for routed entities

**Done when**

- Center supports behaviors in 06
- Responsive shell intact
- API contract tests updated

---

## Slice 3 — User preferences

**Includes**

- Quiet hours structure validation + enforcement in service
- Emergency override policy
- Category preference matrix aligned to API-001 taxonomy
- Property mute preferences
- Reserved email/SMS toggles remain non-delivering

**Done when**

- Preference changes persist and alter push eligibility in tests
- Emergency still delivers per 05
- Form/copy explains emergency behavior

---

## Slice 4 — Operations Center

**Includes**

- Widgets listed in 07
- Efficient aggregate queries
- Role-gated Notification Health

**Done when**

- Widgets update when notifications change (poll/realtime acceptable)
- Empty and emergency states correct

---

## Slice 5 — Command Center

**Includes**

- Search providers for notifications, alerts, emergencies, unread
- Ranking rules in 07
- Deep link parity with Notification Center

**Done when**

- Queries return org-scoped, permission-correct results
- Registry tests cover new kinds

---

## Slice 6 — Hardening & verification

**Includes**

- Expand event routing to remaining table rows that have real emitters
- Idempotency / retry tests
- Failure injection (provider down)
- Run full verification gate:

```
pnpm check:boundaries
pnpm check:circular
pnpm deps:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

**Done when**

- [10 — Definition of Done](./10-definition-of-done.md) checklist complete
- Package status can move to **Implemented** (separate from Approve)

---

## Dependency graph

```
Slice 0
  ├── Slice 1
  │     ├── Slice 3 (prefs enforcement can start after 0; complete with 1)
  │     └── Slice 2
  │           ├── Slice 4
  │           └── Slice 5
  └── Slice 6 (after 1–5)
```

Slices 2 and 3 may proceed in parallel after Slice 0 if schema migrations are coordinated. Slice 1 should not ship to production without Slice 3’s quiet hours/emergency rules if push is enabled for residents.

---

## Explicit non-slices

- SMS / email providers
- Firebase dual-write
- Native app push certificates
- Redesign of maintenance/leases/financial UIs
- AI auto-responses
