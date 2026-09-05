"""Character voice cues for ミフィ and ミル.

These are *formant-synthesised pseudo-voices* — the "animalese" technique used
by cute life-sim games. Each line is written in kana, split into morae, and each
mora is rendered as a Japanese vowel (correct F1/F2/F3 formants) with a
consonant onset and a pitch-accent contour. The result reads as speech-shaped
character chatter with the right rhythm and intonation without being
intelligible words, so no TTS model or voice licence is involved.

To swap in real voice acting later, replace the generated files with recordings
of the ``text`` field of each line — see docs/audio-generation.md.
"""

from __future__ import annotations

import numpy as np

from .synth import (
    SR,
    add_at,
    bandpass,
    fade_edges,
    highpass,
    lowpass,
    normalize,
    perc_env,
    reverb,
    soft_limit,
    stereo,
)

# Japanese vowel formants (F1, F2, F3) for a young female voice.
VOWELS = {
    "a": (850.0, 1350.0, 2900.0),
    "i": (320.0, 2750.0, 3400.0),
    "u": (360.0, 1250.0, 2650.0),
    "e": (520.0, 2350.0, 3050.0),
    "o": (520.0, 900.0, 2750.0),
}

# kana -> (consonant class, vowel). "N" = moraic ん, "Q" = geminate っ.
KANA = {
    "あ": ("", "a"), "い": ("", "i"), "う": ("", "u"), "え": ("", "e"), "お": ("", "o"),
    "か": ("k", "a"), "き": ("k", "i"), "く": ("k", "u"), "け": ("k", "e"), "こ": ("k", "o"),
    "が": ("g", "a"), "ぎ": ("g", "i"), "ぐ": ("g", "u"), "げ": ("g", "e"), "ご": ("g", "o"),
    "さ": ("s", "a"), "し": ("sh", "i"), "す": ("s", "u"), "せ": ("s", "e"), "そ": ("s", "o"),
    "ざ": ("z", "a"), "じ": ("j", "i"), "ず": ("z", "u"), "ぜ": ("z", "e"), "ぞ": ("z", "o"),
    "た": ("t", "a"), "ち": ("ch", "i"), "つ": ("ts", "u"), "て": ("t", "e"), "と": ("t", "o"),
    "だ": ("d", "a"), "で": ("d", "e"), "ど": ("d", "o"),
    "な": ("n", "a"), "に": ("n", "i"), "ぬ": ("n", "u"), "ね": ("n", "e"), "の": ("n", "o"),
    "は": ("h", "a"), "ひ": ("h", "i"), "ふ": ("f", "u"), "へ": ("h", "e"), "ほ": ("h", "o"),
    "ば": ("b", "a"), "び": ("b", "i"), "ぶ": ("b", "u"), "べ": ("b", "e"), "ぼ": ("b", "o"),
    "ぱ": ("p", "a"), "ぴ": ("p", "i"), "ぷ": ("p", "u"), "ぺ": ("p", "e"), "ぽ": ("p", "o"),
    "ま": ("m", "a"), "み": ("m", "i"), "む": ("m", "u"), "め": ("m", "e"), "も": ("m", "o"),
    "や": ("y", "a"), "ゆ": ("y", "u"), "よ": ("y", "o"),
    "ら": ("r", "a"), "り": ("r", "i"), "る": ("r", "u"), "れ": ("r", "e"), "ろ": ("r", "o"),
    "わ": ("w", "a"), "を": ("", "o"),
    "ん": ("N", ""), "っ": ("Q", ""), "ー": (":", ""),
}
# Digraphs are checked before single kana.
DIGRAPHS = {
    "きゃ": ("ky", "a"), "きゅ": ("ky", "u"), "きょ": ("ky", "o"),
    "しゃ": ("sh", "a"), "しゅ": ("sh", "u"), "しょ": ("sh", "o"),
    "ちゃ": ("ch", "a"), "ちゅ": ("ch", "u"), "ちょ": ("ch", "o"),
    "にゃ": ("ny", "a"), "にゅ": ("ny", "u"), "にょ": ("ny", "o"),
    "ひゃ": ("h", "a"), "ひゅ": ("h", "u"), "ひょ": ("h", "o"),
    "みゃ": ("m", "a"), "みゅ": ("m", "u"), "みょ": ("m", "o"),
    "りゃ": ("r", "a"), "りゅ": ("r", "u"), "りょ": ("r", "o"),
    "ぎゃ": ("g", "a"), "ぎゅ": ("g", "u"), "ぎょ": ("g", "o"),
    "じゃ": ("j", "a"), "じゅ": ("j", "u"), "じょ": ("j", "o"),
    "びゃ": ("b", "a"), "びゅ": ("b", "u"), "びょ": ("b", "o"),
    "ぴゃ": ("p", "a"), "ぴゅ": ("p", "u"), "ぴょ": ("p", "o"),
}

