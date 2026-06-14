import { ADMIN_EMAIL } from '../data/flows'

// Build a readable summary from ordered { label, value } answers.
export function buildSummary({ leadType, service, answers }) {
  const lines = [
    `Lead Type: ${leadType}`,
    `Service: ${service}`,
    ...answers.map((a) => `${a.label}: ${a.value}`),
    `Date & Time: ${new Date().toLocaleString()}`,
  ]
  return lines.join('\n')
}

// Prefilled mailto link to the admin — always works, no backend needed.
export function leadMailto({ service, summary }) {
  const subject = encodeURIComponent(`New Project Inquiry — ${service}`)
  const body = encodeURIComponent(summary)
  return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`
}

// Fire-and-forget POST to the backend, which emails the lead when a
// provider key (RESEND_API_KEY) is configured. Never blocks the UI.
export async function submitLead(lead) {
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    })
    if (!res.ok) return { ok: false, emailed: false }
    return res.json()
  } catch {
    return { ok: false, emailed: false }
  }
}
