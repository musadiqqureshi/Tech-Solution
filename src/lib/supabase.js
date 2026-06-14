import { createClient } from '@supabase/supabase-js'

// The Supabase URL and publishable (anon) key are PUBLIC by design — they
// ship in the browser bundle on every build and are protected by the
// Row-Level Security policies in supabase/schema.sql. Safe to commit.
// An env var (VITE_SUPABASE_*) overrides these defaults when present.
const DEFAULT_URL = 'https://gfgvjjwvrobgawsbzotj.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_qiWzd9cISg4sIEA0-nmOTQ_XlYwM53v'

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
