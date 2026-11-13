// ---------- Hero puppets (Nov 12): pixel-art heroes built from parts. Each body is cut at the joints (tools/heroart/bake_body.py):
// torso, head, upper and lower arms, thighs and shins, for three views (s = facing the camera, n = facing away, e = side; west is the
// side view mirrored). What a hero looks like and wears is a "look":
//   { body, skin, eyes, eyeCol, mouth, lipCol, hair, hairCol, beard, gear: { Helm: 'fire_Plate', Chest: ... }, weapon, off }
// A look is painted once per view into one strip of the ten parts (skin dyed, face drawn, armour laid on, then beard, hair and helm),
// and animations move the parts. CB_PUPPET.draw(g, look, view, anim, t, x, footY, scale) draws one frame with the feet at (x, footY).
window.CB_PUPPET = (function () {
  const D = window.CB_PUPPET_DATA; if (!D) return null;
  const S = D.S, IMG = new Map(), PAR = [-1, 0, 0, 2, 0, 4, 0, 6, 0, 8], TAU = Math.PI * 2, H = D.hair;
  const SLOTS = ['Helm', 'Shoulders', 'Chest', 'Bracers', 'Gloves', 'Belt', 'Pants', 'Boots'];
  const SKIN = [[218, 178, 146], [204, 156, 120], [184, 132, 96], [154, 104, 72], [114, 74, 52], [82, 54, 40]];   // the average tone of the skin, light to dark
  const HAIRCOL = [[52, 44, 44], [110, 70, 40], [160, 104, 52], [226, 190, 110], [196, 70, 40], [236, 236, 240], [150, 150, 158], [70, 90, 190], [150, 60, 170], [60, 150, 90]];
  const EYECOL = [[70, 44, 28], [60, 110, 190], [70, 150, 80], [150, 150, 160], [190, 150, 40], [170, 50, 50], [150, 70, 190]];
  const LIPCOL = [null, [176, 60, 60], [120, 40, 60], [90, 50, 110], [40, 30, 36]];
  const EYES = 5, MOUTHS = 4, BODY = { Warrior: 'warrior', Paladin: 'paladin', Mage: 'mage', Rogue: 'female', Warlock: 'female' };
  const W = D.weapons, MAPS = ['physical', 'fire', 'frost', 'nature', 'arcane', 'shadow'], CLOAKCOL = [[124, 104, 86], [156, 46, 38], [150, 182, 208], [72, 108, 62], [112, 72, 164], [54, 50, 66]];
  const WTYPE = { '1H Sword': 'sword1h', '1H Axe': 'axe1h', '1H Mace': 'mace1h', Dagger: 'dagger', Wand: 'wand', '2H Sword': 'sword2h', '2H Axe': 'axe2h', '2H Maul': 'maul', '2H Warhammer': 'hammer', '2H Scythe': 'scythe', 'Kite Shield': 'kite', 'Tower Shield': 'tower', Focus: 'focus' };
  const STAFF = { 'Fire Staff': 1, 'Frost Staff': 2, 'Nature Staff': 3, 'Arcane Staff': 4, 'Shadow Staff': 5 }, LONG = { staff: 1, scythe: 1 }, HELD = { kite: 1, tower: 1, focus: 1 };
  let loads = 0;   // counts finished image loads, so callers can tell when a look may have changed
  function img(name) { let e = IMG.get(name); if (!e) { e = { im: new Image(), ok: false, bad: false }; e.im.onload = () => { e.ok = true; loads++; COMP.clear(); }; e.im.onerror = () => { e.bad = true; loads++; }; e.im.src = 'img/hero/' + name + '.webp'; IMG.set(name, e); } return e.ok ? e.im : e.bad ? false : null; }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // ---------- which gear slot every pixel of a suit belongs to (img/hero/slots_<body>_<view>: red = slot * 28 + 14): one stencil per slot
  const STEN = new Map();
  function stencils(body, v) {
    const k = body + v; let st = STEN.get(k); if (st) return st; const im = img('slots_' + body + '_' + v); if (!im) return null;
    const c = canvas(S * 10, S), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); const src = g.getImageData(0, 0, S * 10, S).data;
    st = SLOTS.map((_, si) => { const m = canvas(S * 10, S), mg = m.getContext('2d'), d = mg.createImageData(S * 10, S); for (let i = 0; i < src.length; i += 4) if (src[i + 3] && Math.round((src[i] - 14) / 28) === si) d.data[i + 3] = 255; mg.putImageData(d, 0, 0); return m; });
    STEN.set(k, st); return st;
  }
  // ---------- the face, a few pixels on the blank head: eyes[style], a mouth, a nose shadow
  function face(d, B, v, L, skin) {
    if (v === 'n') return; const [nx0, ny0] = B.face, nx = Math.round(nx0 - .5) + S, ny = Math.round(ny0 - .5), W = S * 10;
    const put = (x, y, c) => { const i = (y * W + x) * 4; if (!d[i + 3]) return; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; };
    const sh = (k) => skin.map(c => Math.round(c * k)), dark = [26, 20, 24], white = [236, 232, 226], iris = EYECOL[L.eyeCol || 0] || EYECOL[0], st = (L.eyes || 0) % EYES, ey = ny - 2;
    const eye = (x, dir) => {   // x = the pixel nearest the nose; dir = which way is outward
      if (st === 0) { put(x, ey, iris); put(x + dir, ey, white); put(x, ey - 1, sh(.62)); put(x + dir, ey - 1, sh(.62)); }
      else if (st === 1) { put(x, ey, dark); put(x + dir, ey, dark); }
      else if (st === 2) { put(x, ey, iris); put(x + dir, ey, white); put(x, ey - 1, dark); put(x + dir, ey - 1, dark); put(x, ey + 1, sh(.8)); }
      else if (st === 3) { put(x, ey, iris); put(x + dir, ey, white); put(x + dir * 2, ey - 1, dark); put(x, ey - 1, sh(.7)); put(x + dir, ey - 1, dark); }
      else { put(x, ey, iris); put(x + dir, ey, sh(.5)); put(x, ey - 1, dark); put(x + dir, ey - 2, dark); put(x + dir, ey - 1, dark); }
    };
    const lip = LIPCOL[L.lipCol || 0] || sh(.58), my = ny + 3, m = (L.mouth || 0) % MOUTHS;
    if (v === 's') {
      eye(nx - 2, -1); eye(nx + 2, 1); put(nx, ny, sh(.84)); put(nx, ny + 1, sh(.74));
      if (m === 0) { put(nx - 1, my, lip); put(nx, my, lip); put(nx + 1, my, lip); }
      else if (m === 1) { put(nx - 1, my, lip); put(nx, my, lip); put(nx + 1, my, lip); put(nx, my + 1, lip.map(c => Math.min(255, c + 40))); }
      else if (m === 2) { put(nx - 1, my, lip); put(nx, my, lip); put(nx + 1, my - 1, lip); }
      else { put(nx, my, lip); put(nx - 1, my, lip); }
    } else {
      eye(nx - 3, -1); if (m === 3) put(nx - 2, my, lip); else { put(nx - 2, my, lip); put(nx - 1, my, lip); }
      if (m === 1) put(nx - 2, my + 1, lip.map(c => Math.min(255, c + 40)));
    }
  }
  // ---------- one look, painted: a strip of the ten parts for a view (cached)
  const COMP = new Map(), tmp = canvas(S * 10, S), tg = tmp.getContext('2d', { willReadFrequently: true });
  function compose(L, v) {
    const key = v + JSON.stringify(L, (k, val) => k === 'cos' ? undefined : val); let c = COMP.get(key); if (c) return c;
    const B = D.bodies[L.body][v], body = img(L.body + '_' + v); if (!body) return null;
    const gear = L.gear || {}, sets = SLOTS.map(s => gear[s] || null), need = [...new Set(sets.filter(Boolean))], gi = {};
    let st = null; if (need.length) { st = stencils(L.body, v); if (st === null) return null; let wait = false; for (const n of need) { const im = img('gear/' + n + '_' + L.body + '_' + v); if (im === null) wait = true; gi[n] = im; } if (wait) { if (L.hair) img('hair/' + L.hair); if (L.beard) img('hair/' + L.beard); return null; } }   // Nov 13: ask for every piece at once; they used to load one after another, so mixed sets took a while to appear
    const hair = L.hair ? img('hair/' + L.hair) : false, beard = L.beard ? img('hair/' + L.beard) : false; if (hair === null || beard === null) return null;
    c = canvas(S * 10, S); const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.drawImage(body, 0, 0);
    const id = g.getImageData(0, 0, S * 10, S), d = id.data, skin = SKIN[L.skin || 0] || SKIN[0], mean = (B.skin[0] + B.skin[1] + B.skin[2]) / 3;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] - d[i + 2] > 22 && d[i] > 70) { const k = Math.pow((d[i] + d[i + 1] + d[i + 2]) / 3 / mean, .9); d[i] = Math.min(250, skin[0] * k); d[i + 1] = Math.min(240, skin[1] * k); d[i + 2] = Math.min(230, skin[2] * k); }   // every body's skin lands on the same tone, keeping its shading
    face(d, B, v, L, skin); g.putImageData(id, 0, 0);
    const wear = (si, from, torso) => { const n = sets[from == null ? si : from]; if (!n || !gi[n] || !st) return; tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, S * 10, S); tg.drawImage(gi[n], 0, 0); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(st[si], 0, 0); if (torso) tg.clearRect(S, 0, S * 9, S);
      const dc = L.dye && window.CB_COS ? CB_COS.dyeOf(L, SLOTS[from == null ? si : from]) : null;   // Nov 13: a dye recolours the piece, keeping its shading
      if (dc) { const dd = tg.getImageData(0, 0, S * 10, S), p = dd.data; for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const l = (p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11) / 255, k = l < .5 ? l * 1.9 : .95 + (l - .5) * 1.1; p[i] = Math.min(255, dc[0] * k + (l > .8 ? (l - .8) * 300 : 0)); p[i + 1] = Math.min(255, dc[1] * k + (l > .8 ? (l - .8) * 300 : 0)); p[i + 2] = Math.min(255, dc[2] * k + (l > .8 ? (l - .8) * 300 : 0)); } tg.putImageData(dd, 0, 0); }
      g.drawImage(tmp, 0, 0); };
    // Nov 13: an empty Belt or Shoulders slot no longer cuts a bare strip or torn holes out of the body armour: the trousers (or chest piece) carry on
    // over the waist, and the chest piece keeps its own shoulders (its sleeves start below them, so a bare cap read as a hole)
    for (const si of [7, 6, 2, 5, 3, 4, 1]) { if (si === 5 && !sets[5]) wear(5, sets[6] ? 6 : 2, true); else if (si === 1 && !sets[1]) wear(1, 2); else wear(si); }
    const vi = H.views.indexOf(v), bi = H.bodies.indexOf(L.body), [hx, hy] = H.at[L.body][v];
    const dye = (im, col, clipY) => {   // hair is painted grey-white; multiply it by the colour
      tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, H.cw, H.ch); tg.drawImage(im, bi * H.cw, vi * H.ch, H.cw, H.ch, 0, 0, H.cw, H.ch);
      const hd = tg.getImageData(0, 0, H.cw, H.ch), p = hd.data; for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; if (clipY != null) { const Y = (i / 4 / H.cw | 0) + hy; if (Y < clipY || (v === 'e' && Y > clipY + 15)) { p[i + 3] = 0; continue; } if (Y <= clipY + 8) { const X = S + hx + (i / 4) % H.cw, o = Y * S * 10; if (!(d[(o + X) * 4 + 3] || d[(o + X - 1) * 4 + 3] || d[(o + X + 1) * 4 + 3] || d[(o + X - 2) * 4 + 3] || d[(o + X + 2) * 4 + 3])) { p[i + 3] = 0; continue; } } } /* Nov 13: beside the face, hair that sticks out past the head is tucked into the helm; it used to poke out like wings */ const k = Math.min(1.12, p[i] / 215); p[i] = col[0] * k; p[i + 1] = col[1] * k; p[i + 2] = col[2] * k; }
      tg.putImageData(hd, 0, 0); g.drawImage(tmp, 0, 0, H.cw, H.ch, S + hx, hy, H.cw, H.ch);
    };
    const hc = HAIRCOL[L.hairCol || 0] || HAIRCOL[0];
    if (beard && v !== 'n' && L.body !== 'female') dye(beard, hc);
    if (hair) dye(hair, hc, sets[0] ? B.face[1] + 1 : null);   // under a helm only the hair below the brow shows
    wear(0);
    if (COMP.size > 60) COMP.clear(); COMP.set(key, c); return c;
  }
  // ---------- the cloak: one grey picture per body and view (img/hero/cloak), dyed by its map
  const CLOAK = new Map();
  function cloak(L, v) {
    if (L.cloak == null) return null; const key = L.body + v + L.cloak; let c = CLOAK.get(key); if (c) return c; const im = img('cloak'); if (!im) return null;
    c = canvas(S, S); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, H.bodies.indexOf(L.body) * S, H.views.indexOf(v) * S, S, S, 0, 0, S, S);
    const id = g.getImageData(0, 0, S, S), p = id.data, col = CLOAKCOL[L.cloak] || CLOAKCOL[0]; for (let i = 0; i < p.length; i += 4) if (p[i + 3]) { const k = p[i] / 150; p[i] = Math.min(255, col[0] * k); p[i + 1] = Math.min(255, col[1] * k); p[i + 2] = Math.min(255, col[2] * k); }
    g.putImageData(id, 0, 0); CLOAK.set(key, c); return c;
  }
  // ---------- poses: for each part { r: turn (radians, + = clockwise), sy: stretch along the limb, dx, dy }, plus the whole body's dx, dy
  const Z = () => ({ r: 0, sy: 1, dx: 0, dy: 0 }), ease = (x) => x * x * (3 - 2 * x), up = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
  function pose(anim, p, view) {
    const P = { dx: 0, dy: 0, wr: 0, parts: Array.from({ length: 10 }, Z) }, q = P.parts, s = Math.sin(p * TAU), c = Math.cos(p * TAU), side = view === 'e';
    if (anim === 'walk') {
      if (side) {
        q[6].r = -.33 * s; q[7].r = .5 * Math.max(0, c); q[8].r = .33 * s; q[9].r = .5 * Math.max(0, -c);
        q[2].r = .28 * s; q[3].r = -.2 - .1 * s; q[4].r = -.28 * s; q[5].r = -.2 + .1 * s; q[1].r = .02 * c; P.dy = -Math.abs(c) * 1.6;
      } else {
        const la = Math.max(0, s), lb = Math.max(0, -s);
        q[6].sy = 1 - .13 * la; q[7].sy = 1 - .2 * la; q[8].sy = 1 - .13 * lb; q[9].sy = 1 - .2 * lb;
        q[2].r = .07 * s; q[2].sy = 1 - .05 * s; q[4].r = .07 * s; q[4].sy = 1 + .05 * s; q[3].sy = 1 - .06 * s; q[5].sy = 1 + .06 * s;
        P.dy = -Math.abs(s) * 1.4; P.dx = s * .7; q[1].dy = -Math.abs(c) * .5;
      }
      return P;
    }
    const b = (Math.sin(p * TAU) + 1) / 2, breathe = (k) => { q[1].dy = -b * .9 * k; q[2].dy = q[4].dy = -b * .6 * k; q[0].sy = 1 + b * .012 * k; };
    if (anim === 'idle') { breathe(1); if (side) { q[2].r = .03 * s; q[4].r = -.03 * s; } return P; }
    const ready = (k) => { if (!side) return; q[2].r += -.45 * k; q[3].r += -.75 * k; P.wr += .55 * k; q[6].r += -.2 * k; q[7].r += .16 * k; q[8].r += .2 * k; q[9].r += .1 * k; q[0].r += .04 * k; P.dy += 1.2 * k; };   // the fighting stance
    if (anim === 'sit') { breathe(1); if (side) { q[6].r = -.8; q[7].r = 1.05; q[8].r = -.8; q[9].r = 1.05; q[8].sy = q[9].sy = 0; q[2].r = -.45; q[3].r = -.8; q[0].r = .05; } else { q[6].r = .85; q[8].r = -.85; q[7].r = -.75; q[9].r = .75; q[6].sy = q[8].sy = .78; q[7].sy = q[9].sy = .85; } return P; }   // riding
    if (anim === 'ready') { breathe(1); ready(1); q[2].r += .03 * s; return P; }
    // the fight moves play once, in the side view: p runs 0..1
    const A = side ? 2 : 4, F = side ? 3 : 5;   // the acting arm (near arm in the side view)
    if (anim === 'attack' || anim === 'aoe') {
      const w = ease(up(p, 0, .32)), hit = ease(up(p, .32, .5)), back = ease(up(p, .62, 1)), big = anim === 'aoe' ? 1.25 : 1;
      q[A].r = (.9 * w - 2.5 * hit) * big * (1 - back); q[F].r = (-.5 * w + .1 * hit) * (1 - back); q[0].r = (-.07 * w + .16 * hit) * (1 - back);
      P.dx = (-2 * w + 9 * hit * big) * (1 - back); q[6].r = -.25 * hit * (1 - back); q[8].r = .2 * hit * (1 - back); q[1].r = .05 * hit * (1 - back); P.wr = (-1.9 * w * (1 - hit) + 2.75 * hit) * (1 - back); ready(back);
    } else if (anim === 'thrust') {            // daggers and spears: a quick step and a straight stab
      const w = ease(up(p, 0, .25)), hit = ease(up(p, .25, .42)), back = ease(up(p, .6, 1)), k = 1 - back;
      q[A].r = (.5 * w - 1.9 * hit) * k; q[F].r = (-1.1 * w + 1.0 * hit) * k; P.wr = (.2 * w + 1.75 * hit) * k; q[0].r = (-.05 * w + .2 * hit) * k; P.dx = (-3 * w + 14 * hit) * k; q[6].r = -.4 * hit * k; q[7].r = .25 * hit * k; q[8].r = .3 * hit * k; P.dy = 2 * hit * k; ready(back);
    } else if (anim === 'heavy') {             // two-handers: a long wind-up, then the whole body comes down with it
      const w = ease(up(p, 0, .42)), hit = ease(up(p, .42, .56)), back = ease(up(p, .72, 1)), k = 1 - back;
      q[A].r = (1.5 * w - 3.4 * hit) * k; q[F].r = (-.8 * w + .5 * hit) * k; P.wr = (-2.3 * w * (1 - hit) + 3.1 * hit) * k; q[0].r = (-.16 * w + .34 * hit) * k; q[1].r = (-.08 * w + .12 * hit) * k; P.dx = (-4 * w + 11 * hit) * k; P.dy = (-2 * w + 5 * hit) * k; q[6].r = (.1 * w - .35 * hit) * k; q[8].r = .25 * hit * k; ready(back);
    } else if (anim === 'leap') {              // a jump and a slam
      const w = ease(up(p, 0, .2)), airT = up(p, .2, .55), hit = ease(up(p, .5, .6)), back = ease(up(p, .75, 1)), k = 1 - back, arc = Math.sin(airT * Math.PI);
      P.dy = (3 * w * (1 - airT) - 20 * arc + 4 * hit) * k; P.dx = (16 * ease(airT)) * k; q[A].r = (1.4 * Math.max(w, arc) * (1 - hit) - 2.4 * hit) * k; q[F].r = -.5 * k * (1 - hit); P.wr = (-2.2 * (1 - hit) * Math.max(w, arc) + 2.9 * hit) * k; q[0].r = (-.1 * arc + .3 * hit) * k; q[6].r = (-.7 * arc - .2 * hit) * k; q[7].r = .9 * arc * k; q[8].r = (.5 * arc + .2 * hit) * k; q[9].r = .6 * arc * k; ready(back);
    } else if (anim === 'double') {            // two fast cuts
      const h = p < .5 ? p * 2 : (p - .5) * 2, sec = p >= .5, w = ease(up(h, 0, .35)), hit = ease(up(h, .35, .6)), back = sec ? ease(up(h, .7, 1)) : 0, k = 1 - back, d = sec ? -1 : 1;
      q[A].r = (.7 * w - 2.3 * hit) * k; q[F].r = (-.5 * w + .2 * hit) * k; P.wr = ((d > 0 ? -1.7 : -.6) * w * (1 - hit) + (d > 0 ? 2.7 : 1.9) * hit) * k; q[0].r = (-.05 * w + .14 * hit) * k * d; P.dx = (3 + 7 * hit) * k + (sec ? 4 * k : 0); q[6].r = -.25 * k; q[8].r = .2 * k; ready(back);
    } else if (anim === 'spin') {              // a sweep through everyone: the blade goes all the way round
      const w = ease(up(p, 0, .2)), turn = ease(up(p, .2, .7)), back = ease(up(p, .8, 1)), k = 1 - back;
      q[A].r = (1.0 * w - 6.6 * turn) * k; q[F].r = -.3 * k; P.wr = 1.2 * w * k; q[0].r = Math.sin(turn * Math.PI) * .22 * k; P.dx = Math.sin(turn * Math.PI) * 8 * k; P.dy = -Math.sin(turn * Math.PI) * 3 * k; q[6].r = -.3 * Math.sin(turn * Math.PI) * k; q[8].r = .3 * Math.sin(turn * Math.PI) * k; ready(back);
    } else if (anim === 'empower') {           // a power: both feet set, the weapon lifted high, a breath held
      const w = ease(up(p, 0, .3)), back = ease(up(p, .7, 1)), k = w * (1 - back), sh = Math.sin(p * TAU * 5) * .03 * k;
      q[A].r = (-2.9 + sh) * k; q[F].r = -.1 * k; P.wr = 1.75 * k; q[0].r = -.1 * k; q[1].r = -.16 * k; P.dy = -3 * k; q[6].r = -.18 * k; q[8].r = .18 * k; ready(1 - k);
    } else if (anim === 'parry') {             // the weapon snaps across the body and knocks the blow aside
      const w = ease(up(p, 0, .18)), back = ease(up(p, .55, 1)), k = w * (1 - back);
      q[A].r = -1.5 * k; q[F].r = -.9 * k; P.wr = -.9 * k; q[0].r = -.06 * k; P.dx = -2 * k; ready(1 - k);
    } else if (anim === 'dodge') {             // a hop back out of reach
      const k = Math.sin(Math.min(1, p) * Math.PI); ready(1); P.dx = -11 * k; P.dy = -5 * k; q[0].r += -.2 * k; q[1].r = -.1 * k; q[6].r += .35 * k; q[8].r += -.3 * k; q[A].r += .5 * k;
    } else if (anim === 'knock') {             // a heavy blow: thrown back on the heels
      const k = Math.sin(Math.min(1, p) * Math.PI), j = Math.sin(Math.min(1, p * 3) * Math.PI) * (1 - Math.min(1, p));
      ready(1); q[0].r += -.3 * k; q[1].r = -.22 * k; P.dx = -9 * k; P.dy = -3 * j; q[A].r += .9 * k; q[F].r += .5 * k; q[6].r += .3 * k; q[8].r += -.15 * k;
    } else if (anim === 'cast') {
      const w = ease(up(p, 0, .3)), back = ease(up(p, .75, 1)), k = w * (1 - back), fl = Math.sin(p * TAU * 3) * .06 * k;
      q[A].r = (-2.3 + fl) * k; q[F].r = -.35 * k; q[0].r = -.05 * k; q[1].r = -.1 * k; P.dy = -1.5 * k; P.wr = 2.1 * k; ready(1 - k);
    } else if (anim === 'guard') {
      const w = ease(up(p, 0, .25)), back = ease(up(p, .75, 1)), k = w * (1 - back);
      q[A].r = -1.0 * k; q[F].r = -1.25 * k; q[0].r = .05 * k; P.dx = -1.5 * k; q[6].r = .12 * k; q[8].r = -.12 * k; P.wr = .9 * k; ready(1 - k);
    } else if (anim === 'hit') {
      const k = Math.sin(Math.min(1, p) * Math.PI);
      ready(1); q[0].r += -.14 * k; q[1].r = -.1 * k; P.dx = -3.5 * k; q[A].r += .35 * k; q[6].r += .1 * k;
    } else if (anim === 'dead') {
      const k = ease(Math.min(1, p)); q[0].r = -1.45 * k; P.dy = 30 * k; P.dx = -10 * k; q[1].r = -.2 * k; q[A].r = .6 * k; q[6].r = .5 * k; q[8].r = .3 * k;
    }
    return P;
  }
  const CLIP = { thrust: 480, heavy: 820, leap: 820, double: 720, spin: 760, empower: 900, parry: 520, dodge: 460, knock: 560, sit: 1600, ready: 1600, idle: 1600, walk: 760, attack: 560, aoe: 700, cast: 800, guard: 700, hit: 380, dead: 700 }; // ms per loop (or per play)
  const ONCE = { thrust: 1, heavy: 1, leap: 1, double: 1, spin: 1, empower: 1, parry: 1, dodge: 1, knock: 1, attack: 1, aoe: 1, cast: 1, guard: 1, hit: 1, dead: 1 };
  // ---------- drawing: each part is drawn from the look's strip with its parents' moves applied
  // parts are drawn enlarged (each art pixel a block of q x q) and the result shrunk to size, so a turned limb gets clean edges instead of jagged ones
  const WORK = {}, workFor = (q) => WORK[q] || (WORK[q] = (() => { const c = canvas(S * 2 * q, S * 2 * q); return { c, g: c.getContext('2d') }; })());
  function chain(g, B, P, i) { if (PAR[i] >= 0) chain(g, B, P, PAR[i]); const a = P.parts[i], pv = B.piv[i]; g.translate(pv[0] + a.dx, pv[1] + a.dy); if (a.r) g.rotate(a.r); if (a.sy !== 1) g.scale(1, a.sy); g.translate(-pv[0], -pv[1]); }
  const GRIPR = 3.6, OUTL = new WeakMap();
  function outline(strip) { let o = OUTL.get(strip); if (o) return o; o = canvas(S * 2, S); const og = o.getContext('2d'); og.drawImage(strip, 2 * S, 0, 2 * S, S, 0, 0, 2 * S, S); og.globalCompositeOperation = 'source-in'; og.fillStyle = '#0c0a10'; og.fillRect(0, 0, 2 * S, S); OUTL.set(strip, o); return o; }
  function draw(g, look, view, anim, t, x, footY, scale) {
    const flip = view === 'w', v = flip ? 'e' : view, B = D.bodies[look.body] && D.bodies[look.body][v]; if (!B) return false;
    const COS = window.CB_COS; if (COS && look.cos) { const ws = COS.weapon(look); if (ws && W && W.types.includes('legend')) look = Object.assign({}, look, { weapon: ws }); }
    const strip = compose(look, v) || img(look.body + '_' + v); if (!strip) return false;
    if (COS && look.cos) { g.save(); try { COS.draw(g, look, view, anim, t, x, footY, scale, 'back'); } catch (e) {} g.restore(); }
    const len = CLIP[anim] || 1000, p = ONCE[anim] ? Math.min(1, t / len) : (t % len) / len, P = pose(anim, p, v);
    const q = scale >= 1.5 ? 3 : 2, wk = workFor(q), work = wk.c, wg = wk.g;
    wg.setTransform(1, 0, 0, 1, 0, 0); wg.clearRect(0, 0, work.width, work.height); wg.imageSmoothingEnabled = false;
    const base = () => wg.setTransform(q, 0, 0, q, (S / 2 + Math.round(P.dx)) * q, (S / 2 + Math.round(P.dy)) * q), wim = (look.weapon || look.off) && W ? img('weapons') : null, cl = cloak(look, v);
    const held = (it, part, hand, rot, at) => {   // a weapon or shield: its grip on the hand, turned with the arm
      if (!it || !wim) return; const ti = W.types.indexOf(it[0]), gp = W.grip[it[0]] && W.grip[it[0]][it[1]]; if (ti < 0 || !gp) return;
      base(); chain(wg, B, P, part); wg.translate(at ? at[0] : B.hand[hand][0], at ? at[1] : B.hand[hand][1]); wg.rotate(rot); wg.drawImage(wim, it[1] * W.cw, ti * W.ch, W.cw, W.ch, -Math.round(gp[0]), -Math.round(gp[1]) + (HELD[it[0]] || LONG[it[0]] || at ? 0 : 2), W.cw, W.ch);
      // Nov 13: the fist closes over the handle. The weapon is drawn on the hand, then the hand itself is drawn again on top of it,
      // so fingers wrap the grip instead of the weapon floating in front of an open hand
      if (!at && !HELD[it[0]]) { wg.save(); base(); chain(wg, B, P, part); wg.beginPath(); wg.arc(B.hand[hand][0], B.hand[hand][1], GRIPR, 0, 7); wg.clip(); wg.drawImage(strip, part * S, 0, S, S, 0, 0, S, S); wg.restore(); }
    };
    if (cl && v !== 'n') { base(); chain(wg, B, P, 0); wg.drawImage(cl, 0, 0); }
    const wrot = (it, d) => (HELD[it[0]] ? 0 : LONG[it[0]] || (it[0] === 'legend' && (it[1] === 2 || it[1] === 5)) ? .18 * d : 1.15 * d), mainPart = v === 'n' ? 5 : 3, offPart = v === 'n' ? 3 : 5;
    // Nov 13: from the side the far arm is drawn too (the near arm's picture, a shade darker, behind the body), and it is the hand that holds
    // the off-hand weapon. That weapon used to hang in the air beside the body.
    if (v === 'e' && anim !== 'sit' && anim !== 'dead') {
      const a2 = P.parts[2], a3 = P.parts[3], k2 = [a2.r, a2.dx, a2.dy], k3 = a3.r, calm = anim === 'idle' || anim === 'walk', armed = look.off && !HELD[look.off[0]];
      a2.r = anim === 'walk' ? -k2[0] * .9 : anim === 'idle' ? k2[0] : (armed ? -.72 : -.3) + k2[0] * .12; a3.r = calm ? Math.min(k3, -.2) : armed ? -.7 : -1.15; a2.dx = k2[1] + (anim === 'idle' ? 1 : 3); a2.dy = k2[2] - 1;
      for (const i of [2, 3]) { base(); chain(wg, B, P, i); wg.drawImage(strip, i * S, 0, S, S, 0, 0, S, S); }
      if (look.off && !HELD[look.off[0]]) held(look.off, 3, 0, calm ? wrot(look.off, 1) : k2[0] + k3 + wrot(look.off, 1) + P.wr - a2.r - a3.r - .3);
      wg.setTransform(1, 0, 0, 1, 0, 0); wg.globalCompositeOperation = 'source-atop'; wg.fillStyle = 'rgba(8,6,12,.34)'; wg.fillRect(0, 0, work.width, work.height); wg.globalCompositeOperation = 'source-over';
      a2.r = k2[0]; a2.dx = k2[1]; a2.dy = k2[2]; a3.r = k3;
    }
    for (const i of B.order) {
      if (i === 2 && v === 'e') { const ol = outline(strip); wg.globalAlpha = .6; for (const j of [2, 3]) { base(); chain(wg, B, P, j); for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) wg.drawImage(ol, (j - 2) * S, 0, S, S, ox, oy, S, S); } wg.globalAlpha = 1; }   /* Nov 13: a dark edge around the near arm, so it reads apart from the chest */
      base(); chain(wg, B, P, i); wg.drawImage(strip, i * S, 0, S, S, 0, 0, S, S);
      if (i === 0 && cl && v === 'n') wg.drawImage(cl, 0, 0);
      if (i === 0 && v === 'e' && look.off && HELD[look.off[0]]) held(look.off, 0, 0, 0, [B.piv[0][0] + 13, B.piv[0][1] - (look.off[0] === 'focus' ? 24 : 16)]);
      if (look.weapon && i === mainPart) held(look.weapon, i, v === 'n' ? 1 : 0, v === 'e' ? wrot(look.weapon, 1) + P.wr : wrot(look.weapon, v === 's' ? -.26 : .26));
      if (look.off && v !== 'e' && i === offPart) held(look.off, i, v === 'n' ? 0 : 1, wrot(look.off, v === 's' ? .26 : -.26));
    }
    g.save(); g.imageSmoothingEnabled = scale !== q; g.imageSmoothingQuality = 'high'; g.translate(x, footY); if (flip) g.scale(-1, 1);
    g.drawImage(work, -(S / 2 + B.cx) * scale, -(S / 2 + B.foot) * scale, S * 2 * scale, S * 2 * scale); g.restore();
    if (COS && look.cos) { g.save(); try { COS.draw(g, look, view, anim, t, x, footY, scale, 'front'); } catch (e) {} g.restore(); }
    return true;
  }
  // the look a hero starts with, and what its gear looks like: items -> { slot: '<map>_<Plate|Leather|Cloth>' }
  function defaults(cls) { const body = BODY[cls] || 'warrior'; return { body, skin: body === 'mage' ? 0 : body === 'female' ? 1 : 2, eyes: body === 'female' ? 3 : 0, eyeCol: 0, mouth: body === 'female' ? 1 : 0, lipCol: 0, hair: body === 'female' ? 'long' : body === 'mage' ? 'slick' : 'short', hairCol: body === 'female' ? 0 : 1, beard: null }; }
  function gearOf(items) {
    const G = window.CB_DATA && CB_DATA.gear, out = {}; if (!G) return out;
    for (const it of items || []) { if (!it || !SLOTS.includes(it.slot)) continue; const b = G.bases.find(x => x.name === (it.base || it.name)) || {}, A = G.arche[it.arch || b.arch] || {}, map = it.map || b.map || 'physical'; if (A.type && A.type !== 'None') out[it.slot] = map + '_' + A.type; }
    return out;
  }
  // weapons, shield and cloak: items -> { weapon: [type, version], off: [type, version], cloak: map number }
  function armsOf(items) {
    const G = window.CB_DATA && CB_DATA.gear, out = {}; if (!G) return out;
    for (const it of items || []) {
      if (!it) continue; const b = G.bases.find(x => x.name === (it.base || it.name)) || {}, arch = it.arch || b.arch || '', mi = Math.max(0, MAPS.indexOf(it.map || b.map || 'physical'));
      if (it.slot === 'Cloak') out.cloak = mi;
      else if (it.slot === 'Weapon' || it.slot === 'Off-hand') { const w = STAFF[arch] != null ? ['staff', STAFF[arch]] : / Staff$/.test(arch) ? ['staff', mi] : WTYPE[arch] ? [WTYPE[arch], mi] : null; if (w) out[it.slot === 'Weapon' ? 'weapon' : 'off'] = w; }
    }
    return out;
  }
  // an item's picture: [row, column] in img/items.webp (rows as in tools/heroart/bake_icons.py)
  const ICONROWS = SLOTS.flatMap(sl => ['Plate', 'Leather', 'Cloth'].map(t => sl + '_' + t)).concat(W ? W.types : [], ['Cloak', 'Ring', 'Amulet', 'Codex']), CODEXCOL = ['Warrior', 'Rogue', 'Mage', 'Paladin', 'Warlock', 'Shaman'];
  function iconOf(it) {
    const G = window.CB_DATA && CB_DATA.gear, b = (G && G.bases.find(x => x.name === (it.base || it.name))) || {}, arch = it.arch || b.arch || '', A = (G && G.arche[arch]) || {}, mi = Math.max(0, MAPS.indexOf(it.map || b.map || 'physical'));
    const slot = /^Ring/.test(it.slot || '') ? 'Ring' : it.slot, row = (k) => Math.max(0, ICONROWS.indexOf(k));
    if (slot === 'Codex') return [row('Codex'), Math.max(0, CODEXCOL.indexOf(it.cls))];
    if (slot === 'Ring' || slot === 'Amulet' || slot === 'Cloak') return [row(slot), mi];
    if (slot === 'Weapon' || slot === 'Off-hand') { if (STAFF[arch] != null) return [row('staff'), STAFF[arch]]; if (/ Staff$/.test(arch)) return [row('staff'), mi]; const g = / (Sword|Blade)/i.test(it.name || '') ? 'sword1h' : /Dirk|Dagger|Knife/i.test(it.name || '') ? 'dagger' : /Wand/i.test(it.name || '') ? 'wand' : /Staff/i.test(it.name || '') ? 'staff' : /Shield|Buckler/i.test(it.name || '') ? 'kite' : /Orb|Focus|Tome/i.test(it.name || '') ? 'focus' : /Mace|Hammer/i.test(it.name || '') ? 'mace1h' : /Axe/i.test(it.name || '') ? 'axe1h' : slot === 'Weapon' ? 'sword1h' : 'kite'; return [row(WTYPE[arch] || g), mi]; }
    const type = A.type && A.type !== 'None' ? A.type : /Plate|Iron|Steel|Mail/i.test((it.label || '') + (it.name || '')) ? 'Plate' : /Robe|Cloth|Silk|Linen|Wraps|Sash|Slippers|Hood|Mantle/i.test((it.label || '') + (it.name || '')) ? 'Cloth' : 'Leather';
    return [row(slot + '_' + type), mi];
  }
  return { iconOf, img, armsOf, draw, pose, compose, defaults, gearOf, len: (a) => CLIP[a] || 1000, once: (a) => !!ONCE[a], loads: () => loads, S, SLOTS, SKIN, HAIRCOL, EYECOL, LIPCOL, EYES, MOUTHS, HAIR: H.styles, BEARDS: H.beards, BODY,
    ready: (look, view) => !!compose(look, view === 'w' ? 'e' : view) };
})();
