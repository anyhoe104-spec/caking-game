import test from 'node:test';
import assert from 'node:assert/strict';
import { buyCakePart, equipCakePart, normalizeCakeParts } from '../src/game/cakeParts.js';
import { defaultSave, migrateSave, saveGame, loadSave } from '../src/game/storage.js';
test('old saves keep progress and receive the free starter part',()=> {
  const state=migrateSave({money:3456,level:5,craftCount:29});
  assert.equal(state.money,3456);assert.equal(state.craftCount,29);
  assert.deepEqual(state.ownedCakeParts,['berry']);assert.deepEqual(state.cakeStyle,{top:'berry',band:null});
});
test('parts purchase is affordable, idempotent and never accepts premium or unknown ids',()=> {
  const state=defaultSave();
  assert.equal(buyCakePart(state,'ribbon'),state);
  assert.equal(buyCakePart(state,'crown'),state);
  assert.equal(buyCakePart(state,'invalid'),state);
  const bought=buyCakePart(state,'mint');assert.equal(bought.money,400);
  assert.equal(buyCakePart(bought,'mint'),bought);
  assert.equal(equipCakePart(state,'mint'),state);
  const equipped=equipCakePart(bought,'mint');assert.equal(equipped.cakeStyle.top,'mint');
});
test('browser saves cannot grant premium rights or equip unowned or wrong-slot parts',()=> {
  const state=normalizeCakeParts({ownedCakeParts:['crown','mint','mint','bad'],cakeStyle:{top:'crown',band:'mint'}});
  assert.deepEqual(state.ownedCakeParts,['berry','mint']);assert.deepEqual(state.cakeStyle,{top:'berry',band:null});
});
test('part ownership and both equipment slots survive a save reload',()=> {
  let state={...defaultSave(),money:5000};
  for(const id of ['mint','ribbon']) state=equipCakePart(buyCakePart(state,id),id);
  const values=new Map();const storage={getItem:key=>values.get(key),setItem:(key,val)=>values.set(key,val)};
  saveGame(state,storage);const loaded=loadSave(storage);
  assert.equal(loaded.money,3200);assert.deepEqual(loaded.cakeStyle,{top:'mint',band:'ribbon'});
  assert.deepEqual(loaded.ownedCakeParts,['berry','mint','ribbon']);
});