# Consonant class -> (onset seconds, kind, filter centre, filter width)
ONSETS = {
    "":   (0.000, None,      0, 0),
    "k":  (0.048, "burst",   2200, 2600),
    "g":  (0.030, "burst",   1500, 1800),
    "t":  (0.044, "burst",   3400, 3000),
    "d":  (0.028, "burst",   1900, 2000),
    "p":  (0.040, "burst",   900,  1200),
    "b":  (0.026, "burst",   700,  900),
    "s":  (0.075, "fric",    6200, 4500),
    "z":  (0.050, "fric",    5200, 4000),
    "sh": (0.085, "fric",    3100, 2600),
    "j":  (0.055, "fric",    2900, 2400),
    "ch": (0.070, "affr",    3000, 2600),
    "ts": (0.070, "affr",    4800, 3600),
    "h":  (0.060, "fric",    1600, 2200),
    "f":  (0.060, "fric",    1900, 2400),
    "n":  (0.048, "nasal",   0, 0),
    "m":  (0.052, "nasal",   0, 0),
    "ny": (0.052, "nasal",   0, 0),
    "ky": (0.048, "burst",   2600, 2800),
    "r":  (0.026, "flap",    0, 0),
    "y":  (0.040, "glide",   0, 0),
    "w":  (0.040, "glide",   0, 0),
}

# Second-formant locus per articulation place. The vowel's F2 glides out of this
# value over the first few tens of milliseconds, which is what makes a syllable
# read as "ka" rather than a bare vowel with a click in front of it.
F2_LOCUS = {
    "p": 800.0, "b": 800.0, "m": 820.0, "f": 900.0, "w": 800.0,
    "t": 1750.0, "d": 1750.0, "n": 1700.0, "s": 1800.0, "z": 1800.0,
    "ts": 1800.0, "r": 1550.0,
    "sh": 2150.0, "ch": 2150.0, "j": 2150.0, "ny": 2300.0, "ky": 2350.0, "y": 2400.0,
    # Velars and /h/ take their colour from the following vowel, so they glide
    # from a value derived from the target rather than a fixed locus.
    "k": None, "g": None, "h": None,
}

# Voiceless consonants. Japanese devoices /i/ and /u/ after these.
VOICELESS = {"k", "s", "sh", "t", "ts", "ch", "h", "f", "p", "ky"}

_rng = np.random.default_rng(2024)


def split_morae(kana: str) -> list[tuple[str, str]]:
    morae: list[tuple[str, str]] = []
    i = 0
    while i < len(kana):
        pair = kana[i : i + 2]
        if pair in DIGRAPHS:
            morae.append(DIGRAPHS[pair])
            i += 2
            continue
        if kana[i] in KANA:
            morae.append(KANA[kana[i]])
        i += 1
    return morae


def devoiced_flags(morae: list[tuple[str, str]]) -> list[bool]:
    """Mark the morae whose vowel drops out, as Tokyo Japanese does.

    /i/ and /u/ after a voiceless consonant go voiceless at the end of a phrase
    (ます, し) or before another voiceless consonant (ました, おつかれ).
    /h/ is excluded as a trigger: it is too weak to devoice a preceding vowel
    reliably, and applying it would wrongly whisper the ち of こんにちは.
    """
    flags = []
    for index, (consonant, vowel) in enumerate(morae):
        if vowel not in ("i", "u") or consonant not in VOICELESS:
            flags.append(False)
            continue
        following = morae[index + 1 :]
        if not following:
            flags.append(True)  # phrase-final
            continue
        next_consonant = following[0][0]
        flags.append(next_consonant in VOICELESS and next_consonant != "h")
    return flags


