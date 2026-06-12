import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, Cpu } from 'lucide-react'

const links = [
  { label: 'Home', href: '#hero' },
  { label: 'Services', href: '#services' },
  { label: 'Work', href: '#projects' },
  { label: 'Why Us', href: '#why' },
  { label: 'Reviews', href: '#testimonials' },
  { label: 'Team', href: '#team' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (href) => {
    setOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(124,58,237,0.1)' : '1px solid transparent',
        boxShadow: scrolled ? '0 8px 30px -16px rgba(76,29,149,0.2)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button onClick={() => go('#hero')} className="flex items-center gap-2.5 group">
            <span className="grid place-items-center w-9 h-9 rounded-xl text-white shadow-lg shadow-purple-500/30"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4)' }}>
              <Cpu size={18} />
            </span>
            <span className="text-lg font-black tracking-tight text-slate-900">
              Tech<span className="gradient-text">Solutions</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => go(l.href)}
                className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {l.label}
              </button>
            ))}
            <button onClick={() => go('#contact')} className="btn-primary ml-2 !px-5 !py-2.5 text-sm">
              Get a Quote
            </button>
          </div>

          <button className="md:hidden text-slate-800 p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden overflow-hidden border-t border-purple-100"
          style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)' }}
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => go(l.href)}
                className="text-left px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
              >
                {l.label}
              </button>
            ))}
            <button onClick={() => go('#contact')} className="btn-primary mt-2 justify-center">
              Get a Quote
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
