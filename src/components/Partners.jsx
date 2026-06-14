import { partners } from '../data/content'

export default function Partners() {
  const loop = [...partners, ...partners]
  return (
    <section className="relative py-16 border-y border-purple-100/70 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-bold tracking-[0.25em] uppercase text-slate-400 mb-8">
          Trusted by forward-thinking teams
        </p>
        <div className="marquee-group marquee-mask overflow-hidden">
          <div className="marquee-track" style={{ '--marquee-duration': '32s' }}>
            {loop.map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="mx-7 sm:mx-10 flex items-center gap-2.5 shrink-0 select-none"
              >
                <span
                  className="grid place-items-center w-9 h-9 rounded-xl text-white text-sm font-black shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                >
                  {name[0]}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
