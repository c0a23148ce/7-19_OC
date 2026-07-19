/* ============================================================
   画面ごとのレンダリング
   ============================================================ */
function render(){
  const app = document.getElementById("app");
  app.innerHTML = "";
  currentNextValidator = () => true;
  questionCounter = 0;

  const dateLabel = STEP_DATE_LABELS[state.step];
  if(dateLabel){
    app.appendChild(el('<div class="date-badge">📅 ' + dateLabel + '</div>'));
  }

  const renderers = {
    start: renderStart,
    backstory: renderBackstory,
    opening: renderOpening,
    intro1: renderIntro1,
    intro2: renderIntro2,
    decision1: renderDecision1,
    survey1: renderSurvey1,
    diagnosis1: renderDiagnosis1,
    failure: renderFailure,
    day1seal: renderDay1Seal,
    survey2: renderSurvey2,
    comparison: renderComparison,
    survey3: renderSurvey3,
    rewind: renderRewind,
    controlBridge: renderControlBridge,
    decision2: renderDecision2,
    survey4: renderSurvey4,
    day2seal: renderDay2Seal,
    success: renderSuccess,
    survey5: renderSurvey5,
    end: renderEnd
  };
  renderers[state.step](app);
  updateNextButton();
}

const GRADE_OPTIONS = ["高校1年生","高校2年生","高校3年生","大学1年生","大学2年生","大学3年生","大学4年生","その他"];

function renderStart(app){
  app.appendChild(el(
    '<div class="title-scene">' +
      '<div class="title-ship">⛵</div>' +
      '<div class="title-emoji">🏝️</div>' +
      '<h1>無人島の選択</h1>' +
      '<p class="title-tagline">あなたはこの物語のリーダー。<br>5人の運命は、あなたの手に委ねられている。</p>' +
      '<div class="title-waves"><div class="wave wave1"></div><div class="wave wave2"></div><div class="wave wave3"></div></div>' +
    '</div>'
  ));

  const form = el('<div class="card title-form"></div>');
  form.innerHTML =
    '<label class="title-field">' +
      '<span class="title-field-label">ニックネーム</span>' +
      '<input type="text" id="nickname-input" placeholder="例：たろう" maxlength="20">' +
    '</label>' +
    '<label class="title-field">' +
      '<span class="title-field-label">学年</span>' +
      '<select id="grade-select">' +
        '<option value="">選択してください</option>' +
        GRADE_OPTIONS.map(g => '<option value="' + g + '">' + g + '</option>').join("") +
      '</select>' +
    '</label>' +
    '<p class="note">所要時間の目安：10〜15分</p>';
  app.appendChild(form);

  const nicknameInput = form.querySelector("#nickname-input");
  const gradeSelect = form.querySelector("#grade-select");
  nicknameInput.value = state.nickname;
  gradeSelect.value = state.grade;

  const row = el('<div class="btn-row"></div>');
  row.appendChild(document.createElement("span"));
  const startBtn = el('<button type="button" class="primary" id="next-btn">はじめる</button>');
  row.appendChild(startBtn);
  app.appendChild(row);

  currentNextValidator = () => nicknameInput.value.trim() !== "" && gradeSelect.value !== "";
  nicknameInput.addEventListener("input", updateNextButton);
  gradeSelect.addEventListener("change", updateNextButton);

  startBtn.addEventListener("click", () => {
    state.nickname = nicknameInput.value.trim();
    state.grade = gradeSelect.value;
    // 最初のクリック（ユーザー操作）でオーディオを解禁し、波音BGMを開始する
    AudioManager.ensureCtx();
    AudioManager.startBgm();
    setStep("backstory");
  });
}

function renderBackstory(app){
  app.appendChild(el(
    '<div class="scene-box">' +
      '<p class="wreck-line" style="animation-delay:.1s;">離島と本土を結ぶ小さな定期船に、たまたま乗り合わせていた乗客たちだった。</p>' +
      '<p class="wreck-line" style="animation-delay:.9s;">嵐に見舞われ、船は聞いたこともない無人島に座礁してしまった。</p>' +
    '</div>'
  ));
  navRow(app, { next: () => setStep("opening") });
}

/* ============================================================
   オープニング演出：難破〜漂着〜夜明け
   セリフを時間差で表示し、背景を夜→夜明けへ切り替える。
   ============================================================ */
