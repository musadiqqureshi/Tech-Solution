/**
 * invoice.js — generates a professional PDF invoice using jsPDF (loaded via CDN)
 *
 * Company / bank details are hardcoded per the brief.
 * Call generateInvoice(order, profile, currency) → downloads the PDF instantly.
 */

import { convert } from './finance'

// ── Company info ────────────────────────────────────────────────────────────
const COMPANY = {
  name:    'Tech Solutions Pakistan',
  contact: 'Muhammad Mussaddiq Ahmed Qureshi',
  email:   'info@techsolutionspk.com',
  phone:   '+92 308 6994758',
  address: 'Jhang Rd, Muzaffargarh, Pakistan',
}

const BANK = {
  name:    'Meezan Bank',
  title:   'MUHAMMAD MUSSADDIQ AHMED QURESHI',
  account: '68020114723362',
  iban:    'PK87MEZN0068020114723362',
  branch:  'Jhang Rd Muzaffargarh Branch',
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(4, '0') }

function today() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function dueDate(days = 7) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

const CURRENCY_SYMBOLS = { USD: '$', PKR: 'PKR ', GBP: '£', EUR: '€', AUD: 'A$', CAD: 'C$' }

function money(amount, currency, rates) {
  if (currency === 'USD' || !currency) return `$${Number(amount || 0).toLocaleString()}`
  const converted = convert(amount, currency, rates)
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `
  return `${symbol}${Math.round(converted).toLocaleString()}`
}

// ── Main generator ───────────────────────────────────────────────────────────
export function generateInvoice(order, profile, currency = 'USD', rates = null) {
  const { jsPDF } = window.jspdf
  if (!jsPDF) { alert('PDF library not loaded yet. Please try again in a moment.'); return }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210
  const margin = 15
  const col = W - margin * 2
  let y = margin

  // ── Color palette ─────────────────────────────────────────────────────────
  const PURPLE  = [124, 58, 237]
  const DARK    = [15, 23, 42]
  const GREY    = [100, 116, 139]
  const LIGHT   = [241, 245, 249]
  const WHITE   = [255, 255, 255]
  const GREEN   = [13, 148, 136]

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setFont  = (style = 'normal', size = 10, color = DARK) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }
  const line = (x1, yy, x2, color = [226, 232, 240], lw = 0.3) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(lw)
    doc.line(x1, yy, x2, yy)
  }
  const box = (x, yy, w, h, fill, radius = 2) => {
    doc.setFillColor(...fill)
    doc.roundedRect(x, yy, w, h, radius, radius, 'F')
  }
  const text = (str, x, yy, opts = {}) => doc.text(String(str ?? ''), x, yy, opts)

  // ── Header band ───────────────────────────────────────────────────────────
  box(0, 0, W, 38, PURPLE, 0)

  setFont('bold', 22, WHITE)
  text('INVOICE', margin, 16)

  setFont('normal', 8, [196, 181, 253])
  text('Tech Solutions Pakistan', margin, 23)

  // Invoice number badge
  const invNo = order.order_serial ? `INV-${order.order_serial}` : `INV-${pad(order.id)}`
  box(W - margin - 38, 8, 38, 10, [109, 40, 217], 2)
  setFont('bold', 9, WHITE)
  text(invNo, W - margin - 19, 14.5, { align: 'center' })

  y = 46

  // ── Meta row  (Invoice Date / Due Date / Status / Payment) ────────────────
  const paymentStatus = order.payment_status === 'paid' ? 'PAID' : 'UNPAID'
  const metaItems = [
    { label: 'Invoice Date', value: today() },
    { label: 'Due Date',     value: dueDate(7) },
    { label: 'Project Status', value: String(order.status || 'pending').replace('_', ' ').toUpperCase() },
    { label: 'Payment Status', value: paymentStatus },
  ]
  const metaW = col / 4
  metaItems.forEach((m, i) => {
    const x = margin + i * metaW
    box(x, y, metaW - 3, 16, LIGHT, 2)
    setFont('normal', 7.5, GREY)
    text(m.label, x + 4, y + 6)
    setFont('bold', 9, i === 3 ? (paymentStatus === 'PAID' ? GREEN : [220, 38, 38]) : (i === 2 ? GREEN : DARK))
    text(m.value, x + 4, y + 13)
  })
  y += 24

  // ── From / Bill To columns ─────────────────────────────────────────────────
  const halfW = (col - 6) / 2

  // FROM
  box(margin, y, halfW, 46, LIGHT, 2)
  setFont('bold', 8, PURPLE)
  text('FROM', margin + 4, y + 8)
  setFont('bold', 9, DARK)
  text(COMPANY.name,    margin + 4, y + 16)
  setFont('normal', 8, GREY)
  text(COMPANY.contact, margin + 4, y + 22)
  text(COMPANY.email,   margin + 4, y + 28)
  text(COMPANY.phone,   margin + 4, y + 34)
  text(COMPANY.address, margin + 4, y + 40)

  // BILL TO
  const bx = margin + halfW + 6
  box(bx, y, halfW, 46, LIGHT, 2)
  setFont('bold', 8, PURPLE)
  text('BILL TO', bx + 4, y + 8)
  setFont('bold', 9, DARK)
  text(profile?.name  || 'Client',        bx + 4, y + 16)
  setFont('normal', 8, GREY)
  text(profile?.email || '—',             bx + 4, y + 22)
  text(profile?.phone || '—',             bx + 4, y + 28)
  text(profile?.company || '—',           bx + 4, y + 34)
  y += 54

  // ── Project details ────────────────────────────────────────────────────────
  setFont('bold', 9, PURPLE)
  text('PROJECT DETAILS', margin, y)
  line(margin, y + 2, W - margin, PURPLE, 0.5)
  y += 8

  const details = [
    ['Project Name',   order.service || '—'],
    ['Project ID / Serial', order.order_serial || `#${order.id}`],
    ['Status',         String(order.status || 'pending').replace('_',' ')],
    ['Priority',       order.priority || 'medium'],
    ['Deadline',       order.deadline || '—'],
  ]
  details.forEach(([label, val], i) => {
    if (i % 2 === 0) box(margin, y - 3, col, 8, LIGHT, 1)
    setFont('normal', 8, GREY);  text(label, margin + 3, y + 3)
    setFont('bold',   8, DARK);  text(val,   margin + 55, y + 3)
    y += 8
  })

  if (order.description) {
    y += 2
    setFont('normal', 7.5, GREY)
    const lines = doc.splitTextToSize(order.description, col - 6)
    box(margin, y - 3, col, lines.length * 5 + 6, [248, 245, 255], 2)
    setFont('normal', 8, DARK)
    doc.text(lines, margin + 3, y + 3)
    y += lines.length * 5 + 8
  } else {
    y += 4
  }

  // ── Line items table ───────────────────────────────────────────────────────
  setFont('bold', 9, PURPLE)
  text('SERVICES', margin, y)
  line(margin, y + 2, W - margin, PURPLE, 0.5)
  y += 8

  // Table header
  box(margin, y - 3, col, 9, PURPLE, 2)
  setFont('bold', 8, WHITE)
  const cols = { desc: margin + 3, qty: margin + 100, rate: margin + 125, amt: W - margin - 3 }
  text('Service / Item', cols.desc, y + 3)
  text('Qty',            cols.qty,  y + 3)
  text('Rate',           cols.rate, y + 3)
  text('Amount',         cols.amt,  y + 3, { align: 'right' })
  y += 12

  // Breakdown rows from order
  const rawBudget = Number(order.budget || 0)

  const items = order.breakdown
    ? Object.entries(order.breakdown).map(([k, v]) => ({
        label: k.charAt(0).toUpperCase() + k.slice(1),
        qty: 1,
        unitPrice: v,
      }))
    : [{ label: order.service || 'Project Service', qty: 1, unitPrice: rawBudget }]

  items.forEach((item, i) => {
    if (i % 2 === 0) box(margin, y - 3, col, 8, LIGHT, 1)
    setFont('normal', 8, DARK)
    text(item.label, cols.desc, y + 3)
    text(String(item.qty), cols.qty, y + 3)
    text(money(item.unitPrice, currency, rates), cols.rate, y + 3)
    setFont('bold', 8, DARK)
    text(money(item.unitPrice * item.qty, currency, rates), cols.amt, y + 3, { align: 'right' })
    y += 8
  })
  y += 4

  // ── Totals ────────────────────────────────────────────────────────────────
  line(margin, y, W - margin)
  y += 6

  const subtotal  = rawBudget
  const tax       = 0
  const discount  = 0
  const total     = subtotal + tax - discount

  const totRows = [
    { label: 'Subtotal',         value: money(subtotal,  currency, rates), bold: false },
    { label: 'Tax / VAT (0%)',   value: money(tax,       currency, rates), bold: false },
    { label: 'Discount',         value: money(discount,  currency, rates), bold: false },
  ]

  totRows.forEach(({ label, value }) => {
    setFont('normal', 8.5, GREY)
    text(label, W - margin - 70, y)
    setFont('normal', 8.5, DARK)
    text(value, W - margin, y, { align: 'right' })
    y += 7
  })

  // Total row
  box(W - margin - 74, y - 5, 74, 11, PURPLE, 2)
  setFont('bold', 9, WHITE)
  text('Total Amount Due', W - margin - 70, y + 3)
  text(money(total, currency, rates), W - margin - 2, y + 3, { align: 'right' })
  y += 18

  // ── Payment details ───────────────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = margin }

  setFont('bold', 9, PURPLE)
  text('PAYMENT DETAILS', margin, y)
  line(margin, y + 2, W - margin, PURPLE, 0.5)
  y += 8

  box(margin, y - 3, col, 38, LIGHT, 2)
  const bankRows = [
    ['Bank Name',       BANK.name],
    ['Account Title',   BANK.title],
    ['Account Number',  BANK.account],
    ['IBAN',            BANK.iban],
    ['Branch',          BANK.branch],
  ]
  bankRows.forEach(([label, val]) => {
    setFont('normal', 8, GREY);  text(label, margin + 3, y + 3)
    setFont('bold',   8, DARK);  text(val,   margin + 40, y + 3)
    y += 7
  })
  y += 6

  // ── Notes ─────────────────────────────────────────────────────────────────
  box(margin, y, col, 14, [254, 252, 232], 2)
  doc.setDrawColor(253, 224, 71)
  doc.setLineWidth(0.4)
  doc.line(margin, y, margin, y + 14)
  setFont('bold', 8, [161, 98, 7])
  text('Note', margin + 4, y + 6)
  setFont('normal', 8, [113, 63, 18])
  text('Thank you for your business. Please contact us if you have any questions about this invoice.', margin + 4, y + 12)
  y += 20

  // ── Signature ─────────────────────────────────────────────────────────────
  line(margin, y, margin + 55, DARK, 0.4)
  setFont('normal', 8, GREY)
  text('Authorized Signature', margin, y + 5)
  setFont('bold', 8, DARK)
  text(COMPANY.contact, margin, y + 11)
  text(COMPANY.name,    margin, y + 17)

  // ── Footer band ────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  box(0, pageH - 12, W, 12, PURPLE, 0)
  setFont('normal', 7.5, [196, 181, 253])
  text(`${COMPANY.name}  ·  ${COMPANY.email}  ·  ${COMPANY.phone}`, W / 2, pageH - 4.5, { align: 'center' })

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`Invoice-${invNo}-${(profile?.name || 'Client').replace(/\s+/g, '-')}.pdf`)
}
