-- شغّل هذا في Supabase: Project -> SQL Editor -> New query -> الصق والصق Run.
-- آمن يتعمل في أي وقت (حتى قبل رفع index.html الجديد)، لأن الكود الجديد بيتعامل
-- مع غياب العمودين دول برضه (يعتبرهم "يشوف كل حاجة").

alter table masar_accounts
  add column if not exists courses  text[],  -- null = يشوف كل الكورسات
  add column if not exists sections text[];  -- null = يشوف كل الأقسام

-- مثال (اختياري): تقييد الحساب الثانوي على English + ISO 9001 فقط،
-- وإخفاء قسم الحاسبة عنه. عدّل label حسب اسم الحساب عندك بالظبط.
-- update masar_accounts
-- set courses  = '{en,iso}',
--     sections = '{prayer,quran,learn}'
-- where label = 'الحساب الثانوي';

-- ============================================================
-- السبب في إن تبويب "التفاصيل" بيورّي صفر: الـ RLS (صلاحيات القاعدة)
-- على masar_days و masar_meta حاليًا بتسمح لكل حساب يقرا صفوفه هو بس
-- (user_id = auth.uid())، فلما الأدمن يفتح اللوحة ويحاول يقرا بيانات
-- حساب غيره، القاعدة بترجّع له صفوف فاضية تمامًا (مش خطأ، مجرد "مفيش
-- صفوف تقدر تشوفها") — ده اللي ظهر في التشخيص المؤقت (dRows=0).
--
-- الحل: نضيف صلاحية إضافية (بجانب الموجودة، مش بدالها) تسمح بس للحساب
-- اللي دوره "admin" في masar_accounts إنه يقرا كل الصفوف في الجدولين دول.
-- آمن تشغّله في أي وقت (بيتفادى الإضافة لو موجودة بالفعل).
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'masar_days' and policyname = 'admin_read_all_days'
  ) then
    create policy admin_read_all_days on masar_days
      for select
      using (exists (select 1 from masar_accounts a where a.uid = auth.uid() and a.role = 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'masar_meta' and policyname = 'admin_read_all_meta'
  ) then
    create policy admin_read_all_meta on masar_meta
      for select
      using (exists (select 1 from masar_accounts a where a.uid = auth.uid() and a.role = 'admin'));
  end if;
end $$;
