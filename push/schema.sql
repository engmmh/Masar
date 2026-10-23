-- جدول اشتراكات إشعارات مسار (Web Push) — نسخه كله والصقه في SQL Editor بمشروعك على Supabase واضغط Run
create table if not exists public.masar_push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.masar_push_subs enable row level security;

drop policy if exists "masar_push_subs_select_own" on public.masar_push_subs;
create policy "masar_push_subs_select_own" on public.masar_push_subs
  for select using (auth.uid() = user_id);

drop policy if exists "masar_push_subs_insert_own" on public.masar_push_subs;
create policy "masar_push_subs_insert_own" on public.masar_push_subs
  for insert with check (auth.uid() = user_id);

drop policy if exists "masar_push_subs_update_own" on public.masar_push_subs;
create policy "masar_push_subs_update_own" on public.masar_push_subs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "masar_push_subs_delete_own" on public.masar_push_subs;
create policy "masar_push_subs_delete_own" on public.masar_push_subs
  for delete using (auth.uid() = user_id);
