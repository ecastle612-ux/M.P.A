# API-004 — Electronic Signatures & Digital Lease Execution

**Status:** Approved · Implemented (slices 0–7)  
**Initiative ID:** API-004  
**PRR / integration:** [INT-202](../31-product-requirements/integration-roadmap.md)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Related:** [Phase 12 RX-001](../41-phase-12-resident-experience-digital-operations/RX-001-applicant-lifecycle.md) · [Provider abstractions](../41-phase-12-resident-experience-digital-operations/04-provider-abstractions.md) · [API-003 Screening](../48-api-003-background-screening/README.md) · [API-002A Media / Vault](../46-api-002a-universal-media-foundation/README.md) · [API-001 Notifications](../44-api-001-onesignal-notification-foundation/README.md) · [Security Standards](../14-security-standards/index.md) · [Phase 8 Lease Foundation](../25-phase-5-tenant-lease-foundation/architecture.md)  
**Gate owner:** Product + Lead Architect + Security (+ Legal counsel for ESIGN/UETA / certificate of completion)  
**Recommended first provider:** Dropbox Sign (formerly HelloSign)  
**Alternatives:** DocuSign · Adobe Acrobat Sign · SignNow · PandaDoc  
**Architectural decisions (Approve):** Q1 Dropbox Sign · Q2 M.P.A.-owned document generation · Q3 configurable signing order · Q4 resident activation after vault · Q5 immutable audit · Q6 awaiting vault sync + retry  

---

## Executive Summary

M.P.A. already has a **thin `signature_requests` table** (RX-001), a **noop `SignatureProvider` stub**, lease records, and vault/media foundations. What it does **not** have is a complete electronic signature platform: multi-signer packages, configurable signing order, document generation/merge, reminders, certificates of completion, vault handoff of executed PDFs, resident activation on completion, or Ops/Command Center visibility.

**API-004 designs that complete platform.**

This is **not** “wire Dropbox Sign and store a PDF.” It is the digital lease execution workflow that closes the leasing lifecycle:

```
Applicant → Screening (API-003) → Approval → Lease Generation →
Electronic Signature → Executed Lease → Document Vault →
Resident Activated → Timeline → Notifications → Ops Center → Command Center
```

Everything must happen **without leaving M.P.A.** Signers may open a provider-hosted signing session, but initiation, progress, reminders, vault storage, and post-execution activation remain inside M.P.A.

**Invariant:** Business modules talk only to `SignatureService`. `SignatureService` talks only to `SignatureProvider`. Concrete adapters (`DropboxSignProvider`, future `DocuSignProvider`, `AdobeSignProvider`, `SignNowProvider`, `PandaDocProvider`) never leak into applicant, lease, Operations Center, or Command Center code.

### What this package defines

| Area | Outcome |
|------|---------|
| Signature workflow | End-to-end package lifecycle, multi-signer, partial → complete |
| Provider abstraction | Swappable vendors; Dropbox Sign first |
| Recipient management | Roles, order, reminders, decline/expire |
| Document generation | Templates, merge fields, preview before send |
| Security & compliance | ESIGN/UETA posture, audit, certificates, retention |
| Document Vault | Executed PDFs + certificates linked to entities |
| Ops / Command Center | Widgets + searchable index |
| Future AI | Assistive clause/summary only — never sign or impersonate |

### Explicitly out of scope (this documentation task)

- Application code, migrations, Edge Functions, SDK installs
- Choosing final commercial terms with Dropbox Sign (Approve may lock vendor)
- Implementing AI summarization or clause highlighting
- Witness-required wet-ink / notary workflows (designed as future)
- Provider failover mesh (future)
- Employment / HR document suites beyond property-ops scope (future document types reserved)

---

## Problem analysis

| Observed | Interpretation |
|----------|----------------|
| `SignatureProvider` noop + thin `signature_requests` | Stub only — not leasing-grade execution |
| INT-202 lists DocuSign / HelloSign without package design | Need one authoritative design before implement |
| API-003 lease handoff ends at “generate lease” | Missing signature → vault → resident activation bridge |
| Executed PDFs can become orphaned email attachments | Must bind to lease → resident → vault → timeline |
| Vendor lock-in risk | Abstraction mandatory from day one |

---

## Architecture overview

```
Applicant / Resident / PM UI / Ops Center / Command Center / Timeline
  → SignatureService (domain — only public write path)
      → authz + package gates + audit + notifications + vault handoff
        → SignatureProvider (interface)
          → DropboxSignProvider | DocuSignProvider | AdobeSignProvider | …
            → Provider APIs + signed webhooks
              → Edge Function ingress (idempotent)
                → SignatureService.applyProviderEvent(...)
```

**Data plane (conceptual):** signature packages, recipients, document artifacts (source + executed), reminders, certificates, audit events, vault/media refs — all org-isolated via RLS.

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements](./01-requirements.md) | Goals, surfaces, acceptance |
| [02 — Signature Workflow](./02-signature-workflow.md) | Lifecycle, states, lease execution |
| [03 — Provider Abstraction](./03-provider-abstraction.md) | `SignatureService` / `SignatureProvider` / Dropbox Sign |
| [04 — Recipient Management](./04-recipient-management.md) | Signers, order, reminders |
| [05 — Document Generation](./05-document-generation.md) | Templates, merge fields, preview |
| [06 — Security and Compliance](./06-security-and-compliance.md) | ESIGN/UETA, audit, permissions |
| [07 — Document Vault Integration](./07-document-vault-integration.md) | Executed storage, links, retention |
| [08 — Provider Comparison](./08-provider-comparison.md) | Dropbox Sign vs alternatives |
| [09 — Implementation Slices](./09-implementation-slices.md) | Deployable slices after Approve |
| [10 — Definition of Done](./10-definition-of-done.md) | Gate + implementation DoD |
| [11 — Risk Analysis](./11-risk-analysis.md) | Risks, mitigations, open questions |

---

## Architectural decisions for Approve

| # | Decision | Recommendation |
|---|----------|----------------|
| Q1 | Primary provider | **Dropbox Sign** first; DocuSign / Adobe / SignNow / PandaDoc later |
| Q2 | Signing UX | Provider-hosted embedded/redirect sessions; M.P.A. owns progress UI |
| Q3 | System of record | M.P.A. package + recipient status + vault refs; provider holds transient envelope |
| Q4 | AI | Assistive only — **never** sign or impersonate |
| Q5 | Security | Certificates, IP/timestamp audit, least-privilege, signed URL access |
| Q6 | Retention | Configurable org retention — do not hard-code product durations |

---

## Gate status

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔**

API-004 Phase 1 is implemented under `SignatureService` / `SignatureProvider` / `DropboxSignProvider`.
