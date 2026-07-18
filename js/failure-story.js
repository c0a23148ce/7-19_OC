/* ============================================================
   失敗体験シーン（1日目 夜）のストーリーデータ。
   紙芝居のように1ページ1場面ずつ見せるための構成。
   ============================================================ */

// 食料を渡さなかった1人が倒れる瞬間の短い一文（4人分・固定文言）
const COLLAPSE_LINE = {
  elder: "高齢者が、意識を失って倒れてしまいました。",
  injured: "怪我人が、回復が遅れて動けなくなってしまいました。",
  pregnant: "妊婦が、体調を急変させて倒れてしまいました。",
  child: "子どもが、衰弱して動けなくなってしまいました。"
};

// 2人のIDから、CHARACTERSの並び順で正規化したキーを作る（順不同で同じ組み合わせを同一視するため）
function pairKey(idA, idB){
  const order = CHARACTERS.map(c => c.id);
  return [idA, idB].sort((a, b) => order.indexOf(a) - order.indexOf(b)).join("_");
}

// 除外した2人の組み合わせごとの、キャンプ全体への影響まとめ（固定文言）
const COMBO_TEXT = {
  elder_injured: "怪我の手当ても、灯りへの対応も、どちらもうまくいきません。あなたは自分の判断がこの状況を招いたことを痛感しながら、なす術もなく夜を過ごすことになりました。",
  elder_pregnant: "手当てをしてくれる人がいない中、妊婦の様子も急変し、あなたは自分の傷の痛みと妊婦への不安を、同時に抱えることになりました。",
  elder_child: "手当てのできる人がいない中、子どもの姿も見えなくなり、あなたはケガの痛みに耐えながら、暗い中で子どもを探し回ることになりました。",
  injured_pregnant: "合図を送れる人がいない中、妊婦の体調まで急変し、あなたは灯りを追うことも妊婦に付き添うことも、どちらも中途半端になってしまいました。",
  injured_child: "合図を送れる人がいなかった上に、気づいたときには子どもの居場所も分からなくなっていて、あなたは一晩中、二つの不安に同時に押しつぶされそうになっていました。",
  pregnant_child: "深夜、些細なことから怪我人と高齢者の間で言い争いになります。さっきまでは妊婦が間に入ってなだめてくれたはずですが、気づけば気まずい空気が夜通し流れ、あなたもほとんど眠れないまま朝を迎えました。"
};

const FAILURE_INTRO_LINE = "焚き火の炎が、静かに揺れています。";

// notSelectedの並び順（CHARACTERS配列順）に揃えて「○○と○○」の形にする
function orderedRoleLabels(ids){
  return CHARACTERS.filter(c => ids.includes(c.id)).map(c => ROLE_LABEL[c.id]);
}

// 「食料を渡す2人」「渡さなかった2人」から、紙芝居のページ構成を組み立てる
function buildFailurePages(decision1){
  const selected = decision1.slice(0, FOOD_RECIPIENTS);
  const notSelected = decision1.slice(FOOD_RECIPIENTS);
  const [labelA, labelB] = orderedRoleLabels(notSelected);
  const [fedA, fedB] = orderedRoleLabels(selected);

  return [
    { type: "intro" },
    { type: "collapse", id: notSelected[0] },
    { type: "collapse", id: notSelected[1] },
    { type: "summary", introLine: labelA + "と" + labelB + "が倒れてしまいました。", bodyText: COMBO_TEXT[pairKey(notSelected[0], notSelected[1])] },
    { type: "fedpair", line: fedA + "と" + fedB + "は眠ってしまいましたが、あなたは寝付くことができません。" }
  ];
}
