# 07 — Data Retention

**Package:** API-003  
**Status:** Draft — Ready for Approval

---

## Principles

1. **Minimize** — keep what leasing + compliance need; not eternal raw vendor dumps.  
2. **Expire usability** — expired reports cannot justify new lease decisions.  
3. **Preserve audit** — who decided what, and that consent existed, outlives full report bodies where required.  
4. **Org policy** — defaults set by platform; orgs may shorten, not silently lengthen beyond legal max without review.

---

## Retention classes

| Class | Examples | Default posture (design) |
|-------|----------|---------------------------|
| **A — Consent & decision audit** | Consent version, decision, adverse action proof | Long-lived (e.g., 7 years) |
| **B — Normalized summary** | Component statuses, flag codes, turnaround | Medium (e.g., 3–7 years) |
| **C — Full report artifacts** | PDFs, raw provider payloads | Shorter operational window (e.g., 1–3 years) then purge/archive |
| **D — Identity media** | ID images | Short; delete after verification success + cooling period unless hold |

Exact durations are **Approve-time policy decisions** with counsel — numbers above are engineering placeholders.

---

## Report expiration (product behavior)

- Each case/report has `expires_at` (provider hint ∪ org policy).
- Past expiry → state `expired` (or component-level expired).
- UI blocks “Use for lease” and shows “Re-screen required.”
- Command Center / Ops surface expiring-soon counts.

---

## Purge jobs

Scheduled job (design):

1. Select Class C/D past retention  
2. Delete storage objects via Media/Vault APIs  
3. Null out raw payload columns  
4. Write `screening.retention_purged` audit  
5. Keep Class A pointers (case id, decision, consent hash)

Holds: legal hold flag on applicant/case pauses purge.

---

## Document vault integration

| Artifact | Vault linkage |
|----------|---------------|
| Consent PDF | `document_type: screening_consent` |
| Adverse action notice | `screening_adverse_action` |
| Credit/criminal PDF | `screening_report` (+ component tag) |
| ID image | media asset private; not public CDN |

Resident conversion copies **summary references**, not necessarily full Class C files, per policy.

---

## Provider-side retention

Adapters must not assume M.P.A. purge deletes vendor copies. Document in ops runbook: vendor account retention is separate; DPA/BAA as applicable.

---

## Re-screening interaction

New case does not extend old report expiry. Old reports remain for audit until Class C purge.
