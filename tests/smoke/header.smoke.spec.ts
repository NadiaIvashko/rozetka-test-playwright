import { test, expect } from '@playwright/test';
import { HeaderComponent } from '@pages/header.component';
import { CART, HEADER, LOGIN_MODAL } from '@data/strings';

test.describe.configure({ retries: 2 });

test.describe('Header — smoke', () => {
  let header: HeaderComponent;

  test.beforeEach(async ({ page }) => {
    header = new HeaderComponent(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(header.searchInput).toBeVisible();
    await expect(header.cartButton).toBeVisible();
    await expect(header.searchSuggestPanel).toBeAttached();
  });

  test('renders core controls on the home page', async () => {
    await expect.soft(header.searchInput).toBeVisible();
    await expect.soft(header.catalogButton).toBeVisible();
    await expect.soft(header.cartButton).toBeVisible();
    await expect.soft(header.userButton).toBeVisible();
  });

  test('search by submitting the form navigates to search results', async ({ page }) => {
    await header.search('iphone');

    await page.waitForURL(/\/search\/\?text=iphone/, { timeout: 30_000 });
  });

  test('typing in search reveals the suggestions panel', async () => {
    await header.typeInSearch('iphone 15');

    await expect(header.searchSuggestPanel).toBeVisible();
  });

  test('logo link points back to the home page', async () => {
    await expect(header.logoLink).toBeVisible();
    await expect(header.logoLink).toHaveAttribute('href', /^https:\/\/rozetka\.com\.ua\/?$/);
  });

  test('cart button opens the cart modal', async ({ page }) => {
    await header.openCart();

    await expect(page.getByRole('heading', { name: CART.title, level: 2 })).toBeVisible();
  });

  test('comparison link points to the comparison page', async ({ page }) => {
    const comparisonLink = page.getByRole('link', { name: HEADER.comparisonLink });

    await expect(comparisonLink).toBeVisible();
    await expect(comparisonLink).toHaveAttribute('href', /\/ua\/comparison\//);
  });

  test('user button opens the auth modal for an anonymous user', async ({ page }) => {
    await expect(header.userButton).toBeEnabled();
    await header.openUserMenu();

    await expect(page.getByRole('heading', { name: LOGIN_MODAL.heading, level: 2 })).toBeVisible();
  });

  test('getCartItemCount returns 0 on a fresh session', async () => {
    const count = await header.getCartItemCount();

    expect(count).toBe(0);
  });
});
