/* ============================================================
   判断タイプ判定：
   「食料を渡す2人」の組み合わせだけでリアルタイムに3タイプへ分類する。
   自由記述の理由（キーワード）はこの判定には使わず、
   calcReasonKeywordScore で別途スコア化して保存のみ行う。
   ============================================================ */
function classifyByComposition(selectedIds){
  const utilCount = selectedIds.filter(id => getChar(id).regretType === "実利的").length;
  if(utilCount === selectedIds.length){
    return { code:"U", label:"功利主義型", desc:"実利的な役割（医療の知識・海の知識など）を優先した判断です。", score:7 };
  }
  if(utilCount === 0){
    return { code:"D", label:"義務論型", desc:"守るべき弱さ・保護の必要性を優先した判断です。", score:-7 };
  }
  return { code:"M", label:"中間型", desc:"実利的な観点と、守るべき弱さの両方を考慮した判断です。", score:0 };
}

// 自由記述の理由に含まれるキーワードのスコア。リアルタイム判定には使わず、
// 後から分析するための参考データとしてのみ保存する。
// ※これは本研究独自の暫定ルールです。研究者の確認が前提です。
function calcReasonKeywordScore(selectedIds, reasonText){
  let score = 0;
  selectedIds.forEach(id => {
    const c = getChar(id);
    score += (c.regretType === "実利的") ? 2 : -2;
  });
  const text = reasonText || "";
  CHARACTERS.forEach(c => {
    c.keywords.forEach(k => {
      if(text.includes(k)) score += (c.regretType === "実利的") ? 1 : -1;
    });
  });
  return score;
}

const ALL_TYPES = [
  { code:"U", label:"功利主義型", score:7 },
  { code:"M", label:"中間型", score:0 },
  { code:"D", label:"義務論型", score:-7 }
];
