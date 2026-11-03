/**
 * Build, serve dist/, and take full-page screenshots of every route at desktop and mobile.
 *
 *   node scripts/screenshot.ts [--no-build]
 *
 * Output: screenshots/<branch>/<route>-<viewport>.png
 */
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { routes } from './routes.ts';
import { serve } from './serve.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = 4399;
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim();
if (!process.argv.includes('--no-build')) execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

const server = await serve(PORT);
const browser = await chromium.launch();
const outDir = path.join(ROOT, 'screenshots', branch);
await mkdir(outDir, { recursive: true });

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const r of routes()) {
    await page.goto(`http://127.0.0.1:${PORT}${r.path}`, { waitUntil: 'networkidle' });
    // Trigger lazy images, then return to the top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    // Wait for rendered images (lazy images inside display:none never load), capped at 5s.
    await page.evaluate(() =>
      Promise.race([
        Promise.all(
          [...document.images]
            .filter((i) => !i.complete && i.getClientRects().length > 0)
            .map((i) => new Promise((r) => (i.onload = i.onerror = r))),
        ),
        new Promise((r) => setTimeout(r, 5000)),
      ]),
    );
    const file = path.join(outDir, `${r.name}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(path.relative(ROOT, file));
  }
  await context.close();
}

await browser.close();
server.close();
