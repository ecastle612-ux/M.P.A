# 11 — Risk Analysis

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Vendor lock-in via provider templates | Med | High | M.P.A.-owned PDF generation; `SignatureProvider` boundary |
| R2 | Webhook spoofing / replay | Med | Critical | HMAC verify; idempotent store; skew window |
| R3 | Executed PDF orphaned at provider | Med | High | Mandatory vault handoff + retry queue |
| R4 | Signer drops mid-flow | High | Med | Reminders; Ops Reminder Queue; mobile UX |
| R5 | Wrong merge fields → bad lease | Med | Critical | Preview gate; required-field validation; template version pin |
| R6 | ESIGN/UETA misconfiguration by org | Med | Critical | Counsel review; disclosure templates; certificate retention |
| R7 | Permission over-broad downloads | Med | High | `signature:read_full` least privilege; download audit |
| R8 | Dual write: provider complete vs vault fail | Med | High | `vault_status` degraded state; retries; Ops alert |
| R9 | AI misuse pressure (“just auto-sign”) | Low | Critical | Explicit prohibition; no APIs for machine signature |
| R10 | MCP/direct DB applies drift history | Med | Med | DEV-004A policy: git migrations + `db push` only |
| R11 | Multi-provider feature gaps (ID verify) | High | Low | Capability flags per provider; don’t assume parity |
| R12 | Resident activation race with incomplete package | Med | High | Gate activation on `completed` + required signers |

---

## Open questions for Approve

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q1 | Primary provider? | Dropbox Sign / DocuSign / Adobe | **Dropbox Sign** |
| Q2 | Embedded vs email-first ceremony? | Embedded / email / both | **Both**; M.P.A. progress always |
| Q3 | Where is SoR for executed PDF? | Provider only / M.P.A. vault | **M.P.A. vault** |
| Q4 | AI role? | None / summarize / auto-sign | **Summarize future only; never sign** |
| Q5 | Owner signature default? | Required / optional / never | **Optional per org** |
| Q6 | Retention default guidance? | Suggest ranges in UI vs none | **Configurable; suggest, don’t hard-code** |

---

## Dependencies

| Dependency | Risk if missing |
|------------|-----------------|
| API-002A media/vault | Cannot store executed artifacts safely |
| API-001 notifications | Weak reminder/completion UX |
| API-003 / lease records | Leasing path incomplete (non-lease docs still viable) |
| RX-001 signature stub | Starting point; must be extended carefully |

---

## Known limitations (documentation phase)

- No commercial contract with Dropbox Sign negotiated here  
- Jurisdiction-specific statutory lease forms are org-owned content  
- Witness/notary not designed in depth  

---

## Gate

**Design ✔ · Document ✔ · Approve Pending · Implement Blocked**
