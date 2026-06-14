import { supabase } from './supabase'

export async function listManualInvoices() {
  const { data, error } = await supabase
    .from('manual_invoices').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createManualInvoice(inv) {
  const { data, error } = await supabase.from('manual_invoices').insert({
    invoice_no: inv.invoiceNo,
    client_name: inv.clientName,
    client_email: inv.clientEmail || null,
    client_company: inv.clientCompany || null,
    items: inv.items || [],
    currency: inv.currency || 'USD',
    subtotal: inv.subtotal || 0,
    tax: inv.tax || 0,
    total: inv.total || 0,
    notes: inv.notes || null,
    status: inv.status || 'unpaid',
    created_by: inv.createdBy || null,
  }).select().single()
  if (error) throw error
  return data
}

export async function setInvoiceStatus(id, status) {
  const { data, error } = await supabase.from('manual_invoices').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

// Builds the order-shaped object that lib/invoice.js's generateInvoice expects,
// from manually-entered invoice details.
export function invoiceToOrderShape(inv) {
  const breakdown = {}
  ;(inv.items || []).forEach((it, i) => {
    const label = it.description || `Item ${i + 1}`
    breakdown[label] = (Number(it.price) || 0) * (Number(it.qty) || 1)
  })
  return {
    id: inv.invoiceNo?.replace(/\D/g, '') || Date.now() % 10000,
    service: inv.items?.[0]?.description || 'Professional Services',
    description: inv.notes || '',
    status: 'completed',
    priority: '—',
    deadline: '—',
    payment_status: inv.status === 'paid' ? 'paid' : 'unpaid',
    budget: inv.total || 0,
    breakdown: Object.keys(breakdown).length ? breakdown : null,
  }
}
