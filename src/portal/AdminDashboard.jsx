import { useEffect, useMemo, useState } from 'react'
import { Loader2, Check, X, Truck, Github, HardDrive, ExternalLink, FileText, Banknote, UserPlus, Trash2 } from 'lucide-react'
import {
  listOrders, listMeetings, listClients, updateOrderStatus, markDelivered, setMeetingStatus,
  setPaymentStatus, listManualClients, createManualClient, deleteManualClient,
} from '../lib/data'
import { fmtMoney } from '../lib/finance'
import { generateInvoice } from '../lib/invoice'
import { StatCard, StatusBadge, Priority, Field } from './ui'
import { useCurrency, CurrencyPicker, CurrencyToggle } from './CurrencyContext'
import { useAuth } from './AuthContext'
import { FinanceAreaChart, useMonthly } from './FinanceChart'
import ExpertsPanel from './admin/ExpertsPanel'
import TasksPanel from './admin/TasksPanel'
import InvoicesPanel from './admin/InvoicesPanel'

const ADMIN_TABS = ['orders', 'meetings', 'clients', 'experts', 'tasks', 'invoices']

const REVENUE_STATES = ['approved', 'in_progress', 'delivered', 'completed']
const INVOICEABLE_STATES = ['approved', 'in_progress', 'delivered', 'completed']

export default function AdminDashboard({ refreshKey }) {
  const [orders, setOrders] = useState([])
  const [meetings, setMeetings] = useState([])
  const [clients, setClients] = useState([])
  const [manualClients, setManualClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('orders')
  const { currency, setCurrency, rates } = useCurrency()

  const reload = async () => {
    setLoading(true)
    try {
      const [o, m, c, mc] = await Promise.all([listOrders(), listMeetings(), listClients(), listManualClients().catch(() => [])])
      setOrders(o); setMeetings(m); setClients(c); setManualClients(mc || [])
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
      clients: clients.filter((c) => c.role === 'client').length + manualClients.length,
    }
  }, [orders, clients, manualClients])

  const clientName = (id) => clients.find((c) => c.id === id)?.name || 'Client'
  const clientProfile = (o) => {
    const c = clients.find((c) => c.id === o.user_id)
    return {
      name: o.client_name || c?.name || 'Client',
      email: o.client_email || c?.email || '',
      phone: o.client_phone || c?.phone || '',
      company: o.client_company || c?.company || '',
    }
  }

  if (loading) return <div className="grid place-items-center py-20 text-slate-400"><Loader2 className="animate-spin" /></div>

  // Ask currency preference before showing any financial data
  if (!currency) return <CurrencyPicker onPick={setCurrency} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          <StatCard label="Revenue" value={fmtMoney(stats.revenue, currency, rates)} sub="approved + active" accent="#7c3aed" />
          <StatCard label="Est. Profit" value={fmtMoney(stats.profit, currency, rates)} sub="projected margin" accent="#0d9488" />
          <StatCard label="Pending" value={stats.pending} sub="awaiting approval" accent="#f59e0b" />
          <StatCard label="Clients" value={stats.clients} sub="registered" accent="#2563eb" />
        </div>
        <div className="ml-4 shrink-0"><CurrencyToggle /></div>
      </div>

      <RevenueChart orders={orders} currency={currency} rates={rates} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ADMIN_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize whitespace-nowrap ${tab === t ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-purple-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'orders' && <AdminOrders orders={orders} clientName={clientName} clientProfile={clientProfile} onChange={reload} currency={currency} rates={rates} />}
      {tab === 'meetings' && <AdminMeetings meetings={meetings} clientName={clientName} onChange={reload} />}
      {tab === 'clients' && (
        <ClientsList
          clients={clients} manualClients={manualClients} orders={orders}
          currency={currency} rates={rates} onChange={reload}
        />
      )}
      {tab === 'experts' && <ExpertsPanel />}
      {tab === 'tasks' && <TasksPanel />}
      {tab === 'invoices' && <InvoicesPanel />}
    </div>
  )
}

