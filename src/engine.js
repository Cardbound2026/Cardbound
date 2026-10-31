// Cardbound combat engine, prototype v2. Pure logic: no DOM. Browser: window.CB. Node: module.exports.
// Enemy data comes from CB_DATA (exported from the Map 1 design files).
(function (root) {
'use strict';
const DATA = (typeof module !== 'undefined' && module.exports) ? null : root.CB_DATA;

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
card('battle_fever', { cls: 'Warrior', name: 'Battle Fever', rarity: 'Gold', type: 'Skill', cost: 15, target: 'self', text: 'If an enemy has attacked you this round, gain 20 Strength and 20 Stamina for the rest of combat.',
  play: (cb) => { const p = cb.player; if (p.attackedThisRound) { p.strCombat += 20; p.maxHp += 20; p.hp += 20; cb.say('player', `Battle Fever: +20 Strength and +20 Stamina for the fight.`); } else cb.say('player', 'Battle Fever fizzles: no enemy has attacked you yet this round.'); }, tags: { fever: 1 } });

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
card('hide', { cls: 'Rogue', name: 'Hide', rarity: 'Green', type: 'Skill', cost: 10, target: 'self', text: "Enter Stealth: single-target enemy cards can't find you until your next turn. Only 0-cost cards for the rest of this turn.",
  play: (cb) => { cb.player.stealth = true; cb.player.locked = true; cb.say('player', 'You slip into Stealth.'); }, tags: { hide: 1 } });
card('evasion', { cls: 'Rogue', name: 'Evasion', rarity: 'Blue', type: 'Skill', cost: 20, target: 'self', text: 'Gain 40 Dodge.', play: (cb) => cb.gainDef(40), tags: { def: 40 } });
card('coup_de_grace', { cls: 'Rogue', name: 'Coup de Grace', rarity: 'Blue', type: 'Attack', cost: 10, target: 'enemy', dtype: 'Physical', text: 'Deal 10 damage. If the target is below 30% HP, deal 30 instead.', play: (cb, t) => cb.hit(t, t.hp < t.maxHp * 0.3 ? 30 : 10, 'Coup de Grace'), tags: { dmg: 10, execute: 30 } });
card('assassinate', { cls: 'Rogue', name: 'Assassinate', rarity: 'Gold', type: 'Skill', cost: 20, target: 'self', text: 'Your next Attack deals double damage.', play: (cb) => { cb.player.nextAttackMult = 2; cb.say('player', 'Your next Attack deals double damage.'); }, tags: { setup: 'attack' } });

// --- Mage
card('fireball', { cls: 'Mage', name: 'Fireball', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Fire', text: 'Deal 7 Fire damage and apply 3 Burn.', play: (cb, t) => { cb.hit(t, 7, 'Fireball'); cb.applyDot(t, 'burn', 3); }, tags: { dmg: 7, dot: 6 } });
card('frostbolt', { cls: 'Mage', name: 'Frostbolt', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Frost', text: "Deal 5 Frost damage. Reduce the target's mana regeneration by 5 for 2 turns. Stacks.", play: (cb, t) => { cb.hit(t, 5, 'Frostbolt'); if (t.hp > 0) { t.regenDown.push({ n: 5, turns: 2 }); cb.say('player', `${t.name}'s mana regen drops by 5 for 2 turns.`); } }, tags: { dmg: 5 } });
card('arcane_missiles', { cls: 'Mage', name: 'Arcane Missiles', rarity: 'White', type: 'Skill', cost: 10, target: 'enemy', dtype: 'Arcane', text: 'Deal 5 Arcane damage. Steal 5 mana from the target.', play: (cb, t) => { cb.hit(t, 5, 'Arcane Missiles'); const s = Math.min(5, t.mana); t.mana -= s; cb.player.mana += s; if (s) cb.say('player', `You steal ${s} mana.`); }, tags: { dmg: 5 } });
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
card('holy_nova', { cls: 'Paladin', name: 'Holy Nova', rarity: 'Blue', type: 'Skill', cost: 20, target: 'all', dtype: 'Holy', text: 'Deal 10 Holy damage to all enemies. Heal yourself for 8 HP.', play: (cb) => { for (const e of cb.alive()) cb.hit(e, 10, 'Holy Nova'); cb.heal(cb.player, 8, 'Holy Nova'); }, tags: { dmg: 10, aoe: 1, heal: 8 } });
card('lay_on_hands', { cls: 'Paladin', name: 'Lay on Hands', rarity: 'Gold', type: 'Skill', cost: 30, target: 'self', exhaust: true, text: 'Heal 30% of your total HP. Exhaust.', play: (cb) => cb.heal(cb.player, Math.round(cb.player.maxHp * 0.3), 'Lay on Hands'), tags: { heal: 36 } });

// --- Status cards
card('fatigue', { name: 'Fatigue', rarity: 'Status', type: 'Status', cost: null, target: 'none', text: 'Unplayable. Added each time your deck reshuffles.' });
card('dazed', { name: 'Dazed', rarity: 'Status', type: 'Status', cost: 0, target: 'self', exhaust: true, text: 'Does nothing. Costs 0 to play, then Exhausts.', play: (cb) => cb.say('player', 'You shake off the daze.'), tags: { clear: 1 } });
card('stun', { name: 'Stun', rarity: 'Status', type: 'Status', cost: null, target: 'none', text: 'Unplayable. Stays in your deck for the rest of the fight.' });

// ---------------- Classes ----------------
const CLASSES = {
  Warrior: { defense: 'Block', blurb: 'Sword and shield. Hits, blocks, and gets stronger after taking a hit (Battle Fever).', deck: [['battle_fever', 1], ['execute', 1], ['shield_wall', 1], ['bloodthirst', 1], ['shield_up', 1], ['whirlwind', 1], ['battle_shout', 1], ['defend', 3], ['pommel_strike', 1], ['shield_bash', 2], ['strike', 7]] },
  Rogue: { defense: 'Dodge', blurb: 'Quick hits, Dodge, Bleed and Poison. Hide skips an enemy\'s single-target attacks.', deck: [['assassinate', 1], ['coup_de_grace', 1], ['evasion', 1], ['blur', 1], ['garrote', 1], ['hide', 1], ['envenom', 1], ['evade', 5], ['slip_away', 1], ['stab', 5], ['throwing_stars', 1], ['twin_daggers', 1]] },
  Mage: { defense: 'Barrier', blurb: 'Fire, Frost and Arcane spells with Barrier. Exploits enemy weaknesses (Arcane vs humans, Fire vs beasts).', deck: [['amplify', 1], ['prismatic_barrier', 1], ['pyroblast', 1], ['arcane_barrage', 1], ['blizzard', 1], ['ice_barrier', 1], ['arcane_missiles', 2], ['fireball', 3], ['frostbolt', 2], ['ice_bolt', 1], ['mana_spring', 1], ['ward', 5]] },
  Paladin: { defense: 'Block', blurb: 'Holy warrior: Block, Holy damage that ignores resistance, and heals.', deck: [['lay_on_hands', 1], ['ardent_defense', 1], ['holy_nova', 1], ['divine_shield', 1], ['divine_storm', 1], ['healing_light', 1], ['crusader_strike', 6], ['raise_shield', 2], ['righteous_blow', 2], ['sacred_ward', 1], ['smite', 3]] },
};
const it = (slot, base, stats, imp2) => ({ slot, name: base, rarity: 'White', ilvl: 1, stats: Object.assign({ 'Resistance:Fire': 3 }, stats), imp2: imp2 || {} });
const STARTER_GEAR = {
  Warrior: [it('Weapon', 'Arming Sword', { Strength: 3 }, { 'Multi-hit Chance': 3 }), it('Off-hand', 'Kite Shield', { Dexterity: 3 }, { Thorns: 2 }), it('Helm', 'Warband Helm', { Stamina: 6 }),
    it('Amulet', "Soldier's Pendant", { Strength: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Brigandine', { 'Crit Chance': 3 }),
    it('Bracers', 'Iron Bracers', { 'Crit Damage': 12 }), it('Gloves', 'Leather Gauntlets', { 'Crit Chance': 3 }), it('Belt', 'War Belt', { Stamina: 6 }), it('Pants', 'Legguards', { Stamina: 6 }),
    it('Boots', 'March Boots', { Dexterity: 3 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Stamina: 6 }), it('Ring 2', "Soldier's Signet", { Luck: 3 })],
  Rogue: [it('Weapon', 'Dirk', { Strength: 3 }, { 'Crit Damage': 12 }), it('Off-hand', 'Dirk', { 'Crit Chance': 3 }, { 'Crit Damage': 12 }), it('Helm', "Scout's Cap", { Strength: 3 }),
    it('Amulet', "Soldier's Pendant", { Strength: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Brigandine', { 'Crit Chance': 3 }),
    it('Bracers', "Archer's Bracers", { 'Crit Damage': 12 }), it('Gloves', 'Leather Gauntlets', { 'Crit Chance': 3 }), it('Belt', 'War Belt', { Stamina: 6 }), it('Pants', 'Riding Breeches', { Dexterity: 3 }),
    it('Boots', 'March Boots', { Stamina: 6 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Stamina: 6 }), it('Ring 2', "Soldier's Signet", { Luck: 3 })],
  Mage: [it('Weapon', 'Ashwood Wand', { Intelligence: 3 }, { 'Elemental/Holy Damage:Fire': 6 }), it('Off-hand', 'Battle Focus', { Dexterity: 3 }, { 'Elemental/Holy Damage:Frost': 6 }), it('Helm', 'Hedge-Mage Hood', { Intelligence: 3 }),
    it('Amulet', "Soldier's Pendant", { Intelligence: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Camp Robe', { Spirit: 3 }),
    it('Bracers', 'Linen Wraps', { Intelligence: 3 }), it('Gloves', "Scribe's Handwraps", { 'Crit Chance': 3 }), it('Belt', "Officer's Sash", { Stamina: 6 }), it('Pants', 'Quilted Leggings', { Stamina: 6 }),
    it('Boots', 'Pilgrim Slippers', { Dexterity: 3 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Stamina: 6 }), it('Ring 2', "Soldier's Signet", { 'Max Mana': 15 })],
  Paladin: [it('Weapon', 'Flanged Mace', { Strength: 3 }, { 'Elemental/Holy Damage:Holy': 6 }), it('Off-hand', 'Pavise', { Dexterity: 3 }, { 'Defense Gain': 6 }), it('Helm', 'Warband Helm', { Stamina: 6 }),
    it('Amulet', "Soldier's Pendant", { Strength: 3 }, { Draw: 4, Regen: 20 }), it('Cloak', 'Campaign Cloak', { 'Max Mana': 15 }), it('Chest', 'Iron Cuirass', { Stamina: 6 }),
    it('Bracers', 'Iron Bracers', { Strength: 3 }), it('Gloves', 'Iron Gauntlets', { 'Crit Chance': 3 }), it('Belt', 'War Girdle', { Stamina: 6 }), it('Pants', 'Legguards', { Dexterity: 3 }),
    it('Boots', 'Iron Sabatons', { Stamina: 6 }, { Initiative: 3 }), it('Ring 1', 'Ember-Warded Ring', { Intelligence: 3 }), it('Ring 2', "Soldier's Signet", { Spirit: 3 })],
};

// Gear presets for testing progression: the starter set's stats scaled to the average Green or Blue item (more affixes, higher rolls).
function presetGear(cls, rarity) {
  const scale = { White: 1, Green: 2.2, Blue: 3.6 }[rarity] || 1, imp = { White: 1, Green: 1.1, Blue: 1.2 }[rarity] || 1;
  return STARTER_GEAR[cls].map(x => ({ slot: x.slot, name: x.name, rarity, ilvl: 1, stats: Object.fromEntries(Object.entries(x.stats).map(([k, v]) => [k, Math.round(v * scale)])),
    imp2: Object.fromEntries(Object.entries(x.imp2).map(([k, v]) => [k, k === 'Draw' ? 4 : k === 'Regen' ? { White: 20, Green: 30, Blue: 40 }[rarity] : Math.round(v * imp)])) }));
}
const BASE = { hp: 100, maxMana: 20, regen: 10, draw: 1, init: 10, critMult: 1.5 };
const PRESSURE_START = 5, PRESSURE_STEP = 0.02;
const ELEMENTS = ['Physical', 'Fire', 'Frost', 'Nature', 'Arcane', 'Shadow'];

function sumGear(items) {
  const t = {}; const add = (k, v) => { t[k] = (t[k] || 0) + v; };
  let amulet = false;
  for (const x of items) { if (!x) continue; for (const [k, v] of Object.entries(x.stats || {})) add(k, v); for (const [k, v] of Object.entries(x.imp2 || {})) add(k, v); if (x.slot === 'Amulet') amulet = true; }
  const res = {}, elem = {};
  for (const [k, v] of Object.entries(t)) { if (k.startsWith('Resistance:')) res[k.slice(11)] = (res[k.slice(11)] || 0) + v; if (k.startsWith('Elemental/Holy Damage:')) elem[k.slice(22)] = (elem[k.slice(22)] || 0) + v; }
  if (t['All Resistances']) for (const el of ELEMENTS) res[el] = (res[el] || 0) + t['All Resistances'];
  for (const el in res) res[el] = Math.min(75, res[el]);
  const g = k => t[k] || 0;
  return {
    stamina: g('Stamina'), maxHp: BASE.hp + g('Stamina'), strength: g('Strength'), intelligence: g('Intelligence'), dexterity: g('Dexterity'), spirit: g('Spirit'),
    crit: g('Crit Chance'), critDmg: g('Crit Damage'), critMult: BASE.critMult + g('Crit Damage') / 100, init: BASE.init + g('Initiative'),
    maxMana: BASE.maxMana + g('Max Mana'), regen: (amulet ? g('Regen') : BASE.regen) + g('Mana Regen'), draw: amulet ? g('Draw') : BASE.draw,
    multiHit: g('Multi-hit Chance'), multiplay: g('Multiplay Chance'), multicast: g('Multicast Chance'), bleedChance: g('Bleed Chance'), lifesteal: g('Lifesteal'),
    thorns: g('Thorns'), luck: g('Luck'), healthRegen: g('Health Regen'), recovery: g('Recovery') + g('Party Recovery'), defGain: g('Defense Gain'), resist: res, elem,
  };
}

// ---------------- Enemy card parsing ----------------
function parseEnemyCard(text) {
  const ops = []; let m; const s = text;
  if ((m = s.match(/^Remove (\d+) Block from the target/))) ops.push({ op: 'shred', n: +m[1] });
  if (/^Remove all Block from every player/.test(s)) ops.push({ op: 'shredAll' });
  if ((m = s.match(/Deal (\d+) damage (\d+) times to every player/))) ops.push({ op: 'damage', n: +m[1], times: +m[2], all: true });
  else if ((m = s.match(/[Dd]eal (\d+) (?:Shadow |Fire |Arcane )?damage to (?:every player|each)/))) ops.push({ op: 'damage', n: +m[1], all: true });
  else if ((m = s.match(/Deal (\d+) damage to a target below 30% HP, otherwise (\d+)/))) ops.push({ op: 'execute', n: +m[1], low: +m[2] });
  else if ((m = s.match(/Deal (\d+) damage plus (\d+) for every status card/))) ops.push({ op: 'damage', n: +m[1], perStatus: +m[2] });
  else if ((m = s.match(/Deal damage equal to (\d+)% of its Block/))) ops.push({ op: 'damageBlock', pct: +m[1] });
  else if ((m = s.match(/Deal (\d+) (?:Shadow |Fire |Arcane )?damage (\d+) times/))) ops.push({ op: 'damage', n: +m[1], times: +m[2] });
  else if ((m = s.match(/Deal (\d+) (?:Shadow |Fire |Arcane )?damage twice/))) ops.push({ op: 'damage', n: +m[1], times: 2 });
  else if ((m = s.match(/[Dd]eal (\d+) (?:Shadow |Fire |Arcane )?damage/))) ops.push({ op: 'damage', n: +m[1] });
  if ((m = s.match(/Each hit applies (\d+) Bleed/))) ops.forEach(o => { if (o.op === 'damage') o.bleedPerHit = +m[1]; });
  if (/heal for 50% of the damage dealt/.test(s)) ops.forEach(o => { if (o.op === 'damage') o.lifesteal = 0.5; });
  if ((m = s.match(/^Another enemy gains (\d+) Block/))) ops.push({ op: 'blockAlly', n: +m[1] });
  else if ((m = s.match(/[Gg]ain (\d+) (?:Block|Dodge)/))) ops.push({ op: 'block', n: +m[1] });
  if ((m = s.match(/All other enemies gain (\d+) Block/))) ops.push({ op: 'blockOthers', n: +m[1] });
  if ((m = s.match(/Gain (\d+) Parry\. Attacks into it take (\d+) damage back/))) ops.push({ op: 'parry', n: +m[1], back: +m[2] });
  else if ((m = s.match(/Gain (\d+) Parry/))) ops.push({ op: 'parry', n: +m[1], back: 0 });
  if ((m = s.match(/Gain (\d+) Thorns for (\d+) turns/))) ops.push({ op: 'thorns', n: +m[1], turns: +m[2] });
  if ((m = s.match(/^Heal (\d+) HP/))) ops.push({ op: 'heal', n: +m[1] });
  if ((m = s.match(/steal (\d+) mana/i))) ops.push({ op: 'stealMana', n: +m[1] });
  if ((m = s.match(/[Bb]urn (\d+) of the target's mana/))) ops.push({ op: 'burnMana', n: +m[1] });
  if ((m = s.match(/^Gain (\d+) mana/))) ops.push({ op: 'gainMana', n: +m[1] });
  if ((m = s.match(/apply (\d+) Bleed/i))) ops.push({ op: 'debuff', key: 'bleed', n: +m[1] });
  if ((m = s.match(/[Aa]pply (\d+) Weak to every player/))) ops.push({ op: 'debuff', key: 'weak', n: +m[1], all: true });
  else if ((m = s.match(/apply (\d+) Weak/i))) ops.push({ op: 'debuff', key: 'weak', n: +m[1] });
  if ((m = s.match(/[Aa]pply (\d+) Vulnerable/))) ops.push({ op: 'debuff', key: 'vulnerable', n: +m[1], all: /every player/.test(s) });
  if ((m = s.match(/apply (\d+) Slow/i))) ops.push({ op: 'debuff', key: 'slow', n: +m[1] });
  if ((m = s.match(/All enemies gain (\d+) Strength/))) ops.push({ op: 'teamStrength', n: +m[1] });
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
function intentKind(ops) {
  const k = ops.map(o => o.op);
  if (k.some(x => ['damage', 'execute', 'damageBlock'].includes(x))) return 'attack';
  if (k.some(x => ['debuff', 'stealMana', 'burnMana', 'status', 'drawLess', 'disarm', 'purge', 'shred', 'shredAll', 'tickBleed'].includes(x))) return 'debuff';
  if (k.some(x => ['block', 'parry', 'blockAlly', 'blockOthers'].includes(x))) return 'defend';
  return 'buff';
}

// ---------------- Combat ----------------
class Combat {
  // opts: cls, gear (items), enemies (keys), level, seed, hp, mana, buffs, data
  constructor(opts) {
    this.opts = Object.assign({ cls: 'Warrior', enemies: ['deserter'], level: 0, blockReset: 'decay', seed: (Date.now() % 2147483646) + 1 }, opts || {});
    this.data = this.opts.data || DATA;
    this.rng = makeRng(this.opts.seed);
    this.level = this.opts.level;
    this.log = []; this.round = 0; this.over = null;
    this.stats = { dealt: 0, taken: 0, blocked: 0, cardsPlayed: 0, healed: 0 };
    this._uid = 0;
    this.meter = {}; // damage meter: per actor id, damage dealt / healing done / damage taken, each broken down by ability or source
    // party: 1 to 4 heroes. opts.party = [{cls, gear, deck, hp, mana, buffs, name}]; without it, one hero from opts.cls/gear/deck/hp/mana/buffs
    const party = this.opts.party || [{ cls: this.opts.cls, gear: this.opts.gear, deck: this.opts.deck, hp: this.opts.hp, mana: this.opts.mana, buffs: this.opts.buffs }];
    this.players = party.map((spec, i) => this.makePlayer(spec, i, party.length));
    this.player = this.players[0];       // the hero currently acting, or the one an enemy card is aimed at
    this.gear = sumGear(party[0].gear || STARTER_GEAR[party[0].cls]);
    this.partySize = this.players.length;
    this.partyScale = 1 + (this.opts.partyStep != null ? this.opts.partyStep : 0.85) * (this.partySize - 1); // 1 when a party fight brings one monster per hero instead // each extra hero: enemies get +85% HP, mana and regen, and +1 draw
    this.hpMult = Math.pow(1.5, this.level) * this.partyScale * (this.opts.mobHp || 1); this.dmgMult = Math.pow(1.3, this.level); // mobHp: extra HP when a party meets one monster per hero
    this.levelHpMult = Math.pow(1.5, this.level);
    this.typeResist = Math.min(1, 0.05 + 0.05 * this.level);
    this.duel = !!this.opts.duel; // duel: two heroes, no monsters; each hero's "enemies" are the other hero
    this.enemies = this.duel ? [] : this.opts.enemies.map((key, i) => this.makeEnemy(key, i));
    if (this.duel) this.say('sys', `Duel: ${this.players.map(p => p.name).join(' vs ')}. Last hero standing wins. From round ${PRESSURE_START} every hit lands harder.`);
    else this.say('sys', `Fight starts. Map level +${this.level}${this.partySize > 1 ? `, party of ${this.partySize}` : ''}: enemy HP x${this.hpMult.toFixed(2)}${this.partySize > 1 ? ` and +${this.partySize - 1} card draw` : ''}, damage x${this.dmgMult.toFixed(2)}; enemies resist their own type by ${Math.round(this.typeResist * 100)}%.`);
    this.startRound();
  }

  makePlayer(spec, i, n) {
    const cls = CLASSES[spec.cls]; const g = sumGear(spec.gear || STARTER_GEAR[spec.cls]); const buffs = spec.buffs || {};
    const p = {
      id: 'p' + i, idx: i, name: spec.name || spec.cls, isPlayer: true, cls: spec.cls, defName: cls.defense, maxHp: g.maxHp, hp: Math.min(g.maxHp, spec.hp != null ? spec.hp : g.maxHp), block: 0,
      mana: spec.mana != null ? Math.min(spec.mana, g.maxMana) : 0, maxMana: g.maxMana, regen: g.regen + (buffs.regen || 0), draw: g.draw + (buffs.draw || 0),
      strength: g.strength + (buffs.damage || 0), intelligence: g.intelligence + (buffs.damage || 0), dexterity: g.dexterity + g.defGain, spirit: g.spirit,
      crit: g.crit + (buffs.crit || 0), critMult: g.critMult, multiHit: g.multiHit, multiplay: g.multiplay, multicast: g.multicast, bleedChance: g.bleedChance, lifesteal: g.lifesteal,
      thorns: g.thorns, baseInit: g.init, recovery: g.recovery, elem: g.elem, resist: Object.assign({}, g.resist),
      strTurn: 0, strCombat: 0, weak: 0, vulnerable: 0, bleed: 0, slow: 0, initNext: 0, defNext: 0, manaNext: 0, drawLess: 0,
      stealth: false, locked: false, disarmed: false, disarmNext: false, negateDebuff: false, nextAttackMult: 1, nextSkillMult: 1,
      attackedThisRound: false, drawPile: [], hand: [], discard: [], exhaust: [], reshuffles: 0, firstTurn: true, dead: false,
      poison: 0, burn: 0, chill: 0, frozen: false, regenDown: [], uid: spec.uid || null,
    };
    if (buffs.resist) for (const el of ELEMENTS) p.resist[el] = Math.min(75, (p.resist[el] || 0) + buffs.resist);
    const deck = [];
    for (const x of (spec.deck || cls.deck)) {
      if (Array.isArray(x)) { for (let k = 0; k < x[1]; k++) deck.push({ uid: 'c' + (this._uid++), key: x[0] }); }
      else deck.push({ uid: 'c' + (this._uid++), key: x.key, rank: x.rank || 0 });
    }
    p.drawPile = shuffle(deck, this.rng);
    return p;
  }
  alivePlayers() { return this.players.filter(p => p.hp > 0); }
  who(p) { return this.partySize > 1 ? p.name : 'You'; }

  makeEnemy(key, i) {
    const d = this.data.enemies[key];
    const tune = (this.opts.tune || {})[d.tier] || {};
    const hp = Math.round(d.hp * this.hpMult * (tune.hp || 1));
    const deck = [], phase2 = [];
    for (const c of d.deck) for (let j = 0; j < c.n; j++) {
      const cardObj = { uid: 'e' + i + '_' + (deck.length + phase2.length), name: c.name, cost: c.cost, text: c.text, dtype: c.dtype, kind: c.kind, ops: parseEnemyCard(c.text) };
      (c.phase2 ? phase2 : deck).push(cardObj);
    }
    return {
      id: 'e' + i, key, name: d.name, tier: d.tier, creature: d.creature, type: d.type, weakTo: d.weak, maxHp: hp, hp, block: 0, parryBack: 0, thorns: 0, thornsTurns: 0,
      mana: 0, maxMana: Math.round(d.maxMana * this.partyScale), regen: Math.round(d.regen * this.partyScale), draw: d.draw + (this.partyScale > 1 ? this.partySize - 1 : 0), baseInit: d.tier === 'Boss' ? 12 : d.tier === 'Elite' ? 11 : 8 + ri(this.rng, 0, 7),
      strength: 0, strTurn: 0, weak: 0, vulnerable: 0, bleed: 0, poison: 0, burn: 0, chill: 0, frozen: false, slow: 0, initNext: 0, regenDown: [], nextBonus: 0,
      drawPile: shuffle(deck, this.rng), phase2Cards: phase2, phase: 1, d, hand: [], discard: [], plan: [], firstTurn: true, dmgTune: tune.dmg || 1,
    };
  }

  mtr(a) { return this.meter[a.id] || (this.meter[a.id] = { id: a.id, name: a.name, isPlayer: !!a.isPlayer, cls: a.cls || null, dealt: {}, healed: {}, taken: {}, absorbed: 0 }); }
  say(kind, text) { this.log.push({ round: this.round, kind, text }); }
  foes() { return this.enemies.filter(e => e.hp > 0); } // monsters only
  // what the acting hero can hit: monsters, or in a duel the other hero (unless they are in Stealth and the card is single-target)
  alive() { return this.duel ? this.players.filter(p => p !== this.player && p.hp > 0) : this.foes(); }
  initiative(a) { return a.baseInit + (a.initNext || 0) - (a.slow || 0) - (a.chill || 0); }
  pressure() { return this.round >= PRESSURE_START ? (this.round - PRESSURE_START + 1) * PRESSURE_STEP * (this.duel ? 5 : 1) : 0; } // duels ramp 5x faster so they end
  card(c) { return c.rank ? (c._v || (c._v = rankedCard(c.key, c.rank))) : C[c.key]; }
  addToHand(key) { const p = this.player; const c = { uid: 'c' + (this._uid++), key }; if (p.hand.length >= 10) { p.discard.push(c); this.say('sys', `Hand full: ${C[key].name} went to the discard pile.`); } else p.hand.push(c); }
  statusCount() { const p = this.player; return [...p.drawPile, ...p.hand, ...p.discard].filter(c => C[c.key].type === 'Status').length; }

  drawCards(a, n) {
    for (let i = 0; i < n; i++) {
      if (a.drawPile.length === 0) {
        if (a.discard.length === 0) break;
        a.drawPile = shuffle(a.discard.splice(0), this.rng);
        if (a.isPlayer) { a.reshuffles++; a.drawPile.splice(Math.floor(this.rng() * (a.drawPile.length + 1)), 0, { uid: 'c' + (this._uid++), key: 'fatigue' }); this.say('sys', 'Deck reshuffled. A Fatigue card was shuffled in.'); }
      }
      const c = a.drawPile.pop();
      if (a.hand.length >= 10) { a.discard.push(c); if (a.isPlayer) this.say('sys', `Hand full: ${C[c.key].name} went to the discard pile.`); }
      else a.hand.push(c);
    }
  }

  startRound() {
    this.round++;
    this.say('round', `Round ${this.round}` + (this.pressure() ? ` (Pressure: ${this.duel ? 'every hit deals' : 'enemies deal'} +${Math.round(this.pressure() * 100)}%)` : ''));
    for (const p of this.alivePlayers()) {
      this.player = p; p.attackedThisRound = false;
      const n = Math.max(0, p.draw - p.drawLess);
      if (p.drawLess) this.say('enemy', `${this.who(p)} draw${this.partySize > 1 ? 's' : ''} ${p.drawLess} fewer card this round.`);
      p.drawLess = 0;
      this.drawCards(p, n);
    }
    for (const e of this.foes()) if (this.round === 1) this.drawCards(e, e.draw);
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
  planEnemy(e) {
    let mana = Math.min(e.maxMana, e.mana + this.effRegen(e) * (e.firstTurn ? 2 : 1));
    e.plan = [];
    const gm = c => c.ops.some(o => o.op === 'gainMana') ? 1 : 0;
    const order = [...e.hand].sort((a, b) => gm(b) - gm(a));
    for (const c of order) if (c.cost <= mana) { mana -= c.cost; e.plan.push(c.uid); const g = c.ops.find(o => o.op === 'gainMana'); if (g) mana += g.n; }
    if (this.partySize > 1) { let last = e.lastMark; for (const uid of e.plan) { const c = e.hand.find(x => x.uid === uid); if (c && this.isTargeted(c)) { const m = this.pickMark(e, last); c.mark = m ? m.id : null; last = c.mark; } } }
  }

  actorById(id) { return this.players.find(p => p.id === id) || this.enemies.find(e => e.id === id); }
  get current() { return this.order ? this.actorById(this.order[this.turnIndex]) : null; }

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
    if (!a.isPlayer && a.frozen) { a.frozen = false; this.say('enemy', `${a.name} is Frozen and loses its turn.`); a.plan = []; a.discard.push(...a.hand.splice(0)); this.drawCards(a, a.draw); this.planEnemy(a); this.nextTurn(); return; }
    this.phase = a.isPlayer ? 'player' : 'enemy';
  }

  beginTurn(a) {
    if (!a.isPlayer && this.opts.blockReset !== 'none' && a.block) { a.block = 0; a.parryBack = 0; }
    if (a.isPlayer && this.opts.blockReset === 'all' && a.block) { this.say('player', `Your ${a.block} ${a.defName} fades.`); a.block = 0; }
    if (a.isPlayer && this.opts.blockReset === 'decay' && a.block) { const kept = Math.floor(a.block / 2); this.say('player', `${this.partySize > 1 ? 'Half of ' + a.name + "'s" : 'Half your'} ${a.defName} fades: ${a.block} -> ${kept}.`); a.block = kept; }
    if (a.isPlayer && a.regenDown.length) { for (const r of a.regenDown) r.turns--; }
    const regen = a.isPlayer ? Math.max(0, a.regen - a.regenDown.reduce((s, x) => s + x.n, 0)) : this.effRegen(a);
    if (a.isPlayer) a.regenDown = a.regenDown.filter(r => r.turns > 0);
    const extra = a.isPlayer ? a.manaNext : 0;
    const gain = regen * (a.firstTurn ? 2 : 1) + extra;
    const before = a.mana;
    a.mana = Math.min(a.maxMana + extra, a.mana + gain);
    a.firstTurn = false;
    if (a.isPlayer) {
      this.say('player', `${this.partySize > 1 ? a.name + "'s" : 'Your'} turn. Mana ${before} + ${gain}${extra ? ' (incl. Mana Spring)' : ''} = ${a.mana} / ${a.maxMana}.`);
      a.manaNext = 0; a.stealth = false; a.locked = false; a.negateDebuff = false;
      a.disarmed = a.disarmNext; a.disarmNext = false;
      if (a.disarmed) this.say('enemy', 'You are Disarmed: you cannot play Attacks this turn.');
      if (a.defNext) { this.gainDef(a.defNext, 'delayed'); a.defNext = 0; }
      if (a.recovery && a.hp < a.maxHp) this.heal(a, a.recovery, 'Recovery', true);
    } else {
      for (const r of a.regenDown) r.turns--; a.regenDown = a.regenDown.filter(r => r.turns > 0);
      if (a.thornsTurns > 0 && --a.thornsTurns === 0) a.thorns = 0;
    }
    for (const [key, label, ignoresBlock] of [['bleed', 'Bleed', false], ['poison', 'Poison', true], ['burn', 'Burn', false]]) {
      if (a[key] > 0 && a.hp > 0 && !this.over) { this.applyHit(this.actorById(a[key + 'By']) || (a.isPlayer ? null : this.player), a, a[key], { isDot: true, label, ignoreBlock: ignoresBlock }); a[key] = Math.max(0, a[key] - 1); }
    }
    if (a.initNext) a.initNext = 0;
  }

  gainDef(n, label) {
    const p = this.player; if (this._playing && this._rankMult && this._rankMult !== 1) n = Math.round(n * this._rankMult);
    const mult = 1 + p.dexterity / 100; const v = Math.round(n * mult);
    p.block += v;
    this.say('player', `${this.partySize > 1 ? p.name + ' gains' : 'You gain'} ${v} ${p.defName}` + (p.dexterity ? ` (${n} x ${mult.toFixed(2)} Dexterity)` : '') + (label === 'delayed' ? ' from last turn' : '') + `. ${p.defName} ${p.block}.`);
    return v;
  }
  heal(a, n, label, quiet) {
    if (n <= 0) return 0;
    if (a.isPlayer && this._playing && this._rankMult && this._rankMult !== 1 && !['Bloodthirst', 'Lifesteal'].includes(label)) n = Math.round(n * this._rankMult);
    const mult = a.isPlayer && !['Bloodthirst', 'Lifesteal'].includes(label) ? 1 + a.spirit / 100 : 1;
    const h = Math.min(a.maxHp - a.hp, Math.round(n * mult));
    a.hp += h; if (a.isPlayer) this.stats.healed += h;
    if (h > 0) { const m = this.mtr(a).healed, k = label || 'Heal'; m[k] = (m[k] || 0) + h; }
    if (h > 0 || !quiet) this.say('heal', `${a.isPlayer ? (this.partySize > 1 ? a.name + ' heals' : 'You heal') : a.name + ' heals'} ${h}${label ? ' (' + label + ')' : ''}. HP ${a.hp}/${a.maxHp}.`);
    return h;
  }
  applyDot(e, key, n) {
    if (!e || e.hp <= 0) return;
    const v = Math.round(n * (1 + this.player.spirit / 100));
    e[key] += v; e[key + 'By'] = this.player.id;
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
    let dmg = amount, absorbed = 0;
    if (tgt.block > 0 && !o.ignoreBlock) { absorbed = Math.min(tgt.block, dmg); tgt.block -= absorbed; dmg -= absorbed; }
    const before = tgt.hp;
    tgt.hp = Math.max(0, tgt.hp - dmg);
    const real = before - tgt.hp, label = o.label || 'Attack';
    if (src) { const m = this.mtr(src).dealt; m[label] = (m[label] || 0) + real; }
    { const t = this.mtr(tgt); const k = src ? src.name : label; t.taken[k] = (t.taken[k] || 0) + real; t.absorbed += absorbed; }
    if (tgt.isPlayer) { this.stats.taken += dmg; this.stats.blocked += absorbed; } else this.stats.dealt += dmg;
    if (o.isDot) this.say('dot', `${tgt.isPlayer ? 'You take' : tgt.name + ' takes'} ${amount} ${o.label}` + (absorbed ? ` (${absorbed} absorbed)` : '') + `. HP ${tgt.hp}/${tgt.maxHp}.`);
    if (tgt.hp <= 0 && !o.defer) this.onDeath(tgt);
    return { lost: dmg, absorbed };
  }

  onDeath(a) {
    if (this.over) return;
    if (a.isPlayer) {
      if (a.dead) return;
      a.dead = true; a.block = 0; a.bleed = 0; a.discard.push(...a.hand.splice(0));
      if (this.duel) { this.winner = this.alivePlayers()[0] || null; this.say('win', `${a.name} falls. ${this.winner ? this.winner.name + ' wins the duel' : 'The duel is a draw'} in ${this.round} round${this.round > 1 ? 's' : ''}.`); this.over = 'duel'; this.phase = 'over'; return; }
      if (!this.alivePlayers().length) { this.say('loss', this.partySize > 1 ? 'The whole party falls.' : 'You fall.'); this.over = 'loss'; this.phase = 'over'; return; }
      this.say('loss', `${a.name} falls! The rest of the party fights on.`);
      if (this.current === a && this.phase === 'player') { this.phase = 'between'; this.nextTurn(); }
      return;
    }
    a.bleed = a.poison = a.burn = 0; a.block = 0;
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
    if (!e || e.hp <= 0) return 0;
    if (this._rankMult && this._rankMult !== 1) base = Math.round(base * this._rankMult);
    const kind = cd ? cd.type : 'Attack', dtype = (cd && cd.dtype) || 'Physical';
    const stat = kind === 'Attack' ? p.strength + p.strTurn + p.strCombat : p.intelligence;
    const elem = p.elem[dtype] || 0;
    const crit = this.rng() * 100 < p.crit;
    const tm = this.typeMod(e, dtype);
    const weakMod = 1 - Math.min(p.weak, 90) / 100, vulnMod = 1 + e.vulnerable / 100;
    const pvp = e.isPlayer ? (1 - Math.min(75, e.resist[dtype] || 0) / 100) * (1 + this.pressure()) : 1;
    const setup = kind === 'Attack' ? (this._attackMult || 1) : (this._skillMult || 1);
    const dmg = Math.max(0, Math.round(base * (1 + stat / 100) * (1 + elem / 100) * weakMod * (crit ? p.critMult : 1) * tm * vulnMod * setup * pvp));
    const parts = [`${base}`];
    if (stat) parts.push(`x ${(1 + stat / 100).toFixed(2)} ${kind === 'Attack' ? 'Strength' : 'Intelligence'}`);
    if (elem) parts.push(`x ${(1 + elem / 100).toFixed(2)} ${dtype} bonus`);
    if (setup !== 1) parts.push(`x ${setup} ${kind === 'Attack' ? 'Assassinate' : 'Amplify'}`);
    if (p.weak) parts.push(`x ${weakMod.toFixed(2)} Weak`);
    if (crit) parts.push(`x ${p.critMult.toFixed(2)} CRIT`);
    if (tm !== 1) parts.push(`x ${tm.toFixed(2)} ${tm > 1 ? dtype + ' weakness' : dtype + ' resist'}`);
    if (e.vulnerable) parts.push(`x ${vulnMod.toFixed(2)} Vulnerable`);
    if (pvp !== 1) parts.push(`x ${pvp.toFixed(2)} resist/Pressure`);
    const r = this.applyHit(p, e, dmg, { defer: true, label });
    this.say(crit ? 'crit' : 'player', `${label} hits ${e.name}: ${parts.join(' ')} = ${dmg}` + (r.absorbed ? `, ${r.absorbed} blocked` : '') + `. HP ${e.hp}/${e.maxHp}.`);
    if (kind === 'Attack' && e.parryBack && r.absorbed && e.hp > 0) { const back = this.applyHit(e, p, Math.round(e.parryBack * this.dmgMult), { defer: true, label: 'Riposte' }); this.say('enemy', `${e.name} parries and strikes back: ${back.lost} HP lost.`); e.parryBack = 0; }
    if (kind === 'Attack' && e.thorns && e.hp > 0) { const t = this.applyHit(e, p, e.thorns, { defer: true, label: e.isPlayer ? 'Thorns' : 'Spikes' }); this.say('enemy', `${e.name}'s ${e.isPlayer ? 'Thorns' : 'spikes'}: ${this.who(p)} lose${this.partySize > 1 ? 's' : ''} ${t.lost} HP.`); }
    if (kind === 'Attack' && p.bleedChance && e.hp > 0 && this.rng() * 100 < p.bleedChance) { e.bleed += 3; e.bleedBy = p.id; this.say('crit', `Bleed Chance: ${e.name} gains 3 Bleed.`); }
    if (p.lifesteal && r.lost) this.heal(p, Math.round(r.lost * p.lifesteal / 100), 'Lifesteal', true);
    if (p.hp <= 0) { this.onDeath(p); return r.lost; }
    if (e.hp <= 0) this.onDeath(e);
    return r.lost;
  }

  enemyHit(e, base, label, dtype, extra) {
    const p = this.player;
    const str = e.strength + e.strTurn, press = this.pressure();
    const res = Math.min(75, p.resist[dtype] || 0) / 100;
    const bonus = extra || 0;
    const dmg = Math.max(0, Math.round((base + bonus) * this.dmgMult * e.dmgTune * (1 + str / 100) * (1 - Math.min(e.weak, 90) / 100) * (1 + press) * (1 - res) * (1 + p.vulnerable / 100)));
    const parts = [`${base}${bonus ? ' + ' + bonus : ''}`];
    if (this.dmgMult !== 1) parts.push(`x ${this.dmgMult.toFixed(2)} map level`);
    if (str) parts.push(`x ${(1 + str / 100).toFixed(2)} Strength`);
    if (e.weak) parts.push(`x ${(1 - e.weak / 100).toFixed(2)} Weak`);
    if (press) parts.push(`x ${(1 + press).toFixed(2)} Pressure`);
    if (res) parts.push(`x ${(1 - res).toFixed(2)} ${dtype} resist`);
    if (p.vulnerable) parts.push(`x ${(1 + p.vulnerable / 100).toFixed(2)} Vulnerable`);
    p.attackedThisRound = true;
    const r = this.applyHit(e, p, dmg, { defer: true, label });
    this.say('enemy', `${e.name}'s ${label} hits ${this.partySize > 1 ? p.name : 'you'}${dtype !== 'Physical' ? ' (' + dtype + ')' : ''}: ${parts.join(' ')} = ${dmg}` + (r.absorbed ? `, ${r.absorbed} absorbed` : '') + `. HP ${p.hp}/${p.maxHp}.`);
    if (p.hp <= 0) { this.onDeath(p); return r.lost; }
    if (p.thorns && e.hp > 0) { const t = this.applyHit(p, e, p.thorns, { defer: true, label: 'Thorns' }); this.say('player', `Thorns: ${e.name} takes ${p.thorns}` + (t.absorbed ? ` (${t.absorbed} blocked)` : '') + '.'); if (e.hp <= 0) this.onDeath(e); }
    return r.lost;
  }

  debuffPlayer(key, n, e) {
    const p = this.player;
    if (p.negateDebuff) { p.negateDebuff = false; this.say('player', `Divine Shield negates the ${key}.`); return; }
    p[key] += n; if (key === 'bleed') p.bleedBy = e && e.id;
    const W = this.partySize > 1 ? p.name : 'You', is = this.partySize > 1 ? 'is' : 'are', gain = this.partySize > 1 ? 'gains' : 'gain';
    const txt = { weak: `${W} ${is} Weak ${p.weak}: ${p.weak}% less damage dealt.`, vulnerable: `${W} ${is} Vulnerable ${p.vulnerable}: ${p.vulnerable}% more damage taken.`, bleed: `${W} ${gain} ${n} Bleed (now ${p.bleed}).`, slow: `${W} ${is} Slowed ${p.slow}.` };
    this.say('enemy', txt[key]);
  }

  canPlay(c) {
    const d = this.card(c), p = this.player;
    if (this.phase !== 'player' || this.over) return { ok: false, why: 'Not your turn' };
    if (d.cost == null) return { ok: false, why: 'Unplayable' };
    if (p.locked && d.cost > 0) return { ok: false, why: 'In Stealth: 0-cost only' };
    if (p.disarmed && d.type === 'Attack') return { ok: false, why: 'Disarmed' };
    if (d.cost > p.mana) return { ok: false, why: `Needs ${d.cost} mana` };
    if (this.duel && d.target === 'enemy' && !this.alive().some(x => !x.stealth)) return { ok: false, why: 'Target is in Stealth' };
    return { ok: true };
  }

  play(uid, targetId) {
    const p = this.player;
    const idx = p.hand.findIndex(c => c.uid === uid);
    if (idx < 0) return false;
    const c = p.hand[idx]; const d = this.card(c);
    if (!this.canPlay(c).ok) return false;
    let tgt = null;
    if (d.target === 'enemy') { const pool = this.alive().filter(x => !x.stealth); tgt = pool.find(e => e.id === targetId) || pool[0]; if (!tgt) return false; }
    p.mana -= d.cost; p.hand.splice(idx, 1); this.stats.cardsPlayed++;
    this.say('card', `${this.partySize > 1 ? p.name + ' plays' : 'You play'} ${d.name}${d.cost ? ' (' + d.cost + ' mana)' : ''}` + (tgt ? ` on ${tgt.name}` : '') + `. Mana ${p.mana}.`);
    if (d.target === 'all' && p.stealth) p.stealth = false;
    if (this.duel && d.target === 'all') for (const x of this.alive()) if (x.stealth) { x.stealth = false; this.say('player', `${x.name}'s Stealth is broken.`); }
    this._playing = d; this._rankMult = d.mult || 1;
    this._attackMult = d.type === 'Attack' ? p.nextAttackMult : 1;
    this._skillMult = (d.type === 'Skill' && d.tags.dmg) ? p.nextSkillMult : 1;
    let times = 1;
    if (d.type === 'Attack' && this.rng() * 100 < p.multiHit) { times = 2; this.say('crit', `Multi-hit! ${d.name} strikes again.`); }
    if (d.tags.dmg && this.rng() * 100 < (d.type === 'Attack' ? p.multiplay : p.multicast)) { times++; this.say('crit', `${d.type === 'Attack' ? 'Multiplay' : 'Multicast'}! ${d.name} is played again for free.`); }
    for (let i = 0; i < times && !this.over; i++) { if (tgt && tgt.hp <= 0) tgt = this.alive()[0]; if (d.target === 'enemy' && !tgt) break; d.play(this, tgt); }
    if (d.type === 'Attack' && p.nextAttackMult !== 1) p.nextAttackMult = 1;
    if (this._skillMult !== 1) p.nextSkillMult = 1;
    this._playing = null; this._rankMult = 1; this._attackMult = 1; this._skillMult = 1;
    (d.exhaust ? p.exhaust : p.discard).push(c);
    return true;
  }

  endPlayerTurn() {
    if (this.phase !== 'player') return;
    const p = this.player; const kept = p.hand.length;
    p.discard.push(...p.hand.splice(0));
    if (kept) this.say('player', `End turn: ${kept} card${kept > 1 ? 's' : ''} discarded.`);
    p.strTurn = 0; p.disarmed = false; p.locked = false;
    p.weak = Math.floor(p.weak / 2); p.vulnerable = Math.floor(p.vulnerable / 2); if (p.slow) p.slow = Math.max(0, p.slow - 1); if (p.chill) p.chill = Math.max(0, p.chill - 1);
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
    if (c.cost > e.mana) { this.say('enemy', `${e.name} can't afford ${c.name}.`); return true; }
    e.mana -= c.cost; e.hand.splice(i, 1); e.discard.push(c);
    this.say('enemy', `${e.name} plays ${c.name}: ${c.text}`);
    const aoe = c.ops.some(o => o.all || o.op === 'shredAll') || /every player|each of their/.test(c.text);
    const PLAYER_OPS = ['damage', 'execute', 'damageBlock', 'debuff', 'stealMana', 'burnMana', 'drawLess', 'disarm', 'purge', 'shred', 'shredAll', 'tickBleed', 'status'];
    const targeted = !aoe && c.ops.some(o => PLAYER_OPS.includes(o.op));
    // pick who this card hits: area cards hit every standing hero; single-target cards pick a random hero who isn't in Stealth
    const standing = this.alivePlayers();
    let mark = null;
    if (aoe) { for (const q of standing) if (q.stealth) { q.stealth = false; this.say('enemy', `${c.name} hits everyone: ${this.partySize > 1 ? q.name + "'s" : 'your'} Stealth is broken.`); } }
    else if (targeted) {
      const seen = standing.filter(q => !q.stealth);
      if (!seen.length) { this.say('player', `${e.name} can't find ${this.partySize > 1 ? 'anyone' : 'you'} in Stealth: ${c.name} misses.`); return true; }
      const planned = c.mark && seen.find(q => q.id === c.mark);
      mark = planned || this.pickMark(e);
      e.lastMark = mark.id; c.mark = null;
      if (this.partySize > 1) this.say('enemy', `${e.name} targets ${mark.name}.`);
    }
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
            if (op.bleedPerHit && !this.over) this.debuffPlayer('bleed', op.bleedPerHit, e);
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
        case 'stealMana': { const s = Math.min(op.n, p.mana); p.mana -= s; e.mana += s; this.say('enemy', `${e.name} steals ${s} mana.`); break; }
        case 'burnMana': { const s = Math.min(op.n, p.mana); p.mana -= s; this.say('enemy', `${e.name} burns ${s} of your mana.`); break; }
        case 'gainMana': e.mana += op.n; this.say('enemy', `${e.name} gains ${op.n} mana.`); break;
        case 'debuff': this.debuffPlayer(op.key, op.n, e); break;
        case 'teamStrength': for (const x of this.alive()) x.strTurn += op.n; this.say('enemy', `All enemies gain ${op.n} Strength this round.`); break;
        case 'strTurn': e.strTurn += op.n; this.say('enemy', `${e.name} gains ${op.n} Strength this round.`); break;
        case 'strCombat': e.strength += op.n; this.say('enemy', `${e.name} gains ${op.n} Strength for the fight (now ${e.strength}).`); break;
        case 'initNext': e.initNext = op.n; break;
        case 'status': {
          if (p.negateDebuff) { p.negateDebuff = false; this.say('player', `Divine Shield blocks the ${C[op.key].name}.`); break; }
          for (let k = 0; k < op.n; k++) { const sc = { uid: 'c' + (this._uid++), key: op.key }; if (op.pile === 'discard') p.discard.push(sc); else p.drawPile.splice(Math.floor(this.rng() * (p.drawPile.length + 1)), 0, sc); }
          this.say('enemy', `${op.n} ${C[op.key].name} added to your ${op.pile} pile.`); break;
        }
        case 'drawLess': p.drawLess += op.n; this.say('enemy', 'You will draw 1 fewer card next round.'); break;
        case 'disarm': if (p.negateDebuff) { p.negateDebuff = false; this.say('player', 'Divine Shield blocks the Disarm.'); } else { p.disarmNext = true; this.say('enemy', 'You are Disarmed: no Attacks on your next turn.'); } break;
        case 'cleanse': e.weak = e.vulnerable = e.bleed = e.poison = e.burn = e.chill = e.slow = 0; e.regenDown = []; this.say('enemy', `${e.name} shakes off every debuff.`); break;
        case 'purge': { const had = p.strTurn || p.strCombat || p.nextAttackMult !== 1 || p.nextSkillMult !== 1 || p.negateDebuff; p.strTurn = 0; if (op.all) p.strCombat = 0; p.nextAttackMult = 1; p.nextSkillMult = 1; p.negateDebuff = false; this.say('enemy', had ? 'Your buffs are stripped.' : 'You have no buffs to take.'); break; }
        case 'nextBonus': e.nextBonus += op.n; break;
        case 'shred': { const s = Math.min(op.n, p.block); p.block -= s; this.say('enemy', `${e.name} removes ${s} of your ${p.defName}.`); break; }
        case 'shredAll': this.say('enemy', `${e.name} strips all ${p.block} of your ${p.defName}.`); p.block = 0; break;
        case 'tickBleed': if (p.bleed) this.applyHit(e, p, p.bleed, { isDot: true, label: c.name }); break;
        case 'draw': { this.drawCards(e, op.n); const nc = e.hand[e.hand.length - 1]; if (nc && nc.cost <= e.mana && !e.plan.includes(nc.uid) && nc !== c) e.plan.push(nc.uid); break; }
      }
      if (!PLAYER_OPS.includes(op.op)) break; // non-hero effects (block, mana, strength) happen once
      }
    }
    if (!this.over && e.d.tier === 'Boss' && e.phase === 1 && e.hp > 0 && e.hp <= e.maxHp / 2) this.phaseTwo(e);
    return !this.over;
  }

  phaseTwo(e) {
    e.phase = 2;
    for (const c of e.phase2Cards) e.drawPile.splice(Math.floor(this.rng() * (e.drawPile.length + 1)), 0, c);
    if (e.d.draw2) e.draw = e.d.draw2;
    if (e.d.regen2) e.regen = e.d.regen2;
    this.say('crit', `${e.name} enters PHASE 2. New cards join its deck; it now draws ${e.draw} and regenerates ${e.regen}.`);
  }

  endEnemyTurn(e) {
    if (e.hand.length) e.discard.push(...e.hand.splice(0));
    if (e.hp > 0) { this.drawCards(e, e.d.tier === 'Boss' && e.phase === 1 && e.hp <= e.maxHp / 2 && e.d.draw2 ? e.d.draw2 : e.draw); this.planEnemy(e); }
    e.weak = Math.floor(e.weak / 2); e.vulnerable = Math.floor(e.vulnerable / 2); if (e.chill) e.chill = Math.max(0, e.chill - 1);
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
function rollItem(data, rng, baseName, rarity, level) {
  const G = data.gear, b = G.bases.find(x => x.name === baseName); if (!b) return null;
  const A = G.arche[b.arch]; const R = G.rarity.find(r => r.name === rarity);
  const lv = Math.pow(G.levelGrowth, level), mult = R.mult * lv, twoH = A.hands && A.hands.startsWith('2H') ? G.twoHand : 1;
  const rollStat = (stat) => { const s = G.stats[stat]; const lo = Math.max(1, Math.round(s.min * mult * twoH)), hi = Math.max(lo, Math.round(s.max * mult * twoH)); const v = ri(rng, lo, hi); return { v, lo, hi, pts: v * s.pts / twoH }; };
  const stats = {}, lines = [];
  const imp = rollStat('Map resistance (implicit)'); stats['Resistance:Fire'] = imp.v;
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
    else if (G.stats[A.imp2]) imp2[A.imp2] = rollStat(A.imp2).v;
  }
  const maxPts = (G.implicitMax + 4 * G.affixMax) * 1.3 * lv;
  const ilvl = Math.max(1, Math.min(100, Math.round(5 * level + 5 * Math.min(1, points / maxPts))));
  const slot = /Shield|Focus/.test(A.slot) ? 'Off-hand' : /Axe|Sword|Dagger|Mace|Wand|Maul|Warhammer|Staff/.test(A.slot) ? 'Weapon' : A.slot;
  return { name: baseName, label: b.label, arch: b.arch, slot, hands: A.hands, rarity, ilvl, stats, imp2, lines, level };
}
// ---------- card ranks (Draft 10/11 rules, simplified for the prototype)
// Cards with a big number (8+) grow it 10% of base per rank (White/Green) or 8% (Blue/Gold); +10 is about double.
// Cards with only small numbers get 1 mana cheaper per rank instead, down to 60% of base cost.
const CARD_XP = { White: 1, Green: 3, Blue: 9, Gold: 27 };      // XP a card gives when fed to another (x2 if it's the same card)
const RANK_BASE = { White: 2, Green: 4, Blue: 8, Gold: 16 };    // reaching rank N costs N x this in XP, and N x this x 5 gold
const DECK_POINTS = { White: 15, Green: 28, Blue: 42, Gold: 59 }, DECK_RANK_STEP = 1.9 / 3;
const DECK_CAPS = { Gold: 2, Blue: 4, Green: 6 }, DECK_MIN = 20, DECK_MAX = 30, MAX_RANK = 10;
function bigNumber(d) { const t = d.tags || {}; return (t.dmg || 0) >= 8 || (t.def || 0) >= 8 || (t.heal || 0) >= 8; }
function rankedCard(key, rank) {
  const d = C[key]; if (!rank) return d;
  const v = Object.create(d); v.rank = rank; v.name = d.name + ' +' + rank;
  if (bigNumber(d)) {
    v.mult = 1 + (d.rarity === 'Blue' || d.rarity === 'Gold' ? 0.08 : 0.10) * rank;
    v.text = d.text.replace(/\b(\d+)(?!%)\b/g, (m, n) => +n >= 8 ? String(Math.round(n * v.mult)) : m);
  } else { v.mult = 1; if (d.cost != null) v.cost = Math.max(Math.ceil(d.cost * 0.6), d.cost - rank); }
  return v;
}
function cardPool(cls) { return Object.keys(C).filter(k => C[k].cls === cls && ['White', 'Green', 'Blue', 'Gold'].includes(C[k].rarity)); }
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

function rollDrops(data, rng, enemyKey, level, luck) {
  const d = data.enemies[enemyKey], G = data.gear;
  const table = G.drops[d.tier]; const out = [];
  if (!table || !d.pool.length) return out;
  const lk = 1 + (luck || 0) / 100;
  for (let i = 0; i < table.rolls; i++) {
    let r = rng() * 100, acc = 0, got = null;
    for (const rar of ['Purple (Epic)', 'Blue', 'Green', 'White']) { acc += table.chance[rar] * lk; if (r < acc) { got = rar; break; } }
    if (got) out.push(rollItem(data, rng, d.pool[Math.floor(rng() * d.pool.length)], got, level));
  }
  return out;
}

const API = { CARDS_VERSION: 2, CARD_DROPS, CARD_XP, RANK_BASE, DECK_CAPS, DECK_MIN, DECK_MAX, MAX_RANK, rankedCard, cardPool, rollCards, cardPoints, deckLevel, CARDS: C, CLASSES, STARTER_GEAR, presetGear, ELEMENTS, sumGear, Combat, parseEnemyCard, intentKind, BASE, rollItem, rollDrops, makeRng, shuffle, ri };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CB = Object.assign(root.CB || {}, API);
})(typeof window !== 'undefined' ? window : globalThis);
