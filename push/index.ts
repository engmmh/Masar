// Edge Function: masar-send-notification
// كل 15 دقيقة: جملة إنجليزي يومية أو ذكر (60% إنجليزي / 40% ذكر) — للحسابات اللي الأدمن فعّل لها
// الإشعارات في جدول masar_notify، وبيتخطّى ساعات الراحة بتوقيت كل جهاز.
// ومع ?mode=weekly بيبعت التقرير الأسبوعي زي الأول.
// انشرها من لوحة Supabase: Edge Functions → masar-send-notification → الصق الكود ده كله مكان القديم → Deploy.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const PUSH_SHARED_SECRET = Deno.env.get("PUSH_SHARED_SECRET")!;

webpush.setVapidDetails("mailto:masar-app@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// جمل يومية بسيطة — من بنك عبارات «مساري» في التطبيق [إنجليزي، معناها]
const EN: [string, string][] = [
  ["Hello, this is Mahmoud from quality.","ألو، معاك محمود من الجودة."],
  ["Do you have a minute?","عندك دقيقة؟"],
  ["How's it going?","عامل إيه؟"],
  ["In my opinion, ...","في رأيي، ..."],
  ["I'll get back to you on that.","هرجعلك في الموضوع ده."],
  ["Can I see the menu, please?","ممكن أشوف المنيو لو سمحت؟"],
  ["How much is this?","ده بكام؟"],
  ["Excuse me, how do I get to the station?","لو سمحت، أروح المحطة إزاي؟"],
  ["I have a reservation under the name Ahmed.","عندي حجز باسم أحمد."],
  ["Hello, this is Ahmed speaking.","ألو، معاك أحمد."],
  ["I don't feel well today.","مش حاسس إني كويس النهارده."],
  ["In my opinion, we should wait.","في رأيي، المفروض نستنى."],
  ["Could you do me a favor?","ممكن تعملّي خدمة؟"],
  ["I usually wake up at seven.","عادةً بصحى الساعة سبعة."],
  ["Is this a good time to talk?","ده وقت مناسب نتكلم؟"],
  ["Could you give me a hand?","ممكن تساعدني؟"],
  ["Not bad, thanks. You?","مش وحش، شكرًا. وانت؟"],
  ["I agree with you.","أنا متفق معاك."],
  ["Long time no see!","بقالي كتير مشفتكش!"],
  ["Could you send me the details by email?","ممكن تبعتلي التفاصيل على الإيميل؟"],
  ["I'd like a coffee with milk, please.","عايز قهوة بلبن لو سمحت."],
  ["Do you have this in a smaller size?","عندك ده بمقاس أصغر؟"],
  ["Is it far from here?","هو بعيد من هنا؟"],
  ["What time is check-out?","معاد تسليم الأوضة الساعة كام؟"],
  ["Could you speak a little slower, please?","ممكن تتكلم أبطأ شوية لو سمحت؟"],
  ["I have a headache.","عندي صداع."],
  ["I totally agree with you.","أنا متفق معاك تمامًا."],
  ["Would you mind closing the window?","تمانع تقفل الشباك؟"],
  ["I'm running late!","أنا متأخر!"],
  ["I'm calling about ...","بكلمك بخصوص ..."],
  ["Just a quick reminder, ...","مجرد تذكير سريع، ..."],
  ["What are you up to this weekend?","ناوي على إيه الويك إند ده؟"],
  ["I'm not sure I agree.","مش متأكد إني متفق."],
  ["What have you been up to?","كنت بتعمل إيه الفترة اللي فاتت؟"],
  ["I'm working on it right now.","أنا شغال عليها دلوقتي."],
  ["What do you recommend?","ترشّحلي إيه؟"],
  ["I'm just looking, thanks.","بتفرّج بس، شكرًا."],
  ["Can you take me to this address?","ممكن توصلني العنوان ده؟"],
  ["Is breakfast included?","الفطار ضمن الحجز؟"],
  ["Can I call you back later?","ممكن أكلمك تاني بعدين؟"],
  ["I've had a fever since yesterday.","عندي سخونية من امبارح."],
  ["I see your point, but I think it's risky.","فاهم وجهة نظرك، بس شايف إنها مخاطرة."],
  ["Sorry for the delay.","آسف على التأخير."],
  ["What's for dinner?","هناكل إيه على العشا؟"],
  ["Sorry, could you speak a bit slower?","آسف، ممكن تتكلم أبطأ شوية؟"],
  ["Please wear your hairnet.","لو سمحت البس غطا الشعر."],
  ["I'm exhausted today.","أنا مهدود النهارده."],
  ["I see what you mean, but ...","فاهم قصدك، بس ..."],
  ["Nice to meet you.","اتشرفت بمعرفتك."],
  ["Let me check and let you know.","خليني أتأكد وأقولك."],
  ["Could we have the bill, please?","ممكن الحساب لو سمحت؟"],
  ["Can I try it on?","ممكن أقيسه؟"],
  ["How long does it take to get there?","المشوار ده بياخد قد إيه؟"],
  ["Where is the boarding gate?","فين بوابة ركوب الطيارة؟"],
  ["I'd like to book an appointment.","عايز أحجز معاد."],
  ["How often should I take this medicine?","آخد الدوا ده كل قد إيه؟"],
  ["That makes sense.","ده منطقي."],
  ["My apologies, it was my mistake.","أعتذر، دي كانت غلطتي."],
  ["I'm exhausted, I need some rest.","أنا مهدود، محتاج أرتاح شوية."],
  ["The line is breaking up.","الخط بيقطع."],
  ["Don't forget to wash your hands.","متنساش تغسل إيدك."],
  ["It's boiling outside!","الجو نار برا!"],
  ["The problem is that ...","المشكلة إن ..."],
  ["I've heard a lot about you.","سمعت عنك كتير."],
  ["Can we schedule a meeting for tomorrow?","ممكن نحدد اجتماع بكرة؟"],
  ["Is this table free?","الترابيزة دي فاضية؟"],
  ["Is there any discount?","فيه أي خصم؟"],
  ["Turn left at the traffic lights.","لف شمال عند الإشارة."],
  ["My luggage didn't arrive.","شنطي موصلتش."],
  ["Does Thursday at 3 work for you?","يناسبك الخميس الساعة 3؟"],
  ["I need to take a sick day.","محتاج آخد يوم أجازة مرضي."],
  ["I'm not sure about that.","أنا مش متأكد من ده."],
  ["No worries, it happens.","ولا يهمك، بتحصل."],
  ["Let's go out this weekend.","يلا نخرج الويك إند ده."],
  ["Can I call you back in ten minutes?","ممكن أكلمك تاني كمان عشر دقايق؟"],
  ["Good job today!","شغل ممتاز النهارده!"],
  ["I'm running late.","أنا متأخر."],
  ["On the other hand, ...","من ناحية تانية، ..."],
  ["Take care, see you soon.","خلّي بالك من نفسك، أشوفك قريب."],
  ["I need a little more time to finish this.","محتاج وقت زيادة شوية عشان أخلّص ده."],
  ["Can I get this to go?","ممكن آخد ده تيك أواي؟"],
  ["I'll take it.","هاخده."],
  ["I'm stuck in traffic, I'll be a bit late.","أنا واقف في الزحمة، هتأخر شوية."],
  ["Could I have a window seat?","ممكن كرسي جنب الشباك؟"],
  ["Sorry, you're breaking up.","آسف، الصوت بيقطع."],
  ["Is there a pharmacy near here?","فيه صيدلية قريبة من هنا؟"],
  ["What do you think?","إنت رأيك إيه؟"],
  ["Can you give me a hand with this?","ممكن تساعدني في ده؟"],
  ["I'll do it later.","هعملها بعدين."],
  ["Could you spell that, please?","ممكن تتهجّاها لو سمحت؟"],
  ["Thanks for your help.","شكرًا على مساعدتك."],
  ["I'll be there in ten minutes.","هكون هناك كمان عشر دقايق."],
  ["Have a nice weekend!","ويك إند سعيد!"],
  ["That's a good point.","دي نقطة كويسة."],
  ["I'm allergic to nuts.","عندي حساسية من المكسرات."],
  ["Can I return it if it doesn't fit?","ينفع أرجّعه لو مجاش مقاسي؟"],
  ["Could you stop here, please?","ممكن تقف هنا لو سمحت؟"],
  ["The air conditioning isn't working.","التكييف مش شغال."],
  ["Can I leave a message?","ممكن أسيب رسالة؟"],
  ["It hurts here.","بيوجعني هنا."],
  ["Let's look at it from another angle.","خلينا نبص لها من زاوية تانية."],
  ["Thank you so much, that's very kind of you.","شكرًا جدًا، ده ذوق منك."],
  ["Could you turn down the TV?","ممكن توطّي التلفزيون؟"],
  ["Let me write that down.","خليني أكتب ده."],
  ["I see your point.","فاهم وجهة نظرك."],
  ["That's exactly what I meant.","ده بالظبط اللي قصدته."],
  ["Say hi to your family for me.","سلّملي على أهلك."],
  ["Could you walk me through it?","ممكن تشرحهالي خطوة خطوة؟"],
  ["This is delicious!","ده طعمه تحفة!"],
  ["Where can I find the milk?","ألاقي اللبن فين؟"],
  ["Which bus goes to downtown?","أنهي أتوبيس بيروح وسط البلد؟"],
  ["Can you recommend a good place to visit?","ترشّحلي مكان حلو أزوره؟"],
  ["I need to reschedule our meeting.","محتاج أغيّر معاد اجتماعنا."],
  ["I'm feeling much better now.","أنا أحسن بكتير دلوقتي."],
  ["To be honest, I prefer the first option.","بصراحة، أنا أفضّل الاختيار الأول."],
  ["You're welcome, anytime.","العفو، في أي وقت."],
  ["I'm going to bed, good night.","أنا داخل أنام، تصبح على خير."],
  ["Just to confirm, you said ...","بس عشان أتأكد، انت قلت ..."],
  ["Let's figure it out together.","خلينا نحلها سوا."],
  ["It's up to you.","زي ما تحب."],
  ["Let me put it another way.","خليني أقولها بطريقة تانية."],
  ["Sorry, I didn't catch your name.","آسف، ملحقتش أسمع اسمك."],
  ["I'm afraid I can't make it to the meeting.","للأسف مش هقدر أحضر الاجتماع."],
  ["Excuse me, this isn't what I ordered.","لو سمحت، ده مش اللي أنا طلبته."],
  ["Could I have a receipt, please?","ممكن الفاتورة لو سمحت؟"],
  ["It's within walking distance.","المكان قريب، ينفع تروحه مشي."],
  ["I'm here on business.","أنا هنا في شغل."],
  ["Get well soon!","ألف سلامة عليك!"],
  ["I didn't mean to interrupt.","مكنتش أقصد أقاطعك."],
  ["Don't forget to lock the door.","متنساش تقفل الباب."],
  ["I'll send you the details by email.","هبعتلك التفاصيل على الإيميل."],
  ["Sorry, that was my mistake.","آسف، دي كانت غلطتي."],
  ["I'm not sure yet.","لسه مش متأكد."],
  ["For example, ...","على سبيل المثال، ..."],
  ["It was great to see you.","كان جميل إني شفتك."],
  ["Thanks for your help, I really appreciate it.","شكرًا على مساعدتك، بجد مقدّر ده."],
  ["Can I pay by card?","ينفع أدفع بالكارت؟"],
  ["That's a bit too expensive for me.","ده غالي عليّا شوية."],
  ["I think I'm lost.","أعتقد إني تهت."],
  ["Could you call me a taxi, please?","ممكن تطلبلي تاكسي لو سمحت؟"],
  ["Thanks for calling, have a good day.","شكرًا على اتصالك، يومك سعيد."],
  ["Do I need a prescription for this?","محتاج روشتة للدوا ده؟"],
  ["Fair enough.","ماشي، عندك حق."],
  ["Is it okay if I leave early today?","ينفع أمشي بدري النهارده؟"],
  ["I'm on my way home.","أنا في الطريق للبيت."],
  ["Could I speak to the QA manager?","ممكن أكلم مدير ضمان الجودة؟"],
  ["The good thing is that ...","الحلو إن ..."],
  ["He's not available right now.","هو مش متاح دلوقتي."],
  ["Can you cover for me for an hour?","ممكن تغطي مكاني ساعة؟"],
  ["Sounds good to me.","تمام بالنسبالي."],
  ["I suggest we ...","أقترح إننا ..."],
  ["I'm swamped today.","أنا غرقان شغل النهارده."],
  ["I didn't get much sleep.","منمتش كويس."],
  ["Why don't we try ...?","ليه منجربش ...؟"],
  ["Thanks for calling.","شكرًا على اتصالك."],
  ["Let me know if you need anything.","قولي لو احتجت أي حاجة."],
  ["Let's grab a coffee.","يلا نشرب قهوة."],
  ["It depends on ...","ده بيعتمد على ..."],
  ["Sorry, I missed your call.","آسف، فاتتني مكالمتك."],
  ["Who's on the night shift?","مين وردية الليل؟"],
  ["I've been really busy lately.","كنت مشغول جدًا الفترة اللي فاتت."],
  ["As far as I know, ...","على حد علمي، ..."],
  ["I'll get back to you today.","هرجعلك النهارده."],
  ["Welcome to the team!","أهلاً بيك في الفريق!"],
  ["It's been ages!","بقالنا كتير!"],
  ["To be honest, ...","بصراحة، ..."],
  ["What's the best number to reach you?","إيه أنسب رقم أكلمك عليه؟"],
  ["Let me show you how it's done.","خليني أوريك بتتعمل إزاي."],
  ["How was your vacation?","إجازتك كانت عاملة إيه؟"],
  ["I have a different idea.","عندي فكرة مختلفة."],
  ["Hold on a second, please.","استنى ثانية لو سمحت."],
  ["Take your time.","خد وقتك."],
  ["I'm looking forward to it.","مستنيه بفارغ الصبر."],
  ["That could work.","ده ممكن ينفع."],
  ["Sorry, I didn't catch that.","آسف، ملحقتش أسمع."],
  ["Keep up the good work.","كمّل كده."],
  ["Never mind.","مش مهم / خلاص."],
  ["Let's look at the data first.","خلينا نبص على البيانات الأول."],
  ["Talk to you soon.","نتكلم قريب."],
  ["I'll ask the supervisor.","هسأل المشرف."],
  ["Take care!","خلّي بالك من نفسك!"],
  ["I think we should ...","أعتقد إننا لازم ..."]
];

// أذكار ثابتة بفضلها من الأحاديث الصحيحة [الذكر، فضله]
const DHIKR: [string, string][] = [
  [
    "سبحان الله وبحمده",
    "من قالها مئة مرة في يوم حُطّت خطاياه وإن كانت مثل زبد البحر — متفق عليه"
  ],
  [
    "أستغفر الله وأتوب إليه",
    "«والله إني لأستغفر الله وأتوب إليه في اليوم أكثر من سبعين مرة» — رواه البخاري"
  ],
  [
    "سبحان الله وبحمده، سبحان الله العظيم",
    "كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن — متفق عليه"
  ],
  [
    "لا حول ولا قوة إلا بالله",
    "كنز من كنوز الجنة — متفق عليه"
  ],
  [
    "اللهم صلِّ وسلّم على نبينا محمد",
    "«من صلّى عليّ صلاة صلّى الله عليه بها عشرًا» — رواه مسلم"
  ],
  [
    "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير",
    "من قالها عشر مرات كان كمن أعتق أربعة أنفس من ولد إسماعيل — متفق عليه"
  ],
  [
    "أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه",
    "من قالها غُفر له وإن كان فرّ من الزحف — رواه أبو داود والترمذي"
  ],
  [
    "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر",
    "أحب الكلام إلى الله أربع — رواه مسلم"
  ],
  [
    "الحمد لله",
    "«والحمد لله تملأ الميزان» — رواه مسلم"
  ],
  [
    "سبحان الله وبحمده عدد خلقه، ورضا نفسه، وزنة عرشه، ومداد كلماته",
    "أربع كلمات لو وُزنت بما قيل من أول النهار لوزنته — رواه مسلم"
  ]
];

// في كل 5 خانات (كل خانة 15 دقيقة): 3 إنجليزي و2 ذكر بالتبادل
const PATTERN = ["en", "dhikr", "en", "en", "dhikr"];
const SLOT_MS = 15 * 60 * 1000;

function inQuiet(hour: number, from: number, to: number): boolean {
  if (from === to) return false;
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

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

async function sendNudge(supa: ReturnType<typeof createClient>) {
  const slot = Math.floor(Date.now() / SLOT_MS);
  const kind = PATTERN[slot % PATTERN.length];
  const nEn = Math.floor(slot / 5) * 3 + [0, 0, 1, 2, 2][slot % 5];
  const nDh = Math.floor(slot / 5) * 2 + [0, 0, 1, 1, 1][slot % 5];
  let payload: string, pick: unknown;
  if (kind === "en") {
    const p = EN[nEn % EN.length]; pick = p;
    payload = JSON.stringify({ title: "جملة إنجليزي 💬", body: p[0] + "\n" + p[1], en: p[0], type: "en", tag: "masar-nudge", go: "coach" });
  } else {
    const d = DHIKR[nDh % DHIKR.length]; pick = d;
    payload = JSON.stringify({ title: "ذِكر 📿", body: d[0] + "\n" + d[1], type: "dhikr", tag: "masar-nudge", go: "tasbih" });
  }

  const { data: rules, error: e1 } = await supa.from("masar_notify").select("user_id,enabled,quiet_from,quiet_to").eq("enabled", true);
  if (e1) return { ok: false, error: e1.message };
  const rule = new Map((rules || []).map((r) => [r.user_id, r]));
  if (!rule.size) return { ok: true, kind, sent: 0, note: "no enabled accounts" };

  const { data: subs, error: e2 } = await supa.from("masar_push_subs").select("id,endpoint,p256dh,auth,user_id,tz").in("user_id", [...rule.keys()]);
  if (e2) return { ok: false, error: e2.message };

  let sent = 0, quiet = 0, removed = 0, failed = 0;
  for (const s of subs || []) {
    const r = rule.get(s.user_id)!;
    const tz = typeof s.tz === "number" ? s.tz : Number(s.tz ?? 3);
    const hour = new Date(Date.now() + (isFinite(tz) ? tz : 3) * 3600000).getUTCHours();
    if (inQuiet(hour, r.quiet_from ?? 6, r.quiet_to ?? 14)) { quiet++; continue; }
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 600, urgency: "normal" });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) { await supa.from("masar_push_subs").delete().eq("id", s.id); removed++; }
      else failed++;
    }
  }
  return { ok: true, kind, pick, sent, quiet, removed, failed };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || req.headers.get("x-push-token");
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  // Accepted: the PUSH_SHARED_SECRET secret, or the token that push/fix-cron.sql generated
  // and stored in masar_push_cfg (readable only with the service role) — so the schedule
  // never needs a secret copied by hand.
  let ok = !!PUSH_SHARED_SECRET && token === PUSH_SHARED_SECRET;
  if (!ok && token) {
    const { data } = await supa.from("masar_push_cfg").select("value").eq("key", "cron_token").maybeSingle();
    ok = !!data && data.value === token;
  }
  if (!ok) return new Response("unauthorized", { status: 401 });
  const result = url.searchParams.get("mode") === "weekly" ? await sendWeeklyDigest(supa) : await sendNudge(supa);
  return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
});
