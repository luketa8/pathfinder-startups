import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const pageUrl = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const localFooter = readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];

test('real HFWS header preserves navigation and leaves the local footer unchanged', async ({ page }) => {
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('h50007.www5.hpe.com')) responses.push(response);
  });
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.HPEHF?.hfInitialized);
  await expect(page.locator('#hpehf-header')).toBeVisible();
  await expect(page.locator('#hpehf-header')).toHaveClass(/hpehf-dark/);
  await expect(page.locator('#hpehf-footer, #footer, #hpe_slim_footer, #hpehf-search')).toHaveCount(0);
  expect(await page.locator('.site-footer').evaluate((element, html) => element.outerHTML === new DOMParser().parseFromString(html, 'text/html').querySelector('footer').outerHTML, localFooter)).toBe(true);
  expect(responses.some(response => response.ok() && response.url().includes('hide_search=true'))).toBe(true);
  expect(responses.some(response => response.ok() && response.url().includes('hpe-hfws-hf.js'))).toBe(true);
  for (const id of ['hpehf-default-main-nav', 'hpehf-mobile-default-main-nav']) {
    await expect(page.locator(`#${id} a`)).toHaveText(['Programs', 'Why HPE', 'Companies', 'About']);
    for (const [title, href] of [['Programs', '#programs'], ['Why HPE', '#why-hpe'], ['Companies', '#companies'], ['About', '#about']]) {
      const link = page.locator(`#${id}`).getByRole('link', { name: title, includeHidden: true, exact: true });
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('data-analytics-region-id', `gmenu|Pathfinder|${title}`);
    }
  }
  const logo = page.locator('#hpehf-hpe-logo');
  await expect(logo).toHaveAttribute('href', '#top');
  await expect(logo).toHaveAccessibleName('HPE Pathfinder home');
  await expect(logo).toHaveAttribute('data-analytics-region-id', 'gmenu|Pathfinder');
  const nativeCTAs = page.locator('#hpehf-header .hpehf-main-nav-cta-item > .hpehf-nav-cta-button');
  await expect(nativeCTAs).toHaveCount(2);
  await expect(page.locator('.pathfinder-contact')).toHaveCount(0);
  for (const cta of await nativeCTAs.all()) {
    await expect(cta).toHaveText('Connect with HPE');
    await expect(cta).toHaveAttribute('href', 'mailto:pathfinder@hpe.com');
    await expect(cta).not.toHaveAttribute('target', '_blank');
    await expect(cta).toHaveAttribute('data-analytics-region-id', 'gmenu|Pathfinder|Connect with HPE');
    await expect(cta.locator('.hpehf-arrow')).toHaveAttribute('aria-hidden', 'true');
  }
  if (page.viewportSize().width <= 1100) {
    const toggle = page.locator('#hpehf-hmb-menu > a');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#hpehf-mobile-nav a').first()).toBeFocused();
    await page.locator('#hpehf-header').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(page.locator('#hpehf-mobile-nav')).toBeHidden();
  }
});

test('native CTA remains visible across the custom header breakpoint', async ({ page }) => {
  for (const width of [1100, 1101]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pageUrl);
    await page.waitForFunction(() => window.HPEHF?.hfInitialized);
    await expect(page.locator('#hpehf-default-main-nav a')).toHaveText(['Programs', 'Why HPE', 'Companies', 'About']);
    await page.evaluate(() => document.fonts.ready);
    if (width === 1100) await page.locator('#hpehf-hmb-menu > a').click();
    const cta = page.locator('#header').getByRole('link', { name: 'Connect with HPE', exact: true });
    await expect(cta).toBeVisible();
    await expect(cta.locator('.hpehf-arrow')).toBeVisible();
    const bounds = await cta.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('local navigation remains usable if HFWS is unavailable', async ({ page }) => {
  await page.route('https://h50007.www5.hpe.com/**', route => route.abort());
  await page.goto(pageUrl);
  await expect(page.locator('.site-header')).toBeVisible();
  if (page.viewportSize().width <= 1100) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
  }
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Programs', exact: true }).click();
  await expect(page).toHaveURL(/#programs$/);
  await page.getByRole('button', { name: 'Read Full Bio for Todd H. Poole' }).click();
  await expect(page.getByRole('dialog', { name: 'Todd H. Poole' })).toBeVisible();
});
