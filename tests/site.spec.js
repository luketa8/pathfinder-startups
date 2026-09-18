import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pageUrl = process.env.SITE_URL || new URL('../index.html', import.meta.url).href;

test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
  await page.getByLabel('Password', { exact: true }).fill('design2code');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#login')).toBeHidden();
});

test('single-row Pathfinder header and keyboard navigation', async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('.site-header');
  expect((await header.boundingBox()).height).toBe(80);
  await expect(header.getByRole('link', { name: 'HPE Pathfinder home' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  if (page.viewportSize().width <= 1100) {
    const toggle = page.getByRole('button', { name: /navigation$/ });
    await expect(navigation).toBeHidden();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(navigation.getByRole('link', { name: 'Programs', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(navigation).toBeHidden();
    await toggle.click();
  } else {
    const logo = await header.locator('.brand-logo').boundingBox();
    expect([logo.width, logo.height]).toEqual([104, 30]);
    expect(logo.x).toBe(page.viewportSize().width === 1920 ? 160 : 48);
  }
  await expect(navigation.getByRole('link', { name: 'Connect with HPE' })).toBeVisible();
  await navigation.getByRole('link', { name: 'Programs', exact: true }).click();
  await expect(page).toHaveURL(/#programs$/);
});

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
    expect(sectionGeometry).toEqual([[1424, 1496], [2920, 1382], [4302, 1964], [6266, 900], [7166, 1122], [8288, 960]]);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(9352);
    const heroContent = await page.locator('.hero-content').boundingBox();
    expect(heroContent.x).toBe(160);
    expect(heroContent.y).toBe(361.5);
    expect(heroContent.width).toBeCloseTo(1034.667, 1);
    expect(heroContent.height).toBe(410);
    expect(await page.locator('.team-card > img').evaluateAll(images => images.every(image => image.width === 192 && image.height === 192))).toBe(true);
  }
  await page.screenshot({ path: `qa/${testInfo.project.name}.png`, fullPage: true });
  await page.locator('.hero').getByRole('link', { name: 'Find your path', exact: true }).click();
  await expect(page).toHaveURL(/#find-your-path$/);
  await page.locator('.hero').getByRole('link', { name: 'Explore the ecosystem', exact: true }).click();
  await expect(page).toHaveURL(/#ecosystem$/);

  if (page.viewportSize().width <= 1100) {
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

test('revised Pathfinder copy and calls to action', async ({ page }) => {
  await expect(page).toHaveTitle('HPE Pathfinder | Partner, Invest, Build, and Scale');
  await expect(page.locator('#programs-title')).toHaveText('Find the right path for your next step');
  await expect(page.locator('#waypoint h3')).toHaveText('Partner');
  await expect(page.getByRole('link', { name: 'Learn more about partnering with HPE' })).toHaveAttribute('href', '#waypoint-fit');
  await expect(page.locator('#ecosystem-title')).toHaveText('How Pathfinder works');
  await expect(page.locator('.role')).toHaveText(['Managing Partner', 'Associate', 'Analyst']);
  await expect(page.locator('#connect .actions a')).toHaveCount(1);
  await expect(page.locator('#site-content')).not.toContainText('Waypoint');
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