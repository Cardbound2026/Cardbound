// The Shaman (Nov 14): the sixth class. A storm hybrid: mace Attacks and lightning spells in one deck, built on Multi-hit and Multicast.
//   Element: Nature only, all of it lightning. No Bleed, no Poison.
//   Static: lightning builds Static on a target. It never fades and does nothing by itself; cards consume it for damage and for Stuns
//     (Electrocute: 10 Static = 1 turn; Mass Electrocute: 1 turn per 10). Raid bosses can't be Stunned; everything else can, every time.
//   Guard: the Shaman's defence. It is Dodge, or Block while a shield is worn (p.defName).
//   Shaman debuffs (only the Shaman applies them; e.sh = { soaked, deaf, unsteady, worn } in turns): Soaked +20% Nature damage taken,
//     Deafened -15% damage dealt, Unsteady: its Block stops nothing, Stormworn: all resistances -10%.
// Six codexes: Twinstorm (hybrid), Rainbringer (healer), Stormcaller (caster), Skybreaker (melee), Stormwarden (support tank), Calm Eye (control).
// The engine calls the hooks in X (see "Shaman" in engine.js); the cards, Powers and codex passives are below.
// TO REMOVE THE CLASS: delete this file and its line in build.js, and the Shaman entries in engine.js (CODEXES, CLASSES, STARTER_*), talents.js and the UI lists.
(function (root) {
'use strict';
const X = {}; // engine hooks, filled by install()
function install(K) {
  const { card, C, POWERS, tgtOf, D_, DA, say } = K;
  const CLS = 'Shaman', k_ = (key) => 'sh_' + key;
  const W = (key, name, rarity, type, cost, target, dtype, text, play, tags, ex) => {
    const k = k_(key); if (C[k]) throw new Error('Shaman card key taken: ' + k);
    card(k, Object.assign({ cls: CLS, name, rarity, type, cost, target, dtype: dtype || (type === 'Attack' ? 'Physical' : undefined), text, play: (cb, t) => { cb._shSeq = (cb._shSeq || 0) + 1; return play(cb, t, cb.player); }, tags: tags || {} }, ex || {}));
  };
  const POW = (key, name, rarity, cost, text, def) => {
    const k = k_(key); if (C[k]) throw new Error('Shaman power key taken: ' + k);
    POWERS[k] = def || {};
    card(k, { cls: CLS, name, rarity, type: 'Power', cost, target: 'self', text, exhaust: true, powerKey: k, play: (cb) => cb.addPower(cb.player, k, name, text), tags: { power: 1 } });
  };
  const has = (cb, p, key) => cb.has(p, k_(key));
  const shx = (cb, p, key) => { let n = 0; for (const [, d] of cb.pws(p)) if (d.shx && d.shx[key]) n += d.shx[key]; return n; }; // talent numbers
  const shOf = (e) => (e.sh = e.sh || {});
  const stunned = (e) => !!(e && ((e.stunTurns || 0) > 0 || e.frozen || e.stunned));
  const others = (cb, e) => cb.alive().filter(x => x !== e && x.hp > 0);
  const hurtAlly = (cb, p) => cb.allies().slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || p;
  const allyOf = (t, p) => (t && t.isPlayer && t.hp > 0 ? t : p);
  const shield = (p) => p.defName === 'Block';
  const NAT = (cb, p, e, n, label, kind) => { if (e && e.hp > 0 && !cb.over) cb.powerHit(p, e, n, label, 'Nature', kind || 'Skill'); };

  // ---------------- Static ----------------
  function fetchElectrocute(cb, p) {
    if (p.hand.some(c => c.key === 'sh_electrocute')) return;
    for (const pile of [p.drawPile, p.discard, p.exhaust]) { const i = pile.findIndex(c => c.key === 'sh_electrocute'); if (i >= 0) { const [c] = pile.splice(i, 1); if (p.hand.length < 10) p.hand.push(c); else p.discard.push(c); say(cb, 'Arc Flash: Electrocute leaps into your hand.'); return; } }
    const was = cb.player; cb.player = p; cb.addToHand('sh_electrocute'); cb.player = was; say(cb, 'Arc Flash: an Electrocute forms in your hand.');
  }
  function stat(cb, e, n) {
    if (!e || e.hp <= 0 || !(n > 0) || cb.over) return 0;
    const p = cb.player; let v = Math.round(n);
    if (p && p.isPlayer) {
      const d = cb._playing;
      if (d && !d.isPower && d.tags && d.tags.lit && p.turn && p.turn.thunderhead) v *= 2;
      if (cb._shIter === 'mc' && has(cb, p, 'resonance')) v += 1;
      v += shx(cb, p, 'staticPlus');
    }
    const before = e.static || 0; e.static = before + v; if (p && p.isPlayer) e.staticBy = p.id;
    cb.fxPush({ t: 'apply', d: e.id, key: 'static' });
    say(cb, `${e.name} gains ${v} Static (now ${e.static}).`);
    if (p && p.isPlayer) {
      if (!cb._rod && p.shRod && p.shRod !== e.id) { const r = cb.actorById(p.shRod); if (r && r.hp > 0) { cb._rod = true; stat(cb, r, v); cb._rod = false; } }
      if (before < 15 && e.static >= 15 && has(cb, p, 'arc_flash')) fetchElectrocute(cb, p);
    }
    return v;
  }
  // take Static off a target (n = how much, or all of it). Unbroken Circuit puts half of it back.
  function eat(cb, e, n) {
    const have = (e && e.static) || 0, k = n == null ? have : Math.min(have, n); if (!k) return 0;
    e.static = have - k; const p = cb.player;
    if (p && p.isPlayer && has(cb, p, 'unbroken_circuit')) { const back = Math.floor(k / 2); if (back) { e.static += back; say(cb, `Unbroken Circuit: ${back} Static stays on ${e.name}.`); } }
    return k;
  }
  // a Stun that takes whole turns. Works on everything but raid bosses, with no immunity window (the class is allowed to chain them).
  function stunFor(cb, e, turns, word) {
    if (!e || e.hp <= 0 || turns <= 0) return false;
    if (cb.raidBoss(e)) { say(cb, `${e.name} is a raid boss: it can't be ${word || 'Stunned'}.`); return false; }
    if (e.isPlayer) { e.frozen = true; cb.say('crit', `${e.name} is ${word || 'Stunned'} and will lose the next turn.`); return true; }
    e.stunTurns = (e.stunTurns || 0) + turns; e.stunned = 1; cb.fxPush({ t: 'apply', d: e.id, key: 'stun' });
    cb.say('crit', `${e.name} is ${word || 'Stunned'}: it loses its next ${e.stunTurns > 1 ? e.stunTurns + ' turns' : 'turn'}.`); return true;
  }
  // ---------------- Shaman debuffs ----------------
  const DEB = { soaked: ['Soaked', 3, 'takes 20% more Nature damage'], deaf: ['Deafened', 2, 'deals 15% less damage'], unsteady: ['Unsteady', 2, 'its Block stops nothing'], worn: ['Stormworn', 3, 'all resistances -10%'] };
  function deb(cb, e, key) {
    if (!e || e.hp <= 0 || cb.over) return; const [nm, turns, what] = DEB[key], p = cb.player;
    if (e.isPlayer) { if (key === 'deaf') e.weak = (e.weak || 0) + 15; else if (key === 'unsteady') e.block = 0; else if (key === 'soaked') e.unwarded = (e.unwarded || 0) + 20; else for (const el of Object.keys(e.resist || {})) e.resist[el] = Math.max(0, e.resist[el] - 10); say(cb, `${e.name} is ${nm}.`); return; }
    const S = shOf(e); S[key] = Math.max(S[key] || 0, turns + (p && p.isPlayer ? shx(cb, p, 'debTurns') : 0)); if (p && p.isPlayer) S.by = p.id;
    cb.fxPush({ t: 'apply', d: e.id, key: key === 'deaf' ? 'weak' : 'vulnerable' });
    say(cb, `${e.name} is ${nm}: ${what}.`);
  }
  const debCount = (e) => { const S = e.sh || {}; return ((e.static || 0) > 0 ? 1 : 0) + ['soaked', 'deaf', 'unsteady', 'worn'].filter(k => S[k] > 0).length + ((e.stunTurns || 0) > 0 ? 1 : 0); };
  // cast a card again (a copy: the original stays where it is)
  function recast(cb, p, d, tgt, mult, label) {
    if (!d || cb.over || (cb._shDepth || 0) >= 2) return;
    const keep = [cb._playing, cb._cmult, cb._skillMult, cb._attackMult, cb._shIter, cb.player];
    cb._shDepth = (cb._shDepth || 0) + 1; cb._playing = d; cb._cmult = mult || 1; cb._skillMult = 1; cb._attackMult = 1; cb._shIter = 'echo'; cb.player = p;
    const t = d.target === 'enemy' ? tgtOf(cb, tgt && !tgt.isPlayer ? tgt : null) : d.target === 'ally' ? allyOf(tgt, p) : null;
    if (d.target !== 'enemy' || t) { cb.say('crit', `${label}: ${d.name} is cast again${mult && mult < 1 ? ' at ' + Math.round(mult * 100) + '% strength' : ''}.`); d.play(cb, t); }
    cb._shDepth--; [cb._playing, cb._cmult, cb._skillMult, cb._attackMult, cb._shIter, cb.player] = keep;
  }
  const timedBuff = (cb, caster, a, key, turns, o) => cb.timed(a, key, turns, Object.assign({ hold: cb.has(caster, 'codex_stormwarden') }, o || {}));

  // Skills that Skybreaker never repeats: the ones that end or rearrange turns, and the ones that are themselves repeats
  const NO_REPEAT = { sh_held_breath: 1, sh_thunder_debt: 1, sh_borrowed_thunder: 1, sh_thunders_echo: 1, sh_thunder_without_end: 1 };
  // ================= engine hooks =================
  // before the engine rolls Multi-hit and Multicast for a card
  X.pre = (cb, p, d) => {
    const S = { mh: 0, mc: 0, base: 0, healMC: false, sure: false, again: 1, back: false, didMH: false, didMC: false }; cb._shSX = S;
    const twin = has(cb, p, 'twin_soul');
    if (d.type === 'Attack') {
      S.base = p.multiHit + (p.shMH || 0) + ((p.turn && p.turn.mhPlus) || 0) + (twin ? p.multicast / 2 : 0); S.mh = S.base - p.multiHit;
      if (d.shDoubleMH) { S.mh += S.base; S.base *= 2; }
      if (p.shSure) { S.sure = true; S.mh += 100; const sd = shx(cb, p, 'sureDmg'); if (sd) cb._cmult *= 1 + sd / 100; }
      if (d.shAlways) S.mh += 1000;
    } else if (d.type === 'Skill') {
      S.mc = (p.shMC || 0) + ((p.turn && p.turn.mcNext) || 0) + (twin ? p.multiHit / 2 : 0);
      S.healMC = cb.has(p, 'codex_rainbringer'); if (d.tags.heal) S.mc += shx(cb, p, 'healMC');
    }
    if (d.type !== 'Power' && !d.shNoAct) {
      if (p.shNextX > 1) { S.again = p.shNextX; p.shNextX = 0; cb.say('crit', `After the calm: ${d.name} is played ${S.again === 3 ? 'three times' : 'twice'}.`); const ad = shx(cb, p, 'againDmg'); if (ad) cb._cmult *= 1 + ad / 100; }
      if (p.shCoil > 0) { cb._cmult *= 1 + 0.3 * p.shCoil; say(cb, `Coiled Storm: +${30 * p.shCoil}%.`); p.shCoil = 0; }
    }
    return S;
  };
  // after the rolls: third hits, second chances, half-strength copies and the repeats from a skipped turn
  X.rolled = (cb, p, d, S, mh, mc) => {
    const out = []; S.didMH = mh; S.didMC = mc; const vessel = has(cb, p, 'storm_vessel');
    if (d.type === 'Attack') {
      if (S.sure) p.shSure = false;
      if (mh) {
        if (p.shMH > 0) { p.shMH = vessel ? Math.floor(p.shMH / 2) : 0; X.storeTrig(cb, p); }
        { const mm = shx(cb, p, 'mhMana'); if (mm) p.mana += mm; }
        if (S.sure && S.base > 0 && cb.rng() * 100 < S.base) { out.push({ kind: 'mh' }); cb.say('crit', `A third hit! ${d.name} strikes again.`); }
      }
    } else if (d.type === 'Skill' && (d.tags.dmg || (S.healMC && d.tags.heal))) {
      if (!mc && has(cb, p, 'aftershock') && cb.rng() * 100 < (p.multicast + S.mc) / 2) { mc = true; out.push({ kind: 'mc' }); cb.say('crit', `Aftershock! ${d.name} Multicasts after all.`); }
      if (mc) {
        S.didMC = true; if (p.shMC > 0) { p.shMC = vessel ? Math.floor(p.shMC / 2) : 0; X.storeTrig(cb, p); }
        { const mg = shx(cb, p, 'mcGuard'); if (mg) cb.gainDef(mg); }
        if (cb.has(p, 'codex_stormcaller')) { const tc = 0.5 + shx(cb, p, 'thirdCopy') / 100; out.push({ kind: 'mc', mult: tc }); cb.say('crit', `Stormcaller: a third ${d.name} at ${Math.round(tc * 100)}% power.`); }
        if (has(cb, p, 'rolling_echo') && cb.rng() * 100 < 25) { out.push({ kind: 'mc' }); cb.say('crit', `Rolling Echo: ${d.name} is cast once more.`); }
        const te = shx(cb, p, 'mcDraw'); if (te && !(p.turn.shMcDraw)) { p.turn.shMcDraw = 1; cb.drawCards(p, te); }
      }
    }
    for (let i = 1; i < S.again; i++) out.push({ kind: 'rep' });
    return out;
  };
  X.storeTrig = (cb, p) => { if (!shx(cb, p, 'storeTrig') || (p.turn && p.turn.shStoreT)) return; p.turn.shStoreT = 1; p.mana += 5; cb.drawCards(p, 1); say(cb, 'Overflow: +5 mana and a card.'); };
  // after the card has resolved
  X.post = (cb, p, d, S, tgt) => {
    if (cb.over) return; const T = p.turn || {}, both = !!T.twinThunder;
    const asAtk = d.type === 'Attack' || (both && d.type === 'Skill'), asSkl = d.type === 'Skill' || (both && d.type === 'Attack');
    if (d.type === 'Attack') {
      if (p.shLW > 0) { const e = tgtOf(cb, tgt && !tgt.isPlayer ? tgt : null); if (e) { p.shLW--; NAT(cb, p, e, 4, 'Lightning Weapon', 'Attack'); stat(cb, e, 1); } }
      if (p.shFW > 0) { const e = tgtOf(cb, tgt && !tgt.isPlayer ? tgt : null); if (e) { p.shFW--; cb.powerHit(p, e, 4, 'Flame Weapon', 'Fire', 'Attack'); if (e.hp > 0) cb.applyDot(e, 'burn', 1); } }   // Nov 14: the fire and frost imbues
      if (p.shIW > 0) { const e = tgtOf(cb, tgt && !tgt.isPlayer ? tgt : null); if (e) { p.shIW--; cb.powerHit(p, e, 4, 'Frost Weapon', 'Frost', 'Attack'); if (e.hp > 0) cb.applyChill(e, 1); } }
      if (S.didMH) {
        if (cb.has(p, 'codex_skybreaker') && p.shLastAny) recast(cb, p, p.shLastAny, tgt, 0.5 + shx(cb, p, 'skyCopy') / 100, 'Skybreaker');   // Nov 14: any Skill, not only damaging spells
        if (has(cb, p, 'rain_of_maces')) { const o = others(cb, tgt)[0]; if (o && cb._lastLost > 0) { cb.powerHit(p, o, Math.max(1, Math.round(cb._lastLost / 2)), 'Rain of Maces', 'Physical', 'Attack'); } }
        const g = shx(cb, p, 'mhGuard'); if (g) cb.gainDef(g);
        if (d.key === 'sh_relentless' && !T.relBack) { T.relBack = true; S.back = true; }
      }
    }
    if (d.type === 'Skill') {
      if (d.tags.dmg && !d.tags.noEcho) p.shLast = d;
      if (!NO_REPEAT[d.key] && !d.shNoAct) p.shLastAny = d;
      if (d.tags.lit && T.thunderhead && d.key !== 'sh_thunderhead') T.thunderhead = false;
      if (T.mcNext && d.key !== 'sh_focus_the_storm') T.mcNext = 0;
      if (T.shSurge && d.key !== 'sh_surge') { T.costSkill = (T.costSkill || 0) + T.shSurge; T.shSurge = 0; }
      if (d.tags.heal) { if (p.shFreeHeal) p.shFreeHeal = false; { const hs = shx(cb, p, 'healStatic'), pool = cb.alive().filter(x => !x.isPlayer); if (hs && pool.length) stat(cb, pool[Math.floor(cb.rng() * pool.length)], hs); } { const ph = shx(cb, p, 'mcPartyHeal'); if (ph && S.didMC) for (const a of cb.allies()) cb.heal(a, ph, 'Monsoon Season', true); }
        if (S.didMC) { if (cb.has(p, 'codex_rainbringer')) { p.shSure = true; cb.say('crit', 'Rainbringer: your next Attack is a sure Multi-hit.'); } if (has(cb, p, 'ancestral_echo')) { p.shFreeHeal = true; say(cb, 'Ancestral Echo: your next heal costs 0.'); } } }
    }
    if (cb.has(p, 'codex_twinstorm') && !d.shNoAct) { const st = 10 + shx(cb, p, 'storePlus'); if (asAtk) p.shMC = (p.shMC || 0) + st; if (asSkl) p.shMH = (p.shMH || 0) + st; }
    if (d.type !== 'Power') { if (asAtk) T.shA = 1; if (asSkl) T.shS = 1; if (T.shA && T.shS && !T.shRide && has(cb, p, 'ride_the_storm')) { T.shRide = 1; cb.drawCards(p, 1); p.mana += 10; say(cb, 'Ride the Storm: draw 1 and +10 mana.'); } }
  };
  X.begin = (cb, a) => {
    if (a.shSkip > 0) { a.shSkip--; a.turn.noAct = true; cb.say('enemy', `${cb.who(a)} cannot act this turn.`); }
    if (a.shCostNext) { a.turn.costDelta = (a.turn.costDelta || 0) - a.shCostNext; a.shCostNext = 0; }
    if (a.shListen) { a.shListen = false; cb.topPick(a, 3); }
  };
  // the end of a hero's turn: did they act? (Held Breath does not count)
  X.endTurn = (cb, p) => {
    if (p.cls !== CLS) return;
    const acted = ((p.turn && p.turn.played) || []).some(c => !(C[c.key] || {}).shNoAct);
    if (acted) { p.shIdle = 0; return; }
    p.shIdle = (p.shIdle || 0) + 1;
    let n = cb.has(p, 'codex_calm_eye') ? 2 : 0; if (p.shIdle >= 2 && has(cb, p, 'the_long_wait')) n = 3;
    if (n) { p.shNextX = Math.max(p.shNextX || 0, n); cb.say('crit', `${cb.who(p)} held still: the next card is played ${n === 3 ? 'three times' : 'twice'}.`); }
    { const v = (k) => shx(cb, p, k), ih = v('idleHeal'), ig = v('idleGuard'), is = v('idleStatic'), im = v('idleMana'); if (ih) cb.heal(p, Math.round(p.maxHp * ih / 100), 'Deep Breath'); if (ig) cb.gainDef(ig); if (is) for (const e of cb.alive()) stat(cb, e, is); if (im) p.manaNext += im; }
    cb.fire(p, 'shIdle');
  };
  X.eTick = (cb, e) => { const S = e.sh; if (!S) return; const by = S.by && cb.actorById(S.by), hold = !!(by && by.hp > 0 && cb.has(by, 'codex_stormwarden')); if (hold) return; for (const k of ['soaked', 'deaf', 'unsteady', 'worn']) if (S[k] > 0) S[k]--; };
  // damage an attacker (p) does to e
  X.vs = (cb, p, e, dtype, kind) => { let m = 1; const S = e.sh; if (S && S.soaked > 0 && dtype === 'Nature') m *= 1.2; if (!p.isPlayer || p.cls !== CLS) return m;
    if (p.shDmgUp) m *= 1 + p.shDmgUp / 100;
    if (!p.powers.some(w => w.def && w.def.shx)) return m;   // the rest are talents
    const v = (k) => shx(cb, p, k), T = p.turn || {};
    if (stunned(e)) m *= 1 + v('stunDmg') / 100;
    if (cb._shIter === 'mh') m *= 1 + v('mhDmg') / 100;
    if (T.shA && T.shS) m *= 1 + v('bothDmg') / 100;
    if (!(T.played || []).length && cb._playing && !cb._playing.isPower) m *= 1 + v('firstDmg') / 100;
    { const dd = v('debDmg'); if (dd && !e.isPlayer) m *= 1 + Math.min(5, debCount(e)) * dd / 100; }
    return m; };
  X.unsteady = (e) => !!(e.sh && e.sh.unsteady > 0);
  X.out = (e) => (e.sh && e.sh.deaf > 0 ? 0.85 : 1); // what a Deafened monster's hits are multiplied by
  // resistance left after Penetration and Stormworn (base = the fraction resisted)
  X.res = (cb, p, e, base) => Math.max(0, base * (1 - Math.min(100, (p && p.isPlayer && p.pen) || 0) / 100) - (e.sh && e.sh.worn > 0 ? 0.1 : 0));
  // a hero is hit: Spirit Link splits it across the party; Storm's Aegis takes a tenth for an ally
  X.share = (cb, p, e, dmgIn, label) => {
    if (dmgIn <= 0 || cb.duel) return dmgIn; const all = cb.alivePlayers();
    if (all.length > 1 && all.some(q => has(cb, q, 'spirit_link'))) { const each = Math.round(dmgIn / all.length);
      for (const q of all) if (q !== p) { cb.applyHit(e, q, each, { defer: true, label }); cb.say('player', `Spirit Link: ${q.name} takes ${each} of the hit. HP ${q.hp}/${q.maxHp}.`); if (q.hp <= 0) cb.onDeath(q); }
      return each; }
    const g = all.find(q => q !== p && has(cb, q, 'storms_aegis'));
    if (g) { const part = Math.round(dmgIn * 0.1); if (part > 0) { cb.applyHit(e, g, part, { defer: true, label }); cb.say('player', `Storm's Aegis: ${g.name} takes ${part} of the hit for ${p.name}.`); if (g.hp <= 0) cb.onDeath(g); return dmgIn - part; } }
    return dmgIn;
  };
  X.wasHit = (cb, p, e, r) => { if (!e || e.hp <= 0 || !p.until) return; if (p.until.shHitStatic) stat(cb, e, p.until.shHitStatic); if (p.until.shHitDeaf) deb(cb, e, 'deaf'); };
  X.slip = (cb, p, e, label) => { if (!p.until || !p.until.shSlip) return false; p.until.shSlip = 0; cb.say('player', `${p.name} slips the blow: ${e.name}'s ${label} misses.`); stat(cb, e, 3); return true; };
  // per-card upgrades for Shaman cards: damage, Guard and healing numbers grow 10% a level; a card with none of those costs 1 less every 2 levels
  X.upgrades = (UPG) => { for (const k of Object.keys(C)) { const d = C[k]; if (d.cls !== CLS || UPG[k]) continue; const t = [];
    const add = (re, kind) => { let m; while ((m = re.exec(d.text))) { const n = +m[1], i = m.index + m[0].indexOf(m[1]); if (n > 1 && !t.some(x => x[0] === i)) t.push([i, i + m[1].length, n, kind, Math.max(1, Math.round(n / 10)), 1]); } };
    if (d.type !== 'Power') { add(/[Dd]eal (\d+)/g, 'dmg'); add(/[Gg]ain (\d+) (?:Guard|Block|Dodge)/g, 'def'); add(/[Hh]eal[^.]*? for (\d+)/g, 'heal'); }
    UPG[k] = t.length ? { t } : { c: 2 }; } };
  X.stat = stat; X.eat = eat; X.stunFor = stunFor; X.deb = deb; X.debCount = debCount; X.DEB = DEB;

  // ================= codex passives =================
  POWERS.codex_twinstorm = { statPlus: (cb, p, e, ctx) => ctx.kind === 'Attack' ? Math.round((p.intelligence + (p.intTurn || 0)) * 0.5) : Math.round((p.strength + p.strTurn + p.strCombat) * 0.5) };
  POWERS.codex_rainbringer = {}; POWERS.codex_stormcaller = {}; POWERS.codex_skybreaker = {}; POWERS.codex_calm_eye = {};
  POWERS.codex_stormwarden = { incomingFrom: (cb, p, e) => 1 - (0.05 + shx(cb, p, 'wardenPlus') / 100) * (e && !e.isPlayer && (!e.sh || !e.sh.by || e.sh.by === p.id || e.staticBy === p.id) ? debCount(e) : 0) };

  // ================= lightning spells =================
  const LIT = (key, name, rarity, cost, target, text, play, tags, ex) => W(key, name, rarity, 'Skill', cost, target, 'Nature', text, play, Object.assign({ lit: 1 }, tags || {}), ex);
  LIT('lightning_bolt', 'Lightning Bolt', 'White', 10, 'enemy', 'Deal 6 Nature damage and apply 2 Static.', (cb, t) => { const e = D_(cb, t, 6, 'Lightning Bolt'); stat(cb, e, 2); }, { dmg: 6 });
  LIT('jolt', 'Jolt', 'White', 10, 'enemy', 'Deal 4 Nature damage and apply 3 Static.', (cb, t) => { const e = D_(cb, t, 4, 'Jolt'); stat(cb, e, 3); }, { dmg: 4 });
  LIT('static_charge', 'Static Charge', 'White', 10, 'enemy', 'Apply 4 Static. Draw a card.', (cb, t, p) => { stat(cb, tgtOf(cb, t), 4); cb.drawCards(p, 1); }, { draw: 1 });
  LIT('forked_bolt', 'Forked Bolt', 'White', 20, 'all', 'Deal 5 Nature damage to two random enemies and apply 2 Static to each.', (cb) => { const pool = cb.alive().slice(); for (let i = 0; i < 2 && pool.length && !cb.over; i++) { const e = pool.splice(Math.floor(cb.rng() * pool.length), 1)[0]; cb.hit(e, 5, 'Forked Bolt'); stat(cb, e, 2); } }, { dmg: 10, aoe: 1 });
  LIT('chain_lightning', 'Chain Lightning', 'Green', 20, 'all', 'Deal 8 Nature damage to all enemies and apply 2 Static to each.', (cb) => { for (const e of cb.alive()) if (!cb.over) { cb.hit(e, 8, 'Chain Lightning'); stat(cb, e, 2); } }, { dmg: 8, aoe: 1 });
  LIT('lightning_cloud', 'Lightning Cloud', 'Green', 20, 'self', 'For 3 turns, at the start of your turn deal 4 Nature damage and apply 1 Static to all enemies.', (cb, t, p) => { cb.timed(p, 'sh_cloud', 3, { each: (c, q) => { for (const e of c.alive()) if (!c.over) { NAT(c, q, e, 4, 'Lightning Cloud'); stat(c, e, 1); } } }); say(cb, 'A Lightning Cloud gathers for 3 turns.'); }, { aoe: 1 });
  LIT('ball_lightning', 'Ball Lightning', 'Green', 20, 'enemy', 'Deal 10 Nature damage and apply 2 Static. If it Multicasts, it returns to your hand.', (cb, t) => { const e = D_(cb, t, 10, 'Ball Lightning'); stat(cb, e, 2); if (cb._shIter === 'mc' && cb._shSX) cb._shSX.back = true; }, { dmg: 10 });
  LIT('arc', 'Arc', 'Green', 10, 'enemy', 'Deal 5 Nature damage. If the target has Static, the bolt jumps to another enemy for the same.', (cb, t) => { const e = tgtOf(cb, t), had = e && e.static > 0; D_(cb, e, 5, 'Arc'); if (had) { const o = others(cb, e)[0]; if (o) { say(cb, `Arc jumps to ${o.name}.`); cb.hit(o, 5, 'Arc'); } } }, { dmg: 5 });
  LIT('thunderhead', 'Thunderhead', 'Green', 10, 'self', 'Your next lightning spell this turn applies double Static.', (cb, t, p) => { p.turn.thunderhead = true; say(cb, 'Thunderhead: the next lightning spell applies double Static.'); }, {});
  LIT('lightning_burst', 'Lightning Burst', 'Blue', 20, 'enemy', 'Deal 14 Nature damage. If the target has 5 or more Static, apply 3 more.', (cb, t) => { const e = D_(cb, t, 14, 'Lightning Burst'); if (e && e.static >= 5) stat(cb, e, 3); }, { dmg: 14 });
  LIT('thunderfall', 'Thunderfall', 'Blue', 30, 'enemy', 'Deal 30 Nature damage. Double against a Stunned target.', (cb, t) => { const e = tgtOf(cb, t); D_(cb, e, stunned(e) ? 60 : 30, 'Thunderfall'); }, { dmg: 30 });
  LIT('skys_wrath', "Sky's Wrath", 'Blue', 30, 'all', 'Deal 12 Nature damage and apply 4 Static to all enemies.', (cb) => { for (const e of cb.alive()) if (!cb.over) { cb.hit(e, 12, "Sky's Wrath"); stat(cb, e, 4); } }, { dmg: 12, aoe: 1 });
  LIT('stormcall', 'Stormcall', 'Blue', 20, 'all', 'Deal 9 Nature damage three times, each to a random enemy. Each hit applies 1 Static.', (cb) => { for (let i = 0; i < 3 && !cb.over; i++) { const pool = cb.alive(); if (!pool.length) break; const e = pool[Math.floor(cb.rng() * pool.length)]; cb.hit(e, 9, 'Stormcall'); stat(cb, e, 1); } }, { dmg: 27, aoe: 1 });
  LIT('tempest_lance', 'Tempest Lance', 'Gold', 30, 'enemy', 'Deal 40 Nature damage, plus 2 for each Static on the target (not consumed).', (cb, t) => { const e = tgtOf(cb, t); D_(cb, e, 40 + 2 * ((e && e.static) || 0), 'Tempest Lance'); }, { dmg: 40 });
  LIT('heavens_fall', "Heaven's Fall", 'Gold', 30, 'all', 'Consume all Static from all enemies. Deal 4 Nature damage to all enemies for each Static consumed.', (cb) => { let k = 0; for (const e of cb.alive()) k += eat(cb, e); say(cb, `Heaven's Fall consumes ${k} Static.`); if (k) DA(cb, 4 * k, "Heaven's Fall"); }, { dmg: 40, aoe: 1 });
  LIT('thousand_volts', 'Thousand Volts', 'Gold', 30, 'enemy', 'Deal 15 Nature damage. Then apply Static equal to the damage dealt, divided by 3.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const hp0 = e.hp + e.block; cb.hit(e, 15, 'Thousand Volts'); const dealt = Math.max(0, hp0 - (e.hp + e.block)); stat(cb, e, Math.floor(dealt / 3)); }, { dmg: 15 });
  LIT('thunder_without_end', 'Thunder Without End', 'Gold', 30, 'enemy', 'Cast every lightning spell in your discard pile again at half strength. Exhaust.', (cb, t, p) => { const seen = p.discard.map(c => cb.card(c)).filter(d => d.tags && d.tags.lit && !d.tags.noEcho && d.type === 'Skill'); if (!seen.length) say(cb, 'No lightning spells in the discard pile.'); for (const d of seen.slice(0, 12)) if (!cb.over) recast(cb, p, d, t, 0.5, 'Thunder Without End'); }, { dmg: 20, noEcho: 1 }, { exhaust: true });

  // ================= Static payoffs =================
  LIT('electrocute', 'Electrocute', 'Blue', 0, 'enemy', 'Consume 10 Static from an enemy and Stun it for 1 turn.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; if ((e.static || 0) < 10) { say(cb, `${e.name} has only ${e.static || 0} Static: Electrocute needs 10.`); return; } if (cb.raidBoss(e)) { say(cb, `${e.name} is a raid boss: it can't be Stunned. The Static stays.`); return; } eat(cb, e, 10); stunFor(cb, e, 1); }, { noEcho: 1, lit: 0 });
  LIT('mass_electrocute', 'Mass Electrocute', 'Blue', 10, 'all', 'Consume all Static from all enemies. Each is Stunned 1 turn for every 10 Static consumed.', (cb) => { for (const e of cb.alive()) { if (cb.raidBoss(e)) { say(cb, `${e.name} is a raid boss: it can't be Stunned.`); continue; } const turns = Math.floor((e.static || 0) / 10); if (!turns) continue; eat(cb, e); stunFor(cb, e, turns); } }, { noEcho: 1, lit: 0 });
  LIT('discharge', 'Discharge', 'Green', 10, 'enemy', 'Consume all Static on the target. Deal 3 Nature damage per Static consumed.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const k = eat(cb, e); say(cb, `Discharge consumes ${k} Static.`); if (k) D_(cb, e, 3 * k, 'Discharge'); }, { dmg: 15 });
  LIT('electric_burn', 'Electric Burn', 'Blue', 20, 'enemy', 'Consume all Static on the target. Apply 5 Burn for each Static consumed.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const k = eat(cb, e); if (!k) { say(cb, `${e.name} has no Static to set alight.`); return; } say(cb, `Electric Burn turns ${k} Static into fire.`); cb.applyDot(e, 'burn', 5 * k); }, { noEcho: 1, lit: 0 });
  W('grounded', 'Grounded', 'White', 'Skill', 10, 'enemy', null, 'Gain 1 Guard for each Static on the target (not consumed).', (cb, t) => { const e = tgtOf(cb, t), k = (e && e.static) || 0; if (k) cb.gainDef(k); else say(cb, 'No Static to ground.'); }, { def: 5 });
  LIT('short_circuit', 'Short Circuit', 'Green', 10, 'enemy', "Consume 5 Static. The target's next card costs 20 more.", (cb, t) => { const e = tgtOf(cb, t); if (!e) return; if ((e.static || 0) < 5) { say(cb, `${e.name} needs 5 Static.`); return; } eat(cb, e, 5); if (e.isPlayer) e.exposure = (e.exposure || 0) + 4; else { e.costUp = (e.costUp || 0) + 20; cb.planEnemy(e, true); } say(cb, `${e.name}'s next card costs 20 more.`); }, { noEcho: 1, lit: 0 });
  LIT('feedback', 'Feedback', 'Green', 10, 'enemy', "Consume up to 6 Static. Burn 5 of the target's mana for each.", (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const k = eat(cb, e, 6); const s = k ? cb.drainMana(e, 5 * k) : 0; say(cb, `Feedback burns ${s} mana.`); }, { noEcho: 1, lit: 0 });
  LIT('conduit', 'Conduit', 'Blue', 10, 'enemy', 'Move all Static from the target to another enemy, plus 2. With no other enemy, the target gains 2.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const o = others(cb, e).sort((a, b) => b.hp - a.hp)[0]; if (!o) { stat(cb, e, 2); return; } const k = e.static || 0; e.static = 0; stat(cb, o, k + 2); }, { noEcho: 1, lit: 0 });
  LIT('supercharge', 'Supercharge', 'Blue', 20, 'enemy', 'Double the Static on the target (up to +10).', (cb, t) => { const e = tgtOf(cb, t); if (e) stat(cb, e, Math.min(10, e.static || 0)); }, { noEcho: 1, lit: 0 });
  LIT('bottled_lightning', 'Bottled Lightning', 'Gold', 10, 'enemy', 'Take all Static off a target. Your next damaging spell this turn deals 4 more damage for each.', (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const k = eat(cb, e); p.turn.skillFlat = (p.turn.skillFlat || 0) + 4 * k; say(cb, `Bottled Lightning: ${k} Static stored, +${4 * k} damage on the next spell.`); }, { noEcho: 1, lit: 0 });
  W('lightning_rod', 'Lightning Rod', 'Gold', 'Skill', 20, 'enemy', 'Nature', 'For the rest of the fight, all Static you apply to any other enemy is also applied to this one. Exhaust.', (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; p.shRod = e.id; say(cb, `${e.name} becomes the Lightning Rod.`); }, {}, { exhaust: true });

  // ================= Static and Multicast Powers =================
  const once = (cb, e, tag) => { if (e[tag] === cb._shSeq) return false; e[tag] = cb._shSeq; return true; };
  POW('charged_air', 'Charged Air', 'Blue', 20, 'Power: each damaging spell you cast applies 1 extra Static to every enemy it hits.', { dealt: (cb, p, h) => { if (h.kind === 'Skill' && h.d && !h.d.isPower && h.e && h.e.hp > 0 && !h.e.isPlayer && once(cb, h.e, '_caSeq')) stat(cb, h.e, 1); } });
  POW('arc_flash', 'Arc Flash', 'Blue', 20, 'Power: when a target reaches 15 Static, Electrocute is put into your hand from anywhere.', {});
  POW('voltage', 'Voltage', 'Green', 10, 'Power: you deal 2% more damage to an enemy for each Static on it (up to +40%).', { hitMult: (cb, p, e) => 1 + Math.min(40, 2 * ((e && e.static) || 0)) / 100 });
  POW('resonance', 'Resonance', 'Green', 10, 'Power: your Multicasts apply 1 extra Static.', {});
  POW('aftershock', 'Aftershock', 'Blue', 20, 'Power: if a Skill does not Multicast, roll again at half your Multicast chance.', {});
  POW('echo_chamber', 'Echo Chamber', 'Blue', 20, 'Power: +15% Multicast chance.', { onPlay: (cb, p, pw) => { p.multicast += pw.upN ? pw.upN[0] : 15; } });
  POW('rolling_echo', 'Rolling Echo', 'Gold', 30, 'Power: when a spell Multicasts, it has a 25% chance to cast once more.', {});
  POW('unbroken_circuit', 'Unbroken Circuit', 'Gold', 30, 'Power: when you consume Static, half of it (rounded down) stays on the target.', {});
  POW('perfect_storm', 'Perfect Storm', 'Gold', 30, 'Power: your lightning spells that hit one enemy also hit every other enemy for half.', { dealt: (cb, p, h) => { const d = h.d; if (cb._ps || !d || d.isPower || !d.tags || !d.tags.lit || d.target !== 'enemy' || !h.e || h.e.isPlayer) return; const n = Math.round(((h.lost || 0) + (h.absorbed || 0)) / 2); if (n <= 0) return; cb._ps = true; for (const o of others(cb, h.e)) if (!cb.over) { cb.applyHit(p, o, n, { label: 'Perfect Storm', dtype: 'Nature', kind: 'Skill' }); say(cb, `Perfect Storm: ${o.name} takes ${n}.`); } cb._ps = false; } });
  W('focus_the_storm', 'Focus the Storm', 'White', 'Skill', 10, 'self', null, 'Your next spell this turn has +30% Multicast chance.', (cb, t, p) => { p.turn.mcNext = (p.turn.mcNext || 0) + 30; say(cb, 'Focus the Storm: +30% Multicast on the next spell.'); }, {});
  W('thunders_echo', "Thunder's Echo", 'Green', 'Skill', 10, 'enemy', 'Nature', 'Cast your last damaging spell again at half strength.', (cb, t, p) => { if (!p.shLast) { say(cb, 'No spell to echo yet.'); return; } recast(cb, p, p.shLast, t, 0.5, "Thunder's Echo"); }, { dmg: 5, noEcho: 1 });

  // ================= mace Attacks =================
  const A = (key, name, rarity, cost, target, text, play, tags, ex) => W(key, name, rarity, 'Attack', cost, target, 'Physical', text, play, tags, ex);
  A('mace_strike', 'Mace Strike', 'White', 10, 'enemy', 'Deal 10 damage.', (cb, t) => D_(cb, t, 10, 'Mace Strike'), { dmg: 10 });
  A('twin_strike', 'Twin Strike', 'White', 10, 'enemy', 'Deal 5 damage twice.', (cb, t) => { const e = D_(cb, t, 5, 'Twin Strike'); D_(cb, e, 5, 'Twin Strike'); }, { dmg: 10, hits: 2 });
  A('backswing', 'Backswing', 'White', 10, 'enemy', 'Deal 7 damage. If it Multi-hits, draw a card.', (cb, t, p) => { D_(cb, t, 7, 'Backswing'); if (cb._shIter === 'mh') cb.drawCards(p, 1); }, { dmg: 7 });
  A('shield_rap', 'Shield Rap', 'White', 10, 'enemy', 'Deal 6 damage and gain 5 Guard (8 with a shield).', (cb, t, p) => { D_(cb, t, 6, 'Shield Rap'); cb.gainDef(shield(p) ? 8 : 5); }, { dmg: 6, def: 5 });
  A('sweeping_maces', 'Sweeping Maces', 'White', 20, 'all', 'Deal 7 damage to all enemies.', (cb) => DA(cb, 7, 'Sweeping Maces'), { dmg: 7, aoe: 1 });
  A('charged_blow', 'Charged Blow', 'Green', 20, 'enemy', 'Deal 12 damage, then 6 Nature damage, and apply 2 Static.', (cb, t, p) => { const e = D_(cb, t, 12, 'Charged Blow'); NAT(cb, p, e, 6, 'Charged Blow', 'Attack'); stat(cb, e, 2); }, { dmg: 18 });
  A('hammer_and_anvil', 'Hammer and Anvil', 'Green', 20, 'enemy', 'Deal 9 damage, then 9 Nature damage.', (cb, t, p) => { const e = D_(cb, t, 9, 'Hammer and Anvil'); NAT(cb, p, e, 9, 'Hammer and Anvil', 'Attack'); }, { dmg: 18, hits: 2 });
  A('rolling_thunder', 'Rolling Thunder', 'Green', 10, 'enemy', 'Deal 6 damage. +20% Multi-hit chance for the rest of this turn.', (cb, t, p) => { D_(cb, t, 6, 'Rolling Thunder'); if (cb._shIter === 'base' || !cb._shIter) { p.turn.mhPlus = (p.turn.mhPlus || 0) + 20; say(cb, '+20% Multi-hit chance this turn.'); } }, { dmg: 6 });
  A('crackling_swing', 'Crackling Swing', 'Green', 10, 'enemy', 'Deal 8 damage. Apply 1 Static for each Attack you have played this turn, this one included.', (cb, t, p) => { const e = D_(cb, t, 8, 'Crackling Swing'); stat(cb, e, p.turnAttacks + 1); }, { dmg: 8 });
  A('skull_ringer', 'Skull Ringer', 'Green', 20, 'enemy', 'Deal 14 damage and apply Deafened (deals 15% less damage).', (cb, t) => { const e = D_(cb, t, 14, 'Skull Ringer'); deb(cb, e, 'deaf'); }, { dmg: 14 });
  A('knee_breaker', 'Knee Breaker', 'Green', 10, 'enemy', 'Deal 8 damage and apply Unsteady (its Block stops nothing).', (cb, t) => { const e = tgtOf(cb, t); deb(cb, e, 'unsteady'); D_(cb, e, 8, 'Knee Breaker'); }, { dmg: 8 });
  A('windmill', 'Windmill', 'Green', 20, 'all', 'Deal 6 damage to all enemies, twice.', (cb) => { DA(cb, 6, 'Windmill'); DA(cb, 6, 'Windmill'); }, { dmg: 12, aoe: 1, hits: 2 });
  A('crashing_thunder', 'Crashing Thunder', 'Blue', 20, 'all', 'Deal 10 damage to all enemies. When it Multi-hits, every enemy also gains 2 Static.', (cb) => { DA(cb, 10, 'Crashing Thunder'); if (cb._shIter === 'mh') for (const e of cb.alive()) stat(cb, e, 2); }, { dmg: 10, aoe: 1 });
  A('spellstrike', 'Spellstrike', 'Blue', 20, 'enemy', 'Deal 12 damage, then cast your last damaging spell again at half strength.', (cb, t, p) => { const e = D_(cb, t, 12, 'Spellstrike'); if (p.shLast) recast(cb, p, p.shLast, e, 0.5, 'Spellstrike'); }, { dmg: 12 });
  A('stormbreaker', 'Stormbreaker', 'Blue', 30, 'enemy', 'Deal 26 damage. If the target has 5 Static, consume it to deal 15 Nature damage as well.', (cb, t, p) => { const e = D_(cb, t, 26, 'Stormbreaker'); if (e && e.hp > 0 && (e.static || 0) >= 5) { eat(cb, e, 5); NAT(cb, p, e, 15, 'Stormbreaker', 'Attack'); } }, { dmg: 26 });
  A('echoing_blow', 'Echoing Blow', 'Blue', 20, 'enemy', "Deal 12 damage. This Attack's Multi-hit chance is doubled.", (cb, t) => D_(cb, t, 12, 'Echoing Blow'), { dmg: 12 }, { shDoubleMH: true });
  A('relentless', 'Relentless', 'Blue', 10, 'enemy', 'Deal 8 damage. If it Multi-hits, it returns to your hand (once a turn).', (cb, t) => D_(cb, t, 8, 'Relentless'), { dmg: 8 });
  A('tempest', 'Tempest', 'Gold', 30, 'enemy', 'Deal 20 damage. This Attack always Multi-hits.', (cb, t) => D_(cb, t, 20, 'Tempest'), { dmg: 20 }, { shAlways: true });
  A('thunder_king', 'Thunder King', 'Gold', 30, 'all', 'Deal 12 damage to all enemies three times.', (cb) => { for (let i = 0; i < 3 && !cb.over; i++) DA(cb, 12, 'Thunder King'); }, { dmg: 36, aoe: 1, hits: 3 });
  // Nov 14: an X card: spend all your mana, one hit for every 3. Each hit rolls Multi-hit on its own, and says so over the target.
  A('hundred_blows', 'Hundred Blows', 'Gold', 0, 'enemy', 'Spend all your mana. Deal 4 damage once for every 3 mana spent. Each hit rolls your Multi-hit chance on its own.', (cb, t, p) => { let e = tgtOf(cb, t);
    if (cb._shIter === 'base' || cb._shIter == null || p.turn.hbN == null) p.turn.hbN = Math.floor(cb.spendAll(p) / 3);
    const n = p.turn.hbN, SX = cb._shSX, ch = SX && SX.base ? SX.base : p.multiHit + (p.shMH || 0) + (p.turn.mhPlus || 0); let extra = 0;
    for (let i = 0; i < n && !cb.over; i++) { e = D_(cb, e, 4, 'Hundred Blows'); if (cb.rng() * 100 < ch && !cb.over) { extra++; if (e && e.hp > 0) { e.multiN = (e.multiN || 0) + 1; e.multiWord = 'MULTI-HIT'; } e = D_(cb, e, 4, 'Hundred Blows (Multi-hit)'); } }
    if (extra && SX && !SX.didMH) { SX.didMH = true; if (p.shMH > 0) { p.shMH = has(cb, p, 'storm_vessel') ? Math.floor(p.shMH / 2) : 0; X.storeTrig(cb, p); } const mm = shx(cb, p, 'mhMana'); if (mm) p.mana += mm; }   // Nov 14: its own Multi-hits count as a Multi-hit for the codex, talents and powers (once a card)
    say(cb, `Hundred Blows: ${n} hit${n === 1 ? '' : 's'}${extra ? `, ${extra} more from Multi-hit` : ''}.`); }, { dmg: 40, hits: 10 });
  A('thunder_gods_hammer', "Thunder God's Hammer", 'Gold', 30, 'enemy', 'Deal 30 damage. If it Multi-hits, Stun the target for 1 turn.', (cb, t) => { const e = D_(cb, t, 30, "Thunder God's Hammer"); if (cb._shIter === 'mh' && e && e.hp > 0) stunFor(cb, e, 1); }, { dmg: 30 });
  POW('gale_fury', 'Gale Fury', 'Blue', 20, 'Power: +20% Multi-hit chance.', { onPlay: (cb, p, pw) => { p.multiHit += pw.upN ? pw.upN[0] : 20; } });
  POW('rain_of_maces', 'Rain of Maces', 'Gold', 30, 'Power: when an Attack Multi-hits, it also hits a second enemy for half.', {});

  // ================= hybrid bridges =================
  W('lightning_weapon', 'Lightning Weapon', 'White', 'Skill', 10, 'self', 'Nature', 'Your next 3 Attacks also deal 4 Nature damage and apply 1 Static.', (cb, t, p) => { p.shLW = (p.shLW || 0) + 3; say(cb, `Lightning Weapon: ${p.shLW} charged Attacks.`); }, {});
  W('flame_weapon', 'Flame Weapon', 'White', 'Skill', 10, 'self', 'Fire', 'Your next 3 Attacks also deal 4 Fire damage and apply 1 Burn.', (cb, t, p) => { p.shFW = (p.shFW || 0) + 3; say(cb, `Flame Weapon: ${p.shFW} burning Attacks.`); }, {});
  W('frost_weapon', 'Frost Weapon', 'White', 'Skill', 10, 'self', 'Frost', 'Your next 3 Attacks also deal 4 Frost damage and apply 1 Chill.', (cb, t, p) => { p.shIW = (p.shIW || 0) + 3; say(cb, `Frost Weapon: ${p.shIW} freezing Attacks.`); }, {});
  W('surge', 'Surge', 'Green', 'Skill', 10, 'self', null, 'Your next spell this turn costs 10 less for each Attack you played this turn.', (cb, t, p) => { const n = 10 * p.turnAttacks; if (!n) { say(cb, 'No Attacks played yet this turn.'); return; } p.turn.shSurge = (p.turn.shSurge || 0) + n; p.turn.costSkill = (p.turn.costSkill || 0) - n; say(cb, `Surge: the next spell costs ${n} less.`); }, {});
  W('war_chant', 'War Chant', 'Green', 'Skill', 10, 'self', null, 'Your next Attack deals 5 more damage for each Skill you played this turn, this one included.', (cb, t, p) => { const n = 5 * (p.turnSkills + 1); p.nextAttackFlat = (p.nextAttackFlat || 0) + n; say(cb, `War Chant: +${n} damage on the next Attack.`); }, {});
  W('storm_dance', 'Storm Dance', 'Green', 'Skill', 10, 'self', null, 'Draw 2. If you then hold both an Attack and a Skill, gain 10 mana.', (cb, t, p) => { cb.drawCards(p, 2); const ty = new Set(p.hand.map(c => C[c.key].type)); if (ty.has('Attack') && ty.has('Skill')) { p.mana += 10; say(cb, '+10 mana.'); } }, { draw: 2 });
  POW('stormcallers_rhythm', "Stormcaller's Rhythm", 'Green', 20, 'Power: a Skill played right after an Attack deals 15% more, and an Attack played right after a Skill deals 15% more.', { hitMult: (cb, p, e, ctx) => { const tw = p.turn && p.turn.twinThunder; return (ctx.kind === 'Skill' && (p.prevType === 'Attack' || tw)) || (ctx.kind === 'Attack' && (p.prevType === 'Skill' || tw)) ? 1.15 : 1; } });
  POW('charged_maces', 'Charged Maces', 'Blue', 20, 'Power: your Attacks apply 1 Static to every enemy they hit.', { dealt: (cb, p, h) => { if (h.kind === 'Attack' && h.d && !h.d.isPower && h.e && h.e.hp > 0 && !h.e.isPlayer && once(cb, h.e, '_cmSeq')) stat(cb, h.e, 1); } });
  W('overload', 'Overload', 'Blue', 'Skill', 20, 'self', null, 'Your next spell this turn is cast twice.', (cb, t, p) => { p.turn.twice = { type: 'Skill' }; say(cb, 'Overload: the next spell is cast twice.'); }, {});
  W('double_time', 'Double Time', 'Blue', 'Skill', 20, 'self', null, 'Your next Attack this turn hits twice.', (cb, t, p) => { p.turn.twice = { type: 'Attack' }; say(cb, 'Double Time: the next Attack hits twice.'); }, {});
  W('thunder_mend', 'Thunder Mend', 'Blue', 'Skill', 10, 'ally', 'Nature', 'Heal an ally for 12. Your next Attack deals 8 more damage.', (cb, t, p) => { cb.heal(allyOf(t, p), 12, 'Thunder Mend'); p.nextAttackFlat = (p.nextAttackFlat || 0) + 8; }, { heal: 12 });
  POW('twin_soul', 'Twin Soul', 'Gold', 30, 'Power: half your Multi-hit chance also counts as Multicast chance, and half your Multicast chance as Multi-hit chance.', {});
  W('twin_thunder', 'Twin Thunder', 'Gold', 'Skill', 20, 'self', null, 'For the rest of this turn, every Attack also counts as a Skill and every Skill as an Attack. Draw a card.', (cb, t, p) => { p.turn.twinThunder = true; cb.drawCards(p, 1); say(cb, 'Twin Thunder: Attacks and Skills count as both this turn.'); }, { draw: 1 });
  POW('ride_the_storm', 'Ride the Storm', 'Gold', 30, 'Power: the first time each turn you have played both an Attack and a Skill, draw a card and gain 10 mana.', {});
  POW('storm_vessel', 'Storm Vessel', 'Gold', 30, 'Power: the Multi-hit and Multicast chance you have stored (Twinstorm) is halved when it triggers, not emptied.', {});

  // ================= heals =================
  const H = (key, name, rarity, cost, target, text, play, tags, ex) => W(key, name, rarity, 'Skill', cost, target, 'Nature', text, play, Object.assign({ heal: 1 }, tags || {}), ex);
  H('mending_rain', 'Mending Rain', 'White', 10, 'ally', 'Heal an ally for 12.', (cb, t, p) => cb.heal(allyOf(t, p), 12, 'Mending Rain'), { heal: 12 });
  H('cleansing_rain', 'Cleansing Rain', 'White', 10, 'ally', 'Heal an ally for 8 and remove one debuff.', (cb, t, p) => { const a = allyOf(t, p); cb.heal(a, 8, 'Cleansing Rain'); cb.cleanse(a, 1); }, { heal: 8 });
  H('soothing_mist', 'Soothing Mist', 'White', 20, 'self', 'Heal every ally for 10.', (cb) => { for (const a of cb.allies()) cb.heal(a, 10, 'Soothing Mist'); }, { heal: 10 });
  H('rain_mend', 'Rain Mend', 'Green', 10, 'ally', 'Heal an ally for 8 now and 5 a turn for 3 turns.', (cb, t, p) => { const a = allyOf(t, p); cb.heal(a, 8, 'Rain Mend'); a.hot.push({ n: 5, turns: 3 }); say(cb, `${a.name} heals 5 a turn for 3 turns.`); }, { heal: 23 });
  H('leaping_mend', 'Leaping Mend', 'Green', 20, 'ally', 'Heal an ally for 15, then the next most hurt ally for 8.', (cb, t, p) => { const a = allyOf(t, p); cb.heal(a, 15, 'Leaping Mend'); const o = cb.allies().filter(x => x !== a).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]; if (o) cb.heal(o, 8, 'Leaping Mend'); }, { heal: 23 });
  H('living_lightning', 'Living Lightning', 'Green', 20, 'ally', 'Heal an ally for 14. If it Multicasts, it also casts Chain Lightning.', (cb, t, p) => { cb.heal(allyOf(t, p), 14, 'Living Lightning'); if (cb._shIter === 'mc') recast(cb, p, C.sh_chain_lightning, null, 1, 'Living Lightning'); }, { heal: 14 });
  W('storm_ward', 'Storm Ward', 'Green', 'Skill', 10, 'ally', 'Nature', 'An ally takes 30% less damage until their next turn.', (cb, t, p) => { const a = allyOf(t, p); a.until.lessDmg = Math.max(a.until.lessDmg || 0, 0.3); say(cb, `${a.name} takes 30% less damage until their next turn.`); }, {});
  H('lifeline', 'Lifeline', 'Blue', 20, 'ally', 'Heal an ally for 23, or for 45 if they are below 30% health.', (cb, t, p) => { const a = allyOf(t, p); cb.heal(a, a.hp < a.maxHp * 0.3 ? 45 : 23, 'Lifeline'); }, { heal: 23 });
  H('tidal_surge', 'Tidal Surge', 'Blue', 30, 'self', 'Heal the whole party for 18.', (cb) => { for (const a of cb.allies()) cb.heal(a, 18, 'Tidal Surge'); }, { heal: 18 });
  POW('wellspring', 'Wellspring', 'Blue', 20, 'Power: your heals are 20% stronger, and each heal you cast gives its target 3 of their own defence.', { healMult: 1.2, onHeal: (cb, p, a, h) => { if (cb._ws || !cb._playing || cb._playing.isPower || !a || a.hp <= 0) return; cb._ws = true; cb.defFor(a, 3); cb._ws = false; } });
  POW('rainmaker', 'Rainmaker', 'Gold', 30, 'Power: at the start of your turn, heal the most hurt ally for 12. This heal can Multicast.', { turnStart: (cb, p) => { const a = hurtAlly(cb, p); cb.heal(a, 12, 'Rainmaker'); if (cb.rng() * 100 < p.multicast + (p.shMC || 0)) { cb.say('crit', 'Rainmaker Multicasts.'); cb.heal(hurtAlly(cb, p), 12, 'Rainmaker'); if (cb.has(p, 'codex_rainbringer')) p.shSure = true; if (has(cb, p, 'ancestral_echo')) p.shFreeHeal = true; } } });
  H('monsoon', 'Monsoon', 'Gold', 30, 'self', 'Heal the whole party for 15. Roll your Multicast chance for each ally: on a success that ally is healed again.', (cb, t, p) => { for (const a of cb.allies()) { cb.heal(a, 15, 'Monsoon'); if (cb.rng() * 100 < p.multicast + (p.shMC || 0)) { cb.say('crit', `Monsoon Multicasts on ${a.name}.`); cb.heal(a, 15, 'Monsoon'); if (cb._shSX) cb._shSX.didMC = true; } } }, { heal: 15 });
  POW('ancestral_echo', 'Ancestral Echo', 'Gold', 30, 'Power: when a heal Multicasts, your next heal costs 0.', { costLess: (cb, p, d) => (p.shFreeHeal && d.tags && d.tags.heal ? d.cost || 0 : 0) });
  W('last_light', 'Last Light', 'Gold', 'Skill', 30, 'ally', 'Nature', 'Until their next turn, an ally cannot drop below 1 health. Exhaust.', (cb, t, p) => { const a = allyOf(t, p); a.until.noDie = true; say(cb, `${a.name} cannot fall until their next turn.`); }, {}, { exhaust: true });

  // ================= debuffs and control =================
  LIT('drench', 'Drench', 'White', 10, 'enemy', 'Deal 4 Nature damage and apply Soaked (takes 20% more Nature damage).', (cb, t) => { const e = tgtOf(cb, t); deb(cb, e, 'soaked'); D_(cb, e, 4, 'Drench'); }, { dmg: 4, lit: 0 });
  LIT('weather_away', 'Weather Away', 'White', 10, 'enemy', 'Deal 4 Nature damage and apply Stormworn (all resistances -10%).', (cb, t) => { const e = tgtOf(cb, t); deb(cb, e, 'worn'); D_(cb, e, 4, 'Weather Away'); }, { dmg: 4, lit: 0 });
  W('shifting_ground', 'Shifting Ground', 'White', 'Skill', 10, 'enemy', 'Nature', 'Apply Unsteady (its Block stops nothing). Draw a card.', (cb, t, p) => { deb(cb, tgtOf(cb, t), 'unsteady'); cb.drawCards(p, 1); }, { draw: 1 });
  LIT('siphon_charge', 'Siphon Charge', 'White', 10, 'enemy', "Burn 10 of the target's mana and apply 2 Static.", (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const s = cb.drainMana(e, 10); say(cb, `Siphon Charge burns ${s} mana.`); stat(cb, e, 2); }, { noEcho: 1 });
  W('thunder_roar', 'Thunder Roar', 'White', 'Skill', 20, 'all', 'Nature', 'Apply Deafened (deals 15% less damage) to all enemies.', (cb) => { for (const e of cb.alive()) deb(cb, e, 'deaf'); }, { aoe: 1 });
  W('heavy_air', 'Heavy Air', 'Green', 'Skill', 10, 'enemy', 'Nature', "The target's next card costs 10 more. Draw a card.", (cb, t, p) => { const e = tgtOf(cb, t); if (e) { if (e.isPlayer) e.exposure = (e.exposure || 0) + 2; else { e.costUp = (e.costUp || 0) + 10; cb.planEnemy(e, true); } say(cb, `${e.name}'s next card costs 10 more.`); } cb.drawCards(p, 1); }, { draw: 1 });
  W('scatter', 'Scatter', 'Green', 'Skill', 20, 'enemy', 'Nature', 'The target discards a random card from its hand.', (cb, t) => { const e = tgtOf(cb, t); if (e) { if (cb.raidBoss(e)) say(cb, `${e.name} is a raid boss: it keeps its hand.`); else cb.eDiscard(e, 1); } }, {});
  W('brain_fog', 'Brain Fog', 'Green', 'Skill', 10, 'enemy', 'Nature', "Shuffle 2 Dazed into the target's deck.", (cb, t) => { const e = tgtOf(cb, t); if (e) cb.eStatus(e, 'dazed', 2); }, {});
  LIT('thunderstruck', 'Thunderstruck', 'Green', 20, 'enemy', 'Deal 8 Nature damage. If the target is Deafened, Silence it: it only plays Attacks on its next turn.', (cb, t) => { const e = tgtOf(cb, t), was = e && e.sh && e.sh.deaf > 0; D_(cb, e, 8, 'Thunderstruck'); if (was && e.hp > 0 && !e.isPlayer) { if (cb.raidBoss(e)) say(cb, `${e.name} is a raid boss: it can't be Silenced.`); else { e.silenced = 1; cb.planEnemy(e, true); say(cb, `${e.name} is Silenced.`); } } }, { dmg: 8, lit: 0 });
  W('toad_curse', 'Toad Curse', 'Blue', 'Skill', 20, 'enemy', 'Nature', 'The target becomes a toad for 1 turn and cannot act.', (cb, t) => { const e = tgtOf(cb, t); if (e && stunFor(cb, e, 1, 'a toad')) e.toad = 1; }, {});
  W('mana_lock', 'Mana Lock', 'Blue', 'Skill', 20, 'enemy', 'Nature', 'The target gains no mana on its next turn.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; if (e.isPlayer) e.noRegenTurns = (e.noRegenTurns || 0) + 1; else e.manaLock = (e.manaLock || 0) + 1; say(cb, `${e.name} gains no mana on its next turn.`); }, {});
  W('fray', 'Fray', 'Blue', 'Skill', 20, 'enemy', 'Nature', "Burn the top 2 cards of the target's deck.", (cb, t) => { const e = tgtOf(cb, t); if (!e) return; if (cb.raidBoss(e)) { say(cb, `${e.name} is a raid boss: its deck is untouched.`); return; } const gone = e.drawPile.splice(-2); if (e.isPlayer) e.exhaust.push(...gone); say(cb, gone.length ? `${e.name} loses ${gone.map(c => c.name || (C[c.key] || {}).name).join(' and ')} from its deck.` : `${e.name}'s deck is empty.`); }, {});
  W('stolen_hour', 'Stolen Hour', 'Gold', 'Skill', 30, 'enemy', 'Nature', 'The target loses its next turn. Exhaust.', (cb, t) => { stunFor(cb, tgtOf(cb, t), 1, 'frozen in time'); }, {}, { exhaust: true });
  POW('eye_of_the_hurricane', 'Eye of the Hurricane', 'Gold', 30, 'Power: while an enemy is Stunned or a toad, your cards cost 10 less.', { costLess: (cb, p) => (cb.alive().some(stunned) ? 10 : 0) });
  W('deluge', 'Deluge', 'Gold', 'Skill', 30, 'all', 'Nature', 'Apply Soaked, Deafened, Unsteady, Stormworn and 3 Static to all enemies.', (cb) => { for (const e of cb.alive()) { for (const k of ['soaked', 'deaf', 'unsteady', 'worn']) deb(cb, e, k); stat(cb, e, 3); } }, { aoe: 1 });
  POW('overcast', 'Overcast', 'Gold', 20, 'Power: at the start of your turn, every enemy that is not Soaked, Deafened or Stormworn gains the ones it is missing.', { turnStart: (cb, p) => { for (const e of cb.alive()) if (!e.isPlayer) for (const k of ['soaked', 'deaf', 'worn']) if (!(e.sh && e.sh[k] > 0)) deb(cb, e, k); } });
  // ---- skipping a turn (Calm Eye)
  W('held_breath', 'Held Breath', 'White', 'Skill', 0, 'self', null, 'Gain 6 Guard and end your turn. Playing this does not count as acting.', (cb) => { cb.gainDef(6); cb._endAfter = true; }, { def: 6 }, { shNoAct: true });
  POW('quiet_sky', 'Quiet Sky', 'White', 10, 'Power: each turn you end without acting, gain 8 Guard.', { shIdle: (cb, p) => cb.gainDef(8) });
  POW('patience', 'Patience', 'Green', 10, 'Power: after a turn you end without acting, your cards cost 10 less on your next turn.', { shIdle: (cb, p) => { p.shCostNext = 10; } });
  POW('calm_before_the_storm', 'Calm Before the Storm', 'Green', 10, 'Power: after a turn you end without acting, gain 20 extra mana and draw 2 extra cards on your next turn.', { shIdle: (cb, p) => { p.manaNext += 20; p.drawNext = (p.drawNext || 0) + 2; } });
  POW('coiled_storm', 'Coiled Storm', 'Green', 10, 'Power: each turn you end without acting, your next card deals 30% more (stacks up to 3 turns).', { shIdle: (cb, p) => { p.shCoil = Math.min(3, (p.shCoil || 0) + 1); } });
  POW('deep_listening', 'Deep Listening', 'Green', 10, 'Power: after a turn you end without acting, look at the top 3 cards of your deck at the start of your next turn and take one.', { shIdle: (cb, p) => { p.shListen = true; } });
  POW('loaded_sky', 'Loaded Sky', 'Blue', 20, 'Power: each turn you end without acting, all enemies gain 2 Static and lose 10 mana.', { shIdle: (cb, p) => { for (const e of cb.alive()) { stat(cb, e, 2); cb.drainMana(e, 10); } } });
  POW('gathering_storm', 'Gathering Storm', 'Blue', 20, 'Power: each turn you end without acting, apply 3 Static to all enemies and gain 5% damage for the rest of the fight.', { shIdle: (cb, p) => { for (const e of cb.alive()) stat(cb, e, 3); p.shDmgUp = (p.shDmgUp || 0) + 5; say(cb, `Gathering Storm: +${p.shDmgUp}% damage.`); } });
  POW('the_long_wait', 'The Long Wait', 'Blue', 20, 'Power: after two turns in a row without acting, your next card is played three times.', {});
  POW('stillness', 'Stillness', 'Gold', 30, 'Power: a turn you end without acting does not add to enemy Pressure, and you take 25% less damage until your next turn.', { shIdle: (cb, p) => { p.until.lessDmg = Math.max(p.until.lessDmg || 0, 0.25); if (cb._pressRound !== cb.round) { cb._pressRound = cb.round; cb.pressSkip = (cb.pressSkip || 0) + 1; } } });
  W('thunder_debt', 'Thunder Debt', 'Blue', 'Skill', 20, 'self', null, 'Take an extra turn now: draw a new hand and gain your mana again. You cannot act on your next turn.', (cb, t, p) => { p.shSkip = (p.shSkip || 0) + 1; p.discard.push(...p.hand.splice(0)); cb.drawCards(p, p.draw); p.mana = Math.min(Math.max(p.mana, p.maxMana), p.mana + p.regen); p.turnAttacks = 0; p.turnSkills = 0; say(cb, 'Thunder Debt: an extra turn now, paid for next turn.'); }, { draw: 3 });
  W('borrowed_thunder', 'Borrowed Thunder', 'Gold', 'Skill', 30, 'self', null, 'All enemies lose their next turn. You cannot act for your next two turns, and your first card after that is played three times. Exhaust.', (cb, t, p) => { for (const e of cb.alive()) stunFor(cb, e, 1); p.shSkip = (p.shSkip || 0) + 2; p.shNextX = 3; cb._endAfter = true; }, {}, { exhaust: true });

  // ================= defence and tank =================
  W('wind_step', 'Wind Step', 'White', 'Skill', 10, 'self', null, 'Gain 6 Guard and draw a card.', (cb, t, p) => { cb.gainDef(6); cb.drawCards(p, 1); }, { def: 6, draw: 1 });
  W('stone_guard', 'Stone Guard', 'White', 'Skill', 10, 'self', null, 'Gain 7 Guard (11 with a shield).', (cb, t, p) => cb.gainDef(shield(p) ? 11 : 7), { def: 7 });
  W('dig_in', 'Dig In', 'White', 'Skill', 10, 'self', null, 'Gain 6 Guard. Until your next turn, enemies that hit you gain 2 Static.', (cb, t, p) => { cb.gainDef(6); p.until.shHitStatic = (p.until.shHitStatic || 0) + 2; }, { def: 6 });
  W('war_drum', 'War Drum', 'White', 'Skill', 10, 'self', null, "Each other hero's next card deals 20% more. Alone, your own next card does.", (cb, t, p) => { const o = cb.allies().filter(a => a !== p); for (const a of (o.length ? o : [p])) a.nextCardX = 1.2; say(cb, 'War Drum: the next card deals 20% more.'); }, {});
  W('ride_the_wind', 'Ride the Wind', 'Green', 'Skill', 10, 'self', null, 'Gain 20 Guard.', (cb) => cb.gainDef(20), { def: 20 });
  W('become_the_storm', 'Become the Storm', 'Blue', 'Skill', 20, 'self', null, 'Gain 40 Guard.', (cb) => cb.gainDef(40), { def: 40 });
  W('thunderous_challenge', 'Thunderous Challenge', 'Green', 'Skill', 10, 'self', null, 'Taunt all enemies until your next turn and gain 6 Guard.', (cb, t, p) => { cb.setTaunt(p); cb.gainDef(6); }, { def: 6 });
  W('thunder_wall', 'Thunder Wall', 'Green', 'Skill', 20, 'self', null, 'Gain 10 Guard (14 with a shield). Until your next turn, enemies that hit you are Deafened.', (cb, t, p) => { cb.gainDef(shield(p) ? 14 : 10); p.until.shHitDeaf = true; }, { def: 10 });
  W('rallying_thunder', 'Rallying Thunder', 'Green', 'Skill', 20, 'self', null, 'The party gains 10 Strength and 10 Intelligence for 3 turns.', (cb, t, p) => { for (const a of cb.allies()) timedBuff(cb, p, a, 'sh_rally', 3, { begin: (c, q) => { q.strength += 10; q.intelligence += 10; }, end: (c, q) => { q.strength -= 10; q.intelligence -= 10; } }); say(cb, 'The party gains 10 Strength and 10 Intelligence.'); }, {});
  W('stand_fast', 'Stand Fast', 'Blue', 'Skill', 10, 'self', null, 'Your Guard does not fade at the start of your next turn. Draw a card.', (cb, t, p) => { p.until.keepBlock = true; cb.drawCards(p, 1); }, { draw: 1 });
  W('slip_the_bolt', 'Slip the Bolt', 'Blue', 'Skill', 20, 'self', null, 'The next attack against you before your next turn misses, and its attacker gains 3 Static.', (cb, t, p) => { p.until.shSlip = 1; }, {});
  W('stormfathers_ward', "Stormfather's Ward", 'Blue', 'Skill', 20, 'self', null, 'Every hero gains 8 of their own defence.', (cb) => { for (const a of cb.allies()) cb.defFor(a, 8); }, { def: 8 });
  POW('unbowed', 'Unbowed', 'Blue', 20, 'Power: when your Guard fully stops an attack, the attacker gains 2 Static.', { fullBlock: (cb, p, e) => stat(cb, e, 2) });
  POW('lightning_shield', 'Lightning Shield', 'Gold', 30, 'Power: every hit against you applies 1 Static to the attacker.', { hitBy: (cb, p, e) => stat(cb, e, 1) });
  POW('spirit_link', 'Spirit Link', 'Gold', 30, 'Power: all damage to the party is split evenly between its members.', {});
  POW('storms_aegis', "Storm's Aegis", 'Gold', 30, 'Power: you take 10% of the damage dealt to each ally in their place, and gain 2 Guard for each ally at the start of your turn.', { turnStart: (cb, p) => { const n = cb.allies().filter(a => a !== p).length; if (n) cb.gainDef(2 * n); } });

  // ================= draw and mana =================
  W('gathering_clouds', 'Gathering Clouds', 'White', 'Skill', 10, 'self', null, 'Draw 2.', (cb, t, p) => cb.drawCards(p, 2), { draw: 2 });
  W('tailwind', 'Tailwind', 'White', 'Skill', 10, 'self', null, 'Draw a card. Your next card this turn costs 10 less.', (cb, t, p) => { cb.drawCards(p, 1); p.turn.nextCost = (p.turn.nextCost || 0) - 10; }, { draw: 1 });
  W('deep_breath', 'Deep Breath', 'White', 'Skill', 0, 'self', null, 'Gain 20 mana. Exhaust.', (cb, t, p) => { p.mana += 20; say(cb, `+20 mana (${p.mana}).`); }, { mana: 20 }, { exhaust: true });
  W('read_the_sky', 'Read the Sky', 'Green', 'Skill', 10, 'self', null, 'Look at the top 3 cards of your deck and take one.', (cb, t, p) => cb.topPick(p, 3), { draw: 1 });
  W('squall', 'Squall', 'Green', 'Skill', 10, 'self', null, 'Discard your hand and draw that many plus 1.', (cb, t, p) => { const n = p.hand.length; p.discard.push(...p.hand.splice(0)); cb.drawCards(p, n + 1); }, { draw: 2 });
  POW('rainwell', 'Rainwell', 'Green', 10, 'Power: +5 mana regeneration.', { onPlay: (cb, p, pw) => { p.regen += pw.upN ? pw.upN[0] : 5; } });
  W('ride_the_lightning', 'Ride the Lightning', 'Blue', 'Skill', 10, 'self', null, 'Draw a card for each enemy with Static (up to 3).', (cb, t, p) => { const n = Math.min(3, cb.alive().filter(e => e.static > 0).length); if (n) cb.drawCards(p, n); else say(cb, 'No enemy has Static.'); }, { draw: 2 });
  W('storm_surge', 'Storm Surge', 'Gold', 'Skill', 20, 'self', null, 'Draw 3 and gain 20 mana. Exhaust.', (cb, t, p) => { cb.drawCards(p, 3); p.mana += 20; }, { draw: 3, mana: 20 }, { exhaust: true });
}
const API = { install, X };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CB_SHAMAN = API;
})(typeof window !== 'undefined' ? window : globalThis);
