---
name: rozetka-page-inspector
description: How to inspect rozetka.com.ua pages with Chrome MCP for selector design — Ukrainian-locale gotchas, Rozetka-specific markup patterns, common DOM traps. Use when about to create or update a Page Object, when an existing locator broke, or when you need to understand a page's structure before writing tests.
---

# Rozetka Page Inspector

This skill guides inspection of pages on https://rozetka.com.ua/ for the purpose of writing stable Playwright locators. Use it before creating a POM, before changing locators in an existing one, and when an existing test breaks because of a DOM change.

## When this is relevant

- About to write or update a Page Object class.
- A previously-working locator is now timing out.
- Need to understand the structure of a feature (filters, modals, dynamic lists) before writing a test.

## Workflow

1. **Open the live page via Chrome MCP** at the relevant URL. Use `mcp__Claude_in_Chrome__navigate`.
2. **Wait for hydration.** Rozetka is an Angular app; many components mount after the initial paint. Avoid sampling DOM in the first ~500ms after navigation.
3. **Read the rendered DOM** via `mcp__Claude_in_Chrome__read_page` or scoped queries with `mcp__Claude_in_Chrome__find`.
4. **Probe candidate selectors** using `mcp__Claude_in_Chrome__javascript_tool` to evaluate `document.querySelectorAll(...)` and confirm cardinality before recommending.
5. **Repeat after a hard reload** to ensure the selector survives a fresh load (some `data-*` attributes are generated per session).

## Rozetka-specific patterns

### URL conventions
- Homepage: `/`
- Search: `/search/?text=<query>`
- Category: `/<category-slug>/c<id>/` — e.g. `/notebuki/c80004/`
- Product: `/<product-slug>/p<id>/` — e.g. `/p123456789/`
- Cart: `/cart/`
- Login modal: opened from header, no dedicated URL
- All public URLs are stable across sessions; product/category IDs persist.

### `data-testid`
- Rozetka exposes `data-testid` inconsistently. The header, search bar and some buttons have them; product cards and filters often do not.
- Always check first: `document.querySelector('[data-testid="..."]')`. If present and unique — prefer it.

### Roles and accessible names
- Most interactive elements (`button`, `link`, `searchbox`, `combobox`) expose proper roles.
- Accessible names are in **Ukrainian**: "Каталог", "Кошик", "Увійти", "Купити", "Додати в обране", "Знайти".
- Use case-insensitive regex: `getByRole('button', { name: /купити/i })`.
- Some buttons change text by state: "Купити" / "Очікується" / "Немає в наявності" — handle the variants you care about.

### Common pitfalls
- **Cookie / consent banners**: a region-selector or cookie banner may overlay the page on first visit. Either dismiss it in a fixture or scope locators inside `main` to avoid catching banner buttons.
- **Sticky header**: covers the top of the page; if a click misses, scroll the target into view first or use `{ position: 'center' }`.
- **Lazy-loaded grids**: search/category result counts and items beyond the viewport load on scroll. `getByRole('listitem').count()` will be lower than the total. Use the result-count badge on the page or scroll before counting.
- **Modal stacks**: login, region-select, cart-preview can all be modals. Scope to the modal: `page.getByRole('dialog', { name: /вхід/i }).getByLabel(...)`.
- **Currency / region**: defaults to UAH for Ukraine; price text contains `грн`. If you assert price strings, use a regex tolerant to non-breaking spaces: `/\d[\d\s ]*\sгрн/`.
- **AJAX-driven filters**: clicking a filter triggers a network request and partial re-render. Use `waitForResponse` against `/api/...` or `expect(...).toHaveCount(...)` rather than fixed timeouts.

## Output you should produce

After inspecting, hand off to whoever needs the result with:
- Target URL and any setup needed (login? cookie dismissed?)
- Selector recommendations in priority order with confirmed match counts
- A note on any per-session or per-state variability you observed

If the user asked you to *create* code, hand the selectors to the `page-object-builder` subagent rather than writing the POM here.
