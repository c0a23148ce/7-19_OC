/* ============================================================
   共通UIパーツ
   ============================================================ */
function el(html){
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstChild;
}

// 紙芝居のように1ページずつ場面を見せる共通エンジン（失敗体験・成功体験シーンで共用）。
// buildPage(page, idx) は { classes:[...], html:"...", waitMs:number } を返す関数。
// waitMsの間は「次へ」ボタンを無効化し、演出が一区切りついてから押せるようにする。
// onAdvance(idx)は現在のページ番号をstateへ保存するためのコールバック（再描画時に位置を保つ用）。
function renderKamishibaiPage(stage, pages, idx, buildPage, onAdvance, onFinish){
  onAdvance(idx);
  stage.innerHTML = "";
  const spec = buildPage(pages[idx], idx);
  const box = el('<div class="scene-box"></div>');
  (spec.classes || []).forEach(c => box.classList.add(c));
  box.innerHTML = spec.html;
  stage.appendChild(box);

  const row = el('<div class="btn-row"></div>');
  row.appendChild(document.createElement("span"));
  const nextBtn = el('<button type="button" class="primary" id="next-btn">次へ</button>');
  nextBtn.disabled = true;
  nextBtn.addEventListener("click", () => {
    if(idx + 1 < pages.length){
      renderKamishibaiPage(stage, pages, idx + 1, buildPage, onAdvance, onFinish);
    } else {
      onFinish();
    }
  });
  row.appendChild(nextBtn);
  stage.appendChild(row);
  setTimeout(() => { nextBtn.disabled = false; }, spec.waitMs || 800);
}

function charBadge(c){
  return '<span class="char-badge" style="background:' + c.color.bg + ';color:' + c.color.text + ';">' + c.abbrev + '</span>';
}

// images/<id>.png を置くとそちらを表示し、無ければ絵文字のまま表示する
function avatarHTML(c){
  return (
    '<span class="avatar">' +
      '<span class="avatar-emoji">' + c.emoji + '</span>' +
      '<img class="avatar-img" src="images/' + c.id + '.png" alt="' + c.name + '" ' +
        'onload="this.style.display=\'block\';this.previousElementSibling.style.display=\'none\';" ' +
        'onerror="this.style.display=\'none\';">' +
    '</span>'
  );
}

function deltaArrow(myRank, otherRank){
  const diff = myRank - otherRank;
  if(diff === 0) return '<span class="delta-flat">−</span>';
  if(diff > 0) return '<span class="delta-up">↑' + diff + '</span>';
  return '<span class="delta-down">↓' + Math.abs(diff) + '</span>';
}

function renderTypeGrid(container, myCode){
  const grid = el('<div class="type-grid"></div>');
  ALL_TYPES.forEach(t => {
    const isMine = t.code === myCode;
    const pct = ((t.score + 9) / 18) * 100;
    grid.appendChild(el(
      '<div class="type-grid-card' + (isMine ? " mine" : "") + '">' +
        '<div class="type-grid-head">' +
          '<div class="type-grid-letter type-letter-' + t.code + '">' + t.code + '</div>' +
          '<div class="type-grid-name">' + t.label + '</div>' +
          (isMine ? '<span class="type-grid-you">あなた</span>' : "") +
        '</div>' +
        '<div class="type-spectrum-wrap small"><div class="type-spectrum"><div class="type-spectrum-marker" style="left:' + pct + '%;"></div></div></div>' +
      '</div>'
    ));
  });
  container.appendChild(grid);
}

function renderTypeSpectrum(container, typeInfo){
  const pct = Math.max(0, Math.min(100, ((typeInfo.score + 9) / 18) * 100));
  const wrap = el(
    '<div class="type-spectrum-wrap">' +
      '<div class="type-spectrum"><div class="type-spectrum-marker" id="spectrum-marker-' + Math.random().toString(36).slice(2) + '"></div></div>' +
      '<div class="type-spectrum-labels"><span>義務論的</span><span>功利主義的</span></div>' +
    '</div>'
  );
  container.appendChild(wrap);
  const marker = wrap.querySelector(".type-spectrum-marker");
  // 初期位置（中央）を描画させてから実際の位置へアニメーションさせる
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      marker.style.left = pct + "%";
    });
  });
}

// 並べ替え回数・履歴の記録（決断①・決断②それぞれで、ドラッグ／▲▼ボタンどちらの操作も対象）
// ※ドラッグ操作はスマホでの利用を想定しており環境で精度がばらつくため、参考指標として扱う。
function logReorder(key, idsRef){
  state.reorderCounts[key] = (state.reorderCounts[key] || 0) + 1;
  state.dragLogs[key].push(idsRef.slice());
}

