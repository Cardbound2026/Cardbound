// Shaman test suite (Nov 14): node tools/shaman/test.js
// One check or more for every one of the 137 Shaman cards, the six codex passives and the talent hooks, then random fights (solo, party, duel)
// with every codex and talent column to catch crashes. Exits 1 if anything fails.
const { CB, D, mk, give, play, endTurn, log } = require('./h.js');
const C = CB.CARDS, X = require('../../src/shaman.js').X;
let pass = 0; const fails = [], done = new Set();
const T = (name, fn) => { for (const k of name.split(/[ ,]+/)) if (C['sh_' + k]) done.add('sh_' + k); try { fn(); pass++; } catch (e) { fails.push(name + ': ' + (e && e.message || e)); } };
const ok = (c, m) => { if (!c) throw new Error(m || 'check failed'); };
const eq = (a, b, m) => { if (a !== b) throw new Error((m || 'expected') + ': got ' + JSON.stringify(a) + ', wanted ' + JSON.stringify(b)); };
const near = (a, b, tol, m) => { if (Math.abs(a - b) > (tol == null ? 1 : tol)) throw new Error((m || 'expected about') + ': got ' + a + ', wanted ' + b); };
const E3 = ['mercenary_sergeant', 'deserter', 'deserter'];
const fresh = (o) => { const cb = mk(Object.assign({ mh: 0, mc: 0 }, o || {})); const p = cb.players[0], e = cb.enemies[0]; return { cb, p, e, es: cb.enemies, dmg: (x) => (x || e).maxHp - (x || e).hp }; };
const rngSeq = (cb, vals) => { const q = vals.slice(); cb.rng = () => (q.length ? q.shift() : 0.999); };
const hit1 = (key, o) => { const f = fresh(o); play(f.cb, key, f.e); return f; };
const pw = (cb, key) => play(cb, 'sh_' + key);
const enemyHits = (cb, p, e, n) => { cb.player = p; return cb.enemyHit(e, n, 'Test Swing', 'Physical'); };

