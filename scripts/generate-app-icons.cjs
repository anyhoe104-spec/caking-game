// Deterministic exports of the source SVG; no fonts or external artwork required.
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public/icons/icon-512.svg');
(async () => {
  for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180]]) {
    await sharp(source).resize(size, size).png().toFile(path.join(root, `public/icons/${name}.png`));
  }
  const nativeFiles = ['android/app/src/main/res', 'ios/App/App/Assets.xcassets'].flatMap(dir =>
    fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir), { recursive: true }).filter(f => f.endsWith('.png')).map(f => path.join(root, dir, f)) : []);
  for (const target of nativeFiles) {
    const { width, height } = await sharp(target).metadata();
    if (target.includes('splash')) {
      const size = Math.round(Math.min(width, height) * .28);
      const logo = await sharp(source).resize(size, size).png().toBuffer();
      await sharp({ create: { width, height, channels: 3, background: '#fff8ec' } }).composite([{ input: logo, gravity: 'centre' }]).png().toFile(target + '.tmp');
    } else if (target.includes('foreground')) {
      const size = Math.round(width * .66);
      const logo = await sharp(source).resize(size, size).png().toBuffer();
      await sharp({ create: { width, height, channels: 4, background: '#fff8ec' } }).composite([{ input: logo, gravity: 'centre' }]).png().toFile(target + '.tmp');
    } else {
      await sharp(source).resize(width, height).flatten({ background: '#fff8ec' }).png().toFile(target + '.tmp');
    }
    fs.renameSync(target + '.tmp', target);
  }
  console.log(`Exported 3 web icons and ${nativeFiles.length} native icons/splashes`);
})().catch(error => { console.error(error); process.exitCode = 1; });
