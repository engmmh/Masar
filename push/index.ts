// Edge Function: masar-send-notification
// بيبعت إشعار يومي (كلمة أو جملة إنجليزي بالتبادل) لكل الأجهزة المشتركة في masar_push_subs.
// انشرها من لوحة تحكم Supabase: Edge Functions → New Function → الاسم: masar-send-notification → الصق الكود ده → Deploy.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const PUSH_SHARED_SECRET = Deno.env.get("PUSH_SHARED_SECRET")!;

webpush.setVapidDetails("mailto:masar-app@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// مصدر الكلمات: نفس كروت المفردات الموجودة فعليًا في كورس الإنجليزي بالموقع
const WORDS = [
  {
    "en": "know",
    "ar": "يعرف",
    "ex": "I know your brother."
  },
  {
    "en": "do",
    "ar": "يفعل",
    "ex": "I do my homework at night."
  },
  {
    "en": "have",
    "ar": "يمتلك / عندي",
    "ex": "We have a big house."
  },
  {
    "en": "have got",
    "ar": "حصل على / عنده",
    "ex": "I have got a new computer."
  },
  {
    "en": "be",
    "ar": "يكون",
    "ex": "I want to be an engineer."
  },
  {
    "en": "play",
    "ar": "يلعب",
    "ex": "They play football on Friday."
  },
  {
    "en": "football",
    "ar": "كرة القدم",
    "ex": "He doesn't play football."
  },
  {
    "en": "homework",
    "ar": "واجب منزلي",
    "ex": "She does her homework."
  },
  {
    "en": "car",
    "ar": "سيارة",
    "ex": "Ahmed has a new car."
  },
  {
    "en": "job",
    "ar": "وظيفة",
    "ex": "My father has a job."
  },
  {
    "en": "pen",
    "ar": "قلم",
    "ex": "This is my pen."
  },
  {
    "en": "phone",
    "ar": "هاتف",
    "ex": "That is your phone."
  },
  {
    "en": "cover",
    "ar": "غطاء / غلاف",
    "ex": "This is its cover."
  },
  {
    "en": "shirt",
    "ar": "قميص",
    "ex": "This is our shirt."
  },
  {
    "en": "boy",
    "ar": "ولد",
    "ex": "The boys play here."
  },
  {
    "en": "baby",
    "ar": "طفل رضيع",
    "ex": "The babies are at home."
  },
  {
    "en": "street",
    "ar": "شارع",
    "ex": "There is a car on the street."
  },
  {
    "en": "teacher",
    "ar": "معلم",
    "ex": "Are you a teacher?"
  },
  {
    "en": "Egyptian",
    "ar": "مصري",
    "ex": "He is Egyptian."
  },
  {
    "en": "Italian",
    "ar": "إيطالي",
    "ex": "Rome is an Italian city."
  },
  {
    "en": "here",
    "ar": "هنا",
    "ex": "Are they here?"
  },
  {
    "en": "there",
    "ar": "هناك",
    "ex": "The books are there."
  },
  {
    "en": "at",
    "ar": "في (مكان)",
    "ex": "I am at work."
  },
  {
    "en": "what",
    "ar": "ماذا",
    "ex": "What is this?"
  },
  {
    "en": "how",
    "ar": "كيف",
    "ex": "How are you?"
  },
  {
    "en": "where",
    "ar": "أين",
    "ex": "Where are you?"
  },
  {
    "en": "vowel",
    "ar": "حرف علة",
    "ex": "An apple starts with a vowel."
  },
  {
    "en": "mine",
    "ar": "ملكي (ضمير)",
    "ex": "This book is mine."
  },
  {
    "en": "yours",
    "ar": "ملكك (ضمير)",
    "ex": "That phone is yours."
  },
  {
    "en": "theirs",
    "ar": "ملكهم (ضمير)",
    "ex": "The books are theirs."
  },
  {
    "en": "will",
    "ar": "سوف (فعل مساعد للمستقبل)",
    "ex": "I will call you tomorrow."
  },
  {
    "en": "tomorrow",
    "ar": "غدًا",
    "ex": "I will see you tomorrow."
  },
  {
    "en": "tonight",
    "ar": "الليلة",
    "ex": "We are going to watch a movie tonight."
  },
  {
    "en": "next week",
    "ar": "الأسبوع القادم",
    "ex": "She is going to travel next week."
  },
  {
    "en": "soon",
    "ar": "قريبًا",
    "ex": "He will finish soon."
  },
  {
    "en": "plan",
    "ar": "خطة / يخطط",
    "ex": "We plan to visit Jeddah."
  },
  {
    "en": "its",
    "ar": "ملكه / ملكها (لغير العاقل)",
    "ex": "The dog wagged its tail."
  },
  {
    "en": "apple",
    "ar": "تفاحة",
    "ex": "I have an apple."
  },
  {
    "en": "dog",
    "ar": "كلب",
    "ex": "She has a dog."
  },
  {
    "en": "egg",
    "ar": "بيضة",
    "ex": "He eats an egg for breakfast."
  },
  {
    "en": "elephant",
    "ar": "فيل",
    "ex": "We see an elephant at the zoo."
  },
  {
    "en": "orange",
    "ar": "برتقالة",
    "ex": "Tom has an orange."
  },
  {
    "en": "bag",
    "ar": "حقيبة / شنطة",
    "ex": "Where is your bag?"
  },
  {
    "en": "milk",
    "ar": "لبن",
    "ex": "I like milk."
  },
  {
    "en": "tennis",
    "ar": "تنس",
    "ex": "Does Ali play tennis?"
  },
  {
    "en": "bus",
    "ar": "أتوبيس",
    "ex": "The bus stops here."
  },
  {
    "en": "lunch",
    "ar": "غداء",
    "ex": "They eat lunch at home."
  },
  {
    "en": "shop",
    "ar": "محل",
    "ex": "My brother works in a shop."
  },
  {
    "en": "rain",
    "ar": "مطر / تمطر",
    "ex": "It rains in winter."
  },
  {
    "en": "coffee",
    "ar": "قهوة",
    "ex": "Do you like coffee?"
  },
  {
    "en": "fish",
    "ar": "سمك",
    "ex": "We eat fish every day."
  },
  {
    "en": "tea",
    "ar": "شاي",
    "ex": "Do you like tea?"
  },
  {
    "en": "drink",
    "ar": "يشرب",
    "ex": "We drink water every day."
  },
  {
    "en": "eat",
    "ar": "يأكل",
    "ex": "They eat lunch at home."
  },
  {
    "en": "live",
    "ar": "يعيش / يسكن",
    "ex": "My brother lives in Cairo."
  },
  {
    "en": "speak",
    "ar": "يتكلم",
    "ex": "Do you speak English?"
  },
  {
    "en": "wash",
    "ar": "يغسل",
    "ex": "You wash your hands."
  },
  {
    "en": "glass",
    "ar": "كوب (زجاجي)",
    "ex": "I drink a glass of water."
  },
  {
    "en": "bottle",
    "ar": "زجاجة",
    "ex": "She has a bottle of water."
  },
  {
    "en": "need",
    "ar": "يحتاج",
    "ex": "I need a cup of tea."
  },
  {
    "en": "want",
    "ar": "يريد",
    "ex": "What do you want?"
  },
  {
    "en": "cup",
    "ar": "كوب / فنجان",
    "ex": "He needs a cup of tea."
  },
  {
    "en": "rice",
    "ar": "أرز",
    "ex": "We eat rice for lunch."
  },
  {
    "en": "sugar",
    "ar": "سكر",
    "ex": "Do you have sugar?"
  },
  {
    "en": "breakfast",
    "ar": "فطار",
    "ex": "I eat a good breakfast."
  },
  {
    "en": "water",
    "ar": "مياه",
    "ex": "I drink a bottle of water."
  },
  {
    "en": "when",
    "ar": "متى",
    "ex": "When do you need the money?"
  },
  {
    "en": "who",
    "ar": "من",
    "ex": "Who is your teacher?"
  }
];

// جمل إنجليزي يومية شائعة الاستخدام
const PHRASES = [
  {
    "en": "How are you doing?",
    "ar": "عامل إيه؟ / أخبارك إيه؟"
  },
  {
    "en": "What's up?",
    "ar": "إيه الأخبار؟"
  },
  {
    "en": "I'm on my way.",
    "ar": "أنا في الطريق."
  },
  {
    "en": "Could you repeat that, please?",
    "ar": "ممكن تعيد تاني؟"
  },
  {
    "en": "I have no idea.",
    "ar": "معنديش فكرة."
  },
  {
    "en": "It doesn't matter.",
    "ar": "مش مهم / معلش."
  },
  {
    "en": "Take your time.",
    "ar": "خد وقتك."
  },
  {
    "en": "Let me know.",
    "ar": "قولّي / خليني أعرف."
  },
  {
    "en": "I'm looking forward to it.",
    "ar": "متحمس له / في انتظاره."
  },
  {
    "en": "Sounds good.",
    "ar": "تمام / حلو كده."
  },
  {
    "en": "I'll be right back.",
    "ar": "هرجع حالًا."
  },
  {
    "en": "Can you help me with this?",
    "ar": "ممكن تساعدني في ده؟"
  },
  {
    "en": "I'm not sure.",
    "ar": "مش متأكد."
  },
  {
    "en": "What time is it?",
    "ar": "الساعة كام؟"
  },
  {
    "en": "See you later.",
    "ar": "أشوفك بعدين."
  },
  {
    "en": "Thanks for your help.",
    "ar": "شكرًا على مساعدتك."
  },
  {
    "en": "No problem at all.",
    "ar": "ولا يهمك / مفيش مشكلة."
  },
  {
    "en": "I need more time.",
    "ar": "محتاج وقت أكتر."
  },
  {
    "en": "Let's get started.",
    "ar": "يلا نبدأ."
  },
  {
    "en": "That makes sense.",
    "ar": "ده كلام مظبوط / منطقي."
  },
  {
    "en": "I'll think about it.",
    "ar": "هفكر فيها."
  },
  {
    "en": "Keep in touch.",
    "ar": "خلينا على تواصل."
  },
  {
    "en": "It's up to you.",
    "ar": "الأمر راجعلك."
  },
  {
    "en": "I appreciate it.",
    "ar": "أقدّر ده."
  },
  {
    "en": "Give me a second.",
    "ar": "ثانية واحدة."
  },
  {
    "en": "Where are you headed?",
    "ar": "رايح فين؟"
  },
  {
    "en": "I'm running late.",
    "ar": "أنا متأخر شوية."
  },
  {
    "en": "That's a good question.",
    "ar": "سؤال كويس."
  },
  {
    "en": "I'll get back to you.",
    "ar": "هرد عليك تاني."
  },
  {
    "en": "Have a nice day!",
    "ar": "يوم سعيد!"
  }
];

// ---------- تقرير أسبوعي (weekly digest) ----------
const TZ_HOURS = 3; // الرياض UTC+3

function riyadhDateKey(ms: number): string {
  const d = new Date(ms + TZ_HOURS * 3600000);
  const pad = (n: number) => (n < 10 ? "0" : "") + n;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  const pad = (v: number) => (v < 10 ? "0" : "") + v;
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
function computeStreak(study: Record<string, number> | undefined, todayKey: string): number {
  if (!study) return 0;
  let k = todayKey, n = 0;
  if (!study[k]) k = addDaysKey(k, -1);
  while (study[k] && n < 5000) { n++; k = addDaysKey(k, -1); }
  return n;
}
function countKnownCards(cards: Record<string, { box?: number }> | undefined): number {
  if (!cards) return 0;
  return Object.values(cards).filter((c) => (c?.box || 0) >= 3).length;
}

async function sendWeeklyDigest(supa: ReturnType<typeof createClient>) {
  const { data: subs, error } = await supa.from("masar_push_subs").select("id,endpoint,p256dh,auth,user_id");
  if (error) return { ok: false, error: error.message };

  const byUser = new Map<string, typeof subs>();
  for (const s of subs || []) {
    const list = byUser.get(s.user_id) || [];
    list.push(s);
    byUser.set(s.user_id, list);
  }

  const todayKey = riyadhDateKey(Date.now());
  let sent = 0, removed = 0, failed = 0, users = 0;

  for (const [userId, userSubs] of byUser) {
    const { data: metaRows } = await supa.from("masar_meta").select("name,data").eq("user_id", userId).in("name", ["learn", "weekly_snap"]);
    const learn = (metaRows || []).find((r) => r.name === "learn")?.data || {};
    const snap = (metaRows || []).find((r) => r.name === "weekly_snap")?.data || { xp: 0, known: 0 };

    const curXp = learn.xp || 0;
    const curKnown = countKnownCards(learn.cards);
    const xpGained = Math.max(0, curXp - (snap.xp || 0));
    const wordsLearned = Math.max(0, curKnown - (snap.known || 0));
    const streak = computeStreak(learn.study, todayKey);

    if (xpGained === 0 && wordsLearned === 0 && streak === 0) continue; // ملوش نشاط الأسبوع ده، متبعتش ملخص فاضي

    const title = "📊 ملخصك الأسبوعي";
    const body = `اتعلمت ${wordsLearned} كلمة جديدة وكسبت ${xpGained} نقطة الأسبوع ده${streak ? `، وسلسلة مذاكرتك الحالية ${streak} يوم` : ""}. استمر كده!`;
    const payload = JSON.stringify({ title, body, en: "", type: "weekly" });

    users++;
    for (const s of userSubs) {
      const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await supa.from("masar_push_subs").delete().eq("id", s.id);
          removed++;
        } else failed++;
      }
    }

    await supa.from("masar_meta").upsert(
      { user_id: userId, name: "weekly_snap", data: { xp: curXp, known: curKnown }, updated_at: new Date().toISOString() },
      { onConflict: "user_id,name" },
    );
  }

  return { ok: true, mode: "weekly", users, sent, removed, failed };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || req.headers.get("x-push-token");
  if (!PUSH_SHARED_SECRET || token !== PUSH_SHARED_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  if (url.searchParams.get("mode") === "weekly") {
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const result = await sendWeeklyDigest(supa);
    return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
  }

  // نستخدم رقم الساعة (منذ 1970) مش رقم اليوم، عشان كل إشعار في نفس اليوم يبقى مختلف عن اللي قبله
  const hourNum = Math.floor(Date.now() / 3600000);
  const useWord = hourNum % 2 === 0;
  const pool = useWord ? WORDS : PHRASES;
  const pick = pool[((hourNum % pool.length) + pool.length) % pool.length];

  const title = useWord ? "كلمة اليوم 📘" : "جملة اليوم 💬";
  const body = useWord
    ? `${pick.en} — ${pick.ar}${pick.ex ? "\n" + pick.ex : ""}`
    : `${pick.en}\n${pick.ar}`;
  // en: النص الإنجليزي الخام اللي هيتقال بالصوت لما تضغط على الإشعار (من غير عربي)
  const en = useWord ? `${pick.en}. ${pick.ex || ""}`.trim() : pick.en;
  const payload = JSON.stringify({ title, body, en, type: useWord ? "word" : "phrase" });

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: subs, error } = await supa.from("masar_push_subs").select("id,endpoint,p256dh,auth");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
  }

  let sent = 0, removed = 0, failed = 0;
  for (const s of subs || []) {
    const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (e) {
      const code = e && e.statusCode;
      if (code === 404 || code === 410) {
        await supa.from("masar_push_subs").delete().eq("id", s.id);
        removed++;
      } else {
        failed++;
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, type: useWord ? "word" : "phrase", pick, sent, removed, failed }), {
    headers: { "content-type": "application/json" },
  });
});
