/* ============================================================
   キャラクターデータ
   ============================================================ */
const CHARACTERS = [
  {
    id: "elder",
    name: "医療知識のある高齢者",
    abbrev: "高",
    color: { bg:"#dbeedd", text:"#3f7d4f" },
    trait: "高齢だが、医療の知識がある。",
    introExtra: "ケガや体調不良への応急処置ができる、漂流生活での頼れる存在。ただし、食料を得られなければ意識を失うほど衰弱してしまう危険もある。",
    shortConsequence: "倒れると医療の知識が使えなくなる。",
    emoji: "🧓",
    emojiCollapsed: "😪",
    capability: "medical",
    regretType: "実利的",
    keywords: ["知識","医療","役に立つ","経験","処置"]
  },
  {
    id: "injured",
    name: "ケガをした元漁師",
    abbrev: "漁",
    color: { bg:"#f5e3cf", text:"#9a5a1f" },
    trait: "足を怪我しているが、元漁師で海のことに詳しい。",
    introExtra: "長年海で暮らしてきた経験があり、荒れた無人島でも何かと頼りにされそうです。ただし、食料を得られなければ回復が遅れ、動けなくなってしまう危険もある。",
    shortConsequence: "倒れると回復が遅れ、動けなくなる。",
    emoji: "🤕",
    emojiCollapsed: "😫",
    capability: "sea",
    regretType: "実利的",
    keywords: ["漁師","経験","海","知識","役に立つ"]
  },
  {
    id: "pregnant",
    name: "妊婦",
    abbrev: "妊",
    color: { bg:"#f9d9e3", text:"#a3486a" },
    trait: "もうすぐ出産予定で、体調に不安がある。",
    introExtra: "出産が近く、栄養状態が母子二人の命に直結する状況にある。ただし、食料を得られなければ、体調が急変してしまいます。",
    shortConsequence: "倒れると母子ともに危険な状態になる。",
    emoji: "🤰",
    emojiCollapsed: "😖",
    capability: null,
    regretType: "感情的・罪悪感",
    keywords: ["かわいそう","弱い","守る","命","赤ちゃん","母子"]
  },
  {
    id: "child",
    name: "子ども",
    abbrev: "子",
    color: { bg:"#fbe7cd", text:"#a3701f" },
    trait: "幼く、保護者がいない状態で漂流している。",
    introExtra: "保護者がおらず、大人のサポートなしでは生き延びるのが難しい状況にある。ただし、食料を得られなければ、衰弱して動けなくなってしまいます。",
    shortConsequence: "倒れると一人で生き延びるのが難しくなる。",
    emoji: "🧒",
    emojiCollapsed: "😢",
    capability: null,
    regretType: "感情的・罪悪感",
    keywords: ["かわいそう","弱い","守る","子ども","一人","幼い"]
  }
];

// 失敗体験シーン（1日目の夜）で使う、短い役割ラベル。
// 「医療知識のある高齢者」のような詳しい呼び方ではなく、簡潔なカードのセリフ用。
const ROLE_LABEL = {
  elder: "高齢者",
  injured: "怪我人",
  pregnant: "妊婦",
  child: "子ども"
};

const FOOD_RECIPIENTS = 2; // 食料を渡す人数（プレイヤーを除く4人のうち何人か）

function getChar(id){ return CHARACTERS.find(c => c.id === id); }
