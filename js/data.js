/* ============================================================
   データ送信・集計取得（本番モード／デモモード共通インターフェース）

   スプレッドシートは目的ごとに5枚のシートに分かれている。
   - 参加者マスタ　：参加者ID・端末情報・開始/終了時刻
   - 決断ログ　　　：決断①・②の順位データ、並べ替え回数
   - 漂流日記回答　：漂流日記①〜④の回答内容
   - 表示データログ：各参加者に表示された平均・N・比較対象者・判断タイプ
   - 行動ログ　　　：滞在時間・自由記述の入力時間・ドラッグ履歴・途中離脱
   ============================================================ */
const SHEET = {
  MASTER: "参加者マスタ",
  DECISIONS: "決断ログ",
  DIARY: "漂流日記回答",
  DISPLAY: "表示データログ",
  BEHAVIOR: "行動ログ"
};

function isDemoMode(){
  return !CONFIG.APPS_SCRIPT_URL;
}

function showStatusBanners(){
  let html = "";
  if(PILOT_MODE){
    html +=
      '<div class="demo-banner" style="background:#e3f2fd;border-color:#90caf9;color:#0d47a1;">' +
      '🧪 パイロットモードで実行中です（URLに ?pilot=1 が付いています）。このセッションの回答は「パイロットデータ」の印を付けて記録されます（参考データの集計には引き続き使われます。後日の分析時にこの印で区別・除外できます）。' +
      '</div>';
  }
  if(isDemoMode()){
    html +=
      '<div class="demo-banner">⚠ デモモード：Googleスプレッドシート未接続のため、この端末（ブラウザ）内だけにデータを保存しています。本番運用にはApps ScriptのURLをCONFIGに設定してください。</div>';
  }
  document.getElementById("demo-banner-slot").innerHTML = html;
}

function demoStorageKey(sheet){
  return "demo_" + sheet;
}

function buildRecord(payload){
  return Object.assign(
    { participantId: state.participantId, timestamp: nowJST(), isPilot: PILOT_MODE },
    payload
  );
}

function saveDemoRecord(sheet, record){
  const key = demoStorageKey(sheet);
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.push(record);
  localStorage.setItem(key, JSON.stringify(arr));
}

async function submitRecord(sheet, payload){
  const record = buildRecord(payload);
  if(isDemoMode()){
    saveDemoRecord(sheet, record);
    return { ok:true };
  }
  try{
    await fetch(CONFIG.APPS_SCRIPT_URL, {
      method:"POST",
      headers:{ "Content-Type":"text/plain" }, // Apps Script側でJSONパースするためtext/plainで送る
      body: JSON.stringify({ sheet, record })
    });
    return { ok:true };
  }catch(e){
    console.error("送信エラー", e);
    return { ok:false, error:e };
  }
}

// 決断①・②の結果を「決断ログ」に記録する
function submitDecisionLog(round, ranking, judgmentType, reorderCount){
  return submitRecord(SHEET.DECISIONS, {
    round, // "①" または "②"
    ranking,
    selected: ranking.slice(0, FOOD_RECIPIENTS),
    judgmentType,
    reorderCount
  });
}

// 漂流日記①〜④の回答内容を「漂流日記回答」に記録する
function submitDiaryLog(diaryNumber, answers){
  return submitRecord(SHEET.DIARY, Object.assign({ diaryNumber }, answers));
}

// 比較フィードバック画面に実際に表示した内容を「表示データログ」に記録する
function submitDisplayLog(payload){
  return submitRecord(SHEET.DISPLAY, payload);
}

