  // ---------- Fight effects (Nov 2): ink-style hit effects, spell projectiles and the move each hero makes, all driven by the engine's events.
  // cb.animQ: one entry per card a hero plays (who, card type, element, target). cb.fxQ: every hit (with element, crit, Block absorbed,
  // damage-over-time type), debuff applied, heal and Block gained. consume(cb) runs after each render: it picks the hero's move (swing, leap,
  // lunge, double strike, twirl, cast, empower, guard, dodge, parry, vanish...) and queues effects (slashes, stabs, smashes, claw marks,
  // fire, frost, shadow, holy, arcane, nature, poison, bleed, heals, Block, sparks...) drawn on one overlay canvas above the battlefield.
  // Every effect is drawn in code (no images) as cut paper, the way the heroes are drawn: shaded pieces, sharp ink outlines, muted colours.
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
    function add(kind, o, delay) { o = o || {}; if (window.CB_FXPICK && !o.raw) { const v = CB_FXPICK(kind, o, delay); if (v && DRAW[v]) kind = v; } try { if (window.CB_AUDIO) CB_AUDIO.fx(o.snd || kind, delay); } catch (e) {} live.push({ kind, o: o || {}, t0: now() + (delay || 0), ms: (DRAW[kind] && DRAW[kind].ms) || 500 }); if (live.length > 140) live.splice(0, live.length - 140); }
    // where a fighter is on screen: centre of the figure, plus a size factor (1 = a 110 px tall figure)
    function spot(id, at) {
      const f = document.querySelector(`.unit[data-id="${id}"] .figure`); if (!f) return null; const r = f.getBoundingClientRect(); if (!r.width) return null;
      const side = f.closest('#foes') ? -1 : 1; return { x: r.left + r.width / 2, y: r.top + r.height * (at == null ? 0.48 : at), s: Math.max(0.55, Math.min(1.5, r.height / 110)), side, w: r.width, h: r.height, feet: r.bottom };
    }
    // ---------- cut-paper drawing (Nov 2, second pass): every effect is built from paper pieces drawn the way PAPERFORGE draws the heroes:
    // a base colour, a mid-tone plane and a near-black shadow mass on the side away from the light (light from the upper left), a pale
    // edge where the light hits, a sharp mitered ink outline, a few scratch marks, and a soft paper shadow under the piece. Colours are the
    // characters' muted, warm palette. Pieces stamp in, then tumble and fall like scraps instead of glowing and fading.
    const DARK = '#0b0e0f';
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
    // palettes: [base, light] (the shadow is mixed toward ink like the heroes' cloth and metal)
    const PAL = { paper: ['#cdbd9c', '#ece0c4'], steel: ['#9aa09a', '#d8d8cc'], iron: ['#7d837f', '#c4c6bc'], blood: ['#8a2c25', '#c0624c'], rust: ['#8e4a32', '#c98a5a'],
      fire: ['#c66e2c', '#ecc074'], ember: ['#8c3a20', '#d9874a'], flame: ['#e0a548', '#f4dc9a'], frost: ['#86aab8', '#dbe8e2'], ice: ['#a9c7cf', '#eef4ee'],
      shadow: ['#55456c', '#9d88b8'], void: ['#2c2438', '#6a5888'], holy: ['#c49a48', '#efdca4'], gold: ['#b88a3a', '#e8cf8e'], arcane: ['#7e6098', '#c9b2dc'],
      nature: ['#66813f', '#b6c784'], thorn: ['#5a5232', '#a39466'], poison: ['#76913a', '#c2d07c'], rot: ['#4c5530', '#8c955a'], heal: ['#6f9450', '#bfd697'],
      block: ['#7f8c98', '#cdd6d8'], ward: ['#7a8cb0', '#c8d4e8'], absorb: ['#5e4a7c', '#a996c4'], dust: ['#8a7a5c', '#c4b48e'], smoke: ['#6c6862', '#aca69a'] };
    const shadeOf = (c) => mix(c, DARK, 0.78), midOf = (c) => mix(c, shadeOf(c), 0.39);
    const rnd = (seed) => { let r = (seed >>> 0) || 1; return () => (r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 4294967296; };
    const fade = (u, a, b) => u < a ? 1 : u > b ? 0 : 1 - (u - a) / (b - a);
    const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
    const pop = (u, at) => { const t = Math.min(1, u / (at || 0.18)); return t < 1 ? 0.55 + 0.6 * Math.sin(t * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) : 1; }; // a stamp-in with a little overshoot
    // one paper piece: local points (around 0,0), placed at x,y, rotated, scaled
    function piece(pts, x, y, rot, sc, pal, o) {
      o = o || {}; if (sc <= 0.01) return; const base = pal[0], light = pal[1], shade = shadeOf(base), mid = midOf(base);
      g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(sc, sc);
      const p = new Path2D(); pts.forEach(([px, py], i) => i ? p.lineTo(px, py) : p.moveTo(px, py)); p.closePath();
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [px, py] of pts) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
      const w = x1 - x0, h = y1 - y0;
      g.save(); g.translate(1.6 / sc, 2.4 / sc); g.fillStyle = 'rgba(8,10,10,.32)'; g.fill(p); g.restore(); // the paper's shadow on what's behind it
      g.fillStyle = base; g.fill(p);
      g.save(); g.clip(p);
      // the light plane (upper left), the halftone band and the connected shadow mass (lower right), as PAPERFORGE splits its cloth and metal
      g.fillStyle = light; g.beginPath(); g.moveTo(x0 - 2, y0 - 2); g.lineTo(x0 + w * 0.42, y0 - 2); g.lineTo(x0 - 2, y0 + h * 0.46); g.closePath(); g.fill();
      g.fillStyle = mid; g.beginPath(); g.moveTo(x0 + w * 0.3, y0 - 2); g.lineTo(x0 + w * 0.74, y0 - 2); g.lineTo(x0 + w * 0.86, y0 + h * 0.4); g.lineTo(x0 + w * 0.44, y0 + h * 0.86); g.lineTo(x0 + w * 0.16, y0 + h + 3); g.lineTo(x0 + w * 0.38, y0 + h * 0.44); g.closePath(); g.fill();
      if (!o.flat) { g.fillStyle = shade; g.beginPath(); g.moveTo(x0 + w * 0.66, y0 - 3); g.lineTo(x1 + 3, y0 - 3); g.lineTo(x1 + 3, y1 + 3); g.lineTo(x0 + w * 0.12, y1 + 3); g.lineTo(x0 + w * 0.4, y0 + h * 0.72); g.lineTo(x0 + w * 0.68, y0 + h * 0.48); g.closePath(); g.fill(); }
      if (o.scratch !== false && w * sc > 14) { const R = rnd(Math.round(x0 * 7 + y1 * 13 + w)); g.strokeStyle = light; g.globalAlpha *= 0.45; g.lineWidth = 0.8 / sc; for (let i = 0; i < 3; i++) { const sx = x0 + R() * w * 0.6, sy = y0 + R() * h * 0.7; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (2 + R() * 4) / sc, sy - (1 + R() * 3) / sc); g.stroke(); } }
      g.restore();
      g.lineJoin = 'miter'; g.miterLimit = 2.2; g.lineCap = 'butt'; g.lineWidth = (o.lw || 2.3) / sc; g.strokeStyle = DARK; g.stroke(p);
      if (o.vein) { g.lineWidth = 1.1 / sc; g.beginPath(); o.vein.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); }
      g.restore();
    }
    // an ink line (cut mark, crack, speed line)
    function cut(pts, w, col) { g.save(); g.lineJoin = 'miter'; g.lineCap = 'butt'; g.strokeStyle = DARK; g.lineWidth = w + 2.2; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); if (col) { g.strokeStyle = col; g.lineWidth = w; g.stroke(); } g.restore(); }
    // ---------- shapes (local coordinates)
    const SH = {
      shard: (R, k) => { const n = 3 + Math.floor(R() * 2), pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + R() * 0.8, r = k * (0.55 + R() * 0.6); pts.push([Math.cos(a) * r, Math.sin(a) * r]); } return pts; },
      burst: (R, n, r0, r1) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n + (R() - 0.5) * 0.35, r = i % 2 ? r0 * (0.8 + R() * 0.4) : r1 * (0.7 + R() * 0.5); pts.push([Math.cos(a) * r, Math.sin(a) * r]); } return pts; },
      blade: (L, W, bend) => { const pts = [], back = []; for (let i = 0; i <= 8; i++) { const t = i / 8, x = -L / 2 + L * t, y = -Math.sin(t * Math.PI) * bend, th = Math.sin(t * Math.PI) * W; pts.push([x, y - th / 2]); back.unshift([x + (i === 0 || i === 8 ? 0 : 2), y + th / 2]); } return pts.concat(back); },
      flame: (R, h, w) => { const pts = [[-w, 0]]; const n = 3; for (let i = 1; i <= n; i++) pts.push([-w + (w * 0.8) * i / n + (R() - 0.5) * w * 0.3, -h * i / (n + 1) * (0.8 + R() * 0.3)], [-w + (w * 0.8) * i / n - w * 0.25, -h * i / (n + 1) + h * 0.12]); pts.push([R() * w * 0.3 - w * 0.1, -h]); for (let i = n; i >= 1; i--) pts.push([w - (w * 0.8) * i / n + w * 0.2, -h * i / (n + 1) + h * 0.1], [w - (w * 0.8) * i / n + (R() - 0.5) * w * 0.3, -h * i / (n + 1) * (0.85 + R() * 0.25)]); pts.push([w, 0], [w * 0.4, h * 0.18], [-w * 0.4, h * 0.18]); return pts; },
      drop: (r) => [[0, -r * 2.1], [r * 0.55, -r * 0.9], [r, 0], [r * 0.7, r * 0.75], [0, r], [-r * 0.7, r * 0.75], [-r, 0], [-r * 0.55, -r * 0.9]],
      poly: (n, r, R) => { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (R ? R() * 0.3 : 0); pts.push([Math.cos(a) * r, Math.sin(a) * r]); } return pts; },
      cross: (c) => { const t = c * 0.36; return [[-t, -c], [t, -c], [t, -t], [c, -t], [c, t], [t, t], [t, c], [-t, c], [-t, t], [-c, t], [-c, -t], [-t, -t]]; },
      shield: (w, h) => [[-w, -h], [w, -h], [w * 0.98, -h * 0.1], [w * 0.7, h * 0.55], [0, h], [-w * 0.7, h * 0.55], [-w * 0.98, -h * 0.1]],
      spike: (L, W) => [[0, -W], [L, 0], [0, W], [-L * 0.15, 0]],
      leaf: (L, W) => [[-L * 0.5, 0], [-L * 0.1, -W], [L * 0.5, -W * 0.2], [L * 0.55, 0], [L * 0.5, W * 0.2], [-L * 0.1, W]],
      star4: (r0, r1) => [[0, -r1], [r0, -r0], [r1, 0], [r0, r0], [0, r1], [-r0, r0], [-r1, 0], [-r0, -r0]],
      ribbon: (R, L, W) => { const top = [], bot = []; for (let i = 0; i <= 6; i++) { const t = i / 6, x = L * t, y = Math.sin(t * 5 + R() * 2) * W * 1.6, th = W * (1 - t * 0.85); top.push([x, y - th]); bot.unshift([x, y + th]); } return top.concat(bot); },
      seg: (r0, r1, a0, a1) => { const pts = [], n = 4; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([Math.cos(a) * r1, Math.sin(a) * r1]); } for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; pts.push([Math.cos(a) * r0, Math.sin(a) * r0]); } return pts; },
      cloud: (R, r) => { const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = r * (i % 2 ? 0.72 + R() * 0.15 : 0.95 + R() * 0.2); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.8]); } return pts; },
    };
    // scraps: n paper bits flying out from (x,y), falling with gravity and tumbling
    function scraps(u, x, y, s, R, n, pal, size, speed, up) {
      for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, v = (speed || 40) * (0.5 + R() * 0.7) * s, t = easeOut(u * 1.3), k = (size || 4) * (0.6 + R() * 0.7) * s, sh = SH.shard(R, 1);
        piece(sh, x + Math.cos(a) * v * t, y + Math.sin(a) * v * t * 0.7 - (up || 10) * s * Math.sin(Math.min(1, u * 1.6) * Math.PI) + 34 * s * u * u, a + u * (R() - 0.5) * 9, k, pal, { lw: 1.6, scratch: false }); }
    }
    const DRAW = {
      slash: { ms: 430, d(u, x, y, s, o) { const R = rnd(o.seed || 1), ang = (o.ang != null ? o.ang : -2.4) + 1.9, big = o.big ? 1.35 : 1, L = 92 * s * big, wipe = Math.min(1, u * 3.2);
        g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.rect(-L * 0.6, -40 * s, L * 1.2 * wipe, 80 * s); g.clip(); // the cut opens along its length
        piece(SH.blade(L, 11 * s * big, 16 * s), 0, 0, 0, 1, PAL.paper, { lw: 2.4 }); g.restore();
        if (u > 0.2) { g.globalAlpha = fade(u, 0.55, 1); scraps((u - 0.2) / 0.8, x + Math.cos(ang) * L * 0.25, y + Math.sin(ang) * L * 0.25, s, R, o.big ? 5 : 3, PAL.paper, 4, 34, 8); }
        g.globalAlpha = fade(u, 0.5, 0.9); } },
      claw: { ms: 440, d(u, x, y, s, o) { const R = rnd(o.seed || 2), wipe = Math.min(1, u * 3);
        for (let i = -1; i <= 1; i++) { g.save(); g.translate(x + i * 14 * s, y + i * 5 * s); g.rotate(-0.95); g.beginPath(); g.rect(-50 * s, -20 * s, 100 * s * Math.min(1, wipe - (i + 1) * 0.08), 40 * s); g.clip(); piece(SH.blade(64 * s, 8 * s, 6 * s), 0, 0, 0, 1, PAL.blood, { lw: 2.2 }); g.restore(); }
        if (u > 0.25) scraps((u - 0.25) / 0.75, x, y, s, R, 3, PAL.blood, 3.5, 30, 6); } },
      pierce: { ms: 380, d(u, x, y, s, o) { const R = rnd(o.seed || 3), sd = o.side || 1, k = easeOut(u * 2.6), L = 70 * s;
        g.globalAlpha = fade(u, 0.55, 1); piece(SH.spike(L, 6 * s), x - sd * L * (1 - k) * 0.9 - sd * L * 0.5, y, sd > 0 ? 0 : Math.PI, 1, PAL.steel, { lw: 2.2 });
        if (k > 0.75) { const b = pop(u - 0.25, 0.15); piece(SH.burst(R, 5, 6 * s, 20 * s), x + sd * 6 * s, y, 0.3, b, PAL.paper, { lw: 2.2 }); scraps(Math.max(0, u - 0.3) / 0.7, x, y, s, R, 3, PAL.paper, 3.5, 30, 6); } } },
      blunt: { ms: 440, d(u, x, y, s, o) { const R = rnd(o.seed || 4), b = pop(u, 0.16) * (o.big ? 1.3 : 1); g.globalAlpha = fade(u, 0.45, 0.95);
        piece(SH.burst(R, 7, 13 * s, 30 * s), x, y, R() * 0.6, b, PAL.paper, { lw: 2.6 }); piece(SH.burst(R, 5, 5 * s, 13 * s), x - 2 * s, y - 2 * s, R(), b, PAL.gold, { lw: 1.8, scratch: false });
        for (let i = 0; i < 3; i++) { const a = R() * Math.PI * 2, l1 = 26 * s * b, l2 = (42 + R() * 12) * s * b; cut([[x + Math.cos(a) * l1, y + Math.sin(a) * l1], [x + Math.cos(a + 0.1) * (l1 + l2) / 2, y + Math.sin(a + 0.1) * (l1 + l2) / 2], [x + Math.cos(a) * l2, y + Math.sin(a) * l2]], 1.2, null); }
        if (u > 0.2) scraps((u - 0.2) / 0.8, x, y, s, R, 4, PAL.dust, 4, 40, 12); } },
      crit: { ms: 520, d(u, x, y, s, o) { const R = rnd(o.seed || 5), b = pop(u, 0.14); // a torn rust-red scrap behind the hit, ink wedges and flecks: weight, not glow
        g.globalAlpha = fade(u, 0.4, 0.95);
        piece(SH.burst(R, 9, 18 * s, 40 * s), x, y, R() * 0.4, b, PAL.rust, { lw: 2.6 });
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + R() * 0.4, r0 = 38 * s * b, r1 = (56 + R() * 14) * s * b; g.save(); g.fillStyle = DARK; g.beginPath(); g.moveTo(x + Math.cos(a - 0.06) * r0, y + Math.sin(a - 0.06) * r0); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.lineTo(x + Math.cos(a + 0.06) * r0, y + Math.sin(a + 0.06) * r0); g.fill(); g.restore(); }
        scraps(u, x, y, s, R, 5, PAL.rust, 4.5, 56, 14); } },
      fire: { ms: 680, d(u, x, y, s, o) { const R = rnd(o.seed || 6), g0 = Math.min(1, u * 3.2), shrink = 1 - Math.max(0, u - 0.5) * 1.6; g.globalAlpha = fade(u, 0.6, 1);
        const tongues = [[-16, 0.75, PAL.ember], [14, 0.8, PAL.ember], [-6, 1.1, PAL.fire], [8, 1, PAL.fire], [0, 0.7, PAL.flame]];
        for (const [dx, hk, pal] of tongues) { const flick = Math.sin(u * 20 + dx) * 0.06; piece(SH.flame(R, 46 * s * hk, 11 * s), x + dx * s, y + 22 * s, flick, g0 * Math.max(0.05, shrink), pal, { lw: 2.3 }); }
        for (let i = 0; i < 5; i++) { const ex = x + (R() - 0.5) * 50 * s, ey = y + 10 * s - u * (50 + R() * 30) * s; piece(SH.poly(4, 2.6 * s), ex, ey, u * 6 + i, 1, PAL.flame, { lw: 1.4, scratch: false }); } } },
      frost: { ms: 620, d(u, x, y, s, o) { const R = rnd(o.seed || 7), k = easeOut(u * 3); g.globalAlpha = fade(u, 0.55, 1);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.25 + (R() - 0.5) * 0.3, L = (26 + R() * 16) * s; // faceted crystals, light on one face
          piece([[0, -5 * s], [L * 0.55, -7 * s], [L, 0], [L * 0.55, 7 * s], [0, 5 * s]], x, y, a, k, i % 2 ? PAL.ice : PAL.frost, { lw: 2.1, vein: [[0, 0], [L, 0]] }); }
        piece(SH.poly(6, 9 * s), x, y, 0, k, PAL.ice, { lw: 2 }); if (u > 0.4) scraps((u - 0.4) / 0.6, x, y, s, R, 4, PAL.ice, 3, 34, 4); } },
      shadow: { ms: 680, d(u, x, y, s, o) { const R = rnd(o.seed || 8), k = easeOut(u * 2.4); g.globalAlpha = fade(u, 0.5, 1);
        for (let i = 0; i < 5; i++) { const a = R() * Math.PI * 2; piece(SH.ribbon(R, 42 * s * k + 1, 5 * s), x, y, a, 1, i % 2 ? PAL.shadow : PAL.void, { lw: 2 }); }
        piece(SH.poly(7, 13 * s, R), x, y, u * 2, pop(u, 0.2), PAL.void, { lw: 2.4 }); piece(SH.poly(5, 4 * s), x - 3 * s, y - 2 * s, 0, k, ['#c9b6e0', '#efe4f8'], { lw: 1.4, flat: true, scratch: false }); } },
      holy: { ms: 680, d(u, x, y, s, o) { const R = rnd(o.seed || 9), k = easeOut(u * 3); g.globalAlpha = fade(u, 0.55, 1);
        for (let i = -1; i <= 1; i++) { const H = (i ? 52 : 74) * s * easeOut(u * 2.4); piece([[-3.5 * s, -H], [3.5 * s, -H], [8 * s, 6 * s], [-8 * s, 6 * s]], x + i * 15 * s, y - 6 * s, i * 0.16, 1, i ? PAL.gold : PAL.holy, { lw: 1.9, flat: !!i }); } // short shafts of gold paper dropping onto the target // shafts of light, cut from gold paper
        piece(SH.star4(7 * s, 30 * s), x, y, R() * 0.2, pop(u, 0.18), PAL.holy, { lw: 2.4 }); piece(SH.cross(9 * s), x, y - 2 * s, 0, k, ['#ece0bc', '#fff6dc'], { lw: 1.8, scratch: false });
        if (u > 0.3) scraps((u - 0.3) / 0.7, x, y, s, R, 4, PAL.gold, 3, 40, 18); } },
      arcane: { ms: 660, d(u, x, y, s, o) { const R = rnd(o.seed || 10), k = pop(u, 0.2), spin = u * 2.4; g.globalAlpha = fade(u, 0.55, 1);
        for (let i = 0; i < 6; i++) { const a0 = spin + i * Math.PI / 3; piece(SH.seg(22 * s, 31 * s, a0 + 0.08, a0 + Math.PI / 3 - 0.08), x, y, 0, k, i % 2 ? PAL.arcane : PAL.void, { lw: 2, scratch: false }); } // a cut-paper rune ring
        for (let i = 0; i < 6; i++) { const a = spin + i * Math.PI / 3 + Math.PI / 6; piece(SH.star4(1.5 * s, 4.5 * s), x + Math.cos(a) * 26.5 * s * k, y + Math.sin(a) * 26.5 * s * k, a, 1, ['#e6d8f2', '#ffffff'], { lw: 1.3, flat: true, scratch: false }); }
        piece(SH.star4(5 * s, 15 * s), x, y, -spin, k, PAL.arcane, { lw: 2.2 }); if (u > 0.35) scraps((u - 0.35) / 0.65, x, y, s, R, 3, PAL.arcane, 3, 36, 10); } },
      nature: { ms: 640, d(u, x, y, s, o) { const R = rnd(o.seed || 11), k = easeOut(u * 3); g.globalAlpha = fade(u, 0.55, 1);
        for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2; piece(SH.spike((24 + R() * 14) * s, 5 * s), x + Math.cos(a) * 4 * s, y + Math.sin(a) * 4 * s, a, k, PAL.thorn, { lw: 2 }); }
        for (let i = 0; i < 4; i++) { const a = R() * Math.PI * 2, d = 12 * s + 34 * s * easeOut(u * 1.4); piece(SH.leaf(18 * s, 7 * s), x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7 + 20 * s * u * u, a + u * 4, 1, PAL.nature, { lw: 1.8, vein: [[-9 * s, 0], [9 * s, 0]] }); } } },
      bleed: { ms: 780, d(u, x, y, s, o) { const R = rnd(o.seed || 12); g.globalAlpha = fade(u, 0.65, 1);
        for (let i = 0; i < (o.n || 5); i++) { const ox = (R() - 0.5) * 36 * s, t = Math.min(1, u * 1.3), fall = t * t * (40 + R() * 22) * s, r = (3.4 + R() * 2.4) * s; piece(SH.drop(r), x + ox, y - 4 * s + fall, (R() - 0.5) * 0.3, pop(u, 0.15), i % 2 ? PAL.blood : ['#a5342b', '#d6745a'], { lw: 1.7, scratch: false }); } } },
      poison: { ms: 780, d(u, x, y, s, o) { const R = rnd(o.seed || 13); g.globalAlpha = fade(u, 0.6, 1);
        for (let i = 0; i < 6; i++) { const ox = (R() - 0.5) * 38 * s, rise = u * (40 + R() * 26) * s, r = (3.5 + R() * 4) * s * (0.6 + u * 0.6); piece(SH.poly(6 + (i % 2), r, R), x + ox + Math.sin(u * 7 + i) * 3 * s, y + 16 * s - rise, i, 1, i % 2 ? PAL.poison : PAL.rot, { lw: 1.7, scratch: false }); } } },
      burn: { ms: 620, d(u, x, y, s, o) { const R = rnd(o.seed || 14), k = Math.min(1, u * 3) * (1 - Math.max(0, u - 0.5) * 1.6); g.globalAlpha = fade(u, 0.6, 1);
        for (let i = 0; i < 3; i++) { const fx = x + (i - 1) * 13 * s + (R() - 0.5) * 6 * s; piece(SH.flame(R, (20 + R() * 10) * s, 6 * s), fx, y + 18 * s, Math.sin(u * 18 + i) * 0.08, Math.max(0.05, k), i === 1 ? PAL.fire : PAL.ember, { lw: 1.9 }); } } },
      chill: { ms: 620, d(u, x, y, s, o) { const k = pop(u, 0.2); g.globalAlpha = fade(u, 0.55, 1);
        for (let i = 0; i < 6; i++) piece([[0, -2.6 * s], [15 * s, 0], [0, 2.6 * s]], x, y, i * Math.PI / 3, k, PAL.ice, { lw: 1.7, scratch: false }); piece(SH.poly(6, 4.5 * s), x, y, 0, k, PAL.frost, { lw: 1.6, scratch: false }); } },
      dread: { ms: 860, d(u, x, y, s, o) { const yy = y - easeOut(u) * 40 * s; g.globalAlpha = fade(u, 0.6, 1) * Math.min(1, u * 5); // a torn paper shroud with cut-out eyes, drifting up
        piece([[-13 * s, 14 * s], [-15 * s, -4 * s], [-8 * s, -15 * s], [8 * s, -15 * s], [15 * s, -4 * s], [13 * s, 14 * s], [7 * s, 8 * s], [3 * s, 15 * s], [-2 * s, 9 * s], [-7 * s, 15 * s]], x, yy, Math.sin(u * 6) * 0.12, 1, PAL.shadow, { lw: 2.2 });
        for (const ex of [-5, 5]) piece([[-2.6 * s, -1.5 * s], [2.6 * s, -1.5 * s], [1.6 * s, 2 * s], [-1.6 * s, 2 * s]], x + ex * s, yy - 3 * s, 0, 1, ['#e8dcc0', '#fff6e0'], { lw: 1.4, flat: true, scratch: false }); } },
      rot: { ms: 780, d(u, x, y, s, o) { const R = rnd(o.seed || 15); g.globalAlpha = fade(u, 0.6, 1); piece(SH.cloud(R, 10 * s), x, y - 6 * s, 0, pop(u, 0.2), PAL.rot, { lw: 2 });
        for (let i = 0; i < 4; i++) { const ox = (R() - 0.5) * 30 * s, t = Math.min(1, u * 1.2); piece(SH.drop((2.6 + R() * 1.8) * s), x + ox, y - 4 * s + t * t * 34 * s, 0, 1, i % 2 ? PAL.rot : ['#5f6a35', '#9aa266'], { lw: 1.5, scratch: false }); } } },
      heal: { ms: 860, d(u, x, y, s, o) { const R = rnd(o.seed || 16); g.globalAlpha = fade(u, 0.6, 1);
        for (let i = 0; i < 5; i++) { const ox = (R() - 0.5) * 46 * s, rise = easeOut(u) * (38 + R() * 26) * s; piece(SH.cross((5 + R() * 2) * s), x + ox, y + 20 * s - rise, (R() - 0.5) * 0.4, pop(u - i * 0.04, 0.15), PAL.heal, { lw: 1.8, scratch: false }); }
        for (let i = 0; i < 2; i++) { const a = R() * Math.PI * 2; piece(SH.leaf(14 * s, 5 * s), x + Math.cos(a) * 18 * s, y + 10 * s - u * 30 * s, a + u * 3, 1, PAL.heal, { lw: 1.5, vein: [[-7 * s, 0], [7 * s, 0]] }); } } },
      block: { ms: 620, d(u, x, y, s, o) { const b = pop(u, 0.2), pal = o.col === 'ward' ? PAL.ward : o.col === 'absorb' ? PAL.absorb : PAL.block; g.globalAlpha = fade(u, 0.55, 0.95); // a cut-paper shield with a boss and rim rivets
        piece(SH.shield(23 * s, 27 * s), x, y, 0, b, pal, { lw: 2.6 }); piece(SH.shield(15 * s, 18 * s), x, y - 1 * s, 0, b, [mix(pal[0], '#ffffff', 0.12), pal[1]], { lw: 1.6, scratch: false });
        piece(SH.poly(6, 4.5 * s), x, y - 4 * s, 0, b, PAL.gold, { lw: 1.5, scratch: false }); for (const [rx, ry] of [[-17, -21], [17, -21], [-18, 2], [18, 2]]) piece(SH.poly(4, 1.8 * s), x + rx * s * b, y + ry * s * b, 0.78, 1, PAL.iron, { lw: 1, flat: true, scratch: false }); } },
      clank: { ms: 380, d(u, x, y, s, o) { const R = rnd(o.seed || 17), sd = o.side || 1, k = easeOut(u * 3); g.globalAlpha = fade(u, 0.45, 1);
        for (let i = 0; i < 6; i++) { const a = (sd > 0 ? Math.PI : 0) + (i - 2.5) * 0.36 + (R() - 0.5) * 0.2; piece([[0, -1.6 * s], [(16 + R() * 12) * s, 0], [0, 1.6 * s]], x + Math.cos(a) * 8 * s * k, y + Math.sin(a) * 8 * s * k, a, k, PAL.flame, { lw: 1.3, flat: true, scratch: false }); }
        piece(SH.star4(4 * s, 13 * s), x, y, 0.4, pop(u, 0.14), PAL.steel, { lw: 2 }); } },
      whoosh: { ms: 400, d(u, x, y, s, o) { const R = rnd(o.seed || 18), sd = o.side || 1; g.globalAlpha = fade(u, 0.35, 1);
        for (let i = 0; i < 3; i++) { const yy = y - 18 * s + i * 16 * s, L = (34 + R() * 14) * s * easeOut(u * 3); piece([[0, -2.6 * s], [L, -1 * s], [L + 6 * s, 0], [L, 1 * s], [0, 2.6 * s]], x + sd * 8 * s, yy, sd > 0 ? 0 : Math.PI, 1, PAL.paper, { lw: 1.6, flat: true, scratch: false }); } } },
      shimmer: { ms: 560, d(u, x, y, s, o) { const pal = o.col === '#8a5cc8' || o.col === 'absorb' ? PAL.absorb : PAL.ward, k = 0.85 + easeOut(u * 2) * 0.3; g.globalAlpha = fade(u, 0.45, 1);
        for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4 + u; g.save(); g.translate(x, y); g.scale(1, 1.3); piece(SH.seg(30 * s * k, 36 * s * k, a0 + 0.1, a0 + Math.PI / 4 - 0.1), 0, 0, 0, 1, pal, { lw: 1.6, scratch: false }); g.restore(); } } },
      dust: { ms: 560, d(u, x, y, s, o) { const R = rnd(o.seed || 19); g.globalAlpha = fade(u, 0.4, 1);
        for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1, d = (14 + i * 9) * s * easeOut(u * 2.2), r = (8 + R() * 6) * s * (0.6 + u * 0.5); piece(SH.cloud(R, r), x + side * d, y - r * 0.3 - 4 * s * u, 0, 1, PAL.dust, { lw: 1.8 }); }
        scraps(u, x, y - 4 * s, s, R, 5, PAL.thorn, 3, 44, 18); } },
      aura: { ms: 800, d(u, x, y, s, o) { const R = rnd(o.seed || 20), pal = o.col && PAL[o.col] ? PAL[o.col] : PAL.gold; g.globalAlpha = fade(u, 0.6, 1);
        for (let r = 0; r < 2; r++) { const v = Math.min(1, u * 1.6 - r * 0.25); if (v <= 0) continue; const yy = y + 34 * s - v * 54 * s; g.save(); g.translate(x, yy); g.scale(1, 0.28); for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4 + v * 2; piece(SH.seg(30 * s, 36 * s, a0 + 0.12, a0 + Math.PI / 4 - 0.12), 0, 0, 0, 1, pal, { lw: 1.5, flat: true, scratch: false }); } g.restore(); }
        for (let i = 0; i < 5; i++) piece(SH.star4(1.8 * s, 6 * s), x + (R() - 0.5) * 50 * s, y + 20 * s - easeOut(u) * (40 + R() * 30) * s, u * 3 + i, 1, pal, { lw: 1.4, scratch: false }); } },
      smoke: { ms: 680, d(u, x, y, s, o) { const R = rnd(o.seed || 21); g.globalAlpha = fade(u, 0.35, 1);
        for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2, d = 24 * s * easeOut(u * 1.5) + R() * 8 * s; piece(SH.cloud(R, (9 + R() * 7) * s * (0.5 + u * 0.8)), x + Math.cos(a) * d, y + 10 * s + Math.sin(a) * d * 0.6 - u * 12 * s, R(), 1, PAL.smoke, { lw: 1.8 }); } } },
      // projectiles: o.from / o.to are fighter ids; the impact effect follows
      bolt: { ms: 240, d(u, x, y, s, o) { const a = spot(o.from, 0.4), b = spot(o.to); if (!a || !b) return; const sx = a.x + a.side * a.w * 0.35, px = sx + (b.x - sx) * u, py = a.y + (b.y - a.y) * u - Math.sin(u * Math.PI) * 24 * a.s, ss = a.s;
        const ang = Math.atan2(b.y - a.y, b.x - sx), R = rnd(7), tail = (k) => [px - Math.cos(ang) * k * ss, py - Math.sin(ang) * k * ss];
        if (o.el === 'Fire') { for (let i = 3; i >= 1; i--) piece(SH.flame(R, 16 * ss, 6 * ss), ...tail(i * 9), ang - Math.PI / 2, 1 - i * 0.18, i === 1 ? PAL.fire : PAL.ember, { lw: 1.8 }); piece(SH.poly(8, 10 * ss, R), px, py, u * 6, 1, PAL.fire, { lw: 2.2 }); piece(SH.poly(6, 4.5 * ss), px - 2 * ss, py - 2 * ss, 0, 1, PAL.flame, { lw: 1.4, scratch: false }); }
        else if (o.el === 'Frost') { const L = 34 * ss; piece([[L * 0.5, 0], [0, -6 * ss], [-L * 0.6, -2 * ss], [-L * 0.7, 0], [-L * 0.6, 2 * ss], [0, 6 * ss]], px, py, ang, 1, PAL.ice, { lw: 2, vein: [[-L * 0.6, 0], [L * 0.5, 0]] }); }
        else if (o.el === 'Shadow') { for (let i = 0; i < 3; i++) piece(SH.ribbon(R, 20 * ss, 3 * ss), ...tail(4 + i * 3), ang + Math.PI + (i - 1) * 0.3, 1, PAL.shadow, { lw: 1.6 }); piece(SH.poly(7, 10 * ss, R), px, py, u * 4, 1, PAL.void, { lw: 2.2 }); }
        else if (o.el === 'Holy') { piece([[22 * ss, 0], [-14 * ss, -5 * ss], [-20 * ss, 0], [-14 * ss, 5 * ss]], px, py, ang, 1, PAL.holy, { lw: 2 }); piece(SH.star4(4 * ss, 12 * ss), px, py, 0.4, 1, PAL.gold, { lw: 1.8 }); }
        else if (o.el === 'Arcane') { piece(SH.star4(5 * ss, 13 * ss), px, py, u * 9, 1, PAL.arcane, { lw: 2 }); for (let i = 1; i <= 3; i++) piece(SH.star4(1.5 * ss, 5 * ss), ...tail(i * 11), u * 5 + i, 1, ['#d8c6ea', '#ffffff'], { lw: 1.2, flat: true, scratch: false }); }
        else if (o.el === 'Nature') { piece(SH.spike(28 * ss, 6 * ss), ...tail(14), ang, 1, PAL.thorn, { lw: 2 }); piece(SH.leaf(12 * ss, 5 * ss), ...tail(16), ang + 0.6, 1, PAL.nature, { lw: 1.4 }); }
        else if (o.star) piece(SH.star4(3.5 * ss, 12 * ss), px, py, u * 14, 1, PAL.steel, { lw: 1.8 });
        else piece(SH.shard(R, 8 * ss), px, py, u * 8, 1, PAL.dust, { lw: 1.8 }); } },
    };
    // ---------- what the engine's events look like
    const ELEM = (d) => d === 'Fire' ? 'fire' : d === 'Frost' ? 'frost' : d === 'Shadow' ? 'shadow' : d === 'Holy' ? 'holy' : d === 'Arcane' ? 'arcane' : d === 'Nature' ? 'nature' : null;
    const DOT = { bleed: 'bleed', poison: 'poison', burn: 'burn', dread: 'dread', rot: 'rot', chill: 'chill' };
    const DEF_FX = { Rogue: 'dodge', Warrior: 'parry', Paladin: 'block', Mage: 'barrier', Warlock: 'absorb' };
    let lastStealth = {}, seen = {};
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
          if (q.aoe) add('slash', { id: q.id, ang: -0.6, big: true, at: 0.55, self: true }, 120);
        } else if (q.type === 'Power') { move = 'empower'; add('aura', { id: q.id, col: { Fire: 'fire', Frost: 'frost', Shadow: 'shadow', Arcane: 'arcane', Nature: 'nature' }[q.dtype] || 'gold' }); }
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
            else if (how === 'barrier' || how === 'absorb') { add('shimmer', { id: e.d, col: how === 'barrier' ? 'ward' : 'absorb' }, delay); if (F) F.play(e.d, 'guard'); }
            else { add('clank', { id: e.d, side, snd: e.thorn ? 'mute' : null }, delay); if (F && tgt.isPlayer) F.play(e.d, how === 'parry' ? 'parry' : 'guard'); else if (F) F.play(e.d, 'ehit'); }
            continue;
          }
          // the impact: by element, else by the weapon (heroes) or the creature (monsters)
          let fx = ELEM(e.dtype);
          if (!fx) { if (src && src.isPlayer) fx = e.kind === 'Skill' ? 'blunt' : (F ? F.weaponKind(src) : 'slash'); else fx = src && /beast|Beast/.test(src.creature || '') ? 'claw' : 'slash'; }
          const big = !!e.crit || e.lost >= tgt.maxHp * 0.2;
          add(fx, { id: e.d, ang: -2.4 + (i - 1) * 0.9 * (i % 2 ? 1 : -1), big, side, seed: Math.random() * 1e9, snd: e.thorn ? 'mute' : null }, delay);   /* Nov 13: Thorns and Spikes striking back are silent */
          if (e.crit) { add('crit', { id: e.d }, delay); setTimeout(() => { const st = document.querySelector('#scrCombat .stage') || document.getElementById('scrCombat'); if (st) { st.classList.remove('fxshake'); void st.offsetWidth; st.classList.add('fxshake'); } }, delay); }
          if (F) setTimeout(() => F.play(e.d, tgt.isPlayer ? (big ? 'knock' : 'hit') : (big ? 'eknock' : 'ehit')), delay);
          setTimeout(() => { const u = document.querySelector(`#scrCombat .unit[data-id="${e.d}"]`), st = document.querySelector('#scrCombat .stage') || document.getElementById('scrCombat'); if (u) { u.classList.remove('hitflash'); void u.offsetWidth; u.classList.add('hitflash'); setTimeout(() => u.classList.remove('hitflash'), 140); } if (big && st) { st.classList.remove('fxpunch'); void st.offsetWidth; st.classList.add('fxpunch'); setTimeout(() => st.classList.remove('fxpunch'), 260); if (window.CB_HEROPUP && CB_HEROPUP.hold) CB_HEROPUP.hold(e.crit ? 110 : 70); } }, delay); // impact: a white flash on whoever is struck; a big hit also holds the fight still for an instant and punches the camera
        } else if (e.t === 'demon' || e.t === 'demonHit') { // Warlock demons (src/template.html demonsHtml): lunge when they act, shake when hit
          const k = e.t === 'demon' ? 'dact' : 'dhit', wait = e.t === 'demon' ? (nth['dm' + e.d] = (nth['dm' + e.d] || 0) + 1) * 260 - 260 : 140;
          setTimeout(() => { const el = document.querySelector(`.unit[data-id="${e.d}"] .demon[data-du="${e.u}"]`); if (!el) return; el.classList.remove('dact', 'dhit'); void el.offsetWidth; el.classList.add(k); setTimeout(() => el.classList.remove(k), 600); }, wait);
        } else if (e.t === 'eplay') { if (window.CB_MOBS) CB_MOBS.cardPlay(e); // an animated monster plays its card's move (src/mobsprites.js)
        } else if (e.t === 'apply') { add(DOT[e.key] || 'bleed', { id: e.d, n: 4, seed: Math.random() * 1e9 }, 260); }
        else if (e.t === 'heal') add('heal', { id: e.d, seed: Math.random() * 1e9 });
        else if (e.t === 'block') add('block', { id: e.d, col: (cb.actorById(e.d) || {}).cls === 'Mage' ? 'ward' : (cb.actorById(e.d) || {}).cls === 'Warlock' ? 'absorb' : null, snd: (cb.actorById(e.d) || {}).cls === 'Rogue' ? 'whoosh' : null });   // Nov 13: gaining Dodge sounds like a whoosh, not a shield clink
      }
      // status changes since the last look (Nov 13): Stun stars, buff and debuff arrows, a summoning beam, a puff when something dies
      for (const a of [...cb.players, ...cb.enemies]) {
        const was = seen[a.id] || {}, now = { stun: (a.stunned || 0) + (a.frozen ? 1 : 0) + (a.feared || 0), up: (a.strength || 0) + (a.strTurn || 0) + (a.nextBonus || 0) + (a.thorns || 0), down: (a.weak || 0) + (a.vulnerable || 0) + (a.slow || 0) + (a.exposure || 0), dm: (a.demons || []).length, hp: a.hp, mana: a.mana || 0 };
        if (seen[a.id]) {
          if (now.stun > was.stun) add('stun', { id: a.id }, 300);
          if (now.up > was.up && !cards.some((q) => q.id === a.id && q.type === 'Power')) add('buff', { id: a.id }, 150);
          if (now.down > was.down) add('debuff', { id: a.id }, 300);
          if (now.dm > was.dm) add('summon', { id: a.id, self: true }, 100);
          if (now.hp <= 0 && was.hp > 0 && !a.isPlayer) add('poof', { id: a.id, tint: 'dark', z: 1.3 }, 420);
          if (!a.isPlayer && now.mana < was.mana - 4 && cards.length) add('drain', { id: a.id, tint: 'mana' }, 250);
        }
        seen[a.id] = now;
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
    function clear() { live.length = 0; lastStealth = {}; seen = {}; }
    return { consume, add, clear, DRAW, spot };
  })();
