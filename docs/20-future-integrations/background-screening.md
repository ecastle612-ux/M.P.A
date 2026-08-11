# Background Screening — Future Integration

**Status:** Deferred (STAB-008 — Sprint 5)  
**Date:** 2026-08-11

## Current production honesty

M.P.A. leasing supports a **manual** screening status (`screening_pending`). Operators mark screening pending; there is no automated provider integration.

Customer-facing copy must remain:

- “Screening pending (manual)”
- “Mark screening pending”

Do **not** advertise screening as automated or live until a real provider integration is designed, documented, approved, and implemented under the Implementation Gate.

## Future integration (not this sprint)

When authorized:

1. Choose provider (vendor TBD).
2. Design webhook + consent + data retention.
3. Map provider results into application lifecycle events.
4. Keep offline/manual path as fallback.
