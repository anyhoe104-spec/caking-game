import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

/**
 * Write the hashed bundle filenames into the service worker's precache list.
 *
 * The bundles are requested before the worker takes control on a first visit,
 * so they never pass through its fetch handler. Precaching them by name is what
 * makes an offline relaunch work after a single visit rather than two.
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
      const replaced = source.replace('"__BUILD_ASSETS__"', JSON.stringify(assets))
      if (replaced === source) {
        this.warn('service worker precache placeholder not found — offline start-up may break')
      }
      writeFileSync(target, replaced)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), precacheManifest()],
  base,
})