const WRECK_LINES = [
  { text: "強い雨が甲板を叩きつけています。", delay: 2200, storm:true },
  { text: "稲妻が走り、あたりが一瞬眩しく照らされました。", delay: 2400, lightning:true },
  { text: "ミシミシッ……。船体が軋む嫌な音が響きます。", delay: 2200 },
  { text: "うわーっ……！！", cls:"shout", delay: 2000 },
  { text: "大波が船体を引き裂き、あなたは荒れる海へと投げ出されました。", delay: 2800, sinking:true },
  { text: "気がつくと、あなたは砂浜に打ち上げられ、力なく倒れ込んでいました。", beach:true, delay: 2600, drizzle:true },
  { text: "いたた……。雨はまだ止みません。", cls:"pain", delay: 2600 },
  { text: "体を丸め、震えながら、あなたは長い夜を過ごしました。", delay: 3400 },
  { text: "気づけば、雨音がやんでいました。あたりは静まり返っています。", delay: 3000, stormEnd:true },
  { text: "波の音だけを聞きながら、少しずつ東の空が白み始めていました。", dawn:true, delay: 0 }
];

function renderOpening(app){
  app.appendChild(el('<h2>漂流</h2>'));
  const box = el(
    '<div class="scene-box wreck-scene" id="wreck-scene">' +
      '<div class="wreck-visual">' +
        '<div class="wreck-sun">☀️</div>' +
        '<div class="wreck-ship">⛵</div>' +
        '<div class="wreck-waves">' +
          '<div class="wave wave1"></div>' +
          '<div class="wave wave2"></div>' +
          '<div class="wave wave3"></div>' +
        '</div>' +
        '<div class="wreck-beach"></div>' +
        '<div class="wreck-castaway">🧍</div>' +
        '<div class="rain"></div>' +
        '<div class="lightning" id="lightning"></div>' +
      '</div>' +
      '<div class="wreck-text" id="wreck-text"></div>' +
    '</div>'
  );
  app.appendChild(box);

  const textEl = box.querySelector("#wreck-text");
  const lightningEl = box.querySelector("#lightning");
  const timers = [];
  let lineIdx = 0;

  function flashLightning(){
    lightningEl.classList.remove("flash");
    void lightningEl.offsetWidth; // 強制リフロー：連続フラッシュ時にアニメを再始動させる
    lightningEl.classList.add("flash");
  }

  function showNextLine(){
    if(lineIdx >= WRECK_LINES.length) return;
    const line = WRECK_LINES[lineIdx];
    textEl.appendChild(el('<p class="wreck-line' + (line.cls ? " " + line.cls : "") + '">' + line.text + '</p>'));
    if(line.storm) box.classList.add("storm");
    if(line.lightning) flashLightning();
    if(line.sinking) box.classList.add("sinking");
    if(line.beach) box.classList.add("beached");
    if(line.drizzle){ box.classList.remove("storm"); box.classList.add("drizzle"); }
    if(line.stormEnd) box.classList.remove("drizzle");
    if(line.dawn) box.classList.add("dawn");
    lineIdx++;
    if(lineIdx < WRECK_LINES.length){
      timers.push(setTimeout(showNextLine, line.delay));
    } else {
      timers.push(setTimeout(() => {
        const nextBtn = app.querySelector("#opening-next-btn");
        if(nextBtn) nextBtn.disabled = false;
      }, 3200));
    }
  }
  timers.push(setTimeout(showNextLine, 400));

  function finish(){
    timers.forEach(t => clearTimeout(t));
    setStep("intro1");
  }

  const row = el('<div class="btn-row"></div>');
  const skipBtn = el('<button type="button" class="secondary">スキップ</button>');
  skipBtn.addEventListener("click", finish);
  const nextBtn = el('<button type="button" class="primary" id="opening-next-btn">次へ</button>');
  nextBtn.disabled = true;
  nextBtn.addEventListener("click", finish);
  row.appendChild(skipBtn);
  row.appendChild(nextBtn);
  app.appendChild(row);
}

function renderIntro1(app){
  app.appendChild(el('<h2>状況①</h2>'));
  app.appendChild(el(
    '<div class="card"><p>昨日の夜、乗っていた船が座礁し、あなたたちは命からがら無人島にたどり着きました。生き残ったのは、リーダーであるあなたを含めて5人。あなたはこの5人をまとめる立場です。</p>' +
    '<p>浜辺で一晩を明かし、気づけば太陽はもう高く昇っています。誰も昨日の昼から何も食べていません。お腹の鳴る音があちこちから聞こえ、みんな口数が少なくなってきました。</p></div>'
  ));
  navRow(app, { back: () => setStep("opening"), next: () => setStep("intro2") });
}

