import { lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'

// Lazy load below-fold sections for faster initial paint
const Partners    = lazy(() => import('./components/Partners'))
const Services    = lazy(() => import('./components/Services'))
const Projects    = lazy(() => import('./components/Projects'))
const WhyUs       = lazy(() => import('./components/WhyUs'))
const Process     = lazy(() => import('./components/Process'))
const Testimonials= lazy(() => import('./components/Testimonials'))
const Team        = lazy(() => import('./components/Team'))
const Contact     = lazy(() => import('./components/Contact'))
const Footer      = lazy(() => import('./components/Footer'))
const GuidedAssistant = lazy(() => import('./components/GuidedAssistant'))
const PortalLauncher  = lazy(() => import('./portal/PortalLauncher'))

function SectionLoader() {
  return <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" /></div>
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={<SectionLoader />}>
          <Partners />
          <Services />
          <Projects />
          <WhyUs />
          <Process />
          <Testimonials />
          <Team />
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
        <GuidedAssistant />
        <PortalLauncher />
      </Suspense>
    </div>
  )
}
