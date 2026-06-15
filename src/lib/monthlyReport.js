/**
 * monthlyReport.js — generates a monthly summary PDF for the admin
 * Includes: all orders table, per-service breakdown, totals, tasks table.
 * Uses jsPDF loaded via CDN in index.html.
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
  if (amount === null || amount === undefined) return '—'
  const n = Number(amount || 0)
  if (!currency || currency === 'USD') return `$${n.toLocaleString()}`
  const converted = rates ? convert(n, currency, rates) : n
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

export function generateMonthlyReport({ orders = [], tasks = [], currency = 'USD', rates = null, year, month }) {
  const { jsPDF } = window.jspdf
  if (!jsPDF) { alert('PDF library not loaded. Please try again in a moment.'); return }

  const inMonth = (ts) => {
    if (!ts) return false
    const d = new Date(ts)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  }

  const monthOrders  = orders.filter((o) => inMonth(o.created_at))
  const BILL_STATES  = ['approved','in_progress','delivered','completed']
  const billable     = monthOrders.filter((o) => BILL_STATES.includes(o.status))
  const totalRevenue = billable.reduce((s,o) => s + Number(o.budget    || 0), 0)
  const totalCost    = billable.reduce((s,o) => s + Number(o.est_cost  || 0), 0)
  const totalProfit  = billable.reduce((s,o) => s + Number(o.est_profit|| 0), 0)
  const paidCount    = billable.filter((o) => o.payment_status === 'paid').length
  const unpaidCount  = billable.length - paidCount

  const serviceMap = {}
  for (const o of billable) {
    const svc = o.service || 'Other'
    if (!serviceMap[svc]) serviceMap[svc] = { count:0, revenue:0, profit:0 }
    serviceMap[svc].count++
    serviceMap[svc].revenue += Number(o.budget    || 0)
    serviceMap[svc].profit  += Number(o.est_profit|| 0)
  }

  const doc  = new jsPDF({ unit:'mm', format:'a4' })
  const W    = doc.internal.pageSize.getWidth()
  const H    = doc.internal.pageSize.getHeight()
  const mg   = 14
  const col  = W - mg * 2
  let y      = mg

  const PURPLE = [124,58,237], DARK=[15,23,42], GREY=[100,116,139]
  const LIGHT=[241,245,249], WHITE=[255,255,255], GREEN=[5,150,105]

  const sf  = (style='normal',size=10,color=DARK) => { doc.setFont('helvetica',style); doc.setFontSize(size); doc.setTextColor(...color) }
  const ln  = (x1,yy,x2,color=[226,232,240],lw=0.25) => { doc.setDrawColor(...color); doc.setLineWidth(lw); doc.line(x1,yy,x2,yy) }
  const bx  = (x,yy,w,h,fill,r=2) => { doc.setFillColor(...fill); doc.roundedRect(x,yy,w,h,r,r,'F') }
  const tx  = (str,x,yy,opts={}) => doc.text(String(str??''),x,yy,opts)
  const chk = (need=12) => { if (y+need > H-18) { doc.addPage(); y=mg; bx(0,0,W,7,PURPLE,0) } }

  // Header
  bx(0,0,W,34,PURPLE,0)
  sf('bold',19,WHITE); tx('MONTHLY REPORT',mg,13)
  sf('normal',8,[196,181,253]); tx(COMPANY.name,mg,20); tx(`Generated: ${fmtDate(new Date())}  ·  ${COMPANY.email}`,mg,26)
  bx(W-mg-44,7,44,11,[109,40,217],2); sf('bold',8,WHITE); tx(monthLabel(year,month),W-mg-22,14,{align:'center'})
  y = 42

  // KPI cards
  const kpis=[
    {label:'Total Revenue', value:money(totalRevenue,currency,rates), color:PURPLE},
    {label:'Est. Cost',     value:money(totalCost,currency,rates),    color:[37,99,235]},
    {label:'Est. Profit',   value:money(totalProfit,currency,rates),  color:GREEN},
    {label:'Orders',        value:monthOrders.length,                  color:[245,158,11]},
    {label:'Paid',          value:paidCount,                           color:[13,148,136]},
    {label:'Unpaid',        value:unpaidCount,                         color:[239,68,68]},
  ]
  const kW=(col-5*3)/6
  kpis.forEach((k,i)=>{ const x=mg+i*(kW+3); bx(x,y,kW,19,LIGHT,2); sf('normal',6.5,GREY); tx(k.label,x+3,y+6); sf('bold',9,k.color); tx(String(k.value),x+3,y+15) })
  y+=27

  // Service breakdown
  if(Object.keys(serviceMap).length){
    chk(20)
    sf('bold',8.5,PURPLE); tx('SERVICE BREAKDOWN',mg,y); ln(mg,y+2,W-mg,PURPLE,0.4); y+=8
    bx(mg,y-3,col,8,PURPLE,2); sf('bold',7,WHITE)
    tx('Service',mg+3,y+2.5); tx('Orders',mg+90,y+2.5,{align:'right'}); tx('Revenue',mg+120,y+2.5,{align:'right'}); tx('Profit',W-mg-2,y+2.5,{align:'right'})
    y+=10
    Object.entries(serviceMap).forEach(([svc,d],i)=>{
      chk(10); if(i%2===0) bx(mg,y-3,col,8,LIGHT,1)
      sf('normal',7.5,DARK); tx(svc,mg+3,y+2)
      sf('bold',7.5,DARK); tx(String(d.count),mg+90,y+2,{align:'right'}); tx(money(d.revenue,currency,rates),mg+120,y+2,{align:'right'}); tx(money(d.profit,currency,rates),W-mg-2,y+2,{align:'right'})
      y+=8
    })
    y+=6
  }

  // Orders table
  chk(20)
  sf('bold',8.5,PURPLE); tx('ALL ORDERS THIS MONTH',mg,y); ln(mg,y+2,W-mg,PURPLE,0.4); y+=8

  if(!monthOrders.length){ sf('normal',8,GREY); tx('No orders in this month.',mg,y+4); y+=12 }
  else {
    const C={serial:mg+2,service:mg+30,client:mg+76,budget:mg+118,profit:mg+142,status:mg+162,paid:W-mg-2}
    bx(mg,y-3,col,8,PURPLE,2); sf('bold',6.5,WHITE)
    tx('Serial',C.serial,y+2.5); tx('Service',C.service,y+2.5); tx('Client',C.client,y+2.5)
    tx('Budget',C.budget,y+2.5,{align:'right'}); tx('Profit',C.profit,y+2.5,{align:'right'})
    tx('Status',C.status,y+2.5); tx('Paid',C.paid,y+2.5,{align:'right'})
    y+=10

    monthOrders.forEach((o,i)=>{
      chk(10); if(i%2===0) bx(mg,y-3,col,8,LIGHT,1)
      sf('normal',6.5,DARK)
      tx(o.order_serial||`#${o.id}`,C.serial,y+2)
      tx((o.service||'—').slice(0,16),C.service,y+2)
      tx((o.client_name||'Client').slice(0,14),C.client,y+2)
      sf('bold',6.5,DARK)
      tx(money(o.budget,currency,rates),C.budget,y+2,{align:'right'})
      tx(money(o.est_profit,currency,rates),C.profit,y+2,{align:'right'})
      const sc={pending:[245,158,11],approved:[37,99,235],in_progress:[124,58,237],delivered:[13,148,136],completed:[5,150,105],rejected:[239,68,68]}
      sf('bold',6,sc[o.status]||GREY); tx((o.status||'').replace('_',' '),C.status,y+2)
      const paid=o.payment_status==='paid'
      sf('bold',6,paid?GREEN:[239,68,68]); tx(paid?'✓ paid':'✗ unpaid',C.paid,y+2,{align:'right'})
      y+=8
    })
    y+=4
  }

  // Tasks table
  if(tasks.length){
    const monthTasks = tasks.filter((t)=>inMonth(t.created_at))
    if(monthTasks.length){
      chk(20)
      sf('bold',8.5,PURPLE); tx('TASKS ASSIGNED THIS MONTH',mg,y); ln(mg,y+2,W-mg,PURPLE,0.4); y+=8
      bx(mg,y-3,col,8,PURPLE,2); sf('bold',6.5,WHITE)
      tx('Order Serial',mg+2,y+2.5); tx('Task',mg+40,y+2.5); tx('Expert',mg+90,y+2.5)
      tx('Expert $',mg+130,y+2.5,{align:'right'}); tx('Client $',mg+155,y+2.5,{align:'right'}); tx('Profit',W-mg-2,y+2.5,{align:'right'})
      y+=10
      monthTasks.forEach((t,i)=>{
        chk(10); if(i%2===0) bx(mg,y-3,col,8,LIGHT,1)
        sf('normal',6.5,DARK)
        tx(t.order_serial||'—',mg+2,y+2)
        tx((t.title||'').slice(0,24),mg+40,y+2)
        tx((t.experts?.name||'—').slice(0,17),mg+90,y+2)
        sf('bold',6.5,DARK)
        tx(money(t.expert_budget,currency,rates),mg+130,y+2,{align:'right'})
        tx(money(t.task_finance?.client_budget||0,currency,rates),mg+155,y+2,{align:'right'})
        const p=t.task_finance?.profit||0
        sf('bold',6.5,p>=0?GREEN:[239,68,68]); tx(money(p,currency,rates),W-mg-2,y+2,{align:'right'})
        y+=8
      })
      y+=4
    }
  }

  // Totals box
  chk(26); bx(mg,y,col,22,[245,243,255],3)
  doc.setDrawColor(...PURPLE); doc.setLineWidth(0.5); doc.roundedRect(mg,y,col,22,3,3)
  const fp=col/3
  sf('normal',7,GREY)
  tx('Total Revenue',mg+fp*0+fp/2,y+7,{align:'center'})
  tx('Total Est. Cost',mg+fp*1+fp/2,y+7,{align:'center'})
  tx('Total Profit',mg+fp*2+fp/2,y+7,{align:'center'})
  sf('bold',10,PURPLE); tx(money(totalRevenue,currency,rates),mg+fp*0+fp/2,y+17,{align:'center'})
  sf('bold',10,[37,99,235]);  tx(money(totalCost,currency,rates),mg+fp*1+fp/2,y+17,{align:'center'})
  sf('bold',10,GREEN);         tx(money(totalProfit,currency,rates),mg+fp*2+fp/2,y+17,{align:'center'})
  ln(mg+fp,y+2,mg+fp,PURPLE,0.3); ln(mg+fp*2,y+2,mg+fp*2,PURPLE,0.3)

  // Page footers
  const pages=doc.internal.getNumberOfPages()
  for(let p=1;p<=pages;p++){
    doc.setPage(p); bx(0,H-9,W,9,PURPLE,0); sf('normal',7,[196,181,253])
    tx(`${COMPANY.name}  ·  Confidential  ·  Page ${p} of ${pages}`,W/2,H-3,{align:'center'})
  }

  doc.save(`TechSolutions-Report-${year}-${String(month).padStart(2,'0')}.pdf`)
}