function renderIntro2(app){
  app.appendChild(el('<h2>状況②</h2>'));
  app.appendChild(el(
    '<div class="card"><p>持ち出せた荷物を確認すると、残っていた食料はたったの<strong>2人分</strong>。あなたは、リーダーとしてこの2人分を他の4人のために使うことに決めました。残る4人のうち誰に食料を渡すか、あなたが決めなければなりません。</p></div>'
  ));
  app.appendChild(el('<h3>他の4人の情報</h3>'));
  const list = el('<div></div>');
  CHARACTERS.forEach(c => {
    list.appendChild(el(
      '<div class="card char-card">' +
        '<div class="char-avatar">' + avatarHTML(c) + '</div>' +
        '<div><div class="char-name">' + c.name + '</div>' +
        '<div class="char-trait">' + c.trait + '</div>' +
        '<div class="char-trait">' + c.backstory + '</div>' +
        '<div class="char-trait">' + c.introExtra + '</div></div>' +
      '</div>'
    ));
  });
  app.appendChild(list);
  navRow(app, { back: () => setStep("intro1"), next: () => setStep("decision1") });
}

function renderDecision1(app){
  app.appendChild(el('<h2>決断① 誰に食料を渡すか</h2>'));
  app.appendChild(el('<div class="hint">4人を<strong>「食料を渡したい順」</strong>に並び替えてください。上位2人に食料が渡ります。ドラッグ、または▲▼ボタンで動かせます。</div>'));
  renderRankingWidget(app, state.decision1, (ids) => logReorder("decision1", ids));
  navRow(app, {
    back: () => setStep("intro2"),
    next: () => {
      assignGroupIfNeeded(); // 決断①完了時点で実験群／統制群に振り分ける
      setStep("survey1");
    }
  });
}

/* ============================================================
   漂流日記（旧アンケート）の共通ヘッダー：見出し・直感を促す一言・海の背景
   ============================================================ */
function diaryWavesHTML(){
  return '<div class="diary-waves"><div class="wave wave1"></div><div class="wave wave2"></div><div class="wave wave3"></div></div>';
}

function renderDiaryHeader(app, number, leadText){
  app.appendChild(el('<h2>漂流日記' + number + '</h2>'));
  app.appendChild(el('<div class="diary-kicker">📔 航海日誌を書きましょう</div>'));
  app.appendChild(el(diaryWavesHTML()));
  app.appendChild(el('<div class="hint">' + DIARY_INTUITION_HINT + '</div>'));
  if(leadText) app.appendChild(el('<p class="note">' + leadText + '</p>'));
}

function renderSurvey1(app){
  renderDiaryHeader(app, "①", "その2人を選んだときの気持ちを、あなたの言葉で聞かせてください。");
  const box = el('<div class="card"></div>');
  app.appendChild(box);
  renderSurveyQuestions(box, SURVEY1_QUESTIONS, state.survey1, "survey1");
  app.appendChild(el(diaryWavesHTML()));

  currentNextValidator = () => allAnswered(SURVEY1_QUESTIONS, state.survey1);

  navRow(app, {
    back: () => setStep("decision1"),
    next: async () => {
      AudioManager.playSfx("confirm");
      const selected = state.decision1.slice(0, FOOD_RECIPIENTS);
      state.judgmentType = classifyByComposition(selected).code;
      await Promise.all([
        submitDecisionLog("①", state.decision1, state.judgmentType, state.reorderCounts.decision1),
        submitDiaryLog("①", {
          reason: state.survey1.reason,
          conviction: state.survey1.conviction,
          ownership: state.survey1.ownership,
          note: state.survey1.note,
          reasonKeywordScore: calcReasonKeywordScore(selected, state.survey1.reason)
        })
      ]);
      setStep("diagnosis1");
    }
  });
}

/* ============================================================
   自己診断カード（両群共通・決断①の直後）。
   他者比較の情報（同タイプの割合など）はここには含めず、
   実験群のみが比較フィードバック（STEP4）で改めて見る。
   ============================================================ */
function diagCardHTML(typeInfo, nameLabel, statText){
  return (
    '<div class="diag-card-wrap"><div class="diag-card">' +
      '<div class="diag-card-waves"><div class="wave wave1"></div><div class="wave wave2"></div><div class="wave wave3"></div></div>' +
      '<div class="diag-card-content">' +
        '<div class="diag-card-eyebrow">🏝️ ' + nameLabel + 'の判断タイプ診断</div>' +
        '<div class="diag-card-letter type-letter-' + typeInfo.code + '">' + typeInfo.code + '</div>' +
        '<div class="diag-card-type">' + typeInfo.label + '</div>' +
        '<div class="diag-card-subtitle">' + TYPE_SUBTITLE[typeInfo.code] + '</div>' +
        '<div class="diag-card-desc">' + typeInfo.desc + '</div>' +
        '<div class="diag-card-spectrum-slot"></div>' +
        (statText ? '<div class="diag-card-stat">' + statText + '</div>' : '') +
      '</div>' +
    '</div></div>'
  );
}

