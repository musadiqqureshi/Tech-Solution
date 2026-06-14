import { useState } from 'react'
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Bot, LogOut, ShieldCheck, Briefcase,
  AlertTriangle, Loader2, ArrowLeft, Home,
} from 'lucide-react'
import { AuthProvider, useAuth } from './AuthContext'
import { CurrencyProvider } from './CurrencyContext'
import Auth from './Auth'
import Assistant from './Assistant'
import ClientDashboard from './ClientDashboard'
import AdminDashboard from './AdminDashboard'
import ExpertDashboard from './ExpertDashboard'
import { ClientChat, AdminChat } from './LiveChat'

export default function PortalRoot() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <PortalInner />
      </CurrencyProvider>
    </AuthProvider>
  )
}

function homeFor(role) {
  if (role === 'admin') return '/app/admin'
  if (role === 'expert') return '/app/expert'
  return '/app/client'
}

// Path-based branching (instead of a descendant <Routes>) avoids React
// Router v6's relative-resolution gotcha for a component mounted under
// multiple parent paths (/login and /app/*).
function PortalInner() {
  const { configured, loading, user, role } = useAuth()
  const { pathname } = useLocation()

  if (!configured) return <Centered><SetupNotice /></Centered>
  if (loading) return <Centered><Loader2 className="animate-spin text-purple-500" size={28} /></Centered>

  if (pathname === '/login') return user ? <Navigate to="/app" replace /> : <LoginPage />

  // Everything under /app requires a session.
  if (!user) return <Navigate to="/login" replace />

  const seg = pathname.split('/')[2] // /app/<seg>
  if (!seg) return <Navigate to={homeFor(role)} replace />
  if (seg !== role) return <Navigate to={homeFor(role)} replace />

  if (seg === 'admin') return <AdminArea />
  if (seg === 'expert') return <ExpertArea />
  return <ClientArea />
}

// ── Layout ───────────────────────────────────────────────────────────────────
function PortalLayout({ title, badge, tabs, tab, setTab, children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const out = async () => { await signOut(); navigate('/login', { replace: true }) }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4)' }}>
              <LayoutDashboard size={17} />
            </span>
            <div>
              <div className="font-black text-slate-900 leading-tight text-sm flex items-center gap-2">
                {title} {badge}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">{profile?.name || profile?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-50">
              <Home size={15} /> Site
            </Link>
            <button onClick={out} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-50">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
        {tabs && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  tab === t.id ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  )
}

// ── Role areas ───────────────────────────────────────────────────────────────
function ClientArea() {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey((k) => k + 1)
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Live Chat', icon: MessageSquare },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
  ]
  return (
    <PortalLayout title="Client Portal" tabs={tabs} tab={tab} setTab={setTab}>
      {tab === 'dashboard' && <ClientDashboard refreshKey={refreshKey} onChange={bump} />}
      {tab === 'chat' && <div className="min-h-[420px]"><ClientChat /></div>}
      {tab === 'assistant' && <div className="min-h-[420px]"><Assistant onDataChanged={bump} /></div>}
    </PortalLayout>
  )
}

function AdminArea() {
  const [tab, setTab] = useState('dashboard')
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Client Messages', icon: MessageSquare },
  ]
  const badge = (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
      <ShieldCheck size={11} /> Admin
    </span>
  )
  return (
    <PortalLayout title="Admin" badge={badge} tabs={tabs} tab={tab} setTab={setTab}>
      {tab === 'dashboard' && <AdminDashboard refreshKey={0} />}
      {tab === 'chat' && <div className="min-h-[420px]"><AdminChat /></div>}
    </PortalLayout>
  )
}

function ExpertArea() {
  const badge = (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
      <Briefcase size={11} /> Expert
    </span>
  )
  return (
    <PortalLayout title="Expert Workspace" badge={badge}>
      <ExpertDashboard />
    </PortalLayout>
  )
}

// ── Login page ───────────────────────────────────────────────────────────────
function LoginPage() {
  return (
    <div className="min-h-screen bg-aura-mesh grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-purple-700 mb-6">
          <ArrowLeft size={15} /> Back to tech-solutions.site
        </Link>
        <Auth />
      </div>
    </div>
  )
}

function Centered({ children }) {
  return <div className="min-h-screen grid place-items-center bg-slate-50 p-6">{children}</div>
}

function SetupNotice() {
  return (
    <div className="max-w-sm text-center">
      <AlertTriangle className="mx-auto text-amber-500 mb-3" size={32} />
      <h3 className="font-bold text-slate-900">Portal not configured</h3>
      <p className="text-sm text-slate-500 mt-2">
        Set <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
        <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>, then run the SQL in{' '}
        <code className="bg-slate-100 px-1 rounded">supabase/schema.sql</code>.
      </p>
    </div>
  )
}
