import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import * as THREE from 'three';
import { SITE_CONFIG } from '../config';
import SocialIcons from '../components/ui/SocialIcons';

const ease = [0.16, 1, 0.3, 1];
const fadeUp = (delay = 0) => ({
  initial: { opacity:0, y:30 },
  whileInView: { opacity:1, y:0 },
  viewport: { once:true, margin:'-80px' },
  transition: { duration:0.8, delay, ease },
});

/* ── Ink particles hero ── */
function ContactHeroCanvas() {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 100);
    camera.position.z = 5;

    /* ink particle field */
    const count=1600, pos=new Float32Array(count*3), cols=new Float32Array(count*3), sizes=new Float32Array(count);
    const pal=[new THREE.Color('#C7694F'),new THREE.Color('#9CAF88'),new THREE.Color('#FAF7F2'),new THREE.Color('#C9A94E')];
    for(let i=0;i<count;i++){
      const r=Math.pow(Math.random(),0.4)*7, theta=Math.random()*Math.PI*2, phi=Math.acos(2*Math.random()-1);
      pos[i*3]=r*Math.sin(phi)*Math.cos(theta); pos[i*3+1]=r*Math.sin(phi)*Math.sin(theta)*0.5; pos[i*3+2]=r*Math.cos(phi)*0.3;
      const c=pal[Math.floor(Math.random()*pal.length)]; cols[i*3]=c.r; cols[i*3+1]=c.g; cols[i*3+2]=c.b;
      sizes[i]=Math.random()*10+2;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
    geo.setAttribute('size',new THREE.BufferAttribute(sizes,1));
    const mat=new THREE.ShaderMaterial({
      vertexColors:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{uTime:{value:0},uPR:{value:renderer.getPixelRatio()}},
      vertexShader:`attribute float size;varying vec3 vColor;varying float vAlpha;uniform float uTime;uniform float uPR;
        void main(){vColor=color;vec3 p=position;float idx=float(gl_VertexID);
        p.x+=sin(uTime*0.18+idx*0.031)*0.12;p.y+=cos(uTime*0.14+idx*0.027)*0.10;p.z+=sin(uTime*0.11+idx*0.019)*0.06;
        float d=length(p.xy);vAlpha=clamp(1.0-d*0.14,0.0,1.0)*0.70;
        vec4 mv=modelViewMatrix*vec4(p,1.0);gl_PointSize=size*uPR*(3.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`varying vec3 vColor;varying float vAlpha;
        void main(){vec2 uv=gl_PointCoord-vec2(0.5);float a=smoothstep(0.5,0.15,length(uv))*vAlpha;if(a<0.01)discard;gl_FragColor=vec4(vColor,a);}`,
    });
    const pts=new THREE.Points(geo,mat); scene.add(pts);

    let animId, mx=0, my=0;
    const onMouse=e=>{mx=(e.clientX/window.innerWidth-0.5)*0.6;my=-(e.clientY/window.innerHeight-0.5)*0.4;};
    const onResize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
    window.addEventListener('mousemove',onMouse); window.addEventListener('resize',onResize);
    const clock=new THREE.Clock();
    const tick=()=>{animId=requestAnimationFrame(tick);const t=clock.getElapsedTime();mat.uniforms.uTime.value=t;
      pts.rotation.y+=(mx*0.5-pts.rotation.y)*0.03;pts.rotation.x+=(my*0.3-pts.rotation.x)*0.03;
      pts.rotation.z=Math.sin(t*0.07)*0.04;renderer.render(scene,camera);};
    tick();
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('mousemove',onMouse);window.removeEventListener('resize',onResize);
      geo.dispose();mat.dispose();renderer.dispose();if(el.contains(renderer.domElement))el.removeChild(renderer.domElement);};
  },[]);
  return <div ref={mountRef} style={{position:'absolute',inset:0,pointerEvents:'none'}}/>;
}

/* ── Accordion FAQ ── */
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...fadeUp(index * 0.06)}
      className="border-b border-charcoal/8 dark:border-white/8 last:border-b-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group">
        <span className="text-sm font-medium text-charcoal dark:text-[#F0EDE8] group-hover:text-terracotta dark:group-hover:text-terracotta transition-colors">
          {q}
        </span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration:0.25, ease }}
          className="flex-shrink-0 w-5 h-5 rounded-full border border-charcoal/18 dark:border-white/15 flex items-center justify-center text-charcoal-muted dark:text-[#9A9590]">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.3,ease}}>
            <p className="pb-5 text-sm text-charcoal-muted dark:text-[#9A9590] leading-relaxed pr-8">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const FIELD = "w-full px-4 py-3 rounded-xl border border-charcoal/10 dark:border-white/8 bg-cream dark:bg-[#252219] text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/45 dark:placeholder:text-white/22 focus:outline-none focus:ring-2 focus:ring-terracotta/25 transition-all";

export default function ContactPage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 380], [0, -55]);

  const [form, setForm] = useState({ name:'', email:'', subject:'', message:'' });
  const [sent, setSent]   = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 800)); // simulate send
    setSent(true);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-ivory dark:bg-[#1A1814]">

      {/* ══ HERO ══ */}
      <section style={{ position:'relative', height:'100vh', minHeight:580,
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', textAlign:'center', overflow:'hidden', background:'#0D0D0D' }}>
        <div style={{ position:'absolute', inset:0,
          background:'radial-gradient(ellipse 80% 60% at 50% 50%, #1a1510 0%, #0D0D0D 72%)' }}/>
        <ContactHeroCanvas/>

        <motion.div style={{ position:'relative', zIndex:2, opacity:heroOpacity, y:heroY,
          display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding:'0 24px', maxWidth:680 }}>
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.2}}
            style={{fontSize:10,fontWeight:500,letterSpacing:'0.38em',textTransform:'uppercase',color:'#C7694F',
              display:'flex',alignItems:'center',gap:14}}>
            <span style={{width:44,height:1,background:'#C7694F',opacity:0.45}}/>
            Get in Touch
            <span style={{width:44,height:1,background:'#C7694F',opacity:0.45}}/>
          </motion.div>
          <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:1,delay:0.38,ease}}
            className="font-display" style={{fontSize:'clamp(3rem,8.5vw,7rem)',fontWeight:600,
              lineHeight:0.97,letterSpacing:'-0.025em',color:'#F7F2EA'}}>
            Let's talk<br/>
            <em style={{fontStyle:'italic',color:'#C7694F',fontSize:'0.6em',
              fontWeight:400,display:'block',marginTop:10,letterSpacing:'0.02em'}}>
              about art
            </em>
          </motion.h1>
          <motion.p initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:0.85,delay:0.65}}
            style={{fontSize:15,fontWeight:300,color:'rgba(247,242,234,0.5)',lineHeight:1.75,maxWidth:420}}>
            Whether you have a commission idea, a question about a piece, or just want to say hello
            — I'd love to hear from you.
          </motion.p>
        </motion.div>

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.4,duration:1}}
          style={{position:'absolute',bottom:36,left:'50%',transform:'translateX(-50%)',
            display:'flex',flexDirection:'column',alignItems:'center',gap:10,zIndex:2}}>
          <motion.div animate={{scaleY:[1,0.35,1],opacity:[1,0.3,1]}} transition={{duration:2.2,repeat:Infinity,ease:'easeInOut'}}
            style={{width:1,height:50,background:'linear-gradient(to bottom,#C7694F,transparent)'}}/>
          <span style={{fontSize:9,letterSpacing:'0.3em',textTransform:'uppercase',color:'rgba(247,242,234,0.35)'}}>Scroll</span>
        </motion.div>
      </section>

      {/* ══ 01 — CONTACT FORM + INFO ══ */}
      <section className="bg-ivory dark:bg-[#1A1814]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Section number */}
          <div className="pt-16 sm:pt-20 select-none pointer-events-none overflow-hidden">
            <span className="font-display leading-none block text-charcoal/4 dark:text-white/4"
              style={{fontSize:'clamp(80px,16vw,160px)',letterSpacing:'-4px'}}>01</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 -mt-4 sm:-mt-8 lg:-mt-10 pb-16 sm:pb-24">

            {/* Left — Info */}
            <motion.div {...fadeUp(0)} className="flex flex-col gap-7">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium">Contact</span>
                <h2 className="mt-3 font-display text-charcoal dark:text-[#F0EDE8] leading-[1.0]"
                  style={{fontSize:'clamp(2.4rem,5.5vw,4rem)',fontWeight:400}}>
                  Send me<br/>
                  <em className="not-italic text-terracotta">a message</em>
                </h2>
              </div>

              <p className="text-sm text-charcoal-muted dark:text-[#9A9590] leading-relaxed max-w-sm">
                I respond to every message personally, usually within 24 hours.
                For commission enquiries, the more detail you share, the better.
              </p>

              {/* Contact details */}
              <div className="flex flex-col gap-4 pt-2">
                {[
                  { label:'Email',    value:SITE_CONFIG.email,   href:`mailto:${SITE_CONFIG.email}` },
                  { label:'Phone',    value:SITE_CONFIG.phone,   href:`tel:${SITE_CONFIG.phone}` },
                  { label:'Location', value:SITE_CONFIG.address, href:null },
                ].map(({ label, value, href }) => (
                  <div key={label} className="flex gap-4 items-start py-3 border-b border-charcoal/8 dark:border-white/6 last:border-b-0">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590] w-16 flex-shrink-0 pt-0.5">
                      {label}
                    </span>
                    {href
                      ? <a href={href} className="text-sm text-charcoal dark:text-[#F0EDE8] hover:text-terracotta dark:hover:text-terracotta transition-colors">{value}</a>
                      : <p className="text-sm text-charcoal dark:text-[#F0EDE8]">{value}</p>
                    }
                  </div>
                ))}
              </div>

              {/* Social row */}
              <div className="pt-2">
                <SocialIcons links={SITE_CONFIG.social} />
              </div>
            </motion.div>

            {/* Right — Form */}
            <motion.div {...fadeUp(0.15)}>
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div key="sent"
                    initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                    className="h-full flex flex-col items-center justify-center gap-4 py-16 text-center rounded-2xl border border-sage/25 bg-sage/5">
                    <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.1,type:'spring',stiffness:200}}>
                      <svg className="w-12 h-12 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </motion.div>
                    <h3 className="font-display text-xl text-charcoal dark:text-[#F0EDE8]">Message sent!</h3>
                    <p className="text-sm text-charcoal-muted dark:text-[#9A9590]">I'll get back to you within 24 hours.</p>
                    <button onClick={() => { setSent(false); setForm({ name:'',email:'',subject:'',message:'' }); }}
                      className="mt-2 text-[11px] uppercase tracking-[0.2em] text-terracotta hover:opacity-70 transition-opacity">
                      Send another
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input type="text" required value={form.name}
                        onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                        placeholder="Your name" className={FIELD}/>
                      <input type="email" required value={form.email}
                        onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                        placeholder="Your email" className={FIELD}/>
                    </div>
                    <input type="text" required value={form.subject}
                      onChange={e=>setForm(f=>({...f,subject:e.target.value}))}
                      placeholder="Subject" className={FIELD}/>
                    <textarea required value={form.message} rows={6}
                      onChange={e=>setForm(f=>({...f,message:e.target.value}))}
                      placeholder="Tell me about your project, question, or just say hello…"
                      className={`${FIELD} resize-none`}/>
                    <motion.button type="submit" disabled={sending}
                      whileTap={{scale:0.97}}
                      className="flex items-center justify-center gap-2.5 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium text-white disabled:opacity-50 transition-all duration-300"
                      style={{background: sending?'#9CAF88':'#2C2C2C', borderRadius:2}}
                      onMouseEnter={e=>{if(!sending)e.currentTarget.style.background='#C7694F';}}
                      onMouseLeave={e=>{if(!sending)e.currentTarget.style.background='#2C2C2C';}}>
                      {sending ? (
                        <>
                          <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}
                            className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white"/>
                          Sending…
                        </>
                      ) : 'Send Message'}
                    </motion.button>
                    <p className="text-[10px] text-charcoal-muted/50 dark:text-white/25 text-center">
                      Typically replied within 24 hours · All enquiries welcome
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6"/>
      </section>

      {/* ══ 02 — FAQ ══ */}
      <section id="faq" className="bg-cream/40 dark:bg-[#141210]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="pt-16 sm:pt-20 select-none pointer-events-none overflow-hidden">
            <span className="font-display leading-none block text-charcoal/4 dark:text-white/4"
              style={{fontSize:'clamp(80px,16vw,160px)',letterSpacing:'-4px'}}>02</span>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 -mt-4 sm:-mt-8 lg:-mt-10 pb-16 sm:pb-24">
            <motion.div {...fadeUp(0)}>
              <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium">FAQ</span>
              <h2 className="mt-3 font-display text-charcoal dark:text-[#F0EDE8] leading-[1.0]"
                style={{fontSize:'clamp(2rem,4.5vw,3.5rem)',fontWeight:400}}>
                Common<br/>
                <em className="not-italic text-terracotta">questions</em>
              </h2>
              <p className="mt-5 text-sm text-charcoal-muted dark:text-[#9A9590] leading-relaxed max-w-xs">
                Can't find what you need? Send me a message and I'll answer personally.
              </p>
              <Link to="/commission" className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-terracotta hover:opacity-70 transition-opacity">
                Start a Commission →
              </Link>
            </motion.div>

            <div className="flex flex-col">
              {[
                { q:'How long does a custom portrait take?',       a:'Typically 3–4 weeks for standard commissions, 2 weeks for expedited, and 1 week for rush orders. Complex multi-subject pieces may need additional time.' },
                { q:'Can I request revisions?',                    a:'Absolutely. I send progress updates at key stages and welcome feedback throughout. Minor adjustments are included; major changes may carry a small fee.' },
                { q:'What mediums do you work with?',              a:'Acrylics, oils, watercolour, charcoal, pencil sketches, ink & wash, and mixed media. I\'m also open to exploring new mediums for special projects.' },
                { q:'Do you ship internationally?',                a:'Yes, worldwide with insured and trackable shipping. International deliveries typically take 7–14 business days after dispatch.' },
                { q:'What if I\'m not happy with the final piece?', a:'I work closely with you throughout the process to ensure alignment with your vision. If you\'re not satisfied after revisions, I offer a partial refund policy.' },
                { q:'How do I care for my artwork?',               a:'Keep away from direct sunlight and high humidity. Dust gently with a soft dry cloth. For framed pieces, avoid extreme temperature changes and direct heat.' },
              ].map((faq, i) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i}/>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6"/>
      </section>

      {/* ══ Bottom strip ══ */}
      <motion.div {...fadeUp(0)}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex items-center justify-between bg-ivory dark:bg-[#1A1814]">
        <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590]">
          Strokes by Sakshi · Mumbai, India
        </span>
        <a href={`mailto:${SITE_CONFIG.email}`}
          className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] hover:text-terracotta transition-colors">
          {SITE_CONFIG.email}
        </a>
      </motion.div>
    </div>
  );
}
