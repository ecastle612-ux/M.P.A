# Future Enhancements (FEH)

## Status

**Approved backlog — not authorized for implementation until gated**

Future Enhancements (FEH) capture product capabilities agreed in blueprint documentation that are **not yet implemented**. Each item must pass Design → Document → Approve → Implement before code ships.

Priority: **HIGH** · **MEDIUM** · **LOW** · **DEFERRED**

---

## Phase-Aligned Enhancements (Roadmap 17)

Mapped to [Development Roadmap](../17-development-roadmap/index.md) phases 5–12.

### Phase 5 — Tenant & Lease Foundation

| ID | Enhancement | Priority | Notes |
|----|-------------|----------|-------|
| FEH-501 | Lease record CRUD with status lifecycle | HIGH | Phase 5B — approved, pending implementation |
| FEH-502 | Lease ↔ tenant ↔ unit linkage | HIGH | Required for rent and move-out workflows |
| FEH-503 | Lease document attachment metadata | MEDIUM | Full DocuSign flow deferred to INT-* |
| FEH-504 | Lease renewal workflow rail | MEDIUM | Connects to 05 lifecycle |

### Phase 6 — Maintenance Operations

| ID | Enhancement | Priority | Notes |
|----|-------------|----------|-------|
| FEH-601 | Work order creation from tenant/property context | HIGH | Workflow-first entry points |
| FEH-602 | Vendor assignment and status tracking | HIGH | ADR-004 |
| FEH-603 | Offline-capable inspections | HIGH | CA-007; MOB-* |
| FEH-604 | Preventive maintenance schedules | MEDIUM | Automation candidate |
| FEH-605 | Photo/video evidence on work orders | MEDIUM | Mobile capture |
| FEH-606 | SLA and escalation rules | MEDIUM | AUT-* |

### Phase 7 — Vendor Marketplace

| ID | Enhancement | Priority | Notes |
|----|-------------|----------|-------|
| FEH-701 | Vendor onboarding and verification | HIGH | First-class domain |
| FEH-702 | Bid/quote workflow | HIGH | Marketplace economics |
| FEH-703 | Vendor performance scoring | MEDIUM | AI candidate |
| FEH-704 | Geographic service area matching | MEDIUM | Automation |
| FEH-705 | Vendor mobile job acceptance | HIGH | MOB-* |

### Phase 8 — Accounting & Financial Operations

| ID | Enhancement | Priority | Notes |
|----|-------------|----------|-------|
| FEH-801 | Rent ledger and charge posting | HIGH | ADR-010 defer — architecture prepared |
| FEH-802 | Owner distribution statements | HIGH | Owner plane |
| FEH-803 | Trust accounting guardrails | HIGH | Compliance-sensitive |
| FEH-804 | QuickBooks / Xero sync | MEDIUM | INT-* |
| FEH-805 | Late fee automation | MEDIUM | AUT-* |
| FEH-806 | Expense categorization (AI-assisted) | MEDIUM | AI-* |

### Phase 9 — Owner Portal

| ID | Enhancement | Priority | Notes |
|----|-------------|----------|-------|
| FEH-901 | Owner dashboard and property performance | HIGH | Four-plane auth |
| FEH-902 | Owner approval workflows (major repairs, capex) | HIGH | Human-in-loop |
| FEH-903 | Owner document vault | MEDIUM | |
| FEH-904 | Owner messaging with PM | MEDIUM | Distinct from MHF-001 resident comms |

### Phase 10 — Resident Portal

| ID | Enhancement | Priority | Notes |
|----|-------------|----------|-------|
| FEH-1001 | Resident self-service portal | CRITICAL | Enables MHF-001 |
| FEH-1002 | Maintenance request submission | HIGH | Tenant plane |
| FEH-1003 | Rent payment visibility | HIGH | Payment INT-* |
| FEH-1004 | Lease and document access | MEDIUM | |
| FEH-1005 | Community bulletin board | CRITICAL | MHF-001 |
| FEH-1006 | QR enrollment flows | CRITICAL | MHF-001, CA-003 |

