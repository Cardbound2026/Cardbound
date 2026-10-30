// Progression sim: one character plays run after run from camp. Greedy camp AI: equip higher ilvl, slot better cards in, feed spares, salvage the rest.
// When it kills the Warlord at level L it moves to L+1. Usage: node progsim.js [runs] [chars]
const CB = require('../src/engine.js'); const { Run } = require('../src/run.js'); const H = require('../src/hub.js'); const { autopilot } = require('./autopilot.js');
const fs = require('fs'); const src = fs.readFileSync(__dirname + '/../src/data.js', 'utf8'); const DATA = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
if (process.env.DROPX) { const m = +process.env.DROPX; for (const t of Object.values(DATA.gear.drops)) { t.chance.Green *= m; t.chance.Blue *= m; } }
const RUNS = +(process.argv[2] || 40), N = +(process.argv[3] || 6);
function choose(run) { const opts = run.reachable().map(k => run.map.nodes[k]); const hpf = run.hp / run.maxHp;
  const score = n => ({ rest: hpf < 0.7 ? 5 : 1, shrine: 3, merchant: run.bank >= 50 ? 3 : 1, fight: hpf > 0.4 ? 2 : 0.5, elite: hpf > 0.8 ? 2.5 : -2, boss: 9 }[n.type]);
  return opts.sort((a, b) => score(b) - score(a))[0].id; }
function play(p, cls, level, seed) {
  const run = new Run(Object.assign(H.runOpts(p, cls), { level, seed, data: DATA })); let g = 0;
  while (!run.over && g++ < 200) {
    if (run.combat) { const cb = run.combat; let k = 0; while (!cb.over && k++ < 3000) { if (cb.phase === 'enemy') cb.runEnemies(); else if (cb.phase === 'player') autopilot(cb); } run.finishCombat(); continue; }
    if (run.pending) {
      if (run.pending.type === 'rest') { const sackVal = run.sack.length; if (run.hp / run.maxHp < 0.45 && run.currentRow() >= 6) run.extract(); else if (process.env.CAMP7 && run.pending.keep > 0.5 && run.hp / run.maxHp < 0.7 && sackVal >= 3) run.extract(); else run.rest(); }
      else if (run.pending.type === 'merchant') { run.pending.stock.forEach((it, i) => { const cur = run.gear.find(g => g.slot === run.slotFor(it)); if (run.bank >= it.price && ['Green', 'Blue'].includes(it.rarity) && (!cur || val(it) > val(cur))) run.buy(i); }); run.closePending(); }
      else run.closePending(); continue; }
    run.enter(choose(run));
  }
  return run;
}
const val = g => g ? ({ White: 0, Green: 1, Blue: 2, 'Purple (Epic)': 3 }[g.rarity] * 6 + (g.ilvl || 0)) : -1;
const pts = c => CB.cardPoints(CB.CARDS[c.key].rarity, c.rank);
function camp(p, cls) {
  const c = H.char(p, cls);
  if (process.env.SHOP) p.shop.items.forEach((it, i) => { const opts = H.slotOptions(it); const worst = Math.min(...opts.map(s => val(c.gear.find(g => g.slot === s)))); if (!it.sold && val(it) > worst && p.gold >= it.price && it.rarity !== 'White') H.buyShop(p, i); });
  for (const it of p.stash.slice()) { const opts = H.slotOptions(it); const worst = opts.map(s => [s, val(c.gear.find(g => g.slot === s))]).sort((a, b) => a[1] - b[1])[0]; if (val(it) > worst[1]) H.equip(p, cls, it.id, worst[0]); }
  for (const it of p.stash.slice()) H.salvage(p, it.id);
  // swap better cards in: add when room under caps, else replace the weakest White
  for (const k of c.cards.slice().sort((a, b) => pts(b) - pts(a))) {
    const r = CB.CARDS[k.key].rarity; if (r === 'White') continue;
    if (H.canAdd(c, k.id).ok) { const w = c.deck.filter(d => CB.CARDS[d.key].rarity === 'White').sort((a, b) => pts(a) - pts(b))[0]; H.addToDeck(p, cls, k.id); if (w && c.deck.length > 20) H.removeFromDeck(p, cls, w.id); }
  }
  for (const k of c.cards.slice()) { const t = c.deck.filter(d => d.key === k.key).sort((a, b) => (b.rank || 0) - (a.rank || 0))[0] || c.deck.filter(d => CB.CARDS[d.key].rarity === CB.CARDS[k.key].rarity).sort((a, b) => (b.rank || 0) - (a.rank || 0))[0]; if (t) H.feed(p, cls, t.id, [k.id]); }
  for (const d of c.deck) H.rankUp(p, d);
}
for (const cls of Object.keys(CB.CLASSES)) {
  const firstKill = [], finalLvl = [], finalPow = [], curve = Array(RUNS).fill(0);
  for (let s = 0; s < N; s++) {
    const p = H.newProfile(); let level = 0, fk = null;
    for (let i = 0; i < RUNS; i++) {
      const run = play(p, cls, level, 7000 + s * 1000 + i); H.absorbRun(p, run); if (i % 4 === 0) H.refreshShop(p, DATA, level, CB.makeRng(99 + s * 1000 + i)); camp(p, cls); // shop restocks every 4 runs (about 12 hours of play)
      curve[i] += H.powerLevel(H.char(p, cls)) / N;
      if (run.over === 'victory') { if (fk == null) fk = i + 1; level++; }
    }
    firstKill.push(fk == null ? '-' : fk); finalLvl.push(level); const gc = H.char(p, cls).gear; finalPow.push(H.powerLevel(H.char(p, cls)) + '(g' + H.gearScore(H.char(p, cls)) + '/d' + CB.deckLevel(H.char(p, cls).deck) + ' ' + ['White','Green','Blue','Purple (Epic)'].map(r => gc.filter(g => g.rarity === r).length).join('-') + ')');
  }
  console.log(`${cls.padEnd(8)} first Warlord kill on run ${firstKill.join(',')} | map level after ${RUNS} runs ${finalLvl.join(',')} | power ${finalPow.join(' ')} | avg power by run 5/10/20/${RUNS}: ${[4, 9, 19, RUNS - 1].map(i => curve[i].toFixed(0)).join('/')}`);
}
