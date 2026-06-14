import { supabase } from './supabase'
import { estimateFinance } from './finance'

// ---------- Orders ----------
export async function createOrder({ userId, service, description, budget, deadline, priority, file_link, file_link_type }) {
  const finance = estimateFinance({ service, budget })
  const { data, error } = await supabase.from('orders').insert({
    user_id: userId,
    service,
    description: description || null,
    budget: Number(budget) || 0,
    deadline: deadline || null,
    priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
    est_cost: finance.estimated_cost,
    est_profit: finance.estimated_profit,
    breakdown: finance.breakdown,
    file_link: file_link || null,
    file_link_type: file_link && ['gdrive', 'github'].includes(file_link_type) ? file_link_type : null,
  }).select().single()
  if (error) throw error
  return data
}

export async function listOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function markDelivered(id, { delivery_type, delivery_url }) {
  const { data, error } = await supabase.from('orders').update({
    delivery_type, delivery_url, status: 'delivered', delivered_at: new Date().toISOString(),
  }).eq('id', id).select().single()
  if (error) throw error
  return data
}

// Mark an order's invoice as paid / unpaid. `markedBy` is 'client' or 'admin'.
export async function setPaymentStatus(id, status, markedBy) {
  const payload = status === 'paid'
    ? { payment_status: 'paid', paid_at: new Date().toISOString(), paid_marked_by: markedBy }
    : { payment_status: 'unpaid', paid_at: null, paid_marked_by: null }
  const { data, error } = await supabase.from('orders').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ---------- Meetings ----------
export async function createMeeting({ userId, title, date, time, duration, timezone, orderId }) {
  // Conflict check for this user.
  const { data: clash } = await supabase.from('meetings')
    .select('id').eq('user_id', userId).eq('date', date).eq('time', time)
  if (clash && clash.length) {
    throw new Error('You already have a meeting at that date & time. Please pick another slot.')
  }
  const { data, error } = await supabase.from('meetings').insert({
    user_id: userId, order_id: orderId || null, title, date, time,
    duration: duration || '30m', timezone: timezone || 'Asia/Karachi',
  }).select().single()
  if (error) throw error
  return data
}

export async function listMeetings() {
  const { data, error } = await supabase.from('meetings').select('*').order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function setMeetingStatus(id, status) {
  const { data, error } = await supabase.from('meetings').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ---------- Profiles (admin) ----------
export async function listClients() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ---------- Client directory (admin-managed, no login required) ----------
export async function listManualClients() {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createManualClient({ name, email, phone, company, notes, createdBy }) {
  const { data, error } = await supabase.from('clients').insert({
    name, email: email || null, phone: phone || null, company: company || null,
    notes: notes || null, created_by: createdBy || null,
  }).select().single()
  if (error) throw error
  return data
}

export async function deleteManualClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
  return true
}

// ---------- Messages ----------
export async function loadMessages(userId) {
  const { data, error } = await supabase.from('messages').select('role,content,created_at')
    .eq('user_id', userId).order('created_at', { ascending: true }).limit(100)
  if (error) throw error
  return data
}

export async function saveMessage(userId, role, content) {
  await supabase.from('messages').insert({ user_id: userId, role, content })
}

// ---------- AI chat (server function) ----------
export async function askAssistant(message, history) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ message, history }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error || 'Assistant unavailable')
  }
  return res.json()
}

// ---------- Google Calendar "add event" link ----------
export function gcalLink({ title, date, time, duration = '30m', timezone = 'Asia/Karachi' }) {
  const mins = /h/i.test(duration) ? (parseInt(duration) || 1) * 60 : (parseInt(duration) || 30)
  const start = new Date(`${date}T${time}:00`)
  if (isNaN(start.getTime())) return null
  const end = new Date(start.getTime() + mins * 60000)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: title, dates: `${fmt(start)}/${fmt(end)}`,
    details: 'Meeting scheduled via Tech Solution Pakistan assistant.', ctz: timezone,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
