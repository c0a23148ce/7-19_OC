/* ============================================================
   起動
   ============================================================ */
showStatusBanners();
render();

// ミュートボタン（BGM・効果音のオン/オフ切り替え）
const muteBtn = document.getElementById("mute-toggle");
if(muteBtn){
  muteBtn.addEventListener("click", () => {
    const nowMuted = AudioManager.toggleMute();
    muteBtn.textContent = nowMuted ? "🔇" : "🔊";
  });
}

// 途中離脱の記録（最後まで完了せずページを離れた場合に一度だけ送信する）
window.addEventListener("pagehide", sendDropoutLog);
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "hidden") sendDropoutLog();
});
