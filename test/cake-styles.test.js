import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES } from '../src/game/data.js';
import { buyCakePart, cakeStyleFor, equipCakePart, resetCakeParts, storefrontCakeStyle } from '../src/game/cakeParts.js';
import { completeCraft } from '../src/game/crafting.js';
import { defaultSave, loadSave, migrateSave, parseBackup, createBackup, saveGame } from '../src/game/storage.js';

const everyRecipe = style => Object.fromEntries(RECIPES.map(recipe => [recipe.name, style]));
const memory = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }; };

test('a save from before per-recipe styles keeps its look on every cake', () => {
  const state = migrateSave({ money: 3200, ownedCakeParts: ['berry', 'mint', 'ribbon'], cakeStyle: { top: 'mint', band: 'ribbon' } });
  assert.deepEqual(state.cakeStyles, everyRecipe({ top: 'mint', band: 'ribbon' }));
  assert.equal('cakeStyle' in state, false);
  assert.equal(state.lastCraftedRecipe, null);
  assert.deepEqual(storefrontCakeStyle(state), { top: 'mint', band: 'ribbon' });
});

test('a save with no decoration at all starts every cake from the house style', () => {
  assert.deepEqual(migrateSave({ money: 10 }).cakeStyles, everyRecipe({ top: 'berry', band: null }));
});

test('per-recipe styles are validated one recipe at a time', () => {
  const state = migrateSave({
    ownedCakeParts: ['berry', 'mint', 'ribbon', 'crown'],
    cakeStyle: { top: 'mint', band: null },
    cakeStyles: { 'プリン': { top: 'crown', band: 'ribbon' }, 'チョコケーキ': { top: 'mint', band: 'mint' }, 'ないケーキ': { top: 'mint' }, '__proto__': { top: 'mint' } },
  });
  // Premium and wrong-slot ids fall back slot by slot; valid slots survive.
  assert.deepEqual(state.cakeStyles['プリン'], { top: 'berry', band: 'ribbon' });
  assert.deepEqual(state.cakeStyles['チョコケーキ'], { top: 'mint', band: null });
  // A recipe missing from cakeStyles takes the legacy single style, not the default.
  assert.deepEqual(state.cakeStyles['ショートケーキ'], { top: 'mint', band: null });
  assert.deepEqual(Object.keys(state.cakeStyles), RECIPES.map(recipe => recipe.name));
});

test('equipping and resetting change only the chosen cake', () => {
  let state = { ...defaultSave(), money: 5000 };
  state = buyCakePart(buyCakePart(state, 'mint'), 'ribbon');
  state = equipCakePart(state, 'mint', 'プリン');
  state = equipCakePart(state, 'ribbon', 'プリン');
  state = equipCakePart(state, 'ribbon', 'ショートケーキ');
  assert.deepEqual(cakeStyleFor(state, 'プリン'), { top: 'mint', band: 'ribbon' });
  assert.deepEqual(cakeStyleFor(state, 'ショートケーキ'), { top: 'berry', band: 'ribbon' });
  assert.deepEqual(cakeStyleFor(state, 'イチゴタルト'), { top: 'berry', band: null });

  const bare = resetCakeParts(state, 'band', 'プリン');
  assert.deepEqual(cakeStyleFor(bare, 'プリン'), { top: 'mint', band: null });
  assert.deepEqual(cakeStyleFor(bare, 'ショートケーキ'), { top: 'berry', band: 'ribbon' });
  assert.deepEqual(cakeStyleFor(resetCakeParts(state, 'all', 'プリン'), 'プリン'), { top: 'berry', band: null });
  assert.equal(bare.money, state.money);
  assert.deepEqual(bare.ownedCakeParts, state.ownedCakeParts);
});

test('parts bought once can be worn by every recipe', () => {
  const state = buyCakePart({ ...defaultSave(), money: 600 }, 'mint');
  assert.equal(state.money, 0);
  for (const recipe of RECIPES) assert.equal(cakeStyleFor(equipCakePart(state, 'mint', recipe.name), recipe.name).top, 'mint');
});

test('unknown or hostile recipe names leave the save untouched', () => {
  const state = buyCakePart({ ...defaultSave(), money: 600 }, 'mint');
  for (const recipe of ['ないケーキ', '__proto__', undefined]) {
    assert.equal(equipCakePart(state, 'mint', recipe), state);
    assert.equal(resetCakeParts(state, 'all', recipe), state);
  }
});

test('the storefront shows the cake made most recently', () => {
  let state = { ...defaultSave(), gamePhase: 'playing', dayPhase: 'prep', level: 5, money: 5000, materials: Object.fromEntries(Object.keys(defaultSave().materials).map(key => [key, 50])) };
  state = equipCakePart(buyCakePart(state, 'ribbon'), 'ribbon', 'プリン');
  assert.deepEqual(storefrontCakeStyle(state), { top: 'berry', band: null });
  state = completeCraft(state, RECIPES.find(recipe => recipe.name === 'プリン'), 'success').state;
  assert.equal(state.lastCraftedRecipe, 'プリン');
  assert.deepEqual(storefrontCakeStyle(state), { top: 'berry', band: 'ribbon' });
  state = completeCraft(state, RECIPES[0], 'fail').state;
  assert.equal(state.lastCraftedRecipe, RECIPES[0].name);
  assert.deepEqual(storefrontCakeStyle(state), { top: 'berry', band: null });
});

test('per-recipe styles and the storefront recipe survive save, reload and backup', () => {
  let state = { ...defaultSave(), money: 5000, lastCraftedRecipe: 'プリン' };
  state = equipCakePart(buyCakePart(state, 'mint'), 'mint', 'プリン');
  const storage = memory();
  saveGame(state, storage);
  const loaded = loadSave(storage);
  assert.deepEqual(loaded.cakeStyles, state.cakeStyles);
  assert.equal(loaded.lastCraftedRecipe, 'プリン');
  const restored = parseBackup(createBackup(state));
  assert.deepEqual(restored.cakeStyles, state.cakeStyles);
  assert.equal(restored.lastCraftedRecipe, 'プリン');
  assert.equal(migrateSave({ ...state, lastCraftedRecipe: 'ないケーキ' }).lastCraftedRecipe, null);
});
