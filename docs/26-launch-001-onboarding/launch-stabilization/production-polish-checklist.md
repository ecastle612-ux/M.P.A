# 6. Production Polish Checklist

**Parent:** [Launch Stabilization](./index.md)  
**Use:** Operator + engineering dry run before Customer #1  

---

## Product chrome

- [x] App title/metadata professional (not “Foundation”)  
- [x] Portal subtitles customer-ready  
- [x] Skip-to-content on app / portal / Master Admin  
- [x] Master Admin usable on narrow viewports  
- [x] Unauthorized page offers workspace recovery  
- [x] Notification unread count loads without opening panel  
- [x] Team reachable from primary nav  
- [x] Owner documents honesty matches Documents product  

## Accessibility

- [x] Skip link  
- [x] Table headers `scope="col"` on FO/admin primary tables  
- [x] Menu items expose `role="menuitem"` on profile/notification actions  
- [ ] Full keyboard trap on shell popovers (P2)  
- [ ] Dedicated a11y regression suite (P3)  

## Mobile

- [x] App shell ResponsiveNavigation (pre-existing)  
- [x] Master Admin Menu  
- [x] Notification panel width clamps to viewport  
- [ ] Global search on small screens (P2)  
- [ ] FO tables card/stack alternative (P3)  

## Workflows (staging)

- [ ] MA Pass J0–J8 + Docs + Comms recorded (DEF-003)  
- [ ] Resident portal login after lease activation  
- [ ] Vendor portal login after assign  
- [ ] Owner portfolio + property drill-down  
- [ ] FO collect rent + receipt  
- [ ] Maintenance request → assign → complete → confirm  

## Config honesty

- [ ] `SUPABASE_SERVICE_ROLE_KEY` present in prod/staging  
- [ ] Resend / Auth SMTP if email invites claimed  
- [ ] SignWell if e-sign claimed  
- [ ] Stripe if resident Pay Now claimed  

## Feature freeze confirmation

- [x] No Facility Ops implementation  
- [x] No CORE-004  
- [x] No FIN-OPS expansion  
- [x] No new customer journeys  

---

## Sign-off

| Field | Value |
|-------|-------|
| Operator | |
| Environment | |
| Date | |
| Ready for Customer #1 dry run? | ☐ Yes ☐ No |
