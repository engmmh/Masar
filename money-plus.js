"use strict";
  /* ---------------- الحاسبة: reports, savings goals, tools ---------------- */
  // expView routes between four sub-screens; the original expenses screen lives
  // on as expMainView in money.js. Everything here reads/writes state.exp, so it
  // syncs through the same "exp" meta row as before.
  var EXP_TABS = [{ id: "main", t: "المصروفات" }, { id: "reports", t: "التقارير" }, { id: "goals", t: "الادخار" }, { id: "tools", t: "أدوات" }];
  function expView(now) {
    if (!Array.isArray(state.exp.goals)) state.exp.goals = [];
    if (!state.exp.zakat || typeof state.exp.zakat !== "object") state.exp.zakat = {};
    var tab = state.expTab || "main";
    var nav = '<div class="seg2 four" style="margin-block:4px 12px">' + EXP_TABS.map(function (t) {
      return '<button data-act="exp-tab" data-v="' + t.id + '" aria-pressed="' + (tab === t.id) + '">' + t.t + "</button>";
    }).join("") + "</div>";
    var body = tab === "reports" ? expReportsView(now) : tab === "goals" ? expGoalsView(now) : tab === "tools" ? expToolsView(now) : expMainView(now);
    return nav + body;
  }
  function expMonthNav(mk) {
    return '<div class="row between" style="margin-block:2px 10px"><button class="btn sm alt" data-act="exp-month" data-n="-1">‹</button><b>' + monthLabel(mk) + '</b><button class="btn sm alt" data-act="exp-month" data-n="1">›</button></div>';
  }
  function daysInMonth(mk) { return new Date(Date.UTC(Number(mk.slice(0, 4)), Number(mk.slice(5, 7)), 0)).getUTCDate(); }

  /* reports */
  function expDonut(cats, total) {
    var size = 170, c = size / 2, r = 62, sw = 22, circ = 2 * Math.PI * r, off = 0, segs = "";
    if (!total) segs = '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="var(--surface2)" stroke-width="' + sw + '"/>';
    cats.forEach(function (x) {
      var len = x.amount / total * circ; if (len <= 0) return;
      segs += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + catColor(x.cat) + '" stroke-width="' + sw + '" stroke-dasharray="' + len.toFixed(2) + " " + (circ - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + c + " " + c + ')"><title>' + esc(x.cat) + ": " + fmtMoney(x.amount) + "</title></circle>";
      off += len;
    });
    return '<svg viewBox="0 0 ' + size + " " + size + '" class="mx-donut" role="img" aria-label="توزيع المصروف على البنود">' + segs +
      '<text x="' + c + '" y="' + (c - 2) + '" text-anchor="middle" class="mx-donut-v">' + fmtMoney(total) + '</text><text x="' + c + '" y="' + (c + 16) + '" text-anchor="middle" class="mx-donut-l">إجمالي</text></svg>';
  }
  function expDailySeries(mk) {
    var n = daysInMonth(mk), v = []; for (var i = 0; i < n; i++) v.push(0);
    expItemsOf(mk).forEach(function (it) { var d = Number(it.date.slice(8)) - 1; if (d >= 0 && d < n) v[d] += it.amount; });
    return v;
  }
  function expPaceChart(mk, now, income) {
    var v = expDailySeries(mk), n = v.length, isCur = mk === monthKey(now.key), upto = isCur ? Number(now.key.slice(8)) : n;
    var W = 600, H = 200, pl = 8, pr = 8, pt = 12, pb = 22, iw = W - pl - pr, ih = H - pt - pb;
    var cum = [], s = 0; v.forEach(function (x, i) { s += x; cum.push(i < upto ? s : null); });
    var max = Math.max(1, s, income || 0) * 1.08;
    var x = function (i) { return pl + i * iw / (n - 1); }, y = function (val) { return pt + ih - val / max * ih; };
    var bw = iw / n * 0.6, bmax = Math.max.apply(null, v.concat([1]));
    var bars = v.map(function (val, i) { if (!val) return ""; var h = val / bmax * ih * 0.45; return '<rect x="' + (x(i) - bw / 2).toFixed(1) + '" y="' + (pt + ih - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" class="mx-bar"><title>' + (i + 1) + ": " + fmtMoney(val) + "</title></rect>"; }).join("");
    var line = cum.map(function (val, i) { return val == null ? null : x(i).toFixed(1) + "," + y(val).toFixed(1); }).filter(Boolean).join(" ");
    var pace = income ? '<line x1="' + x(0) + '" y1="' + y(0) + '" x2="' + x(n - 1) + '" y2="' + y(income) + '" class="mx-pace"/>' : "";
    var labels = [1, 8, 15, 22, n].map(function (d) { return '<text x="' + x(d - 1).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="mx-axis">' + d + "</text>"; }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" class="mx-chart" role="img" aria-label="الصرف اليومي والمجمّع">' +
      '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (pt + ih) + '" y2="' + (pt + ih) + '" class="mx-base"/>' + bars + pace +
      (line ? '<polyline points="' + line + '" class="mx-cum"/>' : "") + labels + "</svg>" +
      '<div class="mx-legend"><span><i class="b"></i>صرف اليوم</span><span><i class="c"></i>المجمّع</span>' + (income ? '<span><i class="p"></i>المعدل الآمن للدخل</span>' : "") + "</div>";
  }
  function expTrendHTML(mk) {
    var months = []; for (var i = 5; i >= 0; i--) months.push(shiftMonth(mk, -i));
    var data = months.map(function (m) { return { m: m, out: expTotalOf(m), inc: expIncomeOf(m) }; });
    var max = Math.max.apply(null, data.map(function (d) { return Math.max(d.out, d.inc); }).concat([1]));
    return '<div class="mx-trend">' + data.map(function (d) {
      return '<div><span class="mx-cols"><i class="inc" style="height:' + Math.round(d.inc / max * 100) + '%" title="دخل ' + fmtMoney(d.inc) + '"></i><i class="out" style="height:' + Math.round(d.out / max * 100) + '%" title="مصروف ' + fmtMoney(d.out) + '"></i></span><small>' + AR_MONTHS[Number(d.m.slice(5)) - 1].slice(0, 5) + "</small></div>";
    }).join("") + '</div><div class="mx-legend"><span><i class="inc"></i>الدخل</span><span><i class="out"></i>المصروف</span></div>';
  }
  function expInsights(mk, now) {
    var out = [], items = expItemsOf(mk), tot = expTotalOf(mk), cats = expByCat(mk), inc = expIncomeOf(mk);
    if (!items.length) return out;
    var top = cats[0];
    out.push({ i: "🏷️", t: "أكبر بند: «" + top.cat + "» بنسبة " + Math.round(top.amount / tot * 100) + "% من المصروف (" + fmtMoney(top.amount) + ")." });
    var big = items.slice().sort(function (a, b) { return b.amount - a.amount; })[0];
    out.push({ i: "💸", t: "أكبر مصروف واحد: " + fmtMoney(big.amount) + " على «" + big.cat + "»" + (big.note ? " (" + big.note + ")" : "") + "." });
    var byDow = [0, 0, 0, 0, 0, 0, 0]; items.forEach(function (it) { byDow[dowOf(it.date)] += it.amount; });
    var dmax = byDow.indexOf(Math.max.apply(null, byDow));
    out.push({ i: "📅", t: "أكتر يوم بتصرف فيه: " + WD[dmax] + "." });
    var prev = expTotalOf(shiftMonth(mk, -1));
    if (prev) { var ch = Math.round((tot - prev) / prev * 100); out.push({ i: ch > 0 ? "📈" : "📉", t: (ch > 0 ? "صرفت أكتر بـ " : "صرفت أقل بـ ") + Math.abs(ch) + "% من الشهر اللي فات." }); }
    if (mk === monthKey(now.key)) {
      var day = Number(now.key.slice(8)), n = daysInMonth(mk), proj = tot / day * n;
      out.push({ i: "🔮", t: "بالمعدل الحالي هتقفل الشهر على حوالي " + fmtMoney(Math.round(proj)) + (inc ? (proj > inc ? " — يعني هتعدّي دخلك بـ " + fmtMoney(Math.round(proj - inc)) + "، خفّف شوية." : " — يعني هتوفّر حوالي " + fmtMoney(Math.round(inc - proj)) + " 👏") : ".") });
    }
    var over = cats.filter(function (c) { var cap = state.exp.budgets[c.cat]; return cap && c.amount > cap; });
    if (over.length) out.push({ i: "⚠️", t: "عدّيت الحد في: " + over.map(function (c) { return c.cat; }).join("، ") + "." });
    return out;
  }
  function expReportsView(now) {
    var mk = curExpMonth(now), tot = expTotalOf(mk), inc = expIncomeOf(mk), cats = expByCat(mk), items = expItemsOf(mk);
    var isCur = mk === monthKey(now.key), days = isCur ? Number(now.key.slice(8)) : daysInMonth(mk);
    var saveRate = inc ? Math.round((inc - tot) / inc * 100) : null, prev = expTotalOf(shiftMonth(mk, -1));
    var delta = prev ? Math.round((tot - prev) / prev * 100) : null;
    var kpis = '<div class="mx-kpis">' +
      '<div><small>المصروف</small><b class="num">' + fmtMoney(tot) + "</b>" + (delta != null ? '<span class="mx-d ' + (delta > 0 ? "bad" : "good") + '">' + (delta > 0 ? "▲" : "▼") + " " + Math.abs(delta) + "%</span>" : "") + "</div>" +
      '<div><small>الدخل</small><b class="num">' + (inc ? fmtMoney(inc) : "—") + "</b></div>" +
      '<div><small>نسبة الادخار</small><b class="num" style="color:' + (saveRate == null ? "inherit" : saveRate >= 0 ? "var(--done-deep)" : "var(--miss-deep)") + '">' + (saveRate == null ? "—" : saveRate + "%") + "</b></div>" +
      '<div><small>متوسط يومي</small><b class="num">' + fmtMoney(Math.round(tot / Math.max(1, days))) + "</b></div></div>";
    var ins = expInsights(mk, now);
    var legend = cats.map(function (c) {
      return '<div class="mx-leg-row"><span><i style="background:' + catColor(c.cat) + '"></i>' + esc(c.cat) + '</span><span class="num">' + fmtMoney(c.amount) + ' <small class="muted">' + Math.round(c.amount / tot * 100) + "%</small></span></div>";
    }).join("");
    return expMonthNav(mk) + kpis +
      (items.length ? '<div class="card"><h3>توزيع المصروف</h3><div class="mx-donut-wrap">' + expDonut(cats, tot) + '<div class="mx-leg">' + legend + "</div></div></div>" +
        '<div class="card"><h3>إيقاع الصرف خلال الشهر</h3>' + expPaceChart(mk, now, inc) + "</div>" +
        '<div class="card"><h3>💡 ملاحظات ذكية</h3><div class="mx-ins">' + ins.map(function (x) { return '<div><span>' + x.i + "</span><p>" + esc(x.t) + "</p></div>"; }).join("") + "</div></div>"
        : '<div class="card"><p class="muted">مفيش مصاريف في ' + monthLabel(mk) + " لسه.</p></div>") +
      '<div class="card"><h3>آخر 6 شهور</h3>' + expTrendHTML(mk) + "</div>" +
      '<button class="btn alt" style="width:100%" data-act="exp-csv">⬇️ تصدير ' + monthLabel(mk) + " (Excel)</button>";
  }
  function expCsv(now) {
    var mk = curExpMonth(now), rows = expAllItemsOf(mk).slice().reverse();
    var q = function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var kindLbl = { income: "دخل", advance: "سلفة" };
    var lines = ["التاريخ,النوع,البند,المبلغ,ملاحظة"].concat(rows.map(function (it) { return [it.date, kindLbl[it.kind] || "مصروف", it.cat, it.amount, it.note || ""].map(q).join(","); }));
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "masar-expenses-" + mk + ".csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 30000);
  }

  /* savings goals */
  var GOAL_EMOJI = ["🎯", "🏠", "🚗", "✈️", "💍", "📱", "🎓", "🕋", "🛡️", "💼"];
  function goalRing(pct, color) {
    var r = 26, c = 2 * Math.PI * r, len = Math.min(1, pct / 100) * c;
    return '<svg viewBox="0 0 64 64" class="mx-ring"><circle cx="32" cy="32" r="' + r + '" class="bg"/><circle cx="32" cy="32" r="' + r + '" stroke="' + color + '" stroke-dasharray="' + len.toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 32 32)" class="fg"/><text x="32" y="37" text-anchor="middle">' + Math.round(pct) + "%</text></svg>";
  }
  function monthsBetween(fromKey, toMk) {
    var a = fromKey.slice(0, 7).split("-").map(Number), b = toMk.split("-").map(Number);
    return (b[0] - a[0]) * 12 + (b[1] - a[1]);
  }
  function expGoalsView(now) {
    var goals = state.exp.goals, totalSaved = goals.reduce(function (s, g) { return s + (g.saved || 0); }, 0), totalTarget = goals.reduce(function (s, g) { return s + g.target; }, 0);
    var form = state.expGoalAdd ? '<div class="card"><h3>هدف جديد</h3><div class="row wrapr" style="gap:6px;margin-block-end:8px">' + GOAL_EMOJI.map(function (e) {
      return '<button class="chipbtn' + ((state.expGoalEmoji || "🎯") === e ? " on" : "") + '" data-act="goal-emoji" data-v="' + e + '">' + e + "</button>";
    }).join("") + "</div>" +
      '<label class="field">اسم الهدف<input class="inp" id="goalName" placeholder="مثلًا: عربية، عمرة، طوارئ"></label>' +
      '<label class="field">المبلغ المطلوب<input class="inp" id="goalTarget" type="number" inputmode="decimal" min="1"></label>' +
      '<label class="field">عايز تحققه إمتى؟ (اختياري)<input class="inp" id="goalBy" type="month" min="' + monthKey(now.key) + '"></label>' +
      '<div class="row" style="gap:8px;margin-block-start:10px"><button class="btn sm" data-act="goal-save">حفظ الهدف</button><button class="btn sm alt" data-act="goal-add-toggle">إلغاء</button></div></div>' : "";
    var list = goals.map(function (g) {
      var pct = g.target ? (g.saved || 0) / g.target * 100 : 0, left = Math.max(0, g.target - (g.saved || 0)), color = pct >= 100 ? "#22B35E" : "#0E9F6E";
      var plan = "";
      if (g.by && left > 0) { var m = monthsBetween(now.key, g.by) + 1; plan = m > 0 ? "محتاج توفّر " + fmtMoney(Math.ceil(left / m)) + " كل شهر لحد " + monthLabel(g.by) : "المعاد فات — حدّث الهدف"; }
      var open = state.expGoalOpen === g.id;
      return '<div class="card mx-goal"><div class="row" style="gap:12px;align-items:center">' + goalRing(pct, color) +
        '<div class="grow"><b>' + esc(g.emoji || "🎯") + " " + esc(g.name) + '</b><p class="muted" style="font-size:13px"><span class="num">' + fmtMoney(g.saved || 0) + "</span> من <span class=\"num\">" + fmtMoney(g.target) + "</span>" + (left ? " · فاضل " + fmtMoney(left) : " · ✓ اتحقق!") + "</p>" +
        (plan ? '<p class="mx-plan">' + esc(plan) + "</p>" : "") + "</div>" +
        '<button class="btn sm alt" data-act="goal-open" data-id="' + g.id + '">' + (open ? "✕" : "＋") + "</button></div>" +
        (open ? '<div class="row" style="gap:8px;margin-block-start:12px"><input class="inp" id="goalAmt" type="number" inputmode="decimal" min="0" placeholder="المبلغ" style="flex:1">' +
          '<button class="btn sm" data-act="goal-dep" data-id="' + g.id + '">إيداع</button><button class="btn sm alt" data-act="goal-wd" data-id="' + g.id + '">سحب</button></div>' +
          '<button class="linkbtn" style="color:var(--bad);font-size:13px;margin-block-start:8px" data-act="goal-del" data-id="' + g.id + '">حذف الهدف</button>' : "") + "</div>";
    }).join("");
    return '<div class="card mx-goal-sum"><div><small>إجمالي المدّخر</small><b class="num">' + fmtMoney(totalSaved) + '</b></div><div><small>من أهداف بقيمة</small><b class="num">' + fmtMoney(totalTarget) + "</b></div></div>" +
      form + (goals.length ? list : (state.expGoalAdd ? "" : '<div class="card" style="text-align:center"><div style="font-size:40px">🎯</div><p class="muted">حط هدف تحوّش له، وتابع تقدّمك خطوة بخطوة.</p></div>')) +
      (state.expGoalAdd ? "" : '<button class="btn" style="width:100%" data-act="goal-add-toggle">+ هدف ادخار جديد</button>');
  }

  /* tools: calculator, zakat, split bill */
  function calcEval(expr) {
    var s = String(expr).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    if (!/^[0-9+\-*/.() %]*$/.test(s) || !s.trim()) return null;
    // "a + b%" / "a - b%" means b percent OF a, like a phone calculator.
    s = s.replace(/(\d+(?:\.\d+)?)([+\-])(\d+(?:\.\d+)?)%/g, "$1$2($1*$3/100)").replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
    try { var v = Function('"use strict";return (' + s + ")")(); return isFinite(v) ? Math.round(v * 1e8) / 1e8 : null; } catch (e) { return null; }
  }
  var CALC_KEYS = ["C", "(", ")", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "%", "0", ".", "⌫"];
  function expToolsView(now) {
    var t = state.expTool || "calc", seg = '<div class="seg2" style="margin-block-end:12px">' + [["calc", "🧮 آلة حاسبة"], ["zakat", "🕌 الزكاة"], ["split", "🍽️ تقسيم"]].map(function (x) {
      return '<button data-act="exp-tool" data-v="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + "</button>";
    }).join("") + "</div>";
    if (t === "zakat") return seg + zakatHTML();
    if (t === "split") return seg + splitHTML();
    var ex = state.calcExpr || "", val = calcEval(ex);
    return seg + '<div class="card mx-calc"><div class="mx-calc-scr"><small dir="ltr">' + esc(ex || "0") + '</small><b class="num" dir="ltr">' + (val == null ? (ex ? "…" : "0") : fmtMoney(val)) + "</b></div>" +
      '<div class="mx-keys">' + CALC_KEYS.map(function (k) {
        var cls = /[÷×−+]/.test(k) ? " op" : k === "C" ? " clr" : "";
        return '<button class="mx-key' + cls + '" data-act="calc-key" data-v="' + k + '">' + k + "</button>";
      }).join("") + '<button class="mx-key eq" data-act="calc-key" data-v="=">=</button></div>' +
      '<button class="btn alt" style="width:100%;margin-block-start:12px" data-act="calc-to-exp"' + (val ? "" : " disabled") + ">سجّل الناتج كمصروف</button></div>";
  }
  function zakatHTML() {
    var z = state.exp.zakat;
    function f(id, label, ph) { return '<label class="field">' + label + '<input class="inp" type="number" inputmode="decimal" min="0" id="zk_' + id + '" data-zk="' + id + '" value="' + (z[id] || "") + '" placeholder="' + (ph || "0") + '"></label>'; }
    var gp = Number(z.goldPrice) || 0, nisab = gp * 85;
    var assets = (Number(z.cash) || 0) + (Number(z.invest) || 0) + (Number(z.owed) || 0) + (Number(z.gold24) || 0) * gp + (Number(z.gold21) || 0) * gp * 21 / 24 + (Number(z.gold18) || 0) * gp * 18 / 24;
    var net = Math.max(0, assets - (Number(z.debts) || 0)), due = nisab && net >= nisab ? net * 0.025 : 0;
    return '<div class="card"><h3>🕌 حاسبة زكاة المال</h3><p class="muted" style="font-size:13px">الزكاة 2.5% من المال اللي بلغ النصاب (قيمة 85 جرام دهب عيار 24) وعدّى عليه سنة هجرية.</p>' +
      f("goldPrice", "سعر جرام الدهب عيار 24 النهارده", "مثلًا 4000") +
      '<div class="mx-zgrid">' + f("cash", "الفلوس السايلة والبنك") + f("invest", "استثمارات وأسهم وبضاعة") + f("owed", "ديون ليك مضمون ترجع") + f("debts", "ديون عليك مستحقة") +
      f("gold24", "دهب عيار 24 (جرام)") + f("gold21", "دهب عيار 21 (جرام)") + f("gold18", "دهب عيار 18 (جرام)") + "</div></div>" +
      '<div class="card mx-zres ' + (due ? "due" : "") + '"><div class="mx-kpis" style="margin:0"><div><small>صافي المال</small><b class="num">' + fmtMoney(Math.round(net)) + '</b></div><div><small>النصاب</small><b class="num">' + (gp ? fmtMoney(Math.round(nisab)) : "—") + "</b></div></div>" +
      '<p class="mx-zline">' + (!gp ? "اكتب سعر جرام الدهب عشان نحسب النصاب." : due ? "الزكاة الواجبة: <b class=\"num\">" + fmtMoney(Math.round(due)) + "</b>" : "مالك لسه مبلغش النصاب، مفيش زكاة واجبة.") + "</p>" +
      '<p class="muted" style="font-size:11.5px">حساب تقريبي للمساعدة. دهب الزينة المستعمل فيه خلاف فقهي، وفي الحالات الخاصة اسأل أهل العلم.</p></div>';
  }
  function splitHTML() {
    var s = state.expSplit || (state.expSplit = { total: "", people: 2, tip: 0 });
    var total = Number(s.total) || 0, withTip = Math.round(total * (100 + (s.tip || 0))) / 100, per = s.people ? Math.ceil(Math.round(withTip / s.people * 1e4) / 100) / 100 : 0;
    return '<div class="card"><h3>🍽️ تقسيم الفاتورة</h3>' +
      '<label class="field">إجمالي الفاتورة<input class="inp" type="number" inputmode="decimal" min="0" id="splitTotal" data-split="total" value="' + (s.total || "") + '"></label>' +
      '<div class="field">عدد الأشخاص<div class="stepper"><button class="btn sm alt" data-act="split-n" data-v="-1">−</button><b class="num">' + s.people + '</b><button class="btn sm alt" data-act="split-n" data-v="1">+</button></div></div>' +
      '<div class="field">بقشيش / خدمة</div><div class="row wrapr" style="gap:6px">' + [0, 5, 10, 12, 15].map(function (p) {
        return '<button class="chipbtn' + ((s.tip || 0) === p ? " on" : "") + '" data-act="split-tip" data-v="' + p + '">' + (p ? p + "%" : "بدون") + "</button>";
      }).join("") + "</div></div>" +
      '<div class="card mx-zres due"><div class="mx-kpis" style="margin:0"><div><small>الإجمالي مع الخدمة</small><b class="num">' + fmtMoney(withTip) + '</b></div><div><small>على كل واحد</small><b class="num">' + fmtMoney(per) + "</b></div></div>" +
      '<button class="btn alt" style="width:100%;margin-block-start:12px" data-act="split-to-exp"' + (per ? "" : " disabled") + ">سجّل نصيبي كمصروف</button></div>";
  }
  function openAddWithAmount(amount) {
    state.expTab = "main"; state.expAdd = true; state.expEditId = null; state.expKind = "expense"; state.expCat = ""; state.expPrefill = Math.round(amount * 100) / 100;
    $("#p-exp").scrollTop = 0; render(); toast("اختار البند واحفظ");
  }

  document.addEventListener("input", function (e) {
    var t = e.target; if (!t || !t.getAttribute) return;
    var zk = t.getAttribute("data-zk");
    if (zk) { state.exp.zakat[zk] = t.value; saveMeta("exp", 1500); render(); }
    var sp = t.getAttribute("data-split");
    if (sp) { state.expSplit[sp] = t.value; render(); }
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var now = nowR(), id = el.getAttribute("data-id"), g;
    switch (el.getAttribute("data-act")) {
      case "exp-tab": state.expTab = el.getAttribute("data-v"); $("#p-exp").scrollTop = 0; render(); break;
      case "exp-csv": expCsv(now); break;
      case "goal-add-toggle": state.expGoalAdd = !state.expGoalAdd; render(); break;
      case "goal-emoji": state.expGoalEmoji = el.getAttribute("data-v"); render(); break;
      case "goal-save": {
        var name = ($("#goalName").value || "").trim(), tgt = parseFloat($("#goalTarget").value), by = $("#goalBy").value || null;
        if (!name) { toast("اكتب اسم الهدف"); break; }
        if (!(tgt > 0)) { toast("اكتب المبلغ المطلوب"); break; }
        state.exp.goals.push({ id: "g" + Date.now().toString(36), name: name, target: tgt, saved: 0, emoji: state.expGoalEmoji || "🎯", by: by, created: now.key, log: [] });
        state.expGoalAdd = false; state.expGoalEmoji = null; saveMeta("exp", 0); render(); toast("🎯 بالتوفيق!"); break;
      }
      case "goal-open": state.expGoalOpen = state.expGoalOpen === id ? null : id; render(); break;
      case "goal-dep": case "goal-wd": {
        g = state.exp.goals.filter(function (x) { return x.id === id; })[0]; if (!g) break;
        var amt = parseFloat($("#goalAmt").value); if (!(amt > 0)) { toast("اكتب المبلغ"); break; }
        var dep = el.getAttribute("data-act") === "goal-dep", before = g.saved || 0;
        g.saved = Math.max(0, before + (dep ? amt : -amt));
        (g.log = g.log || []).push({ d: now.key, a: dep ? amt : -amt });
        saveMeta("exp", 0); state.expGoalOpen = null; render();
        toast(dep && before < g.target && g.saved >= g.target ? "🎉 مبروك! حققت هدف «" + g.name + "»" : dep ? "تم الإيداع ✓" : "تم السحب");
        break;
      }
      case "goal-del": {
        g = state.exp.goals.filter(function (x) { return x.id === id; })[0]; if (!g || !confirm("تحذف هدف «" + g.name + "»؟")) break;
        state.exp.goals = state.exp.goals.filter(function (x) { return x.id !== id; }); saveMeta("exp", 0); render(); break;
      }
      case "exp-tool": state.expTool = el.getAttribute("data-v"); render(); break;
      case "calc-key": {
        var k = el.getAttribute("data-v"), ex = state.calcExpr || "";
        if (k === "C") ex = "";
        else if (k === "⌫") ex = ex.slice(0, -1);
        else if (k === "=") { var r = calcEval(ex); ex = r == null ? ex : String(r); }
        else ex += k;
        state.calcExpr = ex.slice(0, 60); render(); break;
      }
      case "calc-to-exp": { var cv = calcEval(state.calcExpr || ""); if (cv > 0) openAddWithAmount(cv); break; }
      case "split-n": state.expSplit.people = Math.max(1, Math.min(50, (state.expSplit.people || 2) + Number(el.getAttribute("data-v")))); render(); break;
      case "split-tip": state.expSplit.tip = Number(el.getAttribute("data-v")); render(); break;
      case "split-to-exp": {
        var s = state.expSplit, wt = Math.round((Number(s.total) || 0) * (100 + (s.tip || 0))) / 100, per = Math.ceil(Math.round(wt / (s.people || 1) * 1e4) / 100) / 100;
        if (per > 0) openAddWithAmount(per); break;
      }
    }
  });
