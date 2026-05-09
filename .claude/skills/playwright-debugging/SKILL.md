---
name: playwright-debugging
description: How to investigate a failing Playwright test using the artifacts in playwright-report/ and test-results/ — trace.zip, video.webm, screenshots, console logs — and reproduce the failure locally. Use when a test fails (locally or in a recent run) and the user wants to understand why before fixing.
---

# Playwright Debugging

This skill explains how to read the artifacts Playwright produces on failure and how to reproduce a failure under controlled conditions.

## When this is relevant

- A test failed on the most recent local run.
- A test is intermittently failing (flaky) and the user wants a diagnosis.
- The user mentions `playwright-report/`, `trace.zip`, `test-results/` or "open the report".

## Artifact map

After a run, Playwright produces:

```
playwright-report/         # HTML report — the entry point for humans
  index.html               # open in browser

test-results/              # raw per-test artifacts
  <project>-<test-name>/
    trace.zip              # full action + network + DOM-snapshot trace
    video.webm             # screen recording (if `video` enabled in config)
    test-failed-1.png      # screenshot at failure
    error-context.md       # human-readable failure summary
```

The project's `playwright.config.ts` has `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`. So artifacts only exist for failing tests.

## Investigation workflow

1. **Find the failing test directory.** Use `Glob` on `test-results/**/error-context.md` and pick the most recent.
2. **Read `error-context.md` first.** This is the human-readable summary: which assertion failed, what it expected vs got, and the call stack.
3. **Open the trace** for action-by-action playback:
   ```bash
   npx playwright show-trace test-results/<dir>/trace.zip
   ```
   This opens the trace viewer in a browser. The user runs this command — Claude cannot interact with the GUI viewer directly.
4. **Inspect the trace contents from the command line** for evidence:
   ```bash
   unzip -l test-results/<dir>/trace.zip
   unzip -p test-results/<dir>/trace.zip trace.network | head -200
   ```
   The network log shows every request/response with timing — useful for spotting slow APIs and 4xx/5xx responses.
5. **Watch the video** if the failure is visual (layout shift, modal stacking). The user opens it locally; Claude can't view video.
6. **Check the screenshot** with `Read` (Claude can view PNGs).
7. **Cross-reference the test source** and any POMs it touched.

## Common failure patterns

| Symptom | Likely cause | Fix direction |
|---|---|---|
| `locator.click: Timeout 30000ms exceeded` | Element never appeared / wrong selector / page not navigated | Confirm with `selector-inspector`; check for navigation failures earlier in the trace |
| `expect(locator).toBeVisible()` timeout | Element exists but is hidden (covered by sticky header, behind modal) | Scroll into view; dismiss overlay first |
| `expect(locator).toHaveText(...)` mismatch | Text changed (Ukrainian wording drift) or wrong locator picked sibling | Loosen to regex; tighten the locator |
| Network request never resolves | Backend slow or returned 5xx | Add `waitForResponse` with status check; surface the API error |
| Test passes alone, fails in suite | State leak — prior test left cart/session populated | Add cleanup in fixture; ensure `storageState` is fresh per test |
| Test fails only on first run after browser install | Cookie/region banner blocking interaction | Dismiss banner in a fixture |
| Test fails only headed | Animation timing / focus differences | Don't depend on focus; wait for explicit state |

## Reproducing flakes

To measure how flaky a test really is:

```bash
npx playwright test tests/path/to.spec.ts -g "test name" --repeat-each=20 --workers=1
```

`--repeat-each` runs the test that many times. `--workers=1` keeps state predictable. A 1-2/20 failure rate is a real flake worth fixing. 0/20 with the original failure means the failure was environmental (the user's machine state at the time).

## When you finish investigating

Hand off to `flaky-debugger` for a structured root-cause report and fix proposal, or directly to the user with:
- The failure mode (one-line summary)
- The single most likely root cause with trace evidence
- The proposed fix with rationale
- A reproduction command to verify before/after

Do not edit test files in the debugging step itself — propose first, edit only after the user confirms.
