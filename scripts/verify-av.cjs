const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const { createServer } = await import(pathToFileURL(path.join(ROOT, 'node_modules/vite/dist/node/index.js')));
  const server = await createServer({ root: ROOT, server: { host: '127.0.0.1', port: 5183 }, logLevel: 'silent' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE, headless: true,
    args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5183/caking-game/');
    await page.getByText('スキップ', { exact: true }).click();
    if (process.env.STORY_QA_FONT) {
      const font = fs.readFileSync(process.env.STORY_QA_FONT).toString('base64');
      await page.addStyleTag({ content: `@font-face{font-family:QA;src:url(data:font/woff2;base64,${font})}body,button,.shopPlaque strong,.shopCaption{font-family:QA,sans-serif!important}` });
      await page.evaluate(() => document.fonts.ready);
    }
    const output = process.env.ATELIER_QA_DIR;
    if (output) fs.mkdirSync(output, { recursive: true });
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(await page.locator('.atelierScenery').count(), 1);
      if (output) await page.locator('.shopDiorama').screenshot({ path: path.join(output, `shop-${width}.png`) });
    }
    // Exercise the real bus, with real audio nodes; intercept only new foley sources.
    const result = await page.evaluate(async () => {
      const { audioBus: bus } = await import('/caking-game/src/game/audio.js');
      const { CRAFT_SOUND_KINDS } = await import('/caking-game/src/game/craftSound.js');
      const original = bus.ctx.createBufferSource.bind(bus.ctx), sources = [];
      bus.ctx.createBufferSource = () => { const source = original(); sources.push(source); return source; };
      const ends = [];
      for (const kind of CRAFT_SOUND_KINDS) {
        const stop = bus.playCraft(kind);
        const source = sources.at(-1);
        const ended = new Promise(resolve => source.addEventListener('ended', () => resolve(true), { once: true }));
        stop(); stop(); ends.push(await ended);
      }
      const count = sources.length;
      const settings = bus.settings;
      bus.configure({ ...settings, seMuted: true });
      const muted = bus.playCraft('whisk') === undefined && sources.length === count;
      bus.configure(settings);
      await bus.ctx.suspend();
      const paused = bus.playCraft('oven') === undefined && sources.length === count;
      await bus.ctx.resume();
      bus.ctx.createBufferSource = original;
      const calls = []; const play = bus.playCraft.bind(bus);
      bus.playCraft = kind => { calls.push(kind); return play(kind); };
      window.__craftCues = calls;
      return { muted, paused, ends };
    });
    assert.equal(result.muted, true); assert.equal(result.paused, true); assert.equal(result.ends.length, 9);
    await page.getByRole('button', { name: 'ミフィとケーキをつくる' }).click();
    await page.getByRole('button', { name: 'つくる', exact: true }).first().click();
    await page.getByRole('button', { name: '工房にもどる', exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => window.__craftCues), ['whisk', 'oven', 'layer']);
    if (output) await page.locator('.productionCard').screenshot({ path: path.join(output, 'reveal.png') });
    await page.getByRole('button', { name: '工房にもどる', exact: true }).click();
    await page.getByRole('button', { name: '営業', exact: true }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.atelierHerbs').evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.deepEqual(errors, []);
    console.log('PASS: 3 widths, 9 cues/cancellation, mute, suspend, 3-stage sync, reduced motion, no page errors');
  } finally { await browser.close(); await server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
