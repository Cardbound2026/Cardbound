// ---------- Map art (Nov 11): the run map drawn as a battlefield seen from far above.
// The Broken March gets a painted pixel-art ground (public/img/map/physical.webp: dusty battlefield in the middle, wrecks, bodies, crows
// and the burned castle at the top) behind the node map, and every fight node you can see shows the monsters waiting there, playing
// their idle animation from the fight sheets (CB_MOBS). Other maps keep the plain look until they get their art.
// decorate(el, run) is called after the map SVG is written into a scroll box (the map screen and the Map button in a fight).
// TO REMOVE: delete this file, its line in build.js and the two CB_MAPART calls in src/template.html.
window.CB_MAPART = (function () {
  const ART = {};   // background drawn at w CSS px wide, centred on the map (Nov 11: every map has one now, made by tools/mapart/compose_map.py)
  for (const k of ['physical', 'fire', 'frost', 'nature', 'arcane', 'shadow']) ART[k] = { src: 'img/map/' + k + '.webp', w: 1040 };
  const css = document.createElement('style');
  css.textContent = `.mapart { position: relative; margin: 0 auto; background-repeat: no-repeat; background-position: center top; image-rendering: pixelated; }
    .mapart > svg { position: relative; z-index: 1; }
    .mapart > canvas.mapmobs { position: absolute; top: 0; left: 50%; z-index: 2; pointer-events: none; image-rendering: pixelated; }
    .mapart .node .ring { fill-opacity: .55; }
    .mapart .node.artnode .ring { fill: transparent; stroke-opacity: 0; }
    .mapart .node.artnode.reach .ring { stroke-opacity: .85; stroke-dasharray: 3 4; }
    .mapart .node.artnode > path, .mapart .node.artnode > .enraged { display: none; }
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
  const PROP = { rest: 'rest', shrine: 'shrine', merchant: 'merchant' };          // public/img/map/node_<name>.png
  const props = {};
  const propImg = (k) => props[k] || (props[k] = Object.assign(new Image(), { decoding: 'async', src: 'img/map/node_' + k + '.png' }));
  const RING = { fight: '#f4efe4', elite: '#ff3b2f', boss: '#ff3b2f', merchant: '#4fd86a', rest: '#ffd23f', shrine: '#47a4ff' };
  function ring(g, cx, cy, rx, col, t, enraged, dim, bold) {
    const pulse = enraged ? 0.5 + 0.5 * Math.sin(t / 180) : 0, ry = rx * 0.42;
    g.save(); g.globalAlpha = (dim ? 0.35 : 1) * (enraged ? 0.55 + 0.45 * pulse : 0.9);
    g.fillStyle = col + (enraged ? '40' : '22'); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.shadowColor = col; g.shadowBlur = enraged ? 6 + 10 * pulse : 5; g.strokeStyle = col; g.lineWidth = enraged ? 2.5 + 1.5 * pulse : bold ? 3.5 : 2; if (bold) { g.shadowBlur = 10; g.fillStyle = col + '44'; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    if (enraged) { g.lineWidth = 1.5; g.globalAlpha *= 0.6; g.beginPath(); g.ellipse(cx, cy, rx + 4 + 3 * pulse, ry + 2 + 1.5 * pulse, 0, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
  const skull = Object.assign(new Image(), { src: 'img/map/skull_done.png' });
  let boxes = [];                                                     // live overlays: { cv, run, list }
  function decorate(el, run) {
    if (!el || !run) return; const svg = el.querySelector(':scope > svg'); if (!svg) return;
    const a = ART[run.mapKey || 'physical'], W = +svg.getAttribute('width'), H = +svg.getAttribute('height');
    const wrap = document.createElement('div'); wrap.className = 'mapart';
    wrap.style.width = Math.max(W, a ? a.w : W) + 'px'; wrap.style.height = H + 'px';
    if (a) { wrap.style.backgroundImage = `url(${a.src})`; wrap.style.backgroundSize = `${a.w}px auto`; wrap.style.width = '100%'; wrap.style.minWidth = W + 'px'; }
    svg.style.margin = '0 auto'; el.insertBefore(wrap, svg); wrap.appendChild(svg);
    // every node you can see gets its model (the monsters waiting there, or a campfire, obelisk or merchant's wagon) standing on a
    // coloured ring: white fight, red elite (pulsing when enraged), green merchant, yellow campfire, blue obelisk
    const list = [];
    for (const g of svg.querySelectorAll('.node')) {
      const n = run.map.nodes[g.dataset.id]; if (!n || !run.visible(n)) continue;
      const tr = /translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute('transform')); if (!tr) continue;
      const boss = n.id === 'boss', kind = boss ? 'boss' : n.type;
      const pl = run.plan || {}, plan = (pl.A || []).includes(n.id) ? '#4fd1ff' : (pl.B || []).includes(n.id) ? '#c084fc' : null;
      const e = { x: +tr[1], y: +tr[2], kind, enraged: !!n.enraged, ks: [], prop: PROP[n.type] || null, dim: run.visited.includes(n.id) && run.at !== n.id, done: run.visited.includes(n.id), plan, boss, ph: (n.row * 7 + n.col * 3) % 9 };
      if (n.enemies) { e.ks = n.enemies.map((k) => ({ k: keyFor(k), tier: ((window.CB_DATA && CB_DATA.enemies[k]) || {}).tier || '1' })).filter((x) => x.k).slice(0, 3); for (const x of e.ks) sheet(x.k); }
      if (e.prop) propImg(e.prop);
      if (!e.ks.length && !e.prop) continue;
      g.classList.add('artnode'); list.push(e);
      if (plan) { const pc = svg.querySelector(`circle.plan[data-k="${n.id}"]`); if (pc) pc.remove(); } // the ring under the model turns the route's colour instead
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
      for (const s of b.list) {                                          // rings first, so every model stands on top of its own
        const n = s.ks.length, rx = s.boss ? 30 : s.prop ? 22 : Math.max(17, (n - 1) * 8 + 14);
        ring(g, s.x, s.y + (s.prop ? 10 : 8), rx, s.plan || RING[s.kind] || RING.fight, t, s.enraged && !s.plan, s.dim && !s.plan, !!s.plan);
      }
      for (const s of b.list) {
        if (s.prop) {
          const img = propImg(s.prop); if (!img.complete || !img.naturalWidth) continue;
          const h = 44, k = h / img.naturalHeight; g.globalAlpha = s.dim ? 0.4 : 1;
          if (s.prop === 'rest') { const fl = 0.75 + 0.25 * Math.sin(t / 90 + s.ph); const gl = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, 34); gl.addColorStop(0, `rgba(255,170,60,${0.32 * fl})`); gl.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gl; g.fillRect(s.x - 40, s.y - 40, 80, 80); }
          if (s.prop === 'shrine') { const fl = 0.6 + 0.4 * Math.sin(t / 400 + s.ph); const gl = g.createRadialGradient(s.x, s.y - 10, 0, s.x, s.y - 10, 34); gl.addColorStop(0, `rgba(90,170,255,${0.28 * fl})`); gl.addColorStop(1, 'rgba(90,170,255,0)'); g.fillStyle = gl; g.fillRect(s.x - 40, s.y - 50, 80, 80); }
          g.drawImage(img, s.x - img.naturalWidth * k / 2, s.y + 12 - h, img.naturalWidth * k, h);
          continue;
        }
        const n = s.ks.length, gap = n > 1 ? 16 : 0;
        s.ks.forEach((x, j) => {
          const m = M[x.k], img = sheet(x.k); if (!m || !img.complete || !img.naturalWidth) return;
          const r = Math.max(0, m.a.findIndex((a) => a[0] === 'idle')), fn = m.a[r][1], i = (Math.floor(t / 110) + s.ph + j * 2) % fn;
          const [x0, y0, x1, y1] = m.ib, ih = y1 - y0, h = (s.boss ? HT.Boss : HT[x.tier] || 28) * (n > 1 ? 0.85 : 1), k = h / ih;
          const cx = s.x + (j - (n - 1) / 2) * gap, foot = s.y + 8 + (j % 2) * 3;
          g.globalAlpha = s.dim ? 0.35 : 1;
          g.save(); g.translate(cx, foot);
          g.drawImage(img, i * m.w, r * m.h, m.w, m.h, -((x0 + x1) / 2) * k, -y1 * k, m.w * k, m.h * k); g.restore();
        });
      }
      for (const s of b.list) if (s.done && skull.complete && skull.naturalWidth) { // a cleared node gets a big red skull, so you can see the road you've walked
        const sz = s.boss ? 40 : 30; g.globalAlpha = 0.95; g.drawImage(skull, s.x - sz / 2, s.y - (s.prop ? 24 : 20) - sz / 2, sz, sz);
      }
      g.globalAlpha = 1;
    }
  }
  return { decorate, has: (k) => !!ART[k] };
})();
