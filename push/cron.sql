-- يجدول نداء دالة الإشعار تلقائيًا، من غير أي موقع خارجي.
-- شغّل ده بعد ما تفعّل pg_cron وpg_net من Database → Extensions.
-- لو الوظيفتين دول متسجلتين قبل كده (daily-push و weekly-report)، الكود ده بيمسحهم ويسجلهم تاني بآخر إعداد.

select cron.unschedule('masar-daily-push') where exists (select 1 from cron.job where jobname = 'masar-daily-push');
select cron.unschedule('masar-weekly-report') where exists (select 1 from cron.job where jobname = 'masar-weekly-report');

-- 1) كلمة/جملة كل ساعة من 2 الضهر لحد 4 الفجر بتوقيت الرياض (15 مرة باليوم)
select cron.schedule(
  'masar-daily-push',
  '0 11-23,0-1 * * *',  -- بتوقيت UTC = من 2 الضهر لحد 4 الفجر بتوقيت الرياض (UTC+3)
  $$
  select net.http_get(
    url := 'https://guorxzejmtvypiwxrogf.supabase.co/functions/v1/masar-send-notification?token=<PUSH_SHARED_SECRET>'
  );
  $$
);

-- 2) ملخص أسبوعي (كلمات اتعلمتها، نقاط، سلسلة المذاكرة) كل جمعة الساعة 6 المغرب بتوقيت الرياض
select cron.schedule(
  'masar-weekly-report',
  '0 15 * * 5',  -- بتوقيت UTC = 6 المغرب الجمعة بتوقيت الرياض (UTC+3)
  $$
  select net.http_get(
    url := 'https://guorxzejmtvypiwxrogf.supabase.co/functions/v1/masar-send-notification?token=<PUSH_SHARED_SECRET>&mode=weekly'
  );
  $$
);

-- للتأكد إن الاتنين اتسجلوا:
select jobid, jobname, schedule, active from cron.job where jobname in ('masar-daily-push', 'masar-weekly-report');
