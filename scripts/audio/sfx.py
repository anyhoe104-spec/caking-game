"""One-shot sound effects for CAKING.

Every effect shares the same palette as the BGM (bells, marimba, soft noise) so
UI feedback sits inside the music instead of on top of it.
"""

from __future__ import annotations

import numpy as np

from .synth import (
    SR,
    add_at,
    bandpass,
    fade_edges,
    glocken,
    highpass,
    lowpass,
    marimba,
    normalize,
    note_to_freq,
    perc_env,
    pluck,
    reverb,
    sine,
    soft_limit,
    stereo,
    triangle,
)


def _canvas(seconds: float) -> np.ndarray:
    return np.zeros(int(seconds * SR))


def _seq(buf: np.ndarray, events, voice=glocken) -> None:
    """events: (note, start_sec, dur_sec, gain)"""
    for name, start, dur, gain in events:
        add_at(buf, voice(note_to_freq(name), dur), start, gain)


def _sparkle(seconds: float, count: int = 14, seed: int = 5, high: float = 3200.0) -> np.ndarray:
    """A shower of tiny bells — the 'kirakira' layer."""
    buf = _canvas(seconds)
    rng = np.random.default_rng(seed)
    for i in range(count):
        freq = high * rng.uniform(0.7, 2.1)
        start = float(rng.uniform(0, seconds * 0.62))
        n = int(0.2 * SR)
        add_at(buf, sine(freq, n) * perc_env(n, 0.05), start, float(rng.uniform(0.06, 0.16)))
    return buf


def _noise(seconds: float, seed: int = 0) -> np.ndarray:
    return np.random.default_rng(seed).uniform(-1, 1, int(seconds * SR))


def _finish(buf: np.ndarray, reverb_amount: float = 0.12, peak: float = 0.8) -> np.ndarray:
    out = reverb(buf, reverb_amount, 0.5) if reverb_amount > 0 else buf
    return fade_edges(stereo(soft_limit(normalize(out, peak))), ms=4.0)


# ─────────────────────────────────────────────
# UI feedback
# ─────────────────────────────────────────────


def tap() -> np.ndarray:
    """Neutral button press."""
    buf = _canvas(0.16)
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    sweep = np.sin(2 * np.pi * np.cumsum(1250 - 420 * np.linspace(0, 1, n)) / SR)
    add_at(buf, sweep * perc_env(n, 0.028), 0.0, 0.5)
    add_at(buf, marimba(note_to_freq("A5"), 0.12), 0.0, 0.35)
    del t
    return _finish(buf, reverb_amount=0.05, peak=0.55)


def nav() -> np.ndarray:
    """Tab / screen change — a soft filtered swish."""
    buf = _canvas(0.26)
    n = int(0.18 * SR)
    swept = bandpass(_noise(0.18, seed=21), 2600, 2600) * perc_env(n, 0.05, attack=0.02)
    add_at(buf, swept, 0.0, 0.45)
    _seq(buf, [("E5", 0.0, 0.16, 0.3), ("B5", 0.045, 0.18, 0.26)])
    return _finish(buf, reverb_amount=0.08, peak=0.55)


def error() -> np.ndarray:
    """Blocked action / failed bake — a gentle falling 'oops'."""
    buf = _canvas(0.5)
    _seq(buf, [("E4", 0.0, 0.24, 0.5), ("Bb3", 0.11, 0.34, 0.5)], voice=triangle_voice)
    add_at(buf, lowpass(_noise(0.16, seed=31), 900) * perc_env(int(0.16 * SR), 0.06), 0.0, 0.18)
    return _finish(buf, reverb_amount=0.1, peak=0.62)


def triangle_voice(freq: float, dur: float) -> np.ndarray:
    n = int(dur * SR)
    return triangle(freq, n) * perc_env(n, dur * 0.5, attack=0.006) * 0.6


# ─────────────────────────────────────────────
# Economy
# ─────────────────────────────────────────────


def buy() -> np.ndarray:
    """Coin spend."""
    buf = _canvas(0.45)
    _seq(buf, [("C6", 0.0, 0.3, 0.5), ("G6", 0.035, 0.34, 0.4), ("E6", 0.075, 0.3, 0.3)])
    add_at(buf, highpass(_noise(0.05, seed=41), 5000) * perc_env(int(0.05 * SR), 0.014), 0.0, 0.18)
    return _finish(buf, reverb_amount=0.14, peak=0.7)


def coin() -> np.ndarray:
    """Single tick used while the daily report counts money up."""
    buf = _canvas(0.14)
    _seq(buf, [("E6", 0.0, 0.12, 0.45)])
    return _finish(buf, reverb_amount=0.04, peak=0.45)


def equip() -> np.ndarray:
    """Decoration equipped — soft pop plus shimmer."""
    buf = _canvas(0.6)
    _seq(buf, [("G5", 0.0, 0.26, 0.42), ("D6", 0.08, 0.34, 0.38)])
    add_at(buf, _sparkle(0.45, count=9, seed=45, high=4200), 0.05, 0.5)
    return _finish(buf, reverb_amount=0.2, peak=0.68)


def hire() -> np.ndarray:
    """Staff joined the shop."""
    buf = _canvas(0.8)
    _seq(buf, [("C5", 0.0, 0.3, 0.4), ("F5", 0.09, 0.3, 0.4), ("A5", 0.18, 0.42, 0.42)], voice=marimba)
    _seq(buf, [("C6", 0.26, 0.5, 0.32)])
    return _finish(buf, reverb_amount=0.2, peak=0.72)


# ─────────────────────────────────────────────
# Baking results
# ─────────────────────────────────────────────


def success() -> np.ndarray:
    """A cake came out right."""
    buf = _canvas(0.8)
    _seq(buf, [("C5", 0.0, 0.26, 0.5), ("E5", 0.075, 0.26, 0.5), ("G5", 0.15, 0.42, 0.55)], voice=marimba)
    _seq(buf, [("C6", 0.15, 0.5, 0.28)])
    return _finish(buf, reverb_amount=0.18, peak=0.74)


def great() -> np.ndarray:
    """Great success — the big sparkle fanfare."""
    buf = _canvas(1.5)
    _seq(
        buf,
        [
            ("C5", 0.00, 0.30, 0.42),
            ("E5", 0.06, 0.30, 0.44),
            ("G5", 0.12, 0.34, 0.46),
            ("C6", 0.18, 0.55, 0.52),
            ("E6", 0.30, 0.60, 0.46),
            ("G6", 0.42, 0.85, 0.44),
        ],
    )
    _seq(buf, [("C4", 0.0, 0.5, 0.3), ("G4", 0.42, 0.6, 0.26)], voice=marimba)
    add_at(buf, _sparkle(1.15, count=20, seed=51, high=3800), 0.16, 0.75)
    return _finish(buf, reverb_amount=0.3, peak=0.85)


def order() -> np.ndarray:
    """An order was served — the counter bell."""
    buf = _canvas(1.0)
    _seq(buf, [("G5", 0.0, 0.45, 0.5), ("C6", 0.13, 0.6, 0.5), ("E6", 0.13, 0.6, 0.3)])
    add_at(buf, _sparkle(0.6, count=8, seed=55, high=4600), 0.1, 0.45)
    return _finish(buf, reverb_amount=0.26, peak=0.78)


# ─────────────────────────────────────────────
# Progression
# ─────────────────────────────────────────────


def levelup() -> np.ndarray:
    """Craftsman level up."""
    buf = _canvas(1.8)
    notes = ["C5", "E5", "G5", "C6", "E6", "G6", "C7"]
    _seq(buf, [(n, i * 0.075, 0.5 + i * 0.07, 0.42) for i, n in enumerate(notes)])
    _seq(buf, [("C4", 0.0, 0.7, 0.34), ("C5", 0.45, 0.9, 0.3)], voice=marimba)
    add_at(buf, _sparkle(1.4, count=26, seed=61, high=3600), 0.2, 0.8)
    return _finish(buf, reverb_amount=0.34, peak=0.88)


def unlock() -> np.ndarray:
    """New recipe unlocked — a golden chime."""
    buf = _canvas(1.6)
    _seq(buf, [("G5", 0.0, 0.7, 0.42), ("D6", 0.1, 0.8, 0.44), ("G6", 0.2, 1.0, 0.4), ("B6", 0.34, 1.0, 0.3)])
    add_at(buf, _sparkle(1.2, count=18, seed=65, high=5000), 0.18, 0.7)
    return _finish(buf, reverb_amount=0.36, peak=0.85)


def mission() -> np.ndarray:
    """Daily mission cleared."""
    buf = _canvas(1.1)
    _seq(buf, [("E5", 0.0, 0.28, 0.44), ("A5", 0.09, 0.34, 0.46), ("E6", 0.18, 0.65, 0.44)])
    add_at(buf, _sparkle(0.8, count=12, seed=71, high=4400), 0.15, 0.6)
    return _finish(buf, reverb_amount=0.26, peak=0.8)


# ─────────────────────────────────────────────
# Day boundaries
# ─────────────────────────────────────────────


def daystart() -> np.ndarray:
    """Opening the shop — the door bell."""
    buf = _canvas(1.3)
    for i, name in enumerate(["E6", "A6", "C7", "G6"]):
        add_at(buf, glocken(note_to_freq(name), 0.9 - i * 0.08), 0.02 * i, 0.34)
    add_at(buf, _sparkle(0.7, count=10, seed=75, high=6000), 0.0, 0.4)
    _seq(buf, [("A4", 0.0, 0.6, 0.24)], voice=pluck_voice)
    return _finish(buf, reverb_amount=0.32, peak=0.8)


def dayend() -> np.ndarray:
    """Closing time — a warm low bell."""
    buf = _canvas(1.6)
    _seq(buf, [("C5", 0.0, 1.1, 0.5), ("G4", 0.12, 1.2, 0.4), ("C4", 0.12, 1.3, 0.3)])
    return _finish(buf, reverb_amount=0.34, peak=0.74)


def pluck_voice(freq: float, dur: float) -> np.ndarray:
    return pluck(freq, dur, seed=91)


EFFECTS = {
    "tap":      (tap,      "ボタン・カード全般のタップ"),
    "nav":      (nav,      "ボトムナビ・タブ切り替え"),
    "buy":      (buy,      "食材購入・支払い"),
    "coin":     (coin,     "日報のコインカウントアップ"),
    "equip":    (equip,    "デコレーション装備"),
    "hire":     (hire,     "スタッフ雇用"),
    "success":  (success,  "ケーキ完成（成功）"),
    "great":    (great,    "ケーキ完成（大成功）"),
    "error":    (error,    "失敗・操作不可"),
    "order":    (order,    "注文成立（お客様に提供）"),
    "levelup":  (levelup,  "職人レベルアップ"),
    "unlock":   (unlock,   "レシピ解放"),
    "mission":  (mission,  "ミッション達成"),
    "daystart": (daystart, "営業スタート"),
    "dayend":   (dayend,   "営業終了"),
}
