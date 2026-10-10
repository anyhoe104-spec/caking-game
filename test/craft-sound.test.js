import test from 'node:test';
import assert from 'node:assert/strict';
import { CRAFT_SOUND_KINDS, craftSoundSamples } from '../src/game/craftSound.js';
import { CRAFT_PRESENTATIONS } from '../src/game/craftPresentation.js';

test('every production prop has a bounded, deterministic, fade-edged foley cue', () => {
  const kinds = new Set(Object.values(CRAFT_PRESENTATIONS).flatMap(p => p.steps.map(s => s.kind)));
  assert.deepEqual(new Set(CRAFT_SOUND_KINDS), kinds);
  for (const rate of [44100, 48000]) for (const kind of kinds) {
    const samples = craftSoundSamples(kind, rate);
    assert.deepEqual(samples, craftSoundSamples(kind, rate));
    assert.ok(samples.length / rate < .75);
    let energy = 0, peak = 0;
    for (const value of samples) { assert.ok(Number.isFinite(value)); peak = Math.max(peak, Math.abs(value)); energy += value * value; }
    assert.ok(peak > .005 && peak < .25, `${kind}: peak ${peak}`);
    assert.ok(energy > .01);
    assert.equal(samples[0], 0);
    assert.ok(Math.abs(samples.at(-1)) < .001);
  }
  assert.equal(craftSoundSamples('unknown', 48000), null);
});
