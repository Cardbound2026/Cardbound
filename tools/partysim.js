// Party fight sim: same enemy groups at party sizes 1-4. Usage: node partysim.js N step
const CB = require('../src/engine.js'); const { autopilot } = require('./autopilot.js'); const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../src/data.js', 'utf8'); const D = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
const N = +(process.argv[2] || 40), step = process.argv[3] != null ? +process.argv[3] : 0.7;
const ORDER = ['Warrior', 'Mage', 'Rogue', 'Paladin'];
const groups = { 'tier 1 pair': ['deserter', 'scrap_hound'], 'tier 2 pair': ['bandit_cutthroat', 'dire_wolf'], 'tier 3': ['pit_duelist'], 'elite': ['sergeant_ironjaw'], 'boss': ['warlord_gorrath_the_iron_tide'] };
for (const [gname, en] of Object.entries(groups)) {
  const row = [];
  for (let n = 1; n <= 4; n++) {
    let wins = 0, lost = 0, rounds = 0, deaths = 0;
    for (let i = 0; i < N; i++) {
      const party = ORDER.slice(0, n).map((cls, k) => ({ cls: ORDER[(k + i) % 4] }));
      const gear = n === 1 ? undefined : undefined;
      const cb = new CB.Combat({ party, enemies: en, level: 0, seed: 100 + i, data: D, partyStep: step });
      let g = 0; while (!cb.over && g++ < 8000) { if (cb.phase === 'enemy') cb.runEnemies(); else if (cb.phase === 'player') autopilot(cb); else break; }
      if (cb.over === 'win') wins++; rounds += cb.round;
      for (const p of cb.players) { lost += (p.maxHp - Math.max(0, p.hp)) / p.maxHp; if (p.dead) deaths++; }
    }
    row.push(`${n}p: win ${Math.round(100 * wins / N)}% HP lost/hero ${Math.round(100 * lost / (N * n))}% deaths/fight ${(deaths / N).toFixed(2)} rounds ${(rounds / N).toFixed(1)}`);
  }
  console.log(gname.padEnd(12), row.join(' | '));
}
