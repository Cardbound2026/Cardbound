// ---------- Gothic Ink interface (Nov 1): stone panels, wooden buttons and heavy black ink, laid over the normal UI.
// Everything here is one stylesheet under body.inkui plus textures drawn in code at load (no image files).
// Menu > "Classic interface" turns it off for this browser. TO REMOVE IT: delete this file (the build skips it),
// and optionally the /*INKUI*/ line in src/template.html, its entry in build.js and the mnUi button in the Menu.
(function () {
  const INK = '#0b0a07';
  const rng = (seed) => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const path = (g, pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
  const P = (g, pts, fill, lw) => { path(g, pts); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'miter'; g.miterLimit = 2.4; g.stroke(); } };
  const L = (g, pts, col, lw) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'bevel'; g.stroke(); };
  const bbox = (pts) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1 - x0, y1 - y0]; };
  // one inked stone block: base, a hard shadow mass to the lower right, a cut highlight on the upper left, a crack or two
  function block(g, pts, base, r, lw) {
    const [x, y, w, h] = bbox(pts);
    path(g, pts); g.fillStyle = base; g.fill(); g.save(); g.clip();
    P(g, [[x + w * .62, y - 2], [x + w + 2, y - 2], [x + w + 2, y + h + 2], [x - 2, y + h + 2], [x + w * .18, y + h * .62], [x + w * .5, y + h * .55]], 'rgba(8,7,6,.62)');
    g.globalAlpha = .55; P(g, [[x + w * .06, y + h * .34], [x + w * .2, y + h * .1], [x + w * .5, y + h * .07], [x + w * .22, y + h * .2], [x + w * .1, y + h * .46]], '#a39c8c'); g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const px = x + w * (.2 + r() * .6), py = y + h * (.2 + r() * .6); L(g, [[px, py], [px + (r() - .3) * 10, py + 3 + r() * 6], [px + (r() - .5) * 12, py + 8 + r() * 8]], INK, 1.4); }
    for (let i = 0; i < w * h / 90; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.25)' : 'rgba(255,240,210,.06)'; g.fillRect(x + r() * w, y + r() * h, 1.5, 1.5); }
    g.restore(); path(g, pts); g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'miter'; g.stroke();
  }
  // a square stone frame for border-image: chipped blocks around a dark slate centre
  function stoneFrame(N, b, seed, opt) {
    opt = opt || {}; const [c, g] = cv(N, N), r = rng(seed), stones = ['#57554f', '#4d4b46', '#5f5c55', '#535048'];
    // slate centre with faint speckle and a few hairline cracks
    g.fillStyle = opt.centre || '#1b1a1b'; g.fillRect(b - 6, b - 6, N - 2 * b + 12, N - 2 * b + 12);
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < .5 ? 'rgba(255,240,210,.035)' : 'rgba(0,0,0,.18)'; g.fillRect(b + r() * (N - 2 * b), b + r() * (N - 2 * b), 2, 2); }
    // blocks along each edge, then four cornerstones on top
    const jag = () => (r() - .5) * b * .16, seg = b * 1.25;
    const edge = (horiz, far) => {
      const len = N - 2 * b; let a = b;
      while (a < N - b - 2) { const e = Math.min(N - b, a + seg * (.8 + r() * .5));
        const o0 = far ? N - 3 - r() * 6 : 3 + r() * 6, o1 = far ? N - b + 4 : b - 4, oj = far ? -1 : 1;
        const pts = horiz ? [[a, o0 + jag()], [(a + e) / 2, o0 + jag() * .6], [e, o0 + jag()], [e, o1], [a, o1]] : [[o0 + jag(), a], [o0 + jag() * .6, (a + e) / 2], [o0 + jag(), e], [o1, e], [o1, a]];
        block(g, pts, stones[(r() * stones.length) | 0], r, opt.lw || 4); a = e; void oj; void len; }
    };
    edge(true, false); edge(true, true); edge(false, false); edge(false, true);
    for (const [cx, cy] of [[0, 0], [N - b - 6, 0], [0, N - b - 6], [N - b - 6, N - b - 6]]) {
      const s = b + 6, j = () => (r() - .5) * b * .14;
      block(g, [[cx + 2 + j(), cy + 2 + j()], [cx + s * .55, cy + 1 + j()], [cx + s - 2 + j(), cy + 3 + j()], [cx + s - 3 + j(), cy + s * .5], [cx + s - 2 + j(), cy + s - 2 + j()], [cx + s * .5, cy + s - 1 + j()], [cx + 3 + j(), cy + s - 3 + j()], [cx + 1 + j(), cy + s * .45]], '#615e57', r, (opt.lw || 4) + 1);
      if (opt.rivets) { g.fillStyle = INK; g.beginPath(); g.arc(cx + s / 2, cy + s / 2, b * .13, 0, 7); g.fill(); g.fillStyle = '#8c857a'; g.beginPath(); g.arc(cx + s / 2 - 1.5, cy + s / 2 - 1.5, b * .06, 0, 7); g.fill(); }
    }
    // the inner ink line where stone meets slate
    g.lineWidth = opt.lw || 4; g.strokeStyle = INK; g.strokeRect(b - 3, b - 3, N - 2 * b + 6, N - 2 * b + 6);
    return c.toDataURL('image/png');
  }
  // a wooden plank for buttons: grain, a dark lower mass, a lit top edge, iron bands and nails at the ends
  function plank(W, H, cap, seed, wood, opt) {
    opt = opt || {}; const [c, g] = cv(W, H), r = rng(seed), j = () => (r() - .5) * 3;
    const shape = [[3 + j(), 5 + j()], [W * .3, 3 + j()], [W * .7, 4 + j()], [W - 4 + j(), 3 + j()], [W - 2 + j(), H * .5], [W - 4 + j(), H - 4 + j()], [W * .6, H - 3 + j()], [W * .25, H - 4 + j()], [4 + j(), H - 3 + j()], [2 + j(), H * .5]];
    path(g, shape); g.fillStyle = wood[0]; g.fill(); g.save(); g.clip();
    for (let y = 6; y < H - 4; y += 3 + r() * 4) { const pts = []; for (let x = 0; x <= W; x += 16) pts.push([x, y + Math.sin(x / 26 + y) * 1.6]); L(g, pts, r() < .6 ? wood[1] + '99' : wood[2] + '55', 1 + r()); }
    for (let i = 0; i < 4; i++) { const kx = cap + r() * (W - 2 * cap), ky = 8 + r() * (H - 16); g.strokeStyle = wood[1]; g.lineWidth = 1.4; g.beginPath(); g.ellipse(kx, ky, 6 + r() * 6, 2.5, 0, 0, 7); g.stroke(); }
    P(g, [[-2, H * .62], [W * .4, H * .7], [W + 2, H * .58], [W + 2, H + 2], [-2, H + 2]], 'rgba(8,6,4,.5)');
    g.globalAlpha = .5; P(g, [[6, 7], [W * .5, 5], [W - 8, 7], [W * .5, 10]], wood[2]); g.globalAlpha = 1;
    if (opt.bands) for (const bx of [cap * .35, W - cap * .35 - 12]) { P(g, [[bx, -2], [bx + 12, -2], [bx + 12, H + 2], [bx, H + 2]], '#3a3a3c', 2.4); g.fillStyle = 'rgba(160,155,145,.5)'; g.fillRect(bx + 2, 2, 3, H - 4); for (const ny of [H * .3, H * .7]) { g.fillStyle = INK; g.beginPath(); g.arc(bx + 6, ny, 3.2, 0, 7); g.fill(); g.fillStyle = '#9b958a'; g.beginPath(); g.arc(bx + 5.2, ny - .8, 1.2, 0, 7); g.fill(); } }
    else for (const nx of [cap * .5, W - cap * .5]) for (const ny of [H * .3, H * .7]) { g.fillStyle = INK; g.beginPath(); g.arc(nx, ny, 2.8, 0, 7); g.fill(); g.fillStyle = '#8f877a'; g.beginPath(); g.arc(nx - .7, ny - .7, 1, 0, 7); g.fill(); }
    g.restore(); path(g, shape); g.lineWidth = 4; g.strokeStyle = INK; g.lineJoin = 'miter'; g.stroke();
    return c.toDataURL('image/png');
  }
  // dark stone backdrop for the page
  function backdrop() {
    const N = 320, [c, g] = cv(N, N), r = rng(9);
    g.fillStyle = '#121112'; g.fillRect(0, 0, N, N);
    for (let y = 0; y < N; y += 40) for (let x = (y / 40) % 2 ? -40 : 0; x < N; x += 80) { const pts = [[x + 2, y + 2], [x + 78, y + 2], [x + 78, y + 38], [x + 2, y + 38]]; path(g, pts); g.fillStyle = ['#151415', '#141314', '#161516'][(r() * 3) | 0]; g.fill(); g.lineWidth = 2; g.strokeStyle = '#0d0c0d'; g.stroke(); }
    for (let i = 0; i < 500; i++) { g.fillStyle = r() < .5 ? 'rgba(255,240,210,.02)' : 'rgba(0,0,0,.25)'; g.fillRect(r() * N, r() * N, 2, 2); }
    return c.toDataURL('image/png');
  }
  const T = {
    big: stoneFrame(420, 64, 11, { lw: 5, rivets: true }),
    thin: stoneFrame(240, 30, 23, { lw: 3.5 }),
    oak: plank(300, 72, 46, 5, ['#6e4a2a', '#2a1a0d', '#c99a62'], { bands: true }),
    pine: plank(260, 60, 30, 8, ['#4c4033', '#1d1711', '#a38e72']),
    bg: backdrop(),
  };
  const css = document.createElement('style');
  css.id = 'inkui-css';
  css.textContent = `
  body.inkui { --ink: ${INK}; --bg: #121112; --panel: #1d1c1d; --panel2: #262426; --line: #0b0a07; --text: #e8dfcb; --muted: #a39a8a; --accent: #d2a75c;
    background: url(${T.bg}) repeat; }
  body.inkui .top { border-bottom: 3px solid var(--ink); box-shadow: 0 1px 0 rgba(255,240,210,.05); }
  body.inkui .brand h1, body.inkui .modal h2, body.inkui h2 { text-shadow: 2px 2px 0 var(--ink); }
  /* stone frames for sheets, windows and panels */
  body.inkui .sheetbox, body.inkui .modal .box { border: 46px solid transparent; border-image: url(${T.big}) 64 fill / 46px / 6px round; background: none; }
  body.inkui .panel, body.inkui .talk { border: 26px solid transparent; border-image: url(${T.thin}) 30 fill / 26px / 3px round; background: none; }
  /* wooden buttons: banded oak for the main action, plain planks for the rest */
  body.inkui .btn.primary { border-style: solid; border-width: 12px 34px; border-color: transparent; border-image: url(${T.oak}) 24 46 fill / 12px 34px stretch; color: #fbe8c2; text-shadow: 0 2px 0 var(--ink), 0 0 6px rgba(0,0,0,.8); filter: none; }
  body.inkui .btn.primary:hover:not(:disabled) { filter: brightness(1.15); }
  body.inkui .btn:not(.primary) { border-style: solid; border-width: 9px 20px; border-color: transparent; border-image: url(${T.pine}) 18 30 fill / 9px 20px stretch; background: none; box-shadow: none; color: #eadfc8; text-shadow: 0 1px 0 var(--ink), 0 0 4px rgba(0,0,0,.8); border-radius: 0; padding: 0 4px; }
  body.inkui .btn:not(.primary):hover:not(:disabled) { filter: brightness(1.2); color: #fff4dc; }
  body.inkui .btn:active:not(:disabled) { transform: translateY(1px); }
  body.inkui .btn, body.inkui .tabs button { white-space: nowrap; }
  body.inkui .endturn.btn.primary { border-width: 16px 44px; border-image-width: 16px 44px; }
  /* small controls: inked stone chips and tabs */
  body.inkui .chip, body.inkui .tag, body.inkui .pilebtn { background: linear-gradient(180deg, #2c2a2b, #1f1d1e); border: 2px solid var(--ink); box-shadow: inset 0 1px 0 rgba(255,240,210,.08), 1px 2px 0 rgba(0,0,0,.5); color: #ddd2bc; }
  body.inkui .chip { border-radius: 4px; }
  body.inkui .pilebtn:hover { filter: brightness(1.25); color: #fff1d6; }
  body.inkui .tag.good { color: #a8d88a; } body.inkui .tag.block { color: #9ec2e2; }
  body.inkui .tabs { border-bottom: 3px solid var(--ink); }
  body.inkui .tabs button { color: var(--muted); border-bottom: 0; text-shadow: 0 1px 0 var(--ink); }
  body.inkui .tabs button[aria-selected="true"] { color: #fbe8c2; background: url(${T.pine}) center / 100% 100% no-repeat; }
  body.inkui .item, body.inkui .cxcod, body.inkui .tltab, body.inkui .tlcell, body.inkui .mapchip, body.inkui .pair { background: linear-gradient(180deg, #282627, #1c1a1b); border: 2px solid var(--ink); box-shadow: inset 0 1px 0 rgba(255,240,210,.06), 2px 3px 0 rgba(0,0,0,.45); }
  body.inkui .item { border-left: 5px solid var(--rc); }
  body.inkui .tlcell { border-left: 4px solid var(--tc); } body.inkui .tlcell.on { background: linear-gradient(180deg, #3a3024, #241d16); box-shadow: 0 0 0 2px var(--tc) inset, 2px 3px 0 rgba(0,0,0,.45); }
  body.inkui .cxcod { border-left: 4px solid var(--rc); }
  body.inkui .mapchip.on { background: linear-gradient(180deg, color-mix(in srgb, var(--ec) 32%, #2a2627), #1c1a1b); border: 2px solid var(--ec); border-left: 7px solid var(--ec); box-shadow: 0 0 0 2px var(--ink), 0 0 16px color-mix(in srgb, var(--ec) 55%, transparent); }
  body.inkui .mapchip.on::after { border: 2px solid var(--ink); }
  /* bars as inked troughs */
  body.inkui .bar, body.inkui .xpbar { background: #0a0909; border: 2px solid var(--ink); box-shadow: inset 0 2px 3px rgba(0,0,0,.8), 0 1px 0 rgba(255,240,210,.06); border-radius: 2px; }
  body.inkui .bar i { background: linear-gradient(180deg, #d0553b, #8f2c1e); box-shadow: inset 0 1px 0 rgba(255,200,170,.35); }
  /* fight units and the turn order as inked slabs */
  body.inkui .unit { border: 2px solid transparent; }
  body.inkui .order .otile { border: 2px solid var(--ink); box-shadow: 2px 3px 0 rgba(0,0,0,.45); background: linear-gradient(180deg, #2a2829, #1b191a); }
  /* inputs and selects: sunk into the stone */
  body.inkui input:not([type=range]):not([type=checkbox]):not([type=radio]), body.inkui select, body.inkui textarea { background: #121112; border: 2px solid var(--ink); box-shadow: inset 0 2px 4px rgba(0,0,0,.7); color: var(--text); border-radius: 3px; }
  body.inkui .chatbox .chatlog { background: rgba(14,13,13,.82); border: 2px solid var(--ink); box-shadow: 2px 3px 0 rgba(0,0,0,.45); }
  body.inkui .cxbarrow { background: rgba(18,17,18,.9); border: 2px solid var(--ink); box-shadow: 2px 3px 0 rgba(0,0,0,.5); }
  body.inkui .townwrap { border: 3px solid var(--ink); box-shadow: 0 0 0 1px #3a3734, 3px 4px 0 rgba(0,0,0,.5); }
  body.inkui #btnUpdates { border: 2px solid var(--ink); background: linear-gradient(180deg, #2c2a2b, #1f1d1e); }
  body.inkui ::-webkit-scrollbar { width: 10px; height: 10px; } body.inkui ::-webkit-scrollbar-thumb { background: #3a3734; border: 2px solid var(--ink); border-radius: 2px; } body.inkui ::-webkit-scrollbar-track { background: #121112; }
  `;
  document.head.appendChild(css);
  const KEY = 'cb-ui';
  const isOn = () => { try { return localStorage.getItem(KEY) !== 'classic'; } catch (e) { return true; } };
  const apply = () => document.body.classList.toggle('inkui', isOn());
  window.CB_UI = { on: isOn, set(on) { try { localStorage.setItem(KEY, on ? 'ink' : 'classic'); } catch (e) {} apply(); } };
  if (document.body) apply(); else document.addEventListener('DOMContentLoaded', apply);
})();
