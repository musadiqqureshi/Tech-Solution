import { useEffect, useMemo, useState } from 'react'
import { Loader2, Send, Briefcase, Hash } from 'lucide-react'
import { listExperts, listAllTasks, createTask } from '../../lib/experts'
import { listOrders } from '../../lib/data'
import { fmtMoney, SERVICE_OPTIONS } from '../../lib/finance'
import { useCurrency } from '../CurrencyContext'
import { Field } from '../ui'

const STATUS_COLOR = {
  assigned: '#94a3b8', in_progress: '#2563eb',
  submitted: '#7c3aed', approved: '#0d9488', completed: '#059669',
}

export default function TasksPanel() {
  const { currency, rates } = useCurrency()
  const [experts, setExperts]   = useState([])
  const [tasks, setTasks]       = useState([])
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [busy, setBusy]         = useState(false)
  const [err, setErr]           = useState('')
  const [form, setForm]         = useState({
    expertId: '', title: '', description: '', service: SERVICE_OPTIONS[0],
    clientAlias: '', expertBudget: '', clientBudget: '', dueDate: '',
    orderSerial: '',   // admin picks from dropdown or types manually
  })
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const reload = async () => {
    setLoading(true)
    try {
      const [ex, ts, or] = await Promise.all([listExperts(), listAllTasks(), listOrders()])
      setExperts(ex); setTasks(ts); setOrders(or)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }
  useEffect(() => { reload() }, [])

  const profit = (Number(form.clientBudget) || 0) - (Number(form.expertBudget) || 0)

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!form.expertId) return setErr('Pick an expert to assign.')
    setBusy(true)
    try {
      await createTask({ ...form, order_serial: form.orderSerial || null })
      setForm({
        expertId: '', title: '', description: '', service: SERVICE_OPTIONS[0],
        clientAlias: '', expertBudget: '', clientBudget: '', dueDate: '', orderSerial: '',
      })
      await reload()
    } catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }

  const totalProfit = useMemo(
    () => tasks.reduce((s, t) => s + Number(t.task_finance?.profit || 0), 0),
    [tasks],
  )

  // Orders with a serial number for the dropdown
  const ordersWithSerial = orders.filter((o) => o.order_serial)

  return (
    <div className="space-y-6">
      {/* Assign form */}
      <form onSubmit={submit} className="glass-card p-4 sm:p-6 space-y-4">
        <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
          <Send size={17} /> Allot a Task to Expert
        </h4>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Expert">
            <select name="expertId" value={form.expertId} onChange={on} className="contact-input" required>
              <option value="">Select an expert…</option>
              {experts.filter((x) => x.user_id).map((x) => (
                <option key={x.id} value={x.id}>{x.name} — {x.title}</option>
              ))}
            </select>
          </Field>

          {/* Order Serial — links task to a client order */}
          <Field label="Link to Order (Serial No.)">
            <select name="orderSerial" value={form.orderSerial} onChange={on} className="contact-input">
              <option value="">— None / manual —</option>
              {ordersWithSerial.map((o) => (
                <option key={o.id} value={o.order_serial}>
                  {o.order_serial} · {o.service} ({o.status})
                </option>
              ))}
            </select>
          </Field>
        </div>

        {form.orderSerial && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-sm text-purple-800">
            <Hash size={14} className="shrink-0" />
            Task will be filed under order <strong>{form.orderSerial}</strong> and this serial will appear on the expert's dashboard and on the invoice.
          </div>
        )}

        {!experts.some((x) => x.user_id) && (
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            Only experts with a linked login can receive tasks. Link one in the Experts tab.
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Task title">
            <input name="title" value={form.title} onChange={on} className="contact-input" required />
          </Field>
          <Field label="Client label (what the expert sees)">
            <input name="clientAlias" value={form.clientAlias} onChange={on} placeholder="e.g. Client A" className="contact-input" />
          </Field>
        </div>

        <Field label="Service">
          <select name="service" value={form.service} onChange={on} className="contact-input">
            {SERVICE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Description">
          <textarea name="description" value={form.description} onChange={on} rows={2} className="contact-input resize-none" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Expert budget (USD)">
            <input name="expertBudget" type="number" min="0" value={form.expertBudget} onChange={on} className="contact-input" placeholder="shown to expert" />
          </Field>
          <Field label="Client budget (USD)">
            <input name="clientBudget" type="number" min="0" value={form.clientBudget} onChange={on} className="contact-input" placeholder="private" />
          </Field>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
          <span className="text-sm text-slate-500">Your profit (hidden from expert)</span>
          <span className={`font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fmtMoney(profit, currency, rates)}
          </span>
        </div>

        <Field label="Due date (optional)">
          <input name="dueDate" type="date" value={form.dueDate} onChange={on} className="contact-input" />
        </Field>

        {err && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}

        <button disabled={busy} className="btn-primary w-full justify-center">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Assign task
        </button>
      </form>

      {/* Task list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-bold text-slate-900">Allotted Tasks ({tasks.length})</h4>
          <span className="text-sm text-slate-500">
            Total profit: <b className="text-emerald-600">{fmtMoney(totalProfit, currency, rates)}</b>
          </span>
        </div>

        {loading
          ? <div className="grid place-items-center py-10 text-slate-400"><Loader2 className="animate-spin" /></div>
          : !tasks.length
            ? <p className="text-slate-500 text-sm py-6 text-center">No tasks allotted yet.</p>
            : tasks.map((t) => (
              <div key={t.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-slate-900 text-sm">{t.title}</h5>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${STATUS_COLOR[t.status]}1a`, color: STATUS_COLOR[t.status] }}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Briefcase size={11} /> {t.experts?.name || 'Unassigned'} · for {t.client_alias}
                      </span>
                      {(t.order_serial || t.task_finance?.order_serial) && (
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Hash size={10} /> {t.order_serial || t.task_finance?.order_serial}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <div>Expert <b className="text-slate-700">{fmtMoney(t.expert_budget, currency, rates)}</b></div>
                    <div>Client <b className="text-slate-700">{fmtMoney(t.task_finance?.client_budget || 0, currency, rates)}</b></div>
                    <div className="text-emerald-600 font-bold">Profit {fmtMoney(t.task_finance?.profit || 0, currency, rates)}</div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
