# 07 — Workflow Integration Matrix

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval  
**SoT:** One-page view of V1.0 signature workflows

| ID | Workflow | Slice | Mode | document_type | Originating record | Blocks |
|----|----------|-------|------|---------------|--------------------|--------|
| A1 | Lease Agreement | A | Mandatory | `lease_agreement` | Lease (+ applicant) | Lease `signed`/`active` |
| A2 | Lease Renewal | A | Mandatory | `lease_renewal` | Lease (renewal) | Renewal execution |
| A3 | Owner Management Agreement | A | Configurable (default on) | `owner_agreement` | Owner / ownership link | “Agreement executed” flag |
| A4 | Move-In Acknowledgement | A | Configurable (default on) | `move_in_form` | Lease / tenant move-in | Move-in complete |
| A5 | Move-Out Acknowledgement | A | Configurable (default on) | `general_pdf` (`kind=move_out_ack`) | Lease / tenant move-out | Move-out ack complete |
| B1 | Vendor Service Agreement | B | Mandatory for Active | `vendor_agreement` | Vendor | Vendor Active |
| B2 | Contractor Agreement | B | Mandatory for Active | `vendor_agreement` (`party_kind=contractor`) | Vendor (contractor) | Vendor Active |
| B3 | Work Authorization | B | Configurable (default off) | `general_pdf` (`kind=work_authorization`) | Work order | Vendor start (when on) |
| B4 | Inspection Sign-Off | B | Template-configurable | `inspection_form` | Inspection run | Signed-off complete |
| B5 | Safety acknowledgement | B | Configurable (default off) | `general_pdf` (`kind=safety_ack`) | Vendor / property | Optional Active/start gate |
| C1 | Employee acknowledgement | C | Configurable | `general_pdf` (`kind=employee_ack`) | Membership / user | Optional onboarding |
| C2 | Policy acknowledgement | C | Configurable per policy | `general_pdf` (`kind=policy_ack`) | Policy version | Compliance % |
| C3 | General org document | C | Optional | `general_pdf` / `other` | Org Documents | None |
| C4 | Custom signature request | C | Optional | `general_pdf` / `other` | Org / CC action | None |

All rows: org-scoped · `SignatureService` only · vault on complete · API-001 notifications · signature audit.
