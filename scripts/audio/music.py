"""Seamless-looping BGM tracks for CAKING, rendered from note data.

Each track is written as bar-by-bar chord symbols plus a compact melody string
(``"E5:1 G5:1 C6:2"`` = quarter, quarter, half). Everything past the final bar —
note releases, reverb tails — is folded back onto bar 1 by ``wrap_tail`` so the
file loops without a seam.
"""

from __future__ import annotations

import numpy as np

from .synth import (
    SR,
    add_at,
    bass,
    epiano,
    fade_edges,
    glocken,
    hat,
    kick,
    marimba,
    normalize,
    note_to_freq,
    pad,
    pluck,
    reverb,
    shaker,
    snare,
    soft_limit,
    widen,
    wrap_tail,
)

# ─────────────────────────────────────────────
# Chords: symbol -> (bass note, comp voicing)
# ─────────────────────────────────────────────
CHORDS = {
    "C":    ("C2",  ["C4", "E4", "G4"]),
    "C/G":  ("G1",  ["C4", "E4", "G4"]),
    "Cmaj": ("C2",  ["C4", "E4", "G4", "B4"]),
    "G":    ("G1",  ["B3", "D4", "G4"]),
    "G/B":  ("B1",  ["B3", "D4", "G4"]),
    "Am":   ("A1",  ["A3", "C4", "E4"]),
    "Em":   ("E2",  ["E4", "G4", "B4"]),
    "F":    ("F1",  ["A3", "C4", "F4"]),
    "Dm":   ("D2",  ["D4", "F4", "A4"]),
    "Bb":   ("Bb1", ["D4", "F4", "Bb4"]),
    "Gm":   ("G1",  ["G3", "Bb3", "D4"]),
}


def parse_melody(spec: str) -> list[tuple[str | None, float]]:
    """``"E5:1 -:0.5 G5:0.5"`` -> [("E5", 1.0), (None, 0.5), ("G5", 0.5)]."""
    events: list[tuple[str | None, float]] = []
    for token in spec.split():
        name, _, beats = token.partition(":")
        events.append((None if name == "-" else name, float(beats)))
    return events


class Track:
    """A single BGM loop under construction."""

    def __init__(self, bpm: float, bars: int, beats_per_bar: int = 4, tail: float = 3.0):
        self.bpm = bpm
        self.beat = 60.0 / bpm
        self.bars = bars
        self.beats_per_bar = beats_per_bar
        self.loop_seconds = bars * beats_per_bar * self.beat
        self.loop_samples = int(round(self.loop_seconds * SR))
        self.buf = np.zeros(self.loop_samples + int(tail * SR))

    def at(self, bar: int, beat: float = 0.0) -> float:
        """Bar/beat position (1-indexed bars) in seconds."""
        return ((bar - 1) * self.beats_per_bar + beat) * self.beat

    def melody(self, spec_by_bar: list[str], voice, gain: float = 1.0, octave: int = 0, seed: int = 0) -> None:
        for index, spec in enumerate(spec_by_bar):
            cursor = 0.0
            for name, beats in parse_melody(spec):
                if name is not None:
                    freq = note_to_freq(name) * (2**octave)
                    dur = beats * self.beat
                    sig = _voice(voice, freq, dur, seed=seed + index)
                    add_at(self.buf, sig, self.at(index + 1, cursor), gain)
                cursor += beats

    def arpeggio(self, chords: list[str], pattern: list[float], voice, gain: float = 1.0, seed: int = 0) -> None:
        """Cycle through each bar's voicing over the given beat offsets."""
        for index, symbol in enumerate(chords):
            notes = CHORDS[symbol][1]
            for step, offset in enumerate(pattern):
                name = notes[step % len(notes)]
                dur = (pattern[step + 1] - offset if step + 1 < len(pattern) else self.beats_per_bar - offset) * self.beat
                sig = _voice(voice, note_to_freq(name), max(dur * 1.6, 0.18), seed=seed + index * 8 + step)
                add_at(self.buf, sig, self.at(index + 1, offset), gain)

    def chords(self, chords: list[str], voice, gain: float = 1.0, sustain: float = 1.0) -> None:
        for index, symbol in enumerate(chords):
            dur = self.beats_per_bar * self.beat * sustain
            for name in CHORDS[symbol][1]:
                add_at(self.buf, _voice(voice, note_to_freq(name), dur), self.at(index + 1), gain)

    def bassline(self, chords: list[str], beats: list[float], gain: float = 1.0, length: float = 0.9) -> None:
        for index, symbol in enumerate(chords):
            root = CHORDS[symbol][0]
            for beat in beats:
                add_at(self.buf, bass(note_to_freq(root), self.beat * length), self.at(index + 1, beat), gain)

    def drums(self, spec: dict[str, list[float]], gain: float = 1.0, swing: float = 0.0) -> None:
        makers = {"kick": lambda i: kick(), "snare": lambda i: snare(seed=7 + i), "hat": lambda i: hat(seed=11 + i), "shaker": lambda i: shaker(seed=13 + i)}
        for index in range(self.bars):
            for name, beats in spec.items():
                for step, beat in enumerate(beats):
                    offset = swing * self.beat if (beat * 2) % 2 == 1 else 0.0
                    add_at(self.buf, makers[name](step), self.at(index + 1, beat) + offset, gain)

    def finish(self, reverb_amount: float = 0.2, reverb_decay: float = 1.2, peak: float = 0.82) -> np.ndarray:
        wet = reverb(self.buf, reverb_amount, reverb_decay)
        mono = wrap_tail(wet, self.loop_samples)
        mono = soft_limit(normalize(mono, peak))
        return fade_edges(widen(mono), ms=3.0)


