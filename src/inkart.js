// ---------- Gothic Ink figures (Nov 1): an art pack for the fight screen, built to be swapped out.
// Images: public/img/ink/<enemy key>.webp and hero_<class>.webp, made by design/inkart/render.js
// (PAPERFORGE for humanoids, design/inkart/monsters.js for beasts, constructs, elementals, plants and fliers).
// TO REMOVE IT: delete this file, the /*INKART*/ line in src/template.html and the INKART entry in build.js,
// and public/img/ink/. figure() then falls back to the original drawn figures by itself.
(function () {
  const M = /*INK-MANIFEST*/{"heroes":{"Warrior":1.12,"Rogue":1.12,"Mage":1.12,"Paladin":1.12,"Warlock":1.12},"enemies":{"deserter":1.12,"scrap_hound":0.82,"shield_recruit":1.12,"bristleback_boar":0.92,"camp_thief":1.12,"bandit_cutthroat":1.12,"iron_sentry":1,"mercenary_sergeant":1.12,"dire_wolf":0.82,"cave_bear":0.92,"siegebreaker_ogre":1.48,"warforged_bulwark":1.06,"pit_duelist":1.19,"werewolf_marauder":0.87,"fallen_knight":1.19,"gravel_king":1.32,"sergeant_ironjaw":1.32,"clockwork_juggernaut":1.18,"the_twin_blades":1.32,"pit_champion":1.32,"the_quartermaster":1.32,"warlord_gorrath_the_iron_tide":1.48,"ash_imp":0.95,"cinder_hound":0.82,"lava_slug":0.85,"firebrand_zealot":1.12,"ember_thief":1.12,"salamander":0.82,"magma_golem":1.05,"flamecaller_acolyte":1.12,"blaze_drake":0.82,"kiln_guardian":1,"obsidian_brute":1.48,"pyre_sentinel":1.06,"flame_duelist":1.19,"hellhound_alpha":0.87,"ash_priestess":1.19,"cinder_matron":1.45,"brimstone_warden":1.18,"volcanic_colossus":1.24,"the_twin_pyres":1.24,"lord_of_embers":1.45,"the_ash_collector":1.32,"pyrelord_vashkar_the_kindled_crown":1.63,"snow_sprite":0.6,"ice_wolf":0.82,"glacier_shell":0.85,"frostbitten_scout":1.12,"yeti_cub":0.92,"frost_troll":1.4,"ice_sentinel":1,"rime_shaman":1.12,"snow_leopard":0.82,"mammoth":0.92,"frost_giant":1.48,"glacier_golem":1.06,"winter_knight":1.19,"wendigo":0.87,"ember_witch":1.19,"the_yeti_king":1.08,"captain_of_the_rime":1.32,"the_frozen_engine":1.18,"the_shard_sisters":1.32,"the_pale_champion":1.32,"the_hoarfrost_hermit":1.32,"queen_sylvaine_of_the_long_winter":1.48,"spitting_toad":0.92,"briar_wolf":0.82,"sapling_guardian":1,"giant_wasp":0.6,"mossback_poacher":1.12,"bog_lurker":0.92,"ironbark_treant":1,"grove_druid":1.12,"jungle_stalker":0.82,"spore_shambler":1,"thornback_behemoth":0.97,"elder_bramble":1.06,"vinewarden":1.19,"broodmother_spider":0.87,"hexbloom_witch":1.19,"the_swamp_hag":1.32,"the_root_warden":1.18,"the_colossal_treant":1.18,"the_hive_queen":0.97,"the_thornblade":1.32,"the_fungal_hoarder":1.18,"the_elder_thornheart":1.32,"mana_wisp":0.6,"arcane_construct":1,"spell_eater_rat":0.62,"failed_apprentice":1.12,"scroll_thief":1.12,"ley_hound":0.82,"warded_golem":1,"spire_magister":1.12,"blink_panther":0.82,"living_tome":1,"rune_titan":1.06,"prism_sentinel":1.06,"spellblade":1.19,"mana_wraith":1.19,"iron_arbiter":1.06,"the_hollow_archivist":1.32,"the_warden_of_wards":1.32,"the_clockwork_oracle":1.18,"the_mirror_twins":1.32,"the_duelist_magus":1.32,"the_bursar":1.32,"archmagus_ilvar_the_unbound":1.48,"crypt_rat":0.62,"restless_skeleton":1.12,"tomb_shield":1.12,"gloom_bat":0.6,"grave_robber":1.12,"ghoul":1.12,"bone_golem":1.25,"cult_deacon":1.12,"shade":1.12,"crypt_hound":0.82,"abomination":1.33,"ossuary_guardian":1.33,"death_knight":1.19,"vampire_spawn":1.19,"bone_colossus":1.33,"the_gravedigger":1.32,"the_bone_sergeant":1.32,"the_bell_of_mourning":1.18,"the_weeping_sisters":1.32,"the_crimson_count":1.32,"the_reliquary_keeper":1.32,"the_hollow_king":1.48},"town":{"hero_warrior":{"w":97,"h":130,"ax":54,"n":10},"hero_rogue":{"w":85,"h":130,"ax":47,"n":10},"hero_mage":{"w":90,"h":130,"ax":55,"n":10},"hero_paladin":{"w":100,"h":130,"ax":55,"n":10},"npc_qm":{"w":98,"h":130,"ax":58,"n":10},"npc_scribe":{"w":93,"h":130,"ax":49,"n":10},"npc_chron":{"w":80,"h":130,"ax":41,"n":10},"npc_wagon":{"w":98,"h":130,"ax":59,"n":10},"npc_captain":{"w":99,"h":130,"ax":54,"n":10},"npc_merchant":{"w":85,"h":130,"ax":46,"n":10},"npc_guildmaster":{"w":98,"h":130,"ax":50,"n":10},"npc_jeweler":{"w":92,"h":130,"ax":49,"n":10},"npc_tinker":{"w":91,"h":130,"ax":54,"n":10},"npc_raidwarden":{"w":103,"h":130,"ax":57,"n":10},"npc_archivist":{"w":92,"h":130,"ax":56,"n":10},"hero_warlock":{"w":90,"h":130,"ax":50,"n":10}}}/*END*/;
  const css = document.createElement('style');
  css.textContent = `.figure:has(> .inkfig) { height: auto; overflow: visible; min-height: 80px; }
    .inkfig { display: block; width: auto; height: calc(var(--fh, 118px) * var(--s, 1)); max-width: 100%; object-fit: contain; filter: drop-shadow(0 3px 0 rgba(0,0,0,.35)); pointer-events: none; user-select: none; }
    .order .otile .ofig .inkfig { height: 58px; width: 100%; filter: none; } .order.raid .otile .ofig .inkfig { height: 30px; }
    .unit.dead .inkfig { filter: grayscale(1) brightness(.55); opacity: .7; }`;
  document.head.appendChild(css);
  const imgs = {}, face = {};
  window.CB_INK = {
    manifest: M,
    // town walker (and the character screen doll): draws and returns true, or false to use the original drawing
    // strip = 4 idle frames then 6 walk frames, facing right; left (and up, after facing left) is mirrored
    town(g, key, cx, by, dir, step, s, t) {
      const m = M.town && M.town[key]; if (!m) return false;
      const img = imgs[key] || (imgs[key] = Object.assign(new Image(), { src: 'img/ink/town_' + key + '.webp' }));
      if (!img.complete || !img.naturalWidth) return false;
      if (dir === 'left' || dir === 'right') face[key] = dir; // remember which way this walker last faced
      const left = dir === 'left' || ((dir === 'up' || dir === 'down') && face[key] === 'left');
      const f = step ? 4 + Math.floor(t / 120) % 6 : Math.floor(t / 520) % 4, H = Math.min(72 * s, by - 8), k = H / m.h; // by - 8: fits the character-screen doll
      g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, by, 15 * s, 5 * s, 0, 0, Math.PI * 2); g.fill();
      g.translate(cx, by); if (left) g.scale(-1, 1);
      g.drawImage(img, f * m.w, 0, m.w, m.h, -m.ax * k, -H, m.w * k, H); g.restore();
      return true;
    },
    // HTML for an actor's figure, or null to use the original art
    figure(a) {
      if (!a) return null;
      if (a.isPlayer) { const s = M.heroes && M.heroes[a.cls]; return s ? `<img class="inkfig" src="img/ink/hero_${a.cls.toLowerCase()}.webp" style="--s:${s}" alt="" draggable="false">` : null; }
      let k = a.key; if (M.enemies && !M.enemies[k] && window.CB_DATA) { const d = CB_DATA.enemies[k]; if (d && d.raid && d.map && CB_DATA.maps[d.map]) k = CB_DATA.maps[d.map].boss; } // raid bosses wear their map boss's art
      let sm = 1; if (M.enemies && !M.enemies[k] && window.CB_DATA && CB_DATA.enemies[k] && CB_DATA.enemies[k].art) { k = CB_DATA.enemies[k].art; sm = 0.8; } // group members wear a smaller copy of a monster's art
      const s = M.enemies && M.enemies[k] && M.enemies[k] * sm; return s ? `<img class="inkfig" src="img/ink/${k}.webp" style="--s:${s}" alt="" draggable="false">` : null;
    },
  };
})();

