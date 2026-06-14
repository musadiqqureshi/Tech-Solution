export const services = [
  {
    icon: 'Code2',
    title: 'Software Development',
    desc: 'Custom software engineered for performance and scale — from internal tools and automation to full-stack platforms and APIs built to last.',
    points: ['Custom platforms & SaaS', 'REST & GraphQL APIs', 'Cloud & DevOps', 'System architecture'],
    accent: 'purple',
  },
  {
    icon: 'Globe',
    title: 'Web Development',
    desc: 'Fast, responsive, and beautiful websites and web apps that convert. We blend clean engineering with design that carries an aura of quality.',
    points: ['Marketing & corporate sites', 'Web applications', 'E-commerce', 'Performance & SEO'],
    accent: 'blue',
  },
  {
    icon: 'Smartphone',
    title: 'App Building',
    desc: 'Native-feeling mobile and cross-platform apps. From idea to App Store, we ship intuitive products users love to open every day.',
    points: ['iOS & Android', 'Cross-platform', 'UI/UX design', 'Maintenance & support'],
    accent: 'cyan',
  },
  {
    icon: 'PenTool',
    title: 'Content & Research Writing',
    desc: 'Compelling, accurate, and well-researched content — technical articles, documentation, academic research, and brand copy that speaks clearly.',
    points: ['Technical & blog writing', 'Academic research', 'Documentation', 'Brand & SEO copy'],
    accent: 'gold',
  },
  {
    icon: 'Workflow',
    title: 'AI Automation & Workflows',
    desc: 'Put your busywork on autopilot. We design intelligent automations that connect your tools and run processes end-to-end, saving hours every week.',
    points: ['Process automation', 'Tool & API integrations', 'Data pipelines', 'No-code & custom workflows'],
    accent: 'violet',
  },
  {
    icon: 'Bot',
    title: 'AI Agents & Chatbots',
    desc: 'Custom AI agents and chatbots that talk to your customers, answer questions, and act on your behalf — trained on your data and tuned for your brand.',
    points: ['Customer support bots', 'Autonomous AI agents', 'RAG on your data', 'Web, WhatsApp & Slack'],
    accent: 'emerald',
  },
]

export const stats = [
  { val: '50+', label: 'Projects Delivered' },
  { val: '30+', label: 'Happy Clients' },
  { val: '6', label: 'Core Services' },
  { val: '24/7', label: 'Support' },
]

export const process = [
  { step: '01', title: 'Discover', desc: 'We listen to your goals, audience, and constraints to define a clear scope and roadmap.' },
  { step: '02', title: 'Design', desc: 'We craft architecture and interfaces — wireframes, systems, and a plan that fits your budget.' },
  { step: '03', title: 'Build', desc: 'Agile, transparent development with regular check-ins so you always know where things stand.' },
  { step: '04', title: 'Deliver', desc: 'We launch, monitor, and support — ensuring your product performs long after go-live.' },
]

export const team = [
  {
    name: 'Musaddiq Ahmed Qureshi',
    role: 'Chief Executive Officer',
    bio: 'Sets the vision and leads delivery across every engagement — a senior engineer and Big Data specialist driving both the technical excellence and strategic direction of the company.',
    initials: 'MQ',
    accent: 'purple',
    link: 'https://musadiqqureshi.vercel.app',
  },
]

export const whyUs = [
  { icon: 'Rocket', title: 'Fast Delivery', desc: 'Agile sprints and clear milestones get your product to market without the wait.' },
  { icon: 'ShieldCheck', title: 'Quality First', desc: 'Clean, tested, maintainable code and content reviewed to a high standard.' },
  { icon: 'Users', title: 'True Partnership', desc: 'Transparent communication and a team that treats your goals as our own.' },
  { icon: 'Sparkles', title: 'Aura of Excellence', desc: 'Every deliverable is polished — design and engineering that simply feel premium.' },
]

