import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import Cropper from 'react-easy-crop';
import { useAuth } from '../../context/AuthContext';

/* ── Crop helpers ── */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', err => reject(err));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92));
}

/* ─── theme ─────────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1];

const NAV = [
  { label: 'Profile',       path: '/account',               icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Orders',        path: '/account/orders',        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Custom Orders', path: '/account/custom-orders', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Wishlist',      path: '/account/wishlist',      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
];

/* ─── Three.js ambient background ──────────────────────── */
function AmbientScene({ mountRef }) {
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const canvas = renderer.domElement;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    mount.appendChild(canvas);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 6;

    const resize = () => {
      const w = mount.clientWidth || 400, h = mount.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    /* Brushstroke planes */
    const mm = (col, op) => new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:op });
    const strokes = [
      { w:8, h:0.18, x:-3, y:1.5, rz:0.08, col:0xc7694f, op:0.12 },
      { w:6, h:0.13, x:2,  y:-1,  rz:-0.06,col:0xc9a94e, op:0.09 },
      { w:7, h:0.10, x:-1, y:-2.5,rz:0.04, col:0x9caf88, op:0.08 },
    ].map(s => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), mm(s.col, s.op));
      m.position.set(s.x, s.y, -1); m.rotation.z = s.rz;
      scene.add(m);
      return { m, baseX:s.x, baseY:s.y };
    });

    /* Ink splatter particles */
    const sc = document.createElement('canvas'); sc.width = sc.height = 32;
    const sx = sc.getContext('2d'), sg = sx.createRadialGradient(16,16,0,16,16,16);
    sg.addColorStop(0,'rgba(255,255,255,1)'); sg.addColorStop(0.5,'rgba(255,255,255,0.3)'); sg.addColorStop(1,'rgba(255,255,255,0)');
    sx.fillStyle = sg; sx.fillRect(0,0,32,32);
    const spTex = new THREE.CanvasTexture(sc);
    const N=80, pPos=new Float32Array(N*3), pCol=new Float32Array(N*3), drifts=new Float32Array(N);
    const PCOLS=[new THREE.Color(0xc7694f),new THREE.Color(0xc9a94e),new THREE.Color(0x9caf88)];
    for(let i=0;i<N;i++){
      pPos[i*3]=(Math.random()-0.5)*14; pPos[i*3+1]=(Math.random()-0.5)*10; pPos[i*3+2]=(Math.random()-0.5)*3;
      const c=PCOLS[i%PCOLS.length]; pCol[i*3]=c.r; pCol[i*3+1]=c.g; pCol[i*3+2]=c.b;
      drifts[i]=(Math.random()-0.5)*0.004;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
    pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
    const pMat = new THREE.PointsMaterial({size:0.18,map:spTex,vertexColors:true,transparent:true,opacity:0.5,blending:THREE.NormalBlending,depthWrite:false,sizeAttenuation:true});
    scene.add(new THREE.Points(pGeo,pMat));

    let tX=0,tY=0,cX=0,cY=0;
    const onMove = e => { tX=(e.clientX/window.innerWidth-0.5)*2; tY=-(e.clientY/window.innerHeight-0.5)*2; };
    window.addEventListener('mousemove',onMove);

    let raf; const clock = new THREE.Clock();
    const tick = () => {
      raf=requestAnimationFrame(tick);
      const el=clock.getElapsedTime();
      cX+=(tX-cX)*0.035; cY+=(tY-cY)*0.035;
      for(let i=0;i<N;i++){
        pPos[i*3+1]+=drifts[i];
        if(pPos[i*3+1]>5) pPos[i*3+1]=-5;
        if(pPos[i*3+1]<-5) pPos[i*3+1]=5;
      }
      pGeo.attributes.position.needsUpdate=true;
      pMat.opacity=0.42+0.08*Math.sin(el*0.4);
      strokes.forEach((s,i)=>{ s.m.position.x=s.baseX+cX*(0.03+i*0.01); s.m.position.y=s.baseY+cY*(0.02+i*0.008); });
      camera.position.x+=(cX*0.15-camera.position.x)*0.04;
      camera.position.y+=(cY*0.1-camera.position.y)*0.04;
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    };
    tick();
    const ro = new ResizeObserver(resize); ro.observe(mount);
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('mousemove',onMove);
      ro.disconnect(); spTex.dispose(); pGeo.dispose(); pMat.dispose(); renderer.dispose();
      if(mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, []); // eslint-disable-line
  return null;
}

