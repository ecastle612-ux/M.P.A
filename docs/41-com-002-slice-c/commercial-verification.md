# Commercial Verification — Slice C

| Rule | Result |
|------|--------|
| PM Professional self-serve Checkout | Allowed when Price configured |
| PM Business self-serve Checkout | Allowed when Price configured |
| FO self-serve Checkout | Rejected → Enterprise |
| Complete self-serve Checkout | Rejected → Enterprise |
| FO_READY | false |
| Success creates org | **No** |
| Success creates user | **No** |
| Success grants entitlements | **No** |
| Continue CTA | Signup handoff with `saas_checkout_session` |

Unit coverage: `saas-checkout.test.ts`, webhook handler tests.