def _voice(voice, freq: float, dur: float, seed: int = 0):
    if voice is pluck:
        return pluck(freq, dur, seed=seed)
    return voice(freq, dur)


# ─────────────────────────────────────────────
# Track definitions
# ─────────────────────────────────────────────


def opening_theme() -> np.ndarray:
    """Warm, storybook opening — glockenspiel over a soft pad."""
    chords = ["C", "G/B", "Am", "F", "C", "F", "G", "C", "C", "G", "Am", "Em", "F", "G", "C", "C"]
    lead = [
        "E5:1 G5:1 C6:2",
        "D6:1 B5:1 G5:2",
        "A5:1 C6:1 E6:2",
        "D6:1 C6:1 A5:2",
        "E6:1 D6:1 C6:1 G5:1",
        "A5:1 C6:1 F6:2",
        "E6:1 D6:1 B5:1 D6:1",
        "C6:4",
        "-:1 G5:1 E5:1 G5:1",
        "-:1 B5:1 D6:1 B5:1",
        "C6:2 A5:2",
        "B5:2 G5:2",
        "A5:1 C6:1 F6:1 E6:1",
        "D6:1 B5:1 G5:2",
        "C6:2 E6:2",
        "G5:4",
    ]
    t = Track(bpm=90, bars=16, tail=3.5)
    t.chords(chords, pad, gain=0.9)
    t.arpeggio(chords, [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], pluck, gain=0.3, seed=101)
    t.melody(lead, glocken, gain=0.85)
    t.bassline(chords, [0, 2], gain=0.55)
    t.drums({"shaker": [1, 3]}, gain=0.45)
    return t.finish(reverb_amount=0.3, reverb_decay=1.5)


def shop_bgm() -> np.ndarray:
    """The main service loop — bouncy marimba with a light rhythm section."""
    chords = ["C", "Am", "F", "G", "C", "Am", "Dm", "G", "C", "Am", "F", "G", "F", "Em", "Dm", "G"]
    lead = [
        "G4:0.5 E5:0.5 G5:0.5 E5:0.5 C5:1 G4:1",
        "A4:0.5 C5:0.5 E5:0.5 C5:0.5 A4:1 -:1",
        "F4:0.5 A4:0.5 C5:0.5 A4:0.5 F5:1 C5:1",
        "G4:0.5 B4:0.5 D5:0.5 B4:0.5 G5:2",
        "E5:0.5 G5:0.5 C6:1 G5:0.5 E5:0.5 C5:1",
        "A5:0.5 E5:0.5 A4:1 C5:0.5 E5:0.5 A5:1",
        "D5:0.5 F5:0.5 A5:1 F5:0.5 D5:0.5 A4:1",
        "B4:0.5 D5:0.5 G5:1 D5:1 B4:1",
        "C5:1 E5:1 G5:1 E5:1",
        "A4:1 C5:1 E5:2",
        "F5:0.5 E5:0.5 D5:0.5 C5:0.5 A4:2",
        "B4:0.5 D5:0.5 G5:0.5 B5:0.5 D6:2",
        "C6:1 A5:1 F5:2",
        "B5:1 G5:1 E5:2",
        "A5:0.5 F5:0.5 D5:0.5 F5:0.5 A5:1 D6:1",
        "B5:1 D6:1 G5:2",
    ]
    t = Track(bpm=112, bars=16, tail=2.6)
    t.chords(chords, pad, gain=0.5, sustain=0.95)
    t.arpeggio(chords, [0, 1, 2, 3], pluck, gain=0.42, seed=211)
    t.melody(lead, marimba, gain=0.95)
    t.bassline(chords, [0, 1.5, 2, 3.5], gain=0.6, length=0.7)
    t.drums({"kick": [0, 2], "snare": [1, 3], "hat": [0.5, 1.5, 2.5, 3.5]}, gain=0.62, swing=0.03)
    return t.finish(reverb_amount=0.17, reverb_decay=0.9)


