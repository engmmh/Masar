"use strict";
  /* ---------------- مساري في الإنجليزي — placement, daily dose, listening, work English,
     weekly voice check, can-do ladder (engine + views; content in coach-data.js) ---------------- */
  var LV_ORDER = ["A1", "A2", "B1", "B2"];
  var CK_DAYS = [1, 2, 4, 7, 15, 30, 60];
  var DOSE_STEPS = [["ck", "٥ عبارات جديدة", "plus"], ["rv", "مراجعة العبارات", "refresh"], ["dl", "حوار استماع", "headphones"], ["tk", "موقف «اتكلم»", "mic"]];

  function coD() {
    if (!state.learn.coach) state.learn.coach = { pl: null, ck: {}, days: {}, dl: {}, tp: {}, tpv: {}, wk: [], goal: 5 };
    var C = state.learn.coach;
    ["ck", "days", "dl", "tp", "tpv"].forEach(function (k) { if (!C[k]) C[k] = {}; });
    if (!C.wk) C.wk = [];
    return C;
  }
  function coUi() { if (!state.co) state.co = { view: "hub" }; return state.co; }
  function coGo(view, extra) { var u = coUi(); u.view = view; if (extra) Object.keys(extra).forEach(function (k) { u[k] = extra[k]; }); state.lv = { mode: "coach", c: "en" }; goTab("learn"); $("#p-learn").scrollTop = 0; render(); }
  function coDay(key) { var C = coD(); return C.days[key] || (C.days[key] = {}); }
  function coMark(step) { var d = coDay(nowR().key); if (!d[step]) { d[step] = 1; addXp(5, nowR()); } saveMeta("learn", 300); }
  function doseDone(key) { var d = coD().days[key]; return !!(d && DOSE_STEPS.every(function (s) { return d[s[0]]; })); }
  function doseStreak(now) {
    var k = now.key, n = 0;
    if (!doseDone(k)) k = addDays(k, -1);
    while (doseDone(k) && n < 3000) { n++; k = addDays(k, -1); }
    return n;
  }
  function weekDone(now) { var n = 0; for (var i = 0; i < 7; i++) if (doseDone(addDays(now.key, -i))) n++; return n; }

  /* -------- phrase bank -------- */
  var CK_INDEX = null;
  function ckAll() {
    if (CK_INDEX) return CK_INDEX;
    CK_INDEX = [];
    CHUNK_CATS.forEach(function (c) { c.l.forEach(function (x, i) { CK_INDEX.push({ id: c.k + "-" + i, cat: c.k, en: x[0], ar: x[1] }); }); });
    return CK_INDEX;
  }
  function ckById(id) { return ckAll().filter(function (x) { return x.id === id; })[0] || null; }
  // New phrases rotate across categories (one from each in turn) so a day mixes topics.
  function ckNew(n) {
    var C = coD(), out = [], maxLen = 20;
    for (var i = 0; i < maxLen && out.length < n; i++) {
      for (var c = 0; c < CHUNK_CATS.length && out.length < n; c++) {
        var cat = CHUNK_CATS[c]; if (i >= cat.l.length) continue;
        var id = cat.k + "-" + i; if (!C.ck[id]) out.push(id);
      }
    }
    return out;
  }
  function ckDue(now) {
    var C = coD();
    return Object.keys(C.ck).filter(function (id) { var r = C.ck[id]; return r.due && r.due <= now.key && r.added !== now.key; })
      .sort(function (a, b) { return C.ck[a].due < C.ck[b].due ? -1 : 1; });
  }
  function ckGrade(id, ok) {
    var C = coD(), r = C.ck[id] || (C.ck[id] = { st: 0 }), key = nowR().key;
    r.st = ok ? Math.min(CK_DAYS.length, (r.st || 0) + 1) : 0;
    r.due = addDays(key, ok ? CK_DAYS[Math.max(0, r.st - 1)] : 1);
  }
  function ckLearnedCount() { var C = coD(); return Object.keys(C.ck).filter(function (id) { return (C.ck[id].st || 0) >= 3; }).length; }
  function ckOpts(right, field) {
    var pool = shuffle(ckAll().filter(function (x) { return x[field] !== right[field]; })).slice(0, 3).map(function (x) { return x[field]; });
    return shuffle(pool.concat([right[field]]));
  }

  /* -------- level -------- */
  function plLevel() { var p = coD().pl; return p ? p.lv : null; }
  function candoChecks(item) {
    var C = coD(), D = (state.learn.talk || { sc: {} });
    return item.c.map(function (c) {
      var t = c[0];
      if (t === "talk") return ((D.sc || {})[c[1]] || {}).best >= c[2];
      if (t === "tp") return !!C.tp[c[1]];
      if (t === "dl") return Object.keys(C.dl).filter(function (k) { return (C.dl[k].best || 0) >= 2; }).length >= c[2];
      if (t === "wk") return C.wk.some(function (w) { return w.words >= c[2]; });
      if (t === "wkl") return C.wk.some(function (w) { return w.link >= c[2]; });
      if (t === "ck") return ckLearnedCount() >= c[2];
      return false;
    });
  }
  function candoDone(item) { return candoChecks(item).every(Boolean); }
  function provenTxt() { return CANDO.some(candoDone) ? provenLevel() : "لسه بتبدأ"; }
  // Level proven by doing: the highest band whose can-dos (and all bands below) are ≥ 80% met.
  function provenLevel() {
    var lv = "A1";
    for (var i = 1; i < LV_ORDER.length; i++) {
      var items = CANDO.filter(function (x) { return x.lv === LV_ORDER[i]; });
      var done = items.filter(candoDone).length;
      if (items.length && done / items.length >= 0.8) lv = LV_ORDER[i]; else break;
    }
    return lv;
  }

  /* -------- voice helpers -------- */
  // Two different English voices when the device has them, so dialogues sound like two people.
  function coVoices() {
    try { return window.speechSynthesis.getVoices().filter(function (v) { return /^en[-_]/i.test(v.lang); }); } catch (e) { return []; }
  }
  function coSay(text, who, onend) {
    try {
      if (!("speechSynthesis" in window)) { if (onend) onend(); return; }
      var u = new SpeechSynthesisUtterance(text), vs = coVoices();
      u.lang = "en-US"; u.rate = (state.settings && state.settings.speechRate) || 0.92;
      if (vs.length > 1) u.voice = vs[who === "B" ? 1 : 0]; else u.pitch = who === "B" ? 0.8 : 1.1;
      if (onend) u.onend = onend;
      window.speechSynthesis.speak(u);
    } catch (e) { if (onend) onend(); }
  }
  function coStopSay() { try { window.speechSynthesis.cancel(); } catch (e) { } }
  function coWords(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean); }

  /* =================== views =================== */
  function coachHTML(now) {
    var u = coUi();
    if (u.view === "place") return plHTML();
    if (u.view === "dose-ck") return ckLearnHTML();
    if (u.view === "dose-rv") return ckQuizHTML();
    if (u.view === "dls") return dlListHTML();
    if (u.view === "dl") return dlHTML();
    if (u.view === "work") return workHTML();
    if (u.view === "tp") return tpHTML();
    if (u.view === "bank") return bankCkHTML();
    if (u.view === "wk") return wkHTML(now);
    if (u.view === "cando") return candoHTML();
    return coHubHTML(now);
  }
  function coBack(label) { return '<button class="linkbtn" data-act="co-hub">← ' + (label || "مساري") + "</button>"; }

  function coHubHTML(now) {
    var C = coD(), d = C.days[now.key] || {}, done = DOSE_STEPS.filter(function (s) { return d[s[0]]; }).length;
    var lv = plLevel(), pv = provenLevel(), streak = doseStreak(now), wk = weekDone(now);
    var dots = ""; for (var i = 6; i >= 0; i--) { var k = addDays(now.key, -i); dots += '<i class="' + (doseDone(k) ? "on" : "") + (k === now.key ? " today" : "") + '"></i>'; }
    var lastWk = C.wk.length ? C.wk[C.wk.length - 1] : null, wkAgo = lastWk ? daysBetweenKeys(lastWk.key, now.key) : null;
    var head = '<div class="co-hero"><div class="row between" style="align-items:flex-start"><div><h2>مساري في الإنجليزي</h2><p>' + (lv ? "مستواك في الاختبار: <b>" + lv + "</b> · اللي أثبته بالفعل: <b>" + provenTxt() + "</b>" : "ابدأ باختبار تحديد المستوى عشان المسار يتظبط عليك") + "</p></div>" +
      '<span class="co-streak">' + ic("flame") + " " + streak + "</span></div>" +
      '<div class="co-week"><span>الأسبوع ده: <b>' + wk + "/" + C.goal + '</b> أيام</span><span class="co-dots">' + dots + "</span></div></div>";
    var place = lv ? "" : '<button class="card co-cta-place" data-act="co-place"><span class="co-ic">' + ic("target") + '</span><span class="grow"><b>اختبار تحديد المستوى (١٠ دقايق)</b><small class="muted">قواعد، مفردات، قراءة، استماع، وكلام. هيقولك مستواك ونقط ضعفك بالظبط.</small></span><span>←</span></button>';
    var steps = DOSE_STEPS.map(function (s) {
      return '<button class="co-step' + (d[s[0]] ? " done" : "") + '" data-act="co-step" data-s="' + s[0] + '"><span class="co-step-ic">' + (d[s[0]] ? ic("check") : ic(s[2])) + "</span><span class=\"grow\">" + s[1] + "</span><span>" + (d[s[0]] ? "✓" : "←") + "</span></button>";
    }).join("");
    var next = DOSE_STEPS.filter(function (s) { return !d[s[0]]; })[0];
    var dose = '<div class="card co-dose"><div class="row between"><h3 style="margin:0">' + ic("zap") + ' جرعة اليوم <small class="muted">~١٠ دقايق</small></h3><span class="chip' + (done === 4 ? " on" : "") + '">' + done + "/4</span></div>" +
      '<div class="bar" style="margin-block:10px"><i style="width:' + done * 25 + '%"></i></div>' + steps +
      (next ? '<button class="btn" style="width:100%;margin-block-start:10px" data-act="co-step" data-s="' + next[0] + '">' + ic("play") + " " + (done ? "كمّل: " : "ابدأ: ") + next[1] + "</button>" : '<p class="co-done">🎉 خلصت جرعة النهارده! نفس المعاد بكرة.</p>') + "</div>";
    var wkNudge = (wkAgo === null || wkAgo >= 7) ? '<button class="card co-nudge" data-act="co-go" data-v="wk"><span class="co-ic">' + ic("mic") + '</span><span class="grow"><b>' + (wkAgo === null ? "سجّل أول دقيقة ليك" : "وقت تسجيل الأسبوع") + '</b><small class="muted">دقيقة بتتكلم فيها عن شغلك، وكل أسبوع تشوف اتحسنت قد إيه.</small></span><span>←</span></button>' : "";
    function tile(act, v, icon, label, sub) { return '<button class="tile" data-act="' + act + '"' + (v ? ' data-v="' + v + '"' : "") + '><span class="tile-ic">' + ic(icon) + "</span><b>" + label + "</b>" + (sub != null ? '<small class="num">' + sub + "</small>" : "") + "</button>"; }
    var dlDone = Object.keys(C.dl).filter(function (k) { return (C.dl[k].best || 0) >= 2; }).length;
    var cdDone = CANDO.filter(candoDone).length;
    return '<button class="linkbtn" data-act="lcourses">← الكورسات</button>' + head + place + dose + wkNudge +
      '<div class="sec-h">كل الأدوات</div><div class="tiles">' +
      tile("tk-open", "", "mic", "اتكلم", null) +
      tile("co-go", "dls", "headphones", "استماع", dlDone + "/" + DIALOGS.length) +
      tile("co-go", "work", "briefcase", "إنجليزي الشغل", null) +
      tile("co-go", "bank", "chat", "بنك العبارات", ckLearnedCount() + "/" + ckAll().length) +
      tile("co-go", "wk", "chart", "صوتي كل أسبوع", C.wk.length || null) +
      tile("co-go", "cando", "trophy", "أقدر أعمل إيه", cdDone + "/" + CANDO.length) +
      tile("co-place", "", "target", lv ? "أعد اختبار المستوى" : "اختبار المستوى", lv) +
      tile("course-open", "", "book", "القواعد (الكورس)", null).replace('data-act="course-open"', 'data-act="course-open" data-c="en"') +
      "</div>";
  }

  /* -------- placement -------- */
  function plStart() { coUi().pl = { i: 0, ans: [], heard: "", listening: false, played: 0 }; coGo("place"); }
  function plHTML() {
    var P = coUi().pl || (coUi().pl = { i: 0, ans: [], heard: "", listening: false, played: 0 });
    if (P.res) return plResultHTML(P.res);
    var it = PLACEMENT[P.i], n = PLACEMENT.length;
    var top = '<div class="gtop"><button class="linkbtn" data-act="co-hub">✕</button><b>اختبار تحديد المستوى</b><span class="num">' + (P.i + 1) + "/" + n + '</span></div><div class="bar" style="margin-block-end:12px"><i style="width:' + Math.round(P.i / n * 100) + '%"></i></div>';
    var skill = '<span class="chip">' + SKILL_AR[it.s] + "</span>";
    if (it.s === "speak") {
      return top + '<div class="card">' + skill + '<h3 dir="ltr" lang="en" style="margin-block:10px 4px">' + esc(it.q) + '</h3><p class="muted">' + esc(it.ar) + "</p>" +
        '<p class="muted" style="font-size:13px">اتكلم ٣٠-٦٠ ثانية. مش مهم الأخطاء، المهم توصّل الفكرة.</p>' +
        (speechOK() ? '<button class="btn gbig tk-mic' + (P.listening ? " on" : "") + '" data-act="co-pl-mic"' + (P.listening ? " disabled" : "") + ">" + ic("mic") + (P.listening ? " بسمعك…" : " اضغط واتكلم") + "</button>" : "") +
        '<textarea class="inp" id="coPlTxt" dir="ltr" lang="en" rows="4" placeholder="' + (speechOK() ? "أو اكتب إجابتك…" : "اكتب إجابتك بالإنجليزي…") + '">' + esc(P.heard || "") + "</textarea>" +
        '<div class="row wrapr" style="margin-block-start:10px"><button class="btn" data-act="co-pl-speak-ok">التالي</button><button class="linkbtn" data-act="co-pl-skip">تخطي</button></div></div>';
    }
    var body = "";
    if (it.s === "reading") body = '<pre class="co-read" dir="ltr" lang="en">' + esc(it.text) + "</pre>";
    if (it.s === "listen") body = '<div class="co-listen"><button class="btn gbig" data-act="co-pl-play">' + ic("vol") + (P.played ? " اسمع تاني" : " اسمع") + '</button><p class="muted" style="font-size:12px">النص مش هيظهر، ركّز بودنك.</p></div>';
    return top + '<div class="card">' + skill + body + '<h3 dir="ltr" lang="en" style="margin-block:10px">' + esc(it.q) + "</h3>" +
      '<div class="opts">' + shuffleStable(it.o, P.i).map(function (o) { return '<button class="opt" dir="ltr" lang="en" data-act="co-pl-pick" data-v="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") + "</div>" +
      '<button class="linkbtn" data-act="co-pl-skip" style="margin-block-start:8px">مش عارف</button></div>';
  }
  function shuffleStable(arr, seed) { var a = arr.slice(), s = seed * 7 + 3; for (var i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = s % (i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function plAnswer(v) {
    var P = coUi().pl, it = PLACEMENT[P.i];
    if (it.s === "speak") {
      var w = coWords(v), need = it.need.split(";"), hit = 0, t = " " + w.join(" ") + " ";
      need.forEach(function (g) { if (g.split("|").some(function (x) { return t.indexOf(" " + x) >= 0; })) hit++; });
      P.ans.push({ s: "speak", score: v ? 0.5 * Math.min(1, w.length / 35) + 0.5 * hit / need.length : 0, words: w.length });
    } else P.ans.push({ s: it.s, lv: it.lv, ok: v === it.a });
    P.i++; P.heard = ""; P.played = 0;
    if (P.i >= PLACEMENT.length) plFinish();
    coStopSay(); $("#p-learn").scrollTop = 0; render();
  }
  function plFinish() {
    var P = coUi().pl, band = {}, sk = {};
    P.ans.forEach(function (a) {
      if (a.s === "speak") { (sk.speak = sk.speak || []).push(a.score); return; }
      (band[a.lv] = band[a.lv] || []).push(a.ok ? 1 : 0);
      (sk[a.s] = sk[a.s] || []).push(a.ok ? 1 : 0);
    });
    function avg(x) { return x && x.length ? x.reduce(function (p, c) { return p + c; }, 0) / x.length : 0; }
    var a2 = avg(band.A2), b1 = avg(band.B1), b2 = avg(band.B2);
    var lv = a2 < 0.6 ? "A1" : b1 < 0.6 ? "A2" : b2 < 0.5 ? "B1" : "B2";
    var skills = {}; Object.keys(sk).forEach(function (k) { skills[k] = Math.round(avg(sk[k]) * 100); });
    var C = coD(); C.pl = { lv: lv, sk: skills, at: nowR().key, hist: (C.pl && C.pl.hist || []).concat([{ at: nowR().key, lv: lv }]).slice(-10) };
    addXp(20, nowR()); saveMeta("learn", 0);
    P.res = C.pl;
  }
  var REC = {
    listen: ["الاستماع", "حوار استماع كل يوم في الجرعة. اسمعه الأول من غير ما تقرا، وبعدين اقرا وكرّر.", "co-go", "dls"],
    speak: ["الكلام", "موقف «اتكلم» كل يوم، وتسجيل دقيقة كل أسبوع.", "tk-open", ""],
    grammar: ["القواعد", "راجع وحدات القواعد في الكورس (المضارع التام، الشرطية، المبني للمجهول).", "course-open", "en"],
    vocab: ["المفردات", "بنك العبارات: ٥ عبارات جديدة كل يوم ومراجعة على فترات.", "co-go", "bank"],
    reading: ["القراءة والكتابة", "قوالب الشغل: اقرا الإيميلات والتقارير واكتب بيها.", "co-go", "work"]
  };
  function plResultHTML(r) {
    var desc = { A1: "مبتدئ: محتاج تبني الأساس. ابدأ بالكورس وبالجرعة اليومية.", A2: "أساسي: بتفهم وتقول جمل بسيطة. محتاج تكتر كلام واستماع.", B1: "متوسط: تقدر تتعامل في الشغل. هدفك دلوقتي الطلاقة والدقة.", B2: "فوق المتوسط: بتتكلم بثقة. ركّز على الأسلوب الطبيعي والمواقف الصعبة." };
    var ks = Object.keys(r.sk).sort(function (a, b) { return r.sk[a] - r.sk[b]; });
    var bars = ks.map(function (k) { return '<div class="co-skill"><span>' + SKILL_AR[k] + '</span><span class="bar"><i style="width:' + r.sk[k] + '%"></i></span><b class="num">' + r.sk[k] + "%</b></div>"; }).join("");
    var recs = ks.slice(0, 3).map(function (k, i) {
      var x = REC[k]; return '<button class="co-rec" data-act="' + x[2] + '"' + (x[3] ? (x[2] === "course-open" ? ' data-c="' + x[3] + '"' : ' data-v="' + x[3] + '"') : "") + '><b class="num">' + (i + 1) + "</b><span class=\"grow\"><b>" + x[0] + "</b><small>" + x[1] + "</small></span><span>←</span></button>";
    }).join("");
    return coBack() + '<div class="card co-result"><small class="muted">مستواك</small><div class="co-lv">' + r.lv + "</div><p>" + desc[r.lv] + "</p></div>" +
      '<div class="card"><h3 style="margin:0 0 10px">مهاراتك</h3>' + bars + "</div>" +
      '<div class="card"><h3 style="margin:0 0 8px">مسارك: ابدأ بأضعف ٣</h3>' + recs + "</div>" +
      '<button class="btn" style="width:100%" data-act="co-hub">' + ic("zap") + " ابدأ جرعة اليوم</button>";
  }

  /* -------- daily dose: new phrases (learn → quick check) -------- */
  function doseCkStart() {
    var ids = ckNew(5);
    if (!ids.length) { coMark("ck"); toast("خلصت كل العبارات! كمّل مراجعة."); render(); return; }
    coUi().ck = { ids: ids, i: 0, phase: "learn", said: {} };
    coGo("dose-ck");
  }
  function ckLearnHTML() {
    var S = coUi().ck; if (!S) return coHubHTML(nowR());
    if (S.phase === "quiz") return ckQuizHTML();
    var x = ckById(S.ids[S.i]), cat = CHUNK_CATS.filter(function (c) { return c.k === x.cat; })[0];
    var said = S.said[x.id];
    return '<div class="gtop"><button class="linkbtn" data-act="co-hub">✕</button><b>عبارات جديدة</b><span class="num">' + (S.i + 1) + "/" + S.ids.length + "</span></div>" +
      '<div class="card co-ck"><span class="chip">' + esc(cat.t) + '</span><p class="co-ck-en" dir="ltr" lang="en">' + esc(x.en) + '</p><p class="co-ck-ar">' + esc(x.ar) + "</p>" +
      '<div class="row" style="gap:10px;justify-content:center">' + spkBtn(x.en) + (speechOK() ? '<button class="btn sm' + (said === true ? "" : " alt") + '" data-act="co-ck-mic"' + (S.listening ? " disabled" : "") + ">" + ic("mic") + (S.listening ? " بسمعك…" : said === true ? " ✓ ممتاز" : " قولها") + "</button>" : "") + "</div>" +
      (said === false ? '<p class="muted" style="font-size:12px;text-align:center">قرّبت. اسمعها بالبطيء (اضغط ضغطة طويلة على السماعة) وجرب تاني.</p>' : "") +
      '<p class="muted co-ck-tip">' + ic("bulb") + " قولها بصوت عالي ٣ مرات، وتخيّل نفسك بتقولها في الشغل.</p></div>" +
      '<button class="btn" style="width:100%" data-act="co-ck-next">' + (S.i + 1 >= S.ids.length ? "اختبر نفسك ←" : "التالية ←") + "</button>";
  }
  // Shared quick-check screen: after learning (phase quiz) and for the review step.
  function ckQuizHTML() {
    var u = coUi(), S = u.view === "dose-rv" ? u.rv : u.ck;
    if (!S) return coHubHTML(nowR());
    if (S.end) {
      return '<div class="card gend"><h2>' + (S.ok === S.q.length ? "ممتاز! 🎉" : "كويس 👍") + '</h2><p class="muted">' + S.ok + " من " + S.q.length + " صح</p>" +
        '<button class="btn" data-act="co-hub">رجوع للجرعة</button></div>';
    }
    var q = S.q[S.qi], x = ckById(q.id), ans = S.ans;
    var prompt = q.t === "ar"
      ? '<p class="muted" style="font-size:13px">اختار الجملة الإنجليزي اللي معناها:</p><h3 style="margin-block:6px 12px">' + esc(x.ar) + "</h3>"
      : '<p class="muted" style="font-size:13px">اسمع واختار المعنى:</p><div style="text-align:center;margin-block:8px 12px"><button class="btn gbig" data-act="speak" data-txt="' + esc(x.en) + '">' + ic("vol") + " اسمع</button></div>";
    var opts = q.o.map(function (o) {
      var cls = "opt"; if (ans) { if (o === q.right) cls += " ok"; else if (o === ans) cls += " bad"; }
      return '<button class="' + cls + '"' + (q.t === "ar" ? ' dir="ltr" lang="en"' : "") + ' data-act="co-q-pick" data-v="' + esc(o) + '"' + (ans ? " disabled" : "") + ">" + esc(o) + "</button>";
    }).join("");
    return '<div class="gtop"><button class="linkbtn" data-act="co-hub">✕</button><b>' + (u.view === "dose-rv" ? "مراجعة" : "اختبر نفسك") + '</b><span class="num">' + (S.qi + 1) + "/" + S.q.length + "</span></div>" +
      '<div class="card">' + prompt + '<div class="opts">' + opts + "</div>" +
      (ans ? '<p dir="ltr" lang="en" style="margin-block:10px 0;font-weight:700">' + esc(x.en) + " " + spkBtn(x.en) + '</p><p class="muted" style="margin:2px 0 0">' + esc(x.ar) + "</p>" : "") + "</div>" +
      (ans ? '<button class="btn" style="width:100%" data-act="co-q-next">التالي ←</button>' : "");
  }
  function ckBuildQuiz(ids, mixed) {
    return shuffle(ids).map(function (id, i) {
      var x = ckById(id), t = mixed && i % 2 ? "en" : "ar";
      return t === "ar" ? { id: id, t: "ar", o: ckOpts(x, "en"), right: x.en } : { id: id, t: "en", o: ckOpts(x, "ar"), right: x.ar };
    });
  }
  function doseRvStart(now) {
    var due = ckDue(now).slice(0, 12);
    if (!due.length) { coMark("rv"); toast(Object.keys(coD().ck).length ? "مفيش مراجعات مستحقة النهارده ✓" : "المراجعة هتبدأ من بكرة على عبارات النهارده ✓"); render(); return; }
    coUi().rv = { q: ckBuildQuiz(due, true), qi: 0, ok: 0, ans: null };
    coGo("dose-rv");
  }

  /* -------- listening dialogues -------- */
  function dlOrder() {
    var lv = plLevel() || "A2", base = LV_ORDER.indexOf(lv);
    return DIALOGS.slice().sort(function (a, b) {
      var da = Math.abs(LV_ORDER.indexOf(a.lv) - base), db = Math.abs(LV_ORDER.indexOf(b.lv) - base);
      return da - db || DIALOGS.indexOf(a) - DIALOGS.indexOf(b);
    });
  }
  function dlNext() { var C = coD(); return dlOrder().filter(function (d) { return (C.dl[d.k] || {}).best == null || C.dl[d.k].best < 2; })[0] || dlOrder()[0]; }
  function dlStart(k, fromDose) { coStopSay(); coUi().dlS = { k: k, phase: "listen", plays: 0, ans: {}, show: {}, dose: !!fromDose }; coGo("dl"); }
  function dlByK(k) { return DIALOGS.filter(function (d) { return d.k === k; })[0]; }
  function dlListHTML() {
    var C = coD();
    return coBack() + '<div class="card"><h2 style="margin:0 0 4px">' + ic("headphones") + ' استماع</h2><p class="muted" style="font-size:14px;margin:0">حوارات قصيرة من الشغل والحياة. الطريقة: اسمع الأول من غير ما تقرا، جاوب، وبعدين اقرا وكرّر ورا كل جملة.</p></div>' +
      '<div class="card" style="padding:6px">' + dlOrder().map(function (d) {
        var r = C.dl[d.k];
        return '<button class="tk-scene" data-act="co-dl" data-k="' + d.k + '"><span class="chip">' + d.lv + '</span><span class="grow"><b>' + esc(d.t) + "</b></span>" + (r ? '<span class="chip' + (r.best >= 2 ? " on" : "") + '">' + r.best + "/3</span>" : '<span class="chip">ابدأ</span>') + "</button>";
      }).join("") + "</div>";
  }
  function dlHTML() {
    var S = coUi().dlS, d = S && dlByK(S.k); if (!d) return dlListHTML();
    var top = '<div class="gtop"><button class="linkbtn" data-act="' + (S.dose ? "co-hub" : "co-go") + '" data-v="dls">✕</button><b>' + esc(d.t) + '</b><span class="chip">' + d.lv + "</span></div>";
    var steps = '<div class="co-phase"><span class="' + (S.phase === "listen" ? "on" : "done") + '">١ اسمع</span><span class="' + (S.phase === "qs" ? "on" : S.phase === "read" ? "done" : "") + '">٢ جاوب</span><span class="' + (S.phase === "read" ? "on" : "") + '">٣ اقرا وكرّر</span></div>';
    if (S.phase === "listen") {
      return top + steps + '<div class="card" style="text-align:center"><p>اسمع الحوار كله <b>من غير ما تقرا</b>. حاول تفهم مين بيكلم مين، وعن إيه.</p>' +
        '<button class="btn gbig" data-act="co-dl-play"' + (S.playing ? " disabled" : "") + ">" + ic(S.playing ? "vol" : "play") + (S.playing ? " شغّال…" : S.plays ? " اسمع تاني" : " شغّل الحوار") + "</button>" +
        '<p class="muted" style="font-size:12px;margin-top:8px">ممكن تسمعه مرتين قبل الأسئلة. ده طبيعي.</p></div>' +
        (S.plays ? '<button class="btn" style="width:100%" data-act="co-dl-qs">للأسئلة ←</button>' : "");
    }
    if (S.phase === "qs") {
      var all = d.qs.every(function (q, i) { return S.ans[i] != null; });
      return top + steps + d.qs.map(function (q, i) {
        var a = S.ans[i];
        return '<div class="card"><p dir="ltr" lang="en" style="font-weight:700;margin:0 0 8px">' + (i + 1) + ". " + esc(q.q) + '</p><div class="opts">' + shuffleStable(q.o, i + d.k.length).map(function (o) {
          var cls = "opt"; if (a != null) { if (o === q.a) cls += " ok"; else if (o === a) cls += " bad"; }
          return '<button class="' + cls + '" dir="ltr" lang="en" data-act="co-dl-pick" data-i="' + i + '" data-v="' + esc(o) + '"' + (a != null ? " disabled" : "") + ">" + esc(o) + "</button>";
        }).join("") + "</div></div>";
      }).join("") + '<button class="btn alt sm" data-act="co-dl-play"' + (S.playing ? " disabled" : "") + ">" + ic("vol") + " اسمع تاني</button>" +
        (all ? '<button class="btn" style="width:100%;margin-block-start:10px" data-act="co-dl-read">اقرا الحوار وكرّر ←</button>' : "");
    }
    var score = d.qs.filter(function (q, i) { return S.ans[i] === q.a; }).length;
    return top + steps + '<div class="ifb s' + (score === 3 ? 2 : score === 2 ? 1 : 0) + '"><b>' + score + "/3 " + (score === 3 ? "فهم كامل 👏" : score === 2 ? "فهم كويس" : "اقرا الحوار وركّز على الجمل اللي فاتتك") + "</b><p>دلوقتي اقرا، واضغط على أي جملة تسمعها وتكرّرها وراها (shadowing).</p></div>" +
      '<div class="card co-dl-lines">' + d.lines.map(function (l, i) {
        return '<div class="co-line ' + l[0] + '"><button class="co-line-en" dir="ltr" lang="en" data-act="co-dl-line" data-i="' + i + '"><b>' + l[0] + ":</b> " + esc(l[1]) + " " + ico("vol") + "</button>" +
          (S.show[i] ? '<p class="co-line-ar">' + esc(l[2]) + "</p>" : '<button class="linkbtn co-line-arbtn" data-act="co-dl-ar" data-i="' + i + '">المعنى</button>') + "</div>";
      }).join("") + "</div>" +
      '<button class="btn" style="width:100%" data-act="co-dl-finish">' + (S.dose ? "تم ✓ رجوع للجرعة" : "تم ✓") + "</button>";
  }
  function dlPlayAll() {
    var S = coUi().dlS, d = dlByK(S.k); if (!d || S.playing) return;
    S.playing = true; S.plays++; render(); coStopSay();
    var i = 0;
    (function nx() {
      if (!S.playing || i >= d.lines.length) { S.playing = false; render(); return; }
      var l = d.lines[i++]; coSay(l[1], l[0], function () { setTimeout(nx, 250); });
    })();
  }

  /* -------- work English -------- */
  function workHTML() {
    var C = coD();
    return coBack() + '<div class="card"><h2 style="margin:0 0 4px">' + ic("briefcase") + ' إنجليزي الشغل</h2><p class="muted" style="font-size:14px;margin:0">قوالب جاهزة: املا الخانات، والإيميل أو التقرير يطلعلك بالإنجليزي جاهز تنسخه. وانت بتملاها هتتعلم الأسلوب الرسمي.</p></div>' +
      '<div class="card" style="padding:6px">' + TEMPLATES.map(function (t) {
        return '<button class="tk-scene" data-act="co-tp" data-k="' + t.k + '"><span class="tk-n">' + ic(t.ico) + '</span><span class="grow"><b>' + esc(t.t) + "</b></span>" + (C.tp[t.k] ? '<span class="chip on">✓</span>' : "") + "</button>";
      }).join("") + "</div>" +
      '<button class="card co-nudge" data-act="co-go" data-v="bank"><span class="co-ic">' + ic("chat") + '</span><span class="grow"><b>بنك العبارات (٢٠٠ عبارة)</b><small class="muted">اجتماعات، خط، تقارير، موردين، تدقيق، إيميلات، تليفون، وكلام يومي.</small></span><span>←</span></button>';
  }
  function tpByK(k) { return TEMPLATES.filter(function (t) { return t.k === k; })[0]; }
  function tpVals(t) { var C = coD(), v = C.tpv[t.k] || {}, out = {}; t.f.forEach(function (f) { out[f[0]] = v[f[0]] != null && v[f[0]] !== "" ? v[f[0]] : ""; }); return out; }
  function tpText(t, vals, fallback) { return t.body.replace(/\{(\w+)\}/g, function (_, k) { var f = t.f.filter(function (x) { return x[0] === k; })[0]; return vals[k] || (fallback && f ? f[2] : "[" + (f ? f[1] : k) + "]"); }); }
  function tpHTML() {
    var t = tpByK(coUi().tpk); if (!t) return workHTML();
    var vals = tpVals(t);
    var fields = t.f.map(function (f) {
      return '<label class="field">' + esc(f[1]) + '<input class="inp" id="tpf-' + f[0] + '" data-tpf="' + f[0] + '" dir="ltr" lang="en" placeholder="' + esc(f[2]) + '" value="' + esc(vals[f[0]]) + '"></label>';
    }).join("");
    return '<button class="linkbtn" data-act="co-go" data-v="work">← إنجليزي الشغل</button><div class="card"><h3 style="margin:0 0 8px">' + ic(t.ico) + " " + esc(t.t) + "</h3>" + fields +
      '<button class="linkbtn" data-act="co-tp-example">املا بالمثال</button></div>' +
      '<div class="card"><div class="row between"><h3 style="margin:0">النتيجة</h3><span class="row" style="gap:6px">' + (t.speak ? '<button class="btn sm alt" data-act="co-tp-speak">' + ic("vol") + " اسمعها</button>" : "") + '<button class="btn sm" data-act="co-tp-copy">' + ic("copy") + " انسخ</button></span></div>" +
      '<pre class="co-tp-out" id="tpOut" dir="ltr" lang="en">' + esc(tpText(t, vals, true)) + "</pre></div>" +
      '<div class="card"><h3 style="margin:0 0 6px">' + ic("bulb") + " اتعلم من القالب</h3><ul class=\"itips\">" + t.tips.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
  }
  function bankCkHTML() {
    var C = coD(), f = coUi().bankCat || CHUNK_CATS[0].k, cat = CHUNK_CATS.filter(function (c) { return c.k === f; })[0];
    var chips = CHUNK_CATS.map(function (c) {
      var n = c.l.filter(function (x, i) { return C.ck[c.k + "-" + i]; }).length;
      return '<button class="chipbtn' + (c.k === f ? " on" : "") + '" data-act="co-bank-cat" data-k="' + c.k + '">' + esc(c.t) + ' <small class="muted">' + n + "/" + c.l.length + "</small></button>";
    }).join("");
    return '<button class="linkbtn" data-act="co-go" data-v="work">← إنجليزي الشغل</button>' +
      '<div class="card"><h3 style="margin:0 0 4px">بنك العبارات</h3><p class="muted" style="font-size:13px;margin:0">العبارات بتدخل جرعتك اليومية لوحدها (٥ كل يوم) وتتراجع على فترات لحد ما تثبت. ✓ = ثابتة عندك.</p></div>' +
      '<div class="row wrapr" style="gap:6px;margin-block-end:10px">' + chips + "</div>" +
      '<div class="card tk-chunks">' + cat.l.map(function (x, i) {
        var r = C.ck[cat.k + "-" + i], st = r ? r.st || 0 : -1;
        return '<div class="tk-chunk"><span><span dir="ltr" lang="en" style="display:block;font-weight:600">' + esc(x[0]) + '</span><small class="muted">' + esc(x[1]) + "</small></span><span class=\"row\" style=\"gap:6px\">" + (st >= 3 ? '<span class="chip on">✓</span>' : st >= 0 ? '<span class="chip">' + st + "</span>" : "") + spkBtn(x[0]) + "</span></div>";
      }).join("") + "</div>";
  }

  /* -------- weekly voice check -------- */
  var wkRec = null, wkTimer = null;
  function wkStart() {
    var S = coUi().wkS = { state: "rec", left: 60, text: "", t0: Date.now() };
    render();
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        var fin = "";
        wkRec = new SR(); wkRec.lang = "en-US"; wkRec.continuous = true; wkRec.interimResults = true;
        wkRec.onresult = function (e) {
          var interim = "";
          for (var i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) fin += e.results[i][0].transcript + " "; else interim += e.results[i][0].transcript; }
          S.text = (fin + interim).trim(); var el = document.getElementById("wkText"); if (el) el.textContent = S.text;
        };
        wkRec.onend = function () { if (S.state === "rec" && wkRec) { try { wkRec.start(); } catch (e) { } } };
        wkRec.start();
      } catch (e) { wkRec = null; }
    }
    clearInterval(wkTimer);
    wkTimer = setInterval(function () { S.left--; var el = document.getElementById("wkLeft"); if (el) el.textContent = S.left; if (S.left <= 0) wkStop(); }, 1000);
  }
  function wkStop(typed) {
    var S = coUi().wkS; clearInterval(wkTimer);
    if (typed == null) { var ta = document.getElementById("wkTyped"); if (ta) typed = ta.value; }
    if (wkRec) { var r = wkRec; wkRec = null; try { r.stop(); } catch (e) { } }
    if (!S) return;
    var text = typed != null ? typed : S.text, secs = Math.max(10, Math.min(60, (Date.now() - S.t0) / 1000));
    var w = coWords(text);
    if (w.length < 5) { S.state = "idle"; toast("الكلام اللي اتسجل قليل أوي. جرّب تاني، أو اكتب."); render(); return; }
    var t = " " + w.join(" ") + " ", link = LINKERS2.filter(function (x) { return t.indexOf(" " + x + " ") >= 0; }).length;
    var uniq = {}; w.forEach(function (x) { uniq[x] = 1; });
    var rec = { key: nowR().key, words: w.length, wpm: typed != null ? null : Math.round(w.length / secs * 60), link: link, uniq: Object.keys(uniq).length, text: text, typed: typed != null };
    var C = coD(); C.wk.push(rec); if (C.wk.length > 60) C.wk.shift();
    addXp(10, nowR()); saveMeta("learn", 0);
    S.state = "done"; S.rec = rec; render();
  }
  function wkHTML(now) {
    var C = coD(), S = coUi().wkS || { state: "idle" }, mic = speechOK();
    var body;
    if (S.state === "rec") {
      body = '<div class="card" style="text-align:center"><div class="co-timer"><b id="wkLeft" class="num">' + S.left + "</b><small>ثانية</small></div>" +
        (mic ? '<p class="iheard" dir="ltr" lang="en" id="wkText">' + esc(S.text || "…") + "</p>" : '<textarea class="inp" id="wkTyped" dir="ltr" lang="en" rows="5" placeholder="اكتب اللي بتقوله…"></textarea>') +
        '<button class="btn alt" data-act="co-wk-stop">خلّصت</button></div>';
    } else if (S.state === "done" && S.rec) {
      var r = S.rec, first = C.wk[0];
      body = '<div class="card co-wk-res"><h3 style="margin:0 0 10px">نتيجة النهارده</h3><div class="hz-stats">' +
        '<div><b class="num">' + r.words + "</b><small>كلمة</small></div><div><b class=\"num\">" + (r.wpm == null ? "—" : r.wpm) + "</b><small>كلمة/دقيقة</small></div>" +
        '<div><b class="num">' + r.link + "</b><small>أدوات ربط</small></div><div><b class=\"num\">" + r.uniq + "</b><small>كلمة مختلفة</small></div></div>" +
        (first && first !== r ? '<p class="co-cmp">مقارنة بأول تسجيل (' + greg(first.key) + "): " + cmpTxt(r.words - first.words, "كلمة") + " · " + cmpTxt(r.link - first.link, "أداة ربط") + "</p>" : '<p class="muted" style="font-size:13px">ده أول تسجيل ليك. بعد أسبوع سجّل تاني وشوف الفرق.</p>') +
        '<p class="muted" style="font-size:13px;margin-block:10px 4px">اللي قلته:</p><p dir="ltr" lang="en" class="co-said">' + esc(r.text) + "</p>" +
        (r.link < 3 ? '<p class="hz-tip">' + ic("bulb") + " المرة الجاية استخدم أدوات ربط زي because, so, however, for example. هتخلي كلامك متماسك وطبيعي.</p>" : "") +
        '<button class="btn alt sm" data-act="co-wk-new">سجّل تاني</button></div>';
    } else {
      body = '<div class="card"><p dir="ltr" lang="en" style="font-weight:700;margin:0 0 4px">' + esc(WEEKLY_PROMPT[0]) + '</p><p class="muted" style="margin:0 0 10px">' + esc(WEEKLY_PROMPT[1]) + "</p>" +
        '<ul class="itips"><li>نفس السؤال كل أسبوع، عشان تقدر تقارن نفسك بنفسك.</li><li>فكّر ١٠ ثواني في ٣ أفكار، وبعدين اتكلم دقيقة كاملة من غير ما تقف.</li></ul>' +
        '<button class="btn gbig" style="width:100%" data-act="co-wk-start">' + ic(mic ? "mic" : "timer") + (mic ? " ابدأ دقيقة الكلام" : " ابدأ (اكتب وانت بتقول بصوت عالي)") + "</button></div>";
    }
    var hist = C.wk.slice(-8), max = Math.max.apply(null, hist.map(function (x) { return x.words; }).concat([60]));
    var chart = hist.length ? '<div class="card"><h3 style="margin:0 0 10px">تطوّرك (عدد الكلمات في الدقيقة)</h3><div class="week">' + hist.map(function (x) {
      return '<div><span class="col"><i class="' + (x.words >= 90 ? "full" : "") + '" style="height:' + Math.round(x.words / max * 100) + '%"></i></span><b class="num" style="font-weight:500">' + x.words + "</b><span>" + fmtShortAr(x.key) + "</span></div>";
    }).join("") + "</div></div>" : "";
    return coBack() + '<div class="card"><h2 style="margin:0 0 4px">' + ic("chart") + ' صوتي كل أسبوع</h2><p class="muted" style="font-size:14px;margin:0">دقيقة كل أسبوع بتتكلم فيها، والتطبيق بيحسب عدد كلامك وسرعتك وأدوات الربط. مع الوقت هتشوف تقدمك بالأرقام.</p></div>' + body + chart;
  }
  function cmpTxt(n, unit) { return (n > 0 ? "+" : "") + n + " " + unit; }

  /* -------- can-do ladder -------- */
  function candoHTML() {
    var pv = provenLevel();
    var groups = ["A2", "B1", "B2"].map(function (lv) {
      var items = CANDO.filter(function (x) { return x.lv === lv; }), done = items.filter(candoDone).length;
      return '<div class="card"><div class="row between"><h3 style="margin:0">مستوى ' + lv + '</h3><span class="chip' + (done === items.length ? " on" : "") + '">' + done + "/" + items.length + "</span></div>" +
        items.map(function (x) {
          var ok = candoDone(x), parts = candoChecks(x);
          return '<div class="co-can' + (ok ? " ok" : "") + '"><span class="co-can-ic">' + (ok ? ic("check") : "") + '</span><span class="grow">' + esc(x.t) + (ok ? "" : '<small class="muted">' + x.c.map(function (c, i) { return (parts[i] ? "✓ " : "○ ") + candoHow(c); }).join(" · ") + "</small>") + "</span></div>";
        }).join("") + "</div>";
    }).join("");
    return coBack() + '<div class="card co-result"><small class="muted">المستوى اللي أثبته بالفعل</small><div class="co-lv"' + (CANDO.some(candoDone) ? "" : ' style="font-size:30px"') + '>' + provenTxt() + '</div><p>كل بند بيتعلّم ✓ لوحده لما تعمله فعلًا في التطبيق. المستوى ده من اللي عملته، مش من أسئلة اختيار.</p></div>' + groups;
  }
  function candoHow(c) {
    if (c[0] === "talk") { var f = tkScene(c[1]); return "«" + (f ? f.sc.t : c[1]) + "» " + c[2] + " نجوم"; }
    if (c[0] === "tp") { var t = tpByK(c[1]); return "قالب «" + (t ? t.t : c[1]) + "»"; }
    if (c[0] === "dl") return c[2] + " حوارات استماع ٢/٣+";
    if (c[0] === "wk") return "تسجيل دقيقة فيه " + c[2] + "+ كلمة";
    if (c[0] === "wkl") return c[2] + "+ أدوات ربط في تسجيل";
    if (c[0] === "ck") return c[2] + " عبارة ثابتة";
    return "";
  }

  /* -------- hook from «اتكلم» -------- */
  function coachTalkDone() { if (coUi().tkDose) { coUi().tkDose = false; coUi().tkBack = true; coMark("tk"); } }
  function talkNextForDose() {
    var D = state.learn.talk || { sc: {} }, all = [];
    TALK_SETS.forEach(function (s) { s.scenes.forEach(function (x) { all.push(x.k); }); });
    return all.filter(function (k) { return !(((D.sc || {})[k] || {}).best >= 2); })[0] || all[Math.floor(Math.random() * all.length)];
  }

  /* =================== events =================== */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var act = el.getAttribute("data-act"); if (act.indexOf("co-") !== 0) return;
    var u = coUi(), now = nowR(), S, x;
    switch (act) {
      case "co-open": coStopSay(); coGo("hub"); break;
      case "co-hub":
        if (u.wkS && u.wkS.state === "rec") { clearInterval(wkTimer); if (wkRec) { var wr = wkRec; wkRec = null; try { wr.stop(); } catch (er) { } } u.wkS = { state: "idle" }; }
        u.tkBack = false; coStopSay(); u.view = "hub"; state.lv = { mode: "coach", c: "en" }; $("#p-learn").scrollTop = 0; render(); break;
      case "co-go": {
        var v = el.getAttribute("data-v"); coStopSay();
        if (v === "wk" && !(u.wkS && u.wkS.state === "rec")) u.wkS = { state: "idle" };
        coGo(v); break;
      }
      case "co-step": {
        var s = el.getAttribute("data-s");
        if (s === "ck") doseCkStart();
        else if (s === "rv") doseRvStart(now);
        else if (s === "dl") dlStart(dlNext().k, true);
        else if (s === "tk") { u.tkDose = true; state.lv = { mode: "talk", c: "en" }; tkStart(talkNextForDose()); }
        break;
      }
      /* placement */
      case "co-place": plStart(); break;
      case "co-pl-pick": plAnswer(el.getAttribute("data-v")); break;
      case "co-pl-skip": plAnswer(""); break;
      case "co-pl-play": { var it = PLACEMENT[u.pl.i]; u.pl.played++; coSay(it.say, "A"); render(); break; }
      case "co-pl-mic": {
        u.pl.listening = true; render();
        recognizeOnce(function (r) { u.pl.listening = false; if (r.heard) { var ta = document.getElementById("coPlTxt"); u.pl.heard = ((ta && ta.value ? ta.value + " " : "") + r.heard).trim(); } else toast("مسمعتش، جرّب تاني أو اكتب."); render(); });
        break;
      }
      case "co-pl-speak-ok": { var ta2 = document.getElementById("coPlTxt"); plAnswer(ta2 ? ta2.value.trim() : u.pl.heard); break; }
      /* new phrases */
      case "co-ck-mic": {
        S = u.ck; x = ckById(S.ids[S.i]); S.listening = true; render();
        recognizeOnce(function (r) { S.listening = false; S.said[x.id] = !r.err && speechScore(r.heard || "", x.en) >= 0.7; render(); });
        break;
      }
      case "co-ck-next":
        S = u.ck; S.i++;
        if (S.i >= S.ids.length) { S.phase = "quiz"; S.q = ckBuildQuiz(S.ids, false); S.qi = 0; S.ok = 0; S.ans = null; S.ids.forEach(function (id) { coD().ck[id] = { st: 0, due: addDays(now.key, 1), added: now.key }; }); saveMeta("learn", 400); }
        $("#p-learn").scrollTop = 0; render(); break;
      case "co-q-pick": {
        S = u.view === "dose-rv" ? u.rv : u.ck; if (!S || S.ans) break;
        var q = S.q[S.qi], ok = el.getAttribute("data-v") === q.right;
        S.ans = el.getAttribute("data-v"); if (ok) S.ok++;
        if (u.view === "dose-rv") ckGrade(q.id, ok); else if (ok) ckGrade(q.id, true);
        if (navigator.vibrate) navigator.vibrate(ok ? 12 : [30, 40, 30]);
        if (q.t === "ar") speak(ckById(q.id).en);
        render(); break;
      }
      case "co-q-next":
        S = u.view === "dose-rv" ? u.rv : u.ck; S.qi++; S.ans = null;
        if (S.qi >= S.q.length) { S.end = true; coMark(u.view === "dose-rv" ? "rv" : "ck"); }
        $("#p-learn").scrollTop = 0; render(); break;
      /* dialogues */
      case "co-dl": dlStart(el.getAttribute("data-k"), false); break;
      case "co-dl-play": dlPlayAll(); break;
      case "co-dl-qs": coStopSay(); u.dlS.playing = false; u.dlS.phase = "qs"; render(); break;
      case "co-dl-pick": u.dlS.ans[el.getAttribute("data-i")] = el.getAttribute("data-v"); render(); break;
      case "co-dl-read": {
        coStopSay(); u.dlS.playing = false; u.dlS.phase = "read";
        var dd = dlByK(u.dlS.k), sc = dd.qs.filter(function (qq, i) { return u.dlS.ans[i] === qq.a; }).length, C = coD();
        C.dl[dd.k] = { best: Math.max(sc, (C.dl[dd.k] || {}).best || 0), at: now.key }; addXp(sc * 2, now); saveMeta("learn", 400);
        $("#p-learn").scrollTop = 0; render(); break;
      }
      case "co-dl-line": { var ln = dlByK(u.dlS.k).lines[Number(el.getAttribute("data-i"))]; coStopSay(); coSay(ln[1], ln[0]); break; }
      case "co-dl-ar": u.dlS.show[el.getAttribute("data-i")] = true; render(); break;
      case "co-dl-finish": coStopSay(); if (u.dlS.dose) { coMark("dl"); coGo("hub"); } else coGo("dls"); break;
      /* work */
      case "co-tp": u.tpk = el.getAttribute("data-k"); coGo("tp"); break;
      case "co-tp-example": { var t = tpByK(u.tpk), C2 = coD(); C2.tpv[t.k] = {}; t.f.forEach(function (f) { C2.tpv[t.k][f[0]] = f[2]; }); saveMeta("learn", 400); render(); break; }
      case "co-tp-copy": {
        var t2 = tpByK(u.tpk), txt = tpText(t2, tpVals(t2), true);
        coD().tp[t2.k] = 1; saveMeta("learn", 300);
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("اتنسخ ✓"); }, function () { toast("تعذّر النسخ — علّم النص وانسخه"); }); else toast("علّم النص وانسخه");
        break;
      }
      case "co-tp-speak": { var t3 = tpByK(u.tpk); coD().tp[t3.k] = 1; saveMeta("learn", 300); speak(tpText(t3, tpVals(t3), true).replace(/\n+/g, " ")); break; }
      case "co-bank-cat": u.bankCat = el.getAttribute("data-k"); render(); break;
      /* weekly */
      case "co-wk-start": wkStart(); break;
      case "co-wk-stop": { var tt = document.getElementById("wkTyped"); wkStop(tt ? tt.value : null); break; }
      case "co-wk-new": u.wkS = { state: "idle" }; render(); break;
    }
  });
  document.addEventListener("input", function (e) {
    var k = e.target && e.target.getAttribute && e.target.getAttribute("data-tpf"); if (!k) return;
    var t = tpByK(coUi().tpk); if (!t) return;
    var C = coD(); if (!C.tpv[t.k]) C.tpv[t.k] = {};
    C.tpv[t.k][k] = e.target.value; saveMeta("learn", 1500);
    var out = document.getElementById("tpOut"); if (out) out.textContent = tpText(t, tpVals(t), true);
  });
