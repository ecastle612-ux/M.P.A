# 04 — Applicant Experience

**Package:** API-003  
**Status:** Draft — Ready for Approval

---

## Purpose

Define the applicant-facing journey for consent, identity, progress, and decision communications — Canopy-aligned, calm, and compliance-safe.

---

## Entry points

| Entry | Behavior |
|-------|----------|
| Application submitted | System creates screening case(s) per org package policy (auto or PM-triggered) |
| Email / push / SMS | Deep link to consent / continue screening |
| Applicant portal | “Screening” section on application status |
| QR / invite link | Bound to party token; expires |

---

## Consent & electronic authorization

Before any consumer report:

1. Present **FCRA disclosure** (org-configurable, versioned legal text).
2. Present **authorization** to procure consumer reports for rental purposes.
3. Capture: typed/signed name, checkbox attestations, timestamp, IP, user agent, document version ids.
4. Persist **consent record** + PDF/snapshot in document vault (API-002A / vault).
5. Only then allow `ScreeningService` to call provider order APIs.

**State:** Case remains `awaiting_consent` until all required parties complete.

Guarantors / co-signers / adult occupants receive **their own** consent links.

---

## Identity verification

- Provider may host ID upload / selfie / SSN-last4 flows.
- M.P.A. may collect minimal identity fields required to start the order (legal name, DOB, address, SSN handling policy — see [06](./06-security-and-compliance.md)).
- Prefer provider-hosted sensitive capture when available to reduce PCI/PII blast radius.
- Progress: “Verifying identity…” without exposing match details to the applicant beyond success/needs-retry.

---

## Progress UI (applicant)

Show:

- Overall status (Waiting for your authorization / In progress / Under review / Complete)
- Step checklist (non-sensitive)
- Estimated turnaround (org/provider hint)
- Support contact

Do **not** show:

- Raw credit scores to applicants mid-process (unless product/legal explicitly approves)
- Criminal hit details before adverse action process
- Other parties’ PII

---

## Notifications

Use API-001 / notification orchestration:

- Consent requested (high)
- Reminder if consent outstanding
- Screening complete → under review
- Decision communications (approve / conditional / adverse action)

Respect quiet hours except where legal timing requires prompt adverse action delivery (policy flag).

---

## Documents

Applicant can download:

- Their signed consent / authorization copy
- Adverse action notices when issued
- Not necessarily the full consumer report (jurisdiction/provider rules — default: PM-controlled sharing)

---

## Accessibility & mobile

- Keyboard-complete consent flow
- Mobile-first deep links
- Clear error recovery if provider ID check fails (“Retry identity verification”)

---

## Out of scope for applicant UI (Phase 1)

- AI chat about “will I be approved”
- Editing other household members’ sensitive data without invite
- Paying screening fees in every market variant (fee UX designed as optional slice)
