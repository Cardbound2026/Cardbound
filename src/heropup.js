// ---------- Hero puppets in the game (Nov 12): the pixel-art heroes (src/puppet.js) take over from the drawn Forge heroes everywhere:
// walking in town (four directions), standing in fights (with attack, cast, guard and hit moves), sitting at the campfire, and in the
// appearance picker at character creation. A hero's appearance (skin, face, hair...) is saved on the hero as "app"; what it wears comes
// from its gear. The Forge (src/forge.js) still answers what kind of weapon a hero swings; only its pictures are replaced.
(function () {
  const P = window.CB_PUPPET; if (!P) return;
  const css = document.createElement('style');
  css.textContent = `.pupfig { display: block; position: relative; height: calc(var(--fh, 118px) * var(--s, 1)); width: calc(var(--fh, 118px) * var(--s, 1) * .6); pointer-events: none; }
    .pupfig canvas { position: absolute; left: 50%; bottom: 0; image-rendering: pixelated; transform-origin: 50% 100%; }
    .unit.dead .pupfig canvas { filter: grayscale(1) brightness(.6); } .unit.active .pupfig canvas { filter: drop-shadow(0 0 7px rgba(214,161,74,.55)); }
    .order .otile .ofig { position: relative; overflow: hidden; } .order .otile .ofig .pupfig, #scrCombat.bf .order .otile .ofig .pupfig { position: absolute; height: 230%; width: 140%; left: -20%; top: 4%; }
    .pfimg { position: relative; overflow: hidden; } .pfimg .pupfig { position: absolute; height: 250%; width: 150%; left: -25%; top: 2%; }
    #scrCombat.bf .stage .unit .figure .pupfig { height: calc(var(--fh) * var(--s, 1)); }
    .seatfig .pupfig { --fh: 132px; margin: 0 auto; }
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
  function html(id, look, opt) { FIG[id] = { look, view: (opt && opt.view) || 'e', anim: (opt && opt.anim) || 'idle', t0: performance.now() - Math.random() * 1500 }; return `<span class="pupfig" data-pf="${id}" style="--s:${(opt && opt.s) || 1.12}"><canvas width="${CW}" height="${CH}"></canvas></span>`; }
  function loop(now) {
    for (const el of document.querySelectorAll('.pupfig')) {
      const f = FIG[el.dataset.pf], cv = el.firstElementChild; if (!f || !cv) continue;
      const h = el.clientHeight; if (!h) continue; const k = h / BOX;
      if (cv._h !== h) { cv._h = h; cv.style.width = CW * k + 'px'; cv.style.height = CH * k + 'px'; cv.style.marginLeft = -FX * k + 'px'; cv.style.bottom = -(CH - FY) * k + 'px'; }
      const sx = ST[el.dataset.pf] || {}, a = ANIM[el.dataset.pf]; let anim = f.anim, t = now - f.t0;
      if (sx.dead) { if (!f.dead) f.dead = now; anim = 'dead'; t = now - f.dead; } else { f.dead = 0; if (a) { if (now - a.t0 < P.len(a.anim)) { anim = a.anim; t = now - a.t0; } else delete ANIM[el.dataset.pf]; } }
      const flip = el.closest('#foes') || el.classList.contains('flip') ? 'scaleX(-1)' : ''; if (cv._tf !== flip) { cv._tf = flip; cv.style.transform = flip; }
      const al = sx.stealth ? .4 : 1; if (cv._al !== al) { cv._al = al; cv.style.opacity = al; }
      const g = cv.getContext('2d'); g.clearRect(0, 0, CW, CH); P.draw(g, f.look, f.view, anim, t, FX, FY, 1);
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
  window.CB_HEROPUP = { html, lookOf, appOf, picker, fig: (id, cls, gear, opt) => html(id, lookOf(opt && opt.who || id, cls, gear), opt) };
})();
