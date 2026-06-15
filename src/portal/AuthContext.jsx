import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); setProfileError(''); return }
    // maybeSingle() won't throw on 0 rows. Previously .single() could throw
    // on any read hiccup, leaving profile null and silently defaulting the
    // role to 'client' — which made admins see the client dashboard.
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (error) setProfileError(error.message)
    else if (!data) setProfileError('No profile row for your account — run supabase/schema.sql so the signup trigger/row exists.')
    else setProfileError('')
    setProfile(data || null)
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      setSession(sess)
      await loadProfile(sess?.user?.id)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signUp = async ({ name, email, password, company, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { name, company, phone },
        // Send the confirmation link back to wherever the app runs
        // (localhost in dev, the Vercel domain in prod) instead of the
        // Supabase default Site URL. Still must be allow-listed under
        // Auth → URL Configuration → Redirect URLs.
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw error
    return data
  }

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => { await supabase.auth.signOut(); setProfile(null) }

  const value = {
    configured: supabaseConfigured,
    session,
    user: session?.user || null,
    profile,
    profileError,
    role: profile?.role || 'client',
    isAdmin: profile?.role === 'admin',
    loading,
    signUp, signIn, signOut,
    refreshProfile: () => loadProfile(session?.user?.id),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
