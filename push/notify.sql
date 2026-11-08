-- إشعارات كل 15 دقيقة — نسخه كله والصقه في Supabase: SQL Editor → New query → Run
-- آمن تشغّله أكتر من مرة.

-- 1) جدول إعدادات الإشعارات لكل حساب (الأدمن بس اللي بيفعّل ويحدد ساعات الراحة)
create table if not exists public.masar_notify (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  enabled    boolean not null default false,
  quiet_from smallint not null default 6,   -- بداية الراحة (ساعة 0-23 بتوقيت الجهاز)
  quiet_to   smallint not null default 14,  -- نهاية الراحة (مفيش إشعارات من quiet_from لحد quiet_to)
  updated_at timestamptz not null default now()
);
alter table public.masar_notify enable row level security;

-- التحقق من الأدمن بصلاحية النظام (جدول الحسابات عليه حماية بتخفيه عن المستخدم العادي)
create or replace function public.masar_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.masar_accounts a where a.uid::text = auth.uid()::text and a.role = 'admin');
$$;
revoke all on function public.masar_is_admin() from public;
grant execute on function public.masar_is_admin() to authenticated;

-- صاحب الحساب يقرا إعداده هو بس؛ الأدمن يقرا ويعدّل الكل
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

-- 2) فرق التوقيت لكل جهاز (عشان ساعات الراحة تتحسب بتوقيته هو)
alter table public.masar_push_subs add column if not exists tz numeric;

-- 3) الأدمن يقدر يشوف عدد الأجهزة اللي سمحت بالإشعارات لكل حساب
drop policy if exists "masar_push_subs_admin_select" on public.masar_push_subs;
create policy "masar_push_subs_admin_select" on public.masar_push_subs for select
  using (public.masar_is_admin());
