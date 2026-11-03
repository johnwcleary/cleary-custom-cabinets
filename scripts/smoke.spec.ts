/**
 * Smoke tests, run against the built site on every branch:
 *
 *   npm run build && npm run smoke
 */
import { test, expect, type Page } from '@playwright/test';
import { routes } from './routes.ts';

const BLOCKED_HOSTS = /squarespace-cdn\.com|squarespace\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net|fontawesome/;

function watch(page: Page) {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol.startsWith('http')) external.push(r.url());
  });
  return { errors, external };
}

for (const r of routes()) {
  test(`${r.path} renders cleanly`, async ({ page }) => {
    const { errors, external } = watch(page);
    const res = await page.goto(r.path, { waitUntil: 'networkidle' });
    expect(res?.status(), 'status').toBe(200);
    await expect(page.locator('h1'), 'exactly one <h1>').toHaveCount(1);
    await expect(page.locator('main'), 'main landmark').toHaveCount(1);
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('footer').first()).toBeVisible();
    // Scroll so lazy images request their sources.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 800) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 20));
      }
    });
    await page.waitForLoadState('networkidle');
    const missingAlt = await page.$$eval('img', (imgs) => imgs.filter((i) => !(i.getAttribute('alt') ?? '').trim()).map((i) => i.outerHTML.slice(0, 120)));
    expect(missingAlt, 'every <img> has non-empty alt').toEqual([]);
    expect(external.filter((u) => BLOCKED_HOSTS.test(u)), 'no Squarespace or font-CDN requests').toEqual([]);
    expect(external, 'no third-party requests at all').toEqual([]);
    expect(errors, 'no console errors').toEqual([]);
    const phone = page.locator('header a[href^="tel:"]');
    expect(await phone.count(), 'phone link in header (or mobile menu)').toBeGreaterThan(0);
  });
}

test('404 page has one h1 and a 404 status', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('keyboard: skip link, nav and visible focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(first).toMatch(/skip/i);
  const invisible: string[] = [];
  for (let i = 0; i < 14; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const visible = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none' || cs.textDecorationLine.includes('underline');
      return { visible, label: `${el.tagName} ${el.textContent?.trim().slice(0, 40) ?? ''}` };
    });
    if (info && !info.visible) invisible.push(info.label);
    await page.keyboard.press('Tab');
  }
  expect(invisible, 'focused elements without a visible focus style').toEqual([]);
});

test('keyboard: gallery lightbox opens, steps, closes and returns focus', async ({ page }) => {
  const service = routes().find((r) => r.path.startsWith('/cabinets/'))!;
  await page.goto(service.path);
  const triggers = page.locator('a[data-lightbox]');
  expect(await triggers.count()).toBeGreaterThan(5);
  const first = triggers.first();
  await first.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('dialog[data-lightbox-dialog]');
  await expect(dialog).toHaveAttribute('open', '');
  const caption = dialog.locator('[data-lb-caption]');
  const before = await caption.textContent();
  expect(before?.trim()).toBeTruthy();
  await expect(dialog.locator('img')).toHaveAttribute('alt', before!);
  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('[data-lb-count]')).toContainText('2 /');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.locator('[data-lb-count]')).toContainText('1 /');
  // Focus stays inside the modal dialog while tabbing.
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open', '');
  expect(await first.evaluate((el) => el === document.activeElement)).toBe(true);
});

test('keyboard: contact form fields are reachable and labelled', async ({ page }) => {
  await page.goto('/contact');
  const form = page.locator('form[data-form-backend="todo-phase-2"]');
  await expect(form).toHaveCount(1);
  for (const name of ['name', 'email', 'phone', 'message']) {
    const field = form.locator(`[name="${name}"]`);
    await expect(field).toHaveCount(1);
    const id = await field.getAttribute('id');
    await expect(form.locator(`label[for="${id}"]`)).toHaveCount(1);
  }
  await expect(form.locator('[name="company"]')).toHaveAttribute('tabindex', '-1');
  await expect(page.getByText('Please do not include links')).toBeVisible();
});

test('reduced motion: no transitions or animations run', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const path of ['/', routes()[1].path]) {
    await page.goto(path);
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll('*')]
        .map((el) => {
          const cs = getComputedStyle(el);
          const t = Math.max(...cs.transitionDuration.split(',').map(parseFloat));
          const a = cs.animationName !== 'none' ? Math.max(...cs.animationDuration.split(',').map(parseFloat)) : 0;
          return { el: `${el.tagName}.${(el as HTMLElement).className}`.slice(0, 60), t, a };
        })
        .filter((x) => x.t > 0.02 || x.a > 0.02),
    );
    expect(moving, `moving elements on ${path}`).toEqual([]);
  }
  await context.close();
});