// ---------- lightning spells
T('lightning_bolt', () => { const f = hit1('sh_lightning_bolt'); eq(f.e.static, 2); ok(f.dmg() >= 6); });
T('jolt', () => { const f = hit1('sh_jolt'); eq(f.e.static, 3); ok(f.dmg() >= 4); });
T('static_charge', () => { const f = fresh(); const h = f.p.hand.length; play(f.cb, 'sh_static_charge', f.e); eq(f.e.static, 4); eq(f.p.hand.length, h + 1, 'draws a card'); });
T('forked_bolt', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_forked_bolt'); eq(f.es.filter(x => x.static === 2).length, 2, 'two enemies get 2 Static'); eq(f.es.filter(x => x.hp < x.maxHp).length, 2); });
T('chain_lightning', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_chain_lightning'); ok(f.es.every(x => x.static === 2 && x.hp < x.maxHp)); });
T('lightning_cloud', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_lightning_cloud'); endTurn(f.cb); ok(f.es.every(x => x.static === 1) && f.es.some(x => x.hp < x.maxHp), 'first tick'); endTurn(f.cb); endTurn(f.cb); ok(f.es.every(x => x.static === 3), 'three ticks'); endTurn(f.cb); ok(f.es.every(x => x.static === 3), 'ends after 3 turns'); });
T('ball_lightning', () => { const f = fresh({ mc: 100 }); const c = play(f.cb, 'sh_ball_lightning', f.e); eq(f.e.static, 4, 'base and Multicast'); ok(f.p.hand.includes(c), 'returns to hand'); const g = fresh(); const c2 = play(g.cb, 'sh_ball_lightning', g.e); ok(!g.p.hand.includes(c2), 'no Multicast: stays in discard'); });
T('arc', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_arc', f.e); eq(f.es.filter(x => x.hp < x.maxHp).length, 1, 'no Static: one target'); f.e.static = 1; play(f.cb, 'sh_arc', f.e); eq(f.es.filter(x => x.hp < x.maxHp).length, 2, 'with Static: jumps'); });
T('thunderhead', () => { const f = fresh(); play(f.cb, 'sh_thunderhead'); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 4, 'doubled'); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 6, 'only the next one'); });
T('lightning_burst', () => { const f = hit1('sh_lightning_burst'); eq(f.e.static || 0, 0); f.e.static = 5; play(f.cb, 'sh_lightning_burst', f.e); eq(f.e.static, 8); });
T('thunderfall', () => { const f = hit1('sh_thunderfall'); const a = f.dmg(); const g = fresh(); g.e.stunTurns = 1; play(g.cb, 'sh_thunderfall', g.e); near(g.dmg(), a * 2, 2, 'double on a Stunned target'); });
T('skys_wrath', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_skys_wrath'); ok(f.es.every(x => x.static === 4 && x.hp < x.maxHp)); });
T('stormcall', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_stormcall'); eq(f.es.reduce((s, x) => s + (x.static || 0), 0), 3); });
T('tempest_lance', () => { const a = hit1('sh_tempest_lance').dmg(); const g = fresh(); g.e.static = 10; play(g.cb, 'sh_tempest_lance', g.e); eq(g.e.static, 10, 'not consumed'); near(g.dmg() / a, 60 / 40, 0.05, '+2 a Static'); });
T('heavens_fall', () => { const f = fresh({ enemies: E3 }); f.es[0].static = 5; f.es[1].static = 3; f.es[2].static = 2; play(f.cb, 'sh_heavens_fall'); ok(f.es.every(x => !x.static), 'all consumed'); ok(f.es.every(x => x.maxHp - x.hp >= 40), '4 x 10 to each'); });
T('thousand_volts', () => { const f = hit1('sh_thousand_volts'); eq(f.e.static, Math.floor(f.dmg() / 3)); });
T('thunder_without_end', () => { const f = fresh(); f.p.discard.push({ uid: 'd1', key: 'sh_lightning_bolt' }, { uid: 'd2', key: 'sh_jolt' }, { uid: 'd3', key: 'sh_mace_strike' }); const c = play(f.cb, 'sh_thunder_without_end', f.e); eq(f.e.static, 5, 'Bolt and Jolt cast again'); ok(f.p.exhaust.includes(c), 'exhausts'); });
// ---------- Static payoffs
T('electrocute', () => { const f = fresh(); f.e.static = 9; play(f.cb, 'sh_electrocute', f.e); eq(f.e.static, 9, 'needs 10'); ok(!f.e.stunTurns); f.e.static = 16; play(f.cb, 'sh_electrocute', f.e); eq(f.e.static, 6); eq(f.e.stunTurns, 1); const hp = f.p.hp; endTurn(f.cb); eq(f.p.hp, hp, 'the Stunned enemy does nothing'); eq(f.e.stunTurns, 0);
  const g = fresh(); g.e.static = 20; g.cb.raidBoss = () => true; play(g.cb, 'sh_electrocute', g.e); eq(g.e.static, 20, 'raid boss keeps its Static'); ok(!g.e.stunTurns, 'raid boss is not Stunned'); });
T('mass_electrocute', () => { const f = fresh({ enemies: E3 }); f.es[0].static = 25; f.es[1].static = 10; f.es[2].static = 5; play(f.cb, 'sh_mass_electrocute'); eq(f.es.map(x => x.stunTurns || 0).join(), '2,1,0'); eq(f.es.map(x => x.static || 0).join(), '0,0,5'); const hp = f.p.hp; endTurn(f.cb); eq(f.es[0].stunTurns, 1, 'two turns for 25 Static'); endTurn(f.cb); eq(f.es[0].stunTurns, 0); });
T('discharge', () => { const f = fresh(); f.e.static = 6; play(f.cb, 'sh_discharge', f.e); eq(f.e.static, 0); ok(f.dmg() >= 18); });
T('electric_burn', () => { const f = fresh(); f.e.static = 10; play(f.cb, 'sh_electric_burn', f.e); eq(f.e.static, 0); eq(f.e.burn, 50, '10 Static = 50 Burn'); const hp = f.e.hp; endTurn(f.cb); ok(hp - f.e.hp >= 45, 'the Burn ticks'); const g = fresh(); play(g.cb, 'sh_electric_burn', g.e); eq(g.e.burn || 0, 0, 'no Static, no Burn'); eq(C.sh_electric_burn.rarity + C.sh_electric_burn.cost, 'Blue20'); });
T('grounded', () => { const f = fresh(); f.e.static = 7; play(f.cb, 'sh_grounded', f.e); ok(f.p.block >= 7); eq(f.e.static, 7); });
T('short_circuit', () => { const f = fresh(); f.e.static = 4; play(f.cb, 'sh_short_circuit', f.e); eq(f.e.static, 4); f.e.static = 7; play(f.cb, 'sh_short_circuit', f.e); eq(f.e.static, 2); eq(f.e.costUp, 20); });
T('feedback', () => { const f = fresh(); f.e.static = 9; f.e.mana = 100; play(f.cb, 'sh_feedback', f.e); eq(f.e.static, 3); eq(f.e.mana, 70); });
T('conduit', () => { const f = fresh({ enemies: E3 }); f.e.static = 5; play(f.cb, 'sh_conduit', f.e); eq(f.e.static, 0); eq(f.es.slice(1).reduce((s, x) => s + (x.static || 0), 0), 7); const g = fresh(); g.e.static = 3; play(g.cb, 'sh_conduit', g.e); eq(g.e.static, 5, 'alone: +2'); });
T('supercharge', () => { const f = fresh(); f.e.static = 4; play(f.cb, 'sh_supercharge', f.e); eq(f.e.static, 8); f.e.static = 15; play(f.cb, 'sh_supercharge', f.e); eq(f.e.static, 25); });
T('bottled_lightning', () => { const base = hit1('sh_lightning_bolt').dmg(); const f = fresh(); f.e.static = 5; play(f.cb, 'sh_bottled_lightning', f.e); eq(f.e.static, 0); eq(f.p.turn.skillFlat, 20); play(f.cb, 'sh_lightning_bolt', f.e); ok(f.dmg() > base + 15, 'the next spell hits harder'); });
T('lightning_rod', () => { const f = fresh({ enemies: E3 }); const c = play(f.cb, 'sh_lightning_rod', f.es[0]); ok(f.p.exhaust.includes(c)); play(f.cb, 'sh_jolt', f.es[1]); eq(f.es[1].static, 3); eq(f.es[0].static, 3, 'the rod gets it too'); play(f.cb, 'sh_jolt', f.es[0]); eq(f.es[0].static, 6, 'no double on the rod itself'); });
// ---------- Static and Multicast Powers
T('charged_air', () => { const f = fresh({ enemies: E3 }); pw(f.cb, 'charged_air'); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 3); play(f.cb, 'sh_chain_lightning'); eq(f.es[1].static, 3); play(f.cb, 'sh_mace_strike', f.es[2]); eq(f.es[2].static, 3, 'Attacks add none'); });
T('arc_flash', () => { const f = fresh(); pw(f.cb, 'arc_flash'); f.p.drawPile.push({ uid: 'el', key: 'sh_electrocute' }); f.e.static = 13; play(f.cb, 'sh_lightning_bolt', f.e); ok(f.p.hand.some(c => c.uid === 'el'), 'Electrocute comes to hand at 15'); const g = fresh(); pw(g.cb, 'arc_flash'); g.e.static = 14; play(g.cb, 'sh_jolt', g.e); ok(g.p.hand.some(c => c.key === 'sh_electrocute'), 'one is made if the deck has none'); });
T('voltage', () => { const a = hit1('sh_mace_strike').dmg(); const f = fresh(); pw(f.cb, 'voltage'); f.e.static = 10; play(f.cb, 'sh_mace_strike', f.e); near(f.dmg() / a, 1.2, 0.1, '10 Static: +20%'); const g = fresh(); pw(g.cb, 'voltage'); g.e.static = 50; play(g.cb, 'sh_mace_strike', g.e); near(g.dmg() / a, 1.4, 0.1, 'capped at +40%'); });
T('resonance', () => { const f = fresh({ mc: 100 }); pw(f.cb, 'resonance'); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 5, '2, then 2 + 1 on the Multicast'); });
T('aftershock', () => { const f = fresh({ mc: 50 }); pw(f.cb, 'aftershock'); rngSeq(f.cb, [0.6, 0.2]); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 4, 'second roll at 25% lands'); const g = fresh({ mc: 50 }); pw(g.cb, 'aftershock'); rngSeq(g.cb, [0.6, 0.3]); play(g.cb, 'sh_lightning_bolt', g.e); eq(g.e.static, 2, 'second roll misses'); });
T('echo_chamber', () => { const f = fresh(); pw(f.cb, 'echo_chamber'); eq(f.p.multicast, 15); });
T('rolling_echo', () => { const f = fresh({ mc: 100 }); pw(f.cb, 'rolling_echo'); rngSeq(f.cb, [0, 0.1]); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 6, 'three casts'); });
T('unbroken_circuit', () => { const f = fresh(); pw(f.cb, 'unbroken_circuit'); f.e.static = 6; play(f.cb, 'sh_discharge', f.e); eq(f.e.static, 3); f.e.static = 10; play(f.cb, 'sh_electrocute', f.e); eq(f.e.static, 5); eq(f.e.stunTurns, 1); });
T('perfect_storm', () => { const f = fresh({ enemies: E3 }); pw(f.cb, 'perfect_storm'); play(f.cb, 'sh_lightning_bolt', f.e); ok(f.es.every(x => x.hp < x.maxHp), 'splashes'); near((f.es[1].maxHp - f.es[1].hp) * 2, f.dmg(), 1, 'for half'); play(f.cb, 'sh_mace_strike', f.e); });
T('focus_the_storm', () => { const f = fresh(); play(f.cb, 'sh_focus_the_storm'); eq(f.p.turn.mcNext, 30); rngSeq(f.cb, [0.2]); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 4, 'Multicast at 30%'); eq(f.p.turn.mcNext, 0, 'spent'); });
T('thunders_echo', () => { const f = fresh(); play(f.cb, 'sh_lightning_bolt', f.e); const a = f.dmg(); play(f.cb, 'sh_thunders_echo', f.e); eq(f.e.static, 4); near(f.dmg() - a, a / 2, 1, 'half strength'); });
// ---------- mace Attacks
T('mace_strike', () => { ok(hit1('sh_mace_strike').dmg() >= 10); });
T('twin_strike', () => { const f = hit1('sh_twin_strike'); ok(f.dmg() >= 10); eq(f.cb.log.filter(l => /Twin Strike hits/.test(l.text)).length, 2); });
T('backswing', () => { const f = fresh({ mh: 100 }); const h = f.p.hand.length; play(f.cb, 'sh_backswing', f.e); eq(f.p.hand.length, h + 1); const g = fresh(); const h2 = g.p.hand.length; play(g.cb, 'sh_backswing', g.e); eq(g.p.hand.length, h2); });
T('shield_rap', () => { const f = hit1('sh_shield_rap'); ok(f.dmg() >= 6 && f.p.block >= 5); });
T('sweeping_maces', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_sweeping_maces'); ok(f.es.every(x => x.hp < x.maxHp)); });
T('charged_blow', () => { const f = hit1('sh_charged_blow'); eq(f.e.static, 2); ok(f.dmg() >= 18); ok(f.cb.log.some(l => /Charged Blow hits.*Nature|Charged Blow hits/.test(l.text))); });
T('hammer_and_anvil', () => { ok(hit1('sh_hammer_and_anvil').dmg() >= 18); });
T('rolling_thunder', () => { const f = hit1('sh_rolling_thunder'); eq(f.p.turn.mhPlus, 20); rngSeq(f.cb, [0.15]); play(f.cb, 'sh_mace_strike', f.e); eq(f.cb.log.filter(l => /Mace Strike hits/.test(l.text)).length, 2, 'the +20% makes the next Attack Multi-hit'); });
T('crackling_swing', () => { const f = fresh(); play(f.cb, 'sh_mace_strike', f.e); play(f.cb, 'sh_mace_strike', f.e); play(f.cb, 'sh_crackling_swing', f.e); eq(f.e.static, 3); });
T('skull_ringer', () => { const f = hit1('sh_skull_ringer'); ok(f.e.sh.deaf > 0); const a = fresh(); const d0 = enemyHits(a.cb, a.p, a.e, 100); const d1 = enemyHits(f.cb, f.p, f.e, 100); near(d1 / d0, 0.85, 0.02, 'Deafened hits for 15% less'); });
T('knee_breaker', () => { const f = fresh(); f.e.block = 500; play(f.cb, 'sh_knee_breaker', f.e); ok(f.e.sh.unsteady > 0); ok(f.dmg() >= 8, 'Block stops nothing'); play(f.cb, 'sh_mace_strike', f.e); ok(f.dmg() >= 18); });
T('windmill', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_windmill'); ok(f.es.every(x => x.maxHp - x.hp >= 12)); });
T('crashing_thunder', () => { const f = fresh({ enemies: E3, mh: 100 }); play(f.cb, 'sh_crashing_thunder'); ok(f.es.every(x => x.static === 2)); const g = fresh({ enemies: E3 }); play(g.cb, 'sh_crashing_thunder'); ok(g.es.every(x => !x.static)); });
T('spellstrike', () => { const f = fresh(); play(f.cb, 'sh_lightning_bolt', f.e); play(f.cb, 'sh_spellstrike', f.e); eq(f.e.static, 4, 'the bolt is cast again'); });
T('stormbreaker', () => { const f = fresh(); f.e.static = 6; play(f.cb, 'sh_stormbreaker', f.e); eq(f.e.static, 1); ok(f.dmg() >= 41); const g = hit1('sh_stormbreaker'); ok(g.dmg() < f.dmg()); });
T('echoing_blow', () => { const f = fresh({ mh: 50 }); rngSeq(f.cb, [0.7]); play(f.cb, 'sh_echoing_blow', f.e); eq(f.cb.log.filter(l => /Echoing Blow hits/.test(l.text)).length, 2, '50% doubled'); const g = fresh({ mh: 50 }); rngSeq(g.cb, [0.7]); play(g.cb, 'sh_mace_strike', g.e); eq(g.cb.log.filter(l => /Mace Strike hits/.test(l.text)).length, 1); });
T('relentless', () => { const f = fresh({ mh: 100 }); const c = play(f.cb, 'sh_relentless', f.e); ok(f.p.hand.includes(c), 'returns'); f.cb.play(c.uid, f.e.id); ok(!f.p.hand.includes(c), 'only once a turn'); });
T('tempest', () => { const f = hit1('sh_tempest'); eq(f.cb.log.filter(l => /Tempest hits/.test(l.text)).length, 2); });
T('thunder_king', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_thunder_king'); ok(f.es.every(x => x.maxHp - x.hp >= 36)); });
T('hundred_blows', () => { const f = fresh(); f.p.mana = 30; const c = give(f.cb, 'sh_hundred_blows'); f.cb.play(c.uid, f.e.id); eq(f.cb.log.filter(l => /Hundred Blows.*hits/.test(l.text) || /hits .* Hundred Blows|Hundred Blows[^:]*$/.test(l.text) && /damage/.test(l.text)).length >= 10, true); eq(f.p.mana, 0);
  const g = fresh({ mh: 0 }); g.p.mana = 31; g.p.multiHit = 100; g.cb.rng = (() => { let i = 0; return () => (i++ === 0 ? 0.999 : 0.5); })(); const h0 = g.e.hp; const c2 = give(g.cb, 'sh_hundred_blows'); g.cb.play(c2.uid, g.e.id); ok(g.cb.log.some(l => /10 hits, 10 more from Multi-hit/.test(l.text)), 'each hit rolls: ' + g.cb.log.slice(-3).map(l => l.text).join(' | ')); ok(g.e.multiN >= 10, 'call-out'); });
T('thunder_gods_hammer', () => { const f = fresh({ mh: 100 }); play(f.cb, "sh_thunder_gods_hammer", f.e); eq(f.e.stunTurns, 1); const g = hit1('sh_thunder_gods_hammer'); ok(!g.e.stunTurns); });
T('gale_fury', () => { const f = fresh(); pw(f.cb, 'gale_fury'); eq(f.p.multiHit, 20); });
T('rain_of_maces', () => { const f = fresh({ enemies: E3, mh: 100 }); pw(f.cb, 'rain_of_maces'); play(f.cb, 'sh_mace_strike', f.e); eq(f.es.filter(x => x.hp < x.maxHp).length, 2); });
// ---------- hybrid bridges
T('lightning_weapon', () => { const f = fresh(); play(f.cb, 'sh_lightning_weapon'); eq(f.p.shLW, 3); play(f.cb, 'sh_mace_strike', f.e); eq(f.e.static, 1); eq(f.p.shLW, 2); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.p.shLW, 2, 'spells do not use a charge'); });
T('flame_weapon', () => { const a = hit1('sh_mace_strike').dmg(); const f = fresh(); play(f.cb, 'sh_flame_weapon'); eq(f.p.shFW, 3); play(f.cb, 'sh_mace_strike', f.e); eq(f.e.burn, 1); eq(f.p.shFW, 2); ok(f.dmg() > a, 'extra Fire damage'); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.p.shFW, 2, 'spells do not use a charge'); for (let i = 0; i < 3; i++) play(f.cb, 'sh_mace_strike', f.e); eq(f.e.burn, 3, 'three Attacks only'); });
T('frost_weapon', () => { const f = fresh(); play(f.cb, 'sh_frost_weapon'); play(f.cb, 'sh_mace_strike', f.e); eq(f.e.chill, 1); eq(f.p.shIW, 2); play(f.cb, 'sh_lightning_weapon'); play(f.cb, 'sh_flame_weapon'); play(f.cb, 'sh_mace_strike', f.e); eq([f.e.chill, f.e.burn, f.e.static].join(), '2,1,1', 'all three imbues stack'); });
T('surge', () => { const f = fresh(); play(f.cb, 'sh_mace_strike', f.e); play(f.cb, 'sh_mace_strike', f.e); play(f.cb, 'sh_surge'); const c = give(f.cb, 'sh_chain_lightning'); eq(f.cb.costOf(f.p, C.sh_chain_lightning, c), 0); f.cb.play(c.uid); const c2 = give(f.cb, 'sh_chain_lightning'); eq(f.cb.costOf(f.p, C.sh_chain_lightning, c2), 20, 'only the next spell'); });
T('war_chant', () => { const f = fresh(); play(f.cb, 'sh_wind_step'); play(f.cb, 'sh_war_chant'); eq(f.p.nextAttackFlat, 10); });
T('storm_dance', () => { const f = fresh({ deck: [['sh_mace_strike', 15], ['sh_jolt', 15]] }); f.p.hand = [{ uid: 'a', key: 'sh_mace_strike' }, { uid: 'b', key: 'sh_jolt' }]; const m = f.p.mana; play(f.cb, 'sh_storm_dance'); eq(f.p.hand.length, 4); eq(f.p.mana, m - 10 + 10); });
T('stormcallers_rhythm', () => { const a = hit1('sh_lightning_bolt').dmg(); const f = fresh(); pw(f.cb, 'stormcallers_rhythm'); play(f.cb, 'sh_mace_strike', f.e); const d0 = f.dmg(); play(f.cb, 'sh_lightning_bolt', f.e); ok(f.dmg() - d0 > a, 'a Skill right after an Attack hits harder'); });
T('charged_maces', () => { const f = fresh(); pw(f.cb, 'charged_maces'); play(f.cb, 'sh_mace_strike', f.e); eq(f.e.static, 1); play(f.cb, 'sh_twin_strike', f.e); eq(f.e.static, 2, 'once a card'); });
T('overload', () => { const f = fresh(); play(f.cb, 'sh_overload'); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 4); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 6); });
T('double_time', () => { const f = fresh(); play(f.cb, 'sh_double_time'); play(f.cb, 'sh_mace_strike', f.e); eq(f.cb.log.filter(l => /Mace Strike hits/.test(l.text)).length, 2); });
T('thunder_mend', () => { const f = fresh(); f.p.hp = 100; play(f.cb, 'sh_thunder_mend', f.p); ok(f.p.hp > 100); eq(f.p.nextAttackFlat, 8); });
T('twin_soul', () => { const f = fresh({ mc: 200 }); pw(f.cb, 'twin_soul'); play(f.cb, 'sh_mace_strike', f.e); eq(f.cb.log.filter(l => /Mace Strike hits/.test(l.text)).length, 2, 'half of Multicast counts as Multi-hit'); });
T('twin_thunder', () => { const f = fresh({ codex: 'twinstorm' }); play(f.cb, 'sh_twin_thunder'); const mh0 = f.p.shMH || 0, mc0 = f.p.shMC || 0; play(f.cb, 'sh_mace_strike', f.e); ok((f.p.shMC || 0) > mc0 && (f.p.shMH || 0) >= mh0, 'an Attack counts as both'); });
T('ride_the_storm', () => { const f = fresh(); pw(f.cb, 'ride_the_storm'); play(f.cb, 'sh_mace_strike', f.e); const h = f.p.hand.length, m = f.p.mana; play(f.cb, 'sh_wind_step'); eq(f.p.hand.length, h + 2, 'Wind Step draws 1, Ride the Storm 1'); ok(f.cb.log.some(l => /Ride the Storm: draw 1 and \+10 mana/.test(l.text))); play(f.cb, 'sh_mace_strike', f.e); eq(f.p.hand.length, h + 2, 'once a turn'); });
T('storm_vessel', () => { const f = fresh({ codex: 'twinstorm' }); pw(f.cb, 'storm_vessel'); f.p.shMH = 100; play(f.cb, 'sh_mace_strike', f.e); eq(f.p.shMH, 50, 'halved, not emptied'); });
// ---------- heals
const hurt = (o) => { const f = fresh(o); f.p.hp = 1000; return f; };
T('mending_rain', () => { const f = hurt(); play(f.cb, 'sh_mending_rain', f.p); ok(f.p.hp >= 1008); });
T('cleansing_rain', () => { const f = hurt(); f.p.weak = 20; play(f.cb, 'sh_cleansing_rain', f.p); ok(f.p.hp >= 1005); ok(f.p.weak < 20); });
const ALLY = [{ cls: 'Warrior', name: 'War' }];
T('soothing_mist', () => { const f = hurt({ allies: ALLY }); const w = f.cb.players[1]; w.hp = 10; play(f.cb, 'sh_soothing_mist'); ok(f.p.hp > 1000 && w.hp > 10); });
T('rain_mend', () => { const f = hurt(); play(f.cb, 'sh_rain_mend', f.p); const h = f.p.hp; ok(h >= 1005); f.e.stunTurns = 9; endTurn(f.cb); ok(f.p.hp > h, 'heals again next turn'); });
T('leaping_mend', () => { const f = hurt({ allies: ALLY }); const w = f.cb.players[1]; w.hp = 10; play(f.cb, 'sh_leaping_mend', f.p); ok(f.p.hp >= 1010 && w.hp >= 15); });
T('living_lightning', () => { const f = hurt({ codex: 'rainbringer', mc: 100, enemies: E3 }); play(f.cb, 'sh_living_lightning', f.p); ok(f.es.every(x => x.static === 2), 'Chain Lightning on the Multicast'); const g = hurt({ enemies: E3 }); play(g.cb, 'sh_living_lightning', g.p); ok(g.es.every(x => !x.static)); });
T('storm_ward', () => { const f = fresh(); const a = enemyHits(f.cb, f.p, f.e, 100); play(f.cb, 'sh_storm_ward', f.p); const b = enemyHits(f.cb, f.p, f.e, 100); near(b / a, 0.7, 0.02); });
T('lifeline', () => { const f = fresh(); f.p.hp = 100; play(f.cb, 'sh_lifeline', f.p); ok(f.p.hp >= 130); const g = fresh(); g.p.hp = 3000; play(g.cb, 'sh_lifeline', g.p); ok(g.p.hp < 3030 && g.p.hp >= 3015); });
T('tidal_surge', () => { const f = hurt({ allies: ALLY }); const w = f.cb.players[1]; w.hp = 10; play(f.cb, 'sh_tidal_surge'); ok(f.p.hp >= 1012 && w.hp >= 22); });
T('wellspring', () => { const a = hurt(); play(a.cb, 'sh_mending_rain', a.p); const f = hurt(); pw(f.cb, 'wellspring'); play(f.cb, 'sh_mending_rain', f.p); ok(f.p.hp > a.p.hp, '20% stronger'); ok(f.p.block >= 3, 'gives defence'); });
T('rainmaker', () => { const f = hurt(); pw(f.cb, 'rainmaker'); f.e.stunTurns = 9; endTurn(f.cb); ok(f.p.hp >= 1006); });
T('monsoon', () => { const f = hurt({ allies: ALLY, mc: 100 }); const w = f.cb.players[1]; w.hp = 10; play(f.cb, 'sh_monsoon'); ok(f.p.hp >= 1020 && w.hp >= 30, 'each ally healed twice at 100% Multicast'); });
T('ancestral_echo', () => { const f = hurt({ codex: 'rainbringer', mc: 100 }); pw(f.cb, 'ancestral_echo'); play(f.cb, 'sh_mending_rain', f.p); ok(f.p.shFreeHeal); const c = give(f.cb, 'sh_tidal_surge'); eq(f.cb.costOf(f.p, C.sh_tidal_surge, c), 0); f.p.multicast = 0; f.cb.play(c.uid); ok(!f.p.shFreeHeal, 'spent'); });
T('last_light', () => { const f = fresh(); const c = play(f.cb, 'sh_last_light', f.p); f.p.hp = 5; f.p.block = 0; enemyHits(f.cb, f.p, f.e, 5000); eq(f.p.hp, 1); ok(f.p.exhaust.includes(c)); });
// ---------- debuffs and control
T('drench', () => { const a = hit1('sh_lightning_bolt').dmg(); const f = hit1('sh_drench'); ok(f.e.sh.soaked > 0); const d0 = f.dmg(); play(f.cb, 'sh_lightning_bolt', f.e); near((f.dmg() - d0) / a, 1.2, 0.2, 'Nature +20%'); });
T('weather_away', () => { const base = fresh({ enemies: ['spitting_toad'], level: 4 }); eq(base.e.type, 'Nature'); play(base.cb, 'sh_thunderfall', base.e); const f = fresh({ enemies: ['spitting_toad'], level: 4 }); play(f.cb, 'sh_weather_away', f.e); ok(f.e.sh.worn > 0); const d0 = f.dmg(); play(f.cb, 'sh_thunderfall', f.e); ok(f.dmg() - d0 > base.dmg(), 'resistance is lower'); });
T('shifting_ground', () => { const f = fresh(); const h = f.p.hand.length; play(f.cb, 'sh_shifting_ground', f.e); ok(f.e.sh.unsteady > 0); eq(f.p.hand.length, h + 1); });
T('siphon_charge', () => { const f = fresh(); f.e.mana = 50; play(f.cb, 'sh_siphon_charge', f.e); eq(f.e.mana, 40); eq(f.e.static, 2); });
T('thunder_roar', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_thunder_roar'); ok(f.es.every(x => x.sh.deaf > 0)); });
T('heavy_air', () => { const f = fresh(); const h = f.p.hand.length; play(f.cb, 'sh_heavy_air', f.e); eq(f.e.costUp, 10); eq(f.p.hand.length, h + 1); });
T('scatter', () => { const f = fresh(); const h = f.e.hand.length; ok(h > 0, 'enemy holds cards'); play(f.cb, 'sh_scatter', f.e); eq(f.e.hand.length, h - 1); });
T('brain_fog', () => { const f = fresh(); const n = f.e.drawPile.length; play(f.cb, 'sh_brain_fog', f.e); eq(f.e.drawPile.length, n + 2); });
T('thunderstruck', () => { const f = hit1('sh_thunderstruck'); ok(!f.e.silenced); const g = fresh(); play(g.cb, 'sh_skull_ringer', g.e); play(g.cb, 'sh_thunderstruck', g.e); eq(g.e.silenced, 1); });
T('toad_curse', () => { const f = hit1('sh_toad_curse'); eq(f.e.stunTurns, 1); eq(f.e.toad, 1); const hp = f.p.hp; endTurn(f.cb); eq(f.p.hp, hp); eq(f.e.toad, 0); });
T('mana_lock', () => { const f = hit1('sh_mana_lock'); eq(f.e.manaLock, 1); f.e.mana = 0; f.e.stunTurns = 0; endTurn(f.cb); eq(f.e.manaLock, 0); ok(f.cb.log.some(l => /gains no mana this turn/.test(l.text))); });
T('fray', () => { const f = fresh(); const n = f.e.drawPile.length; play(f.cb, 'sh_fray', f.e); eq(f.e.drawPile.length, Math.max(0, n - 2)); });
T('stolen_hour', () => { const f = fresh(); const c = play(f.cb, 'sh_stolen_hour', f.e); eq(f.e.stunTurns, 1); ok(f.p.exhaust.includes(c)); });
T('eye_of_the_hurricane', () => { const f = fresh(); pw(f.cb, 'eye_of_the_hurricane'); const c = give(f.cb, 'sh_chain_lightning'); eq(f.cb.costOf(f.p, C.sh_chain_lightning, c), 20); f.e.stunTurns = 1; eq(f.cb.costOf(f.p, C.sh_chain_lightning, c), 10); });
T('deluge', () => { const f = fresh({ enemies: E3 }); play(f.cb, 'sh_deluge'); ok(f.es.every(x => x.sh.soaked > 0 && x.sh.deaf > 0 && x.sh.unsteady > 0 && x.sh.worn > 0 && x.static === 3)); eq(X.debCount(f.e), 5); });
T('overcast', () => { const f = fresh({ enemies: E3 }); pw(f.cb, 'overcast'); for (const x of f.es) x.stunTurns = 5; endTurn(f.cb); ok(f.es.every(x => x.sh && x.sh.soaked > 0 && x.sh.deaf > 0 && x.sh.worn > 0)); });
// ---------- skipping a turn
const calm = (o) => { const f = fresh(Object.assign({ codex: 'calm_eye' }, o || {})); for (const x of f.es) x.stunTurns = 50; return f; };
T('held_breath', () => { const f = calm(); const r = f.cb.round; play(f.cb, 'sh_held_breath'); let g = 0; while (f.cb.phase !== 'player' && !f.cb.over && g++ < 50) f.cb.runEnemies(); ok(f.cb.round > r, 'the turn ended'); eq(f.p.shNextX, 2, 'did not count as acting'); f.cb.player = f.p; play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 4, 'next card twice'); eq(f.p.shNextX, 0); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 6); });
T('quiet_sky', () => { const f = calm(); pw(f.cb, 'quiet_sky'); endTurn(f.cb); eq(f.p.block, 0, 'a Power was played: that is acting'); endTurn(f.cb); ok(f.p.block >= 4, 'Guard from the idle turn (after fading)'); });
T('patience', () => { const f = calm(); pw(f.cb, 'patience'); endTurn(f.cb); endTurn(f.cb); const c = give(f.cb, 'sh_chain_lightning'); eq(f.cb.costOf(f.p, C.sh_chain_lightning, c), 10); });
T('calm_before_the_storm', () => { const f = calm(); pw(f.cb, 'calm_before_the_storm'); endTurn(f.cb); f.p.mana = 0; f.p.maxMana = 30; const d = f.p.draw; endTurn(f.cb); ok(f.p.mana >= 20 + 15, '20 extra mana'); eq(f.p.hand.length, d + 2, '2 extra cards'); });
T('coiled_storm', () => { const a = hit1('sh_mace_strike').dmg(); const f = calm(); pw(f.cb, 'coiled_storm'); endTurn(f.cb); endTurn(f.cb); eq(f.p.shCoil, 1); f.p.shNextX = 0; play(f.cb, 'sh_mace_strike', f.e); near(f.dmg() / a, 1.3, 0.1); eq(f.p.shCoil, 0); });
T('deep_listening', () => { const f = calm(); pw(f.cb, 'deep_listening'); endTurn(f.cb); const d = f.p.draw; endTurn(f.cb); eq(f.p.hand.length, d + 1, 'one extra card picked'); });
T('loaded_sky', () => { const f = calm({ enemies: E3 }); pw(f.cb, 'loaded_sky'); endTurn(f.cb); for (const x of f.es) x.mana = 30; endTurn(f.cb); ok(f.es.every(x => x.static === 2), 'Static'); });
T('gathering_storm', () => { const f = calm({ enemies: E3 }); pw(f.cb, 'gathering_storm'); endTurn(f.cb); endTurn(f.cb); ok(f.es.every(x => x.static === 3)); eq(f.p.shDmgUp, 5); });
T('the_long_wait', () => { const f = calm(); pw(f.cb, 'the_long_wait'); endTurn(f.cb); endTurn(f.cb); eq(f.p.shNextX, 2); endTurn(f.cb); eq(f.p.shNextX, 3); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 6, 'three times'); });
T('stillness', () => { const f = calm(); pw(f.cb, 'stillness'); endTurn(f.cb); endTurn(f.cb); eq(f.cb.pressSkip, 1); const g = calm(); pw(g.cb, 'stillness'); endTurn(g.cb); for (const x of g.es) x.stunTurns = 0; g.cb.player = g.p; g.cb.endPlayerTurn(); eq(g.p.until.lessDmg, 0.25); });
T('thunder_debt', () => { const f = calm(); f.p.hand = []; play(f.cb, 'sh_thunder_debt'); eq(f.p.hand.length, f.p.draw, 'a new hand'); eq(f.p.shSkip, 1); endTurn(f.cb); ok(f.p.turn.noAct, 'cannot act next turn'); const c = give(f.cb, 'sh_mace_strike'); ok(!f.cb.canPlay(c).ok); endTurn(f.cb); ok(!f.p.turn.noAct); ok(f.cb.canPlay(give(f.cb, 'sh_mace_strike')).ok); });
T('borrowed_thunder', () => { const f = fresh({ enemies: E3 }); const r = f.cb.round; const c = play(f.cb, 'sh_borrowed_thunder'); ok(f.es.every(x => x.stunTurns >= 1 || f.cb.round > r)); let g = 0; while (f.cb.phase !== 'player' && !f.cb.over && g++ < 50) f.cb.runEnemies(); f.cb.player = f.p; ok(f.p.turn.noAct, 'turn 1 skipped'); endTurn(f.cb); ok(f.p.turn.noAct, 'turn 2 skipped'); endTurn(f.cb); ok(!f.p.turn.noAct); eq(f.p.shNextX, 3); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 6); ok(f.p.exhaust.includes(c)); });
// ---------- defence and tank
T('ride_the_wind', () => { const f = fresh(); play(f.cb, 'sh_ride_the_wind'); ok(f.p.block >= 20 && f.p.block < 30); eq(C.sh_ride_the_wind.rarity + C.sh_ride_the_wind.cost, 'Green10'); });
T('become_the_storm', () => { const f = fresh(); play(f.cb, 'sh_become_the_storm'); ok(f.p.block >= 40 && f.p.block < 55); eq(C.sh_become_the_storm.rarity + C.sh_become_the_storm.cost, 'Blue20'); ok(/Gain 5\d Guard/.test(CB.rankedCard('sh_become_the_storm', 3).text), 'levels raise it'); });
T('wind_step', () => { const f = fresh(); const h = f.p.hand.length; play(f.cb, 'sh_wind_step'); ok(f.p.block >= 6); eq(f.p.hand.length, h + 1); });
T('stone_guard', () => { const f = fresh(); play(f.cb, 'sh_stone_guard'); ok(f.p.block >= 7 && f.p.block < 11); const g = fresh({ gear: CB.STARTER_GEAR.Shaman.filter(x => x.slot !== 'Off-hand').concat(CB.STARTER_GEAR.Warrior.filter(x => x.slot === 'Off-hand')) }); eq(g.p.defName, 'Block', 'a shield means Block'); play(g.cb, 'sh_stone_guard'); ok(g.p.block >= 11); });
T('dig_in', () => { const f = fresh(); play(f.cb, 'sh_dig_in'); ok(f.p.block >= 6); enemyHits(f.cb, f.p, f.e, 3); eq(f.e.static, 2); });
T('war_drum', () => { const a = hit1('sh_mace_strike').dmg(); const f = fresh(); play(f.cb, 'sh_war_drum'); eq(f.p.nextCardX, 1.2); play(f.cb, 'sh_mace_strike', f.e); near(f.dmg() / a, 1.2, 0.1); const g = fresh({ allies: ALLY }); play(g.cb, 'sh_war_drum'); eq(g.cb.players[1].nextCardX, 1.2); ok(!g.p.nextCardX); });
T('thunderous_challenge', () => { const f = fresh({ allies: ALLY }); play(f.cb, 'sh_thunderous_challenge'); ok(f.p.until.taunt); ok(f.p.block >= 6); });
T('thunder_wall', () => { const f = fresh(); play(f.cb, 'sh_thunder_wall'); ok(f.p.block >= 10); enemyHits(f.cb, f.p, f.e, 3); ok(f.e.sh && f.e.sh.deaf > 0); });
T('rallying_thunder', () => { const f = fresh({ allies: ALLY }); const s0 = f.p.strength, i0 = f.p.intelligence, w = f.cb.players[1], ws = w.strength; for (const x of f.es) x.stunTurns = 50; play(f.cb, 'sh_rallying_thunder'); eq(f.p.strength, s0 + 10); eq(f.p.intelligence, i0 + 10); eq(w.strength, ws + 10); for (let i = 0; i < 4; i++) { endTurn(f.cb); f.cb.player = w; if (f.cb.phase === 'player' && f.cb.current === w) { f.cb.endPlayerTurn(); let g = 0; while (f.cb.phase !== 'player' && !f.cb.over && g++ < 50) f.cb.runEnemies(); } } eq(f.p.strength, s0, 'wears off');
  const g = fresh({ codex: 'stormwarden' }); for (const x of g.es) x.stunTurns = 50; const gs = g.p.strength; play(g.cb, 'sh_rallying_thunder'); for (let i = 0; i < 5; i++) endTurn(g.cb); eq(g.p.strength, gs + 10, 'Stormwarden: never runs out'); });
