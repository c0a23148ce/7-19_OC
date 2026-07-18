/* ============================================================
   このコードは Google スプレッドシートに紐づく Apps Script に
   貼り付けて使います。貼り付け方は「セットアップ手順.md」を
   見てください。

   スプレッドシートは目的ごとに5枚のシート（タブ）に分かれます。
   （シートが無ければ自動的に作成されます）
   - 参加者マスタ　：参加者ID・端末情報・開始/終了時刻
   - 決断ログ　　　：決断①・②の順位データ、並べ替え回数
   - 漂流日記回答　：漂流日記①〜⑤の回答内容
   - 表示データログ：各参加者に表示された平均・N・比較対象者・判断タイプ
   - 行動ログ　　　：滞在時間・自由記述の入力時間・ドラッグ履歴・途中離脱
   すべてのシートで、1列目=参加者ID、2列目=タイムスタンプ（日本時間）で揃える。
   ============================================================ */

// キャラクターID→日本語名。index.html の js/characters.js と対応させています。
const CHAR_NAMES = {
  elder: "医療知識のある高齢者",
  injured: "ケガをした元漁師",
  pregnant: "妊婦",
  child: "子ども"
};
const CHAR_IDS = Object.keys(CHAR_NAMES);
const NAME_TO_ID = {};
CHAR_IDS.forEach(function (id) { NAME_TO_ID[CHAR_NAMES[id]] = id; });

// スプレッドシートの列名を日本語にするための対応表。
// ここに無いキーはそのまま列名になります。
const FIELD_LABELS = {
  participantId: "参加者ID",
  timestamp: "タイムスタンプ（日本時間）",
  isPilot: "パイロットデータか(true=分析時に除外する場合の目印。参考データの集計には含む)",

  // 決断ログ
  round: "回次（①=決断①／②=決断②）",
  judgmentType: "リアルタイム判断タイプ(功利主義型/中間型/義務論型)",
  reorderCount: "並べ替え回数",

  // 漂流日記回答
  diaryNumber: "日記番号（①〜⑤）",
  reason: "なぜこの2人に食料を渡すことにしたか（理由）",
  conviction: "今回の判断に納得できているか(1-5)",
  ownership: "自分でしっかり考えて決めたと思うか(1-5)",
  note: "ひとこと（任意）",
  reasonKeywordScore: "理由記述のキーワードスコア（分析用・参考値。リアルタイム判定には未使用）",
  surprise: "結果は予想通りだったか(1:予想通り〜5:予想外)",
  practical_regret: "実利的な後悔「あの人がいたら」(1-5)",
  emotional_regret: "感情的な後悔「かわいそうなことをした」(1-5)",
  insight: "他の参加者を見て気づいたこと",
  type_reaction: "自分と違うタイプの考え方に納得できたか(1-5)",
  change_reason: "前回の判断と比べて変わったか・その理由",
  overall_feeling: "体験全体を通して感じたこと",
  final_regret: "最終的な判断への後悔(1-5)",
  final_regret_reason: "後悔の理由",

  // 表示データログ（比較フィードバック画面で実際に表示した内容）
  displayedAvgRankN: "表示時点の参考データ件数(N)",
  displayedAvgRankIsBaseline: "表示した平均は暫定基準値か",
  displayedJudgmentType: "表示された自分の判断タイプ",
  displayedPilotN: "表示時点の参考データのうちパイロットデータの件数",
  displayedPilotPercentage: "表示時点の参考データのうちパイロットデータの割合(%)",
  displayedExampleParticipantId: "「異なる選択の例」として表示した相手の参加者ID",
  displayedExampleSelectionMethod: "「異なる選択の例」の選定方法(type=タイプ指定どおり/fallback=順位差フォールバック)",

  // 参加者マスタ
  nickname: "ニックネーム",
  grade: "学年",
  group: "群（実験群／統制群）",
  groupForced: "群がテスト用URL(?group=)で強制指定されたか(true=本番のランダム振り分けではない)",
  startedAt: "開始日時（日本時間）",
  endedAt: "終了日時（日本時間）",
  status: "完了状況",
  deviceType: "デバイス種別",
  os: "OS",
  browser: "ブラウザ",

  // 行動ログ
  stepDurations: "画面別滞在時間(秒・JSON)",
  reorderCount1: "並べ替え回数(決断①)",
  reorderCount2: "並べ替え回数(決断②)",
  dragHistory1: "並べ替え操作履歴(決断①・参考指標/JSON)",
  dragHistory2: "並べ替え操作履歴(決断②・参考指標/JSON)",
  reasonInputMs1: "理由記述の入力時間(ms・漂流日記①)",
  insightInputMs: "気づき記述の入力時間(ms・漂流日記③)",
  reasonInputMs2: "理由記述の入力時間(ms・漂流日記④)",
  changeReasonInputMs: "変化とその理由の入力時間(ms・漂流日記④)",
  noteInputMs1: "ひとこと記述の入力時間(ms・漂流日記①)",
  noteInputMs2: "ひとこと記述の入力時間(ms・漂流日記②)",
  noteInputMs3: "ひとこと記述の入力時間(ms・漂流日記③)",
  noteInputMs4: "ひとこと記述の入力時間(ms・漂流日記④)",
  overallFeelingInputMs: "全体の感想の入力時間(ms・漂流日記⑤)",
  finalRegretReasonInputMs: "後悔の理由の入力時間(ms・漂流日記⑤)",
  droppedOut: "途中離脱したか",
  lastStep: "最終到達STEP"
};

