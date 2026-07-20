# 09 — Implementation Slices

**Package:** API-004  
**Status:** Approved · Implemented (Phase 1)

---

## Slice map

| Slice | Name | Outcome |
|-------|------|---------|
| 0 | Domain | Entities, permissions, timeline, audit |
| 1 | Document generation | Templates, merge fields, preview |
| 2 | Dropbox Sign provider | Adapter, webhooks, retry, sandbox |
| 3 | Signer experience | Applicant/resident progress, mobile entry |
| 4 | PM dashboard | Pending, remind, resend, cancel, status |
| 5 | Vault integration | Executed PDFs, certificates, audit |
| 6 | Ops / Command Center / notifications | Widgets, index, events |
| 7 | Hardening | Performance, permissions, retry, retention |

---

## Slice 0 — Domain

- Extend beyond thin `signature_requests` into package + recipients model (migration design after Approve)
- Permissions: `signature:*` matrix
- Audit event table / timeline emitters
- `SignatureService` skeleton with noop only
- **Done when:** Packages creatable in draft with RLS; no provider calls

---

## Slice 1 — Document generation

- Template registry + version pin
- Merge field engine + validation
- Preview UI
- Package documents with content hash
- **Done when:** PM can preview lease PDF before send without provider

---

## Slice 2 — Dropbox Sign provider

- `DropboxSignProvider` implementing `SignatureProvider`
- Webhook route + signature verification + idempotency
- Sandbox + simulate path for CI
- Retry/backoff for outbound API
- **Done when:** Sandbox envelope create → webhook → status update works end-to-end

---

## Slice 3 — Signer experience

- M.P.A. progress pages (applicant + resident)
- CTA into provider session
- Partial signature progress
- Mobile-responsive shell
- **Done when:** Signer can complete without PM manually forwarding provider emails only

---

## Slice 4 — Property Manager dashboard

- Pending signatures list
- Per-package status + recipient grid
- Remind / resend / cancel
- Deep links from lease + applicant
- **Done when:** PM can run day-2 ops without Dashboard SQL

---

## Slice 5 — Vault integration

- On complete: download executed + certificate
- Store via API-002A / vault_documents
- Entity links + download audit
- Vault retry queue on failure
- **Done when:** Completed package always yields vault artifacts (or visible retry state)

---

## Slice 6 — Operations Center / Command Center / notifications

### Ops widgets

- Pending Signatures  
- Completed Today  
- Expired Requests  
- Reminder Queue  
- Provider Failures  
- Average Completion Time  

### Command Center indexables

- Signature requests / packages  
- Executed documents  
- Pending requests  
- Signer status  
- Certificates  
- Timeline events  

### Notifications

- Invite, reminder, partial, complete, decline, expire, fail (API-001 event catalog)

**Done when:** Widgets + search + notifications live for PM roles

---

## Slice 7 — Hardening

- Retention jobs (configurable)
- Permission audits
- Webhook verify + replay tests
- Provider retry metrics
- Performance on package lists
- **Done when:** QA-001 P1 journeys green; no critical advisor gaps

---

## Explicitly deferred

- Witness / notary  
- AI summarization / clause highlight  
- Provider failover  
- Employment document suites  
- Wet-ink hybrid workflows  

---

## Recommended rollout

1. Approve package (lock Q1–Q6)  
2. Implement slices 0 → 2 (domain + templates + Dropbox Sign sandbox)  
3. Slices 3–5 (UX + vault) behind org flag  
4. Slice 6 Ops/CC  
5. Slice 7 hardening + production keys  
6. Expand document types after lease path is stable  
