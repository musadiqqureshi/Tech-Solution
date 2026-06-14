// Declarative, option-based conversation flows for the guided lead chatbot.
// Each step: { label, type:'options'|'input', prompt, options?, inputType? }
// Answers are stored in order as { label, value } and shown in the summary.

const BUDGET = ['Under $500', '$500 - $1,000', '$1,000 - $5,000', 'Above $5,000']
const TIMELINE = ['ASAP', 'Within 2 weeks', 'Within 1 month', '1 - 3 months', 'Flexible']

const contactSteps = [
  { label: 'Name', type: 'input', inputType: 'text', prompt: 'Please provide your name.' },
  { label: 'Email', type: 'input', inputType: 'email', prompt: 'Please provide your email address.' },
  { label: 'Phone', type: 'input', inputType: 'tel', prompt: 'Please provide your phone number.' },
]

export const MENU = [
  { id: 'web', label: 'Web Development', icon: '🌐' },
  { id: 'app', label: 'Mobile App Development', icon: '📱' },
  { id: 'software', label: 'Custom Software Development', icon: '💻' },
  { id: 'ai', label: 'AI Solutions', icon: '🤖' },
  { id: 'design', label: 'UI/UX Design', icon: '🎨' },
  { id: 'marketing', label: 'Digital Marketing', icon: '📈' },
  { id: 'quote', label: 'Get a Quote', icon: '🧾' },
  { id: 'contact', label: 'Contact Team', icon: '📞' },
]

export const FLOWS = {
  web: {
    title: 'Web Development',
    leadType: 'Service Inquiry',
    intro: 'Great choice! Let’s scope your website.',
    steps: [
      { label: 'Website Type', type: 'options', prompt: 'What type of website do you need?',
        options: ['Business Website', 'E-commerce Store', 'Portfolio Website', 'Educational Website', 'Custom Website'] },
      { label: 'Budget', type: 'options', prompt: 'What is your estimated budget?', options: BUDGET },
      ...contactSteps,
    ],
  },
  app: {
    title: 'Mobile App Development',
    leadType: 'Service Inquiry',
    intro: 'Exciting! Let’s capture your app idea.',
    steps: [
      { label: 'App Type', type: 'options', prompt: 'What type of app do you need?',
        options: ['Android App', 'iOS App', 'Cross-Platform App', 'Enterprise App'] },
      { label: 'Project Description', type: 'input', inputType: 'text', prompt: 'Briefly describe your app idea.' },
      { label: 'Budget', type: 'options', prompt: 'What is your estimated budget?', options: BUDGET },
      ...contactSteps,
    ],
  },
  software: {
    title: 'Custom Software Development',
    leadType: 'Service Inquiry',
    intro: 'Let’s define your software requirements.',
    steps: [
      { label: 'Software Type', type: 'options', prompt: 'What type of software are you looking for?',
        options: ['ERP System', 'CRM System', 'School Management System', 'Hospital Management System', 'Inventory Management', 'Custom Solution'] },
      { label: 'Business Name', type: 'input', inputType: 'text', prompt: 'What is your business name?' },
      { label: 'Requirements', type: 'input', inputType: 'text', prompt: 'Briefly describe your requirements.' },
      { label: 'Budget', type: 'options', prompt: 'What is your estimated budget?', options: BUDGET },
      ...contactSteps,
    ],
  },
  ai: {
    title: 'AI Solutions',
    leadType: 'Service Inquiry',
    intro: 'Let’s explore the right AI solution for you.',
    steps: [
      { label: 'AI Solution', type: 'options', prompt: 'What AI solution are you interested in?',
        options: ['AI Chatbot', 'AI Automation', 'AI Analytics', 'AI Content Generation', 'Custom AI Solution'] },
      { label: 'Project Details', type: 'input', inputType: 'text', prompt: 'Tell us a bit about your project.' },
      { label: 'Budget', type: 'options', prompt: 'What is your estimated budget?', options: BUDGET },
      ...contactSteps,
    ],
  },
  design: {
    title: 'UI/UX Design',
    leadType: 'Service Inquiry',
    intro: 'Let’s craft something beautiful.',
    steps: [
      { label: 'Design Service', type: 'options', prompt: 'What design service do you need?',
        options: ['Website Design', 'Mobile App Design', 'Dashboard Design', 'Branding Design'] },
      { label: 'Project Details', type: 'input', inputType: 'text', prompt: 'Describe what you need designed.' },
      { label: 'Budget', type: 'options', prompt: 'What is your estimated budget?', options: BUDGET },
      ...contactSteps,
    ],
  },
  marketing: {
    title: 'Digital Marketing',
    leadType: 'Service Inquiry',
    intro: 'Let’s grow your reach.',
    steps: [
      { label: 'Marketing Service', type: 'options', prompt: 'What service are you interested in?',
        options: ['SEO', 'Social Media Marketing', 'Google Ads', 'Facebook Ads', 'Complete Marketing Package'] },
      { label: 'Business Name', type: 'input', inputType: 'text', prompt: 'What is your business name?' },
      { label: 'Marketing Goals', type: 'input', inputType: 'text', prompt: 'What are your marketing goals?' },
      { label: 'Budget', type: 'options', prompt: 'What is your estimated budget?', options: BUDGET },
      ...contactSteps,
    ],
  },
  quote: {
    title: 'Get a Quote',
    leadType: 'Quote Request',
    intro: 'Let’s prepare your custom quote.',
    steps: [
      { label: 'Service Needed', type: 'options', prompt: 'Which service do you need?',
        options: ['Web Development', 'Mobile App Development', 'Custom Software Development', 'AI Solutions', 'UI/UX Design', 'Digital Marketing'] },
      { label: 'Project Description', type: 'input', inputType: 'text', prompt: 'Briefly describe your project.' },
      { label: 'Budget', type: 'options', prompt: 'What is your estimated budget?', options: BUDGET },
      { label: 'Timeline', type: 'options', prompt: 'What is your preferred timeline?', options: TIMELINE },
      ...contactSteps,
    ],
  },
}

// Contact Team is handled specially (info card + sub-options).
export const CONTACT_INFO = {
  email: 'muzzammilkhan7890@gmail.com',
  phone: '+92 308 699 4758',
  website: 'https://tech-solutions.site',
}

export const CONTACT_SUBFLOWS = {
  callback: {
    title: 'Request Callback',
    leadType: 'Callback Request',
    intro: 'We’ll call you back shortly.',
    steps: [
      { label: 'Name', type: 'input', inputType: 'text', prompt: 'Please provide your name.' },
      { label: 'Phone', type: 'input', inputType: 'tel', prompt: 'What number should we call?' },
      { label: 'Best Time', type: 'options', prompt: 'When is the best time to reach you?',
        options: ['Morning', 'Afternoon', 'Evening'] },
    ],
  },
  consultation: {
    title: 'Book Consultation',
    leadType: 'Consultation',
    intro: 'Let’s book your free consultation.',
    steps: [
      { label: 'Name', type: 'input', inputType: 'text', prompt: 'Please provide your name.' },
      { label: 'Email', type: 'input', inputType: 'email', prompt: 'Please provide your email.' },
      { label: 'Phone', type: 'input', inputType: 'tel', prompt: 'Please provide your phone number.' },
      { label: 'Topic', type: 'input', inputType: 'text', prompt: 'What would you like to discuss?' },
    ],
  },
}

export const ADMIN_EMAIL = 'muzzammilkhan7890@gmail.com'