// セッション全体を通した行動ログ（滞在時間・入力時間・ドラッグ履歴・離脱状況）
// stepDurationsは「今まさに見ている画面」の分も含めたスナップショットを使う
// （setStep()は次の画面に移るときにしか直前の画面の滞在時間を確定させないため、
//   これをしないとセッション最後の画面の滞在時間が記録から漏れてしまう）。
function collectBehaviorPayload(extra){
  return Object.assign({
    stepDurations: getStepDurationsSnapshot(),
    reorderCount1: state.reorderCounts.decision1,
    reorderCount2: state.reorderCounts.decision2,
    dragHistory1: state.dragLogs.decision1,
    dragHistory2: state.dragLogs.decision2,
    reasonInputMs1: state.inputTiming.survey1_reason || 0,
    insightInputMs: state.inputTiming.survey3_insight || 0,
    reasonInputMs2: state.inputTiming.survey4_reason || 0,
    changeReasonInputMs: state.inputTiming.survey4_change_reason || 0,
    noteInputMs1: state.inputTiming.survey1_note || 0,
    noteInputMs2: state.inputTiming.survey2_note || 0,
    noteInputMs3: state.inputTiming.survey3_note || 0,
    noteInputMs4: state.inputTiming.survey4_note || 0,
    overallFeelingInputMs: state.inputTiming.survey5_overall_feeling || 0,
    finalRegretReasonInputMs: state.inputTiming.survey5_final_regret_reason || 0,
    droppedOut: false,
    lastStep: state.step
  }, extra);
}

function submitParticipantMaster(status){
  return submitRecord(SHEET.MASTER, {
    nickname: state.nickname,
    grade: state.grade,
    group: state.group === "control" ? "統制群" : "実験群",
    groupForced: state.groupForced,
    startedAt: state.sessionStartedAt,
    endedAt: nowJST(),
    status,
    deviceType: DEVICE_INFO.deviceType,
    os: DEVICE_INFO.os,
    browser: DEVICE_INFO.browser
  });
}

// 最後まで完了したときに一度だけ呼ぶ（参加者マスタ・行動ログの両方を確定させる）
async function submitSessionEnd(){
  await Promise.all([
    submitParticipantMaster("完了"),
    submitRecord(SHEET.BEHAVIOR, collectBehaviorPayload({ droppedOut:false }))
  ]);
}

// 途中離脱の記録。ページを離れる直前に一度だけ、参加者マスタ・行動ログの両方に送る。
let dropoutSent = false;
function sendDropoutLog(){
  if(dropoutSent || state.step === "end") return;
  dropoutSent = true;

  const masterRecord = buildRecord({
    nickname: state.nickname,
    grade: state.grade,
    group: state.group === "control" ? "統制群" : (state.group === "experimental" ? "実験群" : ""),
    groupForced: state.groupForced,
    startedAt: state.sessionStartedAt,
    endedAt: nowJST(),
    status: "途中離脱(" + state.step + ")",
    deviceType: DEVICE_INFO.deviceType,
    os: DEVICE_INFO.os,
    browser: DEVICE_INFO.browser
  });
  const behaviorRecord = buildRecord(collectBehaviorPayload({ droppedOut:true, lastStep: state.step }));

  if(isDemoMode()){
    saveDemoRecord(SHEET.MASTER, masterRecord);
    saveDemoRecord(SHEET.BEHAVIOR, behaviorRecord);
    return;
  }
  try{
    navigator.sendBeacon(CONFIG.APPS_SCRIPT_URL, new Blob([JSON.stringify({ sheet: SHEET.MASTER, record: masterRecord })], { type:"text/plain" }));
    navigator.sendBeacon(CONFIG.APPS_SCRIPT_URL, new Blob([JSON.stringify({ sheet: SHEET.BEHAVIOR, record: behaviorRecord })], { type:"text/plain" }));
  }catch(e){}
}

