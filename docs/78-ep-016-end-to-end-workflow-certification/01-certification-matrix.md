# 01 — Certification Matrix

**Package:** EP-016 · 2026-07-20

Legend: **PASS** · **WARNING** · **FAIL**

| # | Workflow | Result | Evidence summary |
| --- | --- | --- | --- |
| 1 | New Customer | **PASS** | Org create (`0f6722d8-…`), property **EP-016 Certification Court** (`760a2b43-…`), bulk units EP-101–104, property dashboard KPIs, timeline, vault docs, QR enrollment, success path `?from=property-created` |
| 2 | Resident Lifecycle | **WARNING** | Tenant + unit + lease signed/activated (`LS-2026-0002`); move-in date set; search/audit paths work. Portal invite / welcome email / linked `user_id` not completed in this run → resident dashboard + outbound email/push not fully exercised |
| 3 | Maintenance Lifecycle | **PASS** | Submit → assign vendor → complete. Facility Record mint was broken on vendor-complete path; **fixed and re-verified**. Timeline + repair history + vendor linkage confirmed on property dashboard |
| 4 | Financial Lifecycle | **WARNING** | Charge + manual payment + duplicate blocked (`Cannot record payment against a closed charge`). Owner statement + P&amp;L PDF vaulted. **Stripe live charge not exercised** (`STRIPE_MODE=live`, `STRIPE_ALLOW_SIMULATE=false`) — safety hold. Lease activation also auto-created rent + deposit charges (outstanding $3,300) |
| 5 | Communication | **WARNING** | Announcement published; timeline + history OK. `pushRecipientCount=0` / `audienceUserCount=0` because resident has no linked portal user. Resend/OneSignal delivery not proven for this announcement audience |
| 6 | Reporting | **WARNING** | Owner Statement PDF + Monthly P&amp;L PDF generated, vaulted, downloadable (`application/pdf`). **Maintenance Summary report type does not exist** in FIN-001 catalog → FAIL for that sub-item only |
| 7 | Master Admin | **WARNING** | Permission gates **PASS** (non–master-admin redirected to `/unauthorized`; seed API `403`). Full Master Admin dashboard / Provider Health / testing utilities **not exercised** — session is not `ecastle612@gmail.com` |
| 8 | Command Center | **PASS** | Search APIs return Resident, Property, Unit, Vendor, Facility Record, Timeline Event, Work Order, Announcement, Financial Report versions, Owner Statement. Detail routes open `200` |
| 9 | Mobile | **PASS** | 390×844 viewport: hamburger Menu, Command Center, notifications, AI Operations, property forms/filters usable; no clipped primary controls observed |
| 10 | Final Certification | **GO WITH LIMITATIONS** | See [03-final-certification-report.md](./03-final-certification-report.md) |

## Sub-check detail (high signal)

### Scenario 1 — New Customer
| Check | Result |
| --- | --- |
| Organization creation | PASS (`EP-016 New Customer Org`) |
| Property creation | PASS |
| Bulk unit import | PASS (4 units) |
| Property dashboard | PASS |
| Property timeline | PASS |
| Command Center indexing | PASS (search hits) |
| Success feedback | PASS |

### Scenario 4 — Stripe
| Check | Result |
| --- | --- |
| Create charge | PASS |
| Manual payment / accounting / audit activity | PASS |
| Duplicate payment blocked | PASS |
| Stripe card payment | **FAIL (not run — live key safety)** |
| Owner reporting / financial PDF | PASS |
| Receipt email | WARNING (not verified in this run) |

### Scenario 6 — Reporting
| Check | Result |
| --- | --- |
| Owner Statement (ops + PDF) | PASS |
| Financial Report (P&amp;L PDF) | PASS |
| Maintenance Summary | **FAIL (capability missing)** |
| Document Vault + Download | PASS |
| Search + Timeline + Audit | PASS / PASS / PASS |
