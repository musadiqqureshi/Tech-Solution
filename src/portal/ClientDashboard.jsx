import { useEffect, useMemo, useState } from 'react'
import { Plus, CalendarPlus, ExternalLink, Github, HardDrive, Loader2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import { listOrders, createOrder, listMeetings, createMeeting, gcalLink } from '../lib/data'
import { SERVICE_OPTIONS } from '../lib/finance'
import { StatCard, StatusBadge, Priority, Field } from './ui'
import { useCurrency, CurrencyPicker, CurrencyToggle } from './CurrencyContext'
import { fmtMoney } from '../lib/finance'

export default function ClientDashboard({ refreshKey, onChange }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const { currency, setCurrency } = useCurrency()

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

  // Ask currency preference before showing any financial data
  if (!currency) return <CurrencyPicker onPick={setCurrency} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          <StatCard label="Total Spend" value={fmtMoney(totals.committed, currency)} sub="across all orders" accent="#7c3aed" />
          <StatCard label="Orders" value={orders.length} sub="projects requested" accent="#2563eb" />
          <StatCard label="Delivered" value={totals.delivered} sub="completed projects" accent="#0d9488" />
          <StatCard label="Meetings" value={totals.upcoming} sub="scheduled" accent="#f59e0b" />
        </div>
        <div className="ml-4 shrink-0"><CurrencyToggle /></div>
      </div>

      <div className="flex gap-2">
        {['overview', 'new order', 'meetings'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-purple-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OrdersList orders={orders} currency={currency} />}
      {tab === 'new order' && <NewOrder userId={user.id} onCreated={() => { reload(); onChange?.() }} currency={currency} />}
      {tab === 'meetings' && <Meetings userId={user.id} meetings={meetings} onCreated={() => { reload(); onChange?.() }} />}
    </div>
  )
}

function OrdersList({ orders, currency }) {
  if (!orders.length) return <p className="text-slate-500 text-sm py-8 text-center">No orders yet. Create one from the "New order" tab or ask the assistant.</p>
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="glass-card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900">{o.service}</h4>
                <StatusBadge status={o.status} />
                <Priority value={o.priority} />
              </div>
              {o.description && <p className="text-sm text-slate-500 mt-1 max-w-xl">{o.description}</p>}
            </div>
            <div className="text-right">
              <div className="text-lg font-black gradient-text">{fmtMoney(o.budget, currency)}</div>
            </div>
          </div>
          {o.delivery_url && (
            <a href={o.delivery_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 mt-3">
              {o.delivery_type === 'github' ? <Github size={15} /> : <HardDrive size={15} />} View delivered project <ExternalLink size={13} />
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function NewOrder({ userId, onCreated, currency }) {
  const [form, setForm] = useState({ service: SERVICE_OPTIONS[0], description: '', budget: '', deadline: '', priority: 'medium', file_link: '', file_link_type: 'gdrive' })
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
    <form onSubmit={submit} className="glass-card p-6 space-y-4">
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
        <textarea name="description" value={form.description} onChange={on} rows={3} className="contact-input resize-none" placeholder="What do you need built?" />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Preferred deadline">
          <input name="deadline" type="date" value={form.deadline} onChange={on} className="contact-input" />
        </Field>
        <Field label="Priority">
          <select name="priority" value={form.priority} onChange={on} className="contact-input">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </Field>
      </div>

      {err && <p className="text-sm text-rose-600">{err}</p>}

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
              <input
                name="file_link"
                type="url"
                value={form.file_link}
                onChange={on}
                className="contact-input"
                placeholder={form.file_link_type === 'gdrive' ? 'https://drive.google.com/...' : 'https://github.com/...'}
              />
            </Field>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          {form.file_link_type === 'gdrive'
            ? 'Share your Google Drive folder/file with view access and paste the link above.'
            : 'Paste your public or shared GitHub repository URL above.'}
        </p>
      </div>

      <button disabled={busy} className="btn-primary w-full justify-center">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Create order
      </button>
    </form>
  )
}

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
      <form onSubmit={submit} className="glass-card p-6 space-y-4 h-fit">
        <h4 className="font-bold text-slate-900">Request a meeting</h4>
        <Field label="Title"><input name="title" value={form.title} onChange={on} className="contact-input" required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input name="date" type="date" min={today} value={form.date} onChange={on} className="contact-input" required /></Field>
          <Field label="Time"><input name="time" type="time" value={form.time} onChange={on} className="contact-input" required /></Field>
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
          <div key={m.id} className="glass-card p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800 text-sm">{m.title}</div>
              <div className="text-xs text-slate-500">{m.date} · {m.time} · {m.duration} · {m.timezone}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={m.status} />
              <a href={gcalLink(m)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-purple-700 hover:text-purple-900 whitespace-nowrap">+ Calendar</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
