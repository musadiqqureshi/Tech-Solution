import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Partners from './components/Partners'
import Services from './components/Services'
import Projects from './components/Projects'
import WhyUs from './components/WhyUs'
import Process from './components/Process'
import Testimonials from './components/Testimonials'
import Team from './components/Team'
import Contact from './components/Contact'
import Footer from './components/Footer'
import { lazy, Suspense } from 'react'

// Defer the chatbot + experts section (the latter pulls in Supabase) so they
// don't block first paint — keeps the homepage fast on desktop.
const GuidedAssistant = lazy(() => import('./components/GuidedAssistant'))
const Experts = lazy(() => import('./components/Experts'))

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <Partners />
        <Services />
        <Projects />
        <WhyUs />
        <Process />
        <Testimonials />
        <Team />
        <Suspense fallback={null}><Experts /></Suspense>
        <Contact />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <GuidedAssistant />
      </Suspense>
    </div>
  )
}
