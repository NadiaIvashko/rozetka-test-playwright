---
name: chrome-mcp-rozetka
description: Project-specific guidance for using the Claude_in_Chrome MCP to inspect rozetka.com.ua. Covers when to invoke which Chrome MCP tool, how to handle Rozetka's Angular-based hydration, modal/banner dismissal patterns, and what data to extract for downstream subagents (page-object-builder, selector-inspector). Use whenever a task requires interacting with the live Rozetka site.
---

# Chrome MCP for Rozetka

This skill is a project wrapper around the global `Claude_in_Chrome` MCP server. The MCP exposes generic browser-automation tools; this document narrows them to Rozetka-specific usage.

## When this is relevant

- Designing or updating a Page Object (live DOM is the source of truth — never invent selectors).
- Debugging a locator that started failing after a Rozetka deploy.
- Verifying a feature behaves as expected before/after writing a test.
- Extracting copy text in Ukrainian for `test-data/strings.ts`.

## Tool selection cheat-sheet

| Goal | Tool | Notes |
|---|---|---|
| Open a page | `mcp__Claude_in_Chrome__navigate` | Pass full URL. After navigation, give the page ~500ms before sampling DOM (Angular hydration). |
| Read full page text | `mcp__Claude_in_Chrome__get_page_text` | Cheap; good for checking what UA strings are visible. |
| Read structured DOM | `mcp__Claude_in_Chrome__read_page` | Returns hierarchical structure with roles — useful for picking `getByRole(...)` candidates. |
| Find specific elements | `mcp__Claude_in_Chrome__find` | Targeted query for a description ("the search input"). |
| Run JS in page | `mcp__Claude_in_Chrome__javascript_tool` | Use for `document.querySelectorAll(sel).length` to confirm selector cardinality before recommending it. |
| Click / type | `mcp__Claude_in_Chrome__computer` or `mcp__Claude_in_Chrome__form_input` | Use sparingly — only when the page state requires interaction to reveal the target (e.g. opening a modal). |
| Capture screenshot | `mcp__Claude_in_Chrome__upload_image` (via screenshot) | For visual confirmation when text alone isn't enough. |
| Read console errors | `mcp__Claude_in_Chrome__read_console_messages` | Helpful when a feature appears broken. |
| Read network | `mcp__Claude_in_Chrome__read_network_requests` | Identify the API a UI action triggers — feeds `waitForResponse(...)` patterns in tests. |

## Standard inspection sequence

1. `navigate` to the target URL.
2. Wait briefly (or call `read_page` and check for hydration markers — Angular root, populated `<main>`).
3. Dismiss any blocking overlay if it interferes:
   - Region/cookie banner (first visit) — usually a `button` with name like "Прийняти" or "Закрити".
   - Login modal — only if the target is behind login.
4. `find` or `read_page` to locate target elements.
5. `javascript_tool` with `document.querySelectorAll(...)` to confirm cardinality.
6. Capture results in this format:
   ```
   Element: "Add to cart button"
   Selector candidates:
     1. getByRole('button', { name: /купити/i })  → 24 matches across visible cards (use `.first()` or scope)
     2. [data-testid='product-add-to-cart']        → 18 matches (missing on quick-view cards)
     3. .buy-button                                 → 24 matches (CSS class is fragile)
   Notes: text "Купити" is canonical; "Очікується" appears on out-of-stock cards.
   ```

## Hydration & timing rules

- **Don't sample DOM during the first 500ms after navigation.** Angular re-renders the shell, then mounts feature components. Selectors that worked at t=0 may not work at t=200ms.
- **Re-load before finalizing a recommendation.** Some `data-*` attributes are session-generated. Hard-reload (navigate again to the same URL) and re-run `javascript_tool` to confirm the selector still works.
- **Wait for network-driven UI** (filters, search) by polling for the result count to change, not by sleeping.

## Things to avoid

- Submitting forms with real data (login, search is fine; checkout, registration, password reset are not).
- Adding items through to checkout completion — stop at the cart screen.
- Long automated browsing sessions on the same account — stay within reasonable request volume.
- Logging the user's credentials, even in inspection scratch text.

## Hand-off

When the inspection is done, hand the structured selector list to:
- **page-object-builder** — if the goal is creating/updating a POM file.
- **playwright-test-writer** — only if the relevant POM already exists.
- The user directly — if this was just exploratory.
