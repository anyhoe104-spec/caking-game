import { useState } from "react";
import { Modal } from "./common.jsx";
import { BASE, MIFY_IMG, bustImg, miruImg } from "../game/assets.js";
import { chapterDialogue, chapterScene } from "../game/story.js";

const WHO = { ミフィ: "mify", ミル: "miru" };
const RESTING = { mify: "gentle", miru: "neutral" };
// Outdoors the full-length figures are used; they have fewer poses than the bust-ups.
const STANDING = {
  mify: { moved: "happy", savoring: "happy", beaming: "happy", energetic: "excited", troubled: "sad" },
  miru: { serene: "happy", smug: "happy", beaming: "happy" },
};

/** Each character's expression on a page: their own line's, else the last one they had. */
function moodsAt(lines, page) {
  const moods = { ...RESTING };
  for (const line of lines.slice(0, page + 1)) moods[WHO[line.speaker]] = line.mood;
  return moods;
}

export default function StoryReader({ chapter, onClose, onFinish, returnFocusRef }) {
  const [page, setPage] = useState(0);
  const lines = chapterDialogue(chapter);
  const current = lines[page];
  const last = page === lines.length - 1;
  const scene = chapterScene(chapter);
  const moods = moodsAt(lines, page);
  const portrait = who => scene.indoors ? bustImg(who, moods[who])
    : who === "mify" ? MIFY_IMG[STANDING.mify[moods.mify] ?? "normal"] : miruImg(STANDING.miru[moods.miru] ?? "normal");
  return <Modal title={chapter.title} onClose={onClose} returnFocusRef={returnFocusRef}>
    <div className={`storyTheater ${scene.indoors ? "storyTheater--bust" : ""}`} style={{ "--story-background": `url(${BASE}images/backgrounds/${scene.background}.png)` }}>
      <span className="storyLocation">{scene.label} · Lv{chapter.level}</span>
      <div className={`storyPortrait ${current.speaker === "ミフィ" ? "isSpeaking" : ""}`}><img src={portrait("mify")} alt="ミフィ" /><span>ミフィ</span></div>
      <div className={`storyPortrait storyPortrait--miru ${current.speaker === "ミル" ? "isSpeaking" : ""}`}><img src={portrait("miru")} alt="ミル" /><span>ミル</span></div>
    </div>
    <div className="storyDialogue" aria-live="polite" aria-atomic="true"><strong>{current.speaker}</strong><p key={page}>{current.text}</p></div>
    <div className="storyReaderControls">
      <button className="secondaryBtn" disabled={page === 0} onClick={() => setPage(n => n - 1)}>前へ</button>
      <span aria-label={`${lines.length}ページ中${page + 1}ページ`}>{page + 1} / {lines.length}</span>
      <button className="primaryBtn" onClick={() => last ? onFinish(chapter.id) : setPage(n => n + 1)}>{last ? "読み終えて工房へ" : "次へ"}</button>
    </div>
    <p className="storyPauseNote">お話の間は営業時間と食材回復が止まります。途中で閉じても、また最初から読めます。</p>
  </Modal>;
}
