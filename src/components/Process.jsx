import { motion } from 'framer-motion'
import { process } from '../data/content'

export default function Process() {
  return (
    <section id="process" className="relative py-24 bg-aura-soft overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-tag">How We Work</span>
          <h2 className="section-heading">A simple, <span className="gradient-text">transparent process</span></h2>
          <p className="text-slate-600 text-lg">Four clear stages that keep you informed from kickoff to launch.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {process.map((p, idx) => (
            <motion.div
              key={p.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative glass-card p-7"
            >
              <span className="text-5xl font-black gradient-text opacity-90">{p.step}</span>
              <h3 className="text-lg font-bold text-slate-900 mt-3 mb-2">{p.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              {idx < process.length - 1 && (
                <span className="hidden lg:block absolute top-1/2 -right-3 w-6 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.5), rgba(6,182,212,0.5))' }} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