function renderDiagnosis1(app){
  const nameLabel = state.nickname ? state.nickname + "さん" : "あなた";
  const typeInfo = classifyByComposition(state.decision1.slice(0, FOOD_RECIPIENTS));

  app.appendChild(el('<h2>あなたの判断タイプ</h2>'));
  app.appendChild(el('<p class="note">今回の選択と理由から、あなたの道徳的判断スタイルを分析しました。</p>'));

  const card = el(diagCardHTML(typeInfo, nameLabel, null));
  app.appendChild(card);
  renderTypeSpectrum(card.querySelector(".diag-card-spectrum-slot"), typeInfo);
  app.appendChild(el('<p class="note">これは、あなたが食料を渡した2人の組み合わせから自動判定した、あくまで参考の分類です。</p>'));

  renderTypeGrid(app, typeInfo.code);

  navRow(app, {
    next: () => setStep(state.group === "control" ? "controlBridge" : "failure")
  });
}

/* ============================================================
   統制群専用：失敗体験・比較フィードバックを飛ばし、
   短い橋渡し画面だけを挟んで決断②へ進む。
   ============================================================ */
// 統制群専用：決断①から決断②への橋渡し。リーダー自身が頭痛で意識を失い、
// 同じ砂浜で目を覚ますという1点だけで完結させる（4人がどうなったかは一切描写しない）。
function buildControlBridgePageSpec(page){
  if(page.type === "faint"){
    return {
      classes: ["control-faint-scene", "control-faint-page"],
      waitMs: 2200,
      html:
        '<div class="control-faint-spinner">🌀</div>' +
        '<p class="wreck-line" style="animation-delay:.3s;">あなたは、急な頭痛に襲われ、そのまま意識を失ってしまいました。</p>'
    };
  }
  // wake
  return {
    classes: [],
    waitMs: 1200,
    html: '<p class="wreck-line" style="animation-delay:.2s;">気がつくと、あなたはまた同じ砂浜に横たわっていました。</p>'
  };
}

function renderControlBridge(app){
  const stage = el('<div id="control-bridge-stage"></div>');
  app.appendChild(stage);
  const pages = [{ type: "faint" }, { type: "wake" }];
  renderKamishibaiPage(
    stage, pages, 0, buildControlBridgePageSpec,
    () => {}, // このシーンは短い一往復なので、途中位置を保持する必要はない
    () => setStep("decision2")
  );
}

/* ============================================================
   1日目 夜：失敗体験シーン（紙芝居）
   場面ごとにページを分け、演出→短い一文の順に一人ずつ見せる。
   進行状況は state.failurePage で管理し、内部のページ送りは
   setStep()を経由せず、専用のステージ領域だけを描き直す。
   ============================================================ */
function buildFailurePageSpec(page){
  if(page.type === "intro"){
    return {
      classes: ["failure-page", "failure-intro"],
      waitMs: 1500,
      html:
        '<div class="failure-fire">🔥</div>' +
        '<p class="wreck-line" style="animation-delay:.4s;">' + FAILURE_INTRO_LINE + '</p>'
    };
  }
  if(page.type === "collapse"){
    const c = getChar(page.id);
    return {
      classes: ["blackout"],
      waitMs: 1400,
      sound: "collapse",
      html:
        '<div class="blackout-avatar">' + avatarHTML(c, "fail") + '</div>' +
        '<p class="blackout-caption">' + COLLAPSE_LINE[page.id] + '</p>'
    };
  }
  if(page.type === "summary"){
    return {
      classes: ["failure-page", "failure-summary"],
      waitMs: 1000,
      html:
        '<p class="failure-caption">' + page.introLine + '</p>' +
        '<p class="scene-intro-text" style="animation-delay:.5s;">' + page.bodyText + '</p>'
    };
  }
  // fedpair
  return {
    classes: ["failure-page", "failure-fedpair"],
    waitMs: 800,
    html: '<p class="failure-caption">' + page.line + '</p>'
  };
}

function renderFailure(app){
  const stage = el('<div id="failure-stage"></div>');
  app.appendChild(stage);
  const pages = buildFailurePages(state.decision1);
  renderKamishibaiPage(
    stage, pages, state.failurePage, buildFailurePageSpec,
    (idx) => { state.failurePage = idx; },
    () => setStep("day1seal")
  );
}

/* ============================================================
   1日目・2日目それぞれの終わりに挟む、日誌への記録演出（封蝋スタンプ）。
   ============================================================ */
function renderDaySeal(app, dayLabel, nextStep){
  app.appendChild(el(
    '<div class="scene-box day-seal-scene">' +
      '<div class="day-seal-waves"><div class="wave wave1"></div><div class="wave wave2"></div><div class="wave wave3"></div></div>' +
      '<div class="day-seal-stamp">⚓</div>' +
      '<p class="day-seal-text">' + dayLabel + 'が終わりました。<br>今日の記録が、航海日誌に刻まれた。</p>' +
    '</div>'
  ));
  const row = el('<div class="btn-row"></div>');
  row.appendChild(document.createElement("span"));
  const nextBtn = el('<button type="button" class="primary" id="next-btn">次へ</button>');
  nextBtn.disabled = true;
  nextBtn.addEventListener("click", () => setStep(nextStep));
  row.appendChild(nextBtn);
  app.appendChild(row);
  setTimeout(() => { nextBtn.disabled = false; }, 1600);
}

