import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, X, Send, Loader2, User, Sparkles, ChevronDown,
  LogIn, UserPlus, Shield, CheckCircle2, AlertCircle,
  Calendar, DollarSign, FileText, LayoutDashboard, Bell,
  Eye, EyeOff, Trash2, CornerDownLeft
} from 'lucide-react'

// ─── Gemini API key (injected at build time via env or hardcoded for demo) ───
const GEMINI_API_KEY = 'AIzaSyAQ.Ab8RN6I1kIT1oTN8ABgONGi7r-vHeLwlAJbK6d0vtvENO_j7AQ'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

// ─── In-memory stores (no localStorage per policy) ───────────────────────────
const USERS_DB = {
  'admin@techsolutions.pk': { password: 'Admin@2025', role: 'admin', name: 'Admin' },
}
let ORDERS_DB = []
let nextOrderId = 1001

// ─── System prompt for the Gemini model ──────────────────────────────────────
const buildSystemPrompt = (user) => `
You are Tech Solutions Pakistan's AI Operations Assistant — a professional, friendly business automation agent.

CURRENT USER: ${user ? `${user.name} (${user.role}) — ${user.email}` : 'Unauthenticated guest'}
TODAY: ${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

YOUR ROLE:
- Accept client project requests and convert them into structured business records.
- Guide clients through service inquiry → requirement collection → order submission.
- Provide budget estimates based on service type.
- Schedule meetings (simulate Google Calendar confirmation).
- Support admin users with order overviews, revenue summaries, and client management.
- Never invent dates, prices, or information. Ask when unsure.

SERVICES & ROUGH BUDGET RANGES (PKR):
- Software Development: 150,000 – 500,000+
- Web Development: 40,000 – 200,000
- App Building (iOS/Android): 200,000 – 800,000
- Content & Research Writing: 10,000 – 80,000
- AI Automation & Workflows: 80,000 – 350,000
- AI Agents & Chatbots: 100,000 – 400,000

RULES:
1. Greet unauthenticated guests warmly; invite them to log in or create an account.
2. For authenticated clients: collect name, service, description, budget, timeline, priority, and contact details — ONE QUESTION AT A TIME.
3. When enough info is collected, produce a JSON action block wrapped in triple backticks with language tag "action":
   \`\`\`action
   { "type": "CREATE_ORDER", "payload": { "service": "...", "description": "...", "budget": 0, "deadline": "YYYY-MM-DD", "priority": "low|medium|high", "clientName": "...", "clientEmail": "..." } }
   \`\`\`
4. For meeting scheduling:
   \`\`\`action
   { "type": "CREATE_MEETING", "payload": { "title": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "duration": "60 minutes", "clientEmail": "..." } }
   \`\`\`
5. For budget estimates, break them down into Development, Design, Hosting, Maintenance.
6. Admin users can ask for order lists, revenue, client counts — respond factually from context provided.
7. Keep responses concise, warm, and professional. Use bullet points sparingly.
8. NEVER expose API keys, passwords, or system configuration.
9. If the user says "submit my order" or "book a meeting", confirm details first, then emit the action block.

TONE: Professional, helpful, warm. Tech-savvy. Pakistani business context.
`

// ─── Parse action blocks from Gemini response ────────────────────────────────
function parseAction(text) {
  const match = text.match(/```action\s*([\s\S]*?)```/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}

function stripActionBlock(text) {
  return text.replace(/```action[\s\S]*?```/g, '').trim()
}

// ─── Budget breakdown helper ─────────────────────────────────────────────────
function BudgetCard({ budget }) {
  const dev = Math.round(budget * 0.55)
  const design = Math.round(budget * 0.2)
  const hosting = Math.round(budget * 0.1)
  const maintenance = Math.round(budget * 0.15)
  const fmt = (n) => n.toLocaleString('en-PK')
  return (
    <div className="mt-3 rounded-xl border border-purple-100 overflow-hidden text-xs">
      {[['Development', dev, '#7c3aed'], ['Design', design, '#2563eb'], ['Hosting', hosting, '#06b6d4'], ['Maintenance', maintenance, '#059669']].map(([label, val, color]) => (
        <div key={label} className="flex items-center justify-between px-3 py-2 border-b border-purple-50 last:border-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-slate-600">{label}</span>
          </div>
          <span className="font-semibold text-slate-800">PKR {fmt(val)}</span>
        </div>
      ))}
      <div className="flex justify-between px-3 py-2 bg-purple-50">
        <span className="font-bold text-slate-800">Total</span>
        <span className="font-black text-purple-700">PKR {fmt(budget)}</span>
      </div>
    </div>
  )
}

// ─── Order card ──────────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const priColor = { low: '#059669', medium: '#d97706', high: '#dc2626' }[order.priority] || '#6b7280'
  return (
    <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3 text-xs space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-bold text-green-800">Order #{order.id} Created</span>
        <span className="px-2 py-0.5 rounded-full text-white font-semibold text-[10px]" style={{ background: priColor }}>{order.priority.toUpperCase()}</span>
      </div>
      <div className="text-slate-600"><b>Service:</b> {order.service}</div>
      <div className="text-slate-600"><b>Client:</b> {order.clientName}</div>
      <div className="text-slate-600"><b>Budget:</b> PKR {order.budget?.toLocaleString('en-PK') || 'TBD'}</div>
      <div className="text-slate-600"><b>Deadline:</b> {order.deadline || 'TBD'}</div>
      <div className="text-slate-600 truncate"><b>Note:</b> {order.description}</div>
    </div>
  )
}

