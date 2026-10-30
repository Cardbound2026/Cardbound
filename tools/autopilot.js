// Simple greedy autopilot used for headless balance tests. Not used by the game itself.
const CB = require('../src/engine.js');
const { CARDS } = CB;

function incoming(cb) {
  const p = cb.player;
  const after = cb.order.slice(cb.turnIndex + 1).map(id => cb.actorById(id)).filter(a => a && !a.isPlayer && a.hp > 0);
  let dmg = 0, targeted = 0;
  for (const e of after) for (const uid of e.plan) {
    const c = e.hand.find(x => x.uid === uid); if (!c) continue;
    for (const op of c.ops) if (op.op === 'damage' || op.op === 'execute') {
      const v = (op.n || op.low) * (op.times || 1) * cb.dmgMult * (1 + (e.strength + e.strTurn) / 100) * (1 + cb.pressure()) * (1 - Math.min(75, p.resist[c.dtype] || 0) / 100);
      dmg += v; if (!op.all) targeted += v;
    }
  }
  return { dmg: Math.round(dmg), targeted: Math.round(targeted) };
}

function value(cb, c, inc) {
  const d = CARDS[c.key], p = cb.player, t = d.tags || {};
  const alive = cb.alive();
  const target = alive.slice().sort((a, b) => a.hp - b.hp)[0];
  const need = Math.max(0, inc.dmg - p.block);
  const statMult = d.type === 'Attack' ? 1 + (p.strength + p.strTurn + p.strCombat) / 100 : 1 + p.intelligence / 100;
  let v = 0;
  if (t.dmg) {
    let dmg = t.dmg * statMult * (t.aoe ? alive.length : 1);
    if (t.execute && target && target.hp < target.maxHp * 0.3) dmg = t.execute * statMult;
    if (d.type === 'Attack' && p.nextAttackMult > 1) dmg *= p.nextAttackMult;
    if (d.type === 'Skill' && p.nextSkillMult > 1) dmg *= p.nextSkillMult;
    if (target) dmg = Math.min(dmg, target.hp + target.block + 5) + (t.aoe ? 0 : 0);
    v += dmg;
  }
  if (t.dot) v += t.dot * 0.5;
  if (t.chill) v += 3;
  if (t.def) v += Math.min(t.def * (1 + p.dexterity / 100), need) * 1.15 + (need > 0 ? 0 : t.def * 0.15);
  if (t.heal) v += Math.min(t.heal, p.maxHp - p.hp) * (p.hp < p.maxHp * 0.7 ? 1.2 : 0.3);
  if (t.hide) v += inc.targeted >= 18 && !p.stealth ? inc.targeted * 1.3 : -1;
  if (t.setup === 'attack') { const best = Math.max(0, ...p.hand.filter(x => x !== c && CARDS[x.key].type === 'Attack').map(x => (CARDS[x.key].tags.dmg || 0))); v += p.mana - d.cost >= 10 ? best * statMult : -1; }
  if (t.setup === 'skill') { const best = Math.max(0, ...p.hand.filter(x => x !== c && CARDS[x.key].type === 'Skill').map(x => (CARDS[x.key].tags.dmg || 0))); v += p.mana - d.cost >= 10 ? best * 0.5 * statMult : -1; }
  if (t.setup === 'str') v += 0.2 * p.hand.filter(x => CARDS[x.key].type === 'Attack').reduce((s, x) => s + (CARDS[x.key].tags.dmg || 0), 0) + 3;
  if (t.mana) v += 7;
  if (t.fever) v += p.attackedThisRound ? 30 : -1;
  if (t.clear) v += 0.5;
  if (t.draw) v += 3;
  return v;
}

function autopilot(cb) {
  const p = cb.player; let guard = 0;
  while (cb.phase === 'player' && !cb.over && guard++ < 40) {
    const inc = incoming(cb);
    const playable = p.hand.filter(c => cb.canPlay(c).ok);
    let best = null, bestScore = 0;
    for (const c of playable) { const d = CARDS[c.key]; const v = value(cb, c, inc); const s = v / Math.max(d.cost || 0, 5); if (v > 0 && s > bestScore) { best = c; bestScore = s; } }
    if (!best) break;
    const target = cb.alive().slice().sort((a, b) => a.hp - b.hp)[0];
    cb.play(best.uid, target && target.id);
  }
  cb.endPlayerTurn();
}

function fight(opts) {
  const cb = new CB.Combat(opts);
  let g = 0;
  while (!cb.over && g++ < 3000) { if (cb.phase === 'enemy') cb.runEnemies(); else if (cb.phase === 'player') autopilot(cb); }
  return cb;
}
module.exports = { autopilot, fight, incoming };
