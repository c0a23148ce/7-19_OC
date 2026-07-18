/* ============================================================
   状態管理
   ============================================================ */
// 決断①のあとで実験群／統制群に分岐するため、進捗バー用の並び順も群ごとに用意する。
// 「診断1」（自己診断カード）までは両群共通。
const STEP_ORDER_COMMON = ["start","backstory","opening","intro1","intro2","decision1","survey1","diagnosis1"];
const STEP_ORDER_EXPERIMENTAL = STEP_ORDER_COMMON.concat(["failure","day1seal","survey2","comparison","survey3","rewind","decision2","survey4","day2seal","success","survey5","end"]);
const STEP_ORDER_CONTROL = STEP_ORDER_COMMON.concat(["controlBridge","decision2","survey4","day2seal","success","survey5","end"]);

// 進捗バーの計算に使う、現在のセッションの群に応じた並び順
// （群がまだ決まっていない＝決断①より前の共通区間では実験群側の並びで代用してよい）
function currentStepOrder(){
  return state.group === "control" ? STEP_ORDER_CONTROL : STEP_ORDER_EXPERIMENTAL;
}

// 各STEPの冒頭に表示する日付・時間帯（対象外のstepには表示しない）
const STEP_DATE_LABELS = {
  intro1: "1日目 昼",
  intro2: "1日目 昼",
  decision1: "1日目 夕方",
  failure: "1日目 夜",
  comparison: "2日目 朝",
  decision2: "2日目 昼"
};

let stepEnteredAt = Date.now();

const state = {
  step: "start",
  participantId: (crypto.randomUUID ? crypto.randomUUID() : "p-" + Math.random().toString(36).slice(2)),
  sessionStartedAt: nowJST(), // 参加者マスタの「開始日時」用（セッション開始時刻を最初に一度だけ記録）
  nickname: "", // タイトル画面で入力（分析用データとして参加者マスタに保存）
  grade: "", // タイトル画面で選択（分析用データとして参加者マスタに保存）
  group: null, // 決断①完了時に確定："experimental"（実験群）または"control"（統制群）
  groupForced: false, // ?group=パラメータによるテスト用の強制指定だったか（参加者マスタに記録）
  decision1: CHARACTERS.map(c => c.id), // ランキング（先頭が最優先）
  decision2: null,
  survey1: {},
  survey4: {},
  survey2: {},
  survey3: {},
  survey5: {},
  judgmentType: null,
  judgmentType2: null,
  aggregate: null,
  failurePage: 0, // 失敗体験シーン（紙芝居）の現在ページ
  successPage: 0, // 成功体験シーン（紙芝居）の現在ページ
  // 行動ログ（研究用の付随データ）
  reorderCounts: { decision1: 0, decision2: 0 }, // 並べ替え回数
  dragLogs: { decision1: [], decision2: [] }, // 並べ替え操作の履歴（参考指標）
  inputTiming: {}, // 自由記述欄にフォーカスしていた合計時間(ms)。キー例: "survey1_reason"
  stepDurations: {} // 各画面の滞在時間(秒)の累計
};

// 決断①完了時に一度だけ呼ぶ。実験群70%／統制群30%でランダムに振り分ける。
// 「戻る」で決断①に戻って再度進んだ場合に再抽選されないよう、一度決まったら固定する。
// ?group=experimental / ?group=control が付いている場合（パイロットテスト用）は、
// ランダム抽選をせずその群に固定し、強制指定だったことも記録しておく。
function assignGroupIfNeeded(){
  if(state.group) return;
  if(FORCED_GROUP){
    state.group = FORCED_GROUP;
    state.groupForced = true;
  } else {
    state.group = Math.random() < 0.7 ? "experimental" : "control";
  }
}

function setStep(step){
  const now = Date.now();
  const prevStep = state.step;
  const elapsedSec = Math.round(((now - stepEnteredAt) / 1000) * 10) / 10;
  state.stepDurations[prevStep] = Math.round(((state.stepDurations[prevStep] || 0) + elapsedSec) * 10) / 10;
  stepEnteredAt = now;

  state.step = step;
  const order = currentStepOrder();
  const idx = order.indexOf(step);
  document.getElementById("progress-fill").style.width = Math.round((idx/(order.length-1))*100) + "%";
  document.body.classList.toggle("failure-mode", step === "failure");
  render();
  if(window.scrollTo){ try{ window.scrollTo(0,0); }catch(e){} }
}

// 現在の画面も含めた滞在時間のスナップショットを作る（state.stepDurationsそのものは書き換えない）。
// setStep()は「次の画面に移るとき」にしか直前の画面の滞在時間を確定させないため、
// まだ次の画面に移っていない「今まさに見ている画面」（＝セッション最後の画面など）の
// 滞在時間を記録に含めたいときはこちらを使う。
function getStepDurationsSnapshot(){
  const now = Date.now();
  const elapsedSec = Math.round(((now - stepEnteredAt) / 1000) * 10) / 10;
  const snapshot = Object.assign({}, state.stepDurations);
  snapshot[state.step] = Math.round(((snapshot[state.step] || 0) + elapsedSec) * 10) / 10;
  return snapshot;
}
