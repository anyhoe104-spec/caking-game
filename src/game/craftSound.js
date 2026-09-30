// Original procedural foley: no recordings, downloads or recurring timers.
// Each gesture fits inside one production step and stops when that step leaves.
const PROFILES = {
  whisk: [0.62, 2100, 0.11, 5, 0],
  oven: [0.58, 380, 0.15, 1, 880],
  steam: [0.65, 1700, 0.08, 2, 0],
  roll: [0.6, 600, 0.13, 2, 0],
  fold: [0.55, 850, 0.12, 3, 0],
  layer: [0.48, 430, 0.1, 2, 520],
  decorate: [0.6, 2600, 0.055, 4, 1175],
  glaze: [0.6, 1200, 0.08, 1, 0],
  cool: [0.6, 3200, 0.045, 2, 1568],
};
export const CRAFT_SOUND_KINDS = Object.keys(PROFILES);
export function craftSoundSamples(kind, sampleRate) {
  const profile = PROFILES[kind];
  if (!profile) return null;
  const [duration, cutoff, volume, strokes, bell] = profile;
  const samples = new Float32Array(Math.ceil(duration * sampleRate));
  const alpha = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
  let seed = 71423, low = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate, progress = t / duration;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    low += alpha * ((seed / 2147483648 - 1) - low);
    const gesture = Math.sin(Math.PI * ((progress * strokes) % 1)) ** 2;
    const edge = Math.min(1, t / 0.012, (duration - t) / 0.045);
    const tone = bell ? (Math.sin(2 * Math.PI * bell * t) + 0.25 * Math.sin(2 * Math.PI * bell * 2.76 * t)) * Math.exp(-t * 12) * 0.32 : 0;
    samples[i] = (low * gesture + tone) * volume * edge;
  }
  return samples;
}

export function playCraftSound(ctx, destination, kind) {
  const samples = craftSoundSamples(kind, ctx.sampleRate);
  if (!samples) return undefined;
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buffer.copyToChannel(samples, 0);
  const source = ctx.createBufferSource();
  const envelope = ctx.createGain();
  source.buffer = buffer;
  source.connect(envelope);
  envelope.connect(destination);
  source.onended = () => { source.disconnect(); envelope.disconnect(); };
  source.start();
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    // Fade cancellation at skips, pause, unmount and stage transitions.
    const now = ctx.currentTime;
    envelope.gain.setTargetAtTime(0, now, 0.005);
    try { source.stop(now + 0.025); } catch { /* already ended */ }
  };
}
