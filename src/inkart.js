// ---------- Gothic Ink figures (Nov 1): an art pack for the fight screen, built to be swapped out.
// Images: public/img/ink/<enemy key>.webp and hero_<class>.webp, made by design/inkart/render.js
// (PAPERFORGE for humanoids, design/inkart/monsters.js for beasts, constructs, elementals, plants and fliers).
// TO REMOVE IT: delete this file, the /*INKART*/ line in src/template.html and the INKART entry in build.js,
// and public/img/ink/. figure() then falls back to the original drawn figures by itself.
(function () {
  const M = /*INK-MANIFEST*/{"heroes":{"Warrior":1.12,"Rogue":1.12,"Mage":1.12,"Paladin":1.12},"enemies":{"deserter":1.12,"scrap_hound":0.82,"shield_recruit":1.12,"bristleback_boar":0.92,"camp_thief":1.12,"bandit_cutthroat":1.12,"iron_sentry":1,"mercenary_sergeant":1.12,"dire_wolf":0.82,"cave_bear":0.92,"siegebreaker_ogre":1.48,"warforged_bulwark":1.06,"pit_duelist":1.19,"werewolf_marauder":0.87,"fallen_knight":1.19,"gravel_king":1.32,"sergeant_ironjaw":1.32,"clockwork_juggernaut":1.18,"the_twin_blades":1.32,"pit_champion":1.32,"the_quartermaster":1.32,"warlord_gorrath_the_iron_tide":1.48,"ash_imp":0.95,"cinder_hound":0.82,"lava_slug":0.85,"firebrand_zealot":1.12,"ember_thief":1.12,"salamander":0.82,"magma_golem":1.05,"flamecaller_acolyte":1.12,"blaze_drake":0.82,"kiln_guardian":1,"obsidian_brute":1.48,"pyre_sentinel":1.06,"flame_duelist":1.19,"hellhound_alpha":0.87,"ash_priestess":1.19,"cinder_matron":1.45,"brimstone_warden":1.18,"volcanic_colossus":1.24,"the_twin_pyres":1.24,"lord_of_embers":1.45,"the_ash_collector":1.32,"pyrelord_vashkar_the_kindled_crown":1.63,"snow_sprite":0.6,"ice_wolf":0.82,"glacier_shell":0.85,"frostbitten_scout":1.12,"yeti_cub":0.92,"frost_troll":1.4,"ice_sentinel":1,"rime_shaman":1.12,"snow_leopard":0.82,"mammoth":0.92,"frost_giant":1.48,"glacier_golem":1.06,"winter_knight":1.19,"wendigo":0.87,"ember_witch":1.19,"the_yeti_king":1.08,"captain_of_the_rime":1.32,"the_frozen_engine":1.18,"the_shard_sisters":1.32,"the_pale_champion":1.32,"the_hoarfrost_hermit":1.32,"queen_sylvaine_of_the_long_winter":1.48,"spitting_toad":0.92,"briar_wolf":0.82,"sapling_guardian":1,"giant_wasp":0.6,"mossback_poacher":1.12,"bog_lurker":0.92,"ironbark_treant":1,"grove_druid":1.12,"jungle_stalker":0.82,"spore_shambler":1,"thornback_behemoth":0.97,"elder_bramble":1.06,"vinewarden":1.19,"broodmother_spider":0.87,"hexbloom_witch":1.19,"the_swamp_hag":1.32,"the_root_warden":1.18,"the_colossal_treant":1.18,"the_hive_queen":0.97,"the_thornblade":1.32,"the_fungal_hoarder":1.18,"the_elder_thornheart":1.32,"mana_wisp":0.6,"arcane_construct":1,"spell_eater_rat":0.62,"failed_apprentice":1.12,"scroll_thief":1.12,"ley_hound":0.82,"warded_golem":1,"spire_magister":1.12,"blink_panther":0.82,"living_tome":1,"rune_titan":1.06,"prism_sentinel":1.06,"spellblade":1.19,"mana_wraith":1.19,"iron_arbiter":1.06,"the_hollow_archivist":1.32,"the_warden_of_wards":1.32,"the_clockwork_oracle":1.18,"the_mirror_twins":1.32,"the_duelist_magus":1.32,"the_bursar":1.32,"archmagus_ilvar_the_unbound":1.48,"crypt_rat":0.62,"restless_skeleton":1.12,"tomb_shield":1.12,"gloom_bat":0.6,"grave_robber":1.12,"ghoul":1.12,"bone_golem":1.25,"cult_deacon":1.12,"shade":1.12,"crypt_hound":0.82,"abomination":1.33,"ossuary_guardian":1.33,"death_knight":1.19,"vampire_spawn":1.19,"bone_colossus":1.33,"the_gravedigger":1.32,"the_bone_sergeant":1.32,"the_bell_of_mourning":1.18,"the_weeping_sisters":1.32,"the_crimson_count":1.32,"the_reliquary_keeper":1.32,"the_hollow_king":1.48},"town":{"hero_warrior":{"w":97,"h":130,"ax":54,"n":10},"hero_rogue":{"w":85,"h":130,"ax":47,"n":10},"hero_mage":{"w":90,"h":130,"ax":55,"n":10},"hero_paladin":{"w":100,"h":130,"ax":55,"n":10},"npc_qm":{"w":98,"h":130,"ax":58,"n":10},"npc_scribe":{"w":93,"h":130,"ax":49,"n":10},"npc_chron":{"w":80,"h":130,"ax":41,"n":10},"npc_wagon":{"w":98,"h":130,"ax":59,"n":10},"npc_captain":{"w":99,"h":130,"ax":54,"n":10},"npc_merchant":{"w":85,"h":130,"ax":46,"n":10},"npc_guildmaster":{"w":98,"h":130,"ax":50,"n":10},"npc_jeweler":{"w":92,"h":130,"ax":49,"n":10},"npc_tinker":{"w":91,"h":130,"ax":54,"n":10},"npc_raidwarden":{"w":103,"h":130,"ax":57,"n":10},"npc_archivist":{"w":92,"h":130,"ax":56,"n":10}}}/*END*/;
  const css = document.createElement('style');
  css.textContent = `.figure:has(> .inkfig) { height: auto; overflow: visible; min-height: 80px; }
    .inkfig { display: block; width: auto; height: calc(var(--fh, 118px) * var(--s, 1)); max-width: 100%; object-fit: contain; filter: drop-shadow(0 3px 0 rgba(0,0,0,.35)); pointer-events: none; user-select: none; }
    #playerSlot.party .inkfig, .foes.many .inkfig { --fh: 74px; } #playerSlot.raid .inkfig { --fh: 48px; }
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
      const s = M.enemies && M.enemies[a.key]; return s ? `<img class="inkfig" src="img/ink/${a.key}.webp" style="--s:${s}" alt="" draggable="false">` : null;
    },
  };
})();
