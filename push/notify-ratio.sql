-- نسبة الإنجليزي/الذِكر والتكرار لكل حساب (من لوحة الأدمن).
-- انسخه كله والصقه في SQL Editor واضغط Run. آمن تشغّله أكتر من مرة.

alter table public.masar_notify add column if not exists en_pct    smallint not null default 60; -- نسبة الإنجليزي % (والباقي ذِكر)
alter table public.masar_notify add column if not exists every_min smallint not null default 15; -- كل كام دقيقة: 15 / 30 / 60

-- حفظ إعداد حساب (نسخة بالنسبة والتكرار)
create or replace function public.masar_set_notify2(p_user uuid, p_enabled boolean, p_from int, p_to int, p_pct int, p_every int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.masar_is_admin() then
    raise exception 'not admin (uid=%)', coalesce(auth.uid()::text, 'none');
  end if;
  insert into public.masar_notify (user_id, enabled, quiet_from, quiet_to, en_pct, every_min, updated_at)
  values (p_user, p_enabled, greatest(0, least(23, p_from)), greatest(0, least(23, p_to)),
          greatest(0, least(100, p_pct)), case when p_every in (15, 30, 60) then p_every else 15 end, now())
  on conflict (user_id) do update
    set enabled = excluded.enabled, quiet_from = excluded.quiet_from, quiet_to = excluded.quiet_to,
        en_pct = excluded.en_pct, every_min = excluded.every_min, updated_at = now();
end;
$$;

-- قراءة إعدادات كل الحسابات (بالنسبة والتكرار) + عدد الأجهزة
drop function if exists public.masar_admin_notify();
create function public.masar_admin_notify()
returns table (user_id uuid, enabled boolean, quiet_from smallint, quiet_to smallint, en_pct smallint, every_min smallint, devices int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.masar_is_admin() then
    raise exception 'not admin (uid=%)', coalesce(auth.uid()::text, 'none');
  end if;
  return query
    select a.uid::uuid,
           coalesce(n.enabled, false), coalesce(n.quiet_from, 6::smallint), coalesce(n.quiet_to, 14::smallint),
           coalesce(n.en_pct, 60::smallint), coalesce(n.every_min, 15::smallint),
           (select count(*)::int from public.masar_push_subs s where s.user_id::text = a.uid::text)
    from public.masar_accounts a
    left join public.masar_notify n on n.user_id::text = a.uid::text;
end;
$$;

revoke all on function public.masar_set_notify2(uuid, boolean, int, int, int, int) from public;
revoke all on function public.masar_admin_notify() from public;
grant execute on function public.masar_set_notify2(uuid, boolean, int, int, int, int) to authenticated;
grant execute on function public.masar_admin_notify() to authenticated;