T('stand_fast', () => { const f = fresh(); f.e.stunTurns = 9; play(f.cb, 'sh_wind_step'); const b = f.p.block; play(f.cb, 'sh_stand_fast'); endTurn(f.cb); eq(f.p.block, b, 'Guard did not fade'); endTurn(f.cb); ok(f.p.block < b, 'fades the turn after'); });
T('slip_the_bolt', () => { const f = fresh(); play(f.cb, 'sh_slip_the_bolt'); const hp = f.p.hp; enemyHits(f.cb, f.p, f.e, 500); eq(f.p.hp, hp); eq(f.e.static, 3); enemyHits(f.cb, f.p, f.e, 50); ok(f.p.hp < hp, 'only the next one'); });
T('stormfathers_ward', () => { const f = fresh({ allies: ALLY }); play(f.cb, 'sh_stormfathers_ward'); ok(f.p.block >= 8 && f.cb.players[1].block >= 8); });
T('unbowed', () => { const f = fresh(); pw(f.cb, 'unbowed'); f.p.block = 500; enemyHits(f.cb, f.p, f.e, 10); eq(f.e.static, 2); f.p.block = 0; enemyHits(f.cb, f.p, f.e, 10); eq(f.e.static, 2, 'only when fully stopped'); });
T('lightning_shield', () => { const f = fresh(); pw(f.cb, 'lightning_shield'); enemyHits(f.cb, f.p, f.e, 10); enemyHits(f.cb, f.p, f.e, 10); eq(f.e.static, 2); });
T('spirit_link', () => { const f = fresh({ allies: ALLY }); const w = f.cb.players[1]; w.maxHp = w.hp = 5000; w.block = 0; pw(f.cb, 'spirit_link'); const a = f.p.hp, b = w.hp; enemyHits(f.cb, f.p, f.e, 300); const la = a - f.p.hp, lb = b - w.hp; ok(la > 0 && lb > 0, 'both take damage'); near(la, lb, 2, 'an even split'); });
T('storms_aegis', () => { const f = fresh({ allies: ALLY }); const w = f.cb.players[1]; w.maxHp = w.hp = 5000; pw(f.cb, 'storms_aegis'); const a = f.p.hp; enemyHits(f.cb, w, f.e, 300); const taken = a - f.p.hp, wl = 5000 - w.hp; ok(taken > 0, 'the Shaman takes a share'); near(taken / (taken + wl), 0.1, 0.03); for (const x of f.es) x.stunTurns = 9; f.p.block = 0; endTurn(f.cb); f.cb.player = w; });
// ---------- draw and mana
T('gathering_clouds', () => { const f = fresh(); const h = f.p.hand.length; play(f.cb, 'sh_gathering_clouds'); eq(f.p.hand.length, h + 2); });
T('tailwind', () => { const f = fresh(); const h = f.p.hand.length; play(f.cb, 'sh_tailwind'); eq(f.p.hand.length, h + 1); const c = give(f.cb, 'sh_chain_lightning'); eq(f.cb.costOf(f.p, C.sh_chain_lightning, c), 10); f.cb.play(c.uid); eq(f.cb.costOf(f.p, C.sh_chain_lightning, give(f.cb, 'sh_chain_lightning')), 20); });
T('deep_breath', () => { const f = fresh(); const m = f.p.mana; const c = play(f.cb, 'sh_deep_breath'); eq(f.p.mana, m + 20); ok(f.p.exhaust.includes(c)); });
T('read_the_sky', () => { const f = fresh(); const h = f.p.hand.length; play(f.cb, 'sh_read_the_sky'); eq(f.p.hand.length, h + 1); });
T('squall', () => { const f = fresh(); f.p.hand = [{ uid: 'q1', key: 'sh_jolt' }, { uid: 'q2', key: 'sh_jolt' }]; play(f.cb, 'sh_squall'); eq(f.p.hand.length, 3); ok(!f.p.hand.some(c => c.uid === 'q1')); });
T('rainwell', () => { const f = fresh(); const r = f.p.regen; pw(f.cb, 'rainwell'); eq(f.p.regen, r + 5); });
T('ride_the_lightning', () => { const f = fresh({ enemies: E3 }); f.es[0].static = 1; f.es[1].static = 4; const h = f.p.hand.length; play(f.cb, 'sh_ride_the_lightning'); eq(f.p.hand.length, h + 2); });
T('storm_surge', () => { const f = fresh(); const h = f.p.hand.length, m = f.p.mana; const c = play(f.cb, 'sh_storm_surge'); eq(f.p.hand.length, h + 3); eq(f.p.mana, m - 20 + 20); ok(f.p.exhaust.includes(c)); });

