export const STORY_CHAPTERS = [
  { id:"first-light", level:1, title:"海風が運んだ鍵", speaker:"ミフィ", lines:["古びた鍵が、ちいさく鳴った。窓の向こうには港の白い帆。", "このお店、まだバターの匂いがする。前の店主さんも、ここで朝を迎えたのかな。", "最初の一皿は、いちごのショートケーキ。今日の『おいしい』を、ひとつずつ増やそう。"] },
  { id:"first-regular", level:3, title:"いつもの、ください", speaker:"ミル", lines:["昨日のお客様が、今日も同じ時間にやってきました。", "『いつもの』って、レシピの名前より特別な言葉ですね。", "ショーケースをいっぱいにするより、まずは目の前のお客様を笑顔にしましょう。"] },
  { id:"layers", level:5, title:"折り重なる日々", speaker:"ミフィ", lines:["生地を伸ばして、折りたたんで、また休ませる。ミルフィーユは急ぐと上手にできない。", "うまくいかなかった日も、きっと一枚の層になるんだね。", "今日の分を、丁寧に。昨日より少しだけ、きれいに。"] },
  { id:"harbor-party", level:10, title:"港町の祝福", speaker:"ミル", lines:["港のお祭りに、みんなで食べるケーキをお願いしたいそうです。", "小さな工房から始まった香りが、いまは町じゅうをつないでいます。", "職人Lv10と100,000P。目標の先にも、お店の朝は続いていきます。"] },
];

// New interludes bridge the original diary entries without changing progression.
STORY_CHAPTERS.push(
  { id: "pudding-letter", level: 2, title: "プリンと小さな手紙", speaker: "ミフィ", lines: ["おじいちゃんが、空の箱に手紙を添えて返してくれた。", "『妻と半分ずつ食べました』。プリンを分けると、うれしいも二つになるんだね。", "次は二つ買ってくれるかな、って？ ミル、今日はそんな計算はお休み！"] },
  { id: "rainy-window", level: 4, title: "雨の日の窓辺", speaker: "ミル", lines: ["雨粒の向こうで、通りの色がにじんでいます。今日はお客様も少なめ。", "ミフィはチョコケーキの切り口を、いつもよりゆっくり整えています。", "窓を拭いて、灯りをともして。来てくれた一人に、あたたかい時間を渡しましょう。"] },
  { id: "picnic-basket", level: 6, title: "ピクニックの約束", speaker: "ミフィ", lines: ["焼きあがったパイを見て、ふたごが顔を見合わせた。海まで持っていくんだって。", "崩れないように包むのも、おいしさの続き。箱の中で動かないかな？", "ミル、いつか私たちも海辺でおやつにしようね。今日は窓から見える青空で乾杯！"] },
  { id: "festival-ribbon", level: 8, title: "お祭り前夜のリボン", speaker: "ミル", lines: ["港のお祭りが近づいて、町の人たちが少しずつ飾りを持ってきてくれました。", "ローズさんはリボンを、子どもたちは貝殻を。この工房らしい色が集まります。", "大きなケーキには、まだ練習が必要です。ひとつずつ、今できることを重ねましょう。"] },
);
STORY_CHAPTERS.sort((a, b) => a.level - b.level);

const RESPONSES = {
  "first-light": ["ミフィ、この鍵には新しい朝が似合います。", "材料の数なら私に任せて。最初のお客様を迎えましょう。"],
  "pudding-letter": ["半分ずつ、ですか。売上帳には書けない大切な数字ですね。", "では、お返事を書きましょう。『またお二人でどうぞ』って。"],
  "first-regular": ["顔を覚えてもらえたんだ。なんだか、帽子が少しくすぐったいな。", "今日も同じおいしさにできるように、丁寧に作るね。"],
  "rainy-window": ["雨の音が、泡立て器の音と合うんだよ。ほら、聞こえる？", "傘を閉じたらほっとするような、お店にしたいな。"],
  "layers": ["休ませる時間も、製造のうち。ミフィも少しお茶にしませんか。", "その層は、工房が続いてきた証拠ですね。"],
  "picnic-basket": ["持ち歩く時間まで考えるのが、お店の仕事なんですね。", "約束です。私は風で伝票が飛ばないように押さえます！"],
  "festival-ribbon": ["お店を任された日は、こんなふうになるなんて思わなかった。", "うん。まずは明日の仕込みから！ みんなの顔を思い浮かべて作ろう。"],
  "harbor-party": ["大きなケーキの向こうに、最初の小さな一皿が見える気がする。", "明日も開けよう、このお店。『いつもの』を待っている人がいるから。"],
};

export function chapterDialogue(chapter) {
  const other = chapter.speaker === "ミフィ" ? "ミル" : "ミフィ";
  const replies = RESPONSES[chapter.id] ?? [];
  return [
    { speaker: chapter.speaker, text: chapter.lines[0] },
    { speaker: other, text: replies[0] ?? chapter.lines[1] },
    { speaker: chapter.speaker, text: chapter.lines[1] },
    { speaker: chapter.speaker, text: chapter.lines[2] },
    { speaker: other, text: replies[1] ?? chapter.lines[2] },
  ];
}
export function normalizeReadStories(value) {
  return Array.isArray(value) ? [...new Set(value.filter(id => STORY_CHAPTERS.some(chapter => chapter.id === id)))] : [];
}
export function finishStory(state, id) {
  const chapter = STORY_CHAPTERS.find(item => item.id === id);
  if (!chapter || state.level < chapter.level || state.readStoryIds?.includes(id)) return state;
  return { ...state, readStoryIds: [...normalizeReadStories(state.readStoryIds), id] };
}
