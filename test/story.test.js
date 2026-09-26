import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_CHAPTERS, chapterDialogue, finishStory } from '../src/game/story.js';
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