// ---------- Gothic Ink town (Nov 1): the ground and every town prop, same ink rules as the figures.
// buildGround() and drawProp() in src/template.html ask CB_INK first; returning nothing / false keeps the old drawing.
(function () {
  if (!window.CB_INK) return;
  const INK = '#0b0a07';
  const rng = (seed) => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const path = (g, pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
  const ink = (g, lw) => { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'miter'; g.miterLimit = 2.4; g.stroke(); };
  const P = (g, pts, fill, lw) => { path(g, pts); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) ink(g, lw); };
  const L = (g, pts, col, lw) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = col || INK; g.lineWidth = lw; g.lineJoin = 'bevel'; g.lineCap = 'butt'; g.stroke(); };
  const bbox = (pts) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1 - x0, y1 - y0]; };
  // a shaded piece: flat base, one hard black shadow mass on the right, a cut highlight sliver on the upper left, heavy ink
  function S(g, pts, pal, lw, o) {
    o = o || {}; const [x, y, w, h] = bbox(pts), k = o.mass == null ? .5 : o.mass;
    path(g, pts); g.fillStyle = pal[0]; g.fill(); g.save(); g.clip();
    P(g, [[x + w * (1 - k), y - 2], [x + w + 2, y - 2], [x + w + 2, y + h + 2], [x + w * (.75 - k), y + h + 2], [x + w * (1.02 - k), y + h * .55]], pal[1]);
    if (pal[2]) { g.globalAlpha = .75; P(g, [[x + w * .08, y + h * .3], [x + w * .2, y + h * .08], [x + w * .42, y + h * .06], [x + w * .2, y + h * .16], [x + w * .12, y + h * .42]], pal[2]); g.globalAlpha = 1; }
    if (o.cuts) { const r = rng((x * 31 + y * 17) | 0); for (let i = 0; i < o.cuts; i++) { const px = x + w * (.15 + r() * .7), py = y + h * (.2 + r() * .65); L(g, [[px, py], [px + 3 + r() * 4, py - 1.5 - r() * 2]], INK, 1.1); } }
    g.restore(); path(g, pts); if (lw) ink(g, lw);
  }
  const circ0 = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = '#5a5650'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = INK; g.stroke(); };
  const shadow = (g, cx, cy, rx, ry, a) => { g.fillStyle = `rgba(0,0,0,${a || .45})`; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
  // jagged ink flame (cut paper): outer ember, inner gold
  function flame(g, x, y, r, t, seed) {
    const f = 1 + Math.sin(t / 90 + seed * 1.7) * .12 + Math.sin(t / 37 + seed) * .06, h = r * 2 * f, sw = Math.sin(t / 120 + seed) * r * .3;
    P(g, [[x - r * .8, y], [x - r * .7, y - h * .45], [x - r * .25, y - h * .6], [x + sw, y - h], [x + r * .35, y - h * .55], [x + r * .75, y - h * .4], [x + r * .8, y]], '#d6542a', 1.6);
    P(g, [[x - r * .4, y], [x - r * .3, y - h * .35], [x + sw * .6, y - h * .68], [x + r * .35, y - h * .32], [x + r * .4, y]], '#ffc463');
  }
  const W8 = ['#4a3524', '#21160d', '#7a5c3c'], WOOD = ['#3d2c1e', '#1a120b', '#6c5238'], STONE = ['#4a4741', '#1e1c19', '#7a756b'], IRON = ['#3c3d3f', '#151516', '#7c7a74'];

  CB_INK.ground = function (o) {
    const { MW, MH, TS, dpr, ground } = o, c = document.createElement('canvas'); c.width = MW * TS * dpr; c.height = MH * TS * dpr;
    const g = c.getContext('2d'); g.scale(dpr, dpr); const R = rng(77), s = TS / 48, at = (x, y) => (ground[y] || [])[x];
    // grass: muted olive with ink tufts and a few broad dark patches
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const v = R(); g.fillStyle = v < .33 ? '#1a1e15' : v < .66 ? '#1c2117' : '#181c13'; g.fillRect(x * TS, y * TS, TS, TS); }
    g.globalAlpha = .28; for (let i = 0; i < MW * MH / 5; i++) { const cx = R() * MW * TS, cy = R() * MH * TS, r = TS * (.6 + R() * 1.2); P(g, [[cx - r, cy], [cx - r * .3, cy - r * .5], [cx + r * .6, cy - r * .3], [cx + r, cy + r * .2], [cx + r * .2, cy + r * .5], [cx - r * .7, cy + r * .4]], '#0a0c07'); } g.globalAlpha = 1;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) for (let i = 0; i < 4; i++) {
      const bx = x * TS + R() * TS, by = y * TS + R() * TS, hgt = (4 + R() * 5) * s;
      L(g, [[bx - 2 * s, by - hgt * .7], [bx, by], [bx + 2.5 * s, by - hgt]], INK, 1.3 * s);
      if (R() < .35) L(g, [[bx + 1 * s, by - 1], [bx + 2 * s, by - hgt * .8]], '#3c4630', 1 * s);
    }
    // dirt paths: cut-paper slabs with a jagged inked rim where they meet the grass
    const isP = (x, y) => at(x, y) === 'p';
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (isP(x, y)) { const j = TS * .16, X = x * TS, Y = y * TS; P(g, [[X - j * R(), Y - j * R()], [X + TS * .5, Y - j * R()], [X + TS + j * R(), Y - j * R()], [X + TS + j * R(), Y + TS * .5], [X + TS + j * R(), Y + TS + j * R()], [X + TS * .5, Y + TS + j * R()], [X - j * R(), Y + TS + j * R()], [X - j * R(), Y + TS * .5]], '#352b20'); }
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (isP(x, y)) {
      const X = x * TS, Y = y * TS;
      if (R() < .55) { const cx = X + R() * TS, cy = Y + R() * TS, r = TS * (.25 + R() * .3); g.globalAlpha = .5; P(g, [[cx - r, cy], [cx - r * .3, cy - r * .6], [cx + r * .7, cy - r * .4], [cx + r, cy + r * .2], [cx + r * .1, cy + r * .6]], R() < .5 ? '#45382a' : '#2b2219'); g.globalAlpha = 1; }
      for (let i = 0; i < 3; i++) { const px = X + R() * TS, py = Y + R() * TS, r = (1.6 + R() * 2.2) * s; P(g, [[px - r, py], [px, py - r * .8], [px + r, py - r * .1], [px + r * .3, py + r * .7]], R() < .5 ? '#55463a' : '#2a221a', .9 * s); }
      // rims: a broken ink line on every side that touches grass
      const rim = (x0, y0, x1, y1, nx, ny) => { const pts = []; for (let k = 0; k <= 4; k++) { const u = k / 4; pts.push([x0 + (x1 - x0) * u + nx * TS * (.1 + R() * .08), y0 + (y1 - y0) * u + ny * TS * (.1 + R() * .08)]); } L(g, pts, INK, 2.2 * s); };
      if (!isP(x, y - 1) && at(x, y - 1) !== 'b') rim(X, Y, X + TS, Y, 0, -1);
      if (!isP(x, y + 1) && at(x, y + 1) !== 'b') rim(X, Y + TS, X + TS, Y + TS, 0, 1);
      if (!isP(x - 1, y) && at(x - 1, y) !== 'b') rim(X, Y, X, Y + TS, -1, 0);
      if (!isP(x + 1, y) && at(x + 1, y) !== 'b') rim(X + TS, Y, X + TS, Y + TS, 1, 0);
    }
    // bazaar cobbles: angular stones, each inked with a lit corner
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === 'b') {
      g.fillStyle = '#1d1b18'; g.fillRect(x * TS, y * TS, TS, TS);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const q = TS / 3, X = x * TS + i * q + (j % 2) * q * .3, Y = y * TS + j * q, v = R(), jt = () => (R() - .5) * q * .18;
        S(g, [[X + 1.5 + jt(), Y + 1.5 + jt()], [X + q - 1.5 + jt(), Y + 1.5 + jt()], [X + q - 1.5 + jt(), Y + q - 1.5 + jt()], [X + 1.5 + jt(), Y + q - 1.5 + jt()]], [v < .5 ? '#47423b' : '#3d3933', '#24211d', '#6a6358'], 1.2 * s, { mass: .4 }); }
    }
    // arena sand (Nov 1): packed dun sand with scuffs, inked where it meets grass
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === 'a') {
      const X = x * TS, Y = y * TS; g.fillStyle = (x + y) % 2 ? '#4b3c28' : '#463825'; g.fillRect(X, Y, TS, TS);
      for (let i = 0; i < 4; i++) { const px = X + R() * TS, py = Y + R() * TS, r = (1.4 + R() * 2) * s; P(g, [[px - r, py], [px, py - r * .7], [px + r, py], [px, py + r * .6]], R() < .5 ? '#5d4b33' : '#33271a', .8 * s); }
      if (R() < .25) L(g, [[X + R() * TS, Y + R() * TS], [X + R() * TS, Y + R() * TS]], '#2a2016', 1.2 * s);
      const edge = (x2, y2) => at(x2, y2) !== 'a' && at(x2, y2) !== 'p';
      if (edge(x, y - 1)) L(g, [[X, Y], [X + TS, Y]], INK, 2.2 * s); if (edge(x, y + 1)) L(g, [[X, Y + TS], [X + TS, Y + TS]], INK, 2.2 * s);
      if (edge(x - 1, y)) L(g, [[X, Y], [X, Y + TS]], INK, 2.2 * s); if (edge(x + 1, y)) L(g, [[X + TS, Y], [X + TS, Y + TS]], INK, 2.2 * s);
    }
    // water: slate pool, inked ripples and pale slivers
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === '~') { g.fillStyle = '#0e1820'; g.fillRect(x * TS - 2, y * TS - 2, TS + 4, TS + 4); }
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === '~') { const X = x * TS, Y = y * TS; for (let i = 0; i < 3; i++) { const px = X + R() * TS * .7, py = Y + R() * TS; L(g, [[px, py], [px + 6 * s, py - 2 * s], [px + 12 * s, py]], INK, 1.6 * s); L(g, [[px + 2 * s, py - 3 * s], [px + 8 * s, py - 4 * s]], 'rgba(150,185,205,.35)', 1.2 * s); } }
    // palisade: sharpened stakes, each shaded and inked, bound by a rope
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === 'w') {
      const px = x * TS, py = y * TS;
      for (let i = 0; i < 3; i++) { const sx = px + i * TS / 3 + 1, w = TS / 3 - 2, top = py - 12 + R() * 7; S(g, [[sx, py + TS], [sx, top + 9], [sx + w * .45, top], [sx + w, top + 7], [sx + w, py + TS]], R() < .5 ? W8 : WOOD, 1.8 * s, { mass: .42, cuts: 2 }); }
      L(g, [[px, py + TS * .52], [px + TS, py + TS * .56]], '#1a120b', 4 * s); L(g, [[px, py + TS * .5], [px + TS, py + TS * .53]], '#5a4630', 1.4 * s);
    }
    for (const gx of [11, 14]) S(g, [[gx * TS + TS * .22, -6], [gx * TS + TS * .78, -6], [gx * TS + TS * .78, TS], [gx * TS + TS * .22, TS]], W8, 2.2 * s, { mass: .45, cuts: 3 });
    g.fillStyle = '#352b20'; g.fillRect(12 * TS, 0, TS * 2, TS); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(12 * TS, 0, TS * 2, TS * .35);
    return c;
  };

  CB_INK.prop = function (g, p, TS, t) {
    const x0 = p.x * TS, y0 = p.y * TS, W = p.w * TS, H = p.h * TS, s = TS / 48, lw = 2 * s;
    if (p.kind === 'tree') {
      const cx = x0 + TS / 2, by = y0 + TS * .9;
      shadow(g, cx, by, TS * .44, TS * .16);
      S(g, [[cx - 4 * s, by], [cx - 3 * s, by - 16 * s], [cx + 3 * s, by - 16 * s], [cx + 4 * s, by]], WOOD, lw, { mass: .5 });
      const cols = [['#2a4430', '#0c160e', '#5f8a5a'], ['#2f4628', '#0d160b', '#6a8c4e'], ['#2b3a30', '#0d120f', '#5e7364']][p.v || 0];
      for (let i = 0; i < 3; i++) { const w = (30 - i * 6) * s, base = by - (12 + i * 14) * s, top = by - (40 + i * 14) * s;
        S(g, [[cx - w, base], [cx - w * .7, base - 5 * s], [cx - w * .45, base - 2 * s], [cx - w * .25, base - 9 * s], [cx, top], [cx + w * .3, base - 8 * s], [cx + w * .5, base - 2 * s], [cx + w * .75, base - 5 * s], [cx + w, base]], cols, lw, { mass: .52, cuts: 2 }); }
    } else if (p.kind === 'rock') {
      const cx = x0 + TS / 2, by = y0 + TS * .85;
      shadow(g, cx, by, 20 * s, 6 * s);
      S(g, [[cx - 18 * s, by], [cx - 15 * s, by - 14 * s], [cx - 4 * s, by - 23 * s], [cx + 9 * s, by - 19 * s], [cx + 17 * s, by - 9 * s], [cx + 18 * s, by]], STONE, lw, { mass: .48, cuts: 3 });
      L(g, [[cx - 4 * s, by - 23 * s], [cx - 1 * s, by - 10 * s], [cx + 9 * s, by - 6 * s]], INK, 1.4 * s);
    } else if (p.kind === 'torch') {
      const cx = x0 + TS / 2, by = y0 + TS * .9;
      shadow(g, cx, by, 8 * s, 3 * s, .35);
      S(g, [[cx - 3 * s, by], [cx - 2.5 * s, by - 34 * s], [cx + 2.5 * s, by - 34 * s], [cx + 3 * s, by]], WOOD, 1.6 * s, { mass: .5 });
      S(g, [[cx - 7 * s, by - 39 * s], [cx + 7 * s, by - 39 * s], [cx + 4 * s, by - 32 * s], [cx - 4 * s, by - 32 * s]], IRON, 1.6 * s, { mass: .45 });
      flame(g, cx, by - 39 * s, 8 * s, t, p.x);
    } else if (p.kind === 'fire') {
      const cx = x0 + W / 2, by = y0 + TS * .8;
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, sx = cx + Math.cos(a) * 30 * s, sy = by - 6 * s + Math.sin(a) * 12 * s; S(g, [[sx - 7 * s, sy + 3 * s], [sx - 5 * s, sy - 4 * s], [sx + 2 * s, sy - 6 * s], [sx + 7 * s, sy - 1 * s], [sx + 5 * s, sy + 4 * s]], STONE, 1.6 * s, { mass: .45 }); }
      S(g, [[cx - 22 * s, by - 2 * s], [cx + 18 * s, by - 12 * s], [cx + 22 * s, by - 6 * s], [cx - 18 * s, by + 4 * s]], W8, 1.8 * s, { mass: .4, cuts: 2 });
      S(g, [[cx + 22 * s, by - 2 * s], [cx - 18 * s, by - 12 * s], [cx - 22 * s, by - 6 * s], [cx + 18 * s, by + 4 * s]], WOOD, 1.8 * s, { mass: .4, cuts: 2 });
      flame(g, cx - 8 * s, by - 8 * s, 15 * s, t, 1); flame(g, cx + 8 * s, by - 8 * s, 14 * s, t, 2); flame(g, cx, by - 10 * s, 21 * s, t, 3);
    } else if (p.kind === 'tent') {
      const by = y0 + H, mid = x0 + W / 2, cl = p.cloth, dark = mixC(cl, '#000000', .72), lite = mixC(cl, '#e8d6b0', .35);
      shadow(g, mid, by - 4, W * .56, TS * .36);
      S(g, [[x0 + 2, by - 6], [x0 + W * .18, by - TS * .9], [mid, y0 - TS * .6], [x0 + W * .82, by - TS * .9], [x0 + W - 2, by - 6], [x0 + W * .7, by - 2], [x0 + W * .3, by - 2]], [cl, dark, lite], 2.6 * s, { mass: .5, cuts: 6 });
      P(g, [[mid - TS * .7, by - 4], [mid - TS * .1, by - TS * 1.9], [mid + TS * .1, by - TS * 1.9], [mid + TS * .7, by - 4]], '#0e0a07', 2.2 * s);
      S(g, [[mid - TS * .7, by - 4], [mid - TS * .08, by - TS * 1.88], [mid - TS * .32, by - 4]], [cl, dark, lite], 1.8 * s, { mass: .3 });
      L(g, [[x0 + 12, by - 12], [mid, y0 - TS * .48], [x0 + W - 12, by - 12]], p.trim, 2.6 * s);
      S(g, [[mid - 2.5 * s, y0 - TS * .5], [mid - 2 * s, y0 - TS * 1.6], [mid + 2 * s, y0 - TS * 1.6], [mid + 2.5 * s, y0 - TS * .5]], WOOD, 1.4 * s);
      const wave = Math.sin(t / 380 + p.x) * 3 * s;
      P(g, [[mid + 2, y0 - TS * 1.56], [mid + 18 * s, y0 - TS * 1.5 + wave], [mid + 26 * s, y0 - TS * 1.45 + wave * 1.2], [mid + 18 * s, y0 - TS * 1.36 + wave], [mid + 22 * s, y0 - TS * 1.26 + wave], [mid + 2, y0 - TS * 1.22]], p.flag, 1.6 * s);
    } else if (p.kind === 'longhouse') {
      const by = y0 + H;
      shadow(g, x0 + W / 2, by - 2, W * .55, TS * .3, .4);
      S(g, [[x0 + 4, y0 + TS * .9], [x0 + W - 4, y0 + TS * .9], [x0 + W - 4, by - 2], [x0 + 4, by - 2]], W8, 2.6 * s, { mass: .32, cuts: 8 });
      for (let i = 1; i < 6; i++) L(g, [[x0 + 4, y0 + TS * .9 + i * (H - TS) / 6], [x0 + W - 4, y0 + TS * .9 + i * (H - TS) / 6 + 1]], 'rgba(10,8,6,.7)', 1.4 * s);
      S(g, [[x0 - 8, y0 + TS * 1.1], [x0 + 18, y0 - TS * .6], [x0 + W - 18, y0 - TS * .6], [x0 + W + 8, y0 + TS * 1.1]], ['#2c2925', '#0e0d0b', '#5b554b'], 2.8 * s, { mass: .38, cuts: 10 });
      for (let i = 1; i < 9; i++) L(g, [[x0 + i * W / 9 + 8, y0 - TS * .5], [x0 + i * W / 9 - 2, y0 + TS * 1.05]], INK, 1.2 * s);
      P(g, [[x0 + W / 2 - TS * .45, by - 2], [x0 + W / 2 - TS * .45, by - TS * 1.05], [x0 + W / 2 + TS * .45, by - TS * 1.1], [x0 + W / 2 + TS * .45, by - 2]], '#100b07', 2.2 * s);
      for (const wx of [x0 + 18, x0 + W - 18 - TS * .7]) { P(g, [[wx, by - TS * 1.15], [wx + TS * .7, by - TS * 1.17], [wx + TS * .7, by - TS * .65], [wx, by - TS * .64]], '#f2a14e', 2 * s); L(g, [[wx + TS * .35, by - TS * 1.16], [wx + TS * .35, by - TS * .64]], INK, 2 * s); }
      const cx = x0 + W / 2; S(g, [[cx - 12 * s, y0 - TS * .15], [cx + 12 * s, y0 - TS * .15], [cx + 12 * s, y0 + TS * .25], [cx, y0 + TS * .5], [cx - 12 * s, y0 + TS * .25]], ['#6b1f1a', '#2a0b09', '#b8584a'], 2 * s, { mass: .45 });
    } else if (p.kind === 'stall') {
      shadow(g, x0 + W / 2, y0 + H - 2, W * .52, TS * .26, .4);
      S(g, [[x0 + 4, y0 + TS * .6], [x0 + W - 4, y0 + TS * .6], [x0 + W - 4, y0 + H - 2], [x0 + 4, y0 + H - 2]], W8, 2.2 * s, { mass: .35, cuts: 4 });
      for (let i = 0; i < 4; i++) P(g, [[x0 + 10 + i * (W - 20) / 4, y0 + TS * .75], [x0 + 4 + (i + 1) * (W - 20) / 4, y0 + TS * .75], [x0 + 4 + (i + 1) * (W - 20) / 4, y0 + TS], [x0 + 10 + i * (W - 20) / 4, y0 + TS]], '#1a120c', 1.2 * s);
      for (let i = 0; i < 6; i++) S(g, [[x0 + i * W / 6, y0 + TS * .6], [x0 + i * W / 6 + 6, y0 - TS * .3], [x0 + (i + 1) * W / 6 + 6, y0 - TS * .3], [x0 + (i + 1) * W / 6, y0 + TS * .6], [x0 + (i + .5) * W / 6, y0 + TS * .5]], i % 2 ? ['#5a2a22', '#24100d', '#9a5a4a'] : ['#9a8c7c', '#3a332c', '#d8ccb8'], 1.8 * s, { mass: .4 });
      P(g, [[x0 + W * .17, y0 + TS * .55], [x0 + W * .2, y0 + TS * .44], [x0 + W * .24, y0 + TS * .55]], '#4f7f48', 1.4 * s); P(g, [[x0 + W * .3, y0 + TS * .58], [x0 + W * .33, y0 + TS * .46], [x0 + W * .36, y0 + TS * .58]], '#3f64a0', 1.4 * s);
      S(g, [[x0 + W * .45, y0 + TS * .7], [x0 + W * .45, y0 + TS * .4], [x0 + W * .45 + 16 * s, y0 + TS * .4], [x0 + W * .45 + 16 * s, y0 + TS * .7]], IRON, 1.4 * s);
      S(g, [[x0 + W * .65, y0 + TS * .7], [x0 + W * .65, y0 + TS * .36], [x0 + W * .65 + 12 * s, y0 + TS * .36], [x0 + W * .65 + 12 * s, y0 + TS * .7]], ['#b08a3a', '#3e2e10', '#f0d08a'], 1.4 * s);
      P(g, [[x0 + W * .82, y0 + TS * .62], [x0 + W * .86, y0 + TS * .2], [x0 + W * .9, y0 + TS * .62]], '#c8ccd0', 1.4 * s);
    } else if (p.kind === 'wagon') {
      const by = y0 + H;
      shadow(g, x0 + W / 2, by - 4, W * .55, TS * .26, .45);
      S(g, [[x0 + 4, y0 + TS * .7], [x0 + W - 4, y0 + TS * .7], [x0 + W - 6, y0 + TS * 1.5], [x0 + 6, y0 + TS * 1.5]], W8, 2.6 * s, { mass: .38, cuts: 5 });
      const cov = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (1 - i / 8); cov.push([x0 + W / 2 + Math.cos(a) * (W / 2 - 6) + (i % 2 ? 2 : -2) * s, y0 + TS * .74 - Math.sin(a) * TS * 1.25]); }
      S(g, cov, ['#a89a80', '#3d362b', '#e4d8bc'], 2.6 * s, { mass: .42, cuts: 6 });
      for (let i = 1; i < 4; i++) L(g, [[x0 + i * W / 4, y0 + TS * .7], [x0 + i * W / 4 + 2 * s, y0 - TS * .3]], INK, 2 * s);
      for (const wx of [x0 + TS * .55, x0 + W - TS * .55]) { const cy = by - TS * .32, r = TS * .37; P(g, Array.from({ length: 10 }, (_, k) => [wx + Math.cos(k / 10 * Math.PI * 2) * r, cy + Math.sin(k / 10 * Math.PI * 2) * r]), '#3a2a1c', 2.4 * s); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI; L(g, [[wx - Math.cos(a) * r, cy - Math.sin(a) * r], [wx + Math.cos(a) * r, cy + Math.sin(a) * r]], INK, 1.6 * s); } P(g, [[wx - 4 * s, cy], [wx, cy - 4 * s], [wx + 4 * s, cy], [wx, cy + 4 * s]], '#7a5a3a', 1.2 * s); }
      S(g, [[x0 - TS * .5, y0 + TS * 1.2], [x0 + TS * .1, y0 + TS * 1.18], [x0 + TS * .1, y0 + TS * 1.3], [x0 - TS * .5, y0 + TS * 1.3]], WOOD, 1.4 * s);
      P(g, [[x0 + 2, y0 + TS * .32], [x0 + 6, y0 + TS * .24], [x0 + 10, y0 + TS * .32], [x0 + 6, y0 + TS * .48]], '#ffcf7a', 1.4 * s);
    } else if (p.kind === 'well') {
      const cx = x0 + W / 2, by = y0 + TS * .85, rim = Array.from({ length: 12 }, (_, k) => [cx + Math.cos(k / 12 * Math.PI * 2) * W * .46, by - 8 * s + Math.sin(k / 12 * Math.PI * 2) * TS * .32]);
      shadow(g, cx, by, W * .5, TS * .3);
      S(g, rim, STONE, 2.2 * s, { mass: .45, cuts: 5 });
      P(g, rim.map(([x, y]) => [cx + (x - cx) * .8, by - 10 * s + (y - by + 8 * s) * .75]), '#14283a', 1.6 * s);
      const k = (t % 2000) / 2000; g.strokeStyle = `rgba(150,200,230,${.5 - k * .5})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, by - 10 * s, W * .1 + k * W * .25, TS * .06 + k * TS * .16, 0, 0, Math.PI * 2); g.stroke();
      S(g, [[cx - 4 * s, by - 10 * s], [cx - 3 * s, by - 30 * s], [cx + 3 * s, by - 30 * s], [cx + 4 * s, by - 10 * s]], STONE, 1.6 * s);
      S(g, [[cx - 6 * s, by - 30 * s], [cx, by - 38 * s], [cx + 6 * s, by - 30 * s], [cx, by - 26 * s]], STONE, 1.6 * s);
    } else if (p.kind === 'sign') {
      const cx = x0 + TS / 2, by = y0 + TS * .95;
      S(g, [[cx - 3 * s, by], [cx - 2.5 * s, by - 34 * s], [cx + 2.5 * s, by - 34 * s], [cx + 3 * s, by]], WOOD, 1.6 * s);
      S(g, [[cx - 22 * s, by - 44 * s], [cx + 18 * s, by - 45 * s], [cx + 26 * s, by - 37 * s], [cx + 18 * s, by - 28 * s], [cx - 22 * s, by - 29 * s]], W8, 1.8 * s, { mass: .3, cuts: 2 });
      g.fillStyle = '#ead2a0'; g.font = `700 ${Math.round(10 * s)}px "Barlow Semi Condensed", sans-serif`; g.textAlign = 'center'; g.fillText('BAZAAR →', cx, by - 32.5 * s);
    } else if (p.kind === 'board') {
      const cx = x0 + TS / 2, by = y0 + TS * .9;
      for (const px of [cx - 18 * s, cx + 14 * s]) S(g, [[px, by], [px, by - 18 * s], [px + 4 * s, by - 18 * s], [px + 4 * s, by]], WOOD, 1.4 * s);
      S(g, [[cx - 22 * s, by - 46 * s], [cx + 22 * s, by - 47 * s], [cx + 22 * s, by - 16 * s], [cx - 22 * s, by - 16 * s]], W8, 2 * s, { mass: .3, cuts: 3 });
      P(g, [[cx - 17 * s, by - 42 * s], [cx - 4 * s, by - 43 * s], [cx - 4 * s, by - 26 * s], [cx - 17 * s, by - 27 * s]], '#d4c6aa', 1 * s);
      P(g, [[cx - 1 * s, by - 40 * s], [cx + 14 * s, by - 40 * s], [cx + 13 * s, by - 29 * s], [cx - 1 * s, by - 30 * s]], '#c2b394', 1 * s);
      P(g, [[cx + 2 * s, by - 27 * s], [cx + 13 * s, by - 26 * s], [cx + 13 * s, by - 19 * s], [cx + 2 * s, by - 19 * s]], '#ddd0b4', 1 * s);
    } else if (p.kind === 'statue') { // Nov 1: Juss, the first to fall: a stone warrior lying dead across a plinth, face down, a sword through his back
      const cx = x0 + TS / 2, by = y0 + TS * .92, s = TS / 48 * 1.35, CAPE = ['#3a3733', '#171513', '#5c5850'];
      shadow(g, cx, by, 34 * s, 6 * s, .45);
      S(g, [[cx - 30 * s, by], [cx - 28 * s, by - 9 * s], [cx + 28 * s, by - 9 * s], [cx + 30 * s, by]], STONE, 2 * s, { mass: .45, cuts: 3 });                         // plinth
      S(g, [[cx + 2 * s, by - 9 * s], [cx + 3 * s, by - 16 * s], [cx + 24 * s, by - 14 * s], [cx + 25 * s, by - 9 * s]], STONE, 1.6 * s, { mass: .5 });                     // legs, stretched out
      S(g, [[cx + 22 * s, by - 9 * s], [cx + 23 * s, by - 16 * s], [cx + 29 * s, by - 12 * s], [cx + 29 * s, by - 7 * s]], STONE, 1.4 * s, { mass: .5 });                     // boots, toes down
      S(g, [[cx - 15 * s, by - 9 * s], [cx - 15 * s, by - 20 * s], [cx - 8 * s, by - 27 * s], [cx + 1 * s, by - 28 * s], [cx + 7 * s, by - 22 * s], [cx + 7 * s, by - 9 * s]], STONE, 1.8 * s, { mass: .5 }); // back, armored
      S(g, [[cx - 6 * s, by - 27 * s], [cx + 7 * s, by - 22 * s], [cx + 12 * s, by - 14 * s], [cx + 14 * s, by - 9 * s], [cx + 2 * s, by - 9 * s], [cx - 2 * s, by - 16 * s]], CAPE, 1.6 * s, { mass: .5 }); // cloak draped over the back
      S(g, [[cx - 13 * s, by - 13 * s], [cx - 9 * s, by - 13 * s], [cx - 12 * s, by + 4 * s], [cx - 16 * s, by + 4 * s]], STONE, 1.4 * s, { mass: .45 });                  // arm hanging limp over the edge
      S(g, [[cx - 27 * s, by - 11 * s], [cx - 25 * s, by - 18 * s], [cx - 19 * s, by - 21 * s], [cx - 13 * s, by - 18 * s], [cx - 11 * s, by - 11 * s], [cx - 14 * s, by - 5 * s], [cx - 20 * s, by - 3 * s], [cx - 25 * s, by - 5 * s]], STONE, 1.7 * s, { mass: .5, cuts: 1 }); // helmeted head, face to the stone
      L(g, [[cx - 26 * s, by - 12 * s], [cx - 12 * s, by - 13 * s]], INK, 1.8 * s); L(g, [[cx - 20 * s, by - 21 * s], [cx - 19 * s, by - 12 * s]], INK, 1.4 * s);                                                                                          // helm rim
      S(g, [[cx - 6 * s, by - 26 * s], [cx - 3 * s, by - 27 * s], [cx + 9 * s, by - 56 * s], [cx + 7 * s, by - 57 * s]], IRON, 1.3 * s, { mass: .3 });                  // the blade, driven through his back
      L(g, [[cx + 1 * s, by - 50 * s], [cx + 15 * s, by - 55 * s]], INK, 3.4 * s); L(g, [[cx + 1 * s, by - 50 * s], [cx + 15 * s, by - 55 * s]], '#8a857a', 1.5 * s); // crossguard
      L(g, [[cx + 9 * s, by - 56 * s], [cx + 12 * s, by - 65 * s]], INK, 3.6 * s); circ0(g, cx + 12.6 * s, by - 66.5 * s, 2.5 * s);                                     // grip and pommel
      L(g, [[cx - 24 * s, by - 3 * s], [cx + 24 * s, by - 3 * s]], '#2a2622', 1.2 * s);
    } else if (p.kind === 'chest') {
      const cx = x0 + TS / 2, by = y0 + TS * .88;
      shadow(g, cx, by, 19 * s, 5 * s, .4);
      S(g, [[cx - 17 * s, by], [cx - 17 * s, by - 20 * s], [cx + 17 * s, by - 20 * s], [cx + 17 * s, by]], W8, 2 * s, { mass: .4, cuts: 2 });
      S(g, [[cx - 17 * s, by - 20 * s], [cx - 12 * s, by - 29 * s], [cx, by - 32 * s], [cx + 12 * s, by - 29 * s], [cx + 17 * s, by - 20 * s]], ['#5a4029', '#20160d', '#8a6a48'], 2 * s, { mass: .4 });
      for (const bx of [cx - 11 * s, cx + 8 * s]) P(g, [[bx, by], [bx, by - 30 * s], [bx + 3 * s, by - 30 * s], [bx + 3 * s, by]], '#2a2a2a', 1 * s);
      P(g, [[cx - 3 * s, by - 18 * s], [cx + 3 * s, by - 18 * s], [cx + 3 * s, by - 10 * s], [cx - 3 * s, by - 10 * s]], '#d6a14a', 1.4 * s);
    } else if (p.kind === 'lectern') {
      const cx = x0 + TS / 2, by = y0 + TS * .9;
      shadow(g, cx, by, 12 * s, 4 * s, .35);
      S(g, [[cx - 4 * s, by], [cx - 3 * s, by - 22 * s], [cx + 3 * s, by - 22 * s], [cx + 4 * s, by]], WOOD, 1.4 * s);
      S(g, [[cx - 16 * s, by - 22 * s], [cx + 16 * s, by - 22 * s], [cx + 12 * s, by - 32 * s], [cx - 12 * s, by - 32 * s]], W8, 1.8 * s, { mass: .35 });
      P(g, [[cx - 13 * s, by - 26 * s], [cx, by - 24 * s], [cx, by - 34 * s], [cx - 12 * s, by - 35 * s]], '#ddd0b4', 1.2 * s);
      P(g, [[cx + 13 * s, by - 26 * s], [cx, by - 24 * s], [cx, by - 34 * s], [cx + 12 * s, by - 35 * s]], '#c8baa0', 1.2 * s);
      P(g, [[cx + 14 * s, by - 31 * s], [cx + 14 * s, by - 40 * s], [cx + 18 * s, by - 40 * s], [cx + 18 * s, by - 31 * s]], '#e2d8c2', 1 * s); flame(g, cx + 16 * s, by - 40 * s, 4.5 * s, t, 9);
    } else return false;
    return true;
  };
  // the training dummy in ink: straw sack on a post, swaying
  CB_INK.scarecrow = function (g, cx, by, s, t) {
    const sw = Math.sin(t / 900) * 1.2 * s, X = (v) => cx + v * s + sw;
    shadow(g, cx, by, 12 * s, 4 * s, .4);
    S(g, [[cx - 2 * s, by], [cx - 2 * s, by - 40 * s], [cx + 2 * s, by - 40 * s], [cx + 2 * s, by]], WOOD, 1.4 * s);
    S(g, [[X(-18), by - 31 * s], [X(18), by - 32 * s], [X(18), by - 27 * s], [X(-18), by - 27 * s]], WOOD, 1.4 * s);
    S(g, [[X(-10), by - 32 * s], [X(10), by - 32 * s], [X(12), by - 12 * s], [X(5), by - 9 * s], [X(0), by - 13 * s], [X(-6), by - 9 * s], [X(-12), by - 12 * s]], ['#7a5a34', '#2a1d10', '#b89466'], 1.6 * s, { mass: .45, cuts: 3 });
    for (const d of [-1, 1]) P(g, [[X(d * 17), by - 31 * s], [X(d * 22), by - 25 * s], [X(d * 17), by - 27 * s], [X(d * 15), by - 22 * s]], '#c9a440', 1 * s);
    P(g, [[X(-3), by - 26 * s], [X(3), by - 26 * s], [X(3), by - 20 * s], [X(-3), by - 20 * s]], '#a83a28', 1.2 * s);
    S(g, Array.from({ length: 8 }, (_, k) => [X(Math.cos(k / 8 * Math.PI * 2) * 8), by - 39 * s + Math.sin(k / 8 * Math.PI * 2) * 8 * s]), ['#c4aa70', '#4a3b20', '#eadbb0'], 1.6 * s, { mass: .45 });
    for (const e of [-3, 3]) { L(g, [[X(e - 1.5), by - 41.5 * s], [X(e + 1.5), by - 38.5 * s]], INK, 1.4 * s); L(g, [[X(e + 1.5), by - 41.5 * s], [X(e - 1.5), by - 38.5 * s]], INK, 1.4 * s); }
    S(g, [[X(-13), by - 44 * s], [X(13), by - 44 * s], [X(5), by - 47 * s], [X(2), by - 55 * s], [X(-5), by - 47 * s]], ['#3e2f20', '#140e08', '#6a5438'], 1.6 * s, { mass: .45 });
    return true;
  };
  function mixC(a, b, k) { const h = (c) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
})();
