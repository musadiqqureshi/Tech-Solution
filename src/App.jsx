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
import PortalLauncher from './portal/PortalLauncher'

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
        <Contact />
      </main>
      <Footer />
      <PortalLauncher />
    </div>
  )
}
