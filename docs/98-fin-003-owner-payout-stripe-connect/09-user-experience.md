# 09 — User Experience

**Package:** FIN-003  
**Status:** ✅ **Approved**  
**Host:** Existing Owner Portal (OWNER-001) + existing PM financial surfaces  
**Rule:** Replace placeholders — **do not redesign IA**.

---

## Owner-facing states

| State | Meaning | Primary CTA |
|-------|---------|-------------|
| **Not connected** | No Owner Express account | Connect payouts |
| **Verification required** | Stripe KYC due | Continue verification |
| **Pending review** | Stripe reviewing | Wait / check status |
| **Eligible** | Can receive transfers | None (or View schedule) |
| **Scheduled** | Future distribution planned | View details |
| **Pending** | Allocation awaiting transfer | View details |
| **In transit** | Transfer submitted | Track status |
| **Paid** | Succeeded (balance and/or bank per copy) | View receipt/history |
| **Failed** | Transfer/payout failed | Fix issues / Contact PM |
| **Returned** | Bank return | Update bank |
| **Action required** | Restricted / disabled / requirements | Resolve in Stripe |
| **Read-only history** | Past payouts list | Download/view if artifact exists |

---

## Owner Portal surfaces

### Dashboard — Pending payout

Replace non-executing placeholder with:

- Net pending amount (authorized properties) **or** clear empty/unavailable  
- Status chip (Scheduled / Pending / Action required)  
- Link to Financials payout history / onboarding  

Honesty rules from OWNER-001 remain: no fake “Paid”.

### Financials — Payouts section

- Onboarding status card (states above)  
- Pending list  
- Completed / history (read-only)  
- Failed / returned with next steps  

### Settings

- Link into onboarding / status  
- Notification prefs for payout events (existing prefs form categories or payout-specific flags if Approve adds)

---

## PM-facing states (summary)

| State | UX |
|-------|----|
| Org settlement not ready | Banner + Connect onboarding |
| Run queued / running / partial / failed | Ops list |
| Owner blocked | Row-level reason |
| Manual retry | Capability-gated button + reason modal |

---

## Empty / loading / error

| Situation | Copy intent |
|-----------|-------------|
| No payouts yet | “Payouts appear after your property manager distributes proceeds.” |
| Not eligible | Specific remediation, not generic error |
| Provider outage | “Payout status temporarily unavailable.” |
| Unauthorized property | Do not show row |

Use existing Canopy / `@mpa/ui` empty/error/skeleton patterns.

---

## Transparency requirements ([18](./18-amendments-approval.md))

- Show net amount and material deductions (fees/reserves) at Approve-defined depth  
- Show period + property  
- Show last updated time for pending  
- Distinguish platform/application fee vs property management fee when both present  

---

## Accessibility & mobile

- Owner Portal mobile bottom nav unchanged  
- Payout modules must work in Financials / More paths on phone  
- CTAs to Stripe onboarding must survive return deep links on mobile browsers  

---

## Explicit non-UX

- No owner-initiated “cash out instant” unless Approve adds Instant payouts  
- No owner editing of split %  
- No Stripe Dashboard embedding beyond Account Link / approved embedded components  
