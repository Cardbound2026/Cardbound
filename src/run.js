// Cardbound run layer: map generation, nodes, HP and mana carry, loot sack, rest/extract, shrines, merchant. No DOM.
(function (root) {
'use strict';
const CB = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.CB;
const { makeRng, shuffle, ri, rollItem, rollDrops, sumGear, STARTER_GEAR, presetGear, Combat, rollCards, rollNamedCards } = CB;

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
const SLOTS = ['Weapon', 'Off-hand', 'Helm', 'Amulet', 'Cloak', 'Chest', 'Bracers', 'Gloves', 'Belt', 'Pants', 'Boots', 'Ring 1', 'Ring 2'];

function generateMap(rng, data, partySize, mapKey) {
  mapKey = mapKey || 'physical';
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
  // enemies
  const byTier = { 1: [], 2: [], 3: [], Elite: [] };
  for (const [k, e] of Object.entries(data.enemies)) if (byTier[e.tier] && (e.map || 'physical') === mapKey) byTier[e.tier].push(k);
  const elites = shuffle(byTier.Elite.slice(), rng);
  let ei = 0;
  for (const n of list) {
    if (n.type === 'fight') { const pool = byTier[TIER_ROWS(n.row)]; n.enemies = [pool[ri(rng, 0, pool.length - 1)]]; for (let k = 1; k < Math.min(4, partySize || 1); k++) n.enemies.push(pool[ri(rng, 0, pool.length - 1)]); } // a party meets one monster per hero
    if (n.type === 'elite') n.enemies = [elites[ei++ % elites.length]];
    if (n.type === 'shrine') n.shrine = SHRINES[ri(rng, 0, SHRINES.length - 1)].key;
  }
  boss.enemies = [(data.maps && data.maps[mapKey] && data.maps[mapKey].boss) || 'warlord_gorrath_the_iron_tide'];
  return { nodes, starts: [...starts].map(c => id(1, c)).filter(k => nodes[k]) };
}

class Run {
  // opts: level, seed, data, and either members: [{cls, gear, deck, bank, stashFree, name}] (a party of 1 to 4)
  // or the solo fields cls, gear/gearPreset, deck, bank, stashFree. sharedBank: true when every member spends one bank (hot-seat party).
  constructor(opts) {
    this.opts = Object.assign({ cls: 'Warrior', level: 0, gearPreset: 'White', seed: (Date.now() % 2147483646) + 1 }, opts || {});
    this.data = this.opts.data || root.CB_DATA;
    this.rng = makeRng(this.opts.seed);
    this.level = this.opts.level;
    const specs = this.opts.members || [{ key: this.opts.key, cls: this.opts.cls, name: this.opts.name, gear: this.opts.gear, deck: this.opts.deck, bank: this.opts.bank, stashFree: this.opts.stashFree }];
    this.sharedBank = !!this.opts.sharedBank;
    this.bankPool = this.sharedBank ? (specs[0].bank || 0) : 0;
    this.members = specs.map((sp, i) => {
      const gear = (sp.gear || (this.opts.gearPreset === 'White' ? STARTER_GEAR[sp.cls] : presetGear(sp.cls, this.opts.gearPreset))).map(x => Object.assign({}, x));
      const stats = sumGear(gear);
      return { idx: i, key: sp.key, cls: sp.cls, name: sp.name || sp.cls, gear, stats, deck: sp.deck || null, hp: stats.maxHp, mana: 0, gold: 0, sack: [],
        bank: this.sharedBank ? 0 : (sp.bank || 0), spent: 0, orders: [], stashFree: sp.stashFree != null ? sp.stashFree : 99, kept: null, deaths: 0 };
    });
    this.buffs = []; this.log = []; this.meter = {};
    this.mapKey = this.opts.map && this.data.maps && this.data.maps[this.opts.map] ? this.opts.map : 'physical';
    this.mapName = this.data.maps ? this.data.maps[this.mapKey].name : 'The Broken March';
    { const bk = this.data.maps ? this.data.maps[this.mapKey].boss : 'warlord_gorrath_the_iron_tide', be = this.data.enemies[bk]; this.bossName = be ? be.name.split(',')[0].replace(/ of the .*/, '') : 'The boss'; }
    this.map = generateMap(this.rng, this.data, specs.length, this.mapKey);
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
  luck(m) { return (m || this.m0).stats.luck + (this.activeBuffs().luck || 0); }
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
      const party = this.members.map(m => ({ cls: m.cls, name: m.name, gear: m.gear, deck: m.deck || undefined, hp: m.hp, mana: m.mana, buffs }));
      this.combat = new Combat({ party, enemies: n.enemies, level: this.level, seed: Math.floor(this.rng() * 2147483646) + 1, data: this.data, partyStep: n.enemies.length > 1 ? 0 : this.opts.partyStep, mobHp: n.enemies.length > 1 ? 1 + MOB_HP_STEP * (this.members.length - 1) : 1 });
      this.note(`Row ${n.row}: ${n.type === 'boss' ? 'the boss' : n.type === 'elite' ? 'an elite' : 'a fight'} against ${n.enemies.map(k => this.data.enemies[k].name).join(', ')}.`);
    } else if (n.type === 'rest') { this.pending = { type: 'rest', heals: this.members.map(m => Math.min(m.stats.maxHp - m.hp, Math.round(m.stats.maxHp * 0.3))), keep: n.campfire ? 0.75 : 0.5 }; this.pending.heal = this.pending.heals[0]; }
    else if (n.type === 'shrine') { const s = SHRINES.find(x => x.key === n.shrine); this.buffs.push({ key: s.key, name: s.name, buff: s.buff, fights: 2 }); this.pending = { type: 'shrine', shrine: s }; this.note(`Row ${n.row}: ${s.name}. ${s.text}`); }
    else if (n.type === 'merchant') { this.pending = { type: 'merchant', stock: this.merchantStock() }; this.note(`Row ${n.row}: a merchant.`); }
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
    for (const b of this.buffs) b.fights--;
    this.buffs = this.buffs.filter(b => b.fights > 0);
    if (cb.over === 'loss') {
      for (const m of this.members) { m.hp = 0; m.kept = { items: [], gold: 0 }; }
      this.over = 'dead';
      this.note(this.solo ? `Died on row ${n.row}. The loot sack (${this.sack.length} items, ${this.gold} gold) is lost.` : `The party is wiped out on row ${n.row}. Every sack is lost.`);
      return { result: 'loss' };
    }
    this.fightsWon++; this.kills += cb.enemies.length;
    const per = [];
    this.members.forEach((m, i) => {
      const pl = cb.players[i];
      let fell = false;
      if (pl.dead || pl.hp <= 0) {
        fell = true; m.deaths++;
        this.note(`${m.name} fell in the fight: their sack (${m.sack.length} items, ${m.gold} gold) is lost. They get back up at half HP.`);
        m.sack = []; m.gold = 0; m.hp = Math.ceil(m.stats.maxHp / 2); m.mana = 0;
      } else { m.hp = pl.hp; m.mana = pl.mana; }
      const regen = m.stats.healthRegen; if (regen && !fell) m.hp = Math.min(m.stats.maxHp, m.hp + regen);
      const drops = []; let gold = 0;
      for (const e of cb.enemies) {  // every hero rolls their own loot
        drops.push(...rollDrops(this.data, this.rng, e.key, this.level, this.luck(m)));
        drops.push(...rollCards(this.rng, m.cls, this.data.enemies[e.key].tier, this.luck(m)));
        drops.push(...rollNamedCards(this.data, this.rng, e.key, m.cls, this.luck(m)));
        const g = this.data.enemies[e.key].gold; gold += Math.round(ri(this.rng, g[0], g[1]) * Math.pow(1.5, this.level));
      }
      m.sack.push(...drops); m.gold += gold;
      per.push({ drops, gold, fell });
      const nCards = drops.filter(d => d.kind === 'card').length, nGear = drops.length - nCards;
      this.note(`${this.solo ? 'Won' : m.name + ': won'} in ${cb.round} rounds with ${m.hp}/${m.stats.maxHp} HP. Loot: ${nGear} item${nGear === 1 ? '' : 's'}, ${nCards} card${nCards === 1 ? '' : 's'}, ${gold} gold.`);
    });
    if (n.type === 'boss') { for (const m of this.members) m.kept = { items: m.sack.slice(), gold: m.gold }; this.over = 'victory'; this.note(`${this.bossName || 'The boss'} falls. Everyone keeps their whole sack.`); }
    return { result: 'win', drops: per[0].drops, gold: per[0].gold, per, rounds: cb.round };
  }

  rest() {
    if (!this.pending || this.pending.type !== 'rest') return;
    this.members.forEach((m, i) => { const h = this.pending.heals[i]; m.hp = Math.min(m.stats.maxHp, m.hp + h); this.note(`${this.solo ? 'Rested' : m.name + ' rests'}: +${h} HP (${m.hp}/${m.stats.maxHp}).`); });
    this.pending = null;
  }
  extract() {
    if (!this.pending || this.pending.type !== 'rest') return;
    const frac = this.pending.keep || 0.5; // the row-7 campfire keeps 75%, every other campfire 50%
    for (const m of this.members) {
      const keep = shuffle(m.sack.slice(), this.rng).slice(0, Math.ceil(m.sack.length * frac));
      m.kept = { items: keep, gold: Math.round(m.gold * frac) };
      this.note(`${this.solo ? '' : m.name + ': '}${Math.round(frac * 100)}% of the sack survives: ${keep.length} of ${m.sack.length} items and ${m.kept.gold} of ${m.gold} gold.`);
    }
    this.over = 'extracted'; this.pending = null;
    this.note(`Extracted on row ${this.currentRow()}.`);
  }
  closePending() { this.pending = null; }

  merchantStock() {
    const bases = this.data.gear.bases.filter(b => (b.map || 'physical') === this.mapKey).map(b => b.name);
    const out = [];
    for (let i = 0; i < 4 + Math.min(4, this.members.length - 1) * 2; i++) {
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
    const st = this.pending && this.pending.stock; if (!st || !st[i] || st[i].sold) return false;
    const item = st[i]; if (this.bankOf(m) < item.price || m.orders.length >= m.stashFree) return false;
    if (this.sharedBank) this.bankPool -= item.price; else m.bank -= item.price;
    m.spent += item.price; item.sold = true; item.buyer = m.idx;
    const o = Object.assign({}, item); delete o.price; delete o.sold; delete o.buyer; m.orders.push(o);
    this.note(`${this.solo ? 'Ordered' : m.name + ' ordered'} ${item.rarity} ${item.name} for ${item.price} banked gold. It will be waiting in the stash.`);
    return true;
  }
}

const API = { Run, generateMap, SHRINES, SLOTS, ROWS, COLS };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CBRun = API;
})(typeof window !== 'undefined' ? window : globalThis);
