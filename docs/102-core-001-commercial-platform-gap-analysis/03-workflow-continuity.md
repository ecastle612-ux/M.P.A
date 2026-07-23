# 03 — Workflow Continuity

**Package:** CORE-001  
**Canonical daily path:** Property → Resident → Lease → Rent → Maintenance → Vendor → Owner → Reporting

---

## Continuity map

| Step | Next | Status | Dead-end? | Notes |
|------|------|--------|-----------|-------|
| Property | Resident | **Continuous** | No | Create unit → tenant / move-in |
| Resident | Lease | **Continuous** | No | Lease create from resident/unit context |
| Lease | Rent | **Partial** | Soft | Charges/payments exist; **live Stripe cert open** |
| Rent | Maintenance | **Continuous** | No | Ops Center / WO create independent of rent |
| Maintenance | Vendor | **Continuous** | No | Assign + **VENDOR-001 QR Start/Finish PASS** |
| Vendor | Owner | **Broken / Partial** | **Yes** | Finish → Awaiting Approval works; **no pay vendor**; owner notified via comms only; **no Connect payout** |
| Owner | Reporting | **Partial** | Soft | PM reports/statements work; **Owner Portal gated** |
| Reporting | (loop) | **Continuous** | No | PM download/vault works |

---

## Certified continuous path (existing)

DPX-002 **PASS** certifies:

Ops Center → Property → Resident → Lease → Payment → Maintenance → Assign Vendor → Message Resident → Notify Owner → Dashboard

That is the **PM-operated** loop. It does **not** certify:

- Live unsupervised rent  
- Vendor payment  
- Owner self-serve  
- Owner bank payout  

---

## Launch continuity definition of done

A paying PM can complete without leaving M.P.A. for a parallel system of record:

1. Create property/unit  
2. Move in resident + lease  
3. Collect **live** rent (or record payment honestly)  
4. Open maintenance → vendor QR → start/finish  
5. **Pay vendor** or mark paid with audit (P1)  
6. Allocate net to **owner** (P0) and show statement/history  
7. Generate owner/PM report  

Until 3, 5 (recommended), and 6 close, the chain has commercial dead ends.
