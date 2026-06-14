import { useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { convert } from '../lib/finance'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Group order rows into the last `months` calendar months, summing the chosen
// USD field(s); values are converted to the active currency for display.
export function monthlySeries(rows, fields, { currency = 'USD', rates = null, months = 6 } = {}) {
  const now = new Date()
  const buckets = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: MONTHS[d.getMonth()], ...Object.fromEntries(fields.map((f) => [f.key, 0])) })
  }
  const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]))
  rows.forEach((r) => {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key in idx) {
      const b = buckets[idx[key]]
      fields.forEach((f) => { b[f.key] += Number(r[f.field] || 0) })
    }
  })
  return buckets.map((b) => {
    const out = { name: b.name }
    fields.forEach((f) => { out[f.key] = Math.round(convert(b[f.key], currency, rates)) })
    return out
  })
}

export function FinanceAreaChart({ data, series, height = 240 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
          <Tooltip cursor={{ stroke: '#c4b5fd' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color}
              strokeWidth={2.5} fill={`url(#g-${s.key})`} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FinanceBarChart({ data, series, height = 240 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
          <Tooltip cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[5, 5, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Convenience hook to memoize the series build.
export function useMonthly(rows, fields, opts) {
  return useMemo(() => monthlySeries(rows || [], fields, opts), [rows, fields, opts?.currency, opts?.rates, opts?.months])
}
