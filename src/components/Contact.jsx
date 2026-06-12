import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Send, MapPin, CheckCircle2 } from 'lucide-react'

const services = ['Software Development', 'Web Development', 'App Building', 'Content & Research Writing', 'AI Automation & Workflows', 'AI Agents & Chatbots', 'Something else']

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', service: services[0], message: '' })
  const [sent, setSent] = useState(false)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    const subject = encodeURIComponent(`Project inquiry — ${form.service}`)
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nService: ${form.service}\n\n${form.message}`)
    window.location.href = `mailto:muzzammilkhan7890@gmail.com?subject=${subject}&body=${body}`
    setSent(true)
    setTimeout(() => setSent(false), 6000)
  }

  return (
    <section id="contact" className="relative py-24 bg-aura-mesh overflow-hidden">
      <div className="orb w-80 h-80 -top-10 right-[10%]" style={{ background: '#c4b5fd', opacity: 0.4 }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-tag">Get In Touch</span>
          <h2 className="section-heading">Let's build <span className="gradient-text">something great</span></h2>
          <p className="text-slate-600 text-lg">Tell us about your project and we'll get back to you within one business day.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {[
              { icon: Mail, label: 'Email', value: 'muzzammilkhan7890@gmail.com', href: 'mailto:muzzammilkhan7890@gmail.com' },
              { icon: Phone, label: 'Phone', value: '+92 308 699 4758', href: 'tel:+923086994758' },
              { icon: MapPin, label: 'Working', value: 'Remote · Worldwide', href: null },
            ].map(({ icon: Icon, label, value, href }) => {
              const inner = (
                <div className="glass-card p-5 flex items-center gap-4 h-full">
                  <span className="grid place-items-center w-11 h-11 rounded-xl shrink-0"
                    style={{ background: 'rgba(124,58,237,0.1)', color: '#6d28d9' }}>
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{label}</div>
                    <div className="text-slate-800 font-semibold truncate">{value}</div>
                  </div>
                </div>
              )
              return href ? <a key={label} href={href} className="block">{inner}</a> : <div key={label}>{inner}</div>
            })}
            <div className="glass-card p-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Prefer email? Write to us directly and include a short description of your idea, timeline, and budget.
                We'll reply with next steps.
              </p>
            </div>
          </div>

          <motion.form
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 glass-card p-7 sm:p-8"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Name</label>
                <input name="name" value={form.name} onChange={onChange} placeholder="Your name" className="contact-input" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email</label>
                <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@email.com" className="contact-input" required />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Service</label>
              <select name="service" value={form.service} onChange={onChange} className="contact-input">
                {services.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Project details</label>
              <textarea name="message" value={form.message} onChange={onChange} rows={5} placeholder="Tell us about your project..." className="contact-input resize-none" required />
            </div>
            <button type="submit" className="btn-primary w-full justify-center mt-6">
              {sent ? <><CheckCircle2 size={18} /> Opening your email...</> : <><Send size={18} /> Send Message</>}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  )
}
