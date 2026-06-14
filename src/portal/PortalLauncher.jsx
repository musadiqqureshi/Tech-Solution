import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { AuthProvider } from './AuthContext'
import Portal from './Portal'

// Self-contained: floating button + portal modal + auth provider.
export default function PortalLauncher() {
  const [open, setOpen] = useState(false)
  return (
    <AuthProvider>
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring' }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full text-white font-semibold shadow-xl"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4)', boxShadow: '0 16px 40px -10px rgba(124,58,237,0.6)' }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
        aria-label="Open client portal and AI assistant"
      >
        <span className="grid place-items-center w-7 h-7 rounded-full bg-white/20"><Bot size={17} /></span>
        <span className="hidden sm:inline text-sm">Portal &amp; AI</span>
      </motion.button>
      <Portal open={open} onClose={() => setOpen(false)} />
    </AuthProvider>
  )
}
