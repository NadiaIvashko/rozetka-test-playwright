---
name: pre-pr-review
description: Project-specific pre-commit / pre-PR checklist for this Playwright + TypeScript repo. Since the user does her own commits and PRs (Claude is forbidden from git writes — see CLAUDE.md), this skill produces a verification report the user can run through before opening a PR. Use when the user says "review my changes", "ready for PR?", "anything missing before commit?", or invokes the global `review` skill in this project.
---

# Pre-PR Review

This skill complements the globally-available `review` skill with project-specific checks for this Rozetka Playwright repo.

## When this is relevant

- The user is about to commit and wants a sanity check.
- The user explicitly says "review", "pre-PR check", "ready to commit?".
- After a multi-file change session, before handing off back to the user.

Since CLAUDE.md forbids `git add/commit/push/gh pr create`, this skill never *performs* the commit — it produces a report and ready-to-paste git commands the user runs herself.

## Checklist

Run through every section. Skip the section if it doesn't apply. Report only items that fail or warrant attention.

### 1. Working tree status

```bash
git status
git diff --stat
```

- Are all intended files staged-or-modified?
- Any unintended file changes (binary blobs, `node_modules/`, `.env`)?
- `.env` modified or staged → **HARD STOP**, never commit.

### 2. TypeScript compiles

```bash
npm run typecheck
```

Must exit 0. If it fails, the PR is not ready.

### 3. Tests run

For the affected scope only — full-suite runs are too slow:

```bash
npx playwright test path/to/changed.spec.ts --project=chromium
```

If multiple specs changed:
```bash
npx playwright test --project=chromium
```

The user runs this; Claude reports the result if she shares the output.

### 4. Linting & conventions (manual review by Claude)

Use the `test-reviewer` subagent on every file in the change set. Report failures using its standard format:
- `✗` hard failures — must fix before commit
- `⚠` warnings — strongly suggest fixing
- `OK` — clean

### 5. Convention checklist (Claude verifies)

For each modified file, confirm:

- [ ] No `page.waitForTimeout(...)` introduced.
- [ ] No `test.only` / `test.skip` left in.
- [ ] No `console.log` debug leftovers.
- [ ] No hardcoded `https://rozetka.com.ua/...` URLs (use relative paths with `baseURL`).
- [ ] No credentials inline (only via `process.env.ROZETKA_USER_*`).
- [ ] No XPath without justification comment.
- [ ] No `expect(...)` inside `pages/*.ts`.
- [ ] No new `.md` documentation files (CLAUDE.md says we don't create docs without ask).
- [ ] No new heavy deps in `package.json` (allowlist: `@playwright/test`, `typescript`, `@types/node`, `dotenv` — anything else needs explicit user approval).

### 6. Memory of intent

What's the *purpose* of this change? Summarise in one sentence — that becomes the candidate commit message subject. Examples:
- "Add SearchResultsPage POM with sort/filter locators"
- "Cover empty-cart state with a smoke test"
- "Fix flaky add-to-cart test by waiting for /api/cart/add response"

### 7. Generate (do not run) the commit commands

Per project policy, output ready-to-paste commands instead of running them:

```bash
git status
git diff
git add <files>
git commit -m "<subject>

<optional body>
"
git push
gh pr create --title "<title>" --body "<body>"
```

The user runs these herself.

## Output format

```
=== Pre-PR Review for: <one-line summary of change> ===

Working tree:        OK / WARN / FAIL
Typecheck:           Not run by user / OK / FAIL
Tests:               Not run by user / OK / FAIL — <details>
Convention review:   <test-reviewer summary>
Hard failures:       <list or "none">
Warnings:            <list or "none">

Suggested commit:
  Subject: <one-liner>
  Body:    <2-3 lines explaining why>

Commands for you to run:
  <ready-to-paste git/gh commands>
```

## Limits

- This skill never executes git write commands — that's blocked at the harness level by `block-git-writes.js`.
- This skill does not push or open the PR for the user; the user does that herself.
- If `npm run typecheck` or tests haven't been run during the session, ask the user to run them and share the output rather than guessing.
