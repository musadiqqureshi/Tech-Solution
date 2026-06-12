import { Quote, Star } from 'lucide-react'
import { testimonials } from '../data/content'

function Card({ t }) {
  return (
    <div className="glass-card p-6 w-[340px] sm:w-[380px] shrink-0 mx-3 flex flex-col">
      <div className="flex items-center gap-1 mb-3 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
      </div>
      <Quote size={26} className="text-purple-200 mb-2" />
      <p className="text-sm text-slate-700 leading-relaxed mb-5">{t.text}</p>
      <div className="mt-auto flex items-center gap-3">
        <span
          className="grid place-items-center w-11 h-11 rounded-full text-white text-sm font-bold shrink-0"
          style={{ background: t.accent }}
        >
          {t.initials}
        </span>
        <div className="min-w-0">
          <div className="font-bold text-slate-900 text-sm truncate">{t.name}</div>
          <div className="text-xs text-slate-500 truncate">{t.role}</div>
        </div>
      </div>
    </div>
  )
}

function Row({ items, reverse, duration }) {
  const loop = [...items, ...items]
  return (
    <div className="marquee-group marquee-mask overflow-hidden py-2">
      <div className={`marquee-track ${reverse ? 'reverse' : ''}`} style={{ '--marquee-duration': duration }}>
        {loop.map((t, i) => <Card key={`${t.name}-${i}`} t={t} />)}
      </div>
    </div>
  )
}

export default function Testimonials() {
  const half = Math.ceil(testimonials.length / 2)
  const rowA = testimonials.slice(0, half)
  const rowB = testimonials.slice(half)

  return (
    <section id="testimonials" className="relative py-24 bg-aura-soft overflow-hidden">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center mb-14">
        <span className="section-tag">Testimonials</span>
        <h2 className="section-heading">Loved by <span className="gradient-text">teams worldwide</span></h2>
        <p className="text-slate-600 text-lg">Real words from the people we've built for.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Row items={rowA} duration="44s" />
        <Row items={rowB} reverse duration="50s" />
      </div>
    </section>
  )
}