function renderDay1Seal(app){
  renderDaySeal(app, "1日目", "survey2");
}

function renderDay2Seal(app){
  renderDaySeal(app, "2日目", "success");
}

function renderSurvey2(app){
  renderDiaryHeader(app, "②", "たった今起きたことについて、素直な気持ちを聞かせてください。");
  const box = el('<div class="card"></div>');
  app.appendChild(box);
  renderSurveyQuestions(box, SURVEY2_QUESTIONS, state.survey2, "survey2");
  app.appendChild(el(diaryWavesHTML()));
  currentNextValidator = () => allAnswered(SURVEY2_QUESTIONS, state.survey2);

  navRow(app, {
    back: () => setStep("failure"),
    next: async () => {
      app.innerHTML = '<h2>漂流日記②</h2><p>集計データを取得中です…</p>';
      state.aggregate = await fetchAggregate(state.decision1, state.judgmentType);
      const agg = state.aggregate || { n:0, pilotN:0, avgRank:{}, example:null };
      const useReal = agg.n >= CONFIG.MIN_N_FOR_REAL_AVERAGE;
      const pilotN = agg.pilotN || 0;
      await Promise.all([
        // 画面に実際に表示する内容を、表示データログに保存しておく
        // （表示された参考データが後から追跡できるようにするため。
        //   友人によるパイロットデータが参考データの何%を占めていたか、
        //   「異なる選択の例」の選定方法と表示した相手のIDもあわせて記録する）
        submitDisplayLog({
          displayedAvgRankN: agg.n,
          displayedAvgRankIsBaseline: !useReal,
          displayedAvgRank: useReal ? agg.avgRank : PRESET_BASELINE.avgRank,
          displayedExample: agg.example || PRESET_BASELINE.example,
          displayedJudgmentType: state.judgmentType,
          displayedPilotN: pilotN,
          displayedPilotPercentage: agg.n > 0 ? Math.round((pilotN / agg.n) * 100) : 0,
          displayedExampleParticipantId: agg.exampleParticipantId || null,
          displayedExampleSelectionMethod: agg.exampleSelectionMethod || "no_data"
        }),
        submitDiaryLog("②", {
          surprise: state.survey2.surprise,
          practical_regret: state.survey2.practical_regret,
          emotional_regret: state.survey2.emotional_regret,
          note: state.survey2.note
        })
      ]);
      setStep("comparison");
    }
  });
}

// 診断結果カードのサブタイトル（item9：「航海者」ではなく「リーダー」で統一）
const TYPE_SUBTITLE = {
  U: "生存を最優先した、冷静なリーダー",
  M: "二つの想いの間で揺れた、迷えるリーダー",
  D: "弱き者に寄り添った、心優しきリーダー"
};

