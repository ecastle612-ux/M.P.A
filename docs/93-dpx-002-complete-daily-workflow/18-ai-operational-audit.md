# 18 — AI Operational-Value Audit (Phase 4)

**Package:** DPX-002  
**Amendment:** D  
**Rule:** Judge AI by **effort reduced**, not chat quality. Only introduce where it meaningfully helps.

---

| Step | Proactive? | Summarize? | Recommend? | Automate? | Stay available? | Operational value today | Gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Yes | Today’s attention | What first | No | Yes | Suggestions exist (`summarize_today_activity`) | Launcher sometimes “loading”; ensure “What first today?” |
| Find property | No | No | Search assist | No | Optional | Search M.P.A. better than AI | Don’t force AI |
| Property | Yes | Outstanding issues / vacancy | Next ops action | No | Yes | Suggestions in store | **Page crash blocks**; vacancy recs weak |
| Resident | Yes | Account / lease / balance | Message / collect | Draft message | Yes | Summarize suggestion in store | **Page blocked**; missing draft/payment explain chips |
| Lease | Light | Status plain language | Renewal | No | Yes | Generic | After unblock |
| Payment | Light | Explain balance | Reminder | No | Yes | Financial prompts exist | Wire from resident context |
| Create WO | Light | Categorize | Suggest fields | No | Yes | Low until form audit | Optional |
| Assign vendor | Yes | WO summary | Suggest vendor | Draft vendor msg | Yes | Store has suggest vendor / draft | **Page crash** |
| Message | Yes | Tone | Draft | Prefill | Yes | Draft prompts exist | Must open with resident context |
| Notify owner | Yes | Status digest | Draft owner note | Prefill announcement | Yes | Weak on path | Add when owner notify surfaces |
| Return dashboard | No | No | No | No | Yes | — | — |

## AI do / don’t

| Do | Don’t |
| --- | --- |
| Unblock detail bridges so context is real | Add a separate “AI workflow” screen |
| Prefer deep links from suggestions | Increase taps vs toolbelt |
| Draft messages that open compose | Require chatting to find Assign Vendor |

## Verdict

AI is **architecturally present** but **operationally blocked** on the gold-standard path by detail-page crashes. After P0, raise resident/WO suggestion chips to Amendment D examples (summarize account, draft message, explain payment, next step, draft vendor message).