### Phase 11 — AI Operations Center

| ID | Enhancement | Priority | Notes |
|----|-------------|----------|-------|
| FEH-1101 | AI Operations Center shell | HIGH | CA-001 |
| FEH-1102 | Natural language portfolio search | HIGH | AI-007 |
| FEH-1103 | Anomaly detection (vacancy, delinquency) | HIGH | AI-* |
| FEH-1104 | AI-powered recommendations | HIGH | CA-008 |
| FEH-1105 | Draft communications and notices | MEDIUM | MHF-004 compliant |
| FEH-1106 | Portfolio intelligence summaries | MEDIUM | CA-011 |

### Phase 12 — Launch Hardening

| ID | Enhancement | Priority | Notes |
|----|-------------|----------|-------|
| FEH-1201 | Performance and load validation | HIGH | 15 |
| FEH-1202 | Security audit and penetration remediation | HIGH | 14 |
| FEH-1203 | Onboarding and migration tooling | MEDIUM | |
| FEH-1204 | Observability and SLO dashboards | MEDIUM | |

---

## Cross-Cutting Enhancements

### Workflow & UX

| ID | Enhancement | Priority | Source |
|----|-------------|----------|--------|
| FEH-W01 | Global command palette / quick actions | MEDIUM | 07, 21 |
| FEH-W02 | Workflow Rail on all multi-stage processes | HIGH | 06, 07 |
| FEH-W03 | Bulk operations with confirmation | MEDIUM | MHF-002 |
| FEH-W04 | Saved filters and PM workspace presets | LOW | MHF-002 |
| FEH-W05 | Custom fields per organization | DEFERRED | Phase 4 extension points |

### Data & Reporting

| ID | Enhancement | Priority | Source |
|----|-------------|----------|--------|
| FEH-D01 | Export to CSV/PDF for all primary lists | MEDIUM | PM operations |
| FEH-D02 | Scheduled owner/PM reports | MEDIUM | 05 |
| FEH-D03 | Portfolio comparison analytics | LOW | CA-011 future |
| FEH-D04 | Custom report builder | DEFERRED | Post-launch |

### Platform & Developer Experience

| ID | Enhancement | Priority | Source |
|----|-------------|----------|--------|
| FEH-P01 | Public REST/GraphQL API for integrations | HIGH | MHF-005 |
| FEH-P02 | Webhook delivery for domain events | HIGH | ADR-005, 20 |
| FEH-P03 | Plugin SDK and marketplace | DEFERRED | MHF-005 plugin-ready |
| FEH-P04 | White-label / custom branding per org | LOW | Enterprise |

### Compliance & Trust

| ID | Enhancement | Priority | Source |
|----|-------------|----------|--------|
| FEH-C01 | Fair housing compliance helpers | MEDIUM | 04 |
| FEH-C02 | GDPR/CCPA data export and deletion | MEDIUM | 14 |
| FEH-C03 | SOC 2 readiness controls | DEFERRED | Enterprise sales |

---

## Explicitly Out of Scope (Current Vision)

These are **not** FEH items unless vision changes via ADR:

| Item | Rationale |
|------|-----------|
| Generic chatbot-first AI product | ADR-006 rejects |
| Full in-house accounting engine day one | ADR-010 defer |
| Consumer Zillow-style listing site | Build vs integrate (02, 20) |
| Hardware IoT platform ownership | Integrate at boundary |

---

## Deferral Rules

1. FEH items may be **deferred** by roadmap phase — they remain in the registry.
2. Removing an FEH requires ADR or explicit registry amendment with approval.
3. Implementing an FEH without gate approval violates MHF-006.

---

## Related Documents

- [Must-Have Features](./must-have-features.md)
- [Integration Roadmap](./integration-roadmap.md)
- [Automation Roadmap](./automation-roadmap.md)
- [Development Roadmap](../17-development-roadmap/index.md)
