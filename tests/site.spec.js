import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pageUrl = process.env.SITE_URL || new URL('../index.html', import.meta.url).href;

test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
  await expect(page.locator('#main')).toBeVisible();
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
  await expect(navigation.getByRole('link', { name: 'Connect with HPE' })).toHaveAttribute('href', 'mailto:pathfinder@hpe.com');
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
    expect(sectionGeometry).toEqual([[1424, 1500], [2924, 1382], [4306, 1964], [6270, 912], [7182, 1122], [8304, 960]]);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(9368);
    const heroContent = await page.locator('.hero-content').boundingBox();
    expect(heroContent.x).toBe(160);
    expect(heroContent.y).toBe(357.5);
    expect(heroContent.width).toBeCloseTo(1034.667, 1);
    expect(heroContent.height).toBe(418);
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
  await expect(page).toHaveTitle('HPE Pathfinder | Startup Partnerships & Investment');
  await expect(page.locator('#programs-title')).toHaveText('Find the right path for your next step');
  await expect(page.locator('#waypoint h3')).toHaveText('Partner');
  await expect(page.locator('#pathfinder .program-summary > p')).toHaveText('Pathfinder identifies and invests in category-leading startups, in the enterprise technology space.');
  await expect(page.getByRole('link', { name: 'Learn more about partnering with HPE' })).toHaveAttribute('href', '#waypoint-fit');
  await expect(page.locator('#ecosystem-title')).toHaveText('How Pathfinder works');
  await expect(page.locator('.role')).toHaveText(['Managing Partner', 'Associate', 'Analyst']);
  await expect(page.getByRole('button', { name: 'Read Full Bio' })).toHaveCount(3);
  await expect(page.locator('#connect .actions a')).toHaveCount(1);
  await expect(page.locator('#site-content')).not.toContainText('Waypoint');
});

