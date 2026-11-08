"use strict";
  /* ---------------- أكلي — daily food log: calories + protein ----------------
     Kept in its own "food" meta row (state.food), NOT inside "learn", so none of it
     reaches the admin dashboard (which reads "learn") — the admin side also drops any
     "food" row it receives. Shape:
       days   {key: {it: [entry], inc: 1 if the day wasn't fully logged}}
       entry  {k, n, u, q, kc, p, fat, fg, sg, out}  — kcal/protein are stored, so later
              changes to the database never rewrite history. fat = tbsp of oil+ghee in
              it, fg = the ghee/butter part, sg = sugar teaspoons.
       my     [{id, n, u, kc, p, fat, fg, rc}]  — own foods and recipes (per one unit)
       recent ["db:id" | "my:id"], cal {tdee, at} after a weekly calibration */
  var FOOD_MEALS = [["b", "فطار"], ["l", "غدا"], ["d", "عشا"], ["s", "سناكس"], ["dr", "مشروبات"], ["sw", "حلو"]];
  var FOOD_BY_ID = {}; FOODS.forEach(function (f) { FOOD_BY_ID[f[0]] = f; });
  var ING_BY_ID = {}; FOOD_ING.forEach(function (g) { ING_BY_ID[g[0]] = g; });

  function fdD() { var F = state.food; if (!F.days) F.days = {}; if (!F.my) F.my = []; if (!F.recent) F.recent = []; return F; }
  function fdDay(k) { var D = fdD(); return D.days[k] || (D.days[k] = { it: [] }); }
  function fdTot(k) {
    var d = (state.food.days || {})[k], t = { kc: 0, p: 0, fat: 0, fg: 0, sg: 0, n: 0 };
    ((d && d.it) || []).forEach(function (e) { t.kc += e.kc || 0; t.p += e.p || 0; t.fat += e.fat || 0; t.fg += e.fg || 0; t.sg += e.sg || 0; t.n++; });
    t.kc = Math.round(t.kc); t.p = Math.round(t.p); t.fat = Math.round(t.fat * 2) / 2; t.fg = Math.round(t.fg * 2) / 2; t.sg = Math.round(t.sg);
    return t;
  }
  function fdUi() { if (!state.fd) state.fd = { v: "day", date: null, meal: "b", q: "", cat: "rec", cfg: null, cu: null, rc: null }; return state.fd; }
  function fdTarget() {
    var F = fitGet(); if (!F) return null;
    var N = fitNums(F), cal = state.food.cal, tdee = (cal && cal.tdee) || N.tdee, min = F.prof.sex === "f" ? 1200 : 1500;
    return { kcal: Math.max(min, Math.round((tdee - 500) / 50) * 50), pLo: N.protLo, pHi: N.protHi, tdee: tdee, formula: N.tdee, cal: !!cal };
  }
  function fdQtxt(q) { var w = Math.floor(q), h = q - w >= 0.5; return w === 0 && h ? "½" : (w ? String(w) : "") + (h ? "½" : ""); }
  function fdNorm(s) { return String(s || "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").toLowerCase(); }

  /* -------- an item from the database or from «أكلاتي», normalized -------- */
  function fdItem(key) {
    var p = key.split(":"), id = p.slice(1).join(":");
    if (p[0] === "my") {
      var m = fdD().my.filter(function (x) { return x.id === id; })[0]; if (!m) return null;
      return fdApplyOv({ key: key, n: m.n, units: [[m.u || "حصة", m.kc, m.p, 0]], c: false, sg: null, F: null, out: false, my: m });
    }
    var f = FOOD_BY_ID[id]; if (!f) return null;
    var fl = f[4] || "", sm = /s(\d)/.exec(fl), Fm = /F([og])/.exec(fl);
    return fdApplyOv({ key: key, n: f[1], cat: f[2], units: f[3], c: fl.indexOf("c") >= 0, sg: sm ? Number(sm[1]) : null, F: Fm ? Fm[1] : null, out: fl.indexOf("o") >= 0, my: null });
  }
  // The person's own corrections: ov[key][unitIndex] = [kcal, protein] for one unit.
  function fdApplyOv(it) {
    var ov = state.food.ov && state.food.ov[it.key]; if (!ov) return it;
    it.base = it.units; it.ovd = {};
    it.units = it.units.map(function (u, i) { if (!ov[i]) return u; it.ovd[i] = 1; return [u[0], ov[i][0], ov[i][1], u[3]]; });
    return it;
  }
  function fdDefFat(it, ui, q, out) { return it.c ? Math.round(q * it.units[ui][3] * (out ? 1.5 : 1) * 2) / 2 : 0; }
  function fdCfgNew(key) {
    var it = fdItem(key); if (!it) return null;
    return { key: key, ui: 0, q: 1, fat: fdDefFat(it, 0, 1, false), ft: "o", fatT: false, sg: it.sg != null ? it.sg : null, out: false };
  }
  function fdEntry(cfg) {
    var it = fdItem(cfg.key), u = it.units[cfg.ui], q = cfg.q, e = { k: cfg.key, n: it.n, u: u[0], q: q, kc: u[1] * q, p: u[2] * q, fat: 0, fg: 0, sg: 0 };
    if (it.c && cfg.fat > 0) { e.kc += cfg.fat * (cfg.ft === "g" ? FOOD_KCAL_GHEE : FOOD_KCAL_OIL); e.fat = cfg.fat; e.fg = cfg.ft === "g" ? cfg.fat : 0; }
    if (it.sg != null && cfg.sg > 0) { e.kc += cfg.sg * FOOD_KCAL_SUGAR; e.sg = cfg.sg; }
    if (it.F) { var t = /صغيرة/.test(u[0]) ? 1 / 3 : 1; e.fat = q * t; e.fg = it.F === "g" ? q * t : 0; }
    if (it.my) { e.fat = (it.my.fat || 0) * q; e.fg = (it.my.fg || 0) * q; }
    if (cfg.out && it.c) e.out = 1;
    e.kc = Math.round(e.kc); e.p = Math.round(e.p * 10) / 10; e.fat = Math.round(e.fat * 10) / 10; e.fg = Math.round(e.fg * 10) / 10;
    return e;
  }
  function fdPushRecent(key) { var D = fdD(); D.recent = [key].concat(D.recent.filter(function (x) { return x !== key; })).slice(0, 16); }

  /* -------- weekly calibration: logged intake vs the real weight trend -------- */
  function fdCalib(now) {
    var F = fitGet(); if (!F) return null;
    var end = addDays(now.key, -1), start = addDays(end, -20), days = 0, sum = 0;
    for (var k = start; k <= end; k = addDays(k, 1)) {
      var d = state.food.days && state.food.days[k], t = fdTot(k);
      if (d && !d.inc && t.kc >= 800) { days++; sum += t.kc; }
    }
    var pts = [{ k: F.prof.start, w: F.prof.w }].concat(F.log.filter(function (l) { return l.w; }).map(function (l) { return { k: l.k, w: l.w }; }))
      .filter(function (x) { return x.k >= addDays(start, -3) && x.k <= now.key; });
    var seen = {}; pts = pts.filter(function (x) { if (seen[x.k]) return false; seen[x.k] = 1; return true; }).sort(function (a, b) { return a.k < b.k ? -1 : 1; });
    var res = { days: days, need: 10, wn: pts.length, ok: false };
    if (days < 10 || pts.length < 3 || fitDaysBetween(pts[0].k, pts[pts.length - 1].k) < 14) return res;
    var xs = pts.map(function (x) { return fitDaysBetween(pts[0].k, x.k); }), ys = pts.map(function (x) { return x.w; });
    var mx = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length, my = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length, num = 0, den = 0;
    xs.forEach(function (x, i) { num += (x - mx) * (ys[i] - my); den += (x - mx) * (x - mx); });
    var slope = den ? num / den : 0, avg = Math.round(sum / days), N = fitNums(F);
    var tdee = Math.round((avg - slope * 7700) / 10) * 10;
    tdee = Math.max(N.tdee - 700, Math.min(N.tdee + 700, tdee));
    var cur = (state.food.cal && state.food.cal.tdee) || N.tdee;
    res.ok = true; res.avg = avg; res.wk = Math.round(slope * 7 * 100) / 100; res.tdee = tdee; res.cur = cur; res.diff = tdee - cur;
    return res;
  }

  /* =================== views =================== */
  function foodHTML(now) {
    var u = fdUi();
    if (u.v === "add") return fdAddHTML(now);
    if (u.v === "cfg" && u.cfg) return fdCfgHTML(now);
    if (u.v === "custom") return fdCustomHTML(now);
    if (u.v === "rc") return fdRecipeHTML(now);
    return fdDayHTML(now);
  }
  function fdDateLbl(k, now) { return k === now.key ? "النهارده" : k === addDays(now.key, -1) ? "امبارح" : greg(k); }
  function fdDayHTML(now) {
    var u = fdUi(), k = u.date || now.key, T = fdTarget(), t = fdTot(k), D = state.food.days[k] || { it: [] };
    if (!T) return '<div class="card"><p>ظبط بياناتك في «التمارين» الأول عشان نحسب هدف أكلك.</p></div>';
    var pct = Math.min(100, Math.round(t.kc / T.kcal * 100)), left = T.kcal - t.kc, over = left < 0;
    var nav = '<div class="fd-nav"><button class="chipbtn" data-act="fd-date" data-d="-1" aria-label="اليوم اللي قبله">›</button><b>' + esc(fdDateLbl(k, now)) + "</b>" +
      '<button class="chipbtn" data-act="fd-date" data-d="1"' + (k >= now.key ? " disabled" : "") + ' aria-label="اليوم اللي بعده">‹</button></div>';
    var sum = '<div class="card plan fd-sum' + (over ? " over" : "") + '"><div class="hero"><div class="ringbox">' + pctRingSVG(pct) +
      '<div class="ringtxt"><b class="num">' + t.kc + "</b><span>من " + T.kcal + " سعر</span></div></div>" +
      '<div class="grow plan-lines"><div class="plan-line"><span class="grow"><b>' + (over ? "زيادة " + (-left) : "فاضل " + left) + " سعر</b></span></div>" +
      '<div class="fd-prot"><span>بروتين <b class="num">' + t.p + "</b> / " + T.pLo + "–" + T.pHi + ' جم</span><div class="bar"><i style="width:' + Math.min(100, Math.round(t.p / T.pLo * 100)) + '%"></i></div></div>' +
      '<div class="plan-line"><span class="grow">زيت وسمنة: <span class="num">' + t.fat + "</span> معلقة" + (t.fg ? " (منها سمنة/زبدة " + t.fg + ")" : "") + "</span></div>" +
      (t.sg ? '<div class="plan-line"><span class="grow">سكر: <span class="num">' + t.sg + "</span> معلقة صغيرة</span></div>" : "") + "</div></div></div>";
    var hint = "";
    if (t.fg >= 2) hint = '<p class="fd-hint">' + ic("bulb") + " السمنة والزبدة النهارده " + t.fg + " معالق — جرّب تطبخ بالزيت بدلها.</p>";
    else if (t.sg >= 8) hint = '<p class="fd-hint">' + ic("bulb") + " " + t.sg + " معالق سكر = " + t.sg * FOOD_KCAL_SUGAR + " سعر من المشروبات بس. قلّل معلقة في كل كوباية.</p>";
    var meals = FOOD_MEALS.map(function (m) {
      var list = D.it.map(function (e, i) { return { e: e, i: i }; }).filter(function (x) { return (x.e.m || "s") === m[0]; });
      var sub = list.reduce(function (a, x) { return a + x.e.kc; }, 0);
      var rows = list.map(function (x) {
        var e = x.e;
        return '<li><span class="grow"><b>' + esc(e.n) + '</b><small class="muted">' + fdQtxt(e.q) + " " + esc(e.u) + (e.fat && !/^db:(oil|ghee|butter)$/.test(e.k) ? " · " + e.fat + " م " + (e.fg ? "سمنة" : "زيت") : "") + (e.sg ? " · " + e.sg + " سكر" : "") + (e.out ? " · بره" : "") + "</small></span>" +
          '<b class="num">' + e.kc + '</b><button class="linkbtn" data-act="fd-del" data-i="' + x.i + '" aria-label="امسح">✕</button></li>';
      }).join("");
      var copy = "";
      if (!list.length) {
        var y = state.food.days[addDays(k, -1)], yl = ((y && y.it) || []).filter(function (e) { return (e.m || "s") === m[0]; });
        if (yl.length) copy = '<button class="linkbtn fd-copy" data-act="fd-copy" data-m="' + m[0] + '">زي امبارح (' + yl.reduce(function (a, e) { return a + e.kc; }, 0) + " سعر)</button>";
      }
      return '<div class="card fd-meal"><div class="row between"><h3>' + m[1] + (sub ? ' <small class="muted num">' + sub + " سعر</small>" : "") + '</h3><button class="btn sm" data-act="fd-add" data-m="' + m[0] + '">' + ic("plus") + " ضيف</button></div>" +
        (rows ? '<ul class="fd-list">' + rows + "</ul>" : copy) + "</div>";
    }).join("");
    var cal = "";
    if (k === now.key) {
      var C = fdCalib(now);
      if (C && C.ok && Math.abs(C.diff) >= 100 && state.food.calSkip !== now.key && !(state.food.cal && fitDaysBetween(state.food.cal.at, now.key) < 7)) {
        cal = '<div class="card fd-cal"><h3>' + ic("target") + " معايرة هدفك</h3><p>آخر ٣ أسابيع أكلت في المتوسط <b class=\"num\">" + C.avg + "</b> سعر، ووزنك " + (C.wk < 0 ? "نزل " + (-C.wk) : C.wk > 0 ? "زاد " + C.wk : "ثابت") + (C.wk ? " كجم في الأسبوع" : "") +
          ". يعني جسمك بيحرق فعلًا حوالي <b class=\"num\">" + C.tdee + "</b> سعر مش " + C.cur + ".</p><p class=\"muted fd-small\">" + (C.diff < 0 ? "غالبًا فيه أكل مش بيتسجّل أو مقاسات أكبر من المكتوب — والمعايرة بتصلّح ده." : "إنت بتحرق أكتر من المعادلة — ممكن تاكل أكتر شوية وتفضل بتخس.") + "</p>" +
          '<div class="row wrapr"><button class="btn sm" data-act="fd-cal-ok" data-v="' + C.tdee + '">خلّي هدفي ' + Math.max(1200, Math.round((C.tdee - 500) / 50) * 50) + ' سعر</button><button class="btn sm alt" data-act="fd-cal-no">مش دلوقتي</button></div></div>';
      } else if (C && !C.ok) {
        cal = '<p class="muted fd-small fd-calnote">' + ic("target") + " المعايرة الأسبوعية بتقارن أكلك بالميزان وبتصلّح هدفك — محتاجة " + C.need + " أيام متسجّلة كاملة (عندك " + C.days + ") ووزن ٣ مرات على أسبوعين.</p>";
      }
    }
    var inc = '<label class="fd-inc"><input type="checkbox" data-act="fd-inc"' + (D.inc ? " checked" : "") + "> اليوم ده مش متسجّل كله (مايدخلش في المعايرة)</label>";
    return nav + sum + hint + cal + meals + inc +
      '<p class="muted fd-small">' + (T.cal ? "هدفك متعاير على وزنك الحقيقي. " : "") + "الأرقام تقديرية — سجّل وإنت بتاكل أو بعدها على طول، وقول الزيت والسكر بصراحة، والمعايرة تكمّل الباقي.</p>";
  }

  function fdRow(key) {
    var it = fdItem(key); if (!it) return "";
    var u = it.units[0];
    return '<button class="fd-row" data-act="fd-pick" data-k="' + esc(key) + '"><span class="grow"><b>' + esc(it.n) + "</b><small class=\"muted\">" + esc(u[0]) + (it.units.length > 1 ? " وأحجام تانية" : "") + (it.my && it.my.rc ? " · وصفتك" : "") + (it.ovd && it.ovd[0] ? " · رقمك" : "") + '</small></span><span class="num">' + u[1] + " سعر</span></button>";
  }
  function fdAddHTML(now) {
    var u = fdUi(), meal = (FOOD_MEALS.filter(function (m) { return m[0] === u.meal; })[0] || FOOD_MEALS[0])[1];
    return '<button class="linkbtn" data-act="fd-back">← رجوع</button><div class="sec-h">ضيف لـ ' + meal + "</div>" +
      '<input class="inp fd-search" id="fdQ" type="search" placeholder="دوّر: فول، رز، شاي…" value="' + esc(u.q) + '" autocomplete="off" autocorrect="off" spellcheck="false">' +
      '<div class="fd-cats" id="fdCats">' + fdCatsHTML(u) + '</div><div class="card fd-results" id="fdRes">' + fdResultsHTML(u) + "</div>" +
      '<div class="row wrapr fd-more"><button class="btn sm alt" data-act="fd-custom">' + ic("pen") + ' رقم تقريبي أو أكلة مش موجودة</button><button class="btn sm alt" data-act="fd-rc">' + ico("food") + " اعمل وصفة من البيت</button></div>";
  }
  function fdCatsHTML(u) {
    return [["rec", "الأخيرة"], ["my", "أكلاتي"]].concat(FOOD_CATS).map(function (c) { return '<button class="chipbtn' + (u.cat === c[0] && !u.q ? " on" : "") + '" data-act="fd-cat" data-v="' + c[0] + '">' + c[1] + "</button>"; }).join("");
  }
  function fdResultsHTML(u) {
    var D = fdD(), keys;
    if (u.q) {
      var q = fdNorm(u.q).trim();
      keys = D.my.filter(function (m) { return fdNorm(m.n).indexOf(q) >= 0; }).map(function (m) { return "my:" + m.id; })
        .concat(FOODS.filter(function (f) { return fdNorm(f[1]).indexOf(q) >= 0; }).map(function (f) { return "db:" + f[0]; }));
    } else if (u.cat === "rec") keys = D.recent.filter(function (k) { return fdItem(k); });
    else if (u.cat === "my") keys = D.my.map(function (m) { return "my:" + m.id; });
    else keys = FOODS.filter(function (f) { return f[2] === u.cat; }).map(function (f) { return "db:" + f[0]; });
    var empty = u.q ? "مش لاقيه؟ سجّله برقم تقريبي أو اعمله وصفة من تحت." : u.cat === "rec" ? "لسه مفيش — اختار من الأقسام أو دوّر." : u.cat === "my" ? "أكلاتك والوصفات اللي بتعملها هتظهر هنا." : "";
    return keys.length ? keys.slice(0, 60).map(fdRow).join("") : '<p class="muted fd-small">' + empty + "</p>";
  }
  function fdStep(act, val, lbl, unit) {
    return '<div class="fd-step"><span>' + lbl + '</span><div class="row"><button class="chipbtn" data-act="' + act + '" data-d="-1" aria-label="أقل">−</button><b class="num">' + val + "</b>" + (unit ? "<small>" + unit + "</small>" : "") + '<button class="chipbtn" data-act="' + act + '" data-d="1" aria-label="أكتر">+</button></div></div>';
  }
  function fdCfgHTML(now) {
    var u = fdUi(), c = u.cfg, it = fdItem(c.key); if (!it) { u.v = "add"; return fdAddHTML(now); }
    var e = fdEntry(c), meal = (FOOD_MEALS.filter(function (m) { return m[0] === u.meal; })[0] || FOOD_MEALS[0])[1];
    var units = it.units.length > 1 ? '<div class="row wrapr fd-units">' + it.units.map(function (x, i) { return '<button class="chipbtn' + (c.ui === i ? " on" : "") + '" data-act="fd-u" data-i="' + i + '">' + esc(x[0]) + "</button>"; }).join("") + "</div>" : '<p class="muted fd-small">' + esc(it.units[0][0]) + "</p>";
    var fat = it.c ? '<div class="fd-fat">' + fdStep("fd-fat", fdQtxt(c.fat) || "0", "زيت أو سمنة في الكمية دي", "معلقة كبيرة") +
      '<div class="row wrapr"><button class="chipbtn' + (c.ft !== "g" ? " on" : "") + '" data-act="fd-ft" data-v="o">زيت</button><button class="chipbtn' + (c.ft === "g" ? " on" : "") + '" data-act="fd-ft" data-v="g">سمنة أو زبدة</button>' +
      '<button class="chipbtn' + (c.out ? " on" : "") + '" data-act="fd-out">من بره (دهون أكتر)</button></div>' +
      '<p class="muted fd-small">الرقم المقترح = متوسط البيت. لو إنت اللي طابخ قول الحقيقي — المعلقة الكبيرة ≈ ' + FOOD_KCAL_OIL + " سعر.</p></div>" : "";
    var sug = it.sg != null ? fdStep("fd-sg", c.sg, "سكر", "معلقة صغيرة") : "";
    return '<button class="linkbtn" data-act="fd-back">← رجوع</button><div class="sec-h">' + esc(it.n) + "</div>" +
      '<div class="card">' + units + fdStep("fd-q", fdQtxt(c.q), "الكمية", "") + fat + sug + "</div>" +
      '<div class="card fd-total"><span>الإجمالي</span><b class="num">' + e.kc + ' سعر</b><span class="num">' + e.p + " جم بروتين</span></div>" + fdOvHTML(it, c) +
      '<button class="btn" style="width:100%" data-act="fd-save">' + ic("plus") + " ضيف لـ " + meal + "</button>" +
      (it.my ? '<button class="linkbtn fd-mydel" data-act="fd-my-del" data-id="' + esc(it.my.id) + '">امسحها من «أكلاتي»</button>' : "");
  }
  function fdOvHTML(it, c) {
    var un = it.units[c.ui], mine = it.ovd && it.ovd[c.ui];
    if (!c.ov) return '<button class="linkbtn fd-ovlink" data-act="fd-ov-open">' + ic("pen") + " الرقم مش مظبوط؟ عدّل سعرات «" + esc(un[0]) + "» الواحد" + (mine ? " (معدّل بإيدك)" : "") + "</button>";
    var base = it.base && it.base[c.ui];
    return '<div class="card fd-ov"><h3>سعرات «' + esc(un[0]) + '» الواحد</h3>' +
      '<div class="fit-form grid"><label class="field">سعرات<input class="inp" id="ovK" type="number" inputmode="numeric" min="0" max="5000" value="' + esc(String(c.ov.kc)) + '"></label>' +
      '<label class="field">بروتين (جم)<input class="inp" id="ovP" type="number" inputmode="decimal" min="0" max="300" step="0.1" value="' + esc(String(c.ov.p)) + '"></label></div>' +
      '<div class="row wrapr fd-ovadd">' + [-50, -25, 25, 50, 100].map(function (n) { return '<button class="chipbtn" data-act="fd-ov-add" data-n="' + n + '">' + (n > 0 ? "+" : "−") + Math.abs(n) + "</button>"; }).join("") + "</div>" +
      '<p class="muted fd-small">من غير الزيت والسكر — دول بيتحسبوا لوحدهم فوق. الرقم بيتحفظ للصنف ده في المرات الجاية.' + (base ? " الرقم الأصلي: " + base[1] + " سعر." : "") + "</p>" +
      '<div class="row wrapr"><button class="btn sm" data-act="fd-ov-save">احفظ الرقم</button>' + (mine ? '<button class="btn sm alt" data-act="fd-ov-reset">رجّع الأصلي</button>' : "") + '<button class="linkbtn" data-act="fd-ov-close">إلغاء</button></div></div>';
  }
  function fdCapOv() { var c = fdUi().cfg; if (!c || !c.ov) return; var k = $("#ovK"), p = $("#ovP"); if (k) c.ov.kc = k.value; if (p) c.ov.p = p.value; }
  function fdCustomHTML(now) {
    var u = fdUi(), c = u.cu || (u.cu = { n: "", kc: "", p: "", keep: true });
    var est = [["سناك صغير", 150], ["وجبة خفيفة", 300], ["وجبة عادية", 550], ["وجبة كبيرة", 850], ["عزومة", 1200]];
    return '<button class="linkbtn" data-act="fd-back">← رجوع</button><div class="sec-h">أكلة مش موجودة</div>' +
      '<div class="card"><label class="field">اسمها<input class="inp" id="cuN" value="' + esc(c.n) + '" placeholder="مثلًا: ساندوتش من المحل اللي جنب الشغل"></label>' +
      '<div class="fit-form grid" style="margin-block-start:10px"><label class="field">سعرات<input class="inp" id="cuK" type="number" inputmode="numeric" min="0" max="5000" value="' + esc(String(c.kc)) + '"></label>' +
      '<label class="field">بروتين (جم، لو عارف)<input class="inp" id="cuP" type="number" inputmode="decimal" min="0" max="300" value="' + esc(String(c.p)) + '"></label></div>' +
      '<p class="muted fd-small">مش عارف السعرات؟ اختار أقرب تقدير:</p><div class="row wrapr">' + est.map(function (x) { return '<button class="chipbtn' + (String(c.kc) === String(x[1]) ? " on" : "") + '" data-act="fd-cu-est" data-v="' + x[1] + '">' + x[0] + " ≈ " + x[1] + "</button>"; }).join("") + "</div>" +
      '<label class="fd-inc"><input type="checkbox" data-act="fd-cu-keep"' + (c.keep ? " checked" : "") + "> احفظها في «أكلاتي» عشان المرة الجاية</label></div>" +
      '<button class="btn" style="width:100%" data-act="fd-cu-save">' + ic("plus") + " ضيف</button>";
  }
  function fdRcTotals(rc) {
    var t = { kc: 0, p: 0, fat: 0, fg: 0 };
    rc.ings.forEach(function (x) {
      var g = ING_BY_ID[x.id]; if (!g) return; var un = g[2][x.u] || g[2][0];
      t.kc += un[1] * x.a; t.p += un[2] * x.a;
      if (g[3]) { var tb = (FOOD_ING_TBSP[un[0]] || 1) * x.a; t.fat += tb; if (g[3] === "g") t.fg += tb; }
    });
    return t;
  }
  function fdRecipeHTML(now) {
    var u = fdUi(), rc = u.rc || (u.rc = { n: "", ings: [], serv: 4, ing: "rice", a: "1", ui: 0 });
    var g = ING_BY_ID[rc.ing] || FOOD_ING[0], t = fdRcTotals(rc), serv = Math.max(1, Number(rc.serv) || 1);
    var list = rc.ings.map(function (x, i) {
      var gi = ING_BY_ID[x.id], un = gi[2][x.u] || gi[2][0];
      return '<li><span class="grow">' + esc(gi[1]) + ' <small class="muted">' + fdQtxt(x.a) + " " + esc(un[0]) + '</small></span><b class="num">' + Math.round(un[1] * x.a) + '</b><button class="linkbtn" data-act="fd-rc-del" data-i="' + i + '" aria-label="امسح">✕</button></li>';
    }).join("");
    return '<button class="linkbtn" data-act="fd-back">← رجوع</button><div class="sec-h">وصفة من البيت</div>' +
      '<div class="card"><label class="field">اسم الأكلة<input class="inp" id="rcN" value="' + esc(rc.n) + '" placeholder="مثلًا: مكرونة بالفراخ بتاعتي"></label>' +
      '<h3 style="margin-block:12px 6px">المكونات اللي في الحلة كلها</h3>' + (list ? '<ul class="fd-list">' + list + "</ul>" : '<p class="muted fd-small">ضيف كل حاجة دخلت الحلة — وماتنساش الزيت والسمنة.</p>') +
      '<div class="fd-rcadd"><select class="inp" id="rcI" aria-label="المكوّن">' + FOOD_ING.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === g[0] ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join("") + "</select>" +
      '<input class="inp" id="rcA" type="number" inputmode="decimal" min="0" step="0.25" value="' + esc(String(rc.a)) + '" aria-label="الكمية">' +
      '<select class="inp" id="rcU" aria-label="الوحدة">' + g[2].map(function (x, i) { return '<option value="' + i + '"' + (i === rc.ui ? " selected" : "") + ">" + esc(x[0]) + "</option>"; }).join("") + "</select>" +
      '<button class="btn sm" data-act="fd-rc-add">ضيف</button></div>' +
      '<label class="field" style="margin-block-start:12px;max-width:220px">الحلة كفّت كام طبق؟<input class="inp" id="rcS" type="number" inputmode="numeric" min="1" max="40" value="' + esc(String(rc.serv)) + '"></label></div>' +
      '<div class="card fd-total"><span>الطبق الواحد</span><b class="num">' + Math.round(t.kc / serv) + ' سعر</b><span class="num">' + Math.round(t.p / serv * 10) / 10 + " جم بروتين</span>" +
      '<small class="muted">الحلة كلها ' + Math.round(t.kc) + " سعر" + (t.fat ? " · فيها " + Math.round(t.fat * 10) / 10 + " معلقة زيت وسمنة" : "") + "</small></div>" +
      '<button class="btn" style="width:100%" data-act="fd-rc-save"' + (rc.ings.length ? "" : " disabled") + ">احفظها وسجّل طبق</button>";
  }
  function fdCapCu() { var c = fdUi().cu; if (!c) return; var n = $("#cuN"), k = $("#cuK"), p = $("#cuP"); if (n) c.n = n.value; if (k) c.kc = k.value; if (p) c.p = p.value; }
  function fdCapRc() {
    var rc = fdUi().rc; if (!rc) return;
    var n = $("#rcN"), a = $("#rcA"), s = $("#rcS"), un = $("#rcU");
    if (n) rc.n = n.value; if (a) rc.a = a.value; if (s) rc.serv = s.value; if (un) rc.ui = Number(un.value) || 0;
  }
  function fdGo(v) { fdUi().v = v; var p = $("#p-fit"); if (p) p.scrollTop = 0; render(); }

  /* =================== events =================== */
  // Typing in the search box only refreshes the results and chips — re-rendering the whole
  // panel on every keystroke recreated the input and dropped letters, especially while an
  // Arabic keyboard was still composing a word.
  function fdSearchUpdate(el) {
    var u = fdUi(); u.q = el.value;
    var r = document.getElementById("fdRes"), c = document.getElementById("fdCats");
    if (r) r.innerHTML = fdResultsHTML(u); if (c) c.innerHTML = fdCatsHTML(u);
  }
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "fdQ" && !e.isComposing) fdSearchUpdate(e.target);
  });
  document.addEventListener("compositionend", function (e) {
    if (e.target && e.target.id === "fdQ") fdSearchUpdate(e.target);
  });
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t) return;
    if (t.id === "rcI") { fdCapRc(); var rc = fdUi().rc; rc.ing = t.value; rc.ui = 0; render(); }
    if (t.getAttribute && t.getAttribute("data-act") === "fd-inc") {
      var k = fdUi().date || nowR().key, d = fdDay(k); if (t.checked) d.inc = 1; else delete d.inc; saveMeta("food", 300);
    }
    if (t.getAttribute && t.getAttribute("data-act") === "fd-cu-keep") { fdCapCu(); fdUi().cu.keep = t.checked; }
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var act = el.getAttribute("data-act"); if (act.indexOf("fd-") !== 0 || act === "fd-inc" || act === "fd-cu-keep") return;
    var u = fdUi(), now = nowR(), k = u.date || now.key, c = u.cfg, it, d;
    switch (act) {
      case "fd-date": { var nk = addDays(k, Number(el.getAttribute("data-d"))); if (nk > now.key) break; u.date = nk === now.key ? null : nk; render(); break; }
      case "fd-add": u.meal = el.getAttribute("data-m"); u.q = ""; u.cat = fdD().recent.length ? "rec" : "br"; fdGo("add"); break;
      case "fd-back": if (u.v === "cfg" || u.v === "custom" || u.v === "rc") fdGo("add"); else fdGo("day"); break;
      case "fd-cat": u.cat = el.getAttribute("data-v"); u.q = ""; render(); break;
      case "fd-pick": u.cfg = fdCfgNew(el.getAttribute("data-k")); if (u.cfg) fdGo("cfg"); break;
      case "fd-u": it = fdItem(c.key); c.ui = Number(el.getAttribute("data-i")); c.ov = null; if (!c.fatT) c.fat = fdDefFat(it, c.ui, c.q, c.out); render(); break;
      case "fd-q": it = fdItem(c.key); c.q = Math.max(0.5, Math.min(20, c.q + 0.5 * Number(el.getAttribute("data-d")))); if (!c.fatT) c.fat = fdDefFat(it, c.ui, c.q, c.out); if (it.sg != null && !c.sgT) c.sg = Math.round(it.sg * c.q); render(); break;
      case "fd-fat": c.fat = Math.max(0, Math.min(20, c.fat + 0.5 * Number(el.getAttribute("data-d")))); c.fatT = true; render(); break;
      case "fd-ft": c.ft = el.getAttribute("data-v"); render(); break;
      case "fd-out": it = fdItem(c.key); c.out = !c.out; if (!c.fatT) c.fat = fdDefFat(it, c.ui, c.q, c.out); render(); break;
      case "fd-sg": c.sg = Math.max(0, Math.min(30, c.sg + Number(el.getAttribute("data-d")))); c.sgT = true; render(); break;
      case "fd-ov-open": { it = fdItem(c.key); c.ov = { kc: it.units[c.ui][1], p: it.units[c.ui][2] }; render(); break; }
      case "fd-ov-close": c.ov = null; render(); break;
      case "fd-ov-add": fdCapOv(); c.ov.kc = Math.max(0, (parseFloat(c.ov.kc) || 0) + Number(el.getAttribute("data-n"))); render(); break;
      case "fd-ov-save": {
        fdCapOv(); var okc = Math.round(parseFloat(c.ov.kc)), op = Math.round((parseFloat(c.ov.p) || 0) * 10) / 10;
        if (!(okc >= 0 && okc <= 5000)) { toast("اكتب رقم السعرات"); break; }
        var OV = state.food.ov || (state.food.ov = {}); if (!OV[c.key]) OV[c.key] = {};
        OV[c.key][c.ui] = [okc, op]; c.ov = null; saveMeta("food", 0); render(); toast("اتحفظ رقمك للصنف ده"); break;
      }
      case "fd-ov-reset": {
        var OV2 = state.food.ov || {}; if (OV2[c.key]) { delete OV2[c.key][c.ui]; if (!Object.keys(OV2[c.key]).length) delete OV2[c.key]; }
        c.ov = null; saveMeta("food", 0); render(); toast("رجع الرقم الأصلي"); break;
      }
      case "fd-save": {
        var en = fdEntry(c); en.m = u.meal; fdDay(k).it.push(en); fdPushRecent(c.key);
        saveMeta("food", 0); u.cfg = null; fdGo("day"); toast(en.n + " — " + en.kc + " سعر"); break;
      }
      case "fd-del": {
        d = fdDay(k); var i = Number(el.getAttribute("data-i")), gone = d.it[i]; if (!gone) break;
        d.it.splice(i, 1); saveMeta("food", 0); render();
        undoToast("اتمسح " + gone.n, function () { fdDay(k).it.splice(Math.min(i, fdDay(k).it.length), 0, gone); saveMeta("food", 0); render(); });
        break;
      }
      case "fd-copy": {
        var m = el.getAttribute("data-m"), y = state.food.days[addDays(k, -1)];
        ((y && y.it) || []).forEach(function (x) { if ((x.m || "s") === m) fdDay(k).it.push(JSON.parse(JSON.stringify(x))); });
        saveMeta("food", 0); render(); break;
      }
      case "fd-cal-ok": state.food.cal = { tdee: Number(el.getAttribute("data-v")), at: now.key }; saveMeta("food", 0); render(); toast("هدفك اتعدّل"); break;
      case "fd-cal-no": state.food.calSkip = now.key; saveMeta("food", 300); render(); break;
      case "fd-custom": u.cu = { n: u.q || "", kc: "", p: "", keep: true }; fdGo("custom"); break;
      case "fd-cu-est": fdCapCu(); u.cu.kc = el.getAttribute("data-v"); render(); break;
      case "fd-cu-save": {
        fdCapCu(); var cu = u.cu, kc = Math.round(parseFloat(cu.kc)), pr = Math.round((parseFloat(cu.p) || 0) * 10) / 10, nm = String(cu.n || "").trim().slice(0, 60) || "أكلة";
        if (!(kc > 0 && kc <= 5000)) { toast("اكتب السعرات أو اختار تقدير"); break; }
        var key = null;
        if (cu.keep) { var my = { id: "m" + Date.now().toString(36), n: nm, u: "حصة", kc: kc, p: pr, fat: 0, fg: 0 }; fdD().my.push(my); key = "my:" + my.id; fdPushRecent(key); }
        fdDay(k).it.push({ k: key || "q", n: nm, u: "حصة", q: 1, kc: kc, p: pr, fat: 0, fg: 0, sg: 0, m: u.meal });
        saveMeta("food", 0); u.cu = null; fdGo("day"); toast(nm + " — " + kc + " سعر"); break;
      }
      case "fd-rc": u.rc = { n: "", ings: [], serv: 4, ing: "rice", a: "1", ui: 0 }; fdGo("rc"); break;
      case "fd-rc-add": {
        fdCapRc(); var rc = u.rc, a = parseFloat(rc.a);
        if (!(a > 0 && a <= 100)) { toast("اكتب الكمية"); break; }
        rc.ings.push({ id: rc.ing, a: a, u: rc.ui }); rc.a = "1"; render(); break;
      }
      case "fd-rc-del": fdCapRc(); u.rc.ings.splice(Number(el.getAttribute("data-i")), 1); render(); break;
      case "fd-rc-save": {
        fdCapRc(); var r2 = u.rc, sv = Math.max(1, Math.min(40, parseInt(r2.serv, 10) || 1)), tt = fdRcTotals(r2), nm2 = String(r2.n || "").trim().slice(0, 60);
        if (!nm2) { toast("اكتب اسم الأكلة"); break; }
        if (!r2.ings.length) break;
        var my2 = { id: "m" + Date.now().toString(36), n: nm2, u: "طبق", kc: Math.round(tt.kc / sv), p: Math.round(tt.p / sv * 10) / 10, fat: Math.round(tt.fat / sv * 10) / 10, fg: Math.round(tt.fg / sv * 10) / 10, rc: { ings: r2.ings, serv: sv } };
        fdD().my.push(my2); fdPushRecent("my:" + my2.id); saveMeta("food", 0);
        u.rc = null; u.cfg = fdCfgNew("my:" + my2.id); fdGo("cfg"); toast("اتحفظت في «أكلاتي»"); break;
      }
      case "fd-my-del": {
        var mid = el.getAttribute("data-id"); if (!confirm("تمسحها من «أكلاتي»؟ (اللي اتسجّل قبل كده هيفضل)")) break;
        fdD().my = fdD().my.filter(function (x) { return x.id !== mid; }); fdD().recent = fdD().recent.filter(function (x) { return x !== "my:" + mid; });
        saveMeta("food", 0); u.cfg = null; fdGo("add"); break;
      }
    }
  });
