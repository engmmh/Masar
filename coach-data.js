"use strict";
  /* ---------------- مساري في الإنجليزي — content ---------------- */
  // Placement test, the work/daily phrase bank, listening dialogues, work writing
  // templates, the weekly speaking prompt and the "أقدر أعمل كذا" ladder.

  // Placement: s = skill (grammar | vocab | reading | listen | speak), lv = CEFR band the
  // item discriminates. Listening items are read aloud with TTS (say).
  var PL_READ = "Hi Mahmoud,\nThanks for your report on batch 3307. I agree we should keep it on hold until the lab results are ready, probably on Thursday. Could you also check whether the same raw material was used in batch 3308? If so, please hold that one too. I'll be out of the office tomorrow, so please contact Sara if anything urgent comes up.\nBest,\nOmar";
  var PLACEMENT = [
    { s: "grammar", lv: "A2", q: "Yesterday I ___ to the supplier about the delay.", o: ["spoke", "speak", "have spoken", "was speak"], a: "spoke", why: "Yesterday = ماضي بسيط: spoke." },
    { s: "grammar", lv: "A2", q: "There aren't ___ samples left in the fridge.", o: ["any", "some", "no", "much"], a: "any", why: "مع النفي والجمع: any." },
    { s: "grammar", lv: "A2", q: "The new line is ___ than the old one.", o: ["faster", "more fast", "fastest", "most fast"], a: "faster", why: "مقارنة صفة قصيرة: fast → faster." },
    { s: "grammar", lv: "B1", q: "I ___ in quality control since 2021.", o: ["have worked", "work", "am working", "worked"], a: "have worked", why: "since + حاجة لسه مستمرة = present perfect." },
    { s: "grammar", lv: "B1", q: "If the temperature ___ above 4°C, we reject the delivery.", o: ["goes", "will go", "went", "would go"], a: "goes", why: "قاعدة عامة (zero/first conditional): If + مضارع." },
    { s: "grammar", lv: "B1", q: "The samples ___ to the lab every morning.", o: ["are sent", "send", "are sending", "sent"], a: "are sent", why: "مبني للمجهول في المضارع: are + sent." },
    { s: "grammar", lv: "B1", q: "He asked me where ___.", o: ["the report was", "was the report", "is the report", "the report is it"], a: "the report was", why: "السؤال المنقول بيرجع لترتيب الجملة العادي: where the report was." },
    { s: "grammar", lv: "B1", q: "We're not allowed ___ jewelry in the production area.", o: ["to wear", "wearing", "wear", "to wearing"], a: "to wear", why: "be allowed + to + فعل." },
    { s: "grammar", lv: "B2", q: "If we ___ the scale last week, this wouldn't have happened.", o: ["had calibrated", "calibrated", "have calibrated", "would calibrate"], a: "had calibrated", why: "third conditional: If + had + p.p., would have + p.p." },
    { s: "grammar", lv: "B2", q: "The batch, ___ was produced on Monday, has been released.", o: ["which", "who", "what", "that"], a: "which", why: "بعد الفاصلة بنستخدم which لغير العاقل (مش that)." },
    { s: "grammar", lv: "B2", q: "By the time the auditor arrived, we ___ all the records.", o: ["had prepared", "prepared", "have prepared", "were preparing"], a: "had prepared", why: "حاجة خلصت قبل حاجة تانية في الماضي = past perfect." },
    { s: "vocab", lv: "A2", q: "Can you ___ me the report by email?", o: ["send", "say", "speak", "talk"], a: "send", why: "send someone something." },
    { s: "vocab", lv: "A2", q: "I'm ___ for checking the raw materials.", o: ["responsible", "possible", "available", "comfortable"], a: "responsible", why: "responsible for = مسؤول عن." },
    { s: "vocab", lv: "B1", q: "We need to ___ the root cause before we close the complaint.", o: ["identify", "invent", "increase", "ignore"], a: "identify", why: "identify the root cause = نحدد السبب الجذري." },
    { s: "vocab", lv: "B1", q: "The product didn't meet the ___, so we put it on hold.", o: ["specification", "speculation", "special", "spectator"], a: "specification", why: "specification = المواصفة." },
    { s: "vocab", lv: "B1", q: "I'll ___ you know as soon as I get the results.", o: ["let", "make", "tell", "give"], a: "let", why: "let you know = أبلغك." },
    { s: "vocab", lv: "B2", q: "We should ___ this issue with the supplier before it gets worse.", o: ["raise", "rise", "arise", "rouse"], a: "raise", why: "raise an issue = نفتح/نطرح موضوع (فعل متعدي)." },
    { s: "vocab", lv: "B2", q: "The new procedure should ___ the number of complaints significantly.", o: ["reduce", "decline", "fall", "drop down"], a: "reduce", why: "reduce something (متعدي)؛ decline وfall لازمين." },
    { s: "reading", lv: "A2", text: PL_READ, q: "When are the lab results expected?", o: ["On Thursday", "Tomorrow", "Today", "Next week"], a: "On Thursday", why: "probably on Thursday." },
    { s: "reading", lv: "B1", text: PL_READ, q: "What should Mahmoud do about batch 3308?", o: ["Hold it if it used the same raw material", "Release it today", "Send it to the supplier", "Nothing"], a: "Hold it if it used the same raw material", why: "If so, please hold that one too." },
    { s: "reading", lv: "B1", text: PL_READ, q: "Who should Mahmoud contact tomorrow if something urgent happens?", o: ["Sara", "Omar", "The lab", "The supplier"], a: "Sara", why: "Omar will be out, so contact Sara." },
    { s: "listen", lv: "A2", say: "The meeting has been moved to three thirty.", q: "When is the meeting now?", o: ["3:30", "3:13", "1:30", "2:30"], a: "3:30", why: "three thirty = 3:30." },
    { s: "listen", lv: "B1", say: "Could you double-check the temperature log before you sign the release form?", q: "What should you do first?", o: ["Check the temperature log", "Sign the release form", "Release the product", "Call the supplier"], a: "Check the temperature log", why: "before you sign = قبل ما توقّع." },
    { s: "listen", lv: "B1", say: "We ran out of sample bags, so I ordered fifty more. They should arrive on Monday.", q: "Why did they order bags?", o: ["They had none left", "The bags were broken", "The supplier asked them to", "For an audit on Monday"], a: "They had none left", why: "ran out of = خلص منهم." },
    { s: "listen", lv: "B2", say: "Unless the supplier sends a corrective action plan by Friday, we'll have to suspend their approval.", q: "What happens if there is no plan by Friday?", o: ["The supplier's approval is suspended", "The supplier gets more time", "Nothing happens", "The audit is cancelled"], a: "The supplier's approval is suspended", why: "Unless = If not." },
    { s: "speak", lv: "B1", q: "Introduce yourself and your job in 3–4 sentences.", ar: "عرّف نفسك وشغلك في ٣-٤ جمل.", need: "name|i'm|i am|my;work|job|quality|qc|specialist|engineer;year|experience|responsib|check|inspect" },
    { s: "speak", lv: "B1", q: "Describe a problem you had at work and what you did about it.", ar: "احكي عن مشكلة حصلت في شغلك وعملت فيها إيه.", need: "problem|issue|wrong|mistake|complain;did|fix|solv|found|told|stop|check|decid|call;because|so|then|after|result" }
  ];
  var SKILL_AR = { grammar: "القواعد", vocab: "المفردات", reading: "القراءة", listen: "الاستماع", speak: "الكلام" };

  // Phrase bank — [english, arabic]. Learned 5 a day inside the daily dose, then reviewed
  // on an expanding schedule.
  var CHUNK_CATS = [
    { k: "meet", t: "الاجتماعات", l: [
      ["Let me give you a quick update.", "خليني أديكم تحديث سريع."], ["Overall, things went well yesterday.", "عمومًا، امبارح عدّى كويس."], ["There's one issue I'd like to raise.", "فيه موضوع واحد حابب أفتحه."], ["We're on track with the plan.", "إحنا ماشيين حسب الخطة."], ["We're a bit behind schedule.", "إحنا متأخرين شوية عن الجدول."],
      ["What's the status of the new line?", "إيه أخبار الخط الجديد؟"], ["Can we come back to that later?", "ممكن نرجع للنقطة دي بعدين؟"], ["I'll follow up on that.", "هتابع الموضوع ده."], ["Who's going to take care of it?", "مين هيتولى الموضوع ده؟"], ["Let's set a deadline for Thursday.", "خلينا نحدد ديدلاين الخميس."],
      ["Just to summarize, ...", "باختصار يعني، ..."], ["Does anyone have any questions?", "حد عنده أي أسئلة؟"], ["I'd like to add something.", "حابب أضيف حاجة."], ["That's a fair point, but ...", "دي نقطة منطقية، بس ..."], ["Could you clarify what you mean?", "ممكن توضّح تقصد إيه؟"],
      ["Let's move on to the next point.", "خلينا ننتقل للنقطة اللي بعدها."], ["The main reason is ...", "السبب الأساسي هو ..."], ["We agreed to ...", "اتفقنا إن ..."], ["I'll send the minutes after the meeting.", "هبعت محضر الاجتماع بعد ما نخلص."], ["Thanks, everyone. Let's wrap up.", "شكرًا للجميع. خلينا نقفل."]] },
    { k: "line", t: "على الخط والفحص", l: [
      ["I'm doing my rounds on the line.", "أنا بلف جولتي على الخط."], ["Can you stop the line for a minute?", "ممكن توقف الخط دقيقة؟"], ["This batch is on hold.", "الدفعة دي محجوزة."], ["Please don't release it yet.", "لو سمحت متفرجش عنها لسه."], ["The label is missing the expiry date.", "الليبل ناقص تاريخ الصلاحية."],
      ["The seal isn't tight enough.", "اللحام (القفل) مش محكم كفاية."], ["These packs are underweight.", "العبوات دي وزنها ناقص."], ["I found a foreign object in a sample.", "لقيت جسم غريب في عينة."], ["Let's check the last hour of production.", "خلينا نراجع إنتاج آخر ساعة."], ["Did you test the metal detector this shift?", "جربت جهاز كشف المعادن الوردية دي؟"],
      ["The reading is out of range.", "القراية برا المدى المسموح."], ["We need to segregate the defective products.", "لازم نفصل المنتجات المعيبة."], ["Everything looks fine so far.", "كله تمام لحد دلوقتي."], ["Please record it in the checklist.", "سجّلها في الشيك ليست لو سمحت."], ["The machine needs adjusting.", "الماكينة محتاجة ظبط."],
      ["How many samples did you take?", "خدت كام عينة؟"], ["Take five samples every hour.", "خد خمس عينات كل ساعة."], ["The color doesn't match the standard.", "اللون مش مطابق للستاندرد."], ["It's within the limits.", "ده جوه الحدود."], ["Let's re-check after the adjustment.", "خلينا نعيد الفحص بعد الظبط."]] },
    { k: "report", t: "التقارير والأرقام", l: [
      ["The defect rate went down to 0.5%.", "نسبة العيوب نزلت لـ٠.٥٪."], ["Complaints increased by 20% this month.", "الشكاوى زادت ٢٠٪ الشهر ده."], ["Six out of twenty samples failed.", "ست عينات من عشرين فشلت."], ["The results are within specification.", "النتايج جوه المواصفة."], ["The average weight was 498 grams.", "متوسط الوزن كان ٤٩٨ جرام."],
      ["Compared to last month, ...", "مقارنة بالشهر اللي فات، ..."], ["The trend is going up.", "الاتجاه طالع."], ["The main cause was ...", "السبب الرئيسي كان ..."], ["As a result, we ...", "ونتيجة لكده، إحنا ..."], ["According to the lab results, ...", "حسب نتايج المعمل، ..."],
      ["There were no major issues.", "مكانش فيه مشاكل كبيرة."], ["One batch was rejected.", "دفعة واحدة اترفضت."], ["The corrective action has been completed.", "الإجراء التصحيحي خلص."], ["The investigation is still ongoing.", "التحقيق لسه شغال."], ["I've attached the full report.", "مرفق التقرير كامل."],
      ["The chart shows a clear improvement.", "الرسم البياني بيوضح تحسن واضح."], ["This is slightly above the limit.", "ده أعلى من الحد بشوية."], ["We met our target this week.", "حققنا الهدف الأسبوع ده."], ["We missed the target by 2%.", "فاتنا الهدف بـ٢٪."], ["I'll update the figures tomorrow.", "هحدّث الأرقام بكرة."]] },
    { k: "supplier", t: "الموردين", l: [
      ["I'm calling about yesterday's delivery.", "بكلمك بخصوص شحنة امبارح."], ["Unfortunately, we had to reject it.", "للأسف اضطرينا نرفضها."], ["The temperature was above our limit.", "الحرارة كانت أعلى من الحد بتاعنا."], ["Could you send a replacement?", "ممكن تبعت بديل؟"], ["Please send the certificate of analysis.", "لو سمحت ابعت شهادة التحليل."],
      ["We need a corrective action plan.", "محتاجين خطة إجراء تصحيحي."], ["What's the root cause?", "إيه السبب الجذري؟"], ["This is the second time this month.", "دي تاني مرة الشهر ده."], ["It will affect your supplier rating.", "ده هيأثر على تقييمك كمورد."], ["When can you deliver?", "تقدر تسلّم إمتى؟"],
      ["The packaging was damaged.", "التغليف كان متضرر."], ["The batch number doesn't match the documents.", "رقم الدفعة مش مطابق للمستندات."], ["Can you confirm by email?", "ممكن تأكد على الإيميل؟"], ["We'd like to schedule a supplier audit.", "حابين نحدد معاد تدقيق على المورد."], ["Please keep us informed.", "خلينا على اطلاع لو سمحت."],
      ["We appreciate your quick response.", "مقدّرين ردك السريع."], ["The truck arrived two hours late.", "العربية وصلت متأخرة ساعتين."], ["The shelf life is too short.", "مدة الصلاحية قصيرة أوي."], ["Let's agree on a solution.", "خلينا نتفق على حل."], ["We look forward to working with you.", "مستنيين نشتغل معاكم."]] },
    { k: "audit", t: "التدقيق", l: [
      ["Let me show you the records.", "خليني أوريك السجلات."], ["We check it every hour.", "بنفحصه كل ساعة."], ["The critical limit is 72 degrees.", "الحد الحرج ٧٢ درجة."], ["The operator records it on this form.", "المشغّل بيسجله في الفورم دي."], ["The supervisor verifies it daily.", "المشرف بيتحقق منه يوميًا."],
      ["If it goes out of limits, we hold the product.", "لو طلع برا الحدود بنحجز المنتج."], ["Here's our calibration certificate.", "دي شهادة المعايرة بتاعتنا."], ["That procedure was updated last month.", "الإجراء ده اتحدّث الشهر اللي فات."], ["Let me check and get back to you.", "خليني أتأكد وأرجعلك."], ["All staff are trained on this.", "كل العمال متدربين على ده."],
      ["Here's the training record.", "ده سجل التدريب."], ["We do internal audits twice a year.", "بنعمل تدقيق داخلي مرتين في السنة."], ["We closed that finding last year.", "قفلنا الملاحظة دي السنة اللي فاتت."], ["Could you repeat the question, please?", "ممكن تعيد السؤال لو سمحت؟"], ["That's a good observation.", "دي ملاحظة كويسة."],
      ["We'll raise a corrective action for it.", "هنفتح إجراء تصحيحي ليها."], ["This is our HACCP plan.", "دي خطة الهاسب بتاعتنا."], ["We validated it with a study.", "عملنا تصديق عليها بدراسة."], ["We trend the results monthly.", "بنحلل اتجاه النتايج شهريًا."], ["The records are kept for two years.", "السجلات بتتحفظ سنتين."]] },
    { k: "email", t: "الإيميلات", l: [
      ["I hope you're doing well.", "أتمنى تكون بخير."], ["I'm writing to inform you that ...", "بكتبلك عشان أبلغك إن ..."], ["Please find attached the report.", "مرفق التقرير."], ["Could you please confirm ...?", "ممكن تأكد ...؟"], ["Following our call, ...", "بعد مكالمتنا، ..."],
      ["As discussed in the meeting, ...", "زي ما اتكلمنا في الاجتماع، ..."], ["I'd appreciate it if you could ...", "هكون ممتن لو تقدر ..."], ["Please let me know if you have any questions.", "قولي لو عندك أي أسئلة."], ["Sorry for the late reply.", "آسف على التأخير في الرد."], ["Thank you for your quick reply.", "شكرًا على ردك السريع."],
      ["Just a quick reminder about ...", "مجرد تذكير سريع بـ ..."], ["I'm afraid we can't accept ...", "للأسف مش هنقدر نقبل ..."], ["We would like to request ...", "حابين نطلب ..."], ["The deadline is next Monday.", "الديدلاين الاتنين الجاي."], ["I've copied Sara on this email.", "حطيت سارة نسخة في الإيميل."],
      ["Looking forward to your reply.", "مستني ردك."], ["Best regards,", "مع خالص التحية،"], ["I'll keep you updated.", "هبلغك بأي جديد."], ["Please see my comments below.", "شوف تعليقاتي تحت."], ["Could we schedule a call?", "ممكن نحدد مكالمة؟"]] },
    { k: "phone", t: "التليفون", l: [
      ["Hello, this is Mahmoud from quality.", "ألو، معاك محمود من الجودة."], ["Is this a good time to talk?", "ده وقت مناسب نتكلم؟"], ["I'm calling about ...", "بكلمك بخصوص ..."], ["Sorry, could you speak a bit slower?", "آسف، ممكن تتكلم أبطأ شوية؟"], ["The line is breaking up.", "الخط بيقطع."],
      ["Can I call you back in ten minutes?", "ممكن أكلمك تاني كمان عشر دقايق؟"], ["Could you spell that, please?", "ممكن تتهجّاها لو سمحت؟"], ["Let me write that down.", "خليني أكتب ده."], ["Just to confirm, you said ...", "بس عشان أتأكد، انت قلت ..."], ["I'll send you the details by email.", "هبعتلك التفاصيل على الإيميل."],
      ["Could I speak to the QA manager?", "ممكن أكلم مدير ضمان الجودة؟"], ["He's not available right now.", "هو مش متاح دلوقتي."], ["Can I leave a message?", "ممكن أسيب رسالة؟"], ["Thanks for calling.", "شكرًا على اتصالك."], ["Sorry, I missed your call.", "آسف، فاتتني مكالمتك."],
      ["I'll get back to you today.", "هرجعلك النهارده."], ["What's the best number to reach you?", "إيه أنسب رقم أكلمك عليه؟"], ["Hold on a second, please.", "استنى ثانية لو سمحت."], ["Sorry, I didn't catch that.", "آسف، ملحقتش أسمع."], ["Talk to you soon.", "نتكلم قريب."]] },
    { k: "people", t: "مع الزملاء والعمال", l: [
      ["Do you have a minute?", "عندك دقيقة؟"], ["Could you give me a hand?", "ممكن تساعدني؟"], ["Just a quick reminder, ...", "مجرد تذكير سريع، ..."], ["Please wear your hairnet.", "لو سمحت البس غطا الشعر."], ["Don't forget to wash your hands.", "متنساش تغسل إيدك."],
      ["Good job today!", "شغل ممتاز النهارده!"], ["Thanks for your help.", "شكرًا على مساعدتك."], ["I see your point.", "فاهم وجهة نظرك."], ["Let's figure it out together.", "خلينا نحلها سوا."], ["Sorry, that was my mistake.", "آسف، دي كانت غلطتي."],
      ["No worries, it happens.", "ولا يهمك، بتحصل."], ["Can you cover for me for an hour?", "ممكن تغطي مكاني ساعة؟"], ["I'm swamped today.", "أنا غرقان شغل النهارده."], ["Let me know if you need anything.", "قولي لو احتجت أي حاجة."], ["Who's on the night shift?", "مين وردية الليل؟"],
      ["Welcome to the team!", "أهلاً بيك في الفريق!"], ["Let me show you how it's done.", "خليني أوريك بتتعمل إزاي."], ["Take your time.", "خد وقتك."], ["Keep up the good work.", "كمّل كده."], ["I'll ask the supervisor.", "هسأل المشرف."]] },
    { k: "daily", t: "كلام يومي", l: [
      ["How's it going?", "عامل إيه؟"], ["Not bad, thanks. You?", "مش وحش، شكرًا. وانت؟"], ["What are you up to this weekend?", "ناوي على إيه الويك إند ده؟"], ["I'm exhausted today.", "أنا مهدود النهارده."], ["It's boiling outside!", "الجو نار برا!"],
      ["I'm running late.", "أنا متأخر."], ["I'll be there in ten minutes.", "هكون هناك كمان عشر دقايق."], ["Could you do me a favor?", "ممكن تعملي خدمة؟"], ["It's up to you.", "زي ما تحب."], ["I'm not sure yet.", "لسه مش متأكد."],
      ["That makes sense.", "ده منطقي."], ["Sounds good to me.", "تمام بالنسبالي."], ["I didn't get much sleep.", "منمتش كويس."], ["Let's grab a coffee.", "يلا نشرب قهوة."], ["I've been really busy lately.", "كنت مشغول جدًا الفترة اللي فاتت."],
      ["It's been ages!", "بقالنا كتير!"], ["How was your vacation?", "إجازتك كانت عاملة إيه؟"], ["I'm looking forward to it.", "مستنيه بفارغ الصبر."], ["Never mind.", "مش مهم / خلاص."], ["Take care!", "خلّي بالك من نفسك!"]] },
    { k: "opinion", t: "رأي ونقاش", l: [
      ["In my opinion, ...", "في رأيي، ..."], ["I agree with you.", "أنا متفق معاك."], ["I'm not sure I agree.", "مش متأكد إني متفق."], ["I see what you mean, but ...", "فاهم قصدك، بس ..."], ["The problem is that ...", "المشكلة إن ..."],
      ["On the other hand, ...", "من ناحية تانية، ..."], ["What do you think?", "إيه رأيك؟"], ["That's exactly what I meant.", "ده بالظبط اللي قصدته."], ["Let me put it another way.", "خليني أقولها بطريقة تانية."], ["For example, ...", "على سبيل المثال، ..."],
      ["The good thing is that ...", "الحلو إن ..."], ["I suggest we ...", "أقترح إننا ..."], ["Why don't we try ...?", "ليه منجربش ...؟"], ["It depends on ...", "ده بيعتمد على ..."], ["As far as I know, ...", "على حد علمي، ..."],
      ["To be honest, ...", "بصراحة، ..."], ["I have a different idea.", "عندي فكرة مختلفة."], ["That could work.", "ده ممكن ينفع."], ["Let's look at the data first.", "خلينا نبص على البيانات الأول."], ["I think we should ...", "أعتقد إننا لازم ..."]] }
  ];

  // Listening dialogues: lines [speaker A|B, english, arabic]; questions in English.
  var DIALOGS = [
    { k: "dl-shift", t: "تسليم الوردية", lv: "A2", lines: [
      ["A", "Hi, how was the night shift?", "أهلاً، الوردية الليلية كانت عاملة إيه؟"], ["B", "Mostly quiet. Line two stopped for twenty minutes at 3 a.m.", "هادية غالبًا. خط ٢ وقف ٢٠ دقيقة الساعة ٣ الفجر."], ["A", "Why? What happened?", "ليه؟ إيه اللي حصل؟"], ["B", "The labeling machine jammed. Maintenance fixed it quickly.", "ماكينة الليبل علّقت. الصيانة صلّحتها بسرعة."], ["A", "Did you check the labels after that?", "فحصت الليبلات بعدها؟"], ["B", "Yes, I checked twenty packs. They were all fine.", "أيوه، فحصت ٢٠ عبوة. كلها كانت تمام."], ["A", "Great. Anything else I should know?", "تمام. فيه حاجة تانية لازم أعرفها؟"], ["B", "Just that we're running low on sample bags.", "بس إن أكياس العينات قرّبت تخلص."]],
      qs: [{ q: "How long did line two stop?", o: ["20 minutes", "2 hours", "3 hours", "10 minutes"], a: "20 minutes" }, { q: "What caused the stop?", o: ["The labeling machine jammed", "A power cut", "No raw materials", "A worker was sick"], a: "The labeling machine jammed" }, { q: "What are they running low on?", o: ["Sample bags", "Labels", "Gloves", "Raw materials"], a: "Sample bags" }] },
    { k: "dl-update", t: "تحديث للمدير", lv: "B1", lines: [
      ["A", "Morning. Where are we with the complaint from Al-Noor supermarket?", "صباح الخير. وصلنا لفين في شكوى سوبر ماركت النور؟"], ["B", "We tested the retained samples from that batch. They were all within spec.", "حللنا العينات المحتجزة من الدفعة دي. كلها كانت جوه المواصفة."], ["A", "So what do you think went wrong?", "أمال إيه اللي حصل في رأيك؟"], ["B", "Most likely a storage problem at the store. Their fridge temperature was eight degrees.", "غالبًا مشكلة تخزين في المحل. حرارة التلاجة عندهم كانت ٨ درجات."], ["A", "Have you told them?", "قلتلهم؟"], ["B", "Not yet. I wanted to check with you first.", "لسه. كنت عايز أتأكد معاك الأول."], ["A", "OK, send them a polite email today, and copy the sales team.", "تمام، ابعتلهم إيميل مؤدب النهارده، وحط فريق المبيعات نسخة."], ["B", "Will do. I'll send you a draft before lunch.", "حاضر. هبعتلك مسودة قبل الغدا."]],
      qs: [{ q: "What did the retained samples show?", o: ["They were within specification", "They were contaminated", "They were underweight", "They were missing"], a: "They were within specification" }, { q: "What is the most likely cause?", o: ["Bad storage at the store", "A production mistake", "A supplier problem", "A labeling error"], a: "Bad storage at the store" }, { q: "When will B send the draft?", o: ["Before lunch", "Tomorrow", "After the meeting", "Next week"], a: "Before lunch" }] },
    { k: "dl-supplier", t: "مكالمة مورد", lv: "B1", lines: [
      ["A", "Hello, Fresh Dairy, Khalid speaking.", "ألو، فريش ديري، معاك خالد."], ["B", "Hi Khalid, it's Mahmoud from quality. I'm calling about this morning's milk delivery.", "أهلاً خالد، معاك محمود من الجودة. بكلمك بخصوص شحنة اللبن الصبح."], ["A", "Is there a problem?", "فيه مشكلة؟"], ["B", "Yes, the acidity was higher than our limit, so we couldn't accept it.", "أيوه، الحموضة كانت أعلى من الحد بتاعنا، فمقدرناش نقبلها."], ["A", "I'm sorry about that. Can we replace it this afternoon?", "آسف على كده. ينفع نبدلها بعد الضهر؟"], ["B", "That would be great. Before 2 p.m. if possible, please.", "يبقى ممتاز. قبل الساعة ٢ لو ينفع."], ["A", "No problem. I'll also check what happened on our side.", "مفيش مشكلة. وكمان هشوف إيه اللي حصل عندنا."], ["B", "Thanks. Please send me a short report by Thursday.", "شكرًا. ابعتلي تقرير قصير لحد الخميس."]],
      qs: [{ q: "Why was the milk rejected?", o: ["High acidity", "High temperature", "Wrong labels", "Late delivery"], a: "High acidity" }, { q: "When should the replacement arrive?", o: ["Before 2 p.m.", "Tomorrow morning", "On Thursday", "At 4 p.m."], a: "Before 2 p.m." }, { q: "What does Mahmoud want by Thursday?", o: ["A short report", "A refund", "A new contract", "A visit"], a: "A short report" }] },
    { k: "dl-audit", t: "سؤال مدقق", lv: "B1", lines: [
      ["A", "Can you explain how you control allergens on this line?", "ممكن تشرحلي بتتحكموا في مسببات الحساسية على الخط ده إزاي؟"], ["B", "Sure. We run products with nuts at the end of the day.", "أكيد. بنشغّل المنتجات اللي فيها مكسرات في آخر اليوم."], ["A", "And what happens after that?", "وبعدها بيحصل إيه؟"], ["B", "We do a full wet clean, and then we test the surfaces with allergen swabs.", "بنعمل تنظيف كامل بالمية، وبعدين بنختبر الأسطح بمسحات الحساسية."], ["A", "What if a swab is positive?", "ولو مسحة طلعت إيجابية؟"], ["B", "We clean again and re-test. We don't start production until it's negative.", "بننضف تاني ونعيد الاختبار. مبنبدأش إنتاج غير لما تطلع سلبية."], ["A", "Is the cleaning method validated?", "طريقة التنظيف متصدّق عليها؟"], ["B", "Yes, we validated it last year. I can show you the study.", "أيوه، صدّقنا عليها السنة اللي فاتت. أقدر أوريك الدراسة."]],
      qs: [{ q: "When do they run products with nuts?", o: ["At the end of the day", "First thing in the morning", "Only on weekends", "Never"], a: "At the end of the day" }, { q: "What do they do if a swab is positive?", o: ["Clean again and re-test", "Start production anyway", "Throw away the product", "Call the auditor"], a: "Clean again and re-test" }, { q: "What can B show the auditor?", o: ["The validation study", "The supplier list", "A new machine", "The sales report"], a: "The validation study" }] },
    { k: "dl-new", t: "زميل جديد", lv: "A2", lines: [
      ["A", "Hi, I'm Lina. It's my first day in the lab.", "أهلاً، أنا لينا. ده أول يوم ليا في المعمل."], ["B", "Welcome, Lina! I'm Mahmoud. I work in QC on the production floor.", "أهلاً يا لينا! أنا محمود. بشتغل في الجودة على أرض الإنتاج."], ["A", "Nice to meet you. So we'll work together a lot?", "اتشرفت بيك. يعني هنشتغل سوا كتير؟"], ["B", "Yes, I'll bring you samples every two hours.", "أيوه، هجيبلك عينات كل ساعتين."], ["A", "Great. Where do I find the sample forms?", "تمام. ألاقي فورم العينات فين؟"], ["B", "They're in the blue folder next to the fridge.", "في الملف الأزرق جنب التلاجة."], ["A", "Thanks! And what time is lunch?", "شكرًا! والغدا الساعة كام؟"], ["B", "At one. Come with us, we'll show you the canteen.", "الساعة واحدة. تعالي معانا، هنوريكي الكانتين."]],
      qs: [{ q: "Where does Lina work?", o: ["In the lab", "On the production floor", "In the warehouse", "In sales"], a: "In the lab" }, { q: "How often will Mahmoud bring samples?", o: ["Every two hours", "Every hour", "Twice a day", "Once a day"], a: "Every two hours" }, { q: "Where are the sample forms?", o: ["In the blue folder next to the fridge", "On Mahmoud's desk", "In the canteen", "In the manager's office"], a: "In the blue folder next to the fridge" }] },
    { k: "dl-ncr", t: "منتج غير مطابق", lv: "B2", lines: [
      ["A", "I've just seen the NCR for batch 5521. How serious is it?", "لسه شايف تقرير عدم المطابقة لدفعة ٥٥٢١. قد إيه خطير؟"], ["B", "It's a minor issue. The date code is printed slightly off-center, but it's still readable.", "مشكلة بسيطة. كود التاريخ متطبع مايل شوية عن النص، بس لسه مقروء."], ["A", "So it's not a food safety risk.", "يعني مش خطر على سلامة الغذاء."], ["B", "No, it's a quality issue only. I'd suggest releasing it under concession.", "لأ، مشكلة جودة بس. أقترح نفرج عنها بموافقة استثنائية."], ["A", "Who needs to sign the concession?", "مين لازم يوقّع على الموافقة الاستثنائية؟"], ["B", "The QA manager and the sales manager, since the customer might notice.", "مدير الجودة ومدير المبيعات، لأن العميل ممكن يلاحظ."], ["A", "And how do we stop it from happening again?", "وإزاي نمنع إنها تتكرر؟"], ["B", "We'll add a printer check to the start-up checklist.", "هنضيف فحص للطابعة في شيك ليست بداية التشغيل."]],
      qs: [{ q: "What is wrong with batch 5521?", o: ["The date code is off-center", "The product is contaminated", "The packs are underweight", "The label is missing"], a: "The date code is off-center" }, { q: "What does B suggest?", o: ["Release it under concession", "Destroy the batch", "Rework everything", "Send it back to the supplier"], a: "Release it under concession" }, { q: "How will they prevent it?", o: ["Add a printer check at start-up", "Buy a new printer", "Train the sales team", "Stop using date codes"], a: "Add a printer check at start-up" }] },
    { k: "dl-leave", t: "طلب إجازة", lv: "A2", lines: [
      ["A", "Excuse me, do you have a minute?", "لو سمحت، عندك دقيقة؟"], ["B", "Sure, what's up?", "أكيد، فيه إيه؟"], ["A", "I'd like to take a week off next month to visit my family in Egypt.", "حابب آخد أسبوع إجازة الشهر الجاي عشان أزور أهلي في مصر."], ["B", "Which week are you thinking of?", "بتفكر في أنهي أسبوع؟"], ["A", "From the 10th to the 17th, if that's OK.", "من ١٠ لـ ١٧، لو ده مناسب."], ["B", "Let me check the schedule. Who will cover your shift?", "خليني أشوف الجدول. مين هيغطي ورديتك؟"], ["A", "Ahmed said he can cover for me.", "أحمد قال إنه يقدر يغطي مكاني."], ["B", "Then it should be fine. Send me the request by email.", "يبقى غالبًا تمام. ابعتلي الطلب على الإيميل."]],
      qs: [{ q: "Why does A want leave?", o: ["To visit family", "To study", "Because he is sick", "To move house"], a: "To visit family" }, { q: "Who will cover the shift?", o: ["Ahmed", "The manager", "Lina", "Nobody"], a: "Ahmed" }, { q: "What should A do next?", o: ["Send the request by email", "Buy a ticket", "Talk to HR", "Wait until next month"], a: "Send the request by email" }] },
    { k: "dl-doctor", t: "في الصيدلية", lv: "A2", lines: [
      ["A", "Hi, can I help you?", "أهلاً، أقدر أساعدك؟"], ["B", "Yes, I have a sore throat and a slight fever.", "أيوه، عندي التهاب في الزور وسخونية خفيفة."], ["A", "How long have you had it?", "بقالك قد إيه كده؟"], ["B", "Since yesterday evening.", "من امبارح بالليل."], ["A", "Are you allergic to any medicine?", "عندك حساسية من أي دوا؟"], ["B", "No, I'm not.", "لأ، معنديش."], ["A", "Take these lozenges three times a day, and this for the fever.", "خد الأقراص دي ٣ مرات في اليوم، وده للسخونية."], ["B", "Thanks. Should I see a doctor?", "شكرًا. لازم أروح لدكتور؟"], ["A", "If you don't feel better in three days, yes.", "لو مبقيتش أحسن خلال ٣ أيام، أيوه."]],
      qs: [{ q: "What is B's problem?", o: ["A sore throat and a slight fever", "A headache", "A stomach ache", "A broken arm"], a: "A sore throat and a slight fever" }, { q: "How often should B take the lozenges?", o: ["Three times a day", "Once a day", "Every hour", "Twice a week"], a: "Three times a day" }, { q: "When should B see a doctor?", o: ["If not better in three days", "Today", "Never", "After one week"], a: "If not better in three days" }] },
    { k: "dl-weekend", t: "خطط الويك إند", lv: "A2", lines: [
      ["A", "Any plans for the weekend?", "عندك خطط للويك إند؟"], ["B", "Not really. Maybe I'll just rest. It's been a long week.", "مش أوي. يمكن أرتاح بس. الأسبوع كان طويل."], ["A", "We're going to the beach on Friday. Do you want to come?", "إحنا رايحين البحر يوم الجمعة. تحب تيجي؟"], ["B", "That sounds nice! What time are you leaving?", "حلو! هتتحركوا الساعة كام؟"], ["A", "Around four, after the heat goes down.", "حوالي ٤، بعد ما الحر يهدى."], ["B", "Great. Should I bring anything?", "تمام. أجيب حاجة معايا؟"], ["A", "Just some drinks, if you can.", "شوية مشروبات بس لو تقدر."], ["B", "Sure. See you on Friday!", "أكيد. أشوفك الجمعة!"]],
      qs: [{ q: "Where are they going?", o: ["To the beach", "To the mall", "To a restaurant", "To the gym"], a: "To the beach" }, { q: "What time are they leaving?", o: ["Around four", "At noon", "In the morning", "At eight"], a: "Around four" }, { q: "What will B bring?", o: ["Drinks", "Food", "Chairs", "Nothing"], a: "Drinks" }] },
    { k: "dl-training", t: "تدريب العمال", lv: "B1", lines: [
      ["A", "We've had three hygiene findings this month. I think we need refresher training.", "طلعلنا ٣ ملاحظات نظافة الشهر ده. أعتقد محتاجين تدريب تنشيطي."], ["B", "I agree. Most of them were about hand washing, right?", "متفق. أغلبهم كانوا عن غسيل الإيدين، صح؟"], ["A", "Exactly. And one was about jewelry.", "بالظبط. وواحدة كانت عن الإكسسوارات."], ["B", "Could we do short sessions at the start of each shift?", "ينفع نعمل جلسات قصيرة في أول كل وردية؟"], ["A", "Good idea. Fifteen minutes is enough.", "فكرة كويسة. ربع ساعة كفاية."], ["B", "I can prepare the slides and a short quiz.", "أقدر أجهز السلايدز واختبار قصير."], ["A", "Perfect. Let's start next Sunday and keep a record of attendance.", "ممتاز. نبدأ الأحد الجاي ونسجل الحضور."]],
      qs: [{ q: "How many hygiene findings were there?", o: ["Three", "One", "Five", "Ten"], a: "Three" }, { q: "How long will each session be?", o: ["Fifteen minutes", "One hour", "Half a day", "Five minutes"], a: "Fifteen minutes" }, { q: "What will B prepare?", o: ["Slides and a short quiz", "A video", "New gloves", "A report for the auditor"], a: "Slides and a short quiz" }] }
  ];

  // Work writing templates: fields fill {placeholders}; every field has an example.
  var TEMPLATES = [
    { k: "tp-supplier", t: "إيميل لمورد عن شحنة مرفوضة", ico: "mail", f: [
      ["name", "اسم المورد", "Khalid"], ["date", "تاريخ الشحنة", "5 November"], ["item", "الخامة", "fresh milk"], ["reason", "سبب الرفض (بالإنجليزي)", "the temperature was 9°C, and our limit is 4°C"], ["deadline", "آخر معاد للرد", "Thursday"], ["me", "اسمك", "Mahmoud Hegazy"]],
      body: "Subject: Rejected delivery – {item} – {date}\n\nDear {name},\n\nI hope you're doing well.\n\nI'm writing to inform you that we had to reject your delivery of {item} on {date}, because {reason}.\n\nCould you please:\n1. Send a replacement as soon as possible.\n2. Investigate the root cause and send us a corrective action plan by {deadline}.\n\nPlease note that repeated issues may affect your supplier evaluation.\n\nThank you for your cooperation.\n\nBest regards,\n{me}\nQuality Control",
      tips: ["I'm writing to inform you that … = افتتاحية رسمية مهذبة", "Could you please … = طلب مهذب", "Please note that … = تنبيه رسمي من غير حدة"] },
    { k: "tp-daily", t: "التقرير اليومي للجودة", ico: "chart", f: [
      ["date", "التاريخ", "5 November"], ["batches", "عدد الدفعات اللي اتفحصت", "12"], ["passed", "عدد الدفعات المطابقة", "11"], ["issue", "المشكلة (بالإنجليزي)", "batch 2417 had underweight packs (6/20 samples)"], ["action", "الإجراء (بالإنجليزي)", "the batch was put on hold and the filling machine was adjusted"], ["next", "المطلوب بكرة (بالإنجليزي)", "100% sorting of batch 2417"]],
      body: "Daily Quality Report – {date}\n\nSummary:\n- Batches inspected: {batches}\n- Batches released: {passed}\n\nIssues:\n- {issue}.\n\nActions taken:\n- {action}.\n\nNext steps:\n- {next}.\n\nOverall, all other results were within specification.",
      tips: ["Batches inspected / released = المفحوص / المفرج عنه", "was put on hold = اتحجز (مبني للمجهول = أسلوب التقارير)", "Overall, … = جملة ختام بتلخص اليوم"] },
    { k: "tp-ncr", t: "تقرير عدم مطابقة (NCR)", ico: "flag", f: [
      ["no", "رقم التقرير", "NCR-2026-041"], ["product", "المنتج / الدفعة", "Yogurt 170g, batch 5521"], ["desc", "وصف المشكلة (بالإنجليزي)", "the date code is printed off-center on about 30% of the cups"], ["cause", "السبب الجذري (بالإنجليزي)", "the printer head was not checked at start-up"], ["corr", "التصحيح الفوري (بالإنجليزي)", "the batch was held and inspected 100%"], ["ca", "الإجراء التصحيحي (بالإنجليزي)", "add a printer check to the start-up checklist and train operators"]],
      body: "Non-Conformance Report: {no}\n\nProduct / Batch: {product}\n\nDescription:\n{desc}.\n\nRoot cause:\n{cause}.\n\nCorrection (immediate action):\n{corr}.\n\nCorrective action (to prevent recurrence):\n{ca}.\n\nRisk assessment: quality issue only – no food safety impact.\nStatus: Open – to be verified after two weeks.",
      tips: ["Correction ≠ Corrective action: التصحيح الفوري غير منع التكرار", "to prevent recurrence = عشان منتكررش", "to be verified = هيتم التحقق (أسلوب رسمي)"] },
    { k: "tp-minutes", t: "ملخص اجتماع بالإيميل", ico: "users", f: [
      ["topic", "موضوع الاجتماع", "Weekly quality meeting"], ["p1", "قرار ١ (بالإنجليزي)", "refresher hygiene training will start next Sunday"], ["p2", "قرار ٢ (بالإنجليزي)", "the check-weigher will be calibrated on Tuesday"], ["who", "المسؤول عن المتابعة", "Ahmed"], ["next", "الاجتماع الجاي", "next Monday at 10 a.m."]],
      body: "Subject: Summary – {topic}\n\nHi all,\n\nThanks for attending today's meeting. Here's a quick summary of what we agreed:\n\n1. {p1}.\n2. {p2}.\n\n{who} will follow up on these actions.\n\nOur next meeting is {next}.\n\nPlease let me know if I missed anything.\n\nBest regards",
      tips: ["Here's a quick summary of what we agreed = افتتاحية ملخص", "will follow up on = هيتابع", "Please let me know if I missed anything = ختام مهذب"] },
    { k: "tp-request", t: "طلب من مديرك (تدريب / إجازة)", ico: "pen", f: [
      ["boss", "اسم المدير", "Mr. Omar"], ["what", "الطلب (بالإنجليزي)", "attend an ISO 22000 internal auditor course"], ["when", "الموعد", "15–17 December"], ["why", "الفايدة (بالإنجليزي)", "it will help me support our internal audit program"], ["cover", "مين هيغطي (بالإنجليزي)", "Ahmed has agreed to cover my shifts"]],
      body: "Dear {boss},\n\nI'd like to request your approval to {what} on {when}.\n\nI believe {why}.\n\n{cover}, so the work will not be affected.\n\nPlease let me know if you need any further information.\n\nThank you for considering my request.\n\nBest regards",
      tips: ["I'd like to request your approval to … = طلب رسمي", "I believe … = بيقدّم السبب بثقة", "Thank you for considering my request = ختام مهذب للطلبات"] },
    { k: "tp-interview", t: "إجابة «عرّفنا بنفسك» في مقابلة", ico: "mic", f: [
      ["years", "سنين الخبرة", "three"], ["field", "المجال", "food manufacturing"], ["now", "شغلك الحالي (بالإنجليزي)", "I'm responsible for in-process and final product inspection"], ["win", "إنجاز (بالإنجليزي)", "I reduced underweight complaints by about 50% by fixing a filling problem"], ["goal", "هدفك (بالإنجليزي)", "grow into a quality assurance role with more responsibility for food safety systems"]],
      body: "I'm a quality control specialist with {years} years of experience in {field}.\n\nCurrently, {now}.\n\nOne thing I'm proud of is that {win}.\n\nI'm detail-oriented, and I work closely with production to solve problems quickly.\n\nNow, I'd like to {goal}.",
      tips: ["الإجابة: الحاضر ← إنجاز ← نقط قوة ← هدفك", "One thing I'm proud of is … = بتقدم إنجاز من غير غرور", "قولها بصوتك ٣ مرات لحد ما تطلع طبيعية"], speak: true }
  ];

  // One fixed prompt, so week-over-week recordings are comparable.
  var WEEKLY_PROMPT = ["Talk about your job: what you do, what a typical day looks like, and a challenge you faced recently.", "اتكلم عن شغلك: بتعمل إيه، يومك العادي عامل إزاي، وتحدي واجهته مؤخرًا."];
  var LINKERS2 = ["because", "so", "but", "however", "also", "then", "for example", "first", "after that", "finally", "actually", "although", "which", "when", "if"];

  // "أقدر أعمل كذا" ladder — each item is checked automatically from real activity.
  // c: [type, arg, min]: talk = scene best stars ≥ min; tp = template used; dl = dialogues
  // passed ≥ min; wk = a weekly recording with ≥ min words; wkl = with ≥ min linkers;
  // ck = phrases at stage ≥ 3 ≥ min; pl = placement level ≥ arg.
  var CANDO = [
    { lv: "A2", t: "أقدر أعرّف بنفسي وبشغلي", c: [["talk", "qc-job", 2]] },
    { lv: "A2", t: "أقدر أدردش دردشة خفيفة مع زميل", c: [["talk", "d-break", 2]] },
    { lv: "A2", t: "أقدر أتصرف في المطعم والتاكسي", c: [["talk", "d-order", 2], ["talk", "d-taxi", 2]] },
    { lv: "A2", t: "أقدر أفهم حوارات قصيرة لما أسمعها", c: [["dl", null, 2]] },
    { lv: "B1", t: "أقدر أدي تحديث في اجتماع", c: [["talk", "qc-meeting", 2]] },
    { lv: "B1", t: "أقدر أبلّغ عن مشكلة على الخط وأطلب إجراء", c: [["talk", "qc-defect", 2]] },
    { lv: "B1", t: "أقدر أكلم مورد وأطلب إجراء تصحيحي", c: [["talk", "qc-supplier", 2], ["tp", "tp-supplier"]] },
    { lv: "B1", t: "أقدر أكتب تقرير يومي وتقرير عدم مطابقة", c: [["tp", "tp-daily"], ["tp", "tp-ncr"]] },
    { lv: "B1", t: "أقدر أتعامل مع شكوى عميل", c: [["talk", "qc-complaint", 2]] },
    { lv: "B1", t: "أقدر أفهم حوار شغل كامل من غير ترجمة", c: [["dl", null, 6]] },
    { lv: "B1", t: "أقدر أتكلم دقيقة متواصلة عن شغلي", c: [["wk", null, 60]] },
    { lv: "B2", t: "أقدر أرد على أسئلة مدقق بثقة", c: [["talk", "qc-audit", 3]] },
    { lv: "B2", t: "أقدر أعدّي مقابلة شغل بالإنجليزي", c: [["talk", "qc-interview", 3], ["tp", "tp-interview"]] },
    { lv: "B2", t: "أقدر أتكلم دقيقة بطلاقة وأربط أفكاري", c: [["wk", null, 90], ["wkl", null, 4]] },
    { lv: "B2", t: "أقدر أستخدم ١٥٠ عبارة من عبارات الشغل", c: [["ck", null, 150]] }
  ];

  // Everyday phrases (formerly «جمل يومية»): [english, arabic, when to say it].
  var LIFE_CATS = [
    { k: "p-greet", t: "التحيات والدردشة", life: 1, l: [
      ["How's it going?","عامل إيه؟ أخبارك إيه؟","لما تقابل حد تعرفه"],
      ["Long time no see!","بقالي كتير مشفتكش!","لما تقابل حد بعد غياب طويل"],
      ["What have you been up to?","كنت بتعمل إيه الفترة اللي فاتت؟","لما تسأل حد عن أخباره بعد غياب"],
      ["Nice to meet you.","اتشرفت بمعرفتك.","لما تتعرف على حد لأول مرة"],
      ["I've heard a lot about you.","سمعت عنك كتير.","لما تقابل حد اتكلموا عنه قدامك قبل كده"],
      ["Take care, see you soon.","خلّي بالك من نفسك، أشوفك قريب.","وإنت بتودّع حد"],
      ["Have a nice weekend!","ويك إند سعيد!","آخر يوم في أسبوع الشغل وإنت مروّح"],
      ["Say hi to your family for me.","سلّملي على أهلك.","وإنت بتودّع صاحبك"],
      ["Sorry, I didn't catch your name.","آسف، ملحقتش أسمع اسمك.","لما حد قال اسمه وإنت مسمعتهوش كويس"],
      ["It was great to see you.","كان جميل إني شفتك.","في آخر مقابلة حلوة مع حد"]] },
    { k: "p-work", t: "في الشغل", life: 1, l: [
      ["I'll get back to you on that.","هرجعلك في الموضوع ده.","لما تتسأل سؤال ومحتاج وقت تتأكد"],
      ["Could you send me the details by email?","ممكن تبعتلي التفاصيل على الإيميل؟","لما حد يشرحلك حاجة كبيرة بالكلام"],
      ["I'm working on it right now.","أنا شغال عليها دلوقتي.","لما مديرك يسأل عن مهمة لسه بتعملها"],
      ["Let me check and let you know.","خليني أتأكد وأقولك.","لما مش متأكد من معلومة"],
      ["Can we schedule a meeting for tomorrow?","ممكن نحدد اجتماع بكرة؟","لما محتاج تقعد مع حد تتكلموا"],
      ["I need a little more time to finish this.","محتاج وقت زيادة شوية عشان أخلّص ده.","لما الديدلاين قرّب ومش هتلحق"],
      ["That's a good point.","دي نقطة كويسة.","لما زميلك يقول فكرة مقنعة في نقاش"],
      ["Could you walk me through it?","ممكن تشرحهالي خطوة خطوة؟","لما حاجة جديدة عليك ومحتاج شرح مفصّل"],
      ["I'm afraid I can't make it to the meeting.","للأسف مش هقدر أحضر الاجتماع.","لما تعتذر عن اجتماع بأدب"],
      ["Thanks for your help, I really appreciate it.","شكرًا على مساعدتك، بجد مقدّر ده.","لما زميل ساعدك في حاجة"]] },
    { k: "p-food", t: "المطعم والكافيه", life: 1, l: [
      ["Can I see the menu, please?","ممكن أشوف المنيو لو سمحت؟","أول ما تقعد في مطعم"],
      ["I'd like a coffee with milk, please.","عايز قهوة بلبن لو سمحت.","وإنت بتطلب في الكافيه"],
      ["What do you recommend?","ترشّحلي إيه؟","لما مش عارف تطلب إيه"],
      ["Could we have the bill, please?","ممكن الحساب لو سمحت؟","لما تخلّص أكل وعايز تدفع"],
      ["Is this table free?","الترابيزة دي فاضية؟","لما تدور على مكان تقعد فيه"],
      ["Can I get this to go?","ممكن آخد ده تيك أواي؟","لما عايز تاخد الأكل معاك"],
      ["I'm allergic to nuts.","عندي حساسية من المكسرات.","لما تنبّه الجرسون لحاجة متأكلهاش"],
      ["This is delicious!","ده طعمه تحفة!","لما الأكل يعجبك"],
      ["Excuse me, this isn't what I ordered.","لو سمحت، ده مش اللي أنا طلبته.","لما يجيلك طلب غلط"],
      ["Can I pay by card?","ينفع أدفع بالكارت؟","قبل ما تدفع ومش معاك كاش"]] },
    { k: "p-shop", t: "التسوق", life: 1, l: [
      ["How much is this?","ده بكام؟","لما تسأل عن سعر حاجة"],
      ["Do you have this in a smaller size?","عندك ده بمقاس أصغر؟","لما اللبس طلع واسع عليك"],
      ["I'm just looking, thanks.","بتفرّج بس، شكرًا.","لما البيّاع يعرض مساعدته وإنت مش محتاج"],
      ["Can I try it on?","ممكن أقيسه؟","لما تحب تجرب هدوم قبل ما تشتري"],
      ["Is there any discount?","فيه أي خصم؟","لما تحاول تاخد سعر أحسن"],
      ["I'll take it.","هاخده.","لما تقرر تشتري"],
      ["Can I return it if it doesn't fit?","ينفع أرجّعه لو مجاش مقاسي؟","قبل ما تدفع وإنت مش متأكد من المقاس"],
      ["Where can I find the milk?","ألاقي اللبن فين؟","في السوبر ماركت ومش لاقي حاجة"],
      ["Could I have a receipt, please?","ممكن الفاتورة لو سمحت؟","بعد ما تدفع ومحتاج إثبات"],
      ["That's a bit too expensive for me.","ده غالي عليّا شوية.","لما السعر أعلى من ميزانيتك"]] },
    { k: "p-move", t: "المواصلات والطريق", life: 1, l: [
      ["Excuse me, how do I get to the station?","لو سمحت، أروح المحطة إزاي؟","لما تكون تايه ومحتاج توصل مكان"],
      ["Is it far from here?","هو بعيد من هنا؟","لما حد يوصفلك مكان"],
      ["Can you take me to this address?","ممكن توصلني العنوان ده؟","وإنت راكب تاكسي"],
      ["How long does it take to get there?","المشوار ده بياخد قد إيه؟","لما تحب تعرف وقت الطريق"],
      ["Turn left at the traffic lights.","لف شمال عند الإشارة.","وإنت بتوصف طريق لحد"],
      ["I'm stuck in traffic, I'll be a bit late.","أنا واقف في الزحمة، هتأخر شوية.","لما هتتأخر على معاد"],
      ["Could you stop here, please?","ممكن تقف هنا لو سمحت؟","لما توصل ومحتاج السواق يقف"],
      ["Which bus goes to downtown?","أنهي أتوبيس بيروح وسط البلد؟","في محطة الأتوبيس"],
      ["It's within walking distance.","المكان قريب، ينفع تروحه مشي.","لما تقول لحد إن المكان قريب"],
      ["I think I'm lost.","أعتقد إني تهت.","لما تكتشف إنك ماشي غلط"]] },
    { k: "p-travel", t: "السفر والفندق", life: 1, l: [
      ["I have a reservation under the name Ahmed.","عندي حجز باسم أحمد.","أول ما توصل الفندق"],
      ["What time is check-out?","معاد تسليم الأوضة الساعة كام؟","لما تحب تعرف لازم تمشي إمتى"],
      ["Is breakfast included?","الفطار ضمن الحجز؟","لما تسأل عن الفطار في الفندق"],
      ["Where is the boarding gate?","فين بوابة ركوب الطيارة؟","في المطار وبتدور على البوابة"],
      ["My luggage didn't arrive.","شنطي موصلتش.","لما شنطتك متطلعش على السير"],
      ["Could I have a window seat?","ممكن كرسي جنب الشباك؟","وإنت بتعمل تشيك إن"],
      ["The air conditioning isn't working.","التكييف مش شغال.","لما فيه مشكلة في الأوضة"],
      ["Can you recommend a good place to visit?","ترشّحلي مكان حلو أزوره؟","لما تسأل موظف الاستقبال عن أماكن"],
      ["I'm here on business.","أنا هنا في شغل.","لما حد يسألك في المطار جاي ليه"],
      ["Could you call me a taxi, please?","ممكن تطلبلي تاكسي لو سمحت؟","في الاستقبال قبل ما تخرج"]] },
    { k: "p-phone", t: "التليفون والمواعيد", life: 1, l: [
      ["Hello, this is Ahmed speaking.","ألو، معاك أحمد.","أول ما تتصل في مكالمة رسمية"],
      ["Could you speak a little slower, please?","ممكن تتكلم أبطأ شوية لو سمحت؟","لما اللي بيكلمك سريع ومش فاهمه"],
      ["Can I call you back later?","ممكن أكلمك تاني بعدين؟","لما حد يتصل وإنت مشغول"],
      ["I'd like to book an appointment.","عايز أحجز معاد.","لما تكلم عيادة أو مكان خدمة"],
      ["Does Thursday at 3 work for you?","يناسبك الخميس الساعة 3؟","وإنت بتقترح معاد"],
      ["Sorry, you're breaking up.","آسف، الصوت بيقطع.","لما الشبكة وحشة في المكالمة"],
      ["Can I leave a message?","ممكن أسيب رسالة؟","لما الشخص اللي عايزه مش موجود"],
      ["I need to reschedule our meeting.","محتاج أغيّر معاد اجتماعنا.","لما مش هتقدر تيجي في المعاد المتفق عليه"],
      ["Let me write that down.","استنى أكتب ده.","لما حد بيمليك رقم أو عنوان"],
      ["Thanks for calling, have a good day.","شكرًا على اتصالك، يومك سعيد.","في آخر مكالمة"]] },
    { k: "p-health", t: "الصحة والدكتور", life: 1, l: [
      ["I don't feel well today.","مش حاسس إني كويس النهارده.","لما تكون تعبان"],
      ["I have a headache.","عندي صداع.","لما راسك وجعاك"],
      ["I've had a fever since yesterday.","عندي سخونية من امبارح.","وإنت بتشرح للدكتور من إمتى تعبان"],
      ["How often should I take this medicine?","آخد الدوا ده كل قد إيه؟","لما الدكتور يكتبلك علاج"],
      ["I need to take a sick day.","محتاج آخد يوم أجازة مرضي.","لما تبلّغ شغلك إنك تعبان"],
      ["Is there a pharmacy near here?","فيه صيدلية قريبة من هنا؟","لما تدور على صيدلية"],
      ["It hurts here.","بيوجعني هنا.","وإنت بتشاور للدكتور على مكان الألم"],
      ["I'm feeling much better now.","أنا أحسن بكتير دلوقتي.","لما حد يطمن عليك بعد ما تعبت"],
      ["Get well soon!","ألف سلامة عليك!","لما تعرف إن حد تعبان"],
      ["Do I need a prescription for this?","محتاج روشتة للدوا ده؟","في الصيدلية قبل ما تشتري دوا"]] },
    { k: "p-opinion", t: "الرأي والنقاش", life: 1, l: [
      ["In my opinion, we should wait.","في رأيي، المفروض نستنى.","لما تقول رأيك في قرار"],
      ["I totally agree with you.","أنا متفق معاك تمامًا.","لما حد يقول حاجة إنت مقتنع بيها"],
      ["I see your point, but I think it's risky.","فاهم وجهة نظرك، بس شايف إنها مخاطرة.","لما تختلف مع حد بأدب"],
      ["That makes sense.","ده منطقي.","لما شرح حد يقنعك"],
      ["I'm not sure about that.","أنا مش متأكد من ده.","لما عندك شك في كلام حد"],
      ["What do you think?","إنت رأيك إيه؟","لما تحب تشارك حد في القرار"],
      ["Let's look at it from another angle.","خلينا نبص لها من زاوية تانية.","لما النقاش واقف وعايز تغيّر طريقة التفكير"],
      ["To be honest, I prefer the first option.","بصراحة، أنا أفضّل الاختيار الأول.","لما تختار بين حاجتين بوضوح"],
      ["That's exactly what I meant.","ده بالظبط اللي كنت أقصده.","لما حد يفهم قصدك صح"],
      ["Fair enough.","ماشي، عندك حق.","لما تقبل وجهة نظر حد حتى لو مش موافق تمامًا"]] },
    { k: "p-polite", t: "الطلبات والاعتذار", life: 1, l: [
      ["Could you do me a favor?","ممكن تعملّي خدمة؟","قبل ما تطلب مساعدة من حد"],
      ["Would you mind closing the window?","تمانع تقفل الشباك؟","لما تطلب حاجة بأدب جدًا"],
      ["Sorry for the delay.","آسف على التأخير.","لما ترد متأخر على رسالة أو توصل متأخر"],
      ["My apologies, it was my mistake.","أعتذر، دي كانت غلطتي.","لما تعترف بغلطة في الشغل"],
      ["No worries, it happens.","ولا يهمك، بتحصل.","لما حد يعتذرلك عن حاجة بسيطة"],
      ["Can you give me a hand with this?","ممكن تساعدني في ده؟","لما محتاج مساعدة سريعة"],
      ["Thank you so much, that's very kind of you.","شكرًا جدًا، ده ذوق منك.","لما حد يعمل معاك حاجة لطيفة"],
      ["You're welcome, anytime.","العفو، في أي وقت.","لما حد يشكرك"],
      ["I didn't mean to interrupt.","مكنتش أقصد أقاطعك.","لما تقاطع حد وهو بيتكلم من غير قصد"],
      ["Is it okay if I leave early today?","ينفع أمشي بدري النهارده؟","لما تستأذن من مديرك"]] },
    { k: "p-home", t: "البيت والروتين", life: 1, l: [
      ["I usually wake up at seven.","عادةً بصحى الساعة سبعة.","لما تحكي عن روتينك"],
      ["I'm running late!","أنا متأخر!","لما تكون مستعجل الصبح"],
      ["What's for dinner?","هناكل إيه على العشا؟","لما ترجع البيت جعان"],
      ["I'm exhausted, I need some rest.","أنا مهدود، محتاج أرتاح شوية.","بعد يوم طويل"],
      ["Let's go out this weekend.","يلا نخرج الويك إند ده.","لما تقترح خروجة"],
      ["I'll do it later.","هعملها بعدين.","لما تأجل حاجة"],
      ["Could you turn down the TV?","ممكن توطّي التلفزيون؟","لما الصوت عالي ومش عارف تركز"],
      ["I'm going to bed, good night.","أنا داخل أنام، تصبح على خير.","قبل ما تنام"],
      ["Don't forget to lock the door.","متنساش تقفل الباب.","وإنت بتفكّر حد قبل ما يخرج"],
      ["I'm on my way home.","أنا في الطريق للبيت.","لما حد يسألك إنت فين"]] }
  ];
  CHUNK_CATS = CHUNK_CATS.concat(LIFE_CATS);
