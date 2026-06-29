import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import * as THREE from 'three';
import { productAPI } from '../api';
import { STORAGE_URL } from '../config';
import { useCart } from '../context/CartContext';

function getImg(p) {
  const url = p?.primary_image?.image_url || p?.thumbnail || p?.image_url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STORAGE_URL}/${url}`;
}
function fmt(price) {
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(price);
}
const HUES = ['#C7694F','#9CAF88','#C9A94E','#8a6e52','#7a6888','#C7694F'];

/* ── Three.js ink particles hero ── */
function InkCanvas() {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60,W/H,0.1,100); camera.position.z=5;
    const count=1800, geo=new THREE.BufferGeometry();
    const pos=new Float32Array(count*3), cols=new Float32Array(count*3), sizes=new Float32Array(count);
    const pal=[new THREE.Color('#C7694F'),new THREE.Color('#9CAF88'),new THREE.Color('#F7F2EA'),new THREE.Color('#C9A94E'),new THREE.Color('#6B7F6E')];
    for(let i=0;i<count;i++){
      const r=Math.pow(Math.random(),0.4)*7,theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1);
      pos[i*3]=r*Math.sin(phi)*Math.cos(theta); pos[i*3+1]=r*Math.sin(phi)*Math.sin(theta)*0.5; pos[i*3+2]=r*Math.cos(phi)*0.3;
      const c=pal[Math.floor(Math.random()*pal.length)]; cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b;
      sizes[i]=Math.random()*12+2;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
    geo.setAttribute('size',new THREE.BufferAttribute(sizes,1));
    const mat=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:{uTime:{value:0},uPR:{value:renderer.getPixelRatio()}},
      vertexShader:`attribute float size;varying vec3 vColor;varying float vAlpha;uniform float uTime;uniform float uPR;
        void main(){vColor=color;vec3 p=position;float idx=float(gl_VertexID);
        p.x+=sin(uTime*0.18+idx*0.031)*0.12;p.y+=cos(uTime*0.14+idx*0.027)*0.10;p.z+=sin(uTime*0.11+idx*0.019)*0.06;
        float d=length(p.xy);vAlpha=clamp(1.0-d*0.14,0.0,1.0)*0.75;
        vec4 mv=modelViewMatrix*vec4(p,1.0);gl_PointSize=size*uPR*(3.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`varying vec3 vColor;varying float vAlpha;
        void main(){vec2 uv=gl_PointCoord-vec2(0.5);float a=smoothstep(0.5,0.15,length(uv))*vAlpha;if(a<0.01)discard;gl_FragColor=vec4(vColor,a);}`
    });
    const pts=new THREE.Points(geo,mat); scene.add(pts);
    let animId,mx=0,my=0;
    const onResize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const onMouse=e=>{mx=(e.clientX/window.innerWidth-0.5)*0.6;my=-(e.clientY/window.innerHeight-0.5)*0.4;};
    window.addEventListener('resize',onResize); window.addEventListener('mousemove',onMouse);
    const clock=new THREE.Clock();
    const tick=()=>{animId=requestAnimationFrame(tick);const t=clock.getElapsedTime();mat.uniforms.uTime.value=t;
      pts.rotation.y+=(mx*0.5-pts.rotation.y)*0.03;pts.rotation.x+=(my*0.3-pts.rotation.x)*0.03;
      pts.rotation.z=Math.sin(t*0.07)*0.04;renderer.render(scene,camera);};
    tick();
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',onResize);window.removeEventListener('mousemove',onMouse);
      renderer.dispose();geo.dispose();mat.dispose();if(el.contains(renderer.domElement))el.removeChild(renderer.domElement);};
  },[]);
  return <div ref={mountRef} style={{position:'absolute',inset:0,pointerEvents:'none'}}/>;
}

