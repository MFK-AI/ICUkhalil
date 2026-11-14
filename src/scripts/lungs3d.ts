// Gold particle lungs. Loads only after the page is usable, on capable screens,
// and never when the visitor asks for reduced motion. The still image stays as fallback.
type V2 = [number, number];

function catmull(pts: V2[], n = 24): V2[] {
  const out: V2[] = []; const m = pts.length;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as V2);
    }
  }
  return out;
}
function inside(poly: V2[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function rng(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

function buildLungs() {
  const rand = rng(11);
  const L: V2[] = [[450,150],[385,195],[305,330],[245,500],[212,670],[220,820],[275,880],[380,868],[470,832],[540,848],[565,760],[552,600],[546,450],[528,290],[495,180]];
  const R: V2[] = L.map(([x, y]) => [1200 - x, y]);
  R[9] = [700, 840]; R[10] = [770, 770]; R[11] = [720, 640];
  const polys = [catmull(L), catmull(R)];
  const lungPts: number[] = [], lungCol: number[] = [], airPts: number[] = [], airCol: number[] = [];
  const toW = (x: number, y: number): V2 => [(x - 600) / 400, -(y - 500) / 400];
  const gold = (y: number, a: number, arr: number[]) => { const t = Math.min(1, Math.max(0, (y - 40) / 860)); arr.push(1 * a, (0.89 - 0.19 * t) * a, (0.51 - 0.33 * t) * a); };
  polys.forEach((poly, side) => {
    const xs = poly.map((p) => p[0]); const minX = Math.min(...xs), maxX = Math.max(...xs); const cx = (minX + maxX) / 2, half = (maxX - minX) / 2;
    const dense = catmull(side ? R : L, 90);
    dense.forEach(([x, y]) => { for (let k = 0; k < 2; k++) { const [wx, wy] = toW(x + (rand() - .5) * 6, y + (rand() - .5) * 6); lungPts.push(wx, wy, (rand() - .5) * 0.08); gold(y, 0.95, lungCol); } });
    let n = 0;
    while (n < 4200) {
      const x = 150 + rand() * 900, y = 120 + rand() * 780;
      if (!inside(poly, x, y)) continue;
      n++;
      const nx = (x - cx) / half; const T = 0.42 * Math.sqrt(Math.max(0, 1 - nx * nx));
      const shell = rand() < 0.55; const s = rand() < 0.5 ? -1 : 1;
      const z = shell ? s * T * (0.85 + rand() * 0.15) : (rand() * 2 - 1) * T;
      const [wx, wy] = toW(x, y); lungPts.push(wx, wy, z); gold(y, shell ? 0.8 : 0.45, lungCol);
    }
  });
  const inLung = (x: number, y: number) => inside(polys[0], x, y) || inside(polys[1], x, y);
  const seg = (x: number, y: number, x2: number, y2: number, depth: number, check: boolean) => {
    const steps = Math.max(3, Math.floor(Math.hypot(x2 - x, y2 - y) / 3));
    for (let i = 0; i <= steps; i++) {
      const px = x + ((x2 - x) * i) / steps, py = y + ((y2 - y) * i) / steps;
      if (check && !inLung(px, py)) return false;
      const [wx, wy] = toW(px, py); airPts.push(wx, wy, (rand() - .5) * 0.04 * (8 - depth)); gold(py, 1, airCol);
    }
    return true;
  };
  const branch = (x: number, y: number, ang: number, len: number, depth: number) => {
    if (!depth) return;
    const x2 = x + len * Math.cos(ang), y2 = y + len * Math.sin(ang);
    if (!seg(x, y, x2, y2, depth, depth < 6)) return;
    branch(x2, y2, ang - 0.48 + (rand() - .5) * .14, len * 0.74, depth - 1);
    branch(x2, y2, ang + 0.40 + (rand() - .5) * .14, len * 0.74, depth - 1);
  };
  seg(591, 40, 591, 330, 7, false); seg(609, 40, 609, 330, 7, false);
  branch(600, 330, (140 * Math.PI) / 180, 140, 7);
  branch(600, 330, (38 * Math.PI) / 180, 130, 7);
  return { lungPts, lungCol, airPts, airCol };
}

export async function startLungs(host: HTMLElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav: any = navigator;
  const weak = (nav.connection && nav.connection.saveData) || (nav.deviceMemory && nav.deviceMemory < 4);
  if (reduce || weak || window.innerWidth < 760) return;
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  const THREE = await import('three');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1.2, 0.1, 50);
  camera.position.set(0, 0, 4.4);

  const sprite = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const { lungPts, lungCol, airPts, airCol } = buildLungs();
  const mk = (p: number[], c: number[], size: number) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    const mat = new THREE.PointsMaterial({ size, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    return new THREE.Points(geo, mat);
  };
  const lungs = mk(lungPts, lungCol, 0.034);
  const air = mk(airPts, airCol, 0.03);
  const group = new THREE.Group(); group.add(lungs, air); scene.add(group);

  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(host); resize();

  let tx = 0, ty = 0, rx = 0, ry = 0;
  window.addEventListener('pointermove', (e) => { tx = (e.clientY / window.innerHeight - 0.5) * 0.35; ty = (e.clientX / window.innerWidth - 0.5) * 0.7; }, { passive: true });

  let visible = true, raf = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop(); }).observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) loop(); });
  const t0 = performance.now();
  function loop() {
    if (!visible || document.hidden) { raf = 0; return; }
    const t = (performance.now() - t0) / 1000;
    const b = Math.sin((2 * Math.PI * t) / 5); // 12 breaths per minute
    lungs.scale.set(1 + 0.04 * b, 1 + 0.025 * b, 1 + 0.06 * b);
    air.scale.set(1 + 0.015 * b, 1 + 0.01 * b, 1);
    rx += (tx - rx) * 0.05; ry += (ty + Math.sin(t / 3.2) * 0.35 - ry) * 0.05;
    group.rotation.set(rx, ry, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  loop();
  host.classList.add('live');
}