function renderComparison(app){
  app.appendChild(el('<h2>参考データとの比較</h2>'));
  app.appendChild(el('<p class="note">あなたの判断タイプを、他の参加者と比べてみましょう。</p>'));

  const agg = state.aggregate || { n:0, avgRank:{}, typeDist:{}, example:null };
  const useReal = agg.n >= CONFIG.MIN_N_FOR_REAL_AVERAGE;
  const avgRank = useReal ? agg.avgRank : PRESET_BASELINE.avgRank;
  const example = agg.example || PRESET_BASELINE.example;

  if(!useReal){
    app.appendChild(el('<div class="note" style="margin-bottom:12px;">※現在の参加者数がまだ少ないため（' + agg.n + '人）、参考値として暫定データを表示しています。</div>'));
  }

  // 診断結果カードを、今度は「他者比較」の一文つきで再掲示する（実験群のみ表示されるSTEP4）
  const typeInfo = classifyByComposition(state.decision1.slice(0, FOOD_RECIPIENTS));
  const sameTypeCount = (agg.typeDist && agg.typeDist[typeInfo.code]) || 0;
  const statText = useReal
    ? "今日の来場者のうち、あなたと同じタイプは" + Math.round((sameTypeCount / agg.n) * 100) + "%でした"
    : "参考データ" + agg.n + "件中、あなたと同じタイプは" + sameTypeCount + "人でした";
  const nameLabel = state.nickname ? state.nickname + "さん" : "あなた";

  const diagCard = el(diagCardHTML(typeInfo, nameLabel, statText));
  app.appendChild(diagCard);
  renderTypeSpectrum(diagCard.querySelector(".diag-card-spectrum-slot"), typeInfo);
  app.appendChild(el('<p class="note">これは、あなたが食料を渡した2人の組み合わせから自動判定した、あくまで参考の分類です。</p>'));

  app.appendChild(el('<hr style="border:none;border-top:1px solid var(--border);margin:20px 0;">'));

  // 他の参加者との比較（3カラム＋増減矢印）
  app.appendChild(el('<h2>他の参加者と比べてみましょう</h2>'));
  app.appendChild(el('<p class="note">優先順位と判断タイプの違いを確認してください。</p>'));

  const avgOrdered = CHARACTERS.slice().sort((a,b) => (avgRank[a.id]||0) - (avgRank[b.id]||0)).map(c => c.id);
  const exampleOrdered = example;
  const avgRankPosition = {};
  avgOrdered.forEach((id, idx) => { avgRankPosition[id] = idx + 1; });
  const exampleRankPosition = {};
  exampleOrdered.forEach((id, idx) => { exampleRankPosition[id] = idx + 1; });

  const avgTypeInfo = classifyByComposition(avgOrdered.slice(0, FOOD_RECIPIENTS));
  const exampleTypeInfo = classifyByComposition(exampleOrdered.slice(0, FOOD_RECIPIENTS));

  function buildColumn(title, tagInfo, orderedIds, deltaBase){
    let html = '<div class="compare-col' + (deltaBase ? "" : " mine") + '">' +
      '<div class="compare-col-head"><span>' + title + '</span>' +
      (tagInfo ? '<span class="compare-type-tag">' + tagInfo.code + '：' + tagInfo.label + '</span>' : "") +
      '</div>';
    orderedIds.forEach((id, idx) => {
      const c = getChar(id);
      const rank = idx + 1;
      const deltaHtml = deltaBase ? deltaArrow(deltaBase[id], rank) : "";
      html += '<div class="compare-row"><span class="compare-rank">' + rank + '位</span>' + charBadge(c) + '<span class="compare-name">' + c.name + '</span>' + deltaHtml + '</div>';
    });
    html += '</div>';
    return html;
  }

  const myRankPosition = {};
  state.decision1.forEach((id, idx) => { myRankPosition[id] = idx + 1; });

  // 平均が何件のデータに基づくかを必ず併記する（件数が少なくても、実態以上に確からしく見せない）
  const avgColumnTitle = "参加者の平均（参考データ N=" + agg.n + "件）";

  const colsHtml =
    '<div class="compare-cols-wrap">' +
    buildColumn("あなたの選択", typeInfo, state.decision1, null) +
    buildColumn(avgColumnTitle, avgTypeInfo, avgOrdered, myRankPosition) +
    buildColumn("異なる選択の例", exampleTypeInfo, exampleOrdered, myRankPosition) +
    '</div>';
  app.appendChild(el(colsHtml));

  // 「異なる選択の例」の人が漂流日記①で書いた理由（順位データと合わせて表示する）。
  // 理由のデータが欠損している場合（参考データが全くなく暫定データを使っている場合など）は、
  // 上のランキング表示だけにとどめ、この理由カードは表示しない。
  if(agg.exampleReason){
    app.appendChild(el(
      '<div class="card example-reason-card">' +
        '<h3 style="margin-top:0;">「異なる選択の例」の人が語った理由</h3>' +
        '<blockquote class="example-reason-quote">' + escapeHtml(agg.exampleReason) + '</blockquote>' +
      '</div>'
    ));
  }

  // 4. 自分と最も順位づけが異なる参加者（4人分の順位差の絶対値の合計が最大の人）を再提示する
  const gapChars = CHARACTERS.filter(c => Math.abs(myRankPosition[c.id] - exampleRankPosition[c.id]) >= 2);
  if(gapChars.length > 0){
    let gapHtml = '<div class="gap-card"><h3 style="margin-top:0;">最も異なる選択をした参加者と、もう一度比べてみましょう</h3>';
    gapChars.forEach(c => {
      gapHtml +=
        '<div style="margin-bottom:10px;">' +
        '<div>' + charBadge(c) + ' <strong>' + c.name + '</strong>' +
        '<span class="gap-rank-tag">あなた' + myRankPosition[c.id] + '位→比較対象' + exampleRankPosition[c.id] + '位</span></div>' +
        '<div class="char-trait" style="margin-top:4px;">' + c.trait + '</div>' +
        '<div class="char-trait" style="color:#a3701f;">' + c.shortConsequence + '</div>' +
        '</div>';
    });
    gapHtml += '</div>';
    app.appendChild(el(gapHtml));
  }

  app.appendChild(el(
    '<div class="legend">順位の差が大きい人物　<span class="delta-up">↑数字</span> あなたより上位　<span class="delta-down">↓数字</span> あなたより下位</div>'
  ));

  navRow(app, { next: () => setStep("survey3") });
}

