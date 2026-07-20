# PR-002 — Production Deployment & Domain Activation

**Status:** Design ✔ · Document ✔ · **Approved (EP-007)** · Deployed (alias) · **Domain DNS pending**  
**Initiative ID:** PR-002  
**Authorization:** EP-007 — 2026-07-19  
**Parent:** [PR-001](../67-pr-001-production-readiness/README.md)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md)  
**Live alias:** https://m-p-a-web.vercel.app  
**Canonical host:** https://www.my-property-assistant.com *(attached; DNS not propagating yet)*

---

## Objective

Deploy the existing M.P.A. application to:

**https://www.my-property-assistant.com**

Infrastructure and certification only — no feature, workflow, or UI redesign work.

---

## In scope

- Vercel production deploy
- Domain DNS / SSL / apex → www redirect
- Production environment variables
- Supabase / OneSignal / provider posture verification
- Webhook URL verification
- Production smoke certification of major surfaces
- Scores + launch recommendation

## Out of scope

- Feature development
- Workflow changes
- UI redesign
- Live paid GA provider cutover (unless credentials already provisioned)

---

## Documents

| Doc | Purpose |
| --- | --- |
| [00-executive-summary.md](./00-executive-summary.md) | Scores + recommendation |
| [01-deployment-runbook.md](./01-deployment-runbook.md) | Operator steps (Vercel + Cloudflare) |
| [02-environment-matrix.md](./02-environment-matrix.md) | Required prod vars |
| [03-certification-report.md](./03-certification-report.md) | Live verification results |

---

## Approval

| Field | Value |
| --- | --- |
| Gate owner | EP-007 mission authorization |
| Approved | 2026-07-19 |
| Implement | Unlocked for deployment / infrastructure only |
