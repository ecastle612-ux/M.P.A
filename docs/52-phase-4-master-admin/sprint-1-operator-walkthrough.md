# Operator walkthrough notes — Sprint 1 LIVE

**Deploy:** `dpl_FAZRretb6TLtMZd48WRHXFTdbj9o` · SHA `c2c45f9`

## For Owner (operator session)

1. Sign in as Platform Operator (`platform_operators` active **or** `app_metadata.platform_operator`).
2. Open https://www.my-property-assistant.com/admin
3. Confirm within seconds:
   - Needs attention (if any alerts)
   - Organizations KPIs
   - Commercial KPIs including MRR/ARR
   - Users rollup
   - System health badges
   - Activity columns
   - Operator directories links
4. Spot-check mobile width.
5. Confirm customer `/pricing` and `/demo` still look correct (agent regression already PASS).

## Agent limitation

Cloud agent could not complete authenticated Command Center screenshots — no operator password in environment. Auth redirect to `/login` verified LIVE.