function renderRankingWidget(container, idsRef, onChange){
  const ul = document.createElement("ul");
  ul.className = "rank-list";
  ul.id = "rank-list";

  function draw(){
    ul.innerHTML = "";
    idsRef.forEach((id, idx) => {
      const c = getChar(id);
      const li = document.createElement("li");
      li.className = "rank-item" + (idx < FOOD_RECIPIENTS ? " top3" : "");
      li.dataset.id = id;
      li.innerHTML =
        '<div class="rank-num">' + (idx+1) + '番</div>' +
        '<div class="rank-label"><span class="rank-icon">' + avatarHTML(c) + '</span>' + c.name + (idx < FOOD_RECIPIENTS ? ' <span class="rank-tag">食料を渡す</span>' : '') + '</div>' +
        '<div class="rank-arrows">' +
          '<button type="button" data-dir="up" ' + (idx===0?"disabled":"") + '>▲</button>' +
          '<button type="button" data-dir="down" ' + (idx===idsRef.length-1?"disabled":"") + '>▼</button>' +
        '</div>';
      ul.appendChild(li);
    });
    // 上下ボタン
    ul.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const li = btn.closest(".rank-item");
        const id = li.dataset.id;
        const i = idsRef.indexOf(id);
        const dir = btn.dataset.dir === "up" ? -1 : 1;
        const j = i + dir;
        if(j < 0 || j >= idsRef.length) return;
        [idsRef[i], idsRef[j]] = [idsRef[j], idsRef[i]];
        draw();
        onChange && onChange(idsRef);
      });
    });
  }
  draw();
  container.appendChild(ul);

  if(window.Sortable){
    new Sortable(ul, {
      animation:150,
      onEnd: function(){
        const newOrder = Array.from(ul.children).map(li => li.dataset.id);
        idsRef.length = 0;
        newOrder.forEach(id => idsRef.push(id));
        draw();
        onChange && onChange(idsRef);
      }
    });
  }
}

let questionCounter = 0;

function renderLikertQuestion(container, q, valueStore){
  questionCounter++;
  const wrap = el('<div class="likert-q"></div>');
  wrap.innerHTML =
    '<div class="likert-q-text"><span class="q-badge">Q' + questionCounter + '</span>' + q.text + '</div>' +
    '<div class="likert-scale">' +
      [1,2,3,4,5].map(v =>
        '<div class="likert-opt">' +
          '<input type="radio" name="' + q.id + '" id="' + q.id + "_" + v + '" value="' + v + '">' +
          '<label for="' + q.id + "_" + v + '">' + v + '</label>' +
        '</div>'
      ).join("") +
    '</div>' +
    '<div class="likert-caption"><span>' + q.low + '</span><span>' + q.high + '</span></div>';
  wrap.querySelectorAll("input").forEach(inp => {
    if(valueStore[q.id] == inp.value) inp.checked = true;
    inp.addEventListener("change", () => { valueStore[q.id] = inp.value; updateNextButton(); });
  });
  container.appendChild(wrap);
}

// 特定のテキスト欄にフォーカスしていた合計時間(ms)を計測する（自由記述欄の入力時間ログ用）
function trackFocusTime(el, store, key){
  let focusStart = null;
  el.addEventListener("focus", () => { focusStart = Date.now(); });
  el.addEventListener("blur", () => {
    if(focusStart !== null){
      store[key] = (store[key] || 0) + (Date.now() - focusStart);
      focusStart = null;
    }
  });
}

function renderTextQuestion(container, q, valueStore){
  questionCounter++;
  const placeholder = q.placeholder || "思ったことをそのまま書いてみてください";
  const wrap = el('<div class="likert-q"></div>');
  wrap.innerHTML =
    '<div class="likert-q-text"><span class="q-badge">Q' + questionCounter + '</span>' + q.text + '</div>' +
    '<textarea id="' + q.id + '" placeholder="' + placeholder + '">' + (valueStore[q.id] || "") + '</textarea>';
  const ta = wrap.querySelector("textarea");
  ta.addEventListener("input", () => { valueStore[q.id] = ta.value; updateNextButton(); });
  container.appendChild(wrap);
  return ta;
}

// 漂流日記の設問一式を描画する共通処理。自由記述欄は、入力に要した時間を
// timingPrefix + "_" + 設問id のキーで state.inputTiming に記録する
// （ページ全体の滞在時間とは別に、自由記述そのものの入力時間を分析用に残すため）。
function renderSurveyQuestions(container, questions, valueStore, timingPrefix){
  questions.forEach(q => {
    if(q.type === "likert"){
      renderLikertQuestion(container, q, valueStore);
    } else {
      const ta = renderTextQuestion(container, q, valueStore);
      trackFocusTime(ta, state.inputTiming, timingPrefix + "_" + q.id);
    }
  });
}

// required:false の設問（例：「ひとこと（任意）」）は未回答でも次へ進める
function allAnswered(questions, valueStore){
  return questions
    .filter(q => q.required !== false)
    .every(q => {
      const v = valueStore[q.id];
      return v !== undefined && String(v).trim() !== "";
    });
}

let currentNextValidator = () => true;
function updateNextButton(){
  const btn = document.getElementById("next-btn");
  if(!btn) return;
  btn.disabled = !currentNextValidator();
}

function navRow(container, opts){
  const row = el('<div class="btn-row"></div>');
  if(opts.back){
    const b = el('<button type="button" class="secondary">戻る</button>');
    b.addEventListener("click", opts.back);
    row.appendChild(b);
  } else {
    row.appendChild(document.createElement("span"));
  }
  const nextBtn = el('<button type="button" class="primary" id="next-btn">' + (opts.nextLabel || "次へ") + '</button>');
  nextBtn.addEventListener("click", opts.next);
  row.appendChild(nextBtn);
  container.appendChild(row);
}
