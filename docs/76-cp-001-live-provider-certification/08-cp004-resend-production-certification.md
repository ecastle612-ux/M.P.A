# CP-004 — Resend Production Certification (EP-014)

**Date:** 2026-07-20  
**Scope:** Certify existing Resend / transactional email path only — no new features, no workflow redesign.  
**Authoritative gate:** Design → Document → Approve → Implement (`docs/00-governance/implementation-gate.md`, ADR-012).  
**Related roadmap item:** INT-303 (SendGrid / Resend email) — **not shipped**.

---

## Overall verdict

| Gate | Result |
| --- | --- |
| Resend Production Ready | **FAIL** |
| Can Integrations label Resend **Production Ready**? | **No** |
| Live inbox delivery via Resend | **FAIL** (no adapter + no credentials) |
| Design Partner Readiness (email) | **WARNING** — password reset may use Supabase Auth email; invites/announcement email **not** Resend |
| Production Readiness (email) | **FAIL** |
| Commercial Readiness (email) | **FAIL** |

**Do not mark Resend Production Ready.**  
Implementing a Resend send adapter would be **INT-303** and requires a fresh Design → Document → Approve cycle before any application code.

---

## 1. Configuration

| Check | Result | Evidence |
| --- | --- | --- |
| API Key (`RESEND_API_KEY`) | **FAIL** | Missing in `apps/web/.env.local`, repo `.env.local`, and Vercel Production env list |
| `EMAIL_PROVIDER` | **FAIL** for Resend | Vercel Production = `noop` (not `resend`) |
| `RESEND_MODE` | **FAIL** | Missing locally and on Vercel |
| Sending domain | **FAIL** | No `RESEND_FROM*` / domain env; no adapter to consume them |
| Verified domain | **FAIL** | Cannot probe Resend Domains API without key; no domain configured in app |
| SPF | **FAIL** | Not verifiable — no Resend domain bound to M.P.A. |
| DKIM | **FAIL** | Same |
| From address | **FAIL** | No from-address wiring in codebase |
| Reply-To handling | **FAIL** | No Reply-To env or provider field |
| Environment detection | **PASS** (honest) | `provider-status.ts` treats Resend as **Disabled** when `EMAIL_PROVIDER=noop` and no key; never claims Production Ready without INT-303 |

**Repository fact:** There is **no** `resend` npm dependency and **no** `*resend*` provider module under `apps/web/src/lib/integrations/`. Integrations that exist: `notifications/`, `payments/`, `screening/`, `signature/`, `provider-status.ts`.

---

## 2. Email workflows (existing paths)

| Workflow | What code actually does today | Resend? | Inbox via Resend | Cert |
| --- | --- | --- | --- | --- |
| User invitation | `inviteResidentPortal` / applicant invite → insert `organization_invitations` only | No | **FAIL** | **FAIL** |
| Password reset | `supabase.auth.resetPasswordForEmail` (Supabase Auth SMTP / built-in mailer) | No | N/A (not Resend) | **WARNING** — out of Resend scope; depends on Supabase Auth email config |
| Welcome email | `sendWelcomeNotifications` → `notify()` (in-app + push only) | No | **FAIL** | **FAIL** as email; **PASS** as in-app/push when those channels work |
| Maintenance notification | Maintenance events → `notify()` (in-app + push) | No | **FAIL** | **FAIL** as email |
| Announcement email | Announcement publish inserts `delivery_channel: "email"` with **`delivery_status: "placeholder"`**; real fan-out is `notify()` for in-app/push | No | **FAIL** | **FAIL** |
| Owner report delivery | Owner statements persisted + `notify()` paths — no Resend send | No | **FAIL** | **FAIL** |
| Financial report delivery | Financial `notify()` — no Resend send | No | **FAIL** | **FAIL** |

### Invitation path (representative)

```1133:1159:apps/web/src/lib/resident-lifecycle/server.ts
async function inviteResidentPortal(...) {
  // ...
  const { error } = await client.from("organization_invitations").insert({
    organization_id: organizationId,
    email: normalized,
    roles: ["tenant"],
    invited_by: userId
  });
  // no outbound mailer
  return !error;
}
```

### Announcement email placeholder

```295:301:apps/web/src/lib/communication/server.ts
{
  delivery_channel: "email" as const,
  delivery_status: "placeholder" as const
}
```

### Live data check

- `organization_invitations` count at certification time: **0** (no invite mail trail to inspect).
- No Resend message IDs exist in M.P.A. tables (no email delivery schema wired to Resend).

**Browser / inbox:** No Resend send can be executed. Mocked success was not used — certification records **no delivery**.

---

## 3. Failure modes

