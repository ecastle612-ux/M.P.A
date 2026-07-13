# Experience Principles — Permanent

**Status:** Draft for approval  
**Authority:** These principles do not expire with roadmap phases. Features that violate them do not ship.

---

## Core Belief

Experience is a product feature. Visual polish without emotional clarity is decoration.

---

## The Principles

### 1. Never make users feel lost
Every screen answers: *Where am I? Why am I here? What can I do?*  
Orientation is continuous — not a one-time onboarding tour.

### 2. Always explain what happens next
After every meaningful action, state the next step and who owns it.  
Uncertainty is a design failure.

### 3. Urgency must be obvious — anxiety must not
Critical items are unmistakable. Presentation stays calm: clear labels, ordered queues, no flashing alarms for routine work.  
Panic UI is forbidden.

### 4. Progress must always be visible
Workflows show stage, percent complete, or remaining steps.  
Waiting without progress feedback is forbidden.

### 5. Success should feel rewarding — not celebratory spam
Completion earns a quiet, clear confirmation and a natural next action.  
No confetti for paying rent. No modal parties for saving a form.

### 6. Errors should teach instead of blame
Errors name the problem in human language, explain impact, and offer recovery.  
Never lead with error codes. Never imply the user is incompetent.

### 7. Every workflow should reduce mental effort
Prefer defaults, remembered context, and attached history over memory tests.  
If the user must hold five facts in their head to act, the design failed.

### 8. Attention is sacred
Do not invent notifications, badges, or banners that do not change decisions.  
Noise destroys trust.

### 9. Proactive answers beat reactive tickets
Especially for tenants and owners: surface status before they ask.  
Silence from the system creates phone calls.

### 10. One job per moment
Each view has a primary purpose. Secondary depth is available on demand.  
Competing primaries create overwhelm.

### 11. Context stays with the task
People, property, lease, money, and history travel with the work item.  
Forcing navigation to “remember” context is forbidden.

### 12. Trust is earned through honesty
AI is labeled. Estimates are estimates. Delays are disclosed.  
Hidden automation that surprises users is forbidden.

### 13. Respect time differently per role
PM time is scarce and dense. Tenant time is interrupted and mobile. Owner time is occasional and executive. Vendor time is field-fragmented.  
Pace and density must match the role’s day.

### 14. Completion closes the loop emotionally
When work is done, the user should feel *caught up* — queue clear, status settled, nothing vaguely unfinished.

### 15. The product should feel understandable without training
Labels beat jargon. Structure beats manuals. First actions are obvious.  
If a new PM needs a course to triage maintenance, we failed the zero-learning goal.

### 16. Support should feel present, not hovering
Help is available in context. It does not interrupt flow with tours and tooltips spam.

### 17. Waiting should feel cared for
Loading and pending states explain *what* is happening and *whether* the user must wait.  
Blank spinners without meaning increase stress.

### 18. Cross-role empathy in copy
A PM message to a tenant should feel respectful when the tenant reads it in-app.  
The platform never talks down to any side of the marketplace.

---

## Principle → Emotional Outcome Map

| Principle | Feeling produced |
|-----------|------------------|
| 1–2, 11 | Oriented, confident |
| 3, 8 | Calm urgency |
| 4, 14, 17 | In control while waiting |
| 5, 14 | Accomplished |
| 6, 16 | Safe to recover |
| 7, 10, 15 | Capable without effort |
| 9, 12, 18 | Trusted and respected |

---

## Anti-Principles (Reject)

| Anti-pattern | Why it fails emotionally |
|--------------|--------------------------|
| Dashboard vanity metrics on home | Fake productivity; hides attention |
| “Oops!” / playful blame | Undermines professional trust |
| Urgency everywhere | Anxiety; learned helplessness |
| Feature tours blocking work | Insults competence; delays value |
| Mystery AI changes | Breaks trust permanently |
| Dead ends with no next step | Abandonment feeling |

---

## Evaluation Template (Experience)

Before a feature is approved for implementation:

```
Feature:
Role(s) affected:
Primary emotion we intend:
Stress reduced how?
Uncertainty reduced how?
What happens next (user-visible)?
Does this pass Experience Principles 1–18? (list any risks)
Pass / Fail:
```

---

## Related

- [Emotional Design Guide](./emotional-design-guide.md)
- **07** UX Principles (interaction mechanics)
- **06** Canopy (visual execution of calm confidence)
