# 10 — Definition of Done

**Package:** API-004  
**Status:** Approved · Implemented (Phase 1)

---

## Gate DoD (documentation)

| Criterion | State |
|-----------|--------|
| Design complete | ✔ |
| Documented under `docs/50-api-004-electronic-signatures/` | ✔ |
| Linked from Blueprint / integration docs | ✔ |
| Explicit Approve on README | ✔ |
| Application / migration / SDK code | ✔ Implemented (REST adapters; no provider SDKs in business modules) |

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔**

---

## Phase 1 implementation DoD (after Approve)

- [x] `SignatureService` is sole domain entry; no SDK leaks
- [x] Document generate + preview before send
- [x] Multi-recipient packages with configurable order
- [x] Dropbox Sign adapter + signed webhooks + noop for CI
- [x] Partial → completed lifecycle with decline/expire/cancel
- [x] Executed PDF + certificate in Document Vault
- [x] Lease executed + timeline + notifications
- [x] Resident activation path wired when org policy requires
- [x] Ops widgets + Command Center index live
- [x] Retention settings configurable
- [x] Audit on send/view/sign/download/cancel
- [x] QA-001 P1 signature journeys
- [x] Package README → Implemented

---

## Acceptance narrative (product)

API-004 Phase 1 is complete only when:

1. Approved applicant / lease can generate a signing package inside M.P.A.  
2. Signers are invited in configured order  
3. Provider sandbox returns signed results through `SignatureService`  
4. Executed documents + certificate land in vault  
5. Lease shows executed; timeline and Ops update  
6. Resident activation can proceed without leaving M.P.A.  
7. All events are audited  

---

## Explicitly not required for Phase 1 DoD

- DocuSign / Adobe / SignNow / PandaDoc adapters  
- AI clause tools  
- Witness / notary  
- Provider failover  
- Employment document suites  