/* ── Product Card ── */
function ProductCard({ product, index, hue }) {
  const cardRef=useRef(null);
  const [hovered,setHovered]=useState(false);
  const [cursorPos,setCursorPos]=useState({x:0,y:0});
  const [imgErr,setImgErr]=useState(false);
  const {addToCart}=useCart();
  const [added,setAdded]=useState(false);
  const sx=useSpring(0,{stiffness:200,damping:22});
  const sy=useSpring(0,{stiffness:200,damping:22});
  const onMM=useCallback(e=>{
    const r=cardRef.current?.getBoundingClientRect();if(!r)return;
    sx.set((e.clientX-r.left-r.width/2)*0.06);sy.set((e.clientY-r.top-r.height/2)*0.06);
    setCursorPos({x:e.clientX-r.left,y:e.clientY-r.top});
  },[sx,sy]);
  const onML=()=>{sx.set(0);sy.set(0);setHovered(false);};
  const doAdd=async e=>{
    e.preventDefault();e.stopPropagation();if(!product.is_in_stock)return;
    try{await addToCart(product.id,1,null);setAdded(true);setTimeout(()=>setAdded(false),2200);}catch{}
  };
  const img=getImg(product);
  return (
    <motion.div ref={cardRef}
      initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}}
      viewport={{once:true,margin:'-50px'}}
      transition={{duration:0.65,delay:Math.min(index*0.06,0.4),ease:[0.22,1,0.36,1]}}
      style={{x:sx,y:sy}}
      onMouseMove={onMM} onMouseEnter={()=>setHovered(true)} onMouseLeave={onML}
      className="relative rounded-2xl overflow-hidden flex flex-col cursor-pointer bg-ivory dark:bg-[#1e1c18] border border-charcoal/10 dark:border-white/8 hover:border-terracotta/40 dark:hover:border-terracotta/40 transition-colors duration-300 group"
    >
      <div className="absolute pointer-events-none z-0 rounded-full"
        style={{width:360,height:360,left:cursorPos.x,top:cursorPos.y,transform:'translate(-50%,-50%)',
          background:`radial-gradient(280px circle at center,${hue}20,transparent 70%)`,
          opacity:hovered?1:0,transition:'opacity 0.3s'}}/>
      <Link to={`/shop/${product.slug}`} className="relative overflow-hidden block bg-cream dark:bg-[#252219]" style={{aspectRatio:'3/4'}}>
        {img&&!imgErr
          ? <img src={img} alt={product.name} draggable={false} onError={()=>setImgErr(true)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"/>
          : <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" style={{opacity:0.65}}>
              <defs><filter id={`b${product.id}`}><feGaussianBlur stdDeviation="3"/></filter></defs>
              <path d={`M${20+product.id*3},${80+product.id*5} Q${80+product.id*4},${20+product.id*2} ${160-product.id*3},${100+product.id*3}`} fill="none" stroke={hue} strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
              <path d={`M${30+product.id*2},${120+product.id*3} Q100,${60+product.id*5} ${170-product.id*2},${80+product.id*4}`} fill="none" stroke={hue} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
              <circle cx={100+product.id*3} cy={100-product.id*2} r="38" fill={hue} opacity="0.05" filter={`url(#b${product.id})`}/>
              {[...Array(6)].map((_,i)=><circle key={i} cx={50+i*18+(product.id%3)*8} cy={140-i*6+(product.id%5)*4} r={1.4-i*0.15} fill={hue} opacity={0.5-i*0.07}/>)}
            </svg>
        }
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 50%)',opacity:hovered?1:0.3,transition:'opacity 0.4s'}}/>
        <span className="absolute top-3 left-3 z-10 text-[9px] font-medium uppercase tracking-[0.16em] px-2.5 py-1 rounded-full"
          style={{background:'rgba(250,247,242,0.92)',backdropFilter:'blur(8px)',color:'#6b6b6b'}}>
          {product.product_type?.replace(/_/g,' ')||'Original'}
        </span>
        {!product.is_in_stock&&<span className="absolute top-3 right-3 z-10 text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-error/85 text-white">Sold</span>}
      </Link>
      <div className="relative z-10 flex flex-col gap-2 p-4">
        <Link to={`/shop/${product.slug}`}>
          <h3 className="font-display text-base text-charcoal dark:text-[#F0EDE8] leading-snug hover:text-terracotta dark:hover:text-terracotta transition-colors truncate">{product.name}</h3>
        </Link>
        {product.short_description&&<p className="text-xs text-charcoal-muted dark:text-[#9A9590] leading-relaxed line-clamp-2">{product.short_description}</p>}
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-display text-lg font-semibold text-terracotta">{fmt(product.price)}</span>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.96}} onClick={doAdd}
            disabled={!product.is_in_stock||added}
            className={`text-[10px] font-semibold uppercase tracking-[0.1em] px-4 py-2 rounded-lg border transition-all duration-200 disabled:opacity-40 ${added?'bg-sage text-white border-sage':'border-charcoal/15 dark:border-white/12 text-charcoal-muted dark:text-[#9A9590] hover:border-terracotta hover:text-terracotta'}`}>
            {added?'✓ Added':product.is_in_stock?'Add to Cart':'Sold Out'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Filter Pill ── */
function FilterPill({ label, active, onClick }) {
  return (
    <motion.button onClick={onClick} whileHover={{scale:1.04}} whileTap={{scale:0.96}} transition={{duration:0.18}}
      className={`relative overflow-hidden text-[11px] font-medium uppercase tracking-[0.12em] px-4 py-2 rounded-full cursor-pointer transition-all duration-200 ${active?'text-ivory dark:text-[#1A1814]':'text-charcoal-muted dark:text-[#9A9590] bg-cream dark:bg-[#252219] border border-charcoal/10 dark:border-white/8 hover:border-terracotta/50'}`}>
      {active&&<motion.span layoutId="shop-pill" transition={{type:'spring',stiffness:380,damping:30}} className="absolute inset-0 bg-terracotta rounded-full" style={{zIndex:0}}/>}
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}

/* ── Main ── */
export default function ShopPage() {
  const [searchParams]=useSearchParams();
  const [products,setProducts]=useState([]);
  const [categories,setCategories]=useState([]);
  const [loading,setLoading]=useState(true);
  const [activeCategory,setActiveCategory]=useState(searchParams.get('category')||'');
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('newest');
  const [type,setType]=useState(searchParams.get('type')||'');
  const [meta,setMeta]=useState({total:0,last_page:1,current_page:1});
  const {scrollY}=useScroll();
  const heroOpacity=useTransform(scrollY,[0,420],[1,0]);
  const heroY=useTransform(scrollY,[0,420],[0,-80]);

  useEffect(()=>{
    let done=false; setLoading(true);
    const p={sort,per_page:18};
    if(activeCategory)p.category=activeCategory;
    if(type)p.type=type;
    if(search.trim())p.search=search.trim();
    productAPI.all(p).then(({data})=>{if(!done){setProducts(data.data||[]);setMeta(data.meta||{total:data.data?.length||0,last_page:1,current_page:1});}}).catch(()=>{}).finally(()=>{if(!done)setLoading(false);});
    return()=>{done=true;};
  },[activeCategory,type,sort,search]);

  useEffect(()=>{productAPI.categories().then(({data})=>setCategories(Array.isArray(data)?data:[])).catch(()=>{});},[]);

  const catPills=[{slug:'',name:'All'},...categories];
  const typePills=[{value:'original',label:'Original'},{value:'print',label:'Prints'},{value:'limited_edition',label:'Limited Editions'}];

  return (
    <div className="min-h-screen bg-ivory dark:bg-[#1A1814]">

      {/* ── Dark hero ── */}
      <section style={{position:'relative',height:'100vh',minHeight:640,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',overflow:'hidden',background:'#0D0D0D'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 50% 50%,#1a1510 0%,#0D0D0D 70%)'}}/>
        <InkCanvas/>
        <motion.div style={{position:'relative',zIndex:2,opacity:heroOpacity,y:heroY,display:'flex',flexDirection:'column',alignItems:'center',gap:22,padding:'0 24px'}}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.2}}
            style={{fontSize:11,fontWeight:500,letterSpacing:'0.35em',textTransform:'uppercase',color:'#C7694F',display:'flex',alignItems:'center',gap:12}}>
            <span style={{width:40,height:1,background:'#C7694F',opacity:0.5,display:'block'}}/>Handcrafted Art Boutique<span style={{width:40,height:1,background:'#C7694F',opacity:0.5,display:'block'}}/>
          </motion.div>
          <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:1,delay:0.4,ease:[0.22,1,0.36,1]}}
            className="font-display" style={{fontSize:'clamp(3rem,8vw,7rem)',fontWeight:600,lineHeight:1.02,letterSpacing:'-0.02em',color:'#F7F2EA'}}>
            The<br/><em style={{fontStyle:'italic',color:'#C7694F'}}>Collection</em>
          </motion.h1>
          <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.65}}
            style={{fontSize:16,fontWeight:300,color:'rgba(247,242,234,0.5)',maxWidth:440,lineHeight:1.7}}>
            Original paintings and handcrafted artworks — each one a one-of-a-kind piece made with intention.
          </motion.p>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.85}}
            style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center'}}>
            <motion.button whileHover={{scale:1.04,opacity:0.9}} whileTap={{scale:0.97}}
              onClick={()=>document.getElementById('shop-body')?.scrollIntoView({behavior:'smooth'})}
              style={{background:'#C7694F',color:'#0D0D0D',border:'none',padding:'14px 36px',fontSize:13,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',borderRadius:2}}>
              Shop the Collection
            </motion.button>
            <motion.a href="/commission" whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{background:'transparent',color:'#F7F2EA',border:'1px solid rgba(247,242,234,0.2)',padding:'13px 36px',fontSize:13,letterSpacing:'0.08em',textTransform:'uppercase',borderRadius:2,textDecoration:'none',display:'inline-block'}}>
              Commission a Piece
            </motion.a>
          </motion.div>
        </motion.div>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.4,duration:1}}
          style={{position:'absolute',bottom:40,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:10,zIndex:2}}>
          <motion.div animate={{scaleY:[1,0.4,1],opacity:[1,0.4,1]}} transition={{duration:2,repeat:Infinity,ease:'easeInOut'}}
            style={{width:1,height:50,background:'linear-gradient(to bottom,#C7694F,transparent)'}}/>
          <span style={{fontSize:10,letterSpacing:'0.25em',textTransform:'uppercase',color:'rgba(247,242,234,0.35)'}}>Scroll</span>
        </motion.div>
      </section>

      {/* ── Shop body — light/dark ── */}
      <section id="shop-body" className="bg-ivory dark:bg-[#1A1814]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">

          {/* Controls */}
          <div className="mb-10">
            <div className="flex flex-wrap items-end justify-between gap-5 mb-7">
              <motion.div initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.7}}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-2">The Collection</p>
                <h2 className="font-display text-charcoal dark:text-[#F0EDE8]" style={{fontSize:'clamp(1.8rem,4vw,3rem)',fontWeight:400,letterSpacing:'-0.01em'}}>
                  Browse &amp; <em className="not-italic text-terracotta">Discover</em>
                </h2>
              </motion.div>
              <motion.div initial={{opacity:0,x:24}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.7}} className="flex gap-3 flex-wrap">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted dark:text-[#9A9590] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                    className="pl-9 pr-4 py-2.5 text-sm w-52 rounded-xl bg-cream dark:bg-[#252219] border border-charcoal/10 dark:border-white/8 text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/50 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-terracotta/25"/>
                </div>
                <select value={sort} onChange={e=>setSort(e.target.value)}
                  className="py-2.5 px-4 text-sm rounded-xl bg-cream dark:bg-[#252219] border border-charcoal/10 dark:border-white/8 text-charcoal dark:text-[#F0EDE8] focus:outline-none cursor-pointer">
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="name">A–Z</option>
                </select>
              </motion.div>
            </div>
            <div className="h-px bg-charcoal/8 dark:bg-white/8 mb-5"/>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <motion.div initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.6}} className="flex gap-2 flex-wrap">
                {catPills.map(c=><FilterPill key={c.slug} label={c.name} active={activeCategory===c.slug} onClick={()=>setActiveCategory(c.slug===activeCategory?'':c.slug)}/>)}
                {catPills.length>1&&<span className="w-px h-4 bg-charcoal/12 dark:bg-white/10 self-center mx-1"/>}
                {typePills.map(t=><FilterPill key={t.value} label={t.label} active={type===t.value} onClick={()=>setType(type===t.value?'':t.value)}/>)}
              </motion.div>
              <span className="text-[11px] text-charcoal-muted dark:text-[#9A9590]">{meta.total||products.length} pieces</span>
            </div>
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory+type+sort+search} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {loading
                ? [...Array(6)].map((_,i)=>(
                    <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                      <div className="bg-cream dark:bg-[#252219]" style={{aspectRatio:'3/4'}}/>
                      <div className="p-4 space-y-2 bg-ivory dark:bg-[#1e1c18]">
                        <div className="h-4 rounded bg-cream dark:bg-[#252219] w-3/4"/>
                        <div className="h-3 rounded bg-cream dark:bg-[#252219] w-1/2"/>
                      </div>
                    </div>
                  ))
                : products.length===0
                  ? <div className="col-span-full flex flex-col items-center gap-4 py-20 text-charcoal-muted dark:text-[#9A9590]">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <p className="font-display text-xl italic opacity-50">No pieces found</p>
                    </div>
                  : products.map((p,i)=><ProductCard key={p.id} product={p} index={i} hue={HUES[i%HUES.length]}/>)
              }
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {meta.last_page>1&&(
            <div className="mt-12 flex justify-center gap-2">
              {[...Array(meta.last_page)].map((_,i)=>(
                <button key={i} className={`w-9 h-9 rounded-lg text-sm transition-colors ${meta.current_page===i+1?'bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814]':'text-charcoal-muted dark:text-[#9A9590] hover:bg-cream dark:hover:bg-[#252219]'}`}>{i+1}</button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom */}
        <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.7}}
          className="border-t border-charcoal/8 dark:border-white/6 px-4 sm:px-6 lg:px-10 py-10 max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-6">
          <p className="font-display italic text-lg text-charcoal-muted dark:text-[#9A9590]">
            Every piece is made <strong className="not-italic font-semibold text-terracotta">by hand</strong>, with intention.
          </p>
          <Link to="/commission" className="text-[11px] uppercase tracking-[0.15em] text-terracotta hover:opacity-75 transition-opacity">Get a custom commission →</Link>
        </motion.div>
      </section>
    </div>
  );
}
