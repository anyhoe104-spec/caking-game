// Pure audio-settings model. Kept free of Web Audio so it stays unit-testable.

export const AUDIO_CHANNELS = ["bgm", "se", "voice"];

export const DEFAULT_AUDIO = {
  masterMuted: false,
  bgmMuted: false,
  seMuted: false,
  voiceMuted: false,
  bgmVolume: 0.55,
  seVolume: 0.8,
  voiceVolume: 0.85,
  reducedMotion: false,
};

const clamp01 = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
};

const asBool = (value, fallback) => (typeof value === "boolean" ? value : fallback);

/**
 * Normalise a stored audio block, folding in the pre-v4 `soundOn` / `bgmOn`
 * flags so a returning player keeps the mute state they chose.
 */
export function normalizeAudio(raw, legacy = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const legacySound = legacy.soundOn === false;
  const legacyBgm = legacy.bgmOn === false;
  return {
    masterMuted: asBool(source.masterMuted, DEFAULT_AUDIO.masterMuted),
    bgmMuted: asBool(source.bgmMuted, legacyBgm),
    seMuted: asBool(source.seMuted, legacySound),
    voiceMuted: asBool(source.voiceMuted, legacySound),
    bgmVolume: clamp01(source.bgmVolume, DEFAULT_AUDIO.bgmVolume),
    seVolume: clamp01(source.seVolume, DEFAULT_AUDIO.seVolume),
    voiceVolume: clamp01(source.voiceVolume, DEFAULT_AUDIO.voiceVolume),
    reducedMotion: asBool(source.reducedMotion, DEFAULT_AUDIO.reducedMotion),
  };
}

/** Effective gain for a channel, 0 when muted at any level. */
export function channelGain(audio, channel) {
  const settings = normalizeAudio(audio);
  if (settings.masterMuted) return 0;
  if (settings[`${channel}Muted`]) return 0;
  return settings[`${channel}Volume`] ?? 0;
}

export function toggleMute(audio, channel) {
  const settings = normalizeAudio(audio);
  const key = channel === "master" ? "masterMuted" : `${channel}Muted`;
  return { ...settings, [key]: !settings[key] };
}

export function setVolume(audio, channel, value) {
  const settings = normalizeAudio(audio);
  const volume = clamp01(value, settings[`${channel}Volume`]);
  // Nudging a slider off zero is an implicit "unmute this channel".
  const unmute = volume > 0 ? { [`${channel}Muted`]: false } : {};
  return { ...settings, [`${channel}Volume`]: volume, ...unmute };
}

/** True when every audible channel is silent — drives the header icon. */
export function isFullyMuted(audio) {
  return AUDIO_CHANNELS.every((channel) => channelGain(audio, channel) === 0);
}