function renderSurvey3(app){
  renderDiaryHeader(app, "③", "他の人の選択を見て、感じたことを教えてください。");
  const box = el('<div class="card"></div>');
  app.appendChild(box);
  renderSurveyQuestions(box, SURVEY3_QUESTIONS, state.survey3, "survey3");
  app.appendChild(el(diaryWavesHTML()));

  currentNextValidator = () => allAnswered(SURVEY3_QUESTIONS, state.survey3);

  navRow(app, {
    back: () => setStep("comparison"),
    next: async () => {
      await submitDiaryLog("③", {
        insight: state.survey3.insight,
        type_reaction: state.survey3.type_reaction,
        note: state.survey3.note
      });
      setStep("rewind");
    }
  });
}

/* ============================================================
   決断②の前の演出：時間が巻き戻り、漂流した1日目の朝へ戻る。
   ============================================================ */
const REWIND_LINES = [
  { text: "目を開けると、視界がぐるぐると回っています。", delay: 2200 },
  { text: "波の音が、まるで巻き戻っていくように聞こえました。", delay: 2600 },
  { text: "――気づくと、あなたはまた同じ浜辺に倒れていました。", cls:"pain", delay: 2600 },
  { text: "何もかもが、漂流したあの朝に戻っているようです。", delay: 2600 },
  { text: "もう一度、あなたはまた2人を選ばなければなりません。", delay: 0 }
];

function renderRewind(app){
  app.appendChild(el('<h2>――もう一度、あの朝へ</h2>'));
  const box = el(
    '<div class="scene-box rewind-scene" id="rewind-scene">' +
      '<div class="rewind-spinner">🌀</div>' +
      '<div class="wreck-text" id="rewind-text"></div>' +
    '</div>'
  );
  app.appendChild(box);

  const textEl = box.querySelector("#rewind-text");
  const timers = [];
  let lineIdx = 0;

  function showNextLine(){
    if(lineIdx >= REWIND_LINES.length) return;
    const line = REWIND_LINES[lineIdx];
    textEl.appendChild(el('<p class="wreck-line' + (line.cls ? " " + line.cls : "") + '">' + line.text + '</p>'));
    lineIdx++;
    if(lineIdx < REWIND_LINES.length){
      timers.push(setTimeout(showNextLine, line.delay));
    } else {
      timers.push(setTimeout(() => {
        const nextBtn = app.querySelector("#rewind-next-btn");
        if(nextBtn) nextBtn.disabled = false;
      }, 2000));
    }
  }
  timers.push(setTimeout(showNextLine, 400));

  function finish(){
    timers.forEach(t => clearTimeout(t));
    setStep("decision2");
  }

  const row = el('<div class="btn-row"></div>');
  const skipBtn = el('<button type="button" class="secondary">スキップ</button>');
  skipBtn.addEventListener("click", finish);
  const nextBtn = el('<button type="button" class="primary" id="rewind-next-btn">次へ</button>');
  nextBtn.disabled = true;
  nextBtn.addEventListener("click", finish);
  row.appendChild(skipBtn);
  row.appendChild(nextBtn);
  app.appendChild(row);
}

function renderDecision2(app){
  app.appendChild(el('<h2>決断② 誰に食料を渡すか（もう一度）</h2>'));
  app.appendChild(el('<div class="hint">同じ状況を、もう一度最初からやり直します。4人を<strong>「食料を渡したい順」</strong>に並び替えてください。上位2人に食料が渡ります。</div>'));
  if(!state.decision2) state.decision2 = state.decision1.slice();
  renderRankingWidget(app, state.decision2, (ids) => logReorder("decision2", ids));
  navRow(app, {
    back: () => setStep(state.group === "control" ? "controlBridge" : "survey3"),
    next: async () => {
      AudioManager.playSfx("confirm");
      const selected2 = state.decision2.slice(0, FOOD_RECIPIENTS);
      state.judgmentType2 = classifyByComposition(selected2).code;
      await submitDecisionLog("②", state.decision2, state.judgmentType2, state.reorderCounts.decision2);
      setStep("survey4");
    }
  });
}

function renderSurvey4(app){
  renderDiaryHeader(app, "④", "2回目の選択について、今の気持ちを聞かせてください。");
  const box = el('<div class="card"></div>');
  app.appendChild(box);
  renderSurveyQuestions(box, SURVEY4_QUESTIONS, state.survey4, "survey4");
  app.appendChild(el(diaryWavesHTML()));

  currentNextValidator = () => allAnswered(SURVEY4_QUESTIONS, state.survey4);

  navRow(app, {
    back: () => setStep("success"),
    next: async () => {
      await submitDiaryLog("④", {
        reason: state.survey4.reason,
        change_reason: state.survey4.change_reason,
        conviction: state.survey4.conviction,
        ownership: state.survey4.ownership,
        note: state.survey4.note
      });
      setStep("day2seal");
    }
  });
}

