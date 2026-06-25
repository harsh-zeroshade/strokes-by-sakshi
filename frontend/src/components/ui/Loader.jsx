import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────────────────────
   Paintbrush-on-art-paper loader
   ──────────────────────────────────────────────────────────────────────────
   Scene composition:
     1. Art-paper quad — warm cream with a subtle paper-grain noise texture
     2. Three dried paint strokes (CatmullRom curves) already on the paper
     3. Paintbrush group (walnut handle → silver ferrule → tapering bristle tip)
        animated along a lemniscate path, tilting toward direction of travel
     4. Wet-paint ink trail: the brush tip leaves a 40-point terracotta streak
     5. Six paint-splatter circles pulsing in brand colours around the paper
───────────────────────────────────────────────────────────────────────────── */
export default function Loader() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth  || 280;
    const H = mount.clientHeight || 280;

    // ── Renderer ─────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2.2, 2.2, 2.2, -2.2, 0.1, 20);
    camera.position.z = 10;

    // ── 1. Art-paper texture ──────────────────────────────────────────
    // Generate a paper-grain texture procedurally on a 2D canvas
    const paperCanvas = document.createElement('canvas');
    paperCanvas.width = paperCanvas.height = 256;
    const pc = paperCanvas.getContext('2d');
    // Base warm cream fill
    pc.fillStyle = '#f5f0e8';
    pc.fillRect(0, 0, 256, 256);
    // Subtle grain dots
    for (let g = 0; g < 3200; g++) {
      const gx = Math.random() * 256;
      const gy = Math.random() * 256;
      const gr = Math.random() * 0.8 + 0.2;
      const ga = Math.random() * 0.09 + 0.01;
      pc.beginPath();
      pc.arc(gx, gy, gr, 0, Math.PI * 2);
      pc.fillStyle = `rgba(120,90,60,${ga})`;
      pc.fill();
    }
    // Faint horizontal fibers
    for (let f = 0; f < 40; f++) {
      const fy = Math.random() * 256;
      pc.beginPath();
      pc.moveTo(0, fy);
      pc.lineTo(256, fy + (Math.random() - 0.5) * 6);
      pc.strokeStyle = `rgba(180,150,110,${Math.random() * 0.06})`;
      pc.lineWidth   = Math.random() * 0.6 + 0.2;
      pc.stroke();
    }
    const paperTex = new THREE.CanvasTexture(paperCanvas);

    // Paper quad — slightly smaller than camera frustum to show a border
    const paperGeo = new THREE.PlaneGeometry(3.8, 3.8);
    const paperMat = new THREE.MeshBasicMaterial({ map: paperTex });
    const paper    = new THREE.Mesh(paperGeo, paperMat);
    paper.position.z = -0.5;
    scene.add(paper);

    // Thin drop-shadow border
    const shadowGeo = new THREE.PlaneGeometry(3.88, 3.88);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0xd8cec0, transparent: true, opacity: 0.6 });
    const shadow    = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0.04, -0.04, -0.6);
    scene.add(shadow);

    // ── 2. Dried paint strokes on the paper ───────────────────────────
    const driedStrokes = [
      {
        pts: [[-1.7, 0.4], [-0.8, 0.7], [0.1, 0.3], [1.0, 0.6], [1.7, 0.2]],
        col: 0xb85c40,   // terracotta
        w:   2.2,
        op:  0.28,
      },
      {
        pts: [[-1.5,-0.3], [-0.5,-0.1], [0.4,-0.5], [1.2,-0.2], [1.6,-0.6]],
        col: 0xb89a3a,   // gold
        w:   1.8,
        op:  0.22,
      },
      {
        pts: [[-1.3,-1.1], [-0.4,-0.8], [0.5,-1.2], [1.4,-0.9]],
        col: 0x7a9a68,   // sage
        w:   1.4,
        op:  0.18,
      },
    ];

    driedStrokes.forEach(({ pts, col, w, op }) => {
      const curve  = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, -0.05)));
      const points = curve.getPoints(60);
      const geo    = new THREE.BufferGeometry().setFromPoints(points);
      const mat    = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, linewidth: w });
      scene.add(new THREE.Line(geo, mat));
    });

    // ── 3. Paintbrush ─────────────────────────────────────────────────
    // Handle
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.036, 1.05, 10),
      new THREE.MeshBasicMaterial({ color: 0x5c3a1e }),      // walnut
    );
    // Wood grain stripe (thin darker cylinder)
    const grain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.044, 0.12, 10),
      new THREE.MeshBasicMaterial({ color: 0x3d2510, transparent: true, opacity: 0.5 }),
    );
    grain.position.y = 0.22;

    // Ferrule
    const ferrule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.050, 0.14, 12),
      new THREE.MeshBasicMaterial({ color: 0xb8b8b8 }),      // silver
    );
    ferrule.position.y = -0.595;

    // Bristles — tapered cone, terracotta
    const bristle = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.42, 12),
      new THREE.MeshBasicMaterial({ color: 0xc7694f }),
    );
    bristle.position.y = -0.88;

    // Bright wet-paint dot at very tip
    const tipDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6a40, transparent: true, opacity: 0.9 }),
    );
    tipDot.position.y = -1.11;

    const brush = new THREE.Group();
    brush.add(handle, grain, ferrule, bristle, tipDot);
    scene.add(brush);

    // ── 4. Wet-ink trail ──────────────────────────────────────────────
    const TRAIL   = 40;
    const trailPos = new Float32Array(TRAIL * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setDrawRange(0, 0);

    // Build a trail texture: a soft elongated oval
    const trailCanvas  = document.createElement('canvas');
    trailCanvas.width  = 32;
    trailCanvas.height = 32;
    const tc  = trailCanvas.getContext('2d');
    const tg  = tc.createRadialGradient(16, 16, 0, 16, 16, 16);
    tg.addColorStop(0,   'rgba(255,255,255,1)');
    tg.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    tg.addColorStop(1,   'rgba(255,255,255,0)');
    tc.fillStyle = tg;
    tc.fillRect(0, 0, 32, 32);
    const trailTex = new THREE.CanvasTexture(trailCanvas);

    const trailPoints = new THREE.Points(trailGeo, new THREE.PointsMaterial({
      color:           0xc7694f,
      size:            0.1,
      map:             trailTex,
      transparent:     true,
      opacity:         0.82,
      blending:        THREE.NormalBlending,
      depthWrite:      false,
      sizeAttenuation: true,
    }));
    scene.add(trailPoints);

    const history = [];

    // ── 5. Paint splatters ────────────────────────────────────────────
    const SPLAT_COLORS = [0xc7694f, 0xc9a94e, 0x9caf88, 0xa85540, 0x7a9a68, 0x2c2c2c];
    const splatters = SPLAT_COLORS.map((col, i) => {
      const angle = (i / SPLAT_COLORS.length) * Math.PI * 2;
      const r     = 1.55 + (i % 2) * 0.22;
      const size  = 0.05 + (i % 3) * 0.04;
      const mesh  = new THREE.Mesh(
        new THREE.CircleGeometry(size, 16),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 + (i % 3) * 0.1 }),
      );
      mesh.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      scene.add(mesh);
      return { mesh, phase: (i / SPLAT_COLORS.length) * Math.PI * 2 };
    });

    // ── Animation loop ─────────────────────────────────────────────────
    let rafId;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Lemniscate path for brush (figure-8)
      const bx = 1.25 * Math.sin(t * 0.9);
      const by = 0.72 * Math.sin(t * 1.8);
      brush.position.set(bx, by, 0.2);

      // Tilt brush toward velocity direction
      const vx = 1.25 * 0.9  * Math.cos(t * 0.9);
      const vy = 0.72 * 1.8  * Math.cos(t * 1.8);
      brush.rotation.z = -Math.atan2(vx, vy) + Math.PI / 2;

      // Bristle-tip world position
      const len  = 1.11;
      const tipX = bx - len * Math.sin(brush.rotation.z);
      const tipY = by + len * Math.cos(brush.rotation.z);

      // Update trail
      history.unshift(new THREE.Vector3(tipX, tipY, 0.05));
      if (history.length > TRAIL) history.pop();
      history.forEach((p, i) => {
        trailPos[i * 3]     = p.x;
        trailPos[i * 3 + 1] = p.y;
        trailPos[i * 3 + 2] = p.z;
      });
      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.setDrawRange(0, history.length);
      trailPoints.material.opacity = 0.55 + 0.27 * Math.sin(t * 2.5);

      // Pulse wet tip
      tipDot.material.opacity = 0.7 + 0.3 * Math.sin(t * 5);

      // Splatters pulse
      splatters.forEach(({ mesh, phase }) => {
        mesh.scale.setScalar(0.88 + 0.18 * Math.sin(t * 2.2 + phase));
        mesh.material.opacity = 0.4 + 0.25 * Math.sin(t * 1.8 + phase);
      });

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      renderer.setSize(nw, nh);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      paperTex.dispose();
      trailTex.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
         style={{ background: 'radial-gradient(ellipse at center, #fdfbf8 0%, #f5f0e8 100%)' }}>

      {/* Three.js scene */}
      <div ref={mountRef} className="w-[280px] h-[280px]" />

      {/* Brand with logo */}
      <div className="mt-3 flex flex-col items-center gap-1">
        <svg width="44" height="44" viewBox="0 0 80 80" fill="#C7694F" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(40,40) rotate(-45) translate(-40,-40)">
            <rect x="36" y="6"  width="8" height="46" rx="4" />
            <rect x="35" y="48" width="10" height="7" rx="1.5" opacity="0.8"/>
            <ellipse cx="40" cy="64" rx="6" ry="10" />
            <ellipse cx="40" cy="70" rx="3" ry="4" opacity="0.6" />
          </g>
          <g transform="translate(40,40) rotate(45) translate(-40,-40)">
            <rect x="36" y="10" width="8" height="42" rx="2" />
            <polygon points="36,52 44,52 40,64" />
            <circle cx="40" cy="63" r="2" opacity="0.7" />
            <rect x="35" y="6" width="10" height="7" rx="2" opacity="0.75" />
            <rect x="35" y="11" width="10" height="2" rx="1" opacity="0.5" />
          </g>
        </svg>
        <p className="text-lg font-display text-charcoal tracking-widest select-none">
          Strokes by Sakshi
        </p>
        <p className="text-[10px] uppercase tracking-[0.35em] text-charcoal-muted select-none">
          Where Emotions Find Their Canvas
        </p>
      </div>

      {/* Paint-drop loading dots */}
      <div className="mt-5 flex items-end gap-2 h-4">
        {[0, 1, 2, 3].map(i => (
          <span
            key={i}
            className="block rounded-full bg-terracotta"
            style={{
              width:  i === 1 || i === 2 ? '7px' : '9px',
              height: i === 1 || i === 2 ? '7px' : '9px',
              animation: `inkdrop 1.5s cubic-bezier(.36,.07,.19,.97) ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes inkdrop {
          0%,100% { transform: scaleY(1)   translateY(0);    opacity:.35; }
          30%      { transform: scaleY(1.4) translateY(-7px); opacity:1;   }
          60%      { transform: scaleY(.8)  translateY(2px);  opacity:.7;  }
        }
      `}</style>
    </div>
  );
}
