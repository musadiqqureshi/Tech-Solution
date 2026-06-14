-- ============================================================
-- Tech Solution Pakistan — FULL Supabase Schema v2
-- Safe to run on a FRESH or EXISTING database (fully idempotent)
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ============================================================
-- 1. HELPER FUNCTION — is_admin()
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ============================================================
-- 2. PROFILES  (one row per auth user, auto-created on signup)
-- ============================================================
create table if not exists public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  name       text        not null default '',
  email      text        not null default '',
  company    text,
  phone      text,
  role       text        not null default 'client' check (role in ('client','admin')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on new signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, company, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. ORDERS
-- ============================================================
create table if not exists public.orders (
  id            bigint      generated always as identity primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  service       text        not null,
  description   text,
  budget        numeric     not null default 0,
  deadline      text,
  priority      text        not null default 'medium'
                            check (priority in ('low','medium','high')),
  status        text        not null default 'pending'
                            check (status in ('pending','approved','in_progress','delivered','completed','rejected')),
  est_cost      numeric     not null default 0,
  est_profit    numeric     not null default 0,
  breakdown     jsonb,
  -- client-supplied file links
  file_link     text,
  file_link_type text       check (file_link_type in ('gdrive','github')),
  -- delivery
  delivery_type text        check (delivery_type in ('github','gdrive','other')),
  delivery_url  text,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 4. MEETINGS
-- ============================================================
create table if not exists public.meetings (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  order_id   bigint      references public.orders(id) on delete set null,
  title      text        not null,
  date       date        not null,
  time       text        not null,
  duration   text        not null default '30m',
  timezone   text        not null default 'Asia/Karachi',
  status     text        not null default 'requested'
                         check (status in ('requested','confirmed','cancelled')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4b. ORDERS — payment status (added for invoicing workflow)
-- ============================================================
alter table public.orders
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid'));
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists paid_marked_by text
  check (paid_marked_by in ('client','admin'));

-- ============================================================
-- 4c. CLIENTS  (admin-managed client directory, no login required)
-- ============================================================
create table if not exists public.clients (
  id         bigint      generated always as identity primary key,
  name       text        not null,
  email      text,
  phone      text,
  company    text,
  notes      text,
  user_id    uuid        references auth.users(id) on delete set null,
  created_by uuid        references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. MESSAGES  (AI assistant history, per user)
-- ============================================================
create table if not exists public.messages (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       text        not null check (role in ('user','assistant')),
  content    text        not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. CHAT MESSAGES  (live client ↔ admin real-time chat)
-- ============================================================
create table if not exists public.chat_messages (
  id          bigint      generated always as identity primary key,
  room_id     uuid        not null,   -- equals the client's user_id (one room per client)
  sender_id   uuid        not null references auth.users(id) on delete cascade,
  sender_role text        not null check (sender_role in ('client','admin')),
  content     text        not null,
  read_at     timestamptz,            -- null = unread by the other party
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_room_idx
  on public.chat_messages(room_id, created_at);

-- ============================================================
-- 7. ONLINE PRESENCE  (heartbeat — updated every ~20 s)
-- ============================================================
create table if not exists public.online_presence (
  user_id   uuid        primary key references auth.users(id) on delete cascade,
  role      text        not null default 'client',
  last_seen timestamptz not null default now()
);

-- ============================================================
-- 8. ROW-LEVEL SECURITY
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.orders         enable row level security;
alter table public.meetings       enable row level security;
alter table public.messages       enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.online_presence enable row level security;
alter table public.clients        enable row level security;

-- ── PROFILES ────────────────────────────────────────────────
drop policy if exists "profiles self read"   on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid());

-- ── ORDERS ──────────────────────────────────────────────────
drop policy if exists "orders read"   on public.orders;
create policy "orders read" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders
  for insert with check (user_id = auth.uid());

drop policy if exists "orders update" on public.orders;
create policy "orders update" on public.orders
  for update using (user_id = auth.uid() or public.is_admin());

-- ── MEETINGS ────────────────────────────────────────────────
drop policy if exists "meetings read"   on public.meetings;
create policy "meetings read" on public.meetings
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "meetings insert" on public.meetings;
create policy "meetings insert" on public.meetings
  for insert with check (user_id = auth.uid());

drop policy if exists "meetings update" on public.meetings;
create policy "meetings update" on public.meetings
  for update using (user_id = auth.uid() or public.is_admin());

-- ── MESSAGES (AI) ───────────────────────────────────────────
drop policy if exists "messages read"   on public.messages;
create policy "messages read" on public.messages
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages
  for insert with check (user_id = auth.uid());

-- ── CHAT MESSAGES (live chat) ────────────────────────────────
drop policy if exists "chat read own room"   on public.chat_messages;
create policy "chat read own room" on public.chat_messages
  for select using (room_id = auth.uid() or public.is_admin());

drop policy if exists "chat insert own room" on public.chat_messages;
create policy "chat insert own room" on public.chat_messages
  for insert with check (
    sender_id = auth.uid()
    and (room_id = auth.uid() or public.is_admin())
  );

drop policy if exists "chat update read_at"  on public.chat_messages;
create policy "chat update read_at" on public.chat_messages
  for update using (room_id = auth.uid() or public.is_admin());

-- ── ONLINE PRESENCE ─────────────────────────────────────────
drop policy if exists "presence read all"  on public.online_presence;
create policy "presence read all" on public.online_presence
  for select using (true);

drop policy if exists "presence upsert own" on public.online_presence;
create policy "presence upsert own" on public.online_presence
  for all using (user_id = auth.uid());

-- ── CLIENTS (admin directory) ────────────────────────────────
drop policy if exists "clients admin all" on public.clients;
create policy "clients admin all" on public.clients
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 9. REALTIME  (enable live subscriptions)
-- ============================================================
do $$
begin
  -- chat_messages
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;

  -- online_presence
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'online_presence'
  ) then
    alter publication supabase_realtime add table public.online_presence;
  end if;
end $$;

-- ============================================================
-- 10. QUICK-REFERENCE NOTES
-- ============================================================
-- Grant yourself admin after first sign-up:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- Tables summary:
--   profiles        — one row per auth user (name, email, company, phone, role)
--   orders          — client project requests (service, budget, status, file links, delivery,
--                      payment_status: unpaid|paid, paid_at, paid_marked_by: client|admin)
--   meetings        — meeting requests (date, time, duration, timezone, status)
--   messages        — AI assistant chat history (role: user | assistant)
--   chat_messages   — live client↔admin chat (room_id = client user_id)
--   online_presence — heartbeat rows for online/offline status (ttl ~45 s)
--   clients         — admin-managed client directory (name, email, phone, company, notes),
--                      for adding/invoicing clients who don't have a portal account
-- ============================================================