// ---------- codexes
T('codex twinstorm', () => { const f = fresh({ codex: 'twinstorm' }); ok(f.cb.has(f.p, 'codex_twinstorm'), 'codex active'); play(f.cb, 'sh_mace_strike', f.e); eq(f.p.shMC, 10); play(f.cb, 'sh_wind_step'); eq(f.p.shMH, 10); f.p.shMH = 100; play(f.cb, 'sh_mace_strike', f.e); eq(f.p.shMH, 0, 'spent when it triggers'); eq(f.cb.log.filter(l => /Mace Strike hits/.test(l.text)).length, 3);
  const a = fresh(); a.p.intelligence = 100; a.p.strength = 0; play(a.cb, 'sh_mace_strike', a.e); const g = fresh({ codex: 'twinstorm' }); g.p.intelligence = 100; g.p.strength = 0; play(g.cb, 'sh_mace_strike', g.e); near(g.dmg() / a.dmg(), 1.5, 0.1, 'half of Intelligence counts for Attacks'); });
T('codex rainbringer', () => { const f = hurt({ codex: 'rainbringer', mc: 100 }); play(f.cb, 'sh_mending_rain', f.p); ok(f.p.shSure, 'a heal Multicast arms the sure Multi-hit'); f.p.multiHit = 100; rngSeq(f.cb, [0.5, 0.5, 0.5]); play(f.cb, 'sh_mace_strike', f.e); eq(f.cb.log.filter(l => /Mace Strike hits/.test(l.text)).length, 3, 'own Multi-hit becomes a third hit'); ok(!f.p.shSure); const g = hurt({ mc: 100 }); play(g.cb, 'sh_mending_rain', g.p); ok(!g.p.shSure, 'heals do not Multicast without the codex'); ok(g.p.hp < 1012); });
T('codex stormcaller', () => { const a = hit1('sh_lightning_bolt').dmg(); const f = fresh({ codex: 'stormcaller', mc: 100 }); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 6, 'three casts'); near(f.dmg() / a, 2.5, 0.2, 'the third at half strength'); });
T('codex skybreaker', () => { const f = fresh({ codex: 'skybreaker', mh: 100 }); play(f.cb, 'sh_mace_strike', f.e); eq(f.e.static || 0, 0, 'no Skill played yet'); f.p.multiHit = 0; play(f.cb, 'sh_lightning_bolt', f.e); f.p.multiHit = 100; play(f.cb, 'sh_mace_strike', f.e); eq(f.e.static, 4, 'the bolt is played again on a Multi-hit');
  f.p.multiHit = 0; play(f.cb, 'sh_wind_step'); const b = f.p.block, h = f.p.hand.length; f.p.multiHit = 100; play(f.cb, 'sh_mace_strike', f.e); ok(f.p.block > b && f.p.hand.length === h + 1, 'any Skill: Wind Step gives Guard and a card again'); eq(f.e.static, 4, 'and the bolt is no longer the one repeated');
  const g = fresh({ codex: 'skybreaker', mh: 0 }); for (const x of g.es) x.stunTurns = 9; play(g.cb, 'sh_jolt', g.e); g.p.shLastAny && eq(g.p.shLastAny.key, 'sh_jolt'); play(g.cb, 'sh_held_breath'); let k = 0; while (g.cb.phase !== 'player' && !g.cb.over && k++ < 50) g.cb.runEnemies(); eq(g.p.shLastAny.key, 'sh_jolt', 'Held Breath is never the repeated Skill'); });
