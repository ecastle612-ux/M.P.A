# 04 — Regression Risks

**Package:** PMX-004  
**Status:** Draft — Ready for Approval  

---

## 1. Absolute no-break list

| System | Regression signal | Guard |
| --- | --- | --- |
| Authentication | Cannot sign in / session lost / reset password broken | Same-window auth flows unchanged; middleware untouched except if header needs proven safe |
| Supabase | RLS failures, storage upload fail | No schema; no storage policy changes |
| OneSignal | players=0, enrollment timeout, test send fail | CP-003 checklist on every SW PR |
| Stripe | Checkout / portal / webhooks | Only return URL / client navigation polish |
| Messaging | Send/receive broken | Outbox must not dual-send when online |
| Documents / media | Upload/download broken | File input + MediaUpload preserve UX-010 path |
| Maintenance | WO create/update broken | Business services untouched |
| AI copilot | Shell focus loss returns (SH-002) | No shell remount storms; scroll-lock careful |
| Master Admin | Impersonation / diagnostics | Push diagnostics still work |

---

## 2. Regression risk by phase

| Phase | Primary regression surface | Required smoke before merge |
| --- | --- | --- |
| 1 Unified SW | Push subscribe, caching, deploy freshness | CP-003 + offline + SH-003 deploy check |
| 2 Install UX | Auth first paint blocked; z-index over modals | Login → dashboard without forced install wall |
| 3 Shell meta | Viewport zoom / a11y pinch; layout shift | CLS check; VoiceOver/TalkBack sample |
| 4 Standalone | PDF blank; Stripe session orphan; e-sign stuck | Document open, rent checkout return, e-sign return |
| 5 UX polish | Missed clicks; gesture conflicts; reduced-motion ignore | Touch target audit; keyboard nav |
| 6 Push cert | Deep link wrong screen | Matrix from PUSH-001 |
| 7 Offline queue | Double create; lost queue; sync storms | Idempotent retries; conflict UI |
| 8 Performance | Broken dynamic import boundaries | Route smoke after splits |
| 9 Premium APIs | Crash on unsupported browsers | Feature detect wrappers |
| 10 Validation | False PASS | Full matrix evidence |

---

## 3. Compatibility guarantees

1. **Backward compatible URLs** — existing deep links and `NEXT_PUBLIC_APP_URL` paths remain valid.  
2. **Existing devices** — already-enrolled OneSignal subscriptions keep working after SW update.  
3. **Feature flags / env** — if OneSignal env missing, app still loads; push UI explains; offline still works.  
4. **Desktop** — install onboarding is optional/low-noise on desktop; desktop workflows unchanged.  
5. **No DB migrations** — clients on old builds continue against same APIs.

---

## 4. Explicit non-changes (regression firewall)

Do **not** modify in PMX-004 unless a separate Approve amendment:

- `packages/shared` domain contracts for billing/notify  
- Supabase migrations  
- RLS policies  
- Stripe webhook handlers  
- OneSignal REST payload shape (except absolute URL already required)  
- Portal route IA / information architecture  
- Canopy color/typography system (spacing/touch token tweaks OK if documented)

---

## 5. Kill criteria (stop the train)

Halt further phase rollout if:

1. Production push enrollment success rate drops materially vs pre-Phase-1 baseline.  
2. Any authenticated user’s private page content is shown offline to another user.  
3. Stripe Checkout return fails to restore session for &gt;1% of test attempts.  
4. Core PM WO create fails in standalone on Android or iPhone.  
5. SH-002 Severity-1 focus loss returns on typing in messages or forms.
