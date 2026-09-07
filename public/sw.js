/* Minimal offline shell for CAKING! — safe fallbacks if cache misses */

// Replaced at build time with a hash of everything in dist/, by the
// precache-manifest plugin in vite.config.js.
//
// The fetch handler below is cache-first, and audio and images are served from
// stable URLs rather than content-hashed ones. A fixed cache name would there-
// fore pin existing players to the audio they first downloaded: swapping
// shop-bgm.mp3 for a better take would never reach them. Deriving the name from
// the build's contents means any changed file — a bundle, an mp3 imported by
// scripts/import_audio.py, an image — produces a new cache, and `activate`
// drops the old one.
const BUILD_ID = "__BUILD_ID__";
const CACHE = "caking-shell-" + (BUILD_ID.startsWith("__") ? "dev" : BUILD_ID);
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
  BASE + "favicon.svg",
  BASE + "icons/icon-192.png",
  BASE + "icons/apple-touch-icon.png",
  BASE + "icons/icon-512.png",
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
      cache.addAll(PRECACHE)
    )
  );
  // Activate after existing game windows close; never replace a running session.
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
        caches.open(CACHE).then((cache) => cache.match(BASE + "index.html", MATCH))
      )
    );
    return;
  }
  event.respondWith(
    caches.open(CACHE).then((cache) => cache.match(req, MATCH)).then((cached) => cached || fetch(req).then((response) => {
      if (req.method === "GET" && response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
      }
      return response;
    }))
  );
});
