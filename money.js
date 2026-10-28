"use strict";
  /* ---------------- expenses (الحاسبة) ---------------- */
  function monthKey(key) { return key.slice(0, 7); }
  function monthLabel(mk) { var p = mk.split("-"); return AR_MONTHS[Number(p[1]) - 1] + " " + p[0]; }
  function curExpMonth(now) { return state.expMonth || monthKey(now.key); }
  function shiftMonth(mk, n) {
    var p = mk.split("-").map(Number), d = new Date(Date.UTC(p[0], p[1] - 1 + n, 1));
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1);
  }
  // "سلفة" (advance/loan) items are money that's expected back, not spending — they're
  // kept in the same items[] array (so they still show up in the day's list and can be
  // edited/deleted like anything else) but excluded from every spending total below.
  function expItemsOf(mk) {
    return state.exp.items.filter(function (it) { return it.date.slice(0, 7) === mk && it.kind !== "advance" && it.kind !== "income"; }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }
  function expAllItemsOf(mk) {
    return state.exp.items.filter(function (it) { return it.date.slice(0, 7) === mk; }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }
  function expActiveAdvances() {
    return state.exp.items.filter(function (it) { return it.kind === "advance" && !it.repaid; }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }
  // Extra income (anything besides the monthly salary) is logged as kind "income":
  // it raises what's available this month but never counts as spending.
  function expIncomeItemsOf(mk) { return state.exp.items.filter(function (it) { return it.date.slice(0, 7) === mk && it.kind === "income"; }); }
  function expIncomeOf(mk) { return (state.exp.salary[mk] || 0) + expIncomeItemsOf(mk).reduce(function (s, it) { return s + it.amount; }, 0); }
  function expTotalOf(mk) { return expItemsOf(mk).reduce(function (s, it) { return s + it.amount; }, 0); }
  function expByCat(mk) {
    var m = {};
    expItemsOf(mk).forEach(function (it) { m[it.cat] = (m[it.cat] || 0) + it.amount; });
    return Object.keys(m).map(function (c) { return { cat: c, amount: m[c] }; }).sort(function (a, b) { return b.amount - a.amount; });
  }
  // Up to 5 most-recently-used categories, most recent first — shown as quick-pick
  // chips above the full category list so logging a routine expense is one tap away
  // instead of a scroll through every category that's ever been used.
  function expRecentCats(n) {
    var seen = {}, out = [];
    state.exp.items.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }).forEach(function (it) {
      if (!seen[it.cat]) { seen[it.cat] = 1; out.push(it.cat); }
    });
    return out.slice(0, n || 5);
  }
  // Budget-cap color: green under 80% of the cap, amber from 80% up to the cap, and the
  // "bad"/miss red once a category has actually gone over its cap — the same 80/100
  // thresholds a person would expect from any budgeting app.
  function budgetBarColor(amount, cap) {
    if (!cap) return "";
    var pct = amount / cap;
    if (pct >= 1) return "miss";
    if (pct >= 0.8) return "amber";
    return "";
  }
  function expRecurringDueToday(mk, now) {
    if (mk !== monthKey(now.key) || !state.exp.recurring.length) return [];
    var addedIds = {};
    state.exp.items.forEach(function (it) { if (it.date.slice(0, 7) === mk && it.recurId) addedIds[it.recurId] = 1; });
    return state.exp.recurring.filter(function (r) { return !addedIds[r.id]; });
  }
  function fmtMoney(n) { return (Math.round(n * 100) / 100).toLocaleString("en-US"); }
  // A fixed 8-color palette (not just the 3 base accent hues) so categories stay visually
  // distinct from each other even once someone has 6-8 of them — hashed deterministically
  // by category name, so the same category always lands on the same color.
  var CAT_COLORS = ["#0DA66B", "#F59E0B", "#3B6FED", "#E0607E", "#7C6FE0", "#17A2A2", "#C2703D", "#5B8A3C"];
  function catColor(name) {
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return CAT_COLORS[h % CAT_COLORS.length];
  }
  function expDateLabel(key, now) {
    if (key === now.key) return "اليوم";
    if (key === addDays(now.key, -1)) return "أمس";
    return WD[dowOf(key)] + " · " + Number(key.slice(8)) + "/" + Number(key.slice(5, 7));
  }
  function dailyCardHTML(now) {
    var d = todaysDaily(now);
    if (d && d.done) {
      return '<div class="card daily done"><div class="row between"><div><h3 style="margin:0">✓ تحدي اليوم خلصته</h3><p class="muted" style="font-size:14px;margin-block-start:4px">نتيجتك: <span class="num">' + d.score + '%</span>. يجيلك تحدي جديد بكرة.</p></div></div></div>';
    }
    return '<div class="card daily"><div class="row between"><div><h3 style="margin:0">' + ic("zap") + ' تحدي اليوم</h3><p class="muted" style="font-size:14px;margin-block-start:4px">5 أسئلة سريعة من كل اللي اتعلمته، وتاخد نقاط إضافية.</p></div><button class="btn sm" data-act="daily-start">ابدأ</button></div></div>';
  }
  function expHomeSub(now) {
    var mk = monthKey(now.key), sal = state.exp.salary[mk] || 0, tot = expTotalOf(mk);
    if (!sal && !tot) return "سجّل مصاريفك";
    var pct = sal ? Math.round(tot / sal * 100) : 0;
    return '<span class="num">' + fmtMoney(tot) + "</span> صرفت هذا الشهر" + (sal ? " · " + pct + "%" : "");
  }
  function expMainView(now) {
    // Defensive normalize: guards against any state.exp loaded/reset from a source
    // that left recurring/budgets missing or null, which would otherwise crash
    // every render() (money.js reads .recurring.length and .budgets[...] below
    // assuming they're always a real array/object).
    if (!Array.isArray(state.exp.recurring)) state.exp.recurring = [];
    if (!state.exp.budgets || typeof state.exp.budgets !== "object") state.exp.budgets = {};
    var mk = curExpMonth(now), isCurMonth = mk === monthKey(now.key), baseSal = state.exp.salary[mk] || 0, sal = expIncomeOf(mk), extraInc = sal - baseSal, tot = expTotalOf(mk), cats = expByCat(mk);
    var q = (state.expQ || "").trim().toLowerCase();
    var items = expAllItemsOf(mk).filter(function (it) { return it.kind !== "advance" && (!q || (it.cat + " " + (it.note || "")).toLowerCase().indexOf(q) >= 0); });
    var prevCats = expByCat(shiftMonth(mk, -1));
    var prevByName = {}; prevCats.forEach(function (c) { prevByName[c.cat] = c.amount; });
    var pct = sal ? Math.min(999, Math.round(tot / sal * 100)) : 0;
    var barCls = pct > 100 ? "miss" : (pct >= 80 ? "amber" : "");
    // "المصروف اليومي المتاح": what's left of the salary divided by the days still left
    // in the month — only means anything for the month we're actually living in now.
    var dailyAvail = "";
    if (sal && isCurMonth) {
      var daysInMonth = new Date(Date.UTC(Number(mk.slice(0, 4)), Number(mk.slice(5, 7)), 0)).getUTCDate();
      var dayNum = Number(now.key.slice(8)), daysLeft = Math.max(1, daysInMonth - dayNum + 1);
      var avail = Math.max(0, sal - tot) / daysLeft;
      dailyAvail = '<p class="muted" style="font-size:13px;margin-block-start:4px">المتاح يوميًا لحد آخر الشهر: <b class="num">' + fmtMoney(avail) + "</b></p>";
    }
    var salBlock = state.expSalEdit
      ? '<div class="row" style="gap:8px;margin-block-start:8px"><input type="number" id="expSalInput" inputmode="decimal" min="0" placeholder="الراتب" value="' + (baseSal || "") + '" style="flex:1"><button class="btn sm" data-act="exp-sal-save">حفظ</button></div>'
      : '<div class="row between" style="margin-block-start:4px"><span class="muted">الراتب هذا الشهر: <b class="num">' + (baseSal ? fmtMoney(baseSal) : "لم يُسجَّل") + "</b>" + (extraInc ? ' · دخل إضافي <b class="num" style="color:var(--done-deep)">+' + fmtMoney(extraInc) + "</b>" : "") + '</span><button class="btn sm alt" data-act="exp-sal-edit">' + (baseSal ? "تعديل" : "تسجيل") + "</button></div>";

    var recentCats = expRecentCats(5);
    var recentChips = recentCats.length ? '<div class="row wrapr" style="gap:6px;margin-block-end:8px">' + recentCats.map(function (c) {
      return '<button class="catchip" data-act="exp-cat-pick" data-c="' + esc(c) + '" aria-pressed="' + (state.expCat === c) + '">' + ic("zap") + ' ' + esc(c) + "</button>";
    }).join("") + "</div>" : "";
    var catChips = state.exp.categories.map(function (c) {
      return '<button class="catchip" data-act="exp-cat-pick" data-c="' + esc(c) + '" aria-pressed="' + (state.expCat === c) + '">' + esc(c) + "</button>";
    }).join("") + '<button class="catchip" data-act="exp-cat-new-toggle">+ بند جديد</button>';

    var editingItem = state.expEditId ? state.exp.items.filter(function (x) { return x.id === state.expEditId; })[0] : null;
    var addForm = !state.expAdd ? "" :
      '<div class="card" style="margin-block-start:10px"><h3>' + (editingItem ? "تعديل المصروف" : "مصروف جديد") + '</h3>' +
      '<div class="seg2" style="margin-block-end:10px"><button type="button" data-act="exp-kind" data-k="expense" aria-pressed="' + (state.expKind !== "advance" && state.expKind !== "income") + '">مصروف</button><button type="button" data-act="exp-kind" data-k="income" aria-pressed="' + (state.expKind === "income") + '">دخل</button><button type="button" data-act="exp-kind" data-k="advance" aria-pressed="' + (state.expKind === "advance") + '">سلفة</button></div>' +
      recentChips +
      '<div class="catrow">' + catChips + "</div>" +
      (state.expNewCat ? '<div class="row" style="gap:8px;margin-block-end:8px"><input type="text" id="expNewCatInput" placeholder="اسم البند" style="flex:1"><button class="btn sm" data-act="exp-cat-new-save">إضافة</button></div>' : "") +
      '<label class="field">المبلغ<input type="number" id="expAmt" inputmode="decimal" min="0" placeholder="0" value="' + (editingItem ? editingItem.amount : (state.expPrefill || "")) + '"></label>' +
      '<label class="field">التاريخ<input type="date" id="expDate" value="' + (editingItem ? editingItem.date : now.key) + '" max="' + now.key + '"></label>' +
      '<label class="field">ملاحظة (اختياري)<input type="text" id="expNote" placeholder="..." value="' + (editingItem && editingItem.note ? esc(editingItem.note) : "") + '"></label>' +
      '<div class="row" style="gap:8px;margin-block-start:10px"><button class="btn sm" data-act="exp-save">' + (editingItem ? "حفظ التعديل" : "حفظ المصروف") + '</button><button class="btn sm alt" data-act="exp-add-toggle">إلغاء</button></div></div>';

    var recurDue = expRecurringDueToday(mk, now);
    var recurBanner = recurDue.length ? '<div class="card" style="margin-block-start:12px;border-inline-start:3px solid var(--accent, var(--money))"><div class="row between"><div><h3 style="margin:0">المصاريف الثابتة لِـ' + monthLabel(mk) + '</h3><p class="muted" style="font-size:13px;margin-block-start:4px">' + recurDue.length + ' بند بإجمالي <b class="num">' + fmtMoney(recurDue.reduce(function (s, r) { return s + r.amount; }, 0)) + '</b></p></div><button class="btn sm" data-act="exp-recur-apply">إضافة الكل</button></div></div>' : "";

    var advances = expActiveAdvances();
    var advHTML = !advances.length ? "" : '<div class="sec-h">السُّلف النشطة</div><div class="card">' + advances.map(function (it) {
      return '<div class="exprow"><div class="exprow-l"><i class="catdot" style="background:var(--weak)"></i><b>' + esc(it.cat) + "</b>" + (it.note ? " <small>· " + esc(it.note) + "</small>" : "") + '<br><small class="muted">' + expDateLabel(it.date, now) + '</small></div><div class="exprow-r"><span class="num">' + fmtMoney(it.amount) + '</span><button class="btn sm alt" data-act="exp-repay" data-id="' + it.id + '">اتردّت</button></div></div>';
    }).join("") + "</div>";

    var catsHTML = !cats.length ? '<p class="muted" style="font-size:14px;margin-block-start:10px">لسه مفيش مصاريف مسجّلة الشهر ده.</p>' :
      '<div class="card">' + cats.map(function (c) {
        var cap = state.exp.budgets[c.cat] || 0;
        var cp = cap ? Math.min(100, Math.round(c.amount / cap * 100)) : (sal ? Math.min(100, Math.round(c.amount / sal * 100)) : (tot ? Math.round(c.amount / tot * 100) : 0));
        var clr = catColor(c.cat), warnCls = budgetBarColor(c.amount, cap);
        var prev = prevByName[c.cat] || 0, delta = prev ? Math.round((c.amount - prev) / prev * 100) : (c.amount ? 100 : 0);
        var deltaHTML = prev || c.amount ? '<span class="muted" style="font-size:12px">' + (delta > 0 ? "▲" : delta < 0 ? "▼" : "·") + " " + Math.abs(delta) + "% عن " + monthLabel(shiftMonth(mk, -1)) + "</span>" : "";
        var capHTML = state.expBudgetEditCat === c.cat
          ? '<div class="row" style="gap:6px;margin-block-start:6px"><input type="number" id="expBudgetInput" inputmode="decimal" min="0" placeholder="الحد الشهري" value="' + (cap || "") + '" style="flex:1;min-height:34px"><button class="btn sm" data-act="exp-budget-save" data-c="' + esc(c.cat) + '">حفظ</button></div>'
          : '<button class="linkbtn" style="font-size:12px" data-act="exp-budget-edit" data-c="' + esc(c.cat) + '">' + (cap ? "الحد: " + fmtMoney(cap) : "+ حدّد حد شهري") + "</button>";
        return '<div class="catrow2"><div class="top"><span class="catname"><i class="catdot" style="background:' + clr + '"></i>' + esc(c.cat) + '</span><span class="num">' + fmtMoney(c.amount) + (sal && !cap ? " · " + cp + "%" : "") + '</span></div>' +
          '<div class="bar ' + warnCls + '"><i style="width:' + cp + "%;background:" + (warnCls ? "" : clr) + '"></i></div>' +
          '<div class="row between" style="margin-block-start:4px">' + deltaHTML + capHTML + "</div></div>";
      }).join("") + "</div>";

    var recurList = !state.exp.recurring.length ? "" : '<div class="card">' + state.exp.recurring.map(function (r) {
      return '<div class="row between" style="padding-block:4px"><span>' + esc(r.cat) + (r.note ? " · " + esc(r.note) : "") + '</span><span class="row" style="gap:8px"><b class="num">' + fmtMoney(r.amount) + '</b><button class="del" data-act="exp-recur-del" data-id="' + r.id + '" aria-label="حذف">' + ico("trash") + "</button></span></div>";
    }).join("") + "</div>";
    var recurAddForm = !state.expRecurAdd ? "" :
      '<div class="card" style="margin-block-start:8px"><div class="catrow">' + catChips + "</div>" +
      '<label class="field">المبلغ الشهري<input type="number" id="expRecurAmt" inputmode="decimal" min="0" placeholder="0"></label>' +
      '<label class="field">ملاحظة (اختياري)<input type="text" id="expRecurNote" placeholder="..."></label>' +
      '<div class="row" style="gap:8px;margin-block-start:10px"><button class="btn sm" data-act="exp-recur-save">حفظ</button><button class="btn sm alt" data-act="exp-recur-toggle">إلغاء</button></div></div>';
    var recurSection = '<div class="sec-h">المصاريف الثابتة الشهرية</div>' + recurList +
      (state.expRecurAdd ? "" : '<div class="row" style="margin-block:8px"><button class="btn sm alt" data-act="exp-recur-toggle">+ بند ثابت جديد</button></div>') + recurAddForm;

    var groups = [], gi = {};
    items.forEach(function (it) {
      if (!gi.hasOwnProperty(it.date)) { gi[it.date] = groups.length; groups.push({ date: it.date, items: [] }); }
      groups[gi[it.date]].items.push(it);
    });
    var itemsHTML = !items.length ? (q ? '<div class="sec-h">كل المصاريف</div>' + expSearchHTML() + '<p class="muted">مفيش نتايج لـ «' + esc(q) + "».</p>" : "") :
      '<div class="sec-h">كل المصاريف</div>' + expSearchHTML() + '<div class="card">' + groups.map(function (g) {
        return '<div class="expgroup"><div class="datelbl">' + expDateLabel(g.date, now) + '</div>' + g.items.map(function (it) {
          var clr = catColor(it.cat), revealed = state.expSwipeId === it.id, inc = it.kind === "income";
          return '<div class="exprow' + (revealed ? " revealed" : "") + '" data-swipeid="' + it.id + '"><div class="exprow-l"><i class="catdot" style="background:' + clr + '"></i><b>' + esc(it.cat) + "</b>" + (it.note ? " <small>· " + esc(it.note) + "</small>" : "") + '</div>' +
            (revealed
              ? '<div class="exprow-r exprow-actions"><button class="btn sm alt" data-act="exp-edit" data-id="' + it.id + '">تعديل</button><button class="btn sm" style="background:var(--bad)" data-act="exp-del" data-id="' + it.id + '">حذف</button></div>'
              : '<div class="exprow-r"><span class="num"' + (inc ? ' style="color:var(--done-deep);font-weight:700"' : "") + ">" + (inc ? "+" : "") + fmtMoney(it.amount) + '</span><button class="del" data-act="exp-swipe" data-id="' + it.id + '" aria-label="خيارات">' + ico("trash") + "</button></div>") +
            "</div>";
        }).join("") + "</div>";
      }).join("") + "</div>";

    return '<div class="row between" style="margin-block:6px 4px">' +
      '<button class="btn sm alt" data-act="exp-month" data-n="-1">‹ الشهر السابق</button>' +
      "<b>" + monthLabel(mk) + "</b>" +
      '<button class="btn sm alt" data-act="exp-month" data-n="1">الشهر التالي ›</button></div>' +
      '<div class="card"><div class="dual"><div class="stat"><b class="num">' + fmtMoney(tot) + '</b><span>إجمالي المصروف</span></div>' +
      '<div class="stat"><b class="num">' + (sal ? fmtMoney(sal - tot) : "—") + '</b><span>المتبقي من الدخل</span></div></div>' +
      (sal ? '<div class="bar ' + barCls + '" style="margin-block-start:10px"><i style="width:' + Math.min(100, pct) + '%"></i></div><p class="muted" style="font-size:13px;margin-block-start:6px">صرفت ' + pct + '% من دخلك هذا الشهر</p>' : "") +
      dailyAvail + salBlock + "</div>" +
      recurBanner +
      (state.expAdd ? "" : '<div class="row" style="margin-block:12px"><button class="btn" data-act="exp-add-toggle">+ إضافة مصروف</button></div>') +
      addForm + advHTML +
      '<div class="sec-h">المصروف حسب البند</div>' + catsHTML + itemsHTML + recurSection;
  }

  function expSearchHTML() {
    return '<input class="inp" id="expQ" type="search" placeholder="دوّر في البنود والملاحظات" value="' + esc(state.expQ || "") + '" style="width:100%;margin-block-end:10px" autocomplete="off">';
  }