/* ============================================================
   決断②の成果を見せる成功体験シーン（紙芝居）。
   0. 夜になる（焚き火の導入。失敗体験シーンの導入と対になる演出）
   1. 渡さなかった2人が動けないでいる様子（失敗シーンと同じ暗転スタイル）
   2. 渡した2人が、動けない二人の代わりに支えてくれた様子
   3. 「助かった！」（渡さなかった2人も間に合ったことを添える）
   4. 4人全員から、リーダーへの感謝
   ============================================================ */
function buildSuccessPageSpec(page){
  if(page.type === "intro"){
    return {
      classes: ["failure-page", "failure-intro"],
      waitMs: 1500,
      html:
        '<div class="failure-fire">🔥</div>' +
        '<p class="wreck-line" style="animation-delay:.4s;">' + SUCCESS_INTRO_LINE + '</p>'
    };
  }
  if(page.type === "immobile"){
    const c = getChar(page.id);
    return {
      classes: ["blackout"],
      waitMs: 1400,
      sound: "collapse",
      html:
        '<div class="blackout-avatar">' + avatarHTML(c, "fail") + '</div>' +
        '<p class="blackout-caption">' + IMMOBILE_LINE[page.id] + '</p>'
    };
  }
  if(page.type === "helped"){
    const c = getChar(page.id);
    return {
      classes: ["success-scene", "success-focus"],
      waitMs: 1200,
      html:
        '<div class="success-focus-avatar">' + avatarHTML(c, "success") + '</div>' +
        '<p class="success-caption">' + HELPED_LINE[page.id] + '</p>'
    };
  }
  if(page.type === "rescued"){
    return {
      classes: ["success-scene", "success-final"],
      waitMs: 1400,
      sound: "rescue",
      html:
        '<div class="success-final-ship">⛵✨</div>' +
        '<p class="success-caption">' + SUCCESS_FINAL_LINE + '</p>' +
        '<p class="success-caption success-caption-2">' + buildRescuedExtraLine(page.notSelected) + '</p>' +
        '<div class="success-figures">' + '<span class="success-figure">🙌</span>'.repeat(5) + '</div>' +
        '<div class="success-confetti">🎉✨🎊✨🎉</div>'
    };
  }
  // gratitude
  const c = getChar(page.id);
  return {
    classes: ["success-scene", "success-focus"],
    waitMs: 1200,
    html:
      '<div class="success-focus-avatar">' + avatarHTML(c, "success") + '</div>' +
      '<p class="success-caption">' + GRATITUDE_LINE[page.id] + '</p>'
  };
}

function renderSuccess(app){
  const stage = el('<div id="success-stage"></div>');
  app.appendChild(stage);
  const pages = buildSuccessPages(state.decision2);
  renderKamishibaiPage(
    stage, pages, state.successPage, buildSuccessPageSpec,
    (idx) => { state.successPage = idx; },
    () => setStep("survey5")
  );
}

function renderSurvey5(app){
  renderDiaryHeader(app, "⑤", "無事に救助されたあとの、今の気持ちを聞かせてください。");
  const box = el('<div class="card"></div>');
  app.appendChild(box);
  renderSurveyQuestions(box, SURVEY5_QUESTIONS, state.survey5, "survey5");
  app.appendChild(el(diaryWavesHTML()));

  currentNextValidator = () => allAnswered(SURVEY5_QUESTIONS, state.survey5);

  navRow(app, {
    back: () => setStep("success"),
    next: async () => {
      await Promise.all([
        submitDiaryLog("⑤", {
          overall_feeling: state.survey5.overall_feeling,
          final_regret: state.survey5.final_regret,
          final_regret_reason: state.survey5.final_regret_reason
        }),
        submitSessionEnd()
      ]);
      setStep("end");
    }
  });
}

function renderEnd(app){
  const finalTypeInfo = classifyByComposition(state.decision2.slice(0, FOOD_RECIPIENTS));

  app.appendChild(el('<h2>クリア！</h2>'));
  app.appendChild(el(
    '<div class="card end-type-card">' +
      '<div class="type-badge">' + finalTypeInfo.code + '：' + finalTypeInfo.label + '</div>' +
      '<p class="end-type-subtitle">' + TYPE_SUBTITLE[finalTypeInfo.code] + '</p>' +
      '<p class="note">' + finalTypeInfo.desc + '</p>' +
    '</div>'
  ));
  app.appendChild(el(
    '<div class="card"><p>2回目の選択は' + finalTypeInfo.label + 'でした。体験してくれてありがとう！</p></div>'
  ));
}
