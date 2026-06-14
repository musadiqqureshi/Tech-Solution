import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { listHeroExperts } from '../lib/experts'

const ACCENTS = {
  purple: 'linear-gradient(135deg,#7c3aed,#2563eb)',
  cyan: 'linear-gradient(135deg,#06b6d4,#2563eb)',
  teal: 'linear-gradient(135deg,#0d9488,#06b6d4)',
  gold: 'linear-gradient(135deg,#f59e0b,#d97706)',
  emerald: 'linear-gradient(135deg,#10b981,#059669)',
}

const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Experts() {
  const [experts, setExperts] = useState([])

  useEffect(() => {
    listHeroExperts().then(setExperts).catch(() => setExperts([]))
  }, [])

  if (!experts.length) return null // hidden until the admin adds experts

  return (
    <section id="experts" className="relative py-24 bg-aura-soft overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-tag">Our Experts</span>
          <h2 className="section-heading">The specialists <span className="gradient-text">behind your build</span></h2>
          <p className="text-slate-600 text-lg">A hand-picked team of engineers, designers, and writers ready to deliver.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.map((e, idx) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
              className="glass-card p-6 text-center"
            >
              <span className="grid place-items-center w-20 h-20 mx-auto rounded-3xl text-white text-xl font-black mb-4 shadow-lg"
                style={{ background: ACCENTS[e.accent] || ACCENTS.purple }}>
                {e.avatar_url ? <img src={e.avatar_url} alt={e.name} className="w-full h-full object-cover rounded-3xl" /> : initials(e.name)}
              </span>
              <h3 className="font-bold text-slate-900">{e.name}</h3>
              <p className="text-sm font-semibold gradient-text mt-0.5">{e.title}</p>
              {e.bio && <p className="text-sm text-slate-600 leading-relaxed mt-3">{e.bio}</p>}
              {e.skills?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                  {e.skills.map((s) => <span key={s} className="skill-pill">{s}</span>)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
