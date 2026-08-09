# Version 1.0 — Workflow Certification Report

## Commercial

Landing → Pricing → Confirm Plan → Stripe Session → (Payment Owner) → Provisioning → Claim → Setup → MC

| Step | Agent |
| --- | --- |
| Through Confirm Plan | **PASS** |
| Checkout Session URL | **PASS** (`checkout.stripe.com`, `cs_live_…`) |
| Payment / Claim / Setup / MC | **Owner checklist** |

## Maintenance chain

Resident → WO → PM/FO → Tech/Vendor → Completion → Documents → Reporting  

**Code paths present.** Live multi-actor execution: **Owner checklist**. FO module CRUD remains planned (non-defect).

## Lease → Resident → Documents → Reporting

**Shipped.** LIVE authenticated: **Owner**.

## Vendor Invoice → WO → Asset → Financial → Documents → Reporting

Financial + Documents LIVE. Asset FO shell planned. **Owner** for end-to-end data.

## Inspection → Asset → Compliance → Documents → Reporting

Compliance via Document categories LIVE. Asset/inspection FO planned. **Owner**.

## Property → Mission Control → Documents → Reporting

Demo **PASS**. Authenticated **Owner**.

## Document certification

Search · relationships · versions · timeline · preview · download · PDF · permissions — **S6 LIVE**; agent AUTH_BLOCKED; PDF generator smoke **PASS**.

## Reporting certification

Executive briefing · persona dashboards · PDF/CSV/print — **S7 LIVE** on Production; demo reports **PASS**; authenticated **Owner**.
