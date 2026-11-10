// Edge Function: masar-send-notification
// جملة إنجليزي يومية أو ذِكر — بالنسبة والتكرار اللي الأدمن حددهم لكل حساب (الافتراضي 60% إنجليزي كل 15 دقيقة) — للحسابات اللي الأدمن فعّل لها
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

// جمل يومية بسيطة — من بنك عبارات «مساري» في التطبيق [إنجليزي، معناها، معنى أصعب كلمة فيها]
const EN: [string, string, string][] = [
  ["Hello, this is Mahmoud from quality.","ألو، معاك محمود من الجودة.","quality = الجودة"],
  ["Do you have a minute?","عندك دقيقة؟","minute = دقيقة"],
  ["How's it going?","عامل إيه؟",""],
  ["In my opinion, ...","في رأيي، ...",""],
  ["I'll get back to you on that.","هرجعلك في الموضوع ده.","get back to = يرجعلك بالرد"],
  ["Can I see the menu, please?","ممكن أشوف المنيو لو سمحت؟","menu = المنيو"],
  ["How much is this?","ده بكام؟","How much = بكام"],
  ["Excuse me, how do I get to the station?","لو سمحت، أروح المحطة إزاي؟","how do I get to = أروح إزاي لـ"],
  ["I have a reservation under the name Ahmed.","عندي حجز باسم أحمد.","reservation = حجز"],
  ["Hello, this is Ahmed speaking.","ألو، معاك أحمد.","speaking = بيتكلم"],
  ["I don't feel well today.","مش حاسس إني كويس النهارده.",""],
  ["In my opinion, we should wait.","في رأيي، المفروض نستنى.","In my opinion = في رأيي"],
  ["Could you do me a favor?","ممكن تعملّي خدمة؟","do me a favor = تعملّي خدمة"],
  ["I usually wake up at seven.","عادةً بصحى الساعة سبعة.","wake up = أصحى"],
  ["Is this a good time to talk?","ده وقت مناسب نتكلم؟","a good time = وقت مناسب"],
  ["Could you give me a hand?","ممكن تساعدني؟","give me a hand = تساعدني"],
  ["Not bad, thanks. You?","مش وحش، شكرًا. وانت؟","bad = وحش"],
  ["I agree with you.","أنا متفق معاك.",""],
  ["Long time no see!","بقالي كتير مشفتكش!",""],
  ["Could you send me the details by email?","ممكن تبعتلي التفاصيل على الإيميل؟","by email = على الإيميل"],
  ["I'd like a coffee with milk, please.","عايز قهوة بلبن لو سمحت.","coffee = قهوة"],
  ["Do you have this in a smaller size?","عندك ده بمقاس أصغر؟","smaller = أصغر"],
  ["Is it far from here?","هو بعيد من هنا؟","far = بعيد"],
  ["What time is check-out?","معاد تسليم الأوضة الساعة كام؟","check-out = معاد مغادرة الفندق"],
  ["Could you speak a little slower, please?","ممكن تتكلم أبطأ شوية لو سمحت؟","a little slower = أبطأ شوية"],
  ["I have a headache.","عندي صداع.","headache = صداع"],
  ["I totally agree with you.","أنا متفق معاك تمامًا.","totally = تمامًا"],
  ["Would you mind closing the window?","تمانع تقفل الشباك؟","Would you mind = ممكن لو سمحت"],
  ["I'm running late!","أنا متأخر!","running late = متأخر"],
  ["I'm calling about ...","بكلمك بخصوص ...",""],
  ["Just a quick reminder, ...","مجرد تذكير سريع، ...",""],
  ["What are you up to this weekend?","ناوي على إيه الويك إند ده؟","What are you up to = ناوي على إيه"],
  ["I'm not sure I agree.","مش متأكد إني متفق.","agree = أوافق"],
  ["What have you been up to?","كنت بتعمل إيه الفترة اللي فاتت؟",""],
  ["I'm working on it right now.","أنا شغال عليها دلوقتي.","I'm working on it = شغال عليها"],
  ["What do you recommend?","ترشّحلي إيه؟","recommend = ترشّح"],
  ["I'm just looking, thanks.","بتفرّج بس، شكرًا.",""],
  ["Can you take me to this address?","ممكن توصلني العنوان ده؟","take me to = توصّلني لـ"],
  ["Is breakfast included?","الفطار ضمن الحجز؟",""],
  ["Can I call you back later?","ممكن أكلمك تاني بعدين؟","call you back = أكلمك تاني"],
  ["I've had a fever since yesterday.","عندي سخونية من امبارح.","since yesterday = من امبارح"],
  ["I see your point, but I think it's risky.","فاهم وجهة نظرك، بس شايف إنها مخاطرة.","see your point = فاهم وجهة نظرك"],
  ["Sorry for the delay.","آسف على التأخير.",""],
  ["What's for dinner?","هناكل إيه على العشا؟","dinner = العشا"],
  ["Sorry, could you speak a bit slower?","آسف، ممكن تتكلم أبطأ شوية؟","a bit slower = أبطأ شوية"],
  ["Please wear your hairnet.","لو سمحت البس غطا الشعر.",""],
  ["I'm exhausted today.","أنا مهدود النهارده.","exhausted = تعبان جدًا"],
  ["I see what you mean, but ...","فاهم قصدك، بس ...",""],
  ["Nice to meet you.","اتشرفت بمعرفتك.",""],
  ["Let me check and let you know.","خليني أتأكد وأقولك.","Let me check = خليني أتأكد"],
  ["Could we have the bill, please?","ممكن الحساب لو سمحت؟","the bill = الحساب"],
  ["Can I try it on?","ممكن أقيسه؟","try it on = أقيسها"],
  ["How long does it take to get there?","المشوار ده بياخد قد إيه؟","How long = قد إيه (وقت)"],
  ["Where is the boarding gate?","فين بوابة ركوب الطيارة؟","boarding gate = بوابة الطيارة"],
  ["I'd like to book an appointment.","عايز أحجز معاد.","book an appointment = أحجز معاد"],
  ["How often should I take this medicine?","آخد الدوا ده كل قد إيه؟","How often = كل قد إيه"],
  ["That makes sense.","ده منطقي.","makes sense = منطقي"],
  ["My apologies, it was my mistake.","أعتذر، دي كانت غلطتي.","My apologies = أنا آسف"],
  ["I'm exhausted, I need some rest.","أنا مهدود، محتاج أرتاح شوية.","some rest = شوية راحة"],
  ["The line is breaking up.","الخط بيقطع.","The line = الخط"],
  ["Don't forget to wash your hands.","متنساش تغسل إيدك.","wash your hands = اغسل إيديك"],
  ["It's boiling outside!","الجو نار برا!","boiling outside = الجو نار برة"],
  ["The problem is that ...","المشكلة إن ...",""],
  ["I've heard a lot about you.","سمعت عنك كتير.",""],
  ["Can we schedule a meeting for tomorrow?","ممكن نحدد اجتماع بكرة؟","schedule = نحدد معاد"],
  ["Is this table free?","الترابيزة دي فاضية؟",""],
  ["Is there any discount?","فيه أي خصم؟","discount = خصم"],
  ["Turn left at the traffic lights.","لف شمال عند الإشارة.","Turn left = لف شمال"],
  ["My luggage didn't arrive.","شنطي موصلتش.","luggage = شنطة السفر"],
  ["Does Thursday at 3 work for you?","يناسبك الخميس الساعة 3؟",""],
  ["I need to take a sick day.","محتاج آخد يوم أجازة مرضي.","sick day = يوم إجازة مرضي"],
  ["I'm not sure about that.","أنا مش متأكد من ده.","about = عن / بخصوص"],
  ["No worries, it happens.","ولا يهمك، بتحصل.","No worries = ولا يهمك"],
  ["Let's go out this weekend.","يلا نخرج الويك إند ده.","go out = نخرج"],
  ["Can I call you back in ten minutes?","ممكن أكلمك تاني كمان عشر دقايق؟","call you back = أكلمك تاني"],
  ["Good job today!","شغل ممتاز النهارده!","Good job = شغل حلو"],
  ["I'm running late.","أنا متأخر.","running late = متأخر"],
  ["On the other hand, ...","من ناحية تانية، ...",""],
  ["Take care, see you soon.","خلّي بالك من نفسك، أشوفك قريب.","see you soon = أشوفك قريب"],
  ["I need a little more time to finish this.","محتاج وقت زيادة شوية عشان أخلّص ده.","a little more time = وقت زيادة شوية"],
  ["Can I get this to go?","ممكن آخد ده تيك أواي؟","to go = تيك أواي"],
  ["I'll take it.","هاخده.",""],
  ["I'm stuck in traffic, I'll be a bit late.","أنا واقف في الزحمة، هتأخر شوية.","I'll be a bit late = هتأخر شوية"],
  ["Could I have a window seat?","ممكن كرسي جنب الشباك؟","window seat = كرسي جنب الشباك"],
  ["Sorry, you're breaking up.","آسف، الصوت بيقطع.","breaking up = الصوت بيقطع"],
  ["Is there a pharmacy near here?","فيه صيدلية قريبة من هنا؟","near here = قريب من هنا"],
  ["What do you think?","إنت رأيك إيه؟",""],
  ["Can you give me a hand with this?","ممكن تساعدني في ده؟","give me a hand = تساعدني"],
  ["I'll do it later.","هعملها بعدين.",""],
  ["Could you spell that, please?","ممكن تتهجّاها لو سمحت؟",""],
  ["Thanks for your help.","شكرًا على مساعدتك.",""],
  ["I'll be there in ten minutes.","هكون هناك كمان عشر دقايق.","I'll be there = هكون هناك"],
  ["Have a nice weekend!","ويك إند سعيد!",""],
  ["That's a good point.","دي نقطة كويسة.","good point = نقطة حلوة"],
  ["I'm allergic to nuts.","عندي حساسية من المكسرات.","allergic to = عندي حساسية من"],
  ["Can I return it if it doesn't fit?","ينفع أرجّعه لو مجاش مقاسي؟","if it doesn't fit = لو مش مقاسي"],
  ["Could you stop here, please?","ممكن تقف هنا لو سمحت؟","stop here = وقّف هنا"],
  ["The air conditioning isn't working.","التكييف مش شغال.","air conditioning = التكييف"],
  ["Can I leave a message?","ممكن أسيب رسالة؟","leave a message = أسيب رسالة"],
  ["It hurts here.","بيوجعني هنا.","It hurts = بيوجعني"],
  ["Let's look at it from another angle.","خلينا نبص لها من زاوية تانية.","another angle = زاوية تانية"],
  ["Thank you so much, that's very kind of you.","شكرًا جدًا، ده ذوق منك.","Thank you so much = شكرًا جدًا"],
  ["Could you turn down the TV?","ممكن توطّي التلفزيون؟","turn down = توطّي"],
  ["Let me write that down.","خليني أكتب ده.","write that down = أكتب ده"],
  ["I see your point.","فاهم وجهة نظرك.",""],
  ["That's exactly what I meant.","ده بالظبط اللي قصدته.",""],
  ["Say hi to your family for me.","سلّملي على أهلك.","Say hi to = سلّملي على"],
  ["Could you walk me through it?","ممكن تشرحهالي خطوة خطوة؟","walk me through = تشرحلي خطوة خطوة"],
  ["This is delicious!","ده طعمه تحفة!",""],
  ["Where can I find the milk?","ألاقي اللبن فين؟","Where can I find = ألاقي فين"],
  ["Which bus goes to downtown?","أنهي أتوبيس بيروح وسط البلد؟","goes to downtown = رايح وسط البلد"],
  ["Can you recommend a good place to visit?","ترشّحلي مكان حلو أزوره؟","a good place to visit = مكان حلو أزوره"],
  ["I need to reschedule our meeting.","محتاج أغيّر معاد اجتماعنا.","reschedule our meeting = نأجّل معاد الاجتماع"],
  ["I'm feeling much better now.","أنا أحسن بكتير دلوقتي.","much better = أحسن بكتير"],
  ["To be honest, I prefer the first option.","بصراحة، أنا أفضّل الاختيار الأول.","To be honest = بصراحة"],
  ["You're welcome, anytime.","العفو، في أي وقت.","You're welcome = العفو"],
  ["I'm going to bed, good night.","أنا داخل أنام، تصبح على خير.","going to bed = رايح أنام"],
  ["Just to confirm, you said ...","بس عشان أتأكد، انت قلت ...","Just to confirm = للتأكيد بس"],
  ["Let's figure it out together.","خلينا نحلها سوا.","figure it out = نلاقي حل"],
  ["It's up to you.","زي ما تحب.",""],
  ["Let me put it another way.","خليني أقولها بطريقة تانية.","put it another way = أقولها بطريقة تانية"],
  ["Sorry, I didn't catch your name.","آسف، ملحقتش أسمع اسمك.","didn't catch = مالحقتش أسمع"],
  ["I'm afraid I can't make it to the meeting.","للأسف مش هقدر أحضر الاجتماع.","can't make it = مش هقدر أحضر"],
  ["Excuse me, this isn't what I ordered.","لو سمحت، ده مش اللي أنا طلبته.","isn't what I ordered = مش اللي أنا طلبته"],
  ["Could I have a receipt, please?","ممكن الفاتورة لو سمحت؟","a receipt = إيصال"],
  ["It's within walking distance.","المكان قريب، ينفع تروحه مشي.","walking distance = مسافة مشي"],
  ["I'm here on business.","أنا هنا في شغل.","on business = في شغل"],
  ["Get well soon!","ألف سلامة عليك!",""],
  ["I didn't mean to interrupt.","مكنتش أقصد أقاطعك.","didn't mean to = ماكانش قصدي"],
  ["Don't forget to lock the door.","متنساش تقفل الباب.","lock the door = اقفل الباب"],
  ["I'll send you the details by email.","هبعتلك التفاصيل على الإيميل.","send you the details = أبعتلك التفاصيل"],
  ["Sorry, that was my mistake.","آسف، دي كانت غلطتي.","my mistake = غلطتي"],
  ["I'm not sure yet.","لسه مش متأكد.",""],
  ["For example, ...","على سبيل المثال، ...",""],
  ["It was great to see you.","كان جميل إني شفتك.",""],
  ["Thanks for your help, I really appreciate it.","شكرًا على مساعدتك، بجد مقدّر ده.","Thanks for your help = شكرًا على مساعدتك"],
  ["Can I pay by card?","ينفع أدفع بالكارت؟","pay by card = أدفع بالكارت"],
  ["That's a bit too expensive for me.","ده غالي عليّا شوية.","too expensive = غالي أوي"],
  ["I think I'm lost.","أعتقد إني تهت.",""],
  ["Could you call me a taxi, please?","ممكن تطلبلي تاكسي لو سمحت؟","call me a taxi = تطلبلي تاكسي"],
  ["Thanks for calling, have a good day.","شكرًا على اتصالك، يومك سعيد.","have a good day = يومك سعيد"],
  ["Do I need a prescription for this?","محتاج روشتة للدوا ده؟","a prescription = روشتة"],
  ["Fair enough.","ماشي، عندك حق.",""],
  ["Is it okay if I leave early today?","ينفع أمشي بدري النهارده؟","Is it okay if = ينفع لو"],
  ["I'm on my way home.","أنا في الطريق للبيت.",""],
  ["Could I speak to the QA manager?","ممكن أكلم مدير ضمان الجودة؟","the QA manager = مدير الجودة"],
  ["The good thing is that ...","الحلو إن ...",""],
  ["He's not available right now.","هو مش متاح دلوقتي.","not available = مش متاح"],
  ["Can you cover for me for an hour?","ممكن تغطي مكاني ساعة؟","cover for me = تغطّي مكاني"],
  ["Sounds good to me.","تمام بالنسبالي.","Sounds good = تمام كده"],
  ["I suggest we ...","أقترح إننا ...",""],
  ["I'm swamped today.","أنا غرقان شغل النهارده.","I'm swamped = أنا غرقان في الشغل"],
  ["I didn't get much sleep.","منمتش كويس.",""],
  ["Why don't we try ...?","ليه منجربش ...؟","try = أجرّب / نجرّب"],
  ["Thanks for calling.","شكرًا على اتصالك.","calling = بتتصل"],
  ["Let me know if you need anything.","قولي لو احتجت أي حاجة.","if you need anything = لو احتجت أي حاجة"],
  ["Let's grab a coffee.","يلا نشرب قهوة.",""],
  ["It depends on ...","ده بيعتمد على ...",""],
  ["Sorry, I missed your call.","آسف، فاتتني مكالمتك.","missed your call = فاتتني مكالمتك"],
  ["Who's on the night shift?","مين وردية الليل؟","Who's on = مين شغال في"],
  ["I've been really busy lately.","كنت مشغول جدًا الفترة اللي فاتت.","really busy = مشغول جدًا"],
  ["As far as I know, ...","على حد علمي، ...",""],
  ["I'll get back to you today.","هرجعلك النهارده.","get back to = يرجعلك بالرد"],
  ["Welcome to the team!","أهلاً بيك في الفريق!",""],
  ["It's been ages!","بقالنا كتير!",""],
  ["To be honest, ...","بصراحة، ...",""],
  ["What's the best number to reach you?","إيه أنسب رقم أكلمك عليه؟",""],
  ["Let me show you how it's done.","خليني أوريك بتتعمل إزاي.","Let me show you = خليني أوريك"],
  ["How was your vacation?","إجازتك كانت عاملة إيه؟",""],
  ["I have a different idea.","عندي فكرة مختلفة.","a different idea = فكرة مختلفة"],
  ["Hold on a second, please.","استنى ثانية لو سمحت.","Hold on = استنى"],
  ["Take your time.","خد وقتك.",""],
  ["I'm looking forward to it.","مستنيه بفارغ الصبر.","looking forward to = مستني بفارغ الصبر"],
  ["That could work.","ده ممكن ينفع.",""],
  ["Sorry, I didn't catch that.","آسف، ملحقتش أسمع.","didn't catch = مالحقتش أسمع"],
  ["Keep up the good work.","كمّل كده.",""],
  ["Never mind.","مش مهم / خلاص.",""],
  ["Let's look at the data first.","خلينا نبص على البيانات الأول.","the data first = الأرقام الأول"],
  ["Talk to you soon.","نتكلم قريب.",""],
  ["I'll ask the supervisor.","هسأل المشرف.",""],
  ["Take care!","خلّي بالك من نفسك!",""],
  ["I think we should ...","أعتقد إننا لازم ...",""]
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

// Per account: en_pct = share of English (the rest dhikr), every_min = 15 / 30 / 60.
// The account's own step counter s = slot / (every_min / 15) decides the kind:
// English when floor((s+1)·p) > floor(s·p) — this spreads the two kinds evenly
// (e.g. 50% alternates) — and the running counts pick which sentence / dhikr is next.
function nudgeFor(slot: number, pct: number, every: number) {
  const step = Math.max(1, Math.round((every || 15) / 15));
  if (slot % step !== 0) return null;
  const s = Math.floor(slot / step), p = Math.max(0, Math.min(100, pct ?? 60)) / 100;
  const isEn = Math.floor((s + 1) * p) > Math.floor(s * p);
  const nEn = Math.floor(s * p), nDh = s - nEn;
  if (isEn) {
    const e = EN[nEn % EN.length];
    return { kind: "en", payload: JSON.stringify({ title: "جملة إنجليزي 💬", body: e[0] + "\n" + e[1] + (e[2] ? "\n💡 " + e[2] : ""), en: e[0], ar: e[1], hint: e[2], type: "en", tag: "masar-nudge", go: "en", id: "s" + slot }) };
  }
  const d = DHIKR[nDh % DHIKR.length];
  return { kind: "dhikr", payload: JSON.stringify({ title: "ذِكر 📿", body: d[0] + "\n" + d[1], type: "dhikr", tag: "masar-nudge", go: "tasbih" }) };
}

async function sendNudge(supa: ReturnType<typeof createClient>) {
  const slot = Math.floor(Date.now() / SLOT_MS);
  let { data: rules, error: e1 } = await supa.from("masar_notify").select("user_id,enabled,quiet_from,quiet_to,en_pct,every_min").eq("enabled", true);
  if (e1) { // before notify-ratio.sql was run: same behaviour as before (60% / every 15)
    const r2 = await supa.from("masar_notify").select("user_id,enabled,quiet_from,quiet_to").eq("enabled", true);
    rules = r2.data as typeof rules; e1 = r2.error;
  }
  if (e1) return { ok: false, error: e1.message };
  const rule = new Map((rules || []).map((r) => [r.user_id, r]));
  if (!rule.size) return { ok: true, sent: 0, note: "no enabled accounts" };

  const { data: subs, error: e2 } = await supa.from("masar_push_subs").select("id,endpoint,p256dh,auth,user_id,tz").in("user_id", [...rule.keys()]);
  if (e2) return { ok: false, error: e2.message };

  let sent = 0, quiet = 0, skipped = 0, removed = 0, failed = 0;
  const kinds: Record<string, string> = {};
  for (const s of subs || []) {
    const r = rule.get(s.user_id)!;
    const tz = typeof s.tz === "number" ? s.tz : Number(s.tz ?? 3);
    const hour = new Date(Date.now() + (isFinite(tz) ? tz : 3) * 3600000).getUTCHours();
    if (inQuiet(hour, r.quiet_from ?? 6, r.quiet_to ?? 14)) { quiet++; continue; }
    const n = nudgeFor(slot, r.en_pct ?? 60, r.every_min ?? 15);
    if (!n) { skipped++; continue; }
    kinds[s.user_id] = n.kind;
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, n.payload, { TTL: 600, urgency: "normal" });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) { await supa.from("masar_push_subs").delete().eq("id", s.id); removed++; }
      else failed++;
    }
  }
  return { ok: true, slot, kinds, sent, quiet, skipped, removed, failed };
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
