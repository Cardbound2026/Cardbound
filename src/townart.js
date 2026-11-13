// ---------- Town art (Nov 12): Emberwatch painted in pixel art. The ground is baked into 12 x 12 tile pictures
// (public/img/town/g_<i>_<j>.webp) with the city wall, bridges and shadows in it; every building and prop is its own sprite
// (public/img/town/<name>.webp) standing on its footprint, so collision, doors and townspeople stay where they were.
// Made by tools/townart/compose_town.py from the layout in src/city.js. Sizes come from src/townart_data.js.
// TO REMOVE: delete this file and src/townart_data.js (the build skips them) and the town goes back to the ink drawing.
window.CB_TOWNART = (function () {
  const D = window.CB_TOWNART_DATA; if (!D) return null;
  const T = D.T, CH = D.CH, IMG = new Map();
  function img(name) { let e = IMG.get(name); if (!e) { e = { im: new Image(), ok: false }; e.im.onload = () => { e.ok = true; }; e.im.src = 'img/town/' + name + '.webp'; IMG.set(name, e); } return e.ok ? e.im : null; }
  const crisp = (g, k) => { g.imageSmoothingEnabled = Math.abs(k - Math.round(k)) > .01; if (g.imageSmoothingEnabled) g.imageSmoothingQuality = 'low'; };
  // the ground: only the pictures on screen are loaded, plus the next one the way you are heading
  function ground(g, cam, TOWN, MW, MH, hp, dir) {
    const TS = TOWN.TS, d = TOWN.dpr, cs = CH * TS, i0 = Math.floor(cam.x / cs), j0 = Math.floor(cam.y / cs), i1 = Math.floor((cam.x + TOWN.vw) / cs), j1 = Math.floor((cam.y + TOWN.vh) / cs);
    crisp(g, TS * d / T);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { if (i < 0 || j < 0 || i * CH >= MW || j * CH >= MH) continue;
      const im = img('g_' + i + '_' + j); if (im) g.drawImage(im, Math.round((i * cs - cam.x) * d), Math.round((j * cs - cam.y) * d), Math.round(cs * d), Math.round(cs * d)); }
    if (dir) { const ni = Math.floor((hp.x + dir[0] * CH * .8) / CH), nj = Math.floor((hp.y + dir[1] * CH * .8) / CH); if (ni >= 0 && nj >= 0 && ni * CH < MW && nj * CH < MH) img('g_' + ni + '_' + nj); }
    g.imageSmoothingEnabled = true; return true;
  }
  const HALLS = { 'Hall of Records': 'hall_records', 'Grand Library': 'hall_library', 'Cathedral of the Ember': 'hall_cathedral', 'Guild Hall': 'hall_guild' };
  function nameOf(p) {
    const k = p.kind;
    if (k === 'bld') { const n = 'bld_' + (p.roof || 'red') + (p.wall === 'stone' ? 'stone' : '') + '_' + p.w; return n === 'bld_red_6' && (p.x + p.y) % 2 ? 'bld_red_6b' : n; }
    if (k === 'hall') return HALLS[p.name]; if (k === 'awning') return 'awning_' + p.c; if (k === 'tree') return 'tree_' + (p.v || 0);
    return k;
  }
  const BAKED = { wallseg: 1, bridge: 1 }, DY = { tree: 4, torch: 3, chest: 2, sign: 3, board: 3, arenaboard: 3, statue: 3 }; // art px the foot sits below the footprint
  const CO = { cx: 281, cy: 217, k: 2, front: 300 }; // the Colosseum picture: where the middle of its sand is, its scale, and the row its near stands start
  function prop(g, p, TS, t, ARN) {
    if (BAKED[p.kind]) return true;
    const s = TS / T;
    if (p.kind === 'colosseum') { const im = img('colosseum'); if (!im) return true; const k = CO.k * s, x = ARN.x * TS - CO.cx * k, y = ARN.y * TS - CO.cy * k; crisp(g, k);
      if (p.part === 'front') g.drawImage(im, 0, CO.front, im.width, im.height - CO.front, x, y + CO.front * k, im.width * k, (im.height - CO.front) * k); else g.drawImage(im, x, y, im.width * k, im.height * k);
      g.imageSmoothingEnabled = true; return true; }
    const n = nameOf(p), sz = n && D.sprites[n]; if (!sz) return false;
    const im = img(n); if (!im) return true;
    crisp(g, s * (window.devicePixelRatio > 1 ? 2 : 1));
    g.drawImage(im, Math.round((p.x + p.w / 2) * TS - sz[0] * s / 2), Math.round((p.y + p.h) * TS + (DY[p.kind] || 0) * s - sz[1] * s), sz[0] * s, sz[1] * s);
    g.imageSmoothingEnabled = true; return true;
  }
  let miniIm = null; function mini() { if (!miniIm) { miniIm = new Image(); miniIm.src = 'img/town/mini.webp'; } return miniIm.complete && miniIm.naturalWidth ? miniIm : null; }
  return { ground, prop, mini };
})();
