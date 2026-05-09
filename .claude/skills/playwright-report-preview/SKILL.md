---
name: playwright-report-preview
description: How to use the Claude_Preview MCP to view the Playwright HTML report (playwright-report/index.html) and trace files (test-results/*/trace.zip) inline during a session. Use whenever the user runs tests and wants you to look at the report, or wants you to walk them through a failure visually.
---

# Playwright Report Preview

This skill wraps the global `Claude_Preview` MCP for the project's Playwright artifacts.

## When this is relevant

- The user has just run tests (`npm test`, `npm run test:chromium`, `npx playwright test ...`) and the report exists at `playwright-report/index.html`.
- A test failed and `test-results/<test-name>/` contains `trace.zip`, `video.webm`, screenshots.
- The user says "open the report", "show me the trace", "what does the failure look like".

## Workflow

### 1. Confirm artifacts exist

```bash
ls playwright-report/
ls test-results/
```

If `playwright-report/` is missing, ask the user to run the tests first.

### 2. Start a preview server

Use `mcp__Claude_Preview__preview_start` pointing at the project root, so it serves both `playwright-report/` and `test-results/` over HTTP. (The HTML report has relative links that only work over HTTP, not via `file://`.)

### 3. Navigate to the report

The entry point is `playwright-report/index.html`. The report shows:
- Pass/fail counts per project (chromium / firefox / webkit / mobile-chrome).
- Each test with its duration and final status.
- Click into a failed test to see error message, attached screenshot, video, and trace download link.

### 4. Inspect the trace

Trace viewer is the most powerful tool. Two paths:
- **In-report**: click the trace link in the HTML report — it opens the trace viewer in a new tab.
- **Standalone**: `npx playwright show-trace test-results/<dir>/trace.zip`. The user runs this command in their own terminal — Claude cannot drive the GUI viewer through preview.

### 5. Read screenshots inline

Screenshots are PNG files (`test-failed-1.png`). Claude can `Read` them directly — no preview server needed for static images.

## What to look for in a failure

In the HTML report → failed test → expand the failed step:
- **Error stack**: which line in which file failed, and why (locator timeout, assertion mismatch, navigation error).
- **Screenshot at failure**: visual confirmation of what was on screen.
- **Video**: the full session recorded — useful for catching layout shifts or modal stacking that screenshots miss.

In the trace viewer:
- **Action timeline** at the top — every Playwright call and its duration.
- **DOM snapshot** at each action — what the page looked like just before the action fired.
- **Network tab** — every request, with status, headers, response body. Spot 4xx/5xx that the test didn't notice.
- **Console tab** — page errors that may have caused the failure indirectly.

## Limits

- The user must view video and the interactive trace viewer themselves — Claude can read JSON/text artifacts and PNG screenshots only.
- After a re-run, old artifacts in `test-results/` are overwritten — investigate failures before re-running.
- `playwright-report/` is the *aggregated* report from the last `playwright test` run; per-test artifacts live in `test-results/<test-id>/`.

## Hand-off

For a structured root-cause analysis of a flake, hand off to the **flaky-debugger** subagent. This skill is for *viewing* the artifacts; the subagent is for *diagnosing* them.
