/* ============================================================
   このコードは Google スプレッドシートに紐づく Apps Script に
   貼り付けて使います。貼り付け方は「セットアップ手順.md」を
   見てください。
   ============================================================ */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheetName = body.sheet;
    const record = body.record;
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
  const ids = ["young", "pregnant", "elder", "child", "injured"];
  const result = { n: 0, avgRank: {}, typeDist: { A: 0, B: 0, C: 0, D: 0 }, example: null };
  ids.forEach(function (id) { result.avgRank[id] = 0; });

  if (!sheet || sheet.getLastRow() < 2) return result;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rankingCol = headers.indexOf("ranking");
  const typeCol = headers.indexOf("judgmentType");
  const rows = data.slice(1);

  let n = 0;
  let maxDist = -1;

  rows.forEach(function (row) {
    let ranking;
    try {
      ranking = JSON.parse(row[rankingCol]);
    } catch (e) {
      return;
    }
    if (!Array.isArray(ranking)) return;

    n++;
    ranking.forEach(function (id, idx) {
      result.avgRank[id] = (result.avgRank[id] || 0) + (idx + 1);
    });

    const t = row[typeCol];
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
    ids.forEach(function (id) { result.avgRank[id] = result.avgRank[id] / n; });
  }
  result.n = n;
  return result;
}
