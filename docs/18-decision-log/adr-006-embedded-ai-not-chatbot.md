# ADR-006: Embedded AI Strategy (Not Chatbot-First)

## Status
Accepted

## Date
2026-07-11

## Context
The initial architecture included an `ai` schema oriented toward conversations/logs, implying a chatbot. Product philosophy explicitly rejects AI as a chatbot. AI must be embedded across workflows as recommendations, drafts, prioritization, matching, and search.

## Decision
AI data model centers on `ai_suggestions`, `ai_feedback`, `ai_embeddings`, and `ai_prompt_registry` — all linked to workflow entities. No `ai_conversations` table. AI capabilities are surfaced inline within workflow screens.

## Consequences
**Easier:** AI adds value without requiring users to learn a new interface. Feedback loops improve specific capabilities.

**More difficult:** Each AI capability requires custom UI integration (AIInsightPanel, etc.) rather than one chat interface.

## Alternatives Considered
- **Chatbot-first with tool use:** Rejected — violates product philosophy, poor UX for professional users.
- **No AI data model until needed:** Rejected — retrofitting is expensive; infrastructure needed from foundation.
