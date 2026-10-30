// Balance sim: every class vs every Map 1 enemy (solo). Usage: node sim.js [levels] [N]
const CB = require('../src/engine.js');
const { fight } = require('./autopilot.js');
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../src/data.js', 'utf8');
const DATA = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
const levels = (process.argv[2] || '0').split(',').map(Number);
const N = +(process.argv[3] || 200);
const only = process.argv[4] && process.argv[4] !== 'all' ? process.argv[4] : null;
const tune = process.argv[5] ? JSON.parse(process.argv[5]) : {};
const gearR = process.argv[6] || 'White';

// parser coverage
const missing = [];
for (const [k, e] of Object.entries(DATA.enemies)) for (const c of e.deck) if (!CB.parseEnemyCard(c.text).length) missing.push(`${e.name}: ${c.name} - ${c.text}`);
if (missing.length) console.log('UNPARSED ENEMY CARDS:\n ' + missing.join('\n '));

const classes = only ? [only] : Object.keys(CB.CLASSES);
const keys = Object.keys(DATA.enemies);
const out = {};
for (const level of levels) {
  console.log(`\n=== Map level +${level}, solo, starter deck + ${gearR} gear, ${N} fights each ===`);
  console.log('enemy'.padEnd(30) + classes.map(c => c.padStart(22)).join(''));
  for (const k of keys) {
    const e = DATA.enemies[k];
    let row = (`T${e.tier} ${e.name}`).slice(0, 29).padEnd(30);
    for (const cls of classes) {
      let win = 0, taken = 0, rounds = 0, errors = 0;
      for (let i = 0; i < N; i++) {
        const cb = fight({ cls, enemies: [k], level, seed: 7000 + i, data: DATA, tune, gear: CB.presetGear(cls, gearR) });
        if (cb.over === 'win') { win++; rounds += cb.round; }
        taken += cb.stats.taken;
        if (cb.log.some(l => /NaN|undefined/.test(l.text)) || !Number.isFinite(cb.player.hp)) errors++;
      }
      const s = `${Math.round(100 * win / N)}% ${win ? (rounds / win).toFixed(1) + 'r' : '  -'} ${Math.round(taken / N)}hp${errors ? ' ERR' + errors : ''}`;
      row += s.padStart(22);
      (out[level] = out[level] || {})[k + '|' + cls] = { win: win / N, rounds: win ? rounds / win : null, taken: taken / N };
    }
    console.log(row);
  }
}
fs.writeFileSync(__dirname + '/sim_results.json', JSON.stringify(out));