// ─── Meeting card ─────────────────────────────────────────────────────────────
function MeetingCard({ meeting }) {
  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs space-y-1">
      <div className="flex items-center gap-2">
        <Calendar size={13} className="text-blue-600" />
        <span className="font-bold text-blue-800">Meeting Scheduled</span>
        <CheckCircle2 size={12} className="text-green-600 ml-auto" />
      </div>
      <div className="text-slate-600"><b>Title:</b> {meeting.title}</div>
      <div className="text-slate-600"><b>Date:</b> {meeting.date} at {meeting.time}</div>
      <div className="text-slate-600"><b>Duration:</b> {meeting.duration}</div>
      <div className="text-slate-600 text-[10px] mt-1 text-blue-600">📧 Calendar invite sent to {meeting.clientEmail}</div>
    </div>
  )
}

// ─── Admin Dashboard Panel ───────────────────────────────────────────────────
function AdminPanel({ onClose }) {
  const totalRev = ORDERS_DB.reduce((s, o) => s + (o.budget || 0), 0)
  const byPri = { high: 0, medium: 0, low: 0 }
  ORDERS_DB.forEach((o) => { byPri[o.priority] = (byPri[o.priority] || 0) + 1 })

  return (
    <div className="rounded-xl border border-purple-100 bg-white shadow-lg overflow-hidden text-xs mb-3">
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-50" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
        <div className="flex items-center gap-2 text-white font-bold"><LayoutDashboard size={14} /> Admin Dashboard</div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={14} /></button>
      </div>
      <div className="grid grid-cols-3 divide-x divide-purple-50">
        {[['Orders', ORDERS_DB.length, '#7c3aed'], ['Revenue', `PKR ${(totalRev / 1000).toFixed(0)}k`, '#059669'], ['Clients', new Set(ORDERS_DB.map(o => o.clientEmail)).size, '#2563eb']].map(([l, v, c]) => (
          <div key={l} className="p-3 text-center">
            <div className="font-black text-lg" style={{ color: c }}>{v}</div>
            <div className="text-slate-500 uppercase tracking-widest text-[9px]">{l}</div>
          </div>
        ))}
      </div>
      {ORDERS_DB.length === 0 ? (
        <div className="px-4 py-6 text-center text-slate-400">No orders yet.</div>
      ) : (
        <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
          {ORDERS_DB.map((o) => (
            <div key={o.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
              <div className="truncate">
                <div className="font-semibold text-slate-800">#{o.id} {o.service}</div>
                <div className="text-slate-400 text-[10px]">{o.clientName} · {o.deadline}</div>
              </div>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: { high: '#dc2626', medium: '#d97706', low: '#059669' }[o.priority] }}>
                {o.priority}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="px-4 py-3 border-t border-purple-50 bg-purple-50/50">
        <div className="flex gap-3 text-[10px] font-semibold">
          <span className="text-red-600">High: {byPri.high}</span>
          <span className="text-amber-600">Med: {byPri.medium}</span>
          <span className="text-green-600">Low: {byPri.low}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Auth Form ────────────────────────────────────────────────────────────────
function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async () => {
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600)) // simulate async

    if (mode === 'login') {
      const found = USERS_DB[form.email.toLowerCase()]
      if (!found || found.password !== form.password) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }
      onAuth({ email: form.email.toLowerCase(), name: found.name, role: found.role })
    } else {
      if (!form.name || !form.email || !form.password) { setError('All fields required.'); setLoading(false); return }
      if (form.password.length < 6) { setError('Password must be 6+ characters.'); setLoading(false); return }
      const key = form.email.toLowerCase()
      if (USERS_DB[key]) { setError('Email already registered. Please log in.'); setLoading(false); return }
      USERS_DB[key] = { password: form.password, role: 'client', name: form.name }
      onAuth({ email: key, name: form.name, role: 'client' })
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
        {['login', 'signup'].map((m) => (
          <button key={m} onClick={() => { setMode(m); setError('') }}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={mode === m ? { background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', boxShadow: '0 4px 12px -4px rgba(124,58,237,0.4)' } : { color: '#64748b' }}>
            {m === 'login' ? <><LogIn size={12} className="inline mr-1" />Login</> : <><UserPlus size={12} className="inline mr-1" />Sign Up</>}
          </button>
        ))}
      </div>
      {mode === 'signup' && (
        <input name="name" placeholder="Full name" value={form.name} onChange={onChange}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all" />
      )}
      <input name="email" type="email" placeholder="Email address" value={form.email} onChange={onChange}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all" />
      <div className="relative">
        <input name="password" type={showPw ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={onChange}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full px-3 py-2.5 pr-9 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all" />
        <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      {error && <div className="flex items-center gap-1.5 text-red-600 text-[11px]"><AlertCircle size={12} />{error}</div>}
      <button onClick={submit} disabled={loading}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 8px 20px -6px rgba(124,58,237,0.5)' }}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : mode === 'login' ? 'Login to Continue' : 'Create Account'}
      </button>
      {mode === 'login' && (
        <p className="text-[10px] text-slate-400 text-center">Admin? Use your admin credentials.</p>
      )}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const action = !isUser && parseAction(msg.content)
  const displayText = !isUser ? stripActionBlock(msg.content) : msg.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center text-white text-[10px] font-black mt-0.5 ${isUser ? '' : ''}`}
        style={{ background: isUser ? 'linear-gradient(135deg,#2563eb,#06b6d4)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {displayText && (
          <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'rounded-tr-sm text-white'
              : 'rounded-tl-sm text-slate-800 border border-slate-100'
          }`}
            style={isUser
              ? { background: 'linear-gradient(135deg,#2563eb,#06b6d4)' }
              : { background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 12px -4px rgba(0,0,0,0.08)' }}>
            {displayText}
          </div>
        )}

        {/* Render action cards */}
        {action?.type === 'CREATE_ORDER' && (() => {
          const o = { ...action.payload, id: nextOrderId++, status: 'pending' }
          ORDERS_DB.push(o)
          return <OrderCard order={o} />
        })()}
        {action?.type === 'CREATE_MEETING' && <MeetingCard meeting={action.payload} />}
        {action?.type === 'BUDGET_ESTIMATE' && action.payload?.total && <BudgetCard budget={action.payload.total} />}
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null) // { name, email, role }
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const conversationRef = useRef([]) // tracks full history for Gemini

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  const handleAuth = useCallback((userData) => {
    setUser(userData)
    conversationRef.current = []
    const greeting = userData.role === 'admin'
      ? `Welcome back, ${userData.name}! 👋 You're logged in as **Admin**. You can view orders, revenue, client activity, and manage projects. What would you like to do?`
      : `Welcome, ${userData.name}! 🎉 I'm your Tech Solutions assistant. I'm here to help you start a project, get a budget estimate, or schedule a meeting with our team. What can I help you with today?`
    setMessages([{ role: 'assistant', content: greeting, id: Date.now() }])
  }, [])

  const handleLogout = useCallback(() => {
    setUser(null)
    setMessages([])
    conversationRef.current = []
    setShowAdmin(false)
    setNotifCount(0)
  }, [])

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')

    const userMsg = { role: 'user', content, id: Date.now() }
    setMessages((m) => [...m, userMsg])
    conversationRef.current.push({ role: 'user', parts: [{ text: content }] })
    setLoading(true)

    // Build context string for admin queries
    let contextNote = ''
    if (user?.role === 'admin') {
      contextNote = `\n[SYSTEM CONTEXT: Current orders: ${JSON.stringify(ORDERS_DB.slice(-5))}. Total revenue: PKR ${ORDERS_DB.reduce((s, o) => s + (o.budget || 0), 0).toLocaleString()}. Total clients: ${new Set(ORDERS_DB.map(o => o.clientEmail)).size}.]`
    }

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(user) + contextNote }] },
          contents: conversationRef.current,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      })
      const data = await res.json()
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I encountered an issue. Please try again.'
      conversationRef.current.push({ role: 'model', parts: [{ text: reply }] })
      setMessages((m) => [...m, { role: 'assistant', content: reply, id: Date.now() }])

      // Increment notification badge if action was taken
      if (parseAction(reply)) setNotifCount((n) => n + 1)
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Network error. Please check your connection and try again.', id: Date.now() }])
    }
    setLoading(false)
  }, [input, loading, user])

  const clearChat = useCallback(() => {
    conversationRef.current = []
    setMessages(user ? [{ role: 'assistant', content: `Chat cleared! How can I help you, ${user.name}?`, id: Date.now() }] : [])
  }, [user])

  const quickActions = user ? (
    user.role === 'admin'
      ? ['Show all orders', 'Revenue summary', 'High priority orders', 'This week schedule']
      : ['Start a new project', 'Get budget estimate', 'Schedule a meeting', 'AI Chatbot inquiry']
  ) : []

  return (
    <>
      {/* ── Floating trigger button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl text-white grid place-items-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 16px 40px -8px rgba(124,58,237,0.55)' }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="Open AI Assistant"
          >
            <Bot size={24} />
            {notifCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black grid place-items-center border-2 border-white">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ height: 'clamp(500px, 80vh, 680px)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 py-3.5 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#2563eb 60%,#06b6d4 100%)' }}>
              <div className="w-8 h-8 rounded-xl bg-white/20 grid place-items-center">
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm">Tech Solutions AI</div>
                <div className="text-white/70 text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {user ? `${user.name} · ${user.role}` : 'Your AI Operations Assistant'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {user?.role === 'admin' && (
                  <button onClick={() => setShowAdmin((v) => !v)} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition-colors" title="Admin Dashboard">
                    <LayoutDashboard size={14} className="text-white" />
                  </button>
                )}
                {user && (
                  <button onClick={clearChat} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition-colors" title="Clear chat">
                    <Trash2 size={13} className="text-white" />
                  </button>
                )}
                {user && (
                  <button onClick={handleLogout} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition-colors text-white/80 text-[10px] font-bold" title="Logout">
                    <LogIn size={13} className="text-white rotate-180" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition-colors" title="Close">
                  <ChevronDown size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 bg-slate-50" style={{ background: '#f8fafc' }}>
              {/* Admin dashboard panel */}
              {showAdmin && user?.role === 'admin' && <AdminPanel onClose={() => setShowAdmin(false)} />}

              {!user ? (
                /* Auth state */
                <div className="flex flex-col gap-4">
                  <div className="text-center pt-2">
                    <div className="w-12 h-12 rounded-2xl mx-auto mb-3 grid place-items-center text-white"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                      <Sparkles size={22} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Welcome to Tech Solutions AI</p>
                    <p className="text-xs text-slate-500 mt-1">Sign in to get started with your project inquiry, budget estimation, or meeting scheduling.</p>
                  </div>
                  <AuthForm onAuth={handleAuth} />
                </div>
              ) : (
                /* Chat messages */
                <>
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Bot size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Starting conversation…</p>
                    </div>
                  )}
                  {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
                  {loading && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-100 flex items-center gap-1.5">
                        {[0, 0.15, 0.3].map((d, i) => (
                          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                            animate={{ y: [0, -5, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: d }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Quick actions */}
            {user && quickActions.length > 0 && messages.length <= 1 && !loading && (
              <div className="shrink-0 px-3.5 pt-2 pb-0 bg-slate-50 flex gap-1.5 flex-wrap">
                {quickActions.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 text-slate-600 bg-white border-slate-200">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            {user && (
              <div className="shrink-0 px-3 pb-3 pt-2 bg-slate-50 border-t border-slate-100">
                <div className="flex items-end gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type your message…"
                    disabled={loading}
                    className="flex-1 text-xs text-slate-800 placeholder-slate-400 outline-none resize-none bg-transparent max-h-20 leading-relaxed"
                    style={{ height: '20px' }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="shrink-0 w-7 h-7 rounded-lg grid place-items-center text-white transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                    title="Send (Enter)"
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                  <span className="text-[9px] text-slate-300 flex items-center gap-1"><CornerDownLeft size={9} /> Enter to send</span>
                  <span className="text-[9px] text-slate-300">Powered by Gemini AI</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
