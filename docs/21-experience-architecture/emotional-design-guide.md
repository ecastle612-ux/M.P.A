# Emotional Design Guide

**Status:** Draft for approval  
**Purpose:** Define how M.P.A. creates confidence, reduces stress, handles urgency, and shapes success, failure, and waiting — independent of visual tokens.

---

## Emotional Model

M.P.A. targets a steady emotional band:

```
Panic ── Anxiety ── Tension ── Calm focus ── Confidence ── Complacency
                         ▲
                    Stay here
```

We design for **calm focus** and **confidence**. We never design for panic or complacency.

---

## How Confidence Is Created

| Mechanism | Experience |
|-----------|------------|
| Immediate orientation | User lands knowing what the screen is for |
| Ordered attention | Most important item is first and labeled |
| Complete context | Property, people, money, history present when acting |
| Predictable outcomes | Same action → same kind of result |
| Transparent AI | Suggestions labeled; sources visible; human confirms high stakes |
| Honest status | “Waiting on vendor insurance” beats “In progress” vagueness |

**Confidence anti-patterns:** Hidden required fields until submit; silent background changes; ambiguous “Success” with no next step.

---

## How Stress Is Reduced

| Stress source | M.P.A. response |
|---------------|-----------------|
| “What am I missing?” | Attention queue / proactive status |
| “Where was I?” | Resume context; deep links; sticky work plane |
| “Who owns this?” | Named owner + next actor on every item |
| “Did it work?” | Immediate, specific confirmation |
| “Will this blow up?” | Clear urgency bands without alarm theater |
| Tool fragmentation | One thread of truth on the entity |

**Stress test:** After a session, the user should feel *more* caught up than when they opened the app. If they feel further behind, the experience failed.

---

## How Urgency Communicates Without Anxiety

| Do | Don’t |
|----|-------|
| Rank and label (Critical / High / Normal) | Red everything |
| Put P0 at the top with a plain reason | Flash, shake, or sound spam |
| Time language (“Due today”, “Overdue 3 days”) | Vague “Needs attention!!!” |
| Separate safety/legal from routine admin | Treat all badges as equal |
| Allow focus mode / quiet non-critical | Force constant interruption |

**Voice of urgency:** Specific and adult.  
Example: “Lease at 414 Oak ends in 14 days — renewal not started.”  
Not: “Warning! Action required!”

---

## How Success Should Feel

| Moment | Feeling | Design response |
|--------|---------|-----------------|
| Cleared queue item | Relief + momentum | Item leaves queue; subtle confirm; next item autofocuses |
| Rent paid | Security | Clear receipt; balance updates; no celebration gimmicks |
| Lease signed | Milestone | Confirm parties + next move-in steps |
| Job completed (vendor) | Competence + reward | Path to invoice/payment status |
| Report published | Professional pride | “Published to owner” + link |

**Reward model:** Clarity and forward motion — not gamification points (unless a future ADR explicitly introduces them for vendors).

---

## How Failure Should Feel

Failure is inevitable (payments fail, vendors cancel, uploads reject). Emotionally:

| Goal | Tactic |
|------|--------|
| Safety | “You’re okay — here’s the issue” |
| Agency | One primary recovery action |
| Dignity | No sarcasm, no childish copy |
| Learning | Brief reason in operational language |
| Continuity | Preserve user input whenever possible |

Example:

- ❌ “Error 422: Validation failed”
- ✅ “We couldn’t assign this vendor — liability insurance expired Mar 12. Update compliance or choose another vendor.”

---

## How Waiting Should Feel

Waiting states: loading, pending approval, background jobs, third-party screening.

| Wait type | Feeling target | Pattern |
|-----------|----------------|---------|
| Short (&lt;1s) | Uninterrupted | Skeleton of the real layout |
| Medium (1–10s) | Informed patience | Progress copy: “Checking payment…” |
| Long (minutes–days) | Trust in the system | Stage + ETA or “No action needed from you” |
| Blocked on someone else | Clarity, not helplessness | Who + what they’re doing + nudge option |

**Never:** Indeterminate spinner on a blank void with no explanation.

---

## How Completion Is Rewarded

Completion rituals (emotional, not visual gimmicks):

1. **Acknowledge** — what completed, in one line  
2. **Settle state** — balances, statuses, queues update immediately  
3. **Offer next** — only if natural (“Send move-in checklist?”)  
4. **Release** — return user to a calmer surface (queue, home)

Skipping step 2 creates lingering doubt (“Did rent actually post?”).

---

## Emotional Guardrails for AI

| AI behavior | Emotional effect if wrong |
|-------------|---------------------------|
| Unlabeled automation | Unease, loss of control |
| Overconfident wrong draft | Distrust of entire product |
| Nagging suggestions | Stress and dismissal |
| Correct, sourced, dismissible help | Support — “someone’s got my back” |

AI should feel like a sharp junior analyst: helpful, checked by the user on high stakes.

---

## Copy Tone by Emotion

| Intent | Tone |
|--------|------|
| Orient | Plain, short |
| Urge | Specific, calm, time-bound |
| Succeed | Matter-of-fact appreciation |
| Fail | Empathic precision |
| Wait | Transparent, patient |

Avoid: hype, shame, fake friendship (“Hey buddy!”), corporate fog.

---

## Related

- [Experience Principles](./experience-principles.md)
- [Micro Interaction Philosophy](./micro-interaction-philosophy.md)
- [Role Journeys](./role-journeys.md)
