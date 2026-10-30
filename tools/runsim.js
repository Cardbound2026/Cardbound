// Whole-run sim: autopilot walks Map 1, picks paths, rests/extracts, buys gear. Usage: node runsim.js [N] [gear] [level]
const CB = require('../src/engine.js');
const { Run } = require('../src/run.js');
const { autopilot } = require('./autopilot.js');
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../src/data.js', 'utf8');
const DATA = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
const N = +(process.argv[2] || 100), gear = process.argv[3] || 'White', level = +(process.argv[4] || 0);

function choose(run) {
  const opts = run.reachable().map(k => run.map.nodes[k]);
  const hpf = run.hp / run.maxHp;
  const score = n => ({ rest: hpf < 0.7 ? 5 : 1, shrine: 3, merchant: run.gold >= 50 ? 3 : 1, fight: hpf > 0.4 ? 2 : 0.5, elite: hpf > 0.8 ? 2.5 : -2, boss: 9 }[n.type]);
  return opts.sort((a, b) => score(b) - score(a))[0].id;
}

function playRun(cls, seed) {
  const run = new Run({ cls, level, gearPreset: gear, seed, data: DATA });
  let guard = 0;
  while (!run.over && guard++ < 200) {
    if (run.combat) {
      const cb = run.combat; let g = 0;
      while (!cb.over && g++ < 3000) { if (cb.phase === 'enemy') cb.runEnemies(); else if (cb.phase === 'player') autopilot(cb); }
      run.finishCombat(); continue;
    }
    if (run.pending) {
      if (run.pending.type === 'rest') {
        const row = run.currentRow();
        // extract if low and the hard part is ahead, otherwise rest
        if (run.hp / run.maxHp < 0.45 && row >= 6) run.extract(); else run.rest();
      } else if (run.pending.type === 'merchant') {
        const st = run.pending.stock;
        st.forEach((it, i) => { const cur = run.gear.find(g => g.slot === run.slotFor(it)); if (run.gold >= it.price && (!cur || it.ilvl > (cur.ilvl || 0)) && ['Blue', 'Green'].includes(it.rarity)) run.buy(i); });
        run.closePending();
      } else run.closePending();
      continue;
    }
    run.enter(choose(run));
  }
  return run;
}

for (const cls of Object.keys(CB.CLASSES)) {
  const res = { victory: 0, extracted: 0, dead: 0 }; let rows = 0, items = 0, fights = 0; const deathRows = {}; let errors = 0;
  for (let i = 0; i < N; i++) {
    const run = playRun(cls, 9000 + i);
    res[run.over] = (res[run.over] || 0) + 1; rows += run.currentRow(); fights += run.fightsWon; items += run.kept ? run.kept.items.length : 0;
    if (run.over === 'dead') deathRows[run.currentRow()] = (deathRows[run.currentRow()] || 0) + 1;
    if (!run.over) errors++;
  }
  console.log(`${cls.padEnd(8)} ${gear} +${level}: boss kills ${res.victory}/${N}, extracted ${res.extracted}, died ${res.dead}${errors ? ', stuck ' + errors : ''} | avg furthest row ${(rows / N).toFixed(1)}, fights won ${(fights / N).toFixed(1)}, items kept ${(items / N).toFixed(1)} | deaths by row ${JSON.stringify(deathRows)}`);
}
