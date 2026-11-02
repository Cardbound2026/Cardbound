  // ---------- The Forge (Nov 2): live hero sprites built from the gear they wear, with simple animations.
  // Drawing comes from the PAPERFORGE core (src/forge_engine.js, window.CB_PF). This file decides what a hero looks like (class face and
  // hair, plus one sprite piece per equipped item, tinted by the item's map and rarity), draws each hero's animation frames once per gear
  // set (spread over idle time so the game never stalls), and plays them on the fight screen: idle, attack swing, twirl (area attacks),
  // cast, guard and a hit flinch. Without forge_engine.js the game keeps the still ink pictures.
  // TO REMOVE: delete this file and src/forge_engine.js; figure() falls back to the ink art by itself.
  window.CB_FORGE = (function () {
    const P = window.CB_PF; if (!P) return null;
    // class looks (face, hair...) and the pieces a hero wears in a slot with nothing equipped (the plain "base body" clothes)
    const CLASS_LOOK = {
      Warrior: { scheme: 'pilgrim', face: 'veteran', hair: 'swept', beard: 'stubble', mark: 'scar' },
      Rogue: { scheme: 'moss', face: 'rogue', hair: 'crop', beard: 'none', mark: 'cheek' },
      Mage: { scheme: 'funeral', face: 'mystic', hair: 'long', beard: 'pointed', mark: 'runes' },
      Paladin: { scheme: 'brass', face: 'pilgrim', hair: 'curls', beard: 'short', mark: 'none' },
      Warlock: { scheme: 'funeral', face: 'skull', hair: 'bald', beard: 'none', mark: 'none' },
    };
    const BASE = { head: 'none_0', chest: 'cloth_0', shoulders: 'none_0', hands: 'none_0', waist: 'belt_0', legs: 'pants_0', feet: 'none_0', back: 'none_0', weapon: 'none_0', offhand: 'none_0' };
    // game item archetype -> sprite slot and one piece per map (Broken March, Cinder Reach, Rimewatch, Tanglewild, Shattered Spire, Hollow Crypts)
    const ARCH = {
      Greathelm: ['head', 'helm_2', 'helm_0', 'helm_4', 'helm_3', 'helm_1', 'helm_5'], 'Leather Cap': ['head', 'wrap_0', 'hat_1', 'wild_1', 'hat_2', 'wrap_2', 'wild_2'], 'Cloth Hood': ['head', 'hood_0', 'hood_1', 'hat_0', 'wild_0', 'hat_3', 'hood_2'],
      Cuirass: ['chest', 'mail_0', 'plate_0', 'mail_1', 'plate_3', 'mail_2', 'plate_2'], Jerkin: ['chest', 'leather_1', 'leather_0', 'coat_2', 'leather_2', 'coat_0', 'leather_3'], Robe: ['chest', 'cloth_1', 'cloth_2', 'coat_3', 'exotic_3', 'cloth_3', 'cloth_3'],
      Pauldrons: ['shoulders', 'pauldron_0', 'pauldron_1', 'pauldron_3', 'wildshoulder_3', 'pauldron_1', 'pauldron_2'], Spaulders: ['shoulders', 'mantle_0', 'mantle_0', 'wildshoulder_0', 'wildshoulder_3', 'mantle_2', 'wildshoulder_1'], Mantle: ['shoulders', 'mantle_1', 'mantle_2', 'mantle_3', 'wildshoulder_3', 'wildshoulder_4', 'mantle_1'],
      Gauntlets: ['hands', 'glovemetal_1', 'glovemetal_0', 'glovemetal_0', 'glovemetal_2', 'glovemetal_0', 'glovemetal_3'], 'Leather Gloves': ['hands', 'gloveleather_1', 'gloveleather_0', 'gloveleather_2', 'gloveleather_1', 'gloveleather_2', 'gloveleather_0'], Handwraps: ['hands', 'glovewrap_1', 'glovewrap_0', 'glovewrap_2', 'glovewrap_0', 'glovewrap_2', 'glovewrap_2'],
      Vambraces: ['hands', 'glovemetal_0'], 'Leather Bracers': ['hands', 'gloveleather_0'], Wraps: ['hands', 'glovewrap_0'],
      Girdle: ['waist', 'belt_3', 'belt_3', 'belt_1', 'belt_2', 'supply_3', 'ritualbelt_0'], 'Leather Belt': ['waist', 'belt_1', 'supply_0', 'belt_0', 'belt_2', 'supply_1', 'belt_1'], Sash: ['waist', 'ritualbelt_1', 'supply_2', 'ritualbelt_2', 'belt_2', 'supply_2', 'ritualbelt_1'],
      Greaves: ['legs', 'greaves_0', 'greaves_1', 'greaves_1', 'greaves_3', 'greaves_0', 'greaves_2'], Breeches: ['legs', 'pants_1', 'pants_0', 'pants_3', 'pants_1', 'pants_3', 'pants_2'], Leggings: ['legs', 'skirt_0', 'skirt_1', 'skirt_3', 'skirt_2', 'skirt_3', 'skirt_1'],
      Sabatons: ['feet', 'sabatons_1', 'sabatons_0', 'sabatons_3', 'sabatons_1', 'sabatons_0', 'sabatons_2'], 'Leather Boots': ['feet', 'boot_0', 'boot_1', 'boot_3', 'boot_0', 'boot_2', 'boot_1'], Slippers: ['feet', 'footwrap_1', 'footwrap_0', 'footwrap_1', 'footwrap_0', 'footwrap_1', 'footwrap_0'],
      Cloak: ['back', 'cape_0', 'cape_1', 'cape_4', 'cape_1', 'cape_3', 'cape_2'],
      '1H Sword': ['weapon', 'sword_0', 'sword_2', 'sword_3', 'sword_1', 'sword_3', 'sword_4'], '1H Axe': ['weapon', 'axe_0', 'axe_1', 'axe_2', 'axe_3', 'axe_1', 'axe_3'], Dagger: ['weapon', 'dagger_0', 'dagger_3', 'dagger_1', 'dagger_2', 'dagger_0', 'dagger_4'],
      '1H Mace': ['weapon', 'mace_0', 'mace_1', 'mace_3', 'mace_1', 'mace_2', 'mace_3'], Wand: ['weapon', 'wand_0', 'wand_1', 'wand_3', 'wand_2', 'wand_0', 'wand_2'],
      '2H Sword': ['weapon', 'greatsword_0', 'greatsword_2', 'greatsword_1', 'greatsword_0', 'greatsword_1', 'greatsword_3'], '2H Axe': ['weapon', 'greataxe_0', 'greataxe_1', 'greataxe_2', 'greataxe_0', 'greataxe_1', 'greataxe_2'],
      '2H Maul': ['weapon', 'hammer_0', 'hammer_2', 'hammer_1', 'hammer_2', 'hammer_1', 'hammer_3'], '2H Warhammer': ['weapon', 'hammer_1', 'hammer_2', 'hammer_0', 'hammer_2', 'hammer_1', 'hammer_3'],
      'Arcane Staff': ['weapon', 'staff_2'], 'Fire Staff': ['weapon', 'staff_4'], 'Frost Staff': ['weapon', 'staff_2'], 'Nature Staff': ['weapon', 'staff_3'], 'Shadow Staff': ['weapon', 'staff_1'],
      'Kite Shield': ['offhand', 'shield_1', 'shield_0', 'shield_1', 'shield_5', 'shield_1', 'shield_4'], 'Tower Shield': ['offhand', 'shield_2'], Focus: ['offhand', 'arcane_2', 'light_2', 'arcane_0', 'relic_1', 'arcane_1', 'book_2'],
    };
    const OFF_WEAPON = { Dagger: 'secondary_0', '1H Sword': 'secondary_1', '1H Axe': 'secondary_2', '1H Mace': 'secondary_3', Wand: 'secondary_0' }; // a 1H weapon carried in the off-hand
    const SLOT_OF = { Helm: 'head', Chest: 'chest', Shoulders: 'shoulders', Gloves: 'hands', Bracers: 'hands', Belt: 'waist', Pants: 'legs', Boots: 'feet', Cloak: 'back', Weapon: 'weapon', 'Off-hand': 'offhand' };
    // colours: [main, dark, trim]. Metal and cloth/leather each take their map's tint; trim shows rarity
    const MAP_N = { physical: 0, fire: 1, frost: 2, nature: 3, arcane: 4, shadow: 5 };
    const METAL = ['#8b9286', '#8a6a52', '#a3b6c2', '#7d8a62', '#8a7ca6', '#5d5468'], SOFT = ['#6b5640', '#7a3e30', '#4f6577', '#4f6040', '#5a4a78', '#3e3846'];
    const TRIM = { White: '#9b8a6a', Green: '#8fbf6a', Blue: '#7fb0e8', 'Purple (Epic)': '#c890ee', Codex: '#e0802a' };
    const isMetal = (id) => /^(helm|mail|plate|pauldron|glovemetal|greaves|sabatons|belt_3|shield|sword|greatsword|axe|greataxe|mace|hammer|dagger|secondary)/.test(id);
    const DATA = window.CB_DATA, baseOf = {}; for (const b of (DATA && DATA.gear && DATA.gear.bases) || []) baseOf[b.name] = b;
    // the look for a hero: class face plus one piece per equipped item
    function lookFor(cls, gear) {
      const L = Object.assign({}, CLASS_LOOK[cls] || CLASS_LOOK.Warrior), items = Object.assign({}, BASE), dyes = {};
      const gloves = (gear || []).some((g) => g && g.slot === 'Gloves');
      for (const g of gear || []) {
        if (!g) continue; const slot = SLOT_OF[g.slot]; if (!slot) continue; if (g.slot === 'Bracers' && gloves) continue;
        const b = baseOf[g.name], arch = g.arch || (b && b.arch), mi = MAP_N[(b && b.map) || 'physical'] || 0;
        let id = null; if (slot === 'offhand' && OFF_WEAPON[arch]) id = OFF_WEAPON[arch]; else { const row = ARCH[arch]; if (row) id = row[1 + (mi % (row.length - 1))]; }
        if (!id || !P.CATALOG[slot] || !P.CATALOG[slot].some((x) => x.id === id)) continue;
        items[slot] = id; const main = (isMetal(id) ? METAL : SOFT)[mi];
        dyes[slot] = [main, P.mix(main, '#000000', 0.62), TRIM[g.rarity] || TRIM.White];
      }
      L.items = items; L.dyes = dyes; return L;
    }
    function stateFor(L) {
      const s = P.makeState(); s.faceType = L.face; s.hair = L.hair; s.beard = L.beard; s.mark = L.mark; s.hairColor = '#4a4037';
      s.skin = L.face === 'skull' ? P.SKINS[6] : L.face === 'orc' ? P.SKINS[8] : P.SKINS[1];
      for (const sl of P.SLOTS) s.gear[sl].id = L.items[sl] || 'none_0';
      P.applyPalette(s, L.scheme, false);
      for (const [sl, c] of Object.entries(L.dyes)) s.gear[sl].colors = c.slice();
      return s;
    }
    const keyOf = (L) => JSON.stringify([L.face, L.hair, L.items, L.dyes]);
    // ---------- frames: drawn once per look, cropped, cached
    const RW = 240; // drawing width (the motion canvas is wider than the figure: room for the swing)
    const CLIPN = { idle: 8, attack: 9, cast: 9, guard: 6, hit: 5, ready: 1 };
    const ORDER = ['idle', 'hit', 'attack', 'cast', 'guard', 'ready'];
    const cache = new Map(), queue = [];
    function crop(cv) {
      const c = cv.getContext('2d'), w = cv.width, h = cv.height, d = c.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (d[(y * w + x) * 4 + 3] > 6) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return { cv: null, x: 0, y: 0, w: 0, h: 0 };
      const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(cv, -x0, -y0);
      return { cv: o, x: x0, y: y0, w: o.width, h: o.height };
    }
    function sprite(L) {
      const k = keyOf(L); let S = cache.get(k); if (S) return S;
      S = { key: k, look: L, s: stateFor(L), clips: {}, ms: {}, box: null, W: 0, H: 0, ready: false };
      for (const c of ORDER) { S.clips[c] = new Array(CLIPN[c]).fill(null); S.ms[c] = c === 'ready' ? 0 : (P.clipInfo(S.s, c) || {}).ms || 1000; }
      cache.set(k, S); for (const c of ORDER) for (let i = 0; i < CLIPN[c]; i++) queue.push([S, c, i]); pump();
      if (cache.size > 24) { const old = cache.keys().next().value; cache.delete(old); } // a handful of looks at a time is plenty
      return S;
    }
    let pumping = false;
    function pump() { if (pumping) return; pumping = true; setTimeout(step, 0); }
    function step() {
      const t0 = performance.now();
      while (queue.length && performance.now() - t0 < 10) { // about one frame's worth of drawing per tick, so fights never stutter
        const [S, c, i] = queue.shift(); if (!cache.has(S.key)) continue;
        if (c === 'town') { townStep(S, i); continue; }
        const n = CLIPN[c], cv = P.motionCompose(S.s, RW, c, n === 1 ? 0 : P.CLIPS[c] && P.CLIPS[c].loop ? i / n : i / Math.max(1, n - 1), false);
        if (!S.W) { S.W = cv.width; S.H = cv.height; }
        const f = crop(cv); S.clips[c][i] = f;
        if (c === 'idle' && i === 0) { S.box = { x: f.x, y: f.y, w: f.w, h: f.h }; S.ready = true; }
      }
      pumping = false; if (queue.length) { pumping = true; setTimeout(step, 16); }
    }
    // ---------- town walker and character-sheet doll: 4 idle + 6 walk frames, drawn on request (ahead of fight frames), feet kept in place
    const TW = 170;
    function townFrames(S) {
      if (S.town) return S.town; S.town = { f: new Array(10).fill(null), done: 0, box: null, footX: 0 };
      for (let i = 9; i >= 0; i--) queue.unshift([S, 'town', i]); pump(); return S.town;
    }
    function townStep(S, i) {
      const T = S.town, cv = P.motionCompose(S.s, TW, i < 4 ? 'idle' : 'walk', i < 4 ? i / 4 : (i - 4) / 6, false), f = crop(cv);
      if (i === 0) { const d = cv.getContext('2d').getImageData(0, f.y + f.h - 6, cv.width, 6).data; let sx = 0, n = 0; for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 6) { sx += (k / 4) % cv.width; n++; } T.footX = n ? sx / n : f.x + f.w / 2; }
      T.f[i] = f; T.done++;
      if (T.done === 10) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of T.f) if (q.cv) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x + q.w); y1 = Math.max(y1, q.y + q.h); } T.box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; window.dispatchEvent(new Event('forge-ready')); }
    }
    const face = {};
    function town(g, cls, gear, cx, by, dir, step, s, t, who) {
      const S = sprite(lookFor(cls, gear)), T = townFrames(S); if (!T.box) return false;
      if (dir === 'left' || dir === 'right') face[who || S.key] = dir; const left = dir === 'left' || ((dir === 'up' || dir === 'down') && face[who || S.key] === 'left');
      const fr = T.f[step ? 4 + Math.floor(t / 120) % 6 : Math.floor(t / 520) % 4]; if (!fr || !fr.cv) return false;
      const H = Math.min(72 * s, by - 8), k = H / T.box.h, top = by - (T.box.y + T.box.h - fr.y) * k, dx = (fr.x - T.footX) * k;
      g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, by, 15 * s, 5 * s, 0, 0, Math.PI * 2); g.fill();
      g.translate(cx, 0); if (left) g.scale(-1, 1); g.imageSmoothingQuality = 'high'; g.drawImage(fr.cv, dx, top, fr.w * k, fr.h * k); g.restore();
      return true;
    }
    // ---------- animation state per fighter (by actor id), and the fight-screen player
    const anim = {}; // id -> { clip, t0, fx }
    function play(id, clip, fx) { anim[id] = { clip, t0: performance.now(), fx: fx || null }; }
    const TWIRL_MS = 620;
    function figureHtml(a, fallback) {
      const L = lookFor(a.cls, a.look), S = sprite(L), ar = S.box ? S.box.w / S.box.h : 0.62;
      return `<span class="forgefig${S.ready ? ' on' : ''}" data-fg="${a.id}" data-fk="${encodeURIComponent(S.key)}" style="--s:1.12;--ar:${ar.toFixed(3)}"><canvas></canvas>${fallback || ''}</span>`;
    }
    const byKey = (k) => cache.get(decodeURIComponent(k));
    function frameFor(S, st, now) {
      let clip = st ? st.clip : 'idle', t = st ? now - st.t0 : now;
      if (clip === 'twirl') { if (t > TWIRL_MS) { clip = 'idle'; t = now; } else return { f: S.clips.ready[0] || S.clips.idle[0], spin: t / TWIRL_MS }; }
      const fr = S.clips[clip], ms = S.ms[clip] || 1000;
      if (clip !== 'idle' && (t > ms || !fr || !fr.every(Boolean))) { clip = 'idle'; t = now; }
      const F = S.clips[clip], n = F.length, i = clip === 'idle' ? Math.floor((t % S.ms.idle) / S.ms.idle * n) : Math.min(n - 1, Math.floor(t / (S.ms[clip] || 1000) * n));
      return { f: F[i] || S.clips.idle[0], spin: null };
    }
    function draw(now) {
      for (const el of document.querySelectorAll('.forgefig')) {
        const S = byKey(el.dataset.fk); if (!S || !S.ready) continue;
        const cv = el.firstElementChild; if (!el.classList.contains('on')) { el.classList.add('on'); el.style.setProperty('--ar', (S.box.w / S.box.h).toFixed(3)); }
        if (cv.width !== S.W) { cv.width = S.W; cv.height = S.H; }
        const h = el.clientHeight; if (h && cv.dataset.h !== String(h)) { const k = h / S.box.h; cv.style.width = S.W * k + 'px'; cv.style.height = S.H * k + 'px'; cv.style.left = -S.box.x * k + 'px'; cv.style.top = -S.box.y * k + 'px'; cv.dataset.h = h; }
        const r = frameFor(S, anim[el.dataset.fg], now); if (!r.f || !r.f.cv) continue;
        const sig = r.f.x + ':' + r.f.y + ':' + r.f.w + ':' + (r.spin == null ? '' : Math.round(r.spin * 40)) + ':' + (r.f.cv && r.f.cv.width);
        if (cv._sig === sig && r.spin == null) continue; cv._sig = sig;
        const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
        if (r.spin != null) { // twirl: a cut-paper spin (the figure turns edge-on and back) with an ink swoosh around it
          const cx = S.box.x + S.box.w / 2, sx = Math.cos(r.spin * Math.PI * 2);
          const sc = Math.sign(sx || 1) * Math.max(0.22, Math.pow(Math.abs(sx), 0.45)); // eased so the figure stays readable through most of the spin
          g.save(); g.translate(cx, 0); g.scale(sc, 1); g.translate(-cx, 0); g.drawImage(r.f.cv, r.f.x, r.f.y); g.restore();
          const cy = S.box.y + S.box.h * 0.55, rx = S.box.w * 0.95, ry = S.box.h * 0.16, a0 = r.spin * Math.PI * 4;
          g.save(); g.globalAlpha = Math.sin(r.spin * Math.PI) * 0.85; g.lineCap = 'round';
          for (const [w, col] of [[7, '#121918'], [3.5, '#e8d6a8']]) { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, a0, a0 + Math.PI * 1.3); g.stroke(); }
          g.restore();
        } else g.drawImage(r.f.cv, r.f.x, r.f.y);
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    // ---------- what a played card looks like
    function clipForCard(q) { if (q.type === 'Attack') return q.aoe ? 'twirl' : 'attack'; if (q.type === 'Skill') return q.dmg || q.heal ? 'cast' : q.def ? 'guard' : 'cast'; return 'cast'; }
    function consume(cb) { const Q = cb && cb.animQ; if (!Q || !Q.length) return; for (const q of Q.splice(0)) play(q.id, clipForCard(q), q); }
    function warm(cls, gear) { return sprite(lookFor(cls, gear)); } // start drawing a hero before the fight opens
    return { town, lookFor, stateFor, sprite, figureHtml, play, consume, warm, clipForCard, cache, ARCH, CLASS_LOOK };
  })();