export const projects = [
  {
    title: 'Enterprise Big Data Pipeline',
    category: 'Big Data Engineering',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #7c3aed, #2563eb)',
    description: 'End-to-end distributed data pipeline on Hadoop, Spark, and Kafka for real-time and batch processing of terabytes of data with fault-tolerance and horizontal scalability.',
    tech: ['Apache Spark', 'Kafka', 'Hadoop', 'Hive', 'Python', 'Scala'],
    impact: 'Reduced processing time by 85% · 10M+ daily events',
  },
  {
    title: 'AI Fraud Detection System',
    category: 'AI & Fraud Detection',
    icon: '🛡️',
    gradient: 'linear-gradient(135deg, #db2777, #7c3aed)',
    description: 'ML-powered fraud detection for financial transactions using ensemble learning and real-time scoring via a FastAPI microservice with sub-50ms response time.',
    tech: ['Python', 'Scikit-learn', 'FastAPI', 'Redis', 'XGBoost', 'PostgreSQL'],
    impact: '99.2% accuracy · 67% fewer false positives',
  },
  {
    title: 'Hospital Management System',
    category: 'Healthcare Systems',
    icon: '🏥',
    gradient: 'linear-gradient(135deg, #059669, #06b6d4)',
    description: 'Full-stack hospital platform covering patient records, appointments, billing, pharmacy, and lab results with role-based access control.',
    tech: ['Python', 'Flask', 'MySQL', 'SQLAlchemy', 'JWT', 'Celery'],
    impact: 'Deployed for 3 clinics · 60% less admin overhead',
  },
  {
    title: 'Data Integration Platform',
    category: 'Data Pipelines & ETL',
    icon: '🔗',
    gradient: 'linear-gradient(135deg, #2563eb, #06b6d4)',
    description: 'Scalable ETL/ELT platform ingesting data from 30+ heterogeneous sources into a centralized warehouse with schema validation and lineage tracking.',
    tech: ['Python', 'Airflow', 'PostgreSQL', 'MongoDB', 'Docker'],
    impact: 'Unified 7 systems · 75% faster reports',
  },
  {
    title: 'Cinema Booking System',
    category: 'Python Backend',
    icon: '🎬',
    gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
    description: 'Multi-cinema seat reservation platform with real-time availability, payment integration, and e-ticket generation — no double-booking under load.',
    tech: ['Python', 'Flask', 'MySQL', 'Redis', 'REST API'],
    impact: '2000+ concurrent bookings · zero conflicts',
  },
  {
    title: 'Air Ticketing & Reservation',
    category: 'Aviation & Ticketing',
    icon: '✈️',
    gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
    description: 'Airline reservation system with flight search, seat selection, dynamic fare calculation, online check-in, and GDS API integration.',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Celery'],
    impact: '50,000+ bookings · 99.9% uptime',
  },
  {
    title: 'Restaurant Management System',
    category: 'Hospitality Systems',
    icon: '🍽️',
    gradient: 'linear-gradient(135deg, #ea580c, #db2777)',
    description: 'POS-integrated solution with table & order management, kitchen display, multi-branch inventory, and live sales analytics.',
    tech: ['Python', 'Flask', 'MySQL', 'WebSocket', 'Redis'],
    impact: '5 branches · 80% fewer order errors',
  },
  {
    title: 'ML Classification Suite',
    category: 'Machine Learning',
    icon: '🧠',
    gradient: 'linear-gradient(135deg, #0d9488, #059669)',
    description: 'Production-ready ML models for healthcare and general datasets — cancer prediction, diabetes detection, and more — served via Flask APIs.',
    tech: ['Python', 'Scikit-learn', 'Pandas', 'NumPy', 'Flask'],
    impact: 'Cancer model 97.4% · Diabetes 94.1%',
  },
]

export const testimonials = [
  { name: 'Ahmed Raza', role: 'CTO, FinEdge', initials: 'AR', accent: '#7c3aed', text: 'The fraud detection platform they built exceeded our expectations — accurate, fast, and rock solid in production. A genuinely world-class engineering team.' },
  { name: 'Sara Malik', role: 'Founder, MediCare Plus', initials: 'SM', accent: '#06b6d4', text: 'Our hospital management system transformed daily operations. Admin overhead dropped dramatically and the staff actually enjoy using it.' },
  { name: 'David Chen', role: 'Head of Data, Nexus Retail', initials: 'DC', accent: '#2563eb', text: 'They unified seven siloed systems into one clean data platform. Reports that used to take hours now run in minutes. Incredible work.' },
  { name: 'Fatima Noor', role: 'Product Lead, SkyWays', initials: 'FN', accent: '#f59e0b', text: 'The ticketing system handled our peak season flawlessly — 99.9% uptime and zero booking conflicts. Communication was clear the whole way through.' },
  { name: 'James Carter', role: 'CEO, BiteHub', initials: 'JC', accent: '#db2777', text: 'Order errors fell by 80% across all our branches after their POS rollout. They understood our business, not just the code.' },
  { name: 'Ayesha Khan', role: 'Director, BrightLearn', initials: 'AK', accent: '#0d9488', text: 'The AI chatbot they delivered answers 80% of our support tickets automatically. Setup was smooth and the results were immediate.' },
  { name: 'Michael Brooks', role: 'VP Engineering, DataForge', initials: 'MB', accent: '#6d28d9', text: 'Their big data pipeline cut our processing time by 85%. The architecture is clean, documented, and built to scale. Highly recommended.' },
  { name: 'Hina Tariq', role: 'Marketing Head, Lumina', initials: 'HT', accent: '#0891b2', text: 'The content and research writing was sharp, accurate, and on-brand. They turned complex technical topics into copy our audience loved.' },
  { name: 'Robert Klein', role: 'Operations, AeroLink', initials: 'RK', accent: '#2563eb', text: 'From discovery to delivery, the process was transparent and on time. Tech Solutions feels like an extension of our own team.' },
  { name: 'Zainab Ali', role: 'Founder, ShopSphere', initials: 'ZA', accent: '#7c3aed', text: 'They built our web app and automated our entire order workflow. We are saving hours every single day. Worth every penny.' },
]

export const partners = [
  'NexusRetail', 'FinEdge', 'MediCare+', 'SkyWays', 'BiteHub', 'DataForge',
  'BrightLearn', 'Lumina', 'AeroLink', 'ShopSphere', 'CloudPeak', 'Vertex',
]
