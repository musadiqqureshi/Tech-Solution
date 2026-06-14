import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, ChevronDown, Code2, Globe, Smartphone, PenTool } from 'lucide-react'
import { stats } from '../data/content'

const phrases = [
  'Software Development',
  'Web Development',
  'App Building',
  'Content & Research Writing',
  'AI Automation & Workflows',
  'AI Agents & Chatbots',
]

const floatIcons = [
  { Icon: Code2, style: 'top-[12%] left-[6%]', d: 0 },
  { Icon: Globe, style: 'top-[22%] right-[8%]', d: 0.6 },
  { Icon: Smartphone, style: 'bottom-[26%] left-[10%]', d: 1.2 },
  { Icon: PenTool, style: 'bottom-[18%] right-[12%]', d: 1.8 },
]

export default function Hero() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % phrases.length), 2400)
    return () => clearInterval(t)
  }, [])

  const go = (href) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-aura-mesh pt-28 pb-20">
      <div className="orb w-96 h-96 top-[10%] left-[15%]" style={{ background: '#a78bfa' }} />
      <div className="orb w-80 h-80 bottom-[12%] right-[15%]" style={{ background: '#67e8f9' }} />
      <div className="orb w-72 h-72 top-[40%] left-[55%]" style={{ background: '#93c5fd', opacity: 0.4 }} />

      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {floatIcons.map(({ Icon, style, d }, idx) => (
        <motion.div
          key={idx}
          className={`hidden lg:grid place-items-center absolute ${style} w-14 h-14 rounded-2xl glass-card text-purple-600`}
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: d, ease: 'easeInOut' }}
        >
          <Icon size={24} />
        </motion.div>
      ))}

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="section-tag"
        >
          <Sparkles size={13} />
          Software · Web · Apps · Content
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-slate-900"
        >
          We build digital products with an{' '}
          <span className="gradient-text">aura</span> of excellence
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="h-9 mt-5 flex items-center justify-center"
        >
          <span className="text-slate-500 text-lg mr-2">We deliver</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-lg font-mono font-bold gradient-text-gold"
            >
              {phrases[i]}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Tech Solutions is a software studio crafting scalable web & mobile applications,
          custom software, and sharp, well-researched content — engineered to grow your business.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-9"
        >
          <button onClick={() => go('#contact')} className="btn-primary">
            Start a Project <ArrowRight size={18} />
          </button>
          <button onClick={() => go('#services')} className="btn-secondary">
            Explore Services
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 max-w-2xl mx-auto"
        >
          {stats.map((s) => (
            <div key={s.label} className="glass-card py-5 px-2">
              <div className="text-2xl sm:text-3xl font-black gradient-text">{s.val}</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        onClick={() => go('#services')}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown size={20} />
        </motion.span>
      </motion.button>
    </section>
  )
}
