import { Page } from '@playwright/test';

export async function dismissCookieBanner(page: Page): Promise<void> {
  const banner = page.locator('rz-cookies-notification, .cookies-notification');
  const accept = banner.getByRole('button', { name: /прийняти|погоджуюсь|ok/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}
