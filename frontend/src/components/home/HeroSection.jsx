import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────────────────────
   Three.js art scene — mouse-tracking depth parallax
   Receives its own dedicated DOM ref so it never conflicts with other layers.
───────────────────────────────────────────────────────────────────────────── */
function ArtScene({ containerRef }) {
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Size the canvas to fill the container
    const canvas = renderer.domElement;
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    mount.appendChild(canvas);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.z = 18;

    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const C = {
      terra : new THREE.Color('#c7694f'),
      gold  : new THREE.Color('#c9a94e'),
      sage  : new THREE.Color('#9caf88'),
      coal  : new THREE.Color('#3a3a3a'),
      blush : new THREE.Color('#e8c4c4'),
      walnut: new THREE.Color('#5c3a1e'),
    };

    const layerSpeeds = [0.06, 0.14, 0.25, 0.40, 0.60];
    const layerZ      = [-16, -10, -5, -2, 0];
    const layers = layerSpeeds.map((_, i) => {
      const g = new THREE.Group();
      g.position.z = layerZ[i];
      scene.add(g);
      return g;
    });

    const mixers = [];
    const play = (obj, clip) => {
      const mx = new THREE.AnimationMixer(obj);
      mx.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
      mixers.push(mx);
    };
    const bob = (name, ampY, dur, sy = 0) =>
      new THREE.AnimationClip(name, dur, [
        new THREE.VectorKeyframeTrack('.position',
          [0, dur * 0.5, dur], [0, sy, 0, 0, sy + ampY, 0, 0, sy, 0])
      ]);
    const mm = (col, op = 1) =>
      new THREE.MeshBasicMaterial({ color: col, transparent: op < 1, opacity: op });

    // L0 — faint background planes
    [[9,12,-14,3,C.terra,0.06],[14,9,12,-4,C.gold,0.05],[7,10,0,7,C.sage,0.07]]
      .forEach(([w,h,x,y,col,op],i) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mm(col,op));
        m.position.set(x,y,0); layers[0].add(m); play(m, bob(`l0${i}`,0.8,9+i*2,y));
      });

    // L1 — frame outlines
    [[5,7,-10,2,C.terra,0.18,0.12],[8,5,9,-3,C.gold,0.14,-0.08],
     [4,6,2,6,C.sage,0.16,0.05],[6,4,-7,-6,C.coal,0.12,-0.15]]
      .forEach(([w,h,x,y,col,op,rz],i) => {
        const e = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(w,h)),
          new THREE.LineBasicMaterial({ color:col, transparent:true, opacity:op })
        );
        e.position.set(x,y,0); e.rotation.z = rz;
        layers[1].add(e); play(e, bob(`l1${i}`,1,7+i*1.5,y));
      });

    // L2 — brushstrokes + circles
    [[12,0.22,-4,2.5,C.terra,0.14,0.10],[9,0.16,5,-2,C.gold,0.12,-0.06],[7,0.13,-6,-5,C.sage,0.10,0.04]]
      .forEach(([w,h,x,y,col,op,rz],i) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mm(col,op));
        m.position.set(x,y,0); m.rotation.z = rz;
        layers[2].add(m); play(m, bob(`l2s${i}`,0.5,6+i,y));
      });
    [[0.8,-8,4,C.blush,0.35],[1.0,7,3,C.gold,0.28],[0.6,3,-4,C.terra,0.32],[1.2,-5,-2,C.sage,0.22]]
      .forEach(([r,x,y,col,op],i) => {
        const m = new THREE.Mesh(new THREE.CircleGeometry(r,28), mm(col,op));
        m.position.set(x,y,0); layers[2].add(m); play(m, bob(`l2c${i}`,0.7,5+i*0.8,y));
      });

    // L3 — brush + tubes
    const brush = new THREE.Group(); brush.position.set(3,-1,0);
    brush.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.045,2.8,10), mm(C.walnut,0.75)));
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(0.072,0.072,0.22,10), mm(new THREE.Color('#b8b8b8'),0.7));
    fer.position.y = -1.55; brush.add(fer);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.065,0.5,10), mm(C.terra,0.78));
    tip.position.y = -2.02; brush.add(tip);
    layers[3].add(brush);
    const qv = (ex,ey,ez) => { const q=new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(ex,ey,ez)); return[q.x,q.y,q.z,q.w]; };
    play(brush, new THREE.AnimationClip('bs',7,[
      new THREE.QuaternionKeyframeTrack('.quaternion',[0,1.5,3,4.5,7],[
        ...qv(0,0,-0.5),...qv(0.2,0.1,0.2),...qv(-0.1,-0.1,0.5),...qv(0.1,0,-0.1),...qv(0,0,-0.5)]),
      new THREE.VectorKeyframeTrack('.position',[0,1,2,3,4,5,7],[3,-1,0,4,0,0,2,1,0,0,0,0,1,-2,0,3,-1,0,3,-1,0]),
    ]));
    [[C.terra,-7,3,4.5],[C.gold,8,-4,5.8],[C.sage,-3,-3,3.8]].forEach(([col,x,y,dur],i) => {
      const g = new THREE.Group(); g.position.set(x,y,0);
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,1.3,12), mm(col,0.55)));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.2,0.22,12), mm(col,0.45));
      cap.position.y = 0.76; g.add(cap); layers[3].add(g);
      const n=5, times=Array.from({length:n},(_,k)=>k/(n-1)*dur);
      const vals=times.map((_,k)=>qv(0,0,k/(n-1)*Math.PI*2)).flat();
      play(g, new THREE.AnimationClip(`t${i}`,dur,[new THREE.QuaternionKeyframeTrack('.quaternion',times,vals)]));
    });

    // L4 — ink splatter particles
    const sc=document.createElement('canvas'); sc.width=sc.height=64;
    const sx=sc.getContext('2d'), sg=sx.createRadialGradient(32,32,0,32,32,32);
    sg.addColorStop(0,'rgba(255,255,255,1)'); sg.addColorStop(0.45,'rgba(255,255,255,0.5)'); sg.addColorStop(1,'rgba(255,255,255,0)');
    sx.fillStyle=sg; sx.fillRect(0,0,64,64);
    const spriteTex=new THREE.CanvasTexture(sc);
    const PAL=[C.terra,C.gold,C.sage,C.coal,C.blush];
    const N=280, pPos=new Float32Array(N*3), pCol=new Float32Array(N*3), drifts=new Float32Array(N);
    for(let i=0;i<N;i++){
      pPos[i*3]=(Math.random()-0.5)*42; pPos[i*3+1]=(Math.random()-0.5)*28; pPos[i*3+2]=(Math.random()-0.5)*4;
      const c=PAL[Math.floor(Math.random()*PAL.length)];
      pCol[i*3]=c.r; pCol[i*3+1]=c.g; pCol[i*3+2]=c.b;
      drifts[i]=(Math.random()-0.5)*0.006;
    }
    const pGeo=new THREE.BufferGeometry();
    pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
    pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
    const pMat=new THREE.PointsMaterial({size:0.38,map:spriteTex,vertexColors:true,transparent:true,opacity:0.75,blending:THREE.NormalBlending,depthWrite:false,sizeAttenuation:true});
    layers[4].add(new THREE.Points(pGeo,pMat));

    // Mouse parallax
    let tX=0,tY=0,cX=0,cY=0;
    const onMove  = e => { tX=(e.clientX/window.innerWidth-0.5)*2; tY=(e.clientY/window.innerHeight-0.5)*2; };
    const onTouch = e => { if(!e.touches[0])return; tX=(e.touches[0].clientX/window.innerWidth-0.5)*2; tY=(e.touches[0].clientY/window.innerHeight-0.5)*2; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch, { passive:true });

    let raf; const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt=clock.getDelta(), el=clock.getElapsedTime();
      cX+=(tX-cX)*0.055; cY+=(tY-cY)*0.055;
      layers.forEach((layer,i) => {
        const s=layerSpeeds[i];
        layer.position.x+=(cX*2.8*s-layer.position.x)*0.08;
        layer.position.y+=(-cY*2.8*s*0.65-layer.position.y)*0.08;
      });
      for(let i=0;i<N;i++){
        pPos[i*3+1]+=drifts[i];
        if(pPos[i*3+1]>14)  pPos[i*3+1]=-14;
        if(pPos[i*3+1]<-14) pPos[i*3+1]=14;
      }
      pGeo.attributes.position.needsUpdate=true;
      pMat.opacity=0.62+0.13*Math.sin(el*0.45);
      camera.position.z=18+Math.sin(el*0.25)*0.5;
      mixers.forEach(m=>m.update(dt));
      renderer.render(scene,camera);
    };
    tick();

    const ro = new ResizeObserver(resize); ro.observe(mount);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      ro.disconnect();
      spriteTex.dispose(); pGeo.dispose(); pMat.dispose(); renderer.dispose();
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scroll parallax — the ONLY reliable cross-browser technique that actually
   produces the Delassus effect without overflow-hidden clipping issues:

   The background layer is position:fixed, so it sits behind everything in
   the viewport. We then use clip-path (or a CSS mask) based on the hero's
   bounding rect so it only shows through the hero section.

   Actually the simplest correct approach: position the bg element with
   position:absolute inside the hero (which has overflow:hidden), give the
   bg a height of 130% and let translateY go from 0 → -30% as the hero
   scrolls from 0 → hero-height. This means the bg moves 30% while the
   section moves 100% → genuine parallax. The key is we must NOT use
   overflow:hidden on the section itself, but instead clip with a wrapper.

   Implementation below uses IntersectionObserver + rAF scroll listener,
   calculates how far through the hero we've scrolled (0→1), and maps that
   to a translateY range, producing the exact Delassus parallax feel.
