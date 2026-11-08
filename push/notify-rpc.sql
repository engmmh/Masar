-- إصلاح نهائي لحفظ إعدادات الإشعارات من لوحة الأدمن.
-- بدل ما الأدمن يكتب في الجدول مباشرة (ويتحكم فيه شروط الحماية)، بيكلّم دوال صغيرة
-- بتتأكد إنه أدمن وبعدين تكتب. ولو مش متعرّف كأدمن، الرسالة هتقول رقم الحساب اللي داخل بيه.
-- انسخه كله والصقه في SQL Editor واضغط Run. آمن تشغّله أكتر من مرة.

create or replace function public.masar_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.masar_accounts a where a.uid::text = auth.uid()::text and a.role = 'admin');
$$;

-- حفظ إعداد حساب (تشغيل/إيقاف + ساعات الراحة)
create or replace function public.masar_set_notify(p_user uuid, p_enabled boolean, p_from int, p_to int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.masar_is_admin() then
    raise exception 'not admin (uid=%)', coalesce(auth.uid()::text, 'none');
  end if;
  insert into public.masar_notify (user_id, enabled, quiet_from, quiet_to, updated_at)
  values (p_user, p_enabled, greatest(0, least(23, p_from)), greatest(0, least(23, p_to)), now())
  on conflict (user_id) do update
    set enabled = excluded.enabled, quiet_from = excluded.quiet_from, quiet_to = excluded.quiet_to, updated_at = now();
end;
$$;

-- قراءة إعدادات كل الحسابات + عدد الأجهزة اللي سمحت بالإشعارات (للأدمن بس)
create or replace function public.masar_admin_notify()
returns table (user_id uuid, enabled boolean, quiet_from smallint, quiet_to smallint, devices int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.masar_is_admin() then
    raise exception 'not admin (uid=%)', coalesce(auth.uid()::text, 'none');
  end if;
  return query
    select a.uid::uuid,
           coalesce(n.enabled, false), coalesce(n.quiet_from, 6::smallint), coalesce(n.quiet_to, 14::smallint),
           (select count(*)::int from public.masar_push_subs s where s.user_id::text = a.uid::text)
    from public.masar_accounts a
    left join public.masar_notify n on n.user_id::text = a.uid::text;
end;
$$;

revoke all on function public.masar_is_admin() from public;
revoke all on function public.masar_set_notify(uuid, boolean, int, int) from public;
revoke all on function public.masar_admin_notify() from public;
grant execute on function public.masar_is_admin() to authenticated;
grant execute on function public.masar_set_notify(uuid, boolean, int, int) to authenticated;
grant execute on function public.masar_admin_notify() to authenticated;
