import { useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from './AuthContext'
import { Field } from './ui'

export default function Auth() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const google = async () => {
    setError('')
    try { await signInWithGoogle() }
    catch (err) { setError(err.message || 'Google sign-in failed') }
  }

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
        <button type="button" onClick={google}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex-1 h-px bg-slate-200" />or<span className="flex-1 h-px bg-slate-200" />
        </div>
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
