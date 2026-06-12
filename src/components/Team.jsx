import { motion } from 'framer-motion'
import { ExternalLink, Phone } from 'lucide-react'
import { team } from '../data/content'

const accents = {
  purple: 'linear-gradient(135deg, #7c3aed, #2563eb)',
  cyan: 'linear-gradient(135deg, #06b6d4, #2563eb)',
}

export default function Team() {
  return (
    <section id="team" className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-tag">Leadership</span>
          <h2 className="section-heading">The people <span className="gradient-text">behind the work</span></h2>
          <p className="text-slate-600 text-lg">A leadership team that pairs business vision with deep technical craft.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-7 max-w-3xl mx-auto">
          {team.map((m, idx) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="glass-card p-8 text-center"
            >
              <span
                className="grid place-items-center w-24 h-24 mx-auto rounded-3xl text-white text-2xl font-black mb-5 shadow-xl"
                style={{ background: accents[m.accent], boxShadow: '0 18px 40px -16px rgba(124,58,237,0.6)' }}
              >
                {m.initials}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{m.name}</h3>
              <p className="text-sm font-semibold gradient-text mt-1">{m.role}</p>
              <p className="text-sm text-slate-600 leading-relaxed mt-4">{m.bio}</p>
              {m.phone && (
                <a
                  href={`tel:${m.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-900 mt-5"
                >
                  <Phone size={14} /> {m.phone}
                </a>
              )}
              {m.link && (
                <a
                  href={m.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-900 mt-5"
                >
                  View Portfolio <ExternalLink size={14} />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