T('codex stormwarden', () => { const f = fresh({ codex: 'stormwarden' }); const a = enemyHits(f.cb, f.p, f.e, 200); f.p.hp = f.p.maxHp; play(f.cb, 'sh_deluge'); const b = enemyHits(f.cb, f.p, f.e, 200); near(b / a, 0.85 * 0.75, 0.03, '5 debuffs: 25% less (and Deafened)'); f.e.stunTurns = 0; for (let i = 0; i < 5; i++) endTurn(f.cb); ok(f.e.sh.soaked > 0 && f.e.sh.deaf > 0, 'debuffs never wear off');
  const g = fresh(); play(g.cb, 'sh_deluge'); for (let i = 0; i < 5; i++) endTurn(g.cb); ok(!(g.e.sh.soaked > 0), 'without the codex they do'); eq(g.e.static, 3, 'Static never fades');
  const h = fresh({ codex: 'stormwarden' }); h.e.stunTurns = 9; h.p.block = 100; endTurn(h.cb); eq(h.p.block, 80, 'only 20% of Guard fades'); });
T('codex calm_eye', () => { const f = calm(); endTurn(f.cb); eq(f.p.shNextX, 2); pw(f.cb, 'gale_fury'); eq(f.p.shNextX, 2, 'a Power does not use it up'); play(f.cb, 'sh_mace_strike', f.e); eq(f.cb.log.filter(l => /Mace Strike hits/.test(l.text)).length, 2); endTurn(f.cb); ok(!f.p.shNextX, 'acting turn: no charge'); });
// ---------- Penetration, talents
T('talent penetration', () => { const mkT = (picks) => { const f = fresh({ enemies: ['spitting_toad'], level: 4, codex: 'stormcaller', talents: { codex: 'stormcaller', picks } }); f.p.intelligence = 0; f.p.elem = {}; return f; }; const a = mkT([]); play(a.cb, 'sh_thunderfall', a.e); const b = mkT([null, 0]); eq(b.p.pen, 50); play(b.cb, 'sh_thunderfall', b.e); const c = mkT([null, 0, null, null, null, null, 0]); eq(c.p.pen, 75); play(c.cb, 'sh_thunderfall', c.e); ok(b.dmg() > a.dmg() && c.dmg() > b.dmg(), `more Penetration, more damage (${a.dmg()} < ${b.dmg()} < ${c.dmg()})`); const res = a.cb.typeResist; near(b.dmg() / a.dmg(), (1 - res * 0.5) / (1 - res), 0.06); });
T('talent taunt', () => { const f = fresh({ codex: 'stormwarden', talents: { codex: 'stormwarden', picks: [null, 0, null, null, 0] }, allies: ALLY }); eq(f.p.tauntChance, 35); rngSeq(f.cb, [0.999, 0.999, 0.1]); play(f.cb, 'sh_mace_strike', f.e); });
T('talent shx', () => { const f = fresh({ codex: 'stormcaller', talents: { codex: 'stormcaller', picks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] } }); play(f.cb, 'sh_lightning_bolt', f.e); eq(f.e.static, 5, 'Bolt 2 + 1 (Overcharged Air), Charged Air capstone 1 + 1'); ok(f.cb.has(f.p, 'sh_charged_air'), 'capstone starts in play');
  const g = calm({ talents: { codex: 'calm_eye', picks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1] } }); g.p.hp = 1000; endTurn(g.cb); ok(g.p.hp > 1000, 'idle heal'); ok(g.e.static >= 2, 'idle Static'); });

