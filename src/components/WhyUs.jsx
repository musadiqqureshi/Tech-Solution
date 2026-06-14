import { motion } from 'framer-motion'
import { Rocket, ShieldCheck, Users, Sparkles } from 'lucide-react'
import { whyUs } from '../data/content'

const icons = { Rocket, ShieldCheck, Users, Sparkles }

export default function WhyUs() {
  return (
    <section id="why" className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="section-tag">Why Tech Solutions</span>
            <h2 className="section-heading">A partner that <span className="gradient-text">cares about the details</span></h2>
            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              We're a focused team that treats every project like our own product. That means honest timelines,
              clean work, and communication you never have to chase.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Whether you need a full platform, a mobile app, or polished content, we bring engineering rigor
              and a genuine eye for craft — so the final result simply feels premium.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {whyUs.map((w, idx) => {
              const Icon = icons[w.icon]
              return (
                <motion.div
                  key={w.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="glass-card p-6"
                >
                  <span className="grid place-items-center w-12 h-12 rounded-xl mb-4"
                    style={{ background: 'rgba(124,58,237,0.1)', color: '#6d28d9' }}>
                    <Icon size={22} />
                  </span>
                  <h3 className="font-bold text-slate-900 mb-1.5">{w.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{w.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
