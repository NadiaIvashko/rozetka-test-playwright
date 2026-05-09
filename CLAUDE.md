# CLAUDE.md

Instructions for Claude Code when working in this repository. This file is auto-loaded into context.

> Note: the human user communicates in Ukrainian. Reply to the user in Ukrainian; keep code, file content, commit messages and these instructions in English.

---

## About the project

End-to-end automated tests for **[rozetka.com.ua](https://rozetka.com.ua/)** — the largest Ukrainian online marketplace.

- **Goal**: cover as much site functionality as possible with Playwright + TypeScript tests.
- **Project type**: learning project. No CI; tests are run locally.
- **The site is in Ukrainian** (`uk-UA`) — this affects text-based selectors.

---

## Working rules (CRITICAL)

### Git
- **FORBIDDEN** to run: `git add`, `git commit`, `git push`, `git pull`, `git fetch`, `git merge`, `git rebase`, `git reset`, `git checkout` (with branch switching), `git branch -D`, `gh pr create`, `gh pr merge`.
- **ALLOWED** read-only only: `git status`, `git diff`, `git log`, `git show`, `git blame`, `gh pr view`, `gh pr list`.
- If the user asks "create a PR" / "commit this" — do NOT execute, instead **print the ready-to-use commands in chat** so the user can run them manually.
- Exception: when the user explicitly invokes a slash command like `/create-pr` — that is explicit intent and is allowed.
- A `PreToolUse` hook (`.claude/hooks/block-git-writes.js`) enforces this at harness level.

### Worktrees
- Do **NOT** create or use git worktrees.
- If the harness happens to start a session inside a worktree (cwd contains `.claude/worktrees/`), still write files directly to the project root `D:\Projects\Nadin\` using absolute paths.

### Sensitive data
- **NEVER** commit `.env` (it holds real Rozetka account credentials).
- Do not print `.env` contents to chat.
- Real-account test data — only via `process.env.ROZETKA_USER_EMAIL` / `process.env.ROZETKA_USER_PASSWORD`.

### What NOT to automate on the site
- **Real payment** — never drive a cart through to actual checkout.
- **Registration** with a real email/phone — use the existing test account.
- Actions that can damage the account: deleting orders, vandalising personal data, unsubscribing from important notifications.
- Bulk catalog scraping — keep request volume reasonable.

---

## Stack

- **Playwright** `^1.49.0` — test runner and browser automation
- **TypeScript** `^5.7.0` (strict mode)
- **dotenv** — for reading credentials from `.env`
- **@types/node** — Node.js types

---

## Project structure

```
.
├── tests/
│   ├── smoke/       # smoke tests (fast "is the site alive" checks)
│   └── e2e/         # full e2e scenarios (per feature)
├── pages/           # Page Object Model — one class per page/component
├── fixtures/        # custom Playwright fixtures (e.g. authenticatedUser)
├── utils/           # helpers, data generators, wrappers
├── test-data/       # static data: ts constants, json
├── playwright.config.ts
├── tsconfig.json
├── .env.example     # template; .env is in .gitignore
└── package.json
```

Path aliases (from `tsconfig.json`):
- `@pages/*` → `pages/*`
- `@fixtures/*` → `fixtures/*`
- `@utils/*` → `utils/*`
- `@data/*` → `test-data/*`

---

## Code conventions

### Page Object Model
- One class per page or significant component (e.g. `HomePage`, `SearchResultsPage`, `ProductCardPage`, `CartPage`, `LoginModal`).
- Locators — as private fields (`private readonly searchInput: Locator`).
- Actions — public methods (`async search(query: string)`, `async addToCart()`).
- Keep asserts in tests, **not in Page Objects** (POM must not know about `expect`).

### Selectors (priority, top to bottom)
1. `getByRole(...)` with accessible name — most stable
2. `getByTestId(...)` — when the site exposes `data-testid` (Rozetka has some)
3. `getByLabel(...)` / `getByPlaceholder(...)` — for forms
4. `getByText(...)` — careful, text can change (Ukrainian locale!)
5. CSS selectors — last resort, no `nth-child` hardcoding
6. **XPath — avoid** except for genuinely no-other-option cases

### Tests
- Every test is **isolated** — does not depend on prior test results.
- Test names describe behavior: `'should add product to cart from search results'`.
- Structure: arrange → act → assert (Given/When/Then if convenient).
- One logical `expect` block per test (multiple technical `expect`s checking the same behavior is fine).
- **No `page.waitForTimeout()`** — use Playwright auto-waiting (`expect(...).toBeVisible()`, `waitForLoadState`, `waitForResponse`).
- Test data — from `test-data/` or generated in `utils/`.

### TypeScript
- `strict: true`, `noUnusedLocals`, `noUnusedParameters` are on in `tsconfig.json`.
- Avoid `any`. If unavoidable — `unknown` + narrow.
- Imports via aliases (`import { HomePage } from '@pages/home.page'`).

### Text selectors and locale
The site is in Ukrainian. If a test clicks on text like "Кошик" / "Каталог" / "Увійти", remember:
- `baseURL` and `locale=uk-UA` are pinned in `playwright.config.ts`.
- Do NOT rely on text for critical actions when a `role`/`testid` alternative exists.
- If you do use text, put the constants in `test-data/strings.ts` — don't hardcode them inside tests.

---

## Commands

```bash
npm install                  # install dependencies
npx playwright install       # install browsers (Chromium, Firefox, WebKit)

npm test                     # all tests in all browsers
npm run test:headed          # with a visible browser
npm run test:ui              # interactive UI mode (recommended for debugging)
npm run test:debug           # debug mode with Playwright Inspector
npm run test:chromium        # Chromium only
npm run test:firefox         # Firefox only
npm run test:webkit          # WebKit only
npm run report               # open HTML report after a run
npm run codegen              # record a test via Playwright Codegen
npm run typecheck            # type-check without emitting

npx playwright test path/to/test.spec.ts          # single file
npx playwright test -g "search by keyword"        # by test name
npx playwright test --project=chromium --headed   # combine flags
```

---

## Workflow with Claude

1. **Before writing tests** — Claude inspects the live page via Chrome MCP to pick stable selectors (no guessing).
2. **For new Page Objects** — POM first, then a test that exercises it.
3. **For new tests** — smoke first (does the feature work at all), then e2e with variations.
4. **After modifying a test** — Claude may suggest running `npm run typecheck` and the specific test.
5. **Final run and commit** — performed by the user.

---

## Subagents available

Located in `.claude/agents/`. Invoke when the situation matches.

| Agent | Model | Role |
|---|---|---|
| **page-object-builder** | `opus` | Build or update a Page Object Model class (writes files). Inspects the live page first. |
| **playwright-test-writer** | `opus` | Write a new `*.spec.ts` test file using existing POMs (writes files). |
| **test-reviewer** | `sonnet` | Read-only review of tests/POMs against conventions; flags anti-patterns. |
| **selector-inspector** | `sonnet` | Read-only recon — returns ranked stable selectors for a given target. |
| **flaky-debugger** | `sonnet` | Diagnoses a flaky test from `playwright-report/` artifacts. |

Editor-class agents (those that write files) use `opus`; read-only/analysis agents use `sonnet`.

## Project skills

Located in `.claude/skills/`. Auto-trigger on relevant context. These are project-level wrappers around globally-available skills (`Claude_in_Chrome` MCP, `Claude_Preview` MCP, `review`) plus standalone project guides.

- **rozetka-page-inspector** — Inspecting Rozetka pages: Ukrainian-locale gotchas, Rozetka-specific markup patterns.
- **playwright-debugging** — Reading trace.zip, video, console logs from `playwright-report/` and reproducing a failure locally.
- **chrome-mcp-rozetka** — Project-specific guidance for the `Claude_in_Chrome` MCP: when to use which tool, hydration timing, modal handling.
- **playwright-report-preview** — Using the `Claude_Preview` MCP to view `playwright-report/index.html` and trace artifacts.
- **pre-pr-review** — Project-specific pre-commit/pre-PR checklist (since the user does her own commits).

## Hooks

Configured in `.claude/settings.json`, scripts in `.claude/hooks/`. All hooks are Node.js (cross-platform).

| Hook | Event | Purpose |
|---|---|---|
| **session-start-context** | `SessionStart` | Prints orientation block: existing POMs, test files, recent commits, env readiness flags. |
| **block-git-writes** | `PreToolUse` on `Bash` | Hard-blocks any forbidden git/gh write command. |
| **codegen-guard** | `PreToolUse` on `Bash` | Blocks `npx playwright codegen` / `npm run codegen` (interactive browser — user runs it manually). |
| **run-typecheck** | `PostToolUse` on `Edit`/`Write`/`MultiEdit` of `*.ts` | Runs `tsc --noEmit` and surfaces errors in the same turn. |
| **stop-reminder** | `Stop` | If `*.ts` files were modified this session, prints a checklist of local commands to run before commit. |

---

## What NOT to do

- Do not add CI / GitHub Actions (this is a learning project without CI).
- Do not propose other test frameworks (Cypress, Selenium etc.) — the stack is fixed.
- Do not add heavy dependencies without an explicit request (Allure, faker, lodash etc. — discuss separately).
- Do not create `.md` documentation (plans, summaries, decisions) without being asked — we work from chat context.
- Do not write verbose JSDoc / comments — code should be self-explanatory through names.
