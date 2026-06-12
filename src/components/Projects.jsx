import { motion } from 'framer-motion'
import { projects } from '../data/content'

export default function Projects() {
  return (
    <section id="projects" className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-tag">Our Work</span>
          <h2 className="section-heading">Projects we're <span className="gradient-text">proud of</span></h2>
          <p className="text-slate-600 text-lg">
            A selection of platforms, pipelines, and products we've shipped across industries.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
              className="glass-card p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="grid place-items-center w-12 h-12 rounded-2xl text-2xl shadow-lg"
                  style={{ background: p.gradient, boxShadow: '0 12px 24px -12px rgba(124,58,237,0.5)' }}
                >
                  {p.icon}
                </span>
                <span className="skill-pill">{p.category}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{p.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{p.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.tech.map((t) => (
                  <span key={t} className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600">{t}</span>
                ))}
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 text-sm font-semibold gradient-text">
                {p.impact}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
