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
    opening: renderOpening,
    intro1: renderIntro1,
    intro2: renderIntro2,
    decision1: renderDecision1,
    survey1: renderSurvey1,
    failure: renderFailure,
    survey2: renderSurvey2,
    comparison: renderComparison,
    survey3: renderSurvey3,
    rewind: renderRewind,
    decision2: renderDecision2,
    success: renderSuccess,
    survey4: renderSurvey4,
    end: renderEnd
  };
  renderers[state.step](app);
  updateNextButton();
}

function renderStart(app){
  app.appendChild(el('<h1>無人島の選択</h1>'));
  app.appendChild(el(
    '<div class="card"><p>これは、道徳的な判断について調べる研究用のプロトタイプです。' +
    'これから漂流のシナリオを読み、あなたの判断について答えていただきます。' +
    '回答は研究目的でのみ使用し、個人が特定されない形で扱います。</p>' +
    '<p class="note">所要時間の目安：10〜15分</p></div>'
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
    '<div class="card"><p>持ち出せた荷物を確認すると、残っていた食料はたったの<strong>2人分</strong>。あなたは、リーダーとしてこの2人分を他の4人のために使うことに決めました。残る4人のうち誰に食料を渡すか、あなたが決めなければなりません。</p>' +
    '<p class="note">（あなたはお腹がすいていなかったので、他の人に渡すことにしました。）</p></div>'
  ));
  app.appendChild(el('<h3>他の4人の情報</h3>'));
  const list = el('<div></div>');
  CHARACTERS.forEach(c => {
    list.appendChild(el(
      '<div class="card char-card">' +
        '<div class="char-avatar">' + avatarHTML(c) + '</div>' +
        '<div><div class="char-name">' + c.name + '</div>' +
        '<div class="char-trait">' + c.trait + '</div>' +
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
  navRow(app, { back: () => setStep("intro2"), next: () => setStep("survey1") });
}

/* ============================================================
   漂流日記（旧アンケート）の共通ヘッダー：見出し・直感を促す一言・海の背景
   ============================================================ */
function diaryWavesHTML(){
  return '<div class="diary-waves"><div class="wave wave1"></div><div class="wave wave2"></div><div class="wave wave3"></div></div>';
}

function renderDiaryHeader(app, number, leadText){
  app.appendChild(el('<h2>漂流日記' + number + '</h2>'));
  app.appendChild(el('<div class="diary-kicker">📔 日記を書く</div>'));
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
      state.failurePage = 0;
      setStep("failure");
    }
  });
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
      classes: ["failure-page", "failure-focus", "failure-shake"],
      waitMs: 1400,
      html:
        '<div class="failure-focus-avatar">' + c.emojiCollapsed + '</div>' +
        '<p class="failure-caption">' + COLLAPSE_LINE[page.id] + '</p>'
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
    () => setStep("survey2")
  );
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
      state.aggregate = await fetchAggregate(state.decision1);
      const agg = state.aggregate || { n:0, avgRank:{}, example:null };
      const useReal = agg.n >= CONFIG.MIN_N_FOR_REAL_AVERAGE;
      await Promise.all([
        // 画面に実際に表示する内容を、表示データログに保存しておく
        // （表示された参考データが後から追跡できるようにするため）
        submitDisplayLog({
          displayedAvgRankN: agg.n,
          displayedAvgRankIsBaseline: !useReal,
          displayedAvgRank: useReal ? agg.avgRank : PRESET_BASELINE.avgRank,
          displayedExample: agg.example || PRESET_BASELINE.example,
          displayedJudgmentType: state.judgmentType
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

function renderComparison(app){
  app.appendChild(el('<h2>あなたの判断タイプ</h2>'));
  app.appendChild(el('<p class="note">今回の選択と理由から、あなたの道徳的判断スタイルを分析しました。</p>'));

  const agg = state.aggregate || { n:0, avgRank:{}, typeDist:{}, example:null };
  const useReal = agg.n >= CONFIG.MIN_N_FOR_REAL_AVERAGE;
  const avgRank = useReal ? agg.avgRank : PRESET_BASELINE.avgRank;
  const example = agg.example || PRESET_BASELINE.example;

  if(!useReal){
    app.appendChild(el('<div class="note" style="margin-bottom:12px;">※現在の参加者数がまだ少ないため（' + agg.n + '人）、参考値として暫定データを表示しています。</div>'));
  }

  // 1. 判断タイプ（功利主義⇔義務論の分布バー）
  const typeInfo = classifyByComposition(state.decision1.slice(0, FOOD_RECIPIENTS));
  const typeCard = el(
    '<div class="card"><div class="type-badge">' + typeInfo.code + '：' + typeInfo.label + '</div>' +
    '<p>' + typeInfo.desc + '</p></div>'
  );
  app.appendChild(typeCard);
  renderTypeSpectrum(typeCard, typeInfo);
  typeCard.appendChild(el('<p class="note">これは、あなたが食料を渡した2人の組み合わせから自動判定した、あくまで参考の分類です。</p>'));

  // 2. 3タイプの一覧（自分がどこに位置するかを俯瞰できるようにする）
  renderTypeGrid(app, typeInfo.code);

  app.appendChild(el('<hr style="border:none;border-top:1px solid var(--border);margin:20px 0;">'));

  // 3. 他の参加者との比較（3カラム＋増減矢印）
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
  { text: "もう一度、あなたはあの2人を選ばなければなりません。", delay: 0 }
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
  app.appendChild(el('<div class="hint">同じ状況を、もう一度最初からやり直します。4人を「食料を渡したい順」に並び替えてください。上位2人に食料が渡ります。</div>'));
  if(!state.decision2) state.decision2 = state.decision1.slice();
  renderRankingWidget(app, state.decision2, (ids) => logReorder("decision2", ids));
  navRow(app, {
    back: () => setStep("survey3"),
    next: async () => {
      const selected2 = state.decision2.slice(0, FOOD_RECIPIENTS);
      state.judgmentType2 = classifyByComposition(selected2).code;
      await submitDecisionLog("②", state.decision2, state.judgmentType2, state.reorderCounts.decision2);
      setStep("success");
    }
  });
}

// 決断②で食料を渡した2人の「できること」が活きたときの一言（成功エンディング用）
/* ============================================================
   3日目の朝：成功体験シーン（紙芝居）
   失敗体験シーンと同じ構成で、演出を挟みながら段階的に見せる。
   ============================================================ */
function buildSuccessPageSpec(page){
  if(page.type === "survived"){
    const c = getChar(page.id);
    return {
      classes: ["success-scene", "success-focus"],
      waitMs: 1400,
      html:
        '<div class="success-focus-avatar">' + c.emoji + '</div>' +
        '<p class="success-caption">' + SURVIVED_LINE[page.id] + '</p>' +
        '<p class="success-caption success-caption-2">' + FAMILY_THANKS_LINE[page.id] + '</p>'
    };
  }
  if(page.type === "helped"){
    const c = getChar(page.id);
    return {
      classes: ["success-scene", "success-focus"],
      waitMs: 1200,
      html:
        '<div class="success-focus-avatar">' + c.emoji + '</div>' +
        '<p class="success-caption">' + HELPED_LINE[page.id] + '</p>'
    };
  }
  // final
  return {
    classes: ["success-scene", "success-final"],
    waitMs: 1200,
    html:
      '<div class="success-final-ship">⛵✨</div>' +
      '<p class="success-caption">' + SUCCESS_FINAL_LINE + '</p>' +
      '<div class="success-figures">' + '<span class="success-figure">🙌</span>'.repeat(5) + '</div>' +
      '<div class="success-confetti">🎉✨🎊✨🎉</div>'
  };
}

function renderSuccess(app){
  app.appendChild(el('<h2>3日目の朝</h2>'));
  const stage = el('<div id="success-stage"></div>');
  app.appendChild(stage);
  const pages = buildSuccessPages(state.decision2);
  renderKamishibaiPage(
    stage, pages, state.successPage, buildSuccessPageSpec,
    (idx) => { state.successPage = idx; },
    () => setStep("survey4")
  );
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
      await Promise.all([
        submitDiaryLog("④", {
          reason: state.survey4.reason,
          change_reason: state.survey4.change_reason,
          conviction: state.survey4.conviction,
          ownership: state.survey4.ownership,
          note: state.survey4.note
        }),
        submitSessionEnd()
      ]);
      setStep("end");
    }
  });
}

function renderEnd(app){
  app.appendChild(el('<h2>ご協力ありがとうございました</h2>'));
  app.appendChild(el('<div class="card"><p>これで体験は終了です。回答いただいたデータは研究のために使わせていただきます。</p></div>'));
}
