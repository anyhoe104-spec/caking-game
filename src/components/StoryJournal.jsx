import { useState } from "react";
import { STORY_CHAPTERS } from "../game/story.js";
import { Modal } from "./common.jsx";
export default function StoryJournal({ level }) {
  const [selected,setSelected] = useState(null);
  return <section className="storyJournal card"><div><span className="eyebrow">ATELIER DIARY</span><h3>工房のものがたり</h3></div>
    <div className="chapterList">{STORY_CHAPTERS.map((chapter,i)=><button key={chapter.id} disabled={level < chapter.level} onClick={()=>setSelected(chapter)}><span>0{i+1}</span><strong>{chapter.title}</strong><small>{level < chapter.level ? `Lv${chapter.level}` : "読む ›"}</small></button>)}</div>
    {selected && <Modal title={selected.title} labelledBy="story-title" onClose={()=>setSelected(null)}><p className="eyebrow">{selected.speaker}の記録</p>{selected.lines.map(line=><p className="journalLine" key={line}>{line}</p>)}<button className="primaryBtn" onClick={()=>setSelected(null)}>工房にもどる</button></Modal>}
  </section>;
}
