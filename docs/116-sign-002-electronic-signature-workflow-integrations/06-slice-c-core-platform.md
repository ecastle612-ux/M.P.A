# 06 — Slice C — Core Platform

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval  
**V1.0:** Required

---

## C1 — Employee acknowledgements

| Dimension | Design |
|-----------|--------|
| **Trigger** | Org admin sends handbook / employment acknowledgement to a staff membership. |
| **Mode** | **Optional** product capability; **org-configurable** whether employment onboarding requires completion. |
| **document_type** | `general_pdf` + metadata `kind=employee_ack` |
| **Required signers** | Employee (email / user). |
| **Optional signers** | HR/admin countersign (default off). |
| **Signing order** | Employee then admin if countersign. |
| **Status transitions** | Complete → vault on user/membership + organization. |
| **Portal visibility** | Staff settings / Documents; admin Team Documents. |
| **Document storage** | Document Vault with org + membership links (API-002A categories). |
| **Notifications** | C1 rows in [09](./09-notification-matrix.md). |
| **Audit** | Package events; no payroll system invent. |
| **Permissions** | `signature:create|send|…` limited to org admin / roles with team manage; employee `signature:read` on own packages. |
| **Reporting** | Outstanding employee acknowledgements. |
| **Failure** | Remind/resend; do not disable login solely for unsigned handbook unless org setting explicitly says so (default: do not lock out). |

---

## C2 — Policy acknowledgements

| Dimension | Design |
|-----------|--------|
| **Trigger** | Policy published or version bumped; admin requires acknowledgement. |
| **Mode** | **Configurable** per policy document. |
| **document_type** | `general_pdf` + metadata `kind=policy_ack`, `policy_id`, `policy_version` |
| **Required signers** | Targeted roles/users. |
| **Optional signers** | None typical. |
| **Signing order** | Parallel per recipient **package** (one package per recipient **or** multi-recipient package — prefer **one package per recipient** for independent completion tracking). |
| **Status / vault / notify / audit** | Vault retains policy version + signature artifact. |
| **Permissions** | Admin send; recipients read own. |
| **Reporting** | Policy compliance % by version. |
| **Failure** | Per-recipient decline does not void others when separate packages. |

---

## C3 — General organization documents

| Dimension | Design |
|-----------|--------|
| **Trigger** | Admin uploads PDF and sends for signature from Org Documents (not tied to lease/vendor/WO). |
| **Mode** | **Optional** always-available tool. |
| **document_type** | `general_pdf` / `other` |
| **Required signers** | As selected by sender. |
| **Optional signers** | CC viewers (non-signing) via API-004 recipient roles. |
| **Signing order** | Sender-configured (sequential/parallel). |
| **Status transitions** | Complete → vault org library. |
| **Portal visibility** | Org Documents; recipient email. |
| **Document storage** | Vault org-scoped; optional property tag. |
| **Notifications / audit / permissions / reporting / failure** | Standard signature matrices. |

---

## C4 — Custom signature requests

| Dimension | Design |
|-----------|--------|
| **Trigger** | Explicit “Request signature” from Org Documents or Command Center action with uploaded/generated PDF. |
| **Mode** | Optional; same rails as C3 with freer metadata. |
| **Constraints** | Still must set `organization_id`, recipients, subject; still uses `SignatureService` only. |
| **Non-goal** | Ad-hoc provider console replacement — keep UX inside M.P.A. |

---

## Document Vault integration (Slice C)

| Artifact | Vault behavior |
|----------|----------------|
| Source PDF | Retained as `signature_source` |
| Executed PDF | `executed_agreement` |
| Certificate / audit trail page | `signature_certificate` when available |
| Links | `organization_id` required; `user_id` / membership when employee; `policy_id` when policy |

No separate HR DMS — Document Vault is SoT for executed copies.
