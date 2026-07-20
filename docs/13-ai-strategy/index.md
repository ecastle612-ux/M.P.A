# 13 — AI Strategy

## Core Principle

AI in M.P.A. is **not a chatbot**. AI is an **embedded capability layer** that operates throughout the platform — invisible when working, explainable when it matters, always subordinate to human judgment on high-stakes decisions.

---

## AI Design Rules

| Rule | Detail |
|------|--------|
| **Embedded, not isolated** | AI appears inside workflow screens — never as a standalone chat page |
| **Suggest, don't decide** | High-stakes: draft, recommend, flag. Low-stakes: auto-categorize, auto-fill |
| **Source attribution** | Every AI output links to the data that produced it |
| **Feedback loop** | Users can accept, edit, or dismiss — all recorded |
| **Versioned prompts** | Central prompt registry with version numbers |
| **Authorized data only** | RLS-scoped retrieval; no cross-tenant data in prompts |
| **Audit trail** | AI suggestions stored before human action |

---

## AI Capability Map

### 1. Recommendations

**What:** Proactive suggestions based on portfolio patterns.

| Example | Workflow |
|---------|----------|
| "Raise rent 3% on Unit 4B based on market" | Property setup / leasing |
| "This vendor has 40% faster resolution for HVAC" | Maintenance |
| "Owner prefers monthly email, not portal" | Owner reporting |

**Implementation:** Batch analysis via cron Edge Function → `ai_suggestions` records → surfaced in Operations Console.

---

### 2. Vendor Matching

**What:** Rank vendors for a work order by trade, geography, rating, availability, compliance status, and historical performance.

| Input | Output |
|-------|--------|
| Work order details | Ranked vendor list with confidence scores |
| Property location | Geo-filtered candidates |
| Job category | Trade-matched candidates |

**Implementation:** Edge Function `match-vendors` combining SQL filters + AI ranking. Not pure LLM — hybrid rules + model.

**Marketplace connection:** Core marketplace value proposition.

---

### 3. Automation

**What:** Execute repetitive workflow steps without human initiation.

| Automation | Risk Level | Auto-Execute? |
|------------|------------|---------------|
| Rent reminder email | Low | Yes |
| Work order categorization | Low | Yes |
| Late fee calculation | Medium | Yes (with rules) |
| Vendor assignment | Medium | Suggest only |
| Eviction notice | High | Draft only |
| Owner report publish | High | Draft → PM approve |

**Implementation:** Domain event consumers trigger automation rules configured per organization.

---

### 4. Maintenance Prioritization

**What:** Score and rank work orders by urgency, tenant impact, property value, SLA status, and seasonal factors.

| Factor | Weight |
|--------|--------|
| Emergency keywords (flooding, no heat) | Critical |
| Tenant vulnerability | High |
| SLA breach proximity | High |
| Property revenue impact | Medium |
| Routine vs recurring | Low |

**Implementation:** Edge Function on `work_order.created` event. Score stored on work order record. AI explains ranking.

---

### 5. Communication Drafting

**What:** Generate context-aware messages for owners, tenants, and vendors.

| Draft Type | Template Source |
|------------|-----------------|
| Owner monthly summary | Financial + maintenance data |
| Tenant maintenance update | Work order status + timeline |
| Vendor scope clarification | Work order details + property access |
| Late rent reminder | Lease terms + payment history |

**Implementation:** Edge Function `draft-communication` → `ai_suggestions` with `type: 'communication_draft'`. PM reviews before send.

**Financial AI boundary (API-005):** AI may draft reminders, predict delinquency, forecast cash flow, or recommend collection actions. AI must **never** initiate charges, refunds, AutoPay enrollment, or any money movement — see [API-005](../51-api-005-resident-payments-billing/README.md).

---

### 6. Owner Summaries

**What:** Narrative owner reports from structured operational and financial data.

| Section | Data Source |
|---------|-------------|
| Financial overview | `financial_*` tables |
| Occupancy status | `lease_*`, `property_*` |
| Maintenance highlights | `work_order_*` |
| Upcoming events | Lease dates, inspections |
| Recommendations | AI recommendations engine |

**Implementation:** Edge Function `generate-owner-report-draft` triggered by report period event. PM edits → publishes.

---

### 7. Knowledge Base

