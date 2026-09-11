import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pageUrl = process.env.SITE_URL || new URL('../index.html', import.meta.url).href;

test('password gate rejects invalid input and remembers this tab', async ({ page }, testInfo) => {
  await page.goto(`${pageUrl}#programs`);
  const password = page.getByLabel('Password', { exact: true });
  await expect(page.locator('#site-content')).toBeHidden();
  await expect(password).toHaveAttribute('type', 'password');
  await expect(page.locator('#login input')).toHaveCount(1);
  expect(await page.locator('video').evaluateAll(videos => videos.every(video => !video.hasAttribute('src')))).toBe(true);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(password).toBeFocused();
  await password.fill('incorrect');
  await password.press('Enter');
  await expect(page.getByRole('alert')).toHaveText('Incorrect password. Try again.');
  await expect(password).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#site-content')).toBeHidden();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: `qa/${testInfo.project.name}-login.png`, fullPage: true });
  await password.fill('design2code');
  await expect(page.getByRole('alert')).toBeEmpty();
  await password.press('Enter');
  await expect(page.locator('#login')).toBeHidden();
  await expect(page.locator('#main')).toBeFocused();
  await expect(page).toHaveURL(/#programs$/);
  await expect(page.locator('#programs')).toBeInViewport();
  await expect(password).toHaveValue('');
  await page.reload();
  await expect(page.locator('#login')).toBeHidden();
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(password).toBeVisible();
  await expect(page.locator('#site-content')).toBeHidden();
});

test('password gate works when session storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage unavailable'); } });
  });
  await page.goto(pageUrl);
  await page.getByLabel('Password', { exact: true }).fill('design2code');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#login')).toBeHidden();
  await expect(page.locator('#main')).toBeVisible();
});