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
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <p className="text-sm font-semibold text-slate-600">Which currency would you like to view financials in?</p>
      <div className="flex gap-3">
        <button
          onClick={() => onPick('USD')}
          className="btn-primary !px-6"
        >
          🇺🇸 USD
        </button>
        <button
          onClick={() => onPick('PKR')}
          className="btn-secondary !px-6"
        >
          🇵🇰 PKR
        </button>
      </div>
    </div>
  )
}

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency()
  if (!currency) return null
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => setCurrency('USD')}
        className={`px-2.5 py-1 rounded-full font-bold transition-colors ${currency === 'USD' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
      >
        USD
      </button>
      <button
        onClick={() => setCurrency('PKR')}
        className={`px-2.5 py-1 rounded-full font-bold transition-colors ${currency === 'PKR' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
      >
        PKR
      </button>
    </div>
  )
}
