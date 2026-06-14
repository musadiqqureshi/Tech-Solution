-- ============================================================
-- Tech Solution Pakistan — Supabase schema + Row-Level Security
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ---------- PROFILES (one row per auth user) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  email      text not null default '',
  company    text,
  phone      text,
  role       text not null default 'client' check (role in ('client','admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever a new auth user signs up.
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

-- Helper: is the current user an admin?
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

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  service       text not null,
  description   text,
  budget        numeric not null default 0,
  deadline      text,
  priority      text not null default 'medium' check (priority in ('low','medium','high')),
  status        text not null default 'pending'
                 check (status in ('pending','approved','in_progress','delivered','completed','rejected')),
  est_cost      numeric not null default 0,
  est_profit    numeric not null default 0,
  breakdown     jsonb,
  -- delivery
  delivery_type text check (delivery_type in ('github','gdrive','other')),
  delivery_url  text,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------- MEETINGS ----------
create table if not exists public.meetings (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  order_id   bigint references public.orders(id) on delete set null,
  title      text not null,
  date       date not null,
  time       text not null,
  duration   text not null default '30m',
  timezone   text not null default 'Asia/Karachi',
  status     text not null default 'requested' check (status in ('requested','confirmed','cancelled')),
  created_at timestamptz not null default now()
);

-- ---------- MESSAGES (chat history) ----------
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.orders   enable row level security;
alter table public.meetings enable row level security;
alter table public.messages enable row level security;

-- PROFILES: a user can read/update their own; admins can read all.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid());

-- ORDERS: clients manage their own; admins see + update all.
drop policy if exists "orders read" on public.orders;
create policy "orders read" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders
  for insert with check (user_id = auth.uid());

drop policy if exists "orders update" on public.orders;
create policy "orders update" on public.orders
  for update using (user_id = auth.uid() or public.is_admin());

-- MEETINGS
drop policy if exists "meetings read" on public.meetings;
create policy "meetings read" on public.meetings
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "meetings insert" on public.meetings;
create policy "meetings insert" on public.meetings
  for insert with check (user_id = auth.uid());

drop policy if exists "meetings update" on public.meetings;
create policy "meetings update" on public.meetings
  for update using (user_id = auth.uid() or public.is_admin());

-- MESSAGES
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages
  for insert with check (user_id = auth.uid());

-- ============================================================
-- Make yourself an admin (run AFTER you have signed up once):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================

-- ============================================================
-- LIVE CHAT — client ↔ admin real-time messaging
-- Run this block in Supabase SQL Editor after the initial schema
-- ============================================================

-- chat_messages: all client↔admin messages
create table if not exists public.chat_messages (
  id           bigint generated always as identity primary key,
  room_id      uuid not null,          -- one room per client (= client user_id)
  sender_id    uuid not null references auth.users(id) on delete cascade,
  sender_role  text not null check (sender_role in ('client','admin')),
  content      text not null,
  read_at      timestamptz,            -- null = unread by the other side
  created_at   timestamptz not null default now()
);

create index if not exists chat_messages_room_idx on public.chat_messages(room_id, created_at);

-- online_presence: lightweight heartbeat table
create table if not exists public.online_presence (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'client',
  last_seen  timestamptz not null default now()
);

-- RLS for chat_messages
alter table public.chat_messages enable row level security;

drop policy if exists "chat read own room" on public.chat_messages;
create policy "chat read own room" on public.chat_messages
  for select using (room_id = auth.uid() or public.is_admin());

drop policy if exists "chat insert own room" on public.chat_messages;
create policy "chat insert own room" on public.chat_messages
  for insert with check (
    sender_id = auth.uid() and (room_id = auth.uid() or public.is_admin())
  );

drop policy if exists "chat update read_at" on public.chat_messages;
create policy "chat update read_at" on public.chat_messages
  for update using (room_id = auth.uid() or public.is_admin());

-- RLS for online_presence
alter table public.online_presence enable row level security;

drop policy if exists "presence read all" on public.online_presence;
create policy "presence read all" on public.online_presence
  for select using (true);

drop policy if exists "presence upsert own" on public.online_presence;
create policy "presence upsert own" on public.online_presence
  for all using (user_id = auth.uid());

-- Enable realtime on both tables
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.online_presence;
