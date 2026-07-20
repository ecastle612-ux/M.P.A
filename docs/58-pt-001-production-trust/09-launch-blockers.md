# Remaining Launch Blockers (ranked)

## Would I trust M.P.A. to manage 100 units tomorrow?

**No.**

### Why

Design-partner workflows are strong, but unsupervised production for ~100 units still depends on live provider certification, invitation deliverability, and scale-tested Ops/migration queries.

## Blockers by severity

### P0 — Must clear before unsupervised production

1. **Live sandbox certification with real credentials** for Stripe, OneSignal, Dropbox Sign, Checkr (auth + request + webhook + failure). Current run: providers on `noop` / missing keys.
2. **Supabase Auth + Storage verified in the deployment environment** (CLI without env reported fail; production must prove signed URLs + session).
3. **Resident invitation email deliverability** — still provider/environment dependent; Resend not implemented.

### P1 — High risk for 100-unit day-two ops

4. **Ops Center / migration snapshot performance at 100+ units** — budgets documented, not load-proven.
5. **Media orphan garbage collection** — failed uploads can leave storage objects.
6. **DB role_permission_grants drift check in CI** — matrix unit tests pass; live grant audit not automated.

### P2 — Professional polish / coverage

7. Long-tail client catch blocks not all using `readApiError`.
8. Twilio / Resend remain roadmap (acceptable only if SMS/email are explicitly out of launch scope).
9. Playwright trust smoke needs seeded QA auth in CI green.

## Path to Production Readiness ≥ 8.0

1. Load sandbox keys; set `*_PROVIDER` to live adapters; re-run `pnpm trust:certify` and webhook simulate end-to-end.
2. Green `qa:e2e:smoke` + `qa:e2e:perf` against a 100-unit seed.
3. Prove invite email delivery (or ship Resend).
4. Schedule nightly integrity audit for pilot orgs.
