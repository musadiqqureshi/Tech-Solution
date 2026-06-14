import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, RotateCcw, Mail, CheckCircle2, ArrowLeft, Phone, Globe } from 'lucide-react'
import { MENU, FLOWS, CONTACT_INFO, CONTACT_SUBFLOWS } from '../data/flows'
import { buildSummary, leadMailto, submitLead } from '../lib/lead'

const WELCOME = 'Welcome to Tech Solution Pakistan 👋\nWe help businesses with digital and software solutions.\n\nHow can we assist you today?'

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isPhone = (v) => v.replace(/[^\d]/g, '').length >= 7

export default function GuidedAssistant() {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState([])          // { role:'bot'|'user', text }
  const [stage, setStage] = useState('menu')   // 'menu' | 'flow' | 'contact' | 'done'
  const [flow, setFlow] = useState(null)       // { ...FLOWS[id], id }
  const [stepIdx, setStepIdx] = useState(0)
  const [answers, setAnswers] = useState([])   // { label, value }
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)   // { summary, service, emailed }
  const scroller = useRef(null)

  useEffect(() => {
    if (open && log.length === 0) reset()
  }, [open])

  useEffect(() => { scroller.current?.scrollTo(0, scroller.current.scrollHeight) }, [log, stage])

  const say = (role, text) => setLog((l) => [...l, { role, text }])

  const reset = () => {
    setStage('menu'); setFlow(null); setStepIdx(0); setAnswers([]); setInput(''); setError(''); setResult(null)
    setLog([{ role: 'bot', text: WELCOME }])
  }

  const startFlow = (id) => {
    const f = id in FLOWS ? { ...FLOWS[id], id } : null
    say('user', MENU.find((m) => m.id === id)?.label || id)
    if (id === 'contact') { openContact(); return }
    if (!f) return
    setFlow(f); setStepIdx(0); setAnswers([]); setStage('flow')
    if (f.intro) say('bot', f.intro)
    say('bot', f.steps[0].prompt)
  }

  const openContact = () => {
    setStage('contact')
    say('bot', `Here’s how to reach us:\n📧 ${CONTACT_INFO.email}\n📞 ${CONTACT_INFO.phone}\n🌐 ${CONTACT_INFO.website}`)
  }

  const advance = (f, idx, collected) => {
    const next = idx + 1
    if (next < f.steps.length) {
      setStepIdx(next)
      say('bot', f.steps[next].prompt)
    } else {
      finish(f, collected)
    }
  }

  const handleOption = (value) => {
    setError('')
    say('user', value)
    const collected = [...answers, { label: flow.steps[stepIdx].label, value }]
    setAnswers(collected)
    advance(flow, stepIdx, collected)
  }

  const handleInput = () => {
    const step = flow.steps[stepIdx]
    const v = input.trim()
    if (!v) return
    if (step.inputType === 'email' && !isEmail(v)) return setError('Please enter a valid email address.')
    if (step.inputType === 'tel' && !isPhone(v)) return setError('Please enter a valid phone number.')
    setError(''); setInput('')
    say('user', v)
    const collected = [...answers, { label: step.label, value: v }]
    setAnswers(collected)
    advance(flow, stepIdx, collected)
  }

  const finish = async (f, collected) => {
    const summary = buildSummary({ leadType: f.leadType, service: f.title, answers: collected })
    say('bot', 'Thank you. Your request has been recorded successfully. ✅\nOur team has been notified and will contact you as soon as possible.')
    setResult({ summary, service: f.title, emailed: false })
    setStage('done')
    const out = await submitLead({ leadType: f.leadType, service: f.title, answers: collected, summary })
    if (out?.emailed) setResult((r) => ({ ...r, emailed: true }))
  }

  // Contact sub-flow trigger
  const startContactSub = (key) => {
    const f = { ...CONTACT_SUBFLOWS[key], id: key }
    say('user', f.title)
    setFlow(f); setStepIdx(0); setAnswers([]); setStage('flow')
    if (f.intro) say('bot', f.intro)
    say('bot', f.steps[0].prompt)
  }

  const currentStep = stage === 'flow' && flow ? flow.steps[stepIdx] : null

  return (
    <>
      {/* Launcher (bottom-left so it never overlaps the Portal button) */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: 'spring' }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full text-white font-semibold shadow-xl"
        style={{ background: 'linear-gradient(135deg,#0d9488,#2563eb)', boxShadow: '0 16px 40px -10px rgba(13,148,136,0.55)' }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
        aria-label="Chat with us"
      >
        <span className="grid place-items-center w-7 h-7 rounded-full bg-white/20"><MessageSquare size={16} /></span>
        <span className="hidden sm:inline text-sm">Chat with us</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed z-[60] bg-white shadow-2xl flex flex-col overflow-hidden
                       inset-0 sm:inset-auto sm:bottom-5 sm:left-5 sm:w-[380px] sm:h-[600px] sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg,#0d9488,#2563eb)' }}>
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/20"><MessageSquare size={18} /></span>
                <div>
                  <div className="font-bold leading-tight text-sm">Tech Solution Pakistan</div>
                  <div className="text-[11px] text-white/80 leading-tight">Typically replies shortly</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={reset} className="p-2 hover:bg-white/15 rounded-lg" title="Restart"><RotateCcw size={16} /></button>
                <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/15 rounded-lg"><X size={18} /></button>
              </div>
            </div>

            {/* Transcript */}
            <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {log.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    m.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'}`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Done: lead summary + email handoff */}
              {stage === 'done' && result && (
                <div className="bg-white border border-teal-200 rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-2">Project Summary</div>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{result.summary}</pre>
                  <a href={leadMailto(result)} className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#0d9488,#2563eb)' }}>
                    <Mail size={16} /> Email this to our team
                  </a>
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    {result.emailed ? 'A copy was sent to our team automatically.' : 'Tap above to send a copy from your email app.'}
                  </p>
                  <button onClick={reset} className="mt-2 w-full text-sm font-semibold text-slate-500 hover:text-slate-800">Start over</button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="border-t border-slate-200 p-3 bg-white">
              {stage === 'menu' && (
                <div className="grid grid-cols-2 gap-2">
                  {MENU.map((m) => (
                    <button key={m.id} onClick={() => startFlow(m.id)}
                      className="text-left text-sm font-medium text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl px-3 py-2 transition-colors">
                      <span className="mr-1.5">{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
              )}

              {stage === 'flow' && currentStep?.type === 'options' && (
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                  {currentStep.options.map((opt) => (
                    <button key={opt} onClick={() => handleOption(opt)}
                      className="text-left text-sm font-medium text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl px-3 py-2.5 transition-colors">
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {stage === 'flow' && currentStep?.type === 'input' && (
                <form onSubmit={(e) => { e.preventDefault(); handleInput() }} className="space-y-2">
                  {error && <p className="text-xs text-rose-600">{error}</p>}
                  <div className="flex items-center gap-2">
                    <input autoFocus type={currentStep.inputType === 'email' ? 'email' : currentStep.inputType === 'tel' ? 'tel' : 'text'}
                      value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your answer…"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-400" />
                    <button type="submit" className="grid place-items-center w-10 h-10 rounded-xl text-white shrink-0" style={{ background: 'linear-gradient(135deg,#0d9488,#2563eb)' }}><Send size={16} /></button>
                  </div>
                </form>
              )}

              {stage === 'contact' && (
                <div className="grid gap-2">
                  <button onClick={() => startContactSub('callback')} className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl px-3 py-2.5"><Phone size={15} /> Request Callback</button>
                  <button onClick={() => startContactSub('consultation')} className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl px-3 py-2.5"><CheckCircle2 size={15} /> Book Consultation</button>
                  <a href={`mailto:${CONTACT_INFO.email}?subject=New%20Project%20Inquiry`} className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl px-3 py-2.5"><Mail size={15} /> Email Us</a>
                  <button onClick={reset} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5"><ArrowLeft size={15} /> Return to Main Menu</button>
                </div>
              )}

              {stage === 'done' && (
                <button onClick={reset} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 py-1.5">
                  <RotateCcw size={15} /> New inquiry
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