def menu_bgm() -> np.ndarray:
    """Calm counter for the recipe / pantry / shop screens."""
    chords = ["F", "Dm", "Bb", "C", "F", "Bb", "Gm", "C"]
    lead = [
        "A4:2 C5:2",
        "D5:1 F5:1 A4:2",
        "Bb4:2 D5:2",
        "C5:1 E5:1 G4:2",
        "F5:1 E5:1 C5:2",
        "D5:2 F5:2",
        "G4:1 Bb4:1 D5:2",
        "C5:4",
    ]
    t = Track(bpm=96, bars=8, tail=3.2)
    t.chords(chords, pad, gain=1.0)
    t.arpeggio(chords, [0, 0.75, 1.5, 2.25, 3], pluck, gain=0.44, seed=311)
    t.melody(lead, marimba, gain=0.6)
    t.bassline(chords, [0], gain=0.5, length=2.6)
    t.drums({"shaker": [1.5, 3.5]}, gain=0.32)
    return t.finish(reverb_amount=0.32, reverb_decay=1.6)


def report_bgm() -> np.ndarray:
    """Short, satisfied loop under the end-of-day report."""
    chords = ["C", "F", "G", "C", "Am", "F", "G", "C"]
    lead = [
        "C5:1 E5:1 G5:2",
        "A5:1 F5:1 C5:2",
        "D5:1 G5:1 B5:2",
        "C6:2 G5:2",
        "E5:1 A5:1 C6:2",
        "A5:1 C6:1 F5:2",
        "B5:1 D6:1 G5:2",
        "C6:4",
    ]
    t = Track(bpm=104, bars=8, tail=2.6)
    t.chords(chords, pad, gain=0.6)
    t.melody(lead, marimba, gain=0.9)
    t.arpeggio(chords, [0.5, 1.5, 2.5, 3.5], pluck, gain=0.3, seed=411)
    t.bassline(chords, [0, 2], gain=0.55)
    t.drums({"hat": [1, 3], "shaker": [0.5, 2.5]}, gain=0.4)
    return t.finish(reverb_amount=0.24, reverb_decay=1.2)


def ending_theme() -> np.ndarray:
    """Sunset-over-the-harbour finale — electric piano and strings."""
    chords = ["C", "G/B", "Am", "Em", "F", "C", "F", "G", "C", "G", "Am", "F", "C", "F", "G", "C"]
    lead = [
        "G4:1 C5:1 E5:2",
        "D5:1 B4:1 G4:2",
        "A4:1 C5:1 E5:1 A5:1",
        "G5:2 E5:2",
        "F5:1 E5:1 C5:2",
        "E5:1 G5:1 C6:2",
        "A5:2 F5:2",
        "G5:1 D5:1 B4:2",
        "C5:1 E5:1 G5:1 C6:1",
        "B5:2 D5:2",
        "C6:1 A5:1 E5:2",
        "F5:1 A5:1 C6:2",
        "E6:2 C6:2",
        "A5:1 C6:1 F5:2",
        "G5:1 B5:1 D6:2",
        "C6:4",
    ]
    t = Track(bpm=74, bars=16, tail=4.0)
    t.chords(chords, pad, gain=1.15)
    t.melody(lead, epiano, gain=1.0)
    t.arpeggio(chords, [0, 1, 2, 3], pluck, gain=0.26, seed=511)
    t.bassline(chords, [0, 2], gain=0.5, length=1.6)
    return t.finish(reverb_amount=0.38, reverb_decay=2.0)


TRACKS = {
    "opening-theme": (opening_theme, "オープニング / タイトル"),
    "menu-bgm":      (menu_bgm,      "準備中・メニュー各画面"),
    "shop-bgm":      (shop_bgm,      "営業中（プレイ中）"),
    "report-bgm":    (report_bgm,    "日報オーバーレイ"),
    "ending-theme":  (ending_theme,  "エンディング"),
}
