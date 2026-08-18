/* ============================================================
 * PharmaLex 药企英语背单词 — 核心逻辑
 * 纯前端 / localStorage 持久化 / Web Speech API 发音
 * ============================================================ */
(function () {
  "use strict";

  const STORE_PROGRESS = "pharmalex_progress_v1";
  const STORE_CUSTOM = "pharmalex_custom_v1";

  // Leitner 间隔（天）：box1~box5
  const INTERVALS = [1, 2, 4, 7, 15];
  const DAY = 86400000;

  // ---------- 存储 ----------
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_PROGRESS)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) { localStorage.setItem(STORE_PROGRESS, JSON.stringify(p)); }
  function loadCustom() {
    try { return JSON.parse(localStorage.getItem(STORE_CUSTOM)) || []; }
    catch (e) { return []; }
  }
  function saveCustom(c) { localStorage.setItem(STORE_CUSTOM, JSON.stringify(c)); }

  let progress = loadProgress();
  let customWords = loadCustom();

  function wordKey(w) { return (w.bankId || "x") + "::" + w.word; }

  function getRec(w) {
    const k = wordKey(w);
    if (!progress[k]) progress[k] = { box: 0, due: 0, reps: 0, lapses: 0, last: 0 };
    return progress[k];
  }

  // 到期词：未学过 或 due<=now
  function isDue(w) {
    const r = progress[wordKey(w)];
    if (!r) return true;
    return r.due <= Date.now();
  }

  function dueWords(bankId) {
    const all = getAllWords(customWords);
    return all.filter(w => (!bankId || w.bankId === bankId) && isDue(w));
  }

  function review(w, quality) {
    // quality: 'know' | 'vague' | 'unknow'
    const r = getRec(w);
    r.reps += 1;
    r.last = Date.now();
    if (quality === "unknow") {
      r.box = 1; r.lapses += 1; r.due = Date.now(); // 立即重排
    } else if (quality === "vague") {
      r.box = Math.max(1, Math.min(5, r.box || 1));
      r.due = Date.now() + INTERVALS[r.box - 1] * DAY * 0.5;
    } else { // know
      r.box = Math.min(5, (r.box || 0) + 1);
      const idx = Math.max(0, r.box - 1);
      r.due = Date.now() + INTERVALS[idx] * DAY;
    }
    saveProgress(progress);
  }

  // ---------- 发音 ----------
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- 工具 ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const view = $("#view");

  function tpl(id) { return $("#" + id).content.cloneNode(true); }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- 导航 ----------
  const navBtns = $$(".nav-btn");
  navBtns.forEach(b => b.addEventListener("click", () => switchView(b.dataset.view)));
  $("#brandHome").addEventListener("click", () => switchView("home"));

  function switchView(name) {
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.view === name));
    if (name === "home") renderHome();
    else if (name === "banks") renderBanks();
    else if (name === "learn") renderLearn();
    else if (name === "quiz") renderQuiz();
    else if (name === "dictation") renderDictation();
    else if (name === "stats") renderStats();
    else if (name === "custom") renderCustom();
    window.scrollTo(0, 0);
    updateDueBadge();
  }

  function updateDueBadge() {
    const n = dueWords().length;
    const badge = $("#dueBadge");
    badge.textContent = n > 0 ? "今日待复习：" + n : "全部复习完毕 🎉";
    const dc = $(".due-count");
    if (dc) dc.textContent = n;
  }

  // ---------- 首页 ----------
  const MODES = [
    { icon: "🃏", title: "卡片记忆", desc: "间隔重复，先看词再翻释义", act: "learn" },
    { icon: "✅", title: "选择题测验", desc: "四选一，检验词义掌握", act: "quiz" },
    { icon: "🔊", title: "听写拼写", desc: "听发音写单词，强化拼写", act: "dictation" },
    { icon: "📊", title: "学习统计", desc: "掌握度与到期情况一目了然", act: "stats" },
    { icon: "📚", title: "词库浏览", desc: "按场景浏览全部专业词汇", act: "banks" },
    { icon: "➕", title: "我的词库", desc: "补充岗位专属高频词", act: "custom" }
  ];

  function renderHome() {
    const node = tpl("tpl-home");
    const grid = $("#modeGrid", node);
    MODES.forEach(m => {
      const card = document.createElement("div");
      card.className = "mode-card";
      card.innerHTML = `<div class="mc-icon">${m.icon}</div><h3>${m.title}</h3><p>${m.desc}</p>`;
      card.addEventListener("click", () => switchView(m.act));
      grid.appendChild(card);
    });
    $(".due-count", node).textContent = dueWords().length;
    $('[data-act="start-learn"]', node).addEventListener("click", () => renderLearn());
    $('[data-act="start-quiz"]', node).addEventListener("click", () => renderQuiz());
    view.innerHTML = "";
    view.appendChild(node);
  }

  // ---------- 词库 ----------
  function renderBanks() {
    const node = tpl("tpl-banks");
    const grid = $("#bankGrid", node);
    const totalAll = getAllWords(customWords).length;

    const makeCard = (bank, count, onClick) => {
      const c = document.createElement("div");
      c.className = "bank-card";
      c.innerHTML = `
        <div class="bc-icon">${bank.icon || "📁"}</div>
        <h3>${bank.name}</h3>
        <div class="bc-en">${bank.enName || ""}</div>
        <div class="bc-desc">${bank.desc || ""}</div>
        <div class="bc-count">${count} 个词条</div>`;
      c.addEventListener("click", onClick);
      return c;
    };

    PHARMA_BANKS.forEach(bank => {
      grid.appendChild(makeCard(bank, bank.words.length, () => showWordList(node, bank.id, bank.name)));
    });
    if (customWords.length) {
      grid.appendChild(makeCard({ icon: "⭐", name: "我的词库", enName: "My Words", desc: "自定义补充词条" }, customWords.length, () => showWordList(node, "custom", "我的词库")));
    }

    view.innerHTML = "";
    view.appendChild(node);
  }

  function showWordList(node, bankId, bankName) {
    const wrap = $("#wordListWrap", node);
    const all = getAllWords(customWords).filter(w => w.bankId === bankId);
    wrap.classList.remove("hidden");
    wrap.innerHTML = `
      <div class="wl-head">
        <h3>${bankName} · 共 ${all.length} 词</h3>
        <div>
          <button class="btn btn-sm" id="wlLearn">只学这组</button>
          <button class="btn btn-sm btn-ghost" id="wlClose">收起</button>
        </div>
      </div>`;
    const table = document.createElement("table");
    table.className = "word-table";
    table.innerHTML = `<thead><tr><th>单词 / 短语</th><th>词性</th><th>中文释义</th><th>例句</th><th></th></tr></thead>`;
    const tb = document.createElement("tbody");
    all.forEach(w => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="w-en">${w.word}</span>${w.phonetic ? `<div class="w-phon">${w.phonetic}</div>` : ""}</td>
        <td>${w.pos || ""}</td>
        <td>${w.cn}</td>
        <td>${w.en ? w.en + (w.cn ? `<div class="w-phon">${w.cn}</div>` : "") : ""}</td>
        <td><button class="audio-btn">🔊</button></td>`;
      $(".audio-btn", tr).addEventListener("click", () => speak(w.word));
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    wrap.appendChild(table);
    $("#wlLearn", wrap).addEventListener("click", () => renderLearn(bankId));
    $("#wlClose", wrap).addEventListener("click", () => wrap.classList.add("hidden"));
    wrap.scrollIntoView({ behavior: "smooth" });
  }

  // ---------- 学习（卡片） ----------
  let learnQueue = [];
  let learnBank = null;

  function renderLearn(bankId) {
    learnBank = bankId || null;
    learnQueue = shuffle(dueWords(learnBank));
    const node = tpl("tpl-learn");
    view.innerHTML = "";
    view.appendChild(node);
    if (!learnQueue.length) {
      $("#fcFront").innerHTML = `<div class="fc-word">🎉</div><div class="fc-hint">本组暂无到期词，去测验或稍后再来～</div>`;
      $("#fcBack").classList.add("hidden");
      $("#fcControls").innerHTML = `<button class="btn" data-back>返回首页</button>`;
      $('[data-back]').addEventListener("click", () => switchView("home"));
      return;
    }
    nextCard();
  }

  function nextCard() {
    if (!learnQueue.length) {
      $("#fcFront").innerHTML = `<div class="fc-word">✅</div><div class="fc-hint">本轮复习完成！掌握度已更新。</div>`;
      $("#fcBack").classList.add("hidden");
      $("#fcControls").innerHTML = `<button class="btn btn-primary" data-back>返回首页</button>`;
      $('[data-back]').addEventListener("click", () => switchView("home"));
      $("#learnMeta").textContent = "";
      return;
    }
    const w = learnQueue[0];
    const front = $("#fcFront");
    const back = $("#fcBack");
    const controls = $("#fcControls");
    front.classList.remove("hidden");
    back.classList.add("hidden");
    front.innerHTML = `
      <div class="fc-word">${w.word}</div>
      ${w.phonetic ? `<div class="fc-phon">${w.phonetic}</div>` : ""}
      <div class="fc-hint">点击「显示释义」查看中文与例句</div>
      <button class="btn btn-sm" id="fcSpeak" style="margin-top:14px">🔊 发音</button>`;
    $("#learnMeta").textContent = `剩余 ${learnQueue.length} 词 · ${w.bankName}`;
    $("#fcSpeak").addEventListener("click", () => speak(w.word));

    controls.innerHTML = `<button class="btn btn-primary" id="fcShow">显示释义</button>`;
    $("#fcShow").addEventListener("click", () => {
      back.classList.remove("hidden");
      front.classList.add("hidden");
      back.innerHTML = `
        <div class="fc-cn">${w.cn}</div>
        <div class="fc-pos">${w.pos || ""}</div>
        ${w.en ? `<div class="fc-ex">"${w.en}"</div><div class="fc-ex-cn">${w.cn || ""}</div>` : ""}
        <button class="btn btn-sm" id="fcSpeak2" style="margin-top:14px">🔊 发音</button>`;
      $("#fcSpeak2").addEventListener("click", () => speak(w.word));
      controls.innerHTML = `
        <button class="btn btn-unknow" data-q="unknow">不认识</button>
        <button class="btn btn-vague" data-q="vague">模糊</button>
        <button class="btn btn-know" data-q="know">认识</button>`;
      $$("#fcControls .btn").forEach(b => b.addEventListener("click", () => {
        review(w, b.dataset.q);
        learnQueue.shift();
        nextCard();
      }));
    });
  }

  // ---------- 选择题测验 ----------
  let quizState = null;
  function renderQuiz(bankId) {
    const all = shuffle(getAllWords(customWords).filter(w => !bankId || w.bankId === bankId));
    if (all.length < 4) {
      view.innerHTML = `<div class="section-empty">词条不足 4 个，无法生成选择题。请先到「我的词库」添加单词。</div>`;
      return;
    }
    quizState = { pool: all, idx: 0, score: 0, total: Math.min(10, all.length), bankId: bankId || null };
    const node = tpl("tpl-quiz");
    view.innerHTML = "";
    view.appendChild(node);
    quizStep();
  }

  function quizStep() {
    if (quizState.idx >= quizState.total) { quizFinish(); return; }
    const w = quizState.pool[quizState.idx % quizState.pool.length];
    const node = $("#quizCard");
    $("#quizMeta").textContent = `第 ${quizState.idx + 1} / ${quizState.total} 题 · ${w.bankName}`;
    node.innerHTML = `<div class="quiz-q">${w.word}</div><div class="quiz-sub">${w.phonetic || ""} 请选择正确中文释义</div>`;
    const others = shuffle(getAllWords(customWords).filter(x => x.cn !== w.cn)).slice(0, 3).map(x => x.cn);
    const opts = shuffle([w.cn, ...others]);
    const box = document.createElement("div");
    box.className = "quiz-options";
    opts.forEach(o => {
      const b = document.createElement("button");
      b.className = "opt"; b.textContent = o;
      b.addEventListener("click", () => {
        $$(".opt", box).forEach(x => x.classList.add("disabled"));
        if (o === w.cn) { b.classList.add("correct"); quizState.score++; }
        else { b.classList.add("wrong"); $$(".opt", box).forEach(x => { if (x.textContent === w.cn) x.classList.add("correct"); }); }
        const fb = document.createElement("div");
        fb.className = "quiz-feedback " + (o === w.cn ? "ok" : "no");
        fb.textContent = o === w.cn ? "✓ 正确" : "✗ 正确答案：" + w.cn;
        node.appendChild(fb);
        const next = document.createElement("button");
        next.className = "btn btn-primary"; next.textContent = quizState.idx + 1 >= quizState.total ? "查看结果" : "下一题";
        next.style.marginTop = "14px";
        next.addEventListener("click", () => { quizState.idx++; quizStep(); });
        node.appendChild(next);
      });
      box.appendChild(b);
    });
    node.appendChild(box);
    speak(w.word);
  }

  function quizFinish() {
    const node = $("#quizCard");
    const rate = Math.round(quizState.score / quizState.total * 100);
    node.innerHTML = `
      <div class="quiz-q">测验完成 🎉</div>
      <div class="quiz-sub">得分 ${quizState.score} / ${quizState.total}（${rate}%）</div>
      <p class="muted">${rate >= 80 ? "掌握扎实，继续保持！" : rate >= 50 ? "还不错，多复习几轮会更好。" : "建议回到卡片记忆，重点巩固。"}</p>
      <button class="btn btn-primary" id="qAgain">再来一组</button>
      <button class="btn" id="qHome">返回首页</button>`;
    $("#qAgain").addEventListener("click", () => renderQuiz(quizState.bankId));
    $("#qHome").addEventListener("click", () => switchView("home"));
  }

  // ---------- 听写拼写 ----------
  let dictState = null;
  function renderDictation(bankId) {
    const all = shuffle(getAllWords(customWords).filter(w => !bankId || w.bankId === bankId));
    if (!all.length) { view.innerHTML = `<div class="section-empty">暂无词条。</div>`; return; }
    dictState = { pool: all, idx: 0, score: 0, total: Math.min(10, all.length), bankId: bankId || null };
    const node = tpl("tpl-dictation");
    view.innerHTML = "";
    view.appendChild(node);
    dictStep();
  }

  function dictStep() {
    if (dictState.idx >= dictState.total) { dictFinish(); return; }
    const w = dictState.pool[dictState.idx % dictState.pool.length];
    const node = $("#dictCard");
    $("#dictMeta").textContent = `第 ${dictState.idx + 1} / ${dictState.total} 题 · ${w.bankName}`;
    node.innerHTML = `
      <div class="dict-prompt">听到发音后，拼写对应的英文单词 / 短语：</div>
      <div class="dict-prompt" style="color:var(--muted)">释义提示：${w.cn}</div>
      <input class="dict-input" id="dictInput" placeholder="在此输入英文…" autocomplete="off" />
      <div class="dict-actions">
        <button class="btn" id="dPlay">🔊 再听一次</button>
        <button class="btn btn-primary" id="dCheck">提交</button>
        <button class="btn btn-ghost" id="dSkip">跳过</button>
      </div>
      <div id="dictFb"></div>`;
    speak(w.word);
    const input = $("#dictInput");
    input.focus();
    const check = () => {
      const val = input.value.trim().toLowerCase().replace(/\s+/g, " ");
      const ans = w.word.toLowerCase().replace(/\s+/g, " ");
      const fb = $("#dictFb");
      $$(".dict-actions .btn").forEach(b => b.classList.add("disabled"));
      if (val === ans) { fb.className = "quiz-feedback ok"; fb.textContent = "✓ 正确"; dictState.score++; }
      else { fb.className = "quiz-feedback no"; fb.textContent = "✗ 正确答案：" + w.word; }
      const next = document.createElement("button");
      next.className = "btn btn-primary"; next.style.marginTop = "12px";
      next.textContent = dictState.idx + 1 >= dictState.total ? "查看结果" : "下一题";
      next.addEventListener("click", () => { dictState.idx++; dictStep(); });
      fb.appendChild(next);
    };
    $("#dCheck").addEventListener("click", check);
    $("#dPlay").addEventListener("click", () => speak(w.word));
    $("#dSkip").addEventListener("click", () => { dictState.idx++; dictStep(); });
    input.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
  }

  function dictFinish() {
    const node = $("#dictCard");
    const rate = Math.round(dictState.score / dictState.total * 100);
    node.innerHTML = `
      <div class="quiz-q">听写完成 🎉</div>
      <div class="quiz-sub">正确 ${dictState.score} / ${dictState.total}（${rate}%）</div>
      <button class="btn btn-primary" id="dAgain">再来一组</button>
      <button class="btn" id="dHome">返回首页</button>`;
    $("#dAgain").addEventListener("click", () => renderDictation(dictState.bankId));
    $("#dHome").addEventListener("click", () => switchView("home"));
  }

  // ---------- 统计 ----------
  function renderStats() {
    const all = getAllWords(customWords);
    const node = tpl("tpl-stats");
    view.innerHTML = "";
    view.appendChild(node);

    let mastered = 0, learning = 0, fresh = 0, due = 0;
    all.forEach(w => {
      const r = progress[wordKey(w)];
      if (!r) { fresh++; due++; return; }
      if (r.due <= Date.now()) due++;
      if (r.box >= 4) mastered++;
      else if (r.reps > 0) learning++;
      else fresh++;
    });
    const cards = [
      { num: all.length, label: "总词条" },
      { num: due, label: "今日待复习" },
      { num: mastered, label: "已掌握 (box≥4)" },
      { num: learning, label: "学习中" },
      { num: fresh, label: "未接触" }
    ];
    const cc = $("#statCards");
    cards.forEach(c => {
      const d = document.createElement("div");
      d.className = "stat-card";
      d.innerHTML = `<div class="sc-num">${c.num}</div><div class="sc-label">${c.label}</div>`;
      cc.appendChild(d);
    });

    const bars = $("#statBars");
    bars.innerHTML = `<h3 style="margin-top:0">各分类掌握度</h3>`;
    PHARMA_BANKS.concat(customWords.length ? [{ id: "custom", name: "我的词库" }] : []).forEach(bank => {
      const ws = all.filter(w => w.bankId === bank.id);
      if (!ws.length) return;
      const m = ws.filter(w => { const r = progress[wordKey(w)]; return r && r.box >= 4; }).length;
      const pct = Math.round(m / ws.length * 100);
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <div class="bar-label">${bank.name}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-val">${m}/${ws.length}</div>`;
      bars.appendChild(row);
    });
  }

  // ---------- 我的词库 ----------
  function renderCustom() {
    const node = tpl("tpl-custom");
    view.innerHTML = "";
    view.appendChild(node);
    const form = $("#customForm");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const w = {
        word: $("#cWord").value.trim(),
        pos: $("#cPos").value.trim(),
        cn: $("#cCn").value.trim(),
        en: $("#cEn").value.trim(),
        phonetic: ""
      };
      if (!w.word || !w.cn) return;
      customWords.push(w);
      saveCustom(customWords);
      form.reset();
      renderCustomList(node);
    });
    renderCustomList(node);
  }

  function renderCustomList(node) {
    const list = $("#customList", node);
    if (!list) return;
    list.innerHTML = "";
    if (!customWords.length) {
      list.innerHTML = `<div class="section-empty">还没有自定义词条。在上面添加你的岗位高频词吧。</div>`;
      return;
    }
    customWords.slice().reverse().forEach((w, i) => {
      const realIdx = customWords.length - 1 - i;
      const item = document.createElement("div");
      item.className = "custom-item";
      item.innerHTML = `
        <div>
          <span class="ci-main">${w.word}</span> ${w.pos ? `<span class="muted">${w.pos}</span>` : ""}
          <div class="ci-cn">${w.cn}${w.en ? " · " + w.en : ""}</div>
        </div>
        <button class="btn btn-sm btn-ghost" data-del="${realIdx}">删除</button>`;
      $('[data-del]', item).addEventListener("click", () => {
        customWords.splice(realIdx, 1);
        saveCustom(customWords);
        renderCustomList(node);
      });
      list.appendChild(item);
    });
  }

  // ---------- 启动 ----------
  switchView("home");
  updateDueBadge();
})();