// ranking/selected/displayedExample/displayedAvgRank（配列やオブジェクト）を、
// 日本語名の列に展開する。
function expandArrayFields(record) {
  const out = {};
  Object.keys(record).forEach(function (key) {
    const value = record[key];
    if (key === "ranking" && Array.isArray(value)) {
      value.forEach(function (id, idx) {
        out["順位" + (idx + 1)] = CHAR_NAMES[id] || id;
      });
      return;
    }
    if (key === "selected" && Array.isArray(value)) {
      out["食料を渡した2人"] = value.map(function (id) { return CHAR_NAMES[id] || id; }).join("、");
      return;
    }
    if (key === "displayedExample" && Array.isArray(value)) {
      value.forEach(function (id, idx) {
        out["異なる選択の例_順位" + (idx + 1)] = CHAR_NAMES[id] || id;
      });
      return;
    }
    if (key === "displayedAvgRank" && value && typeof value === "object" && !Array.isArray(value)) {
      CHAR_IDS.forEach(function (id) {
        const v = value[id];
        out["参考平均順位_" + CHAR_NAMES[id]] = (typeof v === "number") ? Math.round(v * 100) / 100 : "";
      });
      return;
    }
    const label = FIELD_LABELS[key] || key;
    out[label] = value;
  });
  return out;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheetName = body.sheet;
    const record = expandArrayFields(body.record);
    const sheet = getOrCreateSheet(sheetName);
    writeRecord(sheet, record);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    if (e.parameter.action === "aggregate") {
      const myRanking = (e.parameter.myRanking || "").split(",").filter(String);
      const myType = e.parameter.myType || "";
      const result = computeAggregate(myRanking, myType);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "no action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function writeRecord(sheet, record) {
  const keys = Object.keys(record);
  let headerRow = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    : [];

  if (sheet.getLastRow() === 0 || headerRow.every(function (h) { return h === ""; })) {
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    headerRow = keys;
  }

  // 記録に新しい項目があれば、列を後ろに追加する
  const missing = keys.filter(function (k) { return headerRow.indexOf(k) === -1; });
  if (missing.length > 0) {
    sheet.getRange(1, headerRow.length + 1, 1, missing.length).setValues([missing]);
    headerRow = headerRow.concat(missing);
  }

  const row = headerRow.map(function (h) {
    const v = record[h];
    if (v === undefined || v === null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return v;
  });
  sheet.appendRow(row);
}

// 「決断ログ」シートの回次①のデータから、比較フィードバック用の集計を作る。
// パイロットデータ（isPilot=true）も、そのまま参考データの集計に含める
// （OC当日、最初の参加者にも比較対象があるようにするため。分析時に除外したい場合は
//   「パイロットデータか」列で絞り込む）。
//
// 「異なる選択の例」の選び方：
//   1. 自分と異なるタイプ（功利主義型⇔義務論型、中間型なら片方をランダムに選ぶ）の
//      参考データがあれば、その中からランダムに1人選ぶ（method="type"）。
//   2. 該当タイプがまだ存在しなければ、4人分の順位差の絶対値の合計が最大の参加者を
//      代わりに選ぶ（method="fallback"）。
//   選ばれた参加者の漂流日記①の「理由」も、あわせて取得する。
function computeAggregate(myRanking, myType) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("決断ログ");
  const result = {
    n: 0, pilotN: 0, avgRank: {}, typeDist: { U: 0, M: 0, D: 0 },
    example: null, exampleParticipantId: null, exampleReason: null, exampleSelectionMethod: null
  };
  CHAR_IDS.forEach(function (id) { result.avgRank[id] = 0; });

  if (!sheet || sheet.getLastRow() < 2) return result;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rankCols = CHAR_IDS.map(function (_, i) { return headers.indexOf("順位" + (i + 1)); });
  const typeCol = headers.indexOf(FIELD_LABELS.judgmentType);
  const roundCol = headers.indexOf(FIELD_LABELS.round);
  const pilotCol = headers.indexOf(FIELD_LABELS.isPilot);
  const pidCol = headers.indexOf(FIELD_LABELS.participantId);
  const rows = data.slice(1);

  let n = 0;
  let pilotN = 0;
  const candidates = []; // { participantId, ranking, judgmentType }

  rows.forEach(function (row) {
    if (roundCol !== -1 && row[roundCol] !== "①") return; // 決断①のデータだけを参考データにする
    if (rankCols.indexOf(-1) !== -1) return;
    const ranking = rankCols.map(function (col) { return NAME_TO_ID[row[col]]; });
    if (ranking.some(function (id) { return !id; })) return;

    n++;
    const isPilotVal = pilotCol !== -1 ? row[pilotCol] : false;
    if (isPilotVal === true || String(isPilotVal).toLowerCase() === "true") pilotN++;
    ranking.forEach(function (id, idx) {
      result.avgRank[id] = (result.avgRank[id] || 0) + (idx + 1);
    });

    const t = typeCol !== -1 ? row[typeCol] : null;
    if (t && result.typeDist[t] !== undefined) result.typeDist[t]++;

    candidates.push({
      participantId: pidCol !== -1 ? row[pidCol] : null,
      ranking: ranking,
      judgmentType: t
    });
  });

  if (n > 0) {
    CHAR_IDS.forEach(function (id) { result.avgRank[id] = result.avgRank[id] / n; });
  }
  result.n = n;
  result.pilotN = pilotN;

  const desiredType = myType === "U" ? "D" : (myType === "D" ? "U" : (Math.random() < 0.5 ? "U" : "D"));
  const typeMatches = candidates.filter(function (c) { return c.judgmentType === desiredType; });

  let chosen = null;
  let method = null;
  if (typeMatches.length > 0) {
    chosen = typeMatches[Math.floor(Math.random() * typeMatches.length)];
    method = "type";
  } else if (candidates.length > 0) {
    let maxDist = -1;
    candidates.forEach(function (c) {
      let dist = 0;
      myRanking.forEach(function (id, idx) { dist += Math.abs(idx - c.ranking.indexOf(id)); });
      if (dist > maxDist) { maxDist = dist; chosen = c; }
    });
    method = "fallback";
  }

  if (chosen) {
    result.example = chosen.ranking;
    result.exampleParticipantId = chosen.participantId;
    result.exampleSelectionMethod = method;
    result.exampleReason = findDiary1Reason(chosen.participantId);
  }

  return result;
}

// 「漂流日記回答」シートから、指定した参加者の漂流日記①の「理由」を探す
function findDiary1Reason(participantId) {
  if (!participantId) return null;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("漂流日記回答");
  if (!sheet || sheet.getLastRow() < 2) return null;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const pidCol = headers.indexOf(FIELD_LABELS.participantId);
  const diaryCol = headers.indexOf(FIELD_LABELS.diaryNumber);
  const reasonCol = headers.indexOf(FIELD_LABELS.reason);
  if (pidCol === -1 || diaryCol === -1 || reasonCol === -1) return null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][pidCol] === participantId && data[i][diaryCol] === "①") {
      const v = data[i][reasonCol];
      return v ? String(v) : null;
    }
  }
  return null;
}
