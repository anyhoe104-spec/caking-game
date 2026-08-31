/* Minimal offline shell for CAKING! — safe fallbacks if cache misses */
const CACHE = "caking-shell-v5";
// Derived from where this file is served, so the same worker runs under the
// GitHub Pages sub-path (/caking-game/) and at a host root (/) unchanged.
const BASE = new URL("./", self.location).pathname;
// Replaced at build time with the hashed bundle filenames by the
// precache-manifest plugin in vite.config.js. Without these, the very first
// visit caches index.html but not the JS/CSS it needs — the bundles are
// requested before this worker takes control, so they never reach the fetch
// handler — and an offline relaunch renders a blank page.
const BUILD_ASSETS = "__BUILD_ASSETS__";

const PRECACHE = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "icons/icon-192.svg",
  BASE + "icons/icon-512.svg",
  ...(Array.isArray(BUILD_ASSETS) ? BUILD_ASSETS.map((file) => BASE + file) : []),
];

// Hosts commonly answer static files with `Vary: Origin`, and Vite emits its
// module script with `crossorigin` — so the page requests the bundle *with* an
// Origin header while the precache fetched it *without* one. Honouring Vary
// would miss every one of those, leaving an offline launch with no JS at all.
// Each asset here has exactly one representation, so varying is meaningless.
const MATCH = { ignoreVary: true };

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch(() => {})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("caking-shell-") && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches
          .match(BASE + "index.html", MATCH)
          .then((r) => r || caches.match(BASE, MATCH))
      )
    );
    return;
  }
  event.respondWith(
    caches.match(req, MATCH).then((cached) => cached || fetch(req).then((response) => {
      if (req.method === "GET" && response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
      }
      return response;
    }))
  );
});
