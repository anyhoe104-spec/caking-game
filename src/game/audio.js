// Audio bus for CAKING.
//
// BGM runs through the Web Audio API: decoded buffers loop without the gap an
// <audio loop> leaves behind, and a GainNode per track gives real crossfades.
// One-shots share the same graph so a single master gain covers everything.
// Browsers without AudioContext fall back to HTMLAudioElement with an interval
// volume ramp — fewer niceties, but the game still makes noise.

import { assetUrl, BGM_KEYS, EAGER_SE } from "./audioAssets.js";
import { channelGain } from "./audioSettings.js";

const FADE_IN = 1.1;
const FADE_OUT = 0.75;

export class AudioBus {
  constructor(base = "/") {
    this.base = base;
    this.settings = null;
    this.ctx = null;
    this.master = null;
    this.gains = {};
    this.buffers = new Map();
    this.current = null; // { scene, source, gain }
    this.pendingScene = null;
    this.unlocked = false;
    this.fallback = new Map();
    this.fallbackBgm = null;
    this.activeVoice = null;
    this.loopLengths = null; // key -> exact pre-encode seconds, from the manifest
    this.supported = typeof window !== "undefined" && Boolean(window.AudioContext || window.webkitAudioContext);
  }

  // ── Lifecycle ──────────────────────────────────────────────

  /** Must run inside a user gesture; browsers keep the context suspended otherwise. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.supported) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        for (const channel of ["bgm", "se", "voice"]) {
          const gain = this.ctx.createGain();
          gain.connect(this.master);
          this.gains[channel] = gain;
        }
        this.applySettings();
      } catch {
        this.supported = false;
      }
    }
    this.resume();
    this.#loadManifest();
    EAGER_SE.forEach((key) => this.#buffer(key).catch(() => {}));
    if (this.pendingScene) {
      const scene = this.pendingScene;
      this.pendingScene = null;
      this.playBgm(scene);
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {});
  }

  suspend() {
    if (this.ctx?.state === "running") this.ctx.suspend().catch(() => {});
    this.fallbackBgm?.pause();
  }

  configure(audioSettings) {
    this.settings = audioSettings;
    this.applySettings();
  }

  applySettings() {
    if (!this.settings) return;
    const bgm = channelGain(this.settings, "bgm");
    if (this.ctx) {
      this.master.gain.value = 1;
      this.gains.bgm.gain.value = bgm;
      this.gains.se.gain.value = channelGain(this.settings, "se");
      this.gains.voice.gain.value = channelGain(this.settings, "voice");
    }
    if (this.fallbackBgm) this.fallbackBgm.volume = bgm;
    // A muted context can stay suspended; unmuting has to wake it back up.
    if (bgm > 0) this.resume();
  }

  /** Tear the graph down but stay reusable — React StrictMode remounts in dev. */
  dispose() {
    this.stopBgm({ fade: 0 });
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.gains = {};
    this.buffers.clear();
    this.unlocked = false;
  }

  // ── BGM ────────────────────────────────────────────────────