def _formant_gain(freq, f1, f2, f3):
    """Vocal-tract resonance envelope. `freq` and the formants may be arrays.

    Bandwidths are deliberately wider than textbook F1/F2/F3 values, and F4/F5
    plus a broadband floor are added. A real tract never nulls out between
    formants, and with a child-register F0 above 300 Hz the harmonics are far
    enough apart that narrow resonances drop most of them into a valley — which
    is what made the first pass sound dark and hollow.
    """
    gain = 1.00 / (1 + ((freq - f1) / 62.0) ** 2)
    gain = gain + 0.66 / (1 + ((freq - f2) / 95.0) ** 2)
    gain = gain + 0.38 / (1 + ((freq - f3) / 150.0) ** 2)
    gain = gain + 0.17 / (1 + ((freq - 3900.0) / 260.0) ** 2)
    gain = gain + 0.09 / (1 + ((freq - 4800.0) / 330.0) ** 2)
    gain = gain + 0.05 / (1 + (freq / 500.0) ** 2)
    return gain + 0.015


def _formant_track(n: int, vowel: str, consonant: str, glide: float = 0.045):
    """F1/F2/F3 per sample, gliding out of the consonant's locus into the vowel."""
    f1, f2, f3 = VOWELS[vowel]
    tracks = [np.full(n, f1), np.full(n, f2), np.full(n, f3)]
    if consonant not in F2_LOCUS:
        return tracks
    steps = min(n, max(1, int(glide * SR)))
    ramp = np.linspace(0.0, 1.0, steps) ** 0.6
    locus2 = F2_LOCUS[consonant]
    if locus2 is None:
        # Velar / glottal: start near the vowel's own F2, pulled slightly inward.
        locus2 = f2 * 0.82 + 500.0
    locus1 = max(240.0, f1 * 0.55)  # the mouth opens out of a constriction
    tracks[0][:steps] = locus1 + (f1 - locus1) * ramp
    tracks[1][:steps] = locus2 + (f2 - locus2) * ramp
    return tracks


def _wobble(n: int, depth: float, rate: float, seed: int) -> np.ndarray:
    """Smooth random drift — micro-variation that keeps a line from sounding stamped out."""
    if n <= 0:
        return np.zeros(0)
    points = max(2, int(n / SR * rate) + 2)
    rng = np.random.default_rng(seed)
    coarse = rng.uniform(-1.0, 1.0, points)
    return 1.0 + depth * np.interp(np.linspace(0, points - 1, n), np.arange(points), coarse)


def _voiced(f0_curve: np.ndarray, tracks, breath: float = 0.05, seed: int = 0) -> np.ndarray:
    """Additive synthesis: harmonics of f0 shaped by a time-varying formant filter."""
    n = len(f0_curve)
    if n <= 0:
        return np.zeros(0)
    jitter = _wobble(n, 0.004, 26.0, seed + 991)  # pitch jitter
    curve = f0_curve * jitter
    phase = 2 * np.pi * np.cumsum(curve) / SR
    f1, f2, f3 = tracks
    out = np.zeros(n)
    lowest = float(np.min(curve))
    for h in range(1, int(5400 / lowest) + 1):
        harmonic = curve * h
        gain = _formant_gain(harmonic, f1, f2, f3)
        # Glottal slope after lip radiation, plus a gentle HF roll-off.
        gain = gain * (h ** -0.95) * np.exp(-harmonic / 8200.0)
        if float(np.max(gain)) < 0.0025:
            continue
        out += np.sin(phase * h + h * 0.7) * gain
    if breath > 0:
        noise = _rng.uniform(-1, 1, n)
        out += bandpass(noise, float(np.mean(f3)), 2600) * breath
    return out * _wobble(n, 0.05, 9.0, seed + 331)  # shimmer


