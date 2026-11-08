-- إصلاح: «new row violates row-level security policy for table masar_notify»
-- السبب: شرط "هل ده أدمن؟" كان بيقرا جدول masar_accounts بصلاحيات المستخدم نفسه، وجدول
-- الحسابات عليه حماية بتخفي الصف ده وقت التحقق، فالأدمن كان بيترفض.
-- الحل: دالة صغيرة بتتحقق من الأدمن بصلاحية النظام (security definer) والسياسات بتستخدمها.
-- انسخه كله والصقه في SQL Editor واضغط Run. آمن تشغّله أكتر من مرة.

create or replace function public.masar_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.masar_accounts a
    where a.uid::text = auth.uid()::text and a.role = 'admin'
  );
$$;
revoke all on function public.masar_is_admin() from public;
grant execute on function public.masar_is_admin() to authenticated;

drop policy if exists "masar_notify_select" on public.masar_notify;
create policy "masar_notify_select" on public.masar_notify for select
  using (auth.uid() = user_id or public.masar_is_admin());

drop policy if exists "masar_notify_admin_insert" on public.masar_notify;
create policy "masar_notify_admin_insert" on public.masar_notify for insert
  with check (public.masar_is_admin());

drop policy if exists "masar_notify_admin_update" on public.masar_notify;
create policy "masar_notify_admin_update" on public.masar_notify for update
  using (public.masar_is_admin())
  with check (public.masar_is_admin());

drop policy if exists "masar_push_subs_admin_select" on public.masar_push_subs;
create policy "masar_push_subs_admin_select" on public.masar_push_subs for select
  using (public.masar_is_admin());

-- للتأكد (اختياري): لازم يطلع صف لكل حساب أدمن بـ role = admin
select uid, label, role from public.masar_accounts where role = 'admin';
