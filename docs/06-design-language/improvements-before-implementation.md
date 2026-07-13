# Improvements Before Implementation

**Status:** Required before any UI component code  
**Phase:** 1.5 Design Language & Visual Identity

The Canopy documentation is strong enough to review. The following items must be resolved (approve, revise, or explicitly defer) before building primitives in `packages/ui`.

---

## P0 — Blockers

### 1. Approve Canopy brand decisions
**Decision needed:** Satoshi + IBM Plex + Canopy Green `#0F6B56` + Ink `#12151A` + Mist canvas.  
**Risk if skipped:** Engineers invent fonts/colors; identity fragments.  
**Action:** Stakeholder sign-off on [Design Token System](./design-token-system.md).

### 2. Font licensing & loading strategy
**Decision needed:** Self-host Satoshi (Fontshare) + IBM Plex (Google Fonts or self-host).  
**Risk if skipped:** FOUT, legal ambiguity, CDN surprises.  
**Action:** Confirm commercial license path; document in ADR when scaffolding begins.

### 3. Light-only v1 vs dark mode day one
**Recommendation:** Ship **light product theme** first; keep dark tokens defined.  
**Risk if wrong:** Either wasted dark-mode polish or expensive retrofit.  
**Action:** Explicit approve of light-first.

### 4. Operations Console priority rules
**Decision needed:** Confirm P0–P3 definitions and default sort in [Operations Console](./operations-console.md).  
**Risk if skipped:** “Urgent” becomes decorative; trust erodes.  
**Action:** Product + architect approve priority matrix (even if thresholds tune later).

### 5. Logo & wordmark
**Gap:** Visual identity is recognizable without a logo, but a wordmark is still needed for auth/marketing.  
**Action:** Commission or draft simple wordmark using Satoshi; do not block token approval on a full brand book.

---

## P1 — High Impact (Resolve During Foundation UI Sprint)

### 6. Static reference frames
Produce 4–6 non-code reference frames (Figma or similar):

1. PM Operations Console (populated)
2. PM drawer (assign vendor)
3. Tenant Home (mobile)
4. Owner Report
5. Vendor Job Inbox (mobile)
6. Command Palette

**Why:** Documentation without frames still allows drift.

### 7. Data visualization ruleset expansion
Define chart types allowed (line, bar, sparse area) and forbidden (3D, stacked rainbow, gauges on home).  
**Owner reports** need one exemplar composition.

### 8. Notification IA
Lock: toast vs bell vs email for each event class (payment failed, new bid, lease expiring).  
Aligns with future notification framework — design must not invent three competing patterns.

### 9. Icon exceptions list
Document any custom icons beyond Lucide (e.g., “work order”, “unit”) before designers invent ad hoc SVGs.

### 10. Tablet PM behavior
Choose: stacked console (queue above detail) vs navigate-to-detail. Document in Ops Console once chosen.

---

## P2 — Medium Impact (Early Production)

### 11. Motion QA checklist
Add to PR template: “Respects reduced motion; uses motion tokens only.”

### 12. Empty-state copy bank
Centralize empty/error strings for foundation surfaces to keep voice consistent.

### 13. Theming for white-label (defer)
Some PM companies may want brand tint later. **Do not** build white-label now; reserve CSS variable architecture so a future `brand.primary` override is possible without rewrite.

### 14. Illustration pack (marketing only)
If marketing needs visuals, commission a tiny Canopy-aligned line set — keep out of product chrome.

---

## Explicitly Rejected

| Idea | Why |
|------|-----|
| Per-role color schemes (blue tenant, orange vendor…) | Destroys Canopy recognition |
| Glassmorphism / neon AI glow | Trendy, not timeless; reduces trust |
| Dashboard widgets as PM home | Violates Operations Console philosophy |
| Inter / system font fallback as primary | Fails recognizability test |
| Pill CTAs and card-soup layouts | Generic SaaS |
| Building components before token approval | Guarantees rework |

---

## The M.P.A. Test — Pre-Approval Answers

| Question | Current assessment |
|----------|--------------------|
| Recognizable without logo? | **Yes**, if console + ink + canopy + Satoshi ship together |
| Premium? | **Yes**, if borders-over-cards and type discipline hold |
| Reduces stress? | **Yes**, attention-first console + calm status language |
| Reduces clicks? | **Yes**, master-detail + ⌘K + contextual actions |
| Daily enjoyment? | **Conditional** on performance + empty/error quality |
| Still generic? | **Risk areas:** tables and forms if implemented with default shadcn skin without token remaps |
| More memorable? | Ship Workflow Rail + AI chips early; never let home become charts |

---

## Approval Checklist

Before UI implementation:

- [ ] Token HEX and type stack approved
- [ ] Component philosophy approved
- [ ] Operations Console philosophy approved
- [ ] Role experience philosophy approved
- [ ] Visual identity guide approved
- [ ] P0 items 1–5 resolved
- [ ] Reference frames scheduled (P1 #6) before broad component build-out

**Gate owner:** Lead Software Architect / UX Architect  
**Next step after approval:** Implement tokens + primitives in `packages/ui` only — still no business features.

---

## Related Documents

- [Design Language Index](./index.md)
- [Design Token System](./design-token-system.md)
- **08** Architecture Improvements (engineering gate)
- **17** Development Roadmap — Foundation phase
