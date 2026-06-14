import { useEffect, useState } from 'react'
import { Loader2, UserPlus, Trash2, Eye, EyeOff, Link2 } from 'lucide-react'
import { listExperts, createExpert, updateExpert, deleteExpert, linkExpertLogin } from '../../lib/experts'
import { Field } from '../ui'

const ACCENTS = ['purple', 'cyan', 'teal', 'gold', 'emerald']
const DOT = { purple: '#7c3aed', cyan: '#06b6d4', teal: '#0d9488', gold: '#f59e0b', emerald: '#10b981' }

export default function ExpertsPanel() {
  const [experts, setExperts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', title: '', bio: '', skills: '', accent: 'purple', email: '', showOnHero: true })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const reload = async () => {
    setLoading(true)
    try { setExperts(await listExperts()) } catch (e) { setErr(e.message) }
    setLoading(false)
  }
  useEffect(() => { reload() }, [])

  const add = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      let userId = null
      if (form.email.trim()) userId = await linkExpertLogin(form.email.trim())
      await createExpert({ ...form, userId })
      setForm({ name: '', title: '', bio: '', skills: '', accent: 'purple', email: '', showOnHero: true })
      await reload()
    } catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }

  const toggleHero = async (x) => { await updateExpert(x.id, { show_on_hero: !x.show_on_hero }); reload() }
  const remove = async (x) => { if (confirm(`Remove ${x.name}?`)) { await deleteExpert(x.id); reload() } }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <form onSubmit={add} className="lg:col-span-2 glass-card p-6 space-y-4 h-fit">
        <h4 className="font-bold text-slate-900 flex items-center gap-2"><UserPlus size={18} /> Add expert</h4>
        <Field label="Full name"><input name="name" value={form.name} onChange={on} className="contact-input" required /></Field>
        <Field label="Title / role"><input name="title" value={form.title} onChange={on} placeholder="e.g. Full-Stack Developer" className="contact-input" /></Field>
        <Field label="Short bio"><textarea name="bio" value={form.bio} onChange={on} rows={2} className="contact-input resize-none" /></Field>
        <Field label="Skills (comma separated)"><input name="skills" value={form.skills} onChange={on} placeholder="React, Node, Figma" className="contact-input" /></Field>
        <Field label="Accent">
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button type="button" key={a} onClick={() => setForm((f) => ({ ...f, accent: a }))}
                className={`w-8 h-8 rounded-full border-2 ${form.accent === a ? 'border-slate-800' : 'border-transparent'}`} style={{ background: DOT[a] }} />
            ))}
          </div>
        </Field>
        <Field label="Link login (optional — their signup email)">
          <input name="email" type="email" value={form.email} onChange={on} placeholder="ibrahim@example.com" className="contact-input" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.showOnHero} onChange={(e) => setForm((f) => ({ ...f, showOnHero: e.target.checked }))} />
          Show on public homepage
        </label>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button disabled={busy} className="btn-primary w-full justify-center">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Add expert
        </button>
      </form>

      <div className="lg:col-span-3 space-y-3">
        <h4 className="font-bold text-slate-900">Team ({experts.length})</h4>
        {loading ? <div className="grid place-items-center py-10 text-slate-400"><Loader2 className="animate-spin" /></div>
          : !experts.length ? <p className="text-slate-500 text-sm">No experts yet.</p>
          : experts.map((x) => (
            <div key={x.id} className="glass-card p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl grid place-items-center text-white font-black shrink-0" style={{ background: DOT[x.accent] || DOT.purple }}>
                {x.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  {x.name}
                  {x.user_id && <span title="Has login" className="text-teal-600"><Link2 size={13} /></span>}
                </div>
                <div className="text-xs text-slate-500 truncate">{x.title}{x.skills?.length ? ` · ${x.skills.join(', ')}` : ''}</div>
              </div>
              <button onClick={() => toggleHero(x)} title={x.show_on_hero ? 'On homepage' : 'Hidden'} className={`p-2 rounded-lg ${x.show_on_hero ? 'text-teal-600 hover:bg-teal-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                {x.show_on_hero ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button onClick={() => remove(x)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button>
            </div>
          ))}
      </div>
    </div>
  )
}