// ---------- every card was covered, has text and an upgrade entry
const all = Object.keys(C).filter(k => C[k].cls === 'Shaman');
T('coverage', () => { const miss = all.filter(k => !done.has(k)); ok(!miss.length, 'no test for: ' + miss.join(', ')); });
T('upgrades', () => { for (const k of all) { const v = CB.rankedCard(k, 10); ok(v && v.text, k); if (C[k].tags.dmg && C[k].type !== 'Power' && /Deal \d+/.test(C[k].text)) ok(v.text !== C[k].text, k + ': +10 changes the number'); } const a = hit1('sh_mace_strike').dmg(); const f = fresh(); const c = { uid: 'r1', key: 'sh_mace_strike', rank: 10 }; f.p.hand.push(c); f.cb.play(c.uid, f.e.id); ok(f.dmg() > a * 1.5, 'a +10 Mace Strike hits harder'); });

// ---------- random fights: every codex x talent column, solo and in a party, plus duels
function randomFight(seed, o) { const rnd = CB.makeRng(seed); const pool = all.slice(); const deck = []; for (let i = 0; i < 26; i++) deck.push([pool[Math.floor(rnd() * pool.length)], 1]);
  const gear = CB.STARTER_GEAR.Shaman.slice(); if (o.codex) gear.push(CB.makeCodex(D, rnd, o.codex, 0));
  const spec = { cls: 'Shaman', name: 'Sha', gear, deck, talents: o.codex ? { codex: o.codex, picks: Array.from({ length: 10 }, () => o.col == null ? Math.floor(rnd() * 3) : o.col) } : undefined };
  const party = o.duel ? [spec, { cls: ['Warrior', 'Mage', 'Rogue', 'Shaman'][seed % 4], name: 'Foe' }] : [spec].concat(o.party ? [{ cls: 'Paladin', name: 'Pal' }, { cls: 'Shaman', name: 'Sha2', deck }] : []);
  const E = Object.keys(D.enemies).filter(k => !D.enemies[k].raid && !D.enemies[k].group); const enemies = o.duel ? undefined : Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => E[Math.floor(rnd() * E.length)]);
  const cb = new CB.Combat({ party, enemies, duel: !!o.duel, seed, data: D, partyStep: 0, level: Math.floor(rnd() * 8) }); for (const p of cb.players) { p.maxHp *= 4; p.hp = p.maxHp; p.maxMana += 60; }
  let guard = 0;
  while (!cb.over && guard++ < 4000) {
    if (cb.phase === 'enemy') { cb.enemyStep(); continue; }
    if (cb.phase !== 'player') { if (cb.phase === 'between') cb.nextTurn(); else break; continue; }
    const p = cb.raid ? cb.players.find(q => cb.canAct(q)) : cb.current; if (!p || !p.isPlayer) break; cb.player = p; if (p.pick) cb.autoPick(p);
    const can = p.hand.filter(c => cb.canPlay(c, p).ok);
    if (can.length && rnd() < 0.85) { const c = can[Math.floor(rnd() * can.length)], d = cb.card(c), ts = d.target === 'ally' ? cb.allies() : cb.alive(); const t = ts.length ? ts[Math.floor(rnd() * ts.length)] : null; cb.play(c.uid, t && t.id); }
    else cb.endPlayerTurn();
  }
  for (const a of [...cb.players, ...cb.enemies]) for (const k of ['hp', 'block', 'mana', 'static']) if (a[k] != null && !Number.isFinite(a[k])) throw new Error(`${a.name}.${k} = ${a[k]}`);
  return cb.over; }
