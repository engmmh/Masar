"use strict";
  /* ---------------- اتكلم — free-speaking role-plays (engine + views) ---------------- */
  // The other person speaks (TTS), the learner answers in their OWN words by voice or by
  // typing, and the answer is judged on whether it carried the key ideas of the goal —
  // not on matching one sentence. Then they see a simple and a natural way to say it and
  // shadow the natural one. Content lives in talk-data.js (TALK_SETS).
  function tkData() {
    if (!state.learn.talk) state.learn.talk = { sc: {}, days: {}, turns: 0 };
    return state.learn.talk;
  }
  function tkUi() { if (!state.tk) state.tk = { view: "hub" }; return state.tk; }
  function tkSet(k) { return TALK_SETS.filter(function (s) { return s.k === k; })[0] || null; }
  function tkScene(k) {
    for (var i = 0; i < TALK_SETS.length; i++) { var f = TALK_SETS[i].scenes.filter(function (s) { return s.k === k; })[0]; if (f) return { set: TALK_SETS[i], sc: f }; }
    return null;
  }
  function tkNorm(s) { return " " + String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim() + " "; }
  // How many of the goal's key ideas the answer carried (word-prefix match per idea).
  function tkCheck(text, need) {
    var t = tkNorm(text), groups = need.split(";"), hit = 0;
    groups.forEach(function (g) {
      var ok = g.split("|").some(function (alt) { alt = alt.trim().toLowerCase(); return alt && (alt.indexOf(" ") >= 0 ? t.indexOf(" " + alt) >= 0 : t.indexOf(" " + alt) >= 0); });
      if (ok) hit++;
    });
    var words = t.trim() ? t.trim().split(" ").length : 0;
    var lvl = hit === groups.length ? 2 : hit / groups.length >= 0.5 ? 1 : 0;
    if (lvl === 2 && words < 3) lvl = 1;
    return { hit: hit, total: groups.length, lvl: lvl, words: words };
  }
  function tkTurn(st) { var f = tkScene(st.k); return f && f.sc.turns[st.i]; }
  function tkStart(k) {
    var f = tkScene(k); if (!f) return;
    tkUi().view = "scene";
    tkUi().st = { k: k, i: 0, res: [], heard: "", ans: null, hint: false, ar: false, shadow: null, listening: false, xp: 0 };
    $("#p-learn").scrollTop = 0; render();
    setTimeout(function () { speak(f.sc.turns[0][0]); }, 300);
  }
  function tkAnswer(text) {
    var st = tkUi().st, t = tkTurn(st); if (!st || !t || st.ans) return;
    text = String(text || "").trim();
    var r = text ? tkCheck(text, t[3]) : { hit: 0, total: t[3].split(";").length, lvl: 0, words: 0, skipped: true };
    st.ans = { text: text, r: r };
    st.xp += r.lvl === 2 ? 4 : r.lvl === 1 ? 2 : 0;
    var D = tkData(); D.turns = (D.turns || 0) + (text ? 1 : 0); D.days[nowR().key] = (D.days[nowR().key] || 0) + 1;
    if (navigator.vibrate) navigator.vibrate(r.lvl === 2 ? 12 : [30, 40, 30]);
    render();
  }
  function tkNext() {
    var st = tkUi().st, f = tkScene(st.k);
    st.res.push({ text: st.ans.text, lvl: st.ans.r.lvl, shadow: !!st.shadow });
    st.i++; st.ans = null; st.hint = false; st.ar = false; st.shadow = null; st.heard = "";
    if (st.i >= f.sc.turns.length) {
      var tot = st.res.reduce(function (a, x) { return a + x.lvl; }, 0), max = st.res.length * 2;
      st.stars = tot / max >= 0.85 ? 3 : tot / max >= 0.55 ? 2 : 1; st.done = true;
      var D = tkData(), rec = D.sc[st.k] || { best: 0, plays: 0 };
      rec.best = Math.max(rec.best, st.stars); rec.plays++; D.sc[st.k] = rec;
      addXp(st.xp + 3, nowR()); if (typeof coachTalkDone === "function") coachTalkDone(); saveMeta("learn", 0); render(); return;
    }
    saveMeta("learn", 800); $("#p-learn").scrollTop = 0; render();
    var q = f.sc.turns[st.i][0];
    setTimeout(function () { speak(q); }, 250);
  }
  function tkMic(shadow) {
    var st = tkUi().st, t = tkTurn(st); if (!st || !t) return;
    st.listening = shadow ? "shadow" : "answer"; render();
    recognizeOnce(function (r) {
      st.listening = false;
      if (r.err || !r.heard) { toast("مسمعتش حاجة — قرّب الموبايل وجرّب تاني، أو اكتب ردك."); render(); return; }
      if (shadow) { st.shadow = { heard: r.heard, score: speechScore(r.heard, t[6]) }; if (st.shadow.score >= 0.7) st.xp += 2; render(); return; }
      tkAnswer(r.heard);
    });
  }

  /* views */
  function talkHTML() {
    var u = tkUi();
    if (u.view === "scene" && u.st) return tkSceneHTML();
    if (u.view === "set" && tkSet(u.set)) return tkSetHTML(tkSet(u.set));
    return tkHubHTML();
  }
  function tkStars(n) { return '<span class="tk-stars">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? "on" : "") + '">★</i>'; }).join("") + "</span>"; }
  function tkHubHTML() {
    var D = tkData(), days = Object.keys(D.days).length;
    var sets = TALK_SETS.map(function (s) {
      var done = s.scenes.filter(function (x) { return (D.sc[x.k] || {}).best; }).length;
      return '<button class="card tk-setcard" data-act="tk-set" data-k="' + s.k + '"><span class="tk-setic">' + ic(s.ico) + '</span><span class="grow"><b>' + esc(s.t) + "</b><small class=\"muted\">" + esc(s.d) + '</small><span class="tk-prog"><span class="bar"><i style="width:' + Math.round(done / s.scenes.length * 100) + '%"></i></span><span class="num">' + done + "/" + s.scenes.length + "</span></span></span></button>";
    }).join("");
    return '<button class="linkbtn" data-act="course-open" data-c="en">← كورس الإنجليزي</button>' +
      '<div class="tk-hero"><h2>' + ic("mic") + " اتكلم</h2><p>هنا انت اللي بتتكلم. هيبقى قدامك موقف حقيقي من شغلك أو من يومك: الطرف التاني يقول جملته، وانت ترد <b>من دماغك</b> بصوتك أو بالكتابة. بعدها هتشوف نفس الرد بطريقة بسيطة وطريقة طبيعية زي ما الناس بتتكلم.</p>" +
      '<div class="tk-hero-st"><span><b class="num">' + (D.turns || 0) + "</b> رد قلته</span><span><b class=\"num\">" + days + "</b> يوم اتكلمت فيه</span></div></div>" +
      sets +
      '<div class="card"><h3 style="margin:0 0 8px">' + ic("bulb") + ' إزاي تستفيد أكتر</h3><ul class="itips">' +
      "<li>متدورش على الجملة المثالية. المهم إن الفكرة توصل، وبعدها هتتعلم الطريقة الطبيعية.</li>" +
      "<li>اتكلم بصوت عالي حتى لو بتكتب. الكلام بيثبت بالتكرار.</li>" +
      "<li>كرّر النسخة الطبيعية بصوتك (Shadowing). دي أسرع طريقة تخليك تتكلم بطلاقة.</li>" +
      "<li>موقف واحد كل يوم أحسن من عشرة مرة واحدة في الأسبوع.</li></ul></div>";
  }
  function tkSetHTML(s) {
    var D = tkData();
    var rows = s.scenes.map(function (x, i) {
      var rec = D.sc[x.k] || {};
      return '<button class="tk-scene" data-act="tk-start" data-k="' + x.k + '"><span class="tk-n num">' + (i + 1) + '</span><span class="grow"><b>' + esc(x.t) + '</b><small class="muted">' + esc(x.set) + "</small></span>" + (rec.best ? tkStars(rec.best) : '<span class="chip">ابدأ</span>') + "</button>";
    }).join("");
    var seen = {}, chunks = [];
    s.scenes.forEach(function (x) { x.turns.forEach(function (t) { t[4].forEach(function (c) { var k = c.toLowerCase(); if (!seen[k] && c.indexOf("…") < 0 && c.split(" ").length >= 3) { seen[k] = 1; chunks.push(c); } }); }); });
    return '<button class="linkbtn" data-act="tk-hub">← اتكلم</button>' +
      '<div class="card"><h2 style="margin:0 0 4px">' + ic(s.ico) + " " + esc(s.t) + '</h2><p class="muted" style="font-size:14px;margin:0">' + esc(s.d) + "</p></div>" +
      '<div class="card" style="padding:6px">' + rows + "</div>" +
      '<details class="card"><summary><b>' + ic("chat") + " عبارات جاهزة من المواقف دي (" + chunks.length + ")</b></summary><div class=\"tk-chunks\">" +
      chunks.map(function (c) { return '<div class="tk-chunk"><span dir="ltr" lang="en">' + esc(c) + "</span>" + spkBtn(c) + "</div>"; }).join("") + "</div></details>";
  }
  function tkSceneHTML() {
    var st = tkUi().st, f = tkScene(st.k); if (!f) { tkUi().view = "hub"; return tkHubHTML(); }
    var sc = f.sc, mic = speechOK();
    if (st.done) {
      var sum = sc.turns.map(function (t, j) {
        var r = st.res[j] || {};
        return '<div class="tk-sum"><p class="tk-them" dir="ltr" lang="en">' + esc(sc.who) + ": " + esc(t[0]) + "</p>" +
          (r.text ? '<p class="tk-you l' + r.lvl + '" dir="ltr" lang="en">You: ' + esc(r.text) + "</p>" : '<p class="muted" style="font-size:12px">— اتخطيت —</p>') +
          '<p class="tk-nat" dir="ltr" lang="en">' + ic("sparkles") + " " + esc(t[6]) + " " + spkBtn(t[6]) + "</p></div>";
      }).join("");
      var idx = f.set.scenes.indexOf(sc), nx = f.set.scenes[idx + 1];
      return '<div class="card gend"><div class="gend-stars">' + [1, 2, 3].map(function (n) { return '<span class="' + (n <= st.stars ? "on" : "") + '">★</span>'; }).join("") + "</div>" +
        "<h2>" + (st.stars === 3 ? "اتكلمت زي المحترفين 🎉" : st.stars === 2 ? "كويس جدًا 👍" : "بداية كويسة 💪") + "</h2>" +
        '<p class="muted">' + esc(sc.t) + " · +" + (st.xp + 3) + " نقطة</p>" +
        '<div class="row wrapr" style="justify-content:center;margin-block:12px"><button class="btn" data-act="tk-start" data-k="' + sc.k + '">' + ic("repeat") + " اتكلم تاني</button>" +
        (nx ? '<button class="btn alt" data-act="tk-start" data-k="' + nx.k + '">الموقف الجاي ←</button>' : '<button class="btn alt" data-act="tk-set" data-k="' + f.set.k + '">كل المواقف</button>') + "</div>" +
        '<button class="btn alt sm" data-act="tk-save">' + ic("pen") + " احفظ الجمل الطبيعية في «جملي»</button>" +
        (state.co && state.co.tkBack ? '<button class="btn" style="width:100%;margin-block-start:10px" data-act="co-hub">' + ic("check") + " رجوع لجرعة اليوم</button>" : "") + "</div>" +
        '<div class="sec-h">المحادثة كاملة</div><div class="card">' + sum + "</div>";
    }
    var t = sc.turns[st.i];
    var hist = st.res.map(function (r, j) {
      var tt = sc.turns[j];
      return '<div class="ibub them" dir="ltr" lang="en">' + esc(tt[0]) + "</div>" + (r.text ? '<div class="ibub me" dir="ltr" lang="en">' + esc(r.text) + "</div>" : "");
    }).join("");
    var top = '<div class="gtop"><button class="linkbtn" data-act="tk-set" data-k="' + f.set.k + '">✕</button><b>' + esc(sc.t) + '</b><span class="num">' + (st.i + 1) + "/" + sc.turns.length + "</span></div>" +
      (st.i === 0 ? '<p class="muted tk-ctx">' + ic("pin") + " " + esc(sc.set) + "</p>" : "");
    var them = '<div class="ichat">' + hist + '<div class="ibub them" dir="ltr" lang="en"><small>' + esc(sc.who) + "</small>" + esc(t[0]) + ' <button class="ispk" data-act="speak" data-txt="' + esc(t[0]) + '" aria-label="اسمع">' + ico("vol") + "</button></div>" +
      (st.ar ? '<p class="muted ibub-ar">' + esc(t[1]) + "</p>" : '<button class="linkbtn tk-arbtn" data-act="tk-ar">إيه معناها؟</button>') + "</div>";
    if (!st.ans) {
      return top + them +
        '<div class="card tk-goal"><b>' + ic("target") + " مهمتك:</b> " + esc(t[2]) +
        (st.hint ? '<div class="tk-hints">' + t[4].map(function (h) { return '<span dir="ltr" lang="en">' + esc(h) + "</span>"; }).join("") + "</div>" : '<button class="linkbtn" data-act="tk-hint">' + ic("bulb") + " ساعدني بكلمات</button>") + "</div>" +
        (mic ? '<button class="btn gbig tk-mic' + (st.listening === "answer" ? " on" : "") + '" data-act="tk-mic"' + (st.listening ? " disabled" : "") + ">" + ic("mic") + (st.listening === "answer" ? " بسمعك… اتكلم" : " اضغط واتكلم") + "</button>" : "") +
        '<div class="tk-type"><input class="inp" id="tkIn" dir="ltr" lang="en" autocomplete="off" placeholder="' + (mic ? "أو اكتب ردك بالإنجليزي…" : "اكتب ردك بالإنجليزي، وقوله بصوت عالي…") + '"><button class="btn" data-act="tk-send">إرسال</button></div>' +
        '<button class="linkbtn tk-skip" data-act="tk-skip">مش عارف أقول إيه، وريني</button>';
    }
    var a = st.ans, r = a.r;
    var fb = a.text
      ? '<div class="ibub me" dir="ltr" lang="en">' + esc(a.text) + "</div>" +
        '<div class="ifb s' + r.lvl + '"><b>' + (r.lvl === 2 ? "✓ وصّلت الفكرة كاملة!" : r.lvl === 1 ? "🙂 قرّبت، وصّلت جزء من الفكرة" : "✗ الفكرة لسه ما وصلتش") + "</b>" +
        "<p>" + (r.lvl === 2 && r.words < 6 ? "حاول المرة الجاية تطوّل الجملة شوية. شوف الطريقة الطبيعية تحت." : r.lvl === 2 ? "ممتاز. قارن ردك بالطريقة الطبيعية وخد منها عبارة جديدة." : "بص على الردين تحت، وكرّر الطبيعي بصوتك.") + "</p></div>"
      : '<div class="ifb s0"><b>ولا يهمك. ده الرد:</b><p>اسمعه، وبعدين كرّره بصوتك مرتين.</p></div>';
    var shadow = st.shadow ? '<p class="iheard ' + (st.shadow.score >= 0.7 ? "ok" : "bad") + '" dir="ltr" lang="en">' + esc(st.shadow.heard) + "</p>" + (st.shadow.score >= 0.7 ? '<p style="color:var(--done);font-weight:700;margin:4px 0">✓ نطق ممتاز +٢</p>' : '<p class="muted" style="font-size:12px;margin:4px 0">قرّبت. اسمعها تاني بالبطيء وجرب.</p>') : "";
    return top + them + fb +
      '<div class="card tk-models"><div class="tk-model"><small>بسيطة</small><p dir="ltr" lang="en">' + esc(t[5]) + "</p>" + spkBtn(t[5]) + "</div>" +
      '<div class="tk-model nat"><small>' + ic("sparkles") + ' طبيعية (زي ما الناس بتتكلم)</small><p dir="ltr" lang="en">' + esc(t[6]) + "</p>" + spkBtn(t[6]) + "</div>" +
      '<div class="tk-shadow"><p class="muted" style="font-size:13px;margin:0 0 6px">كرّر الطبيعية بصوتك (Shadowing):</p>' + shadow +
      (mic ? '<button class="btn sm" data-act="tk-shadow"' + (st.listening ? " disabled" : "") + ">" + ic("mic") + (st.listening === "shadow" ? " بسمعك…" : " قولها") + "</button>" : '<span class="muted" style="font-size:12px">قولها بصوت عالي مرتين.</span>') + "</div></div>" +
      '<button class="btn" style="width:100%;margin-block-start:10px" data-act="tk-next">' + (st.i + 1 >= sc.turns.length ? "النتيجة" : "كمّل المحادثة ←") + "</button>";
  }

  /* events */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var act = el.getAttribute("data-act"); if (act.indexOf("tk-") !== 0) return;
    var u = tkUi(), st = u.st;
    switch (act) {
      case "tk-open": u.view = "hub"; state.lv = { mode: "talk", c: "en" }; goTab("learn"); $("#p-learn").scrollTop = 0; render(); break;
      case "tk-hub": u.view = "hub"; $("#p-learn").scrollTop = 0; render(); break;
      case "tk-set": u.view = "set"; u.set = el.getAttribute("data-k"); u.st = null; $("#p-learn").scrollTop = 0; render(); break;
      case "tk-start": tkStart(el.getAttribute("data-k")); break;
      case "tk-ar": if (st) { st.ar = true; render(); } break;
      case "tk-hint": if (st) { st.hint = true; render(); } break;
      case "tk-mic": tkMic(false); break;
      case "tk-shadow": tkMic(true); break;
      case "tk-send": { var inp = document.getElementById("tkIn"), v = inp ? inp.value.trim() : ""; if (!v) { toast("اكتب ردك الأول، أو اضغط على المايك"); break; } tkAnswer(v); break; }
      case "tk-skip": tkAnswer(""); break;
      case "tk-next": if (st && st.ans) tkNext(); break;
      case "tk-save": {
        var f = st && tkScene(st.k); if (!f) break;
        var have = {}; (state.learn.mySentences || []).forEach(function (m) { have[m.text] = 1; });
        var n = 0; f.sc.turns.forEach(function (t) { if (!have[t[6]]) { saveMySentence("en", t[6]); n++; } });
        toast(n ? "اتحفظت " + n + " جمل في «جملي»" : "الجمل دي محفوظة عندك قبل كده"); el.disabled = true; break;
      }
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target && e.target.id === "tkIn") { e.preventDefault(); var v = e.target.value.trim(); if (v) tkAnswer(v); }
  });
