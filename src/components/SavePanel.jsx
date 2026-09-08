import { useRef, useState } from "react";
import { createBackup, parseBackup, MAX_BACKUP_LENGTH } from "../game/storage.js";

export default function SavePanel({ state, saveStatus, onRestore, onRetry }) {
  const [source, setSource] = useState("");
  const [exported, setExported] = useState("");
  const [candidate, setCandidate] = useState(null);
  const [message, setMessage] = useState("");
  const output = useRef(null);
  const inspect = () => {
    try { setCandidate(parseBackup(source)); setMessage(""); }
    catch (error) { setCandidate(null); setMessage(error.message); }
  };
  const readFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCandidate(null);
    if (file.size > MAX_BACKUP_LENGTH) { setMessage("200KB以内のファイルを選んでください。"); return; }
    try { setSource(await file.text()); setMessage("読み込みました。内容を確認してください。"); }
    catch { setMessage("ファイルを開けませんでした。テキストの貼り付けも使えます。"); }
  };
  const restore = () => {
    try { onRestore(candidate); }
    catch { setMessage("端末に保存できないため復元を中止しました。現在の進行は変更していません。"); }
  };
  return <section className="settingsSection savePanel">
    <h3>工房のバックアップ</h3>
    <p className="settingsHint">進行はこの端末に自動保存されます。アプリの削除や端末の変更に備えて、バックアップの全文をメモなどに保管してください。購入の証明には使えません。</p>
    <p role="status">{saveStatus === "saved" ? "✓ この端末に保存済み" : "端末への保存を確認してください"}</p>
    {saveStatus !== "saved" && <button className="secondaryBtn" onClick={onRetry}>保存を再試行</button>}
    <button className="secondaryBtn" onClick={() => { setExported(createBackup(state)); setMessage("バックアップを作成しました。全文を端末の外にも保管してください。"); }}>バックアップを作る</button>
    {exported && <div className="backupBox">
      <label htmlFor="backup-output">保管するバックアップ</label>
      <textarea id="backup-output" ref={output} value={exported} readOnly rows={5} spellCheck={false} />
      <button className="secondaryBtn" onClick={async () => {
        output.current?.select();
        try { await navigator.clipboard.writeText(exported); setMessage("全文をコピーしました。メモなどに貼り付けて保管してください。"); }
        catch { setMessage("全文を選択しました。端末のコピー操作を使ってください。"); }
      }}>全文をコピー</button>
    </div>}
    <details className="backupBox">
      <summary>バックアップから復元</summary>
      <p className="settingsHint">内容を確認してから、今の工房を置き換えます。先に現在のバックアップを保管してください。</p>
      <label htmlFor="backup-input">バックアップの全文</label>
      <textarea id="backup-input" value={source} maxLength={MAX_BACKUP_LENGTH} rows={5} spellCheck={false} onChange={e => { setSource(e.target.value); setCandidate(null); setMessage(""); }} />
      <label className="backupFile">テキストファイルを選ぶ<input type="file" accept=".json,.txt,application/json,text/plain" onChange={readFile} /></label>
      <button className="secondaryBtn" disabled={!source.trim()} onClick={inspect}>復元内容を確認</button>
      {candidate && <div className="confirmBox">
        <p>{candidate.dayNumber}日目・Lv{candidate.level}・{candidate.money.toLocaleString()}P</p>
        <p>製造 {candidate.craftCount}回／おめかし {candidate.ownedCakeParts.length}種</p>
        <p>この工房で現在の進行を置き換えます。</p>
        <div className="rowGap"><button className="dangerBtn" onClick={restore}>この内容で復元する</button><button className="secondaryBtn" onClick={() => setCandidate(null)}>やめる</button></div>
      </div>}
    </details>
    <p role="status" className="backupMessage">{message}</p>
  </section>;
}
