# 07 — Implementation Order

**Package:** CORE-001  
**Binding after:** CORE-001 Approve  
**Rule:** Do not start item N+1 feature work if item N is a hard dependency still open. Certification-only items may parallelize.

```
0. CORE-001 Approve (this package)
   │
1. P0-05 Known Limitations vLaunch          [docs/sales]
   │
2. P0-02 Restore FIN-003 design package     [docs only]
   │     └─ Re-Approve if materially changed
   │
3. P0-01 Live rent cert                     [ops/cert]  ─┐
   │                                                     │ parallel OK
4. P1-04 Master Admin walk                  [ops/cert]  ─┤
5. P1-05 www email invite proof             [ops/cert]  ─┘
   │
6. P0-03 FIN-003 Phase A implement          [build]  ← after step 2 Approve
   │     Design→Document(already)→Approve→Implement
   │
7. P0-04 Owner Portal MVP                   [build]
   │     or signed Option B limitation
   │
8. P1-01 PUSH-001 real-device PASS           [cert/build minimal]
   │
9. P1-02 DPX-003 polish PASS                [build/cert]
   │
10. P1-06 Screening/e-sign honesty          [cert or limitations]
   │
11. P1-03 VENDOR-001 Phase B                [build]  ← after Phase A (done)
   │
12. Commercial Launch GO package            [cert]
    Commercial score ≥ 9.0
```

### Parallelization guide

| Parallel set | Items |
|--------------|-------|
| A — Ops cert burst | P0-01, P1-04, P1-05 |
| B — Experience | P1-01, P1-02 (after or beside money, not blocking P0-01) |
| C — Money out | P0-02 → P0-03 → P0-04 (strict sequence) |
| D — Vendor pay | P1-03 after Wave 2 or in parallel with Wave 3 if staffing allows |

### Stop conditions

- If P0-03 scope expands into full GL → **reject**; restart gate under ADR-010.  
- If Owner Portal expands into full owner CRM → **reject**; keep MVP.  
- If any sprint starts Post Launch items while P0 open → **out of process**.
