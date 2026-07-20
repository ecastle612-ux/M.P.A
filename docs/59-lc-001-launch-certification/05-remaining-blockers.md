# Remaining Blockers (ranked)

## P0 — Open (blocks GO)

1. **Stripe sandbox not configured** — no `STRIPE_SECRET_KEY`; payments cannot be certified  
2. **OneSignal REST API key invalid (403)** — push cannot be certified  
3. **Dropbox Sign sandbox not configured** — e-sign cannot be certified  
4. **Checkr sandbox not configured** — screening cannot be certified  
5. **Outbound email not implemented/configured** — invitations do not arrive in inboxes  

## P1 — Partial / follow-up

6. Interactive Auth flows (signup/login/logout/reset/invite accept/role switch) need scripted Playwright proof on seeded QA users  
7. Full browser LCP for Ops/Migration/Command Center against LC-001 org  
8. Media variant pipeline (HEIC→variants) not re-probed in LC-001 beyond PDF upload/sign/delete  

## P2

9. Resend / Twilio productization (only if email/SMS are in-scope for launch)  
10. PNG screenshot archive automation for certification binder  
