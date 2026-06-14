// Deterministic budget estimation — never invents a client's budget.
const SERVICE_BASE = {
  'software development': 6000,
  'web development': 3500,
  'app building': 7000,
  'content & research writing': 1200,
  'ai automation & workflows': 4500,
  'ai agents & chatbots': 5000,
}

const SPLIT = { development: 0.55, design: 0.2, hosting: 0.1, maintenance: 0.15 }
const PROFIT_MARGIN = 0.3

// 1 USD = PKR rate (update as needed)
export const USD_TO_PKR = 278

const baseFor = (service = '') => SERVICE_BASE[service.trim().toLowerCase()] ?? 4000

export function estimateFinance({ service = '', budget = 0 } = {}) {
  const numericBudget = Number(budget) || 0
  const totalCost = numericBudget > 0
    ? Math.round(numericBudget / (1 + PROFIT_MARGIN))
    : baseFor(service)

  const breakdown = {
    development: Math.round(totalCost * SPLIT.development),
    design: Math.round(totalCost * SPLIT.design),
    hosting: Math.round(totalCost * SPLIT.hosting),
    maintenance: Math.round(totalCost * SPLIT.maintenance),
  }
  const estimated_cost = breakdown.development + breakdown.design + breakdown.hosting + breakdown.maintenance
  const estimated_profit = numericBudget > 0
    ? Math.max(0, numericBudget - estimated_cost)
    : Math.round(estimated_cost * PROFIT_MARGIN)
  const remaining_budget = numericBudget > 0 ? numericBudget - estimated_cost : 0

  return { currency: 'USD', budget: numericBudget, breakdown, estimated_cost, estimated_profit, remaining_budget, assumed: numericBudget === 0 }
}

export const SERVICE_OPTIONS = [
  'Software Development', 'Web Development', 'App Building',
  'Content & Research Writing', 'AI Automation & Workflows', 'AI Agents & Chatbots',
]

// Currency symbols / prefixes for display
const CURRENCY_SYMBOLS = {
  USD: '$', PKR: 'PKR ', GBP: '£', EUR: '€', AUD: 'A$', CAD: 'C$',
}

// Format money in USD
export const fmtUSD = (n) => `$${Number(n || 0).toLocaleString()}`

// Format money in PKR (static fallback rate)
export const fmtPKR = (n) => `PKR ${Math.round(Number(n || 0) * USD_TO_PKR).toLocaleString()}`

/**
 * Convert a USD amount into another currency using live exchange `rates`
 * ({ CODE: unitsPerUSD }). Falls back to the static USD_TO_PKR rate for
 * PKR (or 1:1) if rates aren't available yet.
 */
export function convert(amountUSD, currency = 'USD', rates = null) {
  const amount = Number(amountUSD || 0)
  if (currency === 'USD') return amount
  const rate = rates?.[currency] ?? (currency === 'PKR' ? USD_TO_PKR : 1)
  return amount * rate
}

/**
 * Format a USD amount in the given display currency, using live `rates`
 * when provided.
 */
export function fmtMoney(n, currency = 'USD', rates = null) {
  if (currency === 'USD' || !currency) return fmtUSD(n)
  const converted = convert(n, currency, rates)
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `
  const rounded = Math.round(converted).toLocaleString()
  return `${symbol}${rounded}`
}
