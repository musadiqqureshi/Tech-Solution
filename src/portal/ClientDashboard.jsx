import { useEffect, useMemo, useState } from 'react'
import { Plus, CalendarPlus, ExternalLink, Github, HardDrive, Loader2, FileText, MessageCircle, Send, X, Check } from 'lucide-react'
import { useAuth } from './AuthContext'
import { listOrders, createOrder, listMeetings, createMeeting, gcalLink, setPaymentStatus } from '../lib/data'
import { SERVICE_OPTIONS } from '../lib/finance'
import { StatCard, StatusBadge, Priority, Field } from './ui'
import { useCurrency, CurrencyPicker, CurrencyToggle } from './CurrencyContext'
import { fmtMoney } from '../lib/finance'
import { generateInvoice } from '../lib/invoice'
import { supabase } from '../lib/supabase'
import { FinanceAreaChart, monthlySeries } from './FinanceChart'

export default function ClientDashboard({ refreshKey, onChange }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const { currency, setCurrency, rates } = useCurrency()

  const reload = async () => {
    setLoading(true)
    try {
      const [o, m] = await Promise.all([listOrders(), listMeetings()])
      setOrders(o); setMeetings(m)
    } catch (e) { /* RLS or network */ }
    setLoading(false)
  }
  useEffect(() => { if (user) reload() }, [user, refreshKey])

  const totals = useMemo(() => {
    const committed = orders.reduce((s, o) => s + Number(o.budget || 0), 0)
    const delivered = orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length
    const upcoming = meetings.filter((m) => m.status !== 'cancelled').length
    return { committed, delivered, upcoming }
  }, [orders, meetings])

  if (loading) return <div className="grid place-items-center py-20 text-slate-400"><Loader2 className="animate-spin" /></div>

  if (!currency) return <CurrencyPicker onPick={setCurrency} />

  return (
    <div className="space-y-5">
      {/* Stats + currency toggle */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 min-w-0">
          <StatCard label="Total Spend"  value={fmtMoney(totals.committed, currency, rates)} sub="across all orders"   accent="#7c3aed" />
          <StatCard label="Orders"       value={orders.length}                         sub="projects requested"  accent="#2563eb" />
          <StatCard label="Delivered"    value={totals.delivered}                      sub="completed projects"  accent="#0d9488" />
          <StatCard label="Meetings"     value={totals.upcoming}                       sub="scheduled"           accent="#f59e0b" />
        </div>
        <div className="shrink-0 pt-1"><CurrencyToggle /></div>
      </div>

      {orders.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-bold text-slate-900 mb-1">Your spend</h3>
          <p className="text-xs text-slate-400 mb-3">Project budget over the last 6 months</p>
          <FinanceAreaChart
            data={monthlySeries(orders, [{ key: 'spend', field: 'budget' }], { currency, rates, months: 6 })}
            series={[{ key: 'spend', name: 'Spend', color: '#7c3aed' }]}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['overview', 'new order', 'meetings'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize whitespace-nowrap transition-colors ${tab === t ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-purple-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview'   && <OrdersList orders={orders} currency={currency} rates={rates} user={user} onChange={reload} />}
      {tab === 'new order'  && <NewOrder userId={user.id} onCreated={() => { reload(); onChange?.() }} currency={currency} />}
      {tab === 'meetings'   && <Meetings userId={user.id} meetings={meetings} onCreated={() => { reload(); onChange?.() }} />}
    </div>
  )
}

// ── Order card with Invoice + Follow-up ──────────────────────────────────────

function OrdersList({ orders, currency, rates, user, onChange }) {
  const [followUp, setFollowUp] = useState(null) // order being followed up

  if (!orders.length) return (
    <p className="text-slate-500 text-sm py-8 text-center">
      No orders yet. Create one from the "New order" tab or ask the assistant.
    </p>
  )

  return (
    <>
      <div className="space-y-3">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            currency={currency}
            rates={rates}
            user={user}
            onFollowUp={() => setFollowUp(o)}
            onChange={onChange}
          />
        ))}
      </div>

      {/* Follow-up modal */}
      {followUp && (
        <FollowUpModal
          order={followUp}
          user={user}
          onClose={() => setFollowUp(null)}
        />
      )}
    </>
  )
}

function OrderCard({ order: o, currency, rates, user, onFollowUp, onChange }) {
  const { profile } = useAuth()
  const [genBusy, setGenBusy] = useState(false)
  const [payBusy, setPayBusy] = useState(false)

  const handleInvoice = () => {
    setGenBusy(true)
    try { generateInvoice(o, profile, currency, rates) }
    catch (e) { console.error(e) }
    finally { setGenBusy(false) }
  }

  const handleMarkPaid = async () => {
    setPayBusy(true)
    try { await setPaymentStatus(o.id, 'paid', 'client') }
    catch (e) { console.error(e) }
    finally { setPayBusy(false); onChange?.() }
  }

  const isPaid = o.payment_status === 'paid'
  const canInvoice = ['approved', 'in_progress', 'delivered', 'completed'].includes(o.status)

  return (
    <div className="glass-card p-4 sm:p-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">{o.service}</h4>
            <StatusBadge status={o.status} />
            <Priority value={o.priority} />
            {isPaid
              ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-emerald-100 text-emerald-700">paid</span>
              : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-amber-100 text-amber-700">unpaid</span>}
          </div>
          {o.description && (
            <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">{o.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black gradient-text">{fmtMoney(o.budget, currency, rates)}</div>
          {o.deadline && <div className="text-xs text-slate-400 mt-0.5">Due {o.deadline}</div>}
        </div>
      </div>

      {/* Delivery link */}
      {o.delivery_url && (
        <a href={o.delivery_url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 mt-3">
          {o.delivery_type === 'github' ? <Github size={15} /> : <HardDrive size={15} />}
          View delivered project <ExternalLink size={13} />
        </a>
      )}

      {/* Actions row */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
        {/* Generate Invoice */}
        <button
          onClick={handleInvoice}
          disabled={genBusy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors disabled:opacity-50"
        >
          {genBusy ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
          Generate Invoice
        </button>

        {/* Mark as paid */}
        {canInvoice && !isPaid && (
          <button
            onClick={handleMarkPaid}
            disabled={payBusy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
          >
            {payBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Mark as Paid
          </button>
        )}

        {/* Ask for update */}
        <button
          onClick={onFollowUp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
        >
          <MessageCircle size={13} />
          Ask for Update
        </button>
      </div>
    </div>
  )
}

// ── Follow-up modal ──────────────────────────────────────────────────────────

function FollowUpModal({ order, user, onClose }) {
  const templates = [
    `Hi, I'd like a status update on my ${order.service} project (#${order.id}). Could you let me know the current progress?`,
    `Could you share an estimated completion date for project #${order.id} (${order.service})?`,
    `I wanted to follow up on my project #${order.id}. Are there any blockers or updates I should know about?`,
    `Quick check-in on ${order.service} (#${order.id}) — is everything on track?`,
  ]

  const [message, setMessage] = useState(templates[0])
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const send = async () => {
    if (!message.trim() || busy) return
    setBusy(true); setErr('')
    try {
      // Send as a chat message in the client's room so admin sees it
      const { error } = await supabase.from('chat_messages').insert({
        room_id:     user.id,
        sender_id:   user.id,
        sender_role: 'client',
        content:     message.trim(),
      })
      if (error) throw error
      setSent(true)
    } catch (e) {
      setErr(e.message || 'Failed to send. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Ask for Project Update</h3>
            <p className="text-xs text-slate-500 mt-0.5">{order.service} · #{order.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1"><X size={20} /></button>
        </div>

        {sent ? (
          /* Success state */
          <div className="px-5 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 grid place-items-center mx-auto mb-4">
              <Send size={24} className="text-emerald-600" />
            </div>
            <p className="font-bold text-slate-900 mb-1">Message sent!</p>
            <p className="text-sm text-slate-500">Our team will respond to your update request shortly.</p>
            <button onClick={onClose} className="mt-5 btn-primary !px-6">Done</button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Quick templates */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick templates</p>
              <div className="space-y-2">
                {templates.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(t)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${message === t ? 'border-purple-400 bg-purple-50 text-purple-800' : 'border-slate-200 text-slate-600 hover:border-purple-200 hover:bg-slate-50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom message */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Or write your own</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="contact-input resize-none w-full text-sm"
                placeholder="Type your follow-up message…"
              />
            </div>

            {err && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={send} disabled={busy || !message.trim()} className="flex-1 btn-primary justify-center">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send Update Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── New Order form ───────────────────────────────────────────────────────────

function NewOrder({ userId, onCreated, currency }) {
  const [form, setForm] = useState({
    service: SERVICE_OPTIONS[0], description: '', budget: '',
    deadline: '', priority: 'medium', file_link: '', file_link_type: 'gdrive',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await createOrder({ userId, ...form }); onCreated() }
    catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="glass-card p-4 sm:p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Service">
          <select name="service" value={form.service} onChange={on} className="contact-input">
            {SERVICE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label={`Budget (${currency})`}>
          <input name="budget" type="number" min="0" value={form.budget} onChange={on}
            placeholder={currency === 'PKR' ? 'e.g. 1,400,000' : 'e.g. 5000'} className="contact-input" />
        </Field>
      </div>
      <Field label="Description">
        <textarea name="description" value={form.description} onChange={on} rows={3}
          className="contact-input resize-none" placeholder="What do you need built?" />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Preferred deadline">
          <input name="deadline" type="date" value={form.deadline} onChange={on} className="contact-input" />
        </Field>
        <Field label="Priority">
          <select name="priority" value={form.priority} onChange={on} className="contact-input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>

      {err && <p className="text-sm text-rose-600">{err}</p>}

      {/* File links */}
      <div className="border-t border-purple-100 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Project Files (optional)</p>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="File type">
            <select name="file_link_type" value={form.file_link_type} onChange={on} className="contact-input">
              <option value="gdrive">Google Drive</option>
              <option value="github">GitHub Repository</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={form.file_link_type === 'gdrive' ? 'Google Drive link' : 'GitHub repo URL'}>
              <input name="file_link" type="url" value={form.file_link} onChange={on} className="contact-input"
                placeholder={form.file_link_type === 'gdrive' ? 'https://drive.google.com/...' : 'https://github.com/...'} />
            </Field>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          {form.file_link_type === 'gdrive'
            ? 'Share your Google Drive folder with view access and paste the link above.'
            : 'Paste your public or shared GitHub repository URL above.'}
        </p>
      </div>

      <button disabled={busy} className="btn-primary w-full justify-center">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Create order
      </button>
    </form>
  )
}

// ── Meetings ─────────────────────────────────────────────────────────────────

function Meetings({ userId, meetings, onCreated }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ title: 'Project discussion', date: today, time: '15:00', duration: '30m' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await createMeeting({ userId, ...form }); onCreated() }
    catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={submit} className="glass-card p-4 sm:p-6 space-y-4 h-fit">
        <h4 className="font-bold text-slate-900">Request a meeting</h4>
        <Field label="Title">
          <input name="title" value={form.title} onChange={on} className="contact-input" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input name="date" type="date" min={today} value={form.date} onChange={on} className="contact-input" required />
          </Field>
          <Field label="Time">
            <input name="time" type="time" value={form.time} onChange={on} className="contact-input" required />
          </Field>
        </div>
        <Field label="Duration">
          <select name="duration" value={form.duration} onChange={on} className="contact-input">
            <option>15m</option><option>30m</option><option>45m</option><option>1h</option>
          </select>
        </Field>
        <p className="text-xs text-slate-400">Timezone: Asia/Karachi (PKT). We'll check for conflicts before booking.</p>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button disabled={busy} className="btn-primary w-full justify-center">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <CalendarPlus size={18} />} Request slot
        </button>
      </form>

      <div className="space-y-3">
        <h4 className="font-bold text-slate-900">Your meetings</h4>
        {!meetings.length && <p className="text-slate-500 text-sm">No meetings yet.</p>}
        {meetings.map((m) => (
          <div key={m.id} className="glass-card p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold text-slate-800 text-sm">{m.title}</div>
              <div className="text-xs text-slate-500">{m.date} · {m.time} · {m.duration} · {m.timezone}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={m.status} />
              <a href={gcalLink(m)} target="_blank" rel="noreferrer"
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 whitespace-nowrap">
                + Calendar
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
