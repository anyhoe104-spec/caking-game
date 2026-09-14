import { STORY_CHAPTERS } from "../game/story.js";
export default function StoryJournal({ level, readStoryIds = [], onRead }) {
  const available = STORY_CHAPTERS.filter(chapter => chapter.level <= level);
  const unread = available.filter(chapter => !readStoryIds.includes(chapter.id)).length;
  return <section className="storyJournal card" aria-label="工房のものがたり">
    <div><span className="eyebrow">ATELIER DIARY</span><h3>工房のものがたり</h3><p className="journalSummary">読了 {readStoryIds.length} / {STORY_CHAPTERS.length}章 · {unread ? `まだ読んでいないお話 ${unread}章` : "解放されたお話はすべて読了"}</p></div>
    <div className="chapterList">{STORY_CHAPTERS.map((chapter, i) => {
      const locked = level < chapter.level, read = readStoryIds.includes(chapter.id);
      return <button key={chapter.id} disabled={locked} onClick={event => onRead(chapter, event.currentTarget)} aria-label={`${chapter.title} ${locked ? `Lv${chapter.level}で解放` : read ? "読み返す" : "読む"}`}>
        <span>{String(i + 1).padStart(2, "0")}</span><strong>{chapter.title}</strong><small>{locked ? `Lv${chapter.level}` : read ? "読了 · 読み返す" : "NEW · 読む ›"}</small>
      </button>;
    })}</div>
  </section>;
}
