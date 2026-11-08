"use strict";
  /* ---------------- التمارين — daily walk + 3 short home-strength sessions a week ----------------
     Everything lives in state.learn.fit (synced with the rest of "learn"):
       prof  {sex, age, h, w, waist, lim:{knee,back,bp}, start}   — set once, editable
       log   [{k, w, waist}]                                       — weigh-ins, one per day
       days  {key: {wm, s, rpe, sp, wx}}  wm = walked minutes, s = strength done,
             rpe 1 easy / 2 right / 3 hard, sp = session progress, wx = walk XP given
       run   {k, t} | null   — a walk timer that is running (survives reloads)
       st    stage 0..5 on FIT_STAGES, stAt = when it was set, hist = [{k, st}]
       sched [dow...] strength days, rest = the easy-walk day, easy/hard = RPE streaks
     The pure helpers below take F as an argument so the admin dashboard can reuse them. */
  var FIT_TIMER_CAP = 120;  // minutes: a forgotten timer never logs more than this

  function fitGet() { var F = state.learn.fit; return F && F.prof ? F : null; }
  function fitD() {
    if (!state.learn.fit) state.learn.fit = { prof: null, log: [], days: {}, run: null, st: 0, stAt: null, hist: [], sched: [6, 1, 3], rest: 5, easy: 0, hard: 0 };
    var F = state.learn.fit;
    if (!F.days) F.days = {};
    if (!F.log) F.log = [];
    if (!F.hist) F.hist = [];
    if (!F.sched) F.sched = [6, 1, 3];
    return F;
  }
  function fitDay(F, k) { return F.days[k] || (F.days[k] = { wm: 0 }); }
  function fitStage(F) { return FIT_STAGES[Math.max(0, Math.min(FIT_STAGES.length - 1, (F && F.st) || 0))]; }
  // The stage's exercises, with knee/back-friendly swaps when the person said so.
  function fitExList(F) {
    var lim = (F && F.prof && F.prof.lim) || {}, used = {};
    return fitStage(F).ex.map(function (e) {
      var id = e[0];
      if (lim.knee && id === "squat") id = "chairsq";
      if (lim.knee && id === "lunge") id = "bridge";
      if (lim.back && id === "climber") id = "deadbug";
      if (used[id]) id = id === "bridge" ? "deadbug" : "bridge";
      used[id] = 1;
      return [id, e[1]];
    });
  }
  function fitCurW(F) { for (var i = (F.log || []).length - 1; i >= 0; i--) if (F.log[i].w) return F.log[i].w; return F.prof.w; }
  function fitCurWaist(F) { for (var i = (F.log || []).length - 1; i >= 0; i--) if (F.log[i].waist) return F.log[i].waist; return F.prof.waist || 0; }
  function fitBmi(F) { var h = F.prof.h / 100; return Math.round(fitCurW(F) / (h * h) * 10) / 10; }
  function fitBmiCat(b) { return b < 18.5 ? "أقل من الطبيعي" : b < 25 ? "طبيعي" : b < 30 ? "وزن زائد" : b < 35 ? "سمنة درجة أولى" : b < 40 ? "سمنة درجة تانية" : "سمنة درجة تالتة"; }
  function fitNums(F) {
    var p = F.prof, w = fitCurW(F), m = p.sex !== "f";
    var bmr = Math.round(10 * w + 6.25 * p.h - 5 * p.age + (m ? 5 : -161)), tdee = Math.round(bmr * 1.375 / 10) * 10;
    var h2 = (p.h / 100) * (p.h / 100);
    return {
      bmr: bmr, tdee: tdee, kcal: Math.max(m ? 1500 : 1200, Math.round((tdee - 500) / 50) * 50),
      protLo: Math.round(w * 1.2 / 5) * 5, protHi: Math.round(w * 1.5 / 5) * 5,
      water: Math.round(w * 0.035 * 2) / 2,
      goal: Math.round(p.w * 0.9), hLo: Math.round(18.5 * h2), hHi: Math.round(24.9 * h2),
      waistOk: Math.round(p.h * 0.5), waistHi: m ? 102 : 88, waistMid: m ? 94 : 80
    };
  }
  function fitDaysBetween(a, b) { var p = a.split("-").map(Number), q = b.split("-").map(Number); return Math.round((Date.UTC(q[0], q[1] - 1, q[2]) - Date.UTC(p[0], p[1] - 1, p[2])) / 864e5); }
  function fitIsRest(F, k) { return dowOf(k) === F.rest; }
  function fitWalkTarget(F, k) { return fitIsRest(F, k) ? FIT_REST_WALK : fitStage(F).walk; }
  // Strength is due on a scheduled day, or the day after a scheduled day that was missed
  // (a make-up) — and always counts once it's done, whichever day that was.
  function fitStrDue(F, k) {
    var d = F.days[k] || {};
    if (d.s) return true;
    if (F.sched.indexOf(dowOf(k)) >= 0) return true;
    var y = addDays(k, -1);
    return !fitIsRest(F, k) && F.sched.indexOf(dowOf(y)) >= 0 && !(F.days[y] || {}).s && F.prof.start <= y;
  }
  function fitIsMakeup(F, k) { return F.sched.indexOf(dowOf(k)) < 0 && fitStrDue(F, k); }
  function fitWalkMin(F, k, nowMs) {
    var d = F.days[k] || {}, m = d.wm || 0;
    if (nowMs && F.run && F.run.k === k) m += Math.min(FIT_TIMER_CAP, Math.max(0, (nowMs - F.run.t) / 60000));
    return m;
  }
  function fitDayFrac(F, k, nowMs) {
    var w = Math.min(1, fitWalkMin(F, k, nowMs) / fitWalkTarget(F, k));
    if (!fitStrDue(F, k)) return w;
    return (w + ((F.days[k] || {}).s ? 1 : 0)) / 2;
  }
  function fitStreak(F, now) {
    var k = now.key, n = 0;
    if (fitDayFrac(F, k) < 1) k = addDays(k, -1);
    while (k >= F.prof.start && fitDayFrac(F, k) >= 1 && n < 3000) { n++; k = addDays(k, -1); }
    return n;
  }
  function fitWeek(F, nowKey, back) {
    var t = { walk: 0, str: 0, full: 0 };
    for (var i = 0; i < (back || 7); i++) {
      var k = addDays(nowKey, -i), d = F.days[k];
      if (!d) continue;
      t.walk += d.wm || 0; if (d.s) t.str++; if (fitDayFrac(F, k) >= 1) t.full++;
    }
    t.walk = Math.round(t.walk);
    return t;
  }
  function fitKcal(F, k, nowMs) {
    var kg = fitCurW(F), st = fitStage(F), wm = fitWalkMin(F, k, nowMs), d = F.days[k] || {}, jog = 0;
    if (st.jog && !fitIsRest(F, k)) jog = Math.min(Math.max(0, wm - 5), st.jog[0] * st.jog[2] / 60);
    var met = wm * 4.3 + jog * 3.7 + (d.s ? (st.rounds * (fitExList(F).length + 1)) * 3.8 : 0);
    return Math.round(met * 3.5 * kg / 200);
  }
  // Where the walk is right now on the stage's interval plan.
  function fitPhase(F, k, sec) {
    var st = fitStage(F);
    if (!st.jog || fitIsRest(F, k)) return { t: "walk", lbl: "مشي سريع", left: 0 };
    if (sec < 300) return { t: "warm", lbl: "إحماء: مشي عادي", left: 300 - sec };
    var x = sec - 300, cyc = st.jog[0] + st.jog[1], i = Math.floor(x / cyc);
    if (i >= st.jog[2]) return { t: "walk", lbl: "مشي (تهدئة)", left: 0 };
    var r = x % cyc;
    return r < st.jog[0] ? { t: "jog", lbl: "اجري خفيف (" + (i + 1) + "/" + st.jog[2] + ")", left: st.jog[0] - r } : { t: "walk", lbl: "امشي (" + (i + 1) + "/" + st.jog[2] + ")", left: cyc - r };
  }
  function fitMmSs(sec) { sec = Math.max(0, Math.floor(sec)); return pad(Math.floor(sec / 60)) + ":" + pad(sec % 60); }
  function fitTgtTxt(id, n) { var e = FIT_EX[id]; return (e.t === "s" ? n + " ثانية" : n + " مرة") + (e.side ? " لكل ناحية" : ""); }
  function fitBuzz(p) { try { if (navigator.vibrate) navigator.vibrate(p || [180, 90, 180]); } catch (e) { } }

  /* -------- timer: settle a run that crossed midnight or the cap -------- */
  function fitSettle(F, nowMs) {
    if (!F || !F.run) return false;
    var today = nowR().key, el = (nowMs - F.run.t) / 60000;
    if (F.run.k !== today || el >= FIT_TIMER_CAP) {
      var d = fitDay(F, F.run.k); d.wm = Math.round(((d.wm || 0) + Math.min(FIT_TIMER_CAP, Math.max(0, el))) * 10) / 10;
      F.run = null; saveMeta("learn", 0); return true;
    }
    return false;
  }
  function fitWalkXp(F, k, nowMs) {
    var d = fitDay(F, k);
    if (!d.wx && fitWalkMin(F, k, nowMs) >= fitWalkTarget(F, k)) { d.wx = 1; addXp(5, nowR()); toast("برافو! خلّصت مشي النهارده 👏"); saveMeta("learn", 0); return true; }
    return false;
  }

  /* =================== views =================== */
  function fitUi() { if (!state.fv) state.fv = { v: "today" }; return state.fv; }
  function fitView(now) {
    var F = state.learn.fit;
    if (!F || !F.prof || fitUi().v === "setup") return fitSetupHTML(now);
    if (state.fv.v === "sess") return fitSessHTML(now);
    if (state.fv.v === "food" && fdUi().v !== "day") return foodHTML(now);
    var tabs = [["today", "النهارده"], ["food", "أكلي"], ["prog", "تقدّمي"], ["plan", "الخطة"]];
    var seg = '<div class="seg2 fit-seg">' + tabs.map(function (t) { return '<button data-act="fit-v" data-v="' + t[0] + '" aria-pressed="' + (state.fv.v === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div>";
    var body = state.fv.v === "food" ? foodHTML(now) : state.fv.v === "prog" ? fitProgHTML(F, now) : state.fv.v === "plan" ? fitPlanHTML(F, now) : fitTodayHTML(F, now);
    return '<div class="sec-h">التمارين</div>' + seg + body;
  }

  function fitTodayHTML(F, now) {
    var k = now.key, st = fitStage(F), tgt = fitWalkTarget(F, k), wm = fitWalkMin(F, k, now.ms), d = F.days[k] || {};
    var due = fitStrDue(F, k), rest = fitIsRest(F, k), pct = Math.round(fitDayFrac(F, k, now.ms) * 100), streak = fitStreak(F, now);
    var hero = '<div class="card plan fit-hero"><div class="hero"><div class="ringbox">' + pctRingSVG(pct) +
      '<div class="ringtxt"><b class="num">' + pct + '%</b><span>جرعة النهارده</span></div></div><div class="grow plan-lines">' +
      '<div class="plan-line' + (wm >= tgt ? " done" : "") + '"><span class="pl-ic">' + (wm >= tgt ? ico("check") : ic("run")) + '</span><span class="grow">مشي ' + Math.floor(wm) + "/" + tgt + " دقيقة</span></div>" +
      (due ? '<div class="plan-line' + (d.s ? " done" : "") + '"><span class="pl-ic">' + (d.s ? ico("check") : ic("zap")) + '</span><span class="grow">' + (d.s ? "خلّصت المقاومة" : "جولة مقاومة") + "</span></div>" : "") +
      '<div class="plan-line"><span class="pl-ic">' + ico("flame") + '</span><span class="grow">' + (streak ? streak + " يوم ورا بعض" : "ابدأ سلسلتك النهارده") + "</span></div>" +
      '<div class="plan-line"><span class="pl-ic">' + ic("heart") + '</span><span class="grow">≈ <span class="num">' + fitKcal(F, k, now.ms) + "</span> سعر اتحرقوا</span></div></div></div></div>";

    var lvl = "";
    if (F.easy >= 2 && F.st < FIT_STAGES.length - 1 && (!F.stAt || fitDaysBetween(F.stAt, k) >= 10))
      lvl = '<div class="card fit-lvl up"><b>🚀 جاهز للمستوى اللي بعده؟</b><p class="muted">آخر جولتين كانوا سهلين عليك. المستوى ' + (F.st + 2) + " فيه مشي أطول وتمارين أصعب شوية.</p>" +
        '<div class="row wrapr"><button class="btn sm" data-act="fit-lvl" data-d="1">يلا نطلع</button><button class="btn sm alt" data-act="fit-lvl-no">لسه شوية</button></div></div>';
    else if (F.hard >= 2 && F.st > 0)
      lvl = '<div class="card fit-lvl down"><b>خد نفسك</b><p class="muted">آخر جولتين كانوا صعبين. مفيش عيب ترجع مستوى وتبني أساس أقوى.</p>' +
        '<div class="row wrapr"><button class="btn sm" data-act="fit-lvl" data-d="-1">ارجع مستوى</button><button class="btn sm alt" data-act="fit-lvl-no">هكمّل كده</button></div></div>';

    var running = F.run && F.run.k === k, sec = wm * 60, ph = fitPhase(F, k, sec);
    var plan = rest ? "يوم راحة: مشي خفيف وهادي بس." : st.jog
      ? "٥ دقايق مشي إحماء، وبعدين " + st.jog[2] + " مرات: جري خفيف " + fitDurTxt(st.jog[0]) + " ثم مشي " + fitDurTxt(st.jog[1]) + "، وكمّل الباقي مشي سريع."
      : "مشي سريع: تقدر تتكلم بس متقدرش تغني. ممكن تقسّمه على مرتين في اليوم.";
    var walk = '<div class="card fit-walk"><div class="row between"><h3>' + ic("run") + ' المشي</h3><span class="chip">' + tgt + ' دقيقة</span></div>' +
      '<p class="muted fit-note">' + plan + "</p>" +
      '<div class="fit-clock"><b class="num" id="fitClock">' + fitMmSs(sec) + '</b><span id="fitPhase" class="fit-ph ' + ph.t + '">' + (running ? esc(ph.lbl) + (ph.left ? " · " + fitMmSs(ph.left) : "") : wm >= tgt ? "خلّصت هدف النهارده ✓" : "اضغط ابدأ لما تتحرك") + "</span></div>" +
      '<div class="bar"><i id="fitWalkBar" style="width:' + Math.min(100, Math.round(wm / tgt * 100)) + '%"></i></div>' +
      '<div class="row wrapr fit-wbtns"><button class="btn" data-act="fit-walk">' + (running ? ic("pause") + " وقّف" : ic("play") + " " + (wm > 0 ? "كمّل" : "ابدأ")) + "</button>" +
      '<button class="chipbtn" data-act="fit-add" data-n="5">+5 د</button><button class="chipbtn" data-act="fit-add" data-n="10">+10 د</button><button class="chipbtn" data-act="fit-add" data-n="15">+15 د</button>' +
      (wm > 0 && !running ? '<button class="linkbtn" data-act="fit-add" data-n="-5">−5 د</button>' : "") + "</div>" +
      '<p class="muted fit-small">مشيت من غير التطبيق؟ زوّد الدقايق بالزراير.</p></div>';

    var ex = fitExList(F), str;
    if (due) {
      str = '<div class="card fit-str' + (d.s ? " done" : "") + '"><div class="row between"><h3>' + ic("zap") + " المقاومة</h3>" + (fitIsMakeup(F, k) && !d.s ? '<span class="chip">تعويض جولة امبارح</span>' : '<span class="chip">' + st.rounds + " جولات</span>") + "</div>" +
        (d.s ? '<p class="fit-ok">✓ خلّصت جولة النهارده — كانت ' + (["", "سهلة", "مناسبة", "صعبة"][d.rpe || 2]) + "</p>"
          : '<ul class="fit-exl">' + ex.map(function (e) { return "<li><span>" + esc(FIT_EX[e[0]].n) + '</span><b class="num">' + fitTgtTxt(e[0], e[1]) + "</b></li>"; }).join("") + "</ul>" +
            '<p class="muted fit-small">حوالي ' + (st.rounds * (ex.length + 1)) + " دقيقة · راحة دقيقة بين الجولات</p>" +
            '<button class="btn" style="width:100%" data-act="fit-sess">' + ic("play") + " " + (d.sp && (d.sp.r || Object.keys(d.sp.done || {}).length) ? "كمّل الجولة" : "ابدأ الجولة") + "</button>") + "</div>";
    } else {
      var nx = 1; while (nx < 7 && F.sched.indexOf(dowOf(addDays(k, nx))) < 0) nx++;
      str = '<div class="card fit-str off"><h3>' + ic("zap") + ' المقاومة</h3><p class="muted">النهارده ' + (rest ? "راحة" : "مشي بس") + " — الجولة الجاية يوم " + FIT_DOW[dowOf(addDays(k, nx))] + ".</p>" +
        '<button class="linkbtn" data-act="fit-sess">عايز تتمرن النهارده برضه؟</button></div>';
    }

    var strip = "";
    for (var i = 6; i >= 0; i--) {
      var dk = addDays(k, -i), fr = dk < F.prof.start ? -1 : fitDayFrac(F, dk, now.ms);
      strip += '<span class="fit-dd' + (fr >= 1 ? " full" : fr > 0 ? " part" : "") + (i === 0 ? " today" : "") + '"><i>' + (fr >= 1 ? "✓" : "") + "</i><small>" + FIT_DOW[dowOf(dk)].replace("ال", "").slice(0, 3) + "</small></span>";
    }
    var wk = fitWeek(F, k);
    var week = '<div class="card"><div class="row between"><h3>آخر ٧ أيام</h3><small class="muted">مقاومة ' + wk.str + "/" + F.sched.length + " · مشي " + wk.walk + ' د</small></div><div class="fit-strip">' + strip + "</div></div>";

    var last = F.log[F.log.length - 1], weigh = "";
    if (!last || fitDaysBetween(last.k, k) >= 7) weigh = '<div class="card fit-weigh"><h3>' + ic("scale") + " قياس الأسبوع</h3><p class=\"muted fit-small\">وزن الصبح بعد الحمام وقبل الفطار، والوسط بالشريط عند السُّرة.</p>" + fitLogForm(F) + "</div>";

    return hero + lvl + weigh + walk + str + week;
  }
  function fitDurTxt(s) { return s % 60 ? s + " ثانية" : s === 60 ? "دقيقة" : s === 120 ? "دقيقتين" : s / 60 + " دقايق"; }
  function fitLogForm(F) {
    return '<div class="row wrapr fit-form"><label class="field">الوزن (كجم)<input class="inp" id="fitLogW" type="number" inputmode="decimal" step="0.1" min="30" max="300" placeholder="' + fitCurW(F) + '"></label>' +
      '<label class="field">الوسط (سم)<input class="inp" id="fitLogWaist" type="number" inputmode="decimal" step="0.5" min="50" max="200" placeholder="' + (fitCurWaist(F) || "اختياري") + '"></label>' +
      '<button class="btn sm" data-act="fit-log">سجّل</button></div>';
  }

  function fitProgHTML(F, now) {
    var p = F.prof, w = fitCurW(F), dw = Math.round((w - p.w) * 10) / 10, b = fitBmi(F), N = fitNums(F), waist = fitCurWaist(F);
    var dWaist = p.waist && waist ? Math.round((waist - p.waist) * 10) / 10 : null;
    var toGoal = Math.max(0, Math.round((w - N.goal) * 10) / 10);
    var kpi = function (l, v, s) { return '<div class="fit-kpi"><small>' + l + '</small><b class="num">' + v + "</b>" + (s ? "<span>" + s + "</span>" : "") + "</div>"; };
    var tot = 0, sess = 0; Object.keys(F.days).forEach(function (k) { tot += F.days[k].wm || 0; if (F.days[k].s) sess++; });
    var head = '<div class="fit-kpis">' +
      kpi("الوزن", w + " كجم", dw ? (dw < 0 ? "▼ " : "▲ ") + Math.abs(dw) + " من البداية" : "نقطة البداية") +
      kpi("مؤشر الكتلة", b, fitBmiCat(b)) +
      kpi("الوسط", waist ? waist + " سم" : "—", dWaist ? (dWaist < 0 ? "▼ " : "▲ ") + Math.abs(dWaist) + " سم" : waist ? "الهدف أقل من " + N.waistOk : "سجّله في القياس") +
      kpi("الهدف الأول", N.goal + " كجم", toGoal ? "فاضل " + toGoal + " كجم" : "وصلت 🎉") + "</div>";
    var pts = [{ k: p.start, v: p.w }].concat(F.log.filter(function (l) { return l.w; }).map(function (l) { return { k: l.k, v: l.w }; }));
    var seen = {}; pts = pts.filter(function (x) { if (seen[x.k]) return false; seen[x.k] = 1; return true; }).sort(function (a, b2) { return a.k < b2.k ? -1 : 1; });
    var chart = '<div class="card"><h3>الوزن</h3>' + (pts.length > 1 ? fitChart(pts) : '<p class="muted fit-small">سجّل وزنك كل أسبوع والرسم هيظهر هنا.</p>') + "</div>";
    var log = '<div class="card"><h3>' + ic("scale") + " سجّل قياس</h3>" + fitLogForm(F) +
      (F.log.length ? '<ul class="fit-hist">' + F.log.slice(-10).reverse().map(function (l) {
        return "<li><span>" + esc(greg(l.k)) + '</span><b class="num">' + (l.w ? l.w + " كجم" : "") + (l.waist ? " · " + l.waist + " سم" : "") + '</b><button class="linkbtn" data-act="fit-log-del" data-k="' + esc(l.k) + '" aria-label="امسح">✕</button></li>';
      }).join("") + "</ul>" : "") + "</div>";
    var totals = '<div class="card"><h3>من أول يوم</h3><div class="fit-kpis">' + kpi("دقايق مشي", Math.round(tot)) + kpi("جولات مقاومة", sess) + kpi("أطول سلسلة الحالية", fitStreak(F, now) + " يوم") + kpi("المستوى", (F.st + 1) + "/6", FIT_PHASES[fitStage(F).ph]) + "</div></div>";
    return head + chart + log + totals;
  }
  function fitChart(pts) {
    var W = 320, H = 150, pl = 30, pr = 8, pt = 10, pb = 22, vs = pts.map(function (x) { return x.v; });
    var lo = Math.floor(Math.min.apply(null, vs) - 1), hi = Math.ceil(Math.max.apply(null, vs) + 1), n = pts.length;
    var x = function (i) { return pl + i * (W - pl - pr) / (n - 1); }, y = function (v) { return pt + (hi - v) / (hi - lo) * (H - pt - pb); };
    var line = pts.map(function (p, i) { return x(i).toFixed(1) + "," + y(p.v).toFixed(1); }).join(" ");
    var fmt = function (k) { var q = k.split("-"); return Number(q[2]) + "/" + Number(q[1]); };
    return '<svg class="fit-chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="رسم الوزن">' +
      '<text x="' + (pl - 4) + '" y="' + (y(hi) + 4) + '" text-anchor="end">' + hi + '</text><text x="' + (pl - 4) + '" y="' + (y(lo) + 4) + '" text-anchor="end">' + lo + "</text>" +
      '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(lo) + '" y2="' + y(lo) + '" class="g"/>' +
      '<polyline points="' + line + '" fill="none" stroke="var(--teal-deep)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      pts.map(function (p, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.v).toFixed(1) + '" r="3.2" fill="var(--teal-deep)"><title>' + fmt(p.k) + ": " + p.v + "</title></circle>"; }).join("") +
      '<text x="' + x(0) + '" y="' + (H - 6) + '" text-anchor="middle">' + fmt(pts[0].k) + '</text><text x="' + x(n - 1) + '" y="' + (H - 6) + '" text-anchor="middle">' + fmt(pts[n - 1].k) + "</text></svg>";
  }

  function fitPlanHTML(F, now) {
    var p = F.prof, N = fitNums(F), ex = fitExList(F), st = fitStage(F);
    var ladder = FIT_STAGES.map(function (s, i) {
      var cur = i === F.st;
      return '<div class="fit-stage' + (cur ? " cur" : i < F.st ? " past" : "") + '"><span class="num">' + (i + 1) + '</span><div class="grow"><b>' + FIT_PHASES[s.ph] + " · مشي " + s.walk + " د" + (s.jog ? " بجري متقطع" : "") + "</b><small>" + s.rounds + " جولات: " +
        s.ex.map(function (e) { return FIT_EX[e[0]].n; }).join("، ") + "</small></div>" + (cur ? '<span class="chip">إنت هنا</span>' : "") + "</div>";
    }).join("");
    var lib = ex.map(function (e) {
      var X = FIT_EX[e[0]];
      return '<details class="fit-how"><summary><b>' + esc(X.n) + '</b><span class="num">' + fitTgtTxt(e[0], e[1]) + "</span></summary><ol>" + X.how.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ol>" +
        '<p class="fit-small"><b>غلطة شائعة:</b> ' + esc(X.err) + '</p><p class="fit-small"><b>أسهل:</b> ' + esc(X.easy) + "</p></details>";
    }).join("");
    var nums = '<div class="card"><h3>' + ic("calc") + ' أرقامك</h3><ul class="fit-nums">' +
      "<li><span>جسمك بيحرق يوميًا (تقريبًا)</span><b class=\"num\">" + N.tdee + " سعر</b></li>" +
      "<li><span>هدف الأكل عشان تخسّ ½ كيلو/أسبوع</span><b class=\"num\">≈ " + N.kcal + " سعر</b></li>" +
      "<li><span>بروتين يوميًا</span><b class=\"num\">" + N.protLo + "–" + N.protHi + " جم</b></li>" +
      "<li><span>مية يوميًا</span><b class=\"num\">≈ " + N.water + " لتر</b></li>" +
      "<li><span>الوزن الصحي لطولك</span><b class=\"num\">" + N.hLo + "–" + N.hHi + " كجم</b></li>" +
      "<li><span>هدف الوسط</span><b class=\"num\">أقل من " + N.waistOk + " سم</b></li></ul>" +
      '<p class="muted fit-small">الأرقام تقديرية بمعادلة Mifflin-St Jeor بنشاط خفيف. مش لازم تعدّ سعرات بالظبط: قلّل النشويات والسكر للنص وزوّد البروتين والخضار، وبص على الميزان والوسط كل أسبوع.</p></div>';
    var tips = '<div class="card"><h3>' + ic("bulb") + " مهم تعرفه</h3>" + FIT_TIPS.map(function (t) { return '<details class="fit-how"><summary><b>' + esc(t[0]) + "</b></summary><p>" + esc(t[1]) + "</p></details>"; }).join("") + "</div>";
    var health = '<div class="card fit-health"><h3>' + ic("health") + " صحتك أولًا</h3><ul>" +
      (p.sex !== "f" ? "<li>دهون الصدر عند الرجالة بتقل مع نزول الوزن وتمارين الضغط. لو حسّيت بكتلة جامدة تحت الحلمة، أو فيه ألم، أو في ناحية واحدة بس — اكشف عند دكتور (باطنة أو غدد).</li>" : "") +
      (p.lim && p.lim.knee ? "<li>عشان ركبتك: السكوات على كرسي بدل العادي، والكوبري بدل اللانجز. أي ألم حاد في الركبة = وقّف.</li>" : "") +
      (p.lim && p.lim.back ? "<li>عشان ضهرك: شدّ بطنك في كل تمرين، وأي ألم بينزل في الرجل = وقّف واكشف.</li>" : "") +
      (p.lim && p.lim.bp ? "<li>عشان الضغط/القلب: متكتمش نفسك أبدًا (خصوصًا في البلانك)، واستشير دكتورك قبل الجري.</li>" : "") +
      "<li>تعب عضلي خفيف تاني يوم طبيعي. ألم في المفصل، دوخة، أو ضيق في الصدر — مش طبيعي، وقّف فورًا.</li>" +
      "<li>الخطة دي عامة للمبتدئين ومش بديل لاستشارة دكتور.</li></ul></div>";
    return '<div class="card"><div class="row between"><h3>' + ic("target") + " مستواك: " + (F.st + 1) + " من 6</h3>" +
      '<span class="row" style="gap:6px">' + (F.st > 0 ? '<button class="chipbtn" data-act="fit-lvl" data-d="-1">−</button>' : "") + (F.st < 5 ? '<button class="chipbtn" data-act="fit-lvl" data-d="1">+</button>' : "") + "</span></div>" +
      '<p class="muted fit-small">بتطلع مستوى لما جولتين ورا بعض يبقوا سهلين وبعد ١٠ أيام على الأقل في المستوى. تقدر تغيّره بإيدك.</p>' + ladder + "</div>" +
      '<div class="card"><h3>' + ic("zap") + " تمارين مستواك — إزاي تعملها صح</h3>" + lib + "</div>" +
      '<div class="card"><h3>' + ic("compass") + ' أسبوعك</h3><p class="fit-small">مقاومة: ' + F.sched.slice().sort(function (a, b) { return ((a + 1) % 7) - ((b + 1) % 7); }).map(function (x) { return FIT_DOW[x]; }).join("، ") +
      " · راحة: " + FIT_DOW[F.rest] + " · مشي كل يوم " + st.walk + " د (يوم الراحة " + FIT_REST_WALK + " د)</p>" +
      '<button class="btn sm alt" data-act="fit-edit">' + ic("gear") + " عدّل بياناتك وأيامك</button></div>" +
      nums + tips + health;
  }

  /* -------- setup -------- */
  function fitDraft() {
    if (state.fdraft) return state.fdraft;
    var F = state.learn.fit, p = F && F.prof;
    state.fdraft = p ? { sex: p.sex, age: p.age, h: p.h, w: p.w, waist: p.waist || "", lim: Object.assign({}, p.lim || {}), sched: F.sched.slice(), rest: F.rest }
      : { sex: "m", age: "", h: "", w: "", waist: "", lim: {}, sched: [6, 1, 3], rest: 5 };
    return state.fdraft;
  }
  function fitCapture() {
    var D = fitDraft();
    [["age", "fitAge"], ["h", "fitH"], ["w", "fitW"], ["waist", "fitWaist"]].forEach(function (x) { var el = document.getElementById(x[1]); if (el) D[x[0]] = el.value; });
  }
  function fitSetupHTML(now) {
    var D = fitDraft(), F = state.learn.fit, editing = !!(F && F.prof);
    var chip = function (act, v, on, lbl) { return '<button class="chipbtn' + (on ? " on" : "") + '" data-act="' + act + '" data-v="' + v + '">' + lbl + "</button>"; };
    var order = [6, 0, 1, 2, 3, 4, 5];
    return (editing ? '<button class="linkbtn" data-act="fit-v" data-v="plan">← رجوع</button>' : "") + '<div class="sec-h">التمارين</div>' +
      (editing ? "" : '<div class="card fit-intro"><h3>' + ic("run") + ' خطة رياضة بسيطة تبقى جزء من يومك</h3><p class="muted">مشي كل يوم، و٣ جولات مقاومة قصيرة في البيت (ضغط، سكوات، بلانك…) من غير أدوات. الخطة بتكبر معاك على ٦ مستويات، وتقدر تتابع وزنك ووسطك كل أسبوع.</p></div>') +
      '<div class="card"><h3>بياناتك</h3><div class="row wrapr" style="margin-block-end:10px">' + chip("fit-sex", "m", D.sex !== "f", "ذكر") + chip("fit-sex", "f", D.sex === "f", "أنثى") + "</div>" +
      '<div class="fit-form grid">' +
      '<label class="field">السن<input class="inp" id="fitAge" type="number" inputmode="numeric" min="12" max="90" value="' + esc(String(D.age)) + '"></label>' +
      '<label class="field">الطول (سم)<input class="inp" id="fitH" type="number" inputmode="numeric" min="120" max="220" value="' + esc(String(D.h)) + '"></label>' +
      '<label class="field">الوزن (كجم)<input class="inp" id="fitW" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="' + esc(String(D.w)) + '"></label>' +
      '<label class="field">محيط الوسط (سم، اختياري)<input class="inp" id="fitWaist" type="number" inputmode="decimal" step="0.5" min="50" max="200" value="' + esc(String(D.waist)) + '"></label></div>' +
      '<p class="muted fit-small">الوسط: شريط القياس حوالين بطنك عند مستوى السُّرة، وإنت واقف ومش شافط بطنك.</p></div>' +
      '<div class="card"><h3>عندك أي حاجة من دول؟</h3><div class="row wrapr">' + chip("fit-lim", "knee", D.lim.knee, "ألم في الركبة") + chip("fit-lim", "back", D.lim.back, "ألم في الضهر") + chip("fit-lim", "bp", D.lim.bp, "ضغط أو قلب") + "</div>" +
      '<p class="muted fit-small">بنغيّر التمارين اللي ممكن تضايقك. لو عندك مرض مزمن استشير دكتورك الأول.</p></div>' +
      '<div class="card"><h3>أيام المقاومة</h3><p class="muted fit-small">اختار ٢ لـ ٤ أيام، والأفضل يبقى بينهم يوم.</p><div class="row wrapr">' + order.map(function (x) { return chip("fit-day", x, D.sched.indexOf(x) >= 0, FIT_DOW[x]); }).join("") + "</div>" +
      '<h3 style="margin-block-start:12px">يوم الراحة (مشي خفيف بس)</h3><div class="row wrapr">' + order.map(function (x) { return chip("fit-rest", x, D.rest === x, FIT_DOW[x]); }).join("") + "</div></div>" +
      '<p class="muted fit-small fit-privacy">' + ic("eye") + " الأدمن بيشوف وزنك وقياساتك وتمارينك في لوحة المتابعة.</p>" +
      '<button class="btn" style="width:100%" data-act="fit-save">' + (editing ? "احفظ التعديلات" : "اعمل خطتي") + "</button>";
  }

  /* -------- strength session -------- */
  function fitSess() { if (!state.fs) state.fs = {}; return state.fs; }
  function fitSegs(id, n) { return FIT_EX[id].side ? [["الناحية الأولى", n], ["غيّر الناحية", 5], ["الناحية التانية", n]] : [["اثبت", n]]; }
  function fitSessHTML(now) {
    var F = fitD(), k = now.key, d = fitDay(F, k), st = fitStage(F), ex = fitExList(F), S = fitSess();
    if (!d.sp) d.sp = { r: 0, done: {} };
    var sp = d.sp, top = '<div class="gtop"><button class="linkbtn" data-act="fit-sess-exit">✕</button><b>جولة المقاومة</b><span class="num">' + Math.min(sp.r + 1, st.rounds) + "/" + st.rounds + "</span></div>" +
      '<div class="bar" style="margin-block-end:12px"><i style="width:' + Math.round((sp.r + Object.keys(sp.done).length / ex.length) / st.rounds * 100) + '%"></i></div>';
    if (sp.r >= st.rounds) {
      return top + '<div class="card fit-done"><h3>🎉 خلّصت ' + st.rounds + " جولات!</h3><p>الجولة كانت عاملة معاك إزاي؟ ده بيحدد إمتى تطلع مستوى.</p>" +
        '<div class="fit-rpe"><button class="btn alt" data-act="fit-rpe" data-v="1">😌 سهلة</button><button class="btn alt" data-act="fit-rpe" data-v="2">💪 مناسبة</button><button class="btn alt" data-act="fit-rpe" data-v="3">🥵 صعبة</button></div></div>';
    }
    if (S.restEnd) {
      return top + '<div class="card fit-rest"><h3>راحة</h3><b class="num fit-big" id="fitRestT">' + fitMmSs((S.restEnd - Date.now()) / 1000) + '</b><p class="muted">اشرب شوية مية واتنفس. الجولة ' + (sp.r + 1) + " جاية.</p>" +
        '<button class="btn" data-act="fit-rest-skip">يلا الجولة اللي بعدها</button></div>';
    }
    var rows = ex.map(function (e) {
      var X = FIT_EX[e[0]], done = sp.done[e[0]], holding = S.hold && S.hold.e === e[0];
      var act = done ? '<span class="fit-ok">✓</span>' : X.t === "s"
        ? (holding ? '<b class="num fit-holdt" id="fitHoldT">…</b><button class="chipbtn" data-act="fit-hold-stop">إلغاء</button>'
          : '<button class="btn sm" data-act="fit-hold" data-e="' + e[0] + '">' + ic("timer") + " ابدأ</button>") + '<button class="chipbtn" data-act="fit-exd" data-e="' + e[0] + '">تم</button>'
        : '<button class="btn sm" data-act="fit-exd" data-e="' + e[0] + '">' + ic("check") + " تم</button>";
      return '<div class="card fit-ex' + (done ? " done" : "") + '"><div class="row between"><div><b>' + esc(X.n) + '</b><div class="num fit-tgt">' + fitTgtTxt(e[0], e[1]) + '</div></div><div class="row" style="gap:6px">' + act + "</div></div>" +
        (holding ? '<div class="fit-holdl" id="fitHoldL">' + "</div>" : "") +
        '<details class="fit-how"><summary>إزاي؟</summary><ol>' + X.how.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + '</ol><p class="fit-small"><b>غلطة شائعة:</b> ' + esc(X.err) + '</p><p class="fit-small"><b>أسهل:</b> ' + esc(X.easy) + "</p></details></div>";
    }).join("");
    return top + '<p class="muted fit-small">اعمل التمارين بالترتيب. لو معرفتش تكمّل العدد، اعمل اللي تقدر عليه بشكل صح واضغط تم.</p>' + rows;
  }
  function fitExDone(F, id) {
    var k = nowR().key, d = fitDay(F, k), sp = d.sp || (d.sp = { r: 0, done: {} }), ex = fitExList(F), st = fitStage(F);
    sp.done[id] = 1;
    if (ex.every(function (e) { return sp.done[e[0]]; })) {
      sp.r++; sp.done = {};
      if (sp.r < st.rounds) { fitSess().restEnd = Date.now() + FIT_ROUND_REST * 1000; fitBuzz(); }
      else fitBuzz([300, 120, 300]);
      $("#p-fit").scrollTop = 0;
    }
    saveMeta("learn", 400);
  }

  /* =================== tick: walk clock, holds, rest =================== */
  var fitLastPh = null;
  setInterval(function () {
    if (!state.loaded) return;
    var F = state.learn.fit; if (!F || !F.prof) return;
    var nowMs = Date.now();
    if (fitSettle(F, nowMs)) { render(); return; }
    var k = nowR().key, S = state.fs || {};
    if (F.run && F.run.k === k) {
      var wm = fitWalkMin(F, k, nowMs), ph = fitPhase(F, k, wm * 60), tgt = fitWalkTarget(F, k);
      var c = document.getElementById("fitClock"); if (c) c.textContent = fitMmSs(wm * 60);
      var pe = document.getElementById("fitPhase"); if (pe) { pe.textContent = ph.lbl + (ph.left ? " · " + fitMmSs(ph.left) : ""); pe.className = "fit-ph " + ph.t; }
      var b = document.getElementById("fitWalkBar"); if (b) b.style.width = Math.min(100, Math.round(wm / tgt * 100)) + "%";
      var sig = ph.t + ph.lbl.replace(/[^0-9/]/g, "");
      if (fitLastPh && fitLastPh !== sig && ph.t !== "warm") fitBuzz(ph.t === "jog" ? [400] : [150, 80, 150]);
      fitLastPh = sig;
      if (fitWalkXp(F, k, nowMs)) render();
    } else fitLastPh = null;
    if (S.hold) {
      var segs = fitSegs(S.hold.e, S.hold.n), el = (nowMs - S.hold.t) / 1000, acc = 0, cur = null;
      for (var i = 0; i < segs.length; i++) { if (el < acc + segs[i][1]) { cur = { i: i, lbl: segs[i][0], left: acc + segs[i][1] - el }; break; } acc += segs[i][1]; }
      if (!cur) { var e = S.hold.e; S.hold = null; fitBuzz([300, 120, 300]); fitExDone(F, e); render(); }
      else {
        if (S.hold.seg !== cur.i) { if (S.hold.seg != null) fitBuzz(); S.hold.seg = cur.i; }
        var ht = document.getElementById("fitHoldT"); if (ht) ht.textContent = fitMmSs(Math.ceil(cur.left));
        var hl = document.getElementById("fitHoldL"); if (hl) hl.textContent = cur.lbl;
      }
    }
    if (S.restEnd) {
      var left = (S.restEnd - nowMs) / 1000;
      if (left <= 0) { S.restEnd = null; fitBuzz(); render(); }
      else { var rt = document.getElementById("fitRestT"); if (rt) rt.textContent = fitMmSs(Math.ceil(left)); }
    }
  }, 1000);

  /* =================== events =================== */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var act = el.getAttribute("data-act"); if (act.indexOf("fit-") !== 0) return;
    var now = nowR(), k = now.key, F, d, v = el.getAttribute("data-v");
    switch (act) {
      case "fit-open": fitUi().v = "today"; goTab("fit"); render(); break;
      case "fit-v": fitUi().v = v; state.fdraft = null; $("#p-fit").scrollTop = 0; render(); break;
      case "fit-edit": state.fdraft = null; fitUi().v = "setup"; $("#p-fit").scrollTop = 0; render(); break;
      case "fit-sex": fitCapture(); fitDraft().sex = v; render(); break;
      case "fit-lim": fitCapture(); var L = fitDraft().lim; L[v] = !L[v]; render(); break;
      case "fit-day": {
        fitCapture(); var D = fitDraft(), x = Number(v), at = D.sched.indexOf(x);
        if (at >= 0) D.sched.splice(at, 1); else if (D.sched.length < 4) { D.sched.push(x); if (D.rest === x) D.rest = null; } else toast("أقصى حاجة ٤ أيام");
        render(); break;
      }
      case "fit-rest": { fitCapture(); var D2 = fitDraft(), r = Number(v); D2.rest = r; var ri = D2.sched.indexOf(r); if (ri >= 0) D2.sched.splice(ri, 1); render(); break; }
      case "fit-save": {
        fitCapture(); var Dr = fitDraft();
        var age = parseInt(Dr.age, 10), h = parseFloat(Dr.h), w = parseFloat(Dr.w), waist = parseFloat(Dr.waist) || 0;
        if (!(age >= 12 && age <= 90)) { toast("اكتب سنك (من ١٢ لـ ٩٠)"); break; }
        if (!(h >= 120 && h <= 220)) { toast("اكتب طولك بالسنتيمتر (مثلًا 172)"); break; }
        if (!(w >= 30 && w <= 300)) { toast("اكتب وزنك بالكيلو"); break; }
        if (waist && !(waist >= 50 && waist <= 200)) { toast("محيط الوسط بالسنتيمتر (مثلًا 100)"); break; }
        if (Dr.sched.length < 2) { toast("اختار يومين مقاومة على الأقل"); break; }
        if (Dr.rest == null) { toast("اختار يوم الراحة"); break; }
        F = fitD(); var first = !F.prof;
        F.prof = { sex: Dr.sex === "f" ? "f" : "m", age: age, h: Math.round(h), w: Math.round(w * 10) / 10, waist: waist ? Math.round(waist * 2) / 2 : 0, lim: { knee: !!Dr.lim.knee, back: !!Dr.lim.back, bp: !!Dr.lim.bp }, start: first ? k : F.prof.start };
        F.sched = Dr.sched.slice(); F.rest = Dr.rest;
        if (first) { F.log = [{ k: k, w: F.prof.w, waist: F.prof.waist || 0 }]; F.st = 0; F.stAt = k; F.hist = [{ k: k, st: 0 }]; }
        state.fdraft = null; fitUi().v = "today"; saveMeta("learn", 0); $("#p-fit").scrollTop = 0; render();
        toast(first ? "خطتك جاهزة — يلا أول مشوار 💪" : "اتحفظت"); break;
      }
      case "fit-walk": {
        F = fitD(); fitSettle(F, Date.now());
        if (F.run && F.run.k === k) {
          d = fitDay(F, k); d.wm = Math.round(fitWalkMin(F, k, Date.now()) * 10) / 10; F.run = null; fitWalkXp(F, k, 0);
        } else { F.run = { k: k, t: Date.now() }; fitLastPh = null; try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (er) { } }
        saveMeta("learn", 0); render(); break;
      }
      case "fit-add": {
        F = fitD(); d = fitDay(F, k); d.wm = Math.max(0, Math.round(((d.wm || 0) + Number(el.getAttribute("data-n"))) * 10) / 10);
        fitWalkXp(F, k, Date.now()); saveMeta("learn", 400); render(); break;
      }
      case "fit-sess": state.fs = {}; fitUi().v = "sess"; $("#p-fit").scrollTop = 0; render(); break;
      case "fit-sess-exit": state.fs = {}; fitUi().v = "today"; $("#p-fit").scrollTop = 0; render(); break;
      case "fit-exd": { var S = fitSess(); if (S.hold && S.hold.e === el.getAttribute("data-e")) S.hold = null; fitExDone(fitD(), el.getAttribute("data-e")); render(); break; }
      case "fit-hold": {
        var id = el.getAttribute("data-e"), tg = (fitExList(fitD()).filter(function (x) { return x[0] === id; })[0] || [id, 30])[1];
        fitSess().hold = { e: id, n: tg, t: Date.now(), seg: null }; render(); break;
      }
      case "fit-hold-stop": fitSess().hold = null; render(); break;
      case "fit-rest-skip": fitSess().restEnd = null; render(); break;
      case "fit-rpe": {
        F = fitD(); d = fitDay(F, k); var rp = Number(v);
        var wasDone = d.s; d.s = 1; d.rpe = rp; delete d.sp;
        F.easy = rp === 1 ? (F.easy || 0) + 1 : 0; F.hard = rp === 3 ? (F.hard || 0) + 1 : 0;
        if (!wasDone) addXp(10, now);
        state.fs = {}; fitUi().v = "today"; saveMeta("learn", 0); $("#p-fit").scrollTop = 0; render(); toast("عاش! جولة النهارده اتسجّلت 💪"); break;
      }
      case "fit-lvl": {
        F = fitD(); var nst = Math.max(0, Math.min(FIT_STAGES.length - 1, (F.st || 0) + Number(el.getAttribute("data-d"))));
        if (nst === F.st) break;
        F.st = nst; F.stAt = k; F.easy = 0; F.hard = 0; F.hist.push({ k: k, st: nst });
        d = F.days[k]; if (d && !d.s) delete d.sp;
        saveMeta("learn", 0); render(); toast("بقيت في المستوى " + (nst + 1)); break;
      }
      case "fit-lvl-no": F = fitD(); F.easy = 0; F.hard = 0; saveMeta("learn", 300); render(); break;
      case "fit-log": {
        F = fitD();
        var lw = parseFloat(($("#fitLogW") || {}).value), lz = parseFloat(($("#fitLogWaist") || {}).value);
        if (lw && !(lw >= 30 && lw <= 300)) { toast("الوزن بالكيلو"); break; }
        if (lz && !(lz >= 50 && lz <= 200)) { toast("الوسط بالسنتيمتر"); break; }
        if (!lw && !lz) { toast("اكتب الوزن أو الوسط"); break; }
        var entry = F.log.filter(function (x) { return x.k === k; })[0];
        if (!entry) { entry = { k: k, w: 0, waist: 0 }; F.log.push(entry); F.log.sort(function (a, b) { return a.k < b.k ? -1 : 1; }); }
        if (lw) entry.w = Math.round(lw * 10) / 10;
        if (lz) entry.waist = Math.round(lz * 2) / 2;
        saveMeta("learn", 0); render(); toast("اتسجّل"); break;
      }
      case "fit-log-del": {
        F = fitD(); var dk = el.getAttribute("data-k");
        if (F.log.length <= 1) { toast("ده أول قياس — عدّله من «عدّل بياناتك»"); break; }
        if (!confirm("تمسح قياس " + greg(dk) + "؟")) break;
        F.log = F.log.filter(function (x) { return x.k !== dk; }); saveMeta("learn", 0); render(); break;
      }
    }
  });
