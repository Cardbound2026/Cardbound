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
      '2H Maul': ['weapon', 'hammer_0', 'hammer_2', 'hammer_1', 'hammer_2', 'hammer_1', 'hammer_3'], '2H Scythe': ['weapon', 'polearm_0', 'polearm_1', 'polearm_2', 'polearm_3', 'polearm_4', 'polearm_1'], '2H Warhammer': ['weapon', 'hammer_1', 'hammer_2', 'hammer_0', 'hammer_2', 'hammer_1', 'hammer_3'],
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
    // overrides made in the Forge page (public/forge.html): which sprite piece each item archetype uses per map, and the colours.
    // Saved for everyone in src/forge_overrides.js (window.CB_FORGE_OVERRIDES); the page also keeps unsaved ones in this browser.
    function applyOverrides(o) {
      if (!o) return; for (const [k, row] of Object.entries(o.arch || {})) if (Array.isArray(row) && row.length >= 2) ARCH[k] = row.slice();
      for (const [k, v] of Object.entries(o.offWeapon || {})) OFF_WEAPON[k] = v;
      if (Array.isArray(o.metal)) o.metal.forEach((c, i) => { if (c) METAL[i] = c; }); if (Array.isArray(o.soft)) o.soft.forEach((c, i) => { if (c) SOFT[i] = c; });
      for (const [k, v] of Object.entries(o.trim || {})) TRIM[k] = v;
      for (const [cls, L] of Object.entries(o.classLook || {})) if (CLASS_LOOK[cls]) Object.assign(CLASS_LOOK[cls], L);
      for (const [sl, id] of Object.entries(o.base || {})) BASE[sl] = id;
      cache.clear(); queue.length = 0;
    }
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
    const CLIPN = { idle: 8, attack: 9, cast: 9, guard: 6, hit: 5, ready: 1, jump: 6 };
    const ORDER = ['idle', 'hit', 'attack', 'cast', 'guard', 'ready', 'jump'];
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
      cache.set(k, S);
      if (cache.size > 48) { const old = cache.keys().next().value; cache.delete(old); } // a town's worth of looks at a time is plenty
      return S;
    }
    function fightFrames(S) { if (S.fightQ) return S; S.fightQ = true; for (const c of ORDER) for (let i = 0; i < CLIPN[c]; i++) queue.push([S, c, i]); pump(); return S; } // only fighters need these
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
    // ---------- moves: drawn frames plus body motion over time. x/y are fractions of the figure's height (x > 0 = toward the enemy)
    const bell = (t, a, b, c) => t <= a || t >= c ? 0 : t < b ? Math.sin((t - a) / (b - a) * Math.PI / 2) : Math.cos((t - b) / (c - b) * Math.PI / 2);
    const ease = (t) => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
    const seq = (S, clip, u) => { const F = S.clips[clip]; if (!F || !F.every(Boolean)) return null; return F[Math.min(F.length - 1, Math.max(0, Math.floor(u * F.length)))]; };
    const MOVES = {
      attack: { ms: (S) => S.ms.attack, f: (S, u) => ({ fr: seq(S, 'attack', u), x: 0.16 * bell(u, 0.2, 0.48, 0.9) }) },                     // a forward step into the swing
      heavy: { ms: (S) => S.ms.attack * 1.15, f: (S, u) => ({ fr: seq(S, 'attack', u), x: 0.1 * bell(u, 0.25, 0.5, 0.95), y: 0.02 * bell(u, 0.45, 0.52, 0.7) }) },
      leap: { ms: () => 1000, f: (S, u) => u < 0.42 ? { fr: seq(S, 'jump', u / 0.42), x: 0.42 * ease(u / 0.42), y: -0.5 * Math.sin(u / 0.42 * Math.PI) }          // 2H: leap in...
        : { fr: seq(S, 'attack', 0.25 + (u - 0.42) / 0.58 * 0.75), x: 0.42 * (1 - ease((u - 0.42) / 0.58)), y: 0.03 * bell(u, 0.45, 0.5, 0.62), ev: 'land' } }, // ...and slam down
      lunge: { ms: (S) => S.ms.attack * 0.85, f: (S, u) => ({ fr: seq(S, 'attack', u), x: 0.3 * bell(u, 0.15, 0.45, 0.95) }) },            // daggers and thrusts: a long dash in and out
      double: { ms: (S) => S.ms.attack * 1.5, f: (S, u) => { const v = u < 0.5 ? u * 2 : (u - 0.5) * 2; return { fr: seq(S, 'attack', 0.15 + v * 0.85), x: 0.14 * bell(v, 0.1, 0.45, 0.95) }; } },
      cast: { ms: (S) => S.ms.cast, f: (S, u) => ({ fr: seq(S, 'cast', u) }) },
      empower: { ms: (S) => S.ms.cast * 1.1, f: (S, u) => ({ fr: seq(S, 'cast', u), y: -0.05 * bell(u, 0.2, 0.55, 1) }) },                  // Powers: rise into a glow
      guard: { ms: (S) => S.ms.guard, f: (S, u) => ({ fr: seq(S, 'guard', u), x: -0.03 * bell(u, 0.2, 0.45, 1) }) },
      guard2: { ms: (S) => S.ms.guard * 1.5, f: (S, u) => { const v = u < 0.5 ? u * 2 : (u - 0.5) * 2; return { fr: seq(S, 'guard', 0.2 + v * 0.8), x: -0.04 * bell(v, 0.2, 0.45, 1) }; } }, // more than one Block in a card
      hit: { ms: (S) => S.ms.hit, f: (S, u) => ({ fr: seq(S, 'hit', u), x: -0.07 * bell(u, 0, 0.2, 1) }) },
      knock: { ms: (S) => S.ms.hit * 1.3, f: (S, u) => ({ fr: seq(S, 'hit', u), x: -0.2 * bell(u, 0, 0.18, 1), rot: -6 * bell(u, 0, 0.2, 1) }) }, // a big hit
      dodge: { ms: () => 420, f: (S, u) => ({ fr: seq(S, 'guard', 0.3), x: -0.34 * bell(u, 0, 0.35, 1), alpha: 1 - 0.45 * bell(u, 0, 0.35, 1) }) },
      parry: { ms: (S) => S.ms.guard, f: (S, u) => ({ fr: seq(S, 'guard', 0.5 + u * 0.5), x: 0.05 * bell(u, 0, 0.15, 0.6) }) },
      vanish: { ms: () => 500, f: (S, u) => ({ fr: S.clips.idle[0], alpha: 1 - 0.62 * ease(u), y: 0.02 * ease(u) }) },
      twirl: { ms: () => 620, f: (S, u) => ({ fr: S.clips.ready[0] || S.clips.idle[0], spin: u }) },
    };
    const anim = {}; // id -> { move, t0, until }
    function play(id, move, o) { if (!MOVES[move] && !EMOVES[move]) return; anim[id] = Object.assign({ move, t0: performance.now() }, o || {}); }
    // monsters are still pictures: they lunge at you and shake when hit
    const EMOVES = { elunge: { ms: 520, f: (u) => ({ x: 0.22 * bell(u, 0.1, 0.4, 1) }) }, ehit: { ms: 360, f: (u) => ({ x: -0.05 * Math.sin(u * Math.PI * 5) * (1 - u), rot: 3 * Math.sin(u * Math.PI * 4) * (1 - u) }) },
      eknock: { ms: 520, f: (u) => ({ x: -0.14 * bell(u, 0, 0.2, 1), rot: 7 * bell(u, 0, 0.2, 1) }) } };
    function figureHtml(a, fallback) {
      const L = lookFor(a.cls, a.look), S = fightFrames(sprite(L)), ar = S.box ? S.box.w / S.box.h : 0.62;
      return `<span class="forgefig${S.ready ? ' on' : ''}" data-fg="${a.id}" data-fk="${encodeURIComponent(S.key)}" style="--s:1.12;--ar:${ar.toFixed(3)}"><canvas></canvas>${fallback || ''}</span>`;
    }
    const byKey = (k) => cache.get(decodeURIComponent(k));
    const states = {}; // id -> { stealth, dead } (set by the fight screen every render)
    function setStates(m) { for (const k in states) delete states[k]; Object.assign(states, m); }
    const events = []; // move events the effects layer listens for (e.g. a leap landing)
    function frameFor(S, id, now) {
      const st = anim[id], M = st && MOVES[st.move], sx = states[id] || {};
      if (sx.dead) return { fr: seq(S, 'hit', 0.99) || S.clips.idle[0], rot: -80, y: 0.08, dead: true };
      if (M) { const ms = M.ms(S), u = (now - st.t0) / ms; if (u < 1) { const r = M.f(S, u); if (r.fr) { if (r.ev && !st.fired) { st.fired = true; events.push({ id, ev: r.ev }); } if (sx.stealth && r.alpha == null) r.alpha = 0.4; return r; } } delete anim[id]; }
      const F = S.clips.idle, i = Math.floor((now % S.ms.idle) / S.ms.idle * F.length);
      return { fr: F[i] || F[0], alpha: sx.stealth ? 0.38 : 1, y: sx.stealth ? 0.025 : 0 };
    }
    function draw(now) {
      for (const el of document.querySelectorAll('.forgefig')) {
        const S = byKey(el.dataset.fk); if (!S || !S.ready) continue;
        const cv = el.firstElementChild; if (!el.classList.contains('on')) { el.classList.add('on'); el.style.setProperty('--ar', (S.box.w / S.box.h).toFixed(3)); }
        if (cv.width !== S.W) { cv.width = S.W; cv.height = S.H; }
        const h = el.clientHeight, k = h / S.box.h;
        if (h && cv.dataset.h !== String(h)) { cv.style.width = S.W * k + 'px'; cv.style.height = S.H * k + 'px'; cv.style.left = -S.box.x * k + 'px'; cv.style.top = -S.box.y * k + 'px'; cv.style.transformOrigin = `${(S.box.x + S.box.w / 2) * k}px ${(S.box.y + S.box.h) * k}px`; cv.dataset.h = h; }
        const id = el.dataset.fg, r = frameFor(S, id, now); if (!r.fr || !r.fr.cv) continue;
        const flip = el.closest('#foes') ? -1 : 1; // a hero on the right (duels) faces left
        const tf = `translate(${((r.x || 0) * flip * h).toFixed(1)}px, ${((r.y || 0) * h).toFixed(1)}px) rotate(${((r.rot || 0) * flip).toFixed(1)}deg)${flip < 0 ? ' scaleX(-1)' : ''}`;
        if (cv._tf !== tf) { cv.style.transform = tf; cv._tf = tf; }
        const al = r.alpha == null ? 1 : r.alpha; if (cv._al !== al) { cv.style.opacity = al; cv._al = al; }
        const sig = r.fr.x + ':' + r.fr.y + ':' + r.fr.w + ':' + (r.spin == null ? '' : Math.round(r.spin * 40)) + ':' + r.fr.cv.width;
        if (cv._sig === sig && r.spin == null) continue; cv._sig = sig;
        const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
        if (r.spin != null) { // twirl: a cut-paper spin with an ink swoosh around it
          const cx = S.box.x + S.box.w / 2, sx = Math.cos(r.spin * Math.PI * 2), sc = Math.sign(sx || 1) * Math.max(0.22, Math.pow(Math.abs(sx), 0.45));
          g.save(); g.translate(cx, 0); g.scale(sc, 1); g.translate(-cx, 0); g.drawImage(r.fr.cv, r.fr.x, r.fr.y); g.restore();
          const cy = S.box.y + S.box.h * 0.55, rx = S.box.w * 0.95, ry = S.box.h * 0.16, a0 = r.spin * Math.PI * 4;
          g.save(); g.globalAlpha = Math.sin(r.spin * Math.PI) * 0.85; g.lineCap = 'round';
          for (const [w, col] of [[7, '#121918'], [3.5, '#e8d6a8']]) { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, a0, a0 + Math.PI * 1.3); g.stroke(); }
          g.restore();
        } else g.drawImage(r.fr.cv, r.fr.x, r.fr.y);
      }
      for (const id in anim) { // monster pictures
        const st = anim[id], M = EMOVES[st.move]; if (!M) continue;
        const img = document.querySelector(`.unit[data-id="${id}"] .figure > img, .unit[data-id="${id}"] .figure > svg`); const u = (now - st.t0) / M.ms;
        if (u >= 1) { delete anim[id]; if (img) img.style.transform = ''; continue; }
        if (!img) continue; const h = img.clientHeight || 100, r = M.f(u), flip = img.closest('#foes') ? -1 : 1;
        img.style.transformOrigin = '50% 100%'; img.style.transform = `translate(${((r.x || 0) * flip * h).toFixed(1)}px, ${((r.y || 0) * h).toFixed(1)}px) rotate(${((r.rot || 0) * flip).toFixed(1)}deg)`;
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    // ---------- the hero's weapon, so the effects layer can pick a slash, a stab or a smash
    function weaponKind(a) { const id = lookFor(a.cls, a.look).items.weapon || 'none_0'; return /^(dagger|polearm)/.test(id) ? 'pierce' : /^(mace|hammer|staff|wand|none|fist)/.test(id) ? (/^fist/.test(id) ? 'claw' : 'blunt') : 'slash'; }
    function twoHanded(a) { return /^(greatsword|greataxe|hammer|polearm|staff)/.test(lookFor(a.cls, a.look).items.weapon || ''); }
    function warm(cls, gear) { return fightFrames(sprite(lookFor(cls, gear))); } // start drawing a hero before the fight opens
    applyOverrides(window.CB_FORGE_OVERRIDES);
    return { applyOverrides, METAL, SOFT, TRIM, BASE, OFF_WEAPON, SLOT_OF, MAP_N, P, town, lookFor, stateFor, sprite, figureHtml, play, setStates, events, weaponKind, twoHanded, warm, cache, ARCH, CLASS_LOOK, MOVES, EMOVES, frameFor, fightFrames };
  })();
