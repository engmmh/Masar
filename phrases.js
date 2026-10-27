"use strict";
  /* ---------------- جمل الحياة اليومية — everyday sentences with spaced repetition ---------------- */
  // 110 high-frequency sentences grouped by real situations. Each carries an
  // Egyptian-Arabic meaning, "when to say it" (w) and a key word (k) for the
  // fill-in drill. A sentence climbs stages 0→6; the exercise gets harder with
  // the stage (hear → build → fill → recall from Arabic → use in a situation)
  // and the next review moves further out, so it ends up in long-term memory.
  var PH_CATS = [
    { k: "greet", ico: "👋", t: "التحيات والدردشة", l: [
      ["How's it going?", "عامل إيه؟ أخبارك إيه؟", "لما تقابل حد تعرفه", "going"],
      ["Long time no see!", "بقالي كتير مشفتكش!", "لما تقابل حد بعد غياب طويل", "Long"],
      ["What have you been up to?", "كنت بتعمل إيه الفترة اللي فاتت؟", "لما تسأل حد عن أخباره بعد غياب", "up"],
      ["Nice to meet you.", "اتشرفت بمعرفتك.", "لما تتعرف على حد لأول مرة", "meet"],
      ["I've heard a lot about you.", "سمعت عنك كتير.", "لما تقابل حد اتكلموا عنه قدامك قبل كده", "heard"],
      ["Take care, see you soon.", "خلّي بالك من نفسك، أشوفك قريب.", "وإنت بتودّع حد", "care"],
      ["Have a nice weekend!", "ويك إند سعيد!", "آخر يوم في أسبوع الشغل وإنت مروّح", "weekend"],
      ["Say hi to your family for me.", "سلّملي على أهلك.", "وإنت بتودّع صاحبك", "family"],
      ["Sorry, I didn't catch your name.", "آسف، ملحقتش أسمع اسمك.", "لما حد قال اسمه وإنت مسمعتهوش كويس", "catch"],
      ["It was great to see you.", "كان جميل إني شفتك.", "في آخر مقابلة حلوة مع حد", "great"]] },
    { k: "work", ico: "💼", t: "في الشغل", l: [
      ["I'll get back to you on that.", "هرجعلك في الموضوع ده.", "لما تتسأل سؤال ومحتاج وقت تتأكد", "back"],
      ["Could you send me the details by email?", "ممكن تبعتلي التفاصيل على الإيميل؟", "لما حد يشرحلك حاجة كبيرة بالكلام", "details"],
      ["I'm working on it right now.", "أنا شغال عليها دلوقتي.", "لما مديرك يسأل عن مهمة لسه بتعملها", "working"],
      ["Let me check and let you know.", "خليني أتأكد وأقولك.", "لما مش متأكد من معلومة", "check"],
      ["Can we schedule a meeting for tomorrow?", "ممكن نحدد اجتماع بكرة؟", "لما محتاج تقعد مع حد تتكلموا", "schedule"],
      ["I need a little more time to finish this.", "محتاج وقت زيادة شوية عشان أخلّص ده.", "لما الديدلاين قرّب ومش هتلحق", "time"],
      ["That's a good point.", "دي نقطة كويسة.", "لما زميلك يقول فكرة مقنعة في نقاش", "point"],
      ["Could you walk me through it?", "ممكن تشرحهالي خطوة خطوة؟", "لما حاجة جديدة عليك ومحتاج شرح مفصّل", "walk"],
      ["I'm afraid I can't make it to the meeting.", "للأسف مش هقدر أحضر الاجتماع.", "لما تعتذر عن اجتماع بأدب", "afraid"],
      ["Thanks for your help, I really appreciate it.", "شكرًا على مساعدتك، بجد مقدّر ده.", "لما زميل ساعدك في حاجة", "appreciate"]] },
    { k: "food", ico: "☕", t: "المطعم والكافيه", l: [
      ["Can I see the menu, please?", "ممكن أشوف المنيو لو سمحت؟", "أول ما تقعد في مطعم", "menu"],
      ["I'd like a coffee with milk, please.", "عايز قهوة بلبن لو سمحت.", "وإنت بتطلب في الكافيه", "like"],
      ["What do you recommend?", "ترشّحلي إيه؟", "لما مش عارف تطلب إيه", "recommend"],
      ["Could we have the bill, please?", "ممكن الحساب لو سمحت؟", "لما تخلّص أكل وعايز تدفع", "bill"],
      ["Is this table free?", "الترابيزة دي فاضية؟", "لما تدور على مكان تقعد فيه", "free"],
      ["Can I get this to go?", "ممكن آخد ده تيك أواي؟", "لما عايز تاخد الأكل معاك", "go"],
      ["I'm allergic to nuts.", "عندي حساسية من المكسرات.", "لما تنبّه الجرسون لحاجة متأكلهاش", "allergic"],
      ["This is delicious!", "ده طعمه تحفة!", "لما الأكل يعجبك", "delicious"],
      ["Excuse me, this isn't what I ordered.", "لو سمحت، ده مش اللي أنا طلبته.", "لما يجيلك طلب غلط", "ordered"],
      ["Can I pay by card?", "ينفع أدفع بالكارت؟", "قبل ما تدفع ومش معاك كاش", "card"]] },
    { k: "shop", ico: "🛍️", t: "التسوق", l: [
      ["How much is this?", "ده بكام؟", "لما تسأل عن سعر حاجة", "much"],
      ["Do you have this in a smaller size?", "عندك ده بمقاس أصغر؟", "لما اللبس طلع واسع عليك", "size"],
      ["I'm just looking, thanks.", "بتفرّج بس، شكرًا.", "لما البيّاع يعرض مساعدته وإنت مش محتاج", "looking"],
      ["Can I try it on?", "ممكن أقيسه؟", "لما تحب تجرب هدوم قبل ما تشتري", "try"],
      ["Is there any discount?", "فيه أي خصم؟", "لما تحاول تاخد سعر أحسن", "discount"],
      ["I'll take it.", "هاخده.", "لما تقرر تشتري", "take"],
      ["Can I return it if it doesn't fit?", "ينفع أرجّعه لو مجاش مقاسي؟", "قبل ما تدفع وإنت مش متأكد من المقاس", "return"],
      ["Where can I find the milk?", "ألاقي اللبن فين؟", "في السوبر ماركت ومش لاقي حاجة", "find"],
      ["Could I have a receipt, please?", "ممكن الفاتورة لو سمحت؟", "بعد ما تدفع ومحتاج إثبات", "receipt"],
      ["That's a bit too expensive for me.", "ده غالي عليّا شوية.", "لما السعر أعلى من ميزانيتك", "expensive"]] },
    { k: "move", ico: "🚕", t: "المواصلات والطريق", l: [
      ["Excuse me, how do I get to the station?", "لو سمحت، أروح المحطة إزاي؟", "لما تكون تايه ومحتاج توصل مكان", "station"],
      ["Is it far from here?", "هو بعيد من هنا؟", "لما حد يوصفلك مكان", "far"],
      ["Can you take me to this address?", "ممكن توصلني العنوان ده؟", "وإنت راكب تاكسي", "address"],
      ["How long does it take to get there?", "المشوار ده بياخد قد إيه؟", "لما تحب تعرف وقت الطريق", "long"],
      ["Turn left at the traffic lights.", "لف شمال عند الإشارة.", "وإنت بتوصف طريق لحد", "left"],
      ["I'm stuck in traffic, I'll be a bit late.", "أنا واقف في الزحمة، هتأخر شوية.", "لما هتتأخر على معاد", "stuck"],
      ["Could you stop here, please?", "ممكن تقف هنا لو سمحت؟", "لما توصل ومحتاج السواق يقف", "stop"],
      ["Which bus goes to downtown?", "أنهي أتوبيس بيروح وسط البلد؟", "في محطة الأتوبيس", "bus"],
      ["It's within walking distance.", "المكان قريب، ينفع تروحه مشي.", "لما تقول لحد إن المكان قريب", "walking"],
      ["I think I'm lost.", "أعتقد إني تهت.", "لما تكتشف إنك ماشي غلط", "lost"]] },
    { k: "travel", ico: "✈️", t: "السفر والفندق", l: [
      ["I have a reservation under the name Ahmed.", "عندي حجز باسم أحمد.", "أول ما توصل الفندق", "reservation"],
      ["What time is check-out?", "معاد تسليم الأوضة الساعة كام؟", "لما تحب تعرف لازم تمشي إمتى", "check-out"],
      ["Is breakfast included?", "الفطار ضمن الحجز؟", "لما تسأل عن الفطار في الفندق", "included"],
      ["Where is the boarding gate?", "فين بوابة ركوب الطيارة؟", "في المطار وبتدور على البوابة", "gate"],
      ["My luggage didn't arrive.", "شنطي موصلتش.", "لما شنطتك متطلعش على السير", "luggage"],
      ["Could I have a window seat?", "ممكن كرسي جنب الشباك؟", "وإنت بتعمل تشيك إن", "window"],
      ["The air conditioning isn't working.", "التكييف مش شغال.", "لما فيه مشكلة في الأوضة", "working"],
      ["Can you recommend a good place to visit?", "ترشّحلي مكان حلو أزوره؟", "لما تسأل موظف الاستقبال عن أماكن", "visit"],
      ["I'm here on business.", "أنا هنا في شغل.", "لما حد يسألك في المطار جاي ليه", "business"],
      ["Could you call me a taxi, please?", "ممكن تطلبلي تاكسي لو سمحت؟", "في الاستقبال قبل ما تخرج", "taxi"]] },
    { k: "phone", ico: "📞", t: "التليفون والمواعيد", l: [
      ["Hello, this is Ahmed speaking.", "ألو، معاك أحمد.", "أول ما تتصل في مكالمة رسمية", "speaking"],
      ["Could you speak a little slower, please?", "ممكن تتكلم أبطأ شوية لو سمحت؟", "لما اللي بيكلمك سريع ومش فاهمه", "slower"],
      ["Can I call you back later?", "ممكن أكلمك تاني بعدين؟", "لما حد يتصل وإنت مشغول", "back"],
      ["I'd like to book an appointment.", "عايز أحجز معاد.", "لما تكلم عيادة أو مكان خدمة", "appointment"],
      ["Does Thursday at 3 work for you?", "يناسبك الخميس الساعة 3؟", "وإنت بتقترح معاد", "work"],
      ["Sorry, you're breaking up.", "آسف، الصوت بيقطع.", "لما الشبكة وحشة في المكالمة", "breaking"],
      ["Can I leave a message?", "ممكن أسيب رسالة؟", "لما الشخص اللي عايزه مش موجود", "message"],
      ["I need to reschedule our meeting.", "محتاج أغيّر معاد اجتماعنا.", "لما مش هتقدر تيجي في المعاد المتفق عليه", "reschedule"],
      ["Let me write that down.", "استنى أكتب ده.", "لما حد بيمليك رقم أو عنوان", "write"],
      ["Thanks for calling, have a good day.", "شكرًا على اتصالك، يومك سعيد.", "في آخر مكالمة", "calling"]] },
    { k: "health", ico: "🩺", t: "الصحة والدكتور", l: [
      ["I don't feel well today.", "مش حاسس إني كويس النهارده.", "لما تكون تعبان", "feel"],
      ["I have a headache.", "عندي صداع.", "لما راسك وجعاك", "headache"],
      ["I've had a fever since yesterday.", "عندي سخونية من امبارح.", "وإنت بتشرح للدكتور من إمتى تعبان", "fever"],
      ["How often should I take this medicine?", "آخد الدوا ده كل قد إيه؟", "لما الدكتور يكتبلك علاج", "often"],
      ["I need to take a sick day.", "محتاج آخد يوم أجازة مرضي.", "لما تبلّغ شغلك إنك تعبان", "sick"],
      ["Is there a pharmacy near here?", "فيه صيدلية قريبة من هنا؟", "لما تدور على صيدلية", "pharmacy"],
      ["It hurts here.", "بيوجعني هنا.", "وإنت بتشاور للدكتور على مكان الألم", "hurts"],
      ["I'm feeling much better now.", "أنا أحسن بكتير دلوقتي.", "لما حد يطمن عليك بعد ما تعبت", "better"],
      ["Get well soon!", "ألف سلامة عليك!", "لما تعرف إن حد تعبان", "soon"],
      ["Do I need a prescription for this?", "محتاج روشتة للدوا ده؟", "في الصيدلية قبل ما تشتري دوا", "prescription"]] },
    { k: "opinion", ico: "💬", t: "الرأي والنقاش", l: [
      ["In my opinion, we should wait.", "في رأيي، المفروض نستنى.", "لما تقول رأيك في قرار", "opinion"],
      ["I totally agree with you.", "أنا متفق معاك تمامًا.", "لما حد يقول حاجة إنت مقتنع بيها", "agree"],
      ["I see your point, but I think it's risky.", "فاهم وجهة نظرك، بس شايف إنها مخاطرة.", "لما تختلف مع حد بأدب", "point"],
      ["That makes sense.", "ده منطقي.", "لما شرح حد يقنعك", "sense"],
      ["I'm not sure about that.", "أنا مش متأكد من ده.", "لما عندك شك في كلام حد", "sure"],
      ["What do you think?", "إنت رأيك إيه؟", "لما تحب تشارك حد في القرار", "think"],
      ["Let's look at it from another angle.", "خلينا نبص لها من زاوية تانية.", "لما النقاش واقف وعايز تغيّر طريقة التفكير", "angle"],
      ["To be honest, I prefer the first option.", "بصراحة، أنا أفضّل الاختيار الأول.", "لما تختار بين حاجتين بوضوح", "honest"],
      ["That's exactly what I meant.", "ده بالظبط اللي كنت أقصده.", "لما حد يفهم قصدك صح", "exactly"],
      ["Fair enough.", "ماشي، عندك حق.", "لما تقبل وجهة نظر حد حتى لو مش موافق تمامًا", "Fair"]] },
    { k: "polite", ico: "🙏", t: "الطلبات والاعتذار", l: [
      ["Could you do me a favor?", "ممكن تعملّي خدمة؟", "قبل ما تطلب مساعدة من حد", "favor"],
      ["Would you mind closing the window?", "تمانع تقفل الشباك؟", "لما تطلب حاجة بأدب جدًا", "mind"],
      ["Sorry for the delay.", "آسف على التأخير.", "لما ترد متأخر على رسالة أو توصل متأخر", "delay"],
      ["My apologies, it was my mistake.", "أعتذر، دي كانت غلطتي.", "لما تعترف بغلطة في الشغل", "mistake"],
      ["No worries, it happens.", "ولا يهمك، بتحصل.", "لما حد يعتذرلك عن حاجة بسيطة", "worries"],
      ["Can you give me a hand with this?", "ممكن تساعدني في ده؟", "لما محتاج مساعدة سريعة", "hand"],
      ["Thank you so much, that's very kind of you.", "شكرًا جدًا، ده ذوق منك.", "لما حد يعمل معاك حاجة لطيفة", "kind"],
      ["You're welcome, anytime.", "العفو، في أي وقت.", "لما حد يشكرك", "anytime"],
      ["I didn't mean to interrupt.", "مكنتش أقصد أقاطعك.", "لما تقاطع حد وهو بيتكلم من غير قصد", "interrupt"],
      ["Is it okay if I leave early today?", "ينفع أمشي بدري النهارده؟", "لما تستأذن من مديرك", "early"]] },
    { k: "home", ico: "🏠", t: "البيت والروتين", l: [
      ["I usually wake up at seven.", "عادةً بصحى الساعة سبعة.", "لما تحكي عن روتينك", "usually"],
      ["I'm running late!", "أنا متأخر!", "لما تكون مستعجل الصبح", "late"],
      ["What's for dinner?", "هناكل إيه على العشا؟", "لما ترجع البيت جعان", "dinner"],
      ["I'm exhausted, I need some rest.", "أنا مهدود، محتاج أرتاح شوية.", "بعد يوم طويل", "exhausted"],
      ["Let's go out this weekend.", "يلا نخرج الويك إند ده.", "لما تقترح خروجة", "weekend"],
      ["I'll do it later.", "هعملها بعدين.", "لما تأجل حاجة", "later"],
      ["Could you turn down the TV?", "ممكن توطّي التلفزيون؟", "لما الصوت عالي ومش عارف تركز", "turn"],
      ["I'm going to bed, good night.", "أنا داخل أنام، تصبح على خير.", "قبل ما تنام", "bed"],
      ["Don't forget to lock the door.", "متنساش تقفل الباب.", "وإنت بتفكّر حد قبل ما يخرج", "forget"],
      ["I'm on my way home.", "أنا في الطريق للبيت.", "لما حد يسألك إنت فين", "way"]] }
  ];
  var PH = {}, PH_ALL = [];
  PH_CATS.forEach(function (c) {
    c.l.forEach(function (x, i) {
      var p = { id: c.k + i, cat: c.k, en: x[0], ar: x[1], w: x[2], k: x[3] };
      PH[p.id] = p; PH_ALL.push(p);
    });
  });
  var PH_DAYS = [0, 1, 2, 4, 7, 15, 30]; // stage → days until next review
  var PH_MAX = PH_DAYS.length - 1;
  var PH_STAGE_LBL = ["جديدة", "سمعتها", "رتّبتها", "كمّلتها", "قلتها", "استخدمتها", "محفوظة"];

  function phData() {
    if (!state.learn.ph || typeof state.learn.ph !== "object") state.learn.ph = {};
    var d = state.learn.ph; if (!d.c) d.c = {}; if (!d.days) d.days = {}; if (!d.newPerDay) d.newPerDay = 5;
    return d;
  }
  function phRec(id) { return phData().c[id] || null; }
  function phDue(now) {
    var c = phData().c;
    return PH_ALL.filter(function (p) { var r = c[p.id]; return r && r.due <= now.key && r.s < PH_MAX + 1; })
      .sort(function (a, b) { return c[a.id].due < c[b.id].due ? -1 : 1; });
  }
  function phStats(now) {
    var c = phData().c, started = 0, mastered = 0;
    PH_ALL.forEach(function (p) { var r = c[p.id]; if (r) { started++; if (r.s >= PH_MAX) mastered++; } });
    return { started: started, mastered: mastered, due: phDue(now).length, total: PH_ALL.length };
  }
  function phStreak(now) {
    var d = phData().days, k = now.key, n = 0;
    if (!d[k]) k = addDays(k, -1);
    while (d[k] && n < 999) { n++; k = addDays(k, -1); }
    return n;
  }
  function phUi() { if (!state.phv) state.phv = { view: "hub" }; return state.phv; }
  function phWords(s) { return s.split(/\s+/).filter(Boolean); }
  function phClean(w) { return w.replace(/[.,!?]/g, "").toLowerCase(); }
  // Exercise for a sentence at its current stage.
  function phExType(p, fresh) {
    if (fresh) return "learn";
    var s = (phRec(p.id) || { s: 0 }).s;
    if (s <= 0) return "listen";
    if (s === 1) return "build";
    if (s === 2) return "fill";
    if (s === 3) return speechOK() ? "say" : "recall";
    return s === 4 ? "use" : (Math.random() < 0.5 ? "use" : (speechOK() ? "say" : "recall"));
  }

  /* session */
  function phStart(cat) {
    var now = nowR(), d = phData(), c = d.c;
    var due = phDue(now).filter(function (p) { return !cat || p.cat === cat; }).slice(0, 12);
    var newToday = (d.newDay && d.newDay.k === now.key) ? d.newDay.n : 0;
    var room = cat ? 5 : Math.max(0, d.newPerDay - newToday);
    var fresh = PH_ALL.filter(function (p) { return !c[p.id] && (!cat || p.cat === cat); }).slice(0, room);
    var q = [];
    fresh.forEach(function (p) { q.push({ id: p.id, t: "learn" }); q.push({ id: p.id, t: "listen", first: true }); });
    shuffle(due).forEach(function (p) { q.push({ id: p.id, t: phExType(p) }); });
    if (!q.length) { toast(cat ? "خلّصت كل جمل القسم ده، راجعها لما يجي معادها." : "مفيش مراجعات النهارده ✓ — جرّب قسم جديد."); return; }
    var u = phUi();
    u.view = "session"; u.ses = { q: q, i: 0, ok: 0, bad: 0, fresh: fresh.length, rev: due.length, xp: 0, seen: {}, retry: {} };
    phPrep(); $("#p-learn").scrollTop = 0; render(); phAutoSpeak();
  }
  function phCur() { var s = phUi().ses; return s && s.q[s.i]; }
  function phPrep() {
    var it = phCur(); if (!it) return;
    var p = PH[it.id];
    it.res = null; it.typed = []; it.heard = ""; it.pick = null;
    var sib = PH_ALL.filter(function (x) { return x.cat === p.cat && x.id !== p.id; });
    if (it.t === "listen") it.opts = shuffle([p.ar].concat(shuffle(sib).slice(0, 2).map(function (x) { return x.ar; })));
    if (it.t === "use") it.opts = shuffle([p.en].concat(shuffle(sib).slice(0, 2).map(function (x) { return x.en; })));
    if (it.t === "build" || it.t === "recall") {
      var w = phWords(p.en); it.tiles = shuffle(w.map(function (x, i) { return { w: x, i: i }; }));
      if (w.length > 1 && it.tiles.every(function (t, i) { return t.i === i; })) it.tiles.reverse();
    }
    if (it.t === "fill") {
      var others = shuffle(PH_ALL.filter(function (x) { return phClean(x.k) !== phClean(p.k); }).map(function (x) { return x.k; }));
      var uniq = []; others.forEach(function (k) { if (uniq.indexOf(k.toLowerCase()) < 0 && uniq.length < 3) uniq.push(k.toLowerCase()); });
      it.opts = shuffle([p.k.toLowerCase()].concat(uniq));
    }
  }
  function phAutoSpeak() {
    var it = phCur(); if (!it) return;
    if (it.t === "learn" || it.t === "listen" || it.t === "build") { var en = PH[it.id].en; setTimeout(function () { speak(en); }, 250); }
  }
  function phGrade(ok) {
    var u = phUi(), s = u.ses, it = phCur(), p = PH[it.id], d = phData(), now = nowR();
    it.res = ok ? "ok" : "bad";
    if (ok) s.ok++; else s.bad++;
    if (!s.seen[it.id]) {
      s.seen[it.id] = 1;
      var r = d.c[it.id] || { s: 0, n: 0 };
      r.n = (r.n || 0) + 1;
      if (it.first) { r.s = ok ? 1 : 0; }
      else if (ok) r.s = Math.min(PH_MAX, r.s + 1);
      else r.s = Math.max(0, r.s - 1);
      r.due = addDays(now.key, ok ? PH_DAYS[r.s] : 0);
      d.c[it.id] = r;
      if (it.first) { if (!d.newDay || d.newDay.k !== now.key) d.newDay = { k: now.key, n: 0 }; d.newDay.n++; }
    }
    // A miss comes back once at the end of the session, one stage easier.
    if (!ok && !s.retry[it.id]) { s.retry[it.id] = 1; s.q.push({ id: it.id, t: it.t === "listen" || it.t === "build" ? "listen" : "build" }); }
    var gain = ok ? (it.first ? 3 : 2) : 0;
    if (gain) { s.xp += gain; addXp(gain); }
    d.days[now.key] = 1;
    saveMeta("learn", 800);
    if (navigator.vibrate) navigator.vibrate(ok ? 12 : [30, 40, 30]);
    render();
    if (it.t !== "learn") speak(p.en);
  }
  function phNext() {
    var s = phUi().ses; s.i++;
    if (s.i >= s.q.length) { phUi().view = "done"; render(); return; }
    phPrep(); $("#p-learn").scrollTop = 0; render(); phAutoSpeak();
  }

  /* views */
  function dailyPhrasesHTML() {
    var u = phUi();
    if (u.view === "session") return phSessionHTML();
    if (u.view === "done") return phDoneHTML();
    if (u.view === "cat") return phCatHTML(u.cat);
    return phHubHTML();
  }
  function phDots(s) { var out = ""; for (var i = 1; i <= PH_MAX; i++) out += '<i class="' + (i <= s ? "on" : "") + '"></i>'; return '<span class="ph-dots">' + out + "</span>"; }
  function phHubHTML() {
    var now = nowR(), st = phStats(now), d = phData();
    var newToday = (d.newDay && d.newDay.k === now.key) ? d.newDay.n : 0, newLeft = Math.max(0, d.newPerDay - newToday);
    var anyNew = PH_ALL.some(function (p) { return !d.c[p.id]; });
    var todayCount = st.due + (anyNew ? newLeft : 0);
    var cats = PH_CATS.map(function (c) {
      var done = c.l.filter(function (_, i) { return d.c[c.k + i]; }).length, mast = c.l.filter(function (_, i) { var r = d.c[c.k + i]; return r && r.s >= PH_MAX; }).length;
      return '<button class="gtile" data-act="ph-cat" data-k="' + c.k + '"><span class="gtile-ic">' + c.ico + "</span><b>" + esc(c.t) + '</b><span class="cprog" style="width:100%;--c1:var(--teal);--c2:var(--teal-deep)"><span class="bar"><i style="width:' + Math.round(done / c.l.length * 100) + '%"></i></span><span class="num">' + done + "/" + c.l.length + "</span></span>" +
        (mast ? '<span class="gtile-best">⭐ ' + mast + " محفوظة</span>" : "") + "</button>";
    }).join("");
    return '<button class="linkbtn" data-act="course-open" data-c="en">← الإنجليزي</button>' +
      '<div class="chero" style="--c1:#0E9F8E;--c2:#0B5F78"><div class="row" style="gap:12px;align-items:center"><span class="feat-ic" style="font-size:28px">💬</span><div><h2>جمل الحياة اليومية</h2><p>' + st.total + " جملة هتحتاجها فعلًا، تسمعها وترتّبها وتقولها لحد ما تبقى على لسانك.</p></div></div>" +
      '<div class="chero-stats"><div><b class="num">' + st.started + '</b><small>بدأت فيها</small></div><div><b class="num">' + st.mastered + '</b><small>محفوظة</small></div><div><b class="num">🔥 ' + phStreak(now) + '</b><small>يوم متواصل</small></div></div>' +
      '<span class="bar"><i style="width:' + Math.round(st.started / st.total * 100) + '%"></i></span>' +
      '<button class="btn chero-cta" data-act="ph-start"' + (todayCount ? "" : " disabled") + ">" + (todayCount ? "▶ جلسة النهارده · " + (st.due ? st.due + " مراجعة" : "") + (st.due && anyNew && newLeft ? " + " : "") + (anyNew && newLeft ? newLeft + " جديدة" : "") : "✓ خلّصت النهارده") + "</button></div>" +
      '<div class="card ph-how"><b>إزاي بتتحفظ؟</b><div class="ph-steps"><span>🎧 تسمع</span><span>🧩 ترتّب</span><span>✍️ تكمّل</span><span>🎤 تقول</span><span>🎯 تستخدم</span></div>' +
      '<p class="muted" style="font-size:13px">كل ما تجاوب صح الجملة بتطلع مرحلة وترجعلك بعد مدة أطول (يوم، يومين، 4، أسبوع، أسبوعين، شهر). اللي بتغلط فيه بيرجعلك أسرع.</p>' +
      '<div class="row wrapr" style="gap:6px;margin-block-start:10px"><small class="muted">جمل جديدة كل يوم:</small>' + [3, 5, 8].map(function (n) {
        return '<button class="chipbtn' + (d.newPerDay === n ? " on" : "") + '" data-act="ph-npd" data-v="' + n + '">' + n + "</button>";
      }).join("") + "</div></div>" +
      '<div class="sec-h">المواقف</div><div class="gtiles">' + cats + "</div>";
  }
  function phCatHTML(k) {
    var c = PH_CATS.filter(function (x) { return x.k === k; })[0], d = phData();
    return '<button class="linkbtn" data-act="ph-hub">← جمل يومية</button>' +
      '<div class="adm-head" style="margin-block:8px 10px"><h2 style="font-size:22px">' + c.ico + " " + esc(c.t) + '</h2><button class="btn sm" data-act="ph-start-cat" data-k="' + k + '">▶ اتدرّب على القسم</button></div>' +
      c.l.map(function (_, i) {
        var p = PH[k + i], r = d.c[p.id];
        return '<div class="card ph-item"><div class="row" style="gap:10px;align-items:flex-start"><div class="grow"><p class="ph-en" dir="ltr" lang="en">' + esc(p.en) + "</p>" +
          '<p class="ph-ar">' + esc(p.ar) + '</p><small class="muted">💡 ' + esc(p.w) + "</small></div>" + spkBtn(p.en) + "</div>" +
          '<div class="row between" style="margin-block-start:8px">' + phDots(r ? r.s : 0) + '<small class="muted">' + (r ? PH_STAGE_LBL[r.s] + (r.s < PH_MAX ? " · المراجعة " + (r.due <= nowR().key ? "النهارده" : fmtShortAr(r.due)) : "") : "لسه متعلمتهاش") + "</small></div></div>";
      }).join("");
  }
  function fmtShortAr(k) { var p = k.split("-"); return Number(p[2]) + "/" + Number(p[1]); }
  function phSessionHTML() {
    var s = phUi().ses, it = phCur(), p = PH[it.id], cat = PH_CATS.filter(function (c) { return c.k === p.cat; })[0];
    var pct = Math.round(s.i / s.q.length * 100), done = it.res != null;
    var top = '<div class="gtop"><button class="linkbtn" data-act="ph-hub">✕</button><span class="ph-prog"><span class="bar"><i style="width:' + pct + '%"></i></span></span><span class="num">' + (s.i + 1) + "/" + s.q.length + "</span></div>" +
      '<p class="muted ph-cat">' + cat.ico + " " + esc(cat.t) + "</p>";
    var body = "";
    var audio = '<div class="row" style="gap:8px;justify-content:center"><button class="lbig sm" data-act="speak" data-txt="' + esc(p.en) + '" aria-label="اسمع">' + ico("vol") + '</button><button class="btn sm alt" data-act="ph-slow">🐢 أبطأ</button></div>';
    var reveal = '<div class="ph-reveal ' + (it.res || "") + '"><b>' + (it.res === "ok" ? "✓ صح!" : "الصح:") + '</b><p class="ph-en" dir="ltr" lang="en">' + esc(p.en) + '</p><p class="ph-ar">' + esc(p.ar) + "</p><small>💡 " + esc(p.w) + "</small></div>";
    if (it.t === "learn") {
      body = '<div class="card ph-learn"><span class="ph-badge">جملة جديدة ✨</span><p class="ph-en big" dir="ltr" lang="en">' + esc(p.en) + '</p><p class="ph-ar">' + esc(p.ar) + "</p>" +
        '<p class="ph-when">💡 بتتقال ' + esc(p.w) + "</p>" + audio + '<p class="muted" style="font-size:13px;margin-block-start:10px">اسمعها وكرّرها بصوت عالي مرتين قبل ما تكمّل.</p></div>' +
        '<button class="btn" style="width:100%" data-act="ph-next">فهمتها ←</button>';
    } else if (it.t === "listen") {
      body = '<div class="card" style="text-align:center"><h3>🎧 اسمع واختار المعنى</h3>' + audio + "</div>" +
        '<div class="iopts">' + it.opts.map(function (o) {
          var cls = "gopt" + (done && o === p.ar ? " ok" : "") + (done && o === it.pick && o !== p.ar ? " bad" : "");
          return '<button class="' + cls + '" data-act="ph-pick" data-v="' + esc(o) + '"' + (done ? " disabled" : "") + ">" + esc(o) + "</button>";
        }).join("") + "</div>" + (done ? reveal : "");
    } else if (it.t === "use") {
      body = '<div class="card"><h3>🎯 الموقف</h3><p style="font-size:17px;font-weight:600;margin-block:6px">' + esc(p.w) + '، تقول إيه؟</p><small class="muted">المعنى اللي عايز توصله: ' + esc(p.ar) + "</small></div>" +
        '<div class="iopts">' + it.opts.map(function (o) {
          var cls = "gopt iopt" + (done && o === p.en ? " ok" : "") + (done && o === it.pick && o !== p.en ? " bad" : "");
          return '<button class="' + cls + '" dir="ltr" lang="en" data-act="ph-pick" data-v="' + esc(o) + '"' + (done ? " disabled" : "") + ">" + esc(o) + "</button>";
        }).join("") + "</div>" + (done ? reveal : "");
    } else if (it.t === "fill") {
      var words = phWords(p.en), filled = false;
      var shown = words.map(function (w) {
        if (!filled && phClean(w) === phClean(p.k)) { filled = true; var tail = w.slice(w.replace(/[.,!?]+$/, "").length); return '<span class="ph-blank">' + (done ? esc(w.replace(/[.,!?]+$/, "")) : "____") + "</span>" + esc(tail); }
        return esc(w);
      }).join(" ");
      body = '<div class="card" style="text-align:center"><h3>✍️ كمّل الجملة</h3><p class="ph-en big" dir="ltr" lang="en">' + shown + '</p><p class="ph-ar">' + esc(p.ar) + "</p></div>" +
        '<div class="gopts">' + it.opts.map(function (o) {
          var cls = "gopt" + (done && o === p.k.toLowerCase() ? " ok" : "") + (done && o === it.pick && o !== p.k.toLowerCase() ? " bad" : "");
          return '<button class="' + cls + '" dir="ltr" lang="en" data-act="ph-pick" data-v="' + esc(o) + '"' + (done ? " disabled" : "") + ">" + esc(o) + "</button>";
        }).join("") + "</div>" + (done ? reveal : "");
    } else if (it.t === "build" || it.t === "recall") {
      var built = it.typed.map(function (i) { return esc(it.tiles[i].w); }).join(" ");
      body = '<div class="card" style="text-align:center"><h3>' + (it.t === "build" ? "🧩 رتّب الجملة" : "🧠 كوّنها من ذاكرتك") + "</h3>" +
        (it.t === "build" ? audio : "") + '<p class="ph-ar" style="margin-block-start:8px">' + esc(p.ar) + "</p>" +
        '<div class="ph-built ' + (it.res || "") + '" dir="ltr" lang="en">' + (built || '<span class="muted">اضغط على الكلمات بالترتيب…</span>') + "</div></div>" +
        (done ? reveal : '<div class="ph-tiles" dir="ltr">' + it.tiles.map(function (t, i) {
          return '<button class="stile ph-tile" data-act="ph-tile" data-i="' + i + '"' + (it.typed.indexOf(i) >= 0 ? " disabled" : "") + ">" + esc(t.w) + "</button>";
        }).join("") + '</div><div class="row" style="gap:10px;justify-content:center;margin-block-start:10px"><button class="btn sm alt" data-act="ph-undo">⌫ رجوع</button></div>');
    } else if (it.t === "say") {
      body = '<div class="card" style="text-align:center"><h3>🎤 قولها بالإنجليزي</h3><p class="ph-ar" style="font-size:19px;margin-block:8px">' + esc(p.ar) + '</p><small class="muted">💡 ' + esc(p.w) + "</small>" +
        (it.heard ? '<p class="iheard ' + (it.res === "ok" ? "ok" : "bad") + '" dir="ltr" lang="en">' + esc(it.heard) + "</p>" : "") + "</div>" +
        (done ? reveal : '<div class="row" style="gap:10px"><button class="btn gbig" data-act="ph-mic"' + (it.listening ? " disabled" : "") + ">" + (it.listening ? "بسمعك…" : "🎤 اتكلم") + '</button><button class="btn alt gbig" data-act="ph-forgot">مش فاكر</button></div>');
    }
    return top + body + (done ? '<button class="btn" style="width:100%;margin-block-start:10px" data-act="ph-next">' + (s.i + 1 >= s.q.length ? "النتيجة" : "كمّل ←") + "</button>" : "");
  }
  function phDoneHTML() {
    var s = phUi().ses, total = s.ok + s.bad, acc = total ? Math.round(s.ok / total * 100) : 0;
    var ids = []; s.q.forEach(function (x) { if (ids.indexOf(x.id) < 0) ids.push(x.id); });
    return '<div class="card gend"><div class="gend-stars"><span class="on">★</span><span class="' + (acc >= 70 ? "on" : "") + '">★</span><span class="' + (acc >= 90 ? "on" : "") + '">★</span></div>' +
      "<h2>" + (acc >= 90 ? "جلسة ممتازة! 🎉" : acc >= 70 ? "شغل حلو 👍" : "كمّل، التكرار هو السر 💪") + "</h2>" +
      '<div class="chero-stats" style="color:inherit"><div><b class="num">' + s.fresh + '</b><small>جملة جديدة</small></div><div><b class="num">' + acc + '%</b><small>دقة</small></div><div><b class="num">+' + s.xp + '</b><small>XP</small></div></div>' +
      '<div class="gmissed"><b>🗣️ قول الجمل دي بصوت عالي مرة كمان قبل ما تقفل:</b>' + ids.map(function (id) {
        var p = PH[id];
        return '<div class="row between" style="gap:8px"><span dir="ltr" lang="en" style="font-weight:600">' + esc(p.en) + "</span>" + spkBtn(p.en) + "</div>";
      }).join("") + "</div>" +
      '<p class="muted" style="font-size:13px;margin-block-start:10px">🎯 تحدي النهارده: استخدم جملة منهم في كلام حقيقي مع حد.</p>' +
      '<div class="row wrapr" style="justify-content:center;margin-block-start:12px"><button class="btn" data-act="ph-hub">تمام</button></div></div>';
  }

  /* events */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var u, it;
    switch (el.getAttribute("data-act")) {
      case "ph-open": u = phUi(); u.view = "hub"; state.lv = { mode: "phrases", c: "en" }; goTab("learn"); $("#p-learn").scrollTop = 0; render(); break;
      case "ph-hub": phUi().view = "hub"; $("#p-learn").scrollTop = 0; render(); break;
      case "ph-cat": u = phUi(); u.view = "cat"; u.cat = el.getAttribute("data-k"); $("#p-learn").scrollTop = 0; render(); break;
      case "ph-start": phStart(null); break;
      case "ph-start-cat": phStart(el.getAttribute("data-k")); break;
      case "ph-npd": phData().newPerDay = Number(el.getAttribute("data-v")) || 5; saveMeta("learn", 400); render(); break;
      case "ph-next": it = phCur(); if (it && it.t === "learn") { phData().days[nowR().key] = 1; } phNext(); break;
      case "ph-slow": it = phCur(); if (it) speak(PH[it.id].en, true); break;
      case "ph-pick": {
        it = phCur(); if (!it || it.res) break;
        var v = el.getAttribute("data-v"), p = PH[it.id]; it.pick = v;
        phGrade(it.t === "listen" ? v === p.ar : it.t === "use" ? v === p.en : v === p.k.toLowerCase()); break;
      }
      case "ph-tile": {
        it = phCur(); if (!it || it.res) break;
        var i = Number(el.getAttribute("data-i")); if (it.typed.indexOf(i) >= 0) break;
        it.typed.push(i);
        if (it.typed.length === it.tiles.length) {
          var got = it.typed.map(function (j) { return it.tiles[j].w; }).join(" ");
          phGrade(norm(got) === norm(PH[it.id].en));
        } else render();
        break;
      }
      case "ph-undo": it = phCur(); if (it && !it.res && it.typed.length) { it.typed.pop(); render(); } break;
      case "ph-forgot": phGrade(false); break;
      case "ph-mic": {
        it = phCur(); if (!it || it.res) break;
        it.listening = true; render();
        var cur = it;
        recognizeOnce(function (r) {
          cur.listening = false;
          if (r.err) { toast("مسمعتش حاجة، جرّب تاني وقرّب الموبايل."); render(); return; }
          cur.heard = r.heard;
          if (speechScore(r.heard, PH[cur.id].en) >= 0.75) phGrade(true);
          else { toast("قريب! جرّب تاني بهدوء، أو دوس «مش فاكر»."); render(); }
        });
        break;
      }
    }
  });
