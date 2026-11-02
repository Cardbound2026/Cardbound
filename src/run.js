// Cardbound run layer: map generation, nodes, HP and mana carry, loot sack, rest/extract, shrines, merchant. No DOM.
(function (root) {
'use strict';
const CB = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.CB;
const { makeRng, shuffle, ri, rollItem, rollDrops, sumGear, STARTER_GEAR, presetGear, Combat, rollCards, rollNamedCards, KILL_XP } = CB;

const ROWS = 14, COLS = 5;
const MOB_HP_STEP = 0.3; // a party fights one monster per hero, each with +30% HP per extra hero (sims: about solo difficulty)
const TIER_ROWS = r => r <= 4 ? '1' : r <= 9 ? '2' : '3';
const SHRINES = [
  { key: 'crit', name: 'Shrine of the Keen Edge', text: '+10% Crit Chance for the next 2 fights.', buff: { crit: 10 } },
  { key: 'damage', name: 'Shrine of Fury', text: '+20% damage (Strength and Intelligence) for the next 2 fights.', buff: { damage: 20 } },
  { key: 'resist', name: 'Shrine of Warding', text: '+20% to all resistances for the next 2 fights.', buff: { resist: 20 } },
  { key: 'regen', name: 'Shrine of the Spring', text: '+10 mana regeneration for the next 2 fights.', buff: { regen: 10 } },
  { key: 'draw', name: 'Shrine of Insight', text: 'Draw 1 extra card each round for the next 2 fights.', buff: { draw: 1 } },
  { key: 'luck', name: 'Shrine of Fortune', text: '+50 Luck (better drops) for the next 2 fights.', buff: { luck: 50 } },
];
const SLOTS = ['Weapon', 'Off-hand', 'Helm', 'Shoulders', 'Amulet', 'Cloak', 'Chest', 'Bracers', 'Gloves', 'Belt', 'Pants', 'Boots', 'Ring 1', 'Ring 2'];

// map rules (Oct 31): every row has 3 to 5 nodes, at most 3 rows have only 3, at least 5 rows have exactly 4;
// 5 or 6 shrines; never more than 4 fights (incl. elites) in a row along any path; 10% of maps hide one Enraged elite
const MERCHANT_MIN_ROW = 5;
const MAP_RULES = { minRow: 3, maxThreeRows: 3, minFourRows: 5, maxEdgeCol: 11, minShrines: 5, maxShrines: 6, maxFightRun: 4, enragedChance: 0.1 };
function rowCounts(nodes) { const n = {}; for (let r = 1; r <= ROWS; r++) n[r] = 0; for (const x of Object.values(nodes)) if (x.row >= 1 && x.row <= ROWS) n[x.row]++; return n; }
function topologyOk(nodes) {
  const n = rowCounts(nodes), v = Object.values(n);
  if (v.some(k => k < MAP_RULES.minRow) || v.filter(k => k === 3).length > MAP_RULES.maxThreeRows || v.filter(k => k === 4).length < MAP_RULES.minFourRows) return false;
  const inCol = (c) => Object.values(nodes).filter(x => x.row >= 1 && x.row <= ROWS && x.col === c).length;
  if (inCol(0) > MAP_RULES.maxEdgeCol || inCol(COLS - 1) > MAP_RULES.maxEdgeCol) return false; // the far left and right columns: 11 nodes at most
  const all = Object.values(nodes).filter(x => x.row >= 1 && x.row <= ROWS);
  return all.every(x => (x.row === ROWS || x.next.length) && (x.row === 1 || all.some(p => p.row === x.row - 1 && p.next.includes(x.id))));
}
// add or remove single nodes until the row counts follow MAP_RULES (edges never cross)
function repairRows(rng, nodes) {
  const id = (r, c) => r + ':' + c, has = (r, c) => !!nodes[id(r, c)], edge = (a, b) => nodes[a] && nodes[a].next.includes(b);
  const tryAdd = (r) => {
    for (const c of shuffle([0, 1, 2, 3, 4].filter(c => !has(r, c)), rng)) {
      const ps = r === 1 ? [null] : shuffle([c - 1, c, c + 1].filter(p => p >= 0 && p < COLS && has(r - 1, p) && !(p !== c && edge(id(r - 1, c), id(r, p)))), rng);
      const qs = r === ROWS ? [null] : shuffle([c - 1, c, c + 1].filter(q => q >= 0 && q < COLS && has(r + 1, q) && !(q !== c && edge(id(r, q), id(r + 1, c)))), rng);
      if (!ps.length || !qs.length) continue;
      const n = nodes[id(r, c)] = { id: id(r, c), row: r, col: c, next: [] };
      if (ps[0] !== null) nodes[id(r - 1, ps[0])].next.push(n.id);
      if (qs[0] !== null) n.next.push(id(r + 1, qs[0]));
      return true;
    }
    return false;
  };
  const tryRemove = (r, only) => {
    for (const c of shuffle([0, 1, 2, 3, 4].filter(c => has(r, c) && (only == null || c === only)), rng)) {
      const n = nodes[id(r, c)], parents = Object.values(nodes).filter(p => p.next.includes(n.id));
      const kidsOk = n.next.every(k => Object.values(nodes).some(p => p !== n && p.next.includes(k)));
      if (parents.every(p => p.next.length >= 2) && kidsOk && (r !== 1 || rowCounts(nodes)[1] > MAP_RULES.minRow)) { for (const p of parents) p.next = p.next.filter(k => k !== n.id); delete nodes[n.id]; return true; }
    }
    return false;
  };
  for (let r = 1; r <= ROWS; r++) { let g = 0; while (rowCounts(nodes)[r] < MAP_RULES.minRow && g++ < 5 && tryAdd(r)); }
  for (let g = 0; g < 40; g++) {
    const n = rowCounts(nodes), rows = Object.keys(n).map(Number), three = rows.filter(r => n[r] === 3), four = rows.filter(r => n[r] === 4), five = rows.filter(r => n[r] === 5);
    if (three.length > MAP_RULES.maxThreeRows) { if (!shuffle(three, rng).some(r => tryAdd(r))) break; continue; }
    if (four.length < MAP_RULES.minFourRows) { if (shuffle(five, rng).some(r => tryRemove(r))) continue; if (shuffle(three, rng).some(r => tryAdd(r))) continue; break; }
    break;
  }
  // far left / far right columns: at most 11 nodes each (take nodes out of rows that can spare one)
  for (const c of [0, COLS - 1]) for (let g = 0; g < 20; g++) {
    const n = rowCounts(nodes), col = Object.values(nodes).filter(x => x.col === c && x.row >= 1 && x.row <= ROWS);
    if (col.length <= MAP_RULES.maxEdgeCol) break;
    const threes = Object.values(n).filter(k => k === 3).length, fours = Object.values(n).filter(k => k === 4).length;
    const rows = shuffle(col.map(x => x.row), rng).sort((a, b) => n[b] - n[a]).filter(r => n[r] === 5 || (n[r] === 4 && threes < MAP_RULES.maxThreeRows && fours > MAP_RULES.minFourRows));
    if (!rows.some(r => tryRemove(r, c))) break;
  }
}
// Nov 1: a boss always gives each hero a Green weapon and a Green chest piece of their class's kind, from this map's gear
const GIFT_ARCH = { Warrior: [['1H Sword', '1H Axe'], ['Cuirass']], Rogue: [['Dagger'], ['Jerkin']], Mage: [['Wand'], ['Robe']], Paladin: [['1H Mace'], ['Cuirass']], Warlock: [['Wand', 'Shadow Staff'], ['Robe']] };
function bossGift(data, rng, mapKey, cls, level) {
  const A = GIFT_ARCH[cls]; if (!A) return [];
  const out = [];
  for (const arches of A) {
    let bases = data.gear.bases.filter(b => (b.map || 'physical') === mapKey && arches.includes(b.arch)); if (!bases.length) bases = data.gear.bases.filter(b => arches.includes(b.arch)); if (!bases.length) continue;
    const it = rollItem(data, rng, bases[Math.floor(rng() * bases.length)].name, 'Green', level); if (it) { it.bossGift = true; out.push(it); }
  }
  return out;
}
function generateMap(rng, data, partySize, mapKey, bonus) {
  let last = null;
  for (let t = 0; t < 30; t++) { const nodes = mapTopology(rng); repairRows(rng, nodes); last = nodes; if (topologyOk(nodes)) break; }
  return finishMap(rng, data, partySize, mapKey, last, bonus);
}
function mapTopology(rng) {
  const nodes = {}, edges = new Set();
  const id = (r, c) => r + ':' + c;
  const starts = new Set();
  const walks = 6;
  for (let w = 0; w < walks; w++) {
    let c = w < 2 ? (w === 0 ? 1 : 3) : ri(rng, 0, COLS - 1);
    starts.add(c);
    for (let r = 1; r <= ROWS; r++) {
      nodes[id(r, c)] = nodes[id(r, c)] || { id: id(r, c), row: r, col: c, next: [] };
      if (r < ROWS) {
        let nc = c + ri(rng, -1, 1); nc = Math.max(0, Math.min(COLS - 1, nc));
        // avoid crossing an existing diagonal
        if (nc !== c && edges.has(id(r, nc) + '>' + id(r + 1, c))) nc = c;
        edges.add(id(r, c) + '>' + id(r + 1, nc));
        c = nc;
      }
    }
  }
  for (const e of edges) { const [a, b] = e.split('>'); if (!nodes[a].next.includes(b)) nodes[a].next.push(b); }
  // Single-exit nodes are fine, but never 3 in a row along any path: the third gets a second exit.
  const crosses = (r, c, nc) => nc !== c && nodes[id(r, nc)] && nodes[id(r, nc)].next.includes(id(r + 1, c));
  const run = {};
  for (let r = 1; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const n = nodes[id(r, c)]; if (!n) continue;
      const parents = Object.values(nodes).filter(p => p.row === r - 1 && p.next.includes(n.id));
      const prev = Math.max(0, ...parents.map(p => p.next.length === 1 ? run[p.id] || 0 : 0));
      if (n.next.length === 1 && prev + 1 >= 3) {
        const opts = shuffle([c - 1, c + 1].filter(x => x >= 0 && x < COLS), rng);
        const pick = opts.find(nc => !crosses(r, c, nc) && nodes[id(r + 1, nc)]) ?? opts.find(nc => !crosses(r, c, nc)) ?? opts[0];
        if (!nodes[id(r + 1, pick)]) nodes[id(r + 1, pick)] = { id: id(r + 1, pick), row: r + 1, col: pick, next: [] };
        n.next.push(id(r + 1, pick));
      }
      run[n.id] = n.next.length === 1 ? prev + 1 : 0;
    }
    // nodes created in the next row need a way forward
    for (let c = 0; c < COLS; c++) { const m = nodes[id(r + 1, c)]; if (m && r + 1 < ROWS && !m.next.length) { const t = [c, c - 1, c + 1].find(x => nodes[id(r + 2, x)]); const nc = t ?? c; if (!nodes[id(r + 2, nc)]) nodes[id(r + 2, nc)] = { id: id(r + 2, nc), row: r + 2, col: nc, next: [] }; m.next.push(id(r + 2, nc)); } }
  }
  return nodes;
}
function finishMap(rng, data, partySize, mapKey, nodes, bonus) {
  bonus = bonus || {};
  mapKey = mapKey || 'physical';
  const id = (r, c) => r + ':' + c, starts = new Set(Object.values(nodes).filter(n => n.row === 1).map(n => n.col));
  const boss = { id: 'boss', row: ROWS + 1, col: 2, next: [], type: 'boss' };
  nodes.boss = boss;
  for (const n of Object.values(nodes)) if (n.row === ROWS) n.next = ['boss'];
  // node types
  const list = Object.values(nodes).filter(n => n.id !== 'boss');
  for (const n of list) {
    const r = n.row, x = rng() * 100;
    if (r === 1) n.type = 'fight';
    else if (r === ROWS) n.type = 'rest';
    else if (r <= 2) n.type = x < 75 ? 'fight' : x < 90 ? 'shrine' : 'merchant';
    else if (r <= 4) n.type = x < 60 ? 'fight' : x < 76 ? 'rest' : x < 89 ? 'shrine' : 'merchant';
    else n.type = x < 57 ? 'fight' : x < 70 ? 'elite' : x < 81 ? 'rest' : x < 92 ? 'shrine' : 'merchant';
  }
  // 2 to 8 rest sites (the row before the boss counts); no two rests in a row along a path
  for (const n of list) if (n.type === 'rest' && n.row < ROWS) for (const k of n.next) if (nodes[k].type === 'rest' && nodes[k].row < ROWS) nodes[k].type = 'fight';
  // guaranteed halfway campfire: one rest on row 7 (rows 6 and 8 next to it can't also be rests)
  const row7 = list.filter(n => n.row === 7);
  const camp = row7.find(n => n.type === 'rest') || row7[Math.floor(rng() * row7.length)];
  if (camp) {
    camp.type = 'rest'; camp.campfire = true;
    for (const n of list) {
      if (n.row === 6 && n.next.includes(camp.id) && n.type === 'rest') n.type = 'fight';
      if (n.row === 8 && camp.next.includes(n.id) && n.type === 'rest') n.type = 'fight';
    }
  }
  let rests = list.filter(n => n.type === 'rest');
  const mids = shuffle(list.filter(n => n.type === 'fight' && n.row >= 6 && n.row <= 11), rng);
  while (rests.filter(n => n.row < ROWS).length < 1 && mids.length) { mids.pop().type = 'rest'; rests = list.filter(n => n.type === 'rest'); }
  while (rests.length > 8) { const x = rests.find(n => n.row < ROWS && !n.campfire); if (!x) break; x.type = 'fight'; rests = list.filter(n => n.type === 'rest'); }
  // never more than 4 fights in a row along any path: the 5th becomes a shrine
  const isFight = (n) => n.type === 'fight' || n.type === 'elite', streak = {};
  for (let r = 1; r <= ROWS; r++) for (const n of list.filter(x => x.row === r)) {
    const parents = list.filter(p => p.row === r - 1 && p.next.includes(n.id)), before = Math.max(0, ...parents.map(p => streak[p.id] || 0));
    if (isFight(n) && before + 1 > MAP_RULES.maxFightRun) n.type = 'shrine';
    streak[n.id] = isFight(n) ? before + 1 : 0;
  }
  // at least 5 shrines: turn random fights (rows 2-13) into shrines
  const spare = shuffle(list.filter(n => n.type === 'fight' && n.row >= 2 && n.row < ROWS), rng);
  while (list.filter(n => n.type === 'shrine').length < MAP_RULES.minShrines && spare.length) spare.pop().type = 'shrine';
  // at most 6 shrines: extras become fights where that keeps every fight streak at 4 or less, otherwise merchants or rests
  const runOk = () => { const st = {}; for (let r = 1; r <= ROWS; r++) for (const n of list.filter(x => x.row === r)) { const b = Math.max(0, ...list.filter(p => p.row === r - 1 && p.next.includes(n.id)).map(p => st[p.id] || 0)); st[n.id] = isFight(n) ? b + 1 : 0; if (st[n.id] > MAP_RULES.maxFightRun) return false; } return true; };
  const nearRest = (n) => list.some(p => (p.next.includes(n.id) || n.next.includes(p.id)) && p.type === 'rest');
  for (const n of shuffle(list.filter(x => x.type === 'shrine'), rng)) {
    if (list.filter(x => x.type === 'shrine').length <= MAP_RULES.maxShrines) break;
    n.type = 'fight'; if (runOk()) continue;
    n.type = !nearRest(n) && rng() < 0.4 && list.filter(x => x.type === 'rest').length < 8 ? 'rest' : 'merchant';
  }
  // Nov 1: no merchants before row 5 (no rushing a map you can't handle just to shop): early ones become shrines, or fights once shrines are full
  for (const n of list) if (n.type === 'merchant' && n.row < MERCHANT_MIN_ROW) n.type = list.filter(x => x.type === 'shrine').length < MAP_RULES.maxShrines ? 'shrine' : 'fight';
  // enemies
  const byTier = { 1: [], 2: [], 3: [], Elite: [] };
  for (const [k, e] of Object.entries(data.enemies)) if (byTier[e.tier] && (e.map || 'physical') === mapKey) byTier[e.tier].push(k);
  const elites = shuffle(byTier.Elite.slice(), rng);
  let ei = 0;
  for (const n of list) {
    if (n.type === 'fight') { const pool = byTier[TIER_ROWS(n.row)]; n.enemies = [pool[ri(rng, 0, pool.length - 1)]]; for (let k = 1; k < Math.min(4, partySize || 1); k++) n.enemies.push(pool[ri(rng, 0, pool.length - 1)]); } if (n.type === 'fight' && n.enemies.length > 1) { const solo = byTier[TIER_ROWS(n.row)].filter(k => !data.enemies[k].group); let seen = false; n.enemies = n.enemies.map(k => { if (!data.enemies[k].group) return k; if (!seen) { seen = true; return k; } return solo[ri(rng, 0, solo.length - 1)]; }); } // at most one group per fight // a party meets one monster per hero
    if (n.type === 'elite') n.enemies = [elites[ei++ % elites.length]];
    if (n.type === 'shrine') n.shrine = SHRINES[ri(rng, 0, SHRINES.length - 1)].key;
  }
  // 10% of maps: one elite is Enraged (+50% HP and damage, double loot, a guaranteed Blue or better item)
  // the party leader's codex talents: a chance at an extra shrine and an extra merchant (a plain fight becomes one)
  for (const [k, type] of [['shrine', 'shrine'], ['merchant', 'merchant']]) if (bonus[k] && rng() * 100 < bonus[k]) { const f = list.filter(n => n.type === 'fight' && n.row > (type === 'merchant' ? MERCHANT_MIN_ROW - 1 : 1) && n.row < ROWS); if (f.length) { const n = f[Math.floor(rng() * f.length)]; n.type = type; n.enemies = undefined; if (type === 'shrine') n.shrine = SHRINES[ri(rng, 0, SHRINES.length - 1)].key; n.bonus = true; } }
  if (rng() < MAP_RULES.enragedChance + (bonus.enraged || 0) / 100) { const els = list.filter(n => n.type === 'elite'); if (els.length) els[Math.floor(rng() * els.length)].enraged = true; }
  boss.enemies = [(data.maps && data.maps[mapKey] && data.maps[mapKey].boss) || 'warlord_gorrath_the_iron_tide'];
  return { nodes, starts: [...starts].map(c => id(1, c)).filter(k => nodes[k]) };
}

class Run {
  // opts: level, seed, data, and either members: [{cls, gear, deck, bank, stashFree, name}] (a party of 1 to 4)
  // or the solo fields cls, gear/gearPreset, deck, bank, stashFree. sharedBank: true when every member spends one bank (hot-seat party).
  constructor(opts) {
    if (opts && opts.data && CB.gearData) CB.gearData(opts.data);
    this.opts = Object.assign({ cls: 'Warrior', level: 0, gearPreset: 'White', seed: (Date.now() % 2147483646) + 1 }, opts || {});
    this.data = this.opts.data || root.CB_DATA;
    this.rng = makeRng(this.opts.seed);
    this.level = this.opts.level;
    const specs = this.opts.members || [{ key: this.opts.key, cls: this.opts.cls, name: this.opts.name, gear: this.opts.gear, deck: this.opts.deck, bank: this.opts.bank, stashFree: this.opts.stashFree, talents: this.opts.talents }];
    this.sharedBank = !!this.opts.sharedBank;
    this.bankPool = this.sharedBank ? (specs[0].bank || 0) : 0;
    this.members = specs.map((sp, i) => {
      const gear = (sp.gear || (this.opts.gearPreset === 'White' ? STARTER_GEAR[sp.cls] : presetGear(sp.cls, this.opts.gearPreset))).map(x => Object.assign({}, x));
      const stats = sumGear(gear);
      return { idx: i, key: sp.key, cls: sp.cls, name: sp.name || sp.cls, gear, stats, deck: sp.deck || null, hp: stats.maxHp, mana: 0, gold: 0, sack: [],
        bank: this.sharedBank ? 0 : (sp.bank || 0), spent: 0, orders: [], stashFree: sp.stashFree != null ? sp.stashFree : 99, kept: null, deaths: 0, talents: sp.talents || null, cxp: {} };
    });
    this.buffs = []; this.log = []; this.meter = {};
    this.mapKey = this.opts.map && this.data.maps && this.data.maps[this.opts.map] ? this.opts.map : 'physical';
    this.mapName = this.data.maps ? this.data.maps[this.mapKey].name : 'The Broken March';
    { const bk = this.data.maps ? this.data.maps[this.mapKey].boss : 'warlord_gorrath_the_iron_tide', be = this.data.enemies[bk]; this.bossName = be ? be.name.split(',')[0].replace(/ of the .*/, '') : 'The boss'; }
    { const lead = CB.talentRun(specs[0] && specs[0].talents); this.map = generateMap(this.rng, this.data, specs.length, this.mapKey, { enraged: lead.enraged || 0, shrine: lead.shrine || 0, merchant: lead.merchant || 0 }); } // the leader's talents
    this.at = null; this.visited = []; this.over = null; this.fightsWon = 0; this.kills = 0; this.combat = null; this.pending = null;
    this.note(this.members.length > 1 ? `A party of ${this.members.length} (${this.members.map(m => m.name).join(', ')}) sets out on ${this.mapName} (+${this.level}).` : `A ${this.cls} sets out on ${this.mapName} (+${this.level}).`);
  }
  get solo() { return this.members.length === 1; }
  get m0() { return this.members[0]; }
  // solo shorthands (the first member)
  get cls() { return this.m0.cls; } get gear() { return this.m0.gear; } set gear(v) { this.m0.gear = v; } get deck() { return this.m0.deck; }
  get stats() { return this.m0.stats; } set stats(v) { this.m0.stats = v; }
  get hp() { return this.m0.hp; } set hp(v) { this.m0.hp = v; } get maxHp() { return this.m0.stats.maxHp; }
  get mana() { return this.m0.mana; } set mana(v) { this.m0.mana = v; }
  get gold() { return this.m0.gold; } set gold(v) { this.m0.gold = v; } get sack() { return this.m0.sack; }
  get bank() { return this.bankOf(this.m0); } get spent() { return this.m0.spent; } get orders() { return this.m0.orders; } get stashFree() { return this.m0.stashFree; }
  get kept() { return this.m0.kept; } set kept(v) { this.m0.kept = v; }
  bankOf(m) { return this.sharedBank ? this.bankPool : m.bank; }
  note(t) { this.log.push(t); }
  currentRow() { return this.at ? this.map.nodes[this.at].row : 0; }
  reachable() { return this.at ? this.map.nodes[this.at].next.slice() : this.map.starts.slice(); }
  visible() { return true; }
  activeBuffs() { const b = {}; for (const x of this.buffs) for (const [k, v] of Object.entries(x.buff)) b[k] = (b[k] || 0) + v; return b; }
  luck(m) { m = m || this.m0; return m.stats.luck + (this.activeBuffs().luck || 0) + (CB.talentRun(m.talents).luck || 0) + this.partyTalent('partyLuck'); } // + Luck from codex talents
  partyTalent(k) { return this.members.reduce((t, x) => t + (CB.talentRun(x.talents)[k] || 0), 0); }
  finish(result) { this.over = result; for (const m of this.members) if (!m.kept) m.kept = { items: [], gold: 0 }; }

  // party decisions: each member's vote; majority wins, ties are settled by a coin flip from the run's seed
  resolveVote(votes) {
    const tally = {}; for (const v of votes) if (v != null) tally[v] = (tally[v] || 0) + 1;
    const top = Math.max(...Object.values(tally)); const best = Object.keys(tally).filter(k => tally[k] === top).sort();
    return best.length === 1 ? best[0] : best[Math.floor(this.rng() * best.length)];
  }

  enter(nodeId) {
    if (this.over || this.combat || this.pending) return false;
    if (!this.reachable().includes(nodeId)) return false;
    const n = this.map.nodes[nodeId];
    this.at = nodeId; this.visited.push(nodeId);
    if (['fight', 'elite', 'boss'].includes(n.type)) {
      const buffs = this.activeBuffs();
      const party = this.members.map(m => ({ cls: m.cls, name: m.name, gear: m.gear, deck: m.deck || undefined, hp: m.hp, mana: m.mana, buffs, talents: m.talents || undefined }));
      this.combat = new Combat({ party, enemies: n.enemies, enraged: !!n.enraged, firstBoss: n.type === 'boss' && !!this.opts.firstBoss, level: this.level, seed: Math.floor(this.rng() * 2147483646) + 1, data: this.data, partyStep: n.enemies.length > 1 ? 0 : this.opts.partyStep, mobHp: n.enemies.length > 1 ? 1 + MOB_HP_STEP * (this.members.length - 1) : 1 });
      this.note(`Row ${n.row}: ${n.type === 'boss' ? 'the boss' : n.type === 'elite' ? 'an elite' : 'a fight'} against ${n.enemies.map(k => this.data.enemies[k].name).join(', ')}.`);
    } else if (n.type === 'rest') { this.pending = { type: 'rest', heals: this.members.map(m => Math.min(m.stats.maxHp - m.hp, Math.round(m.stats.maxHp * 0.3))), keep: n.campfire ? 0.75 : 0.5 }; this.pending.heal = this.pending.heals[0]; }
    else if (n.type === 'shrine') { const s = SHRINES.find(x => x.key === n.shrine); this.buffs.push({ key: s.key, name: s.name, buff: s.buff, fights: 2 }); this.pending = { type: 'shrine', shrine: s }; this.note(`Row ${n.row}: ${s.name}. ${s.text}`); }
    else if (n.type === 'merchant') { this.pending = { type: 'merchant', stock: this.merchantStock() }; if (this.online && this.members.length > 1) this.pending.stocks = this.members.map(() => this.merchantStock(5)); // online parties: every hero gets their own stock (Oct 31)
      this.note(`Row ${n.row}: a merchant.`); }
    return true;
  }

  // Called when the current combat ends. In a party, a hero who fell loses their sack and gets back up at 50% HP.
  finishCombat() {
    const cb = this.combat; if (!cb || !cb.over) return null;
    const n = this.map.nodes[this.at];
    this.combat = null;
    for (const m of Object.values(cb.meter)) { // add the fight to the run totals: heroes by seat, monsters together by name
      const k = m.isPlayer ? m.id : 'm:' + m.name, R = this.meter[k] || (this.meter[k] = { id: k, name: m.name, isPlayer: m.isPlayer, cls: m.cls, dealt: {}, healed: {}, taken: {}, absorbed: 0 });
      for (const f of ['dealt', 'healed', 'taken']) for (const [a, v] of Object.entries(m[f])) R[f][a] = (R[f][a] || 0) + v;
      R.absorbed += m.absorbed;
    }
    // codex XP (Nov 1): every kill counts for the codex each hero is wearing; a party splits the kills but gets +10% per extra hero
    { const xp = cb.enemies.filter(e => e.hp <= 0 && !e.noLoot).reduce((s, e) => s + KILL_XP((this.data.enemies[e.key] || {}).tier), 0), N = this.members.length;
      if (xp > 0) for (const m of this.members) { const cx = (m.gear.find(g => g && g.slot === 'Codex') || {}).codex; if (cx) m.cxp[cx] = (m.cxp[cx] || 0) + xp / N * (1 + 0.1 * (N - 1)); } }
    for (const b of this.buffs) b.fights--;
    this.buffs = this.buffs.filter(b => b.fights > 0);
    if (cb.over === 'loss') {
      for (const m of this.members) { m.hp = 0; m.kept = { items: [], gold: 0 }; }
      this.over = 'dead';
      this.note(this.solo ? `Died on row ${n.row}. The loot sack (${this.sack.length} items, ${this.gold} gold) is lost.` : `The party is wiped out on row ${n.row}. Every sack is lost.`);
      return { result: 'loss' };
    }
    this.fightsWon++; this.kills += cb.enemies.filter(e => !e.noLoot).length; // a group counts as one kill
    const per = [];
    this.members.forEach((m, i) => {
      const pl = cb.players[i];
      let fell = false;
      if (pl.dead || pl.hp <= 0) {
        fell = true; m.deaths++;
        this.note(`${m.name} fell in the fight: their sack (${m.sack.length} items, ${m.gold} gold) is lost. They get back up at half HP.`);
        m.sack = []; m.gold = 0; m.hp = Math.ceil(m.stats.maxHp / 2); m.mana = 0;
      } else { m.hp = Math.min(pl.hp, m.stats.maxHp); m.mana = pl.mana; } // talent max-HP buffs last for the fight only
      const regen = m.stats.healthRegen + this.partyTalent('partyHealthRegen'); if (regen && !fell) m.hp = Math.min(m.stats.maxHp, m.hp + regen);
      const drops = []; let gold = 0;
      for (const e of cb.enemies) {  // every hero rolls their own loot
        if (e.noLoot) continue; // the rest of a group: the group's first body rolls its loot
        for (let k = 0; k < (e.enraged ? 2 : 1); k++) { // an Enraged elite drops everything twice
          drops.push(...rollDrops(this.data, this.rng, e.key, this.level, this.luck(m), m.cls));
          drops.push(...rollCards(this.rng, m.cls, this.data.enemies[e.key].tier, this.luck(m)));
          drops.push(...rollNamedCards(this.data, this.rng, e.key, m.cls, this.luck(m)));
          const g = this.data.enemies[e.key].gold; gold += Math.round(ri(this.rng, g[0], g[1]) * Math.pow(1.5, this.level));
        }
        if (e.enraged) { const pool = this.data.enemies[e.key].pool; if (pool && pool.length) { const it = rollItem(this.data, this.rng, pool[Math.floor(this.rng() * pool.length)], this.rng() < 0.25 * (1 + this.luck(m) / 100) ? 'Purple (Epic)' : 'Blue', this.level); if (it) drops.push(it); } } // plus a guaranteed Blue, 25% Epic
      }
      m.sack.push(...drops); m.gold += gold;
      per.push({ drops, gold, fell });
      const nCards = drops.filter(d => d.kind === 'card').length, nGear = drops.length - nCards;
      this.note(`${this.solo ? 'Won' : m.name + ': won'} in ${cb.round} rounds with ${m.hp}/${m.stats.maxHp} HP. Loot: ${nGear} item${nGear === 1 ? '' : 's'}, ${nCards} card${nCards === 1 ? '' : 's'}, ${gold} gold.`);
    });
    if (n.type === 'boss') this.members.forEach((m, i) => { const gift = bossGift(this.data, this.rng, this.mapKey, m.cls, this.level); m.sack.push(...gift); per[i].drops.push(...gift); }); // Nov 1: every boss kill also drops a Green weapon and chest for your class
    if (n.type === 'boss') { for (const m of this.members) m.kept = { items: m.sack.slice(), gold: m.gold }; this.over = 'victory'; this.note(`${this.bossName || 'The boss'} falls. Everyone keeps their whole sack.`); }
    return { result: 'win', drops: per[0].drops, gold: per[0].gold, per, rounds: cb.round };
  }

  rest() {
    if (!this.pending || this.pending.type !== 'rest') return;
    this.members.forEach((m, i) => { const h = this.pending.heals[i]; m.hp = Math.min(m.stats.maxHp, m.hp + h); this.note(`${this.solo ? 'Rested' : m.name + ' rests'}: +${h} HP (${m.hp}/${m.stats.maxHp}).`); });
    this.pending = null;
  }
  // campfire choices per hero (Oct 31): 'rest' heals that hero 30%, 'mend' heals the whole party 10% (stacks), 'rummage' rolls
  // that hero one normal monster's loot (gear, cards, gold) for this map and row. Returns what each hero got.
  camp(choices) {
    if (!this.pending || this.pending.type !== 'rest') return null;
    const heal = this.members.map(() => 0), out = this.members.map(() => ({ drops: [], gold: 0, heal: 0 }));
    const menders = this.members.filter((m, i) => choices[i] === 'mend');
    this.members.forEach((m, i) => { if ((choices[i] || 'rest') === 'rest') heal[i] += this.pending.heals[i]; });
    for (const md of menders) { this.members.forEach((m, i) => { heal[i] += Math.round(m.stats.maxHp * 0.1); }); this.note(`${this.solo ? 'You mend' : md.name + ' mends the party'}: everyone heals 10%.`); }
    this.members.forEach((m, i) => {
      if (choices[i] === 'rummage') {
        const row = this.currentRow(), tier = row <= 4 ? '1' : row <= 9 ? '2' : '3';
        const pool = Object.entries(this.data.enemies).filter(([k, e]) => e.tier === tier && (e.map || 'physical') === this.mapKey).map(([k]) => k);
        if (pool.length) {
          const k = pool[Math.floor(this.rng() * pool.length)], e = this.data.enemies[k];
          const drops = [...rollDrops(this.data, this.rng, k, this.level, this.luck(m), m.cls), ...rollCards(this.rng, m.cls, e.tier, this.luck(m)), ...rollNamedCards(this.data, this.rng, k, m.cls, this.luck(m))];
          const gold = Math.round(ri(this.rng, e.gold[0], e.gold[1]) * Math.pow(1.5, this.level));
          m.sack.push(...drops); m.gold += gold; out[i].drops = drops; out[i].gold = gold; out[i].from = e.name;
          this.note(`${this.solo ? 'You rummage' : m.name + ' rummages'} through what the ${e.name} left behind: ${drops.length} drop${drops.length === 1 ? '' : 's'} and ${gold} gold.`);
        }
      }
      if (heal[i]) { const before = m.hp; m.hp = Math.min(m.stats.maxHp, m.hp + heal[i]); out[i].heal = m.hp - before; if (choices[i] === 'rest') this.note(`${this.solo ? 'Rested' : m.name + ' rests'}: +${m.hp - before} HP (${m.hp}/${m.stats.maxHp}).`); }
    });
    this.pending = null; this.lastCamp = out;
    return out;
  }
  extract() {
    if (!this.pending || this.pending.type !== 'rest') return;
    const frac = this.pending.keep || 0.5; // the row-7 campfire keeps 75%, every other campfire 50%
    for (const m of this.members) {
      const fr = Math.min(1, frac + (CB.talentRun(m.talents).extract || 0) / 100); // talents: more of the sack survives
      const keep = shuffle(m.sack.slice(), this.rng).slice(0, Math.ceil(m.sack.length * fr));
      m.kept = { items: keep, gold: Math.round(m.gold * fr) };
      this.note(`${this.solo ? '' : m.name + ': '}${Math.round(fr * 100)}% of the sack survives: ${keep.length} of ${m.sack.length} items and ${m.kept.gold} of ${m.gold} gold.`);
    }
    this.over = 'extracted'; this.pending = null;
    this.note(`Extracted on row ${this.currentRow()}.`);
  }
  closePending() { this.pending = null; }

  stockFor(mi) { const p = this.pending; return p && p.stocks ? p.stocks[mi || 0] : p && p.stock; }
  merchantStock(n) {
    const bases = this.data.gear.bases.filter(b => (b.map || 'physical') === this.mapKey).map(b => b.name);
    const out = [];
    for (let i = 0; i < (n || 4 + Math.min(4, this.members.length - 1) * 2); i++) {
      const x = this.rng() * 100, rar = x < 45 ? 'White' : x < 80 ? 'Green' : 'Blue';
      const item = rollItem(this.data, this.rng, bases[ri(this.rng, 0, bases.length - 1)], rar, this.level);
      item.price = Math.round({ White: 20, Green: 50, Blue: 120 }[rar] * Math.pow(1.5, this.level));
      out.push(item);
    }
    return out;
  }
  slotFor(item, mi) {
    const g = this.members[mi || 0].gear;
    if (item.slot === 'Ring') { const r1 = g.find(x => x.slot === 'Ring 1'), r2 = g.find(x => x.slot === 'Ring 2'); return (!r1 || (r2 && (r1.ilvl || 0) <= (r2.ilvl || 0))) ? 'Ring 1' : 'Ring 2'; }
    return item.slot;
  }
  // order from a merchant with banked gold; delivered to that member's stash
  buy(i, mi) {
    const m = this.members[mi || 0];
    const st = this.stockFor(mi); if (!st || !st[i] || st[i].sold) return false;
    const item = st[i]; if (this.bankOf(m) < item.price || m.orders.length >= m.stashFree) return false;
    if (this.sharedBank) this.bankPool -= item.price; else m.bank -= item.price;
    m.spent += item.price; item.sold = true; item.buyer = m.idx;
    const o = Object.assign({}, item); delete o.price; delete o.sold; delete o.buyer; m.orders.push(o);
    this.note(`${this.solo ? 'Ordered' : m.name + ' ordered'} ${item.rarity} ${item.name} for ${item.price} banked gold. It will be waiting in the stash.`);
    return true;
  }
}

const API = { Run, generateMap, SHRINES, SLOTS, ROWS, COLS, MAP_RULES };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CBRun = API;
})(typeof window !== 'undefined' ? window : globalThis);