**What:** Organization-specific operational knowledge retrieval — policies, vendor preferences, property notes, past decisions.

| Source | Storage |
|--------|---------|
| Property notes | `property_properties.notes` + embeddings |
| Uploaded policies | `document_documents` + embeddings |
| Past work order resolutions | `work_order_*` + embeddings |
| Lease templates | `lease_*` + embeddings |

**Implementation:** pgvector similarity search scoped to `organization_id`. Powers natural language search and AI context retrieval.

---

### 8. Risk Detection

**What:** Flag patterns indicating legal, financial, or operational risk.

| Risk Signal | Action |
|-------------|--------|
| Screening inconsistency across applicants | Flag for review |
| Lease clause conflicts with jurisdiction | Warning on lease generation |
| Chronic late payment pattern | Alert PM + suggest action |
| Vendor insurance expiring within 30 days | Block assignment |
| Security deposit handling anomaly | Flag for compliance review |

**Implementation:** Rule engine + AI analysis on domain events. Risks stored as `ai_suggestions` with `type: 'risk_flag'`.

---

### 9. Predictive Maintenance

**What:** Anticipate maintenance needs before failure based on property age, season, history, and asset lifecycle.

| Signal | Prediction |
|--------|------------|
| HVAC last serviced 18 months ago | Schedule inspection |
| Seasonal gutter cleaning due | Create preventive work order |
| Water heater age > 10 years | Flag replacement planning |
| Recurring plumbing at property | Pattern alert |

**Implementation:** Periodic batch analysis. Suggestions appear in Operations Console queue. v2 capability — architecture supports from day one via event + embedding infrastructure.

---

### 10. Natural Language Search

**What:** Search operational data using conversational queries.

| Query | Resolves To |
|-------|-------------|
| "Which properties have overdue maintenance?" | Filtered work order list |
| "Show me Owner Johnson's March report" | Report document |
| "Tenants with late rent this month" | Filtered lease/payment list |
| "Find HVAC vendors near Oak Street" | Marketplace search |

**Implementation:** Command palette (⌘K) entry point → intent classification → SQL query or vector search → navigates to result. Hybrid: structured queries for filters, embeddings for semantic search.

---

## AI Data Model

```sql
ai_suggestions
  id, organization_id, entity_type, entity_id
  suggestion_type     -- 'recommendation' | 'draft' | 'risk_flag' | 'ranking'
  content               JSONB
  sources               JSONB   -- [{ entity_type, entity_id }]
  prompt_version        TEXT
  status                -- 'pending' | 'accepted' | 'edited' | 'dismissed'
  acted_by, acted_at
  created_at

ai_feedback
  id, suggestion_id, user_id
  action                -- 'accept' | 'edit' | 'dismiss'
  edit_diff               JSONB
  created_at

ai_embeddings
  id, organization_id, entity_type, entity_id
  embedding             vector(1536)
  content_hash, created_at

ai_prompt_registry
  id, name, version, template, model, created_at
```

**No `ai_conversations` or `ai_messages` tables.** If conversational UI is added later, it references workflow entities — not free-floating chat.

---

## OpenAI Integration

| Rule | Detail |
|------|--------|
| API calls | Edge Functions only |
| Model selection | Per capability in prompt registry (gpt-4o for drafts, gpt-4o-mini for classification) |
| Token budgets | Per-org monthly limits tracked in `ai_usage_logs` |
| Prompt injection defense | Sanitize user content; system prompts enforce data boundaries |
| PII in prompts | Minimize — use IDs and retrieve only necessary fields |
| Fallback | Graceful degradation — AI unavailable does not block workflows |

---

## AI Rollout Phases

| Phase | Capabilities |
|-------|-------------|
| Foundation | Data model, prompt registry, embedding pipeline, feedback loop |
| v1 | Communication drafting, maintenance prioritization, owner summaries |
| v1.5 | Vendor matching, natural language search, risk detection |
| v2 | Predictive maintenance, advanced recommendations, automation rules engine |

---

## Related Documents

- **02** Product Philosophy — AI philosophy
- **05** Business Workflows — AI touchpoints per workflow
- **09** Database Architecture — AI tables
- **10** API Standards — AI Edge Functions
- **14** Security Standards — prompt injection, data boundaries
