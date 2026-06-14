import { useEffect, useMemo, useState } from 'react'
import { Plus, CalendarPlus, ExternalLink, Github, HardDrive, Loader2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import { listOrders, createOrder, listMeetings, createMeeting, gcalLink } from '../lib/data'
import { estimateFinance, fmtMoney, SERVICE_OPTIONS } from '../lib/finance'
import { StatCard, StatusBadge, Priority, Field } from './ui'

export default function ClientDashboard({ refreshKey, onChange }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Spend" value={fmtMoney(totals.committed)} sub="across all orders" accent="#7c3aed" />
        <StatCard label="Orders" value={orders.length} sub="projects requested" accent="#2563eb" />
        <StatCard label="Delivered" value={totals.delivered} sub="completed projects" accent="#0d9488" />
        <StatCard label="Meetings" value={totals.upcoming} sub="scheduled" accent="#f59e0b" />
      </div>

      <div className="flex gap-2">
        {['overview', 'new order', 'meetings'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-purple-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OrdersList orders={orders} />}
      {tab === 'new order' && <NewOrder userId={user.id} onCreated={() => { reload(); onChange?.() }} />}
      {tab === 'meetings' && <Meetings userId={user.id} meetings={meetings} onCreated={() => { reload(); onChange?.() }} />}
    </div>
  )
}

function OrdersList({ orders }) {
  if (!orders.length) return <p className="text-slate-500 text-sm py-8 text-center">No orders yet. Create one from the “New order” tab or ask the assistant.</p>
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
              <div className="text-lg font-black gradient-text">{fmtMoney(o.budget)}</div>
              <div className="text-[11px] text-slate-400">est. cost {fmtMoney(o.est_cost)}</div>
            </div>
          </div>
          {o.breakdown && (
            <div className="grid grid-cols-4 gap-2 mt-3 text-center">
              {['development', 'design', 'hosting', 'maintenance'].map((k) => (
                <div key={k} className="bg-slate-50 rounded-lg py-2">
                  <div className="text-[10px] uppercase text-slate-400">{k}</div>
                  <div className="text-sm font-bold text-slate-700">{fmtMoney(o.breakdown[k])}</div>
                </div>
              ))}
            </div>
          )}
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

function NewOrder({ userId, onCreated }) {
  const [form, setForm] = useState({ service: SERVICE_OPTIONS[0], description: '', budget: '', deadline: '', priority: 'medium' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const finance = useMemo(() => estimateFinance({ service: form.service, budget: form.budget }), [form.service, form.budget])

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
        <Field label="Budget (USD)">
          <input name="budget" type="number" min="0" value={form.budget} onChange={on} placeholder="e.g. 5000" className="contact-input" />
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

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
          Live estimate {finance.assumed && '(reference — add a budget for profit)'}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {['development', 'design', 'hosting', 'maintenance'].map((k) => (
            <div key={k}><div className="text-[10px] uppercase text-slate-400">{k}</div><div className="text-sm font-bold text-slate-700">{fmtMoney(finance.breakdown[k])}</div></div>
          ))}
        </div>
        <div className="flex justify-between text-sm mt-3 pt-3 border-t border-slate-200">
          <span className="text-slate-500">Estimated cost <b className="text-slate-800">{fmtMoney(finance.estimated_cost)}</b></span>
          <span className="text-slate-500">Profit <b className="text-emerald-600">{fmtMoney(finance.estimated_profit)}</b></span>
        </div>
      </div>

      {err && <p className="text-sm text-rose-600">{err}</p>}
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
        <p className="text-xs text-slate-400">Timezone: Asia/Karachi (PKT). We’ll check for conflicts before booking.</p>
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
