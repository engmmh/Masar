"use strict";
  /* ---------------- قدّم نفسك — self-introduction & conversation coach ---------------- */
  // Three parts, all built from the person's own profile so the English they
  // practise is about them: (1) a generated self-introduction in three styles,
  // practised sentence by sentence with the mic; (2) role-play scenes where they
  // pick the best reply to a real person, then say it aloud; (3) a daily
  // one-minute speaking challenge. Everything feeds a "confidence" level.
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
  var CONF_LEVELS = ["مبتدئ", "بدأت أتكلم", "واثق", "متحدث محترف", "ملك الكلام"];

  function idata() {
    if (!state.learn.intro || typeof state.learn.intro !== "object") state.learn.intro = {};
    var d = state.learn.intro;
    if (!d.p) d.p = {}; if (!d.sc) d.sc = {}; if (!d.days) d.days = {};
    d.pts = d.pts || 0;
    return d;
  }
  function ui() { if (!state.intro) state.intro = { view: "hub", style: "casual" }; return state.intro; }
  function byK(list, k) { return list.filter(function (x) { return x.k === k; })[0] || null; }
  function confLevel() {
    var pts = idata().pts, lv = Math.min(CONF_LEVELS.length - 1, Math.floor(Math.sqrt(pts / 30)));
    var base = 30 * lv * lv, next = 30 * (lv + 1) * (lv + 1);
    return { lv: lv, name: CONF_LEVELS[lv], pct: lv >= CONF_LEVELS.length - 1 ? 100 : Math.round((pts - base) / (next - base) * 100) };
  }
  function addConf(n) { var d = idata(); d.pts += n; d.days[nowR().key] = 1; addXp(n); saveMeta("learn", 600); }
  function speakDays() {
    var d = idata().days, k = nowR().key, n = 0;
    if (!d[k]) k = addDays(k, -1);
    while (d[k] && n < 999) { n++; k = addDays(k, -1); }
    return n;
  }

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
  var SCENES = [
    { k: "meet", ico: "👋", t: "لقاء شخص جديد", d: "أول كلام مع حد لسه متعرف عليه", who: "Sarah", turns: [
      { q: "Hi! I don't think we've met. I'm Sarah.", qa: "أهلاً! مظنش إننا اتقابلنا قبل كده. أنا سارة.", o: [
        { t: "Hi Sarah, I'm {name}. Nice to meet you!", s: 2, f: "ممتاز! سلام ودود وفيه اسمك واسمها." },
        { t: "My name {name}.", s: 1, f: "قريب، بس ناقصة is: My name is {name}. وقول Nice to meet you." },
        { t: "Why are you talking to me?", s: 0, f: "ده رد جاف ومش لطيف. ابدأ دايمًا بابتسامة واسمك." }] },
      { q: "Nice to meet you too! Where are you from?", qa: "اتشرفت بيك برضه! إنت منين؟", o: [
        { t: "I'm from {city}, in {country}. How about you?", s: 2, f: "حلو جدًا، وسؤالك How about you? بيخلّي الكلام يكمّل." },
        { t: "From {city}.", s: 1, f: "صح، بس قصير. رجّع السؤال عشان الكلام يفضل ماشي." },
        { t: "I am from yes.", s: 0, f: "الجملة مش مفهومة. قول: I'm from + اسم البلد." }] },
      { q: "I'm from London. So, what do you do?", qa: "أنا من لندن. طب إنت بتشتغل إيه؟", o: [
        { t: "I'm {job}. I really enjoy it. What about you?", s: 2, f: "ممتاز! وظيفتك + إحساسك بيها + سؤال ليها." },
        { t: "I am work {job}.", s: 1, f: "غلطة شائعة: قول I'm {job} أو I work as {job}." },
        { t: "Nothing special.", s: 0, f: "بتقلل من نفسك. اتكلم عن شغلك بثقة حتى لو بسيط." }] },
      { q: "That sounds interesting! What do you like to do in your free time?", qa: "ده شكله ممتع! بتحب تعمل إيه في وقت فراغك؟", o: [
        { t: "I love {h1}. It helps me relax. Do you have any hobbies?", s: 2, f: "رائع: هواية + سبب + سؤال." },
        { t: "I like {h1}.", s: 1, f: "صح، زوّد سبب صغير: It helps me relax." },
        { t: "I don't have free time.", s: 0, f: "كده الكلام بيقف. اختار أي هواية واتكلم عنها." }] },
      { q: "It was really nice talking to you!", qa: "كان لطيف جدًا الكلام معاك!", o: [
        { t: "You too, Sarah! Let's keep in touch.", s: 2, f: "ختام مثالي ومحترم." },
        { t: "OK, bye.", s: 1, f: "مقبول بس جاف. قول You too! قبل الوداع." },
        { t: "Thank you, you too nice.", s: 0, f: "التركيب غلط. الصح: It was nice talking to you too." }] }
    ] },
    { k: "work", ico: "💼", t: "أول يوم في الشغل", d: "تعرّف على المدير والزمايل", who: "Manager", turns: [
      { q: "Welcome to the team! Can you tell us a little about yourself?", qa: "أهلاً بيك في الفريق! ممكن تقولنا شوية عن نفسك؟", o: [
        { t: "Thank you! I'm {name}, I'm {job}, and I'm really happy to join the team.", s: 2, f: "ممتاز: شكر + اسم + وظيفة + حماس." },
        { t: "I am {name}. Thank you.", s: 1, f: "قصير قوي. زوّد وظيفتك وإنك مبسوط إنك معاهم." },
        { t: "No, I'm shy.", s: 0, f: "حتى لو مكسوف، جملتين بسيطين كفاية. جرّب الرد الأول." }] },
      { q: "Great! Have you worked in a similar role before?", qa: "تمام! اشتغلت في دور شبه ده قبل كده؟", o: [
        { t: "{expLine}, and I'm excited to learn more here.", s: 2, f: "رد صادق وإيجابي." },
        { t: "Yes, before I work there.", s: 1, f: "الزمن غلط: قول I worked there before." },
        { t: "Why do you ask?", s: 0, f: "ده يبان دفاعي. السؤال عادي، جاوب ببساطة." }] },
      { q: "Hi, I'm Omar from the quality team. If you need anything, just ask me.", qa: "أهلاً، أنا عمر من فريق الجودة. لو احتجت أي حاجة اسألني.", o: [
        { t: "Thanks, Omar! I really appreciate it. I'm sure I'll have some questions.", s: 2, f: "لطيف جدًا وبيبني علاقة من أول يوم." },
        { t: "Thanks.", s: 1, f: "مقبول، بس اسمه + I appreciate it أحسن بكتير." },
        { t: "I don't need help.", s: 0, f: "بيبان غرور. دايمًا رحّب بالمساعدة." }] },
      { q: "Do you want to join us for lunch?", qa: "تحب تتغدى معانا؟", o: [
        { t: "I'd love to! Thanks for inviting me.", s: 2, f: "ممتاز. I'd love to عبارة مهمة جدًا." },
        { t: "Yes, I want.", s: 1, f: "ناقصة: Yes, I'd like that. أو I'd love to." },
        { t: "No.", s: 0, f: "رفض من غير سبب بيبان قاسي. لو مش هتقدر قول: Sorry, not today, maybe tomorrow?" }] },
      { q: "So, how was your first day?", qa: "ها، أول يوم كان عامل إزاي؟", o: [
        { t: "It was great! Everyone was very welcoming, and I learned a lot.", s: 2, f: "رد إيجابي ومفصّل." },
        { t: "It was good.", s: 1, f: "صح، زوّد سبب: I learned a lot." },
        { t: "It is bad day.", s: 0, f: "الزمن غلط (was) وسلبي. خليك إيجابي في الأول." }] }
    ] },
    { k: "interview", ico: "🎯", t: "مقابلة عمل", d: "Tell me about yourself وأسئلة تانية", who: "Interviewer", turns: [
      { q: "Good morning! Please, have a seat. How are you today?", qa: "صباح الخير! اتفضل اقعد. عامل إيه النهارده؟", o: [
        { t: "Good morning! I'm very well, thank you. Thanks for having me.", s: 2, f: "بداية محترفة وواثقة." },
        { t: "Fine.", s: 1, f: "قصير. زوّد thank you وشكرهم على الفرصة." },
        { t: "I'm tired, the traffic was terrible.", s: 0, f: "متبدأش بشكوى، أول انطباع مهم." }] },
      { q: "So, tell me about yourself.", qa: "قولّي عن نفسك.", o: [
        { t: "I'm {name}, {job} with {exp}. I'm {t1} and {t2}, and I enjoy {focus}.", s: 2, f: "إجابة مهنية: مين، خبرة، صفاتك، شغفك." },
        { t: "I'm {name}. I like football and movies.", s: 1, f: "في المقابلة ابدأ بالشغل والخبرة، الهوايات في الآخر." },
        { t: "It's all in my CV.", s: 0, f: "أسوأ رد! ده أهم سؤال، جهّز تقديمك من قسم «تقديمي»." }] },
      { q: "What is your greatest strength?", qa: "إيه أكبر نقطة قوة عندك؟", o: [
        { t: "I'm very {t1}. For example, I always finish my tasks on time and double-check my work.", s: 2, f: "صفة + مثال = إجابة قوية." },
        { t: "I am {t1}.", s: 1, f: "صح بس من غير مثال. دايمًا اديهم For example." },
        { t: "I don't have any weaknesses.", s: 0, f: "ده جواب لسؤال تاني! ركّز في السؤال." }] },
      { q: "Why do you want to work with us?", qa: "ليه عايز تشتغل معانا؟", o: [
        { t: "Because your company is growing, and I want to {goal} with a strong team.", s: 2, f: "بتربط هدفك بالشركة، ممتاز." },
        { t: "Because I need a job.", s: 1, f: "صادق بس مش مقنع. اتكلم عن الشركة وهدفك." },
        { t: "I don't know, my friend told me.", s: 0, f: "بيبيّن إنك مش مهتم. اعرف عن الشركة قبل المقابلة." }] },
      { q: "Do you have any questions for us?", qa: "عندك أي أسئلة لينا؟", o: [
        { t: "Yes, what does a typical day look like in this role?", s: 2, f: "سؤال ذكي بيبيّن اهتمامك بالشغل نفسه." },
        { t: "How many vacation days do I get?", s: 1, f: "سؤال مشروع، بس مش أنسب أول سؤال." },
        { t: "No.", s: 0, f: "دايمًا جهّز سؤال واحد على الأقل." }] }
    ] },
    { k: "network", ico: "🤝", t: "مؤتمر أو فعالية", d: "Networking وبناء علاقات", who: "David", turns: [
      { q: "Hi, is this seat taken?", qa: "أهلاً، الكرسي ده فاضي؟", o: [
        { t: "No, please go ahead! I'm {name}, by the way.", s: 2, f: "ممتاز، فتحت باب للتعارف." },
        { t: "No.", s: 1, f: "صح بس قفلت الكلام. زوّد اسمك." },
        { t: "Seat.", s: 0, f: "مش جملة. قول: No, please sit." }] },
      { q: "Thanks! I'm David. What brings you to this event?", qa: "شكرًا! أنا ديفيد. إيه اللي جابك الفعالية دي؟", o: [
        { t: "I'm here to meet people in my field and learn new ideas. What about you?", s: 2, f: "هدف واضح + سؤال راجع." },
        { t: "My company sent me.", s: 1, f: "صح، بس حاول تبيّن اهتمامك." },
        { t: "The food is free.", s: 0, f: "ممكن تبقى نكتة، بس مش أول انطباع مهني 😄" }] },
      { q: "I work in marketing. What field are you in?", qa: "أنا شغال في التسويق. إنت في أنهي مجال؟", o: [
        { t: "I'm {job}. I mostly work on {focus}.", s: 2, f: "وظيفة + تفاصيل = بيفهم شغلك بسرعة." },
        { t: "I am {job}.", s: 1, f: "صح، زوّد جملة عن اللي بتعمله." },
        { t: "Marketing is boring.", s: 0, f: "انتقاد شغل حد لسه عارفه. تجنّب ده تمامًا." }] },
      { q: "That's really interesting. How did you get into that?", qa: "ده ممتع جدًا. دخلت المجال ده إزاي؟", o: [
        { t: "I've always been curious about it, so I studied it and started working in this field.", s: 2, f: "قصة قصيرة وواضحة." },
        { t: "I study it.", s: 1, f: "الزمن: I studied it. وزوّد تفاصيل." },
        { t: "It's a long story, never mind.", s: 0, f: "كده بتقفل الكلام. احكي في جملتين." }] },
      { q: "It was great talking to you. Are you on LinkedIn?", qa: "اتبسطت إني اتكلمت معاك. عندك لينكدإن؟", o: [
        { t: "Yes! Let's connect. It was great meeting you, David.", s: 2, f: "ختام مهني مثالي." },
        { t: "Yes.", s: 1, f: "زوّد Let's connect." },
        { t: "No, I don't like people.", s: 0, f: "رد بيقفل أي فرصة. لو مش عندك قول: Not yet, but I can give you my email." }] }
    ] },
    { k: "call", ico: "💻", t: "اجتماع أونلاين", d: "مكالمة فيديو مع عميل", who: "Client", turns: [
      { q: "Hi, can you hear me okay?", qa: "أهلاً، سامعني كويس؟", o: [
        { t: "Yes, I can hear you clearly. Can you hear me?", s: 2, f: "واضح ومهني." },
        { t: "Yes, yes.", s: 1, f: "مقبول، الأحسن جملة كاملة." },
        { t: "What?", s: 0, f: "لو مش سامع قول: Sorry, you're breaking up." }] },
      { q: "Great. Before we start, could you introduce yourself briefly?", qa: "تمام. قبل ما نبدأ، ممكن تعرّفنا بنفسك باختصار؟", o: [
        { t: "Sure. I'm {name}, {job}, and I'll be your main contact for this project.", s: 2, f: "مختصر ومفيد." },
        { t: "I'm {name}.", s: 1, f: "قصير قوي. زوّد دورك في المشروع." },
        { t: "You know me already.", s: 0, f: "حتى لو يعرفك، التقديم احترام للباقيين." }] },
      { q: "Sorry, you broke up for a second. Could you repeat that?", qa: "آسف، الصوت قطع ثانية. ممكن تعيد؟", o: [
        { t: "Of course. I said I'll be your main contact for this project.", s: 2, f: "هادي ومحترم." },
        { t: "Repeat?", s: 1, f: "مش واضح. قول Of course وعيد الجملة." },
        { t: "I already said it.", s: 0, f: "بيبان عصبي. المشاكل التقنية عادية." }] },
      { q: "What's the next step?", qa: "إيه الخطوة الجاية؟", o: [
        { t: "I'll send you a summary by email today, and we can meet again next week.", s: 2, f: "خطوة واضحة بموعد، ده احتراف." },
        { t: "I will send email.", s: 1, f: "ناقصة: I'll send you an email today." },
        { t: "I don't know, you tell me.", s: 0, f: "العميل مستني منك خطة." }] },
      { q: "Perfect. Thanks for your time!", qa: "تمام جدًا. شكرًا على وقتك!", o: [
        { t: "Thank you too! Have a great day.", s: 2, f: "ختام لطيف." },
        { t: "Bye.", s: 1, f: "مقبول بس جاف." },
        { t: "Finally.", s: 0, f: "😬 ده معناه «أخيرًا خلصنا»!" }] }
    ] },
    { k: "travel", ico: "✈️", t: "دردشة في السفر", d: "Small talk مع حد غريب", who: "Traveler", turns: [
      { q: "Excuse me, is this your first time visiting Dubai?", qa: "لو سمحت، دي أول مرة تزور دبي؟", o: [
        { t: "Yes, it is! I'm really excited. Have you been here before?", s: 2, f: "حماس + سؤال = دردشة ناجحة." },
        { t: "Yes first time.", s: 1, f: "قول: Yes, it's my first time." },
        { t: "Why?", s: 0, f: "بيبان مريب. الناس بتسأل عشان تدردش بس." }] },
      { q: "Many times! I'm here for work. Are you traveling for work or fun?", qa: "مرات كتير! أنا هنا عشان الشغل. إنت مسافر شغل ولا فسحة؟", o: [
        { t: "A bit of both. I have a meeting, and then I'll explore the city.", s: 2, f: "طبيعي جدًا، A bit of both عبارة حلوة." },
        { t: "For work.", s: 1, f: "صح بس قصير." },
        { t: "It's not your business.", s: 0, f: "عدواني جدًا. لو مش حابب تحكي قول: Just a short trip." }] },
      { q: "Nice! Any plans for the weekend?", qa: "حلو! عندك خطط للويك إند؟", o: [
        { t: "I'm planning to visit the old market and try some local food.", s: 2, f: "I'm planning to… تركيب ممتاز للخطط." },
        { t: "Maybe go to mall.", s: 1, f: "قول: Maybe I'll go to the mall." },
        { t: "Plans are for weak people.", s: 0, f: "😅 غريبة شوية على حد لسه عارفه." }] },
      { q: "You should try the seafood near the beach. It's amazing.", qa: "لازم تجرب السي فود اللي جنب البحر. تحفة.", o: [
        { t: "Thanks for the tip! I'll definitely try it.", s: 2, f: "Thanks for the tip عبارة مهمة." },
        { t: "OK.", s: 1, f: "اشكره على النصيحة." },
        { t: "I hate fish.", s: 0, f: "ممكن تقولها بلطف: Thanks! I'm not a big fan of fish, though." }] },
      { q: "Well, enjoy your trip!", qa: "طيب، استمتع برحلتك!", o: [
        { t: "Thank you! Enjoy your stay too. It was nice chatting with you.", s: 2, f: "ختام لطيف ودافي." },
        { t: "Thanks.", s: 1, f: "مقبول." },
        { t: "Yes.", s: 0, f: "مش رد مناسب. قول Thank you, you too!" }] }
    ] }
  ];
  var PHRASES = [
    { t: "تفتح بيها كلام", l: [["Hi, I don't think we've met. I'm…", "أهلاً، مظنش إننا اتقابلنا. أنا…"], ["How's your day going?", "يومك ماشي إزاي؟"], ["Is this your first time here?", "دي أول مرة تيجي هنا؟"]] },
    { t: "تكمّل بيها الكلام", l: [["What about you?", "وإنت؟"], ["That sounds interesting! Tell me more.", "ده شكله ممتع! احكيلي أكتر."], ["How did you get into that?", "دخلت المجال ده إزاي؟"], ["Really? I didn't know that.", "بجد؟ مكنتش أعرف."]] },
    { t: "لما تتلخبط", l: [["Sorry, could you say that again?", "آسف، ممكن تقولها تاني؟"], ["Let me think for a second.", "استنى أفكر ثانية."], ["What I mean is…", "اللي أقصده…"], ["How do you say … in English?", "إزاي أقول … بالإنجليزي؟"]] },
    { t: "تقفل بيها بلطف", l: [["It was great talking to you.", "اتبسطت إني اتكلمت معاك."], ["Let's keep in touch.", "خلينا على تواصل."], ["I'll let you get back to work.", "هسيبك ترجع لشغلك."], ["Hope to see you again soon.", "أتمنى أشوفك تاني قريب."]] }
  ];
  var DAILY = [
    ["Introduce yourself in three sentences.", "قدّم نفسك في 3 جمل."], ["Describe your job to a child.", "اشرح شغلك لطفل صغير."],
    ["Talk about your favorite hobby and why you like it.", "اتكلم عن هوايتك المفضلة وليه بتحبها."], ["Describe your hometown.", "اوصف مدينتك."],
    ["What did you do last weekend?", "عملت إيه الويك إند اللي فات؟"], ["Talk about a goal you have this year.", "اتكلم عن هدف عندك السنة دي."],
    ["Describe your perfect day.", "اوصف يومك المثالي."], ["Talk about a person who inspires you.", "اتكلم عن شخص بيلهمك."],
    ["Describe your daily routine.", "اوصف روتينك اليومي."], ["Talk about a trip you remember.", "احكي عن رحلة فاكرها."],
    ["What skills are you learning now?", "بتتعلم مهارات إيه دلوقتي؟"], ["Describe your best friend.", "اوصف أعز صاحب ليك."],
    ["What do you like about your job or studies?", "بتحب إيه في شغلك أو دراستك؟"], ["Talk about your favorite food.", "اتكلم عن أكلتك المفضلة."],
    ["What would you do with a free day?", "هتعمل إيه لو عندك يوم فاضي؟"], ["Talk about a movie you like.", "اتكلم عن فيلم بتحبه."],
    ["What are you proud of?", "إيه الحاجة اللي فخور بيها؟"], ["Give advice to someone learning English.", "انصح حد بيتعلم إنجليزي."],
    ["Describe your workplace or school.", "اوصف مكان شغلك أو دراستك."], ["Talk about a problem you solved.", "احكي عن مشكلة حليتها."]
  ];
  var LINKERS = ["and", "but", "because", "so", "also", "then", "for example", "however", "actually"];
  function todaysPrompt() { var p = nowR().key.split("-").map(Number), n = Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5); return DAILY[n % DAILY.length]; }

  /* views */
  function introHTML() {
    var u = ui();
    if (u.view === "build") return buildHTML();
    if (u.view === "mine") return mineHTML();
    if (u.view === "practice") return practiceHTML();
    if (u.view === "scene") return sceneHTML();
    if (u.view === "phrases") return phrasesHTML();
    if (u.view === "daily") return dailyHTML();
    return hubHTML();
  }
  function back(to, label) { return '<button class="linkbtn" data-act="intro-go" data-v="' + to + '">← ' + label + "</button>"; }
  function hubHTML() {
    var d = idata(), C = confLevel(), hasP = !!d.p.name, sd = speakDays(), dp = todaysPrompt(), doneToday = !!(d.daily && d.daily[nowR().key]);
    var unlocked = 0;
    var scenes = SCENES.map(function (s, i) {
      var r = d.sc[s.k], prev = i === 0 || ((d.sc[SCENES[i - 1].k] || {}).stars || 0) >= 2, locked = !prev;
      if (!locked) unlocked++;
      return '<button class="gtile' + (locked ? " locked" : "") + '" data-act="' + (locked ? "intro-locked" : "scene-start") + '" data-k="' + s.k + '"><span class="gtile-ic">' + (locked ? "🔒" : s.ico) + "</span><b>" + esc(s.t) + "</b><small>" + esc(s.d) + "</small>" +
        '<span class="gtile-best">' + (r ? "★".repeat(r.stars) + "☆".repeat(3 - r.stars) : (locked ? "نجمتين في اللي قبله" : "جديد")) + "</span></button>";
    }).join("");
    return '<button class="linkbtn" data-act="course-open" data-c="en">← الإنجليزي</button>' +
      '<div class="chero" style="--c1:#7B61F0;--c2:#3D2BA8"><div class="row" style="gap:12px;align-items:center"><span class="feat-ic" style="font-size:28px">🎤</span><div><h2>قدّم نفسك واتكلم بثقة</h2><p>كل يوم خطوة، لحد ما الكلام مع أي حد يبقى سهل.</p></div></div>' +
      '<div class="chero-stats"><div><b>' + esc(C.name) + '</b><small>مستوى ثقتك</small></div><div><b class="num">🔥 ' + sd + '</b><small>يوم كلام متواصل</small></div><div><b class="num">' + unlocked + "/" + SCENES.length + '</b><small>مواقف مفتوحة</small></div></div>' +
      '<span class="bar"><i style="width:' + C.pct + '%"></i></span></div>' +
      '<div class="card"><div class="row between"><h3 style="margin:0">✍️ تقديمي الشخصي</h3>' + (hasP ? '<span class="chip">جاهز</span>' : "") + "</div>" +
      '<p class="muted" style="font-size:14px;margin-block:6px 12px">' + (hasP ? "تقديمك بـ3 أشكال: ودّي، مهني، ومقابلة عمل. اسمعه واتدرب عليه بصوتك." : "جاوب على أسئلة بسيطة، وأنا أكتبلك تقديم احترافي بالإنجليزي عن نفسك.") + "</p>" +
      '<div class="row wrapr">' + (hasP ? '<button class="btn" data-act="intro-go" data-v="mine">اعرض تقديمي</button><button class="btn alt" data-act="intro-go" data-v="build">عدّل بياناتي</button>' : '<button class="btn" data-act="intro-go" data-v="build">ابني تقديمي</button>') + "</div></div>" +
      '<div class="card"><div class="row between"><h3 style="margin:0">☀️ تحدي الكلام اليومي</h3>' + (doneToday ? '<span class="chip">✓ النهارده</span>' : "") + "</div>" +
      '<p dir="ltr" lang="en" style="font-weight:700;margin-block:8px 2px">' + esc(dp[0]) + '</p><p class="muted" style="font-size:14px;margin-block-end:12px">' + esc(dp[1]) + " · دقيقة واحدة</p>" +
      '<button class="btn" data-act="intro-go" data-v="daily">' + (doneToday ? "اتكلم تاني" : "ابدأ التحدي") + "</button></div>" +
      '<div class="sec-h">🎭 مواقف حقيقية</div><p class="muted" style="font-size:14px;margin-block:-4px 12px">اختار أحسن رد، وبعدين قوله بصوتك. الردود مكتوبة ببياناتك' + (hasP ? "" : " (ابني تقديمك الأول عشان تبقى عنك)") + ".</p>" +
      '<div class="gtiles">' + scenes + "</div>" +
      '<button class="card" data-act="intro-go" data-v="phrases" style="width:100%;text-align:start;margin-block-start:12px;font:inherit;color:inherit;cursor:pointer"><h3 style="margin:0">💬 عبارات ذهبية</h3><p class="muted" style="font-size:14px;margin-block-start:4px">جمل جاهزة تفتح بيها كلام، تكمّله، أو تقفله بلطف.</p></button>';
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
      '<div class="card"><h2>✍️ ابني تقديمك</h2><p class="muted" style="font-size:14px">اكتب الأسماء بالإنجليزي، والباقي اختاره بالعربي وأنا أترجمه.</p>' +
      '<label class="field">اسمك' + inp("iName", "name", "Ahmed") + "</label>" +
      '<div class="row" style="gap:10px"><label class="field grow">مدينتك' + inp("iCity", "city", "Cairo") + '</label><label class="field grow">بلدك' + inp("iCountry", "country", "Egypt") + "</label></div>" +
      '<div class="field">شغلك</div>' + chipsHTML("job", IJOBS, false) +
      '<label class="field">أو اكتب وظيفتك (لو مش في القايمة)' + inp("iJob", "jobText", "a pharmacist") + "</label>" +
      '<label class="field">سنين الخبرة' + inp("iYears", "years", "0", "number") + "</label>" +
      '<div class="field">هواياتك (اختار 2)</div>' + chipsHTML("hobbies", IHOBBIES, true, 2) +
      '<div class="field">صفاتك (اختار 2)</div>' + chipsHTML("traits", ITRAITS, true, 2) +
      '<div class="field">هدفك دلوقتي</div>' + chipsHTML("goal", IGOALS, false) +
      '<button class="btn" style="width:100%;margin-block-start:16px" data-act="intro-save">✨ اعمل تقديمي</button></div>';
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
      '<div class="row wrapr" style="margin-block-start:14px"><button class="btn" data-act="intro-practice" data-v="read">🎤 اتدرّب جملة جملة</button>' +
      '<button class="btn alt" data-act="intro-practice" data-v="memory">🧠 من الذاكرة</button></div></div>' +
      '<div class="card"><h3>💡 نصايح وإنت بتقدّم نفسك</h3><ul class="itips"><li>ابتسم وبص في عين اللي قدامك.</li><li>اتكلم ببطء، السرعة مش شطارة.</li><li>خلّص بسؤال: <span dir="ltr" lang="en">What about you?</span> عشان الكلام يكمّل.</li><li>مش لازم تحفظه حرفيًا، الفكرة أهم من الكلمات.</li></ul></div>';
  }

  /* sentence-by-sentence practice */
  function practiceHTML() {
    var u = ui(), pr = u.pr, lines = introLines(u.style), l = lines[pr.i];
    if (pr.i >= lines.length) {
      return back("mine", "تقديمي") + '<div class="card gend"><div class="gend-stars"><span class="on">★</span><span class="' + (pr.good >= lines.length * 0.6 ? "on" : "") + '">★</span><span class="' + (pr.good === lines.length ? "on" : "") + '">★</span></div>' +
        "<h2>" + (pr.good === lines.length ? "تقديم ممتاز! 👏" : "شغل حلو، كمّل تدريب 💪") + '</h2><p class="muted">قلت ' + pr.good + " من " + lines.length + " جمل صح · +" + pr.xp + " نقطة ثقة</p>" +
        '<div class="row wrapr" style="justify-content:center;margin-block-start:14px"><button class="btn" data-act="intro-practice" data-v="' + pr.mode + '">مرة كمان</button>' +
        (pr.mode === "read" ? '<button class="btn alt" data-act="intro-practice" data-v="memory">جرّب من الذاكرة</button>' : '<button class="btn alt" data-act="intro-go" data-v="hub">مواقف حقيقية</button>') + "</div></div>";
    }
    var hide = pr.mode === "memory" && !pr.reveal && pr.res == null;
    var mic = speechOK();
    return back("mine", "تقديمي") +
      '<div class="gtop"><b>' + (pr.mode === "memory" ? "🧠 من الذاكرة" : "🎤 اتدرّب") + '</b><span class="num">' + (pr.i + 1) + "/" + lines.length + "</span></div>" +
      '<div class="card" style="text-align:center">' +
      '<p class="muted" style="font-size:15px;margin-block-end:8px">' + esc(l.ar) + "</p>" +
      (hide ? '<p class="muted" style="margin-block:14px">قولها بالإنجليزي من دماغك 👇</p><button class="btn sm alt" data-act="prac-reveal">💡 وريني الجملة</button>'
        : '<p dir="ltr" lang="en" style="font-size:20px;font-weight:700;margin-block:6px 10px">' + esc(l.en) + "</p>" + spkBtn(l.en)) +
      (pr.heard ? '<p class="iheard ' + (pr.res >= 0.8 ? "ok" : "bad") + '" dir="ltr" lang="en">' + esc(pr.heard) + "</p>" : "") +
      (pr.res != null ? '<p style="font-weight:700;margin-block-start:8px;color:' + (pr.res >= 0.8 ? "var(--done-deep)" : "var(--miss-deep)") + '">' + (pr.res >= 0.8 ? "✓ ممتاز!" : "قريب، جرّب تاني بهدوء (" + Math.round(pr.res * 100) + "%)") + "</p>" : "") +
      "</div>" +
      '<div class="row" style="gap:10px">' +
      (mic ? '<button class="btn gbig" data-act="prac-mic"' + (pr.listening ? " disabled" : "") + ">" + (pr.listening ? "بسمعك…" : "🎤 قول الجملة") + "</button>"
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
  function sceneStart(k) {
    var s = byK(SCENES, k); if (!s) return;
    var V = vars();
    ui().sc = { k: k, i: 0, pts: 0, picks: [], spoke: 0, opts: null, pick: null, V: V };
    shuffleSceneOpts(); ui().view = "scene"; render();
    setTimeout(function () { speak(s.turns[0].q); }, 250);
  }
  function shuffleSceneOpts() { var sc = ui().sc, s = byK(SCENES, sc.k); sc.opts = shuffle(s.turns[sc.i].o.map(function (o, j) { return j; })); sc.pick = null; sc.heard = ""; sc.said = null; }
  function sceneHTML() {
    var sc = ui().sc, s = byK(SCENES, sc.k), V = sc.V;
    if (sc.done) {
      var max = s.turns.length * 2;
      return back("hub", "قدّم نفسك") + '<div class="card gend"><div class="gend-stars">' + [1, 2, 3].map(function (n) { return '<span class="' + (n <= sc.stars ? "on" : "") + '">★</span>'; }).join("") + "</div>" +
        "<h2>" + (sc.stars === 3 ? "محادثة ممتازة! 🎉" : sc.stars === 2 ? "كويس جدًا 👍" : "كمّل تدريب 💪") + "</h2>" +
        '<p class="muted">' + esc(s.t) + " · " + sc.pts + "/" + max + " · قلت " + sc.spoke + " ردود بصوتك · +" + sc.xp + " نقطة ثقة</p>" +
        (sc.stars >= 2 && SCENES.indexOf(s) < SCENES.length - 1 && !((idata().sc[SCENES[SCENES.indexOf(s) + 1].k]) || {}).stars ? '<p class="glvlup">🔓 فتحت موقف «' + esc(SCENES[SCENES.indexOf(s) + 1].t) + "»</p>" : "") +
        '<div class="gmissed"><b>المحادثة المثالية:</b>' + s.turns.map(function (t) {
          var best = t.o.filter(function (o) { return o.s === 2; })[0];
          return '<div dir="ltr" lang="en" class="ichat-sum"><span>' + esc(s.who) + ": " + esc(t.q) + "</span><b>You: " + esc(fill(best.t, V)) + "</b></div>";
        }).join("") + "</div>" +
        '<div class="row wrapr" style="justify-content:center;margin-block-start:14px"><button class="btn" data-act="scene-start" data-k="' + s.k + '">العب تاني</button><button class="btn alt" data-act="intro-go" data-v="hub">مواقف تانية</button></div></div>';
    }
    var t = s.turns[sc.i], answered = sc.pick != null, chosen = answered ? t.o[sc.pick] : null;
    var bestTxt = fill(t.o.filter(function (o) { return o.s === 2; })[0].t, V);
    var hist = sc.picks.map(function (pk, j) {
      var tt = s.turns[j];
      return '<div class="ibub them" dir="ltr" lang="en">' + esc(tt.q) + '</div><div class="ibub me" dir="ltr" lang="en">' + esc(fill(tt.o[pk].t, V)) + "</div>";
    }).join("");
    return '<div class="gtop"><button class="linkbtn" data-act="intro-go" data-v="hub">✕</button><b>' + s.ico + " " + esc(s.t) + '</b><span class="num">' + (sc.i + 1) + "/" + s.turns.length + "</span></div>" +
      '<div class="ichat">' + hist +
      '<div class="ibub them" dir="ltr" lang="en"><small>' + esc(s.who) + "</small>" + esc(t.q) + ' <button class="ispk" data-act="speak" data-txt="' + esc(t.q) + '" aria-label="اسمع">' + ico("vol") + "</button></div>" +
      '<p class="muted ibub-ar">' + esc(t.qa) + "</p></div>" +
      (!answered ? '<p class="muted" style="font-size:13px;margin-block:4px 8px">اختار أحسن رد:</p><div class="iopts">' + sc.opts.map(function (j) {
        return '<button class="gopt iopt" dir="ltr" lang="en" data-act="scene-pick" data-v="' + j + '">' + esc(fill(t.o[j].t, V)) + "</button>";
      }).join("") + "</div>"
        : '<div class="ifb s' + chosen.s + '"><b>' + (chosen.s === 2 ? "✓ أحسن رد!" : chosen.s === 1 ? "🙂 مقبول" : "✗ مش مناسب") + "</b><p>" + esc(fill(chosen.f, V)) + "</p>" +
          (chosen.s < 2 ? '<p style="margin-block-start:6px">الأحسن: <b dir="ltr" lang="en">' + esc(bestTxt) + "</b></p>" : "") + "</div>" +
          '<div class="card" style="text-align:center;margin-block-start:10px"><p class="muted" style="font-size:13px">قول الرد ده بصوتك (+1 بونص):</p><p dir="ltr" lang="en" style="font-weight:700;margin-block:6px">' + esc(bestTxt) + "</p>" +
          (sc.heard ? '<p class="iheard ' + (sc.said ? "ok" : "bad") + '" dir="ltr" lang="en">' + esc(sc.heard) + "</p>" : "") +
          '<div class="row" style="gap:10px;justify-content:center;margin-block-start:8px">' + spkBtn(bestTxt) +
          (speechOK() ? '<button class="btn sm" data-act="scene-mic"' + (sc.listening || sc.said ? " disabled" : "") + ">" + (sc.said ? "✓ برافو" : sc.listening ? "بسمعك…" : "🎤 قولها") + "</button>"
            : '<button class="btn sm" data-act="scene-self"' + (sc.said ? " disabled" : "") + ">" + (sc.said ? "✓ برافو" : "✓ قلتها بصوت عالي") + "</button>") + "</div></div>" +
          '<button class="btn" style="width:100%;margin-block-start:10px" data-act="scene-next">' + (sc.i + 1 >= s.turns.length ? "النتيجة" : "كمّل المحادثة ←") + "</button>");
  }
  function scenePick(j) {
    var sc = ui().sc, s = byK(SCENES, sc.k), o = s.turns[sc.i].o[j];
    sc.pick = j; sc.pts += o.s;
    if (navigator.vibrate) navigator.vibrate(o.s === 2 ? 12 : [30, 40, 30]);
    render();
  }
  function sceneNext() {
    var sc = ui().sc, s = byK(SCENES, sc.k);
    sc.picks.push(sc.pick); sc.i++;
    if (sc.i >= s.turns.length) {
      var max = s.turns.length * 2, ratio = sc.pts / max;
      sc.stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1; sc.done = true;
      sc.xp = sc.pts + sc.spoke * 2;
      var rec = idata().sc[s.k] || { stars: 0, plays: 0 };
      rec.stars = Math.max(rec.stars, sc.stars); rec.plays++; idata().sc[s.k] = rec;
      addConf(sc.xp); render(); return;
    }
    shuffleSceneOpts(); render();
    var q = s.turns[sc.i].q;
    setTimeout(function () { speak(q); }, 200);
  }
  function sceneMic() {
    var sc = ui().sc, s = byK(SCENES, sc.k), best = fill(s.turns[sc.i].o.filter(function (o) { return o.s === 2; })[0].t, sc.V);
    sc.listening = true; render();
    recognizeOnce(function (r) {
      sc.listening = false;
      if (r.err) { toast("مسمعتش حاجة، جرّب تاني."); render(); return; }
      sc.heard = r.heard; sc.said = speechScore(r.heard, best) >= 0.7;
      if (sc.said) sc.spoke++; else toast("قريب! جرّب تاني بهدوء.");
      render();
    });
  }

  function phrasesHTML() {
    return back("hub", "رجوع") + '<div class="sec-h">💬 عبارات ذهبية</div>' + PHRASES.map(function (g) {
      return '<div class="card"><h3>' + esc(g.t) + "</h3>" + g.l.map(function (p) {
        return '<div class="iline"><div class="grow"><p dir="ltr" lang="en">' + esc(p[0]) + '</p><small class="muted">' + esc(p[1]) + "</small></div>" + spkBtn(p[0].replace(/…/g, "")) + "</div>";
      }).join("") + "</div>";
    }).join("");
  }

  /* daily one-minute speaking challenge */
  var dailyRec = null, dailyTimer = null;
  function dailyHTML() {
    var u = ui(), dc = u.dc || (u.dc = { state: "idle", left: 60, text: "" }), p = todaysPrompt(), mic = speechOK();
    var body;
    if (dc.state === "done") {
      var words = dc.text.trim() ? dc.text.trim().split(/\s+/).length : 0, used = LINKERS.filter(function (w) { return new RegExp("\\b" + w + "\\b", "i").test(dc.text); });
      var wpm = dc.secs ? Math.round(words / dc.secs * 60) : 0;
      var tips = [];
      if (mic && words < 25) tips.push("حاول تتكلم أكتر، هدفك 40 كلمة في الدقيقة على الأقل.");
      if (mic && used.length < 2) tips.push("استخدم كلمات ربط زي because وso وfor example عشان كلامك يبقى مترابط.");
      if (wpm > 150) tips.push("إنت سريع، هدّي شوية عشان اللي قدامك يفهم.");
      if (!tips.length) tips.push(mic ? "أداء ممتاز! بكرة جرّب تزوّد تفاصيل وأمثلة." : "برافو! كل يوم دقيقة كلام بتفرق جدًا.");
      body = '<div class="card gend"><h2>✓ خلّصت تحدي النهارده</h2>' +
        (mic ? '<div class="chero-stats" style="color:inherit"><div><b class="num">' + words + '</b><small>كلمة</small></div><div><b class="num">' + wpm + '</b><small>كلمة/دقيقة</small></div><div><b class="num">' + used.length + '</b><small>كلمات ربط</small></div></div>' +
          (dc.text ? '<p class="iheard ok" dir="ltr" lang="en" style="text-align:start">' + esc(dc.text) + "</p>" : "") : "") +
        '<ul class="itips" style="text-align:start">' + tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
        '<div class="row wrapr" style="justify-content:center;margin-block-start:12px"><button class="btn" data-act="talk-start">اتكلم تاني</button><button class="btn alt" data-act="intro-go" data-v="hub">رجوع</button></div></div>';
    } else {
      body = '<div class="card" style="text-align:center"><p dir="ltr" lang="en" style="font-size:20px;font-weight:700">' + esc(p[0]) + '</p><p class="muted">' + esc(p[1]) + "</p>" +
        '<div class="idial' + (dc.state === "rec" ? " on" : "") + '"><b class="num" id="dLeft">' + dc.left + "</b><small>ثانية</small></div>" +
        (dc.state === "rec" ? '<p class="iheard" dir="ltr" lang="en" id="dText">' + esc(dc.text || "…") + "</p>" : '<p class="muted" style="font-size:13px">فكّر 10 ثواني في 3 أفكار، وبعدين ابدأ. مش مهم الغلط، المهم تفضل تتكلم.</p>') +
        (dc.state === "rec" ? '<button class="btn alt" data-act="talk-stop">خلّصت</button>' : '<button class="btn gbig" data-act="talk-start">' + (mic ? "🎤 ابدأ الكلام" : "⏱ ابدأ الدقيقة") + "</button>") + "</div>" +
        '<div class="card"><h3>💡 أفكار تساعدك</h3><ul class="itips"><li dir="ltr" lang="en">First, … Then, … Finally, …</li><li dir="ltr" lang="en">I think… because…</li><li dir="ltr" lang="en">For example, …</li></ul></div>';
    }
    return back("hub", "رجوع") + '<div class="sec-h">☀️ تحدي الكلام اليومي</div>' + body;
  }
  function dailyStart() {
    var dc = ui().dc = { state: "rec", left: 60, text: "", t0: Date.now() };
    render();
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        dailyRec = new SR(); dailyRec.lang = "en-US"; dailyRec.continuous = true; dailyRec.interimResults = true;
        var finalTxt = "";
        dailyRec.onresult = function (e) {
          var interim = "";
          for (var i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalTxt += e.results[i][0].transcript + " "; else interim += e.results[i][0].transcript;
          }
          dc.text = (finalTxt + interim).trim();
          var el = document.getElementById("dText"); if (el) el.textContent = dc.text;
        };
        // Some browsers end a continuous session on silence; restart until time is up.
        dailyRec.onend = function () { if (dc.state === "rec" && dailyRec) { try { dailyRec.start(); } catch (e) { } } };
        dailyRec.start();
      } catch (e) { dailyRec = null; }
    }
    clearInterval(dailyTimer);
    dailyTimer = setInterval(function () {
      dc.left--;
      var el = document.getElementById("dLeft"); if (el) el.textContent = dc.left;
      if (dc.left <= 0 || ui().view !== "daily" || state.lv.mode !== "intro") dailyStop();
    }, 1000);
  }
  function dailyStop() {
    var dc = ui().dc; if (!dc || dc.state !== "rec") return;
    clearInterval(dailyTimer); dailyTimer = null;
    dc.state = "done"; dc.secs = Math.max(1, Math.round((Date.now() - dc.t0) / 1000));
    if (dailyRec) { var r = dailyRec; dailyRec = null; try { r.stop(); } catch (e) { } }
    var d = idata(); if (!d.daily) d.daily = {};
    var first = !d.daily[nowR().key]; d.daily[nowR().key] = 1;
    addConf(first ? 8 : 3);
    if (state.lv.mode === "intro") render();
  }

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
      case "intro-go": u = ui(); if (dailyRec || dailyTimer) dailyStop(); u.view = el.getAttribute("data-v"); if (u.view === "daily") u.dc = null; $("#p-learn").scrollTop = 0; render(); break;
      case "intro-locked": toast("🔒 خُد نجمتين في الموقف اللي قبله عشان يتفتح."); break;
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
      case "scene-start": sceneStart(el.getAttribute("data-k")); break;
      case "scene-pick": scenePick(Number(el.getAttribute("data-v"))); break;
      case "scene-next": sceneNext(); break;
      case "scene-mic": sceneMic(); break;
      case "scene-self": ui().sc.said = true; ui().sc.spoke++; render(); break;
      case "talk-start": dailyStart(); break;
      case "talk-stop": dailyStop(); break;
    }
  });