def _whispered(n: int, tracks, seed: int = 0) -> np.ndarray:
    """A devoiced vowel: no glottal source, just noise through the same formants."""
    if n <= 0:
        return np.zeros(0)
    rng = np.random.default_rng(seed + 4242)
    spectrum = np.fft.rfft(rng.uniform(-1, 1, n))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    f1, f2, f3 = (float(np.mean(track)) for track in tracks)
    shaped = spectrum * _formant_gain(freqs, f1, f2, f3) * np.exp(-freqs / 7000.0)
    return np.fft.irfft(shaped, n) * 0.9


def _vowel_env(n: int, attack: float = 0.016, release_ratio: float = 0.34) -> np.ndarray:
    """Attack, hold, release. The old purely exponential decay swallowed long vowels."""
    a = min(n, max(1, int(attack * SR)))
    r = min(n - a, max(1, int(n * release_ratio)))
    hold = max(0, n - a - r)
    return np.concatenate([
        np.linspace(0.0, 1.0, a) ** 0.7,
        np.full(hold, 1.0) * np.linspace(1.0, 0.88, hold) if hold else np.zeros(0),
        np.linspace(0.88 if hold else 1.0, 0.0, r) ** 1.4,
    ])[:n]


def _onset(kind: str, dur: float, centre: float, width: float, vowel: str, f0: float) -> np.ndarray:
    n = max(1, int(dur * SR))
    if kind is None:
        return np.zeros(0)
    if kind in ("burst", "affr"):
        gap = np.zeros(int(n * (0.62 if kind == "burst" else 0.25)))
        burst_n = n - len(gap)
        noise = bandpass(_rng.uniform(-1, 1, burst_n), centre, width)
        return np.concatenate([gap, noise * perc_env(burst_n, dur * 0.22, attack=0.001) * 0.5])
    if kind == "fric":
        noise = bandpass(_rng.uniform(-1, 1, n), centre, width)
        return noise * np.linspace(0.35, 0.9, n) * perc_env(n, dur, attack=0.006) * 0.42
    if kind == "nasal":
        curve = np.full(n, f0 * 0.97)
        tracks = (np.full(n, 260.0), np.full(n, 1100.0), np.full(n, 2400.0))
        murmur = lowpass(_voiced(curve, tracks, breath=0.0), 1000) * 0.95
        return murmur * np.linspace(0.5, 1.0, n) * 0.6
    if kind == "flap":
        curve = np.full(n, f0)
        tracks = _formant_track(n, vowel, "r")
        return _voiced(curve, tracks, breath=0.0) * np.linspace(0.0, 0.8, n) * 0.4
    if kind == "glide":
        curve = np.full(n, f0 * 0.94)
        source = "i" if vowel in ("a", "o", "u") else "u"
        tracks = _formant_track(n, source, "")
        return _voiced(curve, tracks, breath=0.0) * np.linspace(0.1, 0.85, n) * 0.5
    return np.zeros(0)


