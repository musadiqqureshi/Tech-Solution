-- ============================================================
-- Tech Solutions — Experts, Task Allocation & Manual Invoices
-- Run this AFTER schema.sql, once, in Supabase → SQL Editor.
-- Designed so experts NEVER see client email/phone or your profit.
-- ============================================================

-- 1) Allow the 'expert' role on profiles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('client','admin','expert'));

-- 2) EXPERTS — team members shown on the hero + optional login account
create table if not exists public.experts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,  -- set to give them a login
  name         text not null,
  title        text not null default 'Specialist',
  bio          text,
  avatar_url   text,
  skills       text[] not null default '{}',
  accent       text not null default 'purple',
  show_on_hero boolean not null default true,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Helper: the experts.id linked to the currently logged-in user (or null)
create or replace function public.current_expert_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.experts where user_id = auth.uid() limit 1;
$$;

-- 3) TASKS — admin allots work to an expert. EXPERT-SAFE columns only:
--    no client email/phone, no client budget, no profit here.
create table if not exists public.tasks (
  id            bigint generated always as identity primary key,
  order_id      bigint references public.orders(id) on delete set null,
  expert_id     uuid references public.experts(id) on delete set null,
  client_alias  text not null default 'Client',     -- what the expert sees (no PII)
  title         text not null,
  description   text,
  service       text,
  expert_budget numeric not null default 0,          -- the budget admin shows the expert
  status        text not null default 'assigned'
                check (status in ('assigned','in_progress','submitted','approved','completed')),
  due_date      date,
  created_at    timestamptz not null default now()
);

-- 4) TASK_FINANCE — the sensitive money side. ADMIN ONLY (separate table so
--    RLS can fully hide profit + the real client link from experts).
create table if not exists public.task_finance (
  task_id       bigint primary key references public.tasks(id) on delete cascade,
  client_id     uuid references auth.users(id) on delete set null,
  client_budget numeric not null default 0,          -- what the client pays
  profit        numeric not null default 0           -- admin-decided: client_budget - expert_budget
);

-- 5) MANUAL_INVOICES — admin generates an invoice by typing client details
create table if not exists public.manual_invoices (
  id            bigint generated always as identity primary key,
  invoice_no    text not null,
  client_name   text not null,
  client_email  text,
  client_company text,
  items         jsonb not null default '[]',          -- [{ description, qty, price }]
  currency      text not null default 'USD',
  subtotal      numeric not null default 0,
  tax           numeric not null default 0,
  total         numeric not null default 0,
  notes         text,
  status        text not null default 'unpaid' check (status in ('unpaid','paid','void')),
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.experts         enable row level security;
alter table public.tasks           enable row level security;
alter table public.task_finance    enable row level security;
alter table public.manual_invoices enable row level security;

-- EXPERTS: public can read those shown on the hero; admins manage all;
-- an expert can read their own record.
drop policy if exists "experts read" on public.experts;
create policy "experts read" on public.experts for select
  using ((show_on_hero and active) or public.is_admin() or user_id = auth.uid());
drop policy if exists "experts admin write" on public.experts;
create policy "experts admin write" on public.experts for all
  using (public.is_admin()) with check (public.is_admin());

-- TASKS: admins do everything; the assigned expert can read + update status.
-- Clients have NO access (they never learn which expert handles them).
drop policy if exists "tasks admin all" on public.tasks;
create policy "tasks admin all" on public.tasks for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "tasks expert read" on public.tasks;
create policy "tasks expert read" on public.tasks for select
  using (expert_id = public.current_expert_id());
drop policy if exists "tasks expert update" on public.tasks;
create policy "tasks expert update" on public.tasks for update
  using (expert_id = public.current_expert_id());

-- TASK_FINANCE: admins only — experts and clients can never read profit.
drop policy if exists "task_finance admin" on public.task_finance;
create policy "task_finance admin" on public.task_finance for all
  using (public.is_admin()) with check (public.is_admin());

-- MANUAL_INVOICES: admins only.
drop policy if exists "invoices admin" on public.manual_invoices;
create policy "invoices admin" on public.manual_invoices for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Promote a user to expert + create their expert profile, e.g.:
--   update public.profiles set role = 'expert' where email = 'ibrahim@example.com';
--   insert into public.experts (user_id, name, title, skills)
--   select id, 'Ibrahim', 'Full-Stack Developer', array['React','Node']
--   from auth.users where email = 'ibrahim@example.com';
-- ============================================================
