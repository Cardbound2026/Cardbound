// Cardbound combat engine, prototype v2. Pure logic: no DOM. Browser: window.CB. Node: module.exports.
// Enemy data comes from CB_DATA (exported from the Map 1 design files).
(function (root) {
'use strict';
const DATA = (typeof module !== 'undefined' && module.exports) ? null : root.CB_DATA;
const GEN_OPS = {}; // generated cards' effect lists by key (ranked versions can tweak them)

// ---------------- RNG ----------------
function makeRng(seed) {
  let a = seed >>> 0;
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle(arr, rng) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));

// ---------------- Cards ----------------
const C = {};
function card(key, d) { C[key] = Object.assign({ key, exhaust: false, tags: {} }, d); }

// --- Warrior
card('strike', { cls: 'Warrior', name: 'Strike', rarity: 'White', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 10 damage.', play: (cb, t) => cb.hit(t, 10, 'Strike'), tags: { dmg: 10 } });
card('defend', { cls: 'Warrior', name: 'Defend', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'Gain 10 Block.', play: (cb) => cb.gainDef(10), tags: { def: 10 } });
card('shield_bash', { cls: 'Warrior', name: 'Shield Bash', rarity: 'White', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 6 damage and gain 7 Block.', play: (cb, t) => { cb.hit(t, 6, 'Shield Bash'); cb.gainDef(7); }, tags: { dmg: 6, def: 7 } });
card('pommel_strike', { cls: 'Warrior', name: 'Pommel Strike', rarity: 'White', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 7 damage. Draw 1 card.', play: (cb, t) => { cb.hit(t, 7, 'Pommel Strike'); cb.drawCards(cb.player, 1); }, tags: { dmg: 7, draw: 1 } });
card('battle_shout', { cls: 'Warrior', name: 'Battle Shout', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'Gain 20 Strength this turn. Draw 1 card.', play: (cb) => { cb.player.strTurn += 20; cb.say('player', `+20 Strength this turn.`); cb.drawCards(cb.player, 1); }, tags: { setup: 'str', draw: 1 } });
card('whirlwind', { cls: 'Warrior', name: 'Whirlwind', rarity: 'Green', type: 'Attack', cost: 20, target: 'all', dtype: 'Physical', text: 'Deal 14 damage to all enemies. Breaks Stealth.', play: (cb) => { for (const e of cb.alive()) cb.hit(e, 14, 'Whirlwind'); }, tags: { dmg: 14, aoe: 1 } });
card('shield_up', { cls: 'Warrior', name: 'Shield Up', rarity: 'Green', type: 'Skill', cost: 10, target: 'self', text: 'Gain 10 Block. Next turn, gain 5 Block.', play: (cb) => { cb.gainDef(10); cb.player.defNext += 5; }, tags: { def: 13 } });
card('bloodthirst', { cls: 'Warrior', name: 'Bloodthirst', rarity: 'Green', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 10 damage. Heal for 50% of the damage dealt to HP.', play: (cb, t) => { const lost = cb.hit(t, 10, 'Bloodthirst'); cb.heal(cb.player, Math.round(lost * 0.5), 'Bloodthirst', true); }, tags: { dmg: 10, heal: 4 } });
card('shield_wall', { cls: 'Warrior', name: 'Shield Wall', rarity: 'Blue', type: 'Skill', cost: 20, target: 'self', text: 'Gain 40 Block.', play: (cb) => cb.gainDef(40), tags: { def: 40 } });
card('execute', { cls: 'Warrior', name: 'Execute', rarity: 'Blue', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 10 damage. If the target is below 30% HP, deal 30 instead.', play: (cb, t) => cb.hit(t, t.hp < t.maxHp * 0.3 ? 30 : 10, 'Execute'), tags: { dmg: 10, execute: 30 } });
card('battle_fever', { cls: 'Warrior', name: 'Battle Fever', rarity: 'Gold', type: 'Skill', cost: 15, target: 'self', text: 'If you have taken damage this fight, gain 20 Strength and 20 Stamina for the rest of combat. Exhaust.', exhaust: true,
  play: (cb) => { const p = cb.player; if (p.hurtFight) { p.strCombat += 20; p.maxHp += 20; p.hp += 20; cb.say('player', `Battle Fever: +20 Strength and +20 Stamina for the fight.`); } else cb.say('player', 'Battle Fever fizzles: you haven\'t taken damage yet this fight.'); }, tags: { fever: 1 } });

// --- Rogue
card('stab', { cls: 'Rogue', name: 'Stab', rarity: 'White', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 10 damage.', play: (cb, t) => cb.hit(t, 10, 'Stab'), tags: { dmg: 10 } });
card('evade', { cls: 'Rogue', name: 'Evade', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'Gain 10 Dodge.', play: (cb) => cb.gainDef(10), tags: { def: 10 } });
card('slip_away', { cls: 'Rogue', name: 'Slip Away', rarity: 'White', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 5 damage and gain 6 Dodge.', play: (cb, t) => { cb.hit(t, 5, 'Slip Away'); cb.gainDef(6); }, tags: { dmg: 5, def: 6 } });
card('twin_daggers', { cls: 'Rogue', name: 'Twin Daggers', rarity: 'White', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 5 damage twice.', play: (cb, t) => { cb.hit(t, 5, 'Twin Daggers'); cb.hit(t, 5, 'Twin Daggers'); }, tags: { dmg: 10 } });
card('envenom', { cls: 'Rogue', name: 'Envenom', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Nature', text: 'Apply 5 Poison. (Poison ignores Block, deals its stacks each turn, then loses 1.)', play: (cb, t) => cb.applyDot(t, 'poison', 5), tags: { dot: 15 } });
card('throwing_stars', { cls: 'Rogue', name: 'Throwing Stars', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'Add 2 Shurikens to your hand.', play: (cb) => { cb.addToHand('shuriken'); cb.addToHand('shuriken'); }, tags: { dmg: 8 } });
card('shuriken', { cls: 'Rogue', name: 'Shuriken', rarity: 'Token', type: 'Attack', cost: 0, target: 'enemy', dtype: 'Physical', exhaust: true, text: 'Deal 4 damage. Exhaust.', play: (cb, t) => cb.hit(t, 4, 'Shuriken'), tags: { dmg: 4 } });
card('garrote', { cls: 'Rogue', name: 'Garrote', rarity: 'Green', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 6 damage and apply 8 Bleed.', play: (cb, t) => { cb.hit(t, 6, 'Garrote'); cb.applyDot(t, 'bleed', 8); }, tags: { dmg: 6, dot: 36 } });
card('blur', { cls: 'Rogue', name: 'Blur', rarity: 'Green', type: 'Skill', cost: 10, target: 'self', text: 'Gain 10 Dodge. Next turn, gain 5 Dodge.', play: (cb) => { cb.gainDef(10); cb.player.defNext += 5; }, tags: { def: 13 } });
card('hide', { cls: 'Rogue', name: 'Hide', rarity: 'Green', type: 'Skill', cost: 10, target: 'self', text: "Enter Stealth: single-target enemy cards can't find you until you attack. Only 0-cost cards for the rest of this turn.",
  play: (cb) => { cb.player.stealth = true; cb.player.locked = true; cb.say('player', 'You slip into Stealth.'); }, tags: { hide: 1 } });
card('evasion', { cls: 'Rogue', name: 'Evasion', rarity: 'Blue', type: 'Skill', cost: 20, target: 'self', text: 'Gain 40 Dodge.', play: (cb) => cb.gainDef(40), tags: { def: 40 } });
card('coup_de_grace', { cls: 'Rogue', name: 'Coup de Grace', rarity: 'Blue', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 10 damage. If the target is below 30% HP, deal 30 instead.', play: (cb, t) => cb.hit(t, t.hp < t.maxHp * 0.3 ? 30 : 10, 'Coup de Grace'), tags: { dmg: 10, execute: 30 } });
card('assassinate', { cls: 'Rogue', name: 'Assassinate', rarity: 'Gold', type: 'Skill', cost: 0, target: 'self', text: 'Your next Attack deals double damage. Playing it keeps you in Stealth.', play: (cb) => { cb.player.nextAttackMult = 2; cb.say('player', 'Your next Attack deals double damage.'); }, tags: { setup: 'attack' } });

// --- Mage
card('fireball', { cls: 'Mage', name: 'Fireball', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Fire', text: 'Deal 7 Fire damage and apply 3 Burn.', play: (cb, t) => { cb.hit(t, 7, 'Fireball'); cb.applyDot(t, 'burn', 3); }, tags: { dmg: 7, dot: 6 } });
card('frostbolt', { cls: 'Mage', name: 'Frostbolt', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Frost', text: "Deal 5 Frost damage. Reduce the target's mana regeneration by 5 for 2 turns. Stacks.", play: (cb, t) => { cb.hit(t, 5, 'Frostbolt'); if (t.hp > 0) { t.regenDown.push({ n: 5, turns: 2 }); cb.say('player', `${t.name}'s mana regen drops by 5 for 2 turns.`); } }, tags: { dmg: 5 } });
// Nov 2: two new Mage Barrier cards
card('runic_ward', { cls: 'Mage', name: 'Runic Ward', rarity: 'Green', type: 'Skill', cost: 10, target: 'self', text: 'Gain 20 Barrier.', play: (cb) => cb.gainDef(20), tags: { def: 20 } });
card('spiked_ward', { cls: 'Mage', name: 'Spiked Ward', rarity: 'Blue', type: 'Skill', cost: 0, target: 'self', text: 'Gain Thorns equal to half the Barrier you gained this turn. For the rest of this turn, Barrier you gain adds Thorns too. The Thorns last until your Barrier runs out.',
  play: (cb) => { const p = cb.player; p.turn.spikedWard = true; const n = Math.round((p.turn.defGained || 0) * 0.5); if (n > 0) cb.wardThorns(p, n); else cb.say('player', 'Spiked Ward: Barrier you gain this turn adds Thorns.'); }, tags: {} });
// Nov 2: Rogue Stealth cards
card('fade_out', { cls: 'Rogue', name: 'Fade Out', rarity: 'Blue', type: 'Skill', cost: 0, target: 'self', exhaust: true, text: 'Enter Stealth. Exhaust.', play: (cb) => { cb.player.stealth = true; cb.say('player', `${cb.partySize > 1 ? cb.player.name + ' fades' : 'You fade'} into Stealth.`); }, tags: {} });
card('shadow_ambush', { cls: 'Rogue', name: 'Shadow Ambush', rarity: 'Blue', type: 'Power', cost: 20, target: 'self', exhaust: true, text: 'Power: when you attack out of Stealth, the target is Stunned and loses its next turn.', play: (cb) => cb.addPower(cb.player, 'shadow_ambush', 'Shadow Ambush', 'When you attack out of Stealth, the target is Stunned.'), tags: { power: 1 } });
card('arcane_missiles', { cls: 'Mage', name: 'Arcane Missiles', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Arcane', text: 'Deal 5 Arcane damage. Steal 5 mana from the target.', play: (cb, t) => { cb.hit(t, 5, 'Arcane Missiles'); const s = cb.drainMana(t, 5); cb.player.mana += s; cb.say('player', s ? `${cb.who(cb.player)} steal${cb.partySize > 1 ? 's' : ''} ${s} mana from ${t.name}${t.mana < 0 ? ' (it will have less next turn)' : ''}.` : `${t.name} has no mana to steal.`); }, tags: { dmg: 5 } });
card('ice_bolt', { cls: 'Mage', name: 'Ice Bolt', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Frost', text: 'Deal 5 Frost damage and apply 4 Chill.', play: (cb, t) => { cb.hit(t, 5, 'Ice Bolt'); cb.applyChill(t, 4); }, tags: { dmg: 5, chill: 4 } });
card('mana_spring', { cls: 'Mage', name: 'Mana Spring', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'At the start of your next turn, gain 20 mana.', play: (cb) => { cb.player.manaNext += 20; cb.say('player', '+20 mana next turn.'); }, tags: { mana: 10 } });
card('ward', { cls: 'Mage', name: 'Ward', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'Gain 10 Barrier.', play: (cb) => cb.gainDef(10), tags: { def: 10 } });
card('arcane_barrage', { cls: 'Mage', name: 'Arcane Barrage', rarity: 'Green', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Arcane', text: 'Deal 4 Arcane damage 3 times.', play: (cb, t) => { for (let i = 0; i < 3; i++) cb.hit(t, 4, 'Arcane Barrage'); }, tags: { dmg: 12 } });
card('blizzard', { cls: 'Mage', name: 'Blizzard', rarity: 'Green', type: 'Skill', cost: 20, target: 'all', dtype: 'Frost', text: 'Deal 8 Frost damage and apply 4 Chill to all enemies. Breaks Stealth.', play: (cb) => { for (const e of cb.alive()) { cb.hit(e, 8, 'Blizzard'); cb.applyChill(e, 4); } }, tags: { dmg: 8, aoe: 1, chill: 4 } });
card('ice_barrier', { cls: 'Mage', name: 'Ice Barrier', rarity: 'Green', type: 'Skill', cost: 10, target: 'self', text: 'Gain 10 Barrier. Next turn, gain 5 Barrier.', play: (cb) => { cb.gainDef(10); cb.player.defNext += 5; }, tags: { def: 13 } });
card('pyroblast', { cls: 'Mage', name: 'Pyroblast', rarity: 'Blue', type: 'Skill', cost: 30, target: 'enemy', dtype: 'Fire', text: 'Deal 36 Fire damage and apply 6 Burn.', play: (cb, t) => { cb.hit(t, 36, 'Pyroblast'); cb.applyDot(t, 'burn', 6); }, tags: { dmg: 36, dot: 21 } });
card('prismatic_barrier', { cls: 'Mage', name: 'Prismatic Barrier', rarity: 'Blue', type: 'Skill', cost: 20, target: 'self', text: 'Gain 40 Barrier.', play: (cb) => cb.gainDef(40), tags: { def: 40 } });
card('amplify', { cls: 'Mage', name: 'Amplify', rarity: 'Gold', type: 'Skill', cost: 20, target: 'self', text: 'Your next damaging Skill deals 50% more damage.', play: (cb) => { cb.player.nextSkillMult = 1.5; cb.say('player', 'Your next damaging Skill deals 50% more damage.'); }, tags: { setup: 'skill' } });

// --- Paladin
card('crusader_strike', { cls: 'Paladin', name: 'Crusader Strike', rarity: 'White', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 12 damage.', play: (cb, t) => cb.hit(t, 12, 'Crusader Strike'), tags: { dmg: 12 } });
card('raise_shield', { cls: 'Paladin', name: 'Raise Shield', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'Gain 10 Block.', play: (cb) => cb.gainDef(10), tags: { def: 10 } });
card('righteous_blow', { cls: 'Paladin', name: 'Righteous Blow', rarity: 'White', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 8 damage and gain 8 Block.', play: (cb, t) => { cb.hit(t, 8, 'Righteous Blow'); cb.gainDef(8); }, tags: { dmg: 8, def: 8 } });
card('smite', { cls: 'Paladin', name: 'Smite', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Holy', text: 'Deal 14 Holy damage. (Holy ignores resistance and weakness.)', play: (cb, t) => cb.hit(t, 14, 'Smite'), tags: { dmg: 14 } });
card('mend_wounds', { cls: 'Paladin', name: 'Mend Wounds', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'Heal yourself for 8 HP.', play: (cb) => cb.heal(cb.player, 8, 'Mend Wounds'), tags: { heal: 8 } });
card('sacred_ward', { cls: 'Paladin', name: 'Sacred Ward', rarity: 'White', type: 'Skill', cost: 10, target: 'self', text: 'Gain 10 Barrier.', play: (cb) => cb.gainDef(10), tags: { def: 10 } });
card('divine_storm', { cls: 'Paladin', name: 'Divine Storm', rarity: 'Green', type: 'Attack', cost: 20, target: 'all', dtype: 'Holy', text: 'Deal 12 Holy damage to all enemies. Breaks Stealth.', play: (cb) => { for (const e of cb.alive()) cb.hit(e, 12, 'Divine Storm'); }, tags: { dmg: 12, aoe: 1 } });
card('healing_light', { cls: 'Paladin', name: 'Healing Light', rarity: 'Green', type: 'Skill', cost: 10, target: 'self', text: 'Heal yourself for 15 HP.', play: (cb) => cb.heal(cb.player, 15, 'Healing Light'), tags: { heal: 15 } });
card('divine_shield', { cls: 'Paladin', name: 'Divine Shield', rarity: 'Green', type: 'Skill', cost: 10, target: 'self', text: 'Gain 8 Block. Negate the next debuff applied to you before your next turn.', play: (cb) => { cb.gainDef(8); cb.player.negateDebuff = true; }, tags: { def: 9 } });
card('ardent_defense', { cls: 'Paladin', name: 'Ardent Defense', rarity: 'Blue', type: 'Skill', cost: 20, target: 'self', text: 'Gain 40 Block.', play: (cb) => cb.gainDef(40), tags: { def: 40 } });
card('holy_nova', { cls: 'Paladin', name: 'Holy Nova', rarity: 'Blue', type: 'Skill', cost: 20, target: 'all', dtype: 'Holy', text: 'Deal 10 Holy damage to all enemies. Heal you and your allies for 8 HP.', play: (cb) => { for (const e of cb.alive()) cb.hit(e, 10, 'Holy Nova'); for (const a of cb.allies()) cb.heal(a, 8, 'Holy Nova'); }, tags: { dmg: 10, aoe: 1, heal: 8 } });
card('lay_on_hands', { cls: 'Paladin', name: 'Lay on Hands', rarity: 'Gold', type: 'Skill', cost: 30, target: 'self', exhaust: true, text: 'Heal 30% of your total HP. Exhaust.', play: (cb) => cb.heal(cb.player, Math.round(cb.player.maxHp * 0.3), 'Lay on Hands'), tags: { heal: 36 } });

// --- Status cards
card('fatigue', { name: 'Fatigue', rarity: 'Status', type: 'Status', cost: null, target: 'none', text: 'Unplayable. Added each time your deck reshuffles.' });
card('dazed', { name: 'Dazed', rarity: 'Status', type: 'Status', cost: 0, target: 'self', exhaust: true, text: 'Does nothing. Costs 0 to play, then Exhausts.', play: (cb) => cb.say('player', 'You shake off the daze.'), tags: { clear: 1 } });
card('stun', { name: 'Stun', rarity: 'Status', type: 'Status', cost: null, target: 'none', text: 'Unplayable. Stays in your deck for the rest of the fight.' });

// ---------------- Classes ----------------
// ---------------- Powers ----------------
// A Power is played once, then stays active for the rest of the fight (shown on the hero). Each entry hooks into the combat:
//   onPlay(cb,p,pw)  turnStart(cb,p,pw)  turnEnd(cb,p,pw)  cardPlayed(cb,p,d,pw)  dealt(cb,p,hit,pw)  hitBy(cb,p,e,r,pw)  fullBlock(cb,p,e,pw)
//   drawStatus/handFull/loseHp(cb,p,pw)  onHeal(cb,p,a,h,pw)  onCleanse(cb,p,n,pw)
//   cardMult(cb,p,d,pw) once per card (x damage); hitMult(cb,p,e,ctx,pw) per hit; crit / critMultX / vulnX / ignoreBlock / dotTicks / dotMult / dotPlus / incoming / initPlus / statPlus
const P_ = (fn) => fn; const shurikenDmg = 4;
const POWERS = {
  shadow_ambush: {},
  // --- Warrior
  thorned_bulwark: { hitBy: (cb, p, e, r, ...a) => { const back = Math.round(r.absorbed * PN(a, 0, 25) / 100); if (back > 0 && e.hp > 0) { cb.applyHit(p, e, back, { label: 'Thorned Bulwark' }); cb.say('player', `Thorned Bulwark: ${e.name} takes ${back}.`); if (e.hp <= 0) cb.onDeath(e); } } },
  guardian_s_oath: { guard: 0.5 },
  expose_opening: { fullBlock: (cb, p, e) => { if (e.hp > 0) { const n = cb.upN ? cb.upN(p, 'expose_opening', 0, 40) : 40; e.vulnerable += n; cb.say('player', `Expose Opening: ${e.name} gains ${n} Vulnerable.`); } } },
  blood_clock: { dotTicks: { bleed: 2 } },
  crimson_covenant: { dotMult: { bleed: 2 } },
  open_wounds: { vulnX: 2 },
  follow_through: { cardMult: (cb, p, d) => d.type === 'Attack' && p.turnAttacks === 1 ? 1.5 : 1 },
  mortal_precision: { critMultX: 1.3 },
  grit: { turnStart: (cb) => cb.gainDef(3) },
  blood_pact: { loseHp: (cb, p, ...a) => { const n = PN(a, 0, 10); p.strCombat += n; cb.say('player', `Blood Pact: +${n} Strength for the fight.`); } },
  iron_will: { drawStatus: (cb, p, ...a) => { cb.gainDef(PN(a, 0, 10)); p.mana += PN(a, 1, 5); cb.say('player', `Iron Will: +${PN(a, 1, 5)} mana.`); } },
  unstoppable_force: { ignoreBlock: 0.3 },
  conditioning: { onPlay: (cb, p) => { p.maxMana += 10; p.regen += 5; } },
  marathon: { turnStart: (cb, p) => { p.regen += 3; cb.say('player', `Marathon: regeneration rises to ${p.regen}.`); } },
  momentum: { cardPlayed: (cb, p, d, ...a) => { if (d.type === 'Attack' && p.turnAttacks === 3) { const n = PN(a, 0, 1); cb.say('player', `Momentum: draw ${n}.`); cb.drawCards(p, n); } } },
  blood_ritual: { turnStart: (cb, p, ...a) => { cb.drawCards(p, PN(a, 0, 1)); cb.loseHp(p, 5, 'Blood Ritual'); } },
  reckless_fury: { onPlay: (cb, p) => { p.strCombat += 50; }, turnStart: (cb, p, pw) => { pw.n = (pw.n || 0) + 1; cb.loseHp(p, pw.n, 'Reckless Fury'); } },
  partial_guard: { partialBlock: true },
  // --- Rogue
  first_blood: { cardMult: (cb, p, d) => d.type === 'Attack' && p.turnAttacks === 0 ? 1.3 : 1, crit: (cb, p, d) => d && d.type === 'Attack' && p.turnAttacks === 0 ? 30 : 0 },
  accelerant_venom: { dotTicks: { poison: 2 } },
  toxic_edge: { dealt: (cb, p, h) => { if (h.kind === 'Attack' && h.lost > 0 && h.e.hp > 0) { h.e.poison += 1; h.e.poisonBy = p.id; cb.say('player', `Toxic Edge: ${h.e.name} gains 1 Poison.`); } } },
  open_veins: { dotTicks: { bleed: 2 } },
  sharpened_stars: { shurikenX: 2 },
  shuriken_storm: { turnStart: (cb) => cb.addToHand('shuriken'), shurikenAoe: true },
  reflexive_volley: { fullBlock: (cb, p, e) => { if (e.hp > 0) cb.powerHit(p, e, Math.round((shurikenDmg + cb.pwSum(p, 'shurikenPlus')) * cb.pwProd(p, 'shurikenX')), 'Reflexive Volley', 'Physical', 'Attack'); } }, // Nov 1: the thrown Shuriken gets Shuriken Mastery / Sharpened Stars / Ninja too
  fleetfooted: { dealt: (cb, p, h) => { if (h.kind === 'Attack' && h.lost > 0 && !h.absorbed) cb.gainDef(2); } },
  first_move: { initPlus: () => 100 },
  nimble: { turnStart: (cb) => cb.gainDef(3) },
  hidden_pockets: { turnStart: (cb, p, ...a) => { for (let k = PN(a, 0, 1); k > 0; k--) cb.addToHand('shuriken'); } },
  virulence: { dotPlus: { poison: 1 } },
  shuriken_mastery: { shurikenPlus: 3 },
  afterimage: { fullBlock: (cb, p, ...a) => { const n = PN(a, 0, 1); cb.say('player', `Afterimage: draw ${n}.`); cb.drawCards(p, n); } },
  quartermaster: { handFull: (cb, p) => { p.mana += 5; cb.say('player', 'Quartermaster: +5 mana.'); } },
  deep_pockets: { onPlay: (cb, p) => { p.maxMana += 10; p.regen += 5; } },
  the_long_game: { turnStart: (cb, p) => { p.regen += 5; cb.say('player', `The Long Game: regeneration rises to ${p.regen}.`); } },
  shadow_reflexes: { turnStart: (cb, p, ...a) => { const n = Math.round(p.block * PN(a, 0, 25) / 100); if (n) { p.nextAttackFlat = (p.nextAttackFlat || 0) + n; cb.say('player', `Shadow Reflexes: next Attack +${n} damage.`); } } },
  // --- Mage
  quick_study: { turnStart: (cb, p, ...a) => { if (cb.order[0] === p.id && cb.turnIndex === 0) { const n = PN(a, 0, 2); cb.say('player', `Quick Study: first to act, draw ${n}.`); cb.drawCards(p, n); } } },
  flashpoint: { dotTicks: { burn: 2 } },
  combustion_threshold: { dealt: (cb, p, h) => { if (h.d && h.d.cost > 30 && h.kind === 'Skill' && h.e.burn > 0 && h.e.hp > 0 && !h.combusted) { h.combusted = true; cb.applyHit(p, h.e, h.e.burn, { isDot: true, label: 'Combustion' }); } } },
  temporal_siphon: { initPlus: (cb, p, ...a) => Math.round(PN(a, 0, 20) / 100 * cb.foes().reduce((s, e) => s + cb.initiative(e), 0)) },
  arcane_ascension: { onPlay: (cb, p, ...a) => { p.draw += 2; p.regen = Math.round(p.regen * (1 + PN(a, 0, 30) / 100)); } },
  potency: { hitMult: (cb, p, e, c) => c.kind === 'Skill' ? 1.15 : 1 },
  rule_of_three: { cardMult: (cb, p, d) => d.type === 'Skill' && d.tags.dmg && (p.spellCount + 1) % 3 === 0 ? 2 : 1 },
  glyph_of_warding: { turnStart: (cb) => cb.gainDef(3) },
  torrent: { cardPlayed: (cb, p, d, ...a) => { const pw = a[a.length - 1]; if (d.type === 'Skill' && pw) { pw.sk = (pw.sk || 0) + 1; if (pw.sk % 3 === 0) { const n = PN(a, 0, 1); cb.say('player', `Torrent: draw ${n}.`); cb.drawCards(p, n); } } } }, // Nov 3: counts Skills across turns
  ley_attunement: { onPlay: (cb, p) => { p.maxMana += 10; p.regen += 5; } },
  barrier_battery: { turnEnd: (cb, p, ...a) => { const n = Math.round(p.block * PN(a, 0, 20) / 100); if (n) { p.manaNext += n; cb.say('player', `Barrier Battery: +${n} mana next turn.`); } } },
  spellweaving: { flat: (cb, p, d) => d.type === 'Skill' ? 4 * p.turnElems.length : 0 },
  malediction_mirror: { turnStart: (cb, p) => { const t = cb.foes()[0] || cb.alive()[0]; if (!t) return; let moved = 0; for (const k of ['weak', 'vulnerable', 'slow', 'bleed', 'poison', 'burn']) if (p[k] > 0) { t[k] = (t[k] || 0) + p[k]; moved += p[k]; p[k] = 0; } if (moved) cb.say('player', `Malediction Mirror: debuffs move to ${t.name}.`); } },
  // --- Paladin
  consecrated_arms: { dtype: { Physical: 'Holy' } },
  retribution_aura: { hitBy: (cb, p, e) => { if (e.hp > 0) cb.powerHit(p, e, 8, 'Retribution Aura', 'Holy', 'Skill'); } },
  crusader_s_zeal: { hitMult: (cb, p, e, c) => c.kind === 'Attack' ? 1.3 : 1 },
  cleansing_light: { turnStart: (cb, p) => { cb.cleanse(p, 1); const e = cb.foes().find(x => cb.debuffKeys(x, true).length); if (!e) return; const k = cb.debuffKeys(e, true).sort((x, y) => e[y] - e[x])[0], n = e[k]; e[k] = 0; if (k === 'rot') e.rotQ = []; cb.say('player', `Cleansing Light strips ${n} ${k} from ${e.name}.`); cb.fire(p, 'onCleanse', n); } }, // Nov 3: also strips the biggest enemy debuff
  purifying_grace: { onCleanse: (cb, p, n) => { if (!n) return; cb.heal(p, 2 * n, 'Purifying Grace'); const e = cb.foes()[0]; if (e) cb.powerHit(p, e, 3 * n, 'Purifying Grace', 'Holy', 'Skill'); } }, // Nov 3: also 3 Holy damage per stack
  delayed_judgment: { dealt: (cb, p, h, ...a) => { if (h.dtype === 'Holy' && h.lost > 0) cb.later.push({ round: cb.round + 2, src: p.id, e: h.e.id, n: Math.round(h.lost * PN(a, 0, 30) / 100) }); } },
  shield_of_the_crusade: { dealt: (cb, p, h) => { if (h.dtype === 'Physical' && h.lost > 0) cb.gainDef(Math.max(1, Math.round(h.lost * 0.2))); } },
  sacred_momentum: { dealt: (cb, p, h, ...a) => { if (h.dtype === 'Physical' && h.lost > 0) p.nextHolyMult = 1 + PN(a, 0, 25) / 100; } },
  aegis_of_light: { dealt: (cb, p, h) => { if (h.dtype === 'Holy' && h.lost > 0) cb.gainDef(Math.max(1, Math.round(h.lost * 0.1))); } }, // Nov 3: 20% -> 10%
  brand_the_wicked: { hitMult: (cb, p, e, c) => c.dtype === 'Physical' && e.burn > 0 ? 1.3 : 1 },
  zeal_of_the_pyre: { initPlus: (cb) => Math.floor(Math.max(0, ...cb.foes().map(e => e.burn || 0)) / 5) },
  burning_wisdom: { statPlus: (cb, p, e, c) => c.kind === 'Skill' ? 10 * Math.floor((e.burn || 0) / 3) : 0 },
  patient_wrath: { turnEnd: (cb, p, pw) => { if (!p.turnAttacks) { pw.n = (pw.n || 0) + (pw.upN ? pw.upN[0] : 10); cb.say('player', `Patient Wrath: next Attack +${pw.n}%.`); } }, cardMult: (cb, p, d, pw) => { if (d.type === 'Attack' && pw.n) { const m = 1 + pw.n / 100; pw.n = 0; return m; } return 1; } },
  divine_echo: { echo: 10, turnStart: (cb, p, pw) => { pw.chance = pw.upN ? pw.upN[0] : 10; } }, // Nov 3: back to full every turn
  grace_eternal: { onHeal: (cb, p, a, h, pw) => { const per = Math.round(h * (pw && pw.upN ? pw.upN[0] : 30) / 100 / 3); if (per > 0 && !cb._hot) (a.hot = a.hot || []).push({ n: per, turns: 3 }); } },
  sanctuary: { incoming: 0.8 }, // Nov 3: 30% -> 20%
  steadfast: { turnStart: (cb) => cb.gainDef(3) },
  tempered_zeal: { cardPlayed: (cb, p, d) => { if (p.prevType && p.prevType !== d.type && ['Attack', 'Skill'].includes(d.type) && ['Attack', 'Skill'].includes(p.prevType)) cb.gainDef(3); } },
  blessed_reserves: { onPlay: (cb, p) => { p.maxMana += 10; p.regen += 5; } },
  consecrated_ground: { turnStart: (cb, p) => { for (const e of cb.alive()) cb.powerHit(p, e, 4, 'Consecrated Ground', 'Holy', 'Skill'); } },
  crusader_aura: { cardPlayed: (cb, p, d) => { if (!(p.prevType && p.prevType !== d.type && ['Attack', 'Skill'].includes(d.type) && ['Attack', 'Skill'].includes(p.prevType))) return; if (d.type === 'Attack') { p.strTurn += 10; cb.say('player', 'Crusader Aura: +10 Strength this turn.'); } else { p.dexterity += 10; p.dexTurn = (p.dexTurn || 0) + 10; cb.say('player', 'Crusader Aura: +10 Dexterity this turn.'); } } },
  aura_mastery: { onPlay: (cb, p) => { for (const a of cb.allies()) if (a !== p) for (const pw of p.powers) if (pw.key !== 'aura_mastery') cb.addPower(a, pw.key, pw.name, pw.text, true); } },
};

// ---------------- Hand-built cards (the ones a simple rules-text reading can't express) ----------------
// key = card name as a slug. play(cb, t, p): t = chosen enemy, p = the hero playing it.
const PN = (a, i, d) => { const pw = a[a.length - 1]; return pw && pw.upN ? pw.upN[i] : d; }; // an upgraded Power's own numbers
const tgtOf = (cb, t) => (t && t.hp > 0 ? t : cb.alive().find(x => !x.stealth) || cb.alive()[0]);
const D_ = (cb, t, n, l) => { const e = tgtOf(cb, t); if (e && !cb.over) cb.hit(e, Math.max(0, Math.round(n)), l); return e; };
const DA = (cb, n, l) => { for (const e of cb.alive()) if (!cb.over) cb.hit(e, Math.max(0, Math.round(n)), l); };
const say = (cb, s) => cb.say('player', s);
const retainMana = (cb, p) => { p.mana += 10; say(cb, `${p.name} keeps a card in hand: +10 mana.`); };
const blockToDmg = (cb, t, p, pct, l, keep, all, holy, flat) => { const n = Math.round(p.block * pct * cb.pwProd(p, 'spendMult')) + (flat || 0); if (!keep) p.block = 0; const was = cb._playing; if (holy) cb._playing = Object.assign(Object.create(was), { dtype: 'Holy' }); if (all) DA(cb, n, l); else D_(cb, t, n, l); cb._playing = was; };
const debuffMove = (cb, from, to, keys) => { let n = 0; for (const k of keys) if (from[k] > 0) { to[k] = (to[k] || 0) + from[k]; n += from[k]; from[k] = 0; } return n; };
const CUSTOM = {
  // ===== Warrior
  armor_nova: { play: (cb, t, p) => blockToDmg(cb, t, p, 0.2, 'Armor Nova', false, true) },
  crushing_bastion: { play: (cb, t, p) => blockToDmg(cb, t, p, 1, 'Crushing Bastion') },
  unyielding_bastion: { play: (cb, t, p) => { cb.timed(p, 'keepBlock', 2); say(cb, 'Your Block cannot be reduced until after your next turn.'); } },
  perfect_guard: { play: (cb, t, p) => { p.turn.perfectGuard = true; say(cb, 'Attack damage this turn also becomes Parry.'); } },
  parry_reversal: { play: (cb, t, p) => blockToDmg(cb, t, p, 1, 'Parry Reversal') },
  steel_tempo: { play: (cb, t, p) => { p.turn.defX = true; say(cb, 'Parry gained this turn is doubled.'); } },
  decisive_reprisal: { play: (cb, t, p) => { if (p.parriedLast || p.parryFlag) D_(cb, t, 45, 'Decisive Reprisal'); else say(cb, 'You did not parry last turn: nothing happens.'); } },
  coagulate: { play: (cb, t, p) => { cb.timed(p, 'noBleed', 2); p.bleed = 0; say(cb, 'Immune to Bleed for 2 turns.'); } },
  blood_reckoning: { play: (cb, t, p) => { const b = p.bleed; p.bleed = 0; for (const e of cb.alive()) { e.bleed += b * 2; e.bleedBy = p.id; } let total = 0; for (const e of cb.alive()) { const hp0 = e.hp; cb.hit(e, e.bleed, 'Blood Reckoning'); total += hp0 - Math.max(0, e.hp); } cb.heal(p, total, 'Blood Reckoning'); } },
  colossal_reserve: { play: (cb, t, p) => { p.mana *= 2; p.turn.costX = 2; say(cb, `Mana doubled to ${p.mana}; cards cost double this turn.`); } },
  war_engine: { play: (cb, t, p) => { p.regenX = 3; cb.timed(p, 'warEngine', 3, { end: (c, q) => { q.regenX = 1; } }); say(cb, 'Mana regeneration tripled for 3 turns.'); } },
  deferred_power: { play: (cb, t, p) => { const m = cb.spendAll(p); p.manaNext += Math.round(m * 1.5); say(cb, `${Math.round(m * 1.5)} mana returns next turn.`); } },
  manaquake: { play: (cb, t, p) => { const m = Math.floor(p.mana / 2); p.mana -= m; DA(cb, m, 'Manaquake'); } },
  limit_break: { play: (cb, t, p) => D_(cb, t, cb.spendAll(p), 'Limit Break') },
  ruthless_conversion: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const v = e.vulnerable; e.vulnerable = 0; const s = 10 * Math.floor(v / 5); p.strCombat += s; say(cb, `${v} Vulnerable consumed: +${s} Strength for the fight.`); } },
  thousand_cuts: { play: (cb, t, p) => { const hits = Math.floor(cb.spendAll(p) / 5); for (let i = 0; i < hits && !cb.over; i++) D_(cb, t, 1, 'Thousand Cuts'); } },
  shatterplate: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; e.vulnerable += p.block; say(cb, `${p.block} Block becomes ${p.block} Vulnerable on ${e.name}.`); p.block = 0; } },
  pain_echo: { play: (cb, t, p) => { if (!p.dmgRound) return say(cb, 'You have not been damaged this round.'); for (const e of cb.alive()) e.weak += p.dmgRound; say(cb, `All enemies gain ${p.dmgRound} Weak.`); } },
  deepen_the_wound: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) { e.vulnerable += e.bleed; say(cb, `${e.name} gains ${e.bleed} Vulnerable.`); } } },
  hemorrhagic_strike: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const h = Math.floor(e.bleed / 2); e.bleed -= h; D_(cb, e, 10 + h, 'Hemorrhagic Strike'); } },
  killing_blow: { play: (cb, t, p) => { p.turn.killingBlow = true; say(cb, 'Your next crit this turn deals double damage.'); } },
  taunt: { play: (cb, t, p) => { cb.gainDef(6); cb.setTaunt(p); } },
  guarded_stance: { play: (cb, t, p) => { cb.gainDef(8); (p.until.onFull = p.until.onFull || []).push((c, q) => { c.say('player', 'Guarded Stance: draw 1.'); c.drawCards(q, 1); }); } },
  kick_aside: { play: (cb, t, p) => { cb.exhaustStatus(p, 1); cb.gainDef(5); } },
  hardened: { play: (cb, t, p) => { cb.gainDef(6); (p.until.immuneTypes = p.until.immuneTypes || []).push('Poison'); } },
  shatter_guard: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; e.block = Math.max(0, e.block - 10); D_(cb, e, 6, 'Shatter Guard'); } },
  overpower: { play: (cb, t, p) => { const e = tgtOf(cb, t); D_(cb, e, 18 + (e && e.block > 0 ? 10 : 0), 'Overpower'); } },
  pummel: { play: (cb, t, p) => { const e = D_(cb, t, 10, 'Pummel'); if (e && e.hp > 0) cb.eDiscard(e, 1); } },
  grudge: { play: (cb, t, p) => { p.until.grudge = {}; say(cb, 'Damage you take until your next turn will burn the attackers\' mana.'); } },
  battle_trance: { play: (cb, t, p) => { cb.drawCards(p, 3); p.turn.noDraw = true; } },
  sharpen: { play: (cb, t, p) => { p.nextAttackFlat += 6; say(cb, 'Your next Attack deals 6 more damage per hit.'); } },
  focused_fury: { play: (cb, t, p) => { p.turn.nextMult = 1.5; say(cb, 'Your next card is 50% stronger.'); } },
  shield_slam: { play: (cb, t, p) => blockToDmg(cb, t, p, 0.5, 'Shield Slam', true) },
  counter_stance: { play: (cb, t, p) => { cb.gainDef(15); p.until.backDmg = 5; } },
  rally: { play: (cb, t, p) => { for (const a of cb.allies()) { a.strTurn += 20; cb.defFor(a, 6); } say(cb, 'Everyone gains 20 Strength this turn.'); } },
  clear_head: { play: (cb, t, p) => { const n = cb.exhaustStatus(p, 10); cb.drawCards(p, n); } },
  cauterize: { play: (cb, t, p) => { const n = p.bleed + p.burn; p.bleed = 0; p.burn = 0; cb.heal(p, n, 'Cauterize'); } },
  hamstring: { play: (cb, t, p) => { const e = D_(cb, t, 7, 'Hamstring'); if (e) e.weakNext = 1; } },
  staggering_blow: { play: (cb, t, p) => { const e = D_(cb, t, 16, 'Staggering Blow'); if (e && e.hp > 0) cb.eStatus(e, 'dazed', 1); } },
  fireproof: { play: (cb, t, p) => { cb.gainDef(8); (p.until.immuneTypes = p.until.immuneTypes || []).push('Fire'); } },
  mortal_strike: { play: (cb, t, p) => { const e = D_(cb, t, 24, 'Mortal Strike'); if (e) e.noHealRound = cb.round + 1; } },
  spell_reflection: { play: (cb, t, p) => { p.until.reflect = true; say(cb, 'The next debuff on you will be reflected.'); } },
  berserker_rage: { play: (cb, t, p) => { cb.cleanseAll(p, true); p.until.debuffImmune = true; } },
  sweeping_strikes: { play: (cb, t, p) => { p.turn.sweep = 2; say(cb, 'Your next 2 single-target Attacks also hit a second enemy.'); } },
  rampage: { play: (cb, t, p) => { D_(cb, t, 8 + 5 * p.rampage, 'Rampage'); p.rampage++; } },
  last_stand: { play: (cb, t, p) => { const n = p.hand.length; p.discard.push(...p.hand.splice(0)); cb.heal(p, Math.round(p.maxHp * 0.05 * n), 'Last Stand'); } },
  imbue_weapon: { play: (cb, t, p) => { const e = tgtOf(cb, t); p.turn.attackDtype = e && e.weakTo === 'Frost' ? 'Frost' : 'Fire'; say(cb, `Your Attacks deal ${p.turn.attackDtype} damage this turn.`); cb.drawCards(p, 1); } },
  concussive_blow: { play: (cb, t, p) => { const e = D_(cb, t, 20, 'Concussive Blow'); if (e && e.hp > 0) cb.eStatus(e, 'stun', 1); } },
  intervene: { play: (cb, t, p) => { cb.gainDef(15); const a = cb.pickAlly(p, false); if (a !== p) { p.until.guarding = a.id; say(cb, `${p.name} will take the next attack on ${a.name}.`); } } },
  disarm: { play: (cb, t, p) => { const e = D_(cb, t, 8, 'Disarm'); if (e) { e.disarmed = 1; cb.planEnemy(e, true); say(cb, `${e.name} is Disarmed: no Attacks next turn.`); } } },
  double_strike: { play: (cb, t, p) => { p.turn.twice = { type: 'Attack', extra: 10 }; say(cb, 'Your next Attack is played twice (+10 mana).'); } },
  siphoning_strikes: { play: (cb, t, p) => { p.turn.siphon = true; say(cb, 'Damage you deal this turn also burns mana.'); } },
  rattle: { play: (cb, t, p) => { const e = D_(cb, t, 4, 'Rattle'); if (e && e.hp > 0) cb.eDiscard(e, 1); } },
  crushing_blow: { play: (cb, t, p) => { const e = D_(cb, t, 14, 'Crushing Blow'); if (e && e.hp > 0 && cb._lastLost > 0) cb.eDiscard(e, 1, 'highest'); } },
  throw_weapon: { play: (cb, t, p) => { const e = D_(cb, t, 6, 'Throw Weapon'); for (let i = 0; i < 2 && p.hand.length; i++) { const c = p.hand.slice().sort((a, b) => (C[a.key].type === 'Status' ? -1 : C[a.key].cost) - (C[b.key].type === 'Status' ? -1 : C[b.key].cost))[0]; p.hand.splice(p.hand.indexOf(c), 1); p.discard.push(c); } if (e && e.hp > 0) cb.eDiscard(e, 2); } },
  war_stomp: { play: (cb) => { for (const e of cb.alive()) cb.eDiscard(e, 1); } },
  shatter_will: { play: (cb, t, p) => { cb.loseHp(p, 8, 'Shatter Will'); const e = tgtOf(cb, t); if (e) cb.eExhaust(e, 1); } },
  forge_hardened: { play: (cb, t, p) => { cb.gainDef(6); p.until.convertNext = 'Fire'; } },
  rimeguard: { play: (cb, t, p) => { cb.gainDef(6); p.until.convertNext = 'Frost'; } },
  tempered_steel: { play: (cb, t, p) => { p.until.convert = 'Fire'; say(cb, 'Damage you take until your next turn is Fire.'); } },
  elemental_ward: { play: (cb, t, p) => { const el = ['Fire', 'Frost', 'Nature', 'Arcane', 'Shadow', 'Holy'].sort((a, b) => (p.resist[b] || 0) - (p.resist[a] || 0))[0]; p.until.convert = el; say(cb, `Damage you take until your next turn is ${el} (your best resistance).`); } },
  battle_rhythm: { play: (cb, t, p) => { p.turn.costAttack = (p.turn.costAttack || 0) - 5; say(cb, 'Attacks cost 5 less this turn.'); } },
  spoils_of_war: { play: (cb, t, p) => { p.turn.killMana = 30; say(cb, 'If an enemy dies this turn, gain 30 mana.'); } },
  war_chest: { retain: true, endInHand: retainMana, play: () => {} },
  survey_the_field: { play: (cb, t, p) => cb.topPick(p, 3) },
  fall_back: { play: (cb, t, p) => { const n = p.hand.length; p.discard.push(...p.hand.splice(0)); p.drawNext = (p.drawNext || 0) + n; say(cb, `Draw ${n} more next round.`); } },
  marching_orders: { play: (cb, t, p) => { let k = 0; cb.timed(p, 'march', 3, { each: (c, q) => { k++; q.drawNext = (q.drawNext || 0) + k; } }); say(cb, 'Draw 1, then 2, then 3 extra cards over your next turns.'); } },
  adrenaline_surge: { play: (cb, t, p) => { p.strCombat += 60; cb.timed(p, 'adrenaline', 6, { each: (c, q) => { q.strCombat -= 10; } }); say(cb, '+60 Strength, fading by 10 each turn.'); } },
  bully: { play: (cb, t, p) => { const e = tgtOf(cb, t); D_(cb, e, 16 + (e && p.hp > e.hp ? 16 : 0), 'Bully'); } },
  fortify: { play: (cb, t, p) => { cb.timed(p, 'fortify', 5, { each: (c) => c.gainDef(10) }); say(cb, 'Gain 10 Block at the start of each of your next 5 turns.'); } },
  shield_strike: { play: (cb, t, p) => blockToDmg(cb, t, p, 0.25, 'Shield Strike', true, false, false, 10) },
  thunderclap: { play: (cb, t, p) => DA(cb, 14 * p.hp / p.maxHp, 'Thunderclap') },
  indomitable: { play: (cb, t, p) => { cb.timed(p, 'keepBlock', 3); say(cb, 'For 3 turns, enemy effects cannot reduce your Block.'); } },
  riposte: { play: (cb, t, p) => { cb.gainDef(6); (p.until.onFull = p.until.onFull || []).push((c, q, e) => { if (e.hp > 0 && !q.until.riposted) { q.until.riposted = true; c.applyHit(q, e, 8, { label: 'Riposte' }); c.say('player', `Riposte: ${e.name} takes 8.`); if (e.hp <= 0) c.onDeath(e); } }); } },
  challenging_roar: { play: (cb, t, p) => { cb.gainDef(8); cb.setTaunt(p); } },
  read_the_blade: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; if (e.isPlayer) { cb.gainDef(10); return; } const c = e.hand.find(x => e.plan.includes(x.uid) && x.ops.some(o => o.op === 'damage')); const o = c && c.ops.find(x => x.op === 'damage'); const n = o ? Math.round(o.n * cb.dmgMult * (o.times || 1)) : 0; if (n) cb.gainDef(n); else say(cb, `${e.name} has no Attack planned.`); } },
  jarring_parry: { play: (cb, t, p) => { cb.gainDef(20); (p.until.onFull = p.until.onFull || []).push((c, q, e) => c.eStatus(e, 'dazed', 1)); } },
  bait: { play: (cb, t, p) => { cb.gainDef(12); (p.parryNext = p.parryNext || []).push((c, q, e) => { e.vulnerable += 20; c.eDiscard(e, 1); c.say('player', `${e.name} takes the bait: 20 Vulnerable.`); }); } },
  defiant_roar: { play: (cb, t, p) => { cb.setTaunt(p); p.until.lessDmg = 0.1; } },
  unnerving_guard: { play: (cb, t, p) => { cb.gainDef(15); (p.until.onFull = p.until.onFull || []).push((c, q, e) => c.eStatus(e, 'stun', 1)); } },
  underdog: { play: (cb, t, p) => { const e = tgtOf(cb, t); D_(cb, e, 6 + (e && p.hp < e.hp ? 6 : 0), 'Underdog'); } },
  desperate_strike: { play: (cb, t, p) => D_(cb, t, 5 + Math.floor((1 - p.hp / p.maxHp) * 20), 'Desperate Strike') },
  collect_the_debt: { play: (cb, t, p) => { const n = p.bloodDebt; p.bloodDebt = 0; D_(cb, t, n, 'Collect the Debt'); } },
  sanguine_guard: { play: (cb, t, p) => { if (p.bloodDebt) cb.gainDef(p.bloodDebt); else say(cb, 'No Blood Debt stored.'); } },
  transfusion: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) { e.bleed += p.bleed; e.bleedBy = p.id; say(cb, `${p.bleed} Bleed moves to ${e.name}.`); p.bleed = 0; } } },
  seismic_slam: { play: (cb, t, p) => DA(cb, p.mana * 0.5, 'Seismic Slam') },
  wind_up: { retain: true, play: (cb, t, p) => { p.windUp = true; say(cb, 'Your next Attack deals +1 damage per 5 mana it costs.'); } },
  sundering_blow: { play: (cb, t, p) => { const e = tgtOf(cb, t); for (let i = 0; i < 3 && e && e.hp > 0 && !cb.over; i++) { e.block = Math.max(0, e.block - 3); cb.hit(e, 5, 'Sundering Blow'); } } },
  mark_for_death: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; e.vulnerable += 20; e.markDraw = cb.round; say(cb, `${e.name} gains 20 Vulnerable; each ally's first Attack on it this round draws a card.`); } },
  relentless_assault: { play: (cb, t, p) => { cb.timed(p, 'relentless', 2); say(cb, 'For 2 turns, unblocked hits apply 1 Vulnerable.'); } },
  reclaim_ground: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const v = e.vulnerable; e.vulnerable = 0; if (v) cb.gainDef(v); } },
  killer_instinct: { play: (cb, t, p) => critBuff(cb, p) },
  lacerate: { play: (cb, t, p) => { const e = D_(cb, t, 4, 'Lacerate'); if (e && cb._lastCrit && e.hp > 0) { e.bleed += 8; e.bleedBy = p.id; say(cb, `Crit: ${e.name} gains 8 Bleed.`); } } },
  sever: { play: (cb, t, p) => { const e = D_(cb, t, 6, 'Sever'); if (e && cb._lastCrit) cb.extraTick(e, 'bleed'); } },
  scent_of_blood: { play: (cb, t, p) => cb.drawCards(p, cb.alive().filter(e => e.bleed > 0).length) },
  flush_out: { play: (cb, t) => D_(cb, t, 5, 'Flush Out') },
  iron_constitution: { play: (cb, t, p) => { cb.timed(p, 'poisonBlock', 2); say(cb, 'For 2 turns, Poison damage can be Blocked.'); } },
  rattling_roar: { play: (cb, t, p) => { const e = D_(cb, t, 6, 'Rattling Roar'); if (e) e.drawLess = (e.drawLess || 0) + 1; } },
  overwhelm: { play: (cb, t, p) => { cb.loseHp(p, 10, 'Overwhelm'); for (const e of cb.alive()) e.drawLess = (e.drawLess || 0) + 2; say(cb, 'All enemies draw 2 fewer next turn.'); } },
  plunder_armor: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = Math.min(15, e.block); e.block -= n; p.block += n; say(cb, `Took ${n} Block from ${e.name}.`); } },
  shatter_morale: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) cb.removeBuffs(e, 9); p.block = 0; } },
  crimson_whirl: { play: (cb, t, p) => { for (const e of cb.alive()) { if (cb.over) break; cb.hit(e, 6, 'Crimson Whirl'); if (e.hp > 0) cb.applyDot(e, 'bleed', 5); } } },
  // ===== Rogue
  crippling_poison: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; cb.applyDot(e, 'poison', 4); e.slow = (e.slow || 0) + 3; } },
  kunai_rain: { play: (cb) => { DA(cb, 5, 'Kunai Rain'); DA(cb, 5, 'Kunai Rain'); } },
  expose_artery: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; e.vulnerable += 15; cb.applyDot(e, 'bleed', 3); } },
  vanishing_act: { play: (cb, t, p) => { p.stealth = true; p.until.immune = true; say(cb, 'Untouchable until your next turn.'); } },
  coated_blade: { play: (cb, t, p) => { p.turn.coated = true; say(cb, 'Your next Attack also applies 25% of its damage as Bleed and Poison.'); } },
  shadow_s_price: { play: (cb, t, p) => D_(cb, t, cb.spendAll(p), "Shadow's Price") },
  venom_flood: { play: (cb, t, p) => { const e = tgtOf(cb, t); const m = cb.spendAll(p); if (e) { e.poison += m; e.poisonBy = p.id; say(cb, `${e.name} gains ${m} Poison.`); } } },
  plague_bloom: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; cb.applyDot(e, 'poison', 10); const x = 5 * Math.floor(e.poison / 10); if (x) { e.poison += x; say(cb, `+${x} more Poison.`); } } },
  toxic_detonation: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = e.poison; e.poison = 0; D_(cb, e, n, 'Toxic Detonation'); } },
  exsanguinate: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = e.bleed; e.bleed = 0; D_(cb, e, n * 5, 'Exsanguinate'); } },
  rupture: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) { e.bleed *= 2; say(cb, `${e.name}'s Bleed doubles to ${e.bleed}.`); } } },
  crimson_deluge: { play: (cb, t, p) => { const e = tgtOf(cb, t); const m = cb.spendAll(p); if (e) { e.bleed += m; e.bleedBy = p.id; say(cb, `${e.name} gains ${m} Bleed.`); } } },
  blood_frenzy: { play: (cb, t, p) => { p.bleedX = 2; cb.timed(p, 'bleedX', 5, { end: (c, q) => { q.bleedX = 1; } }); say(cb, 'Bleed you apply is doubled for 5 turns.'); } },
  hidden_arsenal: { play: (cb, t, p) => { const sh = p.exhaust.filter(c => c.key === 'shuriken'); say(cb, `${sh.length} Shurikens fly.`); for (const c of sh) { const was = cb._playing; cb._playing = C.shuriken; D_(cb, t, 4, 'Shuriken'); cb._playing = was; } } },
  endless_blades: { play: (cb, t, p) => { cb.timed(p, 'endless', 5); say(cb, 'Shurikens are thrown twice for 5 turns.'); } },
  mutual_ruin: { play: (cb, t, p) => { const n = p.hand.length; p.discard.push(...p.hand.splice(0)); const e = tgtOf(cb, t); if (e) cb.eDiscard(e, n); } },
  scorched_plans: { play: (cb, t, p) => { const n = Math.floor(cb.spendAll(p) / 10); const e = tgtOf(cb, t); for (let i = 0; i < n && p.drawPile.length; i++) p.exhaust.push(p.drawPile.pop()); if (e) { const k = Math.min(n, e.drawPile.length); e.drawPile.splice(0, k); e.exhaustedTotal = (e.exhaustedTotal || 0) + k; } say(cb, `You and ${e ? e.name : 'the enemy'} each exhaust ${n} cards from the draw pile.`); } },
  total_sabotage: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = cb.eExhaust(e, e.hand.length); for (let i = 0; i < n; i++) p.drawPile.splice(Math.floor(cb.rng() * (p.drawPile.length + 1)), 0, { uid: 'c' + (cb._uid++), key: 'dazed' }); } },
  evasive_flow: { play: (cb, t, p) => { cb.timed(p, 'defX', 2); p.turn.defX = true; say(cb, 'Dodge gained is doubled for 2 turns.'); } },
  phantom_strike: { play: (cb, t, p) => { const m = cb.spendAll(p); D_(cb, t, m, 'Phantom Strike'); cb.gainDef(m); } },
  untouchable: { play: (cb, t, p) => { p.until.immune = true; say(cb, 'Immune to damage until your next turn.'); } },
  backstab: { play: (cb, t, p) => D_(cb, t, p.stealth ? 14 : 7, 'Backstab') },
  lurk: { play: (cb, t, p) => { cb.gainDef(6); p.turn.lurk = true; } },
  cheap_shot: { play: (cb, t, p) => { const e = tgtOf(cb, t); D_(cb, e, 6 + (e && !e.block ? 4 : 0), 'Cheap Shot'); } },
  toss_aside: { play: (cb, t, p) => { cb.exhaustStatus(p, 1); cb.gainDef(4); } },
  decoy: { play: (cb, t, p) => cb.defFor(cb.pickAlly(p, false), 10) },
  underhanded: { play: (cb, t, p) => { const e = tgtOf(cb, t); D_(cb, e, 6 + (e && p.hp < e.hp ? 6 : 0), 'Underhanded'); } },
  shadow_cloak: { play: (cb, t, p) => { cb.gainDef(10); p.turn.endStealth = true; } },
  ambush: { play: (cb, t, p) => { const st = p.stealth; D_(cb, t, st ? 28 : 14, 'Ambush'); if (st) cb.drawCards(p, 1); } },
  patient_blade: { retain: true, endInHand: (cb, p) => { p.nextAttackFlat += 5; say(cb, 'Patient Blade: next Attack +5.'); }, play: () => {} },
  venom_vial: { play: (cb, t) => cb.eStatus(tgtOf(cb, t), 'venom', 2) },
  fester: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) cb.extraTick(e, 'poison'); } },
  pilfer: { play: (cb, t) => { const e = D_(cb, t, 4, 'Pilfer'); if (e && e.hp > 0) cb.eDiscard(e, 1); } },
  spread_rumors: { play: (cb, t) => cb.eStatus(tgtOf(cb, t), 'dazed', 2) },
  evasive_counter: { play: (cb, t, p) => { cb.gainDef(15); p.until.backDmg = 5; } },
  phantom_lunge: { play: (cb, t, p) => blockToDmg(cb, t, p, 0.5, 'Phantom Lunge', true) },
  quickening: { play: (cb, t, p) => { p.turn.costDelta = (p.turn.costDelta || 0) - 5; say(cb, 'Cards cost 5 less this turn.'); } },
  hidden_stash: { retain: true, endInHand: retainMana, play: () => {} },
  scout_ahead: { play: (cb, t, p) => cb.topPick(p, 3) },
  shadow_ward: { play: (cb, t, p) => { cb.gainDef(6); p.until.convertNext = 'Shadow'; } },
  mithridate: { play: (cb, t, p) => { const n = p.poison; p.poison = 0; if (n) cb.gainDef(2 * n); } },
  mind_numbing_poison: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; cb.applyDot(e, 'poison', 4); e.costUp = 10; cb.planEnemy(e, true); } },
  leeching_blade: { play: (cb, t, p) => { D_(cb, t, 8, 'Leeching Blade'); if (cb._lastLost) cb.heal(p, Math.round(cb._lastLost / 2), 'Leeching Blade'); } },
  expose_weakness: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; e.vulnerable += 15; e.markDraw = cb.round; } },
  cripple: { play: (cb, t) => { const e = D_(cb, t, 7, 'Cripple'); if (e) e.weakNext = 1; } },
  ready_the_blades: { play: (cb, t, p) => { p.nextAttackFlat += 5; say(cb, 'Your next Attack deals 5 more damage per hit.'); } },
  shadow_dance: { play: (cb, t, p) => { p.stealth = true; p.stealthKeep = (p.stealthKeep || 0) + 1; say(cb, `${p.name} slips into Stealth. Your next Attack won't break it.`); } },
  vanish: { play: (cb, t, p) => { cb.cleanseAll(p, true); p.stealth = true; } },
  eviscerate: { play: (cb, t, p) => { const st = p.stealth; const e = D_(cb, t, 24, 'Eviscerate'); if (st && e && e.hp > 0) cb.applyDot(e, 'bleed', 10); } },
  wound_poison: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; cb.applyDot(e, 'poison', 6); e.noHealRound = cb.round + 1; } },
  arterial_strike: { play: (cb, t) => { const e = D_(cb, t, 10, 'Arterial Strike'); if (e) cb.extraTick(e, 'bleed'); } },
  ransack: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) cb.eExhaust(e, 1); p.drawPile.splice(Math.floor(cb.rng() * (p.drawPile.length + 1)), 0, { uid: 'c' + (cb._uid++), key: 'dazed' }); } },
  sabotage_supplies: { play: (cb) => { for (const e of cb.alive()) cb.eDiscard(e, 1); } },
  disarming_flick: { play: (cb, t) => { const e = D_(cb, t, 8, 'Disarming Flick'); if (e) { e.disarmed = 1; cb.planEnemy(e, true); } } },
  mirror_step: { play: (cb, t, p) => { p.until.reflect = true; } },
  shadow_echo: { play: (cb, t, p) => { p.turn.twice = { type: 'Attack', extra: 10 }; say(cb, 'Your next Attack is played twice (+10 mana).'); } },
  killing_focus: { play: (cb, t, p) => critBuff(cb, p) },
  kidney_shot: { play: (cb, t) => { const e = D_(cb, t, 15, 'Kidney Shot'); if (e && e.hp > 0) cb.eStatus(e, 'stun', 1); } },
  shadowform: { play: (cb, t, p) => { p.until.convert = 'Shadow'; } },
  bounty: { play: (cb, t, p) => { p.turn.killMana = 30; } },
  cover_escape: { play: (cb, t, p) => { const a = cb.pickAlly(p, false); cb.defFor(a, 12); a.stealth = true; say(cb, `${a.name} slips into Stealth.`); } },
  deathmark: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; e.deathmark = { by: p.id, dmg: 0 }; cb.timed(p, 'deathmark', 2, { end: (c, q) => { if (e.hp > 0 && e.deathmark) { const n = Math.round(e.deathmark.dmg * 0.5); const was = c._playing; c._playing = { type: 'Skill', dtype: 'Shadow', tags: {}, isPower: true }; c.applyHit(q, e, n, { label: 'Deathmark' }); c._playing = was; c.say('crit', `Deathmark: ${e.name} takes ${n} Shadow damage.`); } e.deathmark = null; } }); say(cb, `${e.name} is marked for death.`); } },
  preparation: { play: (cb, t, p) => { const back = (p.turn.played || []).slice(-2); for (const c of back) { for (const pile of [p.discard, p.exhaust]) { const i = pile.indexOf(c); if (i >= 0) pile.splice(i, 1); } c.free = true; if (p.hand.length < 10) p.hand.push(c); } say(cb, `${back.length} card${back.length === 1 ? '' : 's'} back to your hand, free this turn.`); } },
  kick_while_down: { play: (cb, t) => { const e = tgtOf(cb, t); D_(cb, e, 4 + 5 * (e ? e.lostRound || 0 : 0), 'Kick While Down'); } },
  fade_to_black: { play: (cb, t, p) => { p.bleed = p.poison = p.burn = 0; p.stealth = true; say(cb, 'Cleansed and in Stealth.'); } },
  dust_in_the_eyes: { play: (cb, t) => D_(cb, t, 5, 'Dust in the Eyes') },
  corrosive_toxin: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; cb.removeBuffs(e, 1); cb.applyDot(e, 'poison', 4); } },
  grievous_shiv: { play: (cb, t) => { const e = D_(cb, t, 3, 'Grievous Shiv'); if (e) e.grievous = 2; } },
  tourniquet: { play: (cb, t, p) => { const n = p.bleed; p.bleed = 0; if (n) cb.gainDef(2 * n); } },
  bankrupt: { play: (cb, t) => { const e = tgtOf(cb, t); D_(cb, e, 3 * (e ? e.exhaustedTotal || 0 : 0), 'Bankrupt'); } },
  misdirection: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) e.drawLess = (e.drawLess || 0) + 1; p.drawPile.splice(Math.floor(cb.rng() * (p.drawPile.length + 1)), 0, { uid: 'c' + (cb._uid++), key: 'dazed' }); } },
  cut_the_strings: { play: (cb, t, p) => { const n = Math.min(3, Math.floor(cb.spendAll(p) / 20)); const e = tgtOf(cb, t); if (e) { e.drawLess = (e.drawLess || 0) + n; say(cb, `${e.name} draws ${n} fewer next turn.`); } } },
  pick_the_lock: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const had = e.block > 0; e.block = Math.max(0, e.block - 12); if (!had) cb.drawCards(p, 1); } },
  purloined_guard: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = Math.min(10, e.block); e.block -= n; p.block += n; say(cb, `Stole ${n} Block.`); } },
  grand_larceny: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) cb.stealBuff(p, e); p.drawPile.splice(Math.floor(cb.rng() * (p.drawPile.length + 1)), 0, { uid: 'c' + (cb._uid++), key: 'dazed' }); } },
  dispelling_strike: { play: (cb, t, p) => { const e = D_(cb, t, 3, 'Dispelling Strike'); if (e) cb.removeBuffs(e, 1); cb.loseHp(p, 3, 'Dispelling Strike'); } },
  hamstring_cut: { play: (cb, t, p) => { const e = D_(cb, t, 6, 'Hamstring Cut'); if (e) { e.initNext = (e.initNext || 0) - 4; p.initNext += 4; } } },
  blinding_speed: { play: (cb, t, p) => { cb.timed(p, 'speed', 2, { begin: (c, q) => { q.baseInit += 10; }, end: (c, q) => { q.baseInit -= 10; } }); cb.drawCards(p, 1); } },
  evasive_precision: { play: (cb, t, p) => { p.turn.critPlus = Math.min(50, p.block); say(cb, `+${p.turn.critPlus}% crit chance this turn.`); } },
  death_from_above: { play: (cb, t, p) => DA(cb, p.stealth ? 24 : 16, 'Death From Above') },
  // ===== Mage
  borrowed_power: { play: (cb, t, p) => { p.turn.nextFree = true; say(cb, 'Your next card costs no mana.'); } },
  grand_conduit: { play: (cb, t, p) => { p.turn.nextMult = 2; say(cb, 'Your next card is twice as strong.'); } },
  mana_reflux: { play: (cb, t, p) => { p.turn.reflux = true; say(cb, "Your next spell's cost comes back over 3 turns."); } },
  falling_star: { play: (cb, t, p) => D_(cb, t, cb.spendAll(p), 'Falling Star') },
  arcane_cascade: { play: (cb, t, p) => { p.turn.cascade = true; say(cb, 'Every card you play this turn draws a card.'); } },
  open_the_floodgates: { play: (cb, t, p) => { cb.drawCards(p, 3); p.turn.freeAll = true; p.turn.noDraw = true; say(cb, 'Draw 3. Everything is free this turn. No more draws.'); } },
  purge_the_static: { play: (cb, t, p) => { const n = cb.exhaustStatus(p, 10); for (let i = 0; i < n && !cb.over; i++) D_(cb, t, 10, 'Purge the Static'); } },
  fan_the_flames: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) { e.burn = Math.round(e.burn * 1.25); say(cb, `${e.name}'s Burn rises to ${e.burn}.`); } } },
  cauterized_ward: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = e.burn; e.burn = 0; if (n) cb.gainDef(n); } },
  ashen_drain: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const b = e.burn; e.burn = 0; cb.drainMana(e, Math.round(b / 2)); cb.eStatus(e, 'fatigue', Math.floor(b / 20), 'discard'); say(cb, `${e.name} loses ${Math.round(b / 2)} mana.`); } }, // Nov 3: half the Burn, 1 Fatigue per 20
  stored_impact: { play: (cb, t, p) => { p.until.storing = true; say(cb, 'Damage you take until your next turn comes back as Barrier.'); } },
  mirror_barrier: { play: (cb, t, p) => { p.block = Math.round(p.block * 1.5); say(cb, `Barrier raised by half, to ${p.block}.`); } },
  barrier_burst: { play: (cb, t, p) => blockToDmg(cb, t, p, 1, 'Barrier Burst') },
  shared_refuge: { play: (cb, t, p) => { const n = p.dmgRound; if (!n) return say(cb, 'You have not taken damage this round.'); for (const a of cb.allies()) cb.defFor(a, n); } },
  mana_scorch: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const x = Math.min(p.mana, e.maxMana); p.mana -= x; const s = cb.drainMana(e, x); say(cb, `${e.name} loses ${s} mana.`); } },
  thought_collapse: { play: (cb, t, p) => { const n = cb.exhaustStatus(p, 10); const e = tgtOf(cb, t); if (e) { cb.eExhaust(e, n); e.drawLess = (e.drawLess || 0) + n; } } },
  time_theft: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; e.baseInit -= 5; p.baseInit += 5; say(cb, `Stole 5 Initiative from ${e.name} for the fight.`); } },
  refill_the_mind: { play: (cb, t, p) => cb.drawCards(p, 10 - p.hand.length) },
  frost_armor: { play: (cb, t, p) => { cb.gainDef(7); (p.until.nextAttacker = p.until.nextAttacker || []).push((c, q, e) => c.applyChill(e, 3)); } },
  ice_lance: { play: (cb, t) => { const e = tgtOf(cb, t); D_(cb, e, e && e.chill > 0 ? 12 : 6, 'Ice Lance'); } },
  arcane_intellect: { play: (cb, t, p) => { p.intTurn = (p.intTurn || 0) + 20; say(cb, '+20 Intelligence this turn.'); cb.drawCards(p, 1); } },
  study: { play: (cb, t, p) => { cb.drawCards(p, 2); if (p.hand.length) { const c = p.hand.slice().sort((a, b) => (C[a.key].type === 'Status' ? -1 : C[a.key].cost) - (C[b.key].type === 'Status' ? -1 : C[b.key].cost))[0]; p.hand.splice(p.hand.indexOf(c), 1); p.discard.push(c); say(cb, `Discarded ${C[c.key].name}.`); } } },
  disenchant: { play: (cb, t, p) => { cb.exhaustStatus(p, 1); cb.gainDef(4); } },
  warmth: { play: (cb, t, p) => { cb.gainDef(6); (p.until.immuneTypes = p.until.immuneTypes || []).push('Frost'); } },
  concentrate: { play: (cb, t, p) => { p.turn.skillFlat = (p.turn.skillFlat || 0) + 8; say(cb, 'Your next damaging Skill deals 8 more.'); } },
  chilling_touch: { play: (cb, t) => { const e = D_(cb, t, 4, 'Chilling Touch'); if (e) cb.applyChill(e, 2); cb.gainDef(5); } },
  shared_ward: { play: (cb, t, p) => cb.defFor(cb.pickAlly(p, false), 10) },
  unstable_bolt: { play: (cb, t, p) => { const e = tgtOf(cb, t); D_(cb, e, 6 + (e && p.hp < e.hp ? 6 : 0), 'Unstable Bolt'); } },
  arm_living_bomb: { play: (cb, t) => cb.eStatus(tgtOf(cb, t), 'bomb', 1) },
  combust: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) cb.extraTick(e, 'burn'); } },
  shatter: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const n = e.chill, fz = !!e.frozen; e.chill = 0; if (fz) say(cb, `${e.name} is Frozen: Shatter hits for triple, plus 20.`); D_(cb, e, fz ? 6 * n + 20 : 2 * n, 'Shatter'); } }, // Nov 3: triple plus 20 vs Frozen
  frostbite_curse: { play: (cb, t) => cb.eStatus(tgtOf(cb, t), 'frostbite', 2) },
  hexing_word: { play: (cb, t) => cb.eStatus(tgtOf(cb, t), 'hex', 1) },
  lay_bare: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) { e.exposure += 4; cb.planEnemy(e, true); say(cb, `${e.name} gains 4 Exposure: its cards cost 20% more.`); } } },
  echoing_rune: { play: (cb, t, p) => { p.turn.echoArcane = true; say(cb, 'Your next Arcane Skill is played twice.'); } },
  arcane_flow: { play: (cb, t, p) => { p.turn.costSkill = (p.turn.costSkill || 0) - 5; say(cb, 'Skills cost 5 less this turn.'); } },
  mirror_ward: { play: (cb, t, p) => { cb.gainDef(15); p.until.backDmg = 5; } },
  barrier_bolt: { play: (cb, t, p) => blockToDmg(cb, t, p, 0.5, 'Barrier Bolt', true) },
  fire_ward: { play: (cb, t, p) => { cb.gainDef(8); (p.until.immuneTypes = p.until.immuneTypes || []).push('Fire'); } },
  mana_gem: { retain: true, endInHand: retainMana, play: () => {} },
  scry: { play: (cb, t, p) => cb.topPick(p, 3) },
  drain_essence: { play: (cb, t, p) => { D_(cb, t, 8, 'Drain Essence'); if (cb._lastLost) cb.heal(p, Math.round(cb._lastLost / 2), 'Drain Essence'); } },
  overcharge: { play: (cb, t, p) => { p.mana += 50; p.noRegenTurns = 1; say(cb, '+50 mana. No regeneration next turn.'); } },
  elemental_focus: { play: (cb, t, p) => { p.turn.skillFlat = (p.turn.skillFlat || 0) + 10; say(cb, 'Your next damaging Skill deals 10 more.'); } },
  flash_freeze: { play: (cb, t) => { const e = D_(cb, t, 12, 'Flash Freeze'); if (e && e.chill >= 5) cb.applyChill(e, 5); } },
  glacial_spike: { play: (cb, t) => { const e = tgtOf(cb, t); const ch = e && e.chill > 0; D_(cb, e, 30, 'Glacial Spike'); if (ch && e.hp > 0) { e.frozen = true; say(cb, `${e.name} is Frozen.`); } } },
  arcane_blast: { play: (cb, t, p) => D_(cb, t, 8 + Math.min(18, 6 * ((p.turn.played || []).filter(c => C[c.key].type === 'Skill' && C[c.key].dtype === 'Arcane').length)), 'Arcane Blast') },
  counterspell: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) { e.counter = 1; say(cb, `${e.name}'s next card will have no effect.`); } } },
  silence: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) { e.silenced = 1; cb.planEnemy(e, true); say(cb, `${e.name} is Silenced: Attacks only next turn.`); } } },
  spellsteal: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) cb.stealBuff(p, e); } },
  ice_block: { play: (cb, t, p) => { cb.cleanseAll(p, true); cb.gainDef(10); p.until.debuffImmune = true; } },
  arcane_mirror: { play: (cb, t, p) => { p.until.reflect = true; } },
  elemental_attunement: { play: (cb, t, p) => CUSTOM.elemental_ward.play(cb, t, p) },
  arcane_power: { play: (cb, t, p) => critBuff(cb, p) },
  presence_of_mind: { play: (cb, t, p) => { p.turn.twice = { type: 'Skill', extra: 10 }; say(cb, 'Your next Skill is played twice (+10 mana).'); } },
  time_warp: { play: (cb, t, p) => { for (const a of cb.allies()) { a.initNext = (a.initNext || 0) + 6; cb.drawCards(a, 1); } } },
  arcane_reservoir: { play: (cb, t, p) => { p.mana += 80; p.noRegenTurns = 2; say(cb, '+80 mana. No regeneration for 2 turns.'); } },
  absorb_essence: { play: (cb, t, p) => { p.turn.killMana = 30; } },
  bombardment: { play: (cb) => { for (const e of cb.alive()) cb.eStatus(e, 'bomb', 1); } },
  transmute: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) cb.eExhaust(e, 1); p.manaNext -= 10; say(cb, 'You will have 10 less mana next turn.'); } },
  mirror_image: { play: (cb, t, p) => { cb.timed(p, 'mirror', 3); say(cb, 'For 2 turns, the first attack on you each round is negated.'); } },
  void_lance: { play: (cb, t) => { const e = tgtOf(cb, t); D_(cb, e, 10 + Math.floor((e ? e.maxMana - e.mana : 0) / 3), 'Void Lance'); } },
  arcane_overflow: { play: (cb, t, p) => DA(cb, cb.spendAll(p) * 0.5, 'Arcane Overflow') },
  faerie_fire: { play: (cb, t) => D_(cb, t, 5, 'Faerie Fire') },
  cauterizing_flame: { play: (cb, t, p) => { const n = p.bleed; p.bleed = 0; if (n) cb.gainDef(2 * n); } },
  mind_fog: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) e.drawLess = (e.drawLess || 0) + 1; } },
  amnesia: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) e.drawLess = (e.drawLess || 0) + 2; p.drawLess += 1; } },
  disintegrate: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; e.block = Math.floor(e.block / 2); D_(cb, e, 6, 'Disintegrate'); } },
  melt_armor: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) { const n = Math.min(e.block, 2 * e.burn); e.block -= n; say(cb, `${e.name} loses ${n} Block.`); } } },
  piercing_arcana: { play: (cb, t, p) => { p.turn.pierce = true; say(cb, 'Your Skills ignore Block this turn.'); } },
  confusion: { play: (cb, t) => { const e = D_(cb, t, 4, 'Confusion'); if (e && e.hp > 0) cb.eDiscard(e, 1); } },
  withering_flame: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; cb.applyDot(e, 'burn', 4); e.grievous = 2; } },
  unravel: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) cb.removeBuffs(e, 9); if (p.hand.length) { const c = p.hand.pop(); p.discard.push(c); } } },
  arcane_brand: { play: (cb, t) => { const e = D_(cb, t, 4, 'Arcane Brand'); if (e) { e.unwarded += 10; say(cb, `${e.name} gains 10 Unwarded.`); } } },
  shatter_wards: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) { e.unwarded += 20; say(cb, `${e.name} gains 20 Unwarded.`); } cb.drawCards(p, 1); } },
  // ===== Paladin
  divine_detonation: { play: (cb, t, p) => { const n = Math.round(p.block * 0.3); p.block = 0; DA(cb, n, 'Divine Detonation'); } },
  martyr_s_reprisal: { play: (cb, t, p) => { const n = Math.round(p.dmgRound * 0.3); if (!n) return say(cb, 'You have not taken damage this round.'); cb.heal(p, n, "Martyr's Reprisal"); DA(cb, n, "Martyr's Reprisal"); } },
  mass_condemnation: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; for (const o of cb.alive()) if (o !== e) for (const k of cb.debuffKeys(e, true)) o[k] = (o[k] || 0) + e[k]; say(cb, `${e.name}'s debuffs spread to every enemy.`); } },
  benediction: { play: (cb, t, p) => { for (const a of cb.allies()) if (a !== p) { a.strTurn += p.strTurn; a.strCombat += p.strCombat; a.block += Math.round(p.block / 2); } say(cb, 'Your blessings spread to the party.'); } },
  twin_verdict: { play: (cb, t, p) => { p.turn.twin = true; say(cb, 'Your next Physical Attack also strikes as Holy.'); } },
  cleansing_flame: { play: (cb, t, p) => { const n = p.burn; p.burn = 0; cb.heal(p, n * 2, 'Cleansing Flame'); } },
  sacred_ash: { play: (cb, t, p) => { const n = p.burn; p.burn = 0; if (n) cb.gainDef(n * 2); } },
  tithe_of_mana: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const s = cb.drainMana(e, 20); p.mana += s; say(cb, `Took ${s} mana.`); } },
  inquisition: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) cb.eExhaust(e, 2); } },
  burden_of_sin: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) { const n = debuffMove(cb, p, e, ['weak', 'vulnerable', 'slow', 'bleed', 'poison', 'burn', 'chill']); say(cb, n ? `Your debuffs move to ${e.name}.` : 'No debuffs to move.'); } } },
  divine_communion: { play: (cb, t, p) => { const m = cb.spendAll(p); for (const a of cb.allies()) cb.heal(a, m, 'Divine Communion'); } },
  quiet_prayer: { play: (cb, t, p) => { cb.gainDef(6); devote(cb, p, 2); } },
  morning_prayer: { play: (cb, t, p) => devote(cb, p, 3) },
  purify: { play: (cb, t, p) => { const a = cb.pickAlly(p, true); const ks = cb.debuffKeys(a, false).slice(0, 2); for (const k of ks) a[k] = 0; say(cb, `${a.name}: ${ks.length} debuff${ks.length === 1 ? '' : 's'} removed.`); } },
  condemn: { play: (cb, t) => { const e = D_(cb, t, 5, 'Condemn'); if (e) condemn(cb, e, 6); } },
  blessing_of_might: { play: (cb, t, p) => { const a = cb.pickAlly(p, true); a.strTurn += 20; cb.drawCards(a, 1); say(cb, `${a.name} gains 20 Strength this turn.`); } },
  guarding_light: { play: (cb, t, p) => cb.defFor(cb.pickAlly(p, false), 10) },
  devout_strike: { play: (cb, t, p) => { D_(cb, t, 6, 'Devout Strike'); devote(cb, p, 2); } },
  cleansing_breath: { play: (cb, t, p) => { cb.exhaustStatus(p, 1); cb.gainDef(4); } },
  sword_and_board: { play: (cb, t, p) => { const was = p.prevType; D_(cb, t, 9, 'Sword and Board'); if (was === 'Skill') cb.gainDef(6); } },
  guarded_advance: { play: (cb, t, p) => cb.gainDef(9 + (p.prevType === 'Attack' ? 5 : 0)) },
  soothing_light: { play: (cb, t, p) => { const a = cb.pickAlly(p, true); const full = a.hp >= a.maxHp; cb.heal(a, 6, 'Soothing Light'); if (full) cb.drawCards(p, 1); } },
  vow_of_penance: { play: (cb, t, p) => { const e = tgtOf(cb, t); D_(cb, e, 6 + (e && p.hp < e.hp ? 6 : 0), 'Vow of Penance'); } },
  fervent_prayer: { play: (cb, t, p) => { devote(cb, p, 5); cb.gainDef(6); } },
  purging_flame: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const n = e.burn; e.burn = 0; D_(cb, e, 2 * n, 'Purging Flame'); } },
  condemning_mark: { play: (cb, t) => { const e = tgtOf(cb, t); if (e) condemn(cb, e, 18); } },
  purge_the_wicked: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; let n = 0; for (const k of cb.debuffKeys(e, true)) { n += e[k]; e[k] = 0; } D_(cb, e, 3 * n, 'Purge the Wicked'); } },
  cleanse: { play: (cb, t, p) => { const a = cb.pickAlly(p, true); cb.cleanseAll(a, false); } },
  stanch_the_wound: { play: (cb, t, p) => { const a = cb.allies().slice().sort((x, y) => y.bleed - x.bleed)[0] || p; const n = a.bleed; a.bleed = 0; cb.heal(a, n, 'Stanch the Wound'); } },
  blessing_of_kings: { play: (cb, t, p) => CUSTOM.rally.play(cb, t, p) },
  hand_of_freedom: { play: (cb, t, p) => { const a = cb.allies().slice().sort((x, y) => (y.slow + y.chill) - (x.slow + x.chill))[0] || p; a.slow = 0; a.chill = 0; a.initNext = (a.initNext || 0) + 4; say(cb, `${a.name} is freed: +4 Initiative next turn.`); } },
  avenging_strike: { play: (cb, t, p) => D_(cb, t, 7 + ([...(cb.allyLost || [])].some(id => id !== p.id) ? 7 : 0), 'Avenging Strike') },
  mending_prayer: { play: (cb, t, p) => { cb.heal(p, 5, 'Mending Prayer'); devote(cb, p, 2); } },
  shield_of_righteousness: { play: (cb, t, p) => blockToDmg(cb, t, p, 0.6, 'Shield of Righteousness', true, false, true) },
  blessed_weapon: { play: (cb, t, p) => { p.turn.attackDtype = 'Holy'; say(cb, 'Your Attacks deal Holy damage this turn.'); cb.drawCards(p, 1); } },
  aegis: { play: (cb, t, p) => { cb.gainDef(8); (p.until.immuneTypes = p.until.immuneTypes || []).push('Shadow'); } },
  hammer_of_wrath: { play: (cb, t) => { const e = tgtOf(cb, t); D_(cb, e, e && e.hp < e.maxHp / 2 ? 12 : 6, 'Hammer of Wrath'); } },
  patient_faith: { retain: true, endInHand: retainMana, play: () => {} },
  seek_guidance: { play: (cb, t, p) => cb.topPick(p, 3) },
  overflowing_light: { play: (cb, t, p) => { p.turn.overflow = true; cb.heal(cb.pickAlly(p, true), 8, 'Overflowing Light'); p.turn.overflow = false; } },
  seal_of_light: { play: (cb, t, p) => { p.turn.lifesteal = 0.25; say(cb, 'Your Attacks heal you for 25% of their damage this turn.'); } },
  reproach: { play: (cb, t) => { const e = D_(cb, t, 4, 'Reproach'); if (e && e.hp > 0) cb.eDiscard(e, 1); } },
  kindled_faith: { play: (cb, t, p) => { p.turn.kindled = true; say(cb, 'Your next Holy damage also applies Burn.'); } },
  hammer_of_justice: { play: (cb, t) => { const e = D_(cb, t, 15, 'Hammer of Justice'); if (e && e.hp > 0) cb.eStatus(e, 'stun', 1); } },
  divine_favor: { play: (cb, t, p) => { p.turn.twice = { type: 'any', extra: 10 }; say(cb, 'Your next card is played twice (+10 mana).'); } },
  avenging_wrath: { play: (cb, t, p) => critBuff(cb, p) },
  blessing_of_sacrifice: { play: (cb, t, p) => CUSTOM.intervene.play(cb, t, p) },
  final_verdict: { devotionPer: 4, play: (cb, t) => D_(cb, t, 12, 'Final Verdict') },
  divine_intervention: { play: (cb, t, p) => { const a = cb.pickAlly(p, true); a.until.noDie = true; say(cb, `${a.name} cannot drop below 1 HP until ${p.name}'s next turn.`); if (a !== p) cb.timed(p, 'diLink', 1, { end: () => { a.until.noDie = false; } }); } },
  mass_dispel: { play: (cb) => { for (const a of cb.allies()) cb.cleanseAll(a, false); } },
  repentance: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; cb.eDiscard(e, 1); condemn(cb, e, 15); } },
  prism_of_faith: { play: (cb, t, p) => { const el = ['Fire', 'Frost', 'Nature', 'Arcane', 'Shadow'].sort((a, b) => (p.resist[b] || 0) - (p.resist[a] || 0))[0]; p.until.convert = el; say(cb, `Damage you take until your next turn is ${el}.`); } },
  hand_of_retribution: { play: (cb, t, p) => { p.until.reflect = true; } },
  reward_of_the_righteous: { play: (cb, t, p) => { p.turn.killMana = 30; } },
  prayer_of_healing: { play: (cb, t, p) => { for (const a of cb.allies()) cb.heal(a, 10, 'Prayer of Healing'); devote(cb, p, 3); } },
  brand_of_sin: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; condemn(cb, e, 10); e.noHealRound = cb.round + 1; } },
  pyre_of_judgment: { play: (cb, t, p) => { for (const e of cb.alive()) cb.applyDot(e, 'burn', 5); const was = cb._playing; cb._playing = Object.assign(Object.create(was), { dtype: 'Holy' }); for (const e of cb.alive()) if (e.burn > 0 && !cb.over) cb.hit(e, 5, 'Pyre of Judgment'); cb._playing = was; } },
  light_of_dawn: { play: (cb) => { for (const a of cb.allies()) { cb.heal(a, Math.round(a.maxHp * 0.2), 'Light of Dawn'); cb.cleanseAll(a, true); } } },
  unbreakable_faith: { play: (cb, t, p) => { cb.timed(p, 'keepBlock', 3); say(cb, 'For 3 turns, enemy effects cannot reduce your Block.'); } },
  sacrificial_light: { play: (cb, t, p) => { cb.loseHp(p, 10, 'Sacrificial Light'); p.turn.healX = 2; say(cb, 'Your next heal this turn is doubled.'); } },
  light_reveals_all: { play: (cb, t) => D_(cb, t, 5, 'Light Reveals All') },
  purity_of_body: { play: (cb, t, p) => { cb.timed(p, 'poisonBlock', 2); say(cb, 'For 2 turns, Poison damage can be Blocked.'); } },
  onward: { play: (cb, t, p) => { D_(cb, t, 5, 'Onward'); cb.drawUntil(p, 'Skill'); } },
  raise_the_banner: { play: (cb, t, p) => { cb.gainDef(6); cb.drawUntil(p, 'Attack'); } },
  penitent_silence: { play: (cb, t, p) => { cb.loseHp(p, 6, 'Penitent Silence'); const e = tgtOf(cb, t); if (e) e.drawLess = (e.drawLess || 0) + 1; } },
  sealed_fate: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) { e.drawLess = (e.drawLess || 0) + 1; e.drawLessTurns = 2; } p.disarmNext = true; say(cb, 'You cannot play Attacks next turn.'); } },
  righteous_breach: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; e.block = Math.max(0, e.block - 10); D_(cb, e, 5, 'Righteous Breach'); } },
  confiscate: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = Math.min(15, e.block); e.block -= n; p.block += n; say(cb, `Took ${n} Block as Barrier.`); } },
  pierce_the_veil: { play: (cb, t, p) => { p.turn.pierce = true; say(cb, 'Your Skills ignore Block this turn.'); } },
  grace_of_the_light: { play: (cb, t, p) => { p.turn.costDelta = (p.turn.costDelta || 0) - 5; say(cb, 'Cards cost 5 less this turn.'); } },
  humble_means: { play: (cb, t, p) => { p.turn.nextCost = (p.turn.nextCost || 0) - 10; devote(cb, p, 1); } },
  offering_plate: { play: (cb, t, p) => { p.mana += 10; p.maxMana += 10; say(cb, '+10 mana and +10 maximum mana for the fight.'); } },
  righteous_claim: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) cb.stealBuff(p, e); } },
  humble_the_proud: { play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; const n = cb.removeBuffs(e, 9); D_(cb, e, 4 * n, 'Humble the Proud'); } },
  mark_of_judgment: { play: (cb, t) => { const e = D_(cb, t, 3, 'Mark of Judgment'); if (e) { e.unwarded += 10; } } },
  expose_the_profane: { play: (cb, t, p) => { const e = tgtOf(cb, t); if (e) e.unwarded += 15; cb.drawCards(p, 1); } },
  halt: { play: (cb, t, p) => { const e = D_(cb, t, 4, 'Halt'); if (e) { e.initNext = (e.initNext || 0) - 4; p.initNext += 4; } } },
};
function critBuff(cb, p) { p.crit += 25; p.critMult += 0.5; cb.timed(p, 'critBuff', 3, { end: (c, q) => { q.crit -= 25; q.critMult -= 0.5; } }); cb.say('player', '+25% crit chance and +50% crit damage for 2 turns.'); }
function devote(cb, p, n) { n += cb.pwSum(p, 'devotionPlus'); p.devotion += n; cb.say('player', `${cb.who(p)} gain${cb.partySize > 1 ? 's' : ''} ${n} Devotion (${p.devotion}): your next Holy damage gets +2 per stack.`); }
function condemn(cb, e, n) { e.condemn += n; cb.say('player', `${e.name} gains ${n} Condemnation (takes ${e.condemn}% more Holy damage).`); }
// more Powers that the systems above make possible
Object.assign(POWERS, {
  pay_in_blood: {},
  smoke_and_mirrors: {},
  cut_the_thread: { dealt: (cb, p, h, ...a) => { if (h.kind === 'Attack' && h.lost > 0 && !h.absorbed && h.e.hp > 0 && !h.e.isPlayer) { cb.eExhaust(h.e, PN(a, 0, 1)); cb.exhaustStatus(p, PN(a, 1, 1)); } } },
  shared_fatigue: { cardPlayed: (cb, p, d) => { if (d.type !== 'Skill') return; p.discard.push({ uid: 'c' + (cb._uid++), key: 'dazed' }); const e = cb._lastTarget && !cb._lastTarget.isPlayer ? cb._lastTarget : cb.foes()[0]; if (e) cb.eStatus(e, 'dazed', 1, 'discard'); } },
  silent_judgment: { turnEnd: (cb, p) => { if (!p.turnAttacks) { const e = cb.foes()[0]; if (e) cb.eStatus(e, 'dazed', 1, 'discard'); } } },
  vigil: { turnStart: (cb, p) => { if (p.lastTurnAttacks === 0) devote(cb, p, 3); } },
  balanced_guard: {},
  elemental_memory: {},
  mana_shell: {},
  entropic_field: { onPlay: (cb, p, ...a) => { const x = 1 + PN(a, 0, 50) / 100; p.costX = x; const e = cb.foes()[0]; if (e) { e.costX = x; cb.planEnemy(e, true); } } },
});


// ---------------- Codexes ----------------
// A codex is a class-locked gear slot: random affixes like gear plus one fixed passive that boosts a playstyle (it never limits your cards).
// Six per class; each map's boss drops four (one per class). Passives below are level 1 (codex levels 2-5 come from higher map levels later).
const CODEXES = {
  Warrior: [['bulwark', 'Bulwark', 'Needs a one-handed weapon and a shield. Block you gain is increased by 25%, and only 20% of it fades between turns (not half). When you are hit, the attacker takes Thorns damage equal to 25% of your Block (Strength boosts it like an Attack).'], ['riposte', 'Riposte', 'Needs a two-handed weapon. Only 20% of your Parry fades between turns (not half). When an attack is fully stopped by your Parry, deal 75% of the damage it would have done back to the attacker. Strength boosts it like an Attack.'],
    ['bloodbound', 'Bloodbound', 'Bleed you apply to enemies is also applied to you. Each Attack heals you for 10% of your stored Blood Debt (and spends it).'], ['colossus', 'Colossus', 'Needs a two-handed weapon. Every 30 mana you spend on Attacks adds a Stun to the target\'s draw pile.'],
    ['sunderer', 'Sunderer', 'Your Attacks also apply 5 Vulnerable, and you deal 20% more damage to Vulnerable targets. Vulnerable is 50% more effective for you (up to +75% damage). Vulnerable on enemies wears off 10% a turn instead of half.'], ['hemorrhage', 'Hemorrhage', '+10% Crit Chance. Your crits apply Bleed equal to 30% of the damage they deal.']],
  Rogue: [['nightstalker', 'Nightstalker', 'Needs a dagger in your main hand. Attacks you play while in Stealth deal 50% more damage, have +25% crit chance and +50% crit damage.'], ['venomancer', 'Venomancer', 'Needs a weapon in each hand. Poison you apply is increased by 2.'],
    ['bloodletter', 'Bloodletter', 'Needs a weapon in each hand. Bleed you apply is increased by 50%.'], ['ninja', 'Ninja', 'Shurikens deal 4 more damage. Start each turn with a Shuriken in hand.'],
    ['saboteur', 'Saboteur', 'The first card you make an enemy discard each round also adds a Dazed to its discard pile.'], ['phantom', 'Phantom', 'Needs a weapon in each hand. Dodge you gain is increased by 20%. Every time you Dodge 20 damage, your next Attack deals 35% more damage. Stacks.']],
  Mage: [['heart_of_winter', 'Heart of Winter', 'Frost Skills that cost 20 or more deal 30% more damage. Frost damage to Chilled targets is 25% higher and has a 10% chance to Freeze them (they lose their next turn).'], ['spellstorm', 'Spellstorm', 'Each Arcane Skill you play makes your next card cost 5 less; every third one draws a card (at most 3 draws a turn).'],
    ['conflagration', 'Conflagration', 'Applying Burn to a target that is already Burning also deals that much Fire damage at once.'], ['barrier_savant', 'Barrier Savant', 'Needs a staff. Only 20% of your Barrier fades between turns (not half). Barrier you gain is increased by 25%, and cards that spend Barrier hit 25% harder.'],
    ['entropy', 'Entropy', 'Mana you drain or burn from enemies is increased by 20%. The first drain each turn also applies 3 Exposure and 5 Magic Vulnerability.'], ['archmage', 'Archmage', 'A damaging Skill of a different element from the previous one you played (this turn or earlier) deals 50% more damage.']],
  Paladin: [['bastion_of_faith', 'Bastion of Faith', 'Needs a one-handed weapon and a shield. Your damage becomes Holy and is 25% higher, and every card you play gives Block equal to 7% of your max HP.'], ['purifier', 'Purifier', 'Removing debuffs (from yourself or an enemy) deals 4 Holy damage per stack removed to an enemy.'],
    ['righteous_crusader', 'Righteous Crusader', 'An Attack makes your next Block card 45% stronger; a Block card makes your next Attack 45% stronger. Your Attacks deal bonus damage equal to 10% of your Block.'], ['sacred_flame', 'Sacred Flame', 'Holy damage also applies Burn equal to 20% of the damage dealt.'],
    ['divine_wrath', 'Divine Wrath', 'Prayer cards give 1 more Devotion. Your Holy cards spend Devotion for 3 bonus damage per stack (instead of 2). Every 5 Devotion you spend heals you for 10% of your max HP.'], ['equilibrium', 'Equilibrium', 'You cannot gain Block. Your healing is 15% stronger, and healing you do also deals that much Holy damage to an enemy.']],
  Warlock: [['soulbinder', 'Soulbinder', 'Your Shadow damage is 20% higher. 5% of the damage you deal heals every hero in the party, and your Soul Beacon heals 50% more.'], ['blightcaller', 'Blightcaller', 'Dread you apply is increased by 15%.'],
    ['shadow_knight', 'Shadow Knight', 'You get 20% more Strength from gear. Your Physical damage becomes Shadow. Your Shadow Attacks heal you for 5% of the damage they deal.'], ['demonologist', 'Demonologist', 'Your demons stay 1 turn longer.'],
    ['bloodmancer', 'Bloodmancer', 'Physical Skills deal 20% more damage. Your cards cost HP instead of mana (1 HP per 2 mana, up to as much HP as your max mana each turn). At the start of your turn your mana turns into healing (1 HP per 3 mana). Below 50% HP you heal for 5% of the damage you deal; below 20% HP, 10%.'], ['umbral_ruin', 'Umbral Ruin', '+10% crit chance. 30% of the damage your crits deal is applied again as Rot over 3 turns.']],
};
const CODEX_BY_KEY = {}; for (const [cls, list] of Object.entries(CODEXES)) for (const [key, name, text] of list) CODEX_BY_KEY[key] = { key, name, text, cls };
function makeCodex(data, rng, key, level) {
  const cx = CODEX_BY_KEY[key]; if (!cx) return null;
  const name = cx.name + ' Codex', G = data.gear;
  const fake = Object.assign({}, data, { gear: Object.assign({}, G, { bases: G.bases.concat([{ name, arch: 'Codex', label: cx.cls + ' Codex' }]) }) });
  const it = rollItem(fake, rng, name, 'Blue', level || 0);
  return Object.assign(it, { slot: 'Codex', rarity: 'Codex', codex: key, cls: cx.cls, label: cx.cls + ' Codex', passive: cx.text, rerolls: 0 });
}

// Nov 2: some codexes need a weapon setup; without it the passive is inactive (talents still work)
const CODEX_NEEDS = { riposte: 'twoH', colossus: 'twoH', bulwark: 'oneHShield', bastion_of_faith: 'oneHShield', nightstalker: 'daggerMain', phantom: 'dual', bloodletter: 'dual', venomancer: 'dual', barrier_savant: 'staff' };
const NEED_TXT = { twoH: 'a two-handed weapon', oneHShield: 'a one-handed weapon and a shield', daggerMain: 'a dagger in your main hand', dual: 'a weapon in each hand', staff: 'a staff' };
function weaponSetup(gear, data) {
  const G = (data || DATA || {}).gear || {}, bases = G.bases || [], arche = G.arche || {};
  const archOf = (it) => it && (it.arch || ((bases.find(b => b.name === it.name) || {}).arch) || '');
  const w = gear.find(g => g && g.slot === 'Weapon'), o = gear.find(g => g && g.slot === 'Off-hand'), aw = archOf(w), ao = archOf(o);
  const hands = (a, it) => ((arche[a] || {}).hands || (it && it.hands) || '');
  const isWeapon = (a) => /Axe|Sword|Dagger|Mace|Wand|Maul|Warhammer|Staff|Scythe/.test(a);
  const twoH = !!w && hands(aw, w).startsWith('2H'), oneH = !!w && !twoH && isWeapon(aw), shield = /Shield/.test(ao);
  return { twoH: twoH && !(o && isWeapon(ao)), oneHShield: oneH && shield, daggerMain: aw === 'Dagger', dual: oneH && !!o && isWeapon(ao) && hands(ao, o).startsWith('1H'), staff: /Staff/.test(aw) };
}
// a shield beside a staff only counts with Barrier Savant's 'Staff and Shield' talent (defense, row 1)
const staffShieldOk = (spec) => { const cx = (spec.gear || []).find(g => g && g.slot === 'Codex'); return !!(cx && cx.codex === 'barrier_savant' && spec.talents && spec.talents.codex === 'barrier_savant' && (spec.talents.picks || [])[0] === 1); };
function legalGear(spec, data) { let gear = spec.gear || STARTER_GEAR[spec.cls]; if (spec.cls === 'Warrior' || spec.cls === 'Paladin') { const G0 = (data || DATA || {}).gear || {}; gear = gear.filter(g => !(g && g.slot === 'Weapon' && /Staff/.test(g.arch || (((G0.bases || []).find(b => b.name === g.name) || {}).arch) || ''))); } /* Nov 2: no staffs for Warriors and Paladins */ const G = (data || DATA || {}).gear || {}; const archOf = (it) => it && (it.arch || (((G.bases || []).find(b => b.name === it.name) || {}).arch) || ''); const w = gear.find(g => g && g.slot === 'Weapon'), o = gear.find(g => g && g.slot === 'Off-hand'); if (w && o && /Staff/.test(archOf(w)) && !staffShieldOk(spec)) return gear.filter(g => g !== o); return gear; }
function codexNeed(key, gear, data) { const n = CODEX_NEEDS[key]; if (!n) return null; return weaponSetup(gear || [], data)[n] ? null : NEED_TXT[n]; }
const atkOnce = (p, key) => p.turn && p.turn[key];
Object.assign(POWERS, {
  codex_bulwark: { defMult: 1.25, hitBy: (cb, p, e, r) => { const n = Math.round(((p.block || 0) + (r.absorbed || 0)) * 0.25 * (1 + (p.strength + p.strTurn + p.strCombat) / 100)); if (n > 0 && e.hp > 0) { cb.applyHit(p, e, n, { label: 'Bulwark Thorns' }); cb.say('player', `Bulwark: ${e.name} takes ${n} Thorns damage.`); if (e.hp <= 0) cb.onDeath(e); } } }, // Nov 2: 25% of Block as Thorns
  codex_riposte: { hitBy: (cb, p, e, r) => { if (r.lost === 0 && r.absorbed > 0 && e.hp > 0) { const n = Math.round(r.absorbed * 0.75 * (1 + (p.strength + p.strTurn + p.strCombat) / 100)); cb.applyHit(p, e, n, { label: 'Riposte Codex' }); cb.say('player', `Riposte: ${e.name} takes ${n} back.`); if (e.hp <= 0) cb.onDeath(e); } } },
  codex_bloodbound: { applyDot: (cb, p, e, key, v) => { if (key === 'bleed' && !e.isPlayer) { p.bleed += v; cb.say('player', `Bloodbound: ${p.name} also gains ${v} Bleed.`); } },
    cardPlayed: (cb, p, d) => { if (d.type === 'Attack' && p.bloodDebt > 0) { const n = Math.max(1, Math.round(p.bloodDebt * 0.1)); p.bloodDebt -= n; cb.heal(p, n, 'Bloodbound'); } } },
  codex_colossus: { cardPlayed: (cb, p, d, pw) => { if (d.type !== 'Attack') return; pw.spent = (pw.spent || 0) + (cb._paid || 0); while (pw.spent >= 30) { pw.spent -= 30; const e = cb._lastTarget && cb._lastTarget.hp > 0 ? cb._lastTarget : cb.alive()[0]; if (e) cb.eStatus(e, 'stun', 1); } } },
  codex_sunderer: { vulnX: 1.5, hitMult: (cb, p, e) => e && e.vulnerable > 0 ? 1.2 : 1, dealt: (cb, p, h) => { if (h.kind === 'Attack' && h.e.hp > 0) h.e.vulnerable += 5; } }, // Nov 3: 3 -> 5 Vulnerable, +10% vs Vulnerable
  codex_hemorrhage: { crit: () => 10, dealt: (cb, p, h) => { if (h.crit && h.e.hp > 0 && h.lost + h.absorbed > 0) { const n = Math.max(1, Math.round((h.lost + h.absorbed) * 0.3)); h.e.bleed += n; h.e.bleedBy = p.id; cb.say('crit', `Hemorrhage: ${h.e.name} gains ${n} Bleed.`); } } },
  codex_nightstalker: { cardMult: (cb, p, d) => d.type === 'Attack' && p.stealth ? 1.5 : 1, crit: (cb, p, d) => d && d.type === 'Attack' && p.stealth ? 25 : 0, critMultX: (cb, p) => p.stealth ? 1.5 : 1 },
  codex_venomancer: { dotPlus: { poison: 2 } },
  codex_bloodletter: { dotMult: { bleed: 1.5 } },
  codex_ninja: { shurikenPlus: 4, turnStart: (cb, p) => { if (!p.hand.some(c => c.key === 'shuriken')) cb.addToHand('shuriken'); } },
  codex_saboteur: {},
  codex_phantom: { defMult: 1.2, hitBy: (cb, p, e, r, pw) => { pw.acc = (pw.acc || 0) + r.absorbed; while (pw.acc >= 20) { pw.acc -= 20; pw.stacks = (pw.stacks || 0) + 1; } }, cardMult: (cb, p, d, pw) => { if (d.type === 'Attack' && pw.stacks) { const m = 1 + 0.35 * pw.stacks; cb.say('player', `Phantom: +${pw.stacks * 35}% on this Attack.`); pw.stacks = 0; return m; } return 1; } },
  codex_heart_of_winter: { hitMult: (cb, p, e, c) => (c.kind === 'Skill' && c.dtype === 'Frost' && c.d && (c.d.cost || 0) >= 20 ? 1.3 : 1) * (c.dtype === 'Frost' && e && e.chill > 0 ? 1.25 : 1),
    dealt: (cb, p, h) => { if (h.dtype === 'Frost' && h.e && !h.e.isPlayer && h.e.hp > 0 && h.e.chill > 0 && !h.e.frozen && cb.rng() < 0.1) { h.e.frozen = true; cb.say('crit', `Heart of Winter: ${h.e.name} is Frozen and will lose its next turn!`); } } },
  codex_spellstorm: { cardPlayed: (cb, p, d, pw) => { if (d.type === 'Skill' && d.dtype === 'Arcane') { p.turn.nextCost = (p.turn.nextCost || 0) - 5; pw.n = (pw.n || 0) + 1; if (pw.dr !== cb.round) { pw.dr = cb.round; pw.dn = 0; } if (pw.n % 3 === 0 && pw.dn < 3) { pw.dn++; cb.say('player', 'Spellstorm: draw 1.'); cb.drawCards(p, 1); } } } },
  codex_conflagration: { applyDot: (cb, p, e, key, v, before) => { if (key === 'burn' && before > 0 && e.hp > 0) cb.powerHit(p, e, v, 'Conflagration', 'Fire', 'Skill'); } },
  codex_barrier_savant: { defMult: 1.25, spendMult: 1.25 },
  codex_entropy: { drainMult: 1.2 }, // Nov 3: +50% -> +20%
  codex_archmage: { cardMult: (cb, p, d) => d.type === 'Skill' && d.tags.dmg && d.dtype && (p.lastElems || []).length && p.lastElems[0] !== d.dtype ? 1.5 : 1,
    cardPlayed: (cb, p, d) => { if (d.type === 'Skill' && d.tags.dmg && d.dtype) p.lastElems = [d.dtype]; } }, // Nov 3: only the previous spell counts
  codex_bastion_of_faith: { dtype: { Physical: 'Holy' }, hitMult: () => 1.25, cardPlayed: (cb, p, d) => { cb.gainDef(Math.max(1, Math.round(p.maxHp * 0.07))); } }, // Nov 5: every card played gives 7% of max HP as Block (was 8 per damaging card)
  codex_bastion_of_faith_off: {},
  codex_off: {}, // a codex without the weapons it needs
  codex_purifier: { onCleanse: (cb, p, n) => { const e = cb.foes()[0] || cb.alive()[0]; if (n > 0 && e) cb.powerHit(p, e, 4 * n, 'Purifier', 'Holy', 'Skill'); } },
  codex_righteous_crusader: { flat: (cb, p, d) => d && d.type === 'Attack' ? Math.round((p.block || 0) * 0.1) : 0, cardMult: (cb, p, d, pw) => { if (d.type === 'Attack' && pw.atkUp) { pw.atkUp = false; return 1.45; } return 1; },
    cardPlayed: (cb, p, d, pw) => { if (d.type === 'Attack') pw.defUp = true; else if (d.tags && d.tags.def) pw.atkUp = true; }, defMultFn: (cb, p, pw) => { if (pw.defUp && cb._playing && !cb._playing.isPower && cb._playing.type !== 'Attack') { pw.defUp = false; return 1.45; } return 1; } },
  codex_sacred_flame: { dealt: (cb, p, h) => { if (h.dtype === 'Holy' && h.lost > 0 && h.e.hp > 0) { const n = Math.max(1, Math.round(h.lost * 0.2)); h.e.burn += n; h.e.burnBy = p.id; } } },
  codex_divine_wrath: { devotionPlus: 1 },
  codex_soulbinder: { beaconX: 1.5, hitMult: (cb, p, e, c) => c.dtype === 'Shadow' ? 1.2 : 1, dealt: (cb, p, h, pw) => { if (!(h.lost > 0)) return; pw.acc = (pw.acc || 0) + h.lost * 0.05; const n = Math.floor(pw.acc); if (n > 0) { pw.acc -= n; for (const a of cb.allies()) cb.heal(a, n, 'Soulbinder', true); } } },
  // (dotDealt: the same 5% party heal from damage-over-time ticks, see Combat.dotHeal)
  codex_blightcaller: { dotMult: { dread: 1.15 } },
  codex_shadow_knight: { dtype: { Physical: 'Shadow' }, dealt: (cb, p, h) => { if (h.kind === 'Attack' && h.dtype === 'Shadow' && h.lost > 0) { const n = Math.round(h.lost * 0.05); if (n > 0) cb.heal(p, n, 'Lifesteal', true); } } },
  codex_demonologist: { demonTurns: 1 },
  codex_bloodmancer: { bloodPay: true, bloodToMax: true, hitMult: (cb, p, e, c) => c.kind === 'Skill' && c.dtype === 'Physical' ? 1.2 : 1,
    dealt: (cb, p, h, pw) => { if (!(h.lost > 0) || !p.isPlayer || p.hp <= 0) return; const f = p.hp / p.maxHp, pct = f < 0.2 ? 0.1 : f < 0.5 ? 0.05 : 0; if (!pct) return; pw.ls = (pw.ls || 0) + h.lost * pct; const n = Math.floor(pw.ls); if (n > 0) { pw.ls -= n; cb.heal(p, n, 'Lifesteal', true); } } }, // Nov 3: lifesteal grows as HP drops
  codex_umbral_ruin: { crit: () => 10, dealt: (cb, p, h) => { if (h.crit && h.e.hp > 0 && h.lost + h.absorbed > 0) { const n = Math.max(1, Math.round((h.lost + h.absorbed) * 0.3)); cb.addRot(h.e, n, 3, p); cb.say('crit', `Umbral Ruin: ${h.e.name} gains ${n} Rot over 3 turns.`); } } },
  codex_equilibrium: { defMult: 0, healMult: 1.15, onHeal: (cb, p, a, h) => { const e = cb.foes()[0] || cb.alive()[0]; if (e && h > 0 && !cb._eqHit) { cb._eqHit = true; cb.powerHit(p, e, h, 'Equilibrium', 'Holy', 'Skill'); cb._eqHit = false; } } },
});

// ---------------- Generated cards (design/scripts/gen_cards.py from the Card Database) ----------------
// Hand-written cards above keep their code and just get their Card ID. Every other designed card is added: with ops the engine
// can run (playable, can drop), or as design-only (shown in the Codex, never dropped, can't be played).
const GEN = (typeof module !== 'undefined' && module.exports) ? require('./cards_gen.js') : (root.CB_CARDS_GEN || []);
const GEN_SEC = {}; for (const g of GEN) if (g.ops && g.type === 'Skill') { const sec = g.ops.filter(o => ['dot', 'chill', 'debuff'].includes(o.op)).map(o => o.op === 'chill' ? ['chill', o.n] : [o.op, o.key, o.n]); if (sec.length) GEN_SEC[g.name] = sec; }
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
function genTags(ops) {
  const t = {}; for (const o of ops) {
    if (o.op === 'dmg' && !t.dmg) { t.dmg = o.n; if (o.all) t.aoe = 1; if (o.times > 1) t.hits = o.times; }
    if (o.op === 'def') t.def = (t.def || 0) + o.n; if (o.op === 'heal' || o.op === 'healAlly') t.heal = o.n; if (o.op === 'draw') t.draw = o.n;
    if (o.op === 'nextAttack') t.setup = 'attack'; if (o.op === 'nextSkill') t.setup = 'skill'; if (o.op === 'str') t.setup = 'str';
  } return t;
}
for (const g of GEN) {
  const have = Object.values(C).find(c => c.name === g.name && c.cls === g.cls);
  if (have) { have.id = g.id; continue; }
  let key = slug(g.name); if (C[key]) key += '_' + g.cls.slice(0, 3).toLowerCase();
  const isPower = g.type === 'Power', pk = slug(g.name);
  if (isPower) {
    const ok = !!(POWERS[pk] || g.ops);
    card(key, { id: g.id, cls: g.cls, name: g.name, rarity: g.rarity, type: 'Power', cost: g.cost, target: 'self', text: g.text, exhaust: true, designOnly: !ok, powerKey: pk,
      play: ok ? (cb, t) => { if (g.ops) runOps(cb, t, g.ops, g.name); cb.addPower(cb.player, pk, g.name, g.text); } : null, tags: { power: 1 } });
    continue;
  }
  const cu = CUSTOM[pk];
  if (cu) {
    const m = g.text.match(/[Dd]eal (\d+)/), b = g.text.match(/[Gg]ain (\d+) (?:Block|Parry|Dodge|Barrier)/), h = g.text.match(/[Hh]eal (?:you(?:rself)?(?: and all allies)? )?(?:for )?(\d+) HP/);
    const tags = {}; if (m) tags.dmg = +m[1]; if (b) tags.def = +b[1]; if (h) tags.heal = +h[1]; if (g.target === 'all') tags.aoe = 1;
    card(key, { id: g.id, cls: g.cls, name: g.name, rarity: g.rarity, type: g.type, cost: g.cost, target: g.target, dtype: g.dtype || (g.type === 'Attack' ? 'Physical' : undefined),
      text: g.text, exhaust: !!g.exhaust, retain: !!cu.retain || /\bRetain\./.test(g.text), endInHand: cu.endInHand || null, devotionPer: cu.devotionPer, custom: true,
      play: (cb, t) => cu.play(cb, t, cb.player), tags });
    continue;
  }
  const playable = !!g.ops, onDraw = playable && g.ops.find(o => o.op === 'onDraw');
  const unplayable = playable && g.ops.some(o => o.op === 'unplayable');
  card(key, { id: g.id, cls: g.cls, name: g.name, rarity: g.rarity, type: g.type === 'Power' ? 'Power' : g.type, cost: unplayable ? null : g.cost, target: g.target, dtype: g.dtype || (g.type === 'Attack' ? 'Physical' : undefined),
    text: g.text, exhaust: !!g.exhaust, retain: playable && g.ops.some(o => o.op === 'retain'), designOnly: !playable, onDraw: onDraw ? onDraw.ops : null,
    play: playable ? (cb, t) => runOps(cb, t, g.ops, g.name) : null, tags: playable ? genTags(g.ops) : {} });
  if (playable) GEN_OPS[key] = g.ops;
}
// ---------------- Warlock (Nov 1): the fifth class. Cards and Powers live in src/warlock.js
const WARLOCK = (typeof module !== 'undefined' && module.exports) ? require('./warlock.js') : root.CB_WARLOCK;
const BLOOD_CAP = 15; // Bloodmancer: HP you can pay for cards in one turn
const DEMONS = {}; // filled by src/warlock.js: key -> { name, hp (% of the owner's max HP), act(cb, owner, demon, target, scale), taunt?, pick?, depart? }
if (WARLOCK) WARLOCK.install({ card, C, POWERS, DEMONS, tgtOf, D_, DA, say, PN });
// run a generated card's effects; t = the chosen enemy (or null)
function runOps(cb, t, ops, label) {
  const p = cb.player;
  const targets = (o) => o.all ? cb.alive() : [t && t.hp > 0 ? t : cb.alive().find(x => !x.stealth)].filter(Boolean);
  for (const o of ops) {
    if (cb.over) break;
    switch (o.op) {
      case 'dmg': for (let k = 0; k < (o.times || 1) && !cb.over; k++) for (const e of targets(o)) { cb.hit(e, o.n, label); if (o.perHit && e.hp > 0 && !cb.over) cb.applyDot(e, o.perHit.key, o.perHit.n); } break;
      case 'dot': for (const e of targets(o)) cb.applyDot(e, o.key, o.n); break;
      case 'debuff': for (const e of targets(o)) { e[o.key] = (e[o.key] || 0) + o.n; cb.say('player', `${e.name} gains ${o.n} ${o.key[0].toUpperCase() + o.key.slice(1)} (now ${e[o.key]}).`); } break;
      case 'chill': for (const e of targets(o)) cb.applyChill(e, o.n); break;
      case 'def': cb.gainDef(o.n); break;
      case 'heal': for (const a of o.party ? cb.allies() : [p]) cb.heal(a, o.n, label); break;
      case 'healAlly': { const a = cb.allies().slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]; if (a) cb.heal(a, o.n, label); break; }
      case 'draw': cb.drawCards(p, o.n); break;
      case 'mana': p.mana += o.n; cb.say('player', `+${o.n} mana (${p.mana}).`); break;
      case 'manaNext': p.manaNext += o.n; cb.say('player', `+${o.n} mana next turn.`); break;
      case 'drawNext': p.drawNext = (p.drawNext || 0) + o.n; cb.say('player', `Draw ${o.n} more next round.`); break;
      case 'str': if (o.combat) p.strCombat += o.n; else p.strTurn += o.n; cb.say('player', `+${o.n} Strength ${o.combat ? 'for the fight' : 'this turn'}.`); break;
      case 'regen': p.regen += o.n; cb.say('player', `+${o.n} mana regeneration for the fight.`); break;
      case 'maxMana': p.maxMana += o.n; cb.say('player', `+${o.n} maximum mana for the fight.`); break;
      case 'loseHp': cb.loseHp(p, o.n, label); break;
      case 'stealth': p.stealth = true; cb.say('player', `${cb.who(p)} slip${cb.partySize > 1 ? 's' : ''} into Stealth.`); break;
      case 'addCard': for (let k = 0; k < o.n; k++) cb.addToHand(o.key); break;
      case 'selfStatus': for (let k = 0; k < o.n; k++) { const sc = { uid: 'c' + (cb._uid++), key: o.key }; if (o.pile === 'discard') p.discard.push(sc); else p.drawPile.splice(Math.floor(cb.rng() * (p.drawPile.length + 1)), 0, sc); } break;
      case 'burnMana': case 'stealMana': for (const e of targets(o)) { const s = cb.drainMana(e, o.n); if (o.op === 'stealMana') p.mana += s; cb.say('player', `${e.name} loses ${s} mana${o.op === 'stealMana' ? ' to you' : ''}.`); } break;
      case 'regenDown': for (const e of targets(o)) { (e.regenDown = e.regenDown || []).push({ n: o.n, turns: o.turns }); cb.say('player', `${e.name}'s mana regen drops by ${o.n} for ${o.turns} turns.`); } break;
      case 'nextAttack': p.nextAttackMult = o.mult; cb.say('player', 'Your next Attack deals double damage.'); break;
      case 'nextSkill': p.nextSkillMult = o.mult; cb.say('player', `Your next damaging Skill deals ${Math.round((o.mult - 1) * 100)}% more damage.`); break;
      case 'init': p.initNext = o.n; break;
      case 'negate': p.negateDebuff = true; cb.say('player', 'The next debuff on you is negated.'); break;
      case 'cleanse': cb.cleanse(p, o.n); break;
      case 'cleanseDot': for (const k of o.keys) p[k] = 0; cb.say('player', `${o.keys.join(', ')} removed.`); break;
      case 'allyDef': for (const a of cb.allies().filter(x => x !== p)) { cb.player = a; cb.gainDef(o.n); } cb.player = p; break;
      case 'cycle': { const n = p.hand.length; p.discard.push(...p.hand.splice(0)); cb.drawCards(p, n + o.plus); break; }
    }
  }
}

const CLASSES = {
  Warrior: { defense: 'Block', blurb: 'Sword and shield. Hits, blocks, and gets stronger after taking a hit (Battle Fever).', deck: [['battle_fever', 1], ['execute', 1], ['shield_wall', 1], ['bloodthirst', 1], ['shield_up', 1], ['whirlwind', 1], ['battle_shout', 1], ['defend', 3], ['pommel_strike', 1], ['shield_bash', 2], ['strike', 7]] },
  Rogue: { defense: 'Dodge', blurb: 'Quick hits, Dodge, Bleed and Poison. Hide skips an enemy\'s single-target attacks.', deck: [['assassinate', 1], ['coup_de_grace', 1], ['evasion', 1], ['blur', 1], ['garrote', 1], ['hide', 1], ['envenom', 1], ['evade', 5], ['slip_away', 1], ['stab', 5], ['throwing_stars', 1], ['twin_daggers', 1]] },
  Mage: { defense: 'Barrier', blurb: 'Fire, Frost and Arcane spells with Barrier. Exploits enemy weaknesses (Arcane vs humans, Fire vs beasts).', deck: [['amplify', 1], ['prismatic_barrier', 1], ['pyroblast', 1], ['arcane_barrage', 1], ['blizzard', 1], ['ice_barrier', 1], ['arcane_missiles', 2], ['fireball', 3], ['frostbolt', 2], ['ice_bolt', 1], ['mana_spring', 1], ['ward', 5]] },
  Paladin: { defense: 'Block', blurb: 'Holy warrior: Block, Holy damage that ignores resistance, and heals.', deck: [['lay_on_hands', 1], ['ardent_defense', 1], ['holy_nova', 1], ['divine_shield', 1], ['divine_storm', 1], ['healing_light', 1], ['crusader_strike', 6], ['raise_shield', 2], ['righteous_blow', 2], ['sacred_ward', 1], ['smite', 3]] },
  Warlock: { defense: 'Absorb', blurb: 'Shadow caster: Dread and Rot, curses, demons and Absorb (overhealing a Warlock becomes Absorb).', deck: [['soul_beacon', 1], ['shadow_armor', 1], ['soul_shroud', 1], ['shadow_volley', 1], ['curse_of_frailty', 1], ['drain_life', 1], ['summon_gloom_imp', 1], ['shadow_bolt', 5], ['dark_ward', 4], ['dread_touch', 2], ['rotting_grasp', 1], ['siphon_soul', 1]] },
};
const boost = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, /Crit Chance|Resistance/.test(k) ? v : Math.round(v * 4 / 3)])); // Nov 3: starter gear is a third stronger
const it = (slot, base, stats, imp2) => ({ slot, name: base, rarity: 'White', ilvl: 1, stats: Object.assign({ 'Resistance:Fire': 3 }, boost(stats)), imp2: imp2 || {}, r2: 1, r3: 1, r4: 1 }); // starter gear keeps Fire (it isn't Map 1 loot; Physical here would make Map 1 trivial)
const STARTER_GEAR = {
  Warrior: [it('Weapon', 'Arming Sword', { Strength: 3 }, { 'Multi-hit Chance': 3 }), it('Off-hand', 'Kite Shield', { Dexterity: 3 }, { Thorns: 2 }), it('Helm', 'Warband Helm', { Stamina: 6 }), it('Shoulders', 'Warband Pauldrons', { Stamina: 4 }),
    it('Amulet', "Soldier's Pendant", { Strength: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Brigandine', { 'Crit Chance': 1 }),
    it('Bracers', 'Iron Bracers', { 'Crit Damage': 6 }), it('Gloves', 'Leather Gauntlets', { 'Crit Chance': 1 }), it('Belt', 'War Belt', { Stamina: 6 }), it('Pants', 'Legguards', { Stamina: 6 }),
    it('Boots', 'March Boots', { Dexterity: 3 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Stamina: 6 }), it('Ring 2', "Soldier's Signet", { Luck: 3 })],
  Rogue: [it('Weapon', 'Dirk', { Strength: 3 }, { 'Crit Damage': 6 }), it('Off-hand', 'Dirk', { 'Crit Chance': 1 }, { 'Crit Damage': 6 }), it('Helm', "Scout's Cap", { Strength: 3 }), it('Shoulders', "Scout's Spaulders", { Dexterity: 2 }),
    it('Amulet', "Soldier's Pendant", { Strength: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Brigandine', { 'Crit Chance': 1 }),
    it('Bracers', "Archer's Bracers", { 'Crit Damage': 6 }), it('Gloves', 'Leather Gauntlets', { 'Crit Chance': 1 }), it('Belt', 'War Belt', { Stamina: 6 }), it('Pants', 'Riding Breeches', { Dexterity: 3 }),
    it('Boots', 'March Boots', { Stamina: 6 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Stamina: 6 }), it('Ring 2', "Soldier's Signet", { Luck: 3 })],
  Mage: [it('Weapon', 'Ashwood Wand', { Intelligence: 3 }, { 'Elemental/Holy Damage:Fire': 6 }), it('Off-hand', 'Battle Focus', { Dexterity: 3 }, { 'Elemental/Holy Damage:Frost': 6 }), it('Helm', 'Hedge-Mage Hood', { Intelligence: 3 }), it('Shoulders', 'Hedge-Mage Mantle', { Spirit: 2 }),
    it('Amulet', "Soldier's Pendant", { Intelligence: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Camp Robe', { Spirit: 3 }),
    it('Bracers', 'Linen Wraps', { Intelligence: 3 }), it('Gloves', "Scribe's Handwraps", { 'Crit Chance': 1 }), it('Belt', "Officer's Sash", { Stamina: 6 }), it('Pants', 'Quilted Leggings', { Stamina: 6 }),
    it('Boots', 'Pilgrim Slippers', { Dexterity: 3 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Stamina: 6 }), it('Ring 2', "Soldier's Signet", { 'Max Mana': 15 })],
  Paladin: [it('Weapon', 'Flanged Mace', { Strength: 3 }, { 'Elemental/Holy Damage:Holy': 6 }), it('Off-hand', 'Pavise', { Dexterity: 3 }, { 'Defense Gain': 6 }), it('Helm', 'Warband Helm', { Stamina: 6 }), it('Shoulders', 'Warband Pauldrons', { Stamina: 4 }),
    it('Amulet', "Soldier's Pendant", { Strength: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Iron Cuirass', { Stamina: 6 }),
    it('Bracers', 'Iron Bracers', { Strength: 3 }), it('Gloves', 'Iron Gauntlets', { 'Crit Chance': 1 }), it('Belt', 'War Girdle', { Stamina: 6 }), it('Pants', 'Legguards', { Dexterity: 3 }),
    it('Boots', 'Iron Sabatons', { Stamina: 6 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Intelligence: 3 }), it('Ring 2', "Soldier's Signet", { Spirit: 3 })],
  Warlock: [it('Weapon', 'Ashwood Wand', { Intelligence: 3 }, { 'Elemental/Holy Damage:Shadow': 6 }), it('Off-hand', 'Battle Focus', { Spirit: 3 }, { 'Elemental/Holy Damage:Shadow': 6 }), it('Helm', 'Hedge-Mage Hood', { Intelligence: 3 }), it('Shoulders', 'Hedge-Mage Mantle', { Spirit: 2 }),
    it('Amulet', "Soldier's Pendant", { Intelligence: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Camp Robe', { Stamina: 6 }),
    it('Bracers', 'Linen Wraps', { Intelligence: 3 }), it('Gloves', "Scribe's Handwraps", { 'Crit Chance': 1 }), it('Belt', "Officer's Sash", { Stamina: 6 }), it('Pants', 'Quilted Leggings', { Stamina: 6 }),
    it('Boots', 'Pilgrim Slippers', { Dexterity: 3 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Stamina: 6 }), it('Ring 2', "Soldier's Signet", { Spirit: 3 })],
};

// Nov 3: each starting playstyle swaps two starter pieces for Greens that help that style get going (no affix lines, so they can't be rerolled)
const gk = (slot, base, stats, imp2) => ({ slot, name: base, rarity: 'Green', ilvl: 1, stats: Object.assign({ 'Resistance:Fire': 3 }, stats), imp2: imp2 || {}, r2: 1, r3: 1, r4: 1, label: 'Starter kit' });
const STARTER_KITS = {
  Warrior: {
    balanced: [gk('Chest', 'Brigandine', { Stamina: 12, Strength: 4 }), gk('Gloves', 'Leather Gauntlets', { Strength: 6, 'Crit Chance': 2 })],
    berserker: [gk('Pants', 'Legguards', { Stamina: 18, Strength: 3 }), gk('Chest', 'Brigandine', { 'Max Mana': 25, Strength: 4 })],
    bleeder: [gk('Gloves', 'Leather Gauntlets', { Strength: 6, 'Crit Chance': 3 }), gk('Pants', 'Legguards', { Stamina: 16 })],
    shieldbearer: [gk('Off-hand', 'Kite Shield', { Dexterity: 4, Stamina: 6 }, { Thorns: 8, 'Defense Gain': 8 }), gk('Chest', 'Brigandine', { Stamina: 16 })],
  },
  Rogue: {
    balanced: [gk('Weapon', 'Dirk', { Strength: 6 }, { 'Crit Damage': 12 }), gk('Chest', 'Brigandine', { Stamina: 14 })],
    assassin: [gk('Weapon', 'Dirk', { Strength: 5, 'Crit Chance': 3 }, { 'Crit Damage': 15 }), gk('Gloves', 'Leather Gauntlets', { 'Crit Chance': 3, Stamina: 6 })],
    poisoner: [gk('Helm', "Scout's Cap", { Strength: 7, Stamina: 6 }), gk('Pants', 'Riding Breeches', { Stamina: 14, Dexterity: 3 })],
    starthrower: [gk('Gloves', 'Leather Gauntlets', { Strength: 6, 'Crit Chance': 2 }), gk('Chest', 'Brigandine', { Stamina: 14 })],
  },
  Mage: {
    balanced: [gk('Chest', 'Camp Robe', { 'Max Mana': 25, Intelligence: 4 }), gk('Pants', 'Quilted Leggings', { Stamina: 16 })],
    pyromancer: [gk('Weapon', 'Ashwood Wand', { Intelligence: 6 }, { 'Elemental/Holy Damage:Fire': 12 }), gk('Pants', 'Quilted Leggings', { Stamina: 16 })],
    cryomancer: [gk('Chest', 'Camp Robe', { 'Max Mana': 30, Intelligence: 4 }), gk('Off-hand', 'Battle Focus', { Intelligence: 5 }, { 'Elemental/Holy Damage:Frost': 12 })],
    arcanist: [gk('Chest', 'Camp Robe', { 'Max Mana': 25, Intelligence: 4 }), gk('Helm', 'Hedge-Mage Hood', { Intelligence: 6, Stamina: 8 })],
  },
  Paladin: {
    balanced: [gk('Weapon', 'Flanged Mace', { Strength: 5 }, { 'Elemental/Holy Damage:Holy': 12 }), gk('Chest', 'Iron Cuirass', { Stamina: 16 })],
    templar: [gk('Weapon', 'Flanged Mace', { Strength: 6 }, { 'Elemental/Holy Damage:Holy': 12 }), gk('Chest', 'Iron Cuirass', { Stamina: 14, 'Max Mana': 10 })],
    guardian: [gk('Off-hand', 'Pavise', { Dexterity: 4, Stamina: 6 }, { 'Defense Gain': 12, Thorns: 6 }), gk('Chest', 'Iron Cuirass', { Stamina: 16 })],
    lightbringer: [gk('Weapon', 'Flanged Mace', { Intelligence: 5, Spirit: 4 }, { 'Elemental/Holy Damage:Holy': 12 }), gk('Chest', 'Iron Cuirass', { Stamina: 12, 'Max Mana': 15 })],
  },
  Warlock: {
    balanced: [gk('Weapon', 'Ashwood Wand', { Intelligence: 6 }, { 'Elemental/Holy Damage:Shadow': 12 }), gk('Chest', 'Camp Robe', { Stamina: 16 })],
    soulbinder: [gk('Off-hand', 'Battle Focus', { Spirit: 6 }, { 'Elemental/Holy Damage:Shadow': 12 }), gk('Chest', 'Camp Robe', { Stamina: 16 })],
    demonologist: [gk('Weapon', 'Ashwood Wand', { Intelligence: 6 }, { 'Elemental/Holy Damage:Shadow': 12 }), gk('Chest', 'Camp Robe', { Stamina: 14, 'Max Mana': 10 })],
    shadowknight: [gk('Bracers', 'Linen Wraps', { Strength: 6, Stamina: 6 }), gk('Chest', 'Camp Robe', { Stamina: 16 })],
  },
};

// Gear presets for testing progression: the starter set's stats scaled to the average Green or Blue item (more affixes, higher rolls).
function presetGear(cls, rarity) {
  const scale = { White: 1, Green: 2.2, Blue: 3.6 }[rarity] || 1, imp = { White: 1, Green: 1.1, Blue: 1.2 }[rarity] || 1;
  return STARTER_GEAR[cls].map(x => ({ slot: x.slot, name: x.name, rarity, ilvl: 1, r2: 1, r3: 1, r4: 1, stats: Object.fromEntries(Object.entries(x.stats).map(([k, v]) => [k, Math.round(v * scale)])),
    imp2: Object.fromEntries(Object.entries(x.imp2).map(([k, v]) => [k, k === 'Draw' ? 4 : k === 'Regen' ? { White: 20, Green: 30, Blue: 40 }[rarity] : Math.round(v * imp)])) }));
}
const FEAR_RESIST = 0.25, FEAR_RESIST_BOSS = 0.5, FEAR_BREAK = 0.75, FEAR_BREAK_DOT = 0.1;
const BASE = { hp: 100, maxMana: 20, regen: 15, draw: 1, init: 10, critMult: 1.5 };
// ---------- starting choices (Oct 31): pick a playstyle deck and a draw/regen amulet when you create a hero
// every starter: 1 Gold, 2 Blue, 3 Green, 14 White (20 cards), like the original Balanced decks
const STARTER_DECKS = {
  Warrior: [
    ['balanced', 'Balanced', 'A bit of everything: Strikes, Block and a few big swings.', null],
    ['berserker', 'Berserker', 'Big hits and Strength. Hurt yourself to hit harder.', [['battle_fever', 1], ['bully', 1], ['mortal_strike', 1], ['overpower', 1], ['bloodlust', 1], ['bloodthirst', 1], ['heavy_swing', 3], ['reckless_swing', 3], ['strike', 4], ['battle_shout', 1], ['defend', 3]]],
    ['bleeder', 'Bleeder', 'Stack Bleed with fast hits, then cash it in.', [['hemorrhagic_strike', 1], ['scent_of_blood', 1], ['rampage', 1], ['deep_cuts', 1], ['crimson_whirl', 1], ['sever', 1], ['rend', 4], ['lacerate', 3], ['flurry_of_blows', 3], ['defend', 3], ['strike', 1]]],
    ['shieldbearer', 'Shieldbearer', 'Build a wall of Block and hit with it.', [['crushing_bastion', 1], ['shield_wall', 1], ['fortify', 1], ['shield_slam', 1], ['shield_up', 1], ['unflinching', 1], ['defend', 4], ['shield_bash', 3], ['shield_strike', 3], ['brace', 2], ['strike', 2]]],
  ],
  Rogue: [
    ['balanced', 'Balanced', 'Stabs, Dodge and a taste of Stealth, Bleed and Poison.', null],
    ['assassin', 'Assassin', 'Slip into Stealth and strike for double damage.', [['assassinate', 1], ['eviscerate', 1], ['shadow_dance', 1], ['ambush', 1], ['hide', 1], ['shadow_cloak', 1], ['backstab', 4], ['stab', 4], ['evade', 4], ['cheap_shot', 2]]],
    ['poisoner', 'Poisoner', 'Stack Poison (scales with Strength) and let it work.', [['plague_bloom', 1], ['deadly_toxin', 1], ['virulence', 1], ['crippling_poison', 1], ['fester', 1], ['toxic_cloud', 1], ['envenom', 4], ['poisoned_blade', 4], ['evade', 4], ['stab', 2]]],
    ['starthrower', 'Star Thrower', 'Bury them in Shurikens: make lots of free throwing stars and make each one hit harder.', [['shuriken_storm', 1], ['storm_of_steel', 1], ['shuriken_mastery', 1], ['hidden_pockets', 1], ['shuriken_volley', 2], ['throwing_stars', 8], ['evade', 4], ['twin_daggers', 2]]],
  ],
  Mage: [
    ['balanced', 'Balanced', 'Fire, Frost and Arcane with Barrier to stay safe.', null],
    ['pyromancer', 'Pyromancer', 'Fire spells and Burn that keeps ticking.', [['fan_the_flames', 1], ['pyroblast', 1], ['meteor', 1], ['ignite', 1], ['combust', 1], ['flamestrike', 1], ['fireball', 4], ['scorch', 3], ['ember', 2], ['ward', 4], ['mana_spring', 1]]],
    ['cryomancer', 'Cryomancer', 'Chill and Freeze enemies, then shatter them.', [['amplify', 1], ['glacial_spike', 1], ['cone_of_cold', 1], ['blizzard', 1], ['ice_barrier', 1], ['flash_freeze', 1], ['ice_bolt', 3], ['frostbolt', 3], ['ice_lance', 3], ['frost_armor', 3], ['frost_nova', 2]]],
    ['arcanist', 'Arcanist', 'Chain cheap Arcane spells and draw more cards.', [['arcane_cascade', 1], ['arcane_blast', 1], ['presence_of_mind', 1], ['arcane_barrage', 1], ['arcane_flow', 1], ['echoing_rune', 1], ['spark', 4], ['arcane_missiles', 4], ['arcane_bolt', 2], ['ward', 4]]],
  ],
  Paladin: [
    ['balanced', 'Balanced', 'Crusader Strikes, Block, Holy damage and some healing.', null],
    ['templar', 'Templar', 'Holy damage that ignores resistance, plus Burn.', [['twin_verdict', 1], ['final_verdict', 1], ['consecrated_ground', 1], ['holy_fire', 1], ['divine_storm', 1], ['hammer_of_wrath', 1], ['smite', 4], ['searing_light', 3], ['crusader_strike', 3], ['sacred_ward', 3], ['condemn', 1]]],
    ['guardian', 'Guardian', 'Big Block, shield bashes and Stuns.', [['unbreakable_faith', 1], ['ardent_defense', 1], ['hammer_of_justice', 1], ['shield_of_righteousness', 1], ['divine_shield', 1], ['tempered_zeal', 1], ['raise_shield', 4], ['righteous_blow', 4], ['sword_and_board', 3], ['guarded_advance', 2], ['steadfast', 1]]],
    ['lightbringer', 'Lightbringer', 'Heal yourself and your party while you fight.', [['lay_on_hands', 1], ['holy_nova', 1], ['prayer_of_healing', 1], ['healing_light', 1], ['overflowing_light', 1], ['mending_prayer', 1], ['smite', 3], ['mend_wounds', 3], ['soothing_light', 2], ['crusader_strike', 3], ['sacred_ward', 3]]],
  ],
  Warlock: [
    ['balanced', 'Balanced', 'Shadow Bolts, Dread, a demon, a curse and Absorb.', null],
    ['soulbinder', 'Soulbinder', 'Mark a foe with Soul Beacon and heal the whole party by hurting it.', [['soul_beacon', 1], ['beacon_of_ruin', 1], ['soul_harvest', 1], ['soul_link', 1], ['shadow_volley', 1], ['drain_life', 1], ['shadow_bolt', 5], ['siphon_soul', 3], ['dark_ward', 4], ['blood_offering', 1], ['shadow_mend', 1]]],
    ['demonologist', 'Demonologist', 'Summon demons that fight for you at the end of each turn.', [['summon_ruin_fiend', 1], ['summon_bulwark_fiend', 1], ['demonic_empowerment', 1], ['summon_imp_swarm', 1], ['summon_hollow_hound', 1], ['fel_command', 1], ['summon_gloom_imp', 2], ['shadow_bolt', 4], ['dark_ward', 4], ['demon_whip', 2], ['dark_pact', 2]]],
    ['shadowknight', 'Shadow Knight', 'Two-handed Strength strikes wreathed in shadow that drain life.', [['dread_lord', 1], ['soul_cleave', 1], ['blood_armor', 1], ['shadow_strike', 1], ['dark_cleave', 1], ['harvest_life', 1], ['dread_blade', 4], ['grim_swing', 4], ['dark_ward', 4], ['life_tap_strike', 2]]],
  ],
};
// the amulet's 6 points split between card draw and mana regen (each point not on draw is +10 regen)
const STARTER_AMULETS = [
  ['wellspring', 'Wellspring Pendant', 1, 50, 'Slow and steady: very few cards, lots of mana.'],
  ['deepwell', 'Deepwell Pendant', 2, 40, 'Fewer cards, plenty of mana for big spells.'],
  ['balanced', 'Balanced Pendant', 3, 30, 'Even split between cards and mana.'],
  ['soldier', "Soldier's Pendant", 4, 20, 'The classic: a full hand, modest mana.'],
  ['quickhand', 'Quickhand Pendant', 5, 10, 'Lots of cards, little mana: for cheap decks.'],
];
const AMULET_STAT = { Warrior: 'Strength', Rogue: 'Strength', Mage: 'Intelligence', Paladin: 'Strength', Warlock: 'Intelligence' };
function starterAmulet(cls, key) { const a = STARTER_AMULETS.find(x => x[0] === key) || STARTER_AMULETS[3]; return { slot: 'Amulet', name: a[1], rarity: 'White', ilvl: 1, stats: { [AMULET_STAT[cls] || 'Strength']: 3 }, imp2: { Draw: a[2], Regen: a[3] }, label: 'Starter amulet', amuletKey: a[0], r2: 1, r3: 1, r4: 1 }; }
const PRESSURE_START = 5, PRESSURE_STEP = 0.02;
const ELEMENTS = ['Physical', 'Fire', 'Frost', 'Nature', 'Arcane', 'Shadow'];

// physical weapons add flat damage to every hit of an Attack: 1 for a one-hander, 2 for a two-hander at White and map level 0,
// x1.1 / 1.2 / 1.3 for Green / Blue / Purple, and x1.12 per map level the weapon dropped on (Oct 31: help for the physical classes)
const PHYS_WEAPONS = ['1H Axe', '1H Sword', 'Dagger', '1H Mace', '2H Axe', '2H Sword', '2H Maul', '2H Warhammer', '2H Scythe'];
const RAR_MULT = { White: 1, Green: 1.1, Blue: 1.2, 'Purple (Epic)': 1.3 };
let GEAR_BASES = DATA && DATA.gear ? DATA.gear.bases : null;
function weaponFlat(x) {
  if (!x || (x.slot !== 'Weapon' && x.slot !== 'Off-hand')) return 0;
  const arch = x.arch || (GEAR_BASES && (GEAR_BASES.find(b => b.name === x.name) || {}).arch);
  if (!PHYS_WEAPONS.includes(arch)) return 0;
  return Math.max(1, Math.round((/^2H/.test(arch) ? 2 : 1) * (RAR_MULT[x.rarity] || 1) * Math.pow(1.12, x.level || 0)));
}
function sumGear(items) {
  const t = {}; const add = (k, v) => { t[k] = (t[k] || 0) + v; };
  let amulet = false, weaponDmg = 0;
  for (const x of items) { if (!x) continue; const ok = (k) => k !== 'Mana Regen' || x.slot === 'Amulet', rv = (k, v) => !x.r2 && x.slot && /Recovery$/.test(k) ? halfUp(v) : !x.r3 && x.slot && CRIT_CUT[k] ? Math.max(1, Math.round(v * CRIT_CUT[k])) : v; for (const [k, v] of Object.entries(x.stats || {})) if (ok(k)) add(k, rv(k, v)); for (const [k, v] of Object.entries(x.imp2 || {})) if (ok(k)) add(k, rv(k, v)); if (x.slot === 'Amulet') amulet = true; weaponDmg += weaponFlat(x); }
  const res = {}, elem = {};
  for (const [k, v] of Object.entries(t)) { if (k.startsWith('Resistance:')) res[k.slice(11)] = (res[k.slice(11)] || 0) + v; if (k.startsWith('Elemental/Holy Damage:')) elem[k.slice(22)] = (elem[k.slice(22)] || 0) + v; }
  if (t['All Resistances']) for (const el of ELEMENTS) res[el] = (res[el] || 0) + t['All Resistances'];
  for (const el in res) res[el] = Math.min(75, res[el]);
  const g = k => t[k] || 0;
  return {
    stamina: g('Stamina'), maxHp: BASE.hp + g('Stamina'), strength: g('Strength'), intelligence: g('Intelligence'), dexterity: g('Dexterity'), spirit: g('Spirit'),
    crit: g('Crit Chance'), critDmg: g('Crit Damage'), critMult: BASE.critMult + g('Crit Damage') / 100, init: BASE.init + g('Initiative'),
    maxMana: BASE.maxMana + Math.min(MANA_GEAR_CAP, g('Max Mana')), manaOver: Math.max(0, g('Max Mana') - MANA_GEAR_CAP), regen: (amulet ? g('Regen') : BASE.regen) + g('Mana Regen'), draw: amulet ? g('Draw') : BASE.draw,
    multiHit: g('Multi-hit Chance'), multiplay: g('Multiplay Chance'), multicast: g('Multicast Chance'), bleedChance: g('Bleed Chance'), lifesteal: g('Lifesteal'),
    thorns: g('Thorns'), luck: g('Luck'), healthRegen: g('Health Regen'), recovery: g('Recovery') + g('Party Recovery'), defGain: g('Defense Gain'), resist: res, elem, weaponDmg,
  };
}

// ---------------- Enemy card parsing ----------------
function parseEnemyCard(text) {
  const ops = []; let m; const s = text;
  if ((m = s.match(/^Remove (\d+) Block from the target/))) ops.push({ op: 'shred', n: +m[1] });
  if (/^Remove all Block from every player/.test(s)) ops.push({ op: 'shredAll' });
  if ((m = s.match(/Deal (\d+) damage (\d+) times to every player/))) ops.push({ op: 'damage', n: +m[1], times: +m[2], all: true });
  else if ((m = s.match(/[Dd]eal (\d+) (?:(?:Shadow|Fire|Arcane|Frost|Nature|Holy|Physical) )?damage to (?:every player|each)/))) ops.push({ op: 'damage', n: +m[1], all: true });
  else if ((m = s.match(/Deal (\d+) damage to a target below 30% HP, otherwise (\d+)/))) ops.push({ op: 'execute', n: +m[1], low: +m[2] });
  else if ((m = s.match(/Deal (\d+) damage plus (\d+) for every status card/))) ops.push({ op: 'damage', n: +m[1], perStatus: +m[2] });
  else if ((m = s.match(/Deal damage equal to (\d+)% of its Block/))) ops.push({ op: 'damageBlock', pct: +m[1] });
  else if ((m = s.match(/Deal (\d+) (?:(?:Shadow|Fire|Arcane|Frost|Nature|Holy|Physical) )?damage (\d+) times/))) ops.push({ op: 'damage', n: +m[1], times: +m[2] });
  else if ((m = s.match(/Deal (\d+) (?:(?:Shadow|Fire|Arcane|Frost|Nature|Holy|Physical) )?damage twice/))) ops.push({ op: 'damage', n: +m[1], times: 2 });
  else if ((m = s.match(/[Dd]eal (\d+) (?:(?:Shadow|Fire|Arcane|Frost|Nature|Holy|Physical) )?damage/))) ops.push({ op: 'damage', n: +m[1] });
  if ((m = s.match(/Each hit applies (\d+) (Bleed|Burn|Poison|Chill)/))) ops.forEach(o => { if (o.op === 'damage') o.dotPerHit = { key: m[2].toLowerCase(), n: +m[1] }; });
  if (/heal for 50% of the damage dealt/.test(s)) ops.forEach(o => { if (o.op === 'damage') o.lifesteal = 0.5; });
  if ((m = s.match(/^Another (?:enemy|friendly target) gains (\d+) Block/))) ops.push({ op: 'blockAlly', n: +m[1] });
  else if ((m = s.match(/[Gg]ain (\d+) (?:Block|Dodge)/))) ops.push({ op: 'block', n: +m[1] });
  if ((m = s.match(/All other (?:enemies|friendly targets) gain (\d+) Block/))) ops.push({ op: 'blockOthers', n: +m[1] });
  if ((m = s.match(/Gain (\d+) Parry\. Attacks into it take (\d+) damage back/))) ops.push({ op: 'parry', n: +m[1], back: +m[2] });
  else if ((m = s.match(/Gain (\d+) Parry/))) ops.push({ op: 'parry', n: +m[1], back: 0 });
  if ((m = s.match(/Gain (\d+) Thorns for (\d+) turns/))) ops.push({ op: 'thorns', n: +m[1], turns: +m[2] });
  if ((m = s.match(/^Heal (\d+) HP/))) ops.push({ op: 'heal', n: +m[1] });
  if ((m = s.match(/steal (\d+) mana/i))) ops.push({ op: 'stealMana', n: +m[1] });
  if ((m = s.match(/[Bb]urn (\d+) of the target's mana/))) ops.push({ op: 'burnMana', n: +m[1] });
  if ((m = s.match(/^Gain (\d+) mana/))) ops.push({ op: 'gainMana', n: +m[1] });
  for (const x of s.matchAll(/apply (\d+) (Bleed|Weak|Vulnerable|Slow|Burn|Poison|Chill|Unwarded|Exposure)( to every player)?/gi)) ops.push({ op: 'debuff', key: x[2].toLowerCase(), n: +x[1], all: !!x[3] });
  if ((m = s.match(/^All (?:enemies|friendly targets) heal (\d+) HP/))) ops.push({ op: 'teamHeal', n: +m[1] });
  if ((m = s.match(/All (?:enemies|friendly targets) gain (\d+) Strength/))) ops.push({ op: 'teamStrength', n: +m[1] });
  else if ((m = s.match(/Gain (\d+) Strength this turn/))) ops.push({ op: 'strTurn', n: +m[1] });
  else if ((m = s.match(/Gain (\d+) Strength for the rest of combat/))) ops.push({ op: 'strCombat', n: +m[1] });
  if ((m = s.match(/(\d+) Initiative next turn/))) ops.push({ op: 'initNext', n: +m[1] });
  if (/add a Dazed to each of their discard piles/.test(s)) ops.push({ op: 'status', key: 'dazed', n: 1, pile: 'discard' });
  if ((m = s.match(/Add (\d+) Dazed to the target's draw pile/))) ops.push({ op: 'status', key: 'dazed', n: +m[1], pile: 'draw' });
  if (/add a Stun to (?:the target's|each of their) draw pile/.test(s)) ops.push({ op: 'status', key: 'stun', n: 1, pile: 'draw' });
  if (/draws 1 fewer card next turn/.test(s)) ops.push({ op: 'drawLess', n: 1 });
  if (/Disarm the target/.test(s)) ops.push({ op: 'disarm' });
  if (/Remove all debuffs from itself/.test(s)) ops.push({ op: 'cleanse' });
  if (/Remove all buffs from the target|Steal 1 buff from the target/.test(s)) ops.push({ op: 'purge', all: /all buffs/.test(s) });
  if ((m = s.match(/Its next Attack deals (\d+) more damage/))) ops.push({ op: 'nextBonus', n: +m[1] });
  if (/Bleed on the target ticks immediately/.test(s)) ops.push({ op: 'tickBleed' });
  if (/Draw 1 card/.test(s)) ops.push({ op: 'draw', n: 1 });
  return ops;
}
const CB_intent = (c) => c.kind === 'Status' ? 'status' : intentKind(c.ops);
function intentKind(ops) {
  const k = ops.map(o => o.op);
  if (k.some(x => ['damage', 'execute', 'damageBlock'].includes(x))) return 'attack';
  if (k.some(x => ['debuff', 'stealMana', 'burnMana', 'status', 'drawLess', 'disarm', 'purge', 'shred', 'shredAll', 'tickBleed'].includes(x))) return 'debuff';
  if (k.some(x => ['block', 'parry', 'blockAlly', 'blockOthers'].includes(x))) return 'defend';
  return 'buff';
}

// per-enemy tuning on top of the Map 1 design numbers
const BOSS_CODEX_CHANCE = 0.25; // Nov 1: was 0.5 and always your own class; now 25%, and the codex is any class's on that boss's table
const bossCodexPct = (d) => { const n = ((d && d.loot) || []).filter(x => x.type === 'Codex').length; return n ? BOSS_CODEX_CHANCE * 100 / n : 0; }; // chance of one particular codex per kill
const DEBT_CARDS = ['collect_the_debt', 'sanguine_guard', 'pay_in_blood'];
// enemy card ops that land on heroes (single-target unless the op is marked all)
const ENEMY_PLAYER_OPS = ['damage', 'execute', 'damageBlock', 'debuff', 'stealMana', 'burnMana', 'drawLess', 'disarm', 'purge', 'shred', 'shredAll', 'tickBleed', 'status'];
// ---------------- Raids: one per map, 2 to 10 heroes, the map's boss made raid-sized
// hp: x the map boss (then x heroes); dmg: damage x; manaStep: boss mana/regen +3% per extra hero; +1 draw at 6+ heroes
const RAID = { hp: 1.5, dmg: 1.25, dotResist: 0.25, manaStep: 0.03, min: 2, max: 10, lockMs: 7 * 24 * 3600 * 1000 };
const RAID_NAMES = { physical: 'Gorrath, the Unbroken Tide', fire: 'Vashkar, the Sunken Sun', frost: 'Sylvaine, the Endless Winter', nature: 'Thornheart, the World-Root', arcane: 'Ilvar, the Shattered Star', shadow: 'The Hollow King Ascendant' };
// per-boss tuning from the first raid nights (Oct 31): every raid boss needed 30-50% more HP; Vashkar also hits harder
const RAID_TUNE = { physical: { hp: 1.3 }, fire: { hp: 1.5, dmg: 1.25 }, frost: { hp: 1.4 }, nature: { hp: 1.4 }, arcane: { hp: 1.4 }, shadow: { hp: 1.4 } };
function raidKey(mk) { return 'raid_' + mk; }
function raidBoss(data, mk) {
  const k = raidKey(mk); if (data.enemies[k]) return k;
  const m = data.maps && data.maps[mk]; if (!m) return null; const b = data.enemies[m.boss]; if (!b) return null;
  data.enemies[k] = Object.assign(JSON.parse(JSON.stringify(b)), { name: RAID_NAMES[mk] || b.name + ' (Raid)', hp: Math.round(b.hp * RAID.hp * ((RAID_TUNE[mk] || {}).hp || 1)), raidDmg: (RAID_TUNE[mk] || {}).dmg || 1, raid: true, map: mk,
    arch: 'Raid boss: every attack hits every hero', desc: `${b.name.split(',')[0]} returns, raid-sized. Every attack and debuff hits the whole raid. Only one hero a round can land non-damaging debuffs on it.` });
  return k;
}
const ENEMY_TUNE = { warlord_gorrath_the_iron_tide: { dmg: 0.8 } }; // Oct 30: Warlord hit too hard (War Banner +40 Strength); all his damage -20%

// ---------------- Combat ----------------
class Combat {
  // opts: cls, gear (items), enemies (keys), level, seed, hp, mana, buffs, data
  constructor(opts) {
    this.opts = Object.assign({ cls: 'Warrior', enemies: ['deserter'], level: 0, blockReset: 'decay', seed: (Date.now() % 2147483646) + 1 }, opts || {});
    this.data = this.opts.data || DATA;
    if (!GEAR_BASES && this.data && this.data.gear) GEAR_BASES = this.data.gear.bases;
    this.rng = makeRng(this.opts.seed);
    this.level = this.opts.level;
    this.log = []; this.round = 0; this.over = null;
    this.stats = { dealt: 0, taken: 0, blocked: 0, cardsPlayed: 0, healed: 0 };
    this._uid = 0;
    this.meter = {}; this.later = []; this._cmult = 1; // damage meter: per actor id, damage dealt / healing done / damage taken, each broken down by ability or source
    // party: 1 to 4 heroes. opts.party = [{cls, gear, deck, hp, mana, buffs, name}]; without it, one hero from opts.cls/gear/deck/hp/mana/buffs
    const party = this.opts.party || [{ cls: this.opts.cls, gear: this.opts.gear, deck: this.opts.deck, hp: this.opts.hp, mana: this.opts.mana, buffs: this.opts.buffs }];
    this.players = party.map((spec, i) => this.makePlayer(spec, i, party.length));
    // codex talents: the mini-capstone party buff is on every hero from the first moment of the fight (in a duel only on its owner)
    for (const p of this.players) for (const pw of p.powers) if (pw.def && pw.def.partyBuff) { for (const a of (this.opts.duel ? [p] : this.players)) for (const [st, n] of pw.def.partyBuff) partyStat(a, st, n); }
    this.player = this.players[0];       // the hero currently acting, or the one an enemy card is aimed at
    this.gear = sumGear(party[0].gear || STARTER_GEAR[party[0].cls]);
    this.partySize = this.players.length;
    this.raid = !!this.opts.raid; // raid: everyone plays at once, then the boss acts; boss HP scales 1:1 with heroes
    this.partyScale = this.raid ? this.partySize : 1 + (this.opts.partyStep != null ? this.opts.partyStep : 0.85) * (this.partySize - 1); // 1 when a party fight brings one monster per hero instead // each extra hero: enemies get +85% HP, mana and regen, and +1 draw
    this.hpMult = Math.pow(1.5, this.level) * this.partyScale * (this.opts.mobHp || 1); this.dmgMult = Math.pow(1.3, this.level); // mobHp: extra HP when a party meets one monster per hero
    this.levelHpMult = Math.pow(1.5, this.level);
    this.typeResist = Math.min(1, 0.05 + 0.05 * this.level);
    this.duel = !!this.opts.duel; // duel: two heroes, no monsters; each hero's "enemies" are the other hero
    // a group (wolf pack, bandit party...) fills one enemy slot with GROUP_N bodies; only the first one carries the loot
    const slots = []; if (!this.duel) for (const key of this.opts.enemies) { const d = this.data.enemies[key]; if (d && d.group) for (let j = 0; j < d.group; j++) slots.push([key, j]); else slots.push([key, -1]); }
    this.enemies = slots.map(([key, j], i) => { const e = this.makeEnemy(key, i); if (j >= 0) { const d = e.d; e.maxHp = e.hp = Math.max(1, Math.round(e.hp / d.group)); e.name = `${d.unit} ${'ABCDEF'[j]}`; e.groupOf = d.name; e.grp = j; if (j > 0) e.noLoot = true; } return e; });
    if (this.duel) this.say('sys', `Duel: ${this.players.map(p => p.name).join(' vs ')}. Last hero standing wins. From round ${PRESSURE_START} every hit lands harder.`);
    else if (this.raid) this.say('sys', `Raid starts. Level +${this.level}, ${this.partySize} heroes: boss HP x${this.hpMult.toFixed(2)}, damage x${(this.dmgMult * RAID.dmg).toFixed(2)}. Every boss attack hits every hero. Only one hero a round can land non-damaging debuffs on it, and it resists 25% of damage over time.`);
    else this.say('sys', `Fight starts. Map level +${this.level}${this.partySize > 1 ? `, party of ${this.partySize}` : ''}: enemy HP x${this.hpMult.toFixed(2)}${this.partySize > 1 ? ` and +${this.partySize - 1} card draw` : ''}, damage x${this.dmgMult.toFixed(2)}; enemies resist their own type by ${Math.round(this.typeResist * 100)}%.`);
    this.startRound();
  }

  makePlayer(spec, i, n) {
    const cls = CLASSES[spec.cls]; const g = sumGear(legalGear(spec, this.data)); const buffs = spec.buffs || {};
    const p = {
      id: 'p' + i, idx: i, name: spec.name || spec.cls, isPlayer: true, cls: spec.cls, defName: (spec.cls === 'Warrior' || spec.cls === 'Paladin') ? (legalGear(spec, this.data).some(x => x && x.slot === 'Off-hand' && (/Shield/.test(x.arch || x.label || '') || ['Kite Shield', 'Pavise'].includes(x.name))) ? 'Block' : 'Parry') : cls.defense, maxHp: g.maxHp, hp: Math.min(g.maxHp, spec.hp != null ? spec.hp : g.maxHp), block: 0,
      mana: spec.mana != null ? Math.min(spec.mana, g.maxMana) : 0, maxMana: g.maxMana, regen: g.regen + (buffs.regen || 0), draw: g.draw + (buffs.draw || 0),
      strength: g.strength + (buffs.damage || 0), intelligence: g.intelligence + (buffs.damage || 0), dexterity: g.dexterity + g.defGain, spirit: g.spirit,
      crit: g.crit + (buffs.crit || 0), critMult: g.critMult, multiHit: g.multiHit, multiplay: g.multiplay, multicast: g.multicast, bleedChance: g.bleedChance, lifesteal: g.lifesteal,
      thorns: g.thorns, baseInit: g.init, recovery: g.recovery, elem: g.elem, resist: Object.assign({}, g.resist),
      strTurn: 0, strCombat: 0, weak: 0, vulnerable: 0, bleed: 0, slow: 0, initNext: 0, defNext: 0, manaNext: 0, drawLess: 0,
      stealth: false, locked: false, disarmed: false, disarmNext: false, negateDebuff: false, nextAttackMult: 1, nextSkillMult: 1,
      attackedThisRound: false, drawPile: [], hand: [], discard: [], exhaust: [], reshuffles: 0, firstTurn: true, dead: false,
      poison: 0, burn: 0, chill: 0, frozen: false, regenDown: [], uid: spec.uid || null, dread: 0, rot: 0, rotQ: [], demons: [], demonDmg: 0,
      unwarded: 0, exposure: 0, weaponDmg: g.weaponDmg || 0,
      turn: {}, until: {}, timed: [], devotion: 0, bloodDebt: 0, dmgRound: 0, rampage: 0, costX: 1,
      powers: [], turnAttacks: 0, turnSkills: 0, turnElems: [], spellCount: 0, prevType: null, nextAttackFlat: 0, nextHolyMult: 1, dexTurn: 0, hot: [],
    };
    if (buffs.resist) for (const el of ELEMENTS) p.resist[el] = Math.min(75, (p.resist[el] || 0) + buffs.resist);
    const cxItem = (spec.gear || []).find(g => g && g.slot === 'Codex' && g.codex && CODEX_BY_KEY[g.codex] && CODEX_BY_KEY[g.codex].cls === spec.cls);
    if (cxItem) { const cx = CODEX_BY_KEY[cxItem.codex]; let key = 'codex_' + cx.key, text = cx.text;
      { const why = codexNeed(cx.key, spec.gear || [], this.data); if (why) { key = cx.key === 'bastion_of_faith' ? 'codex_bastion_of_faith_off' : 'codex_off'; text = `Inactive: needs ${why}.`; } } // Nov 2: weapon requirements
      p.powers.push({ key, name: cx.name + ' Codex', text, codex: true });
      if (key === 'codex_shadow_knight') p.strength = Math.round(p.strength + g.strength * 0.2); }
    // codex talents: only for the codex being worn (spec.talents = { codex, picks: [row 0..9 -> 0 offense | 1 defense | 2 support] })
    const tl = spec.talents, tr = cxItem && tl && tl.codex === cxItem.codex && TALENTS[tl.codex];
    if (tr) {
      const picked = []; let cap = null;
      (tl.picks || []).forEach((j, i) => { if (j == null || j < 0 || j > 2) return; if (i < 9) { const t = tr.rows[i] && tr.rows[i][j]; if (t) picked.push(t); } else if (i === 9) cap = tr.cap[j]; });
      for (const t of picked) for (const f of t.fx) if (f[0] === 'statFrom') { const src = f[2] === 'stamina' ? g.stamina : f[2].startsWith('gear:') ? (g[f[2].slice(5)] || 0) : p[f[2]] || 0, v = Math.round(src * f[3] / 100); if (f[1] === 'stamina') { p.maxHp += v; p.hp += v; } else p[f[1]] = (p[f[1]] || 0) + v; }
      for (const t of picked) for (const f of t.fx) if (f[0] === 'convert') { const v = Math.round((p[f[1]] || 0) * f[3] / 100); p[f[2]] = (p[f[2]] || 0) + v; } // Nov 2: talents that give a bonus stat from another (the source stat is kept)
      for (const t of picked) for (const f of t.fx) if (f[0] === 'stat') { if (f[1] === 'resistAll') { for (const el of ELEMENTS) p.resist[el] = Math.min(75, (p.resist[el] || 0) + f[2]); } else if (f[1].startsWith('resist:')) { const el = f[1].slice(7); p.resist[el] = Math.min(75, (p.resist[el] || 0) + f[2]); } else p[f[1]] = (p[f[1]] || 0) + f[2]; }
      if (picked.length || cap) { const label = CODEX_BY_KEY[tl.codex].name + ' talents';
        p.powers.push({ key: 'talents', name: label, text: picked.map(t => t.n).concat(cap && C[cap] ? [C[cap].name + ' (capstone)'] : []).join(', '), talent: true, def: talentDef(picked, cap, label) }); }
    }
    const deck = [];
    for (const x of (spec.deck || cls.deck)) {
      if (Array.isArray(x)) { for (let k = 0; k < x[1]; k++) deck.push({ uid: 'c' + (this._uid++), key: x[0] }); }
      else deck.push({ uid: 'c' + (this._uid++), key: x.key, rank: x.rank || 0 });
    }
    p.drawPile = shuffle(deck, this.rng);
    p.look = (spec.gear || STARTER_GEAR[spec.cls] || []).filter(Boolean).map(g => ({ slot: g.slot, name: g.name, arch: g.arch, rarity: g.rarity })); // what the hero wears, for the Forge sprite
    // Blood Debt only matters for the Bloodbound codex and the cards that spend or grow it
    p.debtUser = !!(cxItem && cxItem.codex === 'bloodbound') || deck.some(c => DEBT_CARDS.includes(c.key));
    return p;
  }
  alivePlayers() { return this.players.filter(p => p.hp > 0); }
  allies() { return this.duel ? [this.player] : this.alivePlayers(); } // the acting hero and their living party
  who(p) { return this.partySize > 1 ? p.name : 'You'; }

  makeEnemy(key, i) {
    const en = this.makeEnemy0(key, i);
    if (!this.raid && !this.duel) { const T = en.tier === 'Boss' ? [0.9, 0.9] : en.tier === 'Elite' ? [1.15, 1.05] : [1.1, 1.1]; en.maxHp = en.hp = Math.max(1, Math.round(en.hp * T[0])); en.dmgTune *= T[1]; } // Nov 2: move the wall off the boss: monsters +10% HP and damage, elites +15% HP and +5% damage, bosses -10% both
    if (this.opts.firstBoss && en.tier === 'Boss') { en.maxHp = en.hp = Math.round(en.hp * 0.85); en.firstBoss = true; } // Nov 1: a map's boss has 15% less HP until you first beat it
    if (this.opts.enraged && en.tier === 'Elite') { en.maxHp = en.hp = Math.round(en.hp * 1.5); en.dmgTune *= 1.5; en.name = 'Enraged ' + en.name; en.enraged = true; } // 10% of maps: +50% HP and damage, double loot
    if (this.raid) {
      const n = this.partySize, k = 1 + RAID.manaStep * (n - 1), d = en.d;
      en.maxMana = Math.round(d.maxMana * k); en.regen = Math.round(d.regen * k); en.regenK = k; en.drawPlus = n >= 6 ? 1 : 0; en.draw = d.draw + en.drawPlus; en.dmgTune *= RAID.dmg * (d.raidDmg || 1);
      for (const c of [...en.drawPile, ...en.phase2Cards]) { let hit = false; for (const o of c.ops) if (ENEMY_PLAYER_OPS.includes(o.op)) { o.all = true; hit = true; } if (hit && !/every player|each of their/.test(c.text)) c.text += ' Hits every hero.'; }
    }
    return en;
  }
  makeEnemy0(key, i) {
    const d = this.data.enemies[key];
    const tune = (this.opts.tune || {})[d.tier] || {};
    const own = ENEMY_TUNE[key] || {};
    const hp = Math.round(d.hp * this.hpMult * (tune.hp || 1));
    const deck = [], phase2 = [];
    for (const c of d.deck) for (let j = 0; j < c.n; j++) {
      const cardObj = { uid: 'e' + i + '_' + (deck.length + phase2.length), name: c.name, cost: c.cost, text: c.text, dtype: c.dtype, kind: c.kind, ops: parseEnemyCard(c.text) };
      (c.phase2 ? phase2 : deck).push(cardObj);
    }
    return {
      id: 'e' + i, key, name: d.name, tier: d.tier, creature: d.creature, type: d.type, weakTo: d.weak, maxHp: hp, hp, block: 0, parryBack: 0, thorns: 0, thornsTurns: 0,
      mana: 0, maxMana: Math.round(d.maxMana * this.partyScale), regen: Math.round(d.regen * this.partyScale), draw: d.draw + (this.partyScale > 1 ? this.partySize - 1 : 0), baseInit: d.tier === 'Boss' ? 12 : d.tier === 'Elite' ? 11 : 8 + ri(this.rng, 0, 7),
      strength: 0, strTurn: 0, weak: 0, vulnerable: 0, bleed: 0, poison: 0, burn: 0, chill: 0, frozen: false, slow: 0, initNext: 0, regenDown: [], nextBonus: 0, dread: 0, rot: 0, rotQ: [],
      drawPile: shuffle(deck, this.rng), phase2Cards: phase2, phase: 1, d, hand: [], discard: [], plan: [], firstTurn: true, dmgTune: (tune.dmg || 1) * (own.dmg || d.dmgScale || 1) * ((this.data.maps && d.map && this.data.maps[d.map] && this.data.maps[d.map].dmgScale) || 1),
      condemn: 0, unwarded: 0, exposure: 0, magicVuln: 0, costUp: 0, counter: 0, drawLess: 0, weakNext: 0, noHealRound: 0, grievous: 0, exhaustedTotal: 0, lostRound: 0,
    };
  }

  // ----- card systems: turn flags (p.turn, cleared when your turn ends), until-your-next-turn flags (p.until), timed effects (p.timed)
  timed(p, key, turns, o) { const t = Object.assign({ key, turns }, o || {}); p.timed.push(t); if (this._rkCard && !this._inPw && this._playing === this._rkCard) { if (this._rk) t.rk = this._rk; if (this._rkTimed) this._rkTimed.push(t); } if (t.begin) t.begin(this, p, t); return t; }
  tickTimed(p) { for (const t of p.timed) { if (t.each) this.rkRun(t.rk, () => t.each(this, p, t)); t.turns--; if (t.turns <= 0 && t.end) this.rkRun(t.rk, () => t.end(this, p, t)); } p.timed = p.timed.filter(t => t.turns > 0); }
  hasTimed(p, key) { return p.timed && p.timed.some(t => t.key === key); }
  // ----- Warlock systems (Nov 1)
  // Rot: each application deals its amount over 4 turns (12 Rot ticks 3/3/3/3); every application keeps its own timer. Ignores Block.
  addRot(e, n, turns, src) { if (!e || e.hp <= 0 || !(n > 0)) return; (e.rotQ = e.rotQ || []).push({ left: n, turns: turns || 4 }); e.rot = e.rotQ.reduce((s, r) => s + r.left, 0); if (src) e.rotBy = src.id; }
  // Fear: the enemy skips its attacks on its next turn. Stun: it skips its whole next turn (a boss shrugs off the Stun part and is only Feared).
  // After either lands, that enemy can't be Feared or Stunned for 2 rounds (3 for bosses).
  // Nov 1: damage that lands on a Feared monster can snap it out of the Fear: 75% for direct damage (even into Block), 10% for a damage-over-time tick
  breakFear(e) { if (!e || e.isPlayer || !e.feared || e.hp <= 0) return; e.feared = 0; if (e.fearDisarm) e.disarmed = 0; e.fearDisarm = false; this.planEnemy(e, true); this.say('enemy', `${e.name} is hit and shakes off the Fear.`); }
  control(e, kind) {
    if (!e || e.hp <= 0) return false;
    if (this.raidBoss(e)) { this.say('player', `${e.name} is a raid boss: it can't be ${kind === 'stun' ? 'Stunned' : 'Feared'}.`); return false; }
    if (e.isPlayer) { if (kind === 'stun') { e.frozen = true; this.say('crit', `${e.name} is Stunned and will lose the next turn.`); } else { e.disarmNext = true; this.say('player', `${e.name} is Feared: no Attacks next turn.`); } return true; }
    if ((e.ccUntil || 0) > this.round) { this.say('player', `${e.name} resists the ${kind === 'stun' ? 'Stun' : 'Fear'} (controlled too recently).`); return false; }
    const boss = e.tier === 'Boss';
    if ((kind === 'fear' || boss) && this.rng() < (boss ? FEAR_RESIST_BOSS : FEAR_RESIST)) { this.say('player', `${e.name} resists the Fear.`); return false; } // Nov 1: monsters shrug off Fear 25% of the time, bosses 50%
    e.ccUntil = this.round + (boss ? 3 : 2);
    if (!(kind === 'stun' && !boss)) e.fearDisarm = !e.disarmed; // remember whether Fear is the only thing disarming it
    e.disarmed = 1; if (kind === 'stun' && !boss) { e.silenced = 1; e.stunned = 1; } else e.feared = 1;
    this.planEnemy(e, true);
    this.say('crit', kind === 'stun' && !boss ? `${e.name} is Stunned: it loses its next turn.` : `${e.name} is Feared: it skips its attacks on its next turn.`);
    return true;
  }
  fear(e) { return this.control(e, 'fear'); }
  stun(e) { return this.control(e, 'stun'); }
  // Armors: one at a time; a new Armor replaces the old one
  armor(p, key, turns, o) { const old = p.timed.filter(t => t.armor); for (const t of old) if (t.end) t.end(this, p, t); p.timed = p.timed.filter(t => !t.armor); const t = this.timed(p, key, turns, Object.assign({ armor: true }, o || {})); return t; }
  // Demons: summoned by a Warlock, up to 3 at once. Single-target enemy cards can't hit them (the Bulwark Fiend taunts instead); area attacks do.
  // They act at the end of their owner's turn, then count down; each lasts 2 turns (more with the Demonologist codex or cards).
  summon(p, key, opts) {
    const D = DEMONS[key]; if (!D || !p || p.hp <= 0) return null; opts = opts || {};
    const hp = Math.max(1, Math.round(D.hp * p.maxHp / 100 * (1 + (opts.hpPct || 0) / 100)));
    const ms = this._rkCard && !this._inPw && this._playing === this._rkCard ? this._rkCard.ms || {} : {}; // card upgrades: more damage, and +1 turn at +5 and +10
    const turns = 2 + (p.powers.length ? this.pwSum(p, 'demonTurns') : 0) + (opts.turns || 0) + (p.demonTurns || 0) + (ms.turns || 0);
    const dm = { uid: 'd' + (this._uid++), key, name: D.name, hp, maxHp: hp, turns, acts: 0, mult: this.rkm('dmg') };
    p.demons = p.demons || []; if (p.demons.length >= 3) { const o = p.demons.shift(); this.say('player', `${o.name} is banished to make room.`); }
    p.demons.push(dm); this.say('player', `${this.who(p)} summon${this.partySize > 1 ? 's' : ''} a ${D.name} (${hp} HP, ${turns} turns).`);
    if (p.powers.length) this.fire(p, 'onSummon', dm);
    return dm;
  }
  demonMult(p) { return 1 + ((p.demonDmg || 0) + (p.powers.length ? this.pwSum(p, 'demonDmg') : 0)) / 100; }
  demonAct(p, dm) { const D = DEMONS[dm.key]; if (!D || this.over || dm.hp <= 0) return; const pool = this.duel ? this.players.filter(q => q !== p && q.hp > 0) : this.foes(); if (!pool.length) return; const e = (D.pick && !this.duel ? D.pick(this) : null) || pool[Math.floor(this.rng() * pool.length)]; if (!e) return; this.fxPush({ t: 'demon', d: p.id, u: dm.uid, tg: e.id }); D.act(this, p, dm, e, (n) => Math.round(n * this.demonMult(p) * (dm.mult || 1))); dm.acts++; if (p.powers.length) this.fire(p, 'demonActed', dm, e); }
  demonsAct(p) {
    if (!p || !p.demons || !p.demons.length || this.over) return;
    for (const dm of p.demons.slice()) { if (this.over) break; this.demonAct(p, dm); dm.turns--; if (dm.turns <= 0) { this.say('player', `${dm.name} returns to the void.`); if (DEMONS[dm.key].depart) DEMONS[dm.key].depart(this, p, dm); } }
    p.demons = p.demons.filter(d => d.turns > 0 && d.hp > 0);
  }
  hurtDemon(p, dm, n, by) { if (!dm || n <= 0) return; dm.hp = Math.max(0, dm.hp - n); this.fxPush({ t: 'demonHit', d: p.id, u: dm.uid, dead: dm.hp <= 0 }); this.say('enemy', `${by ? by + ' hits ' : ''}${dm.name} for ${n}. ${dm.hp > 0 ? `HP ${dm.hp}/${dm.maxHp}.` : 'It is destroyed.'}`); if (dm.hp <= 0) { p.demons = p.demons.filter(d => d !== dm); if (p.powers.length) this.fire(p, 'demonDied', dm); } }
  demonTaunt() { for (const q of this.alivePlayers()) for (const dm of (q.demons || [])) if (dm.hp > 0 && DEMONS[dm.key].taunt) return [q, dm]; return null; }
  bloodCap(p) { const toMax = p.powers.length && this.pws(p).some(([, d]) => d.bloodToMax); return Math.max(BLOOD_CAP, toMax ? p.maxMana : 0) + (p.bloodCapPlus || 0) + (p.powers.length ? this.pwSum(p, 'bloodCap') : 0); } // Nov 3: Bloodmancer pays up to its max mana in HP // HP a hero can pay for cards in one turn
  bloodPay(p) { return !!(p && p.isPlayer && ((p.turn && p.turn.bloodPay) || (p.powers.length && this.pws(p).some(([, d]) => d.bloodPay)))); }
  costOf(p, d, c) {
    if (d.cost == null) return null;
    if ((c && c.free) || (p.turn && (p.turn.freeAll || p.turn.nextFree))) return 0;
    let cost = d.cost + (p.turn.costDelta || 0) + (d.type === 'Attack' ? p.turn.costAttack || 0 : 0) + (d.type === 'Skill' ? p.turn.costSkill || 0 : 0) + (p.turn.nextCost || 0);
    const tw = p.turn.twice; if (tw && (tw.type === 'any' || tw.type === d.type)) cost += tw.extra || 0;
    if (p.powers && p.powers.length) cost -= this.pwSum(p, 'costLess', d);
    cost = cost * (p.turn.costX || 1) * (p.costX || 1) * (1 + 0.05 * Math.min(10, p.exposure || 0)); // Nov 2: Exposure tops out at +50%
    return Math.max(0, Math.round(cost));
  }
  // take mana from an enemy: what it holds now, then what it would regenerate for its next turn (its mana can go below 0 until then)
  drainMana(e, n) { if (!e || n <= 0) return 0; const q = this.player, ent = q && q.isPlayer && this.has(q, 'codex_entropy'); if (ent) n = Math.round(n * 1.2); const pool = Math.max(0, e.mana) + (e.isPlayer ? e.regen : this.effRegen(e)); const s = Math.min(n, pool); e.mana -= s;
    if (ent && s > 0 && q.turn && !q.turn.entropyHit) { q.turn.entropyHit = true; e.exposure = (e.exposure || 0) + 3; e.magicVuln = (e.magicVuln || 0) + 5; this.say('player', `Entropy: ${e.name} gains 3 Exposure and 5 Magic Vulnerability.`); } // Nov 3: flat per drain (was per point drained)
    if (!e.isPlayer) this.planEnemy(e, true); return s; }
  pickAlly(p, self) { const pool = this.allies().filter(a => self || a !== p); if (!pool.length) return p; return pool.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]; }
  defFor(a, n) { const was = this.player; this.player = a; const v = this.gainDef(n); this.player = was; return v; }
  // "spend all your mana" cards. If the card is played again (Double Strike, Multi-hit, Divine Echo...), the repeat uses the same amount
  // instead of finding 0 mana. Mana spent this way counts as mana paid for the card (Colossus, Mana Reflux...).
  spendAll(p) {
    if (this._spentAll != null) { this.say('player', `Repeat: as if spending ${this._spentAll} mana again.`); return this._spentAll; }
    const m = p.mana; p.mana = 0; this._spentAll = m; this._paid = (this._paid || 0) + m;
    this.say('player', `${this.who(p)} spend${this.partySize > 1 ? 's' : ''} all ${m} mana.`); return m;
  }
  taunting() { return this.alivePlayers().find(q => q.until.taunt) || null; }
  setTaunt(p) { p.until.taunt = true; for (const e of this.foes()) for (const c of e.hand) if (c.mark) c.mark = p.id; this.say('player', `${p.name} draws every enemy's attention.`); }
  exhaustStatus(p, max) { let n = 0; for (const c of p.hand.slice()) { if (n >= max) break; if (C[c.key].type === 'Status') { p.hand.splice(p.hand.indexOf(c), 1); p.exhaust.push(c); n++; } } if (n) this.say('player', `${n} status card${n > 1 ? 's' : ''} exhausted.`); return n; }
  // Nov 3: in the game (manualPick) the hero chooses the card: the top cards wait in p.pick until choosePick; bots and the sim pick at once
  topPick(p, n) { if (this.manualPick && p.isPlayer) { const top = p.drawPile.splice(-n); if (!top.length) return; p.pick = top; this.say('player', `${this.who(p)} looks at the top ${top.length} cards: choose one to keep.`); return; }
    this._topPick(p, n); }
  choosePick(p, uid) { const top = p.pick; if (!top) return false; const c = top.find(x => x.uid === uid) || top[top.length - 1]; p.pick = null; p.drawPile.push(...top.filter(x => x !== c)); if (p.hand.length < 10) p.hand.push(c); else p.discard.push(c); this.say('player', `${this.who(p)} keeps ${C[c.key].name}.`); return true; }
  autoPick(p) { if (!p || !p.pick) return; const top = p.pick; p.pick = null; p.drawPile.push(...top); this._topPick(p, top.length); }
  _topPick(p, n) { const top = p.drawPile.slice(-n); if (!top.length) return; const best = top.slice().sort((a, b) => (C[b.key].type === 'Status' ? -1 : (C[b.key].cost || 0)) - (C[a.key].type === 'Status' ? -1 : (C[a.key].cost || 0)))[0]; p.drawPile.splice(p.drawPile.lastIndexOf(best), 1); if (p.hand.length < 10) p.hand.push(best); else p.discard.push(best); this.say('player', `${this.who(p)} pick${this.partySize > 1 ? 's' : ''} ${C[best.key].name} from the top ${top.length}.`); }
  drawUntil(p, type) { let g = 0; while (g++ < 12 && (p.drawPile.length || p.discard.length) && p.hand.length < 10) { const before = p.hand.length; this.drawCards(p, 1); if (p.hand.length === before) break; const c = p.hand[p.hand.length - 1]; if (C[c.key].type === type) return; p.hand.pop(); p.discard.push(c); } }
  // enemy hand and deck
  eStatus(e, key, n, pile) {
    n += this.rkCount();
    if (e && e.isPlayer) { const k = ['dazed', 'stun', 'fatigue'].includes(key) ? key : 'dazed'; for (let i = 0; i < n; i++) e.drawPile.splice(Math.floor(this.rng() * (e.drawPile.length + 1)), 0, { uid: 'c' + (this._uid++), key: k }); this.say('player', `${n} ${C[k].name} added to ${e.name}'s draw pile.`); return; }
    const S = { dazed: ['Dazed', 'A wasted draw.'], stun: ['Stun', 'A wasted draw. Stays in the deck.'], venom: ['Venom', 'When drawn: gain 3 Poison.'], frostbite: ['Frostbite', 'When drawn: gain 3 Chill.'], hex: ['Hex', 'When drawn: gain 10 Vulnerable.'], bomb: ['Living Bomb', 'When drawn: explodes for 15 Fire damage.'], fatigue: ['Fatigue', 'A wasted draw.'] }[key];
    if (!e || e.isPlayer || !S) return;
    for (let k = 0; k < n; k++) { const c = { uid: 'es' + (this._uid++), name: S[0], cost: 999, text: S[1], dtype: key === 'bomb' ? 'Fire' : 'Physical', kind: 'Status', ops: [], status: key, by: this.player && this.player.id, exhaust: key !== 'stun' }; if (pile === 'discard') e.discard.push(c); else e.drawPile.splice(Math.floor(this.rng() * (e.drawPile.length + 1)), 0, c); }
    this.say('player', `${n} ${S[0]}${n > 1 ? 's' : ''} added to ${e.name}'s ${pile || 'draw'} pile.`);
  }
  eDrawn(e, c) {
    if (!c.status) return; const by = this.actorById(c.by);
    if (c.status === 'venom') { e.poison += 3; e.poisonBy = c.by; } if (c.status === 'frostbite') this.applyChill(e, 3); if (c.status === 'hex') e.vulnerable += 10;
    if (c.status === 'bomb' && e.hp > 0) { this.applyHit(by, e, 15, { label: 'Living Bomb' }); this.say('crit', `A Living Bomb explodes on ${e.name}: 15 Fire damage. HP ${e.hp}/${e.maxHp}.`); }
    else this.say('enemy', `${e.name} draws ${c.name}.`);
  }
  eDiscard(e, n, how) {
    n += this.rkCount();
    if (e.isPlayer) { let k = 0; for (; k < n && e.hand.length; k++) { const [c] = e.hand.splice(Math.floor(this.rng() * e.hand.length), 1); e.discard.push(c); this.say('player', `${e.name} discards ${C[c.key].name}.`); } e.lostRound = (e.lostRound || 0) + k; this._forced = (this._forced || 0) + k; return k; } let k = 0; for (; k < n && e.hand.length; k++) { const i = how === 'highest' ? e.hand.reduce((bi, c, j) => (c.cost < 999 && c.cost > (e.hand[bi].cost < 999 ? e.hand[bi].cost : -1)) ? j : bi, 0) : Math.floor(this.rng() * e.hand.length); const [c] = e.hand.splice(i, 1); e.discard.push(c); this.say('player', `${e.name} discards ${c.name}.`); } e.lostRound = (e.lostRound || 0) + k; this._forced = (this._forced || 0) + k; if (k) { this.saboteur(e); this.planEnemy(e, true); } return k; }
  eExhaust(e, n) {
    n += this.rkCount();
    if (e.isPlayer) { let k = 0; for (; k < n && e.hand.length; k++) { const [c] = e.hand.splice(Math.floor(this.rng() * e.hand.length), 1); e.exhaust.push(c); this.say('player', `${e.name}'s ${C[c.key].name} is exhausted.`); } e.lostRound = (e.lostRound || 0) + k; e.exhaustedTotal = (e.exhaustedTotal || 0) + k; return k; } let k = 0; for (; k < n && e.hand.length; k++) { const [c] = e.hand.splice(Math.floor(this.rng() * e.hand.length), 1); this.say('player', `${e.name}'s ${c.name} is exhausted.`); } e.lostRound = (e.lostRound || 0) + k; e.exhaustedTotal = (e.exhaustedTotal || 0) + k; if (k) { this.planEnemy(e, true); } return k; }
  saboteur(e) { const q = this.player; if (!q || !q.isPlayer || e.isPlayer || !this.has(q, 'codex_saboteur') || q.sabRound === this.round) return; q.sabRound = this.round; this.eStatus(e, 'dazed', 1, 'discard'); }
  eCost(e, c) { if (c.cost >= 999) return 999; return Math.round(c.cost * (1 + Math.min(10, e.exposure || 0) * 0.05) * (e.costX || 1)) + (e.costUp || 0); } // Nov 2: Exposure tops out at +50%
  eBuffKeys(e) { return ['strength', 'strTurn', 'thorns', 'parryBack', 'nextBonus'].filter(k => (e[k] || 0) > 0); }
  removeBuffs(e, n) { const ks = this.eBuffKeys(e).sort((a, b) => e[b] - e[a]).slice(0, n); for (const k of ks) e[k] = 0; if (ks.length) this.say('player', `${e.name} loses ${ks.length} buff${ks.length > 1 ? 's' : ''}.`); return ks.length; }
  stealBuff(p, e) { const k = this.eBuffKeys(e).sort((a, b) => e[b] - e[a])[0]; if (!k) { this.say('player', `${e.name} has no buffs to take.`); return 0; } const v = e[k]; e[k] = 0; if (k === 'strength' || k === 'strTurn') p.strCombat += v; else if (k === 'thorns') p.thorns += v; else this.gainDef(v); this.say('player', `${this.who(p)} steal${this.partySize > 1 ? 's' : ''} ${e.name}'s ${k === 'strTurn' ? 'Strength' : k} (${v}).`); return 1; }
  debuffKeys(a, withBleed) { return ['weak', 'vulnerable', 'slow', 'poison', 'burn', 'chill', 'condemn', 'unwarded', 'exposure', 'magicVuln', 'dread', 'rot'].concat(withBleed ? ['bleed'] : []).filter(k => (a[k] || 0) > 0); }
  cleanseAll(a, withBleed) { let n = 0; for (const k of this.debuffKeys(a, withBleed)) { n += a[k]; a[k] = 0; } a.rotQ = []; a.disarmNext = false; if (n) this.say('player', `${a.name}: debuffs removed.`); if (this.player && this.player.isPlayer) this.fire(this.player, 'onCleanse', n); return n; }
  // talents that let damage over time crit: the hero who applied it rolls their crit chance for every tick
  dotCritRoll(src, key, n) {
    if (!src || !src.isPlayer || !src.powers || !src.powers.length || !this.pws(src).some(([, d]) => d && d.dotCrit && d.dotCrit[key])) return { n, crit: false };
    if (this.rng() * 100 >= (src.crit || 0)) return { n, crit: false };
    return { n: Math.round(n * (src.critMult || 1.5) * this.pwProd(src, 'critMultX')), crit: true };
  }
  extraTick(e, key) { const src = this.actorById(e[key + 'By']) || this.player; if (e[key] > 0 && e.hp > 0) { this.applyHit(src, e, e[key], { isDot: true, label: key[0].toUpperCase() + key.slice(1) + ' (extra tick)', ignoreBlock: key === 'poison' }); } }
  // ----- powers
  pws(p) { return (p && p.powers || []).map(pw => [pw, pw.def || POWERS[pw.key]]).filter(x => x[1]); }
  wardThorns(p, n) { if (n <= 0) return; p.wardThorns = (p.wardThorns || 0) + n; p.thorns = (p.thorns || 0) + n; this.say('player', `Spiked Ward: +${n} Thorns while your Barrier holds (${p.wardThorns}).`); }
  wardCheck(p) { if (p.wardThorns && p.block <= 0) { p.thorns = Math.max(0, (p.thorns || 0) - p.wardThorns); p.wardThorns = 0; this.say('player', 'Your Barrier is gone: Spiked Ward\'s Thorns fade.'); } }
  has(p, key) { return !!(p && p.powers && p.powers.some(pw => pw.key === key)); }
  // damage-over-time ticks (Rot, Dread, Poison, Bleed, Burn) from a hero: Soulbinder's party heal, Lifesteal and Soul Beacon count them too.
  // Ticks are small, so the fractions carry over until they make a whole HP.
  dotHeal(p, e, lost) {
    this.fire(p, 'dotDealt', { e, lost });
    if (p.lifesteal > 0) { p._lsAcc = (p._lsAcc || 0) + lost * p.lifesteal / 100; const n = Math.floor(p._lsAcc); if (n > 0) { p._lsAcc -= n; this.heal(p, n, 'Lifesteal', true); } }
    if (e.beacon && e.hp > 0) { const by = this.actorById(e.beacon.by); e.beacon.acc = (e.beacon.acc || 0) + lost * e.beacon.pct / 100 * (by && by.isPlayer && by.powers.length ? this.pwProd(by, 'beaconX') : 1); const n = Math.floor(e.beacon.acc);
      if (n > 0) { e.beacon.acc -= n; const was = this.player; if (by && by.isPlayer) this.player = by; for (const a of this.allies()) this.heal(a, n, 'Soul Beacon', true); this.player = was; } }
  }
  fxPush(x) { const q = this.fxQ = this.fxQ || []; if (q.length < 120) q.push(x); } // hits, heals, Block and debuffs for the fight screen's effects (src/fx.js)
  fire(p, hook, ...args) { if (!p || !p.isPlayer || !p.powers.length) return; for (const [pw, def] of this.pws(p)) if (def[hook] && !this.over) { const was = this.player; this.player = p; this.rkPw(pw, () => def[hook](this, p, ...args, pw)); this.player = was; } }
  pwProd(p, field, ...args) { let m = 1; for (const [pw, def] of this.pws(p)) { const v = def[field]; if (v == null) continue; let x = typeof v === 'function' ? this.rkPw(pw, () => v(this, p, ...args, pw)) : v; if (pw.rkMain && typeof x === 'number' && x !== 1) x = Math.max(0, 1 + (x - 1) * pw.rkMain); m *= x; } return m; }
  pwSum(p, field, ...args) { let m = 0; for (const [pw, def] of this.pws(p)) { const v = def[field]; if (v == null) continue; let x = typeof v === 'function' ? this.rkPw(pw, () => v(this, p, ...args, pw)) : v; if (pw.rkMain && typeof x === 'number' && x) x = Number.isInteger(x) ? Math.round(x * pw.rkMain) : x * pw.rkMain; m += x; } return m; }
  pwKey(p, field, key, agg) { let m = agg === 'sum' ? 0 : 1; for (const [, def] of this.pws(p)) { const v = def[field] && def[field][key]; if (v != null) m = agg === 'sum' ? m + v : Math.max(m, v); } return m; }
  addPower(p, key, name, text, fromAura) {
    const pw = { key, name, text }; p.powers.push(pw);
    const pd = this._rkCard; if (pd && pd.pwN) pw.upN = pd.pwN; else if (pd && pd.rk && pd.rank && pd.type === 'Power') { pw.rk = pd.rk; pw.rkMain = pd.rkMain || 1; }
    this.say('player', `${fromAura ? name + ' spreads to ' + p.name : this.who(p) + (this.partySize > 1 ? ' activates ' : ' activate ') + name}. (Power: lasts the whole fight.)`);
    const def = POWERS[key]; if (def && def.onPlay) { const was = this.player; this.player = p; this.rkPw(pw, () => def.onPlay(this, p, pw)); this.player = was; }
    if (!fromAura && key !== 'aura_mastery' && this.has(p, 'aura_mastery')) for (const a of this.allies()) if (a !== p) this.addPower(a, key, name, text, true);
  }
  // paying HP can kill you (Oct 31): the card still finishes, then you fall. Divine Intervention-style 'cannot fall' still holds at 1
  loseHp(p, n, label) { const b0 = p.hp; if (p.isPlayer && n > 0) p.fxLost = (p.fxLost || 0) + Math.min(n, p.hp); p.hp = (p.until && p.until.noDie) || this.hasTimed(p, 'noDie') ? Math.max(1, p.hp - n) : Math.max(0, p.hp - n); if (p.debtUser) p.bloodDebt += Math.round((b0 - p.hp) * (this.has(p, 'pay_in_blood') ? 1 + this.upN(p, 'pay_in_blood', 0, 50) / 100 : 1)); p.dmgRound += b0 - p.hp; this.say('player', `${this.who(p)} lose${this.partySize > 1 ? 's' : ''} ${n} HP (${label}). HP ${p.hp}/${p.maxHp}.`); this.fire(p, 'loseHp'); if (p.hp <= 0) { if (this._playing) this._pendingDeath = p; else this.onDeath(p); } }
  cleanse(p, n) { let left = n, removed = 0; for (const k of ['vulnerable', 'weak', 'bleed', 'poison', 'burn', 'dread', 'rot', 'slow', 'chill']) if (left > 0 && p[k]) { removed += p[k]; p[k] = 0; if (k === 'rot') p.rotQ = []; left--; } if (left > 0) p.disarmNext = false; this.say('player', removed ? `${this.who(p)}: debuffs removed.` : 'No debuffs to remove.'); this.fire(p, 'onCleanse', removed); }
  powerHit(p, e, n, label, dtype, kind) {
    const keep = [this._playing, this.player, this._rankMult, this._attackMult, this._skillMult, this._cmult];
    this._playing = { type: kind, dtype, tags: {}, name: label, isPower: true }; this.player = p; this._rankMult = this._rk; this._rk = this._pwRk || null; this._attackMult = 1; this._skillMult = 1; this._cmult = 1;
    this.hit(e, n, label);
    this._rk = this._rankMult; [this._playing, this.player, this._rankMult, this._attackMult, this._skillMult, this._cmult] = keep;
  }
  // ---- per-level card upgrades (Oct 31). rankedCard sets d.rk (multiplier per kind of number) and d.ms (milestone extras).
  // Damage, Block and healing scale where they are dealt; statuses, Strength, mana and the like scale on what the card added.
  rkm(k) { const r = this._rk; return r ? (r[k] || 1) * (r.all || 1) : 1; }
  rkBegin(rk) { const v = new Map(); for (const a of [...this.players, ...this.enemies]) { const o = {}; for (const f of RK_ALL) { const x = rkGet(a, f); o[f] = typeof x === 'number' ? x : 0; } v.set(a, o); } (this._rkSt || (this._rkSt = [])).push({ rk, v }); }
  rkEnd() {
    const st = this._rkSt || [], s = st.pop(); if (!s) return; const par = st[st.length - 1];
    for (const [a, o] of s.v) for (const f of RK_ALL) {
      const cur = rkGet(a, f); if (typeof cur !== 'number') continue; let dl = cur - o[f];
      if (dl > 0 && s.rk) { const m = (s.rk[RK_KIND[f]] || 1) * (s.rk.all || 1); if (m !== 1) { const x = RK_FLOAT[f] ? dl * m - dl : Math.round(dl * m) - dl; rkSet(a, f, cur + x); dl += x; } }
      if (par && par.v.has(a)) par.v.get(a)[f] += dl;
    }
  }
  upN(p, key, i, d) { const pw = p && p.powers && p.powers.find(x => x.key === key); return pw && pw.upN ? pw.upN[i] : d; } // an upgraded Power's numbers
  rkCount() { const d = this._rkCard; return d && !this._inPw && this._playing === d && d.ms && d.ms.count ? d.ms.count : 0; }
  rkRun(rk, fn) { if (!rk) return fn(); const keep = this._rk; this._rk = rk; this._inPw = (this._inPw || 0) + 1; this.rkBegin(rk); try { return fn(); } finally { this.rkEnd(); this._inPw--; this._rk = keep; } }
  rkPw(pw, fn) {
    if (!pw.rk && !(this._rkSt && this._rkSt.length)) return fn();
    const keep = [this._rk, this._pwRk]; this._rk = this._pwRk = pw.rk || null; this._inPw = (this._inPw || 0) + 1; this.rkBegin(this._rk);
    try { return fn(); } finally { this.rkEnd(); this._inPw--; [this._rk, this._pwRk] = keep; }
  }
  rkMilestones(p, d, dn0, tgt) {
    const ms = d.ms || {};
    if (ms.hits && this._rkHits && this._rkHits.length) { const first = new Map(); for (const [e, b, l] of this._rkHits) if (!first.has(e)) first.set(e, [b, l]); for (let k = 0; k < ms.hits; k++) for (const [e, [b, l]] of first) if (e.hp > 0 && !this.over) this.hit(e, b, l); }
    if (ms.turns && this._rkTimed) for (const t of this._rkTimed) t.turns += ms.turns;
    if (ms.count && this._rkAdded && this._rkAdded.length) for (let k = 0; k < ms.count; k++) this.addToHand(this._rkAdded[this._rkAdded.length - 1]);
    if (ms.draw) { if ((p.drawNext || 0) > dn0) { p.drawNext += ms.draw; this.say('player', `Upgrade: draw ${ms.draw} more next round.`); } else if (this._rkDraw || d.msFree) this.drawCards(p, ms.draw); }
    if (d.rkAfter) d.rkAfter(this, p, tgt);
  }
  mtr(a) { return this.meter[a.id] || (this.meter[a.id] = { id: a.id, name: a.name, isPlayer: !!a.isPlayer, cls: a.cls || null, dealt: {}, healed: {}, taken: {}, absorbed: 0 }); }
  say(kind, text) { this.log.push({ round: this.round, kind, text }); }
  foes() { return this.enemies.filter(e => e.hp > 0); } // monsters only
  // what the acting hero can hit: monsters, or in a duel the other hero (unless they are in Stealth and the card is single-target)
  alive() { return this.duel ? this.players.filter(p => p !== this.player && p.hp > 0) : this.foes(); }
  initiative(a) { return a.baseInit + (a.initNext || 0) - (a.slow || 0) - (a.chill || 0) + (a.isPlayer && a.powers.length ? this.pwSum(a, 'initPlus') : 0); }
  pressure() { if (this.opts.practice) return 0; return this.round >= PRESSURE_START ? (this.round - PRESSURE_START + 1) * PRESSURE_STEP * (this.duel ? 5 : 1) : 0; } // duels ramp 5x faster so they end
  card(c) { if (!c.rank) return C[c.key]; if (!c._v || c._v.rank !== c.rank) Object.defineProperty(c, '_v', { value: rankedCard(c.key, c.rank), enumerable: false, writable: true, configurable: true }); return c._v; } // cached off the JSON
  // card text with live numbers: damage and defense as they would land right now from this hero's stats, gear and active buffs
  // (before the target's own resistance, weakness, Vulnerable or Block). Changed numbers are wrapped \u0001n\u0002 (up) or \u0003n\u0004 (down).
  liveText(p, d, e) {
    if (!p || !p.isPlayer || !d || !d.text || d.type === 'Status' || d.type === 'Power') return d && d.text;
    const kind = d.type, pow = p.powers.length > 0, T = p.turn || {};
    const dmgMult = (dtype) => {
      if (T.attackDtype && kind === 'Attack') dtype = T.attackDtype;
      const stat = kind === 'Attack' ? p.strength + p.strTurn + p.strCombat : p.intelligence + (p.intTurn || 0);
      const setup = kind === 'Attack' ? (p.nextAttackMult || 1) : (d.tags && d.tags.dmg ? (p.nextSkillMult || 1) : 1);
      let m = (1 + stat / 100) * (1 + (p.elem[dtype] || 0) / 100) * (1 - Math.min(p.weak, 90) / 100) * setup * (T.nextMult || 1);
      if (pow) { try { m *= this.pwProd(p, 'cardMult', d); } catch (x) {} }
      if (e && e.hp > 0) { // aimed at a target: its weakness/resistance, Vulnerable, Condemnation and Unwarded too
        m *= this.typeMod(e, dtype) * (1 + (dtype !== 'Physical' ? 0 : 1) * Math.min(0.5, (e.vulnerable || 0) / 100) * (pow ? Math.max(1, ...this.pws(p).map(([, q]) => q.vulnX || 1)) : 1)); // the cap is shared; vulnX (Sunderer's talent, cards) multiplies after it // Nov 2: Vulnerable caps at +50%
        m *= (dtype === 'Holy' ? 1 + (e.condemn || 0) / 100 : 1) * (dtype !== 'Physical' ? (1 + (e.unwarded || 0) / 100) * (1 + Math.min(50, e.magicVuln || 0) / 100) : 1); // Magic Vulnerability caps at +50%
        if (e.isPlayer) m *= (1 - Math.min(75, e.resist[dtype] || 0) / 100) * (1 + this.pressure());
      }
      return m;
    };
    let flat = 0;
    if (kind === 'Attack') flat += (p.nextAttackFlat || 0) + (p.weaponDmg || 0) + (p.windUp ? Math.floor((d.cost || 0) / 5) * (+p.windUp) : 0);
    if (kind === 'Skill' && d.tags && d.tags.dmg) flat += T.skillFlat || 0;
    if (pow) { try { flat += this.pwSum(p, 'flat', d); } catch (x) {} }
    let shX = 1, shP = 0; if (pow && d.key === 'shuriken') { try { shP = this.pwSum(p, 'shurikenPlus'); shX = this.pwProd(p, 'shurikenX'); } catch (x) {} } // Shuriken Mastery / Sharpened Stars / Ninja show on the card
    const mark = (n0, n1) => n1 > n0 ? '\u0001' + n1 + '\u0002' : n1 < n0 ? '\u0003' + n1 + '\u0004' : String(n1);
    const EL = '(Fire|Frost|Arcane|Nature|Shadow|Holy|Physical)';
    let t = d.text.replace(new RegExp('\\b(\\d+)( ' + EL + ')? damage(?! back)', 'g'), (m, n, sp, el) => { const v = Math.max(0, Math.round(((+n + shP) * shX + flat) * dmgMult(el || d.dtype || 'Physical'))); return mark(+n, v) + (sp || '') + ' damage'; });
    t = t.replace(/\b([Dd]eal) (\d+) (instead|more)/g, (m, w, n, x) => `${w} ${mark(+n, Math.max(0, Math.round((+n + flat) * dmgMult(d.dtype || 'Physical'))))} ${x}`);
    let defM = 1 + (p.dexterity || 0) / 100; if (T.defX || this.hasTimed(p, 'defX')) defM *= 2;
    if (pow) { try { defM *= this.pwProd(p, 'defMult') * this.pwProd(p, 'defMultFn'); } catch (x) {} }
    for (const [st, W] of [['poison', 'Poison'], ['bleed', 'Bleed'], ['dread', 'Dread'], ['rot', 'Rot']]) if (new RegExp(W).test(t)) {
      let pm = (1 + (st === 'dread' || st === 'rot' ? p.intelligence + (p.intTurn || 0) : p.strength + p.strTurn + p.strCombat) / 100), pp = 0; // Nov 2: Spirit no longer boosts damage over time
      if (pow) { try { pm *= this.pwKey(p, 'dotMult', st); pp = this.pwKey(p, 'dotPlus', st, 'sum') || 0; } catch (x) {} }
      if (st === 'bleed' && p.bleedX) pm *= p.bleedX;
      t = t.replace(new RegExp('\\b(\\d+) ' + W + '\\b', 'g'), (m, n) => `${mark(+n, Math.round(+n * pm) + pp)} ${W}`);
    }
    t = t.replace(/\b([Gg]ains?) (\d+) (Block|Barrier|Dodge|Parry|Absorb)/g, (m, w, n, k) => `${w} ${mark(+n, Math.round(+n * defM))} ${k}`);
    return t;
  }
  addToHand(key) { const p = this.player; const c = { uid: 'c' + (this._uid++), key }; if (this._rkAdded && !this._inPw && this._playing === this._rkCard) this._rkAdded.push(key); if (p.hand.length >= 10) { p.discard.push(c); this.say('sys', `Hand full: ${C[key].name} went to the discard pile.`); this.fire(p, 'handFull'); } else p.hand.push(c); }
  statusCount() { const p = this.player; return [...p.drawPile, ...p.hand, ...p.discard].filter(c => C[c.key].type === 'Status').length; }

  drawCards(a, n) {
    if (a) { a._skips = 0; a._rbExtra = 0; }
    if (this._rkCard && !this._inPw && this._playing === this._rkCard && a === this.player) this._rkDraw += n;
    if (a.isPlayer && a.turn && a.turn.noDraw && this.phase === 'player' && this.current === a) { if (n > 0) this.say('sys', 'No more draws this turn.'); return; }
    for (let i = 0; i < n; i++) {
      if (a.drawPile.length === 0) {
        if (a.discard.length === 0) break;
        a.drawPile = shuffle(a.discard.splice(0), this.rng);
        if (a.isPlayer && this.opts.practice) a.reshuffles++; else if (a.isPlayer) { a.reshuffles++; a.drawPile.splice(Math.floor(this.rng() * (a.drawPile.length + 1)), 0, { uid: 'c' + (this._uid++), key: 'fatigue' }); this.say('sys', 'Deck reshuffled. A Fatigue card was shuffled in.'); }
      }
      const c = a.drawPile.pop();
      if (a.isPlayer && a.statusSkip && C[c.key].type === 'Status' && (a._skips || 0) < 5 && this.rng() * 100 < a.statusSkip) { a._skips = (a._skips || 0) + 1; a.discard.push(c); this.say('player', `${a.name} tosses aside ${C[c.key].name} and draws again.`); i--; continue; }
      if (a.hand.length >= 10) { a.discard.push(c); if (a.isPlayer) { this.say('sys', `Hand full: ${C[c.key].name} went to the discard pile.`); this.fire(a, 'handFull'); } }
      else { a.hand.push(c); if (!a.isPlayer && c.status) { this.eDrawn(a, c); if (this.raidBoss(a) && (a._rbExtra = (a._rbExtra || 0) + 1) <= 10) n++; } /* a raid boss draws past Stun cards */ if (a.isPlayer && C[c.key].type === 'Status') this.fire(a, 'drawStatus'); if (a.isPlayer && C[c.key].onDraw) { const was = this.player, od = this.card(c); this.player = a; this.say('player', `${od.name} is drawn.`); this.rkRun(od.rk, () => { runOps(this, null, C[c.key].onDraw, C[c.key].name); if (od.ms && od.ms.draw) this.drawCards(a, od.ms.draw); }); this.player = was; } }
    }
  }

  startRound() {
    this.round++;
    for (const q of this.players) q.dmgRound = 0; for (const e of this.enemies) e.lostRound = 0; this.allyLost = new Set();
    if (this.later.length) this.later = this.later.filter(x => { if (x.round > this.round) return true; const e = this.actorById(x.e), s = this.actorById(x.src); if (e && e.hp > 0 && !this.over) { this.applyHit(s, e, x.n, { label: x.label || 'Delayed Judgment' }); this.say('player', `${x.label || 'Delayed Judgment'} strikes ${e.name} for ${x.n}. HP ${e.hp}/${e.maxHp}.`); } return false; });
    if (this.over) return;
    this.say('round', `Round ${this.round}` + (this.pressure() ? ` (Pressure: ${this.duel ? 'every hit deals' : 'enemies deal'} +${Math.round(this.pressure() * 100)}%)` : ''));
    for (const p of this.alivePlayers()) {
      this.player = p; p.attackedThisRound = false;
      const n = Math.max(0, p.draw - p.drawLess + (p.drawNext || 0)); p.drawNext = 0;
      if (p.drawLess) this.say('enemy', `${this.who(p)} draw${this.partySize > 1 ? 's' : ''} ${p.drawLess} fewer card this round.`);
      p.drawLess = 0;
      this.drawCards(p, n);
    }
    for (const e of this.foes()) if (this.round === 1) this.drawCards(e, e.draw);
    if (this.raid) {
      this.order = [...this.alivePlayers(), ...this.foes()].map(a => a.id); this.turnIndex = -1;
      for (const e of this.foes()) this.planEnemy(e);
      this.raidPlayerPhase(); return;
    }
    const actors = [...this.alivePlayers(), ...this.foes()].map(a => ({ a, ini: this.initiative(a), tie: this.rng() }));
    actors.sort((x, y) => y.ini - x.ini || y.tie - x.tie);
    this.order = actors.map(x => x.a.id);
    this.turnIndex = -1;
    for (const e of this.foes()) this.planEnemy(e);
    this.say('sys', 'Turn order: ' + actors.map(x => `${x.a.isPlayer ? this.who(x.a) : x.a.name} (${x.ini})`).join(' > '));
    this.nextTurn();
  }

  effRegen(e) { const down = e.regenDown.reduce((s, x) => s + x.n, 0); return Math.max(Math.min(10, e.regen), e.regen - down); }
  // single-target enemy cards pick a hero when planned, so players can see who is about to be hit
  isTargeted(c) { const PO = ['damage', 'execute', 'damageBlock', 'debuff', 'stealMana', 'burnMana', 'drawLess', 'disarm', 'purge', 'shred', 'shredAll', 'tickBleed', 'status']; return !(c.ops.some(o => o.all || o.op === 'shredAll') || /every player|each of their/.test(c.text)) && c.ops.some(o => PO.includes(o.op)); }
  pickMark(e, avoid) {
    const seen = this.alivePlayers().filter(q => !q.stealth); if (!seen.length) return null; if (seen.length === 1) return seen[0];
    const w = seen.map(q => q.id === (avoid || e.lastMark) ? 1 : 2), tot = w.reduce((a, b) => a + b, 0);
    let r = this.rng() * tot; for (let i = 0; i < seen.length; i++) { if (r < w[i]) return seen[i]; r -= w[i]; } return seen[seen.length - 1];
  }
  // Nov 3: raid bosses can't be controlled or slowed. No Stun, Fear, Freeze, Disarm, Silence, Slow, Chill, Counterspell, draw loss or cost increases.
  // Mana can be burned, and Stun cards can sit in their hand, but they still play their attacks every turn.
  raidBoss(e) { return !!(this.raid && e && !e.isPlayer); }
  raidShrug(e) { if (!this.raidBoss(e)) return; e.frozen = false; e.disarmed = 0; e.silenced = 0; e.feared = 0; e.stunned = 0; e.slow = 0; e.chill = 0; e.counter = 0; e.costUp = 0; e.drawLess = 0; e.drawLessTurns = 0; e.exposure = 0; e.initNext = 0; }
  planEnemy(e, keepMarks) {
    if (e.isPlayer) return;
    const rb = this.raidBoss(e); if (rb) this.raidShrug(e);
    let mana = Math.min(e.maxMana, e.mana + this.effRegen(e) * (e.firstTurn ? 2 : 1));
    if (this.current === e && this.phase === 'enemy') mana = e.mana;
    e.plan = [];
    const allowed = (c) => c.cost < 999 && !(e.silenced && CB_intent(c) !== 'attack') && !(e.disarmed && CB_intent(c) === 'attack');
    const gm = c => c.ops.some(o => o.op === 'gainMana') ? 1 : 0;
    const order = [...e.hand].sort((a, b) => gm(b) - gm(a));
    for (const c of order) if (rb && c.cost < 999 && CB_intent(c) === 'attack') { mana = Math.max(0, mana - this.eCost(e, c)); e.plan.push(c.uid); } // a raid boss always plays its attacks
    else if (allowed(c) && this.eCost(e, c) <= mana) { mana -= this.eCost(e, c); e.plan.push(c.uid); const g = c.ops.find(o => o.op === 'gainMana'); if (g) mana += g.n; }
    const tq = this.taunting(); if (tq) { for (const uid of e.plan) { const c = e.hand.find(x => x.uid === uid); if (c && this.isTargeted(c)) c.mark = tq.id; } return; }
    if (keepMarks) { for (const uid of e.plan) { const c = e.hand.find(x => x.uid === uid); if (c && c.mark && !this.actorById(c.mark)) c.mark = null; } if (e.plan.every(uid => { const c = e.hand.find(x => x.uid === uid); return !c || !this.isTargeted(c) || c.mark; })) return; }
    if (this.partySize > 1) { let last = e.lastMark; for (const uid of e.plan) { const c = e.hand.find(x => x.uid === uid); if (c && this.isTargeted(c)) { const m = this.pickMark(e, last); c.mark = m ? m.id : null; last = c.mark; } } }
  }

  actorById(id) { return this.players.find(p => p.id === id) || this.enemies.find(e => e.id === id); }
  get current() { if (this.raid && this.phase === 'player') return this.player; return this.order ? this.actorById(this.order[this.turnIndex]) : null; }

  // ----- raids: every hero takes their turn at the same time; the boss acts when all have ended their turn
  raidPlayerPhase() {
    this.raidDone = new Set(); this.raidDebuffer = null; this.raidN = this.order.filter(id => this.actorById(id).isPlayer).length;
    this.phase = 'between'; this._raidStarting = true;
    for (const p of this.alivePlayers()) {
      this.player = p; this.beginTurn(p); if (this.over) { this._raidStarting = false; return; }
      if (p.hp <= 0) { this.raidDone.add(p.id); continue; }
      if (p.frozen) { p.frozen = false; this.say('crit', `${p.name} is Frozen and loses the turn.`); p.discard.push(...p.hand.splice(0)); if (p.chill) p.chill = 0; this.raidDone.add(p.id); }
    }
    this._raidStarting = false;
    this.player = this.alivePlayers().find(p => !this.raidDone.has(p.id)) || this.alivePlayers()[0] || this.players[0];
    this.phase = 'player';
    this.say('sys', 'Everyone plays at once. The boss acts when every hero has ended their turn.');
    this.raidCheck();
  }
  raidCheck() {
    if (!this.raid || this.phase !== 'player' || this.over || this._raidStarting) return;
    if (this.alivePlayers().every(p => this.raidDone.has(p.id))) { this.phase = 'between'; this.turnIndex = this.raidN - 1; this.nextTurn(); }
  }
  canAct(p) {
    if (!p || this.phase !== 'player' || this.over || p.hp <= 0) return false;
    return this.raid ? !this.raidDone.has(p.id) : this.current === p;
  }
  playAs(p, uid, targetId) { if (!this.canAct(p)) return false; this.player = p; return this.raidGuard(p, () => this.play(uid, targetId)); }
  endTurnAs(p) { if (!this.canAct(p)) return false; this.player = p; this.raidGuard(p, () => this.endPlayerTurn()); return true; }
  // raid bosses resist debuff stacking: only one hero a round can land non-damaging debuffs (Weak, Vulnerable, Slow, Chill, mana burn, discard, Silence...)
  raidGuard(p, fn) {
    if (!this.raid) return fn();
    const UP = ['weak', 'vulnerable', 'slow', 'chill', 'condemn', 'unwarded', 'exposure', 'magicVuln', 'costUp', 'counter', 'weakNext', 'noHealRound', 'grievous', 'drawLess', 'drawLessTurns'], ON = ['frozen', 'silenced', 'disarmed'];
    const snap = this.enemies.map(e => ({ v: Object.fromEntries([...UP, ...ON, 'strength', 'strTurn', 'mana'].map(k => [k, e[k]])), rd: JSON.parse(JSON.stringify(e.regenDown)), hand: e.hand.slice(), draw: e.drawPile.slice(), disc: e.discard.slice(), plan: e.plan.slice() }));
    const r = fn();
    this.enemies.forEach((e, i) => {
      const S = snap[i], rdSum = (l) => l.reduce((t, x) => t + x.n, 0);
      const worse = UP.filter(k => (e[k] || 0) > (S.v[k] || 0)), on = ON.filter(k => e[k] && !S.v[k]);
      const str = (e.strength < S.v.strength) || (e.strTurn < S.v.strTurn), mana = e.mana < S.v.mana, rd = rdSum(e.regenDown) > rdSum(S.rd), cards = e.hand.length < S.hand.length;
      if (!worse.length && !on.length && !str && !mana && !rd && !cards) return;
      if (!this.raidDebuffer || this.raidDebuffer === p.id) { if (!this.raidDebuffer) { this.raidDebuffer = p.id; this.say('sys', `${p.name} has the debuffs this round: only they can weaken ${e.name} until next round.`); } return; }
      for (const k of worse) e[k] = S.v[k]; for (const k of on) e[k] = S.v[k];
      if (str) { e.strength = S.v.strength; e.strTurn = S.v.strTurn; } if (mana) e.mana = S.v.mana; if (rd) e.regenDown = S.rd;
      if (cards) { e.hand = S.hand; e.drawPile = S.draw; e.discard = S.disc; e.plan = S.plan; }
      const who = this.actorById(this.raidDebuffer);
      this.say('enemy', `${e.name} resists ${p.name}'s debuffs: ${who ? who.name : 'another hero'} already weakened it this round.`);
    });
    return r;
  }

  nextTurn() {
    if (this.over) return;
    this.turnIndex++;
    while (this.turnIndex < this.order.length && this.actorById(this.order[this.turnIndex]).hp <= 0) this.turnIndex++;
    if (this.turnIndex >= this.order.length) { this.endRound(); return; }
    const a = this.current;
    if (a.isPlayer) this.player = a;
    this.beginTurn(a);
    if (this.over) return;
    if (a.hp <= 0) { this.nextTurn(); return; }
    if (a.isPlayer && a.frozen) { a.frozen = false; this.say('crit', `${a.name} is Frozen and loses the turn.`); a.discard.push(...a.hand.splice(0)); if (a.chill) a.chill = 0; this.nextTurn(); return; }
    if (!a.isPlayer && a.frozen && this.raidBoss(a)) { a.frozen = false; this.say('enemy', `${a.name} shrugs off the Freeze: raid bosses can't be stopped.`); }
    if (!a.isPlayer && a.frozen) { a.frozen = false; this.say('enemy', `${a.name} is Frozen and loses its turn.`); a.plan = []; a.discard.push(...a.hand.splice(0)); this.drawCards(a, a.draw); this.planEnemy(a); this.nextTurn(); return; }
    this.phase = a.isPlayer ? 'player' : 'enemy';
  }

  beginTurn(a) {
    if (!a.isPlayer && this.opts.blockReset !== 'none' && a.block) { a.block = 0; a.parryBack = 0; }
    if (a.isPlayer && this.opts.blockReset === 'all' && a.block) { this.say('player', `Your ${a.block} ${a.defName} fades.`); a.block = 0; }
    if (a.isPlayer && this.opts.blockReset === 'decay' && a.block && !(a.until.keepBlock || this.hasTimed(a, 'keepBlock'))) { const hold = this.has(a, 'codex_bulwark') || this.has(a, 'codex_riposte') || this.has(a, 'codex_barrier_savant'); const kept = Math.floor(a.block * (hold ? 0.8 : 0.5)); this.say('player', `${hold ? '20% of ' + (this.partySize > 1 ? a.name + "'s" : 'your') : this.partySize > 1 ? 'Half of ' + a.name + "'s" : 'Half your'} ${a.defName} fades: ${a.block} -> ${kept}.`); a.block = kept; } // Nov 2: Bulwark, Riposte and Barrier Savant keep 80%
    if (a.isPlayer && a.regenDown.length) { for (const r of a.regenDown) r.turns--; }
    const regen = a.isPlayer ? Math.max(0, a.regen - a.regenDown.reduce((s, x) => s + x.n, 0)) : this.effRegen(a);
    if (a.isPlayer) a.regenDown = a.regenDown.filter(r => r.turns > 0);
    const extra = a.isPlayer ? a.manaNext : 0;
    const gain = (a.isPlayer && a.noRegenTurns > 0 ? 0 : Math.round(regen * (a.isPlayer && a.regenX ? a.regenX : 1))) * (a.firstTurn ? 2 : 1) + extra;
    if (a.isPlayer && a.noRegenTurns > 0) this.say('player', `${this.who(a)} regenerate${this.partySize > 1 ? 's' : ''} no mana this turn.`);
    const before = a.mana;
    a.mana = a.isPlayer && this.has(a, 'mana_shell') ? a.mana + gain : a.isPlayer ? Math.max(a.mana, Math.min(a.maxMana + extra, a.mana + gain)) : Math.min(a.maxMana + extra, a.mana + gain); // Nov 3: mana above max (Overcharge, Arcane Reservoir) is kept
    a.firstTurn = false;
    if (a.isPlayer) {
      this.say('player', `${this.partySize > 1 ? a.name + "'s" : 'Your'} turn. Mana ${before} + ${gain}${extra ? ' (incl. Mana Spring)' : ''} = ${a.mana} / ${a.maxMana}.`);
      a.manaNext = 0; a.locked = false; a.negateDebuff = false; this.wardCheck(a); a.parriedLast = !!a.parryFlag; a.parryFlag = false; // Nov 2: 'if you parried last turn' // Nov 2: Stealth no longer ends at the start of your turn, only when you attack out of it
      if (this.has(a, 'codex_bloodmancer') && a.mana > 0) { const m = a.mana; a.mana = 0; this.say('player', `Bloodmancer: ${m} mana turns into healing.`); this.heal(a, Math.floor(m / 3), 'Blood Magic'); }
      a.disarmed = a.disarmNext; a.disarmNext = false;
      if (a.disarmed) this.say('enemy', 'You are Disarmed: you cannot play Attacks this turn.');
      if (a.defNext) { this.gainDef(a.defNext, 'delayed'); a.defNext = 0; }
      if (a.recovery && a.hp < a.maxHp) this.heal(a, a.recovery, 'Recovery', true);
      a.turnAttacks = 0; a.turnSkills = 0; a.turnElems = []; a.turn = {};
      if (a.until.grudge) { for (const [eid, n] of Object.entries(a.until.grudge)) { const e = this.actorById(eid); if (e && e.hp > 0) { const s2 = this.drainMana(e, n); this.say('player', `Grudge: ${e.name} loses ${s2} mana.`); } } }
      if (a.until.stored) { this.gainDef(a.until.stored); this.say('player', 'Stored Impact turns into protection.'); }
      a.until = a.until.storeNext ? { storing: true } : {};
      this.tickTimed(a);
      if (a.noRegenTurns > 0) a.noRegenTurns--;
      if (a.hot.length) { const n = a.hot.reduce((s, x) => s + x.n, 0); this._hot = true; this.heal(a, n, 'Grace Eternal'); this._hot = false; for (const x of a.hot) x.turns--; a.hot = a.hot.filter(x => x.turns > 0); }
      this.fire(a, 'turnStart');
    } else {
      for (const r of a.regenDown) r.turns--; a.regenDown = a.regenDown.filter(r => r.turns > 0);
      if (a.thornsTurns > 0 && --a.thornsTurns === 0) a.thorns = 0;
    }
    for (const [key, label, ignoresBlock] of [['bleed', 'Bleed', false], ['poison', 'Poison', true], ['burn', 'Burn', false], ['dread', 'Dread', true]]) {
      const src = this.actorById(a[key + 'By']), ticks = src && src.isPlayer ? this.pwKey(src, 'dotTicks', key) : 1;
      const immune = a.isPlayer && ((key === 'bleed' && this.hasTimed(a, 'noBleed')) || (a.until.immuneTypes && a.until.immuneTypes.includes(key === 'burn' ? 'Fire' : key === 'poison' ? 'Poison' : key === 'dread' ? 'Shadow' : 'Bleed')) || a.until.immune);
      const blockable = key === 'poison' && a.isPlayer && this.hasTimed(a, 'poisonBlock');
      for (let k = 0; k < ticks; k++) if (a[key] > 0 && a.hp > 0 && !this.over) { if (immune) this.say('player', `${a.name} ignores the ${label}.`); else { const dc = this.dotCritRoll(src, key, key === 'dread' && src && src.isPlayer ? Math.round(a[key] * this.pwProd(src, 'dreadTickX')) : a[key]); this.applyHit(src || (a.isPlayer ? null : this.player), a, dc.n, { isDot: true, label: label + (k ? ' (again)' : '') + (dc.crit ? ' (crit!)' : ''), ignoreBlock: ignoresBlock && !blockable }); } if (key === 'burn') a[key] = Math.max(0, a[key] - 1); }
      // Nov 3: Bleed, Poison and Dread lose 10% of their stacks (at least 1) once a turn, after ticking, so they can't stack without limit
      if (key !== 'burn' && a[key] > 0) a[key] = Math.max(0, a[key] - Math.max(1, Math.ceil(a[key] * 0.1)));
    }
    if (a.rotQ && a.rotQ.length && a.hp > 0 && !this.over) { // Rot: every application deals its share this turn
      let n = 0; for (const r of a.rotQ) { const t = Math.round(r.left / r.turns); n += t; r.left -= t; r.turns--; }
      a.rotQ = a.rotQ.filter(r => r.turns > 0 && r.left > 0); a.rot = a.rotQ.reduce((s, r) => s + r.left, 0);
      const src = this.actorById(a.rotBy), dc = this.dotCritRoll(src, 'rot', n);
      if (n > 0) this.applyHit(src || (a.isPlayer ? null : this.player), a, dc.n, { isDot: true, label: 'Rot' + (dc.crit ? ' (crit!)' : ''), ignoreBlock: true });
    }
    if (a.initNext) a.initNext = 0;
  }

  gainDef(n, label) {
    const p = this.player; { const m = this.rkm('def'); if (m !== 1) n = Math.round(n * m); }
    if (p.isPlayer && (p.turn.defX || this.hasTimed(p, 'defX'))) n *= 2;
    if (p.isPlayer && p.powers.length) { n = Math.round(n * this.pwProd(p, 'defMult') * this.pwProd(p, 'defMultFn')); if (n === 0 && this.has(p, 'codex_equilibrium')) { this.say('player', 'Equilibrium: no Block.'); return 0; } }
    if (p.isPlayer && this.has(p, 'balanced_guard')) { if (p.balNext) { const bg = this.upN(p, 'balanced_guard', 0, 50); n = Math.round(n * (1 + bg / 100)); p.balNext = false; this.say('player', `Balanced Guard: +${bg}%.`); } else p.balNext = true; }
    if (p.isPlayer && this.has(p, 'mana_shell')) { const v = Math.round(n * (1 + p.dexterity / 100)); p.mana += v; this.say('player', `Mana Shell: +${v} mana instead of ${p.defName}.`); return v; }
    const mult = 1 + p.dexterity / 100; const v = Math.round(n * mult);
    p.block += v;
    if (p.isPlayer && v > 0) { p.turn.defGained = (p.turn.defGained || 0) + v; if (p.turn.spikedWard) this.wardThorns(p, Math.round(v * 0.5)); }
    if (v > 0) { this.fxPush({ t: 'block', d: p.id, n: v }); if (p.isPlayer) p.fxDef = (p.fxDef || 0) + v; }
    this.say('player', `${this.partySize > 1 ? p.name + ' gains' : 'You gain'} ${v} ${p.defName}` + (p.dexterity ? ` (${n} x ${mult.toFixed(2)} Dexterity)` : '') + (label === 'delayed' ? ' from last turn' : '') + `. ${p.defName} ${p.block}.`);
    return v;
  }
  heal(a, n, label, quiet) {
    if (n <= 0) return 0;
    if (a.isPlayer && !['Bloodthirst', 'Lifesteal'].includes(label)) { const m = this.rkm('heal'); if (m !== 1) n = Math.round(n * m); }
    if (a.isPlayer && this._playing && !this._inPw && HEAL_FLAT[this._playing.key] && !['Bloodthirst', 'Lifesteal'].includes(label)) n += HEAL_FLAT[this._playing.key]; // Nov 3: flat early-game heal boost
    if (a.isPlayer && a.healIn) n = Math.round(n * (1 + a.healIn / 100)); // talent: healing received
    const caster = a.isPlayer && this._playing && this.player && this.player.isPlayer ? this.player : a;
    const mult = a.isPlayer ? 1 + (a.spirit || 0) / 100 : 1; // Nov 3: Spirit is healing RECEIVED, from every source (yours, allies', Recovery, Lifesteal...)
    if (!a.isPlayer && a.noHealRound >= this.round) { this.say('player', `${a.name} cannot heal.`); return 0; }
    if (!a.isPlayer && a.grievous > 0) n = Math.round(n * 0.5);
    if (caster.isPlayer && caster.powers && caster.powers.length) n = Math.round(n * this.pwProd(caster, 'healMult'));
    if (caster.isPlayer && caster.turn && caster.turn.healX && !this._hot) { n *= caster.turn.healX; caster.turn.healX = 0; }
    const want = Math.round(n * mult), h = Math.min(a.maxHp - a.hp, want);
    let flowed = false; if (want > h && caster.turn && caster.turn.overflow) { const extra = want - h; caster.turn.overflow = false; this.defFor(a, extra); flowed = true; }
    if (want > h && !flowed && a.isPlayer && a.cls === 'Warlock' && a.hp > 0) { const x = want - h; a.block += x; this.say('heal', `${this.partySize > 1 ? a.name + "'s" : 'Your'} overhealing becomes ${x} Absorb (${a.block}).`); }
    a.hp += h; if (a.isPlayer) { this.stats.healed += h; if (h > 0) a.fxHealed = (a.fxHealed || 0) + h; }
    if (h > 0 && caster.isPlayer) this.fire(caster, 'onHeal', a, h);
    if (h > 0 && !quiet) this.fxPush({ t: 'heal', d: a.id, n: h });
    if (h > 0) { const m = this.mtr(caster).healed, k = (label || 'Heal') + (caster !== a ? ' on ' + a.name : ''); m[k] = (m[k] || 0) + h; }
    if (h > 0 || !quiet) this.say('heal', `${a.isPlayer ? (this.partySize > 1 ? a.name + ' heals' : 'You heal') : a.name + ' heals'} ${h}${label ? ' (' + label + ')' : ''}. HP ${a.hp}/${a.maxHp}.`);
    return h;
  }
  applyDot(e, key, n) {
    if (!e || e.hp <= 0) return;
    const q = this.player, strMult = (key === 'poison' || key === 'bleed') && q.isPlayer ? 1 + (q.strength + q.strTurn + q.strCombat) / 100 : (key === 'dread' || key === 'rot') && q.isPlayer ? 1 + (q.intelligence + (q.intTurn || 0)) / 100 : 1; // Nov 1: Poison and Bleed scale with Strength (50 Strength: 10 Bleed becomes 15); the Warlock's Dread and Rot with Intelligence
    const v = Math.round(n * strMult * (key === 'dread' ? 0.7 : 1) * this.pwKey(this.player, 'dotMult', key) * (key === 'bleed' && this.player.bleedX ? this.player.bleedX : 1)) + this.pwKey(this.player, 'dotPlus', key, 'sum');
    if (key === 'rot') { this.fxPush({ t: 'apply', d: e.id, key: 'rot' }); const before = e.rot || 0, w = Math.round(v * this.rkm('rot')); this.addRot(e, w, 4, this.player); if (this.player.isPlayer && this.player.powers.length) this.fire(this.player, 'applyDot', e, key, w, before); this.say('player', `${e.name} gains ${w} Rot over 4 turns (Rot ${e.rot}).`); return; }
    const before = e[key] || 0; e[key] = before + v; e[key + 'By'] = this.player.id; this.fxPush({ t: 'apply', d: e.id, key });
    if (this.player.isPlayer && this.player.powers.length) this.fire(this.player, 'applyDot', e, key, v, before);
    this.say('player', `${e.name} gains ${v} ${key[0].toUpperCase() + key.slice(1)} (now ${e[key]}).`);
  }
  applyChill(e, n) {
    if (!e || e.hp <= 0) return;
    e.chill += n;
    if (e.chill >= 10) { e.chill = 0; e.frozen = true; this.say('crit', `${e.name} is Frozen and will lose its next turn!`); }
    else this.say('player', `${e.name} is Chilled ${e.chill} (-${e.chill} Initiative; Freezes at 10).`);
  }

  applyHit(src, tgt, amount, o) {
    o = o || {};
    if (o.isDot && this.raid && tgt && !tgt.isPlayer) amount = Math.round(amount * (1 - RAID.dotResist)); // raid bosses shrug off a quarter of Bleed/Poison/Burn
    let dmg = amount, absorbed = 0;
    if (tgt.block > 0 && !o.ignoreBlock) { absorbed = Math.min(tgt.block, dmg); tgt.block -= absorbed; dmg -= absorbed; }
    if (tgt.isPlayer && dmg > 0 && tgt.mana > 0 && tgt.powers && tgt.powers.some(x => x.key === 'mana_shell')) { const m = Math.min(tgt.mana, dmg); tgt.mana -= m; dmg -= m; absorbed += m; }
    const before = tgt.hp;
    if (tgt.isPlayer && dmg > 0 && src !== tgt) tgt.hurtFight = true; // Battle Fever
    if (tgt.isPlayer && dmg > 0) tgt.fxLost = (tgt.fxLost || 0) + Math.min(dmg, tgt.hp); tgt.hp = Math.max(0, tgt.hp - dmg);
    if (!tgt.isPlayer && tgt.feared && amount > 0 && tgt.hp > 0 && this.rng() < (o.isDot ? FEAR_BREAK_DOT : FEAR_BREAK)) this.breakFear(tgt);
    if (tgt.isPlayer && tgt.hp <= 0 && (tgt.until.noDie || this.hasTimed(tgt, 'noDie'))) { tgt.hp = 1; this.say('heal', `${tgt.name} refuses to fall (Divine Intervention).`); }
    if (tgt.isPlayer && before > tgt.hp) { const lostHp = before - tgt.hp; tgt.dmgRound += lostHp; this.allyLost && this.allyLost.add(tgt.id); if (tgt.debtUser) tgt.bloodDebt += Math.round(lostHp * (this.has(tgt, 'pay_in_blood') ? 1 + this.upN(tgt, 'pay_in_blood', 0, 50) / 100 : 1)); if (tgt.until.storing) tgt.until.stored = (tgt.until.stored || 0) + lostHp; if (tgt.until.grudge && src && !src.isPlayer) tgt.until.grudge[src.id] = (tgt.until.grudge[src.id] || 0) + lostHp; }
    const real = before - tgt.hp, label = o.label || 'Attack';
    if (src) { const m = this.mtr(src).dealt; m[label] = (m[label] || 0) + real; }
    { const t = this.mtr(tgt); const k = src ? src.name : label; t.taken[k] = (t.taken[k] || 0) + real; t.absorbed += absorbed; }
    if (tgt.isPlayer) { this.stats.taken += dmg; this.stats.blocked += absorbed; } else this.stats.dealt += dmg;
    if (o.isDot && src && src.isPlayer && src.hp > 0 && !tgt.isPlayer && real > 0) this.dotHeal(src, tgt, real);
    if (o.crit || (o.label && /crit!/.test(o.label))) tgt.critN = (tgt.critN || 0) + 1; // the screen shows this hit's number in red
    this.fxPush({ t: 'hit', s: src ? src.id : null, d: tgt.id, dot: o.isDot ? (String(o.label || '').match(/Bleed|Poison|Burn|Dread|Rot|Chill/) || [''])[0].toLowerCase() || 'dot' : null, dtype: o.dtype || null, kind: o.kind || null, card: o.card || null, crit: !!(o.crit || (o.label && /crit!/.test(o.label))), lost: real, abs: absorbed, lbl: o.label || '' }); // Nov 1: damage over time counts as damage you deal (Soulbinder, Lifesteal, Soul Beacon)
    if (o.isDot) this.say('dot', `${tgt.isPlayer ? 'You take' : tgt.name + ' takes'} ${amount} ${o.label}` + (absorbed ? ` (${absorbed} absorbed)` : '') + `. HP ${tgt.hp}/${tgt.maxHp}.`);
    if (tgt.hp <= 0 && !o.defer) this.onDeath(tgt);
    return { lost: dmg, absorbed };
  }

  onDeath(a) {
    if (this.over) return;
    if (a.isPlayer) {
      if (a.dead) return;
      { const tp = a.powers.find(x => x.def && x.def.cheat && !x.cheatUsed); if (tp) { tp.cheatUsed = true; const [n, mode] = tp.def.cheat; a.hp = 1; const was = this.player; this.player = a; if (mode === 'heal') this.heal(a, Math.round(a.maxHp * n / 100), tp.def.label); else this.gainDef(n); this.player = was; this.say('crit', `${tp.def.label}: ${a.name} refuses to fall!`); return; } }
      a.dead = true; a.block = 0; a.bleed = 0; if (a.demons && a.demons.length) { this.say('player', `${a.name}'s demons vanish.`); a.demons = []; } a.discard.push(...a.hand.splice(0));
      if (this.duel) { this.winner = this.alivePlayers()[0] || null; this.say('win', `${a.name} falls. ${this.winner ? this.winner.name + ' wins the duel' : 'The duel is a draw'} in ${this.round} round${this.round > 1 ? 's' : ''}.`); this.over = 'duel'; this.phase = 'over'; return; }
      if (!this.alivePlayers().length) { this.say('loss', this.partySize > 1 ? 'The whole party falls.' : 'You fall.'); this.over = 'loss'; this.phase = 'over'; return; }
      this.say('loss', `${a.name} falls! The rest of the party fights on.`);
      if (this.raid) { if (this.raidDone) this.raidDone.add(a.id); this.raidCheck(); return; }
      if (this.current === a && this.phase === 'player') { this.phase = 'between'; this.nextTurn(); }
      return;
    }
    if (a._dead) return; a._dead = true;
    { const q = this.current; if (q && q.isPlayer && q.turn && q.turn.killMana) { q.mana += q.turn.killMana; this.say('player', `${a.name} died: ${q.name} gains ${q.turn.killMana} mana.`); q.turn.killMana = 0; } }
    { const q = this.current; if (q && q.isPlayer && !q.dead && q.powers.length) this.fire(q, 'onKill', a); }
    a.bleed = a.poison = a.burn = a.dread = a.rot = 0; a.rotQ = []; a.block = 0;
    this.say('kill', `${a.name} dies.`);
    if (this.foes().length === 0) { this.say('win', `Victory in ${this.round} round${this.round > 1 ? 's' : ''}.`); this.over = 'win'; this.phase = 'over'; }
  }

  typeMod(e, dtype) {
    if (dtype === 'Holy') return 1;
    let m = 1;
    if (e.type === dtype) m *= 1 - this.typeResist;
    if (e.weakTo === dtype) m *= 1.25;
    return m;
  }

  hit(e, base, label) {
    const p = this.player, cd = this._playing;
    if (p && p.isPlayer) p._devHit = 0;
    if (!e || e.hp <= 0) return 0;
    if (this._rkHits && !this._inPw && cd === this._rkCard) this._rkHits.push([e, base, label]);
    { const m = this.rkm('dmg'); if (m !== 1) base = Math.round(base * m); }
    if (p.isPlayer && cd && !cd.isPower && !this._inPw && CARD_FLAT[cd.key]) base += CARD_FLAT[cd.key]; // Nov 3: flat early-game boost on slow decks' cards
    const kind = cd ? cd.type : 'Attack'; let dtype = (cd && cd.dtype) || 'Physical';
    const pow = p.isPlayer && p.powers.length > 0, ctx = { kind, dtype, d: cd };
    if (pow) {
      for (const [, def] of this.pws(p)) if (def.dtype && def.dtype[dtype]) dtype = ctx.dtype = def.dtype[dtype];
      if (cd && !cd.isPower) base += this.pwSum(p, 'flat', cd);
      if (cd && cd.key === 'shuriken') base = Math.round((base + this.pwSum(p, 'shurikenPlus')) * this.pwProd(p, 'shurikenX'));
    }
    if (kind === 'Attack' && cd && !cd.isPower && p.nextAttackFlat) base += p.nextAttackFlat;
    if (kind === 'Attack' && cd && !cd.isPower && p.isPlayer && p.weaponDmg) base += p.weaponDmg;
    if (p.isPlayer && p.turn) {
      if (kind === 'Attack' && p.turn.attackDtype && cd && !cd.isPower) dtype = ctx.dtype = p.turn.attackDtype;
      if (kind === 'Attack' && p.windUp && cd && !cd.isPower) base += Math.floor((cd.cost || 0) / 5) * (+p.windUp);
      if (kind === 'Skill' && cd && !cd.isPower && cd.tags && cd.tags.dmg && p.turn.skillFlat) base += p.turn.skillFlat;
      const dw = this.has(p, 'codex_divine_wrath');
      if (cd && !cd.isPower && cd.dtype === 'Holy' && p.devotion > 0) { // Nov 3: only Holy cards spend Devotion const per = cd.devotionPer || (dw ? 3 : 2); base += p.devotion * per; this.say('player', `${p.devotion} Devotion: +${p.devotion * per} Holy damage.`); p._devHit = p.devotion;
        if (dw) { p.devSpent = (p.devSpent || 0) + p.devotion; while (p.devSpent >= 5) { p.devSpent -= 5; this.heal(p, Math.round(p.maxHp * 0.1), 'Divine Wrath'); } } // Nov 2: every 5 Devotion spent heals 10% max HP
        p.devotion = 0; }
    }
    const stat = (kind === 'Attack' ? p.strength + p.strTurn + p.strCombat : p.intelligence + (p.intTurn || 0)) + (pow ? this.pwSum(p, 'statPlus', e, ctx) : 0);
    const elem = p.elem[dtype] || 0;
    const crit = this.rng() * 100 < p.crit + (pow ? this.pwSum(p, 'crit', cd) : 0) + (p.turn && p.turn.critPlus || 0); this._lastCrit = crit;
    const tm = this.typeMod(e, dtype);
    const weakMod = 1 - Math.min(p.weak, 90) / 100, vulnMod = 1 + (dtype !== 'Physical' ? 0 : 1) * Math.min(0.5, e.vulnerable / 100) * (pow ? Math.max(1, ...this.pws(p).map(([, d]) => d.vulnX || 1)) : 1); // Nov 2: Vulnerable caps at +50%
    const holyUp = dtype === 'Holy' && p.nextHolyMult > 1 ? p.nextHolyMult : 1; if (holyUp > 1) p.nextHolyMult = 1;
    const curse = (dtype === 'Holy' ? 1 + (e.condemn || 0) / 100 : 1) * (dtype !== 'Physical' ? (1 + (e.unwarded || 0) / 100) * (1 + Math.min(50, e.magicVuln || 0) / 100) : 1); // Magic Vulnerability caps at +50%
    const pm = (pow ? this.pwProd(p, 'hitMult', e, ctx) : 1) * (this._cmult || 1) * holyUp * curse * (crit && p.turn && p.turn.killingBlow ? (p.turn.killingBlow === true ? 2 : p.turn.killingBlow) : 1), cmx = pow ? this.pwProd(p, 'critMultX') : 1;
    if (crit && p.turn && p.turn.killingBlow) { p.turn.killingBlow = false; this.say('crit', 'Killing Blow: the crit hits harder.'); }
    const pvp = e.isPlayer ? (1 - Math.min(75, e.resist[dtype] || 0) / 100) * (1 + this.pressure()) : 1;
    const setup = kind === 'Attack' ? (this._attackMult || 1) : (this._skillMult || 1);
    const dmg = Math.max(0, Math.round(base * (1 + stat / 100) * (1 + elem / 100) * weakMod * (crit ? p.critMult * cmx : 1) * tm * vulnMod * setup * pvp * pm));
    const parts = [`${base}`];
    if (stat) parts.push(`x ${(1 + stat / 100).toFixed(2)} ${kind === 'Attack' ? 'Strength' : 'Intelligence'}`);
    if (elem) parts.push(`x ${(1 + elem / 100).toFixed(2)} ${dtype} bonus`);
    if (setup !== 1) parts.push(`x ${setup} ${kind === 'Attack' ? 'Assassinate' : 'Amplify'}`);
    if (p.weak) parts.push(`x ${weakMod.toFixed(2)} Weak`);
    if (crit) parts.push(`x ${p.critMult.toFixed(2)} CRIT`);
    if (tm !== 1) parts.push(`x ${tm.toFixed(2)} ${tm > 1 ? dtype + ' weakness' : dtype + ' resist'}`);
    if (e.vulnerable && vulnMod > 1) parts.push(`x ${vulnMod.toFixed(2)} Vulnerable`);
    if (pvp !== 1) parts.push(`x ${pvp.toFixed(2)} resist/Pressure`);
    if (pm !== 1) parts.push(`x ${pm.toFixed(2)} Powers`);
    const ign = (kind === 'Skill' && p.turn && p.turn.pierce) ? e.block : kind === 'Attack' && pow ? Math.floor(e.block * Math.min(1, Math.max(0, ...this.pws(p).map(([pw, d]) => d.ignoreBlock ? (pw.upN ? pw.upN[0] / 100 : d.ignoreBlock) : 0)))) : 0; e.block -= ign;
    const r = this.applyHit(p, e, dmg, { defer: true, label, crit, dtype, kind, card: cd && cd.key }); e.block += ign;
    if (pow) this.fire(p, 'dealt', { e, lost: r.lost, absorbed: r.absorbed, kind, dtype, d: cd, crit });
    if (pow && !e.isPlayer) { const dd = this.pwSum(p, 'dealtDef'); if (dd > 0) { const n = Math.round((r.lost + r.absorbed) * dd / 100); if (n > 0) { p.block += n; this.say('player', `+${n} ${p.defName} from the hit.`); } } } // Nov 2: Colossus Iron Momentum
    if (e.beacon && r.lost > 0 && !e.isPlayer) { const by = this.actorById(e.beacon.by), n = Math.round(r.lost * e.beacon.pct / 100 * (by && by.powers.length ? this.pwProd(by, 'beaconX') : 1)); if (n > 0) for (const a of this.allies()) this.heal(a, n, 'Soul Beacon', true); }
    this._lastLost = r.lost;
    if (p.isPlayer && p.turn && r.lost > 0) {
      const T = p.turn;
      if (kind === 'Attack' && T.lifesteal) this.heal(p, Math.round(r.lost * T.lifesteal), 'Seal of Light', true);
      if (T.siphon) this.drainMana(e, Math.round(r.lost * (T.siphon === true ? 1 : T.siphon)));
      if (kind === 'Attack' && T.perfectGuard) this.gainDef(r.lost);
      if (dtype === 'Holy' && T.kindled) { T.kindled = false; e.burn += Math.round(r.lost * 0.5); e.burnBy = p.id; this.say('player', `Kindled Faith: ${e.name} gains ${Math.round(r.lost * 0.5)} Burn.`); }
      if (kind === 'Attack' && T.coated) { T.coated = false; const q = Math.max(1, Math.round(r.lost * (T.coated === true ? 0.25 : T.coated))); e.bleed += q; e.poison += q; e.bleedBy = e.poisonBy = p.id; this.say('player', `Coated Blade: ${q} Bleed and ${q} Poison.`); }
      if (kind === 'Attack' && !r.absorbed && p.timed) { const rl = p.timed.find(x => x.key === 'relentless'); if (rl) e.vulnerable += rl.n || 1; }
      if (e.deathmark && e.deathmark.by === p.id) e.deathmark.dmg += r.lost;
    }
    if (p.isPlayer && kind === 'Attack' && cd && !cd.isPower && e.markDraw === this.round && !(p.markDrawn || {})[e.id + ':' + this.round]) { (p.markDrawn = p.markDrawn || {})[e.id + ':' + this.round] = true; this.drawCards(p, e.markDrawN || 1); }
    this.say(crit ? 'crit' : 'player', `${label} hits ${e.name}: ${parts.join(' ')} = ${dmg}` + (r.absorbed ? `, ${r.absorbed} blocked` : '') + `. HP ${e.hp}/${e.maxHp}.`);
    if (kind === 'Attack' && e.parryBack && r.absorbed && e.hp > 0) { const back = this.applyHit(e, p, Math.round(e.parryBack * this.dmgMult), { defer: true, label: 'Riposte' }); this.say('enemy', `${e.name} parries and strikes back: ${back.lost} HP lost.`); e.parryBack = 0; }
    if (kind === 'Attack' && e.thorns && e.hp > 0) { const t = this.applyHit(e, p, e.thorns, { defer: true, label: e.isPlayer ? 'Thorns' : 'Spikes' }); this.say('enemy', `${e.name}'s ${e.isPlayer ? 'Thorns' : 'spikes'}: ${this.who(p)} lose${this.partySize > 1 ? 's' : ''} ${t.lost} HP.`); }
    if (p.isPlayer && p.slowChance && e.hp > 0 && this.rng() * 100 < p.slowChance) { e.slow = (e.slow || 0) + 2; this.say('player', `${e.name} is slowed (2 Slow).`); }
    if (p.isPlayer && p.tauntChance && e.hp > 0 && !e.isPlayer && this.rng() * 100 < p.tauntChance) { this.setTaunt(p); this.say('player', `${e.name} is taunted by ${p.name}.`); }
    if (kind === 'Attack' && p.bleedChance && e.hp > 0 && this.rng() * 100 < p.bleedChance) { e.bleed += 3; e.bleedBy = p.id; this.say('crit', `Bleed Chance: ${e.name} gains 3 Bleed.`); }
    if (p.lifesteal && r.lost) this.heal(p, Math.round(r.lost * p.lifesteal / 100), 'Lifesteal', true);
    if (p.hp <= 0) { this.onDeath(p); return r.lost; }
    if (e.hp <= 0) this.onDeath(e);
    return r.lost;
  }

  enemyHit(e, base, label, dtype, extra) {
    let p = this.player;
    const guard = this.alivePlayers().find(q => q !== p && q.until.guarding === p.id);
    if (guard) { guard.until.guarding = null; this.say('player', `${guard.name} steps in and takes the hit meant for ${p.name}.`); p = this.player = guard; }
    if (p.until.immune) { this.say('player', `${p.name} is untouchable: ${label} does nothing.`); return 0; }
    if (this.hasTimed(p, 'mirror') && p.until.mirrorUsed !== this.round) { p.until.mirrorUsed = this.round; this.say('player', `A mirror image takes ${e.name}'s ${label}.`); return 0; }
    if (p.until.convertNext) { dtype = p.until.convertNext; p.until.convertNext = null; } else if (p.until.convert) dtype = p.until.convert;
    if (p.until.immuneTypes && p.until.immuneTypes.includes(dtype)) { this.say('player', `${p.name} takes no ${dtype} damage.`); return 0; }
    for (const f of (p.until.nextAttacker || []).splice(0)) f(this, p, e);
    const str = e.strength + e.strTurn, press = this.pressure();
    const res = Math.min(75, p.resist[dtype] || 0) / 100;
    const bonus = extra || 0;
    const dmg = Math.max(0, Math.round((base + bonus) * this.dmgMult * e.dmgTune * (1 + str / 100) * (1 - Math.min(e.weak, 90) / 100) * (1 + press) * (1 - res) * (1 + (dtype === 'Physical' ? Math.min(50, p.vulnerable) : 0) / 100) * (e.weakNext ? 1 - (e.weakNext === 1 || e.weakNext === true ? 0.3 : e.weakNext) : 1) * (p.until.lessDmg ? 1 - p.until.lessDmg : 1) * (dtype !== 'Physical' ? 1 + (p.unwarded || 0) / 100 : 1)));
    const parts = [`${base}${bonus ? ' + ' + bonus : ''}`];
    if (this.dmgMult !== 1) parts.push(`x ${this.dmgMult.toFixed(2)} map level`);
    if (str) parts.push(`x ${(1 + str / 100).toFixed(2)} Strength`);
    if (e.weak) parts.push(`x ${(1 - e.weak / 100).toFixed(2)} Weak`);
    if (press) parts.push(`x ${(1 + press).toFixed(2)} Pressure`);
    if (res) parts.push(`x ${(1 - res).toFixed(2)} ${dtype} resist`);
    if (p.vulnerable && dtype === 'Physical') parts.push(`x ${(1 + Math.min(50, p.vulnerable) / 100).toFixed(2)} Vulnerable`);
    if (!this._aoeHit && !this.taunting()) { const tk = this.demonTaunt(); if (tk) { this.hurtDemon(tk[0], tk[1], dmg, `${e.name}'s ${label}`); return 0; } } // the Bulwark Fiend takes single-target hits
    if (this._aoeHit && p.demons && p.demons.length) for (const dm of p.demons.slice()) this.hurtDemon(p, dm, dmg, `${e.name}'s ${label}`); // area attacks also hit demons
    p.attackedThisRound = true;
    let dmgIn = dmg;
    if (p.reflect && dmgIn > 0 && e.hp > 0 && this.rng() * 100 < p.reflect) { this.say('crit', `${p.name} reflects ${e.name}'s ${label}: ${e.name} takes ${dmgIn}.`); this.applyHit(p, e, dmgIn, { defer: true, label: 'Reflect' }); if (e.hp <= 0) this.onDeath(e); return 0; }
    if (p.powers.length) dmgIn = Math.round(dmgIn * this.pwProd(p, 'incoming'));
    if (dmgIn > 0 && p.timed.length) {
      const sa = p.timed.find(t => t.key === 'shadowArmor'); if (sa) dmgIn = Math.round(dmgIn * (1 - (sa.pct || 25) / 100));
      const da = p.timed.find(t => t.key === 'demonArmor'); if (da && p.demons && p.demons.length) { const dm = p.demons.slice().sort((x, y) => y.hp - x.hp)[0], part = Math.min(dm.hp, Math.round(dmgIn * (da.pct || 30) / 100)); if (part > 0) { dmgIn -= part; this.say('player', `Demon Armor: ${dm.name} takes ${part} of the hit.`); this.hurtDemon(p, dm, part); } }
    }
    const g = this.alivePlayers().find(q => q !== p && this.has(q, 'guardian_s_oath'));
    if (g && dmgIn > 0) { const part = Math.round(dmgIn * this.upN(g, 'guardian_s_oath', 0, 50) / 100); dmgIn -= part; this.applyHit(e, g, part, { defer: true, label }); this.say('player', `Guardian's Oath: ${g.name} takes ${part} of the hit for ${p.name}. HP ${g.hp}/${g.maxHp}.`); if (g.hp <= 0) this.onDeath(g); }
    const r = this.applyHit(e, p, dmgIn, { defer: true, label, dtype, kind: 'Attack' });
    this.say('enemy', `${e.name}'s ${label} hits ${this.partySize > 1 ? p.name : 'you'}${dtype !== 'Physical' ? ' (' + dtype + ')' : ''}: ${parts.join(' ')} = ${dmg}` + (r.absorbed ? `, ${r.absorbed} absorbed` : '') + `. HP ${p.hp}/${p.maxHp}.`);
    if (p.hp <= 0) { this.onDeath(p); return r.lost; }
    if (dmgIn > 0) { const na = p.timed.find(t => t.key === 'netherArmor'); if (na) { const n = na.n || 6; p.block += n; this.say('player', `Nether Armor: ${p.name} gains ${n} Absorb.`); } }
    if (r.absorbed > 0 && p.parryNext && p.parryNext.length && e.hp > 0) for (const f of p.parryNext.splice(0)) f(this, p, e); // Nov 2: Bait waits for your next parry
    if (r.absorbed > 0) { p.lastParried = this.round; p.parryFlag = true; if (p.until.backDmg && e.hp > 0) { this.applyHit(p, e, p.until.backDmg, { label: 'Counter' }); this.say('player', `${p.name} strikes back: ${e.name} takes ${p.until.backDmg}.`); if (e.hp <= 0) this.onDeath(e); } }
    if (r.absorbed > 0 && (r.lost === 0 || this.has(p, 'partial_guard'))) { for (const f of (p.until.onFull || [])) if (!this.over) f(this, p, e); }
    if (p.powers.length && !this.over) { if (r.absorbed > 0 && (r.lost === 0 || this.has(p, 'partial_guard'))) this.fire(p, 'fullBlock', e); this.fire(p, 'hitBy', e, r); }
    if (p.thorns && e.hp > 0) { const t = this.applyHit(p, e, p.thorns, { defer: true, label: 'Thorns' }); this.wardCheck(p); this.say('player', `Thorns: ${e.name} takes ${p.thorns}` + (t.absorbed ? ` (${t.absorbed} blocked)` : '') + '.'); if (e.hp <= 0) this.onDeath(e); }
    return r.lost;
  }

  debuffPlayer(key, n, e) {
    const p = this.player;
    if (p.until.debuffImmune) { this.say('player', `${p.name} is immune to the ${key}.`); return; }
    if (p.until.reflect && e) { p.until.reflect = false; e[key] = (e[key] || 0) + n; this.say('player', `The ${key} is reflected back onto ${e.name}.`); return; }
    if (p.negateDebuff) { p.negateDebuff = false; this.say('player', `Divine Shield negates the ${key}.`); return; }
    if (p.debuffRes && this.rng() * 100 < p.debuffRes) { this.say('player', `${p.name} shrugs off the ${key}.`); return; }
    if (key === 'bleed') n *= this.pwKey(p, 'dotMult', 'bleed');
    p[key] = (p[key] || 0) + n; if (['bleed', 'burn', 'poison'].includes(key)) p[key + 'By'] = e && e.id;
    if (key === 'chill' && p.chill >= 10) { p.chill = 0; p.frozen = true; this.say('crit', `${this.who(p)} ${this.partySize > 1 ? 'is' : 'are'} Frozen and will lose the next turn!`); return; }
    const W = this.partySize > 1 ? p.name : 'You', is = this.partySize > 1 ? 'is' : 'are', gain = this.partySize > 1 ? 'gains' : 'gain';
    const txt = { weak: `${W} ${is} Weak ${p.weak}: ${p.weak}% less damage dealt.`, vulnerable: `${W} ${is} Vulnerable ${p.vulnerable}: ${Math.min(50, p.vulnerable)}% more Physical damage taken.`, bleed: `${W} ${gain} ${n} Bleed (now ${p.bleed}).`, slow: `${W} ${is} Slowed ${p.slow}.`,
      burn: `${W} ${gain} ${n} Burn (now ${p.burn}).`, poison: `${W} ${gain} ${n} Poison (now ${p.poison}).`, chill: `${W} ${is} Chilled ${p.chill} (Freezes at 10).`,
      unwarded: `${W} ${is} Unwarded ${p.unwarded}: +${p.unwarded}% magic damage taken.`, exposure: `${W} ${gain} ${n} Exposure: cards cost ${Math.min(10, p.exposure) * 5}% more.` };
    this.say('enemy', txt[key]);
  }

  canPlay(c, who) {
    const d = this.card(c), p = who || this.player;
    if (this.phase !== 'player' || this.over) return { ok: false, why: 'Not your turn' };
    if (this.raid && !this.canAct(p)) return { ok: false, why: 'Turn ended' };
    if (d.designOnly) return { ok: false, why: 'Not built yet' };
    if (d.cost == null) return { ok: false, why: 'Unplayable' };
    const cost = this.costOf(p, d, c);
    if (p.locked && cost > 0) return { ok: false, why: 'In Stealth: 0-cost only' };
    if (p.disarmed && d.type === 'Attack') return { ok: false, why: 'Disarmed' };
    if (cost > p.mana) { const hpc = Math.ceil((cost - Math.max(0, p.mana)) / 2), cap = this.bloodCap(p);
      if (!this.bloodPay(p)) return { ok: false, why: `Needs ${cost} mana` };
      if (hpc >= p.hp) return { ok: false, why: `Needs ${hpc} HP` };
      if ((p.turn.bloodPaid || 0) + hpc > cap) return { ok: false, why: `Blood limit: ${cap - (p.turn.bloodPaid || 0)} HP left this turn` }; }
    if (this.duel && d.target === 'enemy' && !this.alive().some(x => !x.stealth)) return { ok: false, why: 'Target is in Stealth' };
    return { ok: true };
  }

  play(uid, targetId) {
    const p = this.player;
    if (p && p.pick) this.autoPick(p);
    const idx = p.hand.findIndex(c => c.uid === uid);
    if (idx < 0) return false;
    const c = p.hand[idx]; const d = this.card(c);
    if (!this.canPlay(c).ok) return false;
    let tgt = null;
    if (d.target === 'enemy') { const pool = this.alive().filter(x => !x.stealth); tgt = pool.find(e => e.id === targetId) || pool[0]; if (!tgt) return false; }
    else if (d.target === 'ally') tgt = this.allies().find(a => a.id === targetId) || p; // heals aimed at a party member
    const paid = this.costOf(p, d, c); p.mana -= paid; if (p.mana < 0 && this.bloodPay(p)) { const hpc = Math.ceil(-p.mana / 2); p.mana = 0; p.turn.bloodPaid = (p.turn.bloodPaid || 0) + hpc; this.loseHp(p, hpc, 'Blood Magic: ' + d.name); } p.hand.splice(idx, 1); this.stats.cardsPlayed++; this._lastTarget = d.target === 'ally' ? null : tgt; this._forced = 0; this._paid = paid; this._spentAll = null;
    const T = p.turn; let twice = T.twice && (T.twice.type === 'any' || T.twice.type === d.type) ? T.twice : null; if (twice) T.twice = null;
    if (T.nextFree) T.nextFree = false; if (T.nextCost) T.nextCost = 0;
    const echoArc = T.echoArcane && d.type === 'Skill' && d.dtype === 'Arcane'; if (echoArc) T.echoArcane = false;
    this.say('card', `${this.partySize > 1 ? p.name + ' plays' : 'You play'} ${d.name}${paid ? ' (' + paid + ' mana)' : ''}` + (tgt ? ` on ${tgt.name}` : '') + `. Mana ${p.mana}.`);
    if (d.target === 'all' && p.stealth) p.stealth = false;
    const stAtk = d.type === 'Attack' && !!p.stealth; if (stAtk) p.stealth = 'atk'; // Nov 2: attacking ends Stealth (after this card; a card that grants Stealth keeps it)
    if (this.duel && d.target === 'all') for (const x of this.alive()) if (x.stealth) { x.stealth = false; this.say('player', `${x.name}'s Stealth is broken.`); }
    this._playing = d; this._rankMult = 1; this._rk = d.rk || null; this._rkCard = d; const ms = d.ms || {};
    this._rkHits = ms.hits ? [] : null; this._rkTimed = ms.turns ? [] : null; this._rkAdded = ms.count ? [] : null; this._rkDraw = 0; const dn0 = p.drawNext || 0; this.rkBegin(this._rk);
    this._attackMult = d.type === 'Attack' ? p.nextAttackMult : 1;
    this._skillMult = (d.type === 'Skill' && d.tags.dmg) ? p.nextSkillMult : 1;
    this._cmult = (p.powers.length ? this.pwProd(p, 'cardMult', d) : 1) * (T.nextMult && d.type !== 'Power' ? T.nextMult : 1) * (twice && twice.mult ? twice.mult : 1); if (T.nextMult && d.type !== 'Power') T.nextMult = 0;
    if (T.reflux && d.type === 'Skill' && paid) { const per = Math.round(paid / 3); this.timed(p, 'reflux', 3, { each: (cb, q) => { q.manaNext += per; } }); T.reflux = false; this.say('player', `Mana Reflux: ${paid} mana comes back over 3 turns.`); }
    let times = 1;
    if (twice || echoArc) { times++; this.say('crit', `${d.name} is played twice.`); }
    if (d.type === 'Attack' && this.rng() * 100 < p.multiHit) { times = 2; this.say('crit', `Multi-hit! ${d.name} strikes again.`); }
    if (d.tags.dmg && this.rng() * 100 < (d.type === 'Attack' ? p.multiplay : p.multicast)) { times++; this.say('crit', `${d.type === 'Attack' ? 'Multiplay' : 'Multicast'}! ${d.name} is played again for free.`); }
    const echo = d.type === 'Attack' && p.powers.find(x => x.key === 'divine_echo');
    if (echo) { if (echo.chance == null) echo.chance = echo.upN ? echo.upN[0] : 10; if (this.rng() * 100 < echo.chance) { times++; echo.chance = 0; this.say('crit', `Divine Echo! ${d.name} repeats.`); } }
    const storm = d.key === 'shuriken' && this.has(p, 'shuriken_storm');
    const endless = d.key === 'shuriken' && this.hasTimed(p, 'endless') ? 2 : 1; times *= endless;
    if (d.type === 'Attack' && p.powers.length) { const xs = this.pwSum(p, 'extraStrike', d); if (xs > 0) { times += xs; this.say('crit', `${d.name} strikes an extra time.`); } } // Nov 2 talents
    const xTgt = d.type === 'Attack' && d.target === 'enemy' && p.powers.length ? this.pwSum(p, 'extraTarget', d) : 0;
    const twin = T.twin && d.type === 'Attack' && (d.dtype || 'Physical') === 'Physical'; if (twin) { T.twin = false; times++; }
    if (p.isPlayer) { const q = this.animQ = this.animQ || []; if (q.length < 20) q.push({ id: p.id, card: d.key, cost: d.cost || 0, type: d.type, dtype: d.dtype || (d.type === 'Attack' ? 'Physical' : null), aoe: d.target === 'all' || !!d.tags.aoe, dmg: !!d.tags.dmg, def: !!d.tags.def, heal: !!d.tags.heal, tgt: tgt ? tgt.id : null }); } // the fight screen's animations (src/forge.js)
    for (let i = 0; i < times && !this.over; i++) {
      if (storm) { for (const e of this.alive()) if (!this.over) d.play(this, e); continue; }
      if (tgt && tgt.hp <= 0 && d.target !== 'ally') tgt = this.alive()[0]; if (d.target === 'enemy' && !tgt) break;
      if (twin && i === times - 1) { const was = this._playing; this._playing = Object.assign(Object.create(d), { dtype: 'Holy' }); d.play(this, tgt); this._playing = was; } else d.play(this, tgt);
      if (xTgt > 0 && i === 0) { for (const o2 of this.alive().filter(x => x !== tgt && x.hp > 0 && !x.stealth).slice(0, xTgt)) if (!this.over) { this.say('player', `${d.name} also hits ${o2.name}.`); d.play(this, o2); } }
      if (T.sweep > 0 && d.type === 'Attack' && d.target === 'enemy' && i === 0) { const os = this.alive().filter(x => x !== tgt).slice(0, T.sweepN || 1); if (os.length) { T.sweep--; for (const o2 of os) if (!this.over && o2.hp > 0) { this.say('player', `Sweeping Strikes: ${d.name} also hits ${o2.name}.`); d.play(this, o2); } } }
    }
    if (T.cascade && !this.over) this.drawCards(p, 1);
    (T.played = T.played || []).push(c);
    if (this.has(p, 'smoke_and_mirrors') && this._forced >= 2) { p.stealth = true; this.say('player', 'Smoke and Mirrors: you slip into Stealth.'); }
    if (d.type === 'Attack') { p.turnAttacks++; p.nextAttackFlat = 0; p.windUp = false; } else if (d.type === 'Skill') { p.turnSkills++; if (d.tags.dmg) { p.spellCount++; if (d.dtype && !p.turnElems.includes(d.dtype)) p.turnElems.push(d.dtype); } }
    this._cmult = 1;
    if (d.rank && !this.over) this.rkMilestones(p, d, dn0, tgt);
    this.rkEnd(); this._rk = null; this._rkCard = null; this._rkHits = this._rkTimed = this._rkAdded = null;
    if (stAtk && tgt && !tgt.isPlayer && tgt.hp > 0 && this.has(p, 'shadow_ambush')) { if (this.raidBoss(tgt)) this.say('player', `${tgt.name} is a raid boss: Shadow Ambush can't Stun it.`); else if ((tgt.ambushUntil || 0) > this.round) this.say('player', `${tgt.name} is still reeling: Shadow Ambush can't Stun it again until next round.`); else { tgt.frozen = true; tgt.ambushUntil = this.round + 2; this.say('crit', `Shadow Ambush: ${tgt.name} is Stunned and loses its next turn.`); } } // Nov 2: a real Stun, bosses too
    if (stAtk && p.stealth === 'atk' && p.stealthKeep > 0) { p.stealthKeep--; p.stealth = true; this.say('player', 'Shadow Dance: you strike and stay in Stealth.'); }
    if (stAtk && p.stealth === 'atk') { p.stealth = false; this.say('player', `${this.partySize > 1 ? p.name + ' attacks' : 'You attack'} out of Stealth.`); }
    if (p.powers.length && !this.over) this.fire(p, 'cardPlayed', d);
    if (d.type === 'Skill' && d.tags.dmg && this.has(p, 'elemental_memory')) {
      const SEC = { fireball: [['dot', 'burn', 3]], pyroblast: [['dot', 'burn', 6]], ice_bolt: [['chill', 4]], blizzard: [['chill', 4]], frostbolt: [['regen', 5]] };
      const mine = SEC[d.key] || (GEN_SEC[d.name] || []);
      if (p.memSec && p.memName !== d.name && tgt && tgt.hp > 0 && d.target !== 'ally') { for (const s of p.memSec) { if (s[0] === 'dot') this.applyDot(tgt, s[1], s[2]); if (s[0] === 'chill') this.applyChill(tgt, s[1]); if (s[0] === 'debuff') tgt[s[1]] = (tgt[s[1]] || 0) + s[2]; if (s[0] === 'regen') (tgt.regenDown = tgt.regenDown || []).push({ n: s[1], turns: 2 }); } this.say('player', `Elemental Memory: ${p.memName}'s effect carries over.`); }
      if (mine.length) { p.memSec = mine; p.memName = d.name; }
    }
    if (d.type === 'Attack' || d.type === 'Skill') p.prevType = d.type;
    if (d.type === 'Attack' && p.nextAttackMult !== 1) p.nextAttackMult = 1;
    if (this._skillMult !== 1) p.nextSkillMult = 1;
    this._playing = null; this._rankMult = 1; this._attackMult = 1; this._skillMult = 1; this._spentAll = null;
    (d.exhaust ? p.exhaust : p.discard).push(c);
    if (this._pendingDeath) { const q = this._pendingDeath; this._pendingDeath = null; if (q.hp <= 0 && !q.dead) { this.say('loss', `${q.name} paid with their last HP.`); this.onDeath(q); } }
    return true;
  }

  endPlayerTurn() {
    if (this.phase !== 'player') return;
    if (this.player && this.player.pick) this.autoPick(this.player);
    this.fire(this.player, 'turnEnd');
    if (this.player.demons && this.player.demons.length) { const q = this.player; this.demonsAct(q); this.player = q; if (this.over) return; }
    { const q = this.player; for (const c of q.hand) { const cd = this.card(c); if (cd.endInHand) this.rkRun(cd.rk, () => cd.endInHand(this, q, c)); } if (q.turn.endStealth && q.turnAttacks + q.turnSkills <= 1) { q.stealth = true; this.say('player', `${this.who(q)} slip${this.partySize > 1 ? 's' : ''} into Stealth.`); } if (q.turn.lurk && q.turnAttacks + q.turnSkills <= 1) q.drawNext = (q.drawNext || 0) + (q.turn.lurk === true ? 1 : q.turn.lurk); q.lastTurnAttacks = q.turnAttacks; }
    const p = this.player; const keep = p.hand.filter(c => this.card(c).retain), kept = p.hand.length - keep.length;
    p.discard.push(...p.hand.filter(c => !keep.includes(c))); p.hand = keep;
    if (kept) this.say('player', `End turn: ${kept} card${kept > 1 ? 's' : ''} discarded${keep.length ? `, ${keep.length} retained` : ''}.`);
    p.strTurn = 0; p.intTurn = 0; p.disarmed = false; p.locked = false; p.turn = { carry: true }; if (p.dexTurn) { p.dexterity -= p.dexTurn; p.dexTurn = 0; }
    p.weak = Math.floor(p.weak / 2); p.vulnerable = Math.floor(p.vulnerable / 2); if (p.slow) p.slow = Math.max(0, p.slow - 1); if (p.chill) p.chill = Math.max(0, p.chill - 1); p.unwarded = Math.floor((p.unwarded || 0) / 2); p.exposure = Math.floor((p.exposure || 0) / 2);
    if (this.raid) { this.raidDone.add(p.id); this.say('sys', `${p.name} ends their turn.`); this.raidCheck(); return; }
    this.nextTurn();
  }

  enemyStep() {
    const e = this.current;
    if (!e || e.isPlayer || this.over) return false;
    if (e.hp <= 0) { e.plan = []; this.nextTurn(); return false; }
    const uid = e.plan.shift();
    if (!uid) { this.endEnemyTurn(e); return false; }
    const i = e.hand.findIndex(c => c.uid === uid);
    if (i < 0) return true;
    const c = e.hand[i];
    const ec = this.eCost(e, c);
    const rbAtk = this.raidBoss(e) && CB_intent(c) === 'attack'; if (this.raidBoss(e)) this.raidShrug(e);
    if (ec > e.mana && !rbAtk) { this.say('enemy', `${e.name} can't afford ${c.name}.`); return true; }
    e.mana = Math.max(0, e.mana - ec); e.hand.splice(i, 1); e.discard.push(c); if (e.costUp) e.costUp = 0;
    if (e.counter > 0) { e.counter--; this.say('player', `${e.name} plays ${c.name}, but it is countered: no effect.`); return true; }
    this.say('enemy', `${e.name} plays ${c.name}: ${c.text}`);
    const aoe = c.ops.some(o => o.all || o.op === 'shredAll') || /every player|each of their/.test(c.text);
    const PLAYER_OPS = ['damage', 'execute', 'damageBlock', 'debuff', 'stealMana', 'burnMana', 'drawLess', 'disarm', 'purge', 'shred', 'shredAll', 'tickBleed', 'status'];
    const targeted = !aoe && c.ops.some(o => PLAYER_OPS.includes(o.op));
    // pick who this card hits: area cards hit every standing hero; single-target cards pick a random hero who isn't in Stealth
    const standing = this.alivePlayers();
    let mark = null;
    if (aoe) { for (const q of standing) if (q.stealth) q.stealthAoe = 'pending'; } // Nov 2: an area hit only breaks Stealth if it gets through (a full Dodge keeps you hidden)
    else if (targeted) {
      const seen = standing.filter(q => !q.stealth);
      if (!seen.length) { this.say('player', `${e.name} can't find ${this.partySize > 1 ? 'anyone' : 'you'} in Stealth: ${c.name} misses.`); return true; }
      const planned = c.mark && seen.find(q => q.id === c.mark), tq = this.taunting();
      mark = (tq && !tq.stealth ? tq : null) || planned || this.pickMark(e);
      e.lastMark = mark.id; c.mark = null;
      if (this.partySize > 1) this.say('enemy', `${e.name} targets ${mark.name}.`);
    }
    this._aoeHit = aoe;
    for (const op of c.ops) {
      if (this.over || e.hp <= 0) break;
      const hitList = PLAYER_OPS.includes(op.op) ? (aoe ? this.alivePlayers() : [mark || standing[0]]) : [mark || standing[0]];
      for (const tgt of hitList) {
      if (!tgt || this.over || e.hp <= 0) break;
      if (tgt.hp <= 0 && PLAYER_OPS.includes(op.op)) continue;
      const p = tgt; this.player = tgt;
      switch (op.op) {
        case 'damage': {
          const times = op.times || 1; let bonus = e.nextBonus; e.nextBonus = 0;
          const extra = op.perStatus ? op.perStatus * this.statusCount() : 0;
          for (let k = 0; k < times && !this.over && e.hp > 0; k++) {
            const lost = this.enemyHit(e, op.n + extra, c.name, c.dtype, bonus); bonus = 0;
            if (p.stealthAoe) { if (lost > 0 && p.stealth) { p.stealth = false; p.stealthAoe = 'broken'; this.say('enemy', `${c.name} hits everyone: ${this.partySize > 1 ? p.name + "'s" : 'your'} Stealth is broken.`); } else if (p.stealthAoe === 'pending') p.stealthAoe = 'dodged'; }
            if (op.dotPerHit && !this.over) this.debuffPlayer(op.dotPerHit.key, op.dotPerHit.n, e);
            if (op.lifesteal && lost) this.heal(e, Math.round(lost * op.lifesteal), c.name);
          }
          break;
        }
        case 'execute': this.enemyHit(e, p.hp < p.maxHp * 0.3 ? op.n : op.low, c.name, c.dtype); break;
        case 'damageBlock': this.enemyHit(e, Math.round(e.block * op.pct / 100 / this.dmgMult), c.name, c.dtype); break;
        case 'block': e.block += op.n; this.say('enemy', `${e.name} gains ${op.n} Block (${e.block}).`); break;
        case 'parry': e.block += op.n; e.parryBack = op.back; this.say('enemy', `${e.name} gains ${op.n} Parry` + (op.back ? `: Attacks into it take ${Math.round(op.back * this.dmgMult)} back.` : '.')); break;
        case 'blockAlly': { const o = this.alive().filter(x => x !== e); if (o.length) { const t = o[Math.floor(this.rng() * o.length)]; t.block += op.n; this.say('enemy', `${t.name} gains ${op.n} Block.`); } else this.say('enemy', 'No ally to shield.'); break; }
        case 'blockOthers': for (const t of this.alive().filter(x => x !== e)) { t.block += op.n; this.say('enemy', `${t.name} gains ${op.n} Block.`); } break;
        case 'thorns': e.thorns = op.n; e.thornsTurns = op.turns; this.say('enemy', `${e.name} grows spikes: Attacks into it cost you ${op.n} HP for ${op.turns} turns.`); break;
        case 'heal': this.heal(e, Math.round(op.n * this.hpMult), c.name); break;
        case 'teamHeal': for (const x of this.alive()) this.heal(x, Math.round(op.n * this.hpMult), c.name); break;
        case 'stealMana': { const s = Math.min(op.n, p.mana); p.mana -= s; e.mana += s; this.say('enemy', `${e.name} steals ${s} mana.`); break; }
        case 'burnMana': { const s = Math.min(op.n, p.mana); p.mana -= s; this.say('enemy', `${e.name} burns ${s} of your mana.`); break; }
        case 'gainMana': e.mana += op.n; this.say('enemy', `${e.name} gains ${op.n} mana.`); break;
        case 'debuff': this.debuffPlayer(op.key, op.n, e); break;
        case 'teamStrength': for (const x of this.alive()) x.strTurn += op.n; this.say('enemy', `${e.name} and its allies gain ${op.n} Strength this round.`); break;
        case 'strTurn': e.strTurn += op.n; this.say('enemy', `${e.name} gains ${op.n} Strength this round.`); break;
        case 'strCombat': e.strength += op.n; this.say('enemy', `${e.name} gains ${op.n} Strength for the fight (now ${e.strength}).`); break;
        case 'initNext': e.initNext = op.n; break;
        case 'status': {
          if (p.negateDebuff) { p.negateDebuff = false; this.say('player', `Divine Shield blocks the ${C[op.key].name}.`); break; }
          if (p.debuffRes && this.rng() * 100 < p.debuffRes) { this.say('player', `${p.name} shrugs off the ${C[op.key].name}.`); break; }
          for (let k = 0; k < op.n; k++) { const sc = { uid: 'c' + (this._uid++), key: op.key }; if (op.pile === 'discard') p.discard.push(sc); else p.drawPile.splice(Math.floor(this.rng() * (p.drawPile.length + 1)), 0, sc); }
          this.say('enemy', `${op.n} ${C[op.key].name} added to your ${op.pile} pile.`); break;
        }
        case 'drawLess': p.drawLess += op.n; this.say('enemy', 'You will draw 1 fewer card next round.'); break;
        case 'disarm': if (p.negateDebuff) { p.negateDebuff = false; this.say('player', 'Divine Shield blocks the Disarm.'); } else { p.disarmNext = true; this.say('enemy', 'You are Disarmed: no Attacks on your next turn.'); } break;
        case 'cleanse': e.weak = e.vulnerable = e.bleed = e.poison = e.burn = e.chill = e.slow = e.dread = e.rot = e.magicVuln = 0; e.rotQ = []; e.regenDown = []; this.say('enemy', `${e.name} shakes off every debuff.`); break;
        case 'purge': { const had = p.strTurn || p.strCombat || p.nextAttackMult !== 1 || p.nextSkillMult !== 1 || p.negateDebuff; p.strTurn = 0; if (op.all) p.strCombat = 0; p.nextAttackMult = 1; p.nextSkillMult = 1; p.negateDebuff = false; this.say('enemy', had ? 'Your buffs are stripped.' : 'You have no buffs to take.'); break; }
        case 'nextBonus': e.nextBonus += op.n; break;
        case 'shred': if (p.until.keepBlock || this.hasTimed(p, 'keepBlock')) { this.say('player', `${p.name}'s Block holds.`); break; } { const s = Math.min(op.n, p.block); p.block -= s; this.say('enemy', `${e.name} removes ${s} of your ${p.defName}.`); break; }
        case 'shredAll': if (p.until.keepBlock || this.hasTimed(p, 'keepBlock')) { this.say('player', `${p.name}'s Block holds.`); break; } this.say('enemy', `${e.name} strips all ${p.block} of your ${p.defName}.`); p.block = 0; break;
        case 'tickBleed': if (p.bleed) this.applyHit(e, p, p.bleed, { isDot: true, label: c.name }); break;
        case 'draw': { this.drawCards(e, op.n); const nc = e.hand[e.hand.length - 1]; if (nc && nc.cost <= e.mana && !e.plan.includes(nc.uid) && nc !== c) e.plan.push(nc.uid); break; }
      }
      if (!PLAYER_OPS.includes(op.op)) break; // non-hero effects (block, mana, strength) happen once
      }
    }
    this._aoeHit = false;
    for (const q of this.players) if (q.stealthAoe) { if (q.stealthAoe === 'pending' && q.stealth) { q.stealth = false; this.say('enemy', `${c.name} hits everyone: ${this.partySize > 1 ? q.name + "'s" : 'your'} Stealth is broken.`); } else if (q.stealthAoe === 'dodged' && q.stealth) this.say('player', `${this.partySize > 1 ? q.name + ' dodges' : 'You dodge'} it all and stay${this.partySize > 1 ? 's' : ''} in Stealth.`); q.stealthAoe = null; }
    e.weakNextUsed = e.weakNextUsed || (e.weakNext && c.ops.some(o => o.op === 'damage' || o.op === 'execute')); if (e.weakNextUsed) { e.weakNext = 0; e.weakNextUsed = false; }
    if (!this.over && e.d.tier === 'Boss' && e.phase === 1 && e.hp > 0 && e.hp <= e.maxHp / 2) this.phaseTwo(e);
    return !this.over;
  }

  phaseTwo(e) {
    e.phase = 2;
    for (const c of e.phase2Cards) e.drawPile.splice(Math.floor(this.rng() * (e.drawPile.length + 1)), 0, c);
    if (e.d.draw2) e.draw = e.d.draw2 + (e.drawPlus || 0);
    if (e.d.regen2) e.regen = Math.round(e.d.regen2 * (e.regenK || 1));
    this.say('crit', `${e.name} enters PHASE 2. New cards join its deck; it now draws ${e.draw} and regenerates ${e.regen}.`);
  }

  endEnemyTurn(e) {
    if (e.hand.length) e.discard.push(...e.hand.splice(0).filter(c => !c.exhaust));
    e.silenced = 0; e.disarmed = 0; e.feared = 0; e.stunned = 0;
    this.raidShrug(e); const less = e.drawLess || 0; e.drawLess = 0; if (e.drawLessTurns > 0) { e.drawLessTurns--; if (e.drawLessTurns > 0) e.drawLess = 1; }
    if (e.hp > 0) { this.drawCards(e, Math.max(0, (e.d.tier === 'Boss' && e.phase === 1 && e.hp <= e.maxHp / 2 && e.d.draw2 ? e.d.draw2 + (e.drawPlus || 0) : e.draw) - less)); if (less) this.say('player', `${e.name} draws ${less} fewer.`); this.planEnemy(e); }
    e.weak = Math.floor(e.weak / 2); e.vulnerable = Math.floor(e.vulnerable * (this.players.some(q => this.has(q, 'codex_sunderer')) ? 0.9 : 0.5)); if (e.chill) e.chill = Math.max(0, e.chill - 1); // Nov 2: Sunderer keeps Vulnerable up (-10% a turn)
    e.condemn = Math.floor((e.condemn || 0) / 2); e.unwarded = Math.floor((e.unwarded || 0) / 2); e.magicVuln = Math.floor((e.magicVuln || 0) * 0.9);
    if (e.d.tier === 'Boss' && e.phase === 1 && e.hp <= e.maxHp / 2 && e.hp > 0) this.phaseTwo(e);
    this.nextTurn();
  }

  runEnemies() { let g = 0; while (this.phase === 'enemy' && !this.over && g++ < 500) this.enemyStep(); }

  endRound() {
    for (const e of this.enemies) e.strTurn = 0;
    if (this.round >= (this.duel ? 30 : 60)) { this.over = 'loss'; this.phase = 'over'; this.say('loss', 'Stalemate after 60 rounds.'); return; }
    this.startRound();
  }
}

// ---------------- Loot ----------------
// gear rules (Oct 31): Max Mana only rolls on chest armor, and gear can add at most +60 max mana in total
const MANA_GEAR_CAP = 60;
function gearRules(G) { if (!G || G._rules) return; G._rules = true; for (const A of Object.values(G.arche || {})) if (A.weights && A.slot !== 'Chest' && A.weights['Max Mana']) delete A.weights['Max Mana'];
  // Nov 1 (b): Mana Regen only comes from amulets (no gear affix rolls it; the Frost Staff's implicit becomes Frost damage), and Recovery rolls half as much
  for (const A of Object.values(G.arche || {})) { if (A.weights && A.slot !== 'Amulet') delete A.weights['Mana Regen']; if (A.imp2 === 'Mana Regen') A.imp2 = 'Frost Damage'; }
  for (const k of ['Recovery', 'Party Recovery']) { const st = G.stats[k]; if (st && !st._half) { st._half = true; st.min = Math.max(1, Math.round(st.min / 2)); st.max = Math.max(1, Math.round(st.max / 2)); st.pts *= 2; } }
  // Nov 1 (c): Crit Chance on gear rolls 75% less, Crit Damage 50% less (kept as fractions so higher map levels still grow; each roll is at least 1)
  for (const [k, f] of Object.entries(CRIT_CUT)) { const st = G.stats[k]; if (st && !st._cut) { st._cut = true; st.min *= f; st.max *= f; st.pts /= f; } } }
const CRIT_CUT = { 'Crit Chance': 0.25, 'Crit Damage': 0.5 };
// Bring an item made before those rules up to date (once; marked r2). Its Mana Regen affix is rerolled into a new stat and its Recovery halved.
const halfUp = (v) => Math.max(1, Math.ceil(v / 2));
function itemRules(it, data) {
  if (!it || it.kind === 'card') return it;
  if (!it.r4) { it.r4 = 1; const D0 = data || DATA; // Nov 1 (d): the implicit resistance moves to the item's own map's element
    if (D0 && D0.gear && D0.maps && it.slot !== 'Codex' && it.slot !== 'Amulet' && it.lines) { mapResist(D0); // rolled drops only (starter gear has no affix lines)
      const b = D0.gear.bases.find(x => x.name === it.name), M = D0.maps[(b && b.map) || 'physical'], from = M && 'Resistance:' + (M.dropOld || 'Fire'), to = M && 'Resistance:' + M.element;
      if (M && from !== to && it.stats && it.stats[from]) { const onLines = (it.lines || []).filter(l => l.stat === from).reduce((t, l) => t + l.v, 0), imp = it.stats[from] - onLines;
        if (imp > 0) { it.stats = Object.assign({}, it.stats); it.stats[from] -= imp; if (it.stats[from] <= 0) delete it.stats[from]; it.stats[to] = (it.stats[to] || 0) + imp; } } } }
  if (!it.r3) { it.r3 = 1; // Nov 1 (c): Crit Chance x0.25 and Crit Damage x0.5, each at least 1
    for (const [k, f] of Object.entries(CRIT_CUT)) { const cut = (v) => Math.max(1, Math.round(v * f));
      if (it.stats && it.stats[k]) { it.stats = Object.assign({}, it.stats); it.stats[k] = cut(it.stats[k]); }
      if (it.imp2 && it.imp2[k]) { it.imp2 = Object.assign({}, it.imp2); it.imp2[k] = cut(it.imp2[k]); }
      if (it.lines) it.lines = it.lines.map(l => l.stat === k ? Object.assign({}, l, { v: cut(l.v), lo: cut(l.lo || l.v), hi: cut(l.hi || l.v) }) : l); } }
  if (it.r2) return it; it.r2 = 1;
  data = data || DATA;
  for (const k of ['Recovery', 'Party Recovery']) {
    if (it.stats && it.stats[k]) { it.stats = Object.assign({}, it.stats); it.stats[k] = halfUp(it.stats[k]); }
    if (it.imp2 && it.imp2[k]) { it.imp2 = Object.assign({}, it.imp2); it.imp2[k] = halfUp(it.imp2[k]); }
    if (it.lines) it.lines = it.lines.map(l => l.stat === k ? Object.assign({}, l, { v: halfUp(l.v), lo: halfUp(l.lo || l.v), hi: halfUp(l.hi || l.v) }) : l);
  }
  if (it.slot !== 'Amulet') {
    if (it.lines) { let h = 11; for (const ch of String(it.name) + (it.ilvl || 0)) h = (h * 31 + ch.charCodeAt(0)) % 2147483647; const rng = makeRng(h || 1);
      it.lines.forEach((l, i) => { if (l.stat === 'Mana Regen' && !(data && data.gear && rerollAffix(data, rng, it, i))) { it.stats = Object.assign({}, it.stats); it.stats['Mana Regen'] = (it.stats['Mana Regen'] || 0) - l.v; if (it.stats['Mana Regen'] <= 0) delete it.stats['Mana Regen']; } });
      it.lines = it.lines.filter(l => l.stat !== 'Mana Regen'); }
    if (it.stats && it.stats['Mana Regen']) { it.stats = Object.assign({}, it.stats); delete it.stats['Mana Regen']; }
    if (it.imp2 && it.imp2['Mana Regen']) { const v = it.imp2['Mana Regen']; it.imp2 = Object.assign({}, it.imp2); delete it.imp2['Mana Regen']; it.imp2['Elemental/Holy Damage:Frost'] = (it.imp2['Elemental/Holy Damage:Frost'] || 0) + v; }
  }
  return it;
}
// Nov 1: a Shoulders slot. Three armor kinds (plate, leather, cloth) and one piece of each per map, dropped by that map's monsters
const SHOULDER_ARCHE = {
  Pauldrons: { slot: 'Shoulders', type: 'Plate', hands: '', imp2: null, weights: { Stamina: 12, Strength: 4, Intelligence: 1, Dexterity: 10, Spirit: 1, 'Crit Damage': 2, 'Health Regen': 3, Thorns: 6, Luck: 2 } },
  Spaulders: { slot: 'Shoulders', type: 'Leather', hands: '', imp2: null, weights: { Stamina: 6, Strength: 8, Intelligence: 2, Dexterity: 5, Spirit: 2, 'Crit Chance': 8, 'Crit Damage': 8, Initiative: 4, Luck: 2 } },
  Mantle: { slot: 'Shoulders', type: 'Cloth', hands: '', imp2: null, weights: { Stamina: 3, Strength: 1, Intelligence: 10, Dexterity: 2, Spirit: 10, 'Crit Chance': 3, 'Mana Regen': 3, 'Elemental/Holy Damage': 4, Luck: 2 } },
};
const SHOULDER_BASES = { physical: ['Warband Pauldrons', "Scout's Spaulders", 'Hedge-Mage Mantle'], fire: ['Cinder Pauldrons', 'Charred Spaulders', 'Ember Mantle'], frost: ['Rimeforged Pauldrons', 'Frostbitten Spaulders', 'Hoarfrost Mantle'],
  nature: ['Thornwoven Pauldrons', 'Mossy Spaulders', 'Barkskin Mantle'], arcane: ['Runeforged Pauldrons', 'Spellbound Spaulders', 'Astral Mantle'], shadow: ['Gravesteel Pauldrons', 'Duskhide Spaulders', 'Shroud Mantle'] };
// ---------- Group mobs (Nov 1): one map slot, three bodies. A group counts as one monster: one loot roll, one kill's XP and gold.
// Its HP and damage are one normal monster's, split three ways, so a solo hero without area damage has to chew through each body.
// (dmg: a per-group damage factor, tuned in sims so each group is about as dangerous as that tier's single monsters; bodies dying cut its damage.)
// Every member plays one card a turn (10 mana, 10 regen, every card costs 10). Tier 2 and 3 only, one of each per map.
// art: the existing monster whose drawing the members use (smaller). like: the monster whose gear pool and named drops the group shares.
const GROUP_N = 3;
const GROUPS = {
  wolf_pack: { map: 'physical', tier: '2', name: 'Pack of Wolves', unit: 'Wolf', creature: 'Beast', type: 'Physical', weak: 'Fire', hp: 69, dmg: 2.5, art: 'dire_wolf', like: 'dire_wolf', desc: 'Three lean wolves that hunt together and howl each other on.',
    deck: [[3, 'Bite', 'Deal 5 damage.', 'Attack'], [2, 'Snapping Bite', 'Deal 3 damage and apply 2 Bleed.', 'Attack'], [1, 'Howl', 'All friendly targets gain 10 Strength this turn.', 'Buff'], [1, 'Circle', 'Gain 4 Block.', 'Defense']] },
  bandit_party: { map: 'physical', tier: '3', name: 'Bandit Party', unit: 'Raider', creature: 'Human', type: 'Physical', weak: 'Arcane', hp: 110, dmg: 1.2, art: 'bandit_cutthroat', like: 'pit_duelist', desc: 'A raiding party off the high road: cutlasses, a crossbow and no manners.',
    deck: [[3, 'Cutlass', 'Deal 8 damage.', 'Attack'], [2, 'Serrated Cut', 'Deal 5 damage and apply 3 Bleed.', 'Attack'], [1, 'Crossbow Volley', 'Deal 4 damage to every player.', 'Attack'], [1, 'Fall Back', 'Gain 6 Block.', 'Defense']] },
  ember_whelps: { map: 'fire', tier: '2', name: 'Ember Whelps', unit: 'Whelp', creature: 'Beast', type: 'Fire', weak: 'Frost', hp: 69, dmg: 2.8, art: 'blaze_drake', like: 'blaze_drake', desc: 'A clutch of young drakes, all teeth and sparks.',
    deck: [[3, 'Fire Spit', 'Deal 5 damage.', 'Attack'], [2, 'Singe', 'Deal 3 damage and apply 2 Burn.', 'Attack'], [1, 'Shriek', 'All friendly targets gain 10 Strength this turn.', 'Buff'], [1, 'Flap', 'Gain 4 Block.', 'Defense']] },
  magma_golems: { map: 'fire', tier: '3', name: 'Magma Golems', unit: 'Golem', creature: 'Elemental', type: 'Fire', weak: 'Frost', hp: 110, dmg: 1.7, art: 'magma_golem', like: 'pyre_sentinel', desc: 'Three slag-hearted golems poured from the same lava vent.',
    deck: [[3, 'Slag Fist', 'Deal 8 damage.', 'Attack'], [1, 'Molten Core', 'Deal 5 damage and apply 3 Burn.', 'Attack'], [1, 'Lava Splash', 'Deal 4 damage to every player.', 'Attack'], [2, 'Cool Crust', 'Gain 7 Block.', 'Defense']] },
  frostfang_pack: { map: 'frost', tier: '2', name: 'Frostfang Pack', unit: 'Frostfang', creature: 'Beast', type: 'Frost', weak: 'Fire', hp: 69, dmg: 1.6, art: 'snow_leopard', like: 'snow_leopard', desc: 'White cats that stalk in threes across the ice.',
    deck: [[3, 'Pale Bite', 'Deal 5 damage.', 'Attack'], [2, 'Icy Fang', 'Deal 3 damage and apply 2 Chill.', 'Attack'], [1, 'Stalk', 'All friendly targets gain 10 Strength this turn.', 'Buff'], [1, 'Crouch', 'Gain 4 Block.', 'Defense']] },
  wight_patrol: { map: 'frost', tier: '3', name: 'Barrow Wight Patrol', unit: 'Wight', creature: 'Undead', type: 'Frost', weak: 'Fire', hp: 110, dmg: 1.0, art: 'winter_knight', like: 'winter_knight', desc: 'Frozen dead who still walk their old watch.',
    deck: [[3, 'Frozen Blade', 'Deal 8 damage.', 'Attack'], [2, 'Grave Chill', 'Deal 5 damage and apply 3 Chill.', 'Attack'], [1, 'Death Rattle', 'Apply 10 Weak to every player.', 'Debuff'], [1, 'Hoarfrost Shield', 'Gain 7 Block.', 'Defense']] },
  spiderling_swarm: { map: 'nature', tier: '2', name: 'Spiderling Swarm', unit: 'Spiderling', creature: 'Beast', type: 'Nature', weak: 'Fire', hp: 69, dmg: 1.3, art: 'broodmother_spider', like: 'jungle_stalker', desc: 'The broodmother\'s children, already hungry.',
    deck: [[3, 'Nip', 'Deal 5 damage.', 'Attack'], [2, 'Venom Bite', 'Deal 2 damage and apply 3 Poison.', 'Attack'], [1, 'Web Spit', 'Deal 3 damage and apply 3 Slow.', 'Attack'], [1, 'Skitter', 'Gain 4 Block.', 'Defense']] },
  raptor_pack: { map: 'nature', tier: '3', name: 'Raptor Pack', unit: 'Raptor', creature: 'Beast', type: 'Nature', weak: 'Fire', hp: 110, dmg: 0.85, art: 'jungle_stalker', like: 'broodmother_spider', desc: 'Clever hunters: one flanks, one feints, one bites.',
    deck: [[3, 'Slash', 'Deal 8 damage.', 'Attack'], [2, 'Raking Claws', 'Deal 5 damage and apply 3 Bleed.', 'Attack'], [1, 'Pack Tactics', 'All friendly targets gain 15 Strength this turn.', 'Buff'], [1, 'Dodge Back', 'Gain 6 Block.', 'Defense']] },
  ley_pack: { map: 'arcane', tier: '2', name: 'Ley Hound Pack', unit: 'Ley Pup', creature: 'Beast', type: 'Arcane', weak: 'Shadow', hp: 69, dmg: 1.6, art: 'ley_hound', like: 'ley_hound', desc: 'Young hounds that feed on spilled magic and strip wards with their teeth.',
    deck: [[3, 'Rune Bite', 'Deal 5 damage.', 'Attack'], [2, 'Unravel', 'Deal 3 damage and apply 10 Unwarded.', 'Attack'], [1, 'Pack Howl', 'All friendly targets gain 10 Strength this turn.', 'Buff'], [1, 'Phase Out', 'Gain 4 Block.', 'Defense']] },
  armor_squad: { map: 'arcane', tier: '3', name: 'Animated Armor Squad', unit: 'Armor', creature: 'Construct', type: 'Arcane', weak: 'Shadow', hp: 110, dmg: 1.15, art: 'iron_arbiter', like: 'spellblade', desc: 'Empty suits of plate, still drilling for a war that ended.',
    deck: [[3, 'Rune Blade', 'Deal 8 damage.', 'Attack'], [1, 'Shield Bash', 'Deal 4 damage and gain 4 Block.', 'Attack'], [1, 'Arcane Sweep', 'Deal 4 damage to every player.', 'Attack'], [2, 'Glyph Plating', 'Gain 7 Block.', 'Defense']] },
  ghoul_pack: { map: 'shadow', tier: '2', name: 'Ghoul Pack', unit: 'Ghoul', creature: 'Undead', type: 'Shadow', weak: 'Fire', hp: 69, dmg: 1.5, art: 'ghoul', like: 'ghoul', desc: 'Crypt scavengers that never feed alone.',
    deck: [[3, 'Claw', 'Deal 5 damage.', 'Attack'], [2, 'Rotten Claw', 'Deal 3 damage and apply 2 Bleed.', 'Attack'], [1, 'Feast', 'All friendly targets heal 4 HP.', 'Buff'], [1, 'Crouch', 'Gain 4 Block.', 'Defense']] },
  cultist_coven: { map: 'shadow', tier: '3', name: 'Cultist Coven', unit: 'Cultist', creature: 'Human', type: 'Shadow', weak: 'Fire', hp: 110, dmg: 1.3, art: 'cult_deacon', like: 'death_knight', desc: 'Three voices, one dark prayer.',
    deck: [[3, 'Shadow Bolt', 'Deal 8 damage.', 'Attack'], [1, 'Dark Litany', 'Deal 4 damage to every player.', 'Attack'], [1, 'Dark Sermon', 'All friendly targets gain 15 Strength this turn.', 'Buff'], [2, 'Unholy Ward', 'Gain 7 Block.', 'Defense']] },
};
// ---------- Named card drops for cards added after the loot tables were written (Nov 1): the Warlock's whole pool and the Warrior's Blood Debt cards.
// Warlock: every enemy slot that names a Rogue card also names a Warlock card of the same rarity and chance (cards dealt round-robin, so every card
// lands somewhere and the class gets the same named-drop odds as the Rogue). Missing cards of other classes take one slot of their own class's rarity.
let CARDS_READY = false; // set at the end of this file, once every card (Warlock, Blood Debt...) exists
function namedLoot(data) {
  if (!data || !data.enemies || data._named) return; data._named = true;
  const slots = (cls) => { const out = {}; for (const k of Object.keys(data.enemies).sort()) { const e = data.enemies[k]; if (e.group) continue; for (const x of e.loot || []) if (x.type === 'Card' && x.cls === cls) (out[x.rarity] = out[x.rarity] || []).push([e, x.pct]); } return out; };
  const named = (cls) => { const s = new Set(); for (const e of Object.values(data.enemies)) for (const x of e.loot || []) if (x.type === 'Card' && x.cls === cls) s.add(x.item); return s; };
  const add = (e, k, pct) => { e.loot = e.loot || []; e.loot.push({ item: C[k].name, type: 'Card', cls: C[k].cls, rarity: C[k].rarity, pct, note: C[k].text }); };
  for (const cls of Object.keys(CLASSES)) {
    const have = named(cls), miss = cardPool(cls).filter(k => !have.has(C[k].name)).sort(); if (!miss.length) continue;
    const byR = {}; for (const k of miss) (byR[C[k].rarity] = byR[C[k].rarity] || []).push(k);
    if (!have.size) { const T = slots('Rogue'); for (const [r, ks] of Object.entries(byR)) { const t = T[r] || []; if (!t.length) continue; for (let i = 0; i < Math.max(t.length, ks.length); i++) { const [e, pct] = t[i % t.length]; add(e, ks[i % ks.length], pct); } } }
    else { const T = slots(cls); for (const [r, ks] of Object.entries(byR)) { const t = T[r] || []; if (!t.length) continue; ks.forEach((k, i) => { const [e, pct] = t[Math.floor((i + 0.5) * t.length / ks.length)]; add(e, k, pct); }); } }
  }
  for (const e of Object.values(data.enemies)) if (e.group && e.like && data.enemies[e.like]) e.loot = (data.enemies[e.like].loot || []).map(x => Object.assign({}, x)); // groups share their model monster's drops
}
function groupData(data) {
  if (!data || !data.enemies || data._groups) return; data._groups = true;
  for (const [k, g] of Object.entries(GROUPS)) {
    if (data.enemies[k]) continue; const like = data.enemies[g.like] || {};
    data.enemies[k] = { name: g.name, tier: g.tier, hp: g.hp, draw: 2, draw2: null, maxMana: 10, regen: 10, regen2: null, creature: g.creature, type: g.type, weak: g.weak, arch: 'Group (3 bodies)', desc: g.desc + ' A group: three bodies, one monster\'s HP and damage split between them.',
      deck: g.deck.map(([n, name, text, kind]) => ({ name, n, cost: 10, kind, text, phase2: false, dtype: /every player|damage/.test(text) ? g.type : 'Physical' })),
      gold: g.tier === '3' ? [24, 40] : [12, 24], pool: (like.pool || []).slice(), loot: (like.loot || []).map(x => Object.assign({}, x)), map: g.map, group: GROUP_N, unit: g.unit, art: g.art, like: g.like, dmgScale: g.dmg || 1 };
  }
}
// Nov 1 (d): every map's gear rolls that map's own resistance (Fire Reach gear: Fire Resistance), so you can farm the map you're stuck on.
// It used to roll the next map's element. M.dropOld remembers the old one so owned items can be moved over (itemRules, r4).
function mapResist(data) { if (!data || !data.maps || data._ownResist) return; data._ownResist = true; for (const M of Object.values(data.maps)) { M.dropOld = M.dropResist; M.dropResist = M.element; } }
function gearData(data) {
  mapResist(data); groupData(data); if (CARDS_READY) namedLoot(data);
  if (!data || !data.gear || data._shoulders) return; data._shoulders = true; const G = data.gear;
  Object.assign(G.arche, SHOULDER_ARCHE);
  for (const [mk, names] of Object.entries(SHOULDER_BASES)) names.forEach((name, i) => { if (!G.bases.some(b => b.name === name)) G.bases.push({ name, arch: ['Pauldrons', 'Spaulders', 'Mantle'][i], label: ['Plate', 'Leather', 'Cloth'][i] + ' Shoulders', map: mk }); });
  // Nov 1: each map boss also carries one Warlock codex
  const WLC = { physical: 'Shadow Knight', fire: 'Demonologist', frost: 'Soulbinder', nature: 'Blightcaller', arcane: 'Bloodmancer', shadow: 'Umbral Ruin' };
  for (const e of Object.values(data.enemies || {})) if (e.tier === 'Boss' && !e.raid && WLC[e.map] && e.loot && !e.loot.some(x => x.type === 'Codex' && x.cls === 'Warlock')) e.loot.push({ item: WLC[e.map] + ' Codex', type: 'Codex', cls: 'Warlock', rarity: 'Codex', pct: 3, note: 'Fixed codex passive plus random affixes; cannot be upgraded.' });
  // every monster that drops gear can drop its map's shoulders
  // each monster adds the one shoulder piece that matches the armor it already drops most (plate, leather or cloth), so shoulders drop about as often as any other slot
  for (const e of Object.values(data.enemies || {})) { if (!e.pool || !e.pool.length) continue; const add = SHOULDER_BASES[e.map || 'physical']; if (!add || e.pool.some(n => add.includes(n))) continue;
    const t = { Plate: 0, Leather: 0, Cloth: 0 }; for (const n of e.pool) { const b = G.bases.find(x => x.name === n), A = b && G.arche[b.arch]; if (A && t[A.type] != null) t[A.type]++; }
    const pick = Object.entries(t).sort((a, b) => b[1] - a[1] || ['Plate', 'Leather', 'Cloth'].indexOf(a[0]) - ['Plate', 'Leather', 'Cloth'].indexOf(b[0]))[0][0];
    e.pool.push(add[['Plate', 'Leather', 'Cloth'].indexOf(pick)]); }
}
if (DATA && DATA.gear) { gearData(DATA); gearRules(DATA.gear); }
function rollItem(data, rng, baseName, rarity, level) {
  gearData(data); gearRules(data.gear);
  const G = data.gear, b = G.bases.find(x => x.name === baseName); if (!b) return null;
  const A = G.arche[b.arch]; const R = G.rarity.find(r => r.name === rarity);
  const lv = Math.pow(G.levelGrowth, level), mult = R.mult * lv, twoH = A.hands && A.hands.startsWith('2H') ? G.twoHand : 1;
  const rollStat = (stat) => { const s = G.stats[stat]; const lo = Math.max(1, Math.round(s.min * mult * twoH)), hi = Math.max(lo, Math.round(s.max * mult * twoH)); const v = ri(rng, lo, hi); return { v, lo, hi, pts: v * s.pts / twoH }; };
  const stats = {}, lines = [];
  mapResist(data); const impEl = (b.map && data.maps && data.maps[b.map] && data.maps[b.map].dropResist) || 'Fire'; // each map's gear rolls its own resistance (Nov 1); codexes (no map) keep Fire
  const imp = rollStat('Map resistance (implicit)'); stats['Resistance:' + impEl] = imp.v;
  let points = imp.pts;
  const weights = Object.entries(A.weights).filter(([s]) => rarity === 'Purple (Epic)' || s !== 'Efficiency');
  const tot = weights.reduce((s, [, w]) => s + w, 0) / (1 - G.resChance);
  const ELS = ['Fire', 'Frost', 'Nature', 'Arcane', 'Shadow', 'Holy'];
  for (let i = 0; i < R.affixes; i++) {
    let pick = rng() * tot, stat = 'Resistance';
    for (const [s, w] of weights) { if (pick < w) { stat = s; break; } pick -= w; }
    const r = rollStat(stat); points += r.pts;
    let key = stat;
    if (stat === 'Resistance') key = 'Resistance:' + ELEMENTS[ri(rng, 0, 5)];
    if (stat === 'Elemental/Holy Damage') key = 'Elemental/Holy Damage:' + ELS[ri(rng, 0, 5)];
    stats[key] = (stats[key] || 0) + r.v; lines.push({ stat: key, v: r.v, lo: r.lo, hi: r.hi });
  }
  const imp2 = {};
  if (A.imp2) {
    if (A.imp2 === 'Draw / regen pool') { const pool = { White: 6, Green: 7, Blue: 8, 'Purple (Epic)': 9 }[rarity]; const d = ri(rng, 3, Math.min(5, pool - 2)); imp2.Draw = d; imp2.Regen = (pool - d) * 10; }
    else if (A.imp2.startsWith('Elemental damage')) imp2['Elemental/Holy Damage:' + ELS[ri(rng, 0, 5)]] = rollStat('Elemental/Holy Damage').v;
    else if (A.imp2 === 'Elemental/Holy Damage') imp2['Elemental/Holy Damage:' + (/Mace|Warhammer/.test(b.arch) ? 'Holy' : ELS[ri(rng, 0, 4)])] = rollStat(A.imp2).v;
    else if (A.imp2 === 'Shadow Damage') imp2['Elemental/Holy Damage:Shadow'] = rollStat('Elemental/Holy Damage').v; // Nov 2: the Scythe, the Warhammer's shadow twin
    else if (A.imp2 === 'Frost Damage') imp2['Elemental/Holy Damage:Frost'] = rollStat('Elemental/Holy Damage').v;
    else if (G.stats[A.imp2]) imp2[A.imp2] = rollStat(A.imp2).v;
  }
  const maxPts = (G.implicitMax + 4 * G.affixMax) * 1.3 * lv;
  const ilvl = Math.max(1, Math.min(100, Math.round(5 * level + 5 * Math.min(1, points / maxPts))));
  const slot = /Shield|Focus/.test(A.slot) ? 'Off-hand' : /Axe|Sword|Dagger|Mace|Wand|Maul|Warhammer|Staff|Scythe/.test(A.slot) ? 'Weapon' : A.slot;
  const out = { name: baseName, label: b.label, arch: b.arch, slot, hands: A.hands, rarity, ilvl, stats, imp2, lines, level };
  out.rerolls = rerollPotential(out); out.r2 = 1; out.r3 = 1; out.r4 = 1; return out;
}
// ---------- Rerolls (Nov 1): every item drops with a reroll potential (White 0-1, Green 1-2, Blue 2-3, Purple 3-4). Spending a Reroll Token
// and one point of potential rerolls one affix line of your choice: a new stat and value, rolled like a fresh drop of the same base, rarity and
// map level. Codexes can't be rerolled; they break down into Reroll Tokens instead. The potential comes from the item's own rolls (no extra RNG).
const REROLL_BASE = { White: 0, Green: 1, Blue: 2, 'Purple (Epic)': 3 };
function rerollPotential(it) { if (!it || !it.lines || !it.lines.length || it.slot === 'Codex') return 0; let h = 7; for (const l of it.lines) h = (h * 31 + l.v * 7 + l.stat.length) % 1000003; return (REROLL_BASE[it.rarity] || 0) + (h % 2); }
const CODEX_TOKENS = (it) => 3 + Math.floor((it && it.level || 0) / 2); // (before Nov 2; kept for old callers)
// Nov 2: Reroll Tokens are rare. Breaking a codex gives 1 token by chance: 10% for a +0 codex, +5% per map level it dropped on (certain from +18)
const CODEX_TOKEN_CHANCE = (it) => Math.min(1, 0.1 + 0.05 * (it && it.level || 0));
function itemPoints(G, b, it) { // the points an item rolled (its implicit plus every affix), for its item level
  const twoH = (G.arche[b.arch] || {}).hands && G.arche[b.arch].hands.startsWith('2H') ? G.twoHand : 1, base = (k) => k.split(':')[0];
  let pts = 0; const onLines = {}; for (const l of it.lines || []) { const st = G.stats[base(l.stat)]; if (st) pts += l.v * st.pts / twoH; onLines[l.stat] = (onLines[l.stat] || 0) + l.v; }
  const impKey = Object.keys(it.stats || {}).find(k => k.startsWith('Resistance:') && (it.stats[k] - (onLines[k] || 0)) > 0);
  if (impKey) { const st = G.stats['Map resistance (implicit)']; if (st) pts += (it.stats[impKey] - (onLines[impKey] || 0)) * st.pts / twoH; }
  return pts;
}
function rerollAffix(data, rng, it, idx) {
  gearData(data); gearRules(data.gear);
  const G = data.gear, b = G.bases.find(x => x.name === it.name); if (!b || !it.lines || !it.lines[idx]) return null;
  const A = G.arche[b.arch], R = G.rarity.find(r => r.name === it.rarity); if (!A || !R) return null;
  const level = it.level || 0, lv = Math.pow(G.levelGrowth, level), mult = R.mult * lv, twoH = A.hands && A.hands.startsWith('2H') ? G.twoHand : 1;
  const weights = Object.entries(A.weights).filter(([st]) => it.rarity === 'Purple (Epic)' || st !== 'Efficiency');
  const tot = weights.reduce((t, [, w]) => t + w, 0) / (1 - G.resChance);
  let pick = rng() * tot, stat = 'Resistance'; for (const [st, w] of weights) { if (pick < w) { stat = st; break; } pick -= w; }
  const S = G.stats[stat], lo = Math.max(1, Math.round(S.min * mult * twoH)), hi = Math.max(lo, Math.round(S.max * mult * twoH)), v = ri(rng, lo, hi);
  const ELS = ['Fire', 'Frost', 'Nature', 'Arcane', 'Shadow', 'Holy'];
  let key = stat; if (stat === 'Resistance') key = 'Resistance:' + ELEMENTS[ri(rng, 0, 5)]; if (stat === 'Elemental/Holy Damage') key = 'Elemental/Holy Damage:' + ELS[ri(rng, 0, 5)];
  const old = it.lines[idx]; it.stats = Object.assign({}, it.stats); it.stats[old.stat] = (it.stats[old.stat] || 0) - old.v; if (it.stats[old.stat] <= 0) delete it.stats[old.stat];
  it.stats[key] = (it.stats[key] || 0) + v; it.lines = it.lines.slice(); it.lines[idx] = { stat: key, v, lo, hi };
  const maxPts = (G.implicitMax + 4 * G.affixMax) * 1.3 * lv;
  it.ilvl = Math.max(1, Math.min(100, Math.round(5 * level + 5 * Math.min(1, itemPoints(G, b, it) / maxPts))));
  return { old, now: it.lines[idx] };
}
// ---------- card ranks (Draft 10/11 rules, simplified for the prototype)
// Cards with a big number (8+) grow it 10% of base per rank (White/Green) or 8% (Blue/Gold); +10 is about double.
// Cards with only small numbers get 1 mana cheaper per rank instead, down to 60% of base cost.
const CARD_XP = { White: 1, Green: 3, Blue: 9, Gold: 27 };      // XP a card gives when fed to another (x2 if it's the same card)
const RANK_BASE = { White: 2, Green: 4, Blue: 8, Gold: 16 };    // reaching rank N costs N x this in XP, and N x this x 5 gold
const DECK_POINTS = { White: 15, Green: 28, Blue: 42, Gold: 59 }, DECK_RANK_STEP = 1.9 / 3;
const DECK_CAPS = { Gold: 2, Blue: 4, Green: 6 }, DECK_MIN = 20, DECK_MAX = 30, MAX_RANK = 10;
function bigNumber(d) { const t = d.tags || {}; return (t.dmg || 0) >= 8 || (t.def || 0) >= 8 || (t.heal || 0) >= 8; }

// ---------------- Codex talents (Nov 1) ----------------
// Wearing a codex earns XP for it (per kill); every 2 codex levels open a talent row (max level 20, 10 rows).
// Talents only work while that codex is worn; points are kept when you swap. Data: src/talents.js.
const TALENTS = (typeof module !== 'undefined' && module.exports) ? require('./talents.js') : (root.CB_TALENTS || {});
const CODEX_MAX = 20;
const CODEX_XP = (lv) => Math.round(14 * Math.pow(1.15, lv - 1)); // XP from level lv-1 to lv: about 70 full solo runs to 20, each level 15% slower
const KILL_XP = (tier) => tier === 'Boss' ? 10 : tier === 'Elite' ? 3 : 1;
function codexLevel(xp) { xp = Math.max(0, Math.floor(xp || 0)); let lv = 0; while (lv < CODEX_MAX && xp >= CODEX_XP(lv + 1)) { xp -= CODEX_XP(lv + 1); lv++; } return { level: lv, into: xp, need: lv < CODEX_MAX ? CODEX_XP(lv + 1) : 0, rows: Math.floor(lv / 2) }; }
const tcond = (cb, p, c) => {
  if (!c) return true; const [k, v] = c.split(':');
  if (k === 'block') return p.block >= (+v || 1); if (k === 'stealth') return !!p.stealth; if (k === 'devotion') return p.devotion + (p._devHit || 0) >= (+v || 1);
  if (k === 'any') return cb.foes().some(e => (e[v] || 0) > 0); if (k === 'prevSkill') return p.prevType === 'Skill'; if (k === 'prevAttack') return p.prevType === 'Attack';
  if (k === 'elems') return (p.turnElems || []).length >= +v; if (k === 'lowhp') return p.hp < p.maxHp / 2; return true;
};
const tvs = (e, vs) => { if (!vs) return true; if (!e) return false; if (vs === 'stunHand') return (e.hand || []).some(c => c && c.status === 'stun'); const [k, v] = vs.split(':'), x = e[k]; return (x && typeof x === 'object' ? 1 : (x || 0)) >= (+v || 1); };
const tcard = (d, f) => !!d && (!f.type || d.type === f.type) && (!f.dtype || (d.dtype || (d.type === 'Attack' ? 'Physical' : null)) === f.dtype) && (!f.key || d.key === f.key) && (!f.minCost || (d.cost || 0) >= f.minCost);
// mini-capstone party buffs (row 5 Support): applied to every hero once, at the start of the fight
function partyStat(a, st, n) {
  if (st === 'maxHpPct') { const x = Math.round(a.maxHp * n / 100); a.maxHp += x; a.hp += x; }
  else if (st === 'maxManaPct') a.maxMana += Math.round(a.maxMana * n / 100);
  else if (st === 'regenPct') a.regen += Math.round(a.regen * n / 100);
  else if (st === 'initPct') a.baseInit += Math.max(1, Math.round(a.baseInit * n / 100));
  else if (st === 'critMult') a.critMult += n / 100;
  else if (st === 'resistAll') { for (const el of ELEMENTS) a.resist[el] = Math.min(75, (a.resist[el] || 0) + n); }
  else if (st !== 'luck') a[st] = (a[st] || 0) + n;
}
// run-level talents (loot Luck, health regen after fights, extraction, map rolls): ['run', key, n] summed for one hero
function talentRun(spec) { const o = {}; const tr = spec && TALENTS[spec.codex]; if (!tr) return o; (spec.picks || []).forEach((j, i) => { const t = i < 9 && j != null && tr.rows[i] && tr.rows[i][j]; if (t) for (const f of t.fx) if (f[0] === 'run') o[f[1]] = (o[f[1]] || 0) + f[2]; }); return o; }
function talentLuck(spec) { return talentRun(spec).partyLuck || 0; }
// one hidden Power holds all of a hero's picked talents, so percentages from different rows add up
function talentDef(list, cap, label) {
  const D = { hm: [], cr: [], cx: 0, fl: [], dm: [], hl: 0, inc: [], dp: {}, dx: {}, dev: 0, sh: 0, start: [], turn: [], kill: [], hit: [], full: [], low: null, cheat: null, every: [], cost: [], first: [], aura: [] };
  for (const t of list) for (const f of t.fx) {
    const [k, a, b, c, d2, e2] = f;
    if (k === 'dmg') D.hm.push([a, b || {}]); else if (k === 'crit') D.cr.push([a, b || {}]); else if (k === 'critX') D.cx += a; else if (k === 'flat') D.fl.push([b, c || {}]);
    else if (k === 'dmgPer') D.hm.push([0, d2 ? Object.assign({}, e2 || {}, { per: [a, b, c, d2] }) : {}]);
    else if (k === 'def') D.dm.push([a, b]); else if (k === 'heal') D.hl += a; else if (k === 'incoming') D.inc.push([a, b]);
    else if (k === 'dotPlus') D.dp[a] = (D.dp[a] || 0) + b; else if (k === 'dotX') D.dx[a] = (D.dx[a] || 0) + b; else if (k === 'devPlus') D.dev += a; else if (k === 'shurPlus') D.sh += a; else if (k === 'dotCrit') (D.dc = D.dc || {})[a] = true;
    else if (k === 'start') D.start.push([a, b, c]); else if (k === 'turn') D.turn.push([a, b, c, d2]); else if (k === 'kill') D.kill.push([a, b, c]);
    else if (k === 'hitBy') D.hit.push([a, b, c]); else if (k === 'full') D.full.push([a, b, c]); else if (k === 'lowhp') D.low = [a, b]; else if (k === 'cheat') D.cheat = [a, b];
    else if (k === 'party') (D.party = D.party || []).push([a, b]);
    else if (k === 'vulnX') D.vx = Math.max(D.vx || 1, a);
    else if (k === 'arcRegen') D.arcRegen = a; else if (k === 'dealtDef') D.dd = (D.dd || 0) + a;
    else if (k === 'parryFirst') D.pf = (D.pf || 0) + a; else if (k === 'parryExtra') D.px = true; else if (k === 'extraTarget') (D.xt = D.xt || []).push([a, b || {}]); else if (k === 'extraStrike') (D.xs = D.xs || []).push([a, b || {}]);
    else if (k === 'dealtBleed') (D.db = D.db || []).push([a, b || {}]);
    else if (k === 'every') D.every.push([a, b, c, d2, e2]); else if (k === 'cost') D.cost.push([a, b]); else if (k === 'firstCost') D.first.push([a, b]); else if (k === 'aura') D.aura.push(...a);
  }
  const P = { talent: true, label };
  const act = (cb, p, what, n, key, nm) => { // one effect, for p (cb.player is p inside hooks)
    if (cb.over) return;
    switch (what) {
      case 'block': cb.gainDef(n); break;
      case 'mana': p.mana += n; break;
      case 'manaPer': { const k2 = cb.foes().filter(e => (e[key] || 0) > 0).length * n; if (k2) { p.mana += k2; cb.say('player', `${nm}: +${k2} mana.`); } break; }
      case 'str': p.strCombat += n; break;
      case 'heal': cb.heal(p, Math.round(p.maxHp * n / 100), nm); break;
      case 'draw': cb.drawCards(p, n); break;
      case 'dot': for (const e of cb.foes()) cb.applyDot(e, key, n); break;
      case 'debuff': for (const e of cb.foes()) { if (key === 'chill') cb.applyChill(e, n); else e[key] = (e[key] || 0) + n; } break;
      case 'stealth': p.stealth = true; break;
      case 'devotion': devote(cb, p, n); break;
      case 'shuriken': for (let i = 0; i < n; i++) cb.addToHand('shuriken'); break;
      case 'discard': for (const e of cb.foes()) cb.eDiscard(e, n); break;
      case 'dazed': for (const e of cb.foes()) cb.eStatus(e, 'dazed', n); break;
      case 'drain': for (const e of cb.foes()) cb.drainMana(e, n); break;
      case 'cleanse': cb.cleanse(p, n); break;
      case 'summon': for (let i = 0; i < n; i++) cb.summon(p, key); break;
    }
  };
  const NM = 'Talent';
  if (D.hm.length) P.hitMult = (cb, p, e, ctx) => { let m = 1; for (const [pct, f] of D.hm) { if (!tcard(ctx.d || { type: ctx.kind, dtype: ctx.dtype }, f) && !(f.dtype && !f.type && ctx.dtype === f.dtype)) continue; if (f.self && !tcond(cb, p, f.self)) continue; if (f.per) { const [st, step, pp, max] = f.per; m *= 1 + Math.min(max, Math.floor(((e && e[st]) || 0) / step) * pp) / 100; continue; } if (!tvs(e, f.vs)) continue; m *= 1 + pct / 100; } return m; };
  if (D.cr.length) P.crit = (cb, p, d) => D.cr.reduce((s, [n, f]) => s + ((!f.type && !f.key || tcard(d, f)) && (!f.self || tcond(cb, p, f.self)) ? n : 0), 0);
  if (D.cx) P.critMultX = 1 + D.cx / 100;
  if (D.dc) P.dotCrit = D.dc;
  if (D.fl.length) P.flat = (cb, p, d) => D.fl.reduce((s, [pct, f]) => s + (tcard(d, f) ? Math.round(p.block * pct / 100) : 0), 0);
  if (D.dm.length) P.defMultFn = (cb, p) => D.dm.reduce((m, [pct, c]) => m * (tcond(cb, p, c) ? 1 + pct / 100 : 1), 1);
  if (D.hl) P.healMult = 1 + D.hl / 100;
  if (D.inc.length) P.incoming = (cb, p) => D.inc.reduce((m, [pct, c]) => m * (tcond(cb, p, c) ? 1 - pct / 100 : 1), 1);
  if (Object.keys(D.dp).length) P.dotPlus = D.dp;
  if (Object.keys(D.dx).length) P.dotMult = Object.fromEntries(Object.entries(D.dx).map(([k, v]) => [k, 1 + v / 100]));
  if (D.dev) P.devotionPlus = D.dev; if (D.sh) P.shurikenPlus = D.sh;
  if (D.party) P.partyBuff = D.party;
  if (D.start.length || D.turn.length || cap || D.aura.length) P.turnStart = (cb, p, pw) => {
    if (!pw.started) {
      pw.started = true;
      if (D.aura.length) { const ad = talentDef([{ fx: D.aura }], null, label); for (const a of cb.allies()) if (a !== p && a.isPlayer && !a.dead) a.powers.push({ key: 'talents_aura', name: label + ' (ally)', text: 'From ' + p.name + '\'s talents.', talent: true, def: ad }); }
      for (const [w, n, key] of D.start) act(cb, p, w, n, key, label);
      if (cap && C[cap] && C[cap].play) { cb.say('player', `${label}: ${C[cap].name} starts in play.`); cb.player = p; C[cap].play(cb, null); cb.player = p; }
    }
    for (const [w, n, key, c] of D.turn) if (tcond(cb, p, c)) act(cb, p, w, n, key, label);
  };
  if (D.kill.length) P.onKill = (cb, p, dead) => { for (const [w, n, key] of D.kill) {
    if (w === 'spread') { const v = dead[key] || 0; if (v > 0) { for (const e of cb.foes()) if (e !== dead) { if (['burn', 'bleed', 'poison', 'dread', 'rot'].includes(key)) cb.applyDot(e, key, v); else e[key] = (e[key] || 0) + v; } cb.say('player', `${label}: ${dead.name}'s ${key} spreads.`); } }
    else if (w === 'mana') p.mana += n; else act(cb, p, w, n, key, label); } };
  if (D.hit.length || D.low) P.hitBy = (cb, p, e, r) => {
    for (const [w, n, key] of D.hit) {
      if (w === 'back') { if (r.absorbed > 0 && e.hp > 0) { cb.applyHit(p, e, n, { label }); if (e.hp <= 0) cb.onDeath(e); } }
      else if (e.hp > 0) { if (w === 'dot') cb.applyDot(e, key, n); else if (key === 'chill') cb.applyChill(e, n); else e[key] = (e[key] || 0) + n; }
    }
    if (D.low && !p.tLow && p.hp > 0 && p.hp < p.maxHp * 0.3) { p.tLow = true; const [pct, mode] = D.low;
      if (mode === 'heal') cb.heal(p, Math.round(p.maxHp * pct / 100), label); else { cb.gainDef(Math.round(p.maxHp * pct / 100)); if (mode === 'stealth') p.stealth = true; } cb.say('crit', `${label}: a last-moment save.`); }
  };
  if (D.full.length) P.fullBlock = (cb, p, e) => { for (const [w, n, key] of D.full) {
    if (w === 'back') { if (e.hp > 0) { cb.applyHit(p, e, n, { label }); if (e.hp <= 0) cb.onDeath(e); } } else if (w === 'debuff') { if (e.hp > 0) e[key] = (e[key] || 0) + n; } else if (w === 'mana') p.mana += n; else act(cb, p, w, n, key, label); } };
  if (D.cheat) P.cheat = D.cheat;
  if (D.dd) P.dealtDef = D.dd;
  if (D.vx) P.vulnX = D.vx;
  if (D.db) P.dealt = (cb, p, h) => { if (!h.e || h.e.hp <= 0 || h.e.isPlayer === p.isPlayer) return; for (const [pct, f] of D.db) { if (f.type && h.kind !== f.type) continue; if (f.dtype && (h.dtype || 'Physical') !== f.dtype) continue; const n = Math.round(((h.lost || 0) + (h.absorbed || 0)) * pct / 100); if (n > 0) { cb.applyDot(h.e, 'bleed', n); h.e.bleedBy = p.id; } } };
  if (D.every.length || D.first.length) P.cardPlayed = (cb, p, d) => {
    D.every.forEach(([N, f, w, n, key], i) => { if (!tcard(d, f)) return; const k = 'te' + i; p.turn[k] = (p.turn[k] || 0) + 1; if (p.turn[k] % N === 0) { act(cb, p, w, n, key, label); cb.say('player', `${label}: every ${N}${N === 3 ? 'rd' : 'th'} card bonus.`); } });
    D.first.forEach(([n, f], i) => { if (tcard(d, f)) p.turn['tf' + i] = true; });
  };
  if (D.cost.length || D.first.length) P.costLess = (cb, p, d) => D.cost.reduce((s, [n, f]) => s + (tcard(d, f) ? n : 0), 0) + D.first.reduce((s, [n, f], i) => s + (tcard(d, f) && !p.turn['tf' + i] ? n : 0), 0);
  if (D.pf) { const prev = P.hitMult; P.hitMult = (cb, p, e, ctx, pw) => (prev ? prev(cb, p, e, ctx, pw) : 1) * (ctx.kind === 'Attack' && p.parriedLast && p.turnAttacks === 0 ? 1 + D.pf / 100 : 1); }
  if (D.px || D.xt) P.extraTarget = (cb, p, d) => (D.px && p.parriedLast && p.turnAttacks === 0 ? 1 : 0) + (D.xt || []).reduce((s, [pct, f]) => s + (tcard(d, f) && cb.rng() * 100 < pct ? 1 : 0), 0);
  if (D.xs) P.extraStrike = (cb, p, d) => (D.xs || []).reduce((s, [pct, f]) => s + (tcard(d, f) && cb.rng() * 100 < pct ? 1 : 0), 0);
  if (D.arcRegen) { const prev = P.cardPlayed; P.cardPlayed = (cb, p, d, pw) => { if (prev) prev(cb, p, d, pw); if (d.type === 'Skill' && d.dtype === 'Arcane' && !pw.arcRegen) { pw.arcRegen = true; p.regen += D.arcRegen; cb.say('player', `${label}: +${D.arcRegen} mana regeneration for the fight.`); } }; }
  return P;
}

// Per-level upgrades (Oct 31): every card has its own upgrade, set in design/Cardbound_Card_Upgrades.xlsx and built into
// src/card_upgrades.js by design/scripts/card_upgrades.py. Each number token in the text says how it grows:
// [start, end, base, kind, step, every]: base + step per `every` levels. Kinds ms_* are milestones: +1 at +5 and +2 at +10.
const UPG = (typeof module !== 'undefined' && module.exports) ? require('./card_upgrades.js') : (root.CB_UPGRADES || {});
const RK_FIELDS = { dmg: ['nextAttackFlat', 'turn.skillFlat', 'nextSkillMult', 'nextAttackMult'], bleed: ['bleed'], poison: ['poison'], burn: ['burn'], dread: ['dread'], vulnerable: ['vulnerable'], weak: ['weak'], slow: ['slow'], chill: ['chill'], unwarded: ['unwarded'], exposure: ['exposure'], condemnation: ['condemn'],
  str: ['strTurn', 'strCombat'], int: ['intTurn'], dex: ['dexTurn', 'dexterity'], mana: ['mana', 'manaNext', 'turn.killMana'], regen: ['regen'], maxMana: ['maxMana'], init: ['initNext'], thorns: ['thorns'], devotion: ['devotion'], back: ['parryBack', 'until.backDmg'] };
const RK_FLOAT = { nextSkillMult: 1, nextAttackMult: 1 };
const rkGet = (a, f) => { const i = f.indexOf('.'); if (i < 0) return a[f]; const o = a[f.slice(0, i)]; return o ? o[f.slice(i + 1)] : undefined; };
const rkSet = (a, f, x) => { const i = f.indexOf('.'); if (i < 0) a[f] = x; else a[f.slice(0, i)][f.slice(i + 1)] = x; };
const RK_KIND = {}; for (const k in RK_FIELDS) for (const f of RK_FIELDS[k]) RK_KIND[f] = k;
const RK_ALL = Object.keys(RK_KIND);
const MILESTONE = (r) => (r >= 5 ? 1 : 0) + (r >= 10 ? 1 : 0);
const UPG_SPECIAL = { // key -> (N = token values in text order, rank, v, base card) => { play, text }
  guarded_stance: (N) => ({ play: (cb, t, p) => { cb.gainDef(N[0]); (p.until.onFull = p.until.onFull || []).push((c, q) => { c.say('player', `Guarded Stance: draw ${N[1]}.`); c.drawCards(q, N[1]); }); } }),
  jarring_parry: (N) => ({ play: (cb, t, p) => { cb.gainDef(N[0]); (p.until.onFull = p.until.onFull || []).push((c, q, e) => c.eStatus(e, 'dazed', N[1])); } }),
  riposte: (N) => ({ play: (cb, t, p) => { cb.gainDef(N[0]); (p.until.onFull = p.until.onFull || []).push((c, q, e) => { if (e.hp > 0 && !q.until.riposted) { q.until.riposted = true; c.applyHit(q, e, N[1], { label: 'Riposte' }); c.say('player', `Riposte: ${e.name} takes ${N[1]}.`); if (e.hp <= 0) c.onDeath(e); } }); } }),
  shield_up: (N) => ({ play: (cb, t, p) => { cb.gainDef(N[0]); p.defNext += N[1]; } }),
  mark_for_death: (N) => ({ play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; e.vulnerable += N[0]; e.markDraw = cb.round; e.markDrawN = N[1]; say(cb, `${e.name} gains ${N[0]} Vulnerable; each ally's first Attack on it this round draws ${N[1]}.`); } }),
  sundering_blow: (N) => ({ play: (cb, t, p) => { const e = tgtOf(cb, t); for (let i = 0; i < N[1] && e && e.hp > 0 && !cb.over; i++) { e.block = Math.max(0, e.block - N[2]); cb.hit(e, N[0], 'Sundering Blow'); } } }),
  survey_the_field: (N) => ({ play: (cb, t, p) => cb.topPick(p, N[0]) }),
  underdog: (N) => ({ play: (cb, t, p) => { const e = tgtOf(cb, t); D_(cb, e, N[0] + (e && p.hp < e.hp ? N[1] : 0), 'Underdog'); } }),
  desperate_strike: (N) => ({ play: (cb, t, p) => D_(cb, t, N[0] + Math.floor((1 - p.hp / p.maxHp) * 20) * N[1], 'Desperate Strike') }),
  hamstring: (N) => ({ play: (cb, t, p) => { const e = D_(cb, t, N[0], 'Hamstring'); if (e) e.weakNext = N[1] / 100; } }),
  bloodthirst: (N) => ({ play: (cb, t) => { const lost = cb.hit(t, 10, 'Bloodthirst'); cb.heal(cb.player, Math.round(lost * N[0] / 100), 'Bloodthirst', true); } }),
  adrenaline_surge: (N) => ({ play: (cb, t, p) => { p = cb.player; p.strCombat += N[0]; cb.timed(p, 'adrenaline', Math.ceil(N[0] / N[1]), { each: (c, q) => { q.strCombat -= Math.min(N[1], q.strCombat); } }); say(cb, `+${N[0]} Strength, fading by ${N[1]} each turn.`); } }),
  cauterize: (N, r, v) => ({ text: v.text.replace('per stack removed.', `per stack removed, plus ${2 * r}.`), play: (cb, t, p) => { p = cb.player; const n = p.bleed + p.burn; p.bleed = 0; p.burn = 0; cb.heal(p, n + 2 * r, 'Cauterize'); } }),
  reclaim_ground: (N, r, v) => ({ text: v.text.replace('Vulnerable consumed.', `Vulnerable consumed, plus ${r}.`), play: (cb, t, p) => { const e = tgtOf(cb, t); if (!e) return; const n = e.vulnerable; e.vulnerable = 0; cb.gainDef(n + r); } }),
  clear_head: (N) => ({ play: (cb, t, p) => { const n = cb.exhaustStatus(cb.player, 10); cb.drawCards(cb.player, n * N[0]); } }),
  fall_back: (N, r, v, d) => ({ text: v.text + ` Heal ${2 * r} HP.`, play: (cb, t, p) => { d.play(cb, t, cb.player); cb.heal(cb.player, 2 * r, 'Fall Back'); } }),
  sanguine_guard: (N, r, v, d) => ({ text: v.text + ` Heal ${2 * r} HP.`, play: (cb, t, p) => { d.play(cb, t, cb.player); cb.heal(cb.player, 2 * r, 'Sanguine Guard'); } }),
  shatter_morale: (N, r, v) => ({ text: v.text.replace('You lose all your Block.', `You lose ${100 - 5 * r}% of your Block.`), play: (cb, t, p) => { p = cb.player; const e = tgtOf(cb, t); if (e) cb.removeBuffs(e, 9); p.block = Math.round(p.block * 5 * r / 100); } }),
  wind_up: (N) => ({ play: (cb, t, p) => { cb.player.windUp = N[0]; say(cb, `Your next Attack deals +${N[0]} damage per 5 mana it costs.`); } }),
  rattling_roar: (N) => ({ play: (cb, t, p) => { const e = D_(cb, t, N[0], 'Rattling Roar'); if (e) e.drawLess = (e.drawLess || 0) + N[1]; } }),
  mind_fog: (N) => ({ play: (cb, t) => { const e = tgtOf(cb, t); if (e) e.drawLess = (e.drawLess || 0) + N[0]; } }),
  throw_weapon: (N, r, v) => { const k = 2 + MILESTONE(r); return { text: v.text.replace(/You and the target each discard 2 cards from your hands\./, `You discard 2 cards and the target discards ${k}.`), play: (cb, t, p) => { p = cb.player; const e = D_(cb, t, N[0], 'Throw Weapon'); for (let i = 0; i < 2 && p.hand.length; i++) { const c = p.hand.slice().sort((a, b) => (C[a.key].type === 'Status' ? -1 : C[a.key].cost) - (C[b.key].type === 'Status' ? -1 : C[b.key].cost))[0]; p.hand.splice(p.hand.indexOf(c), 1); p.discard.push(c); } if (e && e.hp > 0) cb.eDiscard(e, k); } }; },
  double_strike: (N, r, v) => ({ text: v.text + ` It deals ${2 * r}% more damage.`, play: (cb, t, p) => { cb.player.turn.twice = { type: 'Attack', extra: 10, mult: 1 + 0.02 * r }; say(cb, `Your next Attack is played twice (+10 mana, +${2 * r}% damage).`); } }),
  shadow_echo: (N, r, v) => ({ text: v.text + ` It deals ${5 * r}% more damage.`, play: (cb, t, p) => { cb.player.turn.twice = { type: 'Attack', extra: 10, mult: 1 + 0.05 * r }; say(cb, `Your next Attack is played twice (+10 mana, +${5 * r}% damage).`); } }),
  elemental_ward: (N, r, v, d) => ({ text: v.text + ` You also gain ${5 * r}% resistance to it.`, play: (cb, t, p) => { p = cb.player; d.play(cb, t, p); const el = p.until.convert; if (!el) return; p.resist[el] = (p.resist[el] || 0) + 5 * r; cb.timed(p, 'eward', 1, { end: (c, q) => { q.resist[el] -= 5 * r; } }); } }),
  reckless_abandon: (N, r, v) => ({ text: v.text + ` Gain ${1 + r} Strength this turn per card drawn.`, play: (cb, t, p) => { p = cb.player; const n = p.hand.length; p.discard.push(...p.hand.splice(0)); cb.drawCards(p, n + 1); p.strTurn += (n + 1) * (1 + r); say(cb, `+${(n + 1) * (1 + r)} Strength this turn.`); } }),
  all_in: (N, r, v, d) => ({ text: v.text + ` Gain ${2 * r} Dodge.`, play: (cb, t, p) => { d.play(cb, t, cb.player); cb.gainDef(2 * r); } }),
  sweeping_strikes: (N, r, v) => { const n = 1 + (r >= 3 ? 1 : 0) + (r >= 4 ? 1 : 0), w = ['a second enemy', 'a second and third enemy', 'three more enemies'][n - 1]; return { text: v.text.replace('a second enemy', w), play: (cb, t, p) => { cb.player.turn.sweep = 2; cb.player.turn.sweepN = n; say(cb, `Your next 2 single-target Attacks also hit ${w}.`); } }; },
  killing_blow: (N, r, v) => ({ text: v.text.replace('deals double damage', `deals ${100 + 10 * r}% more damage`), play: (cb, t, p) => { cb.player.turn.killingBlow = 2 + 0.1 * r; say(cb, `Your next crit this turn deals ${100 + 10 * r}% more damage.`); } }),
  manaquake: (N, r, v) => ({ text: v.text.replace('equal to the amount consumed', `equal to ${100 + 5 * r}% of the amount consumed`), play: (cb, t, p) => { p = cb.player; const m = Math.floor(p.mana / 2); p.mana -= m; DA(cb, m * (1 + 0.05 * r), 'Manaquake'); } }),
  thousand_cuts: (N, r, v) => { const per = 1 + (r >= 3 ? 1 : 0) + (r >= 4 ? 1 : 0); return { text: v.text.replace('Attack once', ['Attack once', 'Attack twice', 'Attack three times'][per - 1]), play: (cb, t, p) => { const hits = Math.floor(cb.spendAll(cb.player) / 5) * per; for (let i = 0; i < hits && !cb.over; i++) D_(cb, t, 1, 'Thousand Cuts'); } }; },
  assassinate: (N, r, v) => ({ text: v.text.replace('deals double damage', `deals ${100 + 10 * r}% more damage`), play: (cb) => { cb.player.nextAttackMult = 2 + 0.1 * r; cb.say('player', `Your next Attack deals ${100 + 10 * r}% more damage.`); } }),
  ashen_drain: (N, r, v, d) => ({ text: v.text + ` You gain mana equal to ${5 * r}% of the Burn.`, play: (cb, t, p) => { p = cb.player; const e = tgtOf(cb, t); const b = e ? e.burn : 0; d.play(cb, t, p); const g = Math.round(b * 0.05 * r); if (g) { p.mana += g; say(cb, `+${g} mana.`); } } }),
  bait: (N) => ({ play: (cb, t, p) => { p = cb.player; cb.gainDef(N[0]); (p.parryNext = p.parryNext || []).push((c, q, e) => { e.vulnerable += N[1]; c.eDiscard(e, N[2]); c.say('player', `${e.name} takes the bait: ${N[1]} Vulnerable.`); }); } }),
  defiant_roar: (N) => ({ play: (cb, t, p) => { p = cb.player; cb.setTaunt(p); p.until.lessDmg = N[0] / 100; } }),
  relentless_assault: (N) => ({ play: (cb, t, p) => { cb.timed(cb.player, 'relentless', N[0], { n: N[1] }); say(cb, `For ${N[0]} turns, unblocked hits apply ${N[1]} Vulnerable.`); } }),
  plunder_armor: (N) => ({ play: (cb, t, p) => { p = cb.player; const e = tgtOf(cb, t); if (!e) return; const n = Math.min(N[0], e.block); e.block -= n; p.block += n; say(cb, `Took ${n} Block from ${e.name}.`); } }),
  coated_blade: (N) => ({ play: (cb, t, p) => { cb.player.turn.coated = N[0] / 100; say(cb, `Your next Attack also applies ${N[0]}% of its damage as Bleed and Poison.`); } }),
  lurk: (N) => ({ play: (cb, t, p) => { cb.gainDef(N[0]); cb.player.turn.lurk = N[1]; } }),
  grievous_shiv: (N) => ({ play: (cb, t) => { const e = D_(cb, t, N[0], 'Grievous Shiv'); if (e) e.grievous = N[1]; } }),
  withering_flame: (N) => ({ play: (cb, t) => { const e = tgtOf(cb, t); if (!e) return; cb.applyDot(e, 'burn', N[0]); e.grievous = N[1]; } }),
  blinding_speed: (N) => ({ play: (cb, t, p) => { p = cb.player; cb.timed(p, 'speed', N[1], { begin: (c, q) => { q.baseInit += N[0]; }, end: (c, q) => { q.baseInit -= N[0]; } }); cb.drawCards(p, N[2]); } }),
  time_theft: (N) => ({ play: (cb, t, p) => { p = cb.player; const e = tgtOf(cb, t); if (!e) return; e.baseInit -= N[0]; p.baseInit += N[0]; say(cb, `Stole ${N[0]} Initiative from ${e.name} for the fight.`); } }),
  frost_armor: (N) => ({ play: (cb, t, p) => { p = cb.player; cb.gainDef(N[0]); (p.until.nextAttacker = p.until.nextAttacker || []).push((c, q, e) => c.applyChill(e, N[1])); } }),
  frostbite_curse: (N) => ({ play: (cb, t) => cb.eStatus(tgtOf(cb, t), 'frostbite', N[0]) }),
  seal_of_light: (N) => ({ play: (cb, t, p) => { cb.player.turn.lifesteal = N[0] / 100; say(cb, `Your Attacks heal you for ${N[0]}% of their damage this turn.`); } }),
  siphoning_strikes: (N, r, v) => ({ play: (cb, t, p) => { cb.player.turn.siphon = v.rkAll; say(cb, 'Damage you deal this turn also burns mana.'); } }),
  shake_it_off: (N) => ({ play: (cb, t, p) => { cb.cleanse(cb.player, N[0]); cb.drawCards(cb.player, N[1]); } }),
  scent_of_blood: (N) => ({ play: (cb, t, p) => cb.drawCards(p, cb.alive().filter(e => e.bleed > 0).length * N[0]) }),
};
function upgPlural(t) { return t.replace(/\b(\d+) ((?:extra |more |random |bonus |fewer )?)(card|turn|round|time|Shuriken|stack|debuff|enemy)\b(?!s)/g, (m, n, a, w) => +n === 1 ? m : `${n} ${a}${w}s`); }
function rankedCard(key, rank) {
  const d = C[key]; if (!rank) return d;
  const v = Object.create(d); v.rank = rank; v.name = d.name + ' +' + rank; v.mult = 1;
  const u = UPG[key] || {}, toks = u.t || [], rk = {}, ms = {}, pow = d.type === 'Power'; let main = 0;
  const tval = ([, , n, k, s, e]) => k.startsWith('ms_') ? n + (s ? s * Math.floor(rank / (e || 1)) : MILESTONE(rank)) : n + s * Math.floor(rank / (e || 1));
  for (const [, , n, k, s, e] of toks) {
    if (k.startsWith('ms_')) { ms[k.slice(3)] = (s ? s * Math.floor(rank / (e || 1)) : MILESTONE(rank)); continue; }
    const val = n + s * Math.floor(rank / (e || 1));
    if (!main) main = val / n; if (rk[k] == null) rk[k] = val / n;
  }
  if (pow && main) for (const k in rk) rk[k] = main; // a Power's numbers all grow together
  let txt = d.text;
  for (const t of toks.slice().sort((x, y) => y[0] - x[0])) {
    const [i, j, n, k] = t, val = u.x || k.startsWith('ms_') ? tval(t) : Math.round(n * (pow ? main : rk[k]));
    txt = txt.slice(0, i) + val + txt.slice(j);
  }
  if (u.dw && MILESTONE(rank)) { ms.draw = MILESTONE(rank); txt = txt.replace(/([Dd])raw a card/, (m, D) => `${D}raw ${1 + ms.draw} cards`); }
  if (u.d35 && rank >= 3) { ms.draw = (rank >= 3 ? 1 : 0) + (rank >= 5 ? 1 : 0); txt = txt.replace(/([Dd])raw 1 card/, (m, D) => `${D}raw ${1 + ms.draw} cards`); } // Nov 2: +1 card at +3, +2 at +5 (Battle Shout)
  if (u.tw && MILESTONE(rank)) { ms.hits = MILESTONE(rank); txt = txt.replace(/\btwice\b/, `${2 + ms.hits} times`); }
  if (u.fr && MILESTONE(rank)) { ms.draw = MILESTONE(rank); v.msFree = true; txt += ` Draw ${ms.draw} card.`; }
  if (u.r) { rk.all = 1 + u.r * rank / 100; txt += ` (Upgrade: +${u.r * rank}% to its amount.)`; }
  if (u.c && d.cost != null) v.cost = Math.max(0, d.cost - Math.floor(rank / u.c));
  if (u.cs && d.cost != null) v.cost = Math.max(0, d.cost - u.cs * rank); // Nov 2: -cs mana per level (Shadow Ambush: -2)
  v.rk = rk; v.ms = ms; v.rkMain = main || rk.all || 1; v.text = upgPlural(txt);
  if (u.x) { // hand-made: the play is rebuilt from the token values, so nothing else scales it
    const N = toks.slice().sort((x, y) => x[0] - y[0]).map(tval); v.rkAll = rk.all || 1; v.rk = {}; v.ms = {};
    if (pow) v.pwN = N; const sp = UPG_SPECIAL[key]; if (sp) { const r = sp(N, rank, v, d); if (r && r.play) v.play = (cb, t) => r.play(cb, t, cb.player); if (r && r.text) v.text = upgPlural(r.text); }
  }
  return v;
}
function cardPool(cls) { return Object.keys(C).filter(k => C[k].cls === cls && !C[k].designOnly && ['White', 'Green', 'Blue', 'Gold'].includes(C[k].rarity)); }
// Card drops: normal kills sometimes drop a card; elites always drop a Green or better; the boss drops two Blue or Gold.
const CARD_DROPS = {
  1: { chance: 30, w: { White: 75, Green: 21, Blue: 4, Gold: 0 } },
  2: { chance: 40, w: { White: 65, Green: 27, Blue: 8, Gold: 0 } },
  3: { chance: 50, w: { White: 55, Green: 32, Blue: 13, Gold: 0 } },
  Elite: { chance: 100, n: 1, w: { White: 0, Green: 55, Blue: 35, Gold: 10 } },
  Boss: { chance: 100, n: 2, w: { White: 0, Green: 0, Blue: 65, Gold: 35 } },
};
function rollCards(rng, cls, tier, luck) {
  const t = CARD_DROPS[tier]; const out = []; if (!t) return out;
  const lk = 1 + (luck || 0) / 100, pool = cardPool(cls);
  for (let i = 0; i < (t.n || 1); i++) {
    if (rng() * 100 >= t.chance * lk) continue;
    const w = Object.entries(t.w).map(([r, x]) => [r, r === 'White' ? x : x * lk]); const tot = w.reduce((s, x) => s + x[1], 0);
    let r = rng() * tot, rar = 'White'; for (const [k, x] of w) { if (r < x) { rar = k; break; } r -= x; }
    const opts = pool.filter(k => C[k].rarity === rar); if (!opts.length) continue;
    out.push({ kind: 'card', key: opts[Math.floor(rng() * opts.length)], rarity: rar, rank: 0 });
  }
  return out;
}
function cardPoints(rarity, rank) { return DECK_POINTS[rarity] * (1 + (rank || 0) * DECK_RANK_STEP); }
function deckLevel(cards) { // cards: [{key, rank}]
  const pts = cards.map(c => cardPoints(C[c.key].rarity, c.rank)).sort((a, b) => b - a).slice(0, 20);
  const perfect = (2 * 59 + 4 * 42 + 6 * 28 + 8 * 15) / 20 * (1 + 10 * DECK_RANK_STEP);
  return pts.length ? Math.round(pts.reduce((s, x) => s + x, 0) / pts.length / perfect * 100) : 0;
}

// named card drops from an enemy's loot table (each line rolls on its own; a hero only rolls their own class's lines)
function rollNamedCards(data, rng, enemyKey, cls, luck) {
  const d = data.enemies[enemyKey], out = [], lk = 1 + (luck || 0) / 100;
  for (const x of (d && d.loot) || []) {
    if (x.type !== 'Card' || x.cls !== cls) continue;
    if (rng() * 100 >= (x.pct || 0) * lk) continue;
    const key = Object.keys(C).find(k => C[k].name === x.item && C[k].cls === cls && !C[k].designOnly);
    if (key) out.push({ kind: 'card', key, rarity: C[key].rarity, rank: 0, named: true });
  }
  return out;
}
function rollDrops(data, rng, enemyKey, level, luck, cls) {
  gearData(data);
  const d = data.enemies[enemyKey], G = data.gear;
  const table = G.drops[d.tier]; const out = [];
  if (!table || !d.pool.length) return out;
  const lk = 1 + (luck || 0) / 100;
  for (let i = 0; i < table.rolls; i++) {
    let r = rng() * 100, acc = 0, got = null;
    for (const rar of ['Purple (Epic)', 'Blue', 'Green', 'White']) { acc += table.chance[rar] * lk; if (r < acc) { got = rar; break; } }
    if (got) out.push(rollItem(data, rng, d.pool[Math.floor(rng() * d.pool.length)], got, level));
  }
  // codexes: bosses list one per class on their loot table (each rolls on its own)
  // map bosses drop one codex 25% of the time (more with Luck), picked at random from every class's codex on their table (Nov 1)
  if (d.tier === 'Boss' && !d.raid) {
    if (rng() >= Math.min(1, BOSS_CODEX_CHANCE * lk)) return out;
    const pick = (d.loot || []).filter(x => x.type === 'Codex'); // any class: trade or stash the ones your hero can't use
    if (pick.length) { const x = pick[Math.floor(rng() * pick.length)], key = Object.keys(CODEX_BY_KEY).find(k => CODEX_BY_KEY[k].name + ' Codex' === x.item); if (key) out.push(makeCodex(data, rng, key, level)); }
    return out;
  }
  for (const x of d.loot || []) if (x.type === 'Codex' && rng() * 100 < (x.pct || 0) * lk) { const key = Object.keys(CODEX_BY_KEY).find(k => CODEX_BY_KEY[k].name + ' Codex' === x.item); if (key) out.push(makeCodex(data, rng, key, level)); }
  return out;
}

// design changes on top of the card database (Oct 31): Seismic Slam is free; it hits for half your current mana and spends none
// Oct 31: the Rogue's poison cards are Attacks, so they scale with Strength (poison stacks scale with Strength too, see applyDot)
for (const k of ['envenom', 'plague_bloom', 'toxic_cloud', 'venom_vial', 'fester', 'crippling_poison', 'mind_numbing_poison', 'deadly_toxin', 'wound_poison', 'corrosive_toxin', 'draining_venom', 'poison_nova']) if (C[k]) { C[k].type = 'Attack'; if (C[k].dtype == null) C[k].dtype = k === 'poison_nova' ? 'Nature' : 'Physical'; }
if (C.seismic_slam) { C.seismic_slam.cost = 0; C.seismic_slam.text = 'Deal damage to all enemies equal to 50% of your current mana. Your mana is not spent.'; }
if (C.mana_gem) C.mana_gem.cost = 0;
// Nov 1: anything that lasts for the rest of combat exhausts (so it can't be stacked by replaying it)
for (const k of Object.keys(C)) { const d = C[k]; if (d.designOnly || d.type === 'Status' || d.type === 'Power' || d.exhaust) continue;
  if (/for the rest of (the )?(combat|fight)/i.test(d.text || '')) { d.exhaust = true; if (!/Exhaust\.?\s*$/.test(d.text)) d.text = d.text.replace(/\s*$/, '') + ' Exhaust.'; } }
// Nov 1: Blood Debt (Bloodbound) ties together. Blood Reckoning heals 2x your Blood Debt (and spends it); 8 new Warrior cards that build and spend it.
DEBT_CARDS.push('blood_reckoning');
const spendDebt = (p, pct) => { const n = Math.round(p.bloodDebt * (pct == null ? 1 : pct)); p.bloodDebt -= n; return n; };
if (C.blood_reckoning) Object.assign(C.blood_reckoning, { text: 'Spread all Bleed on you to all enemies and double it. Then deal damage equal to all Bleed on enemies. Heal for 2x your stored Blood Debt, then clear it.',
  play: (cb, t) => { const p = cb.player, b = p.bleed; p.bleed = 0; for (const e of cb.alive()) { e.bleed += b * 2; e.bleedBy = p.id; } for (const e of cb.alive()) if (!cb.over && e.bleed > 0) cb.hit(e, e.bleed, 'Blood Reckoning'); const d = spendDebt(p); if (d > 0) cb.heal(p, 2 * d, 'Blood Reckoning'); else say(cb, 'No Blood Debt to heal from.'); } });
const debtCard = (key, name, rarity, type, cost, target, text, play, tags, ex) => { card(key, Object.assign({ cls: 'Warrior', name, rarity, type, cost, target, dtype: type === 'Attack' ? 'Physical' : undefined, text, play: (cb, t) => play(cb, t, cb.player), tags: tags || {} }, ex || {})); DEBT_CARDS.push(key); };
debtCard('call_the_debt', 'Call the Debt', 'Blue', 'Attack', 0, 'enemy', 'Deal damage equal to 80% of your stored Blood Debt, then clear it.', (cb, t, p) => { const n = spendDebt(p); D_(cb, t, n * 0.8, 'Call the Debt'); }, { dmg: 1, debt: 1 });
debtCard('reclaim_blood', 'Reclaim Blood', 'White', 'Skill', 0, 'self', 'Consume your stored Blood Debt: heal for 30% of it.', (cb, t, p) => { const n = spendDebt(p); if (n) cb.heal(p, Math.round(n * 0.3), 'Reclaim Blood'); else say(cb, 'No Blood Debt stored.'); }, { heal: 1, debt: 1 });
debtCard('crimson_bulwark', 'Crimson Bulwark', 'Green', 'Skill', 10, 'self', 'Spend half your stored Blood Debt: gain double that much Block.', (cb, t, p) => { const n = spendDebt(p, 0.5); if (n) cb.gainDef(2 * n); else say(cb, 'No Blood Debt stored.'); }, { def: 1, debt: 1 });
debtCard('debt_spiral', 'Debt Spiral', 'Green', 'Attack', 10, 'enemy', 'Deal 6 damage, plus 1 for every 2 Blood Debt you have stored (it is not spent).', (cb, t, p) => D_(cb, t, 6 + Math.floor(p.bloodDebt / 2), 'Debt Spiral'), { dmg: 6, debt: 1 });
debtCard('sanguine_cleave', 'Sanguine Cleave', 'Blue', 'Attack', 20, 'all', 'Deal damage to all enemies equal to 50% of your stored Blood Debt, then clear it. Breaks Stealth.', (cb, t, p) => { const n = spendDebt(p); DA(cb, n * 0.5, 'Sanguine Cleave'); }, { dmg: 1, aoe: 1, debt: 1 });
debtCard('blood_oath', 'Blood Oath', 'White', 'Skill', 10, 'self', 'Lose 5 HP. Gain 12 Block.', (cb, t, p) => { cb.loseHp(p, 5, 'Blood Oath'); cb.gainDef(12); }, { def: 12, debt: 1 });
debtCard('vengeful_wound', 'Vengeful Wound', 'Green', 'Attack', 10, 'enemy', 'Deal 8 damage. Apply Bleed equal to 25% of your stored Blood Debt (it is not spent).', (cb, t, p) => { const e = D_(cb, t, 8, 'Vengeful Wound'); const n = Math.round(p.bloodDebt * 0.25); if (e && e.hp > 0 && n > 0) cb.applyDot(e, 'bleed', n); }, { dmg: 8, debt: 1 });
POWERS.usury = { turnStart: (cb, p, ...a) => { const n = Math.round(p.bloodDebt * 20 * cb.rkm('pct') / 100); if (n > 0) { p.strTurn += n; say(cb, `Usury: +${n} Strength this turn from your Blood Debt.`); } } };
debtCard('usury', 'Usury', 'Gold', 'Power', 20, 'self', 'At the start of each of your turns, gain Strength this turn equal to 20% of your stored Blood Debt.', (cb, t, p) => cb.addPower(p, 'usury', 'Usury', 'At the start of each of your turns, gain Strength this turn equal to 20% of your stored Blood Debt.'), { power: 1 }, { exhaust: true, powerKey: 'usury' });
// Oct 31: Battle Trance is retired: it no longer drops or plays; owned copies become Marching Orders (hub fix)
const REMOVED_CARDS = { battle_trance: 'marching_orders' };
for (const k of Object.keys(REMOVED_CARDS)) if (C[k]) { C[k].designOnly = true; C[k].removed = true; }
function dropRemovedLoot(data) { const names = new Set(Object.keys(REMOVED_CARDS).filter(k => C[k]).map(k => C[k].name)); for (const e of Object.values((data && data.enemies) || {})) if (e.loot) e.loot = e.loot.filter(x => !(x.type === 'Card' && names.has(x.item))); }
if (DATA) dropRemovedLoot(DATA);
// Oct 31: Lay on Hands and Mend Wounds can be aimed at any hero in the party (yourself if you play them solo)
if (C.mend_wounds) Object.assign(C.mend_wounds, { target: 'ally', text: 'Heal an ally (or yourself) for 8 HP.', play: (cb, t) => cb.heal(t && t.isPlayer && t.hp > 0 ? t : cb.player, 8, 'Mend Wounds') });
if (C.lay_on_hands) Object.assign(C.lay_on_hands, { target: 'ally', text: 'Heal an ally (or yourself) for 30% of their total HP. Exhaust.', play: (cb, t) => { const a = t && t.isPlayer && t.hp > 0 ? t : cb.player; cb.heal(a, Math.round(a.maxHp * 0.3), 'Lay on Hands'); } }); // Oct 31: at 10 mana nobody played it (it is meant to sit in hand); free now so you can play it if you need the hand space
// Nov 1: no reminder text in parentheses on cards (hold Alt over a keyword for its glossary entry); rules that were in brackets are now plain sentences
// Nov 3: flat damage (per hit, per target) on the key cards of slow-starting decks. It doesn't grow with upgrades, level or gear, so it is a big help early and fades in importance later.
const CARD_FLAT = { shield_slam: 6, shield_bash: 3, crushing_bastion: 10, armor_nova: 4,
  glacial_spike: 8, frostbolt: 4, ice_bolt: 4, ice_lance: 4, flash_freeze: 5, cone_of_cold: 5, blizzard: 4, falling_star: 10,
  arcane_blast: 5, arcane_bolt: 4, arcane_missiles: 4, arcane_barrage: 2, spark: 3,
  shield_of_righteousness: 6, hammer_of_wrath: 4, divine_storm: 4, holy_nova: 4,
  pilfer: 3, kick_while_down: 3, lighten_their_purse: 3, cut_purse: 3 };
const HEAL_FLAT = { healing_light: 5, overflowing_light: 4 };
const TEXT_FIX = {
"open_the_floodgates": "Draw 3 cards. Everything is free to play this turn. You cannot draw more cards. Exhaust.",
"divine_echo": "Each attack you play has a 10% chance to repeat. When it repeats, the chance drops to 0% for the rest of the turn.",
"decisive_reprisal": "If you parried last turn, execute the target, dealing 45 damage.",
"survey_the_field": "Look at the top 3 cards of your draw pile. Choose 1 to put into your hand; the rest go back.",
"torrent": "Every 3rd Skill you play draws 1 card. The count carries over between turns.",
"shatter": "Consume all Chill on the target. Deal 2 Frost damage per Chill consumed. If the target is Frozen, deal triple that, plus 20.",
"purifying_grace": "Cleansing a debuff heals you for 2 HP and deals 3 Holy damage to an enemy per stack removed.",
"cleansing_light": "At the start of your turn, cleanse one debuff from yourself and strip the biggest debuff from an enemy.",
"retribution_aura": "Hits for 8 holy damage to all enemies that hit you.",
"divine_detonation": "Expend your Block and Barrier, dealing Holy damage equal to 30% of the total to all enemies.",
"wither": "Apply 4 Dread. If the target already had Dread, apply 3 more.",
"fan_the_flames": "Increases the amount of burn on the target by 25%.",
"ashen_drain": "Exhaust the Burn on the target, destroy half that much of its mana, and add 1 Fatigue to its discard pile per 20 Burn.",
"marathon": "At the start of each turn, your mana regeneration increases by 3 for the rest of combat.",
"mirror_barrier": "Increase your current Barrier by 50%.",
"void_lance": "Deal 10 Arcane damage, plus 1 for every 3 mana the target is missing from its maximum.",
"aegis_of_light": "Holy damage you deal also gives you Block equal to 10% of it.",
"shadow_dance": "Enter Stealth. Your next Attack doesn't break it.",
"shield_strike": "Deal damage equal to 25% of your Block, plus 10. Your Block is not spent.",
"arcane_blast": "Deal 8 Arcane damage, plus 6 for each Arcane Skill you played before it this turn (at most 18 more).",
"expose_opening": "When you fully Parry an attack, apply 40 Vulnerable to the attacker.",
"unnerving_guard": "Gain 15 Parry. Each attack you fully parry before your next turn adds a Stun to the attacker's draw pile.",
"bait": "Gain 12 Parry. The next time you parry an attack, the attacker gains 20 Vulnerable and discards 1 card.",
"envenom": "Apply 5 Poison.",
"smite": "Deal 14 Holy damage.",
"mend_wounds": "Heal an ally or yourself for 8 HP.",
"lay_on_hands": "Heal an ally or yourself for 30% of their total HP. Exhaust.",
"unyielding_bastion": "Your Block cannot be reduced next turn. Exhaust.",
"imbue_weapon": "This turn, your Attacks deal Fire or Frost damage instead of Physical. Draw 1 card.",
"thunderclap": "Deal up to 14 damage to all enemies, scaled by your current HP %.",
"sever": "Deal 6 damage. If this crits, the target's Bleed deals its damage immediately.",
"flush_out": "Deal 5 damage. Remove Stealth from the target. It can't enter Stealth until the end of its next turn.",
"vanishing_act": "You cannot be broken out of Stealth next turn. You are immune to damage. Exhaust.",
"untouchable": "You are immune to damage next turn. Exhaust.",
"fester": "The target's Poison deals its damage immediately.",
"arterial_strike": "Deal 10 damage. The target's Bleed deals its damage immediately.",
"dust_in_the_eyes": "Deal 5 damage. Remove Stealth from the target. It can't enter Stealth until the end of its next turn.",
"grievous_shiv": "Deal 3 damage. Apply Grievous Wound for 2 turns.",
"quartermaster": "Whenever a card would be added to your full hand, gain 5 mana.",
"cut_the_strings": "Spend all your mana. The target draws 1 fewer card next turn for every 20 mana spent, up to 3.",
"evasive_precision": "This turn, gain 1% Crit Chance for every 1 Dodge you have, up to 50%.",
"mana_scorch": "Spend X mana to apply X Mana Burn to the target, up to its max mana.",
"elemental_memory": "Playing a different spell still applies the previous spell's secondary effect.",
"combust": "The target's Burn deals its damage immediately.",
"lay_bare": "Apply 4 Exposure.",
"faerie_fire": "Deal 5 Arcane damage. Remove Stealth from the target. It can't enter Stealth until the end of its next turn.",
"withering_flame": "Apply 4 Burn and Grievous Wound for 2 turns.",
"divine_communion": "Spend all your mana to heal every party member for that much. Exhaust.",
"cleanse": "Remove all debuffs except Bleed from yourself or an ally.",
"final_verdict": "Deal 12 Holy damage. Consume all Devotion for 4 Holy damage per stack.",
"mass_dispel": "Remove all debuffs except Bleed from you and all allies. Exhaust.",
"prism_of_faith": "Choose an element other than Holy. Until your next turn, all damage you take is converted to that element.",
"crusader_aura": "Whenever you alternate between Attack and Skill, gain 10 Strength after an Attack or 10 Dexterity after a Skill this turn.",
"light_reveals_all": "Deal 5 Holy damage. Remove Stealth from the target. It can't enter Stealth until the end of its next turn.",
"dread_touch": "Deal 4 Shadow damage and apply 5 Dread.",
"rotting_grasp": "Apply 21 Rot.",
"shadow_mend": "Heal an ally or yourself for 9 HP.",
"demon_whip": "Each of your demons acts once now without losing a turn. Draw 1 card.",
"blood_bolt": "Deal 10 Physical damage. Scales with Intelligence.",
"shadow_lash": "Deal 9 Shadow damage. Scales with Strength.",
"terrify": "Fear the target: it skips its attacks on its next turn.",
"curse_of_tongues": "Curse: apply 4 Exposure and drain 6 mana.",
"curse_of_shadows": "Curse: apply 20 Unwarded.",
"profane_bond": "You or an ally heals 10 HP, and you gain 6 Absorb.",
"shadow_armor": "For 3 turns, take 25% less damage. Exhaust.",
"blood_armor": "For 3 turns, heal 6 HP at the start of each of your turns. Exhaust.",
"soul_armor": "For 3 turns, +15 mana regeneration. Exhaust.",
"nether_armor": "For 3 turns, gain 6 Absorb every time an enemy hits you. Exhaust.",
"demon_armor": "For 3 turns, 30% of the damage you take goes to your demons instead. Exhaust.",
"summon_bulwark_fiend": "Summon a Bulwark Fiend for 2 turns: it taunts and deals 4 Shadow damage each turn.",
"dread_eruption": "Every enemy's Dread deals its damage now without losing any stacks.",
"blood_ritual_wl": "This turn, cards you can't afford can be paid with HP: 1 HP per 2 mana, up to 15 HP. Draw 1 card.",
"doom": "Curse: in 2 rounds, the target takes 55 Shadow damage. Exhaust.",
"sanguine_frenzy": "Power: you deal up to 40% more damage the lower your HP is: 4% more for every 10% of HP missing.",
"dark_insight": "Power: whenever you crit, draw 1 card, up to 2 a turn.",
"debt_spiral": "Deal 6 damage, plus 1 for every 2 Blood Debt you have stored, without spending it.",
"vengeful_wound": "Deal 8 damage. Apply Bleed equal to 25% of your stored Blood Debt, without spending it."
};
for (const [k, t] of Object.entries(TEXT_FIX)) if (C[k]) C[k].text = t;
// Nov 3: a rewritten text can move a card's upgrade numbers: re-anchor each token to where its number now sits
for (const k of Object.keys(TEXT_FIX)) { const u = UPG[k], d = C[k]; if (!u || !u.t || !d) continue; for (const tk of u.t) { if (d.text.slice(tk[0], tk[1]) === String(tk[2])) continue; const m = new RegExp('(^|[^0-9])' + tk[2] + '(?![0-9])').exec(d.text); if (m) { tk[0] = m.index + m[1].length; tk[1] = tk[0] + String(tk[2]).length; } } }
// Nov 3: card buffs. retune(key, token index, new base) changes the card text, its upgrade token and its effect list together
function retune(key, ti, nv) { const u = UPG[key], d = C[key]; if (!u || !u.t || !d) return; const tk = u.t[ti], old = tk[2], s0 = d.text.slice(tk[0], tk[1]); if (s0 !== String(old)) { if (typeof console !== 'undefined') console.warn('retune mismatch', key, s0, old); return; }
  const dl = String(nv).length - s0.length; d.text = d.text.slice(0, tk[0]) + nv + d.text.slice(tk[1]); for (const o of u.t) if (o !== tk && o[0] >= tk[1]) { o[0] += dl; o[1] += dl; } tk[1] += dl; tk[2] = nv;
  const ops = GEN_OPS[key]; if (ops) { const want = { dmg: 'dmg', def: 'def', vulnerable: 'debuff', burn: 'dot' }[tk[3]]; const o = ops.find(x => x.op === want && x.n === old && (!x.key || x.key === tk[3])); if (o) { o.n = nv; d.tags = genTags(ops); } } }
[['sunder_armor', 0, 8], ['sunder_armor', 1, 12], ['crack_armor', 0, 20], ['sundering_blow', 0, 5], // Sunderer
 ['righteous_blow', 0, 10], ['righteous_blow', 1, 10], ['sword_and_board', 0, 9], ['shield_of_righteousness', 0, 60], ['divine_storm', 0, 14], // Bastion of Faith
 ['judgment_hammer', 0, 26], ['guarded_advance', 0, 9], ['raise_shield', 0, 12], ['crusader_strike', 0, 14], // Righteous Crusader
 ['searing_light', 0, 7], ['searing_light', 1, 4], ['holy_fire', 0, 8], ['condemn', 0, 5], // Purifier
 ['sanctuary', 0, 20], ['consecration', 0, 14], // Equilibrium capstone nerf
 // Nov 3 mega sim: deck fixes
 ['wither', 0, 3], ['dread_touch', 1, 4], ['lingering_dread', 0, 6], ['creeping_dread', 0, 3], ['nightfall_wl', 0, 1], ['follow_through', 0, 50], ['hold_the_line', 0, 16], ['unstoppable_force', 0, 30], ['bankrupt', 0, 3], ['condemning_mark', 0, 18], ['mark_of_guilt', 0, 6], ['repentance', 1, 15], ['purge_the_wicked', 0, 3]].forEach(([k, i, n]) => retune(k, i, n));
for (const [k, f] of Object.entries(CARD_FLAT)) if (C[k]) C[k].text += ` +${f} damage${/ times\./.test(C[k].text) ? ' per hit' : C[k].target === 'all' ? ' to each enemy' : ''} (flat).`;
for (const [k, f] of Object.entries(HEAL_FLAT)) if (C[k]) C[k].text += ` +${f} healing (flat).`;
if (C.pilfer) C.pilfer.cost = 20; // Nov 2
if (C.twin_verdict) C.twin_verdict.cost = 15; if (C.steel_tempo) C.steel_tempo.cost = 0; if (C.decisive_reprisal) C.decisive_reprisal.cost = 20; // Nov 3
POWERS.codex_soulbinder.dotDealt = POWERS.codex_soulbinder.dealt;
CARDS_READY = true; if (DATA && DATA.gear) namedLoot(DATA);
const API = { STARTER_KITS, staffShieldOk, legalGear, CODEX_NEEDS, codexNeed, weaponSetup, CODEX_TOKEN_CHANCE, bossCodexPct, GROUPS, groupData, itemRules, rerollPotential, rerollAffix, CODEX_TOKENS, DEMONS, gearData, SHOULDER_BASES, CARDS_VERSION: 2, REMOVED_CARDS, dropRemovedLoot, MANA_GEAR_CAP, gearRules, BOSS_CODEX_CHANCE, weaponFlat, PHYS_WEAPONS, RAID, RAID_NAMES, raidKey, raidBoss, ENEMY_PLAYER_OPS, STARTER_DECKS, STARTER_AMULETS, starterAmulet, rollNamedCards, CODEXES, CODEX_BY_KEY, makeCodex, CARD_DROPS, CARD_XP, RANK_BASE, DECK_CAPS, DECK_MIN, DECK_MAX, MAX_RANK, rankedCard, cardPool, GEN_OPS, POWERS, TALENTS, CODEX_MAX, CODEX_XP, KILL_XP, codexLevel, talentLuck, talentRun, rollCards, cardPoints, deckLevel, CARDS: C, CLASSES, STARTER_GEAR, presetGear, ELEMENTS, sumGear, Combat, parseEnemyCard, intentKind, BASE, rollItem, rollDrops, makeRng, shuffle, ri };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CB = Object.assign(root.CB || {}, API);
})(typeof window !== 'undefined' ? window : globalThis);
