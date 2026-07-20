# Screenshots & Visual Evidence

## Captured in LC-001 browser session

| Surface | Evidence |
| --- | --- |
| Portal loading skeleton | Browser capture — “Loading your portal…” skeleton (confidence loading UX) |
| Unauthorized | Browser snapshot — “You don’t have access…”, What happened / How to fix, Contact support |
| Not found (404) | Browser snapshot — “We can’t find that page”, recovery CTAs |

Screenshot PNG export timed out once in the IDE browser tool; page structure was verified via accessibility snapshot (same content as intended screenshots).

## Not captured (blocked by credentials / auth)

| Surface | Why missing |
| --- | --- |
| Stripe Checkout / receipt | No Stripe sandbox key |
| OneSignal push OS prompt / delivery | REST key 403 |
| Dropbox Sign signing UI | No API key |
| Checkr consent portal | No API key |
| Email inbox arrivals | No mailer |
| Authenticated Ops Center @ 100 units | Requires selecting M.P.A. Development org in-session + full page LCP probe |

## Operator follow-up

After sandbox keys are loaded, capture:

1. Stripe test payment success + webhook ledger row  
2. OneSignal delivered notification  
3. Dropbox Sign completed envelope in vault  
4. Checkr clear / consider / reject paths  
5. Invite email in a real inbox  
6. Ops Center / tenants / migration with LC-001 org active  
