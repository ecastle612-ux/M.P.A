# Customer Onboarding Verification (P0 Hardening)

## Required finish conditions

Guided Setup cannot complete without:

1. Organization active  
2. Purchased product confirmed (set at create; read-only thereafter)  
3. Billing acknowledgment (inclusions / upgrade cues reviewed)  
4. Home workspace confirmed  
5. Finish → redirect to SKU home

| SKU | Destination |
|-----|-------------|
| Property Manager | `/pm/mission-control` |
| Facility Operations | `/facility/mission-control` |
| Complete Platform | `/launcher` |

## Journey checks

| Check | Result |
|-------|--------|
| Checklist no longer auto-completes Billing/home | Pass |
| Customer cannot self-upgrade mid-setup | Pass |
| Finish CTA enters operating environment | Pass |
| Confusion from editable SKU dropdown after purchase | Removed |
| Unnecessary portal detour for managers | Removed (redirect) |

**Onboarding verdict: Pass.**
