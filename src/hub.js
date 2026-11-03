// Cardbound hub layer: the saved profile (characters, shared stash, gold), equipping, deck building and card upgrades. No DOM.
(function (root) {
'use strict';
const CB = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.CB;
const { CARDS, CLASSES, STARTER_GEAR, CARD_XP, RANK_BASE, DECK_CAPS, DECK_MIN, DECK_MAX, MAX_RANK, deckLevel } = CB;
const SLOTS = ['Weapon', 'Off-hand', 'Helm', 'Shoulders', 'Amulet', 'Cloak', 'Chest', 'Bracers', 'Gloves', 'Belt', 'Pants', 'Boots', 'Ring 1', 'Ring 2'];
const STASH_MAX = 60;
// Hall of Records seasons (Nov 2): the board shows one season at a time. To start a new season, add it here and set SEASON.
const SEASONS = [{ id: '0.01', name: 'Season 0.01' }, { id: '0.02', name: 'Season 0.02' }];
const SEASON = '0.02';
const VERSION = 1;

let uidN = 0;
const uid = (p) => p + Date.now().toString(36) + (uidN++).toString(36) + Math.floor(Math.random() * 1e6).toString(36);

function newChar(cls, name, deckKey, amuletKey) {
  const deck = [], sd = (CB.STARTER_DECKS[cls] || []).find(x => x[0] === deckKey), list = (sd && sd[3]) || CLASSES[cls].deck;
  for (const [key, n] of list) for (let i = 0; i < n; i++) deck.push({ id: uid('k'), key, rank: 0 });
  const gear = STARTER_GEAR[cls].map(g => Object.assign({ id: uid('g') }, g));
  if (amuletKey) { const i = gear.findIndex(g => g.slot === 'Amulet'); if (i >= 0) gear[i] = Object.assign({ id: uid('g') }, CB.starterAmulet(cls, amuletKey)); }
  const seen = {}; for (const k of deck) seen[k.key] = 1;
  return { season: SEASON, sKills: {}, cls, name: name || cls, created: Date.now(), gear, deck, cards: [], seen, runs: 0, best: 0, bossKills: 0, gotOffense1: true, starter: (sd && sd[0]) || 'balanced' };
}
function newProfile() { return { v: VERSION, gold: 0, ink: 0, rerollTokens: 0, stash: [], chars: {}, last: { cls: 'Warrior', level: 0 }, history: [] }; }
function fix(p) { // tolerate older or partial saves
  p = Object.assign(newProfile(), p || {});
  for (const [k, c] of Object.entries(p.chars)) { if (!c.cls && CLASSES[k]) c.cls = k; c.cards = c.cards || []; c.deck = c.deck || []; c.gear = c.gear || []; c.name = c.name || c.cls; }
  if (CB.itemRules) { for (const it of p.stash || []) CB.itemRules(it); for (const c of Object.values(p.chars)) for (const it of c.gear) CB.itemRules(it); for (const it of (p.shop && p.shop.items) || []) CB.itemRules(it); } // Nov 1: Mana Regen only on amulets, Recovery halved
  if (p.last && p.last.cls && !p.chars[p.last.cls]) p.last.cls = Object.keys(p.chars)[0] || '';
  // retired cards (Oct 31: Battle Trance) turn into their replacement, keeping rank and XP
  for (const c of Object.values(p.chars)) for (const k of [...c.deck, ...c.cards]) if (CB.REMOVED_CARDS[k.key]) k.key = CB.REMOVED_CARDS[k.key];
  // Oct 30: the Paladin starter got more offense (+1 Crusader Strike, +1 Smite); existing Paladins get those two cards in their collection once
  for (const pal of Object.values(p.chars).filter(c => c.cls === 'Paladin')) if (!pal.gotOffense1) { pal.gotOffense1 = true; pal.cards.push({ id: uid('k'), key: 'crusader_strike', rank: 0 }, { id: uid('k'), key: 'smite', rank: 0 }); }
  // Nov 1: Ink. Every card a hero has ever owned counts as discovered
  p.ink = p.ink || 0;
  for (const c of Object.values(p.chars)) { c.seen = c.seen || {}; for (const k of [...c.deck, ...c.cards]) c.seen[k.key] = 1; }
  // Nov 1: Hall of Records. Fill map records from the boss kills and run history of heroes made before it existed
  for (const c of Object.values(p.chars)) if (!c.mapBest) { c.mapBest = {}; for (const [mk, lv] of Object.entries(c.mapKills || {})) noteMapBest(c, mk, lv, 15); for (const h of p.history || []) if (!h.raid && h.map && h.name === c.name && h.cls === c.cls) noteMapBest(c, h.map, h.level || 0, h.result === 'victory' ? 15 : (h.row || 0)); }
  // Nov 1: boss kills weren't being recorded (mapKills) since the Hall of Records; rebuild them from map records and run history
  for (const c of Object.values(p.chars)) { const k = c.mapKills = c.mapKills || {}; const up = (mk, lv) => { if (k[mk] == null || lv > k[mk]) k[mk] = lv; };
    for (const [mk, b] of Object.entries(c.mapBest || {})) if (b.row >= 15) up(mk, b.lvl); for (const h of p.history || []) if (!h.raid && h.map && h.result === 'victory' && h.name === c.name && h.cls === c.cls) up(h.map, h.level || 0); }
  // Nov 1: boss kills per map, counted from run history for heroes who had kills before this was tracked (at least 1 for any map they've beaten)
  for (const c of Object.values(p.chars)) if (!c.bossKillsBy) { const bk = c.bossKillsBy = {}; for (const h of p.history || []) if (!h.raid && h.map && h.result === 'victory' && h.name === c.name && h.cls === c.cls) bk[h.map] = (bk[h.map] || 0) + 1; for (const mk of Object.keys(c.mapKills || {})) if (!bk[mk]) bk[mk] = 1; }
  // Nov 1: the merchant's level comes from your last boss kill; older saves take it from the newest boss win in the run history
  if (!p.lastBoss) { const h = (p.history || []).find(x => !x.raid && x.map && x.result === 'victory'); if (h) p.lastBoss = { map: h.map, level: h.level || 0, at: h.at || 0 }; }
  if (p.shop && p.shop.level != null && !p.shop.map) { const sb = shopBasis(p); if (p.shop.level > sb.level) p.shop.at = 0; } // stock rolled above your last boss: restock now
  // Nov 1: heroes made before the Shoulders slot get the class's starter shoulders
  for (const c of Object.values(p.chars)) if (!c.gear.some(g => g.slot === 'Shoulders')) { const st = (STARTER_GEAR[c.cls] || []).find(g => g.slot === 'Shoulders'); if (st) c.gear.push(Object.assign({ id: uid('g') }, st)); }
  // Nov 1: rerolls. Items found before the system get their reroll potential (worked out from their own rolls); Reroll Tokens start at 0
  p.rerollTokens = p.rerollTokens || 0;
  for (const it of (p.shop && p.shop.items) || []) if (!it.px2) { if (it.price) it.price *= 2; it.px2 = 1; } // Nov 2: merchant prices doubled, stock already on the shelf too
  for (const it of [...p.stash, ...Object.values(p.chars).flatMap(c => c.gear)]) if (it && it.rerolls == null) it.rerolls = CB.rerollPotential(it);
  // Nov 2: seasons. The Hall of Records ranks the current season only. A hero's record fields (map records, clears, boss kill counts)
  // are seasonal: when a new season starts they go into c.seasons and start over. mapKills stays lifetime (first-kill boss, map unlocks).
  for (const c of Object.values(p.chars)) {
    if (!c.season) { c.season = SEASONS[0].id; c.sKills = Object.assign({}, c.mapKills || {}); } // heroes from before seasons: everything so far was season 0.01
    if (c.season !== SEASON) {
      (c.seasons = c.seasons || []).unshift({ id: c.season, progress: progressScore(c), sKills: c.sKills || {}, mapBest: c.mapBest || {}, bossKillsBy: c.bossKillsBy || {} });
      c.seasons = c.seasons.slice(0, 12);
      c.season = SEASON; c.sKills = {}; c.mapBest = {}; c.mapRows = {}; c.mapKillAt = {}; c.bossKillsBy = {};
    }
  }
  achCheck(p, {}, null, true); // Nov 2: achievements a save can already prove (boss kills, duels, ranks...) unlock quietly
  useStash(p, p.last && p.last.cls); // the stash of the hero you were last playing (hardcore heroes have their own)
  // Nov 2: gold wipe for the start of season 0.02 (once per save)
  if (!p.goldWipe1) { p.gold = 0; p.goldWipe1 = 1; }
  return p;
}
// character creation: one hero per class for now, each with a name the player picks
const NAME_RE = /^[A-Za-z][A-Za-z '\-]{1,15}$/;
function nameProblem(name) { name = (name || '').trim(); if (name.length < 2) return 'Names need at least 2 letters.'; if (name.length > 16) return 'Names can be at most 16 characters.'; if (!NAME_RE.test(name)) return 'Use letters, spaces, apostrophes or hyphens, starting with a letter.'; return null; }
// delete a hero for good: their gear, deck, cards and records go with them; the shared stash and gold stay
// heroes are keyed by an id (old saves keep their class name as the id); an account holds up to MAX_HEROES of any classes
const MAX_HEROES = 20;
function deleteChar(p, key) {
  if (!p.chars[key]) return { ok: false, why: 'No such hero' };
  delete p.chars[key];
  if (p.last) { if (p.last.cls === key) p.last.cls = Object.keys(p.chars)[0] || ''; if (p.last.party) p.last.party = p.last.party.filter(k => k !== key); }
  return { ok: true };
}
function createChar(p, cls, name, deckKey, amuletKey, hardcore) {
  if (!CLASSES[cls]) return { ok: false, why: 'Pick a class.' };
  if (Object.keys(p.chars).length >= MAX_HEROES) return { ok: false, why: `You already have ${MAX_HEROES} heroes. Delete one to make room.` };
  const why = nameProblem(name); if (why) return { ok: false, why };
  const id = uid('h'); p.chars[id] = newChar(cls, name.trim().replace(/\s+/g, ' '), deckKey, amuletKey); if (hardcore) { p.chars[id].hardcore = true; p.chars[id].hcSince = Date.now(); } p.last.cls = id; return { ok: true, id };
}
function renameChar(p, cls, name) { const c = p.chars[cls]; if (!c) return { ok: false, why: 'No such hero.' }; const why = nameProblem(name); if (why) return { ok: false, why }; c.name = name.trim().replace(/\s+/g, ' '); return { ok: true }; }
function char(p, key) { return p.chars[key]; }
const clsOf = (p, key) => (p.chars[key] && p.chars[key].cls) || (CLASSES[key] ? key : 'Warrior');

// ---------- gear
function gearScore(c) { return Math.round(SLOTS.reduce((s, sl) => { const it = c.gear.find(g => g.slot === sl); return s + (it ? it.ilvl || 0 : 0); }, 0) / SLOTS.length); }
function powerLevel(c) { return Math.round((gearScore(c) + deckLevel(c.deck)) / 2); }
// ---------- Gear power (Nov 2): what an item is worth to THIS hero, for the codex it plays and the gear it already wears.
// Stat weights come from simulation (tools/statvalue.js -> src/statweights.js): for every codex, how much one point of each stat
// moves its fight strength (rounds-to-die / rounds-to-kill, in log units). An item's power is the change in the hero's whole-gear
// value when it goes on, so stats past a cap (75% resistance, the Max Mana cap) add nothing, resistances only count for the map
// you're playing, and stats your codex doesn't use count for nothing. 1 power = 0.1% fight strength.
const STATW = (typeof module !== 'undefined' && module.exports) ? require('./statweights.js') : (root.CB_STATW || {});
const LINEAR = ['strength', 'intelligence', 'dexterity', 'spirit', 'crit', 'critDmg', 'init', 'maxMana', 'regen', 'draw', 'multiHit', 'multiplay', 'multicast', 'bleedChance', 'lifesteal', 'thorns', 'recovery', 'weaponDmg'];
const LUCK_W = 0.002; // Luck only helps loot: a small flat value so it breaks ties
const profileCache = {};
function avgWeights(keys) { const o = {}; for (const k of keys) for (const [s, v] of Object.entries(STATW[k] || {})) o[s] = (o[s] || 0) + v / keys.length; return o; }
// the codex whose weights value this hero's gear: the one worn, else the class codex whose test decks share the most cards with the deck
function gearProfile(c) {
  const worn = (c.gear || []).find(g => g && g.slot === 'Codex' && g.codex && STATW[g.codex]); if (worn) return { codex: worn.codex, w: STATW[worn.codex] };
  const TD = root.CB_TESTDECKS || [], cls = c.cls, mine = {}; for (const x of c.deck || []) mine[x.key] = (mine[x.key] || 0) + 1;
  const sig = cls + ':' + Object.keys(mine).sort().join(','); if (profileCache[sig]) return profileCache[sig];
  const by = {}; for (const d of TD) if (d.cls === cls && STATW[d.codex]) { let ov = 0; for (const [k, n] of d.cards) ov += Math.min(n, mine[k] || 0); by[d.codex] = Math.max(by[d.codex] || 0, ov); }
  const best = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  const pick = best && best[1] > 0 ? { codex: best[0], w: STATW[best[0]], guess: true }
    : { codex: null, w: avgWeights(Object.keys(STATW).filter(k => CB.CODEX_BY_KEY[k] && CB.CODEX_BY_KEY[k].cls === cls)), guess: true };
  return (profileCache[sig] = pick);
}
const mapElement = (mk) => { const M = root.CB_DATA && root.CB_DATA.maps && root.CB_DATA.maps[mk]; return M ? M.element : mk ? mk[0].toUpperCase() + mk.slice(1) : 'Physical'; };
// value of a whole set of gear (log fight strength, up to a constant)
function gearValue(c, gear, mk) {
  const cxIt = gear.find(g => g && g.slot === 'Codex'), cxk = cxIt && cxIt.codex, st = cxk && (c.codexes || {})[cxk];
  gear = CB.legalGear ? CB.legalGear({ cls: c.cls, gear, talents: { codex: cxk, picks: (st && st.picks) || [] } }) : gear; // a shield beside a staff only counts with the talent
  const w = gearProfile(c).w, t = CB.sumGear(gear), el = mapElement(mk || 'physical');
  let v = Math.log(Math.max(1, t.maxHp)) * (w.hp || 1) + 0.5 * Math.log(1 + (t.healthRegen || 0) / Math.max(1, t.maxHp)); // Health Regen: heals between fights
  for (const k of LINEAR) v += (w[k] || 0) * (k === 'critDmg' ? t.critDmg : t[k] || 0);
  v += (w.resist || 0) * Math.min(75, (t.resist || {})[el] || 0);
  for (const [e, n] of Object.entries(t.elem || {})) v += (w['elem:' + e] || 0) * n;
  v += LUCK_W * (t.luck || 0);
  if (cxk && CB.codexNeed && CB.codexNeed(cxk, gear)) v -= 0.25 * Math.abs(v); // Nov 2: the codex passive is off without the weapons it needs
  return v;
}
const is2H = (it) => !!(it && it.hands && it.hands.startsWith('2H'));
// gear with `it` put in `slot`, pushing out what equip() would push out
function swapIn(gear, it, slot) {
  const main = gear.find(g => g.slot === 'Weapon');
  const out = (g) => g.slot === slot || (is2H(it) && g.slot === 'Off-hand') || (slot === 'Off-hand' && g.slot === 'Weapon' && is2H(main));
  return gear.filter(g => !out(g)).concat([Object.assign({}, it, { slot })]);
}
const pw = (x) => Math.round(x * 1000);
// item power: what the item adds over an empty slot (its best slot), for this hero and map
function itemPower(c, it, mk) {
  if (!it || it.kind === 'card') return 0;
  const gear = (c.gear || []).filter(g => g.id == null || g.id !== it.id);
  return Math.max(...slotOptions(it).map(sl => { const without = gear.filter(g => !(g.slot === sl || (is2H(it) && g.slot === 'Off-hand'))); return pw(gearValue(c, without.concat([Object.assign({}, it, { slot: sl })]), mk) - gearValue(c, without, mk)); }));
}
// how much better the hero gets by equipping it (best slot): { d, slot, vs }
function upgradeDelta(c, it, mk) {
  const gear = c.gear || [], base = gearValue(c, gear, mk); let best = null;
  for (const sl of slotOptions(it)) { const d = pw(gearValue(c, swapIn(gear, it, sl), mk) - base); if (!best || d > best.d) best = { d, slot: sl, vs: gear.find(g => g.slot === sl) || null }; }
  return best || { d: 0, slot: null, vs: null };
}
// ---------- Achievements and titles (Nov 2). Unlocked for the whole account (p.ach = { id: { at, by } }); every achievement gives a
// title any of your heroes can wear (c.title = achievement id, picked on the character sheet). Counters live in p.stats.
// achCheck(p, ev) tests every locked achievement against the account and the event (ev.type: 'run', 'raid', 'duel', 'sale', ...)
// and returns the newly unlocked ones. A save made before achievements existed unlocks what it can prove, silently, on load.
const MAP_TITLES = { physical: ['The Broken March', 'Ironbreaker'], fire: ['The Cinder Reach', 'Emberborn'], frost: ['The Rimewatch', 'Winterborn'], nature: ['The Tanglewild', 'Thornwarden'], arcane: ['The Shattered Spire', 'Spirebreaker'], shadow: ['The Hollow Crypts', 'Cryptkeeper'] };
const CLASS_TITLES = { Warrior: 'Warmaster', Rogue: 'Nightblade', Mage: 'Spellbinder', Paladin: 'Lightbringer', Warlock: 'Voidcaller' };
const heroes = (p) => Object.values(p.chars || {});
const bestKill = (c, mk) => { const k = c.mapKills || {}; return mk ? (k[mk] == null ? -1 : k[mk]) : Math.max(-1, ...Object.values(k)); };
const won = (ev, lvl) => ev.type === 'run' && ev.victory && (ev.level || 0) >= lvl;
const st = (p, k) => (p.stats || {})[k] || 0;
const ACH = [
  { id: 'first_boss', cat: 'Roads', name: 'Blooded', how: 'Kill a map boss.', title: 'the Blooded', test: (p, ev) => won(ev, 0) || heroes(p).some(c => bestKill(c) >= 0) },
  { id: 'clear5', cat: 'Roads', name: 'Veteran', how: 'Kill a map boss at +5 or higher.', title: 'Veteran', test: (p, ev) => won(ev, 5) || heroes(p).some(c => bestKill(c) >= 5) },
  { id: 'clear10', cat: 'Roads', name: 'Champion', how: 'Kill a map boss at +10 or higher.', title: 'Champion', test: (p, ev) => won(ev, 10) || heroes(p).some(c => bestKill(c) >= 10) },
  { id: 'clear15', cat: 'Roads', name: 'Legend', how: 'Kill a map boss at +15 or higher.', title: 'Legend', test: (p, ev) => won(ev, 15) || heroes(p).some(c => bestKill(c) >= 15) },
  { id: 'clear19', cat: 'Roads', name: 'Mythic', how: 'Kill a map boss at +19.', title: 'the Mythic', test: (p, ev) => won(ev, 19) || heroes(p).some(c => bestKill(c) >= 19) },
  ...Object.entries(CLASS_TITLES).map(([cls, t]) => ({ id: 'cls_' + cls, cat: 'Classes', name: t, how: `Kill a map boss at +12 or higher as a ${cls}.`, title: t,
    test: (p, ev) => (won(ev, 12) && ev.cls === cls) || heroes(p).some(c => c.cls === cls && bestKill(c) >= 12) })),
  ...Object.entries(MAP_TITLES).map(([mk, [nm, t]]) => ({ id: 'map_' + mk, cat: 'Roads', name: t, how: `Kill the boss of ${nm} at +10 or higher.`, title: t,
    test: (p, ev) => (won(ev, 10) && ev.map === mk) || heroes(p).some(c => bestKill(c, mk) >= 10) })),
  { id: 'hc5', cat: 'Hardcore', name: 'Hardcore Champion', how: 'Kill a map boss at +5 or higher with a Hardcore hero.', title: 'Hardcore Champion', test: (p, ev) => (won(ev, 5) && ev.hc) || heroes(p).some(c => c.hardcore && bestKill(c) >= 5) },
  { id: 'hc10', cat: 'Hardcore', name: 'Hardcore Legend', how: 'Kill a map boss at +10 or higher with a Hardcore hero.', title: 'Hardcore Legend', test: (p, ev) => (won(ev, 10) && ev.hc) || heroes(p).some(c => c.hardcore && bestKill(c) >= 10) },
  { id: 'raid1', cat: 'Raids', name: 'Raider', how: 'Kill a raid boss.', title: 'Raider', test: (p, ev) => ev.type === 'raid' || heroes(p).some(c => c.raidKills > 0) },
  { id: 'raid5', cat: 'Raids', name: 'Warbreaker', how: 'Kill a raid boss at +5 or higher.', title: 'Warbreaker', test: (p, ev) => ev.type === 'raid' && (ev.level || 0) >= 5 },
  { id: 'duel1', cat: 'Arena', name: 'Duelist', how: 'Win a duel.', title: 'Duelist', n: 1, count: (p) => heroes(p).reduce((s, c) => s + ((c.duels || {}).w || 0), 0) },
  { id: 'duel100', cat: 'Arena', name: 'Gladiator', how: 'Win 100 duels.', title: 'Gladiator', n: 100, count: (p) => heroes(p).reduce((s, c) => s + ((c.duels || {}).w || 0), 0) },
  { id: 'duel1000', cat: 'Arena', name: 'Warlord', how: 'Win 1,000 duels.', title: 'Warlord', n: 1000, count: (p) => heroes(p).reduce((s, c) => s + ((c.duels || {}).w || 0), 0) },
  { id: 'gold1m', cat: 'Wealth', name: 'Tycoon', how: 'Bring home 1,000,000 gold from the roads.', title: 'Tycoon', n: 1000000, count: (p) => st(p, 'goldLooted') },
  { id: 'sale1', cat: 'Wealth', name: 'Merchant', how: 'Sell an item at the Bazaar.', title: 'Merchant', n: 1, count: (p) => st(p, 'bazaarSales') },
  { id: 'sale100k', cat: 'Wealth', name: 'Businessman', how: 'Sell one item at the Bazaar for 100,000 gold or more.', title: 'Businessman', test: (p) => st(p, 'bazaarBest') >= 100000 },
  { id: 'unburned', cat: 'Feats', name: 'The Unburned', how: 'Kill the boss of a +5 or higher Cinder Reach without healing or gaining any Block (or Dodge, Barrier, Absorb) in the boss fight.', title: 'the Unburned',
    test: (p, ev) => won(ev, 5) && ev.map === 'fire' && ev.bossClean },
  { id: 'frozen', cat: 'Feats', name: 'Frozen', how: 'Clear a +5 or higher Rimewatch run without losing a single point of HP.', title: 'the Frozen', test: (p, ev) => won(ev, 5) && ev.map === 'frost' && ev.lost === 0 },
  { id: 'untouchable', cat: 'Feats', name: 'Untouchable', how: 'Kill a +10 or higher map boss without losing any HP in the boss fight.', title: 'the Untouchable', test: (p, ev) => won(ev, 10) && ev.bossLost === 0 },
  { id: 'party4', cat: 'Feats', name: 'Fellowship', how: 'Kill a map boss in a party of four.', title: 'of the Fellowship', test: (p, ev) => won(ev, 0) && ev.party >= 4 },
  { id: 'card10', cat: 'Collection', name: 'Inkbound', how: 'Rank a card up to +10.', title: 'Inkbound', test: (p) => heroes(p).some(c => [...(c.deck || []), ...(c.cards || [])].some(k => (k.rank || 0) >= MAX_RANK)) },
  { id: 'codex20', cat: 'Collection', name: 'Codexmaster', how: 'Take a codex to its top level.', title: 'Codexmaster', test: (p) => heroes(p).some(c => Object.values(c.codexes || {}).some(s => CB.codexLevel(s.xp || 0).level >= CB.CODEX_MAX)) },
  { id: 'runs100', cat: 'Roads', name: 'Roadworn', how: 'Finish 100 runs (any result, all heroes together).', title: 'the Roadworn', n: 100, count: (p) => heroes(p).reduce((s, c) => s + (c.runs || 0), 0) },
  { id: 'extract10', cat: 'Roads', name: 'Survivor', how: 'Extract from 10 runs at a campfire.', title: 'Survivor', n: 10, count: (p) => st(p, 'extracts') },
  { id: 'deaths25', cat: 'Roads', name: 'Gravewalker', how: 'Die 25 times. It happens.', title: 'Gravewalker', n: 25, count: (p) => st(p, 'deaths') },
];
const ACH_BY = Object.fromEntries(ACH.map(a => [a.id, a]));
const ACH_FRESH = []; // unlocks waiting to be announced by the page (achTake)
function achTake() { return ACH_FRESH.splice(0); }
function achCheck(p, ev, who, quiet) {
  p.ach = p.ach || {}; ev = ev || {}; const fresh = [];
  for (const a of ACH) { if (p.ach[a.id]) continue; let ok = false; try { ok = a.count ? a.count(p) >= a.n : !!a.test(p, ev); } catch (e) {} if (ok) { p.ach[a.id] = { at: Date.now(), by: who || ev.hero || null }; fresh.push(a); } }
  if (!quiet) ACH_FRESH.push(...fresh);
  return fresh;
}
function bump(p, k, n) { p.stats = p.stats || {}; p.stats[k] = (p.stats[k] || 0) + (n == null ? 1 : n); }
// Nov 2: titles that read as a description ("the Blooded", "of the Fellowship") follow the name; ranks ("Veteran") come first
const titleAfter = (t) => /^(the|of) /i.test(t || '');
const titled = (name, t) => !t ? name : titleAfter(t) ? `${name} ${t}` : `${t} ${name}`;
// Nov 2: Warriors and Paladins call their defense Block with a shield in hand and Parry without one
function defWord(c) { if (!c) return null; const cls = CLASSES[c.cls]; if (!cls) return null; if (c.cls !== 'Warrior' && c.cls !== 'Paladin') return cls.defense;
  const o = (c.gear || []).find(g => g && g.slot === 'Off-hand'); return o && /Shield|Pavise|Buckler/.test((o.arch || '') + ' ' + (o.label || '') + ' ' + (o.name || '')) ? 'Block' : 'Parry'; }
function defText(c, cls, text) { const w = defWord(c); if (!w || !text || (cls !== 'Warrior' && cls !== 'Paladin') || c.cls !== cls) return text;
  const lo = w.toLowerCase(), ed = w === 'Block' ? 'Blocked' : 'Parried';
  return text.replace(/\b(Block|Parry)\b/g, w).replace(/\b(block|parry)\b/g, lo).replace(/\b(Blocked|Parried)\b/g, ed).replace(/\b(blocked|parried)\b/g, ed.toLowerCase()); }
function titleOf(c, p) { const a = c && c.title && ACH_BY[c.title]; return a && (!p || (p.ach || {})[a.id]) ? a.title : ''; }
function setTitle(p, key, id) { const c = char(p, key); if (!c) return false; if (id && !(p.ach || {})[id]) return false; c.title = id || null; return true; }
// one-handed weapons go in either hand (dual wielding); starter weapons predate the 'hands' field, so they are listed by name
const STARTER_1H = ['Arming Sword', 'Dirk', 'Ashwood Wand', 'Flanged Mace'];
const isOneHand = (item) => (item.slot === 'Weapon' || item.slot === 'Off-hand') && (/^1H/.test(item.hands || '') || STARTER_1H.includes(item.name));
function slotOptions(item) { if (item.slot === 'Ring' || /^Ring/.test(item.slot)) return ['Ring 1', 'Ring 2']; if (isOneHand(item)) return ['Weapon', 'Off-hand']; return [item.slot]; }
// Nov 1: a hero with a wager on the Arena board (posted or offered) has its gear and deck locked until the wager is settled
let OUT_CHECK = () => false; // set by the page: true while the hero is out on a run (its gear is a copy that comes home when the run ends)
function setOutCheck(f) { OUT_CHECK = f; }
function arenaLock(p, cls) { if (OUT_CHECK(cls)) return 'You\'re out on a run: gear and deck changes wait until you\'re back in town.'; return p.arena && p.arena.hero === cls ? 'Locked: this hero has a wager at the Arena. Settle or withdraw it first.' : null; }
// Nov 2: hardcore heroes have their own stash, gold, Ink and Reroll Tokens. p.stash, p.gold and p.ink are always the ones of the hero you're playing
// (p.stashMode says which); the other set waits in p.stashOther, p.goldOther and p.inkOther. useStash() swaps them when you switch
// between a normal and a hardcore hero.
const stashMode = (c) => c && c.hardcore ? 'hc' : 'normal';
function useStash(p, key) {
  if (!p) return; p.stashMode = p.stashMode || 'normal'; p.stashOther = p.stashOther || []; p.stash = p.stash || [];
  const want = stashMode(p.chars[key]); if (!p.chars[key] || p.stashMode === want) return;
  const t = p.stash; p.stash = p.stashOther; p.stashOther = t; p.stashMode = want;
  const v = p.vault || []; p.vault = p.vaultOther || []; p.vaultOther = v;
  const g = p.gold || 0; p.gold = p.goldOther || 0; p.goldOther = g; const k = p.ink || 0; p.ink = p.inkOther || 0; p.inkOther = k; const r = p.rerollTokens || 0; p.rerollTokens = p.tokensOther || 0; p.tokensOther = r;
}
// Nov 2: the Bank. A vault of VAULT_MAX slots next to the stash, for gear you keep but don't need at hand (hardcore heroes have their own).
const VAULT_MAX = 120;
function toVault(p, itemId) { p.vault = p.vault || []; const i = p.stash.findIndex(x => x.id === itemId); if (i < 0) return { ok: false, why: 'Not in your stash.' }; if (p.vault.length >= VAULT_MAX) return { ok: false, why: `Your vault is full (${VAULT_MAX}).` }; p.vault.unshift(p.stash.splice(i, 1)[0]); return { ok: true }; }
function fromVault(p, itemId) { p.vault = p.vault || []; const i = p.vault.findIndex(x => x.id === itemId); if (i < 0) return { ok: false, why: 'Not in your vault.' }; if (p.stash.length >= STASH_MAX) return { ok: false, why: 'Your stash is full.' }; p.stash.unshift(p.vault.splice(i, 1)[0]); return { ok: true }; }
function stashFor(p, c) { p.stashMode = p.stashMode || 'normal'; p.stashOther = p.stashOther || []; return stashMode(c) === p.stashMode ? p.stash : p.stashOther; }
function equip(p, cls, itemId, slotWanted) {
  useStash(p, cls);
  { const lk = arenaLock(p, cls); if (lk) return { ok: false, why: lk }; }
  const c = char(p, cls), i = p.stash.findIndex(x => x.id === itemId); if (i < 0) return { ok: false, why: 'Not in stash' };
  if ((c.cls === 'Warrior' || c.cls === 'Paladin') && /Staff/.test(p.stash[i].arch || p.stash[i].label || '')) return { ok: false, why: `${c.cls}s can't use staffs.` }; // Nov 2
  if (p.stash[i].slot === 'Codex' && p.stash[i].cls && p.stash[i].cls !== c.cls) return { ok: false, why: `Only a ${p.stash[i].cls} can use the ${p.stash[i].name}.` };
  const item = p.stash[i], opts = slotOptions(item);
  let slot = slotWanted && opts.includes(slotWanted) ? slotWanted : opts[0];
  if (opts.length > 1 && !slotWanted && opts[0] !== 'Weapon') { const free = opts.find(s => !c.gear.find(g => g.slot === s)); if (free) slot = free; else { const a = c.gear.find(g => g.slot === opts[0]), b = c.gear.find(g => g.slot === opts[1]); slot = (a.ilvl || 0) <= (b.ilvl || 0) ? opts[0] : opts[1]; } }
  // Nov 2: Barrier Savant's 'Staff and Shield' talent lets a staff share the hands with a shield
  const ss = staffShield(c), isStaff = (it) => /Staff/.test((it && (it.arch || it.label)) || ''), isShield = (it) => /Shield/.test((it && (it.arch || it.label)) || '') || ['Kite Shield', 'Pavise'].includes(it && it.name);
  const twoH = item.hands && item.hands.startsWith('2H') && !(ss && isStaff(item) && isShield(c.gear.find(g => g.slot === 'Off-hand')));
  const mainIs2H = () => { const w = c.gear.find(g => g.slot === 'Weapon'); return w && w.hands && w.hands.startsWith('2H') && !(ss && isStaff(w) && isShield(item)); };
  const off = c.gear.filter(g => g.slot === slot || (twoH && g.slot === 'Off-hand') || (slot === 'Off-hand' && g.slot === 'Weapon' && mainIs2H()));
  if (p.stash.length - 1 + off.length > STASH_MAX) return { ok: false, why: 'Stash is full' };
  p.stash.splice(i, 1);
  c.gear = c.gear.filter(g => !off.includes(g));
  for (const o of off) p.stash.unshift(Object.assign({}, o, { slot: /^Ring/.test(o.slot) ? 'Ring' : o.slot }));
  c.gear.push(Object.assign({}, item, { slot }));
  return { ok: true, removed: off };
}
function unequip(p, cls, slot) {
  useStash(p, cls);
  if (arenaLock(p, cls)) return false;
  const c = char(p, cls), it = c.gear.find(g => g.slot === slot); if (!it) return false;
  if (p.stash.length >= STASH_MAX) return false;
  c.gear = c.gear.filter(g => g !== it); p.stash.unshift(Object.assign({}, it, { slot: /^Ring/.test(slot) ? 'Ring' : slot }));
  return true;
}
const SALVAGE = { White: 2, Green: 6, Blue: 15, 'Purple (Epic)': 40 };
function salvageValue(it) { return Math.round((SALVAGE[it.rarity] || 2) * Math.pow(1.05, it.level || 0)); } // Nov 2: +5% per map level (was 1.5x), like monster gold
function salvage(p, itemId) { const i = p.stash.findIndex(x => x.id === itemId); if (i < 0) return 0; const g = salvageValue(p.stash[i]); p.stash.splice(i, 1); p.gold += g; return g; }

// ---------- deck and cards
function deckCheck(deck) {
  const n = { White: 0, Green: 0, Blue: 0, Gold: 0 }; for (const c of deck) n[CARDS[c.key].rarity]++;
  const problems = [];
  if (deck.length < DECK_MIN) problems.push(`needs at least ${DECK_MIN} cards`);
  if (deck.length > DECK_MAX) problems.push(`at most ${DECK_MAX} cards`);
  for (const [r, cap] of Object.entries(DECK_CAPS)) if (n[r] > cap) problems.push(`at most ${cap} ${r}`);
  return { ok: !problems.length, problems, counts: n };
}
function canAdd(c, cardId) {
  const card = c.cards.find(x => x.id === cardId); if (!card) return { ok: false, why: 'Not in collection' };
  if (c.deck.length >= DECK_MAX) return { ok: false, why: `Deck is full (${DECK_MAX})` };
  const r = CARDS[card.key].rarity, cap = DECK_CAPS[r];
  if (cap != null && c.deck.filter(x => CARDS[x.key].rarity === r).length >= cap) return { ok: false, why: `Deck already has ${cap} ${r}` };
  return { ok: true };
}
function addToDeck(p, cls, cardId) { { const lk = arenaLock(p, cls); if (lk) return { ok: false, why: lk }; } const c = char(p, cls), k = canAdd(c, cardId); if (!k.ok) return k; const i = c.cards.findIndex(x => x.id === cardId); c.deck.push(c.cards.splice(i, 1)[0]); return { ok: true }; }
function removeFromDeck(p, cls, cardId) {
  { const lk = arenaLock(p, cls); if (lk) return { ok: false, why: lk }; }
  const c = char(p, cls); if (c.deck.length <= DECK_MIN) return { ok: false, why: `Deck needs at least ${DECK_MIN} cards` };
  const i = c.deck.findIndex(x => x.id === cardId); if (i < 0) return { ok: false, why: 'Not in deck' };
  c.cards.push(c.deck.splice(i, 1)[0]); return { ok: true };
}
function findCard(c, id) { return c.deck.find(x => x.id === id) || c.cards.find(x => x.id === id); }
function feedXp(target, fodder) { return (CARD_XP[CARDS[fodder.key].rarity] || 1) * (fodder.key === target.key ? 2 : 1) * (1 + (fodder.rank || 0)); }
const RANK_XP_MULT = 2; // Nov 1: ranking cards takes twice the XP (gold cost unchanged)
function rankCost(card) { const n = (card.rank || 0) + 1, b = RANK_BASE[CARDS[card.key].rarity]; return { xp: n * b * RANK_XP_MULT, gold: n * b * 5 }; }
// Feed collection cards (never deck cards) into a target. XP banks on the card; each rank-up also costs gold, paid automatically while you can afford it.
function feed(p, cls, targetId, fodderIds) {
  useStash(p, cls);
  { const lk = arenaLock(p, cls); if (lk && char(p, cls).deck.some(x => x.id === targetId)) return { ok: false, why: lk }; }
  const c = char(p, cls), t = findCard(c, targetId); if (!t) return { ok: false, why: 'No such card' };
  if ((t.rank || 0) >= MAX_RANK) return { ok: false, why: `Already +${MAX_RANK}` };
  let gained = 0;
  for (const id of fodderIds) { if (id === targetId) continue; const i = c.cards.findIndex(x => x.id === id); if (i < 0) continue; gained += feedXp(t, c.cards[i]); c.cards.splice(i, 1); }
  t.xp = (t.xp || 0) + gained;
  const ups = rankUp(p, t);
  return { ok: true, gained, ups };
}
function rankUp(p, t) {
  let ups = 0;
  while ((t.rank || 0) < MAX_RANK) { const k = rankCost(t); if ((t.xp || 0) < k.xp || p.gold < k.gold) break; t.xp = (t.xp || 0) - k.xp; p.gold -= k.gold; t.rank = (t.rank || 0) + 1; ups++; }
  return ups;
}

// ---------- Merchant Dace in town: new wares every 12 hours (real time), rolled at your last map level; paid from the bank, delivered to the stash
const SHOP_RESTOCK_MS = 12 * 60 * 60 * 1000;
function shopDue(p, now) { return !p.shop || !p.shop.at || (now || Date.now()) - p.shop.at >= SHOP_RESTOCK_MS; }
const SHOP_PRICE = { White: 20, Green: 50, Blue: 120 };
function shopPrice(rar, level) { return Math.round(SHOP_PRICE[rar] * Math.pow(1.5, level) * 2); } // Nov 2: merchant prices doubled
// Nov 1: stock comes from the map and level of the last boss you killed (not the last map you entered), so you can't stock up from a map you can't beat
function shopBasis(p) { const lb = p.lastBoss; return lb && lb.map ? { map: lb.map, level: lb.level || 0 } : { map: 'physical', level: 0 }; }
function refreshShop(p, data, level, rng, now) {
  const sb = shopBasis(p); level = sb.level;
  rng = rng || Math.random; const mk = sb.map; let bases = data.gear.bases.filter(b => (b.map || 'physical') === mk).map(b => b.name); if (!bases.length) bases = data.gear.bases.map(b => b.name); p.shop = { level, map: mk, items: [], at: now || Date.now() };
  for (let i = 0; i < 6; i++) { const x = rng() * 100, rar = x < 35 ? 'White' : x < 78 ? 'Green' : 'Blue'; const it = CB.rollItem(data, rng, bases[Math.floor(rng() * bases.length)], rar, level); it.price = shopPrice(rar, level); it.px2 = 1; p.shop.items.push(it); }
}
function buyShop(p, i) {
  const it = p.shop && p.shop.items[i]; if (!it || it.sold) return { ok: false, why: 'Already sold' };
  if (p.gold < it.price) return { ok: false, why: 'Not enough gold in the bank' };
  if (p.stash.length >= STASH_MAX) return { ok: false, why: 'Stash is full' };
  p.gold -= it.price; it.sold = true;
  const o = Object.assign({ id: uid('g') }, it, { slot: /^Ring/.test(it.slot) ? 'Ring' : it.slot }); delete o.price; delete o.sold; p.stash.unshift(o);
  return { ok: true };
}

// ---------- Ink (Nov 1): break spare cards down at the Scribe and buy any card of your class: full price for cards you have owned before, 3x for ones you haven't found yet
const INK_GET = { White: 1, Green: 4, Blue: 10, Gold: 25 }, INK_COST = { White: 10, Green: 40, Blue: 100, Gold: 300 };
function inkValue(card) { return Math.round((INK_GET[CARDS[card.key].rarity] || 1) * (1 + (card.rank || 0) * 0.5)); } // ranked cards give back half their base per rank
const INK_UNSEEN = 3; // a card you have never owned costs 3x
function inkCost(key, c) { return (INK_COST[CARDS[key].rarity] || 10) * (c && !(c.seen || {})[key] ? INK_UNSEEN : 1); }
function breakCard(p, key, cardId) {
  useStash(p, key);
  const c = char(p, key); const i = c ? c.cards.findIndex(x => x.id === cardId) : -1; if (i < 0) return { ok: false, why: 'Only cards in your collection can be broken down (take it out of the deck first).' };
  const g = inkValue(c.cards[i]); c.cards.splice(i, 1); p.ink = (p.ink || 0) + g; return { ok: true, ink: g };
}
// ---------- Rerolls (Nov 1): break a codex down into Reroll Tokens; spend a token and a point of an item's reroll potential to reroll one affix
function findItem(p, id) { const i = p.stash.findIndex(x => x.id === id); if (i >= 0) return { it: p.stash[i], where: 'stash' }; for (const c of Object.values(p.chars)) { const g = c.gear.find(x => x.id === id); if (g) return { it: g, where: c }; } return null; }
function breakCodex(p, itemId) {
  const i = p.stash.findIndex(x => x.id === itemId); if (i < 0 || p.stash[i].slot !== 'Codex') return { ok: false, why: 'Only codexes in the stash can be broken down (unequip it first).' };
  const n = Math.random() < CB.CODEX_TOKEN_CHANCE(p.stash[i]) ? 1 : 0; p.stash.splice(i, 1); p.rerollTokens = (p.rerollTokens || 0) + n; return { ok: true, tokens: n };
}
function rerollItem(p, itemId, idx, data, rng) {
  const f = findItem(p, itemId); if (!f) return { ok: false, why: 'Item not found.' }; const it = f.it;
  if (it.slot === 'Codex') return { ok: false, why: 'Codexes cannot be rerolled.' };
  if (f.where !== 'stash' && p.arena && p.chars[p.arena.hero] === f.where) return { ok: false, why: arenaLock(p, p.arena.hero) };
  if (!(it.rerolls > 0)) return { ok: false, why: 'This item has no rerolls left.' };
  if (!((p.rerollTokens || 0) > 0)) return { ok: false, why: 'You need a Reroll Token (break down a codex).' };
  const r = CB.rerollAffix(data, rng || CB.makeRng((Date.now() % 2147483646) + 1), it, idx); if (!r) return { ok: false, why: 'That line cannot be rerolled.' };
  it.rerolls--; p.rerollTokens--; return { ok: true, old: r.old, now: r.now, item: it };
}
function craftCard(p, key, cardKey) {
  useStash(p, key);
  const c = char(p, key), d = CARDS[cardKey]; if (!c || !d) return { ok: false, why: 'No such card' };
  if (d.cls !== c.cls) return { ok: false, why: `Only a ${d.cls} can use that card.` };
  const cost = inkCost(cardKey, c); if ((p.ink || 0) < cost) return { ok: false, why: `Needs ${cost} Ink (you have ${p.ink || 0}).` };
  p.ink -= cost; c.cards.push({ id: uid('k'), key: cardKey, rank: 0 }); (c.seen = c.seen || {})[cardKey] = 1; return { ok: true, cost };
}
// Hall of Records (Nov 1): per map, the highest level reached and the furthest row at that level (15 = the boss is dead)
function noteMapBest(c, mk, lvl, row) { const R = ((c.mapRows = c.mapRows || {})[mk] = c.mapRows[mk] || {}); R[lvl] = Math.max(R[lvl] || 0, row); c.mapBest = c.mapBest || {}; const b = c.mapBest[mk]; if (!b || lvl > b.lvl || (lvl === b.lvl && row > b.row)) c.mapBest[mk] = { lvl, row, at: Date.now() }; }
// progress score for the leaderboard: every map counts its best level x 15 + furthest row (so +1 row 1 beats +0 boss)
// Nov 1: progress counts maps you COMPLETED: 15 points per level of a map you've beaten (+0 counts), plus the furthest row on the next level up.
// Entering a high level without clearing the ones below gives nothing until you beat it.
function mapCleared(c, mk) { return c && c.sKills && c.sKills[mk] != null ? c.sKills[mk] : -1; } // this season's highest clear (Nov 2)
function progressScore(c) { let s = 0; const keys = new Set([...Object.keys(c.mapBest || {}), ...Object.keys(c.mapKills || {})]);
  for (const mk of keys) { const cl = mapCleared(c, mk), b = (c.mapBest || {})[mk], nr = ((c.mapRows || {})[mk] || {})[cl + 1] || (b && b.lvl === cl + 1 ? b.row : 0); s += (cl + 1) * 15 + Math.min(14, nr || 0); } return s; }
function beatMap(c, mk) { return !!(c && c.mapKills && c.mapKills[mk] != null); }

// ---------- runs
// ---------- codex talents (Nov 1): XP and picks per hero per codex; only the worn codex's talents are active
function wornCodex(c) { const it = (c.gear || []).find(g => g && g.slot === 'Codex'); return it && it.codex && CB.CODEX_BY_KEY[it.codex] ? it.codex : null; }
function staffShield(c) { if (wornCodex(c) !== 'barrier_savant') return false; const st = (c.codexes || {}).barrier_savant; return !!(st && st.picks && st.picks[0] === 1); }
function codexState(c, key) { c.codexes = c.codexes || {}; return c.codexes[key] || (c.codexes[key] = { xp: 0, picks: [] }); }
function codexInfo(c, key) { const st = (c.codexes || {})[key] || { xp: 0, picks: [] }; return Object.assign({ key, xp: st.xp || 0, picks: st.picks || [] }, CB.codexLevel(st.xp)); }
function maxedCodexes(c) { return Object.values(c.codexes || {}).filter(st => CB.codexLevel(st.xp).level >= CB.CODEX_MAX).length; }
// pick talent column j (0 offense, 1 defense, 2 support, null = clear) on row i; rows open every 2 codex levels
function pickTalent(p, key, cx, row, col) { const c = char(p, key); if (!c || !CB.TALENTS[cx]) return false; const info = codexInfo(c, cx); if (row >= info.rows) return false; const st = codexState(c, cx); st.picks[row] = col == null ? null : col; return true; }
function resetTalents(p, key, cx) { const c = char(p, key); if (!c) return; codexState(c, cx).picks = []; }
function talentSpec(c) { const cx = wornCodex(c); if (!cx) return undefined; const info = codexInfo(c, cx); return { codex: cx, picks: info.picks.slice(0, info.rows) }; }
function partyOpts(p, classes) {
  useStash(p, classes[0]); // a party is all hardcore or all normal heroes: the leader's wallet pays
  return { sharedBank: true, members: classes.map((key, i) => { const c = char(p, key); return { key, cls: c.cls, name: c.name || c.cls, bank: i === 0 ? p.gold : 0, stashFree: Math.max(0, STASH_MAX - stashFor(p, c).length), gear: c.gear.map(g => Object.assign({}, g)), deck: c.deck.map(x => ({ key: x.key, rank: x.rank || 0 })), talents: talentSpec(c) }; }) };
}
function runOpts(p, key) { useStash(p, key); const c = char(p, key); return { key, cls: c.cls, members: undefined, name: c.name, bank: p.gold, stashFree: Math.max(0, STASH_MAX - stashFor(p, c).length), gear: c.gear.map(g => Object.assign({}, g)), deck: c.deck.map(x => ({ key: x.key, rank: x.rank || 0 })), talents: talentSpec(c) }; }
// Bring a finished run home: equipped gear (incl. merchant buys) stays on the character; kept loot goes to stash/collection.
function absorbRun(p, run, mi) {
  if (mi == null && run.members && run.members.length > 1) { const res = run.members.map((m, i) => absorbRun(p, run, i)); return res[0]; }
  const mem = run.members ? run.members[mi || 0] : run;
  const c = char(p, mem.key || mem.cls); if (!c) return { items: 0, cards: 0, gold: 0, lost: 0, ordered: 0 };
  useStash(p, mem.key || mem.cls); // this hero's stash, gold and Ink (hardcore heroes have their own)
  c.gear = mem.gear.map(g => Object.assign({ id: g.id || uid('g') }, g));
  const kept = mem.kept || { items: [], gold: 0 };
  let lost = 0, items = 0, cards = 0, ordered = 0;
  p.gold = Math.max(0, p.gold - (mem.spent || 0));
  const ST = stashFor(p, c); // this hero's stash (hardcore heroes have their own)
  for (const o of mem.orders || []) { if (ST.length < STASH_MAX) { ST.unshift(Object.assign({ id: uid('g') }, o, { slot: /^Ring/.test(o.slot) ? 'Ring' : o.slot })); ordered++; } }
  let salvaged = 0, salvGold = 0, salvInk = 0;
  for (const it of kept.items) {
    if (it.autoSalvage) { salvaged++; if (it.kind === 'card') { const v = inkValue(it); p.ink = (p.ink || 0) + v; salvInk += v; (c.seen = c.seen || {})[it.key] = 1; } else { const v = salvageValue(it); p.gold += v; salvGold += v; } continue; } // marked in the sack during the run
    if (it.kind === 'card') { c.cards.push({ id: uid('k'), key: it.key, rank: 0 }); (c.seen = c.seen || {})[it.key] = 1; cards++; }
    else if (ST.length < STASH_MAX) { ST.unshift(Object.assign({ id: uid('g') }, it, { slot: /^Ring/.test(it.slot) ? 'Ring' : it.slot })); items++; }
    else lost++;
  }
  p.gold += kept.gold;
  // codex XP from this run's kills; +10% for every codex this hero has maxed
  const xpGain = {}; { const bonus = 1 + 0.1 * maxedCodexes(c); for (const [cx, v] of Object.entries(mem.cxp || {})) { if (!CB.CODEX_BY_KEY[cx]) continue; const st = codexState(c, cx), before = CB.codexLevel(st.xp).level, g = Math.round(v * bonus); st.xp += g; xpGain[cx] = { xp: g, from: before, to: CB.codexLevel(st.xp).level }; } }
  c.runs++; const row = run.currentRow(); c.best = Math.max(c.best, row);
  noteMapBest(c, run.mapKey || 'physical', run.level || 0, run.over === 'victory' ? 15 : row); // Hall of Records: furthest level and row per map
  if (run.over === 'victory') { const mk0 = run.mapKey || 'physical', had = mapCleared(c, mk0); if ((run.level || 0) > had) (c.mapKillAt = c.mapKillAt || {})[mk0] = Date.now(); }
  if (run.over === 'victory') p.lastBoss = { map: run.mapKey || 'physical', level: run.level || 0, at: Date.now() }; // the town merchant stocks gear from your last boss kill
  if (run.over === 'victory') { const bk = (c.bossKillsBy = c.bossKillsBy || {}); bk[run.mapKey || 'physical'] = (bk[run.mapKey || 'physical'] || 0) + 1; } // Nov 1: boss kills per map (Hall of Records)
  if (run.over === 'victory') { c.bossKills++; c.mapKills = c.mapKills || {}; const mk = run.mapKey || 'physical'; c.mapKills[mk] = Math.max(c.mapKills[mk] == null ? -1 : c.mapKills[mk], run.level || 0); c.sKills = c.sKills || {}; c.sKills[mk] = Math.max(mapCleared(c, mk), run.level || 0); }
  // the run's damage meter, kept so the Chronicler can show it later (numbers rounded to keep saves small)
  const meter = Object.values(run.meter || {}).map(m => { const r = (o) => Object.fromEntries(Object.entries(o || {}).filter(x => x[1] > 0).map(([k, v]) => [k, Math.round(v)])); return { id: m.id, name: m.name, isPlayer: m.isPlayer, cls: m.cls, dealt: r(m.dealt), healed: r(m.healed), taken: r(m.taken), absorbed: Math.round(m.absorbed || 0) }; });
  p.history.unshift({ meter: meter.length ? meter : undefined, map: run.mapKey, fights: run.fightsWon, cls: mem.cls, name: mem.name, party: run.members && run.members.length > 1 ? run.members.map(m => m.cls) : undefined, level: run.level, result: run.over, row, items, cards, gold: kept.gold, ordered, at: Date.now() });
  p.history = p.history.slice(0, 20);
  p.last = Object.assign(p.last || {}, { level: run.level });
  // Nov 2: achievement counters and checks for this hero's run
  bump(p, 'goldLooted', kept.gold || 0); if (run.over === 'extracted') bump(p, 'extracts'); if (run.over === 'dead') bump(p, 'deaths'); else if (mem.deaths) bump(p, 'deaths', mem.deaths);
  const F = mem.feat || {}, ach = achCheck(p, { type: 'run', victory: run.over === 'victory', level: run.level || 0, map: run.mapKey || 'physical', cls: c.cls, hc: !!c.hardcore, hero: c.name,
    party: run.members ? run.members.length : 1, lost: F.lost, bossClean: F.bossClean, bossLost: F.bossLost });
  return { items, cards, gold: kept.gold, lost, ordered, xpGain, salvaged, salvGold, salvInk, ach };
}

const API = { defWord, defText, titleAfter, titled, staffShield, VAULT_MAX, toVault, fromVault, ACH, ACH_BY, achCheck, achTake, bump, titleOf, setTitle, useStash, stashFor, SEASON, SEASONS, gearProfile, gearValue, itemPower, upgradeDelta, STATW, shopBasis, mapCleared, setOutCheck, arenaLock, findItem, breakCodex, rerollItem, noteMapBest, progressScore, INK_UNSEEN, INK_GET, INK_COST, inkValue, inkCost, breakCard, craftCard, beatMap, wornCodex, codexInfo, codexState, maxedCodexes, pickTalent, resetTalents, talentSpec, SLOTS, STASH_MAX, MAX_HEROES, clsOf, newProfile, fix, char, createChar, deleteChar, renameChar, nameProblem, gearScore, powerLevel, slotOptions, equip, unequip, salvage, salvageValue, deckCheck, refreshShop, shopDue, SHOP_RESTOCK_MS, buyShop, shopPrice, canAdd, addToDeck, removeFromDeck, feed, feedXp, rankCost, rankUp, runOpts, partyOpts, absorbRun };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CBHub = API;
})(typeof window !== 'undefined' ? window : globalThis);
