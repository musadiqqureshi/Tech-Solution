import { motion } from 'framer-motion'
import { Code2, Globe, Smartphone, PenTool, Workflow, Bot, Check } from 'lucide-react'
import { services } from '../data/content'

const icons = { Code2, Globe, Smartphone, PenTool, Workflow, Bot }

const accents = {
  purple: { from: '#7c3aed', to: '#6d28d9', soft: 'rgba(124,58,237,0.1)' },
  blue: { from: '#2563eb', to: '#1d4ed8', soft: 'rgba(37,99,235,0.1)' },
  cyan: { from: '#06b6d4', to: '#0891b2', soft: 'rgba(6,182,212,0.1)' },
  gold: { from: '#f59e0b', to: '#d97706', soft: 'rgba(245,158,11,0.12)' },
  violet: { from: '#8b5cf6', to: '#7c3aed', soft: 'rgba(139,92,246,0.1)' },
  emerald: { from: '#10b981', to: '#059669', soft: 'rgba(16,185,129,0.1)' },
}

export default function Services() {
  return (
    <section id="services" className="relative py-24 bg-aura-soft overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-tag">What We Do</span>
          <h2 className="section-heading">Services that <span className="gradient-text">move you forward</span></h2>
          <p className="text-slate-600 text-lg">
            One team for your whole digital journey — from the first line of code to the final published word.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, idx) => {
            const Icon = icons[s.icon]
            const a = accents[s.accent]
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card p-7 flex flex-col"
              >
                <span
                  className="grid place-items-center w-14 h-14 rounded-2xl text-white mb-5 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})`, boxShadow: `0 12px 24px -10px ${a.from}` }}
                >
                  <Icon size={26} />
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">{s.desc}</p>
                <ul className="mt-auto space-y-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="grid place-items-center w-5 h-5 rounded-full shrink-0" style={{ background: a.soft }}>
                        <Check size={12} style={{ color: a.from }} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
