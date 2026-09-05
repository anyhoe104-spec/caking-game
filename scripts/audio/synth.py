"""Signal-level building blocks for the CAKING audio generator.

Everything here is deterministic: the same seed always renders the same audio,
so regenerating the assets never produces a surprise diff.
"""

from __future__ import annotations

import math

import numpy as np

SR = 44100


# ─────────────────────────────────────────────
# Pitch helpers
# ─────────────────────────────────────────────

_SEMITONES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def note_to_midi(name: str) -> int:
    """"C4" / "F#3" / "Bb5" -> MIDI note number."""
    letter = name[0].upper()
    rest = name[1:]
    value = _SEMITONES[letter]
    while rest and rest[0] in "#b":
        value += 1 if rest[0] == "#" else -1
        rest = rest[1:]
    return value + (int(rest) + 1) * 12


def note_to_freq(name: str) -> float:
    return 440.0 * 2 ** ((note_to_midi(name) - 69) / 12)


# ─────────────────────────────────────────────
# Envelopes
# ─────────────────────────────────────────────


def adsr(n: int, attack: float, decay: float, sustain: float, release: float) -> np.ndarray:
    """Sample-accurate ADSR clipped to ``n`` samples."""
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    r = max(1, int(release * SR))
    s = max(0, n - a - d - r)
    env = np.concatenate(
        [
            np.linspace(0.0, 1.0, a, endpoint=False),
            np.linspace(1.0, sustain, d, endpoint=False),
            np.full(s, sustain),
            np.linspace(sustain, 0.0, r),
        ]
    )
    return _fit(env, n)


def perc_env(n: int, decay: float, attack: float = 0.002) -> np.ndarray:
    """Percussive envelope: fast attack then exponential decay."""
    a = max(1, int(attack * SR))
    t = np.arange(n) / SR
    env = np.exp(-t / max(1e-4, decay))
    env[:a] *= np.linspace(0.0, 1.0, a)
    return env


def _fit(arr: np.ndarray, n: int) -> np.ndarray:
    if len(arr) == n:
        return arr
    if len(arr) > n:
        out = arr[:n].copy()
        tail = min(n, int(0.004 * SR))
        if tail > 1:
            out[-tail:] *= np.linspace(1.0, 0.0, tail)
        return out
    return np.concatenate([arr, np.zeros(n - len(arr))])


# ─────────────────────────────────────────────
# Oscillators / instrument voices
# ─────────────────────────────────────────────


def _phase(freq: float, n: int, detune: float = 0.0) -> np.ndarray:
    t = np.arange(n) / SR
    return 2 * np.pi * freq * (1 + detune) * t


def sine(freq: float, n: int, detune: float = 0.0) -> np.ndarray:
    return np.sin(_phase(freq, n, detune))


def triangle(freq: float, n: int, partials: int = 7) -> np.ndarray:
    out = np.zeros(n)
    t = np.arange(n) / SR
    for k in range(partials):
        h = 2 * k + 1
        if freq * h > SR / 2.2:
            break
        out += ((-1) ** k) * np.sin(2 * np.pi * freq * h * t) / (h * h)
    return out * (8 / math.pi**2)


def saw(freq: float, n: int, partials: int = 16) -> np.ndarray:
    out = np.zeros(n)
    t = np.arange(n) / SR
    for h in range(1, partials + 1):
        if freq * h > SR / 2.2:
            break
        out += np.sin(2 * np.pi * freq * h * t) / h
    return out * (2 / math.pi)


def marimba(freq: float, dur: float, vel: float = 1.0) -> np.ndarray:
    """Wooden mallet tone: fundamental plus a 4th-harmonic bar mode."""
    n = int(dur * SR)
    body = sine(freq, n) * perc_env(n, 0.28)
    mode = sine(freq * 3.98, n) * perc_env(n, 0.07) * 0.34
    click = sine(freq * 8.1, n) * perc_env(n, 0.012) * 0.18
    return (body + mode + click) * 0.5 * vel


