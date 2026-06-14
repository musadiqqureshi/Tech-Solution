import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, LayoutDashboard, MessageSquare, ShieldCheck, AlertTriangle, Bot } from 'lucide-react'
import { useAuth } from './AuthContext'
import Auth from './Auth'
import Assistant from './Assistant'
import ClientDashboard from './ClientDashboard'
import AdminDashboard from './AdminDashboard'
import { ClientChat, AdminChat } from './LiveChat'
import { CurrencyProvider } from './CurrencyContext'

export default function Portal({ open, onClose }) {
  const { configured, user, profile, isAdmin, loading, signOut } = useAuth()
  const [view, setView] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey((k) => k + 1)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center sm:p-4"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
            className="bg-slate-50 w-full sm:max-w-5xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4)' }}>
                  <LayoutDashboard size={16} />
                </span>
                <div>
                  <div className="font-black text-slate-900 leading-tight text-sm">Client Portal</div>
                  <div className="text-[11px] text-slate-400 leading-tight">Tech Solution Pakistan</div>
                </div>
                {isAdmin && (
                  <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} /> Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <button onClick={signOut} className="text-slate-400 hover:text-rose-600 p-2" title="Sign out">
                    <LogOut size={18} />
                  </button>
                )}
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!configured ? (
                <SetupNotice />
              ) : loading ? (
                <div className="grid place-items-center flex-1 text-slate-400">Loading…</div>
              ) : !user ? (
                <div className="flex-1 overflow-y-auto grid place-items-center p-6"><Auth /></div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex gap-1 px-5 pt-3 bg-white border-b border-purple-100 overflow-x-auto">
                    <TabButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={LayoutDashboard} label="Dashboard" />
                    <TabButton active={view === 'chat'} onClick={() => setView('chat')} icon={MessageSquare} label={isAdmin ? 'Client Messages' : 'Live Chat'} />
                    {!isAdmin && (
                      <TabButton active={view === 'assistant'} onClick={() => setView('assistant')} icon={Bot} label="AI Assistant" />
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <CurrencyProvider>
                      {view === 'dashboard' && (
                        <div className="h-full overflow-y-auto p-5">
                          {isAdmin
                            ? <AdminDashboard refreshKey={refreshKey} />
                            : <ClientDashboard refreshKey={refreshKey} onChange={bump} />}
                        </div>
                      )}
                      {view === 'chat' && (
                        <div className="h-full p-3 sm:p-4">
                          {isAdmin ? <AdminChat /> : <ClientChat />}
                        </div>
                      )}
                      {view === 'assistant' && !isAdmin && (
                        <div className="h-full overflow-y-auto p-5">
                          <div className="h-full min-h-[400px]">
                            <Assistant onDataChanged={bump} />
                          </div>
                        </div>
                      )}
                    </CurrencyProvider>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
        active ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  )
}

function SetupNotice() {
  return (
    <div className="flex-1 grid place-items-center p-8 text-center">
      <div className="max-w-sm">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={32} />
        <h3 className="font-bold text-slate-900">Portal not configured</h3>
        <p className="text-sm text-slate-500 mt-2">
          Set <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
          <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your environment,
          then run the SQL in <code className="bg-slate-100 px-1 rounded">supabase/schema.sql</code>.
        </p>
      </div>
    </div>
  )
}
