import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import * as THREE from 'three';

const ease = [0.16, 1, 0.3, 1];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.85, delay, ease },
});

/* ── Three.js brush ribbon hero (same visual DNA as gallery) ── */
function HeroCanvas() {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W/H, 0.1, 100);
    camera.position.set(0, 0, 7);

    /* Flowing ribbon tubes */
    const ribbons = [];
    [
      { color:'#C7694F', w:0.05,  speed:0.30, amp:2.0, off:0,           op:0.65 },
      { color:'#9CAF88', w:0.028, speed:0.20, amp:1.5, off:Math.PI*0.7, op:0.45 },
      { color:'#FAF7F2', w:0.014, speed:0.42, amp:2.6, off:Math.PI*1.4, op:0.22 },
      { color:'#C9A94E', w:0.020, speed:0.24, amp:1.8, off:Math.PI*1.1, op:0.32 },
    ].forEach(def => {
      const pts = [];
      for (let i = 0; i <= 180; i++) {
        const t = (i/180)*Math.PI*4 - Math.PI*2;
        pts.push(new THREE.Vector3(t*0.9, Math.sin(t+def.off)*def.amp, Math.cos(t*0.5+def.off)*1.0));
      }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 360, def.w, 8, false);
      const mat = new THREE.MeshBasicMaterial({ color:def.color, transparent:true, opacity:def.op, depthWrite:false });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh); ribbons.push({ mesh, def });
    });

    /* Ink dot cloud */
    const N=500, dP=new Float32Array(N*3), dC=new Float32Array(N*3);
    const pal = [new THREE.Color('#C7694F'), new THREE.Color('#9CAF88'), new THREE.Color('#FAF7F2')];
    for(let i=0;i<N;i++){
      dP[i*3]=(Math.random()-0.5)*16; dP[i*3+1]=(Math.random()-0.5)*8; dP[i*3+2]=(Math.random()-0.5)*4;
      const c=pal[i%pal.length]; dC[i*3]=c.r; dC[i*3+1]=c.g; dC[i*3+2]=c.b;
    }
    const dotGeo=new THREE.BufferGeometry();
    dotGeo.setAttribute('position',new THREE.BufferAttribute(dP,3));
    dotGeo.setAttribute('color',new THREE.BufferAttribute(dC,3));
    const dotMat=new THREE.PointsMaterial({size:0.04,vertexColors:true,transparent:true,opacity:0.30,depthWrite:false});
    scene.add(new THREE.Points(dotGeo,dotMat));

    let mx=0, my=0, animId;
    const onMouse = e => { mx=(e.clientX/window.innerWidth-0.5)*1.0; my=-(e.clientY/window.innerHeight-0.5)*0.6; };
    const onResize = () => { const w=el.clientWidth,h=el.clientHeight; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      ribbons.forEach(({mesh,def}) => {
        mesh.rotation.x += (my*0.14 - mesh.rotation.x)*0.04;
        mesh.rotation.y += (mx*0.10 - mesh.rotation.y)*0.04;
        mesh.position.y = Math.sin(t*def.speed*0.5)*0.12;
      });
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      ribbons.forEach(({mesh}) => { mesh.geometry.dispose(); mesh.material.dispose(); });
      dotGeo.dispose(); dotMat.dispose(); renderer.dispose();
      if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={mountRef} style={{ position:'absolute', inset:0, pointerEvents:'none' }}/>;
}

