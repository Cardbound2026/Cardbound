// Which drawing each hero and monster gets. Humanoids use PAPERFORGE loadouts (gear ids from its catalog,
// in slot order: head, chest, shoulders, hands, waist, legs, feet, back, main hand, offhand); everything else
// uses a hand-coded body from monsters.js. size = display scale (1 = a normal fighter).
const SCHEME = { Fire: 'rust', Frost: 'frost', Nature: 'moss', Arcane: 'funeral', Shadow: 'funeral', Physical: 'pilgrim' };
const HEROES = {
  Warrior: { scheme: 'pilgrim', face: 'veteran', hair: 'swept', beard: 'stubble', mark: 'scar', items: ['helm_2', 'mail_0', 'pauldron_0', 'glovemetal_1', 'belt_1', 'greaves_0', 'sabatons_1', 'cape_0', 'sword_0', 'shield_0'] },
  Rogue: { scheme: 'moss', face: 'rogue', hair: 'crop', beard: 'none', mark: 'cheek', items: ['hood_1', 'leather_1', 'mantle_0', 'gloveleather_1', 'supply_1', 'pants_1', 'boot_1', 'cape_1', 'dagger_0', 'secondary_0'] },
  Mage: { scheme: 'funeral', face: 'mystic', hair: 'long', beard: 'pointed', mark: 'runes', items: ['hat_3', 'cloth_3', 'mantle_3', 'glovewrap_2', 'supply_2', 'skirt_3', 'footwrap_1', 'cape_3', 'staff_4', 'arcane_0'] },
  Warlock: { scheme: 'funeral', face: 'skull', hair: 'bald', beard: 'none', mark: 'none', items: ['hood_2', 'cloth_3', 'mantle_2', 'glovewrap_2', 'ritualbelt_2', 'skirt_3', 'footwrap_1', 'cape_1', 'wand_0', 'book_2'] },
  Paladin: { scheme: 'brass', face: 'pilgrim', hair: 'curls', beard: 'short', mark: 'none', items: ['none_0', 'plate_1', 'pauldron_3', 'glovemetal_0', 'supply_3', 'greaves_1', 'sabatons_3', 'cape_3', 'mace_2', 'shield_1'] },
};
// humanoid archetypes
const ARCH = {
  thief: ['hood_0', 'leather_0', 'mantle_0', 'gloveleather_1', 'supply_1', 'pants_1', 'boot_1', 'cape_1', 'dagger_1', 'secondary_0'],
  cutthroat: ['wrap_0', 'leather_1', 'mantle_2', 'gloveleather_2', 'belt_1', 'pants_1', 'boot_2', 'cape_0', 'dagger_3', 'secondary_1'],
  hunter: ['hat_2', 'leather_2', 'wildshoulder_0', 'gloveleather_0', 'belt_1', 'pants_1', 'boot_3', 'pack_0', 'bow_1', 'none_0'],
  recruit: ['helm_5', 'cloth_1', 'none_0', 'glovewrap_0', 'belt_0', 'pants_0', 'boot_0', 'none_0', 'polearm_0', 'shield_0'],
  soldier: ['helm_0', 'mail_0', 'pauldron_0', 'glovemetal_1', 'belt_1', 'greaves_0', 'sabatons_1', 'cape_0', 'sword_2', 'shield_1'],
  knight: ['helm_4', 'plate_1', 'pauldron_3', 'glovemetal_0', 'belt_3', 'greaves_1', 'sabatons_3', 'cape_3', 'greatsword_1', 'none_0'],
  brute: ['none_0', 'exotic_2', 'pauldron_2', 'glovemetal_2', 'belt_3', 'greaves_3', 'sabatons_1', 'none_0', 'greataxe_0', 'none_0'],
  duelist: ['none_0', 'coat_3', 'mantle_0', 'gloveleather_2', 'belt_0', 'pants_3', 'boot_2', 'cape_0', 'sword_1', 'secondary_0'],
  caster: ['hood_1', 'cloth_3', 'mantle_1', 'glovewrap_2', 'supply_2', 'skirt_3', 'footwrap_1', 'cape_1', 'staff_1', 'book_0'],
  witch: ['hat_0', 'cloth_2', 'mantle_2', 'glovewrap_2', 'ritualbelt_2', 'skirt_0', 'footwrap_1', 'cape_1', 'wand_2', 'light_1'],
  priest: ['hood_2', 'cloth_2', 'mantle_3', 'glovewrap_1', 'ritualbelt_2', 'skirt_3', 'footwrap_1', 'banner_1', 'staff_4', 'light_3'],
  druid: ['wild_0', 'exotic_3', 'wildshoulder_3', 'glovewrap_0', 'belt_2', 'skirt_2', 'footwrap_0', 'cape_4', 'staff_3', 'relic_1'],
  magister: ['hat_3', 'coat_3', 'mantle_3', 'gloveleather_2', 'supply_2', 'pants_3', 'boot_2', 'cape_3', 'staff_2', 'arcane_2'],
  spellblade: ['mask_3', 'mail_2', 'pauldron_1', 'glovemetal_0', 'belt_1', 'greaves_0', 'sabatons_0', 'cape_3', 'sword_3', 'arcane_0'],
  gravedigger: ['hat_2', 'coat_1', 'mantle_1', 'gloveleather_0', 'supply_1', 'pants_0', 'boot_1', 'pack_3', 'scythe_2', 'light_0'],
  merchant: ['hat_1', 'coat_2', 'mantle_2', 'gloveleather_2', 'supply_1', 'pants_3', 'boot_1', 'pack_1', 'gun_2', 'relic_2'],
  // undead
  skeleton: ['none_0', 'mail_3', 'wildshoulder_2', 'glovemetal_3', 'ritualbelt_1', 'pants_2', 'sabatons_2', 'cape_2', 'sword_4', 'shield_4'],
  bonelord: ['crown_2', 'exotic_0', 'wildshoulder_2', 'glovemetal_3', 'ritualbelt_0', 'greaves_2', 'sabatons_2', 'banner_2', 'scythe_0', 'arcane_1'],
  deathknight: ['helm_3', 'plate_2', 'pauldron_2', 'glovemetal_2', 'belt_3', 'greaves_1', 'sabatons_0', 'cape_2', 'greatsword_3', 'shield_4'],
  wraith: ['hood_2', 'cloth_3', 'mantle_1', 'glovemetal_3', 'ritualbelt_1', 'skirt_1', 'footwrap_0', 'cape_2', 'none_0', 'arcane_0'],
  noble: ['none_0', 'coat_3', 'mantle_3', 'gloveleather_2', 'ritualbelt_0', 'pants_3', 'boot_2', 'cape_3', 'sword_1', 'relic_0'],
  ghoul: ['none_0', 'exotic_2', 'none_0', 'glovemetal_3', 'ritualbelt_1', 'pants_2', 'none_0', 'none_0', 'fist_2', 'none_0'],
  // big folk
  giant: ['none_0', 'exotic_0', 'wildshoulder_0', 'glovewrap_0', 'belt_2', 'skirt_2', 'footwrap_0', 'cape_4', 'hammer_2', 'none_0'],
  demon: ['helm_3', 'plate_2', 'pauldron_2', 'glovemetal_2', 'ritualbelt_0', 'greaves_3', 'sabatons_0', 'cape_2', 'greatsword_2', 'light_2'],
};
const FACES = ['veteran', 'aristocrat', 'pilgrim', 'brawler', 'rogue', 'huntress', 'elder', 'wanderer'];
const HAIRS = ['crop', 'swept', 'bob', 'long', 'pony', 'braid', 'mohawk', 'bald', 'curls', 'shaved'];
const BEARDS = ['none', 'stubble', 'short', 'pointed', 'braided', 'moustache', 'mutton', 'none'];
const MARKS = ['none', 'scar', 'cheek', 'patch', 'paint', 'runes', 'freckles', 'none'];
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const tierSize = (t) => t === 'Boss' ? 1.32 : t === 'Elite' ? 1.18 : t === '3' ? 1.06 : 1;
function humanArch(k) {
  const R = [[/thief|robber|cutthroat/, 'thief'], [/poacher|scout|stalker|huntress/, 'hunter'], [/recruit|deserter/, 'recruit'], [/sergeant|ironjaw|captain|arbiter|pale_champion|winter_knight/, 'soldier'],
    [/knight|champion|warlord|gravel_king/, 'knight'], [/duelist|twin_blades|thornblade/, 'duelist'], [/spellblade|duelist_magus/, 'spellblade'], [/witch|hag/, 'witch'],
    [/priest|zealot|deacon|acolyte|ash_collector/, 'priest'], [/druid|vinewarden|shaman|hermit/, 'druid'], [/magister|archmagus|warden_of_wards|apprentice/, 'magister'],
    [/gravedigger/, 'gravedigger'], [/bursar|quartermaster/, 'merchant'], [/flamecaller|firebrand/, 'priest']];
  for (const [re, a] of R) if (re.test(k)) return a;
  return 'caster';
}
function spec(key, e) {
  const el = e.type || 'Physical', h = hash(key), size = tierSize(e.tier), crown = e.tier === 'Boss';
  const pf = (arch, extra) => {
    const items = ARCH[arch].slice(); if (crown && items[0] !== 'crown_0') items[0] = /skull|bone|hollow/.test(key) ? 'crown_2' : 'crown_0';
    return Object.assign({ kind: 'pf', size, look: { scheme: SCHEME[el] || 'pilgrim', face: FACES[h % FACES.length], hair: HAIRS[(h >> 3) % HAIRS.length], beard: BEARDS[(h >> 6) % BEARDS.length], mark: MARKS[(h >> 9) % MARKS.length], items } }, extra || {});
  };
  const body = (b, o, s) => ({ kind: 'body', body: b, el, o: o || {}, size: size * (s || 1) });
  const c = e.creature;
  if (c === 'Human') { const a = humanArch(key); return pf(a, /hag|hermit|elder/.test(key) ? { faceOverride: 'elder' } : null); }
  if (c === 'Oathbroken') return pf('deathknight', { faceOverride: 'revenant' });
  if (c === 'Undead') {
    if (/hound/.test(key)) return body('beast', {}, 1);
    if (/golem|colossus|abomination|ossuary/.test(key)) return pf('bonelord', { faceOverride: 'skull', size: size * 1.12 });
    if (/death_knight|bone_sergeant|tomb_shield/.test(key)) return pf(/tomb_shield|bone_sergeant/.test(key) ? 'skeleton' : 'deathknight', { faceOverride: 'skull' });
    if (/shade|wraith|weeping|archivist/.test(key)) return pf('wraith', { faceOverride: /archivist/.test(key) ? 'skull' : 'revenant' });
    if (/vampire|count/.test(key)) return pf('noble', { faceOverride: 'revenant' });
    if (/ghoul/.test(key)) return pf('ghoul', { faceOverride: 'revenant' });
    if (/hollow_king|reliquary/.test(key)) return pf('bonelord', { faceOverride: 'skull' });
    return pf('skeleton', { faceOverride: 'skull' });
  }
  if (c === 'Giant') return pf('giant', { faceOverride: 'orc', size: size * 1.25 });
  if (c === 'Demon') return pf('demon', { faceOverride: 'orc', skin: '#87563d', size: /imp/.test(key) ? size * .85 : size * 1.1 });
  if (c === 'Beast' || c === 'Cursed beast') {
    if (/bat|wasp/.test(key)) return body('flier', { sting: /wasp/.test(key) }, .85);
    const heavy = /boar|bear|mammoth|yeti|behemoth|toad|lurker/.test(key);
    return body('beast', { heavy, tusks: /boar|mammoth/.test(key) }, heavy ? 1.12 : /rat/.test(key) ? .75 : 1);
  }
  if (c === 'Construct') return body('construct', {}, 1);
  if (c === 'Elemental') {
    if (/wisp|sprite/.test(key)) return body('flier', { wisp: true }, .85);
    if (/twins|sisters|queen/.test(key)) return pf('witch', { faceOverride: /queen/.test(key) ? 'fae' : 'mystic' });
    return body('construct', { rock: true }, /slug|shell/.test(key) ? .85 : 1.05);
  }
  if (c === 'Plant') return body('plant', { fungal: /spore|fungal/.test(key) }, 1);
  return pf('caster');
}
// town folk (keyed by NPC id in src/template.html); heroes in town reuse HEROES
const NPCS = {
  qm: { scheme: 'brass', face: 'elder', hair: 'bald', beard: 'braided', mark: 'scar', items: ['none_0', 'exotic_2', 'none_0', 'gloveleather_0', 'supply_1', 'pants_0', 'boot_0', 'none_0', 'hammer_0', 'none_0'] },
  scribe: { scheme: 'frost', face: 'aristocrat', hair: 'long', beard: 'none', mark: 'none', items: ['hood_0', 'cloth_2', 'mantle_3', 'glovewrap_1', 'supply_2', 'skirt_0', 'footwrap_1', 'pack_2', 'wand_3', 'book_1'] },
  chron: { scheme: 'brass', face: 'elder', hair: 'swept', beard: 'pointed', mark: 'none', items: ['hat_3', 'coat_3', 'mantle_1', 'gloveleather_2', 'supply_2', 'pants_3', 'boot_2', 'cape_3', 'none_0', 'book_2'] },
  wagon: { scheme: 'rust', face: 'huntress', hair: 'braid', beard: 'none', mark: 'freckles', items: ['hat_2', 'coat_1', 'mantle_2', 'gloveleather_1', 'belt_1', 'pants_1', 'boot_1', 'pack_1', 'whip_0', 'light_0'] },
  captain: { scheme: 'pilgrim', face: 'huntress', hair: 'pony', beard: 'none', mark: 'scar', items: ['none_0', 'plate_0', 'pauldron_1', 'glovemetal_0', 'belt_3', 'greaves_1', 'sabatons_0', 'cape_3', 'sword_0', 'shield_1'] },
  merchant: { scheme: 'brass', face: 'rogue', hair: 'curls', beard: 'moustache', mark: 'none', items: ['hat_1', 'coat_2', 'mantle_2', 'gloveleather_2', 'supply_1', 'pants_3', 'boot_1', 'pack_1', 'none_0', 'relic_2'] },
  guildmaster: { scheme: 'moss', face: 'veteran', hair: 'crop', beard: 'short', mark: 'scar', items: ['none_0', 'mail_1', 'pauldron_0', 'glovemetal_1', 'belt_1', 'greaves_0', 'sabatons_1', 'banner_1', 'polearm_0', 'none_0'] },
  jeweler: { scheme: 'frost', face: 'elder', hair: 'long', beard: 'pointed', mark: 'none', items: ['crown_1', 'coat_3', 'mantle_3', 'glovewrap_2', 'ritualbelt_2', 'pants_3', 'boot_2', 'cape_3', 'wand_0', 'arcane_2'] },
  tinker: { scheme: 'moss', face: 'wanderer', hair: 'mohawk', beard: 'none', mark: 'freckles', items: ['wrap_0', 'exotic_2', 'none_0', 'gloveleather_1', 'supply_0', 'pants_0', 'boot_0', 'pack_1', 'hammer_0', 'relic_2'] },
  raidwarden: { scheme: 'pilgrim', face: 'orc', hair: 'mohawk', beard: 'mutton', mark: 'paint', items: ['helm_3', 'plate_2', 'pauldron_2', 'glovemetal_2', 'belt_3', 'greaves_3', 'sabatons_0', 'banner_0', 'greataxe_1', 'none_0'] },
  archivist: { scheme: 'funeral', face: 'mystic', hair: 'swept', beard: 'stubble', mark: 'runes', items: ['hat_3', 'cloth_3', 'mantle_3', 'glovewrap_2', 'supply_2', 'skirt_3', 'footwrap_1', 'pack_2', 'staff_2', 'book_0'] },
};
// classes that are not playable yet: drawn for the campfire on the create-a-hero screen only (hero_<name>.webp, not in the manifest)
const PREVIEW = { Shaman: { scheme: 'moss', face: 'orc', hair: 'mohawk', beard: 'braided', mark: 'paint', items: ['none_0', 'leather_2', 'mantle_1', 'gloveleather_2', 'ritualbelt_1', 'pants_2', 'boot_2', 'cape_2', 'staff_2', 'light_2'] } };
if (typeof module !== 'undefined') module.exports = { HEROES, NPCS, PREVIEW, spec };
