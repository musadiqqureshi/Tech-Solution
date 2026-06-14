import { useEffect, useMemo, useState } from 'react'
import { Loader2, Check, X, Truck, Github, HardDrive, ExternalLink, Users } from 'lucide-react'
import { listOrders, listMeetings, listClients, updateOrderStatus, markDelivered, setMeetingStatus } from '../lib/data'
import { fmtMoney } from '../lib/finance'
import { StatCard, StatusBadge, Priority } from './ui'

const REVENUE_STATES = ['approved', 'in_progress', 'delivered', 'completed']

export default function AdminDashboard({ refreshKey }) {
  const [orders, setOrders] = useState([])
  const [meetings, setMeetings] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('orders')

  const reload = async () => {
    setLoading(true)
    try {
      const [o, m, c] = await Promise.all([listOrders(), listMeetings(), listClients()])
      setOrders(o); setMeetings(m); setClients(c)
    } catch (e) { /* ignore */ }
    setLoading(false)
  }
  useEffect(() => { reload() }, [refreshKey])

  const stats = useMemo(() => {
    const billable = orders.filter((o) => REVENUE_STATES.includes(o.status))
    return {
      revenue: billable.reduce((s, o) => s + Number(o.budget || 0), 0),
      profit: billable.reduce((s, o) => s + Number(o.est_profit || 0), 0),
      pending: orders.filter((o) => o.status === 'pending').length,
      clients: clients.filter((c) => c.role === 'client').length,
    }
  }, [orders, clients])

  const clientName = (id) => clients.find((c) => c.id === id)?.name || 'Client'

  if (loading) return <div className="grid place-items-center py-20 text-slate-400"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={fmtMoney(stats.revenue)} sub="approved + active" accent="#7c3aed" />
        <StatCard label="Est. Profit" value={fmtMoney(stats.profit)} sub="projected margin" accent="#0d9488" />
        <StatCard label="Pending" value={stats.pending} sub="awaiting approval" accent="#f59e0b" />
        <StatCard label="Clients" value={stats.clients} sub="registered" accent="#2563eb" />
      </div>

      <div className="flex gap-2">
        {['orders', 'meetings', 'clients'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-purple-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'orders' && <AdminOrders orders={orders} clientName={clientName} onChange={reload} />}
      {tab === 'meetings' && <AdminMeetings meetings={meetings} clientName={clientName} onChange={reload} />}
      {tab === 'clients' && <ClientsList clients={clients} orders={orders} />}
    </div>
  )
}

function AdminOrders({ orders, clientName, onChange }) {
  if (!orders.length) return <p className="text-slate-500 text-sm py-8 text-center">No orders yet.</p>
  return (
    <div className="space-y-3">
      {orders.map((o) => <AdminOrderRow key={o.id} o={o} clientName={clientName} onChange={onChange} />)}
    </div>
  )
}

