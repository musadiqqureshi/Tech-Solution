import { useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from './AuthContext'
import { Field } from './ui'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setNotice(''); setBusy(true)
    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password })
      } else {
        const res = await signUp(form)
        if (!res.session) setNotice('Account created! Check your email to confirm, then sign in.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="text-slate-500 text-sm mt-1">Access your projects, budgets, and the AI assistant.</p>
      </div>

      <form onSubmit={submit} className="glass-card p-6 space-y-4">
        {mode === 'signup' && (
          <>
            <Field label="Full name">
              <input name="name" value={form.name} onChange={on} className="contact-input" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company (optional)">
                <input name="company" value={form.company} onChange={on} className="contact-input" />
              </Field>
              <Field label="Phone (optional)">
                <input name="phone" value={form.phone} onChange={on} className="contact-input" />
              </Field>
            </div>
          </>
        )}
        <Field label="Email">
          <input type="email" name="email" value={form.email} onChange={on} className="contact-input" required />
        </Field>
        <Field label="Password">
          <input type="password" name="password" value={form.password} onChange={on} className="contact-input" minLength={6} required />
        </Field>

        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        {notice && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{notice}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
          {busy ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          {mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>

        <p className="text-center text-sm text-slate-500">
          {mode === 'login' ? "No account yet?" : 'Already registered?'}{' '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="font-semibold text-purple-700 hover:text-purple-900">
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  )
}
