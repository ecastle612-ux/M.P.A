# Stripe & Ledger Architecture

**Parent:** [FIN-OPS-001](./index.md)  
**Status:** Draft — awaiting APPROVE FIN-OPS-001  
**Aligns with:** ADR-010, Stripe best practices (Checkout Sessions, Connect)

---

## 1. Separation of money systems

| System | Purpose | Owner |
|--------|---------|-------|
| **Financial Operations** | Resident charges, collections, vendor payables | Property Manager module |
| **SaaS commercial billing** | M.P.A. plan subscription for the org | Shared Platform / Master Admin |
| **Future GL / trust accounting** | Full books | Deferred (ADR-010) |

These must never share charge tables or confuse “pay rent” with “pay M.P.A. invoice.”

---

## 2. Stripe architecture (launch)

### Connect posture

- Platform uses **Stripe Connect** so PM organizations can collect rent and pay vendors.  
- Prefer **Accounts v2 / controller properties** per current Stripe guidance at implementation time.  
- Each PM org has a **connected account** for receiving resident payments (destination/charge model TBD in implementation spike — document choice in FO implementation ADR if needed).  
- Vendors have Connect accounts for payouts (marketplace-aligned).

### Resident payments

| Concern | Decision |
|---------|----------|
| API | **Checkout Sessions** (hosted or embedded Payment Element) for launch |
| Saved methods | Phase 2 via SetupIntent |
| Idempotency | Required on all create calls |
| Webhooks | Source of truth for success/failure |
| `payment_method_types` | Omit — use dynamic payment methods |
| Tax | Not auto-enabled without registration; rent generally not Stripe Tax — keep tax out of launch |

### Vendor payouts

| Concern | Decision |
|---------|----------|
| Trigger | Only after payable `approved` |
| Rail | Connect transfer to vendor account |
| Failure handling | Payable remains `approved`/`scheduled`; ops alert; no false `paid` |

### Webhook principles

- Verify signatures  
- Idempotent handlers keyed by Stripe event id  
- Persist raw event references in `integration_*` / finance webhook table  
- Never trust client-side “payment succeeded”

---

## 3. Ledger architecture

### Principles (ADR-010 day-one)

1. `financial_*` prefix  
2. Append-only ledger entries  
3. `organization_id` on all rows  
4. `numeric` money — never float  
5. Currency ISO code (`USD` launch default)  
6. Reversals create new entries  

### Logical entities (design, not migration yet)

| Entity | Role |
|--------|------|
| `financial_charges` | What is owed (rent, fee, late, one-time) |
| `financial_payments` | Resident (or owner) payment attempts/results |
| `financial_payment_allocations` | Payment → charge links |
| `financial_vendor_invoices` | Vendor payables |
| `financial_vendor_payments` | Outbound payouts |
| `financial_ledger_entries` | Append-only journal of operational money movements |
| `financial_late_fee_policies` | Org/property rules |
| `financial_charge_schedules` | Recurring generators tied to leases |

### Ledger entry shape (conceptual)

- `id`, `organization_id`, `property_id`, `lease_id?`, `vendor_id?`  
- `entry_type` (`charge`, `payment`, `allocation`, `late_fee`, `vendor_payable`, `vendor_payout`, `void`, `credit`)  
- `amount`, `currency`, `direction` (`debit`/`credit` from resident or org perspective — define consistently)  
- `occurred_at`, `created_at`, `created_by`  
- `source_type` + `source_id`  
- `stripe_object_id?`  
- `idempotency_key`

**No updates** to posted ledger rows except metadata that does not change amounts (discouraged). Voids = reversing entry.

---

## 4. Billing architecture (FO meaning)

In FO, “billing” means **resident billing**, not SaaS:

| Concept | FO meaning |
|---------|------------|
| Invoice | Resident-facing statement of open charges for a period (may be virtual from charges) |
| Statement | Optional PDF/email Phase 2 |
| Autopay | Phase 2 |
| Dunning | Reminder sequences via Communications + FO rules |

SaaS plan changes remain Master Admin / commercial billing only.

---

## 5. Audit

| Requirement | Detail |
|-------------|--------|
| Who/when | All charge creates, voids, approvals, payouts |
| Immutable ops log | `audit_*` + ledger |
| Stripe trail | Event ids retained |
| Break-glass | Master Admin only, audited |
| Resident visibility | Payment history cannot be silently rewritten |

---

## 6. Security & compliance notes

- PCI: use Stripe-hosted/embedded elements — no raw card data in M.P.A.  
- RLS: finance tables org-scoped; owner/resident/vendor planes enforced  
- Secrets: Stripe keys server-only / Edge Functions  
- Restricted API keys preferred over broad secret keys where feasible  

---

## 7. Implementation constraint

**No migrations or Stripe wiring until APPROVE FIN-OPS-001.**  
Schema details above are design intent for the post-approval slice work.
