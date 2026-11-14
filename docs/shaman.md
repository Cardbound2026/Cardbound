# Shaman: class design (agreed Nov 13, not built yet)

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
   Talent in this tree: every Attack has a chance to taunt.
6. **Control.** End a turn without acting and your next card is played twice. Tools to take an enemy's turn away:
   a polymorph-style card, card burn, mana burn, mana lockout next turn.
   Agreed Nov 14: a 0-cost card counts as acting. Polymorph and mana lockout work on map bosses. Raid bosses stay immune
   to control; against them the Control Shaman simply acts every other turn (skip a turn, next card plays twice).

## Open questions

- Support tank: taunt chance per Attack (number, and which talent row)? Is the 5% per debuff capped? "Do not degrade" covers
  the Shaman's own buffs and the debuffs the Shaman applies: does it include Bleed/Poison stacks ticking down?
- Penetration numbers: how much per talent, and where in each tree (see "Nature resistance" above). The stat does not exist
  in the engine yet.
- Gear: maces give both stats, and since Nov 13 rings can roll Multi-hit and Multicast for every class.
- Starter deck, starter kit. Exact colour hex to be picked against the map and party frames (start from #2b4fa8).