───────────────────────────────────────────────────────────────────────────── */
function ParallaxBackground({ sectionRef }) {
  const bgRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const bg      = bgRef.current;
    if (!section || !bg) return;

    // Respect reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rafId = null;

    const update = () => {
      rafId = null;
      const rect   = section.getBoundingClientRect();
      const vh     = window.innerHeight;
      // progress: 0 when section top hits viewport top, 1 when section bottom leaves viewport
      const total  = rect.height + vh;
      const gone   = vh - rect.top;          // how many px of the section have "passed"
      const t      = Math.max(0, Math.min(1, gone / total));
      // Map t (0→1) to translateY (0 → -25%)  — bg moves upward SLOWER than page
      const shift  = t * -25;
      bg.style.transform = `translateY(${shift}%)`;
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update(); // initial position
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [sectionRef]);

  return (
    /* Wrapper that clips the parallax bg to the hero bounds */
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* The actual bg — taller than 100% so there's room to shift */}
      <div
        ref={bgRef}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: 0, height: '130%' }}
      >
        {/* Light-mode warm canvas background */}
        <div
          className="w-full h-full dark:hidden"
          style={{
            background: [
              'radial-gradient(ellipse 72% 56% at 14% 28%,  rgba(199,105,79,0.13) 0%, transparent 65%)',
              'radial-gradient(ellipse 62% 52% at 86% 68%,  rgba(201,169,78,0.11) 0%, transparent 62%)',
              'radial-gradient(ellipse 80% 60% at 50% 50%,  rgba(156,175,136,0.07) 0%, transparent 70%)',
              'radial-gradient(ellipse 44% 38% at 76% 14%,  rgba(232,196,196,0.15) 0%, transparent 55%)',
              'radial-gradient(ellipse 52% 42% at 18% 82%,  rgba(199,105,79,0.09) 0%, transparent 60%)',
              '#FAF7F2',
            ].join(','),
          }}
        />
        {/* Dark-mode */}
        <div className="hidden dark:block w-full h-full" style={{ background: '#1A1814' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero Section
───────────────────────────────────────────────────────────────────────────── */
const fadeUp = (delay = 0, dur = 1) => ({
  initial:    { opacity: 0, y: 32 },
  animate:    { opacity: 1, y: 0  },
  transition: { delay, duration: dur, ease: [0.16, 1, 0.3, 1] },
});

export default function HeroSection() {
  const sectionRef = useRef(null);  // shared ref for the <section>
  const sceneRef   = useRef(null);  // dedicated ref for Three.js canvas mount

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#FAF7F2] dark:bg-[#1A1814]"
      style={{ minHeight: '100svh' }}
    >
      {/* ── 1. Parallax warm background ─────────────────────────────────────
           ParallaxBackground clips its child to the hero with overflow:hidden,
           so translateY never bleeds outside the section.
      ──────────────────────────────────────────────────────────────────────── */}
      <ParallaxBackground sectionRef={sectionRef} />

      {/* ── 2. Three.js mouse-parallax art scene ──────────────────────────── */}
      <div
        ref={sceneRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      >
        <ArtScene containerRef={sceneRef} />
      </div>

      {/* ── 3. Radial vignette — fades scene edges into bg ──────────────────
           Darker toward edges so the text centre reads clearly.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          zIndex: 2,
          background: 'radial-gradient(ellipse 78% 62% at 50% 44%, transparent 22%, rgba(250,247,242,0.40) 52%, rgba(250,247,242,0.85) 78%, #FAF7F2 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          zIndex: 2,
          background: 'radial-gradient(ellipse 78% 62% at 50% 44%, transparent 22%, rgba(26,24,20,0.45) 52%, rgba(26,24,20,0.90) 78%, #1A1814 100%)',
        }}
      />

      {/* ── 4. Bottom gradient — blends into the next section ─────────────── */}
      <div aria-hidden="true" className="absolute bottom-0 inset-x-0 pointer-events-none dark:hidden"
           style={{ zIndex: 3, height: 160, background: 'linear-gradient(to bottom, transparent, #FAF7F2)' }} />
      <div aria-hidden="true" className="absolute bottom-0 inset-x-0 pointer-events-none hidden dark:block"
           style={{ zIndex: 3, height: 160, background: 'linear-gradient(to bottom, transparent, #1A1814)' }} />

      {/* ── 5. Hero content ──────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center text-center min-h-[100svh] px-5 sm:px-8"
        style={{
          zIndex: 4,
          paddingTop:    'clamp(100px, 16vw, 140px)',
          paddingBottom: 'clamp(90px,  14vw, 120px)',
        }}
      >
        {/* Eyebrow */}
        <motion.p {...fadeUp(0.2, 0.9)}
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-5 sm:mb-7">
          Where Emotions Find Their Canvas
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial="hidden" animate="visible"
          variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.09, delayChildren:0.32 }}}}
          className="font-display text-charcoal dark:text-[#F0EDE8] leading-[1.04] tracking-tight select-none"
          style={{ fontSize: 'clamp(3rem, 9.5vw, 96px)' }}
        >
          <span className="block">
            {['Art','That'].map(w => (
              <motion.span key={w}
                variants={{ hidden:{ opacity:0, y:48 }, visible:{ opacity:1, y:0, transition:{ duration:1.05, ease:[0.16,1,0.3,1] }}}}
                className="inline-block mr-[0.2em] last:mr-0">{w}
              </motion.span>
            ))}
          </span>
          <span className="block mt-0.5 sm:mt-1">
            {[{ t:'Speaks', i:true, a:true },{ t:'to' },{ t:'You' }].map(({t,i,a}) => (
              <motion.span key={t}
                variants={{ hidden:{ opacity:0, y:48 }, visible:{ opacity:1, y:0, transition:{ duration:1.05, ease:[0.16,1,0.3,1] }}}}
                className={`inline-block mr-[0.2em] last:mr-0${i?' italic':''}${a?' text-terracotta dark:text-[#D4826B]':''}`}>{t}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX:0 }} animate={{ scaleX:1 }}
          transition={{ delay:1.05, duration:1.2, ease:[0.16,1,0.3,1] }}
          className="mt-7 sm:mt-8 h-px w-16 sm:w-20 origin-center"
          style={{ background: 'linear-gradient(90deg, transparent, #c7694f, transparent)' }}
        />

        {/* Body copy */}
        <motion.p {...fadeUp(1.15, 0.95)}
          className="mt-5 sm:mt-7 text-sm sm:text-base lg:text-[1.05rem] text-charcoal-muted dark:text-[#9A9590] max-w-[17rem] sm:max-w-[26rem] leading-relaxed">
          Handcrafted portraits and original artwork that capture your most
          cherished moments. Every brushstroke tells a story — let yours be next.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:1.32, duration:0.9, ease:[0.16,1,0.3,1] }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-[17rem] sm:max-w-none"
        >
          <Link to="/commission"
            className="w-full sm:w-auto inline-flex items-center justify-center
                       px-7 sm:px-9 py-[0.85rem] rounded-full
                       bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814]
                       text-[11px] sm:text-xs uppercase tracking-[0.22em] font-medium
                       transition-all duration-300
                       hover:bg-terracotta hover:text-ivory hover:-translate-y-[2px] hover:shadow-lg hover:shadow-terracotta/20
                       dark:hover:bg-terracotta dark:hover:text-ivory">
            Commission Your Artwork
          </Link>
          <Link to="/shop"
            className="w-full sm:w-auto inline-flex items-center gap-2 justify-center
                       px-7 sm:px-9 py-[0.85rem] rounded-full
                       border border-charcoal/25 dark:border-[#F0EDE8]/22
                       text-charcoal dark:text-[#F0EDE8]
                       text-[11px] sm:text-xs uppercase tracking-[0.22em] font-medium
                       transition-all duration-300
                       hover:border-terracotta hover:text-terracotta">
            Explore Collection
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:1.58, duration:0.85 }}
          className="mt-12 sm:mt-16 flex items-center gap-10 sm:gap-14 lg:gap-16"
        >
          {[
            { value:'200+', label:'Artworks'   },
            { value:'98%',  label:'Collectors' },
            { value:'5 ★',  label:'Rating'     },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-display text-charcoal dark:text-[#F0EDE8] leading-none">
                {value}
              </p>
              <p className="mt-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590]">
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── 6. Scroll indicator ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:2.2, duration:1 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex:5 }}
      >
        <motion.div
          animate={{ y:[0,7,0] }} transition={{ duration:2.4, repeat:Infinity, ease:'easeInOut' }}
          className="w-5 h-9 rounded-full border border-charcoal/20 dark:border-[#F0EDE8]/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-terracotta/50" />
        </motion.div>
        <span className="text-[9px] uppercase tracking-[0.3em] text-charcoal-muted/60 dark:text-[#9A9590]/60">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
