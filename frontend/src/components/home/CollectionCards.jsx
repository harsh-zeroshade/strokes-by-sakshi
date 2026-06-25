import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { STORAGE_URL } from '../../config';

/* ═══════════════════════════════════════════════════════════════════════════════
   CollectionCards — Three.js animated collection grid
   ──────────────────────────────────────────────────────────────────────────────
   • Each collection is a PlaneGeometry textured with the cover image
   • On mount: cards fly in from below using AnimationMixer + KeyframeTrack
   • On hover: card tilts toward cursor (3D mouse-tracking via raycasting)
   • On hover end: card springs back to neutral with a keyframe spring clip
   • Depth: non-hovered cards push slightly back (z position keyframe)
═══════════════════════════════════════════════════════════════════════════════ */

function loadImg(url) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const t = new THREE.Texture(img);
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
      resolve(t);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function gradientTexture(colors) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  colors.forEach(([stop, color]) => g.addColorStop(stop, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

const FALLBACKS = [
  [['0','#c7694f'],['1','#9caf88']],
  [['0','#c9a94e'],['1','#c7694f']],
  [['0','#2c2c2c'],['1','#c9a94e']],
  [['0','#9caf88'],['1','#2c2c2c']],
];

export default function CollectionCards({ collections }) {
  const mountRef  = useRef(null);
  const navigate  = useNavigate();

  useEffect(() => {
    if (!collections.length || !mountRef.current) return;
    const mount = mountRef.current;

    /* ── renderer ──────────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 6;

    /* ── card layout — driven by container width so it's always responsive ── */
    const getLayout = () => {
      const w = mount.clientWidth;
      // On narrow screens show 2 cards, wider shows all 4
      const visibleCols = w < 600 ? 2 : 4;
      // Card fills ~88% of its column, with a small gap
      const colW  = w / visibleCols;
      const CW    = (colW / w) * 9.5 * 0.82;   // world units
      const CH    = CW * 1.38;                   // 3:4-ish ratio
      const GAP   = CW * 0.12;
      const totalW = visibleCols * CW + (visibleCols - 1) * GAP;
      const startX = -totalW / 2 + CW / 2;
      // Camera Z: pull back so all cards fit horizontally in view
      const fovRad   = (60 * Math.PI) / 180;
      const aspect   = w / mount.clientHeight;
      const neededZ  = (totalW / 2) / Math.tan(fovRad / 2) / aspect * 1.08;
      return { CW, CH, GAP, startX, neededZ, visibleCols };
    };

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const { neededZ } = getLayout();
      camera.position.z = neededZ;
      camera.updateProjectionMatrix();
    };
    resize();

    /* ── card layout ───────────────────────────────────────────────────── */
    const cols  = collections.slice(0, 4);
    const cards   = [];
    const mixers  = [];
    const N     = cols.length;
    const CW    = 1.8;   // card width (world units)
    const CH    = 2.4;   // card height
    const GAP   = 0.28;
    const totalW = N * CW + (N - 1) * GAP;
    const startX = -totalW / 2 + CW / 2;

    /* ── label canvas texture ──────────────────────────────────────────── */
    const makeLabelTex = (name, count) => {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 180;
      const ctx = c.getContext('2d');
      // gradient overlay
      const g = ctx.createLinearGradient(0, 0, 0, 180);
      g.addColorStop(0,   'rgba(0,0,0,0)');
      g.addColorStop(0.4, 'rgba(0,0,0,0.45)');
      g.addColorStop(1,   'rgba(0,0,0,0.82)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,512,180);
      // name
      ctx.fillStyle = '#FAF7F2';
      ctx.font = '600 36px Georgia, serif';
      ctx.fillText(name, 28, 118);
      // count
      ctx.fillStyle = 'rgba(250,247,242,0.7)';
      ctx.font = '300 24px Arial, sans-serif';
      ctx.fillText(`${count} piece${count !== 1 ? 's':''}`, 28, 155);
      const t = new THREE.CanvasTexture(c);
      t.needsUpdate = true;
      return t;
    };

    /* ── build cards ───────────────────────────────────────────────────── */
    const buildCards = async () => {
      const { CW, CH, GAP, startX } = getLayout();

      const textures = await Promise.all(cols.map(col => {
        const url = col.cover_image
          ? (col.cover_image.startsWith('http') ? col.cover_image : `${STORAGE_URL}/${col.cover_image}`)
          : null;
        return loadImg(url);
      }));

      cols.forEach((col, i) => {
        const bx = startX + i * (CW + GAP);
        const by = 0;
        const bz = 0;

        /* main card mesh */
        const geo = new THREE.PlaneGeometry(CW, CH, 1, 1);
        const tex = textures[i] || gradientTexture(FALLBACKS[i % 4]);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(bx, by - 3, bz);  // start below for fly-in
        mesh.userData = { colIdx: i, slug: col.slug };

        /* rounded border via EdgesGeometry ring */
        const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(CW + 0.04, CH + 0.04));
        const borderMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
        const border = new THREE.LineSegments(borderGeo, borderMat);
        border.position.z = 0.001;
        mesh.add(border);

        /* label overlay plane (bottom portion) */
        const labelGeo = new THREE.PlaneGeometry(CW, CH * 0.32);
        const labelMat = new THREE.MeshBasicMaterial({
          map: makeLabelTex(col.name, col.products_count || 0),
          transparent: true, opacity: 0, depthWrite: false,
        });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(0, -(CH / 2) + (CH * 0.32) / 2, 0.002);
        mesh.add(labelMesh);

        scene.add(mesh);
        cards.push({ mesh, mat, labelMat, border: borderMat, bx, by, bz, slug: col.slug });

        /* ── fly-in keyframe clip ── */
        const flyDur = 1.2;
        const delay  = i * 0.15;
        const mixer  = new THREE.AnimationMixer(mesh);
        mixers.push(mixer);

        const yTrack = new THREE.VectorKeyframeTrack('.position',
          [delay, delay + flyDur * 0.7, delay + flyDur],
          [bx, by - 3, bz,  bx, by + 0.15, bz,  bx, by, bz]
        );
        const opTrack = new THREE.NumberKeyframeTrack('.material.opacity',
          [delay, delay + flyDur * 0.5, delay + flyDur],
          [0, 0.85, 1]
        );
        const clip = new THREE.AnimationClip(`flyIn_${i}`, delay + flyDur, [yTrack, opTrack]);
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play();

        /* also fade in label */
        const labelMixer = new THREE.AnimationMixer(labelMesh);
        mixers.push(labelMixer);
        const lOp = new THREE.NumberKeyframeTrack('.material.opacity',
          [delay + flyDur * 0.6, delay + flyDur], [0, 1]);
        const lClip = new THREE.AnimationClip(`labelIn_${i}`, delay + flyDur, [lOp]);
        const lAction = labelMixer.clipAction(lClip);
        lAction.setLoop(THREE.LoopOnce, 1);
        lAction.clampWhenFinished = true;
        lAction.play();
      });
    };

    buildCards();

    /* ── raycaster for hover ───────────────────────────────────────────── */
    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2(-9, -9);
    let hoveredIdx  = -1;

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      pointer.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    };
    const onClick = (e) => {
      const rect = mount.getBoundingClientRect();
      const px =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const py = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      const rc = new THREE.Raycaster();
      rc.setFromCamera({ x: px, y: py }, camera);
      const meshes = cards.map(c => c.mesh);
      const hits   = rc.intersectObjects(meshes, false);
      if (hits.length) {
        const slug = hits[0].object.userData.slug;
        if (slug) navigate(`/shop?collection=${slug}`);
      }
    };

    mount.addEventListener('mousemove', onMouseMove);
    mount.addEventListener('click', onClick);

    /* ── cursor style ──────────────────────────────────────────────────── */
    mount.style.cursor = 'default';

    /* ── RAF loop ──────────────────────────────────────────────────────── */
    let raf;
    const clock = new THREE.Clock();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const delta = clock.getDelta();

      /* update mixers */
      mixers.forEach(m => m.update(delta));

      /* hover detection + tilt */
      raycaster.setFromCamera(pointer, camera);
      const meshes = cards.map(c => c.mesh);
      const hits   = raycaster.intersectObjects(meshes, false);

      const newHov = hits.length ? (hits[0].object.userData.colIdx ?? -1) : -1;
      if (newHov !== hoveredIdx) {
        mount.style.cursor = newHov >= 0 ? 'pointer' : 'default';
        hoveredIdx = newHov;
      }

      cards.forEach((card, i) => {
        if (!card.mat.opacity) return; // not yet visible

        const isHov = i === hoveredIdx;

        if (isHov && hits.length) {
          /* tilt toward mouse position within the card */
          const uv = hits[0].uv;
          if (uv) {
            const tx = (uv.x - 0.5) * 0.38;   // max ±0.19 rad tilt
            const ty = (uv.y - 0.5) * -0.28;
            card.mesh.rotation.y += (tx - card.mesh.rotation.y) * 0.12;
            card.mesh.rotation.x += (ty - card.mesh.rotation.x) * 0.12;
          }
          // lift forward
          card.mesh.position.z += (0.5 - card.mesh.position.z) * 0.1;
          // glow border
          card.border.opacity += (0.5 - card.border.opacity) * 0.1;
        } else {
          // spring back to neutral
          card.mesh.rotation.y += (0 - card.mesh.rotation.y) * 0.1;
          card.mesh.rotation.x += (0 - card.mesh.rotation.x) * 0.1;
          card.mesh.position.z += (card.bz - card.mesh.position.z) * 0.08;
          card.border.opacity  += (0.12 - card.border.opacity) * 0.08;
        }

        /* push non-hovered cards slightly back when something is hovered */
        const targetZ = hoveredIdx >= 0 && !isHov ? -0.3 : card.bz;
        card.mesh.position.z += (targetZ - card.mesh.position.z) * 0.06;
      });

      renderer.render(scene, camera);
    };
    tick();

    /* ── resize ────────────────────────────────────────────────────────── */
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      mount.removeEventListener('mousemove', onMouseMove);
      mount.removeEventListener('click', onClick);
      ro.disconnect();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [collections]); // eslint-disable-line

  if (!collections.length) return null;

  return (
    <div
      ref={mountRef}
      className="w-full"
      style={{ height: 'clamp(360px, 52vw, 580px)' }}
    />
  );
}
