import { useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from './AuthContext'
import { Field } from './ui'

// Google icon SVG inline
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function Auth() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
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

  const handleGoogle = async () => {
    setError(''); setGoogleBusy(true)
    try {
      await signInWithGoogle()
      // Page will redirect to Google — no further action needed
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
      setGoogleBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-slate-500 text-sm mt-1">Access your projects, budgets, and the AI assistant.</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleBusy || busy}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow disabled:opacity-60"
        >
          {googleBusy
            ? <Loader2 size={18} className="animate-spin text-slate-400" />
            : <GoogleIcon />}
          {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or with email</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={submit} className="space-y-4">
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

          <button type="submit" disabled={busy || googleBusy} className="btn-primary w-full justify-center">
            {busy ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {mode === 'login' ? "No account yet?" : 'Already registered?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="font-semibold text-purple-700 hover:text-purple-900"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
