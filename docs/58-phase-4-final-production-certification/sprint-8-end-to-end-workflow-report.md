# Sprint 8 — End-to-End Workflow Report

## Commercial Journey

Landing → Pricing → Confirm Plan → Stripe → Provisioning → Claim → Setup → Mission Control

| Step | Result | Notes |
| --- | --- | --- |
| Landing | **PASS** | Brand + CTAs |
| Pricing | **PASS** | Three products; Capital Projects excluded |
| Confirm Plan | **PASS** | FO/Complete consultation honesty when FO_READY=false |
| Stripe Checkout | **PENDING Owner** | PM self-serve path exists; agent did not execute payment |
| Provisioning | **PENDING Owner** | COM-002 path; Master Admin visibility |
| Claim Account | **PENDING Owner** | |
| Guided Setup | **AUTH_BLOCKED** | `/setup` → login |
| Mission Control | **AUTH_BLOCKED** / Demo **PASS** | Demo PM MC certified |

## Resident Journey

Login → Home → Report Maintenance → WO → Status → Documents → Notifications

| Step | Result | Notes |
| --- | --- | --- |
| Login gate | **PASS** | `/portal/tenant` → `/login` |
| Home / maintenance / documents | **PENDING Owner LIVE** | Sprint 5 shipped; AUTH_BLOCKED |
| Community/messages shells | **Non-defect** | Readiness-only (RES-UX) |

## Property Manager Journey

MC → Properties → Residents → Leasing → Maintenance → Documents → Reports

| Step | Result | Notes |
| --- | --- | --- |
| Demo MC / Documents | **PASS** | |
| App modules | **AUTH_BLOCKED** | Entitlements mapped |
| Financial reports (FIN-OPS) | **AUTH_BLOCKED** | Live under Financial Operations |
| `/shared/reports` RAC | **GATE-S7** | Not on Production until PR #96 |

## Facility Operations Journey

MC → Assets → Work Orders → Technicians → Documents → Reports

| Step | Result | Notes |
| --- | --- | --- |
| Demo FO MC | **PASS** | |
| Assets / technicians / FO WO CRUD | **Planned** | Honest shells — not cert failures |
| Bridge to PM maintenance/vendors | **Designed** | Complete / entitled paths |
| Documents | **AUTH_BLOCKED** / Demo shell | |
| Reports | **GATE-S7** + planned FO analytics | |

## Document Journey

Create → Attach → Links → Preview → Version → Download → PDF → Reporting

| Step | Result | Notes |
| --- | --- | --- |
| Route + auth | **PASS** | |
| Intelligence Center | **PENDING Owner LIVE** | S6 Production SHA prior; AUTH_BLOCKED |
| Professional PDF | **PASS** (generator smoke in S6) | Owner browser download pending |
| Reporting link-out | **GATE-S7** | |

## Reporting Journey

Insights → Reports → Filters → Export PDF/CSV

| Step | Result | Notes |
| --- | --- | --- |
| FIN-OPS financial snapshot | **Shipped** | Under PM Financial Operations |
| Reporting & Analytics Center | **GATE-S7** | PR #96 |
| Demo `/reports` pre-fix | Misrepresented as MC | **CERT-001 fixed** in Sprint 8 |
