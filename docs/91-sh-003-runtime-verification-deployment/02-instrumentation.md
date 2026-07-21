# 02 — Instrumentation

Enable on any environment:

```js
localStorage.setItem("mpaDebugShell", "1");
location.reload();
```

Or open with `?mpaDebugShell=1`.

Events land on `window.__MPA_SHELL_TRACE__` (focusin/out, search focus/blur, drawer open/close, entity search, resize, visibility).

Dump:

```js
copy(JSON.stringify(window.__MPA_SHELL_TRACE__, null, 2));
```
