import { createContext, useContext, useState } from 'react'

const CurrencyCtx = createContext(null)
export const useCurrency = () => useContext(CurrencyCtx)

export function CurrencyProvider({ children }) {
  // null = not yet chosen, 'USD' or 'PKR' once chosen
  const [currency, setCurrency] = useState(null)

  return (
    <CurrencyCtx.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyCtx.Provider>
  )
}

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
            <option value="USD">🇺🇸 USD</option>
            <option value="PKR">🇵🇰 PKR</option>
            <option value="AUD">🇦🇺 AUD</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="CAD">🇨🇦 CAD</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 text-purple-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </div>
        <button onClick={() => onPick(selected)} className="btn-primary !px-5">
          Continue
        </button>
      </div>
    </div>
  )
}

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency()
  if (!currency) return null
  return (
    <div className="relative inline-flex items-center">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border border-purple-200 bg-white text-purple-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        <option value="USD">🇺🇸 USD</option>
        <option value="PKR">🇵🇰 PKR</option>
        <option value="AUD">🇦🇺 AUD</option>
        <option value="GBP">🇬🇧 GBP</option>
        <option value="EUR">🇪🇺 EUR</option>
        <option value="CAD">🇨🇦 CAD</option>
      </select>
      <span className="pointer-events-none absolute right-2 text-purple-400">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    </div>
  )
}
