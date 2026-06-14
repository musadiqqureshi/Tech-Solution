// Small shared UI atoms for the portal.

export function StatCard({ label, value, sub, accent = '#7c3aed' }) {
  return (
    <div className="glass-card p-3 sm:p-5">
      <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{label}</div>
      <div className="text-lg sm:text-2xl font-black mt-1 break-all leading-tight" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  delivered: 'bg-teal-100 text-teal-700',
  completed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  requested: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

export function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
      {String(status || '').replace('_', ' ')}
    </span>
  )
}

const PRIORITY = { low: 'text-slate-500', medium: 'text-blue-600', high: 'text-rose-600' }
export function Priority({ value }) {
  return <span className={`text-xs font-bold ${PRIORITY[value] || ''}`}>● {value}</span>
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}
