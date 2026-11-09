-- إصلاح «401 unauthorized» من غير ما تنسخ أي سر بإيدك.
-- بيعمل كلمة سر عشوائية جديدة، يحفظها في جدول محمي (محدش يقراه غير السيرفر)،
-- ويعيد جدولة الإشعارات (كل 15 دقيقة + التقرير الأسبوعي) بيها.
-- انسخه كله والصقه في SQL Editor واضغط Run. آمن تشغّله أكتر من مرة.

create table if not exists public.masar_push_cfg (
  key   text primary key,
  value text not null
);
alter table public.masar_push_cfg enable row level security;
-- مفيش أي policy: يعني الموقع والمستخدمين مش بيشوفوه خالص، والدالة بس (بصلاحية السيرفر).

do $$
declare
  tok  text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  base text := 'https://guorxzejmtvypiwxrogf.supabase.co/functions/v1/masar-send-notification?token=';
begin
  insert into public.masar_push_cfg (key, value) values ('cron_token', tok)
    on conflict (key) do update set value = excluded.value;

  perform cron.unschedule(jobname) from cron.job where jobname in ('masar-nudge-15', 'masar-weekly-report', 'masar-daily-push');

  perform cron.schedule('masar-nudge-15', '*/15 * * * *',
    format('select net.http_get(url := %L);', base || tok));
  perform cron.schedule('masar-weekly-report', '0 15 * * 5',
    format('select net.http_get(url := %L);', base || tok || '&mode=weekly'));
end $$;

-- تجربة فورية: بيبعت إشعار دلوقتي (بره ساعات الراحة)
select net.http_get(url := 'https://guorxzejmtvypiwxrogf.supabase.co/functions/v1/masar-send-notification?token=' || value)
from public.masar_push_cfg where key = 'cron_token';

select jobname, schedule, active from cron.job where jobname in ('masar-nudge-15', 'masar-weekly-report');
