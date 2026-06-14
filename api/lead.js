// Receives a lead from the guided chatbot and emails it to the admin.
// Email is sent via Resend when RESEND_API_KEY is configured; otherwise it
// returns ok with emailed:false and the frontend uses its mailto fallback.

const ADMIN_EMAIL = 'muzzammilkhan7890@gmail.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { service = 'General', leadType = 'Lead', summary = '' } = body
  if (!summary) return res.status(400).json({ error: 'summary is required' })

  const key = process.env.RESEND_API_KEY
  if (!key) {
    // No provider configured — acknowledge so the UI can fall back to mailto.
    console.log('LEAD (no email provider configured):\n', summary)
    return res.status(200).json({ ok: true, emailed: false })
  }

  try {
    // RESEND_FROM should be a verified sender on your domain. The shared
    // onboarding@resend.dev sender only delivers to the Resend account owner.
    const from = process.env.RESEND_FROM || 'Tech Solution Leads <onboarding@resend.dev>'
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [ADMIN_EMAIL],
        subject: `New ${leadType} — ${service}`,
        text: summary,
      }),
    })
    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      console.error('Resend error', r.status, detail)
      return res.status(200).json({ ok: true, emailed: false })
    }
    return res.status(200).json({ ok: true, emailed: true })
  } catch (err) {
    console.error('lead email error', err)
    return res.status(200).json({ ok: true, emailed: false })
  }
}
