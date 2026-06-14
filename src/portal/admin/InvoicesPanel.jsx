import { useEffect, useState } from 'react'
import { Loader2, FileText, Plus, Trash2, Download } from 'lucide-react'
import { listManualInvoices, createManualInvoice, setInvoiceStatus, invoiceToOrderShape } from '../../lib/invoices'
import { generateInvoice } from '../../lib/invoice'
import { fmtMoney } from '../../lib/finance'
import { useCurrency } from '../CurrencyContext'
import { useAuth } from '../AuthContext'
import { Field } from '../ui'

const blankItem = () => ({ description: '', qty: 1, price: '' })

export default function InvoicesPanel() {
  const { currency, rates } = useCurrency()
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientCompany: '', notes: '', items: [blankItem()] })

  const reload = async () => {
    setLoading(true)
    try { setInvoices(await listManualInvoices()) } catch (e) { setErr(e.message) }
    setLoading(false)
  }
  useEffect(() => { reload() }, [])

  const setItem = (i, key, val) => setForm((f) => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }))
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, blankItem()] }))
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  const subtotal = form.items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0)

  const nextNo = () => `INV-M${String(Date.now()).slice(-5)}`

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!form.clientName.trim()) return setErr('Client name is required.')
    if (subtotal <= 0) return setErr('Add at least one line item with an amount.')
    setBusy(true)
    try {
      const invoiceNo = nextNo()
      const payload = {
        invoiceNo, clientName: form.clientName, clientEmail: form.clientEmail, clientCompany: form.clientCompany,
        items: form.items.filter((it) => it.description || it.price), currency: 'USD',
        subtotal, tax: 0, total: subtotal, notes: form.notes, status: 'unpaid', createdBy: user?.id,
      }
      await createManualInvoice(payload)
      // Generate + download the PDF
      generateInvoice(
        invoiceToOrderShape(payload),
        { name: form.clientName, email: form.clientEmail, phone: '', company: form.clientCompany },
        currency, rates,
      )
      setForm({ clientName: '', clientEmail: '', clientCompany: '', notes: '', items: [blankItem()] })
      await reload()
    } catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }

  const reDownload = (inv) => generateInvoice(
    invoiceToOrderShape({
      invoiceNo: inv.invoice_no, items: inv.items, total: Number(inv.total), notes: inv.notes, status: inv.status,
    }),
    { name: inv.client_name, email: inv.client_email, phone: '', company: inv.client_company },
    currency, rates,
  )

  const togglePaid = async (inv) => { await setInvoiceStatus(inv.id, inv.status === 'paid' ? 'unpaid' : 'paid'); reload() }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <form onSubmit={submit} className="lg:col-span-2 glass-card p-6 space-y-4 h-fit">
        <h4 className="font-bold text-slate-900 flex items-center gap-2"><FileText size={18} /> New invoice</h4>
        <Field label="Client name"><input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} className="contact-input" required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><input type="email" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} className="contact-input" /></Field>
          <Field label="Company"><input value={form.clientCompany} onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))} className="contact-input" /></Field>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Line items</div>
          {form.items.map((it, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Description" className="contact-input flex-1 !py-2 text-sm" />
              <input type="number" min="1" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} className="contact-input !w-14 !py-2 text-sm" />
              <input type="number" min="0" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} placeholder="$" className="contact-input !w-20 !py-2 text-sm" />
              {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>}
            </div>
          ))}
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-sm font-semibold text-purple-700"><Plus size={14} /> Add item</button>
        </div>

        <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="contact-input resize-none" /></Field>
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
          <span className="text-sm text-slate-500">Total</span>
          <span className="font-black gradient-text">{fmtMoney(subtotal, currency, rates)}</span>
        </div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button disabled={busy} className="btn-primary w-full justify-center">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} Generate invoice (PDF)
        </button>
      </form>

      <div className="lg:col-span-3 space-y-3">
        <h4 className="font-bold text-slate-900">Issued invoices ({invoices.length})</h4>
        {loading ? <div className="grid place-items-center py-10 text-slate-400"><Loader2 className="animate-spin" /></div>
          : !invoices.length ? <p className="text-slate-500 text-sm">No invoices issued yet.</p>
          : invoices.map((inv) => (
            <div key={inv.id} className="glass-card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-sm">{inv.invoice_no} · {inv.client_name}</div>
                <div className="text-xs text-slate-500">{new Date(inv.created_at).toLocaleDateString()}{inv.client_company ? ` · ${inv.client_company}` : ''}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black gradient-text text-sm">{fmtMoney(Number(inv.total), currency, rates)}</span>
                <button onClick={() => togglePaid(inv)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</button>
                <button onClick={() => reDownload(inv)} className="p-2 rounded-lg text-purple-700 hover:bg-purple-50"><Download size={16} /></button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
