/**
 * monthlyReport.js — generates a monthly summary PDF for the admin
 * Includes: all tasks/orders table, budget, cost, profit, payment status,
 * per-service breakdown, and a month summary card.
 *
 * Uses jsPDF (loaded via CDN in index.html).
 */

import { convert } from './finance'

const COMPANY = {
  name:    'Tech Solutions Pakistan',
  contact: 'Muhammad Mussaddiq Ahmed Qureshi',
  email:   'info@techsolutionspk.com',
  phone:   '+92 308 6994758',
}

const CURRENCY_SYMBOLS = { USD: '$', PKR: 'PKR ', GBP: '£', EUR: '€', AUD: 'A$', CAD: 'C$' }

function money(amount, currency, rates) {
  if (!amount && amount !== 0) return '—'
  const n = Number(amount || 0)
  if (currency === 'USD' || !currency) return `$${n.toLocaleString()}`
  const converted = convert(n, currency, rates)
  const sym = CURRENCY_SYMBOLS[currency] || `${currency} `
  return `${sym}${Math.round(converted).toLocaleString()}`
}

function fmtDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function generateMonthlyReport({ orders, tasks = [], currency = 'USD', rates = null, year, month }) {
  const { jsPDF } = window.jspdf
  if (!jsPDF) { alert('PDF library not loaded. Please try again in a moment.'); return }

  // Filter to selected month
  const inMonth = (ts) => {
    if (!ts) return false
    const d = new Date(ts)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  }
  const monthOrders = orders.filter((o) => inMonth(o.created_at))
  const REVENUE_STATES = ['approved', 'in_progress', 'delivered', 'completed']
  const billable = monthOrders.filter((o) => REVENUE_STATES.includes(o.status))

  // Aggregates
  const totalRevenue = billable.reduce((s, o) => s + Number(o.budget || 0), 0)
  const totalCost    = billable.reduce((s, o) => s + Number(o.est_cost || 0), 0)
  const totalProfit  = billable.reduce((s, o) => s + Number(o.est_profit || 0), 0)
  const paidCount    = billable.filter((o) => o.payment_status === 'paid').length
  const unpaidCount  = billable.filter((o) => o.payment_status !== 'paid').length

  // Per-service breakdown
  const serviceMap = {}
  for (const o of billable) {
    const svc = o.service || 'Other'
    if (!serviceMap[svc]) serviceMap[svc] = { count: 0, revenue: 0, profit: 0 }
    serviceMap[svc].count++
    serviceMap[svc].revenue += Number(o.budget || 0)
    serviceMap[svc].profit  += Number(o.est_profit || 0)
  }

  // ── jsPDF setup ──────────────────────────────────────────────────────────
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W      = doc.internal.pageSize.getWidth()
  const H      = doc.internal.pageSize.getHeight()
  const margin = 14
  const col    = W - margin * 2
  let y        = margin

  // Palette
  const PURPLE = [124, 58, 237]
  const DARK   = [15, 23, 42]
  const GREY   = [100, 116, 139]
  const LIGHT  = [241, 245, 249]
  const WHITE  = [255, 255, 255]
  const GREEN  = [5, 150, 105]
  const TEAL   = [13, 148, 136]

  const setFont = (style = 'normal', size = 10, color = DARK) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }
  const line = (x1, yy, x2, color = [226, 232, 240], lw = 0.25) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(lw)
    doc.line(x1, yy, x2, yy)
  }
  const box = (x, yy, w, h, fill, r = 2) => {
    doc.setFillColor(...fill)
    doc.roundedRect(x, yy, w, h, r, r, 'F')
  }
  const txt = (str, x, yy, opts = {}) => doc.text(String(str ?? ''), x, yy, opts)

  const checkPage = (needed = 12) => {
    if (y + needed > H - 20) {
      doc.addPage()
      y = margin
      // Repeat subtle header
      box(0, 0, W, 8, PURPLE, 0)
    }
  }

  // ── Header band ───────────────────────────────────────────────────────────
  box(0, 0, W, 36, PURPLE, 0)
  setFont('bold', 20, WHITE)
  txt('MONTHLY REPORT', margin, 14)
  setFont('normal', 9, [196, 181, 253])
  txt(COMPANY.name, margin, 21)
  txt(`Generated: ${fmtDate(new Date())}  ·  ${COMPANY.email}`, margin, 27)

  // Month badge
  const lbl = monthLabel(year, month)
  box(W - margin - 46, 8, 46, 12, [109, 40, 217], 2)
  setFont('bold', 8.5, WHITE)
  txt(lbl, W - margin - 23, 15.5, { align: 'center' })
  y = 44

  // ── Summary KPI cards ─────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total Revenue', value: money(totalRevenue, currency, rates), color: PURPLE },
    { label: 'Est. Cost',     value: money(totalCost, currency, rates),    color: [37, 99, 235] },
    { label: 'Est. Profit',   value: money(totalProfit, currency, rates),  color: GREEN },
    { label: 'Orders',        value: monthOrders.length,                   color: [245, 158, 11] },
    { label: 'Paid',          value: paidCount,                            color: TEAL },
    { label: 'Unpaid',        value: unpaidCount,                          color: [239, 68, 68] },
  ]
  const kW = (col - 5 * 3) / 6
  kpis.forEach((k, i) => {
    const x = margin + i * (kW + 3)
    box(x, y, kW, 20, LIGHT, 2)
    setFont('normal', 6.5, GREY); txt(k.label, x + 3, y + 7)
    setFont('bold', 9, k.color); txt(String(k.value), x + 3, y + 16)
  })
  y += 28

  // ── Per-service breakdown ─────────────────────────────────────────────────
  if (Object.keys(serviceMap).length) {
    setFont('bold', 8.5, PURPLE)
    txt('SERVICE BREAKDOWN', margin, y)
    line(margin, y + 2, W - margin, PURPLE, 0.4)
    y += 8

    // Table header
    box(margin, y - 3, col, 8, PURPLE, 2)
    setFont('bold', 7.5, WHITE)
    txt('Service',  margin + 3, y + 2.5)
    txt('Orders',   margin + 90, y + 2.5, { align: 'right' })
    txt('Revenue',  margin + 120, y + 2.5, { align: 'right' })
    txt('Profit',   W - margin - 2, y + 2.5, { align: 'right' })
    y += 10

    Object.entries(serviceMap).forEach(([svc, d], i) => {
      if (i % 2 === 0) box(margin, y - 3, col, 8, LIGHT, 1)
      setFont('normal', 7.5, DARK); txt(svc, margin + 3, y + 2)
      setFont('bold', 7.5, DARK)
      txt(String(d.count), margin + 90, y + 2, { align: 'right' })
      txt(money(d.revenue, currency, rates), margin + 120, y + 2, { align: 'right' })
      txt(money(d.profit, currency, rates), W - margin - 2, y + 2, { align: 'right' })
      y += 8
    })
    y += 6
  }

  // ── Orders table ──────────────────────────────────────────────────────────
  checkPage(20)
  setFont('bold', 8.5, PURPLE)
  txt('ALL ORDERS THIS MONTH', margin, y)
  line(margin, y + 2, W - margin, PURPLE, 0.4)
  y += 8

  if (!monthOrders.length) {
    setFont('normal', 8, GREY); txt('No orders in this month.', margin, y + 4)
    y += 12
  } else {
    // Column positions
    const C = {
      serial:  margin + 2,
      service: margin + 32,
      client:  margin + 78,
      budget:  margin + 118,
      profit:  margin + 142,
      status:  margin + 162,
      paid:    W - margin - 2,
    }

    // Header row
    box(margin, y - 3, col, 8, PURPLE, 2)
    setFont('bold', 6.5, WHITE)
    txt('Serial',  C.serial,          y + 2.5)
    txt('Service', C.service,         y + 2.5)
    txt('Client',  C.client,          y + 2.5)
    txt('Budget',  C.budget,          y + 2.5, { align: 'right' })
    txt('Profit',  C.profit,          y + 2.5, { align: 'right' })
    txt('Status',  C.status,          y + 2.5)
    txt('Paid',    C.paid,            y + 2.5, { align: 'right' })
    y += 10

    monthOrders.forEach((o, i) => {
      checkPage(10)
      if (i % 2 === 0) box(margin, y - 3, col, 8, LIGHT, 1)
      setFont('normal', 6.5, DARK)
      txt(o.order_serial || `#${o.id}`, C.serial, y + 2)

      const svcShort = (o.service || '—').slice(0, 18)
      txt(svcShort, C.service, y + 2)

      const clientShort = (o.client_name || 'Client').slice(0, 14)
      txt(clientShort, C.client, y + 2)

      setFont('bold', 6.5, DARK)
      txt(money(o.budget, currency, rates), C.budget, y + 2, { align: 'right' })
      txt(money(o.est_profit, currency, rates), C.profit, y + 2, { align: 'right' })

      // Status badge
      const statusColor = {
        pending: [245, 158, 11], approved: [37, 99, 235], in_progress: [124, 58, 237],
        delivered: [13, 148, 136], completed: [5, 150, 105], rejected: [239, 68, 68],
      }[o.status] || GREY
      setFont('bold', 6, statusColor)
      txt((o.status || '').replace('_', ' '), C.status, y + 2)

      const isPaid = o.payment_status === 'paid'
      setFont('bold', 6, isPaid ? GREEN : [239, 68, 68])
      txt(isPaid ? '✓ paid' : '✗ unpaid', C.paid, y + 2, { align: 'right' })
      y += 8
    })
    y += 4
  }

  // ── Tasks table ───────────────────────────────────────────────────────────
  if (tasks.length) {
    checkPage(20)
    setFont('bold', 8.5, PURPLE)
    txt('TASKS ASSIGNED THIS MONTH', margin, y)
    line(margin, y + 2, W - margin, PURPLE, 0.4)
    y += 8

    box(margin, y - 3, col, 8, PURPLE, 2)
    setFont('bold', 6.5, WHITE)
    txt('Order Serial', margin + 2, y + 2.5)
    txt('Task',         margin + 40, y + 2.5)
    txt('Expert',       margin + 90, y + 2.5)
    txt('Expert $',     margin + 130, y + 2.5, { align: 'right' })
    txt('Client $',     margin + 155, y + 2.5, { align: 'right' })
    txt('Profit',       W - margin - 2, y + 2.5, { align: 'right' })
    y += 10

    const monthTasks = tasks.filter((t) => inMonth(t.created_at))

    if (!monthTasks.length) {
      setFont('normal', 8, GREY); txt('No tasks assigned this month.', margin, y + 4); y += 12
    } else {
      monthTasks.forEach((t, i) => {
        checkPage(10)
        if (i % 2 === 0) box(margin, y - 3, col, 8, LIGHT, 1)
        setFont('normal', 6.5, DARK)
        txt(t.order_serial || t.task_finance?.order_serial || '—', margin + 2, y + 2)
        txt((t.title || '').slice(0, 25), margin + 40, y + 2)
        txt((t.experts?.name || '—').slice(0, 18), margin + 90, y + 2)
        setFont('bold', 6.5, DARK)
        txt(money(t.expert_budget, currency, rates), margin + 130, y + 2, { align: 'right' })
        txt(money(t.task_finance?.client_budget || 0, currency, rates), margin + 155, y + 2, { align: 'right' })
        const p = t.task_finance?.profit || 0
        setFont('bold', 6.5, p >= 0 ? GREEN : [239, 68, 68])
        txt(money(p, currency, rates), W - margin - 2, y + 2, { align: 'right' })
        y += 8
      })
    }
    y += 4
  }

  // ── Totals footer ─────────────────────────────────────────────────────────
  checkPage(24)
  box(margin, y, col, 22, [245, 243, 255], 3)
  doc.setDrawColor(...PURPLE)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, y, col, 22, 3, 3)

  const fp = col / 3
  setFont('normal', 7, GREY)
  txt('Total Revenue',  margin + fp * 0 + 8, y + 7, { align: 'center' })
  txt('Total Est. Cost', margin + fp * 1 + 8, y + 7, { align: 'center' })
  txt('Total Profit',   margin + fp * 2 + 8, y + 7, { align: 'center' })
  setFont('bold', 10, PURPLE)
  txt(money(totalRevenue, currency, rates), margin + fp * 0 + 8, y + 17, { align: 'center' })
  setFont('bold', 10, [37, 99, 235])
  txt(money(totalCost,    currency, rates), margin + fp * 1 + 8, y + 17, { align: 'center' })
  setFont('bold', 10, GREEN)
  txt(money(totalProfit,  currency, rates), margin + fp * 2 + 8, y + 17, { align: 'center' })

  // Dividers
  line(margin + fp,     y + 2, margin + fp,     y + 20, PURPLE, 0.3)
  line(margin + fp * 2, y + 2, margin + fp * 2, y + 20, PURPLE, 0.3)
  y += 30

  // ── Page footer on every page ─────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    box(0, H - 10, W, 10, PURPLE, 0)
    setFont('normal', 7, [196, 181, 253])
    txt(
      `${COMPANY.name}  ·  Confidential  ·  Page ${p} of ${pages}`,
      W / 2, H - 3.5, { align: 'center' }
    )
  }

  const filename = `TechSolutions-Report-${year}-${String(month).padStart(2,'0')}.pdf`
  doc.save(filename)
}