export default function AboutPage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 400], [0, -60]);

  return (
    <div className="min-h-screen bg-ivory dark:bg-[#1A1814]">

      {/* ══ HERO — dark with Three.js ribbons ══ */}
      <section style={{ position:'relative', height:'100vh', minHeight:620,
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', textAlign:'center', overflow:'hidden', background:'#0D0D0D' }}>
        <div style={{ position:'absolute', inset:0,
          background:'radial-gradient(ellipse 85% 65% at 50% 52%, #18140c 0%, #0D0D0D 72%)' }}/>
        <HeroCanvas />

        <motion.div style={{ position:'relative', zIndex:2, opacity:heroOpacity, y:heroY,
          display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding:'0 24px', maxWidth:700 }}>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.2 }}
            style={{ fontSize:10, fontWeight:500, letterSpacing:'0.38em', textTransform:'uppercase',
              color:'#C7694F', display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ width:48, height:1, background:'#C7694F', opacity:0.45 }}/>
            The Artist
            <span style={{ width:48, height:1, background:'#C7694F', opacity:0.45 }}/>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:1.05, delay:0.38, ease }}
            className="font-display" style={{ fontSize:'clamp(3.2rem,9vw,7.5rem)',
              fontWeight:600, lineHeight:0.96, letterSpacing:'-0.025em', color:'#F7F2EA' }}>
            Every stroke<br/>
            <em style={{ fontStyle:'italic', color:'#C7694F', fontSize:'0.6em',
              fontWeight:400, display:'block', marginTop:10, letterSpacing:'0.02em' }}>
              carries a story
            </em>
          </motion.h1>

          <motion.p initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.85, delay:0.65 }}
            style={{ fontSize:15, fontWeight:300, color:'rgba(247,242,234,0.5)',
              lineHeight:1.75, maxWidth:460 }}>
            I'm Sakshi — a self-taught painter based in Mumbai, India.
            Art is how I make sense of the world, and every canvas is a conversation.
          </motion.p>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.88 }}
            style={{ display:'flex', gap:32, paddingTop:22,
              borderTop:'1px solid rgba(247,242,234,0.07)', width:'100%', justifyContent:'center' }}>
            {[{ num:'200+', label:'Artworks' },{ num:'6+', label:'Years' },{ num:'98%', label:'Happy Collectors' }]
              .map(({ num, label }) => (
                <div key={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <span className="font-display" style={{ fontSize:24, fontWeight:600, color:'#C7694F', lineHeight:1 }}>{num}</span>
                  <span style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(247,242,234,0.35)' }}>{label}</span>
                </div>
              ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5, duration:1 }}
          style={{ position:'absolute', bottom:36, left:'50%', transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:10, zIndex:2 }}>
          <motion.div animate={{ scaleY:[1,0.35,1], opacity:[1,0.3,1] }}
            transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
            style={{ width:1, height:52, background:'linear-gradient(to bottom,#C7694F,transparent)' }}/>
          <span style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(247,242,234,0.35)' }}>
            Scroll
          </span>
        </motion.div>
      </section>

      {/* ══ 01 — THE STORY ══ */}
      <section className="bg-ivory dark:bg-[#1A1814]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Section number */}
          <div className="pt-16 sm:pt-20 select-none pointer-events-none overflow-hidden">
            <span className="font-display leading-none block text-charcoal/4 dark:text-white/4"
              style={{ fontSize:'clamp(80px,16vw,160px)', letterSpacing:'-4px' }}>01</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 -mt-4 sm:-mt-8 lg:-mt-10 pb-16 sm:pb-24">
            {/* Left */}
            <motion.div {...fadeUp(0)}>
              <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium">My Story</span>
              <h2 className="mt-4 font-display text-charcoal dark:text-[#F0EDE8] leading-[1.0]"
                style={{ fontSize:'clamp(2.4rem,5.5vw,4.5rem)', fontWeight:400 }}>
                Art as a way<br/>
                <em className="not-italic text-terracotta">of seeing</em>
              </h2>
              <div className="mt-6 h-px w-10 bg-terracotta/40"/>
            </motion.div>

            {/* Right */}
            <motion.div {...fadeUp(0.15)} className="flex flex-col gap-5 justify-center lg:pt-2">
              <p className="text-base sm:text-lg text-charcoal-muted dark:text-[#9A9590] leading-relaxed">
                My journey with art began as a quiet child, finding solace in colours when words felt
                insufficient. Over the years, that quiet spark grew into a blazing fire — leading me to
                pursue art not as a career but as a calling.
              </p>
              <p className="text-sm sm:text-base text-charcoal-muted dark:text-[#9A9590] leading-relaxed">
                I'm self-taught, which means every technique I know came from experiment, failure, and
                obsessive practice. I work primarily in acrylics and oils, though no medium is off the table
                when the subject demands it.
              </p>
              <p className="text-sm sm:text-base text-charcoal-muted dark:text-[#9A9590] leading-relaxed">
                Every piece I create begins with a conversation — between me and the subject, between light
                and shadow, between what is seen and what is truly felt.
              </p>
            </motion.div>
          </div>
        </div>
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6"/>
      </section>

      {/* ══ 02 — PHILOSOPHY ══ */}
      <section className="bg-cream/40 dark:bg-[#141210]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="pt-16 sm:pt-20 select-none pointer-events-none overflow-hidden">
            <span className="font-display leading-none block text-charcoal/4 dark:text-white/4"
              style={{ fontSize:'clamp(80px,16vw,160px)', letterSpacing:'-4px' }}>02</span>
          </div>

          <motion.div {...fadeUp(0)} className="-mt-4 sm:-mt-8 mb-12">
            <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium">My Philosophy</span>
            <h2 className="mt-3 font-display text-charcoal dark:text-[#F0EDE8]"
              style={{ fontSize:'clamp(1.8rem,4vw,3rem)', fontWeight:400, letterSpacing:'-0.01em' }}>
              Art as <em className="not-italic text-terracotta">emotional archive</em>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-0 pb-16 sm:pb-24">
            {[
              { n:'01', title:'Authenticity',         body:'Every piece is 100% handcrafted. No shortcuts, no digital reproductions — just the raw, beautiful imperfection of human hands at work.' },
              { n:'02', title:'Emotional Depth',      body:'I don\'t just paint what I see; I paint what I feel. Each artwork is infused with the emotion of its subject and the love of its creation.' },
              { n:'03', title:'Meaningful Connection',body:'Art is a dialogue. My goal is to create pieces that resonate deeply — that make you pause, feel something real, and keep feeling it.' },
            ].map((item, i) => (
              <motion.div key={item.n} {...fadeUp(i * 0.1)}
                className="py-8 pr-0 sm:pr-10 border-t border-charcoal/8 dark:border-white/6 sm:border-t-0 sm:border-l first:border-l-0 sm:pl-10 sm:first:pl-0">
                <span className="text-[10px] uppercase tracking-[0.22em] text-terracotta font-medium">{item.n}</span>
                <h3 className="mt-3 font-display text-lg text-charcoal dark:text-[#F0EDE8]">{item.title}</h3>
                <p className="mt-3 text-sm text-charcoal-muted dark:text-[#9A9590] leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6"/>
      </section>

      {/* ══ 03 — PROCESS ══ */}
      <section className="bg-ivory dark:bg-[#1A1814]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="pt-16 sm:pt-20 select-none pointer-events-none overflow-hidden">
            <span className="font-display leading-none block text-charcoal/4 dark:text-white/4"
              style={{ fontSize:'clamp(80px,16vw,160px)', letterSpacing:'-4px' }}>03</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 -mt-4 sm:-mt-8 lg:-mt-10 pb-16 sm:pb-24">
            <motion.div {...fadeUp(0)}>
              <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium">How It Works</span>
              <h2 className="mt-4 font-display text-charcoal dark:text-[#F0EDE8] leading-[1.0]"
                style={{ fontSize:'clamp(2.4rem,5.5vw,4.5rem)', fontWeight:400 }}>
                The creation<br/>
                <em className="not-italic text-terracotta">process</em>
              </h2>
              <p className="mt-5 text-sm text-charcoal-muted dark:text-[#9A9590] leading-relaxed max-w-sm">
                Every commission is a collaboration. Here's how we build something together from nothing.
              </p>
              <Link to="/commission"
                className="mt-8 inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-terracotta hover:opacity-70 transition-opacity">
                Start Your Commission
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </Link>
            </motion.div>

            <div className="flex flex-col gap-0">
              {[
                { n:'01', title:'Discovery',   body:'We begin with a conversation. Tell me about your vision, the emotions you want to capture, and any references you have.' },
                { n:'02', title:'Concept',     body:'I create a concept and provide a detailed quote. We discuss size, medium, style, and timeline until everything feels right.' },
                { n:'03', title:'Creation',    body:'This is where the magic happens. I work with deep focus, sending progress updates so you\'re part of the journey.' },
                { n:'04', title:'Delivery',    body:'Your finished artwork is carefully packaged and shipped to your door — ready to find its forever home.' },
              ].map((step, i) => (
                <motion.div key={step.n} {...fadeUp(i * 0.09)}
                  className="flex gap-5 py-5 border-b border-charcoal/8 dark:border-white/6 last:border-b-0">
                  <span className="font-display text-xs flex-shrink-0 mt-0.5 text-terracotta" style={{ letterSpacing:1, minWidth:24 }}>{step.n}</span>
                  <div>
                    <h4 className="text-sm font-medium text-charcoal dark:text-[#F0EDE8]">{step.title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-charcoal-muted dark:text-[#9A9590]">{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6"/>
      </section>

      {/* ══ 04 — MEDIUMS ══ */}
      <section className="bg-cream/40 dark:bg-[#141210]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <motion.div {...fadeUp(0)} className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium">04 · Mediums</span>
              <h2 className="mt-3 font-display text-charcoal dark:text-[#F0EDE8]"
                style={{ fontSize:'clamp(1.8rem,4vw,3rem)', fontWeight:400, letterSpacing:'-0.01em' }}>
                Tools of <em className="not-italic text-terracotta">the trade</em>
              </h2>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {['Acrylic', 'Oil Paint', 'Watercolour', 'Pencil Sketch', 'Charcoal', 'Ink & Wash', 'Mixed Media', 'Pastel', 'Digital', 'Canvas Board'].map((med, i) => (
              <motion.div key={med} {...fadeUp(i * 0.04)}
                className="px-4 py-3 rounded-xl border border-charcoal/8 dark:border-white/8 bg-ivory dark:bg-[#1e1c18] text-center group hover:border-terracotta/30 transition-colors duration-300">
                <p className="text-xs font-medium text-charcoal dark:text-[#F0EDE8] group-hover:text-terracotta transition-colors">{med}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6"/>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="bg-ivory dark:bg-[#1A1814]">
        <motion.div {...fadeUp(0)}
          className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-charcoal dark:text-[#F0EDE8] leading-[0.96]"
              style={{ fontSize:'clamp(2.4rem,6vw,5.5rem)', fontWeight:400 }}>
              Let's create<br/>
              <em className="not-italic text-terracotta">something beautiful</em><br/>
              together
            </h2>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <Link to="/commission"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[11px] uppercase tracking-[0.22em] font-medium text-ivory hover:-translate-y-[2px] transition-all duration-300"
              style={{ background:'#C7694F', borderRadius:2 }}
              onMouseEnter={e => e.currentTarget.style.background='#a85540'}
              onMouseLeave={e => e.currentTarget.style.background='#C7694F'}>
              Start Your Commission
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
            <Link to="/shop"
              className="text-[11px] uppercase tracking-[0.2em] text-charcoal-muted dark:text-[#9A9590] hover:text-terracotta transition-colors text-center">
              Browse the Collection →
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
