import { createClient } from '@supabase/supabase-js'
import { SYSTEM_PROMPT, ruleBasedReply } from './_lib/assistant.js'

// Verify the caller's Supabase session so the assistant can't be abused
// by anonymous traffic. Uses the public anon key — no service role here.
async function getUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  const url = process.env.SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return null
  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'there',
  }
}

async function geminiReply(history, message, user) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: `${SYSTEM_PROMPT}\n\nThe authenticated client is ${user.name} <${user.email}>. Today is ${new Date().toISOString().slice(0, 10)}.`,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
  })

  const contents = [
    ...history.slice(-12).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ]

  const result = await model.generateContent({ contents })
  const text = result.response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { message: text || 'Could you rephrase that?', intent: 'general_question', action: 'NO_ACTION', payload: {}, confirmed: false }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Please sign in to use the assistant.' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { message, history = [] } = body
  if (!message || !message.trim()) return res.status(400).json({ error: 'message is required' })

  try {
    let result
    if (process.env.GEMINI_API_KEY) {
      try {
        result = await geminiReply(history, message, user)
      } catch (e) {
        console.error('gemini error, falling back to rules', e?.message)
        result = ruleBasedReply(message, user)
      }
    } else {
      result = ruleBasedReply(message, user)
    }

    return res.status(200).json({
      message: result.message || '',
      intent: result.intent || 'general_question',
      action: result.action || 'NO_ACTION',
      payload: result.payload || {},
      confirmed: !!result.confirmed,
      engine: process.env.GEMINI_API_KEY ? 'gemini' : 'rules',
    })
  } catch (err) {
    console.error('chat error', err)
    return res.status(500).json({ error: 'Assistant is unavailable right now.' })
  }
}
