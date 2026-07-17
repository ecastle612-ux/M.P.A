# Phase 11 — AI Operations Center Foundation

**Status:** Approved · Implemented  
**Registry:** FEH-1101–1106, AI-301–305, CA-001, CA-008, CA-011, MHF-004, MHF-005, PMX-002, PMX-003  
**Gate:** Design → Document → Approve → Implement (complete)

## Scope

AI-assisted Operations Center for property managers:

- AI Operations page (`/ai-operations`) with sidebar, assistant, activity feed, insight and recommendation cards
- Relational AI service layer (no embeddings, vector DB, or RAG)
- Built-in prompt library and custom operational questions
- Conversation history and AI activity log
- Operations Center AI widget (daily summary, recommended actions, risks, insights, recent activity)
- Command Center registration (Ask AI, suggested prompts, recent conversations)
- Capabilities: `ai:read`, `ai:use`

## Out of scope (deferred)

- Autonomous AI decisions (lease signing, maintenance approval, financial approval)
- Payment processing, bank integrations, marketplace
- LLM provider integration (architecture is provider-ready; ships relational assistant)
- Embeddings, vector database, RAG

## Product requirement IDs

| ID | Requirement |
|----|-------------|
| **FEH-1101** | AI Operations Center shell |
| **FEH-1102** | Natural language portfolio search |
| **FEH-1103** | Anomaly detection (vacancy, delinquency, overdue work) |
| **FEH-1104** | AI-powered recommendations |
| **FEH-1105** | Draft communications and notices (PM review required) |
| **FEH-1106** | Portfolio intelligence summaries |
| **AI-301** | AI Operations Center shell |
| **AI-302** | Natural language portfolio search |
| **AI-303** | Daily operations briefing |
| **AI-304** | Cross-portfolio anomaly dashboard |
| **AI-305** | Recommended actions queue |
| **CA-001, CA-008, CA-011** | Competitive advantages — AI assists, humans decide |
| **MHF-004** | AI assists; PM always in control |
| **MHF-005** | Enterprise RLS on AI tables |
| **PMX-002, PMX-003** | Operations Center + Command Center integration |

## Database

- `ai_conversations`
- `ai_messages`
- `ai_insights`
- `ai_activity`

Capabilities: `ai:read`, `ai:use`

Migration: `supabase/migrations/20260715120000_phase11_ai_operations_foundation.sql`

## Architecture

```
UI (AI Operations, Ops widget, Command Center)
  → API routes (/api/ai/*)
    → server.ts (conversation history, insights, activity)
      → context.ts (buildPortfolioContext from relational data)
      → provider.ts (RelationalAiProvider — template/rule responses)
      → events.ts (assistant-only guards)
```

Separation of concerns:

| Layer | Module |
|-------|--------|
| Prompt construction | `contracts.ts` (PROMPT_LIBRARY) |
| Context retrieval | `context.ts` |
| Response formatting | `provider.ts` |
| Conversation history | `server.ts` |
| Tool execution | `provider-types.ts` (future providers) |

## Workflow

```
PM opens AI Operations or Command Center
  → Selects built-in prompt or asks custom question
  → Context built from existing org data (properties, leases, maintenance, financials, etc.)
  → Relational assistant generates summary/recommendation/draft
  → Messages + insights + activity stored
  → PM reviews, dismisses, or applies recommendations manually
```

**Invariant:** AI never performs irreversible actions without property manager approval.
