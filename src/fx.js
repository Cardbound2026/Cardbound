  // ---------- Fight effects (Nov 2): ink-style hit effects, spell projectiles and the move each hero makes, all driven by the engine's events.
  // cb.animQ: one entry per card a hero plays (who, card type, element, target). cb.fxQ: every hit (with element, crit, Block absorbed,
  // damage-over-time type), debuff applied, heal and Block gained. consume(cb) runs after each render: it picks the hero's move (swing, leap,
  // lunge, double strike, twirl, cast, empower, guard, dodge, parry, vanish...) and queues effects (slashes, stabs, smashes, claw marks,
  // fire, frost, shadow, holy, arcane, nature, poison, bleed, heals, Block, sparks...) drawn on one overlay canvas above the battlefield.
  // Every effect is drawn in code (no images): a heavy black outline under a coloured fill, cut-paper angles.
  // TO REMOVE: delete this file; render() skips it when window.CB_FX is missing.
  window.CB_FX = (function () {
    const INK = '#121918';
    const EL = { Physical: ['#f4ecdc', '#ffffff'], Fire: ['#ff7a1a', '#ffd23a'], Frost: ['#7fd3ff', '#e8fbff'], Shadow: ['#8a5cc8', '#2a1838'], Holy: ['#ffd86a', '#fff6c8'],
      Arcane: ['#c48bff', '#f0dcff'], Nature: ['#7fd36a', '#d9f7b0'] };
    const cv = document.createElement('canvas'); cv.id = 'fxLayer'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    const css = document.createElement('style'); css.textContent = `#fxLayer { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 40; }
      .fxshake { animation: fxshake .26s linear; } @keyframes fxshake { 0%,100% { transform: none; } 20% { transform: translate(-5px, 2px); } 40% { transform: translate(4px, -3px); } 60% { transform: translate(-3px, -1px); } 80% { transform: translate(2px, 2px); } }
      @media (prefers-reduced-motion: reduce) { #fxLayer { display: none; } .fxshake { animation: none; } }`;
    document.head.appendChild(css);
    const g = cv.getContext('2d'); let dpr = 1;
    function fit() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); }
    fit(); addEventListener('resize', fit);
    const live = []; // { kind, id | from/to, t0, ms, o }
    const now = () => performance.now();
    function add(kind, o, delay) { live.push({ kind, o: o || {}, t0: now() + (delay || 0), ms: (DRAW[kind] && DRAW[kind].ms) || 500 }); if (live.length > 140) live.splice(0, live.length - 140); }
    // where a fighter is on screen: centre of the figure, plus a size factor (1 = a 110 px tall figure)
    function spot(id, at) {
      const f = document.querySelector(`.unit[data-id="${id}"] .figure`); if (!f) return null; const r = f.getBoundingClientRect(); if (!r.width) return null;
      const side = f.closest('#foes') ? -1 : 1; return { x: r.left + r.width / 2, y: r.top + r.height * (at == null ? 0.48 : at), s: Math.max(0.55, Math.min(1.5, r.height / 110)), side, w: r.width, h: r.height, feet: r.bottom };
    }
    // ---------- ink drawing helpers
    const P2 = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
    function ink(path, fill, w, a) { g.save(); if (a != null) g.globalAlpha *= a; g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = w || 5; g.strokeStyle = INK; g.stroke(path); if (fill) { g.fillStyle = fill; g.fill(path); } g.restore(); }
    function inkLine(pts, col, w) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = w + 4; g.stroke(p); g.strokeStyle = col; g.lineWidth = w; g.stroke(p); g.restore(); }
    const fade = (u, a, b) => u < a ? 1 : u > b ? 0 : 1 - (u - a) / (b - a);
    const rnd = (seed) => { let r = seed >>> 0 || 1; return () => (r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 4294967296; };
    function crescent(x, y, R, ang, sweep, reveal, w, col) { // a tapered slash arc
      const n = 16, outer = [], inner = []; const end = Math.max(0.05, reveal);
      for (let i = 0; i <= n; i++) { const t = i / n * end, a = ang + sweep * t, th = Math.sin(Math.PI * Math.min(1, t / end)) * w; outer.push([x + Math.cos(a) * R, y + Math.sin(a) * R]); inner.push([x + Math.cos(a) * (R - th), y + Math.sin(a) * (R - th)]); }
      return P2(outer.concat(inner.reverse()));
    }
    function star(x, y, n, r0, r1, rot) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r0 : r1; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return P2(pts); }
    function flame(x, y, h, w, lean) { const p = new Path2D(); p.moveTo(x - w, y); p.quadraticCurveTo(x - w * 1.1, y - h * 0.45, x + lean, y - h); p.quadraticCurveTo(x + w * 0.9, y - h * 0.5, x + w, y); p.closePath(); return p; }
    function drop(x, y, r) { const p = new Path2D(); p.moveTo(x, y - r * 1.9); p.quadraticCurveTo(x + r * 1.1, y - r * 0.4, x + r, y + r * 0.2); p.arc(x, y + r * 0.2, r, 0, Math.PI); p.quadraticCurveTo(x - r * 1.1, y - r * 0.4, x, y - r * 1.9); return p; }
    const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); return p; };
    // ---------- the effects. Each: ms, and d(u 0..1, x, y, s, o) drawn at a fighter (or from/to for projectiles)
    const DRAW = {
      slash: { ms: 380, d(u, x, y, s, o) { const R = 46 * s, a = (o.ang || -2.4); g.globalAlpha = fade(u, 0.45, 1); ink(crescent(x + 6 * s, y + 4 * s, R, a, 2.1, Math.min(1, u * 2.6), 13 * s * (o.big ? 1.4 : 1), 0), o.col || '#f4ecdc', 5); } },
      claw: { ms: 380, d(u, x, y, s, o) { g.globalAlpha = fade(u, 0.45, 1); for (let i = -1; i <= 1; i++) ink(crescent(x + i * 13 * s, y + i * 4 * s, 38 * s, -2.1, 1.5, Math.min(1, u * 2.8 - (i + 1) * 0.12), 7 * s, 0), o.col || '#f4ecdc', 4); } },
      pierce: { ms: 320, d(u, x, y, s, o) { const L = 70 * s, k = Math.min(1, u * 3), dx = -L * 0.8 + L * 1.2 * k, a = 1 - fade(u, 0, 0.15) * 0 ; g.globalAlpha = fade(u, 0.5, 1);
        const sd = o.side || 1; ink(P2([[x - sd * (L - dx) , y - 3 * s], [x + sd * dx, y], [x - sd * (L - dx), y + 3 * s]]), o.col || '#f4ecdc', 4); if (k > 0.8) ink(star(x + sd * 8 * s, y, 4, 4 * s, 15 * s * (1 + u), 0.3), '#ffffff', 4); } },
      blunt: { ms: 360, d(u, x, y, s, o) { const k = Math.min(1, u * 4); g.globalAlpha = fade(u, 0.4, 1); ink(star(x, y, 8, 10 * s * k, 30 * s * k * (o.big ? 1.3 : 1), 0.2), o.col || '#f4ecdc', 5); ink(star(x, y, 6, 5 * s * k, 13 * s * k, 0.7), '#ffd86a', 3);
        g.save(); g.globalAlpha *= 0.8; g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.ellipse(x, y, 40 * s * u, 14 * s * u, 0, 0, Math.PI * 2); g.stroke(); g.restore(); } },
      crit: { ms: 420, d(u, x, y, s) { const k = Math.min(1, u * 3); g.globalAlpha = fade(u, 0.3, 1) * 0.95; ink(star(x, y, 12, 18 * s * k, 58 * s * k, u * 0.6), '#d8261c', 4); } },
      fire: { ms: 600, d(u, x, y, s, o) { const R = rnd(o.seed || 7), k = Math.min(1, u * 3); g.globalAlpha = fade(u, 0.5, 1);
        for (let i = 0; i < 7; i++) { const a = R() * Math.PI * 2, d = (8 + R() * 18) * s * k, fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.6 + 14 * s; const h = (24 + R() * 22) * s * k * (1 - u * 0.4);
          ink(flame(fx, fy, h, 7 * s, (R() - 0.5) * 10 * s), i % 2 ? '#ff7a1a' : '#ffb21a', 4); ink(flame(fx, fy, h * 0.55, 3.5 * s, 0), '#ffe27a', 3); }
        for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2, d = 30 * s * u + R() * 10 * s; ink(P2([[x + Math.cos(a) * d, y - 20 * s * u + Math.sin(a) * d], [x + Math.cos(a) * d + 3 * s, y - 20 * s * u + Math.sin(a) * d], [x + Math.cos(a) * d + 3 * s, y - 20 * s * u + Math.sin(a) * d + 3 * s]]), '#ffd23a', 2); } } },
      frost: { ms: 560, d(u, x, y, s) { const k = Math.min(1, u * 3.5); g.globalAlpha = fade(u, 0.5, 1);
        for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.3, L = (20 + (i % 3) * 9) * s * k; ink(P2([[x, y], [x + Math.cos(a + 0.18) * L * 0.4, y + Math.sin(a + 0.18) * L * 0.4], [x + Math.cos(a) * L, y + Math.sin(a) * L], [x + Math.cos(a - 0.18) * L * 0.4, y + Math.sin(a - 0.18) * L * 0.4]]), i % 2 ? '#bfe9ff' : '#7fd3ff', 3.5); }
        ink(star(x, y, 6, 5 * s, 11 * s, 0), '#e8fbff', 3); } },
      shadow: { ms: 620, d(u, x, y, s, o) { const R = rnd(o.seed || 3), k = Math.min(1, u * 2.5); g.globalAlpha = fade(u, 0.45, 1);
        ink(circ(x, y, 14 * s * k), '#2a1838', 4);
        for (let i = 0; i < 5; i++) { const a = R() * Math.PI * 2, L = 36 * s * k, c = a + (R() - 0.5) * 1.6; inkLine([[x, y], [x + Math.cos(c) * L * 0.55 + Math.cos(a + 1.4) * 8 * s, y + Math.sin(c) * L * 0.55 + Math.sin(a + 1.4) * 8 * s], [x + Math.cos(a) * L, y + Math.sin(a) * L]], '#8a5cc8', 4 * s * (1 - u * 0.6)); } } },
      holy: { ms: 620, d(u, x, y, s) { const k = Math.min(1, u * 3); g.globalAlpha = fade(u, 0.5, 1);
        ink(P2([[x - 9 * s, y - 140 * s], [x + 9 * s, y - 140 * s], [x + 13 * s * k, y + 12 * s], [x - 13 * s * k, y + 12 * s]]), '#fff1b0', 4, 0.85);
        ink(star(x, y, 8, 9 * s * k, 34 * s * k, 0.2), '#ffd86a', 4); ink(P2([[x - 3 * s, y - 15 * s], [x + 3 * s, y - 15 * s], [x + 3 * s, y - 3 * s], [x + 13 * s, y - 3 * s], [x + 13 * s, y + 3 * s], [x + 3 * s, y + 3 * s], [x + 3 * s, y + 17 * s], [x - 3 * s, y + 17 * s], [x - 3 * s, y + 3 * s], [x - 13 * s, y + 3 * s], [x - 13 * s, y - 3 * s], [x - 3 * s, y - 3 * s]]), '#fff6c8', 3); } },
      arcane: { ms: 600, d(u, x, y, s) { const k = Math.min(1, u * 3), R = 26 * s * k; g.globalAlpha = fade(u, 0.5, 1);
        g.save(); g.lineWidth = 8; g.strokeStyle = INK; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.stroke(); g.lineWidth = 3.5; g.strokeStyle = '#c48bff'; g.stroke(); g.restore();
        for (let i = 0; i < 6; i++) { const a = u * 3 + i * Math.PI / 3; ink(P2([[x + Math.cos(a) * R, y + Math.sin(a) * R - 5 * s], [x + Math.cos(a) * R + 4 * s, y + Math.sin(a) * R], [x + Math.cos(a) * R, y + Math.sin(a) * R + 5 * s], [x + Math.cos(a) * R - 4 * s, y + Math.sin(a) * R]]), '#f0dcff', 2.5); }
        ink(star(x, y, 4, 4 * s * k, 16 * s * k, u * 2), '#f0dcff', 3); } },
      nature: { ms: 560, d(u, x, y, s, o) { const R = rnd(o.seed || 5), k = Math.min(1, u * 3); g.globalAlpha = fade(u, 0.5, 1);
        for (let i = 0; i < 7; i++) { const a = R() * Math.PI * 2, L = (22 + R() * 14) * s * k; ink(P2([[x + Math.cos(a + 0.4) * 5 * s, y + Math.sin(a + 0.4) * 5 * s], [x + Math.cos(a) * L, y + Math.sin(a) * L], [x + Math.cos(a - 0.4) * 5 * s, y + Math.sin(a - 0.4) * 5 * s]]), i % 2 ? '#7fd36a' : '#4f8f3a', 3.5); }
        for (let i = 0; i < 3; i++) { const a = R() * Math.PI * 2, d = 30 * s * u; const lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d - 10 * s * u; const p = new Path2D(); p.ellipse(lx, ly, 6 * s, 3 * s, a, 0, Math.PI * 2); ink(p, '#a8e07a', 2.5); } } },
      bleed: { ms: 760, d(u, x, y, s, o) { const R = rnd(o.seed || 11); g.globalAlpha = fade(u, 0.6, 1); for (let i = 0; i < (o.n || 5); i++) { const ox = (R() - 0.5) * 34 * s, vy = (0.4 + R() * 0.6), t = Math.min(1, u * 1.4);
        ink(drop(x + ox, y - 6 * s + t * t * 46 * s * vy, (3 + R() * 2.5) * s), i % 2 ? '#c0262a' : '#e0383a', 3); } } },
      poison: { ms: 760, d(u, x, y, s, o) { const R = rnd(o.seed || 13); g.globalAlpha = fade(u, 0.55, 1); for (let i = 0; i < 6; i++) { const ox = (R() - 0.5) * 36 * s, sp = 0.5 + R() * 0.7, r = (3 + R() * 4) * s * (0.6 + u * 0.6);
        ink(circ(x + ox + Math.sin(u * 8 + i) * 3 * s, y + 14 * s - u * 46 * s * sp, r), i % 2 ? '#8fdc3a' : '#b9f06a', 3); } } },
      burn: { ms: 600, d(u, x, y, s, o) { const R = rnd(o.seed || 17); g.globalAlpha = fade(u, 0.5, 1); for (let i = 0; i < 4; i++) { const fx = x + (R() - 0.5) * 30 * s, h = (14 + R() * 12) * s * Math.min(1, u * 3) * (1 - u * 0.5);
        ink(flame(fx, y + 16 * s, h, 5 * s, (R() - 0.5) * 6 * s), '#ff7a1a', 3); ink(flame(fx, y + 16 * s, h * 0.5, 2.5 * s, 0), '#ffe27a', 2); } } },
      chill: { ms: 600, d(u, x, y, s) { g.globalAlpha = fade(u, 0.5, 1); const k = Math.min(1, u * 3); for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; inkLine([[x - Math.cos(a) * 14 * s * k, y - Math.sin(a) * 14 * s * k], [x + Math.cos(a) * 14 * s * k, y + Math.sin(a) * 14 * s * k]], '#bfe9ff', 3); } } },
      dread: { ms: 820, d(u, x, y, s) { g.globalAlpha = fade(u, 0.55, 1) * Math.min(1, u * 4); const yy = y - u * 40 * s, p = new Path2D();
        p.moveTo(x - 12 * s, yy + 14 * s); p.quadraticCurveTo(x - 14 * s, yy - 12 * s, x, yy - 14 * s); p.quadraticCurveTo(x + 14 * s, yy - 12 * s, x + 12 * s, yy + 14 * s); p.lineTo(x + 6 * s, yy + 8 * s); p.lineTo(x, yy + 14 * s); p.lineTo(x - 6 * s, yy + 8 * s); p.closePath();
        ink(p, '#5a3a86', 4); ink(circ(x - 5 * s, yy - 2 * s, 2.6 * s), '#e8d6ff', 2); ink(circ(x + 5 * s, yy - 2 * s, 2.6 * s), '#e8d6ff', 2); } },
      rot: { ms: 760, d(u, x, y, s, o) { const R = rnd(o.seed || 19); g.globalAlpha = fade(u, 0.55, 1); for (let i = 0; i < 5; i++) { const ox = (R() - 0.5) * 30 * s, t = Math.min(1, u * 1.3);
        ink(drop(x + ox, y - 10 * s + t * t * 36 * s, (2.5 + R() * 2) * s), i % 2 ? '#4a5a2a' : '#6b7a33', 3); } ink(circ(x, y - 6 * s, 9 * s * Math.min(1, u * 3)), '#3a4520', 3, 0.7); } },
      heal: { ms: 820, d(u, x, y, s, o) { const R = rnd(o.seed || 23); g.globalAlpha = fade(u, 0.55, 1); for (let i = 0; i < 5; i++) { const ox = (R() - 0.5) * 44 * s, yy = y + 18 * s - u * (36 + R() * 24) * s, c = (4 + R() * 2) * s;
        ink(P2([[ox + x - c * 0.35, yy - c], [ox + x + c * 0.35, yy - c], [ox + x + c * 0.35, yy - c * 0.35], [ox + x + c, yy - c * 0.35], [ox + x + c, yy + c * 0.35], [ox + x + c * 0.35, yy + c * 0.35], [ox + x + c * 0.35, yy + c], [ox + x - c * 0.35, yy + c], [ox + x - c * 0.35, yy + c * 0.35], [ox + x - c, yy + c * 0.35], [ox + x - c, yy - c * 0.35], [ox + x - c * 0.35, yy - c * 0.35]]), '#8fdc6a', 2.5); }
        g.save(); g.globalAlpha *= 0.6; g.lineWidth = 3; g.strokeStyle = '#8fdc6a'; g.beginPath(); g.ellipse(x, y + 30 * s, 34 * s * (0.6 + u * 0.5), 9 * s * (0.6 + u * 0.5), 0, 0, Math.PI * 2); g.stroke(); g.restore(); } },
      block: { ms: 560, d(u, x, y, s, o) { const k = 0.6 + Math.min(1, u * 3) * 0.5, r = 30 * s * k; g.globalAlpha = fade(u, 0.45, 1); const pts = []; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.15]); }
        g.save(); const p = P2(pts); g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = INK; g.stroke(p); g.lineWidth = 4; g.strokeStyle = o.col || '#9fc4ff'; g.stroke(p); g.globalAlpha *= 0.2; g.fillStyle = o.col || '#9fc4ff'; g.fill(p); g.restore(); } },
      clank: { ms: 340, d(u, x, y, s, o) { g.globalAlpha = fade(u, 0.4, 1); const k = Math.min(1, u * 4), sd = o.side || 1; for (let i = 0; i < 6; i++) { const a = (sd > 0 ? Math.PI : 0) + (i - 2.5) * 0.35; inkLine([[x + Math.cos(a) * 10 * s * k, y + Math.sin(a) * 10 * s * k], [x + Math.cos(a) * 32 * s * k, y + Math.sin(a) * 32 * s * k]], '#fff6c8', 2.5); }
        ink(star(x, y, 4, 4 * s, 14 * s * k, 0.4), '#ffffff', 3); } },
      whoosh: { ms: 380, d(u, x, y, s, o) { g.globalAlpha = fade(u, 0.3, 1) * 0.9; const sd = o.side || 1; for (let i = 0; i < 3; i++) { const yy = y - 18 * s + i * 16 * s, L = 40 * s * Math.min(1, u * 3); inkLine([[x + sd * 10 * s, yy], [x + sd * (10 * s + L), yy]], '#e8dcc6', 2.5); } } },
      shimmer: { ms: 520, d(u, x, y, s, o) { g.globalAlpha = fade(u, 0.4, 1); g.save(); g.lineWidth = 8; g.strokeStyle = INK; g.beginPath(); g.ellipse(x, y, 34 * s * (0.8 + u * 0.4), 46 * s * (0.8 + u * 0.4), 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 3.5; g.strokeStyle = o.col || '#c48bff'; g.stroke(); g.restore(); } },
      dust: { ms: 520, d(u, x, y, s) { const R = rnd(29); g.globalAlpha = fade(u, 0.35, 1); g.save(); g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.ellipse(x, y, 60 * s * Math.min(1, u * 2.5), 12 * s * Math.min(1, u * 2.5), 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#c9b48a'; g.stroke(); g.restore();
        for (let i = 0; i < 6; i++) { const a = Math.PI + R() * Math.PI, d = 50 * s * u; ink(P2([[x + Math.cos(a) * d, y + Math.sin(a) * d * 0.5 - 12 * s * Math.sin(u * Math.PI)], [x + Math.cos(a) * d + 5 * s, y + Math.sin(a) * d * 0.5 - 12 * s * Math.sin(u * Math.PI)], [x + Math.cos(a) * d + 2 * s, y + Math.sin(a) * d * 0.5 - 12 * s * Math.sin(u * Math.PI) - 5 * s]]), '#8a7a5a', 2); } } },
      aura: { ms: 760, d(u, x, y, s, o) { g.globalAlpha = fade(u, 0.5, 1); const c = o.col || '#ffd86a'; for (let i = 0; i < 2; i++) { const v = Math.min(1, u * 1.6 - i * 0.25); if (v <= 0) continue; g.save(); g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.ellipse(x, y + 34 * s - v * 50 * s, 34 * s, 9 * s, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 3; g.strokeStyle = c; g.stroke(); g.restore(); }
        const R = rnd(31); for (let i = 0; i < 5; i++) ink(star(x + (R() - 0.5) * 50 * s, y + 20 * s - u * (40 + R() * 30) * s, 4, 2 * s, 7 * s, u * 3), c, 2.5); } },
      smoke: { ms: 620, d(u, x, y, s) { const R = rnd(37); g.globalAlpha = fade(u, 0.3, 1) * 0.9; for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2, d = 22 * s * u + R() * 8 * s; ink(circ(x + Math.cos(a) * d, y + 10 * s + Math.sin(a) * d * 0.6, (8 + R() * 8) * s * (0.5 + u * 0.7)), i % 2 ? '#5a5650' : '#7a766e', 3); } } },
      // projectiles: o.from / o.to are fighter ids; drawn along the line, then the impact effect takes over
      bolt: { ms: 240, d(u, x, y, s, o) { const a = spot(o.from, 0.4), b = spot(o.to); if (!a || !b) return; const sx = a.x + a.side * a.w * 0.35, px = sx + (b.x - sx) * u, py = a.y + (b.y - a.y) * u - Math.sin(u * Math.PI) * 24 * a.s, ss = a.s;
        const ang = Math.atan2(b.y - a.y, b.x - sx), back = (k) => [px - Math.cos(ang) * k * ss, py - Math.sin(ang) * k * ss], col = EL[o.el] || EL.Physical;
        if (o.el === 'Fire') { for (let i = 3; i >= 1; i--) ink(circ(...back(i * 9), (9 - i * 2) * ss), i % 2 ? '#ff7a1a' : '#ffb21a', 3, 0.9); ink(circ(px, py, 11 * ss), '#ff7a1a', 4); ink(circ(px + 2 * ss, py - 2 * ss, 5.5 * ss), '#ffe27a', 2); }
        else if (o.el === 'Frost') { const L = 30 * ss; ink(P2([[px + Math.cos(ang) * L * 0.5, py + Math.sin(ang) * L * 0.5], [px + Math.cos(ang + 2.6) * 8 * ss, py + Math.sin(ang + 2.6) * 8 * ss], [...back(L * 0.9 / ss)], [px + Math.cos(ang - 2.6) * 8 * ss, py + Math.sin(ang - 2.6) * 8 * ss]]), '#bfe9ff', 4); }
        else if (o.el === 'Shadow') { for (let i = 1; i <= 3; i++) inkLine([back(i * 10 - 6), back(i * 10 + 4)], '#8a5cc8', 3); ink(circ(px, py, 10 * ss), '#2a1838', 4); ink(circ(px, py, 4 * ss), '#c9a6ff', 2); }
        else if (o.el === 'Holy') { inkLine([back(34), [px, py]], '#ffd86a', 6 * ss); ink(star(px, py, 4, 4 * ss, 13 * ss, 0.4), '#fff6c8', 3); }
        else if (o.el === 'Arcane') { ink(star(px, py, 5, 5 * ss, 13 * ss, u * 9), '#c48bff', 3.5); for (let i = 1; i <= 3; i++) ink(star(...back(i * 11), 4, 1.5 * ss, 5 * ss, u * 5 + i), '#f0dcff', 2); }
        else if (o.el === 'Nature') { ink(P2([[px + Math.cos(ang) * 14 * ss, py + Math.sin(ang) * 14 * ss], [px + Math.cos(ang + 2.2) * 7 * ss, py + Math.sin(ang + 2.2) * 7 * ss], [...back(16)], [px + Math.cos(ang - 2.2) * 7 * ss, py + Math.sin(ang - 2.2) * 7 * ss]]), '#7fd36a', 3.5); }
        else if (o.star) { ink(star(px, py, 4, 3.5 * ss, 12 * ss, u * 14), '#c9c2b2', 3); }
        else ink(circ(px, py, 7 * ss), col[0], 3.5); } },
    };
    // ---------- what the engine's events look like
    const ELEM = (d) => d === 'Fire' ? 'fire' : d === 'Frost' ? 'frost' : d === 'Shadow' ? 'shadow' : d === 'Holy' ? 'holy' : d === 'Arcane' ? 'arcane' : d === 'Nature' ? 'nature' : null;
    const DOT = { bleed: 'bleed', poison: 'poison', burn: 'burn', dread: 'dread', rot: 'rot', chill: 'chill' };
    const DEF_FX = { Rogue: 'dodge', Warrior: 'parry', Paladin: 'block', Mage: 'barrier', Warlock: 'absorb' };
    let lastStealth = {};
    function consume(cb) {
      if (!cb) return; const F = window.CB_FORGE;
      // persistent looks: Stealth (see-through) and fallen heroes
      if (F) { const st = {}; for (const a of cb.players) st[a.id] = { stealth: !!a.stealth && a.hp > 0, dead: a.hp <= 0 }; F.setStates(st); }
      const cards = (cb.animQ || []).splice(0), evs = (cb.fxQ || []).splice(0);
      const hitsBy = {}; for (const e of evs) if (e.t === 'hit' && !e.dot && e.s) hitsBy[e.s] = (hitsBy[e.s] || 0) + 1;
      const blocksBy = {}; for (const e of evs) if (e.t === 'block') blocksBy[e.d] = (blocksBy[e.d] || 0) + 1;
      const proj = {}; // the caster's projectile flight, so impacts wait for it
      for (const q of cards) {
        const a = cb.actorById(q.id); if (!a) continue; let move;
        if (q.type === 'Attack') {
          const two = F && F.twoHanded(a), wk = F ? F.weaponKind(a) : 'slash';
          move = q.aoe ? 'twirl' : (hitsBy[q.id] || 0) >= 2 && !two ? 'double' : two && q.cost >= 20 ? 'leap' : wk === 'pierce' ? 'lunge' : two ? 'heavy' : 'attack';
          if (q.aoe) add('slash', { id: q.id, ang: -0.6, big: true, col: '#e8d6a8', at: 0.55, self: true }, 120);
        } else if (q.type === 'Power') { move = 'empower'; add('aura', { id: q.id, col: (EL[q.dtype] || EL.Holy)[0] }); }
        else if (a.stealth && !lastStealth[a.id]) { move = 'vanish'; add('smoke', { id: q.id }); }
        else if (q.dmg || q.heal) {
          move = 'cast'; const el = q.dtype || 'Physical';
          if (q.dmg && q.tgt && !q.aoe && cb.actorById(q.tgt) && !cb.actorById(q.tgt).isPlayer) { add('bolt', { from: q.id, to: q.tgt, el, star: /shuriken|star|knife/.test(q.card || '') }, 160); proj[q.id] = 400; }
          else if (q.dmg && q.aoe) proj[q.id] = 200;
        } else if (q.def) move = (blocksBy[q.id] || 0) >= 2 ? 'guard2' : 'guard';
        else move = 'cast';
        if (F && move) F.play(q.id, move);
      }
      for (const a of cb.players) lastStealth[a.id] = !!a.stealth;
      // the hits, heals, Block and debuffs
      const nth = {}, lunged = {};
      for (const e of evs) {
        if (e.t === 'hit') {
          const src = e.s && cb.actorById(e.s), tgt = cb.actorById(e.d); if (!tgt) continue;
          if (e.dot) { add(DOT[e.dot] || 'bleed', { id: e.d, seed: Math.random() * 1e9 }); continue; }
          const k = (e.s || '') + '>' + e.d, i = nth[k] = (nth[k] || 0) + 1, delay = (proj[e.s] || (src && src.isPlayer ? 130 : 160)) + (i - 1) * 150;
          if (src && !src.isPlayer && F && !lunged[src.id]) { lunged[src.id] = true; F.play(src.id, 'elunge'); }
          const side = tgt.isPlayer ? -1 : 1;
          if (!(e.lost > 0) && e.abs > 0) { // fully stopped: dodge, parry, block, barrier or absorb
            const how = tgt.isPlayer ? DEF_FX[tgt.cls] : 'block';
            if (how === 'dodge') { if (F) F.play(e.d, 'dodge'); add('whoosh', { id: e.d, side: -side }, delay); }
            else if (how === 'barrier' || how === 'absorb') { add('shimmer', { id: e.d, col: how === 'barrier' ? '#9fc4ff' : '#8a5cc8' }, delay); if (F) F.play(e.d, 'guard'); }
            else { add('clank', { id: e.d, side }, delay); if (F && tgt.isPlayer) F.play(e.d, how === 'parry' ? 'parry' : 'guard'); else if (F) F.play(e.d, 'ehit'); }
            continue;
          }
          // the impact: by element, else by the weapon (heroes) or the creature (monsters)
          let fx = ELEM(e.dtype);
          if (!fx) { if (src && src.isPlayer) fx = e.kind === 'Skill' ? 'blunt' : (F ? F.weaponKind(src) : 'slash'); else fx = src && /beast|Beast/.test(src.creature || '') ? 'claw' : 'slash'; }
          const big = !!e.crit || e.lost >= tgt.maxHp * 0.2;
          add(fx, { id: e.d, ang: -2.4 + (i - 1) * 0.9 * (i % 2 ? 1 : -1), big, side, seed: Math.random() * 1e9 }, delay);
          if (e.crit) { add('crit', { id: e.d }, delay); setTimeout(() => { const st = document.querySelector('#scrCombat .stage') || document.getElementById('scrCombat'); if (st) { st.classList.remove('fxshake'); void st.offsetWidth; st.classList.add('fxshake'); } }, delay); }
          if (F) setTimeout(() => F.play(e.d, tgt.isPlayer ? (big ? 'knock' : 'hit') : (big ? 'eknock' : 'ehit')), delay);
        } else if (e.t === 'apply') { add(DOT[e.key] || 'bleed', { id: e.d, n: 4, seed: Math.random() * 1e9 }, 260); }
        else if (e.t === 'heal') add('heal', { id: e.d, seed: Math.random() * 1e9 });
        else if (e.t === 'block') add('block', { id: e.d, col: (cb.actorById(e.d) || {}).cls === 'Mage' ? '#bcd8ff' : (cb.actorById(e.d) || {}).cls === 'Warlock' ? '#b49ae0' : '#9fc4ff' });
      }
      // a leap landing kicks up dust
      if (F) for (const v of F.events.splice(0)) if (v.ev === 'land') add('dust', { id: v.id, feet: true });
    }
    // ---------- the overlay loop
    function frame(t) {
      requestAnimationFrame(frame);
      if (!live.length) { if (cv._dirty) { g.clearRect(0, 0, cv.width, cv.height); cv._dirty = false; } return; }
      if (window.CB_FORGE) for (const v of CB_FORGE.events.splice(0)) if (v.ev === 'land') add('dust', { id: v.id, feet: true });
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(dpr, 0, 0, dpr, 0, 0); cv._dirty = true;
      for (let i = live.length - 1; i >= 0; i--) {
        const L = live[i], u = (t - L.t0) / L.ms; if (u < 0) continue; if (u >= 1) { live.splice(i, 1); if (L.kind === 'bolt' && L.o.then) add(L.o.then.kind, L.o.then.o); continue; }
        const D = DRAW[L.kind]; if (!D) { live.splice(i, 1); continue; }
        let x = 0, y = 0, s = 1;
        if (L.kind !== 'bolt') { const p = spot(L.o.id, L.o.at); if (!p) continue; x = p.x; y = L.o.feet ? p.feet - 4 : p.y; s = p.s; if (L.o.self) x += p.side * p.w * 0.15; }
        g.save(); g.globalAlpha = 1; try { D.d(u, x, y, s, L.o); } catch (err) { live.splice(i, 1); } g.restore();
      }
    }
    requestAnimationFrame(frame);
    function clear() { live.length = 0; lastStealth = {}; }
    return { consume, add, clear, DRAW, spot };
  })();
