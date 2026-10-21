import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { CUSTOMERS, customerFor, generateCustomerQueue } from "../src/game/customers.js";
import { defaultSave, migrateSave } from "../src/game/storage.js";

test("the twelve customers carry their new names and pixel art", () => {
  assert.equal(CUSTOMERS.length, 12);
  assert.deepEqual(CUSTOMERS.map(c => c.name), ["スリーズ", "ノワ", "マダム・フィグ", "セージ", "オリーヴ", "トマ", "シェフ・ブール", "ペッシュ", "ミント", "メリッサ", "アプリコ", "カルダモン"]);
  for (const { key } of CUSTOMERS) {
    assert.ok(existsSync(`public/images/pixel/customers/${key}.png`), `icon for ${key}`);
    assert.ok(existsSync(`public/images/pixel/chibi/${key}.png`), `chibi for ${key}`);
  }
  // Called by name alone, without さん/くん/ちゃん.
  assert.ok(CUSTOMERS.every(c => !/(さん|くん|ちゃん)$/.test(c.name)));
});

test("a new day's queue points at the pixel icons", () => {
  const queue = generateCustomerQueue(10, 3);
  assert.ok(queue.length > 0);
  for (const entry of queue) {
    assert.equal(entry.avatarPath, `images/pixel/customers/${entry.key}.png`);
    assert.equal(customerFor(entry).name, entry.name);
  }
});

test("a save made before the renaming shows the new cast for customers already queued", () => {
  const old = { ...defaultSave(), gamePhase: "playing", dayPhase: "open",
    customerQueue: [
      { id: "day-1-0", name: "さくらさん", avatarPath: "images/characters/customer-sakura.png", orderRecipe: "ショートケーキ", status: "waiting", timeRemaining: 90 },
      { id: "day-1-1", name: "旅人さん", avatarPath: "images/characters/customer-traveler.png", orderRecipe: "フルーツパイ", status: "waiting", timeRemaining: 60 },
      { id: "day-1-2", name: "だれか", avatarPath: "https://example.com/x.png", orderRecipe: "プリン", status: "waiting", timeRemaining: 60 },
    ] };
  const [cerise, cardamom, unknown] = migrateSave(old).customerQueue;
  assert.equal(cerise.name, "スリーズ");
  assert.equal(cerise.avatarPath, "images/pixel/customers/cerise.png");
  assert.equal(cardamom.name, "カルダモン");
  assert.equal(cardamom.key, "cardamom");
  // An entry that matches nobody keeps its text but gets no image path from outside.
  assert.equal(unknown.avatarPath, null);
  assert.equal(unknown.timeRemaining, 60);
});
