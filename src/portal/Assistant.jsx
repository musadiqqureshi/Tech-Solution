import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Sparkles, Bot, CheckCircle2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import { askAssistant, loadMessages, saveMessage, createOrder, createMeeting } from '../lib/data'
import { fmtMoney } from '../lib/finance'

export default function Assistant({ onDataChanged }) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [suggestion, setSuggestion] = useState(null) // { action, payload }
  const [done, setDone] = useState('')
  const [engine, setEngine] = useState(null) // 'gemini' | 'rules'
  const scroller = useRef(null)

  useEffect(() => {
    if (!user) return
    loadMessages(user.id).then((m) => {
      setMessages(m.length ? m : [{ role: 'assistant', content: `Hi ${(profile?.name || 'there').split(' ')[0]}! I'm your Tech Solution assistant. I can scope a project, estimate a budget, or schedule a meeting. What would you like to do?` }])
    }).catch(() => {})
  }, [user, profile])

  useEffect(() => { scroller.current?.scrollTo(0, scroller.current.scrollHeight) }, [messages, busy])

  const send = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput(''); setDone('')
    const history = messages.slice(-12)
    setMessages((m) => [...m, { role: 'user', content: text }])
    setBusy(true)
    try {
      await saveMessage(user.id, 'user', text)
      const res = await askAssistant(text, history)
      setEngine(res.engine)
      setMessages((m) => [...m, { role: 'assistant', content: res.message }])
      await saveMessage(user.id, 'assistant', res.message)
      // Surface a quick action when the assistant extracted enough.
      const order = res.payload?.order
      const cal = res.payload?.calendar
      if (res.action === 'CREATE_ORDER' && order?.service) setSuggestion({ kind: 'order', data: order })
      else if (res.action === 'CREATE_CALENDAR_EVENT' && cal?.date && cal?.time) setSuggestion({ kind: 'meeting', data: cal })
      else setSuggestion(null)
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${err.message}` }])
    } finally {
      setBusy(false)
    }
  }

  const confirmSuggestion = async () => {
    if (!suggestion) return
    setBusy(true)
    try {
      if (suggestion.kind === 'order') {
        await createOrder({ userId: user.id, ...suggestion.data })
        setDone('Order created ✓')
      } else {
        await createMeeting({ userId: user.id, title: suggestion.data.title || 'Project meeting', ...suggestion.data })
        setDone('Meeting requested ✓')
      }
      setSuggestion(null)
      onDataChanged?.()
    } catch (err) {
      setDone(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="grid place-items-center w-9 h-9 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
          <Bot size={18} />
        </span>
        <div>
          <div className="font-bold text-slate-900 leading-tight">AI Operations Assistant</div>
          <div className="text-xs text-slate-400">Scope · estimate · schedule</div>
        </div>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-md'
                : 'bg-white border border-purple-100 text-slate-700 rounded-bl-md'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl bg-white border border-purple-100">
              <Loader2 size={16} className="animate-spin text-purple-500" />
            </div>
          </div>
        )}
      </div>

      {suggestion && (
        <div className="glass-card p-3 mt-3 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-700 min-w-0">
            {suggestion.kind === 'order'
              ? <>Create order: <b>{suggestion.data.service}</b>{suggestion.data.budget ? ` · ${fmtMoney(suggestion.data.budget)}` : ''}</>
              : <>Request meeting: <b>{suggestion.data.date} {suggestion.data.time}</b></>}
          </div>
          <button onClick={confirmSuggestion} disabled={busy} className="btn-primary !px-4 !py-2 text-sm shrink-0">
            <CheckCircle2 size={16} /> Confirm
          </button>
        </div>
      )}
      {done && <div className="text-sm text-emerald-700 mt-2">{done}</div>}
      {engine === 'rules' && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
          Offline mode — running the basic keyword assistant. Set a valid <b>GEMINI_API_KEY</b> in Vercel to enable full AI replies.
        </div>
      )}

      <form onSubmit={send} className="mt-3 flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the assistant…"
          className="contact-input" />
        <button type="submit" disabled={busy} className="btn-primary !px-4 shrink-0"><Send size={18} /></button>
      </form>
      <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><Sparkles size={11} /> Always confirms before creating records.</p>
    </div>
  )
}
