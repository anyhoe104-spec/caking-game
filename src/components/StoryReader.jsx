import { useState } from "react";
import { Modal } from "./common.jsx";
import { BASE, MIFFY_IMG, miruImg } from "../game/assets.js";
import { chapterDialogue } from "../game/story.js";

export default function StoryReader({ chapter, onClose, onFinish, returnFocusRef }) {
  const [page, setPage] = useState(0);
  const lines = chapterDialogue(chapter);
  const current = lines[page];
  const last = page === lines.length - 1;
  return <Modal title={chapter.title} onClose={onClose} returnFocusRef={returnFocusRef}>
    <div className="storyTheater" style={{ "--story-background": `url(${BASE}images/backgrounds/${chapter.level >= 8 ? "bg-ending" : "bg-shop"}.png)` }}>
      <span className="storyLocation">港町のケーキ工房 · Lv{chapter.level}</span>
      <div className={`storyPortrait ${current.speaker === "ミフィ" ? "isSpeaking" : ""}`}><img src={MIFFY_IMG[page === 4 ? "happy" : "normal"]} alt="ミフィ" /><span>ミフィ</span></div>
      <div className={`storyPortrait storyPortrait--miru ${current.speaker === "ミル" ? "isSpeaking" : ""}`}><img src={miruImg(page === 4 ? "happy" : "normal")} alt="ミル" /><span>ミル</span></div>
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
