import { Page, Locator } from '@playwright/test';
import { HEADER } from '@data/strings';

export class HeaderComponent {
  private readonly _logoLink: Locator;
  private readonly _catalogButton: Locator;
  private readonly _searchInput: Locator;
  private readonly searchSubmitButton: Locator;
  private readonly _searchSuggestPanel: Locator;
  private readonly _userButton: Locator;
  private readonly comparisonLink: Locator;
  private readonly _cartButton: Locator;
  private readonly cartCounterBadge: Locator;

  constructor(page: Page) {
    this._logoLink = page.getByRole('link', { name: 'Rozetka Logo', exact: true });
    this._catalogButton = page.getByRole('button', { name: HEADER.catalogButton, exact: true });
    this._searchInput = page.getByPlaceholder(HEADER.searchPlaceholder);
    this.searchSubmitButton = page.getByRole('button', { name: HEADER.searchSubmit, exact: true });
    this._searchSuggestPanel = page.locator('rz-search-suggest');
    this._userButton = page.getByTestId('header-auth-btn');
    this.comparisonLink = page.getByRole('link', { name: HEADER.comparisonLink });
    this._cartButton = page.getByRole('button', { name: HEADER.cartButton });
    this.cartCounterBadge = this._cartButton.locator('.badge');
  }

  get searchInput(): Locator {
    return this._searchInput;
  }

  get cartButton(): Locator {
    return this._cartButton;
  }

  get userButton(): Locator {
    return this._userButton;
  }

  get catalogButton(): Locator {
    return this._catalogButton;
  }

  get searchSuggestPanel(): Locator {
    return this._searchSuggestPanel;
  }

  get logoLink(): Locator {
    return this._logoLink;
  }

  async goToHome(): Promise<void> {
    await this._logoLink.click();
  }

  async openCatalog(): Promise<void> {
    await this._catalogButton.click();
  }

  async typeInSearch(query: string): Promise<void> {
    await this._searchInput.fill(query);
  }

  async search(query: string): Promise<void> {
    await this._searchInput.click();
    await this._searchInput.pressSequentially(query, { delay: 30 });
    await this._searchInput.press('Enter');
  }

  async submitSearch(): Promise<void> {
    await this.searchSubmitButton.click();
  }

  async openCart(): Promise<void> {
    await this._cartButton.click();
  }

  async openComparison(): Promise<void> {
    await this.comparisonLink.click();
  }

  async openUserMenu(): Promise<void> {
    await this._userButton.click();
  }

  async getCartItemCount(): Promise<number> {
    if ((await this.cartCounterBadge.count()) === 0) {
      return 0;
    }
    const badge = this.cartCounterBadge;
    if (!(await badge.isVisible())) {
      return 0;
    }
    const raw = (await badge.textContent())?.trim() ?? '';
    if (raw.length === 0) {
      return 0;
    }
    const parsed = Number.parseInt(raw.replace(/\D+/g, ''), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
