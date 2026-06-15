import { createContext, useContext, useEffect, useState } from 'react'
import { getRates, FALLBACK_RATES } from '../lib/rates'

const CurrencyCtx = createContext(null)
export const useCurrency = () => useContext(CurrencyCtx)

export function CurrencyProvider({ children }) {
  // null = not yet chosen, 'USD' or 'PKR' etc once chosen
  const [currency, setCurrency] = useState(null)
  const [rates, setRates] = useState(FALLBACK_RATES)
  const [ratesStale, setRatesStale] = useState(true)

  useEffect(() => {
    let cancelled = false
    getRates().then(({ rates: r, stale }) => {
      if (cancelled) return
      setRates(r)
      setRatesStale(stale)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <CurrencyCtx.Provider value={{ currency, setCurrency, rates, ratesStale }}>
      {children}
    </CurrencyCtx.Provider>
  )
}

const CURRENCY_OPTIONS = [
  { code: 'USD', flag: '🇺🇸' },
  { code: 'PKR', flag: '🇵🇰' },
  { code: 'AUD', flag: '🇦🇺' },
  { code: 'GBP', flag: '🇬🇧' },
  { code: 'EUR', flag: '🇪🇺' },
  { code: 'CAD', flag: '🇨🇦' },
]

export function CurrencyPicker({ onPick }) {
  const [selected, setSelected] = useState('USD')
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <p className="text-sm font-semibold text-slate-600">Which currency would you like to view financials in?</p>
      <div className="flex items-center gap-3">
        <div className="relative inline-flex items-center">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="appearance-none pl-3 pr-9 py-2 rounded-lg text-sm font-semibold border border-purple-200 bg-white text-purple-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-[130px]"
          >
            {CURRENCY_OPTIONS.map(({ code, flag }) => (
              <option key={code} value={code}>{flag} {code}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 text-purple-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </div>
        <button onClick={() => onPick(selected)} className="btn-primary !px-5">
          Continue
        </button>
      </div>
      <p className="text-[11px] text-slate-400">Amounts are converted using today's exchange rate.</p>
    </div>
  )
}

export function CurrencyToggle() {
  const ctx = useCurrency()
  if (!ctx?.currency) return null
  const { currency, setCurrency, rates, ratesStale } = ctx
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative inline-flex items-center">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border border-purple-200 bg-white text-purple-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {CURRENCY_OPTIONS.map(({ code, flag }) => (
            <option key={code} value={code}>{flag} {code}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 text-purple-400">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </div>
      {currency !== 'USD' && (
        <span className="hidden sm:inline text-[10px] text-slate-400 whitespace-nowrap" title={ratesStale ? 'Using last known rate (offline)' : "Today's exchange rate"}>
          1 USD ≈ {Number(rates?.[currency] || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}{ratesStale ? ' *' : ''}
        </span>
      )}
    </div>
  )
}