| Scenario | Result | Notes |
| --- | --- | --- |
| Invalid address | **FAIL** (N/A) | No Resend send path to exercise |
| Missing recipient | **WARNING** | Invite insert / `notify()` may skip empty recipients; not Resend UX |
| Provider timeout | **FAIL** (N/A) | No client timeout/retry for Resend |
| API rejection | **FAIL** (N/A) | Domains probe only exists if key present; production has no key |
| Rate limit | **FAIL** (N/A) | Not implemented |
| Duplicate send prevention | **WARNING** | Invite dedupe by pending/accepted email; `notify()` idempotency keys — not Resend-level |
| User-friendly errors | **WARNING** | Auth reset surfaces Supabase errors; Resend errors do not exist in product path |

---

## 4. Logging / audit

| Check | Result | Notes |
| --- | --- | --- |
| Audit events for Resend sends | **FAIL** | No send events |
| Request IDs | **FAIL** | None |
| Delivery IDs | **FAIL** | None |
| No secrets logged | **PASS** | Provider status / probes designed not to return secrets; no Resend traffic |
| No duplicate Resend sends | **PASS** (vacuous) | Zero sends |

---

## 5. Provider Health (Settings → Integrations)

UI fields today (`provider-status-center.tsx` + `provider-status.ts`):

| Required field | Present? | Resend value (prod posture) |
| --- | --- | --- |
| Connection | Yes (`statusLabel`) | **Disabled** |
| Environment | Yes | Unknown / disabled posture |
| Verified Domain | **No dedicated row** | N/A — would require INT-303 + domain probe enrichment |
| Last Success | Yes (`lastCommunication`) | No successful probe (key absent → probe skipped) |
| Last Failure | Yes (`lastError`) | None recorded / probe not run |
| Production Ready | Via status chip only | **Not** Production Ready (enforced: adapter not in path) |
| Recommended Action | Yes (`nextAction`) | Configure Supabase Auth SMTP for reset, or waive outbound email / schedule INT-303 |

**Honest UI behavior:** Even if `RESEND_API_KEY` were present, status is capped at **Sandbox** until INT-303 ships — never Production Ready. That matches CP-001 matrix.

---

## 6. Browser verification

| Test | Result |
| --- | --- |
| Real Resend send from M.P.A. UI | **Not possible** — no adapter, `EMAIL_PROVIDER=noop`, no API key |
| Mocked / simulated Resend success | **Not used** |
| Password reset form | Calls Supabase Auth only (not Resend) — inbox proof for Resend **N/A** |

---

## 7. Certification matrix (summary)

| Area | PASS | WARNING | FAIL |
| --- | --- | --- | --- |
| Config (key, domain, SPF/DKIM, from, reply-to) | Env detection honesty | — | All Resend-specific config |
| Invitation email | — | — | FAIL |
| Password reset via Resend | — | Uses Supabase Auth instead | FAIL as Resend path |
| Welcome / maintenance / announcement / owner / financial **email** | — | In-app/push may work | FAIL as Resend email |
| Failure handling | — | Partial app-level | Resend-specific FAIL |
| Logging | No-secret posture | Invite/notify idempotency | Resend delivery logging FAIL |
| Integrations Production Ready | Correctly **Disabled** | Missing Verified Domain field | Cannot certify Ready |

---

## Readiness statements

### Design Partner Readiness

**WARNING.** Design Partners can operate with:

- In-app + push (OneSignal, certified separately in CP-003), and  
- Password reset **if** Supabase Auth email/SMTP is correctly configured (outside Resend).

They **cannot** rely on M.P.A.-originated invitation or announcement **email** via Resend.

### Production Readiness

**FAIL** for transactional email. Outbound email is not in the production path (INT-303).

### Commercial Readiness

**FAIL** for any commercial claim that “email notifications / invites / reports are delivered by Resend.”

---

## Can Resend be marked Production Ready?

**No.**

Required before any Production Ready claim:

1. **Approve INT-303** (Design → Document → Approve) — Resend (or SendGrid) adapter behind the notification/email abstraction.  
2. Configure production: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, verified sending domain, SPF/DKIM, From / Reply-To.  
3. Wire each approved workflow (invite, announcement email, reports, etc.) through the adapter — not placeholders.  
4. Re-run CP-004 with real inbox delivery, failure drills, and delivery-id logging.  
5. Only then allow Integrations status to reach **Production Ready**.

---

## Files / systems inspected (no product code changes this sprint)

- `apps/web/src/lib/integrations/provider-status.ts`  
- `apps/web/src/components/settings/provider-status-center.tsx`  
- `apps/web/src/lib/trust/provider-certification.ts`  
- `apps/web/src/lib/resident-lifecycle/server.ts` (invites / welcome)  
- `apps/web/src/lib/communication/server.ts` (announcement email placeholder)  
- `apps/web/src/components/auth/forgot-password-form.tsx`  
- Vercel Production env (`EMAIL_PROVIDER=noop`, no `RESEND_*`)  
- Docs: CP-001 matrix, INT-303 roadmap, ADR-017 (email out of OneSignal scope)

**Application code was not modified** — certification only; INT-303 remains gated.
