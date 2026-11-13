  // ---------- Extras (Nov 13): Skull Tokens and the Shop (mounts, auras, wings, weapon skins, card borders, dyes, bags), the Wardrobe,
  // pets, bags and bank bags, the stats sheet, the tabbed Menu and the town's action bar. Account-wide things live on the profile
  // (profile.skulls, profile.own via CBHub.own, profile.bags, profile.bankBags); what a hero wears is on its appearance (char.app.cos,
  // char.app.dye, char.app.mount), which other players already receive, so they see it too.
  // TO REMOVE: delete this file and its line in build.js; the hooks elsewhere all check for window.CB_COS or typeof exXxx first.
  const EX = { menu: 'game', shop: 'mounts', bankF: 'All', bankQ: '', dyeCol: null };
  const exOwn = () => CBHub.own(profile);
  const exSk = () => profile.skulls || 0;
  const exApp = () => { const c = profile.chars[heroKey]; if (!c) return { cos: {}, dye: {} }; c.app = c.app || {}; c.app.cos = c.app.cos || {}; c.app.dye = c.app.dye || {}; return c.app; };
  const EX_MOUNTS = [['horse', 'Emberwatch Horse', 0, 'The steady brown horse every hero starts with.'], ['wolf', 'Dire Wolf', 400, 'A shaggy grey wolf the size of a pony.'], ['boar', 'War Boar', 400, 'Tusks first, questions never.'],
    ['stag', 'Great Stag', 500, 'A forest lord with mossy antlers.'], ['panther', 'Shadow Panther', 600, 'Silent, black, and violet-eyed.'], ['bear', 'War Bear', 600, 'A brown bear in steel barding.'],
    ['sabertooth', 'Frost Sabertooth', 800, 'White fur, blue stripes, very long teeth.'], ['bonesteed', 'Bone Steed', 1000, 'It stopped needing oats a long time ago.'], ['nightmare', 'Nightmare', 1200, 'A black horse with a mane of fire.'], ['slug', 'Molten Slug', 1500, 'Slow to anger. Fast downhill.']];
  // cosmetics: [key, name, price, kind, how it is drawn]
  const EX_COS = [
    ['aura_fire', 'Burning Aura', 500, 'aura', { fx: 'flame', at: 'f', back: 1, z: 1.05 }], ['aura_frost', 'Frostfire Aura', 500, 'aura', { fx: 'flame', at: 'f', back: 1, z: 1.05, tint: 'hue-rotate(170deg)' }],
    ['aura_fel', 'Felfire Aura', 500, 'aura', { fx: 'flame', at: 'f', back: 1, z: 1.05, tint: 'hue-rotate(75deg)' }], ['aura_arcane', 'Arcane Blaze', 500, 'aura', { fx: 'flame', at: 'f', back: 1, z: 1.05, tint: 'hue-rotate(250deg)' }],
    ['aura_void', 'Void Shroud', 600, 'aura', { fx: 'shadow', at: 'f', back: 1, z: 1.45 }], ['aura_smoke', 'Black Smoke', 600, 'aura', { fx: 'shadow', at: 'f', back: 1, z: 1.45, tint: 'grayscale(1) brightness(.42)' }],
    ['aura_holy', 'Radiance', 600, 'aura', { fx: 'holy', at: 'c', back: 1, z: 1.7 }], ['aura_souls', 'Circling Souls', 800, 'aura', { fx: 'souls', at: 'c', z: 2.2 }], ['aura_motes', 'Arcane Motes', 400, 'aura', { fx: 'motes', at: 'c', z: 1.9 }],
    ['aura_storm', 'Crackling Storm', 700, 'aura', { fx: 'arcs', at: 'c', z: 2.1 }], ['aura_butterflies', 'Butterflies', 400, 'aura', { fx: 'butterflies', at: 'c', z: 1.5 }], ['aura_halo', 'Halo of Stars', 400, 'aura', { fx: 'halo', at: 'h', z: 1.6 }],
    ['trail_fire', 'Fire Footsteps', 500, 'trail', { fx: 'embers', z: 1.5 }], ['trail_frost', 'Frost Footsteps', 500, 'trail', { fx: 'mist', z: 0.55 }], ['trail_shadow', 'Shadow Footsteps', 500, 'trail', { fx: 'mist', z: 0.55, tint: 'hue-rotate(60deg) brightness(.5) saturate(1.6)' }],
    ['trail_blood', 'Bloody Footsteps', 500, 'trail', { fx: 'mist', z: 0.5, tint: 'hue-rotate(150deg) saturate(2.2) brightness(.7)' }],
    ['wings_angel', 'Angel Wings', 1200, 'wings', 0], ['wings_demon', 'Demon Wings', 1200, 'wings', 1], ['wings_dragon', 'Dragon Wings', 1200, 'wings', 2], ['wings_fairy', 'Fairy Wings', 1000, 'wings', 3], ['wings_bone', 'Bone Wings', 1000, 'wings', 4], ['wings_phoenix', 'Phoenix Wings', 1500, 'wings', 5],
    ['wskin_0', 'Emberfall, the Burning Blade', 900, 'wskin', 0], ['wskin_1', 'Rimeshard', 900, 'wskin', 1], ['wskin_2', 'Voidreaper', 900, 'wskin', 2], ['wskin_3', 'Dawnhammer', 900, 'wskin', 3], ['wskin_4', 'Wyrmcleaver', 900, 'wskin', 4], ['wskin_5', 'Starcaller', 900, 'wskin', 5],
    ['cback_dragon', 'Dragon Hoard Card Back', 400, 'cback', 5], ['cback_skull', 'Skull and Bones Card Back', 400, 'cback', 6], ['cback_phoenix', 'Phoenix Card Back', 400, 'cback', 7], ['cback_kraken', 'Kraken Card Back', 400, 'cback', 8], ['cback_runes', 'Runestone Card Back', 400, 'cback', 9], ['cback_bloodmoon', 'Blood Moon Card Back', 400, 'cback', 10], ['cback_frost', 'Frost Crystal Card Back', 400, 'cback', 11], ['cback_tree', 'Elder Tree Card Back', 400, 'cback', 12], ['cback_voideye', 'Void Eye Card Back', 400, 'cback', 13], ['cback_lion', 'Royal Crest Card Back', 400, 'cback', 14], ['cback_anvil', 'Dwarven Forge Card Back', 400, 'cback', 15], ['cback_sigil', 'Demon Sigil Card Back', 400, 'cback', 16], ['cback_compass', 'Treasure Map Card Back', 400, 'cback', 17], ['cback_stars', 'Night Sky Card Back', 400, 'cback', 18], ['cback_rose', 'Black Rose Card Back', 400, 'cback', 19],
    ['border_gold', 'Gilded Card Border', 300, 'border', '#e4b04a'], ['border_ember', 'Ember Card Border', 300, 'border', '#ff7a2a'], ['border_frost', 'Frost Card Border', 300, 'border', '#7fd3ff'], ['border_void', 'Void Card Border', 300, 'border', '#a06be0'], ['border_bone', 'Bone Card Border', 300, 'border', '#e8e0cc'], ['border_blood', 'Blood Card Border', 300, 'border', '#c9372f'],
  ];
  const EX_COSBY = Object.fromEntries(EX_COS.map(c => [c[0], c]));
  const EX_KIND = { aura: 'Aura', trail: 'Footsteps', wings: 'Wings', wskin: 'Weapon look', border: 'Card border', cback: 'Card back' };
  // Nov 13: card backs (img/cardbacks.webp, 10 across: the five class backs, then the shop's). Shown on the draw, discard and exhaust piles
  const EX_CLSBACK = { Warrior: 0, Rogue: 1, Mage: 2, Paladin: 3, Warlock: 4 };
  function exCardBack(cls) { let b = null; try { b = exApp().cos.cback; } catch (e) {} const c = b && EX_COSBY[b]; return c ? c[4] : EX_CLSBACK[cls] || 0; }
  const cbackPv = (i) => `<i class="sw" style="border-radius:5px;width:60px;height:85px;background:url(img/cardbacks.webp) ${(i % 10) / 9 * 100}% ${Math.floor(i / 10) * 100}% / 1000% 200%;image-rendering:pixelated;box-shadow:0 0 0 1px #000,0 3px 8px #000"></i>`;
  // dyes: the game's own colours (class, element and rarity colours, plus the neutrals)
  const EX_DYES = [['Ember Red', [201, 71, 47]], ['Blood', [140, 30, 34]], ['Flame Orange', [224, 122, 60]], ['Paladin Gold', [228, 169, 58]], ['Bone', [226, 216, 190]], ['Rogue Green', [100, 178, 91]], ['Moss', [74, 104, 58]], ['Teal', [95, 179, 161]],
    ['Frost Blue', [127, 211, 255]], ['Mage Blue', [79, 147, 230]], ['Midnight', [44, 52, 96]], ['Warlock Violet', [167, 123, 224]], ['Royal Purple', [104, 62, 150]], ['Rose', [222, 120, 150]], ['Ash Grey', [130, 130, 128]], ['Snow', [240, 240, 236]], ['Pitch Black', [38, 36, 40]], ['Leather Brown', [122, 84, 52]]];
  const EX_DYE_PRICE = 60, EX_DYE_SLOTS = ['Helm', 'Shoulders', 'Chest', 'Bracers', 'Gloves', 'Belt', 'Pants', 'Boots'];
  const EX_BAGS = [[20, 300], [30, 600]];
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  { const st = document.createElement('style'); st.textContent = `
    .skull { display: inline-block; width: 1.15em; height: 1.15em; vertical-align: -0.2em; background: url(img/ui/icons.webp) -3.45em -1.15em / 6.9em 3.45em no-repeat; image-rendering: pixelated; }
    .skchip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border: 1px solid #5a4a2e; border-radius: 3px; background: rgba(10,9,8,.6); color: #efe6d2; font-weight: 600; }
    .mnwrap { display: grid; grid-template-columns: 190px 1fr; gap: 18px; min-height: 420px; }
    .mnnav { display: flex; flex-direction: column; gap: 4px; border-right: 1px solid rgba(214,161,74,.22); padding-right: 14px; }
    .mnnav button { text-align: left; background: none; border: 1px solid transparent; color: #cfc4ae; font: inherit; font-size: 16px; padding: 7px 10px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 9px; }
    .mnnav button:hover { background: rgba(214,161,74,.1); color: #fff; } .mnnav button.on { background: rgba(214,161,74,.16); border-color: rgba(214,161,74,.45); color: #f4d89a; }
    .mnnav hr { border: 0; border-top: 1px solid rgba(214,161,74,.2); margin: 6px 0; width: 100%; }
    .mnpane { min-width: 0; } .mnpane .menu { display: flex; flex-direction: column; gap: 8px; max-width: 520px; } .mnpane h3 { margin: 10px 0 4px; }
    .uic { display: inline-block; width: 24px; height: 24px; flex: none; background: url(img/ui/icons.webp) 0 0 / 144px 72px no-repeat; image-rendering: pixelated; }
    .shoptabs { display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0 10px; } .shoptabs button { background: rgba(10,9,8,.5); border: 1px solid #4a3d28; color: #cfc4ae; font: inherit; padding: 5px 12px; border-radius: 3px; cursor: pointer; } .shoptabs button.on { border-color: #d6a14a; color: #f4d89a; background: rgba(214,161,74,.14); }
    .shopgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 10px; max-height: 56vh; overflow: auto; padding-right: 4px; }
    .shopit { border: 1px solid #4a3d28; border-radius: 4px; background: linear-gradient(#1b1814, #12100d); padding: 8px; display: flex; flex-direction: column; gap: 5px; align-items: center; text-align: center; }
    .shopit.own { border-color: #5f7a4a; } .shopit.worn { border-color: #d6a14a; box-shadow: 0 0 0 1px rgba(214,161,74,.4) inset; }
    .shopit b { color: #f0e6d0; font-size: 15px; line-height: 1.15; } .shopit small { color: #9d927e; font-size: 12px; line-height: 1.25; min-height: 2.4em; }
    .shopit .pv { width: 128px; height: 104px; display: grid; place-items: center; background: radial-gradient(ellipse at 50% 80%, rgba(214,161,74,.16), transparent 65%); image-rendering: pixelated; overflow: hidden; }
    .shopit .pv canvas { image-rendering: pixelated; } .shopit .pv i.sw { width: 54px; height: 54px; border-radius: 50%; border: 3px solid #0b0a08; box-shadow: 0 0 0 2px rgba(255,255,255,.18) inset; }
    .shopit .price { display: inline-flex; gap: 4px; align-items: center; color: #efe6d2; font-weight: 600; }
    .wardrow { display: grid; grid-template-columns: 110px 1fr; gap: 8px; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
    .wardrow > span { color: #b9ad96; } .wardrow select { max-width: 100%; }
    .dyerow { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; } .dyerow button { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #0b0a08; cursor: pointer; padding: 0; position: relative; } .dyerow button.on { outline: 2px solid #f4d89a; }
    .dyerow button em { position: absolute; right: -5px; bottom: -6px; font: 600 10px/1 sans-serif; font-style: normal; color: #fff; background: #0b0a08; border-radius: 6px; padding: 1px 3px; }
    .dyeslots { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-top: 6px; } .dyeslots button { font: inherit; font-size: 13px; padding: 5px 4px; border: 1px solid #4a3d28; border-radius: 3px; background: rgba(10,9,8,.5); color: #d8cdb8; cursor: pointer; display: flex; gap: 5px; align-items: center; justify-content: center; }
    .dyeslots button i { width: 12px; height: 12px; border-radius: 50%; border: 1px solid #000; }
    .bagbar { display: flex; gap: 6px; align-items: center; margin: 0 0 8px; flex-wrap: wrap; } .bagbar > span { color: #b9ad96; font-size: 13px; }
    .bagslot { width: 46px; height: 46px; border: 1px solid #4a3d28; border-radius: 4px; background: rgba(10,9,8,.55); display: grid; place-items: center; position: relative; cursor: pointer; padding: 0; color: #6f6654; font-size: 20px; }
    .bagslot.full { border-color: var(--rc, #d6a14a); } .bagslot em { position: absolute; right: 2px; bottom: 1px; font: 600 11px/1 sans-serif; font-style: normal; color: #fff; text-shadow: 0 1px 0 #000, 0 0 3px #000; }
    .bagic { display: block; width: 40px; height: 40px; background: url(img/ui/icons.webp) 0 -80px / 240px 120px no-repeat; image-rendering: pixelated; }
    .statsheet { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; }
    .statbox { border: 1px solid #4a3d28; border-radius: 4px; background: rgba(10,9,8,.45); padding: 8px 10px; } .statbox h4 { margin: 0 0 6px; font-size: 17px; color: #f4d89a; letter-spacing: .02em; }
    .statbox table { width: 100%; border-collapse: collapse; font-size: 14px; } .statbox th { text-align: right; font-weight: 500; color: #8f8674; font-size: 12px; padding: 0 0 3px 8px; } .statbox th:first-child { text-align: left; padding-left: 0; }
    .statbox td { padding: 2.5px 0 2.5px 8px; text-align: right; color: #a79c86; font-variant-numeric: tabular-nums; border-top: 1px solid rgba(255,255,255,.05); } .statbox td:first-child { text-align: left; color: #d8cdb8; padding-left: 0; } .statbox td.tot { color: #fff; font-weight: 600; } .statbox td.g { color: #9fc98a; } .statbox td.t { color: #b9a3ee; }
    .statbox ul { margin: 0; padding: 0 0 0 16px; font-size: 13.5px; color: #cfc4ae; } .statbox li { margin: 2px 0; } .statbox li b { color: #f0e6d0; }
    #actbar { position: absolute; right: 12px; bottom: 46px; z-index: 6; display: flex; gap: 4px; padding: 5px; background: linear-gradient(#211c16, #14110d); border: 1px solid #5a4a2e; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,.55); }
    #actbar button { width: 44px; height: 44px; padding: 0; border: 1px solid #3c3222; border-radius: 4px; background: #0e0c0a; cursor: pointer; display: grid; place-items: center; position: relative; }
    #actbar button:hover { border-color: #d6a14a; background: #1c1710; } #actbar button .uic { width: 36px; height: 36px; background-size: 216px 108px; }
    #actbar button kbd { position: absolute; right: 2px; bottom: 1px; font: 600 10px/1 sans-serif; color: #f4d89a; text-shadow: 0 1px 0 #000; }
    #actbar button::after { content: attr(data-tip); position: absolute; bottom: 52px; right: 0; white-space: nowrap; background: #0b0a08; border: 1px solid #5a4a2e; color: #efe6d2; font-size: 13px; padding: 3px 8px; border-radius: 3px; opacity: 0; pointer-events: none; transition: opacity .12s; }
    #actbar button:hover::after { opacity: 1; }
    #actbar button .abadge { position: absolute; left: 1px; top: 1px; min-width: 15px; height: 15px; border-radius: 8px; background: #b3261e; color: #fff; font: 700 10px/15px sans-serif; text-align: center; padding: 0 3px; box-shadow: 0 0 0 1px #000; }
    .petfig { position: absolute; left: -34%; bottom: 4%; height: 34%; scale: -1 1; image-rendering: pixelated; pointer-events: none; filter: drop-shadow(0 2px 0 rgba(0,0,0,.5)); animation: petbob 1.6s ease-in-out infinite; z-index: 1; }
    @keyframes petbob { 50% { transform: translateY(-4%); } }
    .bankbar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 0 0 8px; } .bankbar input[type=search] { flex: 1; min-width: 180px; }
    .bankbar .shoptabs { margin: 0; }
    body[data-cardborder] .hand .card, body[data-cardborder] #hand .card { box-shadow: 0 0 0 2px var(--cbord), 0 0 12px -2px var(--cbord); border-radius: 6px; }
    @media (max-width: 760px) { .mnwrap { grid-template-columns: 1fr; } .mnnav { flex-direction: row; flex-wrap: wrap; border-right: 0; padding-right: 0; } #actbar { flex-wrap: wrap; max-width: 60vw; justify-content: flex-end; } }
  `; document.head.appendChild(st); }
  const skHtml = (n) => `<span class="price">${n.toLocaleString()} <i class="skull"></i></span>`;
  // ---------- drawing what a hero wears for show (called by the puppet for every hero it draws: src/puppet.js draw)
  const COSM = { shadow: [0, 64, 79, 16, 12, 32, 62, 16], souls: [79, 46, 52, 16, 10, 24, 37, 16], motes: [131, 58, 30, 24, 12, 29, 15, 17], arcs: [191, 43, 49, 12, 12, 21, 26, 12], embers: [240, 38, 48, 12, 12, 16, 43, 12], mist: [288, 107, 36, 16, 10, 57, 20, 9],
    butterflies: [360, 90, 54, 24, 12, 50, 29, 11], holy: [522, 53, 79, 12, 12, 26, 40, 12], flame: [601, 68, 112, 8, 12, 34, 97, 8], halo: [713, 39, 23, 12, 12, 19, 15, 12] };
  const cosImg = Object.assign(new Image(), { src: 'img/cos.webp' }), wingImg = Object.assign(new Image(), { src: 'img/hero/wings.webp' });
  const STAMPS = [];
  function cosBlit(g, k, t, x, y, z, tint, alpha) {
    const m = COSM[k]; if (!m || !cosImg.complete || !cosImg.naturalWidth) return; const [ry, fw, fh, n, fps, ax, ay, per] = m, i = Math.floor(t / 1000 * fps) % n;
    g.save(); g.imageSmoothingEnabled = false; if (tint) g.filter = tint; if (alpha != null) g.globalAlpha *= alpha;
    g.drawImage(cosImg, (i % per) * fw, ry + Math.floor(i / per) * fh, fw, fh, Math.round(x - ax * z), Math.round(y - ay * z), fw * z, fh * z); g.restore();
  }
  window.CB_COS = {
    // layer 'back' is drawn before the body, 'front' after it
    draw(g, look, v, anim, t, x, footY, sc, layer) {
      const c = look && look.cos; if (!c) return; const dead = anim === 'dead';
      const A = c.aura && EX_COSBY[c.aura] && EX_COSBY[c.aura][4], T = c.trail && EX_COSBY[c.trail] && EX_COSBY[c.trail][4], W = c.wings && EX_COSBY[c.wings];
      if (layer === 'front' && T && !dead) {   // footsteps: stamped where the hero stands, they linger and fade as the hero walks on
        const now = performance.now(); let near = false; for (const s of STAMPS) if (s.k === c.trail && Math.abs(s.x - x) + Math.abs(s.y - footY) < 9 * sc && now - s.t0 < 500) { near = true; break; }
        if (!near) { STAMPS.push({ k: c.trail, x, y: footY, t0: now, sc, g }); if (STAMPS.length > 160) STAMPS.splice(0, 40); }
        for (let i = STAMPS.length - 1; i >= 0; i--) { const s = STAMPS[i], u = (now - s.t0) / 1100; if (u >= 1) { STAMPS.splice(i, 1); continue; } if (s.k !== c.trail || s.g !== g) continue; if (Math.abs(s.x - x) + Math.abs(s.y - footY) > 420 * sc) continue; cosBlit(g, T.fx, now - s.t0 + i * 90, s.x, s.y, T.z * s.sc * 1.0, T.tint, (1 - u) * .7); }
      }
      if (W && !dead && wingImg.complete && wingImg.naturalWidth && (layer === 'back') === (v !== 'n')) {
        const flap = 1 + Math.sin(t / 420) * 0.05, k = sc * 0.95, side = v === 'e' || v === 'w';
        g.save(); g.imageSmoothingEnabled = false;
        if (side) {   // Nov 13: from the side one wing shows, rooted on the shoulder blade (the pair used to be squeezed thin, with one wing across the face)
          const dir = v === 'w' ? -1 : 1; g.translate(Math.round(x - dir * 3 * sc), Math.round(footY - 84 * sc)); g.scale(dir, 1);
          g.save(); g.translate(-3 * k, -3 * k); g.scale(.62 * flap, 1); g.globalAlpha = .75; g.drawImage(wingImg, W[4] * 128, 0, 64, 96, -64 * k, -52 * k, 64 * k, 96 * k); g.restore();
          g.scale(.78 * flap, 1); g.drawImage(wingImg, W[4] * 128, 0, 64, 96, -64 * k, -52 * k, 64 * k, 96 * k);
        } else { g.translate(Math.round(x), Math.round(footY - 84 * sc)); g.scale(flap, 1); g.drawImage(wingImg, W[4] * 128, 0, 128, 96, -64 * k, -52 * k, 128 * k, 96 * k); }
        g.restore();
      }
      if (A && !dead && (layer === 'back') === (A.at === 'f' ? false : !!A.back)) {   /* Nov 13: ground effects (smoke, mist, flames at the feet) are always in front of the hero, see-through */
        const y = A.at === 'f' ? footY + 2 * sc : A.at === 'h' ? footY - 108 * sc : footY - 56 * sc;
        cosBlit(g, A.fx, t, x, y, A.z * sc, A.tint, A.at === 'f' ? 0.62 : A.back ? 0.92 : 1);
      }
    },
    weapon(look) { const c = look && look.cos; return c && c.wskin != null && EX_COSBY[c.wskin] && look.weapon ? ['legend', EX_COSBY[c.wskin][4]] : null; },
    dyeOf(look, slot) { const d = look && look.dye && look.dye[slot]; return d != null && EX_DYES[d] ? EX_DYES[d][1] : null; },
  };
  function exBorder() { const b = exApp().cos.border, c = b && EX_COSBY[b]; if (c) { document.body.dataset.cardborder = b; document.body.style.setProperty('--cbord', c[4]); } else { delete document.body.dataset.cardborder; } }
  // ---------- pets: a miniature of a monster (1 in 1000 from a kill on a run). It follows you in town and stands by you in a fight.
  const petSrc = (k) => { const f = window.CB_MOBS && CB_MOBS.keyOf ? CB_MOBS.keyOf(k) : null; return 'img/mobs/' + (f ? f.k : k) + '_p.webp'; };
  const petName = (k) => (DATA.enemies[k] ? 'Tiny ' + DATA.enemies[k].name : k);
  const PETIMG = {}, PETPOS = new Map();
  function exPetDraw(g, owner, pet, wx, wy, s, t) {   // town: wx, wy = the owner's feet in world pixels
    if (!pet) return; const im = PETIMG[pet] || (PETIMG[pet] = Object.assign(new Image(), { src: petSrc(pet) })); if (!im.complete || !im.naturalWidth) return;
    let p = PETPOS.get(owner); if (!p) PETPOS.set(owner, p = { x: wx - 30 * s, y: wy, f: 1, hop: 0 });
    const tx = wx - 34 * s * p.f, ty = wy + 4 * s, dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d > 300 * s) { p.x = tx; p.y = ty; } else if (d > 6 * s) { const k = Math.min(1, 0.09 + d / (900 * s)); p.x += dx * k; p.y += dy * k; if (Math.abs(dx) > 2) p.f = dx > 0 ? 1 : -1; p.hop = t; }
    const h = 34 * s, w = h * im.naturalWidth / im.naturalHeight, bob = (t - p.hop < 200 ? Math.abs(Math.sin(t / 70)) * 4 : Math.sin(t / 500) * 1.2) * s;
    g.save(); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(p.x, p.y, w * 0.34, 3.5 * s, 0, 0, Math.PI * 2); g.fill(); g.imageSmoothingEnabled = false;
    g.translate(p.x, p.y - bob); if (p.f < 0) g.scale(-1, 1); g.drawImage(im, -w / 2, -h, w, h); g.restore();
  }
  setInterval(() => {   // a fight: every hero with a pet gets it standing at their side
    try { if (typeof cb === 'undefined' || !cb || $('scrCombat').hidden) return;
      for (const a of cb.players) { const u = document.querySelector(`#scrCombat .unit[data-id="${a.id}"] .figure`); if (!u) continue; const app = window.CB_PUP_APP ? CB_PUP_APP(a) : null, pet = app && app.cos && app.cos.pet; let im = u.querySelector('.petfig');
        if (!pet || a.hp <= 0) { if (im) im.remove(); continue; } if (!im) { im = document.createElement('img'); im.className = 'petfig'; im.alt = ''; im.draggable = false; if (getComputedStyle(u).position === 'static') u.style.position = 'relative'; /* Nov 13: the fight figure is already placed by the stage; forcing it to relative dropped the hero off the bottom of the screen */ u.appendChild(im); } const src = petSrc(pet); if (im.dataset.k !== pet) { im.dataset.k = pet; im.src = src; } }
    } catch (e) {} }, 700);
  // a pet that dropped on the last run: say so
  function exPetNews() { const n = profile.newPets; if (!n || !n.length) return; profile.newPets = []; { const ap = exApp(); if (ap.cos && !ap.cos.pet) ap.cos.pet = n[0]; } /* Nov 13: your first pet starts following you straight away */ save(); modal(`<h2>A new pet!</h2><p>${n.map(k => `<b>${esc(petName(k))}</b>`).join(', ')} followed you home. One kill in a thousand does that.</p><div style="display:flex;gap:14px;justify-content:center;margin:10px 0">${n.map(k => `<img src="${petSrc(k)}" alt="" style="height:96px;image-rendering:pixelated">`).join('')}</div><p class="muted">Pets are for show: they trot behind you in town and stand by you in a fight. Swap or dismiss it in your hero window (C), Wardrobe.</p><div class="row"><button class="btn primary" id="mClose">Lovely</button></div>`); $('mClose').onclick = closeModal; }
  setInterval(() => { try { if (profile && profile.newPets && profile.newPets.length && !$('scrStart').hidden && $('modal').hidden && $('sheet').hidden) exPetNews(); } catch (e) {} }, 2500);
  // ---------- the Shop
  function exBuy(price, fn) { if (exSk() < price) return toast(`That costs ${price} Skull Tokens and you have ${exSk()}.`); profile.skulls = exSk() - price; fn(); save(); if (window.CB_AUDIO) CB_AUDIO.sfx('coin'); return true; }
  function exShopHtml() {
    const o = exOwn(), app = exApp(), tabs = [['mounts', 'Mounts'], ['aura', 'Auras'], ['trail', 'Footsteps'], ['wings', 'Wings'], ['wskin', 'Weapon looks'], ['border', 'Card borders'], ['cback', 'Card backs'], ['dyes', 'Dyes'], ['bags', 'Bags']];
    let items = '';
    const tile = (k, pv, name, note, price, owned, worn, extra) => `<div class="shopit ${owned ? 'own' : ''} ${worn ? 'worn' : ''}"><div class="pv">${pv}</div><b>${esc(name)}</b><small>${esc(note || '')}</small>${extra || (owned ? `<button class="btn ${worn ? '' : 'primary'}" data-exwear="${k}">${worn ? 'Take off' : 'Use'}</button>` : `${skHtml(price)}<button class="btn primary" data-exbuy="${k}">Buy</button>`)}</div>`;
    if (EX.shop === 'mounts') items = EX_MOUNTS.map(([k, n, p, d]) => tile('mount:' + k, `<canvas data-pvmount="${k}" width="128" height="104"></canvas>`, n, d, p, o.mounts.includes(k), (app.mount || 'horse') === k, o.mounts.includes(k) ? `<button class="btn ${(app.mount || 'horse') === k ? '' : 'primary'}" data-exwear="mount:${k}" ${(app.mount || 'horse') === k ? 'disabled' : ''}>${(app.mount || 'horse') === k ? 'Your mount' : 'Ride this'}</button>` : null)).join('');
    else if (EX.shop === 'dyes') items = EX_DYES.map(([n, c], i) => tile('dye:' + i, `<i class="sw" style="background:${rgb(c)}"></i>`, n + ' Dye', `You have ${o.dyes[i] || 0}. One dye colours one piece of armour.`, EX_DYE_PRICE, false, false, `${skHtml(EX_DYE_PRICE)}<button class="btn primary" data-exbuy="dye:${i}">Buy one</button>`)).join('') + tile('', '<i class="sw" style="background:repeating-linear-gradient(45deg,#777 0 6px,#333 6px 12px)"></i>', 'Dye Remover', 'Free. Take a dye off in your hero window (C), Wardrobe: the armour goes back to its own colours.', 0, false, false, '<span class="muted">Always free</span>');
    else if (EX.shop === 'bags') items = EX_BAGS.map(([n, p]) => tile('bag:' + n, `<i class="bagic" style="background-position:${-({ 20: 3, 30: 4 }[n]) * 40}px -80px;transform:scale(1.8)"></i>`, CBHub.makeBag(n).name, `${n} more slots. Put it in a bag slot (your bags, or the bank's).`, p, false, false, `${skHtml(p)}<button class="btn primary" data-exbuy="bag:${n}">Buy</button>`)).join('') + `<div class="shopit"><div class="pv"><i class="bagic" style="transform:scale(1.8)"></i></div><b>Smaller bags</b><small>5, 10, 15 and 20-slot bags drop from monsters. Deeper maps drop bigger bags.</small></div>`;
    else items = EX_COS.filter(c => c[3] === EX.shop).map(([k, n, p, kind, d]) => tile(k, kind === 'cback' ? cbackPv(d) : kind === 'border' ? `<i class="sw" style="border-radius:6px;width:60px;height:84px;background:#1a1612;box-shadow:0 0 0 3px ${d},0 0 16px ${d}"></i>` : `<canvas data-pvcos="${k}" width="128" height="104"></canvas>`, n, EX_KIND[kind], p, o.cos.includes(k), app.cos[kind] === k)).join('');
    return `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><h2 style="margin:0">The Skull Shop</h2><span class="skchip">${exSk().toLocaleString()} <i class="skull"></i> Skull Tokens</span><span class="muted" style="font-size:13px">Everything here is for show, except bags. Bought once, shared by all your heroes.</span></div>
      <div class="shoptabs">${tabs.map(([k, n]) => `<button class="${EX.shop === k ? 'on' : ''}" data-exshop="${k}">${n}</button>`).join('')}</div><div class="shopgrid">${items}</div>`;
  }
  // previews: a little canvas per tile, drawn in one loop while the shop or wardrobe is on screen
  function exPreviews() {
    const t = performance.now();
    for (const cv of document.querySelectorAll('canvas[data-pvmount]')) { const k = cv.dataset.pvmount, g = cv.getContext('2d'), im = window.CB_PUPPET && CB_PUPPET.img(k === 'horse' ? 'horse' : 'mounts/' + k); g.clearRect(0, 0, 128, 104); if (im) { g.imageSmoothingEnabled = false; g.drawImage(im, (1 + Math.floor(t / 110) % 6) * 128, 128, 128, 128, 0, -18, 128, 128); } }
    for (const cv of document.querySelectorAll('canvas[data-pvcos]')) { const c = EX_COSBY[cv.dataset.pvcos], g = cv.getContext('2d'); g.clearRect(0, 0, 128, 104); if (!c) continue;
      const L = Object.assign({}, exLook(), { cos: { [c[3]]: c[0] } }); if (c[3] === 'wskin' && !L.weapon) L.weapon = ['sword2h', 0];
      if (window.CB_PUPPET) CB_PUPPET.draw(g, L, c[3] === 'wings' ? 's' : 'e', c[3] === 'trail' ? 'walk' : 'idle', t, 64, 98, 0.78); }
  }
  function exLook() { const c = profile.chars[heroKey]; return c && window.CB_HEROPUP ? CB_HEROPUP.lookOf('me', c.cls, c.gear) : {}; }
  setInterval(() => { if (document.querySelector('canvas[data-pvmount], canvas[data-pvcos]')) exPreviews(); }, 90);
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-exshop], [data-exbuy], [data-exwear]'); if (!b || !profile) return; const o = exOwn(), app = exApp();
    if (b.dataset.exshop) { EX.shop = b.dataset.exshop; return exRefresh(); }
    if (b.dataset.exbuy) { const [kind, id] = b.dataset.exbuy.includes(':') ? b.dataset.exbuy.split(':') : ['cos', b.dataset.exbuy];
      if (kind === 'mount') { const m = EX_MOUNTS.find(x => x[0] === id); if (m && exBuy(m[2], () => { o.mounts.push(id); app.mount = id; })) { if (typeof P !== 'undefined' && P.mount) P.mount = id; } }
      else if (kind === 'dye') exBuy(EX_DYE_PRICE, () => { o.dyes[id] = (o.dyes[id] || 0) + 1; });
      else if (kind === 'bag') { const n = +id, bg = EX_BAGS.find(x => x[0] === n); if (profile.stash.length >= CBHub.STASH_MAX) return toast('Your bags are full: make room for the new bag first.'); if (bg) exBuy(bg[1], () => profile.stash.unshift(Object.assign({ id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, CBHub.makeBag(n)))); }
      else { const c = EX_COSBY[id]; if (c && !o.cos.includes(id)) exBuy(c[2], () => { o.cos.push(id); app.cos[c[3]] = id; }); }
      exBorder(); if (typeof retrack === 'function') retrack(true); return exRefresh(); }
    if (b.dataset.exwear) { const id = b.dataset.exwear; if (id.startsWith('mount:')) { app.mount = id.slice(6); if (typeof P !== 'undefined' && P.mount) P.mount = app.mount; } else { const c = EX_COSBY[id]; if (c) app.cos[c[3]] = app.cos[c[3]] === id ? null : id; }
      save(); exBorder(); if (typeof retrack === 'function') retrack(true); return exRefresh(); }
  });
  function exRefresh() { if (!$('modal').hidden && $('modalBox').querySelector('.mnwrap')) exMenu(EX.menu); if (!$('sheet').hidden) renderHub(); if (typeof renderTownBar === 'function') renderTownBar(); }
  // ---------- the Wardrobe (hero window): mount, pet, aura, footsteps, wings, weapon look, card border, and dyes for each piece of armour
  function exWardrobeHtml(c) {
    const o = exOwn(), app = exApp(), cos = app.cos;
    const sel = (kind, label) => { const have = EX_COS.filter(x => x[3] === kind && o.cos.includes(x[0])); return `<div class="wardrow"><span>${label}</span><select data-exsel="${kind}"><option value="">None</option>${have.map(x => `<option value="${x[0]}" ${cos[kind] === x[0] ? 'selected' : ''}>${esc(x[1])}</option>`).join('')}</select></div>`; };
    const dyes = EX_DYES.map(([n, col], i) => [n, col, i, o.dyes[i] || 0]).filter(d => d[3] > 0);
    return `<div class="gearwrap" style="grid-template-columns:1fr"><div>
      <p class="muted" style="font-size:12.5px;margin:0 0 6px">Everything here is for show and other players see it. Buy more in the Shop (Menu, or the skull button in town). You have <b style="color:#efe6d2">${exSk().toLocaleString()}</b> <i class="skull"></i>.</p>
      <div class="wardrow"><span>Mount</span><select data-exsel="mount">${EX_MOUNTS.filter(m => o.mounts.includes(m[0])).map(m => `<option value="${m[0]}" ${(app.mount || 'horse') === m[0] ? 'selected' : ''}>${esc(m[1])}</option>`).join('')}</select></div>
      <div class="wardrow"><span>Pet</span><select data-exsel="pet"><option value="">None</option>${o.pets.map(k => `<option value="${k}" ${cos.pet === k ? 'selected' : ''}>${esc(petName(k))}</option>`).join('')}</select></div>
      ${o.pets.length ? '' : '<p class="muted" style="font-size:12.5px;margin:2px 0 4px 118px">No pets yet. Any monster you kill on a run has a 1 in 1000 chance to follow you home as a tiny pet.</p>'}
      ${sel('aura', 'Aura')}${sel('trail', 'Footsteps')}${sel('wings', 'Wings')}${sel('wskin', 'Weapon look')}${sel('border', 'Card border')}${sel('cback', 'Card back').replace('<option value="">None</option>', '<option value="">Your class back</option>')}
      <h3 style="font-size:18px;margin:12px 0 4px;color:var(--accent)">Dyes</h3>
      ${dyes.length ? `<div class="dyerow">${dyes.map(([n, col, i, cnt]) => `<button type="button" class="${EX.dyeCol === i ? 'on' : ''}" data-exdyepick="${i}" style="background:${rgb(col)}" title="${esc(n)}: you have ${cnt}"><em>${cnt}</em></button>`).join('')}<button type="button" class="${EX.dyeCol === -1 ? 'on' : ''}" data-exdyepick="-1" style="background:repeating-linear-gradient(45deg,#777 0 4px,#333 4px 8px)" title="Dye remover (free)"></button><span class="muted" style="font-size:12.5px">${EX.dyeCol == null ? 'Pick a dye, then a piece of armour.' : EX.dyeCol === -1 ? 'Dye remover: click a dyed piece.' : `<b>${esc(EX_DYES[EX.dyeCol][0])}</b>: click a piece to dye it (uses one).`}</span></div>` : '<p class="muted" style="font-size:12.5px;margin:0">You have no dyes. Buy them in the Shop, then colour any piece of armour you are wearing.</p>'}
      <div class="dyeslots">${EX_DYE_SLOTS.map(sl => { const worn = c.gear.find(g => g.slot === sl), d = app.dye[sl]; return `<button type="button" data-exdyeslot="${sl}" ${worn ? '' : 'disabled style="opacity:.4"'} title="${worn ? esc(worn.name) : 'Nothing worn'}">${d != null && EX_DYES[d] ? `<i style="background:${rgb(EX_DYES[d][1])}"></i>` : ''}${sl}</button>`; }).join('')}</div>
      <p class="muted" style="font-size:12px;margin:6px 0 0">A dye stays on the slot, so it carries over when you swap that piece for another.</p></div></div>`;
  }
  document.addEventListener('change', (ev) => { const s = ev.target.closest('[data-exsel]'); if (!s || !profile) return; const app = exApp(), k = s.dataset.exsel; if (k === 'mount') { app.mount = s.value || 'horse'; if (typeof P !== 'undefined' && P.mount) P.mount = app.mount; } else app.cos[k] = s.value || null; save(); exBorder(); if (typeof retrack === 'function') retrack(true); renderHub(); });
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-exdyepick], [data-exdyeslot]'); if (!b || !profile) return; const o = exOwn(), app = exApp();
    if (b.dataset.exdyepick) { const i = +b.dataset.exdyepick; EX.dyeCol = EX.dyeCol === i ? null : i; return renderHub(); }
    const sl = b.dataset.exdyeslot; if (EX.dyeCol == null) return toast('Pick a dye colour first (or the remover).');
    if (EX.dyeCol === -1) { if (app.dye[sl] == null) return; delete app.dye[sl]; }
    else { if (app.dye[sl] === EX.dyeCol) return; if (!(o.dyes[EX.dyeCol] > 0)) { EX.dyeCol = null; return renderHub(); } o.dyes[EX.dyeCol]--; app.dye[sl] = EX.dyeCol; if (!o.dyes[EX.dyeCol]) EX.dyeCol = null; }
    save(); if (typeof retrack === 'function') retrack(true); renderHub();
  });
  // ---------- bags: the row of bag slots above your bags, and above the bank
  function exBagBar(where) {
    const list = where === 'bank' ? (profile.bankBags = profile.bankBags || []) : (profile.bags = profile.bags || []), n = where === 'bank' ? CBHub.BANK_BAG_SLOTS : CBHub.BAG_SLOTS, base = where === 'bank' ? CBHub.BANK_BASE : CBHub.BAG_BASE;
    const col = { 5: 0, 10: 1, 15: 2, 20: 3, 30: 4 };
    let h = `<div class="bagbar"><span>${where === 'bank' ? 'Bank' : 'Bag'} slots</span>`;
    for (let i = 0; i < n; i++) { const b = list[i]; h += b ? `<button type="button" class="bagslot full" style="--rc:${RC[b.rarity] || '#d6a14a'}" data-exunbag="${where}:${i}" title="${esc(b.name)}: ${b.bag} slots. Click to take it out."><i class="bagic" style="background-position:${-(col[b.bag] || 0) * 40}px -80px"></i><em>${b.bag}</em></button>` : `<button type="button" class="bagslot" data-exbagslot="${where}" title="Empty bag slot. Click to put a bag from your bags in here.">+</button>`; }
    return h + `<span>${base} + ${list.reduce((t, b) => t + (b ? b.bag : 0), 0)} from bags</span></div>`;
  }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-exunbag], [data-exbagslot], [data-exbagput]'); if (!b || !profile) return; let r = null;
    if (b.dataset.exunbag) { const [w, i] = b.dataset.exunbag.split(':'); r = CBHub.unequipBag(profile, w, +i); }
    else if (b.dataset.exbagput) { const [w, id] = b.dataset.exbagput.split(':'); r = CBHub.equipBag(profile, id, w); closeModal(); }
    else { const w = b.dataset.exbagslot, bags = profile.stash.filter(x => x.bag); if (!bags.length) return toast('You have no spare bag. Bags drop from monsters (bigger ones on deeper maps) and the Shop sells 20 and 30-slot bags.');
      if (bags.length === 1) r = CBHub.equipBag(profile, bags[0].id, w); else { modal(`<h2>Which bag?</h2><div class="list" style="max-height:340px">${bags.map(x => itemHtml(x, `<div class="acts"><button class="btn primary" data-exbagput="${w}:${x.id}">Put it in</button></div>`)).join('')}</div><div class="row"><button class="btn" id="mClose">Cancel</button></div>`); $('mClose').onclick = closeModal; return; } }
    if (r && !r.ok) return toast(r.why); save(); renderHub(); if (!$('hpBank').hidden) renderBank();
  });
  // ---------- the bank: its own bag slots, a filter by kind of item and a search (names, stats and bonuses)
  const BANK_F = [['All', null], ['Weapons', /^(Weapon|Off-hand)$/], ['Helm', /^Helm$/], ['Shoulders', /^Shoulders$/], ['Chest', /^Chest$/], ['Arms', /^(Bracers|Gloves)$/], ['Belt', /^Belt$/], ['Legs', /^(Pants|Boots)$/], ['Jewelry', /^(Ring|Ring 1|Ring 2|Amulet)$/], ['Cloak', /^Cloak$/], ['Codex', /^Codex$/], ['Bags', /^Bag$/]];
  const itemText = (it) => [it.name, it.slot, it.label, it.rarity, it.arch, it.passive, ...Object.keys(it.stats || {}), ...Object.keys(it.imp2 || {}), ...(it.lines || []).map(l => l.stat)].filter(Boolean).join(' ').replace(/Elemental\/Holy Damage:/g, '').replace(/Resistance:(\w+)/g, '$1 Resistance').toLowerCase();
  function exBankMatch(it) { const f = BANK_F.find(x => x[0] === EX.bankF); if (f && f[1] && !f[1].test(it.slot || '')) return false; const q = EX.bankQ.trim().toLowerCase(); return !q || q.split(/\s+/).every(w => itemText(it).includes(w)); }
  renderBank = function () {
    const c = profile.chars[heroKey], v = profile.vault = profile.vault || [], st = profile.stash.filter(x => x.kind !== 'card');
    const col = (list, btn, lbl, max) => { const show = list.filter(exBankMatch); return `<div><h3>${lbl} <span class="muted">${list.length} / ${max}${show.length !== list.length ? ` &middot; showing ${show.length}` : ''}</span></h3>${exBagBar(btn === 'tovault' ? 'bags' : 'bank')}<div class="list tall">${show.map(it => itemHtml(it, `<div class="acts"><button class="btn" data-${btn}="${it.id}">${btn === 'tovault' ? 'To bank &#9654;' : '&#9664; To bags'}</button></div>`)).join('') || `<p class="muted">${list.length ? 'Nothing matches.' : 'Empty.'}</p>`}</div></div>`; };
    const foc = document.activeElement && document.activeElement.id === 'bankQ', pos = foc ? document.activeElement.selectionStart : 0;
    $('hpBank').innerHTML = `<p class="savenote" style="margin:0 0 8px">Your <b>bags</b> are what you carry between runs; the <b>bank</b> keeps the rest safe. Both are shared by all your ${c && c.hardcore ? 'Hardcore' : 'normal'} heroes, and both grow when you put bags in their bag slots. Gear in the bank can't be equipped, salvaged or traded until you take it out.</p>
      <div class="bankbar"><input type="search" id="bankQ" placeholder="Search by name or stat: fire resistance, crit, strength..." value="${esc(EX.bankQ)}" autocomplete="off"><div class="shoptabs">${BANK_F.map(([n]) => `<button class="${EX.bankF === n ? 'on' : ''}" data-bankf="${n}">${n}</button>`).join('')}</div></div>
      <div class="bankcols">${col(st, 'tovault', 'Bags', CBHub.STASH_MAX)}${col(v, 'fromvault', 'Bank', CBHub.VAULT_MAX)}</div>`;
    if (foc) { const q = $('bankQ'); q.focus(); try { q.setSelectionRange(pos, pos); } catch (e) {} }
  };
  $('hpBank').addEventListener('input', (ev) => { if (ev.target.id === 'bankQ') { EX.bankQ = ev.target.value; renderBank(); } });
  $('hpBank').addEventListener('click', (ev) => { const b = ev.target.closest('[data-bankf]'); if (b) { EX.bankF = b.dataset.bankf; renderBank(); } });
  // ---------- the stats sheet: every number your hero takes into a fight, and where it comes from (gear, talents)
  function exStatsHtml(c) {
    const o = CBHub.runOpts(profile, heroKey), mk = (gear, talents) => { try { return new CB.Combat({ party: [{ cls: c.cls, name: c.name, gear, deck: o.deck, talents }], enemies: ['training_dummy'], practice: true, seed: 7, data: DATA }).players[0]; } catch (e) { return null; } };
    const full = mk(o.gear, o.talents), noTal = mk(o.gear, null), bare = mk([], null); if (!full || !noTal || !bare) return '<p class="muted">Stats are not available right now.</p>';
    const num = (p, k) => k.startsWith('resist:') ? (p.resist[k.slice(7)] || 0) : k === 'critMult' ? Math.round((p.critMult || 0) * 100) : (p[k] || 0);
    const row = (label, k, unit) => { const t = num(full, k), g = num(noTal, k) - num(bare, k), tl = t - num(noTal, k), b = num(bare, k); const f = (v, plus) => v ? (plus && v > 0 ? '+' : '') + v + (unit || '') : '<span style="opacity:.35">-</span>'; return t || g || tl ? `<tr><td>${label}</td><td>${f(b)}</td><td class="g">${f(g, 1)}</td><td class="t">${f(tl, 1)}</td><td class="tot">${t}${unit || ''}</td></tr>` : ''; };
    const box = (title, rows) => { const r = rows.map(x => row(...x)).join(''); return r ? `<div class="statbox"><h4>${title}</h4><table><tr><th></th><th>Base</th><th>Gear</th><th>Talents</th><th>Total</th></tr>${r}</table></div>` : ''; };
    const defW = CBHub.defWord(c) || CLASSES[c.cls].defense;
    const tl = full.powers.find(p => p.talent), cx = full.powers.find(p => p.codex), tr = o.talents && CB.TALENTS[o.talents.codex];
    const picked = tr ? (o.talents.picks || []).map((j, i) => j == null ? null : i < 9 ? tr.rows[i] && tr.rows[i][j] : (CARDS[tr.cap[j]] ? { n: CARDS[tr.cap[j]].name + ' (capstone)', t: CARDS[tr.cap[j]].text } : null)).filter(Boolean) : [];
    const sg = CB.sumGear(o.gear), extra = [['Healing received', sg.healIn], ['Health regained after a fight', sg.healthRegen], ['Luck (better loot)', sg.luck], ['Gold found', sg.goldFind]].filter(x => x[1]);
    return `<div class="statsheet">
      ${box('Vitals', [['Max health', 'maxHp'], ['Max mana', 'maxMana'], ['Mana each turn', 'regen'], ['Cards each round', 'draw'], ['Initiative', 'baseInit'], ['Spirit (healing)', 'spirit', '%']])}
      ${box('Offense', [['Strength (Attack damage)', 'strength', '%'], ['Intelligence (spell damage)', 'intelligence', '%'], ['Weapon damage per hit', 'weaponDmg'], ['Crit chance', 'crit', '%'], ['Crit damage', 'critMult', '%'], ['Multi-hit chance', 'multiHit', '%'], ['Multiplay chance', 'multiplay', '%'], ['Multicast chance', 'multicast', '%'], ['Bleed chance', 'bleedChance', '%'], ['Lifesteal', 'lifesteal', '%'], ['Demon damage', 'demonDmg', '%']])}
      ${box('Defense', [[`Dexterity (${esc(defW)} gained)`, 'dexterity', '%'], ['Thorns', 'thorns'], ['Recovery', 'recovery'], ['Taunt chance', 'tauntChance', '%'], ['Debuff resistance', 'debuffRes', '%'], ['Reflect', 'reflect', '%']])}
      ${box('Resistances', CB.ELEMENTS.map(el => [el, 'resist:' + el, '%']))}
      <div class="statbox"><h4>Codex and talents</h4>${cx ? `<ul><li><b>${esc(cx.name)}</b>: ${esc(cx.text)}</li></ul>` : '<p class="muted" style="margin:0;font-size:13px">No codex worn.</p>'}
        ${picked.length ? `<ul style="margin-top:6px">${picked.map(t => `<li><b>${esc(t.n)}</b>: ${esc(talentText(t.t, c.cls, c))}</li>`).join('')}</ul>` : '<p class="muted" style="margin:6px 0 0;font-size:13px">No talents picked for the codex you are wearing (N opens the tree).</p>'}</div>
      ${extra.length ? `<div class="statbox"><h4>Other gear bonuses</h4><table>${extra.map(([n, v]) => `<tr><td>${n}</td><td class="tot">${v}</td></tr>`).join('')}</table></div>` : ''}
    </div><p class="muted" style="font-size:12px;margin:8px 0 0">Base is your class with nothing on. Talents only count while their codex is worn. Powers and buffs from cards are added during a fight.</p>`;
  }
  // ---------- the Menu, in tabs: Game, Settings, Shop, and the reference books
  const _menu0 = openMenu;
  const MN_TABS = [['game', 'Game', 11], ['settings', 'Settings', 11], ['shop', 'Skull Shop', 9], null, ['compendium', 'Compendium', 4], ['glossary', 'Glossary', 4], ['guide', 'Build guide', 2], ['ach', 'Achievements', 5], ['records', 'Hall of Records', 5], ['news', "What's new", 7]];
  const uic = (i) => `<i class="uic" style="background-position:${-(i % 6) * 24}px ${-Math.floor(i / 6) * 24}px"></i>`;
  function exMenu(tab) {
    EX.menu = tab || 'game'; const hero = profile && profile.chars[heroKey], onTitle = !$('scrTitle').hidden;
    _menu0();   // the game's own menu: its buttons keep their handlers when moved into the panes below
    const old = $('modalBox').querySelector('.menu'); if (!old) return;
    const game = document.createElement('div'), sets = document.createElement('div'); game.className = sets.className = 'menu'; let to = game;
    for (const n of [...old.children]) { if (n.tagName === 'H3' && /Settings/.test(n.textContent)) { to = sets; continue; } if (['mnGloss', 'mnGuide', 'mnAch', 'mnRec', 'mClose'].includes(n.id)) continue; to.appendChild(n); }
    const nav = MN_TABS.filter(t => !t || !((t[0] === 'shop' || t[0] === 'guide' || t[0] === 'ach' || t[0] === 'records') && (!hero || onTitle)) && !(t[0] === 'records' && (typeof run !== 'undefined' && run || typeof cb !== 'undefined' && cb)) && !(t[0] === 'news' && typeof openUpdates !== 'function'))
      .map(t => t ? `<button type="button" class="${EX.menu === t[0] ? 'on' : ''}" data-mntab="${t[0]}">${uic(t[2])}${t[1]}</button>` : '<hr>').join('');
    $('modalBox').innerHTML = `<div class="mnwrap"><nav class="mnnav" aria-label="Menu">${nav}<hr><button type="button" class="on" id="mClose" style="margin-top:auto">Resume <span class="muted" style="margin-left:auto;font-size:12px">Esc</span></button></nav><div class="mnpane" id="mnPane"></div></div>`;
    $('modalBox').classList.add('wide');
    const pane = $('mnPane'); $('mClose').onclick = closeModal;
    if (EX.menu === 'settings') { const h = document.createElement('h2'); h.textContent = 'Settings'; pane.appendChild(h); pane.appendChild(sets); }
    else if (EX.menu === 'shop' && hero) pane.innerHTML = exShopHtml();
    else { const h = document.createElement('h2'); h.textContent = 'Menu'; pane.appendChild(h); pane.appendChild(game); }
  }
  openMenu = function () { exMenu('game'); };
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-mntab]'); if (!b) return; const k = b.dataset.mntab;
    if (k === 'compendium') { closeModal(); if (typeof closeTalk === 'function') closeTalk(); return openSheet('codex'); }
    if (k === 'glossary') return openGlossary();
    if (k === 'guide') return openGuide();
    if (k === 'ach') return openAchievements();
    if (k === 'records') { closeModal(); return openRecords(); }
    if (k === 'news') { closeModal(); return openUpdates(); }
    exMenu(k);
  });
  function openShop() { if (!profile || !profile.chars[heroKey]) return; exMenu('shop'); }
  // ---------- the town's action bar (bottom right): every window one click away
  { const bar = document.createElement('div'); bar.id = 'actbar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Quick buttons');
    const B = [['char', 'Character', 0, 'C'], ['bags', 'Bags', 1, 'B'], ['talents', 'Talents', 2, 'N'], ['deck', 'Deck and cards', 3, ''], ['compendium', 'Compendium', 4, ''], ['ach', 'Achievements', 5, ''], ['pvp', 'Arena (PvP)', 6, ''], ['lfg', 'Group finder', 7, 'L'], ['friends', 'Friends', 8, 'O'], ['guild', 'Guild', -1, 'G'], ['shop', 'Skull Shop', 9, ''], ['mount', 'Mount up', 10, 'M'], ['menu', 'Menu', 11, 'Esc']];
    bar.innerHTML = B.map(([k, n, i, key]) => `<button type="button" data-act="${k}" data-tip="${n}${key ? ' (' + key + ')' : ''}" aria-label="${n}"><i class="uic" style="${i < 0 ? 'background:url(img/ui/guild.webp) center / 36px 36px no-repeat;image-rendering:pixelated' : `background-position:${-(i % 6) * 36}px ${-Math.floor(i / 6) * 36}px`}"></i>${key && key.length === 1 ? `<kbd>${key}</kbd>` : ''}</button>`).join('');
    $('scrStart').appendChild(bar);
    const act = (k) => { if (typeof closeTalk === 'function') closeTalk();
      if (k === 'char') { GT.tab = 'deck'; openSheet('char'); } else if (k === 'bags') { openSheet('char'); GT.tab = 'stash'; renderHub(); } else if (k === 'talents') openTalents(); else if (k === 'deck') openSheet('deck'); else if (k === 'compendium') openSheet('codex');
      else if (k === 'ach') openAchievements(); else if (k === 'pvp') openSheet('arena'); else if (k === 'lfg') { if (typeof openLfg === 'function') openLfg(); } else if (k === 'friends') openSheet('friends'); else if (k === 'guild') openSheet('guild'); else if (k === 'shop') openShop(); else if (k === 'mount') toggleMount(); else if (k === 'menu') openMenu(); };
    bar.addEventListener('click', (ev) => { const b = ev.target.closest('[data-act]'); if (b) { act(b.dataset.act); b.blur(); } });
    document.addEventListener('keydown', (ev) => { if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.target.matches('input, select, textarea') || $('scrStart').hidden || !$('modal').hidden || !$('sheet').hidden || (typeof $('talk') !== 'undefined' && $('talk') && !$('talk').hidden)) return;
      if (ev.key === 'b' || ev.key === 'B') { ev.preventDefault(); act('bags'); } else if (ev.key === 'l' || ev.key === 'L') { ev.preventDefault(); act('lfg'); } else if (ev.key === 'o' || ev.key === 'O') { ev.preventDefault(); act('friends'); } });
  }
  // Nov 13: the talent trees changed (new talents at the bottom of every tree), so every hero gets all their picks back once
  function exTalentRefund() { if (!profile || profile.talV >= 2) return; let n = 0; for (const c of Object.values(profile.chars || {})) for (const st of Object.values(c.codexes || {})) if (st.picks && st.picks.some(x => x != null)) { st.picks = []; n++; } profile.talV = 2; save();
    if (n) setTimeout(() => { try { modal('<h2>Your talents were refunded</h2><p>The talent trees were reworked: every talent has a picture now, and the lower rows have new talents (counter-attacks, cleanses, low-health defences, card draw, mana and ways to disrupt enemies) in place of the ones every tree shared.</p><p>All your picks have been cleared, so you can choose again for free. Press <b>N</b> in town to open your tree.</p><div class="row"><button class="btn primary" id="mClose">Got it</button></div>'); $('mClose').onclick = closeModal; } catch (e) {} }, 2500); }
  setInterval(() => { try { if (profile && !(profile.talV >= 2) && !$('scrStart').hidden && $('modal').hidden) exTalentRefund(); } catch (e) {} }, 3000);
  setTimeout(() => { try { CBHub.syncCaps(profile); exBorder(); } catch (e) {} }, 0);
  window.__x = (code) => eval(code); // test hook
  // ---------- going indoors (Nov 13): most townsfolk work inside. Their spot at the door is the way in: the screen dips to black and
  // you stand in the room (a painting, img/bg/in_<room>.webp) with them. Walk with A/D, the arrows or a click; Space talks; Esc leaves.
  const EXIN = { n: null, x: 0.12, dir: 1, tx: null, talkAfter: false, keys: new Set(), img: {}, last: 0, walking: false };
  { const st = document.createElement('style'); st.textContent = `
    #interior { position: absolute; inset: 0; background: #070608; overflow: hidden; } #interior canvas { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; cursor: pointer; }
    #interior .inname { position: absolute; left: 50%; top: 12px; transform: translateX(-50%); font: 600 26px 'Grenze', serif; font-variant: small-caps; letter-spacing: 3px; color: #ffe9b0; text-shadow: 0 2px 0 #000, 0 0 18px rgba(240,150,50,.45); pointer-events: none; white-space: nowrap; }
    #interior .inhint { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); font-size: 13px; color: #d8cdb8; background: rgba(8,7,6,.72); border: 1px solid rgba(214,161,74,.3); border-radius: 3px; padding: 4px 10px; pointer-events: none; white-space: nowrap; }
    #interior .inhint kbd, #interior .inleave kbd { font: 600 12px/1 sans-serif; color: #f4d89a; border: 1px solid #5a4a2e; border-radius: 3px; padding: 1px 4px; margin: 0 2px; background: #14110d; }
    #interior .inleave { position: absolute; left: 12px; top: 12px; }
    #townWrap.indoors > :not(#interior):not(.talk):not(.chatbox):not(.partypanel):not(#town) { visibility: hidden; }
  `; document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'interior'; d.hidden = true; d.innerHTML = '<canvas id="inCv" aria-label="Inside the building"></canvas><div class="inname" id="inName"></div><button type="button" class="btn inleave" id="inLeave">&#9664; Leave <kbd>Esc</kbd></button><div class="inhint" id="inHint"></div>';
    $('townWrap').insertBefore(d, $('prompt')); }
  const exInside = () => !!EXIN.n;
  function exDoor(g, cx, by, s, t) {   // outdoors: a warm glow on the step and a bouncing arrow where the townsperson used to stand
    const b = Math.sin(t / 260) * 3 * s; g.save();
    const gr = g.createRadialGradient(cx, by - 4 * s, 2, cx, by - 4 * s, 26 * s); gr.addColorStop(0, 'rgba(255,196,110,.5)'); gr.addColorStop(1, 'rgba(255,196,110,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, by - 4 * s, 26 * s, 11 * s, 0, 0, Math.PI * 2); g.fill();
    g.translate(cx, by - 34 * s + b); g.fillStyle = '#0b0907'; g.beginPath(); g.moveTo(-9 * s, -8 * s); g.lineTo(9 * s, -8 * s); g.lineTo(0, 6 * s); g.closePath(); g.fill();
    g.fillStyle = '#f4c869'; g.beginPath(); g.moveTo(-6 * s, -6 * s); g.lineTo(6 * s, -6 * s); g.lineTo(0, 3 * s); g.closePath(); g.fill(); g.restore();
  }
  function exEnter(n) {
    if (!n || !n.inside) return; if (typeof closeTalk === 'function') closeTalk();
    const im = EXIN.img[n.inside] || (EXIN.img[n.inside] = Object.assign(new Image(), { src: 'img/bg/in_' + n.inside + '.webp' }));
    (profile.visited = profile.visited || {})[n.inside] = 1; veil(n.place, n.name, () => { EXIN.n = n; EXIN.x = 0.12; EXIN.dir = 1; EXIN.tx = null; EXIN.keys.clear(); $('inName').textContent = n.place; $('interior').hidden = false; $('townWrap').classList.add('indoors'); $('prompt').hidden = true; exInHint(); if (window.CB_AUDIO) { CB_AUDIO.sfx('door'); CB_AUDIO.music('indoors'); } requestAnimationFrame(exInFrame); });
  }
  function exLeave() { if (!EXIN.n) return; const n = EXIN.n; if (typeof closeTalk === 'function') closeTalk(); veil('Emberwatch', '', () => { EXIN.n = null; $('interior').hidden = true; $('townWrap').classList.remove('indoors'); if (window.CB_AUDIO) { CB_AUDIO.sfx('door'); CB_AUDIO.music('town'); } updatePrompt(); $('town').focus({ preventScroll: true }); }); }
  $('inLeave').onclick = exLeave;
  const IN_NPCX = 0.7;
  function exInHint() { const n = EXIN.n; if (!n) return; const near = Math.abs(EXIN.x - IN_NPCX) < 0.13; $('inHint').innerHTML = near ? `<kbd>Space</kbd> Talk to ${esc(n.name)}` : `<kbd>A</kbd><kbd>D</kbd> or click to walk &middot; walk up to ${esc(n.name)} to talk`; }
  function exInTalk() { const n = EXIN.n; if (!n) return; EXIN.tx = null; EXIN.dir = EXIN.x < IN_NPCX ? 1 : -1; talk(n); }
  function exInFrame(t) {
    const n = EXIN.n; if (!n) return; requestAnimationFrame(exInFrame);
    const cvs = $('inCv'), W = cvs.clientWidth, H = cvs.clientHeight; if (!W || !H) return; const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cvs.width !== Math.round(W * dpr)) { cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr); }
    const dt = Math.min(60, t - (EXIN.last || t)); EXIN.last = t;
    const busy = !$('talk').hidden || !$('sheet').hidden || !$('modal').hidden; let v = 0;
    if (!busy) { if (EXIN.keys.has('l')) { v = -1; EXIN.tx = null; } else if (EXIN.keys.has('r')) { v = 1; EXIN.tx = null; } else if (EXIN.tx != null) { const d = EXIN.tx - EXIN.x; if (Math.abs(d) < 0.008) { EXIN.tx = null; if (EXIN.talkAfter) { EXIN.talkAfter = false; exInTalk(); } } else v = d > 0 ? 1 : -1; } }
    if (v) { EXIN.x = Math.max(0.02, Math.min(0.95, EXIN.x + v * dt * 0.00032)); EXIN.dir = v; if (EXIN.x <= 0.03 && v < 0) { exLeave(); return; } }
    if (!!v !== EXIN.walking || (t | 0) % 9 === 0) { EXIN.walking = !!v; exInHint(); }
    const g = cvs.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false; g.fillStyle = '#070608'; g.fillRect(0, 0, W, H);
    const im = EXIN.img[n.inside]; let floor = H * 0.9, bx = 0, bw = W;
    if (im && im.complete && im.naturalWidth) { const k = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; g.drawImage(im, (W - w) / 2, H - h, w, h); floor = H - Math.max(h * 0.2, 150); }
    const s = Math.max(1.2, H * 0.27 / 96), c = profile.chars[heroKey], hx = bx + bw * EXIN.x, nx = bx + bw * IN_NPCX;
    const draw = [[floor - 6 * s, () => { if (window.CB_HEROPUP) CB_HEROPUP.npc(g, n.pal, nx, floor - 6 * s, hx < nx ? 'left' : 'right', 0, s, t); }],
      [floor, () => { if (window.CB_FORGE && CB_FORGE.town && c) CB_FORGE.town(g, c.cls, c.gear, hx, floor, EXIN.dir > 0 ? 'right' : 'left', v ? 1 : 0, s, t, 'me'); const pk = exApp().cos.pet; if (pk) exPetDraw(g, 'me-in', pk, hx, floor, s, t); }]];
    draw.sort((a, b) => a[0] - b[0]); for (const d of draw) d[1]();
    // their name over their head
    g.font = `600 ${Math.round(13 * Math.min(1.6, s / 1.6))}px 'Inter', sans-serif`; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.85)'; g.fillStyle = '#f4c869'; g.strokeText(n.name, nx, floor - 112 * s); g.fillText(n.name, nx, floor - 112 * s);
  }
  $('inCv').addEventListener('click', (ev) => { if (!EXIN.n) return; const r = $('inCv').getBoundingClientRect(), x = (ev.clientX - r.left) / r.width; if (Math.abs(x - IN_NPCX) < 0.07) { EXIN.tx = IN_NPCX + (EXIN.x < IN_NPCX ? -0.09 : 0.09); EXIN.talkAfter = true; } else { EXIN.tx = Math.max(0.0, Math.min(0.95, x)); EXIN.talkAfter = false; } });
  // keys while indoors: caught before the town sees them, so the hero outside stays put
  { const KD = { a: 'l', A: 'l', ArrowLeft: 'l', d: 'r', D: 'r', ArrowRight: 'r' };
    document.addEventListener('keydown', (ev) => { if (!EXIN.n || ev.target.matches('input, select, textarea') || !$('modal').hidden || !$('sheet').hidden || !$('talk').hidden) return;
      if (KD[ev.key]) { EXIN.keys.add(KD[ev.key]); ev.preventDefault(); ev.stopImmediatePropagation(); return; }
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); ev.cbHandled = true; return exLeave(); }
      if (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'e' || ev.key === 'E') { ev.preventDefault(); ev.stopImmediatePropagation(); if (Math.abs(EXIN.x - IN_NPCX) < 0.13) exInTalk(); return; }
      if (['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown', 'm', 'M'].includes(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); }
    }, true);
    document.addEventListener('keyup', (ev) => { if (KD[ev.key]) EXIN.keys.delete(KD[ev.key]); }, true); window.addEventListener('blur', () => EXIN.keys.clear()); }
  // ---------- the group finder (Nov 13): pin a notice in town (your strength, who you want, what you are doing), read everyone else's
  const LFG_DO = ['Runs', 'Boss kills', 'Raids', 'Arena duels', 'Trading', 'Anything'];
  function exLfgMine() { return profile.lfg && profile.lfg.on ? profile.lfg : null; }
  function exLfgPresence() { const l = exLfgMine(), c = profile.chars[heroKey]; if (!l || !c) return null; return { tx: String(l.tx || '').slice(0, 160), want: (l.want || []).slice(0, 6), doing: l.doing || 'Runs', map: l.map || '', lv: l.lv || 0, pw: CBHub.powerLevel(c), gs: CBHub.gearScore(c), dk: CB.deckLevel(c.deck), n: typeof SOC !== 'undefined' && SOC.party ? SOC.party.members.length : 1 }; }
  function openLfg() {
    if (!profile || !profile.chars[heroKey]) return; const c = profile.chars[heroKey], mine = profile.lfg = profile.lfg || { on: false, tx: '', want: [], doing: 'Runs', map: curMap(), lv: profile.last.level || 0 };
    const on = typeof socOn === 'function' && socOn(), others = on ? [...SOC.others.values()].filter(o => o.lfg) : [];
    const card = (name, cls, l, me, uid, hc) => `<div class="lfgcard" style="--mc:${CC[cls] || '#d6a14a'}"><div class="lfgtop"><b style="color:${CC[cls] || '#fff'}">${esc(name)}</b><span class="muted">${esc(cls || '')}${hc ? ' &middot; Hardcore' : ''}</span><span class="chip">Power ${l.pw}</span><span class="chip">Gear ${l.gs}</span><span class="chip">Deck ${l.dk}</span><span class="chip">${l.n} in party</span></div>
        <div class="lfgmid"><span><i>Doing</i> ${esc(l.doing)}${l.map && DATA.maps[l.map] ? ': ' + esc(DATA.maps[l.map].name) + ' level ' + (+l.lv || 0) : ''}</span><span><i>Looking for</i> ${(l.want && l.want.length ? l.want : ['Anyone']).map(w => `<em style="color:${CC[w] || '#efe6d2'}">${esc(w)}</em>`).join(', ')}</span></div>
        ${l.tx ? `<p>${esc(l.tx)}</p>` : ''}${me ? '' : `<div class="row" style="justify-content:flex-start;margin:6px 0 0"><button class="btn primary" data-lfgw="${esc(name)}">Whisper</button><button class="btn" data-lfginv="${uid}">Invite to party</button></div>`}</div>`;
    modal(`<h2>The group board</h2>
      <p class="savenote" style="margin:0 0 8px">Pin a notice and every hero in Emberwatch can read it while you are online. They see your strength, who you are looking for and what you are doing, and can whisper you straight from the board.</p>
      <div class="lfgform"><div class="lfgrow"><span>Doing</span><select id="lfgDo">${LFG_DO.map(d => `<option ${mine.doing === d ? 'selected' : ''}>${d}</option>`).join('')}</select><select id="lfgMap">${Object.entries(DATA.maps).map(([k, m]) => `<option value="${k}" ${mine.map === k ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select><label>Level <input type="number" id="lfgLv" min="0" max="99" value="${+mine.lv || 0}" style="width:64px"></label></div>
        <div class="lfgrow"><span>Looking for</span>${Object.keys(CLASSES).map(k => `<label class="lfgchk"><input type="checkbox" data-lfgwant="${k}" ${(mine.want || []).includes(k) ? 'checked' : ''}> <b style="color:${CC[k]}">${k}</b></label>`).join('')}<span class="muted" style="font-size:12px">(none ticked = anyone)</span></div>
        <textarea id="lfgTx" maxlength="160" rows="2" placeholder="Your notice: what you are doing, when, what you need... (160 letters)">${esc(mine.tx || '')}</textarea>
        <div class="row" style="justify-content:flex-start"><button class="btn primary" id="lfgPost">${mine.on ? 'Update my notice' : 'Pin my notice'}</button>${mine.on ? '<button class="btn" id="lfgDown">Take it down</button>' : ''}<span class="muted" style="font-size:12.5px">${on ? (mine.on ? 'Your notice is up.' : 'Nothing pinned yet.') : 'Sign in to pin a notice and to read the board.'}</span></div></div>
      <h3 style="font-size:19px;margin:12px 0 6px;color:var(--accent)">Notices <span class="muted" style="font-size:14px">${others.length + (mine.on && on ? 1 : 0)}</span></h3>
      <div class="lfglist">${mine.on && on ? card(c.name, c.cls, exLfgPresence(), true) : ''}${others.map(o => card(o.name, o.cls, o.lfg, false, o.uid, o.hc)).join('') || (mine.on && on ? '' : `<p class="muted" style="margin:0">${on ? 'The board is empty. Be the first to pin a notice.' : 'You are playing offline.'}</p>`)}</div>
      <div class="row"><button class="btn" id="lfgRef">Refresh</button><button class="btn primary" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide'); $('mClose').onclick = closeModal; $('lfgRef').onclick = openLfg;
    const read = () => { mine.doing = $('lfgDo').value; mine.map = $('lfgMap').value; mine.lv = Math.max(0, Math.min(99, +$('lfgLv').value || 0)); mine.tx = $('lfgTx').value.trim().slice(0, 160); mine.want = [...$('modalBox').querySelectorAll('[data-lfgwant]')].filter(x => x.checked).map(x => x.dataset.lfgwant); };
    $('lfgPost').onclick = () => { read(); if (!on) return toast('Sign in (Menu) to pin a notice: the board is shared with the other players online.'); mine.on = true; CBHub.bump(profile, 'lfgPosts'); save(); retrack(true); openLfg(); };
    if ($('lfgDown')) $('lfgDown').onclick = () => { read(); mine.on = false; save(); if (on) retrack(true); openLfg(); };
    $('modalBox').querySelectorAll('[data-lfgw]').forEach(b => b.onclick = () => { closeModal(); if (exInside()) { /* stay inside; the chat box is always there */ } const i = $('chatIn'); i.value = '/w ' + b.dataset.lfgw + ' '; i.focus(); });
    $('modalBox').querySelectorAll('[data-lfginv]').forEach(b => b.onclick = () => { if (typeof invite === 'function') { invite(b.dataset.lfginv); b.disabled = true; b.textContent = 'Invited'; } });
  }
  { const st = document.createElement('style'); st.textContent = `
    .lfgform { border: 1px solid #4a3d28; border-radius: 4px; background: rgba(10,9,8,.45); padding: 10px; display: flex; flex-direction: column; gap: 8px; } .lfgform textarea { width: 100%; resize: vertical; font: inherit; }
    .lfgrow { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .lfgrow > span:first-child { width: 86px; color: #b9ad96; } .lfgchk { display: inline-flex; gap: 4px; align-items: center; }
    .lfglist { display: flex; flex-direction: column; gap: 8px; max-height: 38vh; overflow: auto; }
    .lfgcard { border: 1px solid #4a3d28; border-left: 3px solid var(--mc); border-radius: 4px; background: linear-gradient(#1b1814, #12100d); padding: 8px 10px; } .lfgcard p { margin: 6px 0 0; color: #efe6d2; }
    .lfgtop { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .lfgtop b { font-size: 17px; } .lfgmid { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 5px; font-size: 14px; color: #d8cdb8; } .lfgmid i { font-style: normal; color: #8f8674; margin-right: 4px; } .lfgmid em { font-style: normal; font-weight: 600; }
  `; document.head.appendChild(st); }
  // ---------- transitions and boss entrances (Nov 13): the screen dips to black on the way into a fight, onto a road and back to town;
  // a boss (and a raid boss) gets a name card with a line of its own before the fight begins.
  const BOSS_LINES = { physical: 'The March ends where I stand.', fire: 'Kneel. Everything burns down to its crown.', frost: 'Winter does not hate you. It simply does not stop.', nature: 'Root remembers. Root repays.',
    arcane: 'I broke the sky to see what was behind it. You will not like it either.', shadow: 'Every crown is hollow. Come and wear mine.' };
  const RAID_LINES = { physical: 'You broke my line once. Now break a mountain.', fire: 'I drank the sun. What are ten of you?', frost: 'I am the last snow, and I fall on everything.', nature: 'Come into the web. The forest is hungry.',
    arcane: 'I am every star you ever wished on, and I am falling.', shadow: 'Kings do not die. We wait.' };
  { const st = document.createElement('style'); st.textContent = `
    #bossIntro { position: fixed; inset: 0; z-index: 1850; display: grid; grid-template-columns: 1fr 1fr; align-items: center; background: radial-gradient(90% 70% at 70% 55%, rgba(110,28,18,.82), rgba(5,4,6,.97) 70%); opacity: 0; visibility: hidden; transition: opacity .35s, visibility .35s; cursor: pointer; overflow: hidden; }
    #bossIntro.on { opacity: 1; visibility: visible; }
    #bossIntro::before, #bossIntro::after { content: ''; position: absolute; left: 0; right: 0; height: 13vh; background: #030203; transform: scaleY(0); transition: transform .45s cubic-bezier(.2,.8,.2,1); } #bossIntro::before { top: 0; transform-origin: top; } #bossIntro::after { bottom: 0; transform-origin: bottom; }
    #bossIntro.on::before, #bossIntro.on::after { transform: none; }
    #bossIntro .bitx { padding: 0 4vw 0 9vw; transform: translateX(-40px); opacity: 0; transition: transform .7s .25s cubic-bezier(.2,.8,.2,1), opacity .7s .25s; } #bossIntro.on .bitx { transform: none; opacity: 1; }
    #bossIntro small { display: block; font: 600 clamp(13px, 1.3vw, 18px) 'Inter', sans-serif; letter-spacing: .32em; text-transform: uppercase; color: #e0805a; margin-bottom: 10px; }
    #bossIntro b { display: block; font: 600 clamp(34px, 5.2vw, 78px)/1.02 'Grenze', serif; font-variant: small-caps; letter-spacing: 2px; color: #ffe9b0; text-shadow: 0 3px 0 #000, 0 0 34px rgba(240,120,50,.55); }
    #bossIntro em { display: block; margin-top: 18px; font: italic 500 clamp(16px, 1.9vw, 26px)/1.35 'Grenze', serif; color: #e8dcc4; max-width: 30ch; } #bossIntro em::before { content: '\\201C'; } #bossIntro em::after { content: '\\201D'; }
    #bossIntro .biart { justify-self: center; height: 62vh; max-width: 46vw; display: grid; place-items: center; transform: translateX(60px) scale(.94); opacity: 0; transition: transform .8s .15s cubic-bezier(.2,.8,.2,1), opacity .6s .15s; } #bossIntro.on .biart { transform: none; opacity: 1; }
    #bossIntro .biart img { max-height: 62vh; max-width: 46vw; image-rendering: pixelated; filter: drop-shadow(0 0 40px rgba(0,0,0,.9)) drop-shadow(0 0 22px rgba(240,90,40,.35)); animation: raidbreath 3.4s ease-in-out infinite; transform-origin: 50% 100%; }
    #bossIntro .biskip { position: absolute; right: 22px; bottom: calc(13vh + 12px); font-size: 12.5px; color: #9d927e; z-index: 2; }
    #storyCard { max-width: 620px; text-align: center; } #storyCard p { font: 500 19px/1.5 'Grenze', serif; color: #e8dcc4; margin: 0 0 12px; opacity: 0; animation: storyin .9s forwards; } #storyCard p:nth-child(2) { animation-delay: .9s; } #storyCard p:nth-child(3) { animation-delay: 1.8s; } #storyCard p:nth-child(4) { animation-delay: 2.7s; }
    @keyframes storyin { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { #bossIntro *, #bossIntro::before, #bossIntro::after { transition: none !important; animation: none !important; } }
  `; document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'bossIntro'; d.setAttribute('role', 'dialog'); d.innerHTML = '<div class="bitx"><small id="biKick"></small><b id="biName"></b><em id="biLine"></em></div><div class="biart" id="biArt"></div><span class="biskip">Click or press any key</span>'; document.body.appendChild(d); }
  let biTimer = 0;
  function exBossIntroOff() { clearTimeout(biTimer); $('bossIntro').classList.remove('on'); }
  $('bossIntro').addEventListener('click', exBossIntroOff);
  document.addEventListener('keydown', (ev) => { if ($('bossIntro').classList.contains('on')) { ev.preventDefault(); ev.stopImmediatePropagation(); exBossIntroOff(); } }, true);
  function exBossIntro(e) {
    const d = DATA.enemies[e.key] || {}, raid = !!d.raid, mk = raid ? d.map : (typeof run !== 'undefined' && run && run.mapKey) || Object.keys(DATA.maps).find(k => DATA.maps[k].boss === e.key) || 'physical', M = DATA.maps[mk];
    const f = window.CB_MOBS && CB_MOBS.keyOf ? CB_MOBS.keyOf(e.key) : null, src = raid ? 'img/raid/' + mk + '.webp' : f ? 'img/mobs/' + f.k + '_p.webp' : '';
    $('biKick').textContent = raid ? 'Raid boss' : 'Boss of ' + (M ? M.name : 'the road'); $('biName').textContent = e.name; $('biLine').textContent = (raid ? RAID_LINES : BOSS_LINES)[mk] || 'You should not have come.';
    $('biArt').innerHTML = src ? `<img src="${src}" alt="" draggable="false" style="height:${raid ? 60 : 50}vh">` : '';
    $('bossIntro').classList.add('on'); if (window.CB_AUDIO) CB_AUDIO.sfx('roar', .9, 250); clearTimeout(biTimer); biTimer = setTimeout(exBossIntroOff, 4200);
  }
  { const scu0 = startCombatUI;
    startCombatUI = function () {
      if (!cb || cb.practice || cb._veiled || cb.duel) return scu0(); cb._veiled = true;
      const boss = cb.enemies.find(e => e.tier === 'Boss' || (DATA.enemies[e.key] || {}).raid), names = [...new Set(cb.enemies.filter(e => !e.noLoot || true).map(e => e.name))];
      veil(boss ? '' : names.slice(0, 2).join(' and ') + (names.length > 2 ? ' and more' : ''), boss ? '' : cb.enemies.some(e => e.tier === 'Elite') ? 'Elite fight' : 'Fight', () => { scu0(); if (boss) setTimeout(() => exBossIntro(boss), 120); });
    };
    const btt0 = backToTown; let leaving = false;
    backToTown = function () { if (leaving) return; leaving = true; veil('Emberwatch', 'Home', () => { leaving = false; btt0(); }); };
  }
  // the first time a hero rides out: a few lines before the road
  function exRideOut(title, sub, go) {
    const c = profile.chars[heroKey], first = c && !(c.runs > 0) && !profile.seenRideOut;
    if (!first) return veil(title, sub, go);
    profile.seenRideOut = 1; save();
    modal(`<div id="storyCard"><p>Emberwatch is the last city. Beyond its gate lies the March, and whatever took the kingdom.</p><p>You ride with a deck of cards and what you can carry home.</p><p>Kill what you can. Leave when you must. The dead keep nothing.</p><p><button class="btn primary" id="storyGo">Ride out</button></p></div>`);
    $('storyGo').onclick = () => { closeModal(); veil(title, sub, go); };
  }
