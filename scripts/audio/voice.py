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


def _glottal(f0_curve: np.ndarray, vowel: str, breath: float = 0.05) -> np.ndarray:
    """Additive formant synthesis: harmonics of f0 shaped by the vowel's formants."""
    n = len(f0_curve)
    if n <= 0:
        return np.zeros(0)
    phase = 2 * np.pi * np.cumsum(f0_curve) / SR
    f1, f2, f3 = VOWELS[vowel]
    out = np.zeros(n)
    mean_f0 = float(np.mean(f0_curve))
    for h in range(1, int(5200 / mean_f0) + 1):
        freq = mean_f0 * h
        gain = 0.0
        for centre, bandwidth, level in ((f1, 110.0, 1.0), (f2, 150.0, 0.55), (f3, 220.0, 0.22)):
            gain += level / (1 + ((freq - centre) / (bandwidth / 2)) ** 2)
        gain += 0.05 / (1 + (freq / 400) ** 2)  # gentle low-end body
        if gain < 0.004:
            continue
        out += np.sin(phase * h + h * 0.7) * gain / (1 + (h / 9) ** 1.6)
    if breath > 0:
        out += bandpass(_rng.uniform(-1, 1, n), (f2 + f3) / 2, 2500) * breath
    return out


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
        murmur = _glottal(curve, "u", breath=0.0)
        murmur = lowpass(murmur, 900) * 0.9
        return murmur * np.linspace(0.5, 1.0, n) * 0.55
    if kind == "flap":
        curve = np.full(n, f0)
        return _glottal(curve, vowel, breath=0.0) * np.linspace(0.0, 0.8, n) * 0.4
    if kind == "glide":
        curve = np.full(n, f0 * 0.94)
        source = "i" if vowel in ("a", "o", "u") else "u"
        return _glottal(curve, source, breath=0.0) * np.linspace(0.1, 0.85, n) * 0.5
    return np.zeros(0)


def synth_line(kana: str, base_f0: float = 340.0, contour: str = "neutral", mora_sec: float = 0.135, tail: float = 0.5) -> np.ndarray:
    """Render one kana line as a pseudo-voice cue."""
    morae = split_morae(kana)
    if not morae:
        return np.zeros(int(0.1 * SR))
    buf = np.zeros(int((len(morae) * mora_sec + tail + 0.4) * SR))
    cursor = 0.08
    count = len(morae)
    previous_vowel = "a"

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
            murmur = lowpass(_glottal(curve, "u", breath=0.0), 800)
            add_at(buf, murmur * perc_env(n, mora_sec, attack=0.02) * 0.5, cursor)
            cursor += mora_sec * 1.05
            previous_vowel = previous_vowel
            continue

        onset_dur, kind, centre, width = ONSETS.get(consonant, (0.0, None, 0, 0))
        if kind:
            onset = _onset(kind, onset_dur, centre, width, vowel, f0)
            add_at(buf, onset, cursor)
            cursor += onset_dur

        # Slight lengthening on the final mora so lines do not end abruptly.
        length = mora_sec * (1.75 if index == count - 1 else 1.0)
        n = int(length * SR)
        vibrato = 1 + 0.014 * np.sin(2 * np.pi * 5.6 * np.arange(n) / SR)
        glide = np.linspace(1.0, 0.965 if index == count - 1 and contour != "rise" else 1.02, n)
        curve = f0 * vibrato * glide
        body = _glottal(curve, vowel, breath=0.045)
        env = perc_env(n, length * 0.85, attack=0.012)
        env *= np.clip(np.linspace(1.2, 0.0, n) + 0.35, 0, 1)
        add_at(buf, body * env * 0.55, cursor)
        cursor += length * 0.86
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
