// ---------- Hero puppets in the game (Nov 12): the pixel-art heroes (src/puppet.js) take over from the drawn Forge heroes everywhere:
// walking in town (four directions), standing in fights (with attack, cast, guard and hit moves), sitting at the campfire, and in the
// appearance picker at character creation. A hero's appearance (skin, face, hair...) is saved on the hero as "app"; what it wears comes
// from its gear. The Forge (src/forge.js) still answers what kind of weapon a hero swings; only its pictures are replaced.
(function () {
  const P = window.CB_PUPPET; if (!P) return;
  const css = document.createElement('style');
  css.textContent = `.pupfig { display: block; position: relative; height: calc(var(--fh, 118px) * var(--s, 1)); width: calc(var(--fh, 118px) * var(--s, 1) * .6); pointer-events: none; }
    .pupfig canvas { position: absolute; left: 50%; bottom: 0; transform-origin: 50% 100%; }
    .unit.dead .pupfig canvas { filter: grayscale(1) brightness(.6); } .unit.active .pupfig canvas { filter: drop-shadow(0 0 7px rgba(214,161,74,.55)); }
    .order .otile .ofig { position: relative; overflow: hidden; } .order .otile .ofig .pupfig, #scrCombat.bf .order .otile .ofig .pupfig { position: absolute; height: 230%; width: 140%; left: -20%; top: 4%; }
    .pfimg { position: relative; overflow: hidden; } .pfimg .pupfig { position: absolute; height: 250%; width: 150%; left: -25%; top: 2%; }
    #scrCombat.bf .stage .unit .figure .pupfig { height: calc(var(--fh) * var(--s, 1)); }
    .seatfig .pupfig { --fh: 156px; margin: 0 auto; } .seat.soon .pupfig canvas { filter: brightness(.2) saturate(.2); }
    .campscene { background: #07070d url(img/bg/camp.webp) 50% 84% / cover no-repeat !important; image-rendering: pixelated; } .campscene::before, .campscene .ground, .campscene .fire { display: none !important; } .campscene .seat, .campscene .seat * { image-rendering: auto; }
    .herolist:has(.haspup) { grid-template-columns: repeat(auto-fill, minmax(372px, 1fr)); } .herocard.haspup { position: relative; padding-left: 96px; } .herocard .hcpup { position: absolute; left: 6px; top: 8px; } .herocard .hcpup .pupfig { --fh: 112px; }
    .dpup { display: grid; justify-items: center; gap: 2px; } .dpup .pupfig { --fh: 210px; } .dpup .dmirror { padding: 2px 12px; font-size: 13px; }
    .lookpick { display: grid; grid-template-columns: 150px 1fr; gap: 10px 16px; align-items: center; margin: 4px 0 12px; }
    .lookpick .lookview { display: grid; justify-items: center; gap: 4px; } .lookpick .lookview .pupfig { --fh: 190px; }
    .lookpick .lookrows { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 6px 18px; }
    .lookrow { display: grid; grid-template-columns: 82px 44px minmax(70px, 1fr) 44px; align-items: center; gap: 4px; font-size: 14px; } .lookrow b { text-align: center; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lookrow .btn { padding: 0; min-width: 0; width: 44px; height: 30px; line-height: 1; } .lookview .row { display: flex; gap: 6px; } .lookview .row .btn { padding: 2px 10px; }
    .lookrow .sw { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; vertical-align: -1px; margin-right: 5px; }
    @media (max-width: 640px) { .lookpick { grid-template-columns: 1fr; } }`;
  document.head.appendChild(css);
  // ---------- looks: appearance + gear. CB_PUP_APP(who or actor) is set by the game to find a hero's saved appearance.
  const appOf = (key, cls) => { let a = null; try { a = window.CB_PUP_APP ? window.CB_PUP_APP(key) : null; } catch (e) {} return Object.assign(P.defaults(cls), a || {}, { body: P.BODY[cls] || 'warrior' }); };
  const lookOf = (key, cls, gear) => Object.assign(appOf(key, cls), { gear: P.gearOf(gear) }, P.armsOf(gear));
  // ---------- figures on the page: <span class="pupfig" data-pf="id"><canvas>; one loop draws them all
  const FIG = {}, ANIM = {}, BOX = 124, CW = 230, CH = 180, FX = 100, FY = 168; let ST = {}, n = 0;
  const MOVE = { attack: 'attack', heavy: 'attack', lunge: 'attack', double: 'attack', leap: 'attack', twirl: 'aoe', cast: 'cast', empower: 'cast', vanish: 'cast', guard: 'guard', guard2: 'guard', parry: 'guard', dodge: 'guard', hit: 'hit', knock: 'hit' };
  function html(id, look, opt) { FIG[id] = { look, view: (opt && opt.view) || 'e', anim: (opt && opt.anim) || 'idle', t0: performance.now() - Math.random() * 1500 }; return `<span class="pupfig" data-pf="${id}" style="--s:${(opt && opt.s) || 1.12}"><canvas width="${CW * 3}" height="${CH * 3}"></canvas></span>`; }
  function loop(now) {
    for (const el of document.querySelectorAll('.pupfig')) {
      const f = FIG[el.dataset.pf], cv = el.firstElementChild; if (!f || !cv) continue;
      const h = el.clientHeight; if (!h) continue; const k = h / BOX;
      if (cv._h !== h) { cv._h = h; cv.style.width = CW * k + 'px'; cv.style.height = CH * k + 'px'; cv.style.marginLeft = -FX * k + 'px'; cv.style.bottom = -(CH - FY) * k + 'px'; }
      const sx = ST[el.dataset.pf] || {}, a = ANIM[el.dataset.pf]; let anim = f.anim, t = now - f.t0;
      if (sx.dead) { if (!f.dead) f.dead = now; anim = 'dead'; t = now - f.dead; } else { f.dead = 0; if (a) { if (now - a.t0 < P.len(a.anim)) { anim = a.anim; t = now - a.t0; } else delete ANIM[el.dataset.pf]; } }
      const flip = el.closest('#foes') || el.classList.contains('flip') ? 'scaleX(-1)' : ''; if (cv._tf !== flip) { cv._tf = flip; cv.style.transform = flip; }
      const al = sx.stealth ? .4 : 1; if (cv._al !== al) { cv._al = al; cv.style.opacity = al; }
      const g = cv.getContext('2d'); g.clearRect(0, 0, CW * 3, CH * 3); P.draw(g, f.look, f.view, anim, t, FX * 3, FY * 3, 3);
    }
    if (++n % 600 === 0) for (const id in FIG) if (!document.querySelector(`.pupfig[data-pf="${id}"]`)) delete FIG[id];
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  // ---------- the Forge's pictures, replaced
  const F = window.CB_FORGE;
  if (F) {
    const play0 = F.play, states0 = F.setStates, town0 = F.town;
    F.figureHtml = (a) => html(a.id, lookOf(a, a.cls, a.look), { anim: 'ready' });
    F.play = (id, move, o) => { if (FIG[id] && MOVE[move]) { ANIM[id] = { anim: MOVE[move], t0: performance.now() }; return; } play0(id, move, o); };
    F.setStates = (m) => { ST = Object.assign({}, m); states0(m); };
    F.warm = (cls, gear) => { const L = lookOf('me', cls, gear); P.compose(L, 'e'); return { ready: true }; };
    const DIR = { down: 's', up: 'n', left: 'w', right: 'e' };
    F.town = (g, cls, gear, cx, by, dir, step, s, t, who) => {
      const L = lookOf(who || 'me', cls, gear), v = DIR[dir] || 's'; if (!P.ready(L, v)) return town0 ? town0(g, cls, gear, cx, by, dir, step, s, t, who) : false;
      g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, by, 15 * s, 5 * s, 0, 0, Math.PI * 2); g.fill(); g.restore();
      return P.draw(g, L, v, step ? 'walk' : 'idle', t, cx, by + 2 * s, 96 * s / 118);
    };
  }
  // ---------- townsfolk: each gets a look of its own from its colours (always the same one), dressed for its trade
  const NPC = new WeakMap(), DIRS = { down: 's', up: 'n', left: 'w', right: 'e' };
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const lum = (hex) => { const m = /^#?([0-9a-f]{6})/i.exec(hex || ''); if (!m) return 128; const n = parseInt(m[1], 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11); };
  function npcLook(pal) {
    let L = NPC.get(pal); if (L) return L; const h = hash(JSON.stringify(pal)), pick = (arr, k) => arr[(h >>> k) % arr.length];
    const armed = /sword|spear|axe|halberd|mace|blade/.test(pal.weapon || ''), guard = pal.helm === 'helm' || armed, body = guard ? pick(['warrior', 'paladin'], 3) : pick(['paladin', 'mage', 'female', 'female', 'mage', 'warrior'], 3);
    const skinL = lum(pal.skin), skin = skinL > 190 ? 0 : skinL > 165 ? 1 : skinL > 140 ? 2 : skinL > 115 ? 3 : skinL > 85 ? 4 : 5, hl = lum(pal.hair);
    const set = guard ? 'physical_Plate' : pick(['physical_Cloth', 'physical_Leather', 'nature_Cloth', 'physical_Cloth', 'fire_Cloth', 'frost_Cloth', 'nature_Leather', 'arcane_Cloth', 'physical_Leather', 'shadow_Cloth'], 7);
    const gear = { Chest: set, Pants: set, Boots: set, Belt: set }; if (guard) Object.assign(gear, { Shoulders: set, Gloves: set, Bracers: set }, pal.helm === 'helm' ? { Helm: set } : {}); else if ((h >>> 11) % 3 === 0) gear.Shoulders = set; if (pal.helm === 'hood') gear.Helm = /Cloth/.test(set) ? set : 'physical_Cloth'; else if (pal.helm === 'cap') gear.Helm = /Leather/.test(set) ? set : 'physical_Leather';
    L = { body, skin, eyes: (h >>> 5) % P.EYES, eyeCol: (h >>> 9) % 4, mouth: (h >>> 13) % P.MOUTHS, lipCol: body === 'female' ? (h >>> 15) % 3 : 0, hair: pal.helm === 'helm' ? 'short' : pick(P.HAIR, 17), hairCol: hl > 200 ? 5 : hl > 150 ? 3 : hl > 110 ? 6 : hl > 70 ? 2 : (h >>> 19) % 2, beard: body !== 'female' && (h >>> 21) % 3 === 0 ? pick(P.BEARDS, 23) : null, gear };
    if (pal.helm === 'helm') L.weapon = ['sword1h', 0], L.off = ['kite', 0]; else if ((h >>> 25) % 5 === 0) L.cloak = (h >>> 27) % 4;
    NPC.set(pal, L); return L;
  }
  function npc(g, pal, cx, by, dir, step, s, t) {
    const L = npcLook(pal), v = DIRS[dir] || 's'; if (!P.ready(L, v)) return false;
    g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, by, 15 * s, 5 * s, 0, 0, Math.PI * 2); g.fill(); g.restore();
    return P.draw(g, L, v, step ? 'walk' : 'idle', t + (hash(L.body + L.hair) % 1500), cx, by + 2 * s, 96 * s / 118);
  }
  // ---------- riding: the pixel horse (img/hero/horse: rows facing the camera, sideways and away; the first cell stands, the next six walk)
  // seat: where the rider's hips go, from the middle of the horse's feet, in horse pixels; hip: a hero's hips above its feet
  const HORSE = { cell: 128, frames: 6, k: 1.3, hip: 61, s: { row: 0, foot: 108, seat: [1, -70] }, e: { row: 1, foot: 108, seat: [-8, -50] }, n: { row: 2, foot: 119, seat: [1, -68] } };
  const MOVED = new Map();
  function ride(g, look, key, cx, by, dir, moving, s, t) {
    const im = P.img('horse'), v = DIRS[dir] || 's', hv = v === 'w' ? 'e' : v, H = HORSE[hv]; if (!im || !P.ready(look, v)) return false;
    const M = MOVED.get(key) || { x: cx, y: by, at: -1e9 }; if (Math.abs(M.x - cx) + Math.abs(M.y - by) > .01) { M.x = cx; M.y = by; M.at = t; } MOVED.set(key, M); moving = t - M.at < 140;   // a rider is moving while its place changes (no flicker between steps)
    const f = v === 'w' ? -1 : 1, fr = moving ? 1 + Math.floor(t / 70) % HORSE.frames : 0, k = HORSE.k * s, C = HORSE.cell, bob = moving ? Math.sin(t / 70 * Math.PI) * 1.4 * s : 0, sc = 96 * s / 118;
    g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, by, (hv === 'e' ? 40 : 20) * s, 7 * s, 0, 0, Math.PI * 2); g.fill(); g.restore();
    const horse = () => { g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.translate(cx, by); if (f < 0) g.scale(-1, 1); g.drawImage(im, fr * C, H.row * C, C, C, -C / 2 * k, -H.foot * k, C * k, C * k); g.restore(); };
    const hipY = by + H.seat[1] * k + bob, rider = (clip) => { g.save(); if (clip) { g.beginPath(); g.rect(cx - 90 * s, hipY - 200 * s, 180 * s, 200 * s + 8 * sc); g.clip(); } P.draw(g, look, v, 'sit', t, cx + H.seat[0] * k * f, hipY + HORSE.hip * sc + 3 * s, sc); g.restore(); };
    if (hv === 's') { rider(false); horse(); } else if (hv === 'n') { horse(); rider(true); } else { horse(); rider(false); }
    return true;
  }
  // ---------- the appearance picker (character creation, and the mirror in the hero window)
  const NAMES = { skin: ['Fair', 'Light', 'Tan', 'Brown', 'Dark', 'Deep'], eyes: ['Round', 'Narrow', 'Wide', 'Lashes', 'Stern'], mouth: ['Plain', 'Full', 'Smirk', 'Small'],
    eyeCol: ['Brown', 'Blue', 'Green', 'Grey', 'Amber', 'Red', 'Violet'], lipCol: ['Natural', 'Red', 'Wine', 'Plum', 'Black'], hairCol: ['Black', 'Brown', 'Chestnut', 'Blond', 'Red', 'White', 'Grey', 'Blue', 'Violet', 'Green'] };
  const cap = (s) => s ? s.replace(/^beard_/, '').replace(/^./, c => c.toUpperCase()) : 'None', hex = (c) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  function picker(box, cls, start, onChange) {
    const L = Object.assign(P.defaults(cls), start || {}), id = 'pick' + (box.id || 'x'), views = ['s', 'e', 'n', 'w']; let vi = 0;
    const male = L.body !== 'female', hairs = [null, ...P.HAIR], beards = [null, ...P.BEARDS];
    const rows = [['Skin', 'skin', P.SKIN.length, (i) => `<i class="sw" style="background:${hex(P.SKIN[i])}"></i>${NAMES.skin[i]}`], ['Hair', 'hair', hairs, (v) => cap(v)], ['Hair colour', 'hairCol', P.HAIRCOL.length, (i) => `<i class="sw" style="background:${hex(P.HAIRCOL[i])}"></i>${NAMES.hairCol[i]}`]]
      .concat(male ? [['Beard', 'beard', beards, (v) => cap(v)]] : [])
      .concat([['Eyes', 'eyes', P.EYES, (i) => NAMES.eyes[i]], ['Eye colour', 'eyeCol', P.EYECOL.length, (i) => `<i class="sw" style="background:${hex(P.EYECOL[i])}"></i>${NAMES.eyeCol[i]}`], ['Mouth', 'mouth', P.MOUTHS, (i) => NAMES.mouth[i]], ['Lips', 'lipCol', P.LIPCOL.length, (i) => NAMES.lipCol[i]]]);
    const val = (r) => Array.isArray(r[2]) ? Math.max(0, r[2].indexOf(L[r[1]] || null)) : (L[r[1]] || 0), size = (r) => Array.isArray(r[2]) ? r[2].length : r[2];
    function paint() {
      box.innerHTML = `<div class="lookpick"><div class="lookview">${html(id, L, { view: views[vi], s: 1 })}<div class="row"><button type="button" class="btn" data-turn="-1" title="Turn">&#8630;</button><button type="button" class="btn" data-rand="1">Random</button><button type="button" class="btn" data-turn="1" title="Turn">&#8631;</button></div></div>
        <div class="lookrows">${rows.map((r, i) => `<div class="lookrow"><span>${r[0]}</span><button type="button" class="btn" data-row="${i}" data-d="-1" aria-label="Previous ${r[0]}">&#8249;</button><b>${r[3](Array.isArray(r[2]) ? r[2][val(r)] : val(r))}</b><button type="button" class="btn" data-row="${i}" data-d="1" aria-label="Next ${r[0]}">&#8250;</button></div>`).join('')}</div></div>`;
    }
    box.onclick = (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.turn) vi = (vi + +b.dataset.turn + 4) % 4;
      else if (b.dataset.rand) for (const r of rows) { const k = Math.floor(Math.random() * size(r)); L[r[1]] = Array.isArray(r[2]) ? r[2][k] : k; }
      else if (b.dataset.row) { const r = rows[+b.dataset.row], k = (val(r) + +b.dataset.d + size(r)) % size(r); L[r[1]] = Array.isArray(r[2]) ? r[2][k] : k; }
      paint(); if (onChange) onChange(get());
    };
    const get = () => { const o = {}; for (const k of ['skin', 'eyes', 'eyeCol', 'mouth', 'lipCol', 'hair', 'hairCol', 'beard']) o[k] = L[k] == null ? null : L[k]; return o; };
    paint(); return { get, wear: (gear) => { Object.assign(L, { gear: P.gearOf(gear) }, P.armsOf(gear)); paint(); } };
  }
  window.CB_HEROPUP = { html, lookOf, appOf, picker, npc, npcLook, HORSE, ride: (g, pal, cx, by, dir, moving, s, t) => ride(g, pal && pal.forge ? lookOf(pal.forge.who || 'me', pal.forge.cls, pal.forge.gear) : npcLook(pal || {}), pal && pal.forge ? pal.forge.who || 'me' : 'npc', cx, by, dir, moving, s, t) };
})();
