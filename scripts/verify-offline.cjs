// Run after npm run build (or build:root). Uses the installed Playwright browser.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const { preview } = await import(pathToFileURL(path.join(ROOT, 'node_modules/vite/dist/node/index.js')).href);
  const base = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8').includes('/caking-game/assets/') ? '/caking-game/' : '/';
  const server = await preview({ root: ROOT, base, preview: { host: '127.0.0.1', port: 5174 } });
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE,
      args: process.env.PLAYWRIGHT_EXECUTABLE ? ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [] });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:5174${base}`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    });
    await page.getByText('スキップ', { exact: true }).click();
    await page.getByRole('button', { name: '営業スタート！' }).click();
    await page.getByRole('button', { name: '一時停止', exact: true }).click();
    const saved = await page.evaluate(() => localStorage.getItem('caking-save-v4'));
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: '工房を再開する' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('caking-save-v4')), saved);
    await page.getByRole('button', { name: '工房を再開する' }).click();
    const images = fs.readdirSync(path.join(ROOT, 'public/images'), { recursive: true }).filter(f => /\.png$/.test(f)).map(f => `images/${f}`);
    images.push('icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'favicon.svg');
    const results = await page.evaluate(async ({ images, base }) => Promise.all(images.map(async file => {
      const img = new Image(); img.src = `${base}${file}`;
      try { await img.decode(); return img.naturalWidth > 0; } catch { return false; }
    })), { images, base });
    assert.ok(results.every(Boolean), `offline images failed: ${images.filter((_, i) => !results[i])}`);
    for (const name of ['レシピ', 'デコレーション', '食材', 'スタッフ']) await page.getByRole('button', { name, exact: true }).click();
    assert.deepEqual(errors, []);
    console.log(`PASS: ${base} offline relaunch, save preservation, four tabs and ${images.length} decoded images`);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.httpServer.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
