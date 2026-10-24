import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { STORY_CHAPTERS, chapterDialogue, chapterScene, finishStory } from '../src/game/story.js';
import { defaultSave, migrateSave, createBackup, parseBackup } from '../src/game/storage.js';

test('all eight chapters have unique ids, ordered gates and five complete dialogue beats', () => {
  assert.equal(STORY_CHAPTERS.length, 8);
  assert.equal(new Set(STORY_CHAPTERS.map(c => c.id)).size, 8);
  assert.deepEqual(STORY_CHAPTERS.map(c => c.level), [1, 2, 3, 4, 5, 6, 8, 10]);
  for (const chapter of STORY_CHAPTERS) {
    const lines = chapterDialogue(chapter);
    assert.equal(lines.length, 5);
    assert.deepEqual(new Set(lines.map(line => line.speaker)), new Set(['ミフィ', 'ミル']));
    assert.ok(lines.every(line => typeof line.text === 'string' && line.text.length > 10));
  }
});
test('only an unlocked chapter can be marked read, once, without changing the economy', () => {
  const state = defaultSave();
  assert.equal(finishStory(state, 'unknown'), state);
  assert.equal(finishStory(state, 'harbor-party'), state);
  const read = finishStory(state, 'first-light');
  assert.deepEqual(read.readStoryIds, ['first-light']);
  assert.equal(finishStory(read, 'first-light'), read);
  assert.deepEqual({ ...read, readStoryIds: [] }, state);
});
test('read chapters survive migration and backups, old saves and malformed ids are safe', () => {
  assert.deepEqual(migrateSave({ money: 456 }).readStoryIds, []);
  const state = migrateSave({ ...defaultSave(), readStoryIds: ['first-light', 'first-light', null, 'unknown'] });
  assert.deepEqual(state.readStoryIds, ['first-light']);
  assert.deepEqual(parseBackup(createBackup(state)).readStoryIds, ['first-light']);
});

test("every chapter has a scene and expressions that exist as images", () => {
  const OLD_NAMES = /ローズ|サクラ|ヒロト|ミチル|カイ/;
  for (const chapter of STORY_CHAPTERS) {
    const scene = chapterScene(chapter);
    assert.ok(existsSync(`public/images/backgrounds/${scene.background}.png`), `${chapter.id} background`);
    for (const line of chapterDialogue(chapter)) {
      assert.ok(!OLD_NAMES.test(line.text), `${chapter.id} uses a customer's old name`);
      // Busts are used indoors; outdoors the full-length poses stand in for them.
      if (scene.indoors) {
        const who = line.speaker === "ミフィ" ? "mify" : "miru";
        assert.ok(existsSync(`public/images/characters/bust/${who}-${line.mood}.png`), `${chapter.id}: ${who}-${line.mood}`);
      }
    }
  }
  assert.equal(STORY_CHAPTERS.filter(chapter => !chapterScene(chapter).indoors).map(c => c.id).join(), "harbor-party");
});