function RevenueChart({ orders, currency, rates }) {
  const billable = useMemo(() => orders.filter((o) => REVENUE_STATES.includes(o.status)), [orders])
  const data = useMonthly(billable, [
    { key: 'revenue', field: 'budget' },
    { key: 'profit', field: 'est_profit' },
  ], { currency, rates, months: 6 })
  return (
    <div className="glass-card p-5">
      <h3 className="font-bold text-slate-900 mb-1">Revenue & profit</h3>
      <p className="text-xs text-slate-400 mb-3">Last 6 months · approved + active orders</p>
      <FinanceAreaChart data={data} series={[
        { key: 'revenue', name: 'Revenue', color: '#7c3aed' },
        { key: 'profit', name: 'Profit', color: '#0d9488' },
      ]} />
    </div>
  )
}

function AdminOrders({ orders, clientName, clientProfile, onChange, currency, rates }) {
  if (!orders.length) return <p className="text-slate-500 text-sm py-8 text-center">No orders yet.</p>
  return (
    <div className="space-y-3">
      {orders.map((o) => <AdminOrderRow key={o.id} o={o} clientName={clientName} clientProfile={clientProfile} onChange={onChange} currency={currency} rates={rates} />)}
    </div>
  )
}

function AdminOrderRow({ o, clientName, clientProfile, onChange, currency, rates }) {
  const [busy, setBusy] = useState(false)
  const [genBusy, setGenBusy] = useState(false)
  const [delivery, setDelivery] = useState({ delivery_type: o.delivery_type || 'github', delivery_url: o.delivery_url || '' })
  const act = async (fn) => { setBusy(true); try { await fn() } finally { setBusy(false); onChange() } }

  const isPaid = o.payment_status === 'paid'

  const handleInvoice = () => {
    setGenBusy(true)
    try { generateInvoice(o, clientProfile(o), currency, rates) }
    catch (e) { console.error(e) }
    finally { setGenBusy(false) }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900">{o.service}</h4>
            <StatusBadge status={o.status} />
            <Priority value={o.priority} />
            {isPaid
              ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-emerald-100 text-emerald-700">paid</span>
              : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-amber-100 text-amber-700">unpaid</span>}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {o.client_name || clientName(o.user_id)} {o.client_email ? `· ${o.client_email}` : ''}{o.client_company ? ` · ${o.client_company}` : ''}
          </div>
          {o.description && <p className="text-sm text-slate-500 mt-1 max-w-xl">{o.description}</p>}
        </div>
        <div className="text-right">
          <div className="text-lg font-black gradient-text">{fmtMoney(o.budget, currency, rates)}</div>
          <div className="text-[11px] text-slate-400">cost {fmtMoney(o.est_cost, currency, rates)} · profit {fmtMoney(o.est_profit, currency, rates)}</div>
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

        {INVOICEABLE_STATES.includes(o.status) && (
          <>
            <button onClick={handleInvoice} disabled={genBusy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors disabled:opacity-50">
              {genBusy ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Generate Invoice
            </button>
            <button
              disabled={busy}
              onClick={() => act(() => setPaymentStatus(o.id, isPaid ? 'unpaid' : 'paid', 'admin'))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                isPaid ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Banknote size={13} /> {isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
            </button>
          </>
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

// ── Clients tab ────────────────────────────────────────────────────────────

function ClientsList({ clients, manualClients, orders, currency, rates, onChange }) {
  const [showAdd, setShowAdd] = useState(false)
  const [invoiceFor, setInvoiceFor] = useState(null) // client being invoiced ad-hoc

  const registered = clients.filter((c) => c.role === 'client')
  const spendFor = (id) => orders.filter((o) => o.user_id === id).reduce((s, o) => s + Number(o.budget || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 text-sm">Clients</h4>
        <button onClick={() => setShowAdd((v) => !v)} className="btn-primary !px-3 !py-1.5 text-xs">
          <UserPlus size={14} /> {showAdd ? 'Close' : 'Add Client'}
        </button>
      </div>

      {showAdd && <AddClientForm onAdded={() => { setShowAdd(false); onChange() }} />}

      {!registered.length && !manualClients.length && (
        <p className="text-slate-500 text-sm py-8 text-center">No clients yet.</p>
      )}

      {!!registered.length && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Registered (portal accounts)</p>
          <div className="glass-card p-2 divide-y divide-slate-100">
            {registered.map((c) => (
              <ClientRow
                key={`r-${c.id}`}
                name={c.name} email={c.email} company={c.company} phone={c.phone}
                spend={fmtMoney(spendFor(c.id), currency, rates)}
                onInvoice={() => setInvoiceFor({ name: c.name, email: c.email, phone: c.phone, company: c.company })}
              />
            ))}
          </div>
        </div>
      )}

      {!!manualClients.length && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2 mt-4">Added by admin</p>
          <div className="glass-card p-2 divide-y divide-slate-100">
            {manualClients.map((c) => (
              <ClientRow
                key={`m-${c.id}`}
                name={c.name} email={c.email} company={c.company} phone={c.phone}
                onInvoice={() => setInvoiceFor({ name: c.name, email: c.email, phone: c.phone, company: c.company })}
                onDelete={async () => { await deleteManualClient(c.id); onChange() }}
              />
            ))}
          </div>
        </div>
      )}

      {invoiceFor && (
        <AdHocInvoiceModal client={invoiceFor} currency={currency} rates={rates} onClose={() => setInvoiceFor(null)} />
      )}
    </div>
  )
}

function ClientRow({ name, email, company, phone, spend, onInvoice, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="grid place-items-center w-9 h-9 rounded-full text-white text-xs font-bold shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
          {(name || email || '?').slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 text-sm truncate">{name || '—'}</div>
          <div className="text-xs text-slate-500 truncate">{email}{company ? ` · ${company}` : ''}{phone ? ` · ${phone}` : ''}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {spend !== undefined && (
          <div className="text-right mr-1">
            <div className="text-sm font-bold gradient-text">{spend}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">lifetime</div>
          </div>
        )}
        <button onClick={onInvoice} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors">
          <FileText size={13} /> Invoice
        </button>
        {onDelete && (
          <button onClick={onDelete} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50" title="Remove client">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function AddClientForm({ onAdded }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Name is required'); return }
    setBusy(true); setErr('')
    try {
      await createManualClient({ ...form, createdBy: user?.id })
      onAdded()
    } catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="glass-card p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name"><input name="name" value={form.name} onChange={on} className="contact-input" required /></Field>
        <Field label="Email"><input name="email" type="email" value={form.email} onChange={on} className="contact-input" /></Field>
        <Field label="Phone"><input name="phone" value={form.phone} onChange={on} className="contact-input" /></Field>
        <Field label="Company"><input name="company" value={form.company} onChange={on} className="contact-input" /></Field>
      </div>
      <Field label="Notes (optional)">
        <textarea name="notes" value={form.notes} onChange={on} rows={2} className="contact-input resize-none" />
      </Field>
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <button disabled={busy} className="btn-primary w-full justify-center">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Add client
      </button>
    </form>
  )
}

// ── Ad-hoc invoice modal (for any client, not tied to an order) ────────────

function AdHocInvoiceModal({ client, currency, rates, onClose }) {
  const [form, setForm] = useState({ service: '', description: '', amount: '', deadline: '' })
  const [busy, setBusy] = useState(false)
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const order = {
        id: Date.now().toString().slice(-6),
        service: form.service || 'Project Service',
        description: form.description,
        budget: Number(form.amount) || 0,
        status: 'pending',
        payment_status: 'unpaid',
        priority: 'medium',
        deadline: form.deadline || null,
      }
      generateInvoice(order, client, currency, rates)
      onClose()
    } catch (err) { console.error(err) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900">Invoice for {client.name || 'Client'}</h4>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <Field label="Service / Item">
          <input name="service" value={form.service} onChange={on} className="contact-input" placeholder="e.g. Web Development" required />
        </Field>
        <Field label="Description (optional)">
          <textarea name="description" value={form.description} onChange={on} rows={3} className="contact-input resize-none" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Amount (USD)">
            <input name="amount" type="number" min="0" value={form.amount} onChange={on} className="contact-input" placeholder="e.g. 1500" required />
          </Field>
          <Field label="Due / deadline (optional)">
            <input name="deadline" type="date" value={form.deadline} onChange={on} className="contact-input" />
          </Field>
        </div>
        <p className="text-[11px] text-slate-400">
          Amount is entered in USD and shown converted to {currency} on the invoice using today's exchange rate.
        </p>
        <button disabled={busy} className="btn-primary w-full justify-center">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Generate Invoice
        </button>
      </form>
    </div>
  )
}