  async playBgm(scene, { fade = FADE_IN } = {}) {
    if (!scene || !BGM_KEYS[scene]) return;
    if (this.current?.scene === scene) return;
    if (!this.unlocked) {
      this.pendingScene = scene;
      return;
    }
    if (!this.ctx) return this.#playBgmFallback(scene, fade);

    this.stopBgm({ fade: FADE_OUT });
    // Claim the slot before awaiting so rapid scene changes cannot double-start.
    const token = { scene };
    this.current = token;
    let buffer;
    try {
      buffer = await this.#buffer(BGM_KEYS[scene]);
    } catch {
      if (this.current === token) this.current = null;
      return;
    }
    if (this.current !== token) return;

    const gain = this.ctx.createGain();
    gain.connect(this.gains.bgm);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    // decodeAudioData leaves a few ms of MP3 frame padding on the tail. The
    // manifest knows the exact musical length, so loop to that instead and the
    // seam stays sample-accurate.
    const exact = this.loopLengths?.[BGM_KEYS[scene]];
    if (exact && exact < buffer.duration) {
      source.loopStart = 0;
      source.loopEnd = exact;
    }
    source.connect(gain);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1, now + Math.max(0.02, fade));
    source.start(now);
    this.current = { scene, source, gain };
  }

  stopBgm({ fade = FADE_OUT } = {}) {
    const playing = this.current;
    this.current = null;
    if (!playing?.source) {
      this.#stopFallbackBgm(fade);
      return;
    }
    const { source, gain } = playing;
    const now = this.ctx.currentTime;
    if (fade > 0) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      source.stop(now + fade + 0.05);
    } else {
      try { source.stop(); } catch { /* already stopped */ }
    }
    source.onended = () => gain.disconnect();
  }

  // ── One-shots ──────────────────────────────────────────────

  play(key, channel = "se", { volume = 1 } = {}) {
    if (!key || !this.unlocked) return;
    if (channelGain(this.settings, channel) === 0) return;
    if (!this.ctx) return this.#playFallback(key, channel, volume);
    this.resume();
    this.#buffer(key)
      .then((buffer) => {
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        gain.connect(this.gains[channel]);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        source.onended = () => gain.disconnect();
        source.start();
        if (channel === "voice") {
          this.activeVoice?.stop?.();
          this.activeVoice = source;
        }
      })
      .catch(() => {});
  }

  /** Voice lines never stack: a new line cuts the previous one off. */
  playVoice(key) {
    if (!key) return;
    if (this.ctx && this.activeVoice) {
      try { this.activeVoice.stop(); } catch { /* already finished */ }
      this.activeVoice = null;
    }
    this.play(key, "voice");
  }

  /** Warm the cache for a scene the player is about to reach. */
  prefetch(keys) {
    if (!this.unlocked) return;
    keys.forEach((key) => this.#buffer(key).catch(() => {}));
  }

  // ── Internals ──────────────────────────────────────────────

  #loadManifest() {
    if (this.loopLengths) return;
    this.loopLengths = {};
    fetch(`${this.base}sounds/manifest.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((manifest) => {
        for (const asset of manifest?.assets ?? []) {
          if (asset.kind === "bgm" && asset.seconds) {
            this.loopLengths[asset.file.replace(/\.mp3$/, "")] = asset.seconds;
          }
        }
      })
      .catch(() => {}); // whole-buffer looping is a fine fallback
  }

  #buffer(key) {
    const url = assetUrl(this.base, key);
    if (!this.buffers.has(url)) {
      const promise = fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`audio ${response.status}`);
          return response.arrayBuffer();
        })
        .then((data) => this.ctx.decodeAudioData(data))
        .catch((error) => {
          this.buffers.delete(url); // allow a retry after a transient failure
          throw error;
        });
      this.buffers.set(url, promise);
    }
    return this.buffers.get(url);
  }

  #element(key) {
    const url = assetUrl(this.base, key);
    if (!this.fallback.has(url)) this.fallback.set(url, url);
    const audio = new Audio(url);
    audio.preload = "auto";
    return audio;
  }

  #playFallback(key, channel, volume) {
    try {
      const audio = this.#element(key);
      audio.volume = channelGain(this.settings, channel) * volume;
      audio.play().catch(() => {});
      if (channel === "voice") {
        this.activeVoice?.pause?.();
        this.activeVoice = audio;
      }
    } catch { /* audio unavailable */ }
  }

  #playBgmFallback(scene, fade) {
    this.#stopFallbackBgm(FADE_OUT);
    try {
      const audio = this.#element(BGM_KEYS[scene]);
      audio.loop = true;
      const target = channelGain(this.settings, "bgm");
      audio.volume = 0;
      audio.play().catch(() => {});
      this.fallbackBgm = audio;
      this.current = { scene };
      rampVolume(audio, target, fade);
    } catch { /* audio unavailable */ }
  }

  #stopFallbackBgm(fade) {
    const audio = this.fallbackBgm;
    if (!audio) return;
    this.fallbackBgm = null;
    rampVolume(audio, 0, fade, () => audio.pause());
  }
}

function rampVolume(audio, target, seconds, done) {
  const steps = Math.max(1, Math.round(seconds * 25));
  const from = audio.volume;
  let step = 0;
  const timer = setInterval(() => {
    step += 1;
    const ratio = step / steps;
    try {
      audio.volume = Math.min(1, Math.max(0, from + (target - from) * ratio));
    } catch { /* element gone */ }
    if (step >= steps) {
      clearInterval(timer);
      done?.();
    }
  }, 40);
}

/** One bus per document. The game never runs two instances side by side. */
export const audioBus = new AudioBus(import.meta.env.BASE_URL);
