/* ============================================================
   起動
   ============================================================ */
showStatusBanners();
render();

// 途中離脱の記録（最後まで完了せずページを離れた場合に一度だけ送信する）
window.addEventListener("pagehide", sendDropoutLog);
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "hidden") sendDropoutLog();
});
