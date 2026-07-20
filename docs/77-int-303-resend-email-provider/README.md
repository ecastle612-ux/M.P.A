# INT-303 — Resend Email Provider

**Status:** Approved — Implement in progress / shipping  
**Gate:** Design → Document → Approve → Implement ([implementation-gate.md](../00-governance/implementation-gate.md), [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md))  
**ADR:** [ADR-018 — Resend as the Primary Transactional Email Provider](../18-decision-log/adr-018-resend-as-primary-transactional-email-provider.md)  
**Roadmap:** INT-303 in [integration-roadmap.md](../31-product-requirements/integration-roadmap.md)  
**Prior certification:** [CP-004 Resend Production Certification](../76-cp-001-live-provider-certification/08-cp004-resend-production-certification.md) — **FAIL** (no adapter)

> **Numbering note:** The brief requested “ADR-017.” ADR-017 is already Accepted for OneSignal push. This package uses **ADR-018** so decisions remain unique and non-destructive.

---

## Package contents

| Doc | Purpose |
| --- | --- |
| [01-overview.md](./01-overview.md) | Why Resend; existing architecture; Notification Service, Registry, Integrations Health |
| [02-architecture.md](./02-architecture.md) | Layered send path and boundaries |
| [03-provider-contract.md](./03-provider-contract.md) | `EmailProvider` interface, modes, env, failure/retry/timeout/audit |
| [04-template-mapping.md](./04-template-mapping.md) | Existing workflows only — no new templates |
| [05-provider-health.md](./05-provider-health.md) | Integrations page health contract |
| [06-security.md](./06-security.md) | Secrets, PII, audit, rate limits |
| [07-testing-plan.md](./07-testing-plan.md) | Certification plan for Production Ready |
| [08-non-goals.md](./08-non-goals.md) | Explicit exclusions |
| [09-definition-of-done.md](./09-definition-of-done.md) | Implementation complete criteria |
| [10-implementation-certification.md](./10-implementation-certification.md) | Post-Approve implementation + initial certification status |
| [11-final-production-certification.md](./11-final-production-certification.md) | Final live inbox certification (delivered events) |

---

## Approval checklist (gate owner)

- [x] Scope matches INT-303 only (transactional email adapter + health + audit)
- [x] Password reset remains Supabase Auth (out of scope)
- [x] No workflow / Accounting / Maintenance / Reporting redesign
- [x] ADR-018 Accepted
- [x] Explicit **Approve** recorded — Implement may begin

**Implementation shipped. Production Ready requires live inbox certification (see 10-implementation-certification.md).**
