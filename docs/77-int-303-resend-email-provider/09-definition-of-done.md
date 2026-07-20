# 09 — Definition of Done

**Package:** INT-303  
**Status:** Draft — awaiting Approve  
**Applies to:** Post-Approve **Implement** phase only

Implementation is complete **only when** all items below are true.

---

## Functional

- [ ] **Real Resend API** — `ResendProvider` calls Resend over HTTPS with server credentials; no stubbed “sent” without provider acceptance
- [ ] **Real inbox delivery** — At least one mapped workflow delivers to a real mailbox; message id correlated in M.P.A.
- [ ] **Provider Health** — Integrations Resend card shows Connected / Sandbox / Production Ready / Disabled, Last Success, Last Failure, Verified Domain, Recommended Action per [05-provider-health.md](./05-provider-health.md)
- [ ] **Production Ready** — Status may reach Production Ready only when health rules and live certification pass (never while adapter missing or domain unverified)
- [ ] **Audit events** — Every send attempt records audit-safe fields; no API keys in logs
- [ ] **Retries** — Retry contract implemented and verified for retryable failures
- [ ] **Failure handling** — Invalid recipient, config errors, API rejection, timeout mapped to stable results and safe UX

---

## Verification

- [ ] **Browser verification** — Operator exercises an existing UI path that triggers email; inbox proof captured in certification report
- [ ] **TypeScript** — New/changed code typechecks clean
- [ ] **ESLint** — New/changed code lint-clean
- [ ] **Certification report** — CP-004 re-run (or successor) documents PASS for Resend Production Ready with evidence links/ids (no secrets)

---

## Gate compliance

- [ ] ADR-018 Accepted before merge of provider code
- [ ] Scope limited to approved INT-303 docs (no sneak-in workflow redesign)
- [ ] Password reset still Supabase Auth (verified unchanged)
- [ ] `noop` still supported for local/CI

---

## Not done if

- Health shows Production Ready without inbox proof
- Announcement email rows remain permanent `placeholder` in production with `EMAIL_PROVIDER=resend`
- Invites still never call `sendEmail` when Resend is selected
- Keys appear in logs or client env
- Password reset was moved to Resend without a separate approved design
