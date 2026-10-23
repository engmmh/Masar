"use strict";
  /* ---------------- learning content ---------------- */
  var COURSES = {};
  var COURSE_ORDER = ["en", "iso", "iso14001", "iso45001", "iso22000", "iso17025", "micro"];
  // ALLOWED_COURSES is what the logged-in account is permitted to see — a derived,
  // per-session subset of COURSE_ORDER (never COURSE_ORDER itself, which must stay
  // the full master list: it's still used to load/index every course's data so admin
  // stats and lookups work regardless of which account is currently signed in).
  // Reset to "everything" on every login attempt, then narrowed by applyPermissions()
  // once an account's own courses/sections columns are known.
  var ALLOWED_COURSES = COURSE_ORDER.slice();
  var QINDEX = {}, UNIT_BY_KEY = {}, VOCAB_INDEX = {};
  // One course's json 404ing or timing out must not take every other course down
  // with it — allSettled + per-course catch means a single bad fetch just leaves
  // that one course missing from COURSES (buildIndexes/learnView already guard for
  // that), instead of Promise.all rejecting and leaving COURSES empty entirely.
  function loadCourses() {
    return Promise.allSettled(COURSE_ORDER.map(function (cid) {
      return fetch("courses/" + cid + ".json").then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status + " loading course " + cid);
        return r.json();
      }).then(function (data) { COURSES[cid] = data; }).catch(function (err) {
        console.error("Masar: failed to load course " + cid, err);
      });
    }));
  }
  function buildIndexes() {
    COURSE_ORDER.forEach(function (cid) {
      if (!COURSES[cid]) return;
      COURSES[cid].units.forEach(function (u) {
        UNIT_BY_KEY[cid + ":" + u.id] = u;
        u.qs.forEach(function (q, i) { q.id = cid + "-" + u.id + "-q" + i; q.u = u.id; q.c = cid; QINDEX[q.id] = q; });
      });
      (COURSES[cid].vocab || []).forEach(function (v) { v.c = cid; VOCAB_INDEX[v.id] = v; });
      (COURSES[cid].examBank || []).forEach(function (q, i) { q.id = cid + "-bank-" + i; q.c = cid; QINDEX[q.id] = q; });
    });
  }
  // Phase 7 — 8-stage spaced repetition (was a 4-box system, INTERVALS = [0,1,3,7]).
  // Stages 0-3 use the EXACT same day-counts as the old boxes on purpose: every
  // existing card's due date and meaning carry over unchanged (see migrateSrsV2) —
  // stages 4-7 are new ground, reachable only by continuing to review a card that
  // already reached old mastery (stage 3).
  var SRS_STAGE_DAYS = [0, 1, 3, 7, 14, 30, 60, 120];
  var SRS_MAX_STAGE = SRS_STAGE_DAYS.length - 1;
  function cardStage(c) { return c ? Math.max(0, Math.min(SRS_MAX_STAGE, c.stage != null ? c.stage : (c.box || 0))) : 0; }
  // Daily caps — an admin-set per-account ceiling (state.dailyNewWordLimit, Phase 6)
  // is the default; the signed-in account can further override both from "الإعدادات".
  function srsNewLimit() { return (state.settings.dailyNewWordLimit > 0 ? state.settings.dailyNewWordLimit : (state.dailyNewWordLimit > 0 ? state.dailyNewWordLimit : 10)); }
  function srsReviewLimit() { return state.settings.dailyReviewLimit > 0 ? state.settings.dailyReviewLimit : 30; }
  function srsDayCounters(now) {
    if (!state.learn.srsDaily || state.learn.srsDaily.date !== now.key) state.learn.srsDaily = { date: now.key, newDone: 0, reviewDone: 0 };
    return state.learn.srsDaily;
  }
  // No more than 3 cards in a row from the same course in a mixed/global session —
  // preserves the priority order the caller already sorted (weak/overdue/new), just
  // avoids one big course dominating a session a smaller course also has cards in.
  function interleaveCourses(list) {
    var buckets = {}, order = [];
    list.forEach(function (v) {
      var k = v.c || "_";
      if (!buckets[k]) { buckets[k] = []; order.push(k); }
      buckets[k].push(v);
    });
    var out = [], lastKey = null, streak = 0, guard = 0, total = list.length;
    while (out.length < total && guard++ < total * 4 + 4) {
      var picked = false;
      for (var i = 0; i < order.length; i++) {
        var k = order[i];
        if (!buckets[k].length) continue;
        var othersHaveCards = order.some(function (ok) { return ok !== k && buckets[ok].length; });
        if (k === lastKey && streak >= 3 && othersHaveCards) continue;
        out.push(buckets[k].shift());
        streak = (k === lastKey) ? streak + 1 : 1;
        lastKey = k; picked = true;
        break;
      }
      if (!picked) { for (var j = 0; j < order.length; j++) { if (buckets[order[j]].length) { out.push(buckets[order[j]].shift()); break; } } }
    }
    return out;
  }
  // Builds one review session's queue: weak (previously forgotten & due again) first,
  // then oldest-overdue, then due-today, then brand-new words — capped by the daily
  // new/review limits above, with new-word intake paused entirely once the backlog
  // (everything overdue) is heavier than 60, so catching up always wins over novelty.
  function buildReviewQueue(now, cid, lvl, max) {
    var pool = cid ? (COURSES[cid] ? COURSES[cid].vocab : []) : ALLOWED_COURSES.reduce(function (a, c) { return COURSES[c] ? a.concat(COURSES[c].vocab) : a; }, []);
    if (lvl) pool = pool.filter(function (v) { return (v.lvl || 1) === lvl; });
    var weak = [], overdue = [], dueToday = [], brandNew = [];
    pool.forEach(function (v) {
      var c = state.learn.cards[v.id];
      if (!c) { brandNew.push(v); return; }
      if (c.due > now.key) return; // not due yet
      if ((c.lapses || 0) > 0) { weak.push(v); return; }
      if (c.due < now.key) overdue.push(v); else dueToday.push(v);
    });
    overdue.sort(function (a, b) { var da = state.learn.cards[a.id].due, db = state.learn.cards[b.id].due; return da < db ? -1 : (da > db ? 1 : 0); });
    var backlog = weak.length + overdue.length + dueToday.length;
    var counters = srsDayCounters(now);
    var reviewRoom = Math.max(0, srsReviewLimit() - counters.reviewDone);
    var newRoom = backlog > 60 ? 0 : Math.max(0, srsNewLimit() - counters.newDone);
    var reviewPart = weak.concat(overdue).concat(dueToday).slice(0, reviewRoom);
    var newPart = shuffle(brandNew).slice(0, newRoom);
    var cap = max || (reviewRoom + newRoom) || 1;
    return interleaveCourses(reviewPart.concat(newPart).slice(0, cap));
  }
  // One-time migration to the 8-stage system — guarded by srsVersion so it only ever
  // runs once per account. A deterministic (not Math.random) hash-based jitter is
  // applied ONLY to cards that were already at old box 3: those are exactly the ones
  // that could keep climbing further now, and since many words mastered in the same
  // study session would otherwise share the exact same due date, that's also exactly
  // the population most likely to "pile up" on one day — spreading them 0-6 days
  // apart (never earlier) is the one real behavior change this migration makes;
  // every other card's due date is left completely untouched.
  function srsStableJitter(id, max) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h % (max + 1);
  }
  async function migrateSrsV2(now) {
    if ((state.learn.srsVersion || 1) >= 2) return;
    var cards = state.learn.cards || {};
    // Backup first, before any field is touched — local always, and to the cloud too
    // when signed in, so the pre-migration snapshot survives even a lost device.
    try { localStorage.setItem(LSKEY + ":srs2backup", JSON.stringify({ at: now.ms, cards: cards })); } catch (e) { }
    if (state.mode === "supa" && store.uid) {
      try {
        await store.sb.from("masar_meta").upsert({ user_id: store.uid, name: "learnBackupSrs2", data: { at: now.ms, cards: cards }, updated_at: new Date().toISOString() }, { onConflict: "user_id,name" });
      } catch (e) { }
    }
    Object.keys(cards).forEach(function (id) {
      var c = cards[id], wasBox3 = (c.box || 0) >= 3 && c.stage == null;
      if (c.stage == null) c.stage = Math.max(0, Math.min(SRS_MAX_STAGE, c.box || 0));
      if (c.lapses == null) c.lapses = 0;
      if (wasBox3 && c.due) c.due = addDays(c.due, srsStableJitter(id, 6));
    });
    state.learn.srsVersion = 2;
    saveMeta("learn", 0);
  }

  // ---------------- Phase 8 — قسم نقاط ضعفي (weak points) ----------------
  // A "weak item" wraps either a vocab word (kind:"word", id = vocab id, SRS card
  // in state.learn.cards keeps progressing normally in parallel) or a quiz question
  // (kind:"q", id = QINDEX id). Four ways in: a wrong answer inside a class-session
  // unit (id starting "cls") -> source "class"; a card forgotten twice within 14
  // days -> source "forget"; any other wrong quiz/exam-bank/final-exam answer ->
  // source "exam"; the 🎯 button -> source "manual". A 3-step ladder (تعرّف/استرجاع/
  // استخدام), gated one calendar day apart, graduates the item back out of this list
  // (for a word, its normal SRS card was never touched, so it just resumes Phase 7
  // review as usual; for a question, it's simply cleared).
  var WEAK_SRC_LBL = { all: "الكل", class: "من الكلاس", forget: "بتتنسى", exam: "أخطاء الاختبارات" };
  var WEAK_STEP_LBL = ["تعرّف", "استرجاع", "استخدام"];
  function addWeak(id, kind, source, cid, now, extra) {
    if (!id || state.learn.weak[id]) return;
    now = now || nowR();
    state.learn.weak[id] = Object.assign({ kind: kind, source: source, cid: cid || null, addedAt: now.ms, step: 0, stepDue: null }, extra || {});
    saveMeta("learn", 800);
  }
  function weakCount() { return Object.keys(state.learn.weak).length; }
  function weakItemInfo(w) {
    if (!w) return null;
    if (w.kind === "word") {
      var v = VOCAB_INDEX[w.id]; if (!v) return null;
      return { kind: "word", en: v.en, ar: v.ar, ex: v.ex, exAr: v.exAr, c: v.c };
    }
    if (w.kind === "point") return { kind: "point", q: w.text || "", c: w.cid };
    var q = QINDEX[w.id]; if (!q) return null;
    return { kind: "q", q: q.q, t: q.t, o: q.o, a: q.a, c: q.c, u: q.u };
  }
  function weakList(tab) {
    var out = Object.keys(state.learn.weak).map(function (id) { return Object.assign({ id: id }, state.learn.weak[id]); })
      .filter(function (w) { return weakItemInfo(w); });
    out.sort(function (a, b) { return a.addedAt - b.addedAt; });
    if (!tab || tab === "all") return out;
    return out.filter(function (w) { return w.source === tab; });
  }
  function weakMcqOptions(w, info) {
    if (w.kind === "word") {
      var pool = ALLOWED_COURSES.reduce(function (a, c) { return COURSES[c] ? a.concat(COURSES[c].vocab) : a; }, []);
      var correct = info.ar;
      var distractors = shuffle(pool.filter(function (v) { return v.ar !== correct; })).slice(0, 3).map(function (v) { return v.ar; });
      if (distractors.length < 3) return null;
      return shuffle([correct].concat(distractors));
    }
    if (info.t === "mcq" && info.o && info.o.length) return info.o;
    return null;
  }
  function weakStart(id) {
    var w = state.learn.weak[id]; if (!w) return;
    var info = weakItemInfo(w); if (!info) { delete state.learn.weak[id]; saveMeta("learn", 0); render(); return; }
    state.wd = { id: id, done: null, correctTxt: "" };
    state.lv = { mode: "weakdrill" };
    render();
  }
  function weakFinishAttempt(ok, correctTxt) {
    var d = state.wd; if (!d) return;
    var w = state.learn.weak[d.id], now = nowR();
    d.done = ok; d.correctTxt = correctTxt;
    if (ok && w) {
      w.step = (w.step || 0) + 1;
      if (w.step >= 3) { delete state.learn.weak[d.id]; state.learn.weakGraduated = (state.learn.weakGraduated || 0) + 1; checkAchievements(now); }
      else w.stepDue = addDays(now.key, 1);
      saveMeta("learn", 400);
    }
    render();
  }
  function weakPick(val) {
    var d = state.wd; if (!d || d.done != null) return;
    var w = state.learn.weak[d.id]; if (!w) return;
    var info = weakItemInfo(w);
    var correct = w.kind === "word" ? info.ar : (Array.isArray(info.a) ? info.a[0] : info.a);
    weakFinishAttempt(val === correct, correct);
  }
  function weakSubmitTyped() {
    var d = state.wd; if (!d || d.done != null) return;
    var inp = $("#weakAns"); if (!inp) return;
    var w = state.learn.weak[d.id]; if (!w) return;
    var info = weakItemInfo(w);
    var correctRaw = w.kind === "word" ? info.en : info.a;
    var correctList = Array.isArray(correctRaw) ? correctRaw : [correctRaw];
    var ok = !!norm(inp.value) && correctList.map(norm).indexOf(norm(inp.value)) !== -1;
    weakFinishAttempt(ok, correctList[0]);
  }

  function level() {
    var xp = state.learn.xp || 0, lv = Math.floor(Math.sqrt(xp / 40)) + 1, base = 40 * (lv - 1) * (lv - 1), next = 40 * lv * lv;
    return { lv: lv, xp: xp, pct: Math.round((xp - base) / (next - base) * 100), need: next - xp };
  }
  function addXp(n, now) {
    state.learn.xp = (state.learn.xp || 0) + n;
    now = now || nowR();
    var k = now.key;
    state.learn.study[k] = (state.learn.study[k] || 0) + n;
    maybeAwardFreeze(now);
  }
  // "يومًا مُجمَّد" — a day the streak treats as studied because a freeze covered it.
  function studiedOrFrozen(k) { return !!state.learn.study[k] || !!(state.learn.freezeDays && state.learn.freezeDays[k]); }
  function studyStreak(now) {
    var k = now.key, n = 0;
    if (!studiedOrFrozen(k)) k = addDays(k, -1);
    while (studiedOrFrozen(k) && n < 5000) { n++; k = addDays(k, -1); }
    return n;
  }
  // Phase 11 — سلسلة تعلّم + تجميد 🧊: every 7 days of streak banks one freeze
  // (max 2); maybeUseStreakFreeze() spends one automatically to bridge a single
  // missed day so the streak doesn't reset to zero over it.
  function maybeAwardFreeze(now) {
    var streak = studyStreak(now), milestone = Math.floor(streak / 7) * 7;
    if (milestone > 0 && (state.learn.freezeAt || 0) < milestone) {
      state.learn.freezeAt = milestone;
      state.learn.freezes = Math.min(2, (state.learn.freezes || 0) + 1);
      toast("🧊 كسبت تجميدة جديدة لسلسلة التعلّم!");
    }
  }
  function maybeUseStreakFreeze(now) {
    var y = addDays(now.key, -1), dayBefore = addDays(y, -1);
    if (studiedOrFrozen(y) || y >= now.key) return;
    if (!studiedOrFrozen(dayBefore)) return; // nothing to bridge — streak was already broken
    if ((state.learn.freezes || 0) <= 0) return;
    if (!state.learn.freezeDays) state.learn.freezeDays = {};
    state.learn.freezeDays[y] = true;
    state.learn.freezes--;
    state.learn.freezesUsed = (state.learn.freezesUsed || 0) + 1;
    saveMeta("learn", 0);
    toast("🧊 استخدمنا تجميدة عشان نحافظ على سلسلتك");
  }
  function dueCards(now, cid, lvl) {
    var list = cid ? (COURSES[cid] ? COURSES[cid].vocab : []) : ALLOWED_COURSES.reduce(function (a, c) { return COURSES[c] ? a.concat(COURSES[c].vocab) : a; }, []);
    if (lvl) list = list.filter(function (v) { return (v.lvl || 1) === lvl; });
    return list.filter(function (v) { var c = state.learn.cards[v.id]; return !c || c.due <= now.key; });
  }
  function mistakeIds(cid) {
    return Object.keys(state.learn.mistakes).filter(function (id) { return state.learn.mistakes[id] > 0 && QINDEX[id] && (!cid || QINDEX[id].c === cid); });
  }
  function norm(s) { return String(s).toLowerCase().replace(/[‘’ʼ`]/g, "'").replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim(); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }


  /* ---------------- achievements (badges) ---------------- */
  var ACHIEVEMENTS = [
    { id: "dlg100", icon: "chat", title: "محادثة بلا خطأ", desc: "أنهيت محادثة كاملة بدرجة 100%.",
      check: function (s) { return Object.keys(s.learn.units).some(function (k) { var u = UNIT_BY_KEY[k]; return u && u.kind === "dialogue" && (s.learn.units[k].best || 0) >= 100; }); } },
    { id: "fifty", icon: "cap", title: "٥٠ كلمة محفوظة", desc: "وصلت لخمسين كلمة في أعلى مستوى حفظ بالكروت.",
      check: function (s) { return Object.keys(s.learn.cards).filter(function (id) { return s.learn.cards[id].box >= 3; }).length >= 50; } },
    { id: "week7", icon: "flame", title: "أسبوع مذاكرة متواصل", desc: "ذاكرت 7 أيام متتالية من غير ما تفوّت يوم.",
      check: function (s, now) { return studyStreak(now) >= 7; } },
    { id: "course1", icon: "cert", title: "شهادة إتمام كورس", desc: "أنهيت كل وحدات كورس كامل.",
      check: function (s) { return ALLOWED_COURSES.some(function (cid) { var c = COURSES[cid]; if (!c) return false; var done = c.units.filter(function (u) { var p = s.learn.units[cid + ":" + u.id]; return p && p.done; }).length; return done >= c.units.length; }); } },
    { id: "speaker", icon: "vol", title: "متكلم واثق", desc: "خلصت تحدي نطق كامل بدقة 100%.",
      check: function (s) { return (s.learn.speakBest || 0) >= 100; } },
    // Phase 11 — 10 شارات جديدة
    { id: "weakhunter", icon: "shield", title: "🎯 صياد الضعف", desc: "ثبّتت 10 نقاط ضعف بالكامل.",
      check: function (s) { return (s.learn.weakGraduated || 0) >= 10; } },
    { id: "month30", icon: "flame", title: "🔥 شهر متواصل", desc: "ذاكرت 30 يوم متتالي من غير ما تفوّت يوم.",
      check: function (s, now) { return studyStreak(now) >= 30; } },
    { id: "steadytongue", icon: "vol", title: "🎤 لسان ثابت", desc: "نطقت 20 كلمة صح في تمارين النطق.",
      check: function (s) { return (s.learn.speakCardOk || 0) >= 20; } },
    { id: "milestone1", icon: "flame", title: "🏁 عدّاء المراحل", desc: "نجحت في أول اختبار مرحلة.",
      check: function (s) { return Object.keys(s.learn.milestones || {}).some(function (k) { return s.learn.milestones[k].passed; }); } },
    { id: "allmilestones", icon: "cert", title: "🎓 كل المراحل", desc: "نجحت في كل اختبارات المراحل في كورس كامل.",
      check: function (s) { return ALLOWED_COURSES.some(function (cid) { return allMilestonesPassed(cid) && milestoneBoundaries(cid).length; }); } },
    { id: "sentencewriter", icon: "pin", title: "📝 كاتب الجمل", desc: "كتبت 10 جمل في جملي.",
      check: function (s) { return (s.learn.mySentences || []).length >= 10; } },
    { id: "combo3", icon: "flame", title: "⚡ كومبو × 3", desc: "وصلت لكومبو ×3 في اختبار.",
      check: function (s) { return (s.learn.bestCombo || 0) >= 6; } },
    { id: "freezeused", icon: "lock", title: "🧊 محافظ", desc: "استخدمت تجميدة لحماية سلسلة التعلّم.",
      check: function (s) { return (s.learn.freezesUsed || 0) >= 1; } },
    { id: "weeklychallenge1", icon: "cap", title: "🏆 تحدي الأسبوع", desc: "خلّصت تحدي الأسبوع لأول مرة.",
      check: function (s) { return !!(s.learn.weeklyChallenge && s.learn.weeklyChallenge.done); } },
    { id: "perfectquiz", icon: "cert", title: "💯 قاتل الاختبار", desc: "حصلت على 100% في اختبار من 5 أسئلة فأكثر.",
      check: function (s) { return !!s.learn.perfectQuiz; } }
  ];
  function checkAchievements(now) {
    var got = [];
    ACHIEVEMENTS.forEach(function (b) {
      if (!state.learn.badges[b.id] && b.check(state, now)) { state.learn.badges[b.id] = now.key; got.push(b); }
    });
    if (got.length) { saveMeta("learn", 0); got.forEach(function (b) { toast("🏆 إنجاز جديد: " + b.title); }); }
    return got;
  }


  /* ---------------- daily challenge ---------------- */
  function dailyPool() {
    var pool = [];
    ALLOWED_COURSES.forEach(function (cid) {
      COURSES[cid].units.forEach(function (u) {
        var p = state.learn.units[cid + ":" + u.id];
        if (p && p.done && u.qs) pool = pool.concat(u.qs.map(function (q) { return q.id; }));
      });
    });
    if (pool.length < 5) pool = Object.keys(QINDEX);
    return pool;
  }
  function todaysDaily(now) {
    var d = state.learn.daily;
    return (d && d.key === now.key) ? d : null;
  }
  // Phase 11 — تحدي الأسبوع: a bigger (10-question), once-per-week bonus challenge
  // that becomes available every Saturday and stays open all week until attempted.
  function satKeyOf(key) { var back = (dowOf(key) - 6 + 7) % 7; return addDays(key, -back); }
  function weeklyChallengeKey(now) { return satKeyOf(now.key); }
  function currentWeeklyChallenge(now) {
    var w = state.learn.weeklyChallenge;
    return (w && w.key === weeklyChallengeKey(now)) ? w : null;
  }
  function startWeeklyChallenge(now) {
    var w = currentWeeklyChallenge(now);
    if (!w) {
      var pool = shuffle(dailyPool()).slice(0, Math.min(10, dailyPool().length));
      w = { key: weeklyChallengeKey(now), ids: pool, done: false, score: null };
      state.learn.weeklyChallenge = w; saveMeta("learn", 0);
    }
    var qs = w.ids.map(function (id) { return QINDEX[id]; }).filter(Boolean);
    if (!qs.length) { toast("كمّل شوية وحدات الأول عشان يتجهز لك تحدي الأسبوع"); return; }
    state.quiz = { qs: shuffle(qs), i: 0, ok: 0, ans: null, title: "🏆 تحدي الأسبوع", unit: null, weekly: true, wrong: [], right: [], pick: [] };
    state.lv = { mode: "quiz", c: state.lv.c || COURSE_ORDER[0] };
    goTab("learn"); render();
  }
  function startDailyChallenge(now) {
    var d = todaysDaily(now);
    if (!d) {
      var pool = dailyPool(); pool = shuffle(pool).slice(0, Math.min(5, pool.length));
      d = { key: now.key, ids: pool, done: false, score: null };
      state.learn.daily = d; saveMeta("learn", 0);
    }
    var qs = d.ids.map(function (id) { return QINDEX[id]; }).filter(Boolean);
    if (!qs.length) { toast("كمّل شوية وحدات الأول عشان يتجهز لك تحدي يومي"); return; }
    state.quiz = { qs: shuffle(qs), i: 0, ok: 0, ans: null, title: "تحدي اليوم", unit: null, daily: true, wrong: [], right: [], pick: [] };
    state.lv = { mode: "quiz", c: state.lv.c || COURSE_ORDER[0] };
    goTab("learn"); render();
  }


  /* ---------------- speaking challenge ---------------- */
  function speechOK() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
  function startSpeakChallenge(cid) {
    var words = shuffle(COURSES[cid].vocab.slice()).slice(0, 8);
    if (!words.length) return;
    state.spk = { c: cid, q: words, i: 0, ok: 0, result: null, listening: false };
    state.lv = { mode: "speak", c: cid }; render();
  }
  function spkListen() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var s = state.spk; if (!s || !SR) return;
    s.result = null; s.listening = true; render();
    try {
      var r = new SR(); r.lang = "en-US"; r.maxAlternatives = 1;
      r.onresult = function (e) {
        var heard = e.results[0][0].transcript;
        var target = s.q[s.i].en;
        var ok = norm(heard) === norm(target) || norm(heard).indexOf(norm(target)) !== -1;
        if (ok) s.ok++;
        s.result = { heard: heard, ok: ok }; s.listening = false; render();
      };
      r.onerror = function () { s.listening = false; s.result = { heard: "", ok: false, err: true }; render(); };
      r.onend = function () { if (s.listening) { s.listening = false; render(); } };
      r.start();
    } catch (e) { s.listening = false; render(); }
  }
  function spkNext(now) {
    var s = state.spk; if (!s) return;
    s.i++; s.result = null;
    if (s.i >= s.q.length) {
      var pct = Math.round(s.ok / s.q.length * 100);
      addXp(s.ok * 4, now);
      state.learn.speakBest = Math.max(state.learn.speakBest || 0, pct);
      saveMeta("learn", 0);
      checkAchievements(now);
    }
    render();
  }



  /* learn */
  var COURSE_ICO = { en: "cap", iso: "cert", iso14001: "leaf", iso45001: "shield", iso22000: "food", iso17025: "flask", micro: "flask" };
  function courseDone(cid) { var c = COURSES[cid]; return c.units.filter(function (u) { return (state.learn.units[cid + ":" + u.id] || {}).done; }).length; }
  function finalExamPool(cid) {
    var c = COURSES[cid]; if (!c) return [];
    var qs = [];
    (c.units || []).forEach(function (u) { (u.qs || []).forEach(function (q) { qs.push(q); }); });
    (c.examBank || []).forEach(function (q) { qs.push(q); });
    return qs;
  }
  // Phase 11 — اختبار مرحلي 🏁 كل 5 وحدات. milestoneBoundaries(cid) returns the
  // 1-based unit indexes after which a milestone sits (5, 10, 15, ...), stopping
  // one short of the very last unit so the milestone never collides with the
  // final exam's own "all units done" gate.
  // Phase 12 — a course can override the uniform "every 5" rule with its own
  // named-phase boundaries (ISO 22000's "النظام · PRPs · HACCP · 22002"), each
  // boundary labeled with the phase that just finished.
  var COURSE_PHASE_BOUNDS = {
    iso22000: { bounds: [5, 6, 11], labels: { 5: "النظام", 6: "PRPs", 11: "HACCP" } }
  };
  function milestoneBoundaries(cid) {
    var c = COURSES[cid]; if (!c || !c.units) return [];
    var ov = COURSE_PHASE_BOUNDS[cid];
    if (ov) return ov.bounds.filter(function (n) { return n < c.units.length; });
    if (c.units.length < 5) return [];
    var out = [];
    for (var n = 5; n < c.units.length; n += 5) out.push(n);
    return out;
  }
  function milestonePhaseLabel(cid, n) {
    var ov = COURSE_PHASE_BOUNDS[cid];
    return (ov && ov.labels && ov.labels[n]) || null;
  }
  function milestonePool(cid, n) {
    var c = COURSES[cid]; if (!c) return [];
    var bounds = milestoneBoundaries(cid), idx = bounds.indexOf(n);
    var from = idx > 0 ? bounds[idx - 1] : Math.max(0, n - 5);
    var qs = [];
    c.units.slice(from, n).forEach(function (u) { (u.qs || []).forEach(function (q) { qs.push(q); }); });
    if (qs.length < 15) c.units.forEach(function (u) { (u.qs || []).forEach(function (q) { if (qs.indexOf(q) === -1) qs.push(q); }); });
    return qs;
  }
  function milestoneRec(cid, n) { return (state.learn.milestones || {})[cid + ":" + n] || null; }
  function allMilestonesPassed(cid) {
    return milestoneBoundaries(cid).every(function (n) { var r = milestoneRec(cid, n); return r && r.passed; });
  }
  function startMilestoneExam(cid, n) {
    var pool = shuffle(milestonePool(cid, n).slice()); var take = Math.min(15, pool.length); if (!take) return;
    state.lv.c = cid;
    state.quiz = { qs: shuffle(pool.slice(0, take)), i: 0, ok: 0, ans: null, title: "🏁 اختبار المرحلة", unit: null, wrong: [], right: [], pick: [], milestone: { cid: cid, n: n } };
    state.lv = { mode: "quiz", c: cid }; render();
  }
  function fmtArDate(key) {
    var p = String(key).split("-").map(Number);
    if (p.length < 3) return key;
    return p[2] + " " + AR_MONTHS[p[1] - 1] + " " + p[0];
  }
  function unitOf(cid, id) { return COURSES[cid].units.filter(function (x) { return x.id === id; })[0]; }
  // Shown instead of a bare "جارٍ تحميل الكورسات…" line while loadCourses() is still
  // in flight: four placeholder rows shaped like the real course list (icon circle,
  // title line, progress bar), so the screen looks like it's about to fill in rather
  // than looking stuck or broken for the second it takes the course json to arrive.
  function coursesSkeletonHTML() {
    var row = '<div class="unit skel-row"><span class="no skel-pill" style="width:38px;height:38px;border-radius:50%"></span>' +
      '<span class="grow"><span class="skel-pill" style="display:block;width:60%;height:15px;margin-block-end:8px"></span>' +
      '<span class="skel-pill" style="display:block;width:85%;height:11px"></span>' +
      '<div class="bar" style="height:6px;margin-block-start:6px"><i class="skel-pill" style="width:35%"></i></div></span></div>';
    return '<div class="sec-h" aria-hidden="true">اختر الكورس</div><div class="units" aria-label="جارٍ تحميل الكورسات">' + row + row + row + row + "</div>";
  }
  function learnView(now) {
    var v = state.lv;
    var top = head(now);
    if (!Object.keys(COURSES).length) {
      return top + coursesSkeletonHTML();
    }
    if (v.mode === "quiz") return top + quizHTML();
    if (v.mode === "cards") return top + cardsHTML();
    if (v.mode === "speak") return top + speakHTML();
    if (v.mode === "notes") return top + notesHTML(v.c);
    if (v.mode === "mysent") return top + mySentencesHTML(v.c);
    if (v.mode === "bank") return top + bankHTML(v.c);
    if (v.mode === "unit") return top + unitFlatHTML(v.c, v.u);
    if (v.mode === "lesson") return top + lessonHTML(v.c, v.u, v.step || 0);
    if (v.mode === "dialogue") return top + dialogueHTML(v.c, v.u);
    if (v.mode === "reading") return top + readingHTML(v.c, v.u);
    if (v.mode === "home") return top + courseHomeHTML(v.c, now);
    if (v.mode === "cert") return top + certHTML(v.c);
    if (v.mode === "weak") return top + weakHTML(now);
    if (v.mode === "weakdrill") return top + weakDrillHTML();
    // courses select
    var cards = ALLOWED_COURSES.map(function (cid) {
      var c = COURSES[cid]; if (!c) return "";
      var done = courseDone(cid), cpct = c.units.length ? Math.round(done / c.units.length * 100) : 0;
      return '<button class="unit" data-act="course-open" data-c="' + cid + '"><span class="no">' + ico(COURSE_ICO[cid]) + '</span><span class="grow"><b>' + esc(c.title) + '</b><br><span class="muted" style="font-size:13px">' + esc(c.desc) + ' · ' + done + "/" + c.units.length + ' وحدة مكتملة</span><div class="bar" style="height:6px;margin-block-start:6px"><i style="width:' + cpct + "%\"></i></div></span></button>";
    }).join("");
    var L = level(), wc = weakCount();
    return top +
      '<div class="card"><div class="row between"><h2>المستوى <span class="num">' + L.lv + '</span></h2><span class="chip"><span class="num">' + L.xp + '</span> نقطة</span></div>' +
      '<div class="bar amber"><i style="width:' + L.pct + '%"></i></div><p class="muted" style="font-size:14px;margin-block-start:6px">تبقى <span class="num">' + L.need + '</span> نقطة للمستوى التالي' + (studyStreak(now) ? " · مذاكرة متواصلة " + studyStreak(now) + " يوم" : "") + "</p>" +
      '<button class="btn alt" style="margin-block-start:10px;width:100%;color:var(--weak)" data-act="weak-open">🎯 نقاط ضعفي' + (wc ? ' <span class="chip num">' + wc + "</span>" : "") + "</button></div>" +
      badgesHTML() +
      '<div class="sec-h">اختر الكورس</div><div class="units">' + cards + "</div>";
  }
  function badgesHTML() {
    var earned = ACHIEVEMENTS.filter(function (b) { return state.learn.badges[b.id]; }).length;
    var row = ACHIEVEMENTS.map(function (b) {
      var on = !!state.learn.badges[b.id];
      return '<button class="badge' + (on ? " on" : "") + '" data-act="badge-info" data-b="' + b.id + '" aria-label="' + esc(b.title) + '"><span class="ic">' + ico(on ? b.icon : "lock") + "</span><small>" + esc(b.title) + "</small></button>";
    }).join("");
    return '<div class="sec-h">الإنجازات · <span class="num">' + earned + "/" + ACHIEVEMENTS.length + '</span></div><div class="badgerow">' + row + "</div>";
  }
  // Phase 10 — "جملي" (my sentences): a plain, append-only place to keep every
  // self-produced English sentence, fed from the lesson's production step, the
  // dialogue "اكتب عن نفسك" prompt, and this screen's own box.
  function saveMySentence(cid, text, now) {
    text = String(text || "").trim(); if (!text) return;
    now = now || nowR();
    if (!state.learn.mySentences) state.learn.mySentences = [];
    state.learn.mySentences.push({ id: "ms" + now.ms + "_" + Math.floor(Math.random() * 1000), cid: cid || null, text: text, ts: now.ms });
    saveMeta("learn", 400);
  }
  function mySentencesHTML(cid) {
    var list = (state.learn.mySentences || []).filter(function (s) { return s.cid === cid; }).slice().sort(function (a, b) { return b.ts - a.ts; });
    var rows = list.length ? list.map(function (s) {
      return '<div class="card" style="margin-block-end:8px"><div class="row between" style="align-items:flex-start"><p class="en" style="margin:0;flex:1" dir="ltr">' + esc(s.text) + "</p>" + spkBtn(s.text) + "</div>" +
        '<small class="muted">' + greg(keyOf(new Date(s.ts))) + "</small></div>";
    }).join("") : '<p class="muted" style="padding:10px 0">لسه مكتبتش جمل. اكتب أول جملة بتاعتك فوق — ممكن تكون عنك أو عن يومك.</p>';
    return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع للكورس</button>' +
      '<div class="card"><h2 style="margin:0 0 6px">📝 جملي</h2><p class="muted" style="font-size:13px;margin:0 0 10px">اكتب جملة إنجليزي عن نفسك أو يومك، وهتفضل محفوظة هنا تقدر ترجع لها.</p>' +
      '<textarea class="inp" id="msDraft" dir="ltr" rows="2" placeholder="e.g. I woke up early today..."></textarea>' +
      '<button class="btn sm" style="margin-block-start:8px" data-act="ms-save" data-c="' + cid + '">حفظ</button></div>' +
      '<div class="sec-h">المحفوظ (' + list.length + ")</div>" + rows;
  }
  function noteCardHTML(cid, n) {
    var rows = n.rows.map(function (r) {
      return '<div class="nrow"><b>' + fmtEn(r.label) + "</b><span>" + fmtEn(r.ex) + "</span></div>";
    }).join("");
    return '<div class="card notecard"><div class="row between"><h3>' + esc(n.title) + '</h3><button class="del" data-act="note-del" data-c="' + cid + '" data-id="' + n.id + '" aria-label="حذف">' + ico("trash") + "</button></div>" +
      '<div class="ntable">' + rows + "</div></div>";
  }
  function notesHTML(cid) {
    var c = COURSES[cid];
    var list = (state.learn.notes[cid] || []).slice().sort(function (a, b) { return b.ts - a.ts; });
    var cardsOut = list.length ? list.map(function (n) { return noteCardHTML(cid, n); }).join("") :
      '<p class="muted" style="font-size:14px;padding:6px 0">لسه مفيش قاعدة محفوظة هنا. ضيف أول قاعدة من النموذج فوق.</p>';
    if (!state.ndraft) state.ndraft = freshDraft();
    var d = state.ndraft;
    var rowsForm = d.rows.map(function (r, i) {
      return '<div class="ndrow">' +
        '<input class="inp" id="ndLabel' + i + '" placeholder="البند، زي: he / she / it" value="' + esc(r.label) + '">' +
        '<input class="inp" id="ndEx' + i + '" placeholder="مثال: She has a car." value="' + esc(r.ex) + '">' +
        (d.rows.length > 1 ? '<button class="ndrm" data-act="note-row-del" data-i="' + i + '" aria-label="حذف الصف">' + ico("trash") + "</button>" : '<span class="ndrm-ph"></span>') +
        "</div>";
    }).join("");
    return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع للكورس</button>' +
      '<div class="card"><h2><span class="hico">' + ico("pin") + "</span> المهم</h2>" +
      '<p class="muted" style="font-size:14px;margin-block-end:12px">قاعدة جديدة في ' + esc(c.title) + '؟ اكتب عنوانها، وتحت كل بند فيها مع مثاله — زي كل ضمير ومثاله لوحده، مش سطر واحد مخلوط.</p>' +
      '<input class="inp" id="ndTitle" placeholder="عنوان القاعدة، زي: ضمائر الفاعل" value="' + esc(d.title) + '" style="margin-block-end:10px">' +
      '<div class="ndrows">' + rowsForm + "</div>" +
      '<button class="linkbtn" data-act="note-row-add" style="margin-block-start:4px">+ إضافة بند</button>' +
      '<button class="btn sm" data-act="note-add" data-c="' + cid + '" style="margin-block-start:10px;width:100%">حفظ القاعدة</button></div>' +
      '<div class="sec-h">اللي محفوظ (' + list.length + ")</div>" + cardsOut;
  }
  var LVL_LBL = { 0: "الكل", 1: "مبتدئ", 2: "متوسط", 3: "متقدم" };
  function bankHTML(cid) {
    var c = COURSES[cid], vocab = c.vocab || [];
    var q = norm(state.bankQ || ""), lvl = state.bankLvl || 0, onlyNew = !!state.bankNew;
    var known = {};
    vocab.forEach(function (v) { var cc = state.learn.cards[v.id]; known[v.id] = !!cc && cardStage(cc) >= 3; });
    var knownCount = vocab.filter(function (v) { return known[v.id]; }).length;
    var list = vocab.filter(function (v) {
      if (lvl && (v.lvl || 1) !== lvl) return false;
      if (onlyNew && known[v.id]) return false;
      if (q && v.en.toLowerCase().indexOf(q) === -1 && v.ar.indexOf(state.bankQ || "") === -1) return false;
      return true;
    });
    var lvlChips = '<div class="row wrapr" style="margin-block-start:8px">' + [0, 1, 2, 3].map(function (l) {
      return '<button class="chipbtn' + (lvl === l ? " on" : "") + '" data-act="bank-lvl" data-c="' + cid + '" data-lvl="' + l + '">' + LVL_LBL[l] + "</button>";
    }).join("") + '<button class="chipbtn' + (onlyNew ? " on" : "") + '" data-act="bank-new" data-c="' + cid + '">لسه ما حفظتهاش</button></div>';
    var rows = list.length ? list.map(function (v) {
      return '<div class="bankrow' + (known[v.id] ? " known" : "") + '">' +
        '<div class="bw">' + (v.emoji ? '<span style="font-size:18px;margin-inline-end:4px">' + v.emoji + "</span>" : "") + '<span class="en">' + esc(v.en) + "</span>" + spkBtn(v.ex || v.en) + "</div>" +
        '<div class="ar">' + esc(v.ar) + "</div>" +
        (v.ex ? '<div class="bex">' + fmtEn(v.ex) + "</div>" : "") +
        (v.exAr ? '<div class="bex" style="direction:rtl;text-align:start">' + esc(v.exAr) + "</div>" : "") +
        '<button class="bankchk' + (known[v.id] ? " on" : "") + '" data-act="bank-toggle" data-id="' + v.id + '">' + (known[v.id] ? "✓ متعلّمة" : "علّمها كمعروفة") + "</button>" +
        (state.learn.weak[v.id] ? "" : '<button class="linkbtn" style="margin-block-start:4px" data-act="weak-add" data-id="' + v.id + '" data-kind="word" data-cid="' + (v.c || cid) + '">🎯 ضيفها لنقاط ضعفي</button>') +
        "</div>";
    }).join("") : '<div class="bankempty">مفيش كلمات مطابقة للبحث أو الفلتر.</div>';
    return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع للكورس</button>' +
      '<div class="card"><div class="bankhead"><h2><span class="hico">' + ico("book") + "</span> بنك الكلمات</h2><span class=\"chip num\">" + knownCount + "/" + vocab.length + "</span></div>" +
      '<p class="muted" style="font-size:14px;margin-block-end:4px">كل كلمات ' + esc(c.title) + ' في مكان واحد، تقدر ترجع لها في أي وقت — سواء دلوقتي أو بعد ما تحفظها بأسابيع.</p>' +
      '<input class="inp" id="bankq" dir="rtl" placeholder="دور على كلمة بالإنجليزي أو العربي…" value="' + esc(state.bankQ || "") + '" style="margin-block-start:8px">' +
      lvlChips + "</div>" +
      '<div class="sec-h">الكلمات (' + list.length + ")</div>" + rows;
  }
  function finalExamCardHTML(cid, c, done) {
    var total = c.units.length, pool = finalExamPool(cid);
    var rec = (state.learn.exam || {})[cid];
    var ms = milestoneBoundaries(cid), msLeft = ms.filter(function (n) { var r = milestoneRec(cid, n); return !r || !r.passed; }).length;
    var locked = done < total || msLeft > 0;
    var info = locked
      ? (done < total
        ? '<p class="muted" style="font-size:14px;margin-block-start:4px">أكمل كل وحدات الكورس (' + done + "/" + total + ') لفتح الامتحان النهائي</p>'
        : '<p class="muted" style="font-size:14px;margin-block-start:4px">نجّح في ' + msLeft + (msLeft === 1 ? " اختبار مرحلة 🏁 لسه" : " اختبارات مرحلة 🏁 لسه") + ' قبل الامتحان النهائي</p>')
      : '<p class="muted" style="font-size:14px;margin-block-start:4px">' + Math.min(30, pool.length) + ' سؤال من كل الكورس · النجاح من 80%' + (rec ? " · أفضل نتيجة <span class=\"num\">" + rec.best + "%</span>" : "") + "</p>";
    var actions = locked ? "" :
      '<div class="row wrapr">' +
      (rec && rec.passed ? '<button class="btn alt" data-act="cert-open" data-c="' + cid + '">' + ico("cert") + " شهادتي</button>" : "") +
      '<button class="btn" data-act="final-exam" data-c="' + cid + '">' + (rec ? "أعد الامتحان" : "ابدأ الامتحان") + "</button>" +
      "</div>";
    return '<div class="card" style="margin-block-start:14px"><div class="row between"><div><h3 style="margin:0">الامتحان النهائي</h3>' + info + "</div>" + actions + "</div></div>";
  }
  function courseHomeHTML(cid, now) {
    var c = COURSES[cid], lvl = state.cardLvl || 0, due = dueCards(now, cid, lvl).length, ms = weakList("all").filter(function (w) { return w.cid === cid; }).length, done = courseDone(cid);
    var notesCount = (state.learn.notes[cid] || []).length;
    var mySentCount = (state.learn.mySentences || []).filter(function (s) { return s.cid === cid; }).length;
    var lvlChips = c.vocab && c.vocab.length ? '<div class="row wrapr" style="margin-block-start:8px">' + [0, 1, 2, 3].map(function (l) {
      return '<button class="chipbtn' + (lvl === l ? " on" : "") + '" data-act="cardlvl" data-lvl="' + l + '">' + LVL_LBL[l] + "</button>";
    }).join("") + "</div>" : "";
    return '<button class="linkbtn" data-act="lcourses">← الكورسات</button>' +
      '<div class="card"><h3>المراجعة اليومية</h3><div class="row wrapr">' +
      '<button class="btn" data-act="cards" data-c="' + cid + '"' + (due ? "" : " disabled") + ">كروت المفردات (" + due + ')</button>' +
      '<button class="btn alt" style="color:var(--weak)" data-act="weak-open">🎯 نقاط ضعفي' + (ms ? ' <span class="chip num">' + ms + "</span>" : "") + "</button>" +
      (c.vocab && c.vocab.length ? '<button class="btn alt" data-act="speak-start" data-c="' + cid + '">' + ico("vol") + " تحدي النطق</button>" : "") +
      (c.vocab && c.vocab.length ? '<button class="btn alt" data-act="bank-open" data-c="' + cid + '">' + ico("book") + " بنك الكلمات <span class=\"chip num\">" + c.vocab.length + "</span></button>" : "") +
      '<button class="btn alt" data-act="notes-open" data-c="' + cid + '">' + ico("pin") + " المهم" + (notesCount ? ' <span class="chip num">' + notesCount + "</span>" : "") + "</button>" +
      '<button class="btn alt" data-act="mysent-open" data-c="' + cid + '">📝 جملي' + (mySentCount ? ' <span class="chip num">' + mySentCount + "</span>" : "") + "</button>" +
      (c.examBank && c.examBank.length ? '<button class="btn alt" data-act="exambank" data-c="' + cid + '">' + ico("cap") + " بنك أسئلة آيزو <span class=\"chip num\">" + c.examBank.length + "</span></button>" : "") +
      "</div>" + lvlChips + "</div>" +
      finalExamCardHTML(cid, c, done) +
      '<div class="row between" style="margin-block:14px 4px"><h2>' + esc(c.title) + '</h2><span class="chip num">' + done + "/" + c.units.length + "</span></div>" +
      pathHTML(cid, c.units, done);
  }
  // Phase 11 — خريطة الكورس gets a 🏁 milestone node interleaved every 5 units,
  // on top of the regular unit nodes; a separate rowN counter keeps the l/r zigzag
  // alternating smoothly across both node kinds instead of resetting per unit.
  // Phase 11 — "خريطة الكورس... تفتح لوحدها على الوحدة الجاية": after the path
  // renders, scroll its current node into the middle of the view instead of
  // leaving the person to scroll down and find it themselves.
  function scrollToCurPathNode() {
    setTimeout(function () {
      var el = document.querySelector(".path-cur");
      if (el) el.scrollIntoView({ block: "center" });
    }, 60);
  }
  function milestoneRowHTML(cid, n, done, rowN) {
    var rec = milestoneRec(cid, n), locked = done < n;
    var isCur = !locked && !(rec && rec.passed);
    var side = rowN % 2 === 0 ? "l" : "r";
    var cls = "pnode milestone" + (rec && rec.passed ? " done" : "") + (isCur ? " cur" : "") + (locked ? " lock" : "");
    var inner = locked ? ico("lock") : (rec && rec.passed ? "✓" : "🏁");
    var act = locked ? ' data-act="locked-unit" data-need="' + n + '"' : ' data-act="milestone-exam" data-c="' + cid + '" data-n="' + n + '"';
    var sub = locked ? "يفتح بعد إكمال " + n + " وحدات" : (rec ? "أفضل نتيجة " + rec.best + "%" : "15 سؤال · النجاح 75%");
    var lbl = milestonePhaseLabel(cid, n);
    var title = lbl ? "🏁 اختبار نهاية مرحلة «" + lbl + "»" : "🏁 اختبار المرحلة";
    return '<div class="prow ' + side + '"><button class="' + cls + '"' + act + '>' + inner + '</button><div class="plbl">' + title + '<small>' + esc(sub) + '</small></div></div>';
  }
  function pathHTML(cid, units, done) {
    var curPicked = false, rowN = 0, out = [], bounds = milestoneBoundaries(cid);
    units.forEach(function (u, idx) {
      var p = state.learn.units[cid + ":" + u.id] || {};
      var locked = u.unlockAfter && done < u.unlockAfter;
      var isCur = !locked && !p.done && !curPicked;
      if (isCur) curPicked = true;
      var side = rowN % 2 === 0 ? "l" : "r"; rowN++;
      var cls = "pnode" + (p.done ? " done" : "") + (isCur ? " cur" : "") + (locked ? " lock" : "") + (u.kind ? " bonus" : "");
      var inner = locked ? ico("lock") : (p.done ? "✓" : (u.kind === "dialogue" ? ico("chat") : esc(u.icon)));
      var act = locked ? ' data-act="locked-unit" data-need="' + u.unlockAfter + '"' : ' data-act="unit-open" data-c="' + cid + '" data-u="' + u.id + '"';
      var sub = locked ? "يفتح بعد إكمال " + u.unlockAfter + " وحدات" : (p.best != null ? "أفضل نتيجة " + p.best + "%" : (isCur ? "التالي" : "لم تبدأ بعد"));
      out.push('<div class="prow ' + side + (isCur ? " path-cur" : "") + '"><button class="' + cls + '"' + act + '>' + inner + '</button><div class="plbl">' + esc(u.title) + '<small>' + esc(sub) + '</small></div></div>');
      if (bounds.indexOf(idx + 1) !== -1) { out.push(milestoneRowHTML(cid, idx + 1, done, rowN)); rowN++; }
    });
    var rows = out.join("");
    return '<div class="path">' + rows + "</div>";
  }
  function lessonSteps(u) { return u.pts; }
  // Phase 9 — الدرس التفاعلي: "اتعلم ← اتأكد ← طبّق" instead of slides + a next-only
  // button. Screens are rebuilt fresh every render from u.pts/u.qs (stateless) plus
  // state.lv.retry (the only bit of lesson-session state) — see lessonScreens().
  function lessonScreens(cid, id, u) {
    var pts = u.pts || [], qs = u.qs || [], used = {};
    function pickQuick(idx) {
      for (var k = 0; k < qs.length; k++) { if (!used[k] && qs[k].pt === idx + 1) { used[k] = true; return qs[k]; } }
      if (!used[idx] && qs[idx]) { used[idx] = true; return qs[idx]; }
      return null;
    }
    var chunk1 = pts.slice(0, 2), chunk2 = pts.slice(2, 4), chunk3 = pts.slice(4);
    var q1 = pickQuick(0), q2 = pickQuick(1);
    var screens = [{ type: "intro" }], lastPointsIdx = 0;
    if (chunk1.length) { screens.push({ type: "points", items: chunk1, from: 0 }); lastPointsIdx = screens.length - 1; }
    if (q1) screens.push({ type: "quiz", q: q1, backTo: lastPointsIdx });
    if (chunk2.length) { screens.push({ type: "points", items: chunk2, from: 2 }); lastPointsIdx = screens.length - 1; }
    if (q2) screens.push({ type: "quiz", q: q2, backTo: lastPointsIdx });
    if (chunk3.length) { screens.push({ type: "points", items: chunk3, from: 4 }); lastPointsIdx = screens.length - 1; }
    var retry = (state.lv.retry || []).filter(Boolean);
    if (retry.length) screens.push({ type: "retry", q: retry[0] });
    var prodQ = null;
    for (var k2 = 0; k2 < qs.length; k2++) { if (!used[k2]) { prodQ = qs[k2]; used[k2] = true; break; } }
    screens.push({ type: "production", q: prodQ });
    screens.push({ type: "outro" });
    return screens;
  }
  function lessonNavBtn(act, label, k) {
    return '<div class="lnav lnav-sticky"><button class="btn" data-act="' + act + '"' + (k ? ' data-k="' + k + '"' : "") + ">" + label + "</button></div>";
  }
  function lessonQuizBody(q, a, kind) {
    var arQ = /[؀-ۿ]/.test(q.q), body;
    if (q.t === "mcq") {
      body = '<div class="opts">' + q.o.map(function (o) {
        var c = "opt"; if (a) { if (o === q.a) c += " ok"; else if (o === a.sel) c += " bad"; }
        return '<button class="' + c + '" data-act="lesson-quiz-pick" data-v="' + esc(o) + '" data-k="' + kind + '"' + (a ? " disabled" : "") + ">" + esc(o) + "</button>";
      }).join("") + "</div>";
    } else {
      body = '<div class="opts"><input class="inp" id="lessonQA" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="اكتب الإجابة" value="' + (a ? esc(a.sel) : "") + '"' + (a ? " disabled" : "") + ">" +
        (a ? "" : '<button class="btn" data-act="lesson-quiz-submit" data-k="' + kind + '">تحقق</button>') + "</div>";
    }
    var correctTxt = Array.isArray(q.a) ? q.a[0] : q.a;
    var fb = a ? '<div class="fb ' + (a.ok ? "ok" : "bad") + '">' + (a.ok ? "✓ صحيح" : "✕ الصواب: <span class=\"en\">" + esc(correctTxt) + "</span>" + spkBtn(correctTxt)) + "</div>" +
      (q.why ? '<div class="rule"><b>📘 القاعدة:</b> ' + esc(q.why) + "</div>" : "") : "";
    var qRow = '<p class="qtext' + (arQ ? " ar" : "") + '">' + esc(q.q) + "</p>";
    if (!arQ) qRow = '<div class="qtext-row"><p class="qtext" style="margin:0">' + esc(q.q) + "</p>" + spkBtn(q.q.replace(/___/g, "")) + "</div>";
    qRow = questionStemVisual(q) + qRow;
    return '<div class="lstep-card"><span class="tag">' + (kind === "retry" ? "🔁 نسألك تاني" : "❓ سؤال سريع") + "</span>" + qRow + body + fb + "</div>";
  }
  function lessonProdBody(q, a) {
    var prompt = (q && q.q) || "اكتب جملة قصيرة بتستخدم فيها اللي اتعلمته في الدرس ده.";
    var graded = !!(q && q.a);
    if (a) {
      var fb = graded
        ? '<div class="fb ' + (a.ok ? "ok" : "bad") + '">' + (a.ok ? "✓ تمام!" : "✕ جرّب تقرب من: <span class=\"en\">" + esc(Array.isArray(q.a) ? q.a[0] : q.a) + "</span>") + "</div>"
        : '<div class="fb ok">✓ تمام، كتبت: <span class="en">' + esc(a.sel) + "</span></div>";
      return '<div class="lstep-card"><span class="tag">✍️ سؤال إنتاج</span><p class="qtext">' + esc(prompt) + "</p>" + fb + "</div>";
    }
    return '<div class="lstep-card"><span class="tag">✍️ سؤال إنتاج</span><p class="qtext">' + esc(prompt) + '</p>' +
      '<div class="opts"><input class="inp" id="lessonProd" dir="ltr" autocomplete="off" spellcheck="false" placeholder="اكتب جملتك هنا"><button class="btn" data-act="lesson-prod-submit">تحقق</button></div></div>';
  }
  function lessonHTML(cid, id, step) {
    var u = unitOf(cid, id), p = state.learn.units[cid + ":" + id] || {};
    if (!state.lv.retry) state.lv.retry = [];
    var screens = lessonScreens(cid, id, u), n = screens.length, i = Math.max(0, Math.min(n - 1, step || 0));
    var sc = screens[i], a = state.lv.ans;
    var pct = n > 1 ? Math.round(i / (n - 1) * 100) : 100;
    var body, nav;
    if (sc.type === "intro") {
      body = '<div class="lstep-card"><p class="muted" style="margin:0">يلا نبدأ درس <b>' + esc(u.title) + "</b> سوا، خطوة خطوة.</p></div>";
      nav = lessonNavBtn("lesson-next", "يلا نبدأ");
    } else if (sc.type === "points") {
      body = sc.items.map(function (t, k) {
        var absIdx = sc.from + k, txt = ptPlainText(t), pid = cid + ":" + id + ":p" + absIdx;
        return '<div class="lstep-card" style="margin-block-start:10px"><div class="txt">' + renderPt(t) + "</div>" +
          (txt && !state.learn.weak[pid] ? '<button class="linkbtn" style="margin-block-start:6px" data-act="weak-add-point" data-cid="' + cid + '" data-pid="' + pid + '" data-text="' + esc(txt) + '">🎯 ضيفها لنقاط ضعفي</button>' : "") + "</div>";
      }).join("");
      nav = lessonNavBtn("lesson-next", "التالي");
    } else if (sc.type === "quiz" || sc.type === "retry") {
      var q = (sc.type === "retry" && sc.q.alt) ? Object.assign({}, sc.q, { q: sc.q.alt }) : sc.q;
      body = lessonQuizBody(q, a, sc.type);
      if (!a) nav = "";
      else if (a.ok) nav = lessonNavBtn(sc.type === "retry" ? "lesson-retry-next" : "lesson-next", "التالي");
      else nav = '<div class="lnav lnav-sticky">' +
        (sc.type === "quiz" ? '<button class="btn alt" data-act="lesson-jump" data-step="' + sc.backTo + '">ارجع للنقطة</button>' : "") +
        '<button class="btn" data-act="' + (sc.type === "retry" ? "lesson-retry-next" : "lesson-next") + '">التالي</button></div>';
    } else if (sc.type === "production") {
      body = lessonProdBody(sc.q, a);
      nav = a ? lessonNavBtn("lesson-next", "التالي") : "";
    } else {
      body = '<div class="lstep-card"><p class="muted" style="margin:0">🎉 خلّصت درس <b>' + esc(u.title) + "</b>! جاهز للتدريب الكامل؟</p></div>";
      nav = '<div class="lnav lnav-sticky"><button class="btn" data-act="quiz" data-c="' + cid + '" data-u="' + id + '">ابدأ التدريب (' + u.qs.length + ' أسئلة)</button></div>';
    }
    return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع للكورس</button>' +
      '<div class="card"><h2 style="margin:0 0 10px">' + esc(u.icon + ". " + u.title) + '</h2><div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="lseq">' + body + "</div></div>" + nav +
      '<button class="linkbtn" style="margin-block-start:10px" data-act="unit-flat" data-c="' + cid + '" data-u="' + id + '">عرض كل النقاط دفعة واحدة</button>' +
      (p.best != null ? '<p class="muted" style="font-size:14px;margin-block-start:8px">أفضل نتيجة سابقة: ' + p.best + "%</p>" : "") +
      (u.reading ? '<button class="btn alt" style="margin-block-start:10px" data-act="reading-open" data-c="' + cid + '" data-u="' + id + '">📖 فقرة قراءة · ' + esc(LVL_LBL[u.reading.lvl]) + '</button>' : "");
  }
  function lessonQuizAnswer(val, kind) {
    var u = unitOf(state.lv.c, state.lv.u); if (!u) return;
    var screens = lessonScreens(state.lv.c, state.lv.u, u);
    var sc = screens[Math.max(0, Math.min(screens.length - 1, state.lv.step || 0))];
    if (!sc || (sc.type !== "quiz" && sc.type !== "retry") || state.lv.ans) return;
    var q = sc.q, ok;
    if (q.t === "mcq") ok = val === q.a;
    else { if (!norm(val)) return; ok = q.a.map(norm).indexOf(norm(val)) !== -1; }
    state.lv.ans = { sel: val, ok: ok };
    if (!ok && sc.type === "quiz") {
      if (!state.lv.retry) state.lv.retry = [];
      if (!state.lv.retry.some(function (r) { return r.id === q.id; })) state.lv.retry.push(q);
    }
    render();
  }
  function lessonProdAnswer() {
    var inp = $("#lessonProd"); if (!inp) return;
    var v = inp.value.trim(); if (!v) return;
    var u = unitOf(state.lv.c, state.lv.u); if (!u) return;
    var screens = lessonScreens(state.lv.c, state.lv.u, u);
    var sc = screens[Math.max(0, Math.min(screens.length - 1, state.lv.step || 0))];
    var q = sc && sc.q, ok = true;
    if (q && q.a) { var correctList = Array.isArray(q.a) ? q.a : [q.a]; ok = correctList.map(norm).indexOf(norm(v)) !== -1; }
    state.lv.ans = { sel: v, ok: ok };
    if (!q || !q.a) saveMySentence(state.lv.c, v); // free-production (no fixed answer) -> keep it in "جملي"
    addXp(5, nowR()); saveMeta("learn", 1000);
    render();
  }
  function unitFlatHTML(cid, id) {
    var u = unitOf(cid, id), p = state.learn.units[cid + ":" + id] || {};
    return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع للكورس</button><div class="card"><h2>' + esc(u.icon + ". " + u.title) + '</h2><ul class="pts">' +
      u.pts.map(function (t) { return "<li>" + renderPt(t) + "</li>"; }).join("") + "</ul>" +
      '<button class="btn" data-act="quiz" data-c="' + cid + '" data-u="' + id + '">ابدأ التدريب (' + u.qs.length + " أسئلة)</button>" +
      (p.best != null ? '<p class="muted" style="font-size:14px;margin-block-start:8px">أفضل نتيجة: ' + p.best + "%</p>" : "") +
      (u.reading ? '<button class="btn alt" style="margin-block-start:10px" data-act="reading-open" data-c="' + cid + '" data-u="' + id + '">📖 فقرة قراءة · ' + esc(LVL_LBL[u.reading.lvl]) + '</button>' : "") + "</div>";
  }
  function readingHTML(cid, id) {
    var u = unitOf(cid, id), r = u.reading;
    if (!r) return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع للكورس</button><div class="card">لا توجد فقرة قراءة لهذه الوحدة.</div>';
    var v = state.lv, tr = !!v.tr;
    var fullText = r.sentences.map(function (s) { return s.en; }).join(" ");
    var rows = r.sentences.map(function (s) {
      return '<div style="margin-block-end:14px;padding-block-end:12px;border-block-end:1px dashed var(--line)">' +
        '<div class="row" style="align-items:flex-start;gap:8px"><p class="en" style="margin:0;flex:1">' + esc(s.en) + "</p>" + spkBtn(s.en) + "</div>" +
        (tr ? '<p class="muted" style="direction:rtl;margin:6px 0 0">' + esc(s.ar) + "</p>" : "") +
        "</div>";
    }).join("");
    return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع للكورس</button><div class="card">' +
      '<div class="row between" style="align-items:center"><h2 style="margin:0">' + esc(r.title) + '</h2><span class="muted" style="font-size:12.5px">' + esc(LVL_LBL[r.lvl]) + "</span></div>" +
      '<div class="row wrapr" style="gap:8px;margin-block:10px">' +
      '<button class="btn sm" data-act="speak" data-txt="' + esc(fullText) + '">🔊 استمع للفقرة كاملة</button>' +
      '<button class="btn sm alt" data-act="reading-tr" data-c="' + cid + '" data-u="' + id + '">' + (tr ? "إخفاء الترجمة" : "إظهار الترجمة") + "</button>" +
      "</div>" +
      '<div style="margin-block-start:6px">' + rows + "</div>" +
      '<button class="btn" data-act="quiz" data-c="' + cid + '" data-u="' + id + '">ابدأ التدريب (' + u.qs.length + " أسئلة)</button>" +
      "</div>";
  }
  // Phase 10: shadowing (🎤 ردّد ورايا) per dialogue line, using the same 80%-overlap
  // speech scoring as the vocab cards' "انطقها" type; state.lv.shadow is the only
  // ephemeral bit, keyed by bubble index, and simply disappears when the dialogue
  // is left (state.lv is replaced wholesale on exit).
  function shadowMic(i, txt) {
    if (!speechOK()) return;
    if (!state.lv.shadow) state.lv.shadow = {};
    if (state.lv.shadow[i] && state.lv.shadow[i].listening) return;
    state.lv.shadow[i] = { listening: true }; render();
    recognizeOnce(function (res) {
      if (res.err) { state.lv.shadow[i] = { err: true }; render(); return; }
      state.lv.shadow[i] = { heard: res.heard, ok: speechScore(res.heard, txt) >= 0.8 };
      render();
    });
  }
  function dialogueHTML(cid, id) {
    var u = unitOf(cid, id), p = state.learn.units[cid + ":" + id] || {};
    if (!state.lv.shadow) state.lv.shadow = {};
    var bubbles = u.dialogue.map(function (t, idx) {
      var sh = state.lv.shadow[idx];
      var shadowRow = !speechOK() ? "" : '<div class="row wrapr" style="margin-block-start:4px;align-items:center;gap:8px">' +
        '<button class="linkbtn" data-act="shadow-mic" data-i="' + idx + '" data-txt="' + esc(t.en) + '">' + (sh && sh.listening ? "باسمع..." : "🎤 ردّد ورايا") + "</button>" +
        (sh && !sh.listening ? ('<small class="muted">' + (sh.err ? "معرفناش نسمعك" : (sh.ok ? "✓ تمام" : "✕ سمعنا: " + esc(sh.heard))) + "</small>") : "") + "</div>";
      return '<div class="bub ' + t.who + '"><div class="en"><span>' + esc(t.en) + "</span>" + spkBtn(t.en) + '</div><div class="ar">' + esc(t.ar) + "</div>" + shadowRow + "</div>";
    }).join("");
    return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع للكورس</button><div class="card"><h2>' + esc(u.title) + '</h2>' +
      '<p class="muted" style="font-size:14px;margin-block-end:6px">' + fmtEn(u.pts[0]) + '</p>' +
      '<div class="chat">' + bubbles + '</div></div>' +
      '<div class="card" style="margin-block:12px"><h3 style="margin:0 0 6px">اكتب عن نفسك</h3><p class="muted" style="font-size:13px;margin:0 0 8px">جرّب تكتب جملة زي اللي فوق، بس عن نفسك.</p>' +
      '<textarea class="inp" id="dlgDraft" dir="ltr" rows="2" placeholder="Write a sentence about yourself..."></textarea>' +
      '<button class="btn sm" style="margin-block-start:8px" data-act="dlg-save-sentence" data-c="' + cid + '">حفظ في جملي</button></div>' +
      '<div class="card">' +
      '<button class="btn" data-act="quiz" data-c="' + cid + '" data-u="' + id + '">جاوب على أسئلة الحوار (' + u.qs.length + ' أسئلة)</button>' +
      (p.best != null ? '<p class="muted" style="font-size:14px;margin-block-start:8px">أفضل نتيجة: ' + p.best + "%</p>" : "") + "</div>";
  }
  function startQuiz(qs, title, unitId) {
    state.quiz = { qs: shuffle(qs), i: 0, ok: 0, ans: null, title: title, unit: unitId, wrong: [], right: [], pick: [] };
    state.lv = { mode: "quiz", c: state.lv.c }; render();
  }
  function orderBody(q, z, a) {
    var pick = z.pick || [];
    var strip = '<div class="ordstrip">' + (pick.length ? pick.map(function (wi, pos) {
      return '<button class="ordchip on" data-act="ord-rm" data-p="' + pos + '"' + (a ? " disabled" : "") + ">" + esc(q.words[wi]) + "</button>";
    }).join("") : '<span class="ordph">اضغط على الكلمات بالترتيب الصح</span>') + "</div>";
    var bank = '<div class="ordbank">' + q.words.map(function (w, wi) {
      var used = pick.indexOf(wi) !== -1;
      return '<button class="ordchip' + (used ? " used" : "") + '" data-act="ord-pick" data-i="' + wi + '"' + (used || a ? " disabled" : "") + ">" + esc(w) + "</button>";
    }).join("") + "</div>";
    var canSubmit = !a && pick.length === q.words.length;
    return strip + bank + (canSubmit ? '<button class="btn" data-act="ord-submit">تحقق</button>' : "");
  }
  // Phase 12 — 4 new "drawn" question types: the question stem is one of the
  // Phase 12 visual pts templates (bug card / case card / clauses map / timeline)
  // instead of plain text. Reuses the existing mcq/tf/order/match answering
  // mechanics (q.t unchanged) — only q.visual + q.vdata are new, so no quiz
  // engine logic needs touching, just the stem each question type renders.
  function questionStemVisual(q) {
    if (!q || !q.visual || !q.vdata) return "";
    var shape;
    if (q.visual === "bug") shape = Object.assign({ bug: q.vdata.bug }, q.vdata);
    else if (q.visual === "case") shape = Object.assign({ case: q.vdata.case }, q.vdata);
    else if (q.visual === "clauses") shape = { clauses: q.vdata.clauses, title: q.vdata.title };
    else if (q.visual === "timeline") shape = { timeline: q.vdata.timeline, title: q.vdata.title };
    else return "";
    return '<div class="q-visual">' + renderPt(shape) + "</div>";
  }
  function quizHTML() {
    var z = state.quiz; if (!z) return "";
    if (z.i >= z.qs.length) return quizEnd(z);
    var q = z.qs[z.i], a = z.ans, body;
    var arQ = /[؀-ۿ]/.test(q.q);
    if (q.t === "mcq" || q.t === "wrongword") {
      body = '<div class="opts">' + q.o.map(function (o, k) {
        var c = "opt"; if (a) { if (o === q.a) c += " ok"; else if (o === a.sel) c += " bad"; }
        return '<button class="' + c + '" data-act="pick" data-k="' + k + '"' + (a ? " disabled" : "") + ">" + esc(o) + "</button>";
      }).join("") + "</div>";
    } else if (q.t === "order") {
      body = orderBody(q, z, a);
    } else if (q.t === "tf") {
      body = '<div class="opts">' + [true, false].map(function (bv) {
        var c = "opt"; if (a) { if (bv === q.a) c += " ok"; else if (bv === a.sel) c += " bad"; }
        return '<button class="' + c + '" data-act="pick-tf" data-v="' + bv + '"' + (a ? " disabled" : "") + ">" + (bv ? "صح" : "غلط") + "</button>";
      }).join("") + "</div>";
    } else if (q.t === "match") {
      // Phase 10 "وصّل": click a left item then its right partner; each pair is
      // graded immediately on commit, and the question as a whole answers once
      // every pair has been attempted.
      if (!z.matchR) z.matchR = shuffle(q.pairs.map(function (_, idx) { return idx; }));
      if (!z.matchDone) z.matchDone = {};
      var leftCol = q.pairs.map(function (pp, li) {
        var d = z.matchDone[li];
        var cls = "opt" + (d ? (d.ok ? " ok" : " bad") : (z.matchSel === li ? " on" : ""));
        return '<button class="' + cls + '" data-act="match-l" data-i="' + li + '"' + (d ? " disabled" : "") + ">" + esc(pp.l) + "</button>";
      }).join("");
      var rightCol = z.matchR.map(function (ri) {
        var usedBy = Object.keys(z.matchDone).filter(function (li) { return z.matchDone[li].rightIdx === ri; })[0];
        var cls = "opt" + (usedBy != null ? (z.matchDone[usedBy].ok ? " ok" : " bad") : "");
        return '<button class="' + cls + '" data-act="match-r" data-i="' + ri + '"' + (usedBy != null ? " disabled" : "") + ">" + esc(q.pairs[ri].r) + "</button>";
      }).join("");
      body = '<div class="cmp-grid"><div class="cmp-col">' + leftCol + "</div><div class=\"cmp-col\">" + rightCol + "</div></div>";
    } else {
      body = '<div class="opts"><input class="inp" id="ans" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="اكتب الإجابة" value="' + (a ? esc(a.sel) : "") + '"' + (a ? " disabled" : "") + ">" +
        (a ? "" : '<button class="btn" data-act="submit">تحقق</button>') + "</div>";
    }
    var correctTxt = q.t === "order" ? q.a.join(" ") : (q.t === "tf" ? (q.a ? "صح" : "غلط") : (q.t === "match" ? q.pairs.map(function (pp) { return pp.l + " = " + pp.r; }).join("، ") : (Array.isArray(q.a) ? q.a[0] : q.a)));
    var fb = "";
    if (a) fb = '<div class="fb ' + (a.ok ? "ok" : "bad") + '">' + (a.ok ? "✓ صحيح" : "✕ الصواب: <span class=\"en\">" + esc(correctTxt) + "</span>" + spkBtn(correctTxt)) +
      (a.ok && z.lastCombo > 1 ? ' <span class="chip" style="color:var(--amber-deep)">⚡ ×' + z.lastCombo + "</span>" : "") + "</div>" +
      (q.why ? '<div class="rule"><b>📘 القاعدة:</b> ' + esc(q.why) + "</div>" : "") +
      '<button class="btn" data-act="qnext">' + (z.i + 1 >= z.qs.length ? "النتيجة" : "التالي") + "</button>";
    var qRow = '<p class="qtext' + (arQ ? " ar" : "") + '" style="margin-block-start:14px">' + esc(q.q) + "</p>";
    if (!arQ) qRow = '<div class="qtext-row" style="margin-block-start:14px">' + '<p class="qtext" style="margin:0">' + esc(q.q) + "</p>" + spkBtn(q.q.replace(/___/g, "")) + "</div>";
    qRow = questionStemVisual(q) + qRow;
    return '<button class="linkbtn" data-act="lhome">← إنهاء</button><div class="card"><div class="crumb"><span>' + esc(z.title) + '</span><span class="num">' + (z.i + 1) + " / " + z.qs.length + '</span></div><div class="bar"><i style="width:' + Math.round(z.i / z.qs.length * 100) + '%"></i></div>' +
      qRow + body + fb + "</div>";
  }
  // Phase 11 — "مقارنة بأفضل نتيجة سابقة", shared by every quiz-result screen.
  function prevBestLine(z, pct) {
    if (z.prevBest == null) return '<p class="muted" style="font-size:13px;margin-block-start:4px">أول مرة تحاول هنا.</p>';
    var diff = pct - z.prevBest;
    return '<p class="muted" style="font-size:13px;margin-block-start:4px">أفضل نتيجة سابقة <span class="num">' + z.prevBest + '%</span>' +
      (diff > 0 ? ' — <span style="color:var(--ok)">تحسّنت ' + diff + "%! 🎉</span>" : (diff < 0 ? " — هذه المرة أقل بـ" + (-diff) + "%" : " — نفس النتيجة")) + "</p>";
  }
  // Phase 11 — "مراجعة الأخطاء بسطر شرح (why)، زرار إضافة الغلط لنقاط الضعف".
  function mistakeReviewHTML(z) {
    if (!z.wrong.length) return "";
    var rows = z.wrong.map(function (id) {
      var q = QINDEX[id]; if (!q) return "";
      var correctTxt = q.t === "order" ? q.a.join(" ") : (q.t === "tf" ? (q.a ? "صح" : "غلط") : (q.t === "match" ? q.pairs.map(function (pp) { return pp.l + " = " + pp.r; }).join("، ") : (Array.isArray(q.a) ? q.a[0] : q.a)));
      var inWeak = !!state.learn.weak[id];
      return '<div class="card" style="margin-block-end:8px;text-align:start">' + questionStemVisual(q) + '<p class="qtext" style="margin:0 0 4px">' + esc(q.q) + '</p>' +
        '<p class="muted" style="font-size:13.5px;margin:0">الصواب: <b>' + esc(correctTxt) + "</b></p>" +
        (q.why ? '<div class="rule" style="margin-block-start:6px"><b>📘</b> ' + esc(q.why) + "</div>" : "") +
        (inWeak ? '<span class="chip" style="margin-block-start:6px;color:var(--weak)">🎯 في نقاط ضعفك</span>' : '<button class="linkbtn" style="margin-block-start:6px" data-act="weak-add" data-id="' + esc(id) + '" data-kind="q" data-cid="' + (q.c || "") + '">🎯 ضيفها لنقاط ضعفي</button>') +
        "</div>";
    }).join("");
    return '<div class="sec-h">مراجعة الأخطاء (' + z.wrong.length + ")</div>" + rows;
  }
  function quizEnd(z) {
    var pct = Math.round(z.ok / z.qs.length * 100);
    var retryC = "", retryU = "";
    if (z.unit) { var parts = z.unit.split(":"); retryC = parts[0]; retryU = parts[1]; }
    if (z.final) {
      var passed = pct >= 80, cTitle = COURSES[z.examCid] ? COURSES[z.examCid].title : "";
      return '<div class="card"><h2>' + (passed ? "🎉 نجحت في الامتحان النهائي" : "لم تصل لنسبة النجاح") + '</h2><p style="font-size:22px" class="num">' + z.ok + " / " + z.qs.length + " (" + pct + '%)</p>' + prevBestLine(z, pct) + '<p class="muted" style="margin-block:6px 12px">' +
        (passed ? "تهانينا! أنهيت كورس " + esc(cTitle) + " بنجاح. " : "النجاح يتطلب 80% على الأقل. ") + "حصلت على <span class=\"num\">" + z.gain + "</span> نقطة.</p><div class=\"row wrapr\"><button class=\"btn\" data-act=\"lhome\" data-c=\"" + z.examCid + "\">رجوع</button>" +
        (passed ? '<button class="btn alt" data-act="cert-open" data-c="' + z.examCid + '">' + ico("cert") + " الحصول على الشهادة</button>" : '<button class="btn alt" data-act="final-exam" data-c="' + z.examCid + '">أعد الامتحان</button>') +
        "</div></div>" + mistakeReviewHTML(z);
    }
    if (z.milestone) {
      var mpassed = pct >= 75;
      return '<div class="card"><h2>' + (mpassed ? "🏁 نجحت في اختبار المرحلة" : "لم تصل لنسبة النجاح") + '</h2><p style="font-size:22px" class="num">' + z.ok + " / " + z.qs.length + " (" + pct + '%)</p>' + prevBestLine(z, pct) +
        '<p class="muted" style="margin-block:6px 12px">' + (mpassed ? "النجاح 75% فأكثر. حصلت على " : "النجاح يتطلب 75% على الأقل. حصلت على ") + "<span class=\"num\">" + z.gain + "</span> نقطة.</p>" +
        '<div class="row wrapr"><button class="btn" data-act="lhome" data-c="' + z.milestone.cid + '">رجوع</button>' +
        (mpassed ? "" : '<button class="btn alt" data-act="milestone-exam" data-c="' + z.milestone.cid + '" data-n="' + z.milestone.n + '">أعد الاختبار</button>') +
        "</div></div>" + mistakeReviewHTML(z);
    }
    return '<div class="card"><h2>' + (pct >= 80 ? "ممتاز" : (pct >= 50 ? "جيد" : "كمّل وراجع")) + '</h2><p style="font-size:20px" class="num">' + z.ok + " / " + z.qs.length + " (" + pct + '%)</p>' + prevBestLine(z, pct) + '<p class="muted" style="margin-block:6px 12px">حصلت على <span class="num">' + z.gain + "</span> نقطة." + (z.comboBonus ? " (منها " + z.comboBonus + " من الكومبو ⚡)" : "") + '</p><div class="row wrapr"><button class="btn" data-act="lhome">رجوع</button>' +
      (z.unit ? '<button class="btn alt" data-act="quiz" data-c="' + retryC + '" data-u="' + retryU + '">أعد التدريب</button>' : "") + "</div></div>" + mistakeReviewHTML(z);
  }
  function finishQuiz() {
    var z = state.quiz, now = nowR(), pct = Math.round(z.ok / z.qs.length * 100), gain = z.ok * 10 + (z.comboBonus || 0);
    z.wrong.forEach(function (id) {
      state.learn.mistakes[id] = (state.learn.mistakes[id] || 0) + 1;
      // Phase 8: every wrong quiz answer feeds نقاط ضعفي — a class-session unit
      // (id "cls*") files under "class", everything else (regular unit quizzes,
      // exam bank, final exam, dialogues) files under "exam".
      var qq = QINDEX[id];
      if (qq) addWeak(id, "q", /^cls/.test(qq.u || "") ? "class" : "exam", qq.c, now);
    });
    z.right.forEach(function (id) { if (state.learn.mistakes[id]) { state.learn.mistakes[id]--; if (state.learn.mistakes[id] <= 0) delete state.learn.mistakes[id]; } });
    if (z.unit) {
      var p = state.learn.units[z.unit] || {};
      z.prevBest = p.best != null ? p.best : null; // Phase 11: for the "مقارنة بأفضل نتيجة سابقة" line
      p.best = Math.max(p.best || 0, pct); p.tries = (p.tries || 0) + 1;
      if (pct >= 80 && !p.done) { p.done = true; gain += 30; }
      p.date = now.key; // lets the admin dashboard show "last unit worked, when"
      state.learn.units[z.unit] = p;
    }
    if (z.daily && state.learn.daily) { state.learn.daily.done = true; state.learn.daily.score = pct; gain += 15; }
    // Phase 11 — weekly challenge (كل سبت): a bigger, once-per-week bonus quiz.
    if (z.weekly && state.learn.weeklyChallenge) {
      state.learn.weeklyChallenge.done = true; state.learn.weeklyChallenge.score = pct; gain += 25;
    }
    // Phase 11 — milestone (🏁) exam every 5 units: pass threshold 75%, and the
    // final exam stays locked until every milestone for the course is passed.
    if (z.milestone) {
      if (!state.learn.milestones) state.learn.milestones = {};
      var mk = z.milestone.cid + ":" + z.milestone.n;
      var mr = state.learn.milestones[mk] || { best: 0, passed: false, tries: 0 };
      z.prevBest = mr.tries ? mr.best : null;
      mr.best = Math.max(mr.best || 0, pct); mr.tries = (mr.tries || 0) + 1;
      if (pct >= 75) { if (!mr.passed) gain += 40; mr.passed = true; mr.date = now.key; }
      state.learn.milestones[mk] = mr;
    }
    if (z.final && z.examCid) {
      if (!state.learn.exam) state.learn.exam = {};
      var er = state.learn.exam[z.examCid] || { best: 0, passed: false };
      z.prevBest = er.tries ? er.best : null;
      er.best = Math.max(er.best || 0, pct); er.tries = (er.tries || 0) + 1;
      if (pct >= 80) { if (!er.passed) gain += 50; er.passed = true; er.date = now.key; }
      state.learn.exam[z.examCid] = er;
    }
    if (pct === 100 && z.qs.length >= 5) state.learn.perfectQuiz = true;
    z.gain = gain; addXp(gain, now); saveMeta("learn", 0);
    checkAchievements(now);
  }
  function certHTML(cid) {
    var c = COURSES[cid]; if (!c) return "";
    var rec = (state.learn.exam || {})[cid];
    if (!rec || !rec.passed) {
      return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع</button><div class="card"><h2>لسه معندك شهادة</h2><p class="muted" style="margin-block-start:6px">لازم تنجح في الامتحان النهائي لكورس ' + esc(c.title) + " بنسبة 80% فأكثر الأول.</p></div>";
    }
    var name = state.settings.certName || "";
    return '<button class="linkbtn" data-act="lhome" data-c="' + cid + '">← رجوع</button>' +
      '<div class="card"><h2>شهادة إتمام الكورس</h2>' +
      '<label class="field" style="margin-block-start:10px">اكتب اسمك كما يظهر في الشهادة<input id="certNameInput" type="text" value="' + esc(name) + '" placeholder="اسمك بالكامل" dir="auto"></label>' +
      '<div class="row wrapr" style="margin-block-start:8px"><button class="btn alt" data-act="cert-name-save">حفظ الاسم</button></div>' +
      '<div style="margin-block-start:16px;overflow:auto"><canvas id="certCanvas" width="1200" height="850" style="width:100%;max-width:720px;display:block;margin:0 auto;border-radius:12px;background:#fff"></canvas></div>' +
      '<div class="row wrapr" style="margin-block-start:14px">' +
      (name ? '<button class="btn" data-act="cert-download" data-c="' + cid + '">⬇ تحميل الشهادة PDF</button>' : '<p class="muted">اكتب اسمك واحفظه الأول عشان تقدر تنزّل الشهادة</p>') +
      "</div></div>";
  }
  function drawCertOnCanvas(canvas, cid) {
    var c = COURSES[cid]; if (!c || !canvas) return;
    var rec = (state.learn.exam || {})[cid] || {};
    var name = state.settings.certName || "";
    var ctx = canvas.getContext("2d"); if (!ctx) return;
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#2F8F5B"; ctx.lineWidth = 10; ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = "#CFE8DA"; ctx.lineWidth = 2; ctx.strokeRect(42, 42, W - 84, H - 84);
    ctx.textAlign = "center"; ctx.direction = "rtl";
    ctx.fillStyle = "#2F8F5B"; ctx.font = "bold 34px 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
    ctx.fillText("مسار", W / 2, 110);
    ctx.fillStyle = "#17301F"; ctx.font = "bold 48px 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
    ctx.fillText("شهادة إتمام", W / 2, 190);
    ctx.fillStyle = "#4b5b50"; ctx.font = "22px 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
    ctx.fillText("تشهد منصّة مسار بأن", W / 2, 240);
    ctx.fillStyle = "#1b4332"; ctx.font = "bold 54px 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
    ctx.fillText(name || "——", W / 2, 330);
    ctx.strokeStyle = "#2F8F5B"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - 220, 352); ctx.lineTo(W / 2 + 220, 352); ctx.stroke();
    ctx.fillStyle = "#4b5b50"; ctx.font = "24px 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
    ctx.fillText("أكمل بنجاح كورس", W / 2, 405);
    ctx.fillStyle = "#1b4332"; ctx.font = "bold 38px 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
    ctx.fillText(c.title, W / 2, 455);
    ctx.fillStyle = "#4b5b50"; ctx.font = "22px 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
    ctx.fillText("بتقدير " + (rec.best || 0) + "% في الامتحان النهائي", W / 2, 515);
    ctx.fillText("بتاريخ " + fmtArDate(rec.date || ""), W / 2, 555);
    ctx.fillStyle = "#8aa092"; ctx.font = "16px 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
    ctx.fillText("مسار · رحلتك في التعلم والعبادة", W / 2, H - 55);
  }
  function drawCertPreview(cid) {
    var canvas = document.getElementById("certCanvas"); if (!canvas) return;
    try { drawCertOnCanvas(canvas, cid); } catch (e) { }
  }
  // jspdf.umd.min.js is ~420KB — almost nobody downloads a certificate in a given
  // session, so it's not loaded until the moment it's actually needed, instead of
  // blocking every page load. Loaded once; later calls reuse window.jspdf.
  function loadJspdfScript() {
    return new Promise(function (resolve) {
      if (window.jspdf && window.jspdf.jsPDF) { resolve(true); return; }
      var done = false, finish = function (ok) { if (done) return; done = true; resolve(ok); };
      var s = document.createElement("script");
      s.src = "jspdf.umd.min.js";
      s.onload = function () { finish(!!(window.jspdf && window.jspdf.jsPDF)); };
      s.onerror = function () { finish(false); };
      document.head.appendChild(s);
      setTimeout(function () { finish(!!(window.jspdf && window.jspdf.jsPDF)); }, 8000);
    });
  }
  async function downloadCertificate(cid) {
    var c = COURSES[cid]; if (!c) return;
    try {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        toast("جارٍ تحميل مكتبة إنشاء PDF…");
        var ok = await loadJspdfScript();
        if (!ok) { toast("تعذر تحميل مكتبة إنشاء PDF"); return; }
      }
      var canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 850;
      drawCertOnCanvas(canvas, cid);
      var img = canvas.toDataURL("image/png");
      var pageW = 842, pageH = 595; // A4 landscape, in points — a normal printable page size
      var doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      doc.addImage(img, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
      doc.save("masar-certificate-" + cid + ".pdf");
    } catch (e) { toast("حصل خطأ أثناء إنشاء الشهادة"); }
  }
  // ---------------- Phase 10 — 7 vocab-card exercise types, rotating by SRS stage ----------------
  var CARD_EX_TYPES = ["choose", "listen", "flip", "type", "dictate", "complete", "speak"];
  var CARD_EX_LBL = { choose: "اختيار المعنى", listen: "اسمع واختار", flip: "الكارت العادي", type: "اكتب الكلمة", dictate: "اسمع واكتب", complete: "كمّل الجملة", speak: "🎤 انطقها" };
  function cardExType(w) {
    var cur = state.learn.cards[w.id], stage = cardStage(cur);
    var idx = Math.min(stage, CARD_EX_TYPES.length - 1);
    if (CARD_EX_TYPES[idx] === "speak" && !speechOK()) idx = CARD_EX_TYPES.length - 2; // mic unsupported -> fall back, never shown
    return CARD_EX_TYPES[idx];
  }
  function mcqFrom(list, correct, n) {
    var d = shuffle(list.filter(function (x) { return x && x !== correct; })).slice(0, n - 1);
    if (d.length < n - 1) return null;
    return shuffle([correct].concat(d));
  }
  // Phase 10 typing correction: same norm() case/whitespace tolerance everywhere,
  // plus a friendlier "قرّبت!" for a single-letter slip on a longer word, plus a
  // letter-by-letter red/green diff instead of just dumping the right answer.
  function isNearMiss(a, b) {
    a = norm(a); b = norm(b);
    if (a === b) return false;
    if (Math.max(a.length, b.length) < 5) return false;
    if (Math.abs(a.length - b.length) > 1) return false;
    var la = a.length, lb = b.length, i = 0, j = 0, diffs = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      diffs++; if (diffs > 1) return false;
      if (la === lb) { i++; j++; } else if (la > lb) i++; else j++;
    }
    return true;
  }
  function charDiffHTML(typed, correct) {
    var n = Math.max(typed.length, correct.length), out = "";
    for (var i = 0; i < n; i++) {
      var tC = typed[i]; if (tC == null) continue;
      var cC = correct[i], ok = cC != null && tC.toLowerCase() === cC.toLowerCase();
      out += '<span style="color:var(--' + (ok ? "ok" : "bad") + ')">' + esc(tC) + "</span>";
    }
    return '<span class="en" dir="ltr">' + out + "</span>";
  }
  function cardTypedFeedback(a, correct) {
    if (a.ok) return '<div class="fb ok">✓ صحيح</div>';
    var near = isNearMiss(a.sel, correct);
    return '<div class="fb bad">' + (near ? "🔸 قرّبت! " : "✕ ") + "الصح: " + charDiffHTML(a.sel, correct) + "</div>";
  }
  // Phase 10 speech scoring: word-overlap ratio, 80%+ counts as correct — looser
  // than the exact/substring check the standalone "تحدي النطق" screen still uses.
  function speechScore(heard, target) {
    var h = norm(heard).split(/\s+/).filter(Boolean), t = norm(target).split(/\s+/).filter(Boolean);
    if (!t.length) return 0;
    var matched = 0, left = h.slice();
    t.forEach(function (ww) { var idx = left.indexOf(ww); if (idx !== -1) { matched++; left.splice(idx, 1); } });
    return matched / t.length;
  }
  function recognizeOnce(cb) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { cb({ err: true, heard: "" }); return; }
    try {
      var r = new SR(); r.lang = "en-US"; r.maxAlternatives = 1;
      r.onresult = function (e) { cb({ heard: e.results[0][0].transcript }); };
      r.onerror = function () { cb({ err: true, heard: "" }); };
      r.start();
    } catch (e) { cb({ err: true, heard: "" }); }
  }
  function cardOptsHTML(opts, correct, a) {
    return '<div class="opts">' + opts.map(function (o) {
      var cls = "opt"; if (a) { if (o === correct) cls += " ok"; else if (o === a.sel) cls += " bad"; }
      return '<button class="' + cls + '" data-act="card-pick" data-v="' + esc(o) + '"' + (a ? " disabled" : "") + ">" + esc(o) + "</button>";
    }).join("") + "</div>";
  }
  function vocabPool(cid) {
    return cid && COURSES[cid] ? COURSES[cid].vocab : ALLOWED_COURSES.reduce(function (a, c) { return COURSES[c] ? a.concat(COURSES[c].vocab) : a; }, []);
  }
  function cardExBody(w, ex, c) {
    var a = c.ans;
    if (ex === "flip") {
      var emoji = w.emoji ? '<div style="font-size:40px;line-height:1.2">' + w.emoji + "</div>" : "";
      var face = c.flip ? emoji + '<div class="w" style="direction:rtl;font-size:30px">' + esc(w.ar) + '</div><div class="en muted">' + esc(w.ex) + "</div>" + (w.exAr ? '<div class="muted" style="direction:rtl">' + esc(w.exAr) + "</div>" : "") + spkBtn(w.ex || w.en) : emoji + '<div class="w">' + esc(w.en) + "</div>" + spkBtn(w.en) + '<div class="muted">اضغط لإظهار المعنى</div>';
      return '<div class="card flash" data-act="flip" role="button" tabindex="0">' + face + "</div>";
    }
    if (ex === "choose") {
      var optsAr = mcqFrom(vocabPool(w.c).map(function (v) { return v.ar; }), w.ar, 4) || mcqFrom(vocabPool(null).map(function (v) { return v.ar; }), w.ar, 4);
      if (!optsAr) return cardExBody(w, "flip", c);
      return '<div class="lstep-card">' + (w.emoji ? '<div style="font-size:32px">' + w.emoji + "</div>" : "") + '<div class="qtext-row"><p class="qtext" style="margin:0">ايه معنى: <span class="en">' + esc(w.en) + "</span></p>" + spkBtn(w.en) + "</div>" + cardOptsHTML(optsAr, w.ar, a) + "</div>";
    }
    if (ex === "listen") {
      var optsEn = mcqFrom(vocabPool(w.c).map(function (v) { return v.en; }), w.en, 4) || mcqFrom(vocabPool(null).map(function (v) { return v.en; }), w.en, 4);
      if (!optsEn) return cardExBody(w, "flip", c);
      return '<div class="lstep-card"><p class="qtext">اسمع، وبعدين اختار اللي سمعته</p>' +
        '<button class="btn alt" data-act="speak" data-txt="' + esc(w.en) + '">' + ico("vol") + " اسمع</button>" +
        cardOptsHTML(optsEn, w.en, a) + "</div>";
    }
    if (ex === "type" || ex === "dictate" || ex === "complete") {
      var prompt = "", masked = "";
      if (ex === "type") prompt = "اكتب الكلمة الإنجليزية لمعنى: " + w.ar;
      else if (ex === "dictate") prompt = "اسمع واكتب اللي سمعته";
      else { masked = w.ex ? esc(w.ex).replace(new RegExp(w.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "_____") : ""; if (!masked) prompt = "اكتب: " + w.en; }
      return '<div class="lstep-card">' +
        (ex === "dictate" ? '<button class="btn alt" data-act="speak" data-txt="' + esc(w.en) + '">' + ico("vol") + " اسمع</button>" : "") +
        (prompt ? '<p class="qtext">' + esc(prompt) + "</p>" : "") +
        (masked ? '<p class="qtext">' + masked + "</p>" : "") +
        (a ? cardTypedFeedback(a, w.en) : '<div class="opts"><input class="inp" id="cardAns" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="اكتب هنا"><button class="btn" data-act="card-submit">تحقق</button></div>') +
        "</div>";
    }
    if (ex === "speak") {
      var fb = a ? ('<div class="fb ' + (a.ok ? "ok" : "bad") + '">' + (a.err ? "✕ معرفناش نسمعك، جرّب تاني" : (a.ok ? "✓ نطق صح! سمعنا: " + esc(a.heard) : "✕ سمعنا: " + esc(a.heard) + " — الصح: <span class=\"en\">" + esc(w.en) + "</span>")) + "</div>") : "";
      return '<div class="lstep-card"><p class="qtext">انطق: <span class="en" dir="ltr">' + esc(w.en) + "</span></p>" +
        (a ? "" : '<button class="miccal' + (c.listening ? " on" : "") + '" data-act="card-mic">' + ico("vol") + "<span>" + (c.listening ? "باسمع..." : "اضغط واتكلم") + "</span></button>") +
        fb + "</div>";
    }
    return "";
  }
  function cardAnswer(val, isTyped) {
    var c = state.card; if (!c || c.ans) return;
    var w = c.q[c.i], ex = cardExType(w), ok;
    if (ex === "choose") ok = val === w.ar;
    else if (ex === "listen") ok = val === w.en;
    else { if (isTyped && !norm(val)) return; ok = norm(val) === norm(w.en); }
    c.ans = { sel: val, ok: ok };
    render();
  }
  function cardMic() {
    var c = state.card; if (!c || c.ans || c.listening) return;
    var w = c.q[c.i];
    c.listening = true; render();
    recognizeOnce(function (res) {
      c.listening = false;
      if (res.err) { c.ans = { err: true, ok: false, heard: "" }; render(); return; }
      var ok = speechScore(res.heard, w.en) >= 0.8;
      c.ans = { heard: res.heard, ok: ok };
      if (ok) { state.learn.speakCardOk = (state.learn.speakCardOk || 0) + 1; checkAchievements(nowR()); }
      render();
    });
  }
  function cardsHTML() {
    var c = state.card; if (!c) return "";
    var exitAct = state.lv.c ? ' data-act="lhome" data-c="' + state.lv.c + '"' : ' data-act="lcourses"';
    if (c.i >= c.q.length) return '<div class="card"><h2>خلّصت مراجعة اليوم</h2><p class="muted" style="margin-block:6px 12px">عرفت <span class="num">' + c.known + "</span> من <span class=\"num\">" + c.q.length + '</span>. الكلمات اللي لم تعرفها ترجع لك غدًا.</p><button class="btn"' + exitAct + '>رجوع</button></div>';
    var w = c.q[c.i];
    var courseTag = c.global && w.c && COURSES[w.c] ? '<span class="chip" style="margin-inline-start:6px">' + esc(COURSES[w.c].title) + "</span>" : "";
    var ex = cardExType(w), revealed = ex === "flip" ? !!c.flip : !!c.ans;
    return '<button class="linkbtn"' + exitAct + '>← إنهاء</button><div class="card"><div class="crumb">كروت المفردات · ' + (c.i + 1) + " من " + c.q.length + " · " + (LVL_LBL[w.lvl || 1]) + courseTag + ' · <span class="muted">' + CARD_EX_LBL[ex] + "</span></div>" +
      cardExBody(w, ex, c) +
      (revealed ? '<div class="grade4">' +
        '<button class="btn grade-forgot" data-act="grade" data-r="forgot">نسيتها</button>' +
        '<button class="btn grade-hard" data-act="grade" data-r="hard">صعبة</button>' +
        '<button class="btn grade-good" data-act="grade" data-r="good">عرفتها</button>' +
        '<button class="btn grade-easy" data-act="grade" data-r="easy">سهلة جدًا</button>' +
        "</div>" : "") +
      (revealed && !state.learn.weak[w.id] ? '<button class="linkbtn" style="margin-block-start:8px" data-act="weak-add" data-id="' + w.id + '" data-kind="word" data-cid="' + (w.c || "") + '">🎯 ضيفها لنقاط ضعفي</button>' : "") + "</div>";
  }
  var WEAK_SRC_ICON = { class: "👋", forget: "🔁", exam: "📝", manual: "🎯" };
  function weakHTML(now) {
    var tab = state.weakTab || "all";
    var all = weakList("all");
    var tabs = ["all", "class", "forget", "exam"].map(function (t) {
      var n = t === "all" ? all.length : all.filter(function (w) { return w.source === t; }).length;
      return '<button class="chipbtn' + (tab === t ? " on" : "") + '" data-act="weak-tab" data-t="' + t + '">' + WEAK_SRC_LBL[t] + " (" + n + ")</button>";
    }).join("");
    var list = tab === "all" ? all : all.filter(function (w) { return w.source === tab; });
    var rows = list.length ? list.map(function (w) {
      var info = weakItemInfo(w);
      var title = info.kind === "word" ? (info.en + " — " + esc(info.ar)) : esc(info.q);
      var due = w.stepDue && w.stepDue > now.key;
      var stepTxt = "خطوة " + (w.step + 1) + "/3 · " + WEAK_STEP_LBL[Math.min(w.step, 2)];
      return '<div class="card" style="margin-block-end:10px"><div class="row between" style="align-items:flex-start;gap:10px">' +
        '<div><div style="font-weight:600">' + (WEAK_SRC_ICON[w.source] || "🎯") + " " + (info.kind === "word" ? esc(info.en) + " — " + esc(info.ar) : title) + "</div>" +
        '<small class="muted">' + stepTxt + (due ? (" · تتاح يوم " + w.stepDue) : "") + "</small></div>" +
        '<button class="btn sm' + (due ? " alt" : "") + '" data-act="weak-start" data-id="' + esc(w.id) + '"' + (due ? " disabled" : "") + ">" + (due ? "لسه" : "ابدأ") + "</button>" +
        "</div></div>";
    }).join("") : '<p class="muted" style="padding:10px 0">مفيش نقاط ضعف هنا دلوقتي. برافو! 👏</p>';
    return '<button class="linkbtn" data-act="lcourses">← الكورسات</button>' +
      '<div class="card"><h2 style="margin:0 0 4px;color:var(--weak)">🎯 نقاط ضعفي</h2>' +
      '<p class="muted" style="font-size:13px;margin:0 0 10px">كل كلمة أو سؤال بتتنسى يتجمّع هنا، وله أولوية على أي مراجعة تانية — 3 خطوات في 3 أيام مختلفة وبيرجع يثبت.</p>' +
      '<div class="row wrapr">' + tabs + "</div></div>" + rows;
  }
  function weakDrillHTML() {
    var d = state.wd; if (!d) return weakHTML(nowR());
    var w = state.learn.weak[d.id];
    if (!w) return '<button class="linkbtn" data-act="weak-open">← رجوع</button><div class="card"><h2>تمام</h2><p class="muted">اتشالت من نقاط الضعف.</p></div>';
    var info = weakItemInfo(w);
    var back = '<button class="linkbtn" data-act="weak-open">← رجوع لنقاط ضعفي</button>';
    var head = '<div class="crumb"><span>' + WEAK_STEP_LBL[Math.min(w.step, 2)] + "</span><span class=\"num\">خطوة " + (w.step + 1) + " / 3</span></div>";
    if (d.done != null) {
      return back + '<div class="card">' + head +
        '<div class="fb ' + (d.done ? "ok" : "bad") + '">' + (d.done ? "✓ صحيح!" : "✕ مش كده — الصح: <span class=\"en\">" + esc(d.correctTxt || "") + "</span>" + spkBtn(d.correctTxt || "")) + "</div>" +
        (d.done && w.step <= 0 ? '<p class="muted" style="margin-block-start:6px">تيجي تكمل الخطوة الجاية بكرة.</p>' : (!state.learn.weak[d.id] ? '<p class="muted" style="margin-block-start:6px">🎉 اتثبتت! رجعت للمراجعة العادية.</p>' : "")) +
        '<button class="btn" style="margin-block-start:10px" data-act="weak-open">تمام</button></div>';
    }
    var body;
    if (w.step === 0) {
      var opts = weakMcqOptions(w, info);
      if (opts) {
        var qText = info.kind === "word" ? ("ايه معنى: " + info.en) : info.q;
        body = (info.kind === "word" ? '<div class="qtext-row"><p class="qtext" style="margin:0">' + esc(qText) + "</p>" + spkBtn(info.en) + "</div>" : '<p class="qtext">' + esc(qText) + "</p>") +
          '<div class="opts">' + opts.map(function (o) { return '<button class="opt" data-act="weak-pick" data-v="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") + "</div>";
      } else body = weakTypedBody(w, info);
    } else body = weakTypedBody(w, info);
    return back + '<div class="card">' + head + body + "</div>";
  }
  function weakTypedBody(w, info) {
    var prompt;
    if (info.kind === "word") {
      if (w.step <= 1) prompt = esc("اكتب الكلمة الإنجليزية لمعنى: " + info.ar);
      else prompt = info.ex ? esc(info.ex).replace(new RegExp(info.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "_____") : esc("اكتب: " + info.en);
    } else prompt = esc(info.q);
    return '<p class="qtext">' + prompt + '</p>' +
      '<div class="opts"><input class="inp" id="weakAns" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="اكتب الإجابة">' +
      '<button class="btn" data-act="weak-submit">تحقق</button></div>';
  }
  function speakHTML() {
    var s = state.spk; if (!s) return "";
    if (!speechOK()) return '<button class="linkbtn" data-act="lhome">← إنهاء</button><div class="card"><h2>مش متاح على المتصفح ده</h2><p class="muted" style="margin-block:6px 0">تحدي النطق محتاج متصفح بيدعم التعرف على الصوت، زي Chrome على أندرويد. جرّب تفتح الموقع من Chrome.</p><button class="btn" data-act="lhome">رجوع</button></div>';
    if (s.i >= s.q.length) {
      var pct = Math.round(s.ok / s.q.length * 100);
      return '<div class="card"><h2>' + (pct >= 80 ? "نطق ممتاز" : (pct >= 50 ? "نطق جيد" : "محتاج تمرين أكتر")) + '</h2><p style="font-size:20px" class="num">' + s.ok + " / " + s.q.length + " (" + pct + '%)</p><button class="btn" data-act="lhome">رجوع</button></div>';
    }
    var w = s.q[s.i];
    var masked = w.ex ? esc(w.ex).replace(new RegExp(w.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "．．．") : "";
    var fb = !s.result ? "" : '<div class="fb ' + (s.result.ok ? "ok" : "bad") + '">' + (s.result.err ? "✕ معرفناش نسمعك، جرّب تاني" : (s.result.ok ? "✓ صح! سمعنا: " + esc(s.result.heard) : "✕ سمعنا: " + esc(s.result.heard) + " — الصح: <span class=\"en\">" + esc(w.en) + "</span>" + spkBtn(w.en))) + "</div>";
    return '<button class="linkbtn" data-act="lhome">← إنهاء</button><div class="card"><div class="crumb">تحدي النطق · ' + (s.i + 1) + " من " + s.q.length + '</div><div class="bar"><i style="width:' + Math.round(s.i / s.q.length * 100) + '%"></i></div>' +
      '<div class="spkword"><div class="w" style="direction:rtl;font-size:28px">' + esc(w.ar) + "</div>" + (masked ? '<div class="muted en" style="margin-block-start:6px">' + masked + "</div>" : "") + "</div>" +
      (s.result ? "" : '<button class="miccal' + (s.listening ? " on" : "") + '" data-act="speak-listen">' + ico("vol") + "<span>" + (s.listening ? "باسمع..." : "اضغط واتكلم") + "</span></button>") +
      fb +
      (s.result ? '<button class="btn" data-act="speak-next">' + (s.i + 1 >= s.q.length ? "النتيجة" : "التالي") + "</button>" : "") + "</div>";
  }

