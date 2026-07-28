# API-004 — Electronic Signatures & Digital Lease Execution

**Status:** Approved · Implemented (slices 0–7) · **Provider amended to SignWell (ADR-030)**  
**Initiative ID:** API-004  
**PRR / integration:** [INT-202](../31-product-requirements/integration-roadmap.md)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-030 SignWell](../18-decision-log/adr-030-signwell-as-primary-esign-provider.md)  
**Related:** [Phase 12 RX-001](../41-phase-12-resident-experience-digital-operations/RX-001-applicant-lifecycle.md) · [Provider abstractions](../41-phase-12-resident-experience-digital-operations/04-provider-abstractions.md) · [API-003 Screening](../48-api-003-background-screening/README.md) · [API-002A Media / Vault](../46-api-002a-universal-media-foundation/README.md) · [API-001 Notifications](../44-api-001-onesignal-notification-foundation/README.md) · [Security Standards](../14-security-standards/index.md) · [Phase 8 Lease Foundation](../25-phase-5-tenant-lease-foundation/architecture.md)  
**Gate owner:** Product + Lead Architect + Security (+ Legal counsel for ESIGN/UETA / certificate of completion)  
**Production provider (V1.0):** SignWell  
**Retired:** Dropbox Sign / HelloSign (removed from runtime; see [12 — SignWell migration](./12-signwell-migration.md))  
**Future adapters (optional):** DocuSign · Adobe Acrobat Sign · SignNow · PandaDoc  
**Architectural decisions (Approve):** Q1 SignWell (amended from Dropbox Sign via ADR-030) · Q2 M.P.A.-owned document generation · Q3 configurable signing order · Q4 resident activation after vault · Q5 immutable audit · Q6 awaiting vault sync + retry  

---

## Executive Summary

M.P.A. has a complete electronic signature platform: multi-signer packages, configurable signing order, document generation/merge, reminders, certificates of completion, vault handoff of executed PDFs, resident activation on completion, and Ops/Command Center visibility.

```
Applicant → Screening (API-003) → Approval → Lease Generation →
Electronic Signature → Executed Lease → Document Vault →
Resident Activated → Timeline → Notifications → Ops Center → Command Center
```

Everything must happen **without leaving M.P.A.** Signers may open a provider-hosted signing session, but initiation, progress, reminders, vault storage, and post-execution activation remain inside M.P.A.

**Invariant:** Business modules talk only to `SignatureService`. `SignatureService` talks only to `SignatureProvider`. Concrete adapters (`SignWellProvider`, future `DocuSignProvider`, …) never leak into applicant, lease, Operations Center, or Command Center code.

### What this package defines

| Area | Outcome |
|------|---------|
| Signature workflow | End-to-end package lifecycle, multi-signer, partial → complete |
| Provider abstraction | Swappable vendors; **SignWell** for V1.0 |
| Recipient management | Roles, order, reminders, decline/expire |
| Document generation | Templates, merge fields, preview before send |
| Security & compliance | ESIGN/UETA posture, audit, certificates, retention |
| Document Vault | Executed PDFs + certificates linked to entities |
| Ops / Command Center | Widgets + searchable index |
| Future AI | Assistive clause/summary only — never sign or impersonate |

### Explicitly out of scope

- Parallel signature platforms or dual live providers in V1.0
- Witness-required wet-ink / notary workflows (future)
- Provider failover mesh (future)
- Employment / HR document suites beyond property-ops scope (future document types reserved)

---

## Architecture overview

```
Applicant / Resident / PM UI / Ops Center / Command Center / Timeline
  → SignatureService (domain — only public write path)
      → authz + package gates + audit + notifications + vault handoff
        → SignatureProvider (interface)
          → SignWellProvider | NoopProvider | (future adapters)
            → Provider APIs + verified webhooks
              → /api/webhooks/signature/[provider]
                → SignatureService.applyProviderEvent(...)
```

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements](./01-requirements.md) | Goals, surfaces, acceptance |
| [02 — Signature Workflow](./02-signature-workflow.md) | Lifecycle, states, lease execution |
| [03 — Provider Abstraction](./03-provider-abstraction.md) | `SignatureService` / `SignatureProvider` / SignWell |
| [04 — Recipient Management](./04-recipient-management.md) | Signers, order, reminders |
| [05 — Document Generation](./05-document-generation.md) | Templates, merge fields, preview |
| [06 — Security and Compliance](./06-security-and-compliance.md) | ESIGN/UETA, audit, permissions |
| [07 — Document Vault Integration](./07-document-vault-integration.md) | Executed storage, links, retention |
| [08 — Provider Comparison](./08-provider-comparison.md) | Historical comparison; SignWell locked for V1.0 |
| [09 — Implementation Slices](./09-implementation-slices.md) | Deployable slices |
| [10 — Definition of Done](./10-definition-of-done.md) | Gate + implementation DoD |
| [11 — Risk Analysis](./11-risk-analysis.md) | Risks, mitigations |
| [12 — SignWell Migration](./12-signwell-migration.md) | Feature parity + Dropbox Sign retirement |
| [SIGN-002 — Workflow Integrations](../116-sign-002-electronic-signature-workflow-integrations/README.md) | V1.0 business workflow integrations (**Draft — Ready for Approval**) |

---

## Architectural decisions (current)

| # | Decision | Current |
|---|----------|---------|
| Q1 | Primary provider | **SignWell** (ADR-030); Dropbox Sign retired |
| Q2 | Signing UX | Provider-hosted email/embedded sessions; M.P.A. owns progress UI |
| Q3 | System of record | M.P.A. package + recipient status + vault refs |
| Q4 | AI | Assistive only — **never** sign or impersonate |
| Q5 | Security | Certificates/audit trail, IP/timestamp audit, least-privilege |
| Q6 | Retention | Configurable org retention |

---

## Gate status

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔** (Phase 1 + SignWell amendment)