test('biography modals show each person and contain keyboard focus', async ({ page }) => {
  for (const { name, role, paragraphs, opening } of [
    { name: 'Todd H. Poole', role: 'Managing Partner', paragraphs: 6, opening: 'Todd is the Managing Partner of Pathfinder' },
    { name: 'Marcus Vance', role: 'Pathfinder Associate', paragraphs: 5, opening: 'Marcus is an Associate at Pathfinder' },
    { name: 'Elena Rostova', role: 'Pathfinder Partner', paragraphs: 4, opening: 'Elena serves as an Analyst at Pathfinder' }
  ]) {
    const trigger = page.getByRole('button', { name: `Read Full Bio for ${name}`, exact: true });
    const card = page.locator('.team-card').filter({ has: trigger });
    const biography = await card.locator('.team-bio').evaluate(template => [...template.content.querySelectorAll('p')].map(paragraph => paragraph.textContent));
    const portrait = await card.locator('img').getAttribute('src');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const modal = page.getByRole('dialog', { name, exact: true });
    await expect(modal).toBeVisible();
    await expect(modal.locator('.bio-modal-role')).toHaveText(role);
    await expect(modal.locator('.bio-modal-text > p')).toHaveCount(paragraphs);
    await expect(modal.locator('.bio-modal-text > p')).toHaveText(biography);
    await expect(modal.locator('.bio-modal-text > p').first()).toContainText(opening);
    expect(await modal.locator('.bio-modal-portrait').getAttribute('src')).toContain(portrait);
    await expect(page.locator('html')).toHaveClass('bio-modal-open');
    const close = modal.getByRole('button', { name: 'Close biography' });
    const content = modal.getByRole('region', { name: 'Biography content' });
    expect(await content.evaluate(element => element.scrollTop)).toBe(0);
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(content).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(content).toBeFocused();
    const scrollY = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 400);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveClass('bio-modal-open');
    await trigger.click();
    expect(await content.evaluate(element => element.scrollTop)).toBe(0);
    await close.click();
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test('biography modal matches design, stays accessible, and scrolls long content', async ({ page }) => {
  await page.getByRole('button', { name: 'Read Full Bio for Todd H. Poole', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Todd H. Poole', exact: true });
  await page.evaluate(() => document.fonts.ready);
  const bounds = await modal.boundingBox();
  expect(bounds.width).toBe(Math.min(720, page.viewportSize().width - 32));
  expect(await modal.evaluate(element => getComputedStyle(element, '::backdrop').backgroundColor)).toBe('rgba(0, 0, 0, 0.8)');
  await expect(modal).toHaveCSS('border-radius', '24px');
  await expect(modal.locator('.bio-modal-portrait')).toHaveCSS('width', '192px');
  await expect(modal.locator('.bio-modal-content')).toHaveCSS('padding-left', page.viewportSize().width > 600 ? '96px' : '24px');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 256 });
  const content = modal.locator('.bio-modal-content');
  expect(await content.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(await content.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await content.focus();
  await page.keyboard.press('End');
  await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await content.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(content.locator('p').last()).toBeInViewport();
  const close = modal.getByRole('button', { name: 'Close biography' });
  await expect(close).toBeInViewport();
  await close.click();
  await expect(modal).toBeHidden();
});

test('biography modal dismisses on outside clicks but not content clicks or drags', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Read Full Bio for Todd H. Poole', exact: true });
  const modal = page.locator('#bio-modal');
  await trigger.click();
  await modal.locator('.bio-modal-portrait').click();
  await expect(modal).toBeVisible();
  const bounds = await modal.boundingBox();
  await page.mouse.move(bounds.x + 20, bounds.y + 80);
  await page.mouse.down();
  await page.mouse.move(4, 4);
  await page.mouse.up();
  await expect(modal).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass('bio-modal-open');
});

test('biography transitions are short, eased, and respect reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const trigger = page.getByRole('button', { name: 'Read Full Bio for Todd H. Poole', exact: true });
  const modal = page.locator('#bio-modal');
  await modal.evaluate(element => {
    window.bioTransitions = [];
    element.addEventListener('transitionrun', event => {
      window.bioTransitions.push({ property: event.propertyName, pseudo: event.pseudoElement, opening: element.open });
    });
  });
  await trigger.click();
  await expect(modal).toHaveCSS('opacity', '1');
  await expect(modal).toHaveCSS('transition-duration', '0.14s, 0.14s, 0.14s, 0.14s');
  await expect(modal).toHaveCSS('transition-timing-function', 'ease-out, ease-out, ease, ease');
  await page.mouse.click(4, 4);
  await expect(modal).toBeHidden();
  const transitions = await page.evaluate(() => window.bioTransitions);
  for (const opening of [true, false]) {
    expect(transitions).toContainEqual({ property: 'opacity', pseudo: '', opening });
    expect(transitions).toContainEqual({ property: 'transform', pseudo: '', opening });
    expect(transitions).toContainEqual({ property: 'opacity', pseudo: '::backdrop', opening });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click();
  await expect(modal).toHaveCSS('transition-duration', '0s');
  expect(await modal.evaluate(element => getComputedStyle(element, '::backdrop').transitionDuration)).toBe('0s');
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('WCAG accessibility checks', async ({ page }) => {
  await page.goto(pageUrl);
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  if (page.viewportSize().width <= 1100) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const expandedResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(expandedResults.violations).toEqual([]);
  }
});

test('carousel supports keyboard navigation, boundaries, and reduced motion', async ({ page }) => {
  const track = page.getByRole('list', { name: 'Portfolio companies' });
  const previous = page.getByRole('button', { name: 'Scroll to previous companies' });
  const next = page.getByRole('button', { name: 'Scroll to next companies' });
  await track.scrollIntoViewIfNeeded();
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  await expect(next).toHaveAttribute('aria-disabled', 'false');
  await track.focus();
  await expect(track).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(4);
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(previous).toHaveAttribute('aria-disabled', 'false');
  await page.evaluate(() => {
    window.carouselScrollOptions = [];
    const track = document.querySelector('#company-track');
    const scrollBy = track.scrollBy.bind(track);
    track.scrollBy = options => { window.carouselScrollOptions.push(options); scrollBy(options); };
  });
  for (let attempt = 0; attempt < 20 && await next.getAttribute('aria-disabled') !== 'true'; attempt++) {
    const before = await track.evaluate(element => element.scrollLeft);
    await page.keyboard.press('Enter');
    await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(before);
  }
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(next).toBeFocused();
  const end = await track.evaluate(element => element.scrollLeft);
  await page.keyboard.press('Enter');
  expect(await track.evaluate(element => element.scrollLeft)).toBe(end);
  await previous.focus();
  for (let attempt = 0; attempt < 20 && await previous.getAttribute('aria-disabled') !== 'true'; attempt++) {
    const before = await track.evaluate(element => element.scrollLeft);
    await page.keyboard.press('Enter');
    await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeLessThan(before);
  }
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  await expect(previous).toBeFocused();
  const start = await track.evaluate(element => element.scrollLeft);
  await page.keyboard.press('Enter');
  expect(await track.evaluate(element => element.scrollLeft)).toBe(start);
  expect(await page.evaluate(() => window.carouselScrollOptions.length > 0 && window.carouselScrollOptions.every(options => options.behavior === 'instant'))).toBe(true);
});

test('mobile navigation remains reachable in a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  for (let step = 0; step < 5; step++) await page.keyboard.press('Tab');
  const contact = page.locator('#site-nav').getByRole('link', { name: 'Connect with HPE' });
  await expect(contact).toBeFocused();
  const bounds = await contact.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(256);
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(page.locator('#site-nav')).toBeHidden();
});

test('background video plays without controls and respects visibility and reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(pageUrl);
  const heroVideo = page.locator('.hero video');
  await expect.poll(() => heroVideo.evaluate(video => video.currentTime)).toBeGreaterThan(0);
  expect(await heroVideo.evaluate(video => video.muted && video.loop && video.playsInline && video.videoWidth > 0)).toBe(true);
  await expect(heroVideo).toHaveClass(/is-ready/);
  await page.screenshot({ path: `qa/${testInfo.project.name}-video.png` });
  await expect(page.locator('.video-toggle, video[controls]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /(?:play|pause).*video/i })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => heroVideo.evaluate(video => video.paused)).toBe(true);
  await expect(heroVideo).not.toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
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