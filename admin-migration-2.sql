-- شغّل هذا في Supabase: Project -> SQL Editor -> New query -> الصق والصق Run.
-- آمن يتعمل في أي وقت، لأن الكود الحالي (app.js) بيتعامل مع غياب العمودين دول
-- برضه (يرجعهم صفر = بدون هدف مخصص لهذا الحساب)، فمفيش خطر لو اتأخر تشغيله،
-- لكن من غيره لن تعمل خاصية "الهدف اليومي لكل حساب" من تبويب الأدمن "الصلاحيات".
--
-- هذا الملف منفصل عن admin-migration.sql (اللي ضاف courses/sections) لأن هذين
-- العمودين (daily_goal_min, daily_new_word_limit) أضيفا لاحقًا ولم يكونا في تلك
-- الهجرة الأولى — شغّل هذا الملف سواء شغّلت admin-migration.sql قبل كده أو لأ.

alter table masar_accounts
  add column if not exists daily_goal_min      integer,  -- هدف الدقايق اليومي لهذا الحساب (null = الافتراضي العام)
  add column if not exists daily_new_word_limit integer; -- أقصى كلمات جديدة يوميًا لهذا الحساب (null = بلا حد)

-- مثال (اختياري): تحديد هدف 20 دقيقة و15 كلمة جديدة يوميًا لحساب معيّن.
-- عدّل label حسب اسم الحساب عندك بالظبط.
-- update masar_accounts
-- set daily_goal_min = 20,
--     daily_new_word_limit = 15
-- where label = 'الحساب الثانوي';