def synth_line(kana: str, base_f0: float = 340.0, contour: str = "neutral", mora_sec: float = 0.135, tail: float = 0.5) -> np.ndarray:
    """Render one kana line as a pseudo-voice cue."""
    morae = split_morae(kana)
    if not morae:
        return np.zeros(int(0.1 * SR))
    devoiced = devoiced_flags(morae)
    buf = np.zeros(int((len(morae) * mora_sec * 1.6 + tail + 0.4) * SR))
    cursor = 0.08
    count = len(morae)
    previous_vowel = "a"
    variation = np.random.default_rng(len(kana) * 17 + count)

    for index, (consonant, vowel) in enumerate(morae):
        position = index / max(1, count - 1)
        # Japanese-ish pitch accent: low start, peak on mora 2, gradual downdrift.
        accent = 1.0 + (0.16 if index == 1 else 0.0) - 0.13 * position
        if contour == "rise":
            accent += 0.30 * position**2
        elif contour == "fall":
            accent -= 0.22 * position
        elif contour == "bright":
            accent += 0.12 * np.sin(np.pi * position)
        f0 = base_f0 * accent

        if consonant == "Q":  # っ — a beat of silence
            cursor += mora_sec * 0.8
            continue
        if consonant == ":":  # ー — hold the previous vowel
            vowel = previous_vowel
            consonant = ""

        if consonant == "N":  # ん — nasal murmur only
            n = int(mora_sec * 1.05 * SR)
            curve = np.linspace(f0, f0 * 0.93, n)
            tracks = (np.full(n, 250.0), np.full(n, 1050.0), np.full(n, 2350.0))
            murmur = lowpass(_voiced(curve, tracks, breath=0.0, seed=index), 900)
            add_at(buf, murmur * _vowel_env(n) * 0.5, cursor)
            cursor += mora_sec * 1.05
            continue

        onset_dur, kind, centre, width = ONSETS.get(consonant, (0.0, None, 0, 0))
        if kind:
            onset = _onset(kind, onset_dur, centre, width, vowel, f0)
            add_at(buf, onset, cursor)
            cursor += onset_dur

        # Mora-timed, but not metronomic: a little length and level variation, and
        # a longer final mora so lines do not stop dead.
        final = index == count - 1
        length = mora_sec * (1.85 if final else float(variation.uniform(0.9, 1.1)))
        level = float(variation.uniform(0.9, 1.06))
        n = int(length * SR)
        tracks = _formant_track(n, vowel, consonant)

        if devoiced[index]:
            # Whispered: the vowel keeps its shape but loses the voice entirely.
            body = _whispered(n, tracks, seed=index) * 0.5
            env = _vowel_env(n, attack=0.008, release_ratio=0.5)
        else:
            vibrato = 1 + 0.014 * np.sin(2 * np.pi * 5.6 * np.arange(n) / SR)
            glide = np.linspace(1.0, 0.955 if final and contour != "rise" else 1.03, n)
            body = _voiced(f0 * vibrato * glide, tracks, breath=0.045, seed=index * 13)
            env = _vowel_env(n)

        add_at(buf, body * env * 0.55 * level, cursor)
        cursor += length * 0.9
        previous_vowel = vowel

    voiced = highpass(buf, 130, poles=1)
    voiced = reverb(voiced, 0.14, 0.45)
    return fade_edges(stereo(soft_limit(normalize(voiced, 0.72))), ms=6.0)


# ─────────────────────────────────────────────
# Voice lines
# ─────────────────────────────────────────────
# (file key, speaker, kana, display text, contour, base f0, mora length)
LINES = [
    ("voice-miffy-ready",   "ミフィ", "がんばります",         "がんばります！",        "bright", 352, 0.130),
    ("voice-miffy-done",    "ミフィ", "できました",           "できました！",          "bright", 348, 0.132),
    ("voice-miffy-great",   "ミフィ", "だいせいこう",         "だいせいこう！",        "rise",   366, 0.138),
    ("voice-miffy-fail",    "ミフィ", "ごめんなさい",         "ごめんなさい…",         "fall",   318, 0.150),
    ("voice-miffy-order",   "ミフィ", "ありがとうございます", "ありがとうございます！", "bright", 344, 0.122),
    ("voice-miffy-levelup", "ミフィ", "れべるあっぷ",         "レベルアップ！",        "rise",   358, 0.132),
    ("voice-miru-hello",    "ミル",   "こんにちは",           "こんにちは！",          "bright", 402, 0.128),
    ("voice-miru-cheer",    "ミル",   "そのちょうし",         "そのちょうし！",        "rise",   410, 0.124),
    ("voice-miru-report",   "ミル",   "おつかれさま",         "おつかれさま！",        "neutral", 396, 0.130),
]

VOICES = {
    key: ((lambda k=kana, c=contour, f=f0, m=mora: synth_line(k, base_f0=f, contour=c, mora_sec=m)), f"{speaker}「{text}」")
    for key, speaker, kana, text, contour, f0, mora in LINES
}
