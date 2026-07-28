# 05 — Slice B — Facility Operations

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval  
**V1.0:** Required  
**Aligns with:** [FAC-002](../114-fac-002-facility-operations-v1/README.md) · [VENDOR-001](../101-vendor-001-zero-friction-vendor-experience/README.md)

---

## B1 — Vendor Service Agreement

| Dimension | Design |
|-----------|--------|
| **Trigger** | Vendor created / invited; before vendor status becomes **Active**. |
| **Mode** | **Mandatory** for Active status (product gate). Draft/Pending vendors may exist without signature. |
| **document_type** | `vendor_agreement` |
| **Required signers** | Vendor authorized signer (email); org/manager countersigner. |
| **Optional signers** | Additional vendor principals. |
| **Signing order** | Vendor then manager (default). |
| **Status transitions** | Complete → vault on vendor; vendor eligible for **Active**. Cancel/decline → remains inactive for assignment policies that require Active. |
| **Portal visibility** | PM vendor detail Documents; vendor receives email/token link (**no vendor account**). |
| **Document storage** | Vault → vendor + organization. |
| **Notifications** | B1 rows in [09](./09-notification-matrix.md). |
| **Audit** | Package + vendor timeline. |
| **Permissions** | `signature:*` + `vendor:read|update`. |
| **Reporting** | Vendors awaiting agreement; Active without agreement (should be zero). |
| **Failure** | Decline/expire → cannot activate; resend or new package. |

---

## B2 — Contractor Agreement

| Dimension | Design |
|-----------|--------|
| **Trigger** | Contractor (independent) onboarded in vendor directory with `party_kind=contractor` (or equivalent flag). |
| **Mode** | **Mandatory** before Active (same gate as B1). |
| **document_type** | `vendor_agreement` + metadata `party_kind=contractor` |
| **Required / optional / order** | Same pattern as B1. |
| **Status / portal / vault / notify / audit / permissions / reporting / failure** | Same as B1 with contractor labeling in UX. |

**Note:** Not a separate platform object — same SignatureService path; UX copy says “Contractor agreement.”

---

## B3 — Work Authorization

| Dimension | Design |
|-----------|--------|
| **Trigger** | Work order ready for vendor execution when org setting `facility.require_work_authorization` is **on**. |
| **Mode** | **Configurable** — **default off**. When on: vendor must complete authorization package before “work begins” / start is allowed. |
| **document_type** | `general_pdf` + metadata `kind=work_authorization`, `work_order_id` |
| **Required signers** | Vendor assignee (or vendor company signer). |
| **Optional signers** | Issuing manager (default: auto-included as requester, not always a signer). |
| **Signing order** | Single signer typical; sequential if manager must countersign (org setting). |
| **Status transitions** | Complete → vault linked to work order + vendor; WO may transition to in-progress / vendor start allowed. |
| **Portal visibility** | PM WO detail; vendor token job page shows “Authorization required / completed.” |
| **Document storage** | Vault → work order, vendor, property. |
| **Notifications** | B3 rows. |
| **Audit** | Package + WO timeline. |
| **Permissions** | `signature:*` + maintenance/facility WO permissions. |
| **Reporting** | WOs blocked on authorization; completed authorizations. |
| **Failure** | Decline/expire → WO remains blocked; PM may cancel auth requirement only with `signature:admin` + audit (break-glass). |

---

## B4 — Inspection Sign-Off

| Dimension | Design |
|-----------|--------|
| **Trigger** | Inspection run reaches complete with org/policy requiring sign-off (fire, safety, regulatory, facility acceptance). |
| **Mode** | **Configurable by inspection template type** — default **on** for templates tagged `requires_signoff`; **off** for ad-hoc informal walks. |
| **document_type** | `inspection_form` |
| **Required signers** | Inspector/assignee; building contact or manager when template requires. |
| **Optional signers** | External AHJ/regulator contact (email) when template includes. |
| **Signing order** | Inspector then manager/external as configured on template. |
| **Status transitions** | Complete → vault; inspection marked signed-off; Facility Record may reference executed PDF. |
| **Portal visibility** | PM inspection detail; no resident requirement unless template says so. |
| **Document storage** | Vault → inspection, property, optional unit. |
| **Notifications** | B4 rows. |
| **Audit** | Package + inspection timeline. |
| **Permissions** | `signature:*` + `facility:inspection:read|write`. |
| **Reporting** | Inspections awaiting sign-off; completed sign-offs. |
| **Failure** | Decline/expire → inspection incomplete for compliance views. |

---

## B5 — Safety acknowledgements (if applicable)

| Dimension | Design |
|-----------|--------|
| **Trigger** | Org enables safety acknowledgement packs (e.g. contractor site rules) before first Active job. |
| **Mode** | **Configurable** — default **off**. When on, may gate vendor Active or first WO start. |
| **document_type** | `general_pdf` + metadata `kind=safety_ack` |
| **Required signers** | Vendor/contractor signer. |
| **Optional signers** | Manager. |
| **Signing order** | Vendor first. |
| **Status / vault / notify / audit** | Same pattern as B1; linked to vendor (and optionally property). |
| **Permissions / reporting / failure** | Same family as B1. |

**If not enabled:** no UI clutter; setting remains available under Facility / Vendor compliance settings.

---

## Facility independence

Per FAC-002: Facility workflows must function when Property module is off. Signature packages for B1–B5 must not require a lease record — only org + facility entities (vendor, WO, inspection, property asset as applicable).
