export const BASE_MATERIALS = { egg: 5, cream: 5, strawberry: 5, flour: 5, sugar: 5, milk: 5, butter: 5 };

export const MATERIAL_LABELS = { egg: "卵", cream: "生クリーム", strawberry: "いちご", flour: "小麦粉", sugar: "砂糖", milk: "牛乳", butter: "バター" };
export const MATERIAL_KIDS_NAME = { egg: "たまご", cream: "くりーむ", strawberry: "いちご", flour: "こむぎこ", sugar: "さとう", milk: "ぎゅうにゅう", butter: "ばたー" };
export const LEVEL_CAP = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 22, 8: 24, 9: 27, 10: 30 };

export const RECIPES = [
  { name: "ショートケーキ", level: 1, price: 700, exp: 22, ingredients: { egg: 3, cream: 3, strawberry: 3, flour: 2, sugar: 2 } },
  { name: "プリン", level: 2, price: 450, exp: 14, ingredients: { egg: 2, milk: 3, sugar: 2 } },
  { name: "イチゴタルト", level: 3, price: 1000, exp: 36, ingredients: { egg: 5, sugar: 5, strawberry: 2, flour: 3, butter: 3 } },
  { name: "チョコケーキ", level: 4, price: 1200, exp: 42, ingredients: { egg: 3, flour: 3, sugar: 3, milk: 2, butter: 2 } },
  { name: "ミルフィーユ", level: 5, price: 1500, exp: 60, ingredients: { flour: 5, butter: 5, cream: 4, sugar: 3, strawberry: 2 } },
  { name: "フルーツパイ", level: 6, price: 1800, exp: 70, ingredients: { flour: 5, butter: 4, strawberry: 4, sugar: 4, cream: 2 } },
  { name: "デコレーションケーキ", level: 10, price: 3000, exp: 125, ingredients: { egg: 6, cream: 6, strawberry: 6, flour: 4, sugar: 4, butter: 2 } },
  { name: "王様のケーキ", level: 10, price: 3600, exp: 150, ingredients: { egg: 6, cream: 6, strawberry: 5, flour: 5, sugar: 5, butter: 4 } },
];

export const OPENING_LINES = ["ここは、海風のかおる小さな港町。", "猫耳の女の子ミフィは、ご主人様から古いケーキ店を任されました。", "「ミフィ、このお店をきみに任せる。町のみんなを笑顔にするケーキを作っておくれ」", "「はい、ご主人様！ ミフィ、がんばります！」", "失敗したり、大成功したりしながら、少しずつお店を大きくしていきます。", "目標は、職人レベル10、所持金100,000P。町いちばんの繁盛店を目指しましょう！"];
export const ENDING_LINES = ["港町の小さなケーキ店は、毎日お客さんでいっぱいのお店になりました。", "ミフィのケーキを食べた人たちは、みんな笑顔になりました。", "「よくがんばったね、ミフィ。このお店は、もう立派な繁盛店だ」", "「ありがとうございます、ご主人様！ ミフィ、もっともっとおいしいケーキを作ります！」", "CAKING！ 繁盛店達成！"];