// 比較フィードバック用の集計を取得する（決断①のデータをもとに算出）
async function fetchAggregate(myRanking, myType){
  if(isDemoMode()){
    const arr = JSON.parse(localStorage.getItem(demoStorageKey(SHEET.DECISIONS)) || "[]")
      .filter(r => r.round === "①");
    return computeAggregateLocally(arr, myRanking, myType);
  }
  try{
    const url = CONFIG.APPS_SCRIPT_URL + "?action=aggregate&myRanking=" + encodeURIComponent(myRanking.join(",")) +
      "&myType=" + encodeURIComponent(myType || "");
    const res = await fetch(url);
    return await res.json();
  }catch(e){
    console.error("集計取得エラー", e);
    return computeAggregateLocally([], myRanking, myType);
  }
}

// 「漂流日記回答」のデモ保存分から、指定した参加者の漂流日記①の「理由」を探す
function findDiary1ReasonLocal(participantId){
  if(!participantId) return null;
  const arr = JSON.parse(localStorage.getItem(demoStorageKey(SHEET.DIARY)) || "[]");
  const row = arr.find(r => r.participantId === participantId && r.diaryNumber === "①");
  return (row && row.reason) ? row.reason : null;
}

// デモモード用・簡易サーバー用の共通集計ロジック
// パイロットデータ（isPilot:true）も参考データの集計に含める（分析時に区別できるよう印だけ残す）。
// pilotNは、参考データのうち何件がパイロットデータだったか（表示データログへの記録用）。
//
// 「異なる選択の例」の選び方：
//   1. 自分と異なるタイプ（功利主義型⇔義務論型、中間型なら片方をランダムに選ぶ）の
//      参考データがあれば、その中からランダムに1人選ぶ（selectionMethod="type"）。
//   2. 該当タイプがまだ存在しなければ、4人分の順位差の絶対値の合計が最大の参加者を
//      代わりに選ぶ（selectionMethod="fallback"）。
//   選ばれた参加者の漂流日記①の「理由」も、あわせて取得する。
function computeAggregateLocally(records, myRanking, myType){
  const n = records.length;
  const pilotN = records.filter(r => r.isPilot).length;
  const avgRank = {};
  CHARACTERS.forEach(c => avgRank[c.id] = 0);
  records.forEach(r => {
    (r.ranking || []).forEach((id, idx) => { avgRank[id] += (idx+1); });
  });
  if(n > 0){ Object.keys(avgRank).forEach(id => avgRank[id] = avgRank[id]/n); }

  const typeDist = { U:0,M:0,D:0 };
  records.forEach(r => { if(r.judgmentType && typeDist[r.judgmentType] !== undefined) typeDist[r.judgmentType]++; });

  const desiredType = myType === "U" ? "D" : (myType === "D" ? "U" : (Math.random() < 0.5 ? "U" : "D"));
  const typeMatches = records.filter(r => r.ranking && r.judgmentType === desiredType);

  let chosen = null;
  let exampleSelectionMethod = null;
  if(typeMatches.length > 0){
    chosen = typeMatches[Math.floor(Math.random() * typeMatches.length)];
    exampleSelectionMethod = "type";
  } else {
    // 4人分の順位差の絶対値の合計が最大の参加者にフォールバックする
    let maxDist = -1;
    records.forEach(r => {
      if(!r.ranking) return;
      let dist = 0;
      myRanking.forEach((id, idx) => { dist += Math.abs(idx - r.ranking.indexOf(id)); });
      if(dist > maxDist){ maxDist = dist; chosen = r; }
    });
    if(chosen) exampleSelectionMethod = "fallback";
  }

  const example = chosen ? chosen.ranking : null;
  const exampleParticipantId = chosen ? chosen.participantId : null;
  const exampleReason = exampleParticipantId ? findDiary1ReasonLocal(exampleParticipantId) : null;

  return { n, pilotN, avgRank, typeDist, example, exampleParticipantId, exampleReason, exampleSelectionMethod };
}

// 参加者データがまだ少ないときの暫定の参考値（研究者があとで実データに差し替え可能）
const PRESET_BASELINE = {
  avgRank: { pregnant:1.9, child:1.7, elder:2.8, injured:3.6 },
  example: ["elder","injured","pregnant","child"]
};
