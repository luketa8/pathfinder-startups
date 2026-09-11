import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pageUrl = process.env.SITE_URL || new URL('../index.html', import.meta.url).href;

test('page, local assets, responsive layout, and navigation', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(pageUrl);
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
    await Promise.all([...document.images].map(image => image.decode()));
    await document.fonts.ready;
  });
  expect(await page.evaluate(() => [...document.fonts].every(font => font.status === 'loaded'))).toBe(true);
  expect(await page.evaluate(() => [...document.images].every(image => image.naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every(link => document.getElementById(link.hash.slice(1))))).toBe(true);
  const overflowing = await page.locator('h1, h2, h3, h4, p, li, .button, .team-card, .program-card').evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent.trim()));
  expect(overflowing).toEqual([]);
  if (testInfo.project.name === 'desktop') {
    const sectionGeometry = await page.evaluate(() => [...document.querySelectorAll('#programs, #find-your-path, .light-section, #companies, #about, #connect')].map(element => [element.getBoundingClientRect().top, element.getBoundingClientRect().height]));
    expect(sectionGeometry).toEqual([[1661, 1570], [3231, 1382], [4613, 1964], [6577, 900], [7477, 1122], [8599, 960]]);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(9663);
    expect(await page.locator('.team-card > img').evaluateAll(images => images.every(image => image.width === 192 && image.height === 192))).toBe(true);
  }
  await page.screenshot({ path: `qa/${testInfo.project.name}.png`, fullPage: true });

  if (page.viewportSize().width < 701) {
    const toggle = page.getByRole('button', { name: /navigation$/ });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Programs' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  } else {
    await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Programs' }).click();
  }
  await expect(page).toHaveURL(/#programs$/);
  expect(errors).toEqual([]);
});

test('WCAG accessibility checks', async ({ page }) => {
  await page.goto(pageUrl);
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('background video plays inline, pauses, and respects reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(pageUrl);
  const heroVideo = page.locator('.hero video');
  await expect.poll(() => heroVideo.evaluate(video => video.currentTime)).toBeGreaterThan(0);
  expect(await heroVideo.evaluate(video => video.muted && video.loop && video.playsInline && video.videoWidth > 0)).toBe(true);
  await expect(heroVideo).toHaveClass(/is-ready/);
  await page.screenshot({ path: `qa/${testInfo.project.name}-video.png` });
  const pauseControl = page.getByRole('button', { name: 'Pause hero background video' });
  expect(await pauseControl.evaluate(control => getComputedStyle(control).clipPath)).toBe('inset(50%)');
  await pauseControl.focus();
  expect(await pauseControl.evaluate(control => getComputedStyle(control).clipPath)).toBe('none');
  await page.keyboard.press('Enter');
  expect(await heroVideo.evaluate(video => video.paused)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(heroVideo).not.toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('button', { name: 'Play hero background video' })).toBeVisible();
  expect(await heroVideo.evaluate(video => video.paused)).toBe(true);
  await page.getByRole('button', { name: 'Play hero background video' }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => heroVideo.evaluate(video => video.paused)).toBe(false);

  await page.locator('#connect').scrollIntoViewIfNeeded();
  const closingVideo = page.locator('.connect video');
  await expect.poll(() => closingVideo.evaluate(video => video.currentTime)).toBeGreaterThan(0);
  expect(await closingVideo.evaluate(video => getComputedStyle(video).transform)).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  await expect.poll(() => heroVideo.evaluate(video => video.paused)).toBe(true);
  await page.screenshot({ path: `qa/${testInfo.project.name}-closing-video.png` });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => closingVideo.evaluate(video => video.paused)).toBe(true);
  await expect(closingVideo).not.toBeVisible();
  await page.reload();
  expect(await page.locator('video').evaluateAll(videos => videos.every(video => !video.hasAttribute('src') && video.paused))).toBe(true);
});