/* ─── Avatar uploader with crop ──────────────────────── */
function AvatarUploader({ user, onUploaded }) {
  const { uploadAvatar } = useAuth();
  const fileRef = useRef(null);

  /* displayed avatar */
  const [preview,   setPreview]   = useState(null);   // final preview after crop
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [imgError,  setImgError]  = useState(false);

  /* crop modal state */
  const [cropSrc,   setCropSrc]   = useState(null);   // raw file object-url fed into Cropper
  const [crop,      setCrop]      = useState({ x: 0, y: 0 });
  const [zoom,      setZoom]      = useState(1);
  const [rotation,  setRotation]  = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const src = preview || user?.avatar_url || null;

  useEffect(() => { setImgError(false); }, [src]);

  /* open file picker */
  const pickFile = () => fileRef.current?.click();

  /* file selected → open crop modal */
  const onFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Max file size is 10 MB.'); return; }
    setError('');
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  /* cancel crop */
  const cancelCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  /* apply crop → upload */
  const applyCrop = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true); setError('');
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const objectUrl = URL.createObjectURL(blob);
      setCropSrc(null);
      setPreview(objectUrl);
      const data = await uploadAvatar(file);
      onUploaded?.(data.avatar_url);
    } catch {
      setError('Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        {/* Circle avatar */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={pickFile}
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden group cursor-pointer flex-shrink-0 ring-2 ring-terracotta/20 hover:ring-terracotta/50 transition-all duration-300"
          aria-label="Change profile picture"
        >
          {src && !imgError ? (
            <img src={src} alt={user?.name} className="w-full h-full object-cover"
              onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-3xl text-ivory"
              style={{ background: `hsl(${(user?.id || 0) * 47 + 10},42%,52%)` }}>
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span className="text-[10px] text-white uppercase tracking-wider">Change</span>
              </>
            )}
          </div>
        </motion.button>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
        <p className="text-[10px] text-charcoal-muted dark:text-[#9A9590] text-center">
          JPG, PNG or WebP · Crop & adjust after selection
        </p>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[11px] text-error">{error}</motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Crop modal ── */}
      <AnimatePresence>
        {cropSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: '#1e1c18', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Modal header */}
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <h3 className="font-display text-base text-[#F0EDE8]">Adjust Photo</h3>
                  <p className="text-[10px] text-[#9A9590] mt-0.5 uppercase tracking-[0.18em]">Drag to reposition · Pinch or scroll to zoom</p>
                </div>
                <button onClick={cancelCrop} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-[#9A9590] hover:text-[#F0EDE8]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Crop area */}
              <div className="relative" style={{ height: 320, background: '#0d0b08' }}>
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: { background: '#0d0b08' },
                    cropAreaStyle: { border: '2px solid #C7694F', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' },
                  }}
                />
              </div>

              {/* Controls */}
              <div className="px-5 py-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Zoom */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#9A9590] w-14 flex-shrink-0">Zoom</span>
                  <input type="range" min={1} max={3} step={0.01} value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    className="flex-1 accent-terracotta h-1 rounded-full cursor-pointer" />
                  <span className="text-[11px] text-[#9A9590] w-8 text-right">{zoom.toFixed(1)}×</span>
                </div>
                {/* Rotation */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#9A9590] w-14 flex-shrink-0">Rotate</span>
                  <input type="range" min={-180} max={180} step={1} value={rotation}
                    onChange={e => setRotation(Number(e.target.value))}
                    className="flex-1 accent-terracotta h-1 rounded-full cursor-pointer" />
                  <span className="text-[11px] text-[#9A9590] w-8 text-right">{rotation}°</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={cancelCrop}
                    className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-[0.18em] text-[#9A9590] border hover:border-[#9A9590] transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    Cancel
                  </button>
                  <button onClick={applyCrop} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-[0.18em] text-ivory font-medium transition-colors disabled:opacity-50"
                    style={{ background: '#C7694F' }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#a85540'; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#C7694F'; }}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white" />
                        Uploading…
                      </span>
                    ) : 'Apply & Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Field component ─────────────────────────────────── */
function Field({ label, id, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590] font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-charcoal/10 dark:border-white/8 bg-ivory dark:bg-[#252219] text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/40 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-terracotta/25 transition-all duration-200";

/* ─── Main Page ───────────────────────────────────────── */
export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const bgRef     = useRef(null);

  const [form,    setForm]    = useState({ name:'', phone:'', bio:'' });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState('');

  /* Sync form when user loads */
  useEffect(() => {
    if (user) setForm({ name: user.name||'', phone: user.phone||'', bio: user.bio||'' });
  }, [user]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setSaved(false); setSaveErr('');
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveErr(err?.response?.data?.message || 'Save failed. Please try again.');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ivory dark:bg-[#1A1814]" style={{ paddingTop:80 }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-cream dark:bg-[#252219] mx-auto flex items-center justify-center">
          <svg className="w-7 h-7 text-charcoal-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>
        <p className="text-charcoal-muted dark:text-[#9A9590] text-sm">Please sign in to view your profile.</p>
        <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] text-xs uppercase tracking-[0.2em] hover:bg-terracotta transition-colors">
          Sign In
        </Link>
      </motion.div>
    </div>
  );

  const isActive = p => location.pathname === p;

  return (
    <div className="min-h-screen bg-ivory dark:bg-[#1A1814]" style={{ paddingTop: 68 }}>

      {/* ── Hero banner with Three.js ambient scene ── */}
      <div ref={bgRef} className="relative h-36 sm:h-44 overflow-hidden bg-cream/60 dark:bg-[#0d0b08] border-b border-charcoal/8 dark:border-white/6">
        <AmbientScene mountRef={bgRef} />
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(250,247,242,0.7) 80%, #FAF7F2 100%)' }}
          aria-hidden="true" />
        <div className="absolute inset-0 hidden dark:block pointer-events-none"
          style={{ background:'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(13,11,8,0.7) 80%, #0d0b08 100%)' }}
          aria-hidden="true" />
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 pb-24">

        {/* ── Avatar + name header — overlaps the banner ── */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-14 mb-10 sm:mb-12">
          <AvatarUploader user={user} onUploaded={() => {}} />
          <div className="text-center sm:text-left pb-0 sm:pb-2">
            <motion.h1 initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.1, duration:0.7, ease }}
              className="font-display text-2xl sm:text-3xl text-charcoal dark:text-[#F0EDE8]">
              {user.name}
            </motion.h1>
            <motion.p initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.18, duration:0.7, ease }}
              className="text-sm text-charcoal-muted dark:text-[#9A9590] mt-0.5">
              {user.email}
            </motion.p>
            {user.bio && (
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay:0.26, duration:0.7 }}
                className="text-xs text-charcoal-muted dark:text-[#9A9590] mt-1.5 italic max-w-xs sm:max-w-sm">
                {user.bio}
              </motion.p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6 lg:gap-10 items-start">

          {/* ── Sidebar nav ── */}
          <motion.aside initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
            transition={{ delay:0.15, duration:0.7, ease }}
            className="lg:sticky lg:top-[80px] rounded-2xl border border-charcoal/8 dark:border-white/6 bg-ivory dark:bg-[#1e1c18] overflow-hidden">
            <nav className="p-2">
              {NAV.map((item, i) => (
                <motion.div key={item.path}
                  initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: 0.18 + i * 0.06, duration: 0.5, ease }}>
                  <Link to={item.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      isActive(item.path)
                        ? 'bg-terracotta/10 text-terracotta dark:text-terracotta'
                        : 'text-charcoal-muted dark:text-[#9A9590] hover:bg-cream dark:hover:bg-white/5 hover:text-charcoal dark:hover:text-[#F0EDE8]'
                    }`}>
                    {isActive(item.path) && (
                      <motion.div layoutId="nav-indicator"
                        className="absolute left-0 top-2 bottom-2 w-0.5 bg-terracotta rounded-full"
                        transition={{ type:'spring', stiffness:400, damping:32 }} />
                    )}
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                    </svg>
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mx-3 my-2 h-px bg-charcoal/8 dark:bg-white/6" />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-charcoal-muted dark:text-[#9A9590] hover:bg-error/8 hover:text-error dark:hover:text-error transition-all duration-200">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Sign Out
              </button>
            </nav>
          </motion.aside>

          {/* ── Profile form ── */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.22, duration:0.7, ease }}>

            <div className="rounded-2xl border border-charcoal/8 dark:border-white/6 bg-ivory dark:bg-[#1e1c18] overflow-hidden">
              {/* Card header */}
              <div className="px-6 py-5 border-b border-charcoal/8 dark:border-white/6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg text-charcoal dark:text-[#F0EDE8]">Personal Details</h2>
                  <p className="text-[11px] text-charcoal-muted dark:text-[#9A9590] mt-0.5">Update your name, contact, and bio</p>
                </div>
                {/* Member badge */}
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-sage/15 text-sage font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Collector
                </span>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Name + Phone row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name" id="name">
                    <input id="name" type="text" value={form.name}
                      onChange={e => setForm(f=>({...f,name:e.target.value}))}
                      placeholder="Your full name" className={inputCls} />
                  </Field>
                  <Field label="Phone" id="phone">
                    <input id="phone" type="tel" value={form.phone}
                      onChange={e => setForm(f=>({...f,phone:e.target.value}))}
                      placeholder="+91 98765 43210" className={inputCls} />
                  </Field>
                </div>

                {/* Email (read-only) */}
                <Field label="Email Address" id="email">
                  <div className="relative">
                    <input id="email" type="email" value={user.email} readOnly
                      className={`${inputCls} opacity-55 cursor-not-allowed pr-20`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sage/20 text-sage font-medium">
                      Verified
                    </span>
                  </div>
                </Field>

                {/* Bio */}
                <Field label="Bio" id="bio">
                  <textarea id="bio" value={form.bio} rows={3}
                    onChange={e => setForm(f=>({...f,bio:e.target.value}))}
                    placeholder="A short note about yourself…" maxLength={500}
                    className={`${inputCls} resize-none`} />
                  <p className="text-[10px] text-charcoal-muted/50 dark:text-white/20 text-right">{form.bio.length}/500</p>
                </Field>

                {/* Feedback row */}
                <AnimatePresence>
                  {saveErr && (
                    <motion.p initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                      className="text-xs text-error flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {saveErr}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Save button */}
                <div className="flex items-center gap-3 pt-1">
                  <motion.button whileTap={{ scale: 0.97 }} type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[11px] uppercase tracking-[0.22em] font-medium text-white transition-all duration-300 disabled:opacity-50"
                    style={{ background: saved ? '#9CAF88' : '#2C2C2C' }}
                    onMouseEnter={e => { if(!saving && !saved) e.currentTarget.style.background='#C7694F'; }}
                    onMouseLeave={e => { if(!saving) e.currentTarget.style.background = saved ? '#9CAF88' : '#2C2C2C'; }}
                  >
                    <AnimatePresence mode="wait">
                      {saving ? (
                        <motion.span key="saving" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2">
                          <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}
                            className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white"/>
                          Saving…
                        </motion.span>
                      ) : saved ? (
                        <motion.span key="saved" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Saved
                        </motion.span>
                      ) : (
                        <motion.span key="save" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}>
                          Save Changes
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </form>
            </div>

            {/* ── Stats row ── */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.35, duration:0.6, ease }}
              className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label:'Member since', value: new Date(user.created_at || Date.now()).getFullYear() },
                { label:'Orders placed', value: user.orders_count ?? '–' },
                { label:'Wishlist items', value: user.wishlistProducts?.length ?? '–' },
              ].map(({ label, value }) => (
                <div key={label}
                  className="rounded-2xl border border-charcoal/8 dark:border-white/6 bg-ivory dark:bg-[#1e1c18] p-4 text-center">
                  <p className="font-display text-xl sm:text-2xl text-charcoal dark:text-[#F0EDE8] leading-none">{value}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-charcoal-muted dark:text-[#9A9590] mt-1.5">{label}</p>
                </div>
              ))}
            </motion.div>

            {/* ── Quick links ── */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.42, duration:0.6, ease }}
              className="mt-5 grid sm:grid-cols-2 gap-3">
              {[
                { label:'View My Orders',   desc:'Track and manage past orders',    path:'/account/orders',        icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { label:'My Wishlist',      desc:'Artworks you\'ve saved',          path:'/account/wishlist',      icon:'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              ].map(item => (
                <Link key={item.path} to={item.path}
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-charcoal/8 dark:border-white/6 bg-ivory dark:bg-[#1e1c18] hover:border-terracotta/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-cream dark:bg-[#252219] flex items-center justify-center flex-shrink-0 group-hover:bg-terracotta/10 transition-colors">
                    <svg className="w-4.5 h-4.5 text-charcoal-muted dark:text-[#9A9590] group-hover:text-terracotta transition-colors" style={{width:18,height:18}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-charcoal dark:text-[#F0EDE8] group-hover:text-terracotta transition-colors truncate">{item.label}</p>
                    <p className="text-[11px] text-charcoal-muted dark:text-[#9A9590] truncate">{item.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-charcoal-muted/40 dark:text-white/20 flex-shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
