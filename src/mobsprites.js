// ---------- Pixel monsters (Nov 10): animated pixel-art enemies for the fight screen, made with PixelLab.
// Sheets: public/img/mobs/<enemy key>.webp, one row per animation, every cell the same size; <key>_p.webp is a still idle frame
// for the turn order. The manifest (inlined at build) lists each sheet's cell size, its animations and frame counts, and which
// animation to play for an attack, an area attack, a buff, a defence, a hit and (bosses) the phase change.
// Enemies without a sheet keep the Gothic Ink art. Settings > "Previous enemy art" turns all of this off.
// TO REMOVE: delete this file, the /*MOBS*/ line in src/template.html and its entry in build.js.
(function () {
  const M = /*MOB-MANIFEST*/{};
  const REF = 96;                                    // a human-sized mob's idle height in sheet pixels, drawn as tall as the old art
  const CAP = { '1': 1.25, '2': 1.35, '3': 1.6, Elite: 1.7, Boss: 2 }; // tallest a mob may draw, as a multiple of a human
  const css = document.createElement('style');
  css.textContent = `.figure:has(> .mobfig) { height: auto; overflow: visible; min-height: 80px; }
    .mobfig { position: relative; display: block; margin: 0 auto; pointer-events: none; }
    .mobfig canvas { position: absolute; image-rendering: pixelated; image-rendering: crisp-edges; filter: drop-shadow(0 3px 0 rgba(0,0,0,.35)); }
    .mobfig::before { content: ''; position: absolute; left: 12%; right: 12%; bottom: -3px; height: 8px; border-radius: 50%; background: rgba(0,0,0,.45); }
    .unit.active .mobfig canvas { filter: drop-shadow(0 0 6px rgba(214,161,74,.55)) drop-shadow(0 3px 0 rgba(0,0,0,.35)); }
    .unit.dead .mobfig canvas { filter: grayscale(1) brightness(.5); opacity: .7; }
    .mobstill { image-rendering: pixelated; }`;
  document.head.appendChild(css);
  const sheets = {};
  const sheet = (k) => sheets[k] || (sheets[k] = Object.assign(new Image(), { decoding: 'async', src: 'img/mobs/' + k + '.webp' }));
  const D = () => window.CB_DATA || null;
  // which sheet an enemy wears: its own, its map boss's (raid bosses), or the monster its group is made of (smaller)
  function keyFor(a) {
    let k = a.key, sm = 1; const d = D() && D().enemies[k];
    if (!M[k] && d && d.raid && d.map && D().maps[d.map]) k = D().maps[d.map].boss;
    if (!M[k] && d && d.art && M[d.art]) { k = d.art; sm = 0.8; }
    return M[k] ? { k, sm, tier: (d && d.tier) || '1' } : null;
  }
  const state = {};                                  // actor id -> { k, anim, t0, dead, phased }
  function figure(a, unit) {
    if (!a || a.isPlayer) return null;
    const f = keyFor(a); if (!f) return null; const m = M[f.k];
    if (!unit) return `<img class="inkfig mobstill" src="img/mobs/${f.k}_p.webp" alt="" draggable="false">`;
    sheet(f.k);
    const [x0, y0, x1, y1] = m.ib, ih = y1 - y0;
    const scale = Math.min(ih / REF, CAP[f.tier] || 1.3) / ih * f.sm;  // CSS height of one sheet pixel, in units of var(--fh) * 1.12
    const u = (v) => `calc(var(--fh, 118px) * ${(1.12 * scale * v).toFixed(5)})`;
    const st = state[a.id] || (state[a.id] = { k: f.k, anim: 'idle', t0: performance.now() - Math.random() * 1500 }); st.k = f.k;
    return `<span class="mobfig" data-mob="${a.id}" style="width:${u(x1 - x0)};height:${u(ih)}"><canvas width="${m.w}" height="${m.h}" style="left:${u(-x0)};top:${u(-y0)};width:${u(m.w)};height:${u(m.h)}"></canvas></span>`;
  }
  const row = (m, name) => m.a.findIndex(x => x[0] === name);
  const has = (m, name) => name && row(m, name) >= 0;
  function play(id, name) { const st = state[id]; if (!st || st.dead) return false; const m = M[st.k]; if (!has(m, name)) return false; st.anim = name; st.t0 = performance.now(); return true; }
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function attacks(m) { return m.atk || m.a.map(x => x[0]).filter(n => /^attack/.test(n) && n !== m.aoe); }
  // an enemy plays a card (engine fx event 'eplay': kind attack/defend/buff/debuff/status, aoe, card name)
  function cardPlay(e) {
    const st = state[e.s]; if (!st) return; const m = M[st.k];
    let name = m.card && m.card[e.name];
    if (!name) {
      if (e.kind === 'attack') name = e.aoe && m.aoe ? m.aoe : pick(attacks(m));
      else if (e.kind === 'defend') name = m.def || (has(m, 'defend') ? 'defend' : has(m, 'buff') ? 'buff' : null);
      else name = m.buff || (has(m, 'buff') ? 'buff' : has(m, 'defend') ? 'defend' : null);
    }
    if (name && play(e.s, name)) st.carded = performance.now();
  }
  function hurt(id, big) {
    const st = state[id]; if (!st) return; const m = M[st.k];
    play(id, m.hit || 'hit');
    const a = window.__cbActor ? window.__cbActor(id) : null;
    if (m.phase && a && !st.phased && a.hp > 0 && a.hp <= a.maxHp / 2) { st.phased = true; setTimeout(() => play(id, m.phase), 700); }
  }
  // the fight's effects (src/fx.js) ask the Forge to move fighters; monsters with a sheet answer here instead
  function hook() {
    const F = window.CB_FORGE; if (!F || F._mobs) return; F._mobs = true; const orig = F.play;
    F.play = function (id, move, o) {
      if (state[id] && document.querySelector(`.mobfig[data-mob="${id}"]`)) {
        if (move === 'elunge') { const st = state[id]; if (!(st.carded && performance.now() - st.carded < 900)) play(id, pick(attacks(M[st.k]))); }
        else if (move === 'ehit' || move === 'eknock') hurt(id, move === 'eknock');
        return;
      }
      return orig.call(this, id, move, o);
    };
  }
  const FMS = { idle: 140 };
  function draw(now) {
    requestAnimationFrame(draw); hook();
    for (const el of document.querySelectorAll('.mobfig')) {
      const id = el.dataset.mob, st = state[id]; if (!st) continue; const m = M[st.k], img = sheet(st.k);
      if (!img.complete || !img.naturalWidth) continue;
      const dead = !!el.closest('.unit.dead');
      let name = st.anim, r = row(m, name), n = m.a[r] ? m.a[r][1] : 1, ms = FMS[name] || 95, i = Math.floor((now - st.t0) / ms);
      if (dead) { const h = row(m, m.hit || 'hit'); r = h >= 0 ? h : 0; i = m.a[r][1] - 1; st.dead = true; }
      else {
        if (st.dead) { st.dead = false; st.anim = 'idle'; st.t0 = now; }
        if (name !== 'idle' && i >= n) { st.anim = 'idle'; st.t0 = now; name = 'idle'; r = row(m, 'idle'); n = m.a[r][1]; i = 0; }
        if (name === 'idle') i = i % n;
      }
      const cv = el.firstElementChild, sig = st.k + r + ':' + i;
      if (cv._sig === sig) continue; cv._sig = sig;
      const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(img, i * m.w, r * m.h, m.w, m.h, 0, 0, m.w, m.h);
    }
  }
  requestAnimationFrame(draw);
  window.CB_MOBS = {
    manifest: M, figure, cardPlay, play, has: (k) => !!M[k],
    preload(keys) { for (const k0 of keys || []) { const f = keyFor({ key: k0 }); if (f) { sheet(f.k); new Image().src = 'img/mobs/' + f.k + '_p.webp'; } } },
  };
  // load a map's sheets along with the ink art the game already preloads
  const I = window.CB_INK;
  if (I && I.preload && !I._mobs) { I._mobs = true; const p = I.preload.bind(I); I.preload = function (keys) { try { window.CB_MOBS.preload(keys); } catch (e) {} return p(keys); }; }
})();
