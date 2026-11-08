-- جدولة إشعار كل 15 دقيقة (بدل الإشعار اللي كان كل ساعة).
-- قبل ما تشغّله: استبدل <PUSH_SHARED_SECRET> بنفس السر اللي حاطه في Secrets بتاعة الدالة.
-- محتاج pg_cron و pg_net مفعّلين (Database → Extensions) — غالبًا مفعّلين من المرة اللي فاتت.

-- يشيل الجدولة القديمة (كل ساعة) لو موجودة
select cron.unschedule('masar-daily-push') where exists (select 1 from cron.job where jobname = 'masar-daily-push');
select cron.unschedule('masar-nudge-15') where exists (select 1 from cron.job where jobname = 'masar-nudge-15');

-- كل 15 دقيقة طول اليوم؛ الدالة نفسها بتتخطّى ساعات الراحة لكل حساب وكل جهاز
select cron.schedule(
  'masar-nudge-15',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://guorxzejmtvypiwxrogf.supabase.co/functions/v1/masar-send-notification?token=<PUSH_SHARED_SECRET>'
  );
  $$
);

-- التقرير الأسبوعي (masar-weekly-report) زي ما هو، مش بنلمسه.

-- للتأكد:
select jobid, jobname, schedule, active from cron.job where jobname in ('masar-nudge-15', 'masar-weekly-report');
