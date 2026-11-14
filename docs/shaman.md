# Shaman: class design (agreed Nov 13; BUILT and live Nov 14)

Built in src/shaman.js (cards, Powers, codex passives, engine hooks), src/talents.js (the six trees at the bottom), src/engine.js (search "Shaman"),
src/testdecks.js (18 decks, made by tools/shaman/testdecks.js). Tests: `node tools/shaman/test.js` (every card) and `node tools/shaman/fuzz_all.js`.
Codex names: Hybrid = Twinstorm, Healer = Rainbringer, Caster = Stormcaller, Melee = Skybreaker, Support tank = Stormwarden, Control = Calm Eye.
Differences from the notes below: the card "Stormwarden" became Storm's Aegis; Quiet Sky gives 8 Guard on a quiet turn; Patience makes next turn's cards cost 10 less;
Wellspring gives 3 defence per heal instead of turning overhealing into Barrier; Skybreaker repeats the last Skill of any kind (changed Nov 14, was the last damaging spell); Lightning Rod is an exhausting Skill, not a Power. No card art yet.

**Identity.** A hybrid through and through: Attacks and spells mixed in one deck, built around Multi-hit and Multicast.
Totems are saved for the Druid.

- **Defense:** Dodge; Block while a shield is worn (same switch the Warrior and Paladin use for Parry/Block).
- **Element:** Nature only, all of it lightning: Lightning Bolt, Chain Lightning, Lightning Burst, Lightning Cloud...
- **Armour:** a mix of leather and cloth.
- **Weapons:** two one-handed maces (implicit: half a sword's Multi-hit plus the same Multicast), or an Arcane Staff (Multicast).
- **Multi-hit over 100%:** Shaman only, and only through the Healer's guaranteed Multi-hit: the overflow is a chance at a third hit (150% = two hits for sure, 50% chance of a third). Other classes still stop at two hits.

## Nature resistance (agreed Nov 14)

The Tanglewild's monsters resist Nature, and the Shaman only deals Nature. The answer is a new stat, **Penetration**
(ignores part of the target's resistance), handed out through the Shaman's talents. New to the game: no class has it today.
In the Hybrid, Caster and Melee trees: a Lv 4 talent removes 50% of the target's resistance, and a Lv 14 talent ignores
another 25% (75% in all). Remember the standing rule that halves talent numbers: write double, or exempt these.

## Static (agreed Nov 14)

Lightning spells build Static on the target. Static does nothing by itself: cards consume it to deal damage and to stun
(changed later on Nov 14 from "auto-stun at 10"). The Shaman has no Bleed and no Poison.

## Cards agreed so far (Nov 14, chat only, nothing in the game)

- **Electrocute** (Blue, 0): consume 10 Static from a monster and Stun it for 1 turn.
- **Mass Electrocute** (Blue, 10): consume all Static from all monsters; each is Stunned 1 turn per 10 Static consumed.
- Power: each spell cast applies 1 extra Static.
- Power: when a target reaches 15 Static, Electrocute is put into your hand from anywhere (deck, discard, exhaust).
- Power: Multicasts apply 1 extra Static.
- Power: if a Skill does not Multicast, roll again at 50% of your Multicast chance (30% chance: a 15% second roll).
- **Living Lightning** (Healer): heal a target; if it Multicasts, it also casts Chain Lightning.
- **Spirit Link** (Gold Power): all damage is shared evenly between the party.
- Tank: a debuff that lowers all of the target's resistances by a small amount (counts as one more unique debuff).
- **Lightning Shield** (Gold Power, lasts the fight): hits against the Shaman build Static on the attacker (amount per hit to set; 1 suggested).
- The cards first called Windfury and Stormstrike need new names.
- Draft families from chat: lightning spells, Static payoffs, mace Attacks, weapon charges, heals, Shaman debuffs
  (Soaked, Deafened, Unsteady, Hex, mana burn, cost increase), defence.

## Look (agreed Nov 14)

Theme: lightning, rain and storm, nature. Class colour: a dark, deep blue, clearly darker than the Mage's light blue (#4f93e6).

## Codexes

1. **Hybrid.** 50% of Strength is added as Intelligence and 50% of Intelligence as Strength (buffs gained in a fight count too).
   Each Attack adds 10% Multicast chance, each Skill adds 10% Multi-hit chance; the stored chance is spent when it triggers.
   No cap on the stored chance (agreed Nov 14: see how it plays first).
2. **Healer.** Beneficial heals can Multicast (Shaman only, this codex only). A heal that Multicasts makes your next Attack
   a guaranteed Multi-hit (+100%, so gear Multi-hit on top becomes the chance of a third hit).
3. **Caster.** Any Multicast also fires a third copy at 50% strength.
4. **Melee.** Any Multi-hit also casts the last spell you cast, free, at half strength. The plan: cast one big spell, then
   stack Multi-hit to repeat it.
5. **Support tank.** Your buffs and debuffs do not degrade over time. You take 5% less damage for each unique debuff on
   the enemy. (Agreed Nov 14; replaces the "bard" party-buff idea and the earlier disarm idea.)
   Only 20% of your Dodge or Block fades between turns, not half (the same as Bulwark, Riposte and Barrier Savant).
   Only debuffs the Shaman itself applied count (agreed Nov 14). Talent in this tree: every Attack has a chance to taunt.
6. **Control.** End a turn without acting and your next card is played twice. Tools to take an enemy's turn away:
   a polymorph-style card, card burn, mana burn, mana lockout next turn.
   Agreed Nov 14: a 0-cost card counts as acting. Polymorph and mana lockout work on map bosses. Raid bosses stay immune
   to control; against them the Control Shaman simply acts every other turn (skip a turn, next card plays twice).

## Open questions

- Support tank: taunt chance per Attack (number, and which talent row)? Is the 5% per debuff capped?
- Settled Nov 14: Static does not fade (for now). No stun-lock guard: if someone has the draw and mana, let them cook.
  Mass Electrocute is uncapped (30 Static = 3 turns). Spirit Link splits the hit before defences: a 30 hit on one of two
  linked heroes becomes 15 each, and each hero's own defences then apply to their share.
- Penetration does not exist in the engine yet.
- Cards: the working list (137 cards, 31 Gold) is in docs/shaman_cards.md. Nothing generated in the game.
- Gear: maces give both stats, and since Nov 13 rings can roll Multi-hit and Multicast for every class.
- Starter deck, starter kit. Exact colour hex to be picked against the map and party frames (start from #2b4fa8).