function AdminOrderRow({ o, clientName, onChange }) {
  const [busy, setBusy] = useState(false)
  const [delivery, setDelivery] = useState({ delivery_type: o.delivery_type || 'github', delivery_url: o.delivery_url || '' })
  const act = async (fn) => { setBusy(true); try { await fn() } finally { setBusy(false); onChange() } }

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900">{o.service}</h4>
            <StatusBadge status={o.status} />
            <Priority value={o.priority} />
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {o.client_name || clientName(o.user_id)} {o.client_email ? `· ${o.client_email}` : ''}{o.client_company ? ` · ${o.client_company}` : ''}
          </div>
          {o.description && <p className="text-sm text-slate-500 mt-1 max-w-xl">{o.description}</p>}
        </div>
        <div className="text-right">
          <div className="text-lg font-black gradient-text">{fmtMoney(o.budget)}</div>
          <div className="text-[11px] text-slate-400">cost {fmtMoney(o.est_cost)} · profit {fmtMoney(o.est_profit)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        {o.status === 'pending' && (
          <>
            <button disabled={busy} onClick={() => act(() => updateOrderStatus(o.id, 'approved'))} className="btn-primary !px-3 !py-1.5 text-xs"><Check size={14} /> Approve</button>
            <button disabled={busy} onClick={() => act(() => updateOrderStatus(o.id, 'rejected'))} className="btn-secondary !px-3 !py-1.5 text-xs"><X size={14} /> Reject</button>
          </>
        )}
        {o.status === 'approved' && (
          <button disabled={busy} onClick={() => act(() => updateOrderStatus(o.id, 'in_progress'))} className="btn-secondary !px-3 !py-1.5 text-xs">Start project</button>
        )}
        {['in_progress', 'delivered'].includes(o.status) && (
          <button disabled={busy} onClick={() => act(() => updateOrderStatus(o.id, 'completed'))} className="btn-secondary !px-3 !py-1.5 text-xs">Mark completed</button>
        )}
      </div>

      {/* Delivery link field */}
      {['approved', 'in_progress', 'delivered', 'completed'].includes(o.status) && (
        <div className="mt-4 bg-slate-50 rounded-xl p-3">
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2 flex items-center gap-1"><Truck size={12} /> Deliver project</div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={delivery.delivery_type} onChange={(e) => setDelivery((d) => ({ ...d, delivery_type: e.target.value }))} className="contact-input !w-auto !py-2 text-sm">
              <option value="github">GitHub</option><option value="gdrive">Google Drive</option><option value="other">Other</option>
            </select>
            <input value={delivery.delivery_url} onChange={(e) => setDelivery((d) => ({ ...d, delivery_url: e.target.value }))}
              placeholder="Paste GitHub / Drive link" className="contact-input flex-1 !py-2 text-sm min-w-[200px]" />
            <button disabled={busy || !delivery.delivery_url} onClick={() => act(() => markDelivered(o.id, delivery))} className="btn-primary !px-3 !py-2 text-xs">Save & mark delivered</button>
          </div>
          {o.delivery_url && (
            <a href={o.delivery_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 mt-2">
              {o.delivery_type === 'github' ? <Github size={13} /> : <HardDrive size={13} />} {o.delivery_url} <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function AdminMeetings({ meetings, clientName, onChange }) {
  const [busy, setBusy] = useState(0)
  const act = async (id, status) => { setBusy(id); try { await setMeetingStatus(id, status) } finally { setBusy(0); onChange() } }
  if (!meetings.length) return <p className="text-slate-500 text-sm py-8 text-center">No meetings scheduled.</p>
  return (
    <div className="space-y-3">
      {meetings.map((m) => (
        <div key={m.id} className="glass-card p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold text-slate-800 text-sm">{m.title}</div>
            <div className="text-xs text-slate-500">{m.client_name || clientName(m.user_id)} · {m.date} · {m.time} · {m.duration} ({m.timezone})</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={m.status} />
            {m.status === 'requested' && <button disabled={busy === m.id} onClick={() => act(m.id, 'confirmed')} className="btn-primary !px-3 !py-1.5 text-xs"><Check size={14} /> Confirm</button>}
            {m.status !== 'cancelled' && <button disabled={busy === m.id} onClick={() => act(m.id, 'cancelled')} className="btn-secondary !px-3 !py-1.5 text-xs"><X size={14} /></button>}
          </div>
        </div>
      ))}
    </div>
  )
}

function ClientsList({ clients, orders }) {
  const rows = clients.filter((c) => c.role === 'client')
  const spendFor = (id) => orders.filter((o) => o.user_id === id).reduce((s, o) => s + Number(o.budget || 0), 0)
  if (!rows.length) return <p className="text-slate-500 text-sm py-8 text-center">No clients yet.</p>
  return (
    <div className="glass-card p-2 divide-y divide-slate-100">
      {rows.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center w-9 h-9 rounded-full text-white text-xs font-bold shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
              {(c.name || c.email || '?').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 text-sm truncate">{c.name || '—'}</div>
              <div className="text-xs text-slate-500 truncate">{c.email}{c.company ? ` · ${c.company}` : ''}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold gradient-text">{fmtMoney(spendFor(c.id))}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">lifetime</div>
          </div>
        </div>
      ))}
    </div>
  )
}
