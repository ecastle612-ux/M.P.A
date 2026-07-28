# 04 — Slice A — Property Operations

**Package:** SIGN-002  
**Status:** Approved — Implemented (review before Slice B)  
**V1.0:** Required

---

## A1 — Lease Agreement

| Dimension | Design |
|-----------|--------|
| **Trigger** | Lease exists (`draft` / pending signature). PM creates package from lease (or applicant convert → lease → package). |
| **Mode** | **Mandatory** before lease can become `signed` / `active` per existing lease business rules. |
| **document_type** | `lease_agreement` |
| **Required signers** | Primary tenant (applicant/resident); additional required co-tenants/guarantors when present on lease. |
| **Optional signers** | Property manager and/or property owner when org setting `lease.require_manager_countersign` / `lease.require_owner_countersign` is on (default: manager optional, owner off). |
| **Signing order** | Sequential when guarantor or countersign required; otherwise parallel among co-tenants if org allows. Default: sequential tenant(s) then manager if required. |
| **Status transitions** | Package `completed` → vault store → lease status updates per existing rules (`signed` / activation path) → optional resident portal activation. |
| **Portal visibility** | Tenant portal: package status + download when completed; PM: lease Documents panel; Owner: read if linked and permitted. |
| **Document storage** | Executed PDF + certificate → vault linked to lease, property, unit, tenant(s). |
| **Notifications** | See [09](./09-notification-matrix.md) rows A1. |
| **Audit** | `signature.package.*`, recipient events, `signature.vault.stored`, lease timeline `lease.signed` (existing). |
| **Permissions** | `signature:create|send|cancel|read|read_full` + `lease:read|update`. |
| **Reporting** | Leases awaiting signature; turnaround. |
| **Failure** | Decline/expire → lease remains non-active; PM may create new package (lineage). Cancel → draft lease recoverable. |

**Baseline:** Partial UI exists (`SignaturePackagePanel` on lease/applicant). Slice A closes renewal lineage, countersign config, and consistent lifecycle labels.

---

## A2 — Lease Renewal

| Dimension | Design |
|-----------|--------|
| **Trigger** | Renewal initiated on existing lease (renewal workflow / status). |
| **Mode** | **Mandatory** for executed renewal terms (same bar as new lease). |
| **document_type** | `lease_renewal` |
| **Required signers** | Same party resolution as A1 against renewal parties. |
| **Optional signers** | Same countersign org settings as A1. |
| **Signing order** | Same as A1. |
| **Status transitions** | Independent package; on complete, renewal document history retained on lease; lease dates/terms update per existing renewal rules. |
| **Portal visibility** | Tenant + PM see renewal package distinct from original lease package (history list). |
| **Document storage** | Vault linked to lease; prior executed lease retained (no overwrite). |
| **Notifications** | A2 rows in [09](./09-notification-matrix.md). |
| **Audit** | Package events + lease renewal timeline. |
| **Permissions** | Same as A1. |
| **Reporting** | Renewals awaiting signature; expiring leases without renewal package. |
| **Failure** | Same as A1; original lease remains in force until renewal completed per product rules. |

**Reuse:** Same `SignatureService` path as A1; different `document_type` + package row.

---

## A3 — Owner Management Agreement

| Dimension | Design |
|-----------|--------|
| **Trigger** | Owner relationship created or “Send management agreement” from Owner record / property ownership link. |
| **Mode** | **Configurable** org default **on** for new management relationships; may be waived by org admin with audit. |
| **document_type** | `owner_agreement` |
| **Required signers** | Property owner (or authorized owner contact); management company signer (PM/org admin). |
| **Optional signers** | Additional owner principals. |
| **Signing order** | Sequential: owner then manager (default) or parallel if org setting allows. |
| **Status transitions** | Complete → vault on owner + property; owner relationship flagged `agreement_executed`. |
| **Portal visibility** | Owner portal Documents; PM Owner detail Documents. |
| **Document storage** | Vault linked to owner entity + organization (+ property when single-property agreement). |
| **Notifications** | A3 rows. |
| **Audit** | Package events + owner timeline. |
| **Permissions** | `signature:*` + owner/property read-write as applicable (`owner` portal read via existing OWNER-001). |
| **Reporting** | Owners missing executed agreement; completed agreements. |
| **Failure** | Decline → relationship remains pending agreement; cannot claim “managed under signed agreement” in compliance views. |

---

## A4 — Move-In Acknowledgement

| Dimension | Design |
|-----------|--------|
| **Trigger** | Move-in workflow reaches acknowledgement step (keys / condition / rules). |
| **Mode** | **Configurable** (default **on** for Property Ops orgs). Blocks “move-in complete” when enabled. |
| **document_type** | `move_in_form` |
| **Content (single package)** | Condition acknowledgement, keys received, community rules acknowledgement (one PDF / form). |
| **Required signers** | Primary resident (and co-residents if org requires all adult occupants). |
| **Optional signers** | PM witness/countersign (default off). |
| **Signing order** | Parallel among residents unless org requires sequential. |
| **Status transitions** | Complete → vault; move-in checklist item complete; lifecycle status advances per WF-003 / resident lifecycle rules. |
| **Portal visibility** | Tenant portal; PM lease/resident move-in panel. |
| **Document storage** | Vault → tenant, lease, unit, property. |
| **Notifications** | A4 rows. |
| **Audit** | Package + move-in timeline. |
| **Permissions** | `signature:*` + lease/resident read-update. |
| **Reporting** | Outstanding move-in acknowledgements. |
| **Failure** | Expire/decline → move-in remains incomplete; remind/resend. |

---

## A5 — Move-Out Acknowledgement

| Dimension | Design |
|-----------|--------|
| **Trigger** | Move-out / final inspection acknowledgement step. |
| **Mode** | **Configurable** (default **on**). |
| **document_type** | `general_pdf` with metadata `kind=move_out_ack` (or future `move_out_form` via API-004 amendment). |
| **Content** | Final inspection acknowledgement, damage acknowledgement, deposit documentation summary, keys returned. |
| **Required signers** | Primary resident; PM when org requires countersign on damage/deposit. |
| **Optional signers** | Co-residents. |
| **Signing order** | Resident(s) then PM if countersign required. |
| **Status transitions** | Complete → vault; move-out checklist complete; deposit workflow may proceed. |
| **Portal visibility** | Tenant + PM; owner may see executed copy when OWNER-001 document rules allow. |
| **Document storage** | Vault → tenant, lease, unit, property. |
| **Notifications** | A5 rows. |
| **Audit** | Package + move-out timeline. |
| **Permissions** | Same family as A4. |
| **Reporting** | Outstanding move-out acknowledgements. |
| **Failure** | Same recovery as A4. |

---

## Slice A acceptance (summary)

See [13](./13-acceptance-checklist.md). Each A1–A5 must demonstrate create → send → (multi-signer) → complete → vault → notify → audit → status sync from the originating record UI.
