import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Hero Story */}
      <section className="px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <motion.span {...fadeUp} className="text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
            The Artist
          </motion.span>
          <motion.h1 {...fadeUp} className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-display text-charcoal leading-tight">
            Every stroke<br />
            <span className="italic text-terracotta">carries a story</span>
          </motion.h1>
          <motion.div {...fadeUp} className="mt-12 prose prose-lg prose-charcoal-muted max-w-3xl">
            <p className="text-lg leading-relaxed">
              I'm Sakshi — an artist based in Mumbai, India, with a deep passion for capturing emotions on canvas. 
              My journey with art began as a quiet child, finding solace in colors when words felt insufficient. 
              Over the years, that quiet spark grew into a blazing fire, leading me to pursue art not just as a craft, 
              but as a way to connect souls.
            </p>
            <p className="mt-6 text-lg leading-relaxed">
              Every piece I create is born from a conversation — between me and the subject, between light and shadow, 
              between what is seen and what is felt. I believe that art should not just be looked at; it should be experienced. 
              It should make you pause, reflect, and feel something real.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <motion.section {...fadeUp} className="px-4 py-16 lg:py-24 bg-cream/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">My Philosophy</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-display text-charcoal">Art as emotional archive</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: 'Authenticity', desc: 'Every piece is 100% handcrafted. No shortcuts, no digital reproductions — just the raw, beautiful imperfection of human hands at work.' },
              { title: 'Emotional Depth', desc: 'I don\'t just paint what I see; I paint what I feel. Each artwork is infused with the emotion of its subject and the love of its creation.' },
              { title: 'Meaningful Connection', desc: 'Art is a dialogue between the artist, the subject, and the viewer. My goal is to create pieces that resonate deeply and personally.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <h3 className="text-lg font-display text-charcoal">{item.title}</h3>
                <p className="mt-4 text-sm text-charcoal-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Process */}
      <motion.section {...fadeUp} className="px-4 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">How It Works</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-display text-charcoal">The Creation Process</h2>
          </div>
          <div className="space-y-12">
            {[
              { step: '01', title: 'Discovery', desc: 'We begin with a conversation. Tell me about your vision, the emotions you want to capture, and any reference materials you have.' },
              { step: '02', title: 'Design & Quote', desc: 'I\'ll create a concept and provide a detailed quote. We\'ll discuss size, medium, style, and timeline until everything feels right.' },
              { step: '03', title: 'Creation', desc: 'This is where the magic happens. I work with deep focus and care, sending you progress updates so you\'re part of the journey.' },
              { step: '04', title: 'Delivery', desc: 'Your finished artwork is carefully packaged and shipped to your door, ready to find its forever home.' },
            ].map(item => (
              <div key={item.step} className="flex gap-6 md:gap-12 items-start">
                <span className="text-3xl sm:text-4xl font-display text-charcoal-muted/30 flex-shrink-0">{item.step}</span>
                <div>
                  <h3 className="text-xl font-display text-charcoal">{item.title}</h3>
                  <p className="mt-2 text-sm text-charcoal-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section {...fadeUp} className="px-4 py-16 lg:py-24 bg-charcoal text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display text-ivory">Let's create something beautiful together</h2>
          <Link to="/commission" className="inline-block mt-8 px-10 py-4 bg-ivory text-charcoal text-sm uppercase tracking-[0.2em] font-medium rounded-full hover:bg-ivory/90 transition-all">
            Start Your Commission
          </Link>
        </div>
      </motion.section>
    </div>
  );
}