def glocken(freq: float, dur: float, vel: float = 1.0) -> np.ndarray:
    """Bell-like: inharmonic partials with long decay."""
    n = int(dur * SR)
    out = sine(freq, n) * perc_env(n, 0.9)
    out += sine(freq * 2.76, n) * perc_env(n, 0.55) * 0.5
    out += sine(freq * 5.4, n) * perc_env(n, 0.28) * 0.22
    out += sine(freq * 8.9, n) * perc_env(n, 0.1) * 0.1
    return out * 0.34 * vel


def pluck(freq: float, dur: float, vel: float = 1.0, damping: float = 0.5, seed: int = 0) -> np.ndarray:
    """Karplus-Strong string — stands in for the acoustic guitar / pizzicato layer."""
    n = int(dur * SR)
    period = max(2, int(SR / freq))
    rng = np.random.default_rng(seed + period)
    buf = rng.uniform(-1.0, 1.0, period)
    buf *= np.hanning(period) * 0.5 + 0.5
    out = np.empty(n)
    idx = 0
    blend = 0.5 * (1.0 - 0.06 * damping)
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = (buf[idx] + buf[nxt]) * blend
        idx = nxt
    out *= perc_env(n, dur * 0.6, attack=0.001)
    return out * 0.55 * vel


def pad(freq: float, dur: float, vel: float = 1.0) -> np.ndarray:
    """Soft detuned string pad with a slow swell."""
    n = int(dur * SR)
    out = triangle(freq, n) * 0.6
    out += saw(freq, n, 10) * 0.22
    out += sine(freq * 2.001, n) * 0.16
    out += saw(freq * 1.004, n, 8) * 0.16
    out += saw(freq * 0.996, n, 8) * 0.16
    return out * adsr(n, min(0.35, dur * 0.35), 0.2, 0.72, min(0.5, dur * 0.4)) * 0.2 * vel


def epiano(freq: float, dur: float, vel: float = 1.0) -> np.ndarray:
    """FM electric piano — the melodic voice of the ending theme."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * freq * 2 * t) * perc_env(n, 0.09) * 2.6
    out = np.sin(2 * np.pi * freq * t + mod) * perc_env(n, 0.85)
    out += sine(freq * 2, n) * perc_env(n, 0.3) * 0.14
    return out * 0.4 * vel


def bass(freq: float, dur: float, vel: float = 1.0) -> np.ndarray:
    n = int(dur * SR)
    out = sine(freq, n) + triangle(freq, n, 4) * 0.35 + sine(freq * 2, n) * 0.12
    out = np.tanh(out * 1.35) * 0.5
    return out * adsr(n, 0.008, 0.09, 0.62, min(0.14, dur * 0.5)) * 0.55 * vel


def kick(dur: float = 0.24, vel: float = 1.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    freq = 46 + 118 * np.exp(-t / 0.028)
    out = np.sin(2 * np.pi * np.cumsum(freq) / SR) * perc_env(n, 0.11)
    return np.tanh(out * 1.5) * 0.62 * vel


def snare(dur: float = 0.2, vel: float = 1.0, seed: int = 7) -> np.ndarray:
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    noise = rng.uniform(-1, 1, n) * perc_env(n, 0.075)
    tone = (sine(196, n) + sine(292, n) * 0.6) * perc_env(n, 0.045)
    return (highpass(noise, 900) * 0.62 + tone * 0.3) * 0.5 * vel


def hat(dur: float = 0.06, vel: float = 1.0, seed: int = 11) -> np.ndarray:
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    return highpass(rng.uniform(-1, 1, n), 6500) * perc_env(n, dur * 0.34) * 0.28 * vel


def shaker(dur: float = 0.09, vel: float = 1.0, seed: int = 13) -> np.ndarray:
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    env = perc_env(n, dur * 0.4, attack=0.006)
    return bandpass(rng.uniform(-1, 1, n), 5200, 3200) * env * 0.3 * vel


# ─────────────────────────────────────────────
# Filters (one-pole / FFT based, no SciPy dependency)
# ─────────────────────────────────────────────


def lowpass(x: np.ndarray, cutoff: float, poles: int = 2) -> np.ndarray:
    a = math.exp(-2 * math.pi * cutoff / SR)
    out = x.astype(np.float64)
    for _ in range(poles):
        # y[n] = (1-a)x[n] + a*y[n-1] as a cumulative recurrence
        out = _one_pole(out, a)
    return out


def highpass(x: np.ndarray, cutoff: float, poles: int = 2) -> np.ndarray:
    return x - lowpass(x, cutoff, poles)


def bandpass(x: np.ndarray, center: float, width: float) -> np.ndarray:
    return lowpass(highpass(x, max(20.0, center - width / 2)), center + width / 2)


def _one_pole(x: np.ndarray, a: float) -> np.ndarray:
    """Vectorised y[n] = (1-a)x[n] + a*y[n-1] via scaled prefix sums."""
    n = len(x)
    if n == 0:
        return x
    # Chunked to keep a**k within float range.
    chunk = max(1, min(n, int(-700 / math.log(a)) if a > 0 else n))
    out = np.empty(n)
    carry = 0.0
    for start in range(0, n, chunk):
        seg = x[start : start + chunk]
        k = np.arange(len(seg))
        decay = a ** k
        acc = np.cumsum(seg * (1 - a) / decay) * decay
        out[start : start + len(seg)] = acc + carry * a ** (k + 1)
        carry = out[start + len(seg) - 1]
    return out


def reverb(x: np.ndarray, amount: float = 0.2, decay: float = 1.1, seed: int = 3) -> np.ndarray:
    """Cheap convolution reverb against a synthetic exponential-noise impulse."""
    if amount <= 0:
        return x
    rng = np.random.default_rng(seed)
    n_ir = int(decay * SR)
    t = np.arange(n_ir) / SR
    ir = rng.normal(0, 1, n_ir) * np.exp(-t / (decay * 0.34))
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir = lowpass(ir, 5200)
    ir /= np.sqrt(np.sum(ir**2)) + 1e-9
    size = 1 << (len(x) + n_ir - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size))[: len(x)]
    return x * (1 - amount * 0.35) + wet * amount


# ─────────────────────────────────────────────
# Mix helpers
# ─────────────────────────────────────────────


def add_at(buf: np.ndarray, sig: np.ndarray, start_sec: float, gain: float = 1.0) -> None:
    """Mix ``sig`` into ``buf`` at ``start_sec``, wrapping is the caller's job."""
    i = int(start_sec * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    end = min(len(buf), i + len(sig))
    buf[i:end] += sig[: end - i] * gain


def wrap_tail(buf: np.ndarray, loop_samples: int) -> np.ndarray:
    """Fold everything past the loop point back onto the start.

    This is what makes the loops seamless: reverb tails and note releases that
    run past the final bar reappear underneath the first bar.
    """
    head = buf[:loop_samples].copy()
    tail = buf[loop_samples:]
    if len(tail):
        n = min(len(tail), loop_samples)
        head[:n] += tail[:n]
    return head


def normalize(x: np.ndarray, peak: float = 0.89) -> np.ndarray:
    m = float(np.max(np.abs(x)))
    return x * (peak / m) if m > 1e-9 else x


def soft_limit(x: np.ndarray, ceiling: float = 0.95) -> np.ndarray:
    return np.tanh(x / ceiling) * ceiling


def stereo(left: np.ndarray, right: np.ndarray | None = None) -> np.ndarray:
    if right is None:
        right = left
    n = max(len(left), len(right))
    out = np.zeros((n, 2))
    out[: len(left), 0] = left
    out[: len(right), 1] = right
    return out


def widen(mono: np.ndarray, spread: float = 0.012) -> np.ndarray:
    """Haas-style widening so the BGM does not sit dead-centre."""
    delay = int(spread * SR)
    right = np.concatenate([np.zeros(delay), mono[:-delay]]) if delay else mono
    return stereo(mono * 0.96, right * 0.96)


def fade_edges(x: np.ndarray, ms: float = 6.0) -> np.ndarray:
    n = int(ms / 1000 * SR)
    if n * 2 >= len(x):
        return x
    out = x.copy()
    ramp = np.linspace(0, 1, n)
    if out.ndim == 1:
        out[:n] *= ramp
        out[-n:] *= ramp[::-1]
    else:
        out[:n] *= ramp[:, None]
        out[-n:] *= ramp[::-1, None]
    return out
