import { useEffect, useMemo, useState } from 'react'
import { Loader2, Briefcase, CheckCircle2, Clock, Wallet } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { listMyTasks, updateTaskStatus } from '../lib/experts'
import { fmtMoney } from '../lib/finance'
import { StatCard } from './ui'

const FLOW = ['assigned', 'in_progress', 'submitted', 'approved', 'completed']
const LABEL = { assigned: 'Assigned', in_progress: 'In progress', submitted: 'Submitted', approved: 'Approved', completed: 'Completed' }
const COLOR = { assigned: '#94a3b8', in_progress: '#2563eb', submitted: '#7c3aed', approved: '#0d9488', completed: '#059669' }

export default function ExpertDashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const reload = async () => {
    setLoading(true)
    try { setTasks(await listMyTasks()) } catch (e) { /* RLS/network */ }
    setLoading(false)
  }
  useEffect(() => { reload() }, [])

  const stats = useMemo(() => {
    const active = tasks.filter((t) => !['completed', 'approved'].includes(t.status)).length
    const done = tasks.filter((t) => ['completed', 'approved'].includes(t.status)).length
    const earned = tasks.filter((t) => ['approved', 'completed'].includes(t.status)).reduce((s, t) => s + Number(t.expert_budget || 0), 0)
    const pipeline = tasks.reduce((s, t) => s + Number(t.expert_budget || 0), 0)
    return { active, done, earned, pipeline }
  }, [tasks])

  const chart = useMemo(() => {
    const m = {}
    tasks.forEach((t) => { m[t.status] = (m[t.status] || 0) + Number(t.expert_budget || 0) })
    return FLOW.map((s) => ({ name: LABEL[s], value: m[s] || 0, key: s }))
  }, [tasks])

  const advance = async (t) => {
    const idx = FLOW.indexOf(t.status)
    const next = FLOW[Math.min(idx + 1, FLOW.length - 1)]
    if (next === t.status) return
    setBusyId(t.id)
    try { await updateTaskStatus(t.id, next); await reload() } finally { setBusyId(null) }
  }

  if (loading) return <div className="grid place-items-center py-20 text-slate-400"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Tasks" value={stats.active} sub="in progress" accent="#2563eb" />
        <StatCard label="Completed" value={stats.done} sub="approved/done" accent="#059669" />
        <StatCard label="Earned" value={fmtMoney(stats.earned)} sub="approved work" accent="#0d9488" />
        <StatCard label="Pipeline" value={fmtMoney(stats.pipeline)} sub="all assigned" accent="#7c3aed" />
      </div>

      <div className="glass-card p-5">
        <h3 className="font-bold text-slate-900 mb-1">Earnings by stage</h3>
        <p className="text-xs text-slate-400 mb-4">Budget allocated to you across task stages (USD).</p>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chart} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmtMoney(v)} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chart.map((c) => <Cell key={c.key} fill={COLOR[c.key]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Briefcase size={18} /> Assigned tasks</h3>
        {!tasks.length && <p className="text-slate-500 text-sm py-8 text-center glass-card">No tasks assigned yet. Your admin will allot work to you here.</p>}
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900">{t.title}</h4>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: `${COLOR[t.status]}1a`, color: COLOR[t.status] }}>
                      {LABEL[t.status]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">For {t.client_alias}{t.service ? ` · ${t.service}` : ''}{t.due_date ? ` · due ${t.due_date}` : ''}</div>
                  {t.description && <p className="text-sm text-slate-500 mt-2 max-w-xl">{t.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-black gradient-text">{fmtMoney(t.expert_budget)}</div>
                  <div className="text-[11px] text-slate-400">your budget</div>
                </div>
              </div>
              {!['completed'].includes(t.status) && (
                <button onClick={() => advance(t)} disabled={busyId === t.id}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-900">
                  {busyId === t.id ? <Loader2 size={15} className="animate-spin" /> : t.status === 'approved' ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                  Move to “{LABEL[FLOW[Math.min(FLOW.indexOf(t.status) + 1, FLOW.length - 1)]]}”
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
