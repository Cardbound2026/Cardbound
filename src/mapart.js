// ---------- Map art (Nov 11): the run map drawn as a battlefield seen from far above.
// The Broken March gets a painted pixel-art ground (public/img/map/physical.webp: dusty battlefield in the middle, wrecks, bodies, crows
// and the burned castle at the top) behind the node map, and every fight node you can see shows the monsters waiting there, playing
// their idle animation from the fight sheets (CB_MOBS). Other maps keep the plain look until they get their art.
// decorate(el, run) is called after the map SVG is written into a scroll box (the map screen and the Map button in a fight).
// TO REMOVE: delete this file, its line in build.js and the two CB_MAPART calls in src/template.html.
window.CB_MAPART = (function () {
  const ART = { physical: { src: 'img/map/physical.webp', w: 1040 } };   // background drawn at w CSS px wide, centred on the map
  const css = document.createElement('style');
  css.textContent = `.mapart { position: relative; margin: 0 auto; background-repeat: no-repeat; background-position: center top; image-rendering: pixelated; }
    .mapart > svg { position: relative; z-index: 1; }
    .mapart > canvas.mapmobs { position: absolute; top: 0; left: 50%; z-index: 2; pointer-events: none; image-rendering: pixelated; }
    .mapart .node .ring { fill-opacity: .55; }
    .mapart .node.mobnode .ring { fill: rgba(10,8,6,.25); stroke-opacity: .55; }
    .mapart .node.mobnode.reach .ring { stroke-opacity: 1; }
    .mapart .node.mobnode > path { display: none; }
    .mapart text { paint-order: stroke; stroke: rgba(0,0,0,.7); stroke-width: 3px; }
    .mapart svg line[stroke="#5a4a3b"] { stroke: #b39a70; stroke-opacity: .75; } .mapart svg line[stroke="#2e261f"] { stroke: #7a6a52; stroke-opacity: .5; }
    .mapart svg line { filter: drop-shadow(0 1px 0 rgba(0,0,0,.8)); }
    .mapscroll:has(> .mapart) { background: #120f0c; }`;
  document.head.appendChild(css);
  const sheets = {};
  const sheet = (k) => sheets[k] || (sheets[k] = Object.assign(new Image(), { decoding: 'async', src: 'img/mobs/' + k + '.webp' }));
  function keyFor(k) {
    const M = window.CB_MOBS && CB_MOBS.manifest, D = window.CB_DATA; if (!M) return null; const d = D && D.enemies[k];
    if (M[k]) return k; if (d && d.art && M[d.art]) return d.art; return null;
  }
  const HT = { '1': 34, '2': 38, '3': 42, Elite: 50, Boss: 66 };     // how tall each tier stands on the map, in CSS px
  let boxes = [];                                                     // live overlays: { cv, run, list }
  function decorate(el, run) {
    if (!el || !run) return; const svg = el.querySelector(':scope > svg'); if (!svg) return;
    const a = ART[run.mapKey || 'physical'], W = +svg.getAttribute('width'), H = +svg.getAttribute('height');
    const wrap = document.createElement('div'); wrap.className = 'mapart';
    wrap.style.width = Math.max(W, a ? a.w : W) + 'px'; wrap.style.height = H + 'px';
    if (a) { wrap.style.backgroundImage = `url(${a.src})`; wrap.style.backgroundSize = `${a.w}px auto`; wrap.style.width = '100%'; wrap.style.minWidth = W + 'px'; }
    svg.style.margin = '0 auto'; el.insertBefore(wrap, svg); wrap.appendChild(svg);
    // monsters on the fight nodes you can see
    const list = [];
    for (const g of svg.querySelectorAll('.node')) {
      const n = run.map.nodes[g.dataset.id]; if (!n || !n.enemies || !run.visible(n)) continue;
      const ks = n.enemies.map((k) => ({ k: keyFor(k), tier: ((window.CB_DATA && CB_DATA.enemies[k]) || {}).tier || '1' })).filter((x) => x.k);
      if (!ks.length) continue; g.classList.add('mobnode');
      const tr = /translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute('transform')); if (!tr) continue;
      list.push({ x: +tr[1], y: +tr[2], ks: ks.slice(0, 3), dim: run.visited.includes(n.id) && run.at !== n.id, boss: n.id === 'boss', ph: (n.row * 7 + n.col * 3) % 9 });
      for (const x of ks) sheet(x.k);
    }
    if (!list.length) return;
    const cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.className = 'mapmobs'; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.style.marginLeft = (-W / 2) + 'px';
    wrap.appendChild(cv); boxes = boxes.filter((b) => b.cv.isConnected); boxes.push({ cv, list, dpr });
    if (!loop.on) { loop.on = true; requestAnimationFrame(loop); }
  }
  function loop(t) {
    boxes = boxes.filter((b) => b.cv.isConnected); if (!boxes.length) { loop.on = false; return; }
    requestAnimationFrame(loop);
    if (t - (loop.last || 0) < 60) return; loop.last = t;
    const M = CB_MOBS.manifest;
    for (const b of boxes) {
      const g = b.cv.getContext('2d'); g.setTransform(b.dpr, 0, 0, b.dpr, 0, 0); g.clearRect(0, 0, b.cv.width, b.cv.height); g.imageSmoothingEnabled = false;
      for (const s of b.list) {
        const n = s.ks.length, gap = n > 1 ? 16 : 0;
        s.ks.forEach((x, j) => {
          const m = M[x.k], img = sheet(x.k); if (!m || !img.complete || !img.naturalWidth) return;
          const r = Math.max(0, m.a.findIndex((a) => a[0] === 'idle')), fn = m.a[r][1], i = (Math.floor(t / 110) + s.ph + j * 2) % fn;
          const [x0, y0, x1, y1] = m.ib, ih = y1 - y0, h = (s.boss ? HT.Boss : HT[x.tier] || 28) * (n > 1 ? 0.85 : 1), k = h / ih;
          const cx = s.x + (j - (n - 1) / 2) * gap, foot = s.y + h * 0.42 + (j % 2) * 3;
          g.globalAlpha = s.dim ? 0.35 : 1;
          const gl = g.createRadialGradient(cx, foot - h * 0.35, 0, cx, foot - h * 0.35, h * 0.7); gl.addColorStop(0, 'rgba(230,190,120,.16)'); gl.addColorStop(1, 'rgba(230,190,120,0)'); g.fillStyle = gl; g.fillRect(cx - h, foot - h * 1.1, h * 2, h * 1.5);
          g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(cx, foot, h * 0.3, h * 0.08, 0, 0, Math.PI * 2); g.fill();
          g.save(); g.translate(cx, foot);
          g.drawImage(img, i * m.w, r * m.h, m.w, m.h, -((x0 + x1) / 2) * k, -y1 * k, m.w * k, m.h * k); g.restore();
        });
      }
      g.globalAlpha = 1;
    }
  }
  return { decorate, has: (k) => !!ART[k] };
})();
