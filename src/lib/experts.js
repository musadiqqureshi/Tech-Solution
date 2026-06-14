import { supabase } from './supabase'

// ---------- Experts ----------
export async function listHeroExperts() {
  const { data, error } = await supabase
    .from('experts').select('id,name,title,bio,avatar_url,skills,accent')
    .eq('show_on_hero', true).eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function listExperts() {
  const { data, error } = await supabase.from('experts').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createExpert({ name, title, bio, skills, accent, showOnHero, userId }) {
  const { data, error } = await supabase.from('experts').insert({
    name,
    title: title || 'Specialist',
    bio: bio || null,
    skills: Array.isArray(skills) ? skills : String(skills || '').split(',').map((s) => s.trim()).filter(Boolean),
    accent: accent || 'purple',
    show_on_hero: showOnHero !== false,
    user_id: userId || null,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateExpert(id, fields) {
  const { data, error } = await supabase.from('experts').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteExpert(id) {
  const { error } = await supabase.from('experts').delete().eq('id', id)
  if (error) throw error
}

// Find a user account by email and promote it to the 'expert' role so they
// land on /app/expert. Returns the auth user id to link to an expert record.
// Requires the admin profiles-update policy (supabase/admin_policies.sql).
export async function linkExpertLogin(email) {
  const { data, error } = await supabase
    .from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No account with that email — ask them to sign up first.')
  const { error: uerr } = await supabase.from('profiles').update({ role: 'expert' }).eq('id', data.id)
  if (uerr) throw new Error('Could not set expert role (run supabase/admin_policies.sql).')
  return data.id
}

// ---------- Tasks (expert-facing) ----------
// Experts only ever see expert-safe columns; RLS hides task_finance entirely.
export async function listMyTasks() {
  const { data, error } = await supabase
    .from('tasks').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateTaskStatus(id, status) {
  const { data, error } = await supabase.from('tasks').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ---------- Tasks (admin) ----------
export async function listAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, experts(name,title), task_finance(client_budget,profit,client_id)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Admin allots a task: expert_budget is shown to the expert; client_budget &
// profit are stored in the admin-only task_finance table.
export async function createTask({ expertId, title, description, service, clientAlias, expertBudget, clientBudget, clientId, dueDate, orderId, order_serial }) {
  const eb = Number(expertBudget) || 0
  const cb = Number(clientBudget) || 0
  const { data: task, error } = await supabase.from('tasks').insert({
    expert_id: expertId,
    title,
    description: description || null,
    service: service || null,
    client_alias: clientAlias || 'Client',
    expert_budget: eb,
    due_date: dueDate || null,
    order_serial: order_serial || null,
    order_id: orderId || null,
  }).select().single()
  if (error) throw error

  const { error: ferr } = await supabase.from('task_finance').insert({
    task_id: task.id,
    client_id: clientId || null,
    client_budget: cb,
    profit: cb - eb,
  })
  if (ferr) throw ferr
  return task
}