let fights = 0;
for (const codex of [null, 'twinstorm', 'rainbringer', 'stormcaller', 'skybreaker', 'stormwarden', 'calm_eye']) for (const col of [0, 1, 2, null]) for (const mode of ['solo', 'party', 'duel']) for (let s = 1; s <= 4; s++) {
  const seed = 1000 * s + fights; fights++; try { randomFight(seed, { codex, col, party: mode === 'party', duel: mode === 'duel' }); pass++; } catch (e) { fails.push(`random fight seed ${seed} (${codex || 'no codex'}, column ${col}, ${mode}): ${(e && e.stack || e).toString().split('\n').slice(0, 3).join(' | ')}`); } }

// the 18 test decks, each with its codex and a full offense tree, three fights apiece
require('../../src/testdecks.js'); const TD = (global.CB_TESTDECKS || []).filter(d => d.cls === 'Shaman');
T('test decks', () => { eq(TD.length, 18); for (const cx of CB.CODEXES.Shaman) eq(TD.filter(d => d.codex === cx[0]).length, 3, cx[0]); });
for (const d of TD) for (let s = 1; s <= 3; s++) { try { const rnd = CB.makeRng(s * 31), gear = CB.STARTER_GEAR.Shaman.concat([CB.makeCodex(D, rnd, d.codex, 0)]);
    const E = Object.keys(D.enemies).filter(k => !D.enemies[k].raid && !D.enemies[k].group);
    const cb = new CB.Combat({ party: [{ cls: 'Shaman', name: 'Sha', gear, deck: d.cards, talents: { codex: d.codex, picks: [0, 0, 0, 0, 0, 0, 0, 0, 0, s % 3] } }], enemies: [E[Math.floor(rnd() * E.length)], E[Math.floor(rnd() * E.length)]], seed: s, data: D, partyStep: 0, level: 0 });
    let g = 0; while (!cb.over && g++ < 4000) { if (cb.phase === 'enemy') { cb.enemyStep(); continue; } if (cb.phase !== 'player') { if (cb.phase === 'between') cb.nextTurn(); else break; continue; } const p = cb.current; cb.player = p; if (p.pick) cb.autoPick(p);
      const can = p.hand.filter(c => cb.canPlay(c, p).ok); if (can.length && rnd() < 0.9) { const c = can[Math.floor(rnd() * can.length)], dd = cb.card(c), ts = dd.target === 'ally' ? cb.allies() : cb.alive(); cb.play(c.uid, ts.length ? ts[Math.floor(rnd() * ts.length)].id : null); } else cb.endPlayerTurn(); }
    if (!cb.over) throw new Error('fight never ended'); pass++; fights++; } catch (e) { fails.push(`test deck ${d.id} seed ${s}: ${(e && e.stack || e).toString().split('\n').slice(0, 3).join(' | ')}`); } }
console.log(`${pass} passed, ${fails.length} failed (${all.length} Shaman cards, ${fights} random fights)`);
for (const f of fails) console.log('FAIL ' + f);
process.exit(fails.length ? 1 : 0);
