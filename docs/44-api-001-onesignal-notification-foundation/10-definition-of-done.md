# 10 — Definition of Done

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Gate DoD (Design → Document)

This checklist applies to the **documentation package** before Approve:

- [x] Package folder `docs/44-api-001-onesignal-notification-foundation/` complete
- [x] README states Draft / Ready for Approval
- [x] Requirements traceability maps PRR IDs
- [x] Architecture + provider abstraction documented
- [x] Event routing table enumerates real workflows (no placeholder triggers)
- [x] Preferences, Notification Center, Ops, Command Center designed
- [x] Security & secrets model documented
- [x] Implementation slices independently deployable
- [x] Risk analysis recorded
- [x] ADR-017 Proposed for OneSignal selection
- [ ] Product + Architect (+ Security) Approve
- [ ] ADR-017 Accepted
- [ ] README status → **Approved**

**No application code, migrations, SDKs, or env files are required for Design/Document DoD.**

---

## Implementation DoD (after Approve — not this task)

### Functional

- [ ] Push registration works (permission → device row → active subscription)
- [ ] NotificationService is the only module→push path
- [ ] Notifications reach OneSignal in configured environments
- [ ] Notification Center: unread, read, mark all, archive, delete, search, filters, deep links
- [ ] Preferences persist and enforce quiet hours + emergency override
- [ ] Operations Center widgets update correctly
- [ ] Command Center indexes notifications / alerts / emergencies / unread
- [ ] Responsive layouts remain intact
- [ ] Event routing covers table in 04 for emitters that exist

### Security

- [ ] REST keys server-only
- [ ] No secrets committed
- [ ] `.env.example` documents variable names without values
- [ ] Cross-org delivery impossible under RLS + service checks

### Verification commands

- [ ] `pnpm check:boundaries`
- [ ] `pnpm check:circular`
- [ ] `pnpm deps:validate`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

### Documentation closeout

- [ ] Package status → Implemented
- [ ] PRR / INT-301 notes updated
- [ ] MHF-001 “OneSignal out of scope” deferral superseded by Implemented reference
- [ ] Known issues & tech debt filed

---

## Out-of-scope confirmation

Confirm **not** shipped under API-001:

- [ ] SMS
- [ ] Email
- [ ] Firebase as required primary
- [ ] Native mobile apps
- [ ] AI-generated replies
- [ ] Unrelated module redesigns
