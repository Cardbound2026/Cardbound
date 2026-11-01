// Cardbound hub layer: the saved profile (characters, shared stash, gold), equipping, deck building and card upgrades. No DOM.
(function (root) {
'use strict';
const CB = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.CB;
const { CARDS, CLASSES, STARTER_GEAR, CARD_XP, RANK_BASE, DECK_CAPS, DECK_MIN, DECK_MAX, MAX_RANK, deckLevel } = CB;
const SLOTS = ['Weapon', 'Off-hand', 'Helm', 'Amulet', 'Cloak', 'Chest', 'Bracers', 'Gloves', 'Belt', 'Pants', 'Boots', 'Ring 1', 'Ring 2'];
const STASH_MAX = 60;
const VERSION = 1;

let uidN = 0;
const uid = (p) => p + Date.now().toString(36) + (uidN++).toString(36) + Math.floor(Math.random() * 1e6).toString(36);

function newChar(cls, name, deckKey, amuletKey) {
  const deck = [], sd = (CB.STARTER_DECKS[cls] || []).find(x => x[0] === deckKey), list = (sd && sd[3]) || CLASSES[cls].deck;
  for (const [key, n] of list) for (let i = 0; i < n; i++) deck.push({ id: uid('k'), key, rank: 0 });
  const gear = STARTER_GEAR[cls].map(g => Object.assign({ id: uid('g') }, g));
  if (amuletKey) { const i = gear.findIndex(g => g.slot === 'Amulet'); if (i >= 0) gear[i] = Object.assign({ id: uid('g') }, CB.starterAmulet(cls, amuletKey)); }
  return { cls, name: name || cls, created: Date.now(), gear, deck, cards: [], runs: 0, best: 0, bossKills: 0, gotOffense1: true, starter: (sd && sd[0]) || 'balanced' };
}
function newProfile() { return { v: VERSION, gold: 0, stash: [], chars: {}, last: { cls: 'Warrior', level: 0 }, history: [] }; }
function fix(p) { // tolerate older or partial saves
  p = Object.assign(newProfile(), p || {});
  for (const [k, c] of Object.entries(p.chars)) { if (!c.cls && CLASSES[k]) c.cls = k; c.cards = c.cards || []; c.deck = c.deck || []; c.gear = c.gear || []; c.name = c.name || c.cls; }
  if (p.last && p.last.cls && !p.chars[p.last.cls]) p.last.cls = Object.keys(p.chars)[0] || '';
  // retired cards (Oct 31: Battle Trance) turn into their replacement, keeping rank and XP
  for (const c of Object.values(p.chars)) for (const k of [...c.deck, ...c.cards]) if (CB.REMOVED_CARDS[k.key]) k.key = CB.REMOVED_CARDS[k.key];
  // Oct 30: the Paladin starter got more offense (+1 Crusader Strike, +1 Smite); existing Paladins get those two cards in their collection once
  for (const pal of Object.values(p.chars).filter(c => c.cls === 'Paladin')) if (!pal.gotOffense1) { pal.gotOffense1 = true; pal.cards.push({ id: uid('k'), key: 'crusader_strike', rank: 0 }, { id: uid('k'), key: 'smite', rank: 0 }); }
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
function createChar(p, cls, name, deckKey, amuletKey) {
  if (!CLASSES[cls]) return { ok: false, why: 'Pick a class.' };
  if (Object.keys(p.chars).length >= MAX_HEROES) return { ok: false, why: `You already have ${MAX_HEROES} heroes. Delete one to make room.` };
  const why = nameProblem(name); if (why) return { ok: false, why };
  const id = uid('h'); p.chars[id] = newChar(cls, name.trim().replace(/\s+/g, ' '), deckKey, amuletKey); p.last.cls = id; return { ok: true, id };
}
function renameChar(p, cls, name) { const c = p.chars[cls]; if (!c) return { ok: false, why: 'No such hero.' }; const why = nameProblem(name); if (why) return { ok: false, why }; c.name = name.trim().replace(/\s+/g, ' '); return { ok: true }; }
function char(p, key) { return p.chars[key]; }
const clsOf = (p, key) => (p.chars[key] && p.chars[key].cls) || (CLASSES[key] ? key : 'Warrior');

// ---------- gear
function gearScore(c) { return Math.round(SLOTS.reduce((s, sl) => { const it = c.gear.find(g => g.slot === sl); return s + (it ? it.ilvl || 0 : 0); }, 0) / SLOTS.length); }
function powerLevel(c) { return Math.round((gearScore(c) + deckLevel(c.deck)) / 2); }
// one-handed weapons go in either hand (dual wielding); starter weapons predate the 'hands' field, so they are listed by name
const STARTER_1H = ['Arming Sword', 'Dirk', 'Ashwood Wand', 'Flanged Mace'];
const isOneHand = (item) => (item.slot === 'Weapon' || item.slot === 'Off-hand') && (/^1H/.test(item.hands || '') || STARTER_1H.includes(item.name));
function slotOptions(item) { if (item.slot === 'Ring' || /^Ring/.test(item.slot)) return ['Ring 1', 'Ring 2']; if (isOneHand(item)) return ['Weapon', 'Off-hand']; return [item.slot]; }
function equip(p, cls, itemId, slotWanted) {
  const c = char(p, cls), i = p.stash.findIndex(x => x.id === itemId); if (i < 0) return { ok: false, why: 'Not in stash' };
  if (p.stash[i].slot === 'Codex' && p.stash[i].cls && p.stash[i].cls !== c.cls) return { ok: false, why: `Only a ${p.stash[i].cls} can use the ${p.stash[i].name}.` };
  const item = p.stash[i], opts = slotOptions(item);
  let slot = slotWanted && opts.includes(slotWanted) ? slotWanted : opts[0];
  if (opts.length > 1 && !slotWanted && opts[0] !== 'Weapon') { const free = opts.find(s => !c.gear.find(g => g.slot === s)); if (free) slot = free; else { const a = c.gear.find(g => g.slot === opts[0]), b = c.gear.find(g => g.slot === opts[1]); slot = (a.ilvl || 0) <= (b.ilvl || 0) ? opts[0] : opts[1]; } }
  const twoH = item.hands && item.hands.startsWith('2H');
  const mainIs2H = () => { const w = c.gear.find(g => g.slot === 'Weapon'); return w && w.hands && w.hands.startsWith('2H'); };
  const off = c.gear.filter(g => g.slot === slot || (twoH && g.slot === 'Off-hand') || (slot === 'Off-hand' && g.slot === 'Weapon' && mainIs2H()));
  if (p.stash.length - 1 + off.length > STASH_MAX) return { ok: false, why: 'Stash is full' };
  p.stash.splice(i, 1);
  c.gear = c.gear.filter(g => !off.includes(g));
  for (const o of off) p.stash.unshift(Object.assign({}, o, { slot: /^Ring/.test(o.slot) ? 'Ring' : o.slot }));
  c.gear.push(Object.assign({}, item, { slot }));
  return { ok: true, removed: off };
}
function unequip(p, cls, slot) {
  const c = char(p, cls), it = c.gear.find(g => g.slot === slot); if (!it) return false;
  if (p.stash.length >= STASH_MAX) return false;
  c.gear = c.gear.filter(g => g !== it); p.stash.unshift(Object.assign({}, it, { slot: /^Ring/.test(slot) ? 'Ring' : slot }));
  return true;
}
const SALVAGE = { White: 2, Green: 6, Blue: 15, 'Purple (Epic)': 40 };
function salvageValue(it) { return Math.round((SALVAGE[it.rarity] || 2) * Math.pow(1.5, it.level || 0)); }
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
function addToDeck(p, cls, cardId) { const c = char(p, cls), k = canAdd(c, cardId); if (!k.ok) return k; const i = c.cards.findIndex(x => x.id === cardId); c.deck.push(c.cards.splice(i, 1)[0]); return { ok: true }; }
function removeFromDeck(p, cls, cardId) {
  const c = char(p, cls); if (c.deck.length <= DECK_MIN) return { ok: false, why: `Deck needs at least ${DECK_MIN} cards` };
  const i = c.deck.findIndex(x => x.id === cardId); if (i < 0) return { ok: false, why: 'Not in deck' };
  c.cards.push(c.deck.splice(i, 1)[0]); return { ok: true };
}
function findCard(c, id) { return c.deck.find(x => x.id === id) || c.cards.find(x => x.id === id); }
function feedXp(target, fodder) { return (CARD_XP[CARDS[fodder.key].rarity] || 1) * (fodder.key === target.key ? 2 : 1) * (1 + (fodder.rank || 0)); }
function rankCost(card) { const n = (card.rank || 0) + 1, b = RANK_BASE[CARDS[card.key].rarity]; return { xp: n * b, gold: n * b * 5 }; }
// Feed collection cards (never deck cards) into a target. XP banks on the card; each rank-up also costs gold, paid automatically while you can afford it.
function feed(p, cls, targetId, fodderIds) {
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
function shopPrice(rar, level) { return Math.round(SHOP_PRICE[rar] * Math.pow(1.5, level)); }
function refreshShop(p, data, level, rng, now) {
  rng = rng || Math.random; const mk = (p.last && p.last.map) || 'physical'; let bases = data.gear.bases.filter(b => (b.map || 'physical') === mk).map(b => b.name); if (!bases.length) bases = data.gear.bases.map(b => b.name); p.shop = { level, items: [], at: now || Date.now() };
  for (let i = 0; i < 6; i++) { const x = rng() * 100, rar = x < 35 ? 'White' : x < 78 ? 'Green' : 'Blue'; const it = CB.rollItem(data, rng, bases[Math.floor(rng() * bases.length)], rar, level); it.price = shopPrice(rar, level); p.shop.items.push(it); }
}
function buyShop(p, i) {
  const it = p.shop && p.shop.items[i]; if (!it || it.sold) return { ok: false, why: 'Already sold' };
  if (p.gold < it.price) return { ok: false, why: 'Not enough gold in the bank' };
  if (p.stash.length >= STASH_MAX) return { ok: false, why: 'Stash is full' };
  p.gold -= it.price; it.sold = true;
  const o = Object.assign({ id: uid('g') }, it, { slot: /^Ring/.test(it.slot) ? 'Ring' : it.slot }); delete o.price; delete o.sold; p.stash.unshift(o);
  return { ok: true };
}

// ---------- runs
// ---------- codex talents (Nov 1): XP and picks per hero per codex; only the worn codex's talents are active
function wornCodex(c) { const it = (c.gear || []).find(g => g && g.slot === 'Codex'); return it && it.codex && CB.CODEX_BY_KEY[it.codex] ? it.codex : null; }
function codexState(c, key) { c.codexes = c.codexes || {}; return c.codexes[key] || (c.codexes[key] = { xp: 0, picks: [] }); }
function codexInfo(c, key) { const st = (c.codexes || {})[key] || { xp: 0, picks: [] }; return Object.assign({ key, xp: st.xp || 0, picks: st.picks || [] }, CB.codexLevel(st.xp)); }
function maxedCodexes(c) { return Object.values(c.codexes || {}).filter(st => CB.codexLevel(st.xp).level >= CB.CODEX_MAX).length; }
// pick talent column j (0 offense, 1 defense, 2 support, null = clear) on row i; rows open every 2 codex levels
function pickTalent(p, key, cx, row, col) { const c = char(p, key); if (!c || !CB.TALENTS[cx]) return false; const info = codexInfo(c, cx); if (row >= info.rows) return false; const st = codexState(c, cx); st.picks[row] = col == null ? null : col; return true; }
function resetTalents(p, key, cx) { const c = char(p, key); if (!c) return; codexState(c, cx).picks = []; }
function talentSpec(c) { const cx = wornCodex(c); if (!cx) return undefined; const info = codexInfo(c, cx); return { codex: cx, picks: info.picks.slice(0, info.rows) }; }
function partyOpts(p, classes) {
  const free = Math.max(0, STASH_MAX - p.stash.length);
  return { sharedBank: true, members: classes.map((key, i) => { const c = char(p, key); return { key, cls: c.cls, name: c.name || c.cls, bank: i === 0 ? p.gold : 0, stashFree: free, gear: c.gear.map(g => Object.assign({}, g)), deck: c.deck.map(x => ({ key: x.key, rank: x.rank || 0 })), talents: talentSpec(c) }; }) };
}
function runOpts(p, key) { const c = char(p, key); return { key, cls: c.cls, members: undefined, name: c.name, bank: p.gold, stashFree: Math.max(0, STASH_MAX - p.stash.length), gear: c.gear.map(g => Object.assign({}, g)), deck: c.deck.map(x => ({ key: x.key, rank: x.rank || 0 })), talents: talentSpec(c) }; }
// Bring a finished run home: equipped gear (incl. merchant buys) stays on the character; kept loot goes to stash/collection.
function absorbRun(p, run, mi) {
  if (mi == null && run.members && run.members.length > 1) { const res = run.members.map((m, i) => absorbRun(p, run, i)); return res[0]; }
  const mem = run.members ? run.members[mi || 0] : run;
  const c = char(p, mem.key || mem.cls); if (!c) return { items: 0, cards: 0, gold: 0, lost: 0, ordered: 0 };
  c.gear = mem.gear.map(g => Object.assign({ id: g.id || uid('g') }, g));
  const kept = mem.kept || { items: [], gold: 0 };
  let lost = 0, items = 0, cards = 0, ordered = 0;
  p.gold = Math.max(0, p.gold - (mem.spent || 0));
  for (const o of mem.orders || []) { if (p.stash.length < STASH_MAX) { p.stash.unshift(Object.assign({ id: uid('g') }, o, { slot: /^Ring/.test(o.slot) ? 'Ring' : o.slot })); ordered++; } }
  for (const it of kept.items) {
    if (it.kind === 'card') { c.cards.push({ id: uid('k'), key: it.key, rank: 0 }); cards++; }
    else if (p.stash.length < STASH_MAX) { p.stash.unshift(Object.assign({ id: uid('g') }, it, { slot: /^Ring/.test(it.slot) ? 'Ring' : it.slot })); items++; }
    else lost++;
  }
  p.gold += kept.gold;
  // codex XP from this run's kills; +10% for every codex this hero has maxed
  const xpGain = {}; { const bonus = 1 + 0.1 * maxedCodexes(c); for (const [cx, v] of Object.entries(mem.cxp || {})) { if (!CB.CODEX_BY_KEY[cx]) continue; const st = codexState(c, cx), before = CB.codexLevel(st.xp).level, g = Math.round(v * bonus); st.xp += g; xpGain[cx] = { xp: g, from: before, to: CB.codexLevel(st.xp).level }; } }
  c.runs++; const row = run.currentRow(); c.best = Math.max(c.best, row); if (run.over === 'victory') { c.bossKills++; c.mapKills = c.mapKills || {}; const mk = run.mapKey || 'physical'; c.mapKills[mk] = Math.max(c.mapKills[mk] == null ? -1 : c.mapKills[mk], run.level || 0); }
  // the run's damage meter, kept so the Chronicler can show it later (numbers rounded to keep saves small)
  const meter = Object.values(run.meter || {}).map(m => { const r = (o) => Object.fromEntries(Object.entries(o || {}).filter(x => x[1] > 0).map(([k, v]) => [k, Math.round(v)])); return { id: m.id, name: m.name, isPlayer: m.isPlayer, cls: m.cls, dealt: r(m.dealt), healed: r(m.healed), taken: r(m.taken), absorbed: Math.round(m.absorbed || 0) }; });
  p.history.unshift({ meter: meter.length ? meter : undefined, map: run.mapKey, fights: run.fightsWon, cls: mem.cls, name: mem.name, party: run.members && run.members.length > 1 ? run.members.map(m => m.cls) : undefined, level: run.level, result: run.over, row, items, cards, gold: kept.gold, ordered, at: Date.now() });
  p.history = p.history.slice(0, 20);
  p.last = Object.assign(p.last || {}, { level: run.level });
  return { items, cards, gold: kept.gold, lost, ordered, xpGain };
}

const API = { wornCodex, codexInfo, codexState, maxedCodexes, pickTalent, resetTalents, talentSpec, SLOTS, STASH_MAX, MAX_HEROES, clsOf, newProfile, fix, char, createChar, deleteChar, renameChar, nameProblem, gearScore, powerLevel, slotOptions, equip, unequip, salvage, salvageValue, deckCheck, refreshShop, shopDue, SHOP_RESTOCK_MS, buyShop, shopPrice, canAdd, addToDeck, removeFromDeck, feed, feedXp, rankCost, rankUp, runOpts, partyOpts, absorbRun };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CBHub = API;
})(typeof window !== 'undefined' ? window : globalThis);
