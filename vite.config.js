import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployment base path.
//
// GitHub Pages serves the site under /caking-game/ (the repository name), while
// Cloudflare Pages, Netlify and `vite preview` serve it at the host root. Rather
// than hard-coding either, detect the host and allow an explicit override:
//
//   BASE_PATH=/ vite build     -> root build (or `npm run build:root`)
//   npm run build              -> GitHub Pages build
//
// CF_PAGES and NETLIFY are set automatically by those platforms, so deploying
// there needs no build configuration at all. See docs/deployment-policy.md.
const hostDefault = process.env.CF_PAGES || process.env.NETLIFY ? '/' : '/caking-game/'
const base = process.env.BASE_PATH || hostDefault

/** Every shipped file, sorted, so the digest below is stable across builds. */
function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, root, out)
    else out.push(relative(root, full).split('\\').join('/'))
  }
  return out
}

/**
 * Write the hashed bundle filenames, and a digest of the whole build, into the
 * service worker.
 *
 * The bundles are requested before the worker takes control on a first visit,
 * so they never pass through its fetch handler. Precaching them by name is what
 * makes an offline relaunch work after a single visit rather than two.
 *
 * The digest becomes the cache name. Audio and images ship on stable URLs and
 * are served cache-first, so without a name that moves when they do, replacing
 * an mp3 would never reach anyone who already has the old one cached.
 */
function precacheManifest() {
  let assets = []
  let outDir = 'dist'
  return {
    name: 'caking-precache-manifest',
    apply: 'build',
    configResolved(config) {
      // Resolved from the config rather than __dirname, which an ESM config does
      // not define on its own.
      outDir = resolve(config.root, config.build.outDir)
    },
    generateBundle(_options, bundle) {
      assets = Object.keys(bundle).filter((file) => /\.(js|css)$/.test(file))
    },
    closeBundle() {
      const target = resolve(outDir, 'sw.js')
      const source = readFileSync(target, 'utf8')

      // Digest every shipped file except the worker itself, which is about to
      // change precisely because of this digest.
      const digest = createHash('sha256')
      for (const file of walk(outDir)) {
        if (file === 'sw.js') continue
        digest.update(file)
        digest.update(readFileSync(join(outDir, file)))
      }
      const buildId = digest.digest('hex').slice(0, 12)

      let replaced = source.replace('"__BUILD_ASSETS__"', JSON.stringify(assets))
      if (replaced === source) {
        this.warn('service worker precache placeholder not found — offline start-up may break')
      }
      const withId = replaced.replace('"__BUILD_ID__"', JSON.stringify(buildId))
      if (withId === replaced) {
        this.warn('service worker build-id placeholder not found — asset updates may not reach players')
      }
      replaced = withId

      writeFileSync(target, replaced)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), precacheManifest()],
  base,
})
