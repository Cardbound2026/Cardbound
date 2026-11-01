// The Warlock (Nov 1): the fifth class. Shadow damage, two shadow damage-over-time effects, curses, Fear and Stun,
// temporary Armors, demons, and Absorb as its defense (overhealing a Warlock turns the excess into Absorb).
//   Dread: like Poison. Stacks, ignores Absorb/Block, deals its stacks at the start of the target's turn, then loses 1.
//   Rot: each application deals its amount over 4 turns (12 Rot ticks 3/3/3/3); every application keeps its own timer.
//   Both scale with Intelligence (and Spirit).
// Six codexes: Soulbinder (party healing), Blightcaller (Dread), Shadow Knight (two-handed Strength), Demonologist (demons),
// Bloodmancer (pay HP, physical spells that scale with Intelligence, drains) and Umbral Ruin (shadow nukes and crits).
// The engine holds the systems (Combat.addRot / fear / stun / armor / summon / demonsAct, see engine.js); this file holds the cards.
(function (root) {
'use strict';
function install(K) {
  const { card, C, POWERS, DEMONS, tgtOf, D_, DA, say } = K;
  const CLS = 'Warlock';
  const W = (key, name, rarity, type, cost, target, dtype, text, play, tags, ex) => {
    if (C[key]) throw new Error('Warlock card key taken: ' + key);
    card(key, Object.assign({ cls: CLS, name, rarity, type, cost, target, dtype: dtype || (type === 'Attack' ? 'Physical' : undefined), text, play: (cb, t) => play(cb, t, cb.player), tags: tags || {} }, ex || {}));
  };
  const POW = (key, name, rarity, cost, text, def) => {
    if (C[key]) throw new Error('Warlock power key taken: ' + key);
    POWERS[key] = def || {};
    card(key, { cls: CLS, name, rarity, type: 'Power', cost, target: 'self', text, exhaust: true, powerKey: key, play: (cb) => cb.addPower(cb.player, key, name, text), tags: { power: 1 } });
  };
  const dot = (cb, e, key, n) => { if (e && e.hp > 0 && !cb.over) cb.applyDot(e, key, n); };
  const allies = (cb) => cb.allies();
  const healAll = (cb, n, label) => { for (const a of cb.allies()) cb.heal(a, n, label); };
  const beacon = (cb, p, e, pct) => { if (!e || e.isPlayer || e.hp <= 0) return; for (const x of cb.foes()) if (x.beacon && x.beacon.by === p.id) x.beacon = null; e.beacon = { by: p.id, pct }; say(cb, `${e.name} carries ${p.name}'s Soul Beacon: damage to it heals every hero for ${pct}% of it.`); };
  const myDemons = (p) => (p.demons || []).filter(d => d.hp > 0);
  const missing = (p) => 1 - p.hp / p.maxHp;

  // ---------------- demons ----------------
  // hp is a % of the owner's max HP; damage scales like a Skill (Intelligence, Shadow damage bonus) and with demon-damage bonuses
  const hitBy = (cb, p, e, n, name) => cb.powerHit(p, e, n, name, 'Shadow', 'Skill');
  Object.assign(DEMONS, {
    imp: { name: 'Gloom Imp', short: 'Imp', hp: 15, text: 'Deals 6 Shadow damage to a random enemy at the end of your turn.', act: (cb, p, dm, e, sc) => hitBy(cb, p, e, sc(6), 'Gloom Imp') },
    bulwark: { name: 'Bulwark Fiend', short: 'Fiend', hp: 35, taunt: true, text: 'Taunts: single-target enemy attacks hit it instead of the party. Deals 4 Shadow damage.', act: (cb, p, dm, e, sc) => hitBy(cb, p, e, sc(4), 'Bulwark Fiend') },
    ruin: { name: 'Ruin Fiend', short: 'Ruin', hp: 25, text: 'Deals 16 Shadow damage to the enemy with the most HP.', pick: (cb) => cb.foes().slice().sort((a, b) => b.hp - a.hp)[0], act: (cb, p, dm, e, sc) => hitBy(cb, p, e, sc(16), 'Ruin Fiend') },
    temptress: { name: 'Shade Temptress', short: 'Shade', hp: 20, text: 'Her first action Fears an enemy. Each action deals 4 Shadow damage and applies 10 Weak.', act: (cb, p, dm, e, sc) => { if (!dm.acts) cb.fear(e); hitBy(cb, p, e, sc(4), 'Shade Temptress'); if (e.hp > 0) { e.weak += 10; say(cb, `${e.name} gains 10 Weak.`); } } },
    hound: { name: 'Hollow Hound', short: 'Hound', hp: 25, text: 'Deals 6 Shadow damage, drains 8 mana (you gain it) and strips 1 buff.', act: (cb, p, dm, e, sc) => { hitBy(cb, p, e, sc(6), 'Hollow Hound'); if (e.hp > 0) { const s = cb.drainMana(e, 8); p.mana += s; if (s) say(cb, `Hollow Hound drains ${s} mana for ${p.name}.`); cb.removeBuffs(e, 1); } } },
  });
  const sum = (key, extra) => (cb, t, p) => { cb.summon(p, key); if (extra) extra(cb, t, p); };

  // ================= White =================
  W('shadow_bolt', 'Shadow Bolt', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Deal 9 Shadow damage.', (cb, t) => D_(cb, t, 9, 'Shadow Bolt'), { dmg: 9 });
  W('dark_ward', 'Dark Ward', 'White', 'Skill', 10, 'self', null, 'Gain 10 Absorb.', (cb) => cb.gainDef(10), { def: 10 });
  W('dread_touch', 'Dread Touch', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Deal 4 Shadow damage and apply 5 Dread. (Dread ignores Absorb and Block, deals its stacks each turn, then loses 1.)', (cb, t) => { const e = D_(cb, t, 4, 'Dread Touch'); dot(cb, e, 'dread', 5); }, { dmg: 4, dot: 15 });
  W('rotting_grasp', 'Rotting Grasp', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Apply 18 Rot. (Rot deals its amount over 4 turns and ignores Block.)', (cb, t) => dot(cb, tgtOf(cb, t), 'rot', 18), { dot: 18 });
  W('siphon_soul', 'Siphon Soul', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Deal 6 Shadow damage. Heal 4 HP.', (cb, t, p) => { D_(cb, t, 6, 'Siphon Soul'); cb.heal(p, 4, 'Siphon Soul'); }, { dmg: 6, heal: 4 });
  W('nether_bolt', 'Nether Bolt', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Deal 6 Shadow damage. Gain 5 Absorb.', (cb, t) => { D_(cb, t, 6, 'Nether Bolt'); cb.gainDef(5); }, { dmg: 6, def: 5 });
  W('hex_of_weakness', 'Hex of Weakness', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Curse: apply 12 Weak. Draw 1 card.', (cb, t, p) => { const e = tgtOf(cb, t); if (e) { e.weak += 12; say(cb, `${e.name} gains 12 Weak.`); } cb.drawCards(p, 1); }, { draw: 1, curse: 1 });
  W('dark_pact', 'Dark Pact', 'White', 'Skill', 0, 'self', null, 'Lose 4 HP. Gain 12 mana.', (cb, t, p) => { cb.loseHp(p, 4, 'Dark Pact'); p.mana += 12; say(cb, `+12 mana (${p.mana}).`); }, { mana: 12 });
  W('shadow_mend', 'Shadow Mend', 'White', 'Skill', 10, 'ally', 'Shadow', 'Heal an ally (or yourself) for 9 HP. (A Warlock\'s overhealing becomes Absorb.)', (cb, t, p) => cb.heal(t && t.isPlayer && t.hp > 0 ? t : p, 9, 'Shadow Mend'), { heal: 9 });
  W('grim_swing', 'Grim Swing', 'White', 'Attack', 10, 'enemy', 'Physical', 'Deal 11 damage.', (cb, t) => D_(cb, t, 11, 'Grim Swing'), { dmg: 11 });
  W('dread_blade', 'Dread Blade', 'White', 'Attack', 10, 'enemy', 'Physical', 'Deal 7 damage and apply 3 Dread.', (cb, t) => { const e = D_(cb, t, 7, 'Dread Blade'); dot(cb, e, 'dread', 3); }, { dmg: 7, dot: 6 });
  W('life_tap_strike', 'Leeching Strike', 'White', 'Attack', 10, 'enemy', 'Physical', 'Deal 8 damage. Heal 4 HP.', (cb, t, p) => { D_(cb, t, 8, 'Leeching Strike'); cb.heal(p, 4, 'Leeching Strike'); }, { dmg: 8, heal: 4 });
  W('summon_gloom_imp', 'Summon Gloom Imp', 'White', 'Skill', 10, 'self', 'Shadow', 'Summon a Gloom Imp for 2 turns: at the end of each of your turns it deals 6 Shadow damage to a random enemy.', sum('imp'), { summon: 1 });
  W('demon_whip', 'Demon Whip', 'White', 'Skill', 10, 'self', null, 'Each of your demons acts once now (it keeps its turns). Draw 1 card.', (cb, t, p) => { const ds = myDemons(p); if (!ds.length) say(cb, 'You have no demons to command.'); for (const dm of ds) if (!cb.over) cb.demonAct(p, dm); cb.player = p; cb.drawCards(p, 1); }, { draw: 1 });
  W('blood_offering', 'Blood Offering', 'White', 'Skill', 0, 'self', null, 'Lose 4 HP. Draw 2 cards.', (cb, t, p) => { cb.loseHp(p, 4, 'Blood Offering'); cb.drawCards(p, 2); }, { draw: 2 });
  W('rot_seed', 'Rot Seed', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Deal 5 Shadow damage and apply 10 Rot.', (cb, t) => { const e = D_(cb, t, 5, 'Rot Seed'); dot(cb, e, 'rot', 10); }, { dmg: 5, dot: 10 });
  W('blood_bolt', 'Blood Bolt', 'White', 'Skill', 10, 'enemy', 'Physical', 'Deal 10 Physical damage. (A Physical spell: it scales with Intelligence.)', (cb, t) => D_(cb, t, 10, 'Blood Bolt'), { dmg: 10 });
  W('crimson_flay', 'Crimson Flay', 'White', 'Skill', 10, 'enemy', 'Physical', 'Deal 6 Physical damage twice. Lose 2 HP.', (cb, t, p) => { const e = D_(cb, t, 6, 'Crimson Flay'); D_(cb, e, 6, 'Crimson Flay'); cb.loseHp(p, 2, 'Crimson Flay'); }, { dmg: 12, hits: 2 });
  W('sap_mana', 'Sap Mana', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Deal 5 Shadow damage. Drain 8 mana from the target and gain it.', (cb, t, p) => { const e = D_(cb, t, 5, 'Sap Mana'); if (e && e.hp > 0) { const s = cb.drainMana(e, 8); p.mana += s; say(cb, `Drained ${s} mana.`); } }, { dmg: 5 });
  W('umbral_spike', 'Umbral Spike', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Deal 8 Shadow damage with +15% crit chance. If it crits, draw 1 card.', (cb, t, p) => { p.turn.critPlus = (p.turn.critPlus || 0) + 15; D_(cb, t, 8, 'Umbral Spike'); p.turn.critPlus -= 15; if (cb._lastCrit) cb.drawCards(p, 1); }, { dmg: 8 });
  W('shadow_lash', 'Shadow Lash', 'White', 'Attack', 10, 'enemy', 'Shadow', 'Deal 9 Shadow damage. (A Shadow Attack: it scales with Strength.)', (cb, t) => D_(cb, t, 9, 'Shadow Lash'), { dmg: 9 });
  W('lingering_dread', 'Lingering Dread', 'White', 'Skill', 10, 'enemy', 'Shadow', 'Apply 8 Dread.', (cb, t) => dot(cb, tgtOf(cb, t), 'dread', 8), { dot: 21 });
  W('dark_bargain', 'Dark Bargain', 'White', 'Skill', 10, 'self', null, 'Gain 7 Absorb. Draw 1 card.', (cb, t, p) => { cb.gainDef(7); cb.drawCards(p, 1); }, { def: 7, draw: 1 });
  W('soul_spark', 'Soul Spark', 'White', 'Skill', 0, 'enemy', 'Shadow', 'Deal 4 Shadow damage. Exhaust.', (cb, t) => D_(cb, t, 4, 'Soul Spark'), { dmg: 4 }, { exhaust: true });

  // ================= Green =================
  W('drain_life', 'Drain Life', 'Green', 'Skill', 20, 'enemy', 'Shadow', 'Deal 13 Shadow damage. Heal for 50% of the damage dealt.', (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const lost = cb.hit(e, 13, 'Drain Life'); cb.heal(p, Math.round(lost * 0.5), 'Drain Life'); }, { dmg: 13, heal: 6 });
  W('curse_of_frailty', 'Curse of Frailty', 'Green', 'Skill', 10, 'enemy', 'Shadow', 'Curse: apply 15 Weak and 15 Vulnerable.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; e.weak += 15; e.vulnerable += 15; say(cb, `${e.name} gains 15 Weak and 15 Vulnerable.`); }, { curse: 1 });
  W('shadow_volley', 'Shadow Volley', 'Green', 'Skill', 20, 'all', 'Shadow', 'Deal 9 Shadow damage to all enemies. Breaks Stealth.', (cb) => DA(cb, 9, 'Shadow Volley'), { dmg: 9, aoe: 1 });
  W('summon_imp_swarm', 'Imp Swarm', 'Green', 'Skill', 20, 'self', 'Shadow', 'Summon 2 Gloom Imps for 2 turns: at the end of each of your turns each deals 6 Shadow damage to a random enemy.', (cb, t, p) => { cb.summon(p, 'imp'); cb.summon(p, 'imp'); }, { summon: 2 });
  W('summon_hollow_hound', 'Summon Hollow Hound', 'Green', 'Skill', 10, 'self', 'Shadow', 'Summon a Hollow Hound for 2 turns: each turn it deals 6 Shadow damage, drains 8 mana for you and strips a buff.', sum('hound'), { summon: 1 });
  W('terrify', 'Terrify', 'Green', 'Skill', 20, 'enemy', 'Shadow', 'Fear the target: it skips its attacks on its next turn. (An enemy can\'t be Feared or Stunned again for 2 rounds.)', (cb, t) => cb.fear(tgtOf(cb, t)), { control: 1 });
  W('death_coil', 'Death Coil', 'Green', 'Skill', 20, 'enemy', 'Shadow', 'Deal 10 Shadow damage and Fear the target. Heal 6 HP.', (cb, t, p) => { const e = D_(cb, t, 10, 'Death Coil'); if (e && e.hp > 0) cb.fear(e); cb.heal(p, 6, 'Death Coil'); }, { dmg: 10, heal: 6, control: 1 });
  W('curse_of_agony', 'Curse of Agony', 'Green', 'Skill', 10, 'enemy', 'Shadow', 'Curse: apply 26 Rot.', (cb, t) => dot(cb, tgtOf(cb, t), 'rot', 26), { dot: 26, curse: 1 });
  W('creeping_dread', 'Creeping Dread', 'Green', 'Skill', 20, 'all', 'Shadow', 'Apply 4 Dread to all enemies. Breaks Stealth.', (cb) => { for (const e of cb.alive()) dot(cb, e, 'dread', 4); }, { dot: 10, aoe: 1 });
  W('dread_pulse', 'Dread Pulse', 'Green', 'Skill', 10, 'enemy', 'Shadow', 'Deal Shadow damage equal to the target\'s Dread, plus 4.', (cb, t) => { const e = tgtOf(cb, t); if (e) cb.hit(e, (e.dread || 0) + 4, 'Dread Pulse'); }, { dmg: 4 });
  W('wither', 'Wither', 'Green', 'Skill', 10, 'enemy', 'Shadow', 'Apply 4 Dread. If the target already had Dread, apply 4 more.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const had = e.dread > 0; dot(cb, e, 'dread', 4); if (had) dot(cb, e, 'dread', 4); }, { dot: 20 });
  W('unstable_rot', 'Unstable Rot', 'Green', 'Skill', 20, 'enemy', 'Shadow', 'Apply 38 Rot.', (cb, t) => dot(cb, tgtOf(cb, t), 'rot', 38), { dot: 38 });
  W('nether_shield', 'Nether Shield', 'Green', 'Skill', 10, 'self', null, 'Gain 14 Absorb.', (cb) => cb.gainDef(14), { def: 14 });
  W('soul_link', 'Soul Link', 'Green', 'Skill', 10, 'self', 'Shadow', 'Heal every hero 7 HP.', (cb) => healAll(cb, 7, 'Soul Link'), { heal: 7 });
  W('shadow_strike', 'Shadow Strike', 'Green', 'Attack', 10, 'enemy', 'Shadow', 'Deal 14 Shadow damage.', (cb, t) => D_(cb, t, 14, 'Shadow Strike'), { dmg: 14 });
  W('dark_cleave', 'Dark Cleave', 'Green', 'Attack', 20, 'all', 'Physical', 'Deal 11 damage to all enemies. Breaks Stealth.', (cb) => DA(cb, 11, 'Dark Cleave'), { dmg: 11, aoe: 1 });
  W('harvest_life', 'Harvest Life', 'Green', 'Attack', 20, 'enemy', 'Physical', 'Deal 15 damage. Heal for 40% of the damage dealt.', (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const lost = cb.hit(e, 15, 'Harvest Life'); cb.heal(p, Math.round(lost * 0.4), 'Harvest Life'); }, { dmg: 15, heal: 6 });
  W('blood_boil', 'Blood Boil', 'Green', 'Skill', 20, 'all', 'Physical', 'Deal 9 Physical damage to all enemies. Lose 3 HP. Breaks Stealth.', (cb, t, p) => { DA(cb, 9, 'Blood Boil'); cb.loseHp(p, 3, 'Blood Boil'); }, { dmg: 9, aoe: 1 });
  W('hemorrhaging_hex', 'Hemorrhaging Hex', 'Green', 'Skill', 10, 'enemy', 'Physical', 'Deal 15 Physical damage. Lose 4 HP.', (cb, t, p) => { D_(cb, t, 15, 'Hemorrhaging Hex'); cb.loseHp(p, 4, 'Hemorrhaging Hex'); }, { dmg: 15 });
  W('mana_leech', 'Mana Leech', 'Green', 'Skill', 10, 'enemy', 'Shadow', 'Deal 5 Shadow damage. Drain 15 mana from the target and gain it.', (cb, t, p) => { const e = D_(cb, t, 5, 'Mana Leech'); if (e && e.hp > 0) { const s = cb.drainMana(e, 15); p.mana += s; say(cb, `Drained ${s} mana.`); } }, { dmg: 5 });
  W('crimson_siphon', 'Crimson Siphon', 'Green', 'Skill', 10, 'enemy', 'Physical', 'Deal 8 Physical damage. Drain 6 mana from the target and gain it. Heal 4 HP.', (cb, t, p) => { const e = D_(cb, t, 8, 'Crimson Siphon'); if (e && e.hp > 0) { const s = cb.drainMana(e, 6); p.mana += s; } cb.heal(p, 4, 'Crimson Siphon'); }, { dmg: 8, heal: 4 });
  W('blood_price', 'Blood Price', 'Green', 'Skill', 0, 'self', null, 'Lose 6 HP. Your next damaging Skill deals 50% more damage.', (cb, t, p) => { cb.loseHp(p, 6, 'Blood Price'); p.nextSkillMult = 1.5; say(cb, 'Your next damaging Skill deals 50% more damage.'); }, { setup: 'skill' });
  W('shadowburn', 'Shadowburn', 'Green', 'Skill', 10, 'enemy', 'Shadow', 'Deal 11 Shadow damage. If the target is below 30% HP, deal 30 instead.', (cb, t) => { const e = tgtOf(cb, t); if (e) cb.hit(e, e.hp < e.maxHp * 0.3 ? 30 : 11, 'Shadowburn'); }, { dmg: 11, execute: 30 });
  W('curse_of_tongues', 'Curse of Tongues', 'Green', 'Skill', 10, 'enemy', 'Shadow', 'Curse: apply 4 Exposure (its cards cost 20% more) and drain 6 mana.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; e.exposure = (e.exposure || 0) + 4; cb.drainMana(e, 6); say(cb, `${e.name} gains 4 Exposure.`); if (!e.isPlayer) cb.planEnemy(e, true); }, { curse: 1 });
  W('curse_of_shadows', 'Curse of Shadows', 'Green', 'Skill', 10, 'enemy', 'Shadow', 'Curse: apply 20 Unwarded (it takes 20% more magic damage).', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; e.unwarded = (e.unwarded || 0) + 20; say(cb, `${e.name} gains 20 Unwarded.`); }, { curse: 1 });
  W('fel_command', 'Fel Command', 'Green', 'Skill', 10, 'self', null, 'Your demons stay 1 turn longer. Draw 1 card.', (cb, t, p) => { for (const dm of myDemons(p)) dm.turns++; say(cb, 'Your demons stay 1 turn longer.'); cb.drawCards(p, 1); }, { draw: 1 });
  W('sacrifice', 'Sacrifice', 'Green', 'Skill', 0, 'self', null, 'Banish your weakest demon: gain Absorb equal to its HP and 10 mana.', (cb, t, p) => { const ds = myDemons(p).sort((a, b) => a.hp - b.hp); if (!ds.length) { say(cb, 'No demon to sacrifice.'); return; } const dm = ds[0]; p.demons = p.demons.filter(x => x !== dm); p.block += dm.hp; p.mana += 10; say(cb, `${dm.name} is sacrificed: +${dm.hp} Absorb and +10 mana.`); }, { def: 10 });
  W('dread_strike', 'Dread Strike', 'Green', 'Attack', 10, 'enemy', 'Physical', 'Deal 8 damage. Apply Dread equal to half the damage dealt.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const lost = cb.hit(e, 8, 'Dread Strike'); dot(cb, e, 'dread', Math.max(1, Math.round(lost / 2))); }, { dmg: 8, dot: 8 });
  W('void_rift', 'Void Rift', 'Green', 'Skill', 20, 'enemy', 'Shadow', 'Deal 20 Shadow damage.', (cb, t) => D_(cb, t, 20, 'Void Rift'), { dmg: 20 });
  W('fading_veil', 'Fading Veil', 'Green', 'Skill', 10, 'self', null, 'Gain 9 Absorb. Next turn, gain 6 Absorb.', (cb, t, p) => { cb.gainDef(9); p.defNext += 6; }, { def: 13 });
  W('profane_bond', 'Profane Bond', 'Green', 'Skill', 10, 'ally', 'Shadow', 'An ally (or you) heals 10 HP and you gain 6 Absorb.', (cb, t, p) => { cb.heal(t && t.isPlayer && t.hp > 0 ? t : p, 10, 'Profane Bond'); cb.gainDef(6); }, { heal: 10, def: 6 });

  // ================= Blue =================
  const ARMOR = (key, name, label, text, opts) => W(key, name, 'Blue', 'Skill', 10, 'self', null, text + ' (One Armor at a time.) Exhaust.', (cb, t, p) => { cb.armor(p, label, 3, opts(cb, p)); say(cb, `${name}: ${text}`); }, { armor: 1 }, { exhaust: true });
  ARMOR('shadow_armor', 'Shadow Armor', 'shadowArmor', 'For 3 turns, take 25% less damage.', () => ({ pct: 25 }));
  ARMOR('blood_armor', 'Blood Armor', 'bloodArmor', 'For 3 turns, heal 6 HP at the start of each of your turns.', () => ({ each: (cb, q) => cb.heal(q, 6, 'Blood Armor') }));
  ARMOR('soul_armor', 'Soul Armor', 'soulArmor', 'For 3 turns, +15 mana regeneration.', () => ({ begin: (cb, q) => { q.regen += 15; }, end: (cb, q, t) => { if (!t.done) { t.done = true; q.regen -= 15; } } }));
  ARMOR('nether_armor', 'Nether Armor', 'netherArmor', 'For 3 turns, gain 6 Absorb every time an enemy hits you.', () => ({ n: 6 }));
  ARMOR('demon_armor', 'Demon Armor', 'demonArmor', 'For 3 turns, 30% of the damage you take goes to your demons instead.', () => ({ pct: 30 }));
  W('summon_bulwark_fiend', 'Summon Bulwark Fiend', 'Blue', 'Skill', 20, 'self', 'Shadow', 'Summon a Bulwark Fiend for 2 turns: it taunts (single-target enemy attacks hit it instead of the party) and deals 4 Shadow damage each turn.', sum('bulwark'), { summon: 1, def: 20 });
  W('summon_shade_temptress', 'Summon Shade Temptress', 'Blue', 'Skill', 20, 'self', 'Shadow', 'Summon a Shade Temptress for 2 turns: her first action Fears an enemy; each action deals 4 Shadow damage and applies 10 Weak.', sum('temptress'), { summon: 1, control: 1 });
  W('shadowfury', 'Shadowfury', 'Blue', 'Skill', 30, 'enemy', 'Shadow', 'Deal 10 Shadow damage to all enemies and Stun the target: it loses its next turn. Breaks Stealth.', (cb, t) => { const e = tgtOf(cb, t); for (const x of cb.alive()) if (!cb.over) cb.hit(x, 10, 'Shadowfury'); if (e && e.hp > 0) cb.stun(e); }, { dmg: 10, aoe: 1, control: 1 });
  W('howl_of_terror', 'Howl of Terror', 'Blue', 'Skill', 30, 'all', 'Shadow', 'Fear every enemy. Breaks Stealth. Exhaust.', (cb) => { for (const e of cb.alive()) cb.fear(e); }, { control: 1, aoe: 1 }, { exhaust: true });
  W('rot_burst', 'Rot Burst', 'Blue', 'Skill', 10, 'enemy', 'Shadow', 'All of the target\'s Rot deals its remaining damage now.', (cb, t) => { const e = tgtOf(cb, t); if (!e || !(e.rot > 0)) { say(cb, 'No Rot to burst.'); return; } const n = e.rot; e.rotQ = []; e.rot = 0; cb.applyHit(cb.player, e, n, { label: 'Rot Burst' }); say(cb, `Rot Burst: ${e.name} takes ${n}. HP ${e.hp}/${e.maxHp}.`); }, { burst: 1 });
  W('seed_of_ruin', 'Seed of Ruin', 'Blue', 'Skill', 20, 'all', 'Shadow', 'Apply 16 Rot to all enemies.', (cb) => { for (const e of cb.alive()) dot(cb, e, 'rot', 16); }, { dot: 16, aoe: 1 });
  W('soul_harvest', 'Soul Harvest', 'Blue', 'Skill', 20, 'all', 'Shadow', 'Deal 8 Shadow damage to all enemies. Heal every hero 3 HP for each enemy hit. Breaks Stealth.', (cb) => { const n = cb.alive().length; DA(cb, 8, 'Soul Harvest'); healAll(cb, 3 * n, 'Soul Harvest'); }, { dmg: 8, aoe: 1, heal: 6 });
  W('beacon_of_ruin', 'Beacon of Ruin', 'Blue', 'Skill', 20, 'enemy', 'Shadow', 'Deal 15 Shadow damage. If the target carries a Soul Beacon, deal 15 more.', (cb, t) => { const e = tgtOf(cb, t); if (!e) return; cb.hit(e, e.beacon ? 30 : 15, 'Beacon of Ruin'); }, { dmg: 15 });
  W('soul_cleave', 'Soul Cleave', 'Blue', 'Attack', 20, 'enemy', 'Physical', 'Deal 22 damage to the target and 8 to every other enemy.', (cb, t) => { const e = D_(cb, t, 22, 'Soul Cleave'); for (const x of cb.alive()) if (x !== e && !cb.over) cb.hit(x, 8, 'Soul Cleave'); }, { dmg: 22 });
  W('terror_strike', 'Terror Strike', 'Blue', 'Attack', 20, 'enemy', 'Physical', 'Deal 15 damage and Fear the target.', (cb, t) => { const e = D_(cb, t, 15, 'Terror Strike'); if (e && e.hp > 0) cb.fear(e); }, { dmg: 15, control: 1 });
  W('sanguine_torrent', 'Sanguine Torrent', 'Blue', 'Skill', 30, 'enemy', 'Physical', 'Deal 32 Physical damage. Heal 8 HP.', (cb, t, p) => { D_(cb, t, 32, 'Sanguine Torrent'); cb.heal(p, 8, 'Sanguine Torrent'); }, { dmg: 32, heal: 8 });
  W('umbral_nova', 'Umbral Nova', 'Blue', 'Skill', 30, 'all', 'Shadow', 'Deal 17 Shadow damage to all enemies. Breaks Stealth.', (cb) => DA(cb, 17, 'Umbral Nova'), { dmg: 17, aoe: 1 });
  W('void_spear', 'Void Spear', 'Blue', 'Skill', 20, 'enemy', 'Shadow', 'Deal 24 Shadow damage with +25% crit chance.', (cb, t, p) => { p.turn.critPlus = (p.turn.critPlus || 0) + 25; D_(cb, t, 24, 'Void Spear'); p.turn.critPlus -= 25; }, { dmg: 24 });
  W('demonic_empowerment', 'Demonic Empowerment', 'Blue', 'Skill', 10, 'self', null, 'Your demons deal 40% more damage for the rest of combat. Draw 1 card.', (cb, t, p) => { p.demonDmg = (p.demonDmg || 0) + 40; say(cb, 'Your demons deal 40% more damage for the fight.'); cb.drawCards(p, 1); }, { draw: 1 });
  W('dread_eruption', 'Dread Eruption', 'Blue', 'Skill', 20, 'all', 'Shadow', 'Every enemy\'s Dread deals its damage now (it doesn\'t lose any).', (cb, t, p) => { for (const e of cb.alive()) if (e.dread > 0 && !cb.over) { cb.applyHit(p, e, e.dread, { isDot: true, label: 'Dread Eruption', ignoreBlock: true }); } }, { burst: 1, aoe: 1 });
  W('blood_ritual_wl', 'Crimson Rite', 'Blue', 'Skill', 0, 'self', null, 'This turn, cards you can\'t afford can be paid with HP (1 HP per 2 mana, up to 15 HP). Draw 1 card.', (cb, t, p) => { p.turn.bloodPay = true; say(cb, 'Crimson Rite: this turn you can pay with HP.'); cb.drawCards(p, 1); }, { draw: 1 });
  W('soul_shroud', 'Soul Shroud', 'Blue', 'Skill', 20, 'self', null, 'Gain 30 Absorb.', (cb) => cb.gainDef(30), { def: 30 });
  W('shadow_embrace', 'Shadow Embrace', 'Blue', 'Skill', 20, 'self', 'Shadow', 'Heal every hero 12 HP. You gain 8 Absorb.', (cb) => { healAll(cb, 12, 'Shadow Embrace'); cb.gainDef(8); }, { heal: 12, def: 8 });

  // ================= Gold =================
  W('soul_beacon', 'Soul Beacon', 'Gold', 'Skill', 10, 'enemy', 'Shadow', 'Deal 6 Shadow damage and place your Soul Beacon on the target: until it dies, damage any hero deals to it heals every hero for 10% of that damage. Exhaust.', (cb, t, p) => { const e = tgtOf(cb, t); beacon(cb, p, e, 10); if (e) cb.hit(e, 6, 'Soul Beacon'); }, { dmg: 6, beacon: 1 }, { exhaust: true });
  W('summon_ruin_fiend', 'Summon Ruin Fiend', 'Gold', 'Skill', 30, 'self', 'Shadow', 'Summon a Ruin Fiend for 2 turns: at the end of each of your turns it deals 16 Shadow damage to the enemy with the most HP.', sum('ruin'), { summon: 1 });
  W('chaos_bolt', 'Chaos Bolt', 'Gold', 'Skill', 30, 'enemy', 'Shadow', 'Deal 38 Shadow damage with +50% crit chance.', (cb, t, p) => { p.turn.critPlus = (p.turn.critPlus || 0) + 50; D_(cb, t, 38, 'Chaos Bolt'); p.turn.critPlus -= 50; }, { dmg: 38 });
  W('doom', 'Doom', 'Gold', 'Skill', 20, 'enemy', 'Shadow', 'Curse: in 2 rounds, the target takes 55 Shadow damage (Intelligence counts when you cast it). Exhaust.', (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = Math.round(55 * cb.rkm('dmg') * (1 + (p.intelligence + (p.intTurn || 0)) / 100)); cb.later.push({ round: cb.round + 2, src: p.id, e: e.id, n, label: 'Doom' }); say(cb, `Doom gathers over ${e.name}: ${n} Shadow damage in 2 rounds.`); }, { curse: 1, dmg: 55 }, { exhaust: true });
  W('death_and_decay', 'Death and Decay', 'Gold', 'Skill', 20, 'all', 'Shadow', 'Deal 7 Shadow damage to all enemies and apply 12 Rot to each. Breaks Stealth.', (cb) => { for (const e of cb.alive()) { if (cb.over) break; cb.hit(e, 7, 'Death and Decay'); dot(cb, e, 'rot', 12); } }, { dmg: 7, aoe: 1, dot: 12 });
  W('dark_harvest', 'Dark Harvest', 'Gold', 'Skill', 20, 'all', 'Shadow', 'Every enemy\'s Dread and Rot deal their damage once now. Heal for 25% of it.', (cb, t, p) => { let tot = 0; for (const e of cb.alive()) { if (cb.over) break; const rotNow = (e.rotQ || []).reduce((s, r) => s + Math.round(r.left / r.turns), 0), n = (e.dread || 0) + rotNow; if (n > 0) tot += cb.applyHit(p, e, n, { isDot: true, label: 'Dark Harvest', ignoreBlock: true }).lost; } cb.heal(p, Math.round(tot * 0.25), 'Dark Harvest'); }, { burst: 1, aoe: 1 });
  W('soul_shatter', 'Soul Shatter', 'Gold', 'Skill', 20, 'self', null, 'Gain Absorb equal to 40% of your max HP. Exhaust.', (cb, t, p) => cb.gainDef(Math.round(p.maxHp * 0.4)), { def: 40 }, { exhaust: true });
  W('dread_lord', 'Dread Lord\'s Blow', 'Gold', 'Attack', 30, 'enemy', 'Physical', 'Deal 32 damage. Heal for 30% of the damage dealt.', (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const lost = cb.hit(e, 32, 'Dread Lord\'s Blow'); cb.heal(p, Math.round(lost * 0.3), 'Dread Lord\'s Blow'); }, { dmg: 32, heal: 10 });
  W('blood_moon_rite', 'Blood Moon Rite', 'Gold', 'Skill', 0, 'enemy', 'Physical', 'Lose 12 HP. Deal 44 Physical damage.', (cb, t, p) => { cb.loseHp(p, 12, 'Blood Moon Rite'); D_(cb, t, 44, 'Blood Moon Rite'); }, { dmg: 44 });
  W('netherstorm', 'Netherstorm', 'Gold', 'Skill', 30, 'all', 'Shadow', 'Deal 12 Shadow damage to all enemies 2 times. Gain 10 Absorb. Breaks Stealth.', (cb) => { for (let k = 0; k < 2; k++) DA(cb, 12, 'Netherstorm'); cb.gainDef(10); }, { dmg: 12, aoe: 1, hits: 2, def: 10 });
  W('legion', 'Legion', 'Gold', 'Skill', 30, 'self', 'Shadow', 'Summon a Gloom Imp, a Hollow Hound and a Bulwark Fiend. Exhaust.', (cb, t, p) => { cb.summon(p, 'imp'); cb.summon(p, 'hound'); cb.summon(p, 'bulwark'); }, { summon: 3 }, { exhaust: true });

  // ================= Powers (the capstones of the six codexes, plus a few more) =================
  // Soulbinder
  POW('soul_siphon', 'Soul Siphon', 'Gold', 20, 'Power: you deal 20% more damage to the target carrying your Soul Beacon. When it dies, the Beacon jumps to another enemy.', {
    hitMult: (cb, p, e) => e && e.beacon && e.beacon.by === p.id ? 1.2 : 1,
    onKill: (cb, p, dead) => { if (dead.beacon && dead.beacon.by === p.id) { const n = cb.foes()[0]; if (n) beacon(cb, p, n, dead.beacon.pct); } } });
  POW('spirit_ward', 'Spirit Ward', 'Gold', 20, 'Power: at the start of each of your turns, gain Absorb equal to 6% of your max HP.', { turnStart: (cb, p) => { p.block += Math.round(p.maxHp * 0.06); say(cb, `Spirit Ward: ${p.name} gains ${Math.round(p.maxHp * 0.06)} Absorb.`); } });
  POW('circle_of_souls', 'Circle of Souls', 'Gold', 20, 'Power: at the start of each of your turns, every hero heals 3% of their max HP.', { turnStart: (cb, p) => { for (const a of cb.allies()) cb.heal(a, Math.max(1, Math.round(a.maxHp * 0.03)), 'Circle of Souls', true); } });
  // Blightcaller
  POW('creeping_doom', 'Creeping Doom', 'Gold', 20, 'Power: Dread you apply ticks twice each turn.', { dotTicks: { dread: 2 } });
  POW('blighted_skin', 'Blighted Skin', 'Gold', 20, 'Power: enemies that hit you gain 4 Dread.', { hitBy: (cb, p, e) => { if (e && e.hp > 0) cb.applyDot(e, 'dread', 4); } });
  POW('plague_of_dread', 'Plague of Dread', 'Gold', 20, 'Power: at the start of each of your turns, apply 2 Dread to all enemies.', { turnStart: (cb, p) => { for (const e of cb.foes()) cb.applyDot(e, 'dread', 2); } });
  // Shadow Knight
  POW('unholy_might', 'Unholy Might', 'Gold', 20, 'Power: your Attacks deal 20% more damage and apply 2 Dread.', { cardMult: (cb, p, d) => d.type === 'Attack' ? 1.2 : 1, dealt: (cb, p, h) => { if (h.kind === 'Attack' && h.d && !h.d.isPower && h.e.hp > 0) { const was = cb.player; cb.player = p; cb.applyDot(h.e, 'dread', 2); cb.player = was; } } });
  POW('bone_armor', 'Bone Armor', 'Gold', 20, 'Power: at the start of each of your turns gain 6 Absorb. Each Attack you play gives 3 Absorb.', { turnStart: (cb, p) => { p.block += 6; }, cardPlayed: (cb, p, d) => { if (d.type === 'Attack') p.block += 3; } });
  POW('death_pact', 'Death Pact', 'Gold', 20, 'Power: each Attack you play heals every hero 3 HP.', { cardPlayed: (cb, p, d) => { if (d.type === 'Attack') for (const a of cb.allies()) cb.heal(a, 3, 'Death Pact', true); } });
  // Demonologist
  POW('demonic_pact', 'Demonic Pact', 'Gold', 20, 'Power: your demons deal 40% more damage. When this starts, summon a Gloom Imp.', { demonDmg: 40, onPlay: (cb, p) => cb.summon(p, 'imp') });
  POW('grim_bulwark', 'Grim Bulwark', 'Gold', 20, 'Power: when this starts, summon a Bulwark Fiend. Your demons have 30% more HP.', { onPlay: (cb, p) => cb.summon(p, 'bulwark'), onSummon: (cb, p, dm) => { const x = Math.round(dm.maxHp * 0.3); dm.maxHp += x; dm.hp += x; } });
  POW('infernal_bond', 'Infernal Bond', 'Gold', 20, 'Power: whenever one of your demons acts, every hero heals 2 HP.', { demonActed: (cb, p) => { for (const a of cb.allies()) cb.heal(a, 2, 'Infernal Bond', true); } });
  // Bloodmancer
  POW('sanguine_frenzy', 'Sanguine Frenzy', 'Gold', 20, 'Power: you deal up to 40% more damage the lower your HP is (+4% for every 10% of HP missing).', { cardMult: (cb, p) => 1 + Math.floor(missing(p) * 10) * 0.04 });
  POW('crimson_aegis', 'Crimson Aegis', 'Gold', 20, 'Power: at the start of each of your turns, gain Absorb equal to 15% of your missing HP.', { turnStart: (cb, p) => { const n = Math.round((p.maxHp - p.hp) * 0.15); if (n > 0) { p.block += n; say(cb, `Crimson Aegis: +${n} Absorb.`); } } });
  POW('blood_bank', 'Blood Bank', 'Gold', 20, 'Power: whenever you heal yourself, every other hero heals 30% as much.', { onHeal: (cb, p, a, h) => { if (a !== p || h <= 0 || cb._bank) return; cb._bank = true; const n = Math.round(h * 0.3); if (n > 0) for (const x of cb.allies()) if (x !== p) cb.heal(x, n, 'Blood Bank', true); cb._bank = false; } });
  // Umbral Ruin
  POW('shadow_mastery', 'Shadow Mastery', 'Gold', 20, 'Power: +10% crit chance. Your crits deal 40% more damage.', { crit: () => 10, critMultX: 1.4 });
  POW('void_shell', 'Void Shell', 'Gold', 20, 'Power: whenever you crit, gain 6 Absorb.', { dealt: (cb, p, h) => { if (h.crit) { p.block += 6; say(cb, 'Void Shell: +6 Absorb.'); } } });
  POW('dark_insight', 'Dark Insight', 'Gold', 20, 'Power: whenever you crit, draw 1 card (up to 2 a turn).', { dealt: (cb, p, h, pw) => { if (!h.crit || cb.phase !== 'player' || cb.current !== p && !cb.raid) return; if ((p.turn.insight || 0) >= 2) return; p.turn.insight = (p.turn.insight || 0) + 1; cb.drawCards(p, 1); } });
  // more Powers
  POW('vampiric_embrace', 'Vampiric Embrace', 'Blue', 20, 'Power: your damaging Skills heal you for 10% of the damage they deal.', { dealt: (cb, p, h) => { if (h.kind === 'Skill' && h.d && !h.d.isPower && h.lost > 0) { const n = Math.round(h.lost * 0.1); if (n > 0) cb.heal(p, n, 'Lifesteal', true); } } });
  POW('nightfall_wl', 'Nightfall', 'Blue', 10, 'Power: whenever you apply Dread or Rot, gain 2 Absorb.', { applyDot: (cb, p, e, key) => { if (key === 'dread' || key === 'rot') p.block += 2; } });
  POW('soul_fire', 'Soulfire', 'Green', 10, 'Power: your Shadow damage is increased by 10%.', { hitMult: (cb, p, e, c) => c.dtype === 'Shadow' ? 1.1 : 1 });
}
const API = { install };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CB_WARLOCK = API;
})(typeof window !== 'undefined' ? window : globalThis);
