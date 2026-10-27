"use strict";
  /* ---------------- vocab games (العب واتعلم) ---------------- */
  // Four short games built on a course's vocab list: match pairs, a 60-second
  // true/false sprint, listen & pick (English only, needs speech synthesis), and
  // spelling with letter tiles. Best scores live in state.learn.games keyed
  // "<cid>:<kind>"; misses are fed into نقاط ضعفي like quiz mistakes are.
  var GAMES = [
    { k: "match", ico: "🧩", t: "مطابقة", d: "وصّل كل كلمة بمعناها بأسرع وقت" },
    { k: "sprint", ico: "⚡", t: "سباق 60 ثانية", d: "صح ولا غلط؟ اجمع كومبو ونقاط" },
    { k: "listen", ico: "🎧", t: "اسمع واختار", d: "اسمع الكلمة واختار معناها", en: true },
    { k: "spell", ico: "🔤", t: "تهجئة", d: "رتّب الحروف وكوّن الكلمة", en: true }
  ];
  var gameTimer = null;
  // Each game has 4 levels; 3 stars on a level unlocks the next one. Levels change
  // round size, timer, option count and word length, so a replay is never the same.
  var GAME_LEVELS = {
    match: [{ pairs: 4, rounds: 3 }, { pairs: 5, rounds: 3 }, { pairs: 6, rounds: 3 }, { pairs: 6, rounds: 4 }],
    sprint: [{ secs: 60 }, { secs: 50 }, { secs: 45 }, { secs: 40 }],
    listen: [{ n: 8, opts: 3 }, { n: 10, opts: 4 }, { n: 10, opts: 4 }, { n: 12, opts: 5 }],
    spell: [{ n: 6, min: 2, max: 5 }, { n: 8, min: 3, max: 7 }, { n: 8, min: 5, max: 9 }, { n: 10, min: 6, max: 12 }]
  };
  var LVL_NAMES = ["سهل", "متوسط", "صعب", "خبير"];

  function gamePool(cid) {
    return ((COURSES[cid] && COURSES[cid].vocab) || []).filter(function (v) { return v.en && v.ar; });
  }
  function gameAvailable(g, cid) {
    if (!g.en) return true;
    if (g.k === "listen" && !("speechSynthesis" in window)) return false;
    // English-only games need single-word Latin entries to be fair.
    return gamePool(cid).filter(function (v) { return /^[A-Za-z][A-Za-z' -]*$/.test(v.en); }).length >= 8;
  }
  function gameRec(cid, k) { return ((state.learn.games || {})[cid + ":" + k]) || null; }
  function gameLvl(cid, k) { var r = gameRec(cid, k); return Math.min(3, (r && r.lvl) || 0); }

  function gamesHubHTML(cid) {
    var c = COURSES[cid]; if (!c) return "";
    var list = GAMES.filter(function (g) { return gameAvailable(g, cid); });
    return '<button class="linkbtn" data-act="course-open" data-c="' + cid + '">← ' + esc(c.title) + "</button>" +
      '<div class="sec-h">🎮 العب واتعلم</div><p class="muted" style="font-size:14px;margin-block:-4px 12px">كل لعبة بتديك نقاط، والكلمات اللي بتغلط فيها بتتضاف لنقاط ضعفك عشان تراجعها.</p>' +
      (cid === "en" ? '<button class="card ph-promo" data-act="ph-open"><span style="font-size:30px">💬</span><span class="grow"><b>جمل الحياة اليومية</b><small class="muted">110 جملة هتحتاجها فعلًا، بتتحفظ بالتكرار الذكي</small></span><span class="chip">جديد</span></button>' : "") +
      '<div class="gtiles">' + list.map(function (g) {
        var r = gameRec(cid, g.k);
        return '<button class="gtile" data-act="game-start" data-c="' + cid + '" data-k="' + g.k + '"><span class="gtile-ic">' + g.ico + "</span><b>" + esc(g.t) + "</b><small>" + esc(g.d) + "</small>" +
          '<span class="gtile-lvl">' + [0, 1, 2, 3].map(function (n) { return '<i class="' + (n <= gameLvl(cid, g.k) ? "on" : "") + '"></i>'; }).join("") + " " + LVL_NAMES[gameLvl(cid, g.k)] + "</span>" +
          '<span class="gtile-best">' + (r ? "🏆 أفضل نتيجة <span class=\"num\">" + r.best + "</span>" : "جديدة") + "</span></button>";
      }).join("") + "</div>";
  }

  // Words rotate: each game prefers words this course's games haven't shown
  // recently (state.learn.gameSeen), plus at most two weak words, so replays keep
  // bringing new vocab until the whole list has been seen, then the cycle restarts.
  function pickWords(cid, n, filter) {
    var pool = gamePool(cid).filter(filter || function () { return true; });
    if (!state.learn.gameSeen) state.learn.gameSeen = {};
    var seen = state.learn.gameSeen[cid] || [], seenSet = {};
    seen.forEach(function (id) { seenSet[id] = 1; });
    var fresh = pool.filter(function (v) { return !seenSet[v.id]; });
    if (fresh.length < n) { seen = []; seenSet = {}; fresh = pool.slice(); }
    var weak = shuffle(fresh.filter(function (v) { return state.learn.weak[v.id]; })).slice(0, 2);
    var picked = weak.concat(shuffle(fresh.filter(function (v) { return weak.indexOf(v) < 0; }))).slice(0, n);
    if (picked.length < n) picked = picked.concat(shuffle(pool.filter(function (v) { return picked.indexOf(v) < 0; }))).slice(0, n);
    state.learn.gameSeen[cid] = seen.concat(picked.map(function (v) { return v.id; })).slice(-Math.max(10, pool.length - n));
    return shuffle(picked);
  }
  function distinctAr(cid, correct, n) {
    var seen = {}; seen[correct.ar] = 1;
    // Same-level distractors are harder to rule out than random ones.
    var pool = gamePool(cid), same = pool.filter(function (v) { return v.lvl === correct.lvl; });
    var out = shuffle(same.length >= n * 2 ? same : pool).filter(function (v) { if (seen[v.ar]) return false; seen[v.ar] = 1; return true; }).slice(0, n - 1).map(function (v) { return v.ar; });
    return shuffle(out.concat([correct.ar]));
  }
  var singleWord = function (v) { return /^[A-Za-z][A-Za-z']{1,11}$/.test(v.en); };

  function startGame(cid, k) {
    stopGameTimer();
    var lvl = gameLvl(cid, k), L = GAME_LEVELS[k][lvl];
    var g = { kind: k, cid: cid, lvl: lvl, L: L, score: 0, miss: 0, missed: [], t0: Date.now(), over: false };
    if (k === "match") {
      g.pairs = L.pairs; g.words = pickWords(cid, L.pairs * L.rounds); g.round = 0; g.rounds = Math.max(1, Math.floor(g.words.length / g.pairs)); g.sel = null; g.gone = {}; g.bad = null;
      buildMatchRound(g);
    } else if (k === "sprint") {
      g.left = L.secs; g.combo = 0; g.bestCombo = 0; g.answered = 0; g.queue = pickWords(cid, 30); g.qi = 0; nextSprint(g);
    } else if (k === "listen") {
      g.words = pickWords(cid, L.n, function (v) { return /^[A-Za-z][A-Za-z' -]*$/.test(v.en); }); g.i = 0; g.pick = null; buildListen(g);
    } else if (k === "spell") {
      var lenOk = function (v) { return singleWord(v) && v.en.length >= L.min && v.en.length <= L.max; };
      g.words = pickWords(cid, L.n, gamePool(cid).filter(lenOk).length >= L.n ? lenOk : singleWord); g.i = 0; buildSpell(g);
    }
    state.game = g; state.lv = { mode: "game", c: cid };
    $("#p-learn").scrollTop = 0; render();
    if (k === "sprint") startSprintTimer();
    if (k === "listen") setTimeout(function () { speak(g.cur.en); }, 250);
  }
  function stopGameTimer() { if (gameTimer) { clearInterval(gameTimer); gameTimer = null; } }

  /* match */
  function buildMatchRound(g) {
    var ws = g.words.slice(g.round * g.pairs, g.round * g.pairs + g.pairs);
    g.left5 = shuffle(ws); g.right5 = shuffle(ws); g.gone = {}; g.sel = null; g.bad = null;
  }
  function matchTap(side, id) {
    var g = state.game; if (g.gone[id]) return;
    if (!g.sel || g.sel.side === side) { g.sel = { side: side, id: id }; g.bad = null; render(); return; }
    if (g.sel.id === id) {
      g.gone[id] = true; g.score += 10; g.sel = null; g.bad = null;
      if (navigator.vibrate) navigator.vibrate(10);
      if (Object.keys(g.gone).length === g.left5.length) {
        g.round++;
        if (g.round >= g.rounds) { endGame(); render(); return; }
        buildMatchRound(g);
      }
    } else {
      g.miss++; g.bad = { a: g.sel.id, b: id };
      noteMiss(g, VOCAB_INDEX[g.sel.side === "en" ? g.sel.id : id]);
      g.sel = null;
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
    }
    render();
  }
  function matchHTML(g) {
    function col(side, list) {
      return '<div class="mcol">' + list.map(function (v) {
        var cls = "mbtn" + (g.gone[v.id] ? " gone" : "") + (g.sel && g.sel.side === side && g.sel.id === v.id ? " sel" : "") + (g.bad && (g.bad.a === v.id || g.bad.b === v.id) ? " bad" : "");
        return '<button class="' + cls + '" data-act="match-tap" data-side="' + side + '" data-id="' + v.id + '"' + (g.gone[v.id] ? " disabled" : "") + (side === "en" ? ' dir="ltr" lang="en"' : "") + ">" + esc(side === "en" ? v.en : v.ar) + "</button>";
      }).join("") + "</div>";
    }
    return gameTopHTML(g, "الجولة " + (g.round + 1) + "/" + g.rounds) +
      '<p class="muted" style="text-align:center;margin-block:0 10px">اضغط كلمة وبعدين معناها</p>' +
      '<div class="mgrid">' + col("ar", g.right5) + col("en", g.left5) + "</div>";
  }

  /* sprint */
  function nextSprint(g) {
    var w = g.queue[g.qi++ % g.queue.length], ok = Math.random() < 0.5;
    var shown = ok ? w.ar : (distinctAr(g.cid, w, 2).filter(function (a) { return a !== w.ar; })[0] || w.ar);
    g.cur = w; g.shown = shown; g.truth = shown === w.ar; g.flash = null;
  }
  function startSprintTimer() {
    gameTimer = setInterval(function () {
      var g = state.game;
      if (!g || g.kind !== "sprint" || g.over || state.lv.mode !== "game") { stopGameTimer(); return; }
      g.left--;
      var el = document.getElementById("gLeft"); if (el) el.textContent = g.left;
      if (g.left <= 0) { stopGameTimer(); endGame(); render(); }
    }, 1000);
  }
  function sprintAnswer(yes) {
    var g = state.game; if (g.over) return;
    g.answered++;
    if (yes === g.truth) {
      g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
      g.score += 10 * (1 + Math.floor(g.combo / 5)); g.flash = "ok";
    } else {
      g.combo = 0; g.miss++; g.flash = "bad"; noteMiss(g, g.cur);
      if (navigator.vibrate) navigator.vibrate(40);
    }
    var flash = g.flash; nextSprint(g); g.flash = flash; render();
  }
  function sprintHTML(g) {
    var mult = 1 + Math.floor(g.combo / 5);
    return gameTopHTML(g, '⏱ <span class="num" id="gLeft">' + g.left + "</span> ث") +
      '<div class="sprint ' + (g.flash || "") + '"><div class="sprint-en" dir="ltr" lang="en">' + esc(g.cur.en) + '</div><div class="sprint-eq">=</div><div class="sprint-ar">' + esc(g.shown) + "</div></div>" +
      '<p class="muted" style="text-align:center">كومبو <span class="num">' + g.combo + "</span>" + (mult > 1 ? ' · <b style="color:var(--amber-deep)">×' + mult + "</b>" : "") + "</p>" +
      '<div class="row" style="gap:12px"><button class="btn gbig no" data-act="sprint-ans" data-v="0">✗ غلط</button><button class="btn gbig" data-act="sprint-ans" data-v="1">✓ صح</button></div>';
  }

  /* listen */
  function buildListen(g) { g.cur = g.words[g.i]; g.opts = distinctAr(g.cid, g.cur, g.L.opts); g.pick = null; g.peek = false; }
  function listenPick(val) {
    var g = state.game; if (g.pick != null) return;
    g.pick = val;
    if (val === g.cur.ar) { g.score += g.peek ? 5 : 10; } else { g.miss++; noteMiss(g, g.cur); }
    render();
  }
  function listenNext() {
    var g = state.game; g.i++;
    if (g.i >= g.words.length) { endGame(); render(); return; }
    buildListen(g); render(); setTimeout(function () { speak(g.cur.en); }, 150);
  }
  function listenHTML(g) {
    var answered = g.pick != null;
    return gameTopHTML(g, '<span class="num">' + (g.i + 1) + "/" + g.words.length + "</span>") +
      '<div style="text-align:center;margin-block:8px 16px"><button class="lbig" data-act="speak" data-txt="' + esc(g.cur.en) + '" aria-label="اسمع تاني">' + ico("vol") + "</button>" +
      '<div class="row" style="gap:8px;justify-content:center;margin-block:10px 4px"><button class="btn sm alt" data-act="listen-slow">🐢 أبطأ</button>' +
      (answered || g.peek ? "" : '<button class="btn sm alt" data-act="listen-peek">👁 وريني الكلمة</button>') + "</div>" +
      (answered || g.peek ? '<p dir="ltr" lang="en" style="font-size:22px;font-weight:700;margin:6px 0">' + esc(g.cur.en) + "</p>" : "") + "</div>" +
      '<div class="gopts">' + g.opts.map(function (o) {
        var cls = "gopt" + (answered && o === g.cur.ar ? " ok" : "") + (answered && o === g.pick && o !== g.cur.ar ? " bad" : "");
        return '<button class="' + cls + '" data-act="listen-pick" data-v="' + esc(o) + '"' + (answered ? " disabled" : "") + ">" + esc(o) + "</button>";
      }).join("") + "</div>" +
      (answered ? '<button class="btn" style="width:100%;margin-block-start:12px" data-act="listen-next">' + (g.i + 1 >= g.words.length ? "النتيجة" : "التالي ←") + "</button>" : "");
  }

  /* spell */
  function buildSpell(g) {
    g.cur = g.words[g.i];
    var letters = g.cur.en.toLowerCase().split("");
    g.tiles = shuffle(letters.map(function (ch, i) { return { ch: ch, i: i }; }));
    if (letters.length > 1 && g.tiles.map(function (t) { return t.ch; }).join("") === letters.join("")) g.tiles.reverse();
    g.typed = []; g.state = null; g.hint = false;
  }
  function spellTap(idx) {
    var g = state.game; if (g.state) return;
    if (g.typed.indexOf(idx) >= 0) return;
    g.typed.push(idx);
    if (g.typed.length === g.tiles.length) {
      var word = g.typed.map(function (i) { return g.tiles[i].ch; }).join("");
      if (word === g.cur.en.toLowerCase()) { g.state = "ok"; g.score += g.hint ? 5 : 10; speak(g.cur.en); }
      else { g.state = "bad"; g.miss++; noteMiss(g, g.cur); }
    }
    render();
  }
  function spellUndo() { var g = state.game; if (!g.state && g.typed.length) { g.typed.pop(); render(); } }
  function spellHint() {
    var g = state.game; if (g.state) return;
    g.hint = true;
    // Rebuild the typed prefix to the correct first letters, plus one more.
    var target = g.cur.en.toLowerCase(), used = {}, out = [];
    var n = Math.min(target.length, (function () {
      var k = 0; while (k < g.typed.length && g.tiles[g.typed[k]].ch === target[k]) k++; return k + 1;
    })());
    for (var p = 0; p < n; p++) {
      for (var j = 0; j < g.tiles.length; j++) if (!used[j] && g.tiles[j].ch === target[p]) { used[j] = 1; out.push(j); break; }
    }
    g.typed = out;
    if (g.typed.length === g.tiles.length) { g.state = "ok"; g.score += 5; speak(g.cur.en); }
    render();
  }
  function spellNext() {
    var g = state.game; g.i++;
    if (g.i >= g.words.length) { endGame(); render(); return; }
    buildSpell(g); render();
  }
  function spellHTML(g) {
    var slots = g.tiles.map(function (_, i) {
      var t = g.typed[i];
      return '<span class="sslot' + (t != null ? " on" : "") + '">' + (t != null ? esc(g.tiles[t].ch) : "") + "</span>";
    }).join("");
    return gameTopHTML(g, '<span class="num">' + (g.i + 1) + "/" + g.words.length + "</span>") +
      '<div style="text-align:center;margin-block:6px 14px">' + (g.cur.emoji ? '<div style="font-size:44px">' + esc(g.cur.emoji) + "</div>" : "") +
      '<p style="font-size:22px;font-weight:700;margin:4px 0">' + esc(g.cur.ar) + "</p></div>" +
      '<div class="sslots ' + (g.state || "") + '" dir="ltr">' + slots + "</div>" +
      (g.state === "bad" ? '<p style="text-align:center;margin-block:8px 0">الصح: <b dir="ltr" lang="en">' + esc(g.cur.en) + "</b></p>" : "") +
      (g.state ? '<button class="btn" style="width:100%;margin-block-start:14px" data-act="spell-next">' + (g.i + 1 >= g.words.length ? "النتيجة" : "التالي ←") + "</button>"
        : '<div class="stiles" dir="ltr">' + g.tiles.map(function (t, i) {
          return '<button class="stile" data-act="spell-tap" data-i="' + i + '"' + (g.typed.indexOf(i) >= 0 ? " disabled" : "") + ">" + esc(t.ch) + "</button>";
        }).join("") + "</div>" +
        '<div class="row" style="gap:10px;justify-content:center;margin-block-start:12px"><button class="btn sm alt" data-act="spell-undo">⌫ مسح</button><button class="btn sm alt" data-act="spell-hint">💡 مساعدة</button></div>');
  }

  /* shared */
  function noteMiss(g, v) {
    if (!v) return;
    if (g.missed.indexOf(v.id) < 0) g.missed.push(v.id);
    addWeak(v.id, "word", "exam", g.cid);
  }
  function gameTopHTML(g, mid) {
    var meta = GAMES.filter(function (x) { return x.k === g.kind; })[0];
    return '<div class="gtop"><button class="linkbtn" data-act="game-quit">✕</button><b>' + meta.ico + " " + esc(meta.t) + ' <span class="glvl">' + LVL_NAMES[g.lvl] + "</span></b><span>" + mid + "</span></div>" +
      '<div class="gscore"><span>⭐ <span class="num">' + g.score + '</span></span><span style="color:var(--miss)">✗ <span class="num">' + g.miss + "</span></span></div>";
  }
  function endGame() {
    var g = state.game; if (!g || g.over) return;
    stopGameTimer();
    g.over = true; g.secs = Math.round((Date.now() - g.t0) / 1000);
    if (g.kind === "match") g.score = Math.max(0, g.score + Math.max(0, g.rounds * g.pairs * 6 - g.secs) - g.miss * 5);
    g.score = Math.round(g.score * (1 + g.lvl * 0.25));
    var key = g.cid + ":" + g.kind;
    if (!state.learn.games) state.learn.games = {};
    var rec = state.learn.games[key] || { best: 0, plays: 0 };
    g.newBest = g.score > rec.best;
    rec.best = Math.max(rec.best, g.score); rec.plays++; state.learn.games[key] = rec;
    g.xp = Math.max(3, Math.min(25, Math.round(g.score / 10)));
    addXp(g.xp); checkAchievements(nowR()); saveMeta("learn", 0);
    var total = g.kind === "match" ? g.rounds * g.pairs : g.kind === "sprint" ? g.answered : g.words.length;
    var acc = total ? (total - Math.min(total, g.missed.length)) / total : 0;
    g.stars = acc >= 0.95 ? 3 : acc >= 0.75 ? 2 : acc > 0 ? 1 : 0;
    // A sprint with only a handful of answers shouldn't count as mastery.
    if (g.kind === "sprint" && g.answered < 15) g.stars = Math.min(g.stars, 2);
    g.levelUp = g.stars === 3 && g.lvl < 3;
    if (g.levelUp) rec.lvl = g.lvl + 1;
  }
  function gameEndHTML(g) {
    var meta = GAMES.filter(function (x) { return x.k === g.kind; })[0];
    var missedWords = g.missed.map(function (id) { return VOCAB_INDEX[id]; }).filter(Boolean);
    return '<div class="card gend"><div class="gend-stars">' + [1, 2, 3].map(function (n) { return '<span class="' + (n <= g.stars ? "on" : "") + '">★</span>'; }).join("") + "</div>" +
      "<h2>" + (g.newBest ? "🏆 رقم قياسي جديد!" : g.stars === 3 ? "ممتاز! 👏" : g.stars === 2 ? "شغل حلو 👍" : "كمّل وهتتحسن 💪") + "</h2>" +
      (g.levelUp ? '<p class="glvlup">⬆️ فتحت مستوى «' + LVL_NAMES[g.lvl + 1] + "» — اللعبة الجاية أصعب وفيها كلمات جديدة</p>"
        : g.lvl < 3 ? '<p class="muted" style="font-size:13px">جيب 3 نجوم عشان تفتح مستوى «' + LVL_NAMES[g.lvl + 1] + "»</p>" : '<p class="muted" style="font-size:13px">أنت في أعلى مستوى 🔥</p>') +
      '<p class="muted">' + esc(meta.t) + "</p>" +
      '<div class="chero-stats" style="color:inherit"><div><b class="num">' + g.score + '</b><small>النقاط</small></div><div><b class="num">+' + g.xp + '</b><small>XP</small></div><div><b class="num">' + g.secs + '</b><small>ثانية</small></div></div>' +
      (missedWords.length ? '<div class="gmissed"><b>كلمات تراجعها (اتضافت لنقاط ضعفي):</b>' + missedWords.map(function (v) {
        return '<div class="row between"><span dir="ltr" lang="en">' + esc(v.en) + '</span><span class="muted">' + esc(v.ar) + "</span></div>";
      }).join("") + "</div>" : "") +
      '<div class="row wrapr" style="justify-content:center;margin-block-start:14px"><button class="btn" data-act="game-start" data-c="' + g.cid + '" data-k="' + g.kind + '">' + (g.levelUp ? "العب المستوى الجاي" : "العب تاني بكلمات جديدة") + '</button>' +
      '<button class="btn alt" data-act="games-open" data-c="' + g.cid + '">ألعاب تانية</button></div></div>';
  }
  function gameHTML() {
    var g = state.game; if (!g) return gamesHubHTML(state.lv.c);
    if (g.over) return gameEndHTML(g);
    if (g.kind === "match") return matchHTML(g);
    if (g.kind === "sprint") return sprintHTML(g);
    if (g.kind === "listen") return listenHTML(g);
    return spellHTML(g);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    switch (el.getAttribute("data-act")) {
      case "games-open": stopGameTimer(); state.game = null; state.lv = { mode: "games", c: el.getAttribute("data-c") }; goTab("learn"); $("#p-learn").scrollTop = 0; render(); break;
      case "game-start": startGame(el.getAttribute("data-c"), el.getAttribute("data-k")); break;
      case "game-quit": var gq = state.game; stopGameTimer(); state.game = null; state.lv = { mode: "games", c: gq ? gq.cid : state.lv.c }; render(); break;
      case "match-tap": matchTap(el.getAttribute("data-side"), el.getAttribute("data-id")); break;
      case "sprint-ans": sprintAnswer(el.getAttribute("data-v") === "1"); break;
      case "listen-pick": listenPick(el.getAttribute("data-v")); break;
      case "listen-next": listenNext(); break;
      case "listen-slow": speak(state.game.cur.en, true); break;
      case "listen-peek": state.game.peek = true; render(); break;
      case "spell-tap": spellTap(Number(el.getAttribute("data-i"))); break;
      case "spell-undo": spellUndo(); break;
      case "spell-hint": spellHint(); break;
      case "spell-next": spellNext(); break;
    }
  });
