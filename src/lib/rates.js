// rates.js — fetches today's live USD exchange rates from a free,
// keyless API and caches them in localStorage for a few hours so we
// don't hammer the endpoint on every render / reload.

const CACHE_KEY = 'fx_rates_v1'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

// Sensible offline fallbacks (close to mid-2026 rates) used only if the
// live lookup fails and there's no usable cache yet.
export const FALLBACK_RATES = {
  USD: 1,
  PKR: 278,
  GBP: 0.78,
  EUR: 0.92,
  AUD: 1.53,
  CAD: 1.37,
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.rates || !parsed?.fetchedAt) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }))
  } catch {
    /* ignore (e.g. storage disabled) */
  }
}

/**
 * Returns { rates, fetchedAt, stale } where `rates` maps currency code -> units per 1 USD.
 * Uses cached values (refreshed every 6h) and falls back to static estimates if offline.
 */
export async function getRates() {
  const cached = readCache()
  const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS

  if (isFresh) return { rates: cached.rates, fetchedAt: cached.fetchedAt, stale: false }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error('rate fetch failed')
    const data = await res.json()
    const r = data?.rates
    if (!r?.PKR) throw new Error('bad rate payload')

    const rates = {
      USD: 1,
      PKR: r.PKR,
      GBP: r.GBP ?? FALLBACK_RATES.GBP,
      EUR: r.EUR ?? FALLBACK_RATES.EUR,
      AUD: r.AUD ?? FALLBACK_RATES.AUD,
      CAD: r.CAD ?? FALLBACK_RATES.CAD,
    }
    writeCache(rates)
    return { rates, fetchedAt: Date.now(), stale: false }
  } catch {
    // Fall back to whatever we have cached (even if stale), else static defaults.
    if (cached?.rates) return { rates: cached.rates, fetchedAt: cached.fetchedAt, stale: true }
    return { rates: FALLBACK_RATES, fetchedAt: Date.now(), stale: true }
  }
}
