# 11 — Risk Analysis

**Package:** API-001A  
**Status:** Draft — Ready for Approval

---

## Risks

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| R1 | Browser permission denied permanently | User never gets push | Medium | Clear Settings guidance; no nag; in-app remains |
| R2 | Enrollment UX built but OneSignal credentials invalid | Test push fails; false COMPLETE | High (seen in API-001 live test) | DoD prerequisite; Ops health noop/403 signals |
| R3 | Infinite Enabling / SDK init race | Enrollment appears broken | Medium | Timeouts, deferred-init ordering, terminal errors ([03](./03-device-registration.md)) |
| R4 | Nagging banners reduce trust | Users abandon product | Medium | Suppression rules ([02](./02-user-enrollment-flow.md)) |
| R5 | Zero-recipient warning ignored | Operators still expect push | Medium | Confirm step; optional block for emergencies |
| R6 | Counting devices vs users confuses Ops | Wrong reach estimates | Medium | Single metric definition in [05](./05-announcement-delivery.md) / [06](./06-operations-center-health.md) |
| R7 | Scope creep into NotificationService redesign | Gate violation / churn | Low if disciplined | Explicit non-goals; PR checklist cites API-001A only |
| R8 | Privacy concern — “tracking” perception | Support load | Low–Med | Education copy; self-only devices; soft-deactivate |
| R9 | Multi-device fan-out cost | Duplicate pushes | Low initially | Cap optional; preferences still apply once per user notify with multiple subscription ids |
| R10 | Tenant role lacks notification:read | Center empty during verify | Medium | Align permissions for enrollment verification roles |

---

## Open questions (resolve at Approve)

1. **Not Now cooldown** — 7 days default acceptable?
2. **Emergency publish with N=0** — warn+confirm vs hard block?
3. **Pending registrations metric** — derive vs new state machine?
4. **Cross-browser Not Now** — client-only vs server preference flag?
5. **PM/Owner enrollment** — same banner mandatory or resident-only first slice?

---

## Dependencies

| Dependency | Notes |
|------------|-------|
| API-001 implemented | Service, provider, devices, prefs, center |
| Valid OneSignal app credentials | Ops prerequisite for live COMPLETE |
| Canopy / Experience Architecture | Banner non-intrusive composition |
| Existing announcement publish flow | Preflight only |

---

## Rollout risks

Ship slices 0–1 before announcement warning so enrollment can create recipients; then slice 3 becomes meaningful. Shipping warning first without enrollment increases operator frustration.
