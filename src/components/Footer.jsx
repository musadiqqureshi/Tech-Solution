import { Cpu, Mail, Phone, ArrowUp } from 'lucide-react'

const links = [
  { label: 'Services', href: '#services' },
  { label: 'Work', href: '#projects' },
  { label: 'Reviews', href: '#testimonials' },
  { label: 'Process', href: '#process' },
  { label: 'Team', href: '#team' },
  { label: 'Contact', href: '#contact' },
]

export default function Footer() {
  const go = (href) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer className="relative border-t border-purple-100 bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4)' }}>
                <Cpu size={18} />
              </span>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Tech<span className="gradient-text">Solutions</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
              Software & web development, app building, and content & research writing — built with an aura of excellence.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Explore</h4>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                  <button onClick={() => go(l.href)} className="text-sm text-slate-600 hover:text-purple-700 transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:muzzammilkhan7890@gmail.com" className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-purple-700">
                  <Mail size={16} /> muzzammilkhan7890@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+923086994758" className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-purple-700">
                  <Phone size={16} /> +92 308 699 4758
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="section-separator my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Tech Solutions. All rights reserved.</p>
          <p className="text-xs text-slate-400">
            Led by Muhammad Hassan Ajmal Hashmi (CEO) & Musaddiq Ahmed Qureshi (CFO)
          </p>
          <button
            onClick={() => go('#hero')}
            className="grid place-items-center w-10 h-10 rounded-xl text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
            aria-label="Back to top"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </footer>
  )
}
