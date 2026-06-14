-- ============================================================
-- Lets admins update any profile (e.g. promote a user to 'expert'
-- from the admin Experts panel). Run once in Supabase → SQL Editor.
-- ============================================================
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Also let admins read every profile (for client lookups in the dashboard).
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
  for select using (public.is_admin() or id = auth.uid());
