# AI Roadmap (AI)

## Status

**Permanent — AI capability requirements**

AI in M.P.A. is **embedded, workflow-native, and human-supervised** — never a chatbot-first product (ADR-006, MHF-004).

Source: [13 AI Strategy](../13-ai-strategy/index.md), [02 Product Philosophy](../02-product-philosophy/index.md)

---

## AI Philosophy (Binding)

| Rule | Requirement |
|------|-------------|
| AI assists | Surfaces inside existing workflow screens |
| Never overwhelms | Suggestions dismissible; no modal AI takeover |
| Never replaces human decisions | High-stakes actions require explicit approval |
| Always saves time | Draft, prioritize, detect, summarize — reduce steps |

### Risk tiers (implementation requirement)

| Tier | Examples | AI may |
|------|----------|--------|
| **Low** | Categorization, reminders, search | Auto-execute with audit |
| **Medium** | Vendor suggestion, maintenance triage | Suggest; human confirms |
| **High** | Eviction, lease terms, owner distributions | Draft only |

---

## Capability Map

### Phase 1 — Embedded Assist (Near-term)

| ID | Capability | Workflow | Risk | Phase |
|----|------------|----------|------|-------|
| AI-101 | Smart field completion | Property/unit/tenant setup | Low | 4–5 |
| AI-102 | Duplicate detection | Tenant/property records | Low | 5 |
| AI-103 | Description cleanup | Work order intake | Low | 6 |
| AI-104 | Template suggestions | Announcement compose | Low | 10 |

### Phase 2 — Operational Intelligence (Mid-term)

| ID | Capability | Workflow | Risk | Phase |
|----|------------|----------|------|-------|
| AI-201 | Maintenance triage | WO routing | Medium | 6, 11 |
| AI-202 | Delinquency risk flag | Rent Collection | Medium | 8, 11 |
| AI-203 | Vacancy anomaly detection | Vacancy Fill | Low | 11 |
| AI-204 | Vendor match scoring | Vendor dispatch | Medium | 7, 11 |
| AI-205 | Expense categorization | Accounting | Low | 8, 11 |

### Phase 3 — AI Operations Center (Phase 11)

| ID | Capability | Workflow | Risk | Phase |
|----|------------|----------|------|-------|
| AI-301 | AI Operations Center shell | Cross-workflow | — | 11 |
| AI-302 | Natural language portfolio search | All | Low | 11 |
| AI-303 | Daily operations briefing | Dashboard | Low | 11 |
| AI-304 | Cross-portfolio anomaly dashboard | Portfolio mgmt | Low | 11 |
| AI-305 | Recommended actions queue | Action Before Analytics | Medium | 11 |

**Competitive anchor:** [CA-001 AI Operations Center](./competitive-advantages.md#ca-001-ai-operations-center)

### Phase 4 — Portfolio Intelligence (Future)

| ID | Capability | Workflow | Risk | Phase |
|----|------------|----------|------|-------|
| AI-401 | Portfolio performance narrative | Owner reporting | Low | 11+ |
| AI-402 | Predictive maintenance signals | Preventive maint | Medium | 11+ |
| AI-403 | Rent optimization suggestions | Vacancy/pricing | High | Post-launch |
| AI-404 | Acquisition due diligence summary | Portfolio expansion | High | Post-launch |

**Competitive anchor:** [CA-011 Future AI Portfolio Intelligence](./competitive-advantages.md#ca-011-future-ai-portfolio-intelligence)

---

## AI-Powered Recommendations (CA-008)

| ID | Recommendation type | Context | Human gate |
|----|---------------------|---------|------------|
| AI-501 | Next best action | Dashboard queue | PM accepts/dismisses |
| AI-502 | Vendor for work order | Maintenance | PM confirms assign |
| AI-503 | Lease renewal terms draft | Lease Renewal | PM edits before send |
| AI-504 | Announcement tone/format | Communication | PM publishes |
| AI-505 | Collection sequence | Delinquency | PM approves sequence |

Recommendations appear as **action cards** — not conversational threads.

---

## Technical Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| AI-T01 | Org-scoped retrieval — no cross-tenant data in prompts | MHF-005 |
| AI-T02 | PII minimization in LLM calls | 14 Security |
| AI-T03 | Prompt/response audit log for high-risk tiers | MHF-004 |
| AI-T04 | Graceful fallback when AI unavailable | Reliability |
| AI-T05 | User-visible "AI suggested" labeling | Trust |
| AI-T06 | Edge function orchestration for AI mutations | ADR-007 |

Integration: INT-801 (LLM), INT-802 (OCR), INT-803 (embeddings)

---

## Explicitly Rejected Patterns

| Pattern | ADR / MHF |
|---------|-----------|
| Chatbot as primary navigation | ADR-006 |
| Autonomous lease/eviction decisions | MHF-004 |
| AI-generated UI without Canopy compliance | MHF-010 |
| Black-box scoring without PM explanation | MHF-004 |

---

## Rollout Sequence (from 13)

```
1. Inline assist (forms, templates, search)
2. Workflow suggestions (triage, routing, flags)
3. AI Operations Center (portfolio intelligence)
4. Predictive and optimization (human-gated)
```

Each rollout phase requires gate approval.

---

## Related Documents

- [Must-Have Features](./must-have-features.md) — MHF-004
- [Automation Roadmap](./automation-roadmap.md) — AUT-6xx
- [Competitive Advantages](./competitive-advantages.md) — CA-001, CA-008, CA-011
- [13 AI Strategy](../13-ai-strategy/index.md)
- ADR-006
