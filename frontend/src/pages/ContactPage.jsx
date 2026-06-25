import { useState } from 'react';
import { motion } from 'motion/react';
import { SITE_CONFIG } from '../config';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In production, connect to backend mail endpoint
    setSent(true);
  };

  return (
    <div className="pt-24">
      <section className="px-4 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">Get in Touch</span>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-display text-charcoal leading-tight">
                Let's talk<br />
                <span className="italic text-terracotta">about art</span>
              </h1>
              <p className="mt-6 text-lg text-charcoal-muted">
                Whether you have a commission idea, a question about a piece, or just want to say hello — 
                I'd love to hear from you.
              </p>

              <div className="mt-12 space-y-6">
                {[
                  { label: 'Email', value: SITE_CONFIG.email },
                  { label: 'Phone', value: SITE_CONFIG.phone },
                  { label: 'Location', value: SITE_CONFIG.address },
                ].map(item => (
                  <div key={item.label}>
                    <span className="text-xs uppercase tracking-widest text-charcoal-muted font-medium">{item.label}</span>
                    <p className="mt-1 text-charcoal">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-4">
                {Object.entries(SITE_CONFIG.social).slice(0, 4).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-charcoal transition-colors">
                    {platform}
                  </a>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {sent ? (
                <div className="p-8 rounded-2xl bg-sage/10 border border-sage/20 text-center">
                  <p className="text-lg text-sage font-medium">Message sent!</p>
                  <p className="mt-2 text-sm text-charcoal-muted">I'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Your name" className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted" />
                    <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="Your email" className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted" />
                  </div>
                  <input type="text" required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                    placeholder="Subject" className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted" />
                  <textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                    rows={6} placeholder="Tell me about your project or question..."
                    className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted resize-none" />
                  <button type="submit" className="w-full py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light transition-colors">
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 py-16 lg:py-24 bg-cream/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">FAQ</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-display text-charcoal">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {[
              { q: 'How long does a custom portrait take?', a: 'Typically 3-4 weeks for standard commissions, 2 weeks for expedited, and 1 week for rush orders. Complex pieces may require additional time.' },
              { q: 'Can I request revisions?', a: 'Absolutely! Your satisfaction is paramount. I provide progress updates and welcome your feedback throughout the creation process.' },
              { q: 'What mediums do you work with?', a: 'I specialize in acrylics, oils, watercolors, charcoal, pencil sketches, and digital illustrations. I\'m also open to exploring new mediums for special projects.' },
              { q: 'Do you ship internationally?', a: 'Yes! I ship worldwide with insured, trackable shipping. International deliveries typically take 7-14 business days.' },
              { q: 'What if I don\'t like the final piece?', a: 'I work closely with you throughout the process to ensure the result aligns with your vision. However, if you\'re not satisfied, I offer revisions and adjustments.' },
              { q: 'How do I care for my artwork?', a: 'Keep away from direct sunlight and humidity. Dust gently with a soft cloth. For framed pieces, avoid exposing to extreme temperature changes.' },
            ].map(faq => (
              <details key={faq.q} className="group">
                <summary className="flex items-center justify-between py-4 px-6 rounded-xl bg-ivory cursor-pointer hover:bg-cream transition-colors">
                  <span className="text-sm font-medium text-charcoal">{faq.q}</span>
                  <svg className="w-4 h-4 text-charcoal-muted group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 px-6 pb-4 text-sm text-charcoal-muted leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}