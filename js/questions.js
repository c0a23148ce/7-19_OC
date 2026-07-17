/* ============================================================
   漂流日記（旧アンケート）の設問定義
   「理由」「納得感」「自己帰属感」は漂流日記①・④で同一文言を共有する。
   各日記の最後には、任意（未回答でも次へ進める）の自由記述欄
   「ひとこと」を追加する。
   ============================================================ */
const Q_REASON = { id:"reason", type:"text", text:"なぜこの2人に食料を渡すことにしましたか？理由を教えてください。" };
const Q_CONVICTION = { id:"conviction", type:"likert", text:"今回の判断について、自分の中で納得できていますか？", low:"全く納得できていない", high:"とても納得できている" };
const Q_OWNERSHIP = { id:"ownership", type:"likert", text:"この判断は、自分でしっかり考えて決めたと思いますか？", low:"全くそう思わない", high:"とてもそう思う" };
const Q_NOTE = { id:"note", type:"text", text:"ひとこと（任意）", required:false, placeholder:"今の気持ちを自由に書いてもいいですよ" };

// 漂流日記①（決断①直後）
const SURVEY1_QUESTIONS = [Q_REASON, Q_CONVICTION, Q_OWNERSHIP, Q_NOTE];

// 漂流日記②（失敗体験直後・自由記述なし＋任意のひとことのみ）
const SURVEY2_QUESTIONS = [
  { id:"surprise", type:"likert", text:"この結果は、あなたが予想していた通りのものでしたか？", low:"予想通りだった", high:"予想外だった" },
  { id:"practical_regret", type:"likert", text:"「あの人がいたら、もっと安全に過ごせたかもしれない」と思う気持ちはありますか？", low:"全くない", high:"とてもある" },
  { id:"emotional_regret", type:"likert", text:"「かわいそうなことをしてしまった」と思う気持ちはありますか？", low:"全くない", high:"とてもある" },
  Q_NOTE
];

// 漂流日記③（比較フィードバック直後）
const SURVEY3_QUESTIONS = [
  { id:"insight", type:"text", text:"他の参加者の判断や、あなたと考え方が違う人の例を見て、気づいたことがあれば教えてください。" },
  { id:"type_reaction", type:"likert", text:"自分と違うタイプ（功利主義型／中間型／義務論型）の考え方に、納得できる部分がありましたか？", low:"全くなかった", high:"とてもあった" },
  Q_NOTE
];

// 漂流日記④（決断②直後）
const SURVEY4_QUESTIONS = [
  Q_REASON,
  { id:"change_reason", type:"text", text:"前回の判断と比べて、今回の判断は変わりましたか？変わった場合も、変わらなかった場合も、その理由を教えてください。" },
  Q_CONVICTION,
  Q_OWNERSHIP,
  Q_NOTE
];

// 各漂流日記の冒頭に添える、直感で答えることを促す一言
const DIARY_INTUITION_HINT = "正解はありません。深く考えすぎず、今の気持ちのまま直感で書いてください。";
