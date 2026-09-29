import { test, expect } from '@playwright/test';

const pageUrl = process.env.SITE_URL || new URL('../index.html', import.meta.url).href;

test('search and social metadata describe the public page', async ({ page }) => {
  await page.goto(pageUrl);
  const title = 'HPE Pathfinder | Startup Partnerships & Investment';
  await expect(page).toHaveTitle(title);
  await expect(page.locator('link[rel="canonical"], link[rel="sitemap"], meta[property="og:url"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  expect(await page.locator('head').innerHTML()).toContain('<!-- <meta name="robots" content="index, follow, max-image-preview:large"> -->');
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description.length).toBeGreaterThan(100);
  expect(description.length).toBeLessThanOrEqual(160);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const imageUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(imageUrl).toBe('assets/hero-background.png');
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', imageUrl);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'assets/favicon.svg');
  const structuredData = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(structuredData).toMatchObject({
    '@context': 'https://schema.org', '@type': 'WebPage', name: title,
    description, inLanguage: 'en-US', publisher: { '@type': 'Organization', name: 'Hewlett Packard Enterprise' }
  });
  expect(structuredData).not.toHaveProperty('url');
  await page.evaluate(async imagePath => {
    for (const source of [document.querySelector('link[rel="icon"]').href, new URL(imagePath, location.href).href]) {
      const image = new Image();
      image.src = source;
      await image.decode();
      if (!image.naturalWidth) throw new Error(`Invalid image: ${source}`);
    }
  }, imageUrl);
});

test('site resources are directory-relative and external links stay on HPE', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(pageUrl);
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
    await Promise.all([...document.images].map(image => image.decode()));
    await document.fonts.ready;
  });
  const resources = await page.locator('[src], [data-src], link[href]').evaluateAll(elements =>
    elements.flatMap(element => ['src', 'data-src', 'href'].filter(attribute => element.hasAttribute(attribute)).map(attribute => element.getAttribute(attribute)))
  );
  expect(resources.length).toBeGreaterThan(0);
  for (const resource of resources) expect(resource).not.toMatch(/^(?:[a-z][a-z\d+.-]*:|\/)/i);
  const directory = new URL('./', pageUrl).href;
  expect(requests.filter(url => url !== pageUrl && !url.startsWith(directory))).toEqual([]);
  const links = await page.locator('a[href]').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
  for (const link of links) {
    expect(link.startsWith('#') || link === 'mailto:pathfinder@hpe.com' || link.startsWith('https://www.hpe.com/')).toBe(true);
  }
});

test('public page opens directly and preserves section links across reloads', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage unavailable'); } });
  });
  await page.goto(`${pageUrl}#programs`);
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.locator('#login, input[type="password"]')).toHaveCount(0);
  await expect(page.locator('#programs')).toBeInViewport();
  await page.reload();
  await expect(page.locator('#programs')).toBeInViewport();
  expect(errors).toEqual([]);
});

test('page content is available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(pageUrl);
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await page.locator('.hero').getByRole('link', { name: 'Find your path', exact: true }).click();
    await expect(page.locator('#find-your-path')).toBeInViewport();
  } finally {
    await context.close();
  }
});