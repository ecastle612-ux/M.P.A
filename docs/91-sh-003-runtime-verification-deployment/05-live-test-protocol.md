# 05 — Live Test Protocol (deployed only)

**Not localhost.** Use the Production or Preview URL that contains the certified commit.

Phone:

1. Hard-refresh / clear site data once after deploy (kill SW if needed)  
2. Open drawer  
3. Tap Search M.P.A.  
4. Type continuously ≥ 30 seconds  
5. Open AI  
6. Return  
7. Continue typing  
8. Repeat  

Optional: `?mpaDebugShell=1` and dump `__MPA_SHELL_TRACE__` after a failure.

Fail if: focus disappears, keyboard dismisses, cursor jumps, search resets unexpectedly.
