// test helpers for the Shaman (tools/shaman/test.js)
global.window = global; require('../../src/data.js'); const D = window.CB_DATA; const CB = require('../../src/engine.js');
let n = 0;
function mk(o) { o = o || {}; const gear = (o.gear || CB.STARTER_GEAR.Shaman).slice(); if (o.codex) gear.push(CB.makeCodex(D, Math.random, o.codex, 0));
  const party = [{ cls: 'Shaman', name: 'Sha', gear, deck: o.deck || [['sh_mace_strike', 30]], talents: o.talents }].concat(o.allies || []);
  const cb = new CB.Combat({ party, enemies: o.enemies || ['mercenary_sergeant'], seed: o.seed || 7, data: D, partyStep: 0, level: o.level || 0 });
  if (!cb.round) cb.startRound(); let g = 0; while (cb.phase !== 'player' && !cb.over && g++ < 50) cb.runEnemies();
  const p = cb.players[0]; cb.player = p; p.mana = 500; p.maxMana = 500; p.hp = p.maxHp = o.hp || 5000; for (const e of cb.enemies) { e.hp = e.maxHp = o.ehp || 100000; e.block = 0; } if (o.mh != null) p.multiHit = o.mh; if (o.mc != null) p.multicast = o.mc; p.crit = 0; p.multiplay = 0;
  return cb; }
function give(cb, key, who) { const p = who || cb.players[0]; const c = { uid: 't' + (n++), key }; p.hand.push(c); return c; }
function play(cb, key, tgt) { const p = cb.players[0]; cb.player = p; p.mana = Math.max(p.mana, 500); const c = give(cb, key); const ok = cb.play(c.uid, tgt && tgt.id); if (!ok) throw new Error('could not play ' + key + ': ' + JSON.stringify(cb.canPlay(c))); return c; }
function endTurn(cb) { const p = cb.players[0]; cb.player = p; cb.endPlayerTurn(); let g = 0; while (cb.phase !== 'player' && !cb.over && g++ < 200) cb.runEnemies(); cb.player = p; }
const log = (cb, k) => cb.log.slice(-(k || 8)).map(l => l.text).join('\n');
module.exports = { CB, D, mk, give, play, endTurn, log };
