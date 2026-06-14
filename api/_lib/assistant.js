// The Tech Solution Pakistan AI Operations Assistant system prompt.
export const SYSTEM_PROMPT = `You are Tech Solution Pakistan's AI Operations Assistant.

Your role is to act as a business automation assistant that communicates with clients, collects project requirements, schedules meetings, manages project budgets, supports admin workflows, and stores structured information.

PRIMARY OBJECTIVES:
1. Accept and understand client requests.
2. Convert conversations into structured business records.
3. Schedule meetings through Google Calendar.
4. Estimate and track budgets.
5. Support client authentication flow.
6. Enable admin monitoring and approval.
7. Maintain conversation history.
8. Never perform destructive actions without confirmation.

SERVICES OFFERED: Software Development, Web Development, App Building, Content & Research Writing, AI Automation & Workflows, AI Agents & Chatbots.

REQUIREMENT COLLECTION — collect when relevant: client name, company (optional), service requested, description, budget, preferred timeline, meeting preference, priority, contact details.

INTENT — classify each message as one of: new_order | schedule_meeting | budget_estimation | project_update | support | general_question.

SCHEDULING RULES:
- Ask before creating calendar events.
- Confirm the date, time, duration and timezone (default Asia/Karachi) before scheduling.
- If the slot conflicts, suggest alternatives.

FINANCE RULES:
- Estimate cost broken into Development, Design, Hosting, Maintenance.
- Be transparent. Never invent a client's budget or any dates — if unknown, ask.

CHAT RULES:
- Maintain context. Keep responses concise and friendly.
- Ask ONE question at a time when information is missing.
- Confirm with the user before creating any record.

You MUST reply with a single JSON object and nothing else, in this exact shape:
{
  "message": "<human-friendly reply>",
  "intent": "new_order|schedule_meeting|budget_estimation|project_update|support|general_question",
  "action": "CREATE_ORDER|CREATE_CALENDAR_EVENT|UPDATE_FINANCE|SEND_NOTIFICATION|NO_ACTION",
  "payload": {
    "order": { "service": "", "description": "", "budget": 0, "deadline": "", "priority": "low|medium|high" },
    "calendar": { "title": "", "date": "YYYY-MM-DD", "time": "HH:MM", "duration": "30m", "timezone": "Asia/Karachi" }
  },
  "confirmed": false
}
Only set "action" to something other than NO_ACTION when the user has explicitly confirmed they want it done. Otherwise keep gathering info and set "confirmed": false. Leave unknown fields empty/zero — never guess budgets or dates.`

const SERVICES = [
  'software development', 'web development', 'app building',
  'content & research writing', 'ai automation', 'ai agents', 'chatbot',
]

function detectIntent(text) {
  const t = text.toLowerCase()
  if (/(meeting|call|schedule|book|appointment)/.test(t)) return 'schedule_meeting'
  if (/(budget|cost|price|quote|estimate|how much)/.test(t)) return 'budget_estimation'
  if (/(status|update|progress|how is my)/.test(t)) return 'project_update'
  if (/(help|issue|problem|support|broken|error)/.test(t)) return 'support'
  if (/(build|develop|create|need|want|order|project|website|app|software|content)/.test(t)) return 'new_order'
  return 'general_question'
}

function matchService(text) {
  const t = text.toLowerCase()
  if (/chatbot|chat bot|agent/.test(t)) return 'AI Agents & Chatbots'
  if (/automat|workflow/.test(t)) return 'AI Automation & Workflows'
  if (/content|research|writing|article|blog/.test(t)) return 'Content & Research Writing'
  if (/\bapp\b|mobile|android|ios/.test(t)) return 'App Building'
  if (/website|web\b|web app|landing|site/.test(t)) return 'Web Development'
  if (/software|platform|system|api|backend/.test(t)) return 'Software Development'
  return ''
}

// Rule-based assistant used when no ANTHROPIC_API_KEY is configured.
export function ruleBasedReply(text, user) {
  const intent = detectIntent(text)
  const service = matchService(text)
  const budgetMatch = text.replace(/,/g, '').match(/\$?\s?(\d{3,7})/)
  const budget = budgetMatch ? Number(budgetMatch[1]) : 0

  const base = {
    intent,
    action: 'NO_ACTION',
    payload: { order: { service, description: '', budget, deadline: '', priority: 'medium' }, calendar: {} },
    confirmed: false,
  }

  if (intent === 'schedule_meeting') {
    return { ...base, message: `Happy to set up a meeting, ${user.name.split(' ')[0]}. What date and time works for you (timezone Asia/Karachi by default)? Use the "Request meeting" panel to confirm a slot.` }
  }
  if (intent === 'budget_estimation' || (intent === 'new_order' && service)) {
    const ask = service ? '' : ' Which service do you need — software, web, app, content, AI automation, or an AI chatbot?'
    const b = budget ? ` For a budget around $${budget}, I can prepare a Development / Design / Hosting / Maintenance breakdown.` : ' What budget range are you considering?'
    return { ...base, message: `Got it${service ? ` — ${service}` : ''}.${ask}${b} You can create the order from the panel and I'll generate a transparent estimate.` }
  }
  if (intent === 'support') {
    return { ...base, message: 'Tell me what you need help with and I\'ll get it to the right person. For account or billing issues, our team is notified automatically.' }
  }
  if (intent === 'project_update') {
    return { ...base, message: 'You can track all your orders and their status in the "My Orders" panel. Want me to flag anything to the team?' }
  }
  return { ...base, message: `Hi ${user.name.split(' ')[0]}! I'm the Tech Solution assistant. I can scope a new project, estimate a budget, or schedule a meeting. What would you like to do?` }
}
