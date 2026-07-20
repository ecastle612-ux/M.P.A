# 01 — Requirements

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## Problem statement

Electronic signature is a regulated, multi-party, multi-vendor process at the center of leasing. M.P.A. must own the **workflow, progress UX, vault linkage, and post-execution activation** while providers own specialized signing ceremonies. Without a platform design, teams will hard-code Dropbox Sign (or DocuSign) into lease screens and create irreversible lock-in plus compliance gaps.

---

## Goals

| # | Goal |
|---|------|
| G1 | Complete lease execution lifecycle from generation → signed → vault → resident activation |
| G2 | Provider-swappable architecture (`SignatureProvider`) with Dropbox Sign first |
| G3 | Multi-recipient packages with configurable signing order |
| G4 | Template-driven document generation with merge fields and preview |
| G5 | Reminders, decline, expire, cancel, and resend as first-class operations |
| G6 | Secure storage of executed PDFs + certificates in Document Vault |
| G7 | Operations Center + Command Center + Timeline visibility |
| G8 | Notifications for invite, reminder, partial complete, complete, fail |
| G9 | Extensible to renewals, addenda, inspections, owner/vendor agreements |

---

## Non-goals

- Implementing providers or schema in this documentation task
- Replacing legal counsel for jurisdiction-specific lease enforceability
- Guaranteeing identical provider UX across all vendors (normalize to M.P.A. package model)
- Automatic AI signing or auto-impersonation of any party
- Building a proprietary PDF signing crypto stack
- Wet-ink / notary / wet-witness as Phase 1 ship (reserved)

---

## Traceability

| Source | Coverage |
|--------|----------|
| INT-202 | DocuSign / HelloSign (Dropbox Sign) e-sign |
| MHF-002 / MHF-015 | PM queues; provider abstractions |
| Phase 12 RX-001 | `signature_requests` stub + noop provider |
| Phase 12 `SignatureProvider` sketch | Superseded/extended by this package |
| API-003 | Screening → approval → lease handoff into e-sign |
| API-002A | Executed PDF / certificate as media/vault assets |
| API-001 | Signature notification events |
| docs/14 Security | Webhook verification, least privilege |

---

## Design surfaces (must be documented)

| Surface | Requirement |
|---------|-------------|
| Signature package | Multi-document, multi-signer envelope owned by M.P.A. |
| Signing order | Sequential / parallel / hybrid configurable |
| Recipients | Primary, co-applicant, guarantor, PM, owner (optional), witness (future) |
| Document types | Lease, renewal, pet, parking, move-in, inspection, owner, vendor, general PDF |
| Template engine | Merge fields + preview before send |
| Provider ceremony | Embedded or redirect; status via webhook |
| Partial signatures | Track per-recipient; package incomplete until all required signed |
| Executed lease | Status transition + vault + certificate |
| Resident activation | Optional gated step after required signatures complete |
| Reminders | Schedule + manual resend |
| Audit trail | Every state change + who/when + IP where available |
| Provider retry | Transient failures; idempotent webhooks |
| Provider failover | Future |
| Ops Center | Widgets listed in README |
| Command Center | Indexables listed in README |
| Timeline | Universal timeline events |
| Notifications | Invite, reminder, signed, declined, expired, complete, fail |
| Document vault | Executed + certificate artifacts |

---

## Functional requirements

### Platform

| ID | Requirement |
|----|-------------|
| R-SIG-01 | `SignatureService` is the only domain entry for create/send/remind/cancel/complete |
| R-SIG-02 | No business module imports provider SDKs |
| R-SIG-03 | Org-level provider selection with env default (`SIGNATURE_PROVIDER`) |
| R-SIG-04 | Webhooks ingress via Edge Function → verify signature → idempotent apply |
| R-SIG-05 | Noop provider remains for local/CI |

### Lifecycle

| ID | Requirement |
|----|-------------|
| R-SIG-10 | Package progresses through documented states (see [02](./02-signature-workflow.md)) |
| R-SIG-11 | Documents generated/previewed before provider send |
| R-SIG-12 | Recipients independently trackable (invited, viewed, signed, declined) |
| R-SIG-13 | Partial completion supported; final complete only when required signers done |
| R-SIG-14 | Declined / expired / cancelled paths are first-class |
| R-SIG-15 | Completed package stores executed PDF + certificate in vault |
| R-SIG-16 | Lease status updates to executed; resident activation may proceed |
| R-SIG-17 | Re-send creates new provider attempt linked to same package lineage |

### Recipients & documents

| ID | Requirement |
|----|-------------|
| R-SIG-20 | Support primary + co-applicant + guarantor + PM + optional owner |
| R-SIG-21 | Configurable signing order (sequential / parallel / hybrid) |
| R-SIG-22 | Document types listed in README supported by template registry |
| R-SIG-23 | General PDF upload path for non-template packages |

### Experience & ops

| ID | Requirement |
|----|-------------|
| R-SIG-30 | Applicant / resident signing progress UI inside M.P.A. |
| R-SIG-31 | PM dashboard: pending, remind, resend, cancel, status |
| R-SIG-32 | Mobile-friendly signing entry (provider session + M.P.A. progress) |
| R-SIG-33 | Ops Center widgets (pending, completed today, expired, reminders, failures, turnaround) |
| R-SIG-34 | Command Center providers for packages / executed docs / signer status |
| R-SIG-35 | Timeline events for key transitions |

### Security & retention

| ID | Requirement |
|----|-------------|
| R-SIG-40 | Certificate of completion retained; tamper-evidence posture documented |
| R-SIG-41 | Audit log for view/sign/download/send/cancel |
| R-SIG-42 | Retention + expiration policy configurable |
| R-SIG-43 | Org isolation via RLS; signed URL access for artifacts |

### Future (document only)

| ID | Requirement |
|----|-------------|
| R-SIG-90 | Witness / notary flows reserved |
| R-SIG-91 | Provider failover reserved |
| R-SIG-92 | AI clause highlight / lease summary assist reserved — never auto-sign |
| R-SIG-93 | Employment document suites reserved |

---

## Acceptance (documentation gate)

- [x] Package docs 01–11 exist under `docs/50-api-004-electronic-signatures/`
- [x] Architecture forbids direct provider SDK use from business modules
- [x] Dropbox Sign recommended; alternatives compared
- [x] ESIGN/UETA / vault / retention designed
- [x] Ops + Command Center designed
- [x] Slices + DoD + risks documented
- [ ] Explicit **Approve** on README before any implement

---

## Gate reminder

**Design ✔ · Document ✔ · Approve Pending · Implement Blocked**
