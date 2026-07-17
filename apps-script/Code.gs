/* ============================================================
   このコードは Google スプレッドシートに紐づく Apps Script に
   貼り付けて使います。貼り付け方は「セットアップ手順.md」を
   見てください。
   ============================================================ */

// キャラクターID→日本語名。index.html の CHARACTERS と対応させています。
const CHAR_NAMES = {
  elder: "医療知識のある高齢者",
  injured: "ケガをした操縦士",
  pregnant: "妊婦",
  child: "子ども"
};
const CHAR_IDS = Object.keys(CHAR_NAMES);
const NAME_TO_ID = {};
CHAR_IDS.forEach(function (id) { NAME_TO_ID[CHAR_NAMES[id]] = id; });

// スプレッドシートの列名を日本語にするための対応表。
// ここに無いキーはそのまま列名になります。
const FIELD_LABELS = {
  participantId: "参加者ID（セッションID）",
  timestamp: "送信日時",
  isPilot: "パイロットデータか(true=分析時に除外する場合の目印。参考データの集計には含まれる)",

  // アンケート①③（決断①直後・決断①の理由づけキーワードスコア）
  reason: "なぜこの2人に食料を渡すことにしたか（理由）",
  conviction: "今回の判断に納得できているか(1-5)",
  ownership: "自分でしっかり考えて決めたと思うか(1-5)",
  judgmentType: "リアルタイム判断タイプ・決断①(功利主義型/中間型/義務論型)",
  reasonKeywordScore: "理由記述のキーワードスコア（分析用・参考値。リアルタイム判定には未使用）",

  // アンケート②（失敗体験直後・自由記述なし）
  surprise: "結果は予想通りだったか(1:予想通り〜5:予想外)",
  practical_regret: "実利的な後悔「あの人がいたら」(1-5)",
  emotional_regret: "感情的な後悔「かわいそうなことをした」(1-5)",

  // アンケート③（比較フィードバック直後）
  insight: "他の参加者を見て気づいたこと",
  type_reaction: "自分と違うタイプの考え方に納得できたか(1-5)",

  // アンケート④（決断②直後）
  change_reason: "前回の判断と比べて変わったか・その理由",
  judgmentType2: "リアルタイム判断タイプ・決断②(功利主義型/中間型/義務論型)",

  // 比較フィードバック画面で実際に表示した内容（回答とは別に、表示内容そのものを保存する）
  displayedAvgRankN: "表示時点の参考データ件数(N)",
  displayedAvgRankIsBaseline: "表示した平均は暫定基準値か",
  displayedJudgmentType: "表示された自分の判断タイプ",

  // 行動ログ（研究用の付随データ）
  reorderCount: "並べ替え回数(決断①)",
  reorderCount2: "並べ替え回数(決断②)",
  dragHistory: "並べ替え操作履歴(決断①・参考指標/JSON)",
  dragHistory2: "並べ替え操作履歴(決断②・参考指標/JSON)",
  reasonInputMs: "理由記述の入力時間(ms・決断①)",
  reasonInputMs2: "理由記述の入力時間(ms・決断②)",
  insightInputMs: "気づき記述の入力時間(ms・アンケート③)",
  changeReasonInputMs: "変化とその理由の入力時間(ms・アンケート④)",
  deviceType: "デバイス種別",
  os: "OS",
  browser: "ブラウザ",
  stepDurations: "画面別滞在時間(秒・JSON)",
  stepLog: "画面遷移ログ(JSON)",
  lastStep: "離脱時点のSTEP",
  lastStepIndex: "離脱時点のSTEP番号"
};

// ranking/selected/decision2（配列）を、日本語名の列に展開する。
// 例: ranking:["elder","injured",...] → 順位1「高齢者」, 順位2「ケガをした操縦士」, ...
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
    if (key === "decision2" && Array.isArray(value)) {
      value.forEach(function (id, idx) {
        out["決断②順位" + (idx + 1)] = CHAR_NAMES[id] || id;
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
      const result = computeAggregate(myRanking);
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

// 「決断①（Step1シート）」のデータから、比較フィードバック用の集計を作る
function computeAggregate(myRanking) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Step1");
  const result = { n: 0, avgRank: {}, typeDist: { U: 0, M: 0, D: 0 }, example: null };
  CHAR_IDS.forEach(function (id) { result.avgRank[id] = 0; });

  if (!sheet || sheet.getLastRow() < 2) return result;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rankCols = CHAR_IDS.map(function (_, i) { return headers.indexOf("順位" + (i + 1)); });
  const typeCol = headers.indexOf(FIELD_LABELS.judgmentType);
  const rows = data.slice(1);

  let n = 0;
  let maxDist = -1;

  // パイロットデータ（isPilot=true）も参考データの集計に含める。
  // 分析時にパイロットデータだけを除外したい場合は「パイロットデータ」列で絞り込む。
  rows.forEach(function (row) {
    if (rankCols.indexOf(-1) !== -1) return;
    const ranking = rankCols.map(function (col) { return NAME_TO_ID[row[col]]; });
    if (ranking.some(function (id) { return !id; })) return;

    n++;
    ranking.forEach(function (id, idx) {
      result.avgRank[id] = (result.avgRank[id] || 0) + (idx + 1);
    });

    const t = typeCol !== -1 ? row[typeCol] : null;
    if (t && result.typeDist[t] !== undefined) result.typeDist[t]++;

    if (myRanking.length === ranking.length) {
      let dist = 0;
      myRanking.forEach(function (id, idx) {
        dist += Math.abs(idx - ranking.indexOf(id));
      });
      if (dist > maxDist) {
        maxDist = dist;
        result.example = ranking;
      }
    }
  });

  if (n > 0) {
    CHAR_IDS.forEach(function (id) { result.avgRank[id] = result.avgRank[id] / n; });
  }
  result.n = n;
  return result;
}
