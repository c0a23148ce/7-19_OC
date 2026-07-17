/* ============================================================
   設定：Google Apps Script のWebアプリURLをここに貼り付けると
   スプレッドシート連携が有効になります。空のままなら
   ブラウザ内だけで動く「デモモード」になります。
   ============================================================ */
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxxpcZ2OYXa-ZgChG5gCRCk6Hw6Neg29U3Xq4oyoAPBG5-kWy-m0GIWxMwQ7OGSkfb9Eg/exec", // 例: "https://script.google.com/macros/s/xxxxx/exec"
  MIN_N_FOR_REAL_AVERAGE: 3 // これ未満の参加者数のときは暫定の参考値を使う
};

/* ============================================================
   パイロットモード判定：
   URLに ?pilot=1 を付けてアクセスしたセッションだけをパイロットデータとして
   マークする（付けなければ通常どおり本番データ扱い＝フェイルセーフ）。
   すべての送信レコードに isPilot を付与する（参考データの集計には引き続き使う）。
   ============================================================ */
function getQueryParam(name){
  try{ return new URLSearchParams(window.location.search).get(name); }
  catch(e){ return null; }
}
const PILOT_MODE = ["1","true","yes"].includes((getQueryParam("pilot") || "").toLowerCase());

/* ============================================================
   端末情報（デバイス種別・OS・ブラウザ。簡易的なUA判定）
   ============================================================ */
function detectDeviceInfo(){
  const ua = navigator.userAgent || "";
  let deviceType = "PC";
  if(/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) deviceType = "タブレット";
  else if(/Mobi|Android|iPhone|iPod/i.test(ua)) deviceType = "スマホ";

  let os = "不明";
  if(/Windows/i.test(ua)) os = "Windows";
  else if(/Android/i.test(ua)) os = "Android";
  else if(/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if(/Mac OS X/i.test(ua)) os = "macOS";
  else if(/Linux/i.test(ua)) os = "Linux";

  let browser = "不明";
  if(/Edg\//i.test(ua)) browser = "Edge";
  else if(/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if(/Firefox\//i.test(ua)) browser = "Firefox";
  else if(/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";

  return { deviceType, os, browser };
}
const DEVICE_INFO = detectDeviceInfo();

/* ============================================================
   タイムスタンプは常に日本時間（Asia/Tokyo, JST, UTC+9）の
   "YYYY-MM-DD HH:mm:ss" というタイムゾーン表記なしの文字列で記録する。
   端末のタイムゾーン設定に関わらず一定であり、スプレッドシート側でも
   そのままの見た目で保存される（自動でさらに時差変換されない）。
   ============================================================ */
function nowJST(){
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
  const jst = new Date(utcMs + 9 * 60 * 60000);
  const pad = n => String(n).padStart(2, "0");
  return jst.getFullYear() + "-" + pad(jst.getMonth() + 1) + "-" + pad(jst.getDate()) + " " +
    pad(jst.getHours()) + ":" + pad(jst.getMinutes()) + ":" + pad(jst.getSeconds());
}
