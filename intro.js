"use strict";
  /* ---------------- قدّم نفسك — self-introduction builder ---------------- */
  // Builds a personal self-introduction in three styles from the person's own answers,
  // then practises it sentence by sentence with the mic (read aloud, then from memory).
  // Opened from «مساري»; free conversation practice lives in «اتكلم» (talk.js).
  var IJOBS = [
    { k: "quality", en: "a quality specialist", ar: "أخصائي جودة", f: "quality systems, audits, and continuous improvement", fa: "أنظمة الجودة والتدقيق والتحسين المستمر" },
    { k: "food", en: "a food safety specialist", ar: "أخصائي سلامة غذاء", f: "food safety systems like ISO 22000 and HACCP", fa: "أنظمة سلامة الغذاء زي ISO 22000 وHACCP" },
    { k: "micro", en: "a microbiologist", ar: "أخصائي ميكروبيولوجي", f: "laboratory testing and food microbiology", fa: "التحاليل المعملية وميكروبيولوجيا الأغذية" },
    { k: "lab", en: "a lab technician", ar: "فني معمل", f: "running accurate tests and keeping clear lab records", fa: "إجراء تحاليل دقيقة وتسجيل نتايج المعمل" },
    { k: "nutrition", en: "a nutritionist", ar: "أخصائي تغذية", f: "helping people build healthy eating habits", fa: "مساعدة الناس يكوّنوا عادات أكل صحية" },
    { k: "engineer", en: "an engineer", ar: "مهندس", f: "solving technical problems and improving processes", fa: "حل المشاكل الفنية وتحسين العمليات" },
    { k: "dev", en: "a software developer", ar: "مبرمج", f: "building apps and websites", fa: "بناء التطبيقات والمواقع" },
    { k: "accountant", en: "an accountant", ar: "محاسب", f: "financial reports and budgets", fa: "التقارير المالية والميزانيات" },
    { k: "teacher", en: "a teacher", ar: "مدرّس", f: "helping students learn and grow", fa: "مساعدة الطلاب يتعلموا ويتطوروا" },
    { k: "sales", en: "a sales representative", ar: "مندوب مبيعات", f: "building strong relationships with customers", fa: "بناء علاقات قوية مع العملاء" },
    { k: "doctor", en: "a doctor", ar: "دكتور", f: "taking care of patients", fa: "رعاية المرضى" },
    { k: "nurse", en: "a nurse", ar: "ممرض", f: "patient care and support", fa: "رعاية ودعم المرضى" },
    { k: "manager", en: "a manager", ar: "مدير", f: "leading a team and planning projects", fa: "قيادة فريق وتخطيط المشاريع" },
    { k: "student", en: "a student", ar: "طالب", f: "my studies and building new skills", fa: "دراستي واكتساب مهارات جديدة" }
  ];
  var IHOBBIES = [
    { k: "reading", en: "reading", ar: "القراءة" }, { k: "football", en: "playing football", ar: "لعب الكورة" },
    { k: "swim", en: "swimming", ar: "العوم" }, { k: "travel", en: "traveling", ar: "السفر" },
    { k: "cook", en: "cooking", ar: "الطبخ" }, { k: "gym", en: "going to the gym", ar: "الجيم" },
    { k: "photo", en: "photography", ar: "التصوير" }, { k: "lang", en: "learning languages", ar: "تعلّم اللغات" },
    { k: "movies", en: "watching movies", ar: "مشاهدة الأفلام" }, { k: "games", en: "playing video games", ar: "ألعاب الفيديو" },
    { k: "draw", en: "drawing", ar: "الرسم" }, { k: "walk", en: "walking", ar: "المشي" }
  ];
  var ITRAITS = [
    { k: "hard", en: "hardworking", ar: "مجتهد" }, { k: "friendly", en: "friendly", ar: "ودود" },
    { k: "organized", en: "organized", ar: "منظّم" }, { k: "curious", en: "curious", ar: "بحب أتعلم" },
    { k: "calm", en: "calm", ar: "هادي" }, { k: "creative", en: "creative", ar: "مبدع" },
    { k: "reliable", en: "reliable", ar: "يُعتمد عليّ" }, { k: "positive", en: "positive", ar: "إيجابي" }
  ];
  var IGOALS = [
    { k: "english", en: "improve my English", ar: "أحسّن الإنجليزي بتاعي" },
    { k: "career", en: "grow in my career", ar: "أتطور في شغلي" },
    { k: "people", en: "meet new people", ar: "أتعرف على ناس جديدة" },
    { k: "abroad", en: "work abroad", ar: "أشتغل برّه" },
    { k: "master", en: "get a master's degree", ar: "آخد ماجستير" },
    { k: "business", en: "start my own business", ar: "أبدأ مشروعي الخاص" }
  ];
  var ISTYLES = [
    { k: "casual", t: "ودّي", d: "لقاء شخص جديد" },
    { k: "pro", t: "مهني", d: "شغل ومؤتمرات" },
    { k: "interview", t: "مقابلة عمل", d: "Tell me about yourself" }
  ];

  function idata() {
    if (!state.learn.intro || typeof state.learn.intro !== "object") state.learn.intro = {};
    var d = state.learn.intro;
    if (!d.p) d.p = {}; if (!d.sc) d.sc = {}; if (!d.days) d.days = {};
    d.pts = d.pts || 0;
    return d;
  }
  function ui() { if (!state.intro) state.intro = { view: "hub", style: "casual" }; return state.intro; }
  function byK(list, k) { return list.filter(function (x) { return x.k === k; })[0] || null; }
  function addConf(n) { var d = idata(); d.pts += n; d.days[nowR().key] = 1; addXp(n); saveMeta("learn", 600); }
  /* profile → personalised English */
  function vars() {
    var p = idata().p, job = byK(IJOBS, p.job), hs = (p.hobbies || []).map(function (k) { return byK(IHOBBIES, k); }).filter(Boolean);
    var ts = (p.traits || []).map(function (k) { return byK(ITRAITS, k); }).filter(Boolean), goal = byK(IGOALS, p.goal) || IGOALS[0];
    var customJob = !job && p.jobText ? { en: p.jobText, ar: p.jobText, f: "my work", fa: "شغلي" } : null;
    job = job || customJob || IJOBS[IJOBS.length - 1];
    var years = Number(p.years) || 0;
    return {
      name: p.name || "Ahmed", city: p.city || "Cairo", country: p.country || "Egypt",
      job: job.en, jobAr: job.ar, focus: job.f, focusAr: job.fa, student: job.k === "student",
      h1: (hs[0] || IHOBBIES[0]).en, h1Ar: (hs[0] || IHOBBIES[0]).ar, h2: (hs[1] || IHOBBIES[2]).en, h2Ar: (hs[1] || IHOBBIES[2]).ar,
      t1: (ts[0] || ITRAITS[0]).en, t1Ar: (ts[0] || ITRAITS[0]).ar, t2: (ts[1] || ITRAITS[1]).en, t2Ar: (ts[1] || ITRAITS[1]).ar,
      at1: (/^[aeiou]/i.test((ts[0] || ITRAITS[0]).en) ? "an " : "a ") + (ts[0] || ITRAITS[0]).en,
      goal: goal.en, goalAr: goal.ar, years: years,
      exp: years > 0 ? years + (years === 1 ? " year" : " years") + " of experience" : "a strong wish to learn",
      expAr: years > 0 ? years + " سنين خبرة" : "رغبة قوية إني أتعلم",
      expLine: years > 0 ? "Yes, I have " + years + (years === 1 ? " year" : " years") + " of experience in this field" : "Not exactly, but I learn fast",
      expLineAr: years > 0 ? "أيوه، عندي " + years + " سنين خبرة في المجال ده" : "مش بالظبط، بس أنا بتعلم بسرعة"
    };
  }
  function fill(s, V) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return V[k] != null ? V[k] : ""; }); }
  function introLines(style) {
    var V = vars(), L;
    if (style === "casual") L = [
      ["Hi! I'm {name}.", "أهلاً! أنا {name}."],
      ["I'm from {city}, {country}.", "أنا من {city}، {country}."],
      [V.student ? "I'm a student, and I'm working on {focus}." : "I work as {job}.", V.student ? "أنا طالب، وبشتغل على {focusAr}." : "بشتغل {jobAr}."],
      ["In my free time, I like {h1} and {h2}.", "في وقت فراغي بحب {h1Ar} و{h2Ar}."],
      ["Right now, I'm trying to {goal}.", "دلوقتي بحاول {goalAr}."],
      ["Nice to meet you!", "اتشرفت بمعرفتك!"]
    ];
    else if (style === "pro") L = [
      ["Hello, my name is {name}, and I'm {job}.", "أهلاً، اسمي {name}، وأنا {jobAr}."],
      [V.years > 0 ? "I have {exp} in this field." : "I'm at the start of my career, and I'm learning fast.", V.years > 0 ? "عندي {expAr} في المجال ده." : "أنا في بداية مشواري المهني، وبتعلم بسرعة."],
      ["I mainly work on {focus}.", "بشتغل أساسًا على {focusAr}."],
      ["People describe me as {t1} and {t2}.", "الناس بتوصفني إني {t1Ar} و{t2Ar}."],
      ["Outside of work, I enjoy {h1}.", "برّه الشغل بستمتع بـ{h1Ar}."],
      ["My goal is to {goal}. It's a pleasure to meet you.", "هدفي إني {goalAr}. اتشرفت بمعرفتك."]
    ];
    else L = [
      ["Thank you for having me. My name is {name}.", "شكرًا على الفرصة. اسمي {name}."],
      ["I'm {job} with {exp}.", "أنا {jobAr} وعندي {expAr}."],
      ["In my work, I focus on {focus}.", "في شغلي بركّز على {focusAr}."],
      ["I'm {at1} and {t2} person, and I always try to learn new things.", "أنا شخص {t1Ar} و{t2Ar}، ودايمًا بحاول أتعلم حاجات جديدة."],
      ["I'm excited about this opportunity because I want to {goal}.", "أنا متحمس للفرصة دي لأني عايز {goalAr}."],
      ["I believe I can add real value to your team.", "وواثق إني أقدر أضيف قيمة حقيقية لفريقكم."]
    ];
    return L.map(function (x) { return { en: fill(x[0], V), ar: fill(x[1], V) }; });
  }

  /* role-play scenes — s: 2 best, 1 okay, 0 wrong */
  /* views */
  function introHTML() {
    var u = ui();
    if (u.view === "build") return buildHTML();
    if (u.view === "mine") return mineHTML();
    if (u.view === "practice") return practiceHTML();
    return idata().p.name ? mineHTML() : buildHTML();
  }
  function back(to, label) {
    if (to === "hub") return '<button class="linkbtn" data-act="co-hub">← مساري</button>';
    return '<button class="linkbtn" data-act="intro-go" data-v="' + to + '">← ' + label + "</button>";
  }
  function chipsHTML(field, list, multi, max) {
    var p = idata().p, cur = multi ? (p[field] || []) : p[field];
    return '<div class="row wrapr">' + list.map(function (x) {
      var on = multi ? cur.indexOf(x.k) >= 0 : cur === x.k;
      return '<button class="chipbtn' + (on ? " on" : "") + '" data-act="intro-chip" data-f="' + field + '" data-k="' + x.k + '"' + (multi ? ' data-max="' + max + '"' : "") + ">" + esc(x.ar) + "</button>";
    }).join("") + "</div>";
  }
  function buildHTML() {
    var p = idata().p;
    function inp(id, f, ph, type) {
      return '<input class="inp" id="' + id + '" data-intro-f="' + f + '" dir="ltr" lang="en" type="' + (type || "text") + '" placeholder="' + esc(ph) + '" value="' + esc(p[f] || "") + '" autocomplete="off">';
    }
    return back("hub", "رجوع") +
      '<div class="card"><h2>' + ic("pen") + ' ابني تقديمك</h2><p class="muted" style="font-size:14px">اكتب الأسماء بالإنجليزي، والباقي اختاره بالعربي وأنا أترجمه.</p>' +
      '<label class="field">اسمك' + inp("iName", "name", "Ahmed") + "</label>" +
      '<div class="row" style="gap:10px"><label class="field grow">مدينتك' + inp("iCity", "city", "Cairo") + '</label><label class="field grow">بلدك' + inp("iCountry", "country", "Egypt") + "</label></div>" +
      '<div class="field">شغلك</div>' + chipsHTML("job", IJOBS, false) +
      '<label class="field">أو اكتب وظيفتك (لو مش في القايمة)' + inp("iJob", "jobText", "a pharmacist") + "</label>" +
      '<label class="field">سنين الخبرة' + inp("iYears", "years", "0", "number") + "</label>" +
      '<div class="field">هواياتك (اختار 2)</div>' + chipsHTML("hobbies", IHOBBIES, true, 2) +
      '<div class="field">صفاتك (اختار 2)</div>' + chipsHTML("traits", ITRAITS, true, 2) +
      '<div class="field">هدفك دلوقتي</div>' + chipsHTML("goal", IGOALS, false) +
      '<button class="btn" style="width:100%;margin-block-start:16px" data-act="intro-save">' + ic("sparkles") + ' اعمل تقديمي</button></div>';
  }
  function mineHTML() {
    var u = ui(), lines = introLines(u.style);
    return back("hub", "رجوع") +
      '<div class="seg2" style="margin-block:6px 12px">' + ISTYLES.map(function (s) {
        return '<button data-act="intro-style" data-v="' + s.k + '" aria-pressed="' + (u.style === s.k) + '">' + esc(s.t) + "</button>";
      }).join("") + "</div>" +
      '<div class="card"><div class="row between"><div><h3 style="margin:0">' + esc(byK(ISTYLES, u.style).t) + '</h3><small class="muted">' + esc(byK(ISTYLES, u.style).d) + "</small></div>" +
      '<button class="btn sm alt" data-act="speak" data-txt="' + esc(lines.map(function (l) { return l.en; }).join(" ")) + '">' + ico("vol") + " اسمع الكل</button></div>" +
      '<div class="ilines">' + lines.map(function (l) {
        return '<div class="iline"><div class="grow"><p dir="ltr" lang="en">' + esc(l.en) + '</p><small class="muted">' + esc(l.ar) + "</small></div>" + spkBtn(l.en) + "</div>";
      }).join("") + "</div>" +
      '<div class="row wrapr" style="margin-block-start:14px"><button class="btn" data-act="intro-practice" data-v="read">' + ic("mic") + ' اتدرّب جملة جملة</button>' +
      '<button class="btn alt" data-act="intro-practice" data-v="memory">' + ic("brain") + ' من الذاكرة</button></div></div>' +
      '<div class="card"><h3>' + ic("bulb") + ' نصايح وإنت بتقدّم نفسك</h3><ul class="itips"><li>ابتسم وبص في عين اللي قدامك.</li><li>اتكلم ببطء، السرعة مش شطارة.</li><li>خلّص بسؤال: <span dir="ltr" lang="en">What about you?</span> عشان الكلام يكمّل.</li><li>مش لازم تحفظه حرفيًا، الفكرة أهم من الكلمات.</li></ul></div>';
  }

  /* sentence-by-sentence practice */
  function practiceHTML() {
    var u = ui(), pr = u.pr, lines = introLines(u.style), l = lines[pr.i];
    if (pr.i >= lines.length) {
      return back("mine", "تقديمي") + '<div class="card gend"><div class="gend-stars"><span class="on">★</span><span class="' + (pr.good >= lines.length * 0.6 ? "on" : "") + '">★</span><span class="' + (pr.good === lines.length ? "on" : "") + '">★</span></div>' +
        "<h2>" + (pr.good === lines.length ? "تقديم ممتاز! 👏" : "شغل حلو، كمّل تدريب 💪") + '</h2><p class="muted">قلت ' + pr.good + " من " + lines.length + " جمل صح · +" + pr.xp + " نقطة ثقة</p>" +
        '<div class="row wrapr" style="justify-content:center;margin-block-start:14px"><button class="btn" data-act="intro-practice" data-v="' + pr.mode + '">مرة كمان</button>' +
        (pr.mode === "read" ? '<button class="btn alt" data-act="intro-practice" data-v="memory">جرّب من الذاكرة</button>' : '<button class="btn alt" data-act="tk-open">مواقف «اتكلم»</button>') + "</div></div>";
    }
    var hide = pr.mode === "memory" && !pr.reveal && pr.res == null;
    var mic = speechOK();
    return back("mine", "تقديمي") +
      '<div class="gtop"><b>' + (pr.mode === "memory" ? "" + ic("brain") + " من الذاكرة" : "" + ic("mic") + " اتدرّب") + '</b><span class="num">' + (pr.i + 1) + "/" + lines.length + "</span></div>" +
      '<div class="card" style="text-align:center">' +
      '<p class="muted" style="font-size:15px;margin-block-end:8px">' + esc(l.ar) + "</p>" +
      (hide ? '<p class="muted" style="margin-block:14px">قولها بالإنجليزي من دماغك 👇</p><button class="btn sm alt" data-act="prac-reveal">' + ic("bulb") + ' وريني الجملة</button>'
        : '<p dir="ltr" lang="en" style="font-size:20px;font-weight:700;margin-block:6px 10px">' + esc(l.en) + "</p>" + spkBtn(l.en)) +
      (pr.heard ? '<p class="iheard ' + (pr.res >= 0.8 ? "ok" : "bad") + '" dir="ltr" lang="en">' + esc(pr.heard) + "</p>" : "") +
      (pr.res != null ? '<p style="font-weight:700;margin-block-start:8px;color:' + (pr.res >= 0.8 ? "var(--done-deep)" : "var(--miss-deep)") + '">' + (pr.res >= 0.8 ? "✓ ممتاز!" : "قريب، جرّب تاني بهدوء (" + Math.round(pr.res * 100) + "%)") + "</p>" : "") +
      "</div>" +
      '<div class="row" style="gap:10px">' +
      (mic ? '<button class="btn gbig" data-act="prac-mic"' + (pr.listening ? " disabled" : "") + ">" + (pr.listening ? "بسمعك…" : "" + ic("mic") + " قول الجملة") + "</button>"
        : '<button class="btn gbig" data-act="prac-self" data-v="1">✓ قلتها صح</button>') +
      '<button class="btn alt gbig" data-act="prac-next">' + (pr.res != null && pr.res >= 0.8 ? "التالي ←" : "تخطّي") + "</button></div>" +
      (mic ? "" : '<p class="muted" style="font-size:12px;text-align:center;margin-block-start:8px">المتصفح ده مفيهوش ميكروفون للتعرّف على الكلام، قولها بصوت عالي وقيّم نفسك.</p>');
  }
  function startPractice(mode) { ui().pr = { mode: mode, i: 0, good: 0, xp: 0, res: null, heard: "", reveal: false }; ui().view = "practice"; render(); }
  function pracNext() {
    var pr = ui().pr;
    if (pr.res != null && pr.res >= 0.8) { pr.good++; }
    pr.i++; pr.res = null; pr.heard = ""; pr.reveal = false;
    if (pr.i >= introLines(ui().style).length) { pr.xp = pr.good * (pr.mode === "memory" ? 4 : 2) + 2; addConf(pr.xp); }
    render();
  }
  function pracMic() {
    var pr = ui().pr, l = introLines(ui().style)[pr.i];
    pr.listening = true; render();
    recognizeOnce(function (r) {
      pr.listening = false;
      if (r.err) { toast("مسمعتش حاجة، جرّب تاني وقرّب الموبايل."); render(); return; }
      pr.heard = r.heard; pr.res = speechScore(r.heard, l.en);
      if (pr.res < 0.8 && navigator.vibrate) navigator.vibrate(30);
      render();
    });
  }

  /* role-play */
  /* daily one-minute speaking challenge */
  /* events */
  document.addEventListener("input", function (e) {
    var f = e.target && e.target.getAttribute && e.target.getAttribute("data-intro-f"); if (!f) return;
    idata().p[f] = f === "years" ? Math.max(0, Math.min(50, Number(e.target.value) || 0)) : e.target.value.trim();
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var u;
    switch (el.getAttribute("data-act")) {
      case "intro-open": u = ui(); u.view = "hub"; state.lv = { mode: "intro", c: "en" }; goTab("learn"); $("#p-learn").scrollTop = 0; render(); break;
      case "intro-go": u = ui(); u.view = el.getAttribute("data-v"); $("#p-learn").scrollTop = 0; render(); break;
      case "intro-chip": {
        var p = idata().p, f = el.getAttribute("data-f"), k = el.getAttribute("data-k"), max = Number(el.getAttribute("data-max")) || 0;
        if (max) {
          var arr = (p[f] || []).slice(), at = arr.indexOf(k);
          if (at >= 0) arr.splice(at, 1); else { arr.push(k); if (arr.length > max) arr.shift(); }
          p[f] = arr;
        } else { p[f] = p[f] === k ? null : k; if (f === "job" && p[f]) p.jobText = ""; }
        render(); break;
      }
      case "intro-save": {
        var pp = idata().p;
        if (!pp.name) { toast("اكتب اسمك بالإنجليزي الأول."); var n = document.getElementById("iName"); if (n) n.focus(); break; }
        if (!pp.job && !pp.jobText) { toast("اختار شغلك أو اكتبه."); break; }
        saveMeta("learn", 0); u = ui(); u.view = "mine"; u.style = "casual"; $("#p-learn").scrollTop = 0; render(); toast("✨ تقديمك جاهز!"); break;
      }
      case "intro-style": ui().style = el.getAttribute("data-v"); render(); break;
      case "intro-practice": startPractice(el.getAttribute("data-v")); break;
      case "prac-reveal": ui().pr.reveal = true; render(); break;
      case "prac-mic": pracMic(); break;
      case "prac-self": ui().pr.res = 1; pracNext(); break;
      case "prac-next": pracNext(); break;
    }
  });
