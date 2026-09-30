import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { VOICE_KEYS } from '../src/game/audioAssets.js';

test('all shipped voices retain Japanese transcript, attribution and valid asset metadata', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/sounds/manifest.json', import.meta.url)));
  const voices = manifest.assets.filter(a => a.kind === 'voice');
  assert.equal(voices.length, VOICE_KEYS.length);
  for (const key of VOICE_KEYS) {
    const entry = voices.find(a => a.file === `${key}.mp3`);
    assert.equal(entry.source, 'VOICEVOX');
    assert.equal(entry.styleId, key.includes('miffy') ? 2 : 3);
    assert.equal(entry.credit, key.includes('miffy') ? 'VOICEVOX:四国めたん' : 'VOICEVOX:ずんだもん');
    assert.match(entry.text, /[ぁ-んァ-ン一-龯]/);
    assert.match(entry.modelSha256, /^[0-9a-f]{64}$/);
    assert.ok(entry.seconds > .3 && entry.seconds < 2.5);
    assert.equal(statSync(new URL(`../public/sounds/${entry.file}`, import.meta.url)).size, entry.bytes);
  }
});
