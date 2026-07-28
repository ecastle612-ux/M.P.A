# 03 — Cross-Platform UX

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval

---

## Shared document lifecycle (user-facing)

Every module uses the **same labels**. Map to API-004 package states internally.

| User label | Meaning | API-004 package status (canonical) |
|------------|---------|-------------------------------------|
| **Draft** | Assembled; not sent | `draft`, `ready_to_send` |
| **Pending Signature** | Sent; awaiting first meaningful action | `sent` |
| **Viewed** | At least one required signer opened the request | `in_progress` (derived when any recipient `viewed`) |
| **Awaiting Others** | Partial progress; others outstanding | `partially_signed` / `in_progress` |
| **Completed** | All required signers signed; vault synced or syncing | `completed`, `awaiting_vault_sync` |
| **Declined** | Required signer declined | `declined` |
| **Expired** | Past expiration without completion | `expired` |
| **Voided** | Administratively voided after send/complete | `voided` / `cancelled` (cancelled before complete; voided after) |
| **Archived** | Soft-archived for history; read-only | Package archived flag / parent record archived |

**UI rule:** Prefer user labels in lists and badges. Never show provider status strings.

---

## Documents panel pattern

Each originating record exposes a **Documents** section (or Acknowledgements) with:

1. List of signature packages for that record (newest first)  
2. Status badge using the shared labels  
3. Primary actions gated by permissions: Send / Remind / Cancel / Download / Void  
4. Deep link to signing progress for recipients  

Do **not** invent a global Signature app as the only place to manage these packages. Optional Ops / Command Center queues remain secondary discovery surfaces (already designed in API-004).

---

## Recipient experience

| Audience | Entry |
|----------|-------|
| Tenant / applicant | Email/SMS link → provider ceremony → M.P.A. progress page when account exists |
| Owner | Owner portal documents area + email invitation |
| Vendor / contractor | Tokenized link or email (no vendor login required — aligned with VENDOR-001 / FAC-002) |
| Employee | Email invitation; optional staff portal if account exists |
| PM / manager | In-app Documents panel + notifications |

---

## Empty & error states

| State | Copy direction |
|-------|----------------|
| No packages | “No signature documents yet.” + Create/Send when permitted |
| Failed send | “Couldn’t send for signature. Retry or check recipient emails.” |
| Vault sync pending | “Signed — saving to documents…” |
| Declined | Show decliner role/email (redacted per `signature:read` vs `read_full`) |

---

## Terminology ban list

| Forbidden | Use instead |
|-----------|-------------|
| Envelope / HelloSign / SignWell / DocuSign | Signature request / document |
| Signature request ID (raw provider) | Package number |
| Test mode (in customer UI) | Sandbox-only ops tooling |
