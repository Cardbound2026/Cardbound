# One showcase deck per codex. base = index into DECKS (decks.py); cards override where needed.
# holes: (type, text) with type in 'By design' | 'Open' | 'Watch'
E = []
def X(base, whys, holes, questions, cards=None, plan=None, strong=None, counter=None):
    E.append(dict(base=base, whys=whys, holes=holes, questions=questions, cards=cards, plan=plan, strong=strong, counter=counter))

# ======================= WARRIOR =======================
X(0, {
 'Crushing Bastion':'Main finisher: one hit for your entire Block.',
 'Focused Fury':'+50% on Shield Wall (60 Block) or on Crushing Bastion.',
 'Shield Wall':'40 Block in one card; the biggest single Block source.',
 'Fortify':'50 Block spread over 5 turns keeps the wall up.',
 'Bully':'32 damage when healthier, which a tank usually is.',
 'Berserker Rage':'The one debuff answer, since debuffs are the counter.',
 'Shield Slam':'50% of Block as damage without spending it.',
 'Shield Up':'Block now and next turn.',
 'Unflinching':'Block plus blocks one debuff.',
 'Thunderclap':'AoE that is strongest at full HP, where tanks live.',
 'Conditioning':'+10 max mana and +5 regen to afford 20-cost cards.',
 'Shield Bash':'Hybrid backbone: damage and Block in one card.',
 'Shield Strike':'White Shield Slam: chip damage that keeps the Block.',
 'Defend':'Plain Block.',
 'Brace':'Retain lets you hold Block for the turn you need it.',
 'Grit':'3 free Block every turn.'},
 [('By design','Slow damage; real damage arrives around turn 3-4.'),
  ('By design','Poison and debuffs are the counter (only Berserker Rage and Unflinching resist them).'),
  ('By design','Block shredders beat it; Indomitable (Gold) is the answer if you give up a Gold slot.'),
  ('Open','No status-card removal (Kick Aside, Clear Head), so Dazed or Stun decks clog it.'),
  ('Open','No mana-burn defense for a deck that is already mana-hungry.')],
 ['Should Bulwark get one cheap status-card answer, or is clogging part of its weakness?',
  'Is Crushing Bastion meant to stack with Focused Fury (1.5x the whole Block)? It can one-shot bosses.'])
X(2, {
 'Parry Reversal':'Payoff: hit for all your Parry.',
 'Expose Opening':'Every full parry applies 10 Vulnerable, which helps the whole party.',
 'Shield Wall':'40 Parry in one card.',
 'Fortify':'Parry every turn, so some is always up when enemies swing first.',
 'Bait':'Parry plus Vulnerable and a discard on the attacker.',
 'Partial Guard':'Makes big hits count as full parries.',
 'Counter Stance':'Parry plus 5 damage back per attack.',
 'Jarring Parry':'20 Parry; full parries clog the attacker with Dazed.',
 'Hamstring':'Shrinks the next hit so it is fully parried.',
 'Read the Blade':'Parry exactly sized to the incoming attack.',
 'Challenging Roar':'Forces enemies to attack you through your next turn.',
 'Guarded Stance':'Cheap Parry that draws on a full parry.',
 'Riposte':'Cheap Parry with damage back.',
 'Defend':'Plain Parry (same as Block without a shield).',
 'Taunt':'Cheap single-round aggro.'},
 [('By design','Does nothing against enemies that never attack (casters, damage over time).'),
  ('By design','Block shred hits Parry the same way.'),
  ('By design','Wants low initiative; enemies must swing before your counters.'),
  ('Open','No AoE; swap in Thunderclap on swarm maps.'),
  ('Watch','PvP stall: a smart opponent never attacks and PvP has no Pressure.')],
 ['Should PvP have its own Pressure or a turn limit so Riposte mirrors cannot stall forever?',
  'Does Expose Opening apply once per full parry or once per turn?'])
X(4, {
 'Blood Reckoning':'Finisher: spread and double your Bleed, heal for all the damage.',
 'Crimson Covenant':'Doubles Bleed on you and enemies; more fuel for the finisher.',
 'Blood Pact':'+1 Strength every time your own cards cost HP.',
 'Pay in Blood':'+50% Blood Debt from all HP loss.',
 'Blood Ritual':'Extra card every turn for 5 HP.',
 'Transfusion':'Dump your own Bleed onto the target early if you are too low.',
 'Bloodlust':'Free Strength and a card, paid in HP.',
 'Collect the Debt':'Turns stored Blood Debt into damage.',
 'Sanguine Guard':'Turns stored Blood Debt into Block when in danger.',
 'Deep Cuts':'Two hits of Bleed (mirrored onto you by the codex).',
 'Crimson Whirl':'AoE Bleed so Blood Reckoning hits every enemy.',
 'Rend':'Cheap Bleed.',
 'Reckless Swing':'14 damage for 4 HP: feeds Blood Pact and Blood Debt.',
 'Desperate Strike':'Hits harder the lower you are.',
 'Bloodletting':'Free mana for 5 HP.'},
 [('By design','Anti-heal (Mortal Strike, Wound Poison, Brand of Sin) shuts off the finisher.'),
  ('By design','Can die during setup if the burst is mistimed.'),
  ('Watch','Crimson Covenant doubles Bleed on yourself too: with Blood Clock or Open Veins it can kill you fast.'),
  ('Open','Stun or Disarm on the finisher turn stops the heal-back attack.')],
 ['Does Blood Reckoning heal for damage dealt to ALL enemies or only the main target? (Huge difference on swarm maps.)',
  'Should Blood Debt also expire if you play no Attack for a turn, to stop banking it forever?'])
X(6, {
 'Limit Break':'Payoff: spend all mana as damage, 1 for 1.',
 'Deferred Power':'Banks mana and returns it +50%, even past max.',
 'Double Strike':'Replays Limit Break (repeats the first hit).',
 'Concussive Blow':'Big hit plus a Stun card.',
 'Second Lung':'+20 regen to refill the bank.',
 'Spoils of War':'A kill banks 30 mana for the next fight.',
 'War Chest':'Hold it to bank 10 mana per turn.',
 'Wind Up':'Retain; boosts the next expensive Attack.',
 'Conditioning':'More max mana to bank into.',
 'Staggering Blow':'Damage plus Dazed; 20 mana toward Stagger.',
 'Crushing Blow':'Strips their best card before your big turn.',
 'Heavy Swing':'Efficient 20-cost hit that builds Stagger.',
 'Hunker Down':'Block now, mana next turn: defends during setup.',
 'Warcry':'+20 mana next turn.',
 'Catch Your Breath':'Free 10 mana, costs a Dazed later.'},
 [('By design','Mana burn and Hex are the nightmare counters.'),
  ('By design','Slow setup with few defensive cards.'),
  ('Watch','Double Strike + Limit Break doubles a full mana dump (biggest combo in the game).'),
  ('Open','Swarm maps: swap a Gold for Manaquake or add Seismic Slam.')],
 ['Should mana-dump cards (Limit Break, Shadow\'s Price, Falling Star) be excluded from replay effects?',
  'Do Stuns from the Stagger meter go into the target\'s draw pile or discard pile?'])
X(8, {
 'Thousand Cuts':'Payoff: 1 hit per 5 mana, Strength added to every hit.',
 'Ruthless Conversion':'Turns Vulnerable into permanent Strength (1 per 5).',
 'Double Strike':'Replays Thousand Cuts.',
 'Rampage':'Grows each time it is played.',
 'Reckless Fury':'+5 Strength now; HP cost grows each turn.',
 'Relentless Assault':'Multi-hits keep stacking Vulnerable.',
 'Sharpen':'+6 damage per hit on the next multi-hit Attack.',
 'Momentum':'Draws a card on your 3rd Attack each turn.',
 'Sundering Blow':'Strips Block so small hits land.',
 'Adrenaline Surge':'+6 Strength right away for a burst turn.',
 'Reclaim Ground':'Escape hatch: turn Vulnerable into Block if a cleanse is coming.',
 'Sunder Armor':'Cheap Vulnerable source.',
 'Crack Armor':'15 Vulnerable and a card.',
 'Flurry of Blows':'3 hits; scales with Strength.',
 'Battle Shout':'Strength and a card for the burst turn.'},
 [('By design','Block and Dodge eat small hits.'),
  ('By design','Cleansing Vulnerable wipes the setup.'),
  ('Watch','Thousand Cuts with replay and high Strength can still one-shot; tune the 5-mana rate.'),
  ('Open','No AoE at all.')],
 ['Does Strength from Battle Shout and Adrenaline Surge stack with Ruthless Conversion Strength? (Assumed yes.)'])
X(10, {
 'Hemorrhagic Strike':'Payoff: 10 damage plus half the target\'s Bleed.',
 'Mortal Precision':'Crits deal 30% more.',
 'Killer Instinct':'+25% crit chance and +50% crit damage for 2 turns.',
 'Double Strike':'Replays a crit (repeats the first result).',
 'Scent of Blood':'Draws a card for every bleeding enemy.',
 'Execute':'Finisher once Bleed has done its work.',
 'Deep Cuts':'Two hits of Bleed.',
 'Sever':'On crit, Bleed ticks instantly: the burst button.',
 'Crimson Whirl':'AoE Bleed for swarm maps.',
 'Momentum':'Draws on the 3rd Attack each turn.',
 'Lacerate':'Cheap hit that Bleeds on crit.',
 'Rend':'Guaranteed Bleed.',
 'Flurry of Blows':'3 hits = 3 crit chances.',
 'Pommel Strike':'Damage plus a card.'},
 [('By design','Block absorbs Bleed.'),
  ('By design','Bleed-resistant maps halve it; Bleed dies with each enemy on swarm maps.'),
  ('Open','Crit consistency depends heavily on gear.')],
 ['Do crit Bleeds from the codex also benefit from Mortal Precision (they are based on crit damage)?'])
# ======================= ROGUE =======================
X(12, {
 "Shadow's Price":'Payoff: spend all mana as damage from Stealth.',
 'First Blood':'First Attack each turn +30% damage and +30% crit.',
 'Shadow Dance':'Stealth that still lets you play one more card.',
 'Vanish':'Cleanse plus Stealth: escape button.',
 'Eviscerate':'24 damage, plus Bleed from Stealth.',
 'Killing Focus':'Crit boost for the burst turn.',
 'Hide':'Enter Stealth directly.',
 'Ambush':'Doubled damage and a card from Stealth.',
 'Hidden Stash':'Banks mana while you wait in Stealth.',
 'Patient Blade':'Grows each turn it is held.',
 'Backstab':'Cheap Stealth payoff.',
 'Lurk':'Dodge that rewards playing one card.',
 'Quick Hands':'+20 mana next turn.',
 'Evade':'Plain Dodge.'},
 [('By design','AoE breaks Stealth; AoE-heavy enemies keep it exposed.'),
  ('By design','Low card activity during setup turns.'),
  ('Open','Stealth only stops direct Attacks: Poison and Burn ticks still hit.')],
 ['In co-op, if the Rogue is Stealthed, do enemies retarget allies automatically? (Assumed yes.)',
  'Does playing a 0-cost card (e.g. a Shuriken) count toward the one-card Stealth limit?'])
X(14, {
 'Plague Bloom':'Multiplies Poison already on the target.',
 'Accelerant Venom':'Poison ticks twice.',
 'Deadly Toxin':'12 Poison in one card.',
 'Virulence':'+1 Poison every time you apply it.',
 'Wound Poison':'Anti-heal: stops healers and Bloodbound.',
 'Fester':'Extra Poison tick on demand.',
 'Crippling Poison':'Poison plus Slow.',
 'Mind-Numbing Poison':'Poison plus a cost increase.',
 'Toxic Cloud':'AoE Poison for swarms.',
 'Slip the Snare':'Dodge plus blocks a debuff.',
 'Envenom':'Cheap Poison.',
 'Poisoned Blade':'Hybrid damage and Poison.',
 'Evade':'Plain Dodge.'},
 [('By design','Cleanses wipe it.'),
  ('By design','Slow start; burst decks kill it first.'),
  ('Watch','Plague Bloom + Accelerant Venom + Virulence grows very fast in long boss fights.')],
 ['Should Poison have a cap per target (e.g. 99 stacks)?',
  'Accelerant Venom says "tick twice as fast": two ticks per turn, each losing 1 stack?'])
X(16, {
 'Exsanguinate':'Payoff: 5x the target\'s Bleed.',
 'Rupture':'Doubles Bleed before the payoff.',
 'Arterial Strike':'Instant Bleed tick.',
 'Killing Focus':'Crit boost.',
 'Shadow Echo':'Replays Exsanguinate.',
 'Coup de Grace':'Execute for leftovers.',
 'Garrote':'Big Bleed in one hit.',
 'Ribbon Cuts':'3 hits of Bleed.',
 'Case the Joint':'+3 cards next turn to find the combo.',
 'Leeching Blade':'Lifesteal to survive.',
 'Serrated Edge':'Cheap Bleed.',
 'Twin Daggers':'2 hits; Strength scaling.',
 'Blade Dance':'4 small hits.',
 'Feint':'Dodge and a card.'},
 [('By design','Block absorbs Bleed.'),
  ('Watch','Rupture then Exsanguinate then Shadow Echo replay = 20x Bleed in one turn.'),
  ('Open','Generic cleanses cannot remove Bleed, so few decks can stop it.')],
 ['Should Exsanguinate be excluded from replay, or should its multiplier drop from 5x?'])
X(18, {
 'Shuriken Storm':'Generates a Shuriken per turn and makes all Shurikens hit every enemy.',
 'Sharpened Stars':'Doubles Shuriken damage.',
 'Shuriken Mastery':'+3 Shuriken damage.',
 'Storm of Steel':'5 Shurikens at once.',
 'Bounty':'Kill something, bank 30 mana.',
 'Quickened Pulse':'+20 regen.',
 'Hidden Pockets':'A free Shuriken every turn.',
 'Shuriken Volley':'3 Shurikens.',
 'Kunai Rain':'AoE double hit.',
 'Blur':'Dodge now and next turn.',
 'Throwing Stars':'2 Shurikens.',
 'Fan of Knives':'Cheap AoE.',
 'Evade':'Plain Dodge.',
 'Sprint':'Initiative and a card.'},
 [('By design','Block and Dodge eat 4-damage hits.'),
  ('Open','Hand limit 10: Shuriken generation can overflow the hand.')],
 ['When a card would be added to a full hand (10), is it lost or put in the discard pile?',
  'Does Shuriken Storm\'s "hit all enemies" stack with Sharpened Stars doubling (so 8 to everyone)?'])
X(20, {
 'Total Sabotage':'Exhaust the enemy hand; costs you Dazed.',
 'Cut the Thread':'Unblocked hits make both sides exhaust a card.',
 'Ransack':'Exhaust a random enemy card for one Dazed.',
 'Kidney Shot':'Stun card plus damage.',
 'Siphon Purse':'Burn 20, gain 10.',
 'Sabotage Supplies':'AoE discard; breaks Stealth.',
 'Pilfer':'Damage plus a discard.',
 'Kick While Down':'Payoff: damage per card they lost this round.',
 'Spread Rumors':'2 Dazed into their deck.',
 'Venom Vial':'2 Venom into their deck.',
 'Dirty Trick':'Weak and a card.',
 'Cheap Shot':'Extra damage if they have no Block.',
 'Lift Coin':'Damage plus mana.',
 'Toss Aside':'Clears your own Dazed from Total Sabotage.',
 'Evade':'Plain Dodge.'},
 [('By design','High-draw and burst decks play through it.'),
  ('Watch','Total Sabotage clogs your own deck with Dazed.'),
  ('Open','Still low damage; Kick While Down is the only real payoff.')],
 ['For Cut the Thread, do you pick which of your own cards to exhaust, or is it random?'])
X(22, {
 'Phantom Strike':'Payoff: spend all mana as damage and as Dodge.',
 'Evasive Flow':'Doubles Dodge gained for 2 turns.',
 'Evasion':'40 Dodge.',
 'Afterimage':'Draw a card every time an attack is fully dodged.',
 'Mirror Step':'Reflects a debuff.',
 'Quickened Pulse':'+20 regen for Phantom Strike.',
 'Phantom Lunge':'50% of Dodge as damage, Dodge kept.',
 'Evasive Counter':'5 damage back per attack.',
 'Blur':'Dodge now and next turn.',
 'Shadow Cloak':'Dodge and Stealth if it is your only card.',
 'Slip Away':'Hybrid damage and Dodge.',
 'Nimble':'3 Dodge every turn.',
 'Feint':'Dodge and a card.',
 'Evade':'Plain Dodge.'},
 [('By design','Does nothing against non-attackers.'),
  ('By design','Block shred hits Dodge.'),
  ('Open','The codex says "preventing enough damage" empowers the next Attack, but "enough" is undefined.')],
 ['What threshold should the Phantom codex use? Proposal: every 20 damage prevented by Dodge gives the next Attack +25%.'])
# ======================= MAGE =======================
X(24, {
 'Falling Star':'Payoff: all mana as one Frost nuke.',
 'Grand Conduit':'Next ability acts as if it cost 100% more: doubles Falling Star.',
 'Arcane Reservoir':'+80 mana past max, no regen for 2 turns.',
 'Glacial Spike':'30 Frost; Freezes a Chilled target.',
 'Presence of Mind':'Replays a Skill.',
 'Ice Block':'Cleanse and debuff immunity during setup.',
 'Overcharge':'+50 mana, skip next regen.',
 'Mana Gem':'Banks 10 mana per turn held.',
 'Shatter':'Cashes Chill in as damage.',
 'Ice Barrier':'Barrier now and next turn.',
 'Chilling Touch':'Chill source (Frostbolt no longer Chills) plus Barrier.',
 'Ice Lance':'Double damage on Chilled targets.',
 'Mana Spring':'+20 mana next turn.',
 'Frost Armor':'Barrier that Chills attackers.'},
 [('By design','Mana burn is the nightmare.'),
  ('Watch','Grand Conduit + Falling Star + Arcane Reservoir can produce a 300+ damage single hit.'),
  ('Open','Frostbolt no longer applies Chill, so Chill now comes only from Chilling Touch, Frost Armor and AoE Frost cards.')],
 ['Should Frostbolt keep a small Chill (e.g. 2) so Heart of Winter has a basic Chill source, or is regen reduction its whole identity?',
  'Does Grand Conduit double a mana-dump card like Falling Star? (Assumed yes.)'],
 cards={'Falling Star':1,'Grand Conduit':1,'Arcane Reservoir':1,'Glacial Spike':1,'Presence of Mind':1,'Ice Block':1,
  'Overcharge':2,'Mana Gem':2,'Shatter':1,'Ice Barrier':1,
  'Chilling Touch':3,'Ice Lance':2,'Mana Spring':2,'Frost Armor':1})
X(26, {
 'Arcane Cascade':'Every card played this turn draws a card.',
 'Quick Study':'Extra draws when you act first.',
 'Arcane Blast':'Grows with every Arcane Skill before it.',
 'Presence of Mind':'Replays Arcane Blast.',
 'Arcane Power':'Crit boost for the chain turn.',
 'Arcane Barrage':'3 hits of Arcane.',
 'Echoing Rune':'Next Arcane Skill has Echo.',
 'Arcane Flow':'Skills cost 5 less this turn.',
 'Torrent':'Draws on the 3rd Skill each turn.',
 'Scry':'Find Arcane Blast.',
 'Spark':'0-cost Arcane: free chain fuel.',
 'Arcane Missiles':'7 damage and steals 3 mana: refuels the chain.',
 'Arcane Bolt':'7 damage and burns 7 mana.',
 'Disenchant':'Clears the Fatigue this deck generates.'},
 [('By design','Races its own Fatigue in long fights.'),
  ('Watch','Arcane Cascade + Spark draws through the whole deck in one turn.'),
  ('Open','Arcane-resistant enemies blunt the entire deck.')],
 ['Should Arcane Cascade stop at the 10-card hand limit, or keep drawing and discard overflow?'])
X(28, {
 'Flashpoint':'Burn ticks twice.',
 'Fan the Flames':'+50% Burn on the target.',
 'Meteor':'AoE damage and Burn.',
 'Pyroblast':'36 Fire plus Burn.',
 'Bombardment':'Living Bomb into every enemy deck.',
 'Presence of Mind':'Replays Pyroblast or Meteor.',
 'Ignite':'9 Burn.',
 'Combust':'Instant Burn tick.',
 'Flamestrike':'AoE Burn.',
 'Arm Living Bomb':'Living Bomb into one enemy deck.',
 'Fire Ward':'Barrier and Fire immunity.',
 'Fireball':'7 damage and 7 Burn: the core card now.',
 'Scorch':'Cheap Burn.',
 'Ember':'Pure Burn.',
 'Flame Wave':'Cheap AoE Burn.'},
 [('By design','Cleanses wipe Burn.'),
  ('By design','Fire-resistant maps hurt.'),
  ('Watch','Fireball at White (7 damage + 7 Burn for 10 mana) is above the White budget; 20 copies is very strong.')],
 ['Is Fireball meant to be this strong at White, or should it be 7 damage + 4 Burn (or move to Green)?'],
 cards={'Flashpoint':1,'Fan the Flames':1,'Meteor':1,'Pyroblast':1,'Bombardment':1,'Presence of Mind':1,
  'Ignite':2,'Combust':1,'Flamestrike':1,'Arm Living Bomb':1,'Fire Ward':1,
  'Fireball':3,'Scorch':2,'Ember':2,'Flame Wave':1})
X(30, {
 'Barrier Burst':'Payoff: spend Barrier as damage.',
 'Mirror Barrier':'Doubles current Barrier.',
 'Prismatic Barrier':'40 Barrier.',
 'Barrier Battery':'Barrier also makes mana each turn.',
 'Elemental Attunement':'Converts incoming damage to your best resistance.',
 'Arcane Mirror':'Reflects a debuff.',
 'Ice Barrier':'Barrier now and next turn.',
 'Mirror Ward':'Barrier with damage back.',
 'Barrier Bolt':'50% of Barrier as damage, kept.',
 'Ward':'Plain Barrier.',
 'Glyph of Warding':'3 Barrier every turn.',
 'Frost Armor':'Barrier that Chills attackers.',
 'Chilling Touch':'Hybrid damage, Chill and Barrier.'},
 [('By design','Poison ignores Barrier; debuffs are the counter.'),
  ('By design','Slow, like Bulwark.')],
 ['Is Barrier Savant meant to be the Mage mirror of Bulwark, or should it lean more on mana (Barrier Battery) to feel different?'])
X(32, {
 'Mana Scorch':'Spend X mana to burn X of theirs.',
 'Entropic Field':'Everyone\'s cards cost 50% more, theirs and yours.',
 'Drain Reserves':'Burn 20, gain 10.',
 'Mana Rend':'Damage plus 15 burn.',
 'Silence':'No Skills or Powers next turn.',
 'Counterspell':'Their next card does nothing.',
 'Mana Drain':'15 burn.',
 'Void Lance':'Payoff: damage scales with their missing mana.',
 'Lay Bare':'Raises their costs.',
 'Hexing Word':'Hex into their deck.',
 'Arcane Bolt':'7 damage and 7 burn: Entropy\'s new backbone.',
 'Frostbolt':'Stacking regen reduction: permanent starvation.',
 'Arcane Missiles':'Steals 3 mana: fuels Mana Scorch.',
 'Ward':'Plain Barrier.'},
 [('By design','Cheap burst ignores mana pressure.'),
  ('Watch','Your new basics give Mage White-rarity mana burn (Arcane Bolt) and regen lock (Frostbolt) usable at 20 copies; Warrior\'s cheapest burn is Blue.'),
  ('Watch','Stacked Frostbolts can drop an enemy to 0 regen; an Entropy mirror could lock both players.')],
 ['Can mana regen be reduced below 0, and does Frostbolt\'s reduction last the whole fight?',
  'Are you OK with Mage owning White-rarity mana burn as a class identity (other classes start at Blue)?'],
 cards={'Mana Scorch':1,'Entropic Field':1,'Drain Reserves':1,'Mana Rend':1,'Silence':1,'Counterspell':1,
  'Mana Drain':2,'Void Lance':2,'Lay Bare':1,'Hexing Word':1,
  'Arcane Bolt':3,'Frostbolt':2,'Arcane Missiles':2,'Ward':1})
X(34, {
 'Rule of Three':'Every third spell deals double damage.',
 'Elemental Memory':'Each spell keeps the previous spell\'s secondary effect.',
 'Pyroblast':'Big Fire step in the rotation.',
 'Glacial Spike':'Big Frost step.',
 'Arcane Blast':'Big Arcane step.',
 'Presence of Mind':'Replays a doubled third spell.',
 'Elemental Focus':'+10 damage when the element changes.',
 'Scry':'Find the missing element.',
 'Arcane Barrage':'Arcane filler.',
 'Chilling Touch':'Frost that Chills, so Glacial Spike can Freeze.',
 'Ignite':'Fire filler.',
 'Arcane Flow':'Skills cost 5 less on the big rotation turn.',
 'Fireball':'7 damage + 7 Burn.',
 'Frostbolt':'7 damage + regen reduction.',
 'Arcane Missiles':'7 damage + 3 mana steal.'},
 [('By design','Discard and exhaust decks break the rotation.'),
  ('Watch','With Elemental Memory, a Frostbolt after a Fireball also applies 7 Burn; your basics make this engine very strong.'),
  ('Open','Fixed: swapped Flash Freeze for Chilling Touch so Glacial Spike can still Freeze.')],
 ['Should Elemental Memory carry over only the secondary effect of the previous spell, or all of them so far this turn?'],
 cards={'Rule of Three':1,'Elemental Memory':1,'Pyroblast':1,'Glacial Spike':1,'Arcane Blast':1,'Presence of Mind':1,
  'Elemental Focus':2,'Scry':1,'Arcane Barrage':1,'Ignite':1,'Arcane Flow':1,
  'Fireball':3,'Frostbolt':2,'Chilling Touch':1,'Arcane Missiles':2})
# ======================= PALADIN =======================
X(36, {
 'Divine Detonation':'Payoff: spend Block as AoE Holy damage.',
 'Consecrated Arms':'All your damage becomes Holy and ignores resistances.',
 'Ardent Defense':'40 Block.',
 'Consecrated Ground':'4 Holy to all enemies every turn.',
 'Blessing of Sacrifice':'Take a hit for an ally.',
 'Hand of Retribution':'Reflects a debuff.',
 'Shield of Righteousness':'50% of Block as Holy, kept.',
 'Divine Storm':'AoE Holy.',
 'Divine Shield':'Block plus blocks a debuff.',
 'Seal of Light':'Lifesteal turn for sustain.',
 'Hammer of Wrath':'Holy execute-style hit.',
 'Righteous Blow':'Hybrid damage and Block.',
 'Raise Shield':'Plain Block.',
 'Sacred Ward':'Plain Barrier (spells build Barrier in this codex).',
 'Steadfast':'3 Block every turn.'},
 [('By design','Poison and block shred are the counters.'),
  ('By design','Needs a one-handed weapon and shield.'),
  ('Open','Fixed: dropped Blessed Weapon, which did nothing next to Consecrated Arms.')],
 ['Does Divine Detonation spend Block only, or Block and Barrier together?'],
 cards={'Divine Detonation':1,'Consecrated Arms':1,'Ardent Defense':1,'Consecrated Ground':1,'Blessing of Sacrifice':1,'Hand of Retribution':1,
  'Shield of Righteousness':2,'Divine Storm':1,'Divine Shield':1,'Seal of Light':1,'Hammer of Wrath':1,
  'Righteous Blow':3,'Raise Shield':2,'Sacred Ward':2,'Steadfast':1})
X(38, {
 'Mass Condemnation':'Spreads all debuffs from one target to every enemy.',
 'Purifying Grace':'Heals 2 HP per debuff stack you cleanse.',
 'Repentance':'Discard plus Condemnation.',
 'Brand of Sin':'Condemnation plus anti-heal.',
 'Hand of Retribution':'Reflects a debuff.',
 'Holy Nova':'AoE damage and party heal.',
 'Condemning Mark':'12 Condemnation.',
 'Purge the Wicked':'Payoff: Holy damage per debuff stack removed from an enemy.',
 'Cleanse':'Removes your or an ally\'s debuffs (not Bleed).',
 'Reproach':'Damage plus a discard.',
 'Condemn':'Holy damage plus Condemnation.',
 'Weakening Light':'Weak.',
 'Mark of Guilt':'Vulnerable (the patched gap).',
 'Purify':'Removes 2 debuffs.'},
 [('By design','Burst decks kill it before the spread-and-purge turn.'),
  ('Watch','Purge the Wicked removes ALL debuffs on a target, including an ally\'s Poison or Bleed, which can hurt co-op partners.'),
  ('Open','Generic cleanses cannot remove Bleed, so Bleed decks are a bad matchup.')],
 ['Should Purge the Wicked only remove debuffs you applied (matching the codex text), so it does not wipe a teammate\'s Poison?'])
X(40, {
 'Twin Verdict':'Next physical Attack hits twice: physical and Holy.',
 'Balanced Guard':'Block boosts your next Barrier by 50%.',
 'Crusader Aura':'+1 Strength or Dexterity every time you alternate.',
 'Divine Favor':'Replays any card.',
 'Avenging Wrath':'Crit boost.',
 'Ardent Defense':'40 Block.',
 'Tempered Zeal':'Block every time you alternate.',
 'Seek Guidance':'Finds the card that keeps the alternation going.',
 'Hammer of Wrath':'Holy hit.',
 'Avenging Strike':'Bonus damage when an ally was hit.',
 'Divine Shield':'Block plus blocks a debuff.',
 'Seal of Light':'Lifesteal turn.',
 'Sword and Board':'Attack that Blocks after a Skill.',
 'Guarded Advance':'Block that grows after an Attack.',
 'Crusader Strike':'Plain Attack.',
 'Sacred Ward':'Plain Barrier.'},
 [('By design','Discard and Silence break the alternation.'),
  ('Open','Fixed: dropped Blessed Weapon, which made Attacks Holy and turned off Twin Verdict\'s physical hit.'),
  ('Open','A bad draw (all Attacks or all Skills) stalls the engine.')],
 ['Does Crusader Aura\'s stat gain last the turn or the whole fight? (Card says this turn.)'],
 cards={'Twin Verdict':1,'Balanced Guard':1,'Crusader Aura':1,'Divine Favor':1,'Avenging Wrath':1,'Ardent Defense':1,
  'Tempered Zeal':1,'Seek Guidance':1,'Hammer of Wrath':1,'Avenging Strike':1,'Divine Shield':1,'Seal of Light':1,
  'Sword and Board':3,'Guarded Advance':3,'Crusader Strike':1,'Sacred Ward':1})
X(42, {
 'Burning Wisdom':'+Intelligence per Burn stack on the target.',
 'Brand the Wicked':'+30% physical damage against Burning targets.',
 'Pyre of Judgment':'AoE Burn plus Holy.',
 'Consecrated Ground':'Holy every turn, which applies Burn through the codex.',
 'Avenging Wrath':'Crit boost.',
 'Divine Favor':'Replays a big Holy spell.',
 'Holy Fire':'Holy plus 6 Burn.',
 'Kindled Faith':'Next Holy hit adds Burn equal to half its damage.',
 'Purging Flame':'Cashes Burn in as Holy.',
 'Avenging Strike':'Physical hit for Brand the Wicked.',
 'Divine Storm':'AoE Holy, AoE Burn.',
 'Searing Light':'Holy plus Burn.',
 'Smite':'Plain Holy (Burns via the codex).',
 'Crusader Strike':'Physical hit that Brand the Wicked boosts.',
 'Consecration':'Cheap AoE Holy.'},
 [('By design','Cleanses wipe Burn.'),
  ('Open','Fixed: added physical Attacks so Brand the Wicked has something to boost (Holy spells Burn, physical hits cash in).'),
  ('Watch','Burning Wisdom has no cap: 30 Burn could mean +10 Intelligence.')],
 ['Should Burning Wisdom be capped (e.g. +10 Intelligence)?'],
 cards={'Burning Wisdom':1,'Brand the Wicked':1,'Pyre of Judgment':1,'Consecrated Ground':1,'Avenging Wrath':1,'Divine Favor':1,
  'Holy Fire':2,'Kindled Faith':1,'Purging Flame':1,'Avenging Strike':1,'Divine Storm':1,
  'Searing Light':3,'Smite':2,'Crusader Strike':2,'Consecration':1})
X(44, {
 'Divine Echo':'10% chance for Attacks to repeat.',
 'Patient Wrath':'+10% on the next Attack for each turn without attacking.',
 'Final Verdict':'Payoff: 4 Holy per Devotion.',
 'Prayer of Healing':'Prayer that heals the party.',
 'Ardent Defense':'40 Block while praying.',
 'Fervent Prayer':'5 Devotion plus Block.',
 'Vigil':'+3 Devotion each turn you skipped Attacks.',
 'Mending Prayer':'Heal plus Devotion.',
 'Patient Faith':'Banks mana while praying.',
 'Divine Shield':'Block plus blocks a debuff (Disarm on the payoff turn is the danger).',
 'Quiet Prayer':'Block plus Devotion.',
 'Morning Prayer':'Free Devotion.',
 'Judgment Hammer':'Backup big hit.',
 'Meditate':'+20 mana next turn.'},
 [('By design','Telegraphed; Pressure punishes long setups.'),
  ('By design','Disarm or Silence on the payoff turn wrecks it.'),
  ('Open','Divine Echo adds little in a deck that plays only 4 Attacks; Silent Judgment may be the better second Gold.')],
 ['Keep Divine Echo here, or should this deck use Silent Judgment instead?',
  'Does Devotion persist between fights? (Assumed no: it is a buff and clears.)'])
X(46, {
 'Grace Eternal':'Every effective heal adds a heal-over-time.',
 'Divine Communion':'Spend all mana to heal the whole party.',
 'Prayer of Healing':'Party heal plus Devotion.',
 'Holy Nova':'AoE damage plus party heal.',
 'Divine Intervention':'Ally cannot drop below 1 HP.',
 'Mass Dispel':'Party-wide cleanse (not Bleed).',
 'Healing Light':'10 HP heal.',
 'Stanch the Wound':'The Bleed-specific cleanse.',
 'Cleanse':'Full cleanse for one ally.',
 'Mending Prayer':'Heal plus Devotion.',
 'Mend Wounds':'Cheap heal.',
 'Soothing Light':'Heal that draws if wasted.',
 'Purify':'Removes 2 debuffs.'},
 [('By design','Anti-heal is the counter.'),
  ('By design','No Block or Barrier at all (codex rule).'),
  ('Open','Weak solo: heals at full HP deal no damage (the Sanctuary deck in the 48-deck file covers solo).')],
 ['When healing an ally, does the codex damage go to the enemy you targeted last, or a chosen enemy?',
  'Does overhealing count as "effective"? (Assumed no.)'])

# ======================= Draft 8 updates from designer notes =======================
def fix(i, old_prefix, new):
    h = E[i]['holes']
    for k,(t,txt) in enumerate(h):
        if txt.startswith(old_prefix): h[k] = new; return
    h.append(new)
# Warrior
E[0]['holes'].append(('By design','Iron Constitution (Green) can make Poison blockable for 2 turns, at the cost of a Green slot; Corrosive Toxin strips it.'))
# Nightstalker
fix(6,'Stealth only stops',('Fixed','Fixed: Fade to Black (Gold) sheds Bleed, Poison and Burn and re-enters Stealth.'))
E[6]['holes'].append(('By design','Every class now has a Revealed card that pulls the Rogue out of Stealth for a turn.'))
E[6]['questions'] = ['Should this deck run Fade to Black over First Blood, or is Fade to Black a PvP tech pick?']
# Venomancer
E[7]['holes'].append(('By design','Block classes can make Poison blockable for 2 turns (Iron Constitution, Purity of Body); Corrosive Toxin strips that buff.'))
E[7]['questions'] = []
# Bloodletter
fix(8,'Generic cleanses',('Fixed','Fixed: every class now has a Green Bleed cleanse (Cauterize, Tourniquet, Cauterizing Flame, Stanch the Wound).'))
fix(8,'Rupture then Exsanguinate',('By design','Rupture, Exsanguinate and a Shadow Echo replay = 20x Bleed in one turn. Kept on purpose: it should be strong when set up.'))
E[8]['questions'] = []
# Ninja
fix(9,'Hand limit',('Fixed','Fixed: cards added to a full hand go to the discard pile; Quartermaster turns each overflow into 3 mana.'))
E[9]['questions'] = ['Should this deck run Quartermaster? It needs a Green slot; Blur is the likely cut.']
# Saboteur
fix(10,'Still low damage',('Fixed','Fixed: Bankrupt (Gold) deals 5 damage per card the target has had exhausted this combat.'))
E[10]['questions'] = ['Bankrupt counts cards the target lost to Exhaust. Did you mean that, or the total cards they have left (fewer cards = more damage)?',
                      'For Cut the Thread, do you pick which of your own cards to exhaust, or is it random?']
# Phantom
fix(11,'The codex says',('Fixed','Fixed: every 20 damage prevented by Dodge gives the next Attack +25% (stacks).'))
E[11]['questions'] = []
# Heart of Winter
fix(12,'Frostbolt no longer',('Fixed','Fixed: Ice Bolt (White) is the new basic Chill spell.'))
E[12]['cards'] = {'Falling Star':1,'Grand Conduit':1,'Arcane Reservoir':1,'Glacial Spike':1,'Presence of Mind':1,'Ice Block':1,
  'Overcharge':2,'Mana Gem':2,'Shatter':1,'Ice Barrier':1,'Ice Bolt':2,'Chilling Touch':1,'Ice Lance':2,'Mana Spring':2,'Frost Armor':1}
E[12]['whys']['Ice Bolt'] = 'The basic Chill spell; sets up Ice Lance, Shatter and Glacial Spike.'
E[12]['questions'] = ['Does Grand Conduit double a mana-dump card like Falling Star? (Assumed yes.)']
# Conflagration
fix(14,'Fireball at White',('Fixed','Fixed: Fireball is now 7 damage + 3 Burn.'))
E[14]['whys']['Fireball'] = '7 damage + 3 Burn: the efficient backbone.'
E[14]['questions'] = []
# Entropy
E[16]['whys']['Arcane Bolt'] = '5 damage and 7 burn: Entropy\'s backbone.'
E[16]['whys']['Frostbolt'] = 'Regen reduction for 2 turns; stacks.'
E[16]['questions'] = ['Can mana regen be reduced below 0? (Assumed it stops at 0.)',
                      'Are you OK with Mage owning White-rarity mana burn as a class identity (other classes start at Blue)?']
E[16]['holes'] = [h for h in E[16]['holes'] if not h[1].startswith('Stacked Frostbolts')] + [('By design','Frostbolt regen reduction now lasts 2 turns, so a lock needs constant reapplication.')]
# Archmage
E[17]['whys']['Fireball'] = '7 damage + 3 Burn.'
E[17]['whys']['Frostbolt'] = '5 damage + regen reduction.'
E[17]['whys']['Arcane Missiles'] = '5 damage + 3 mana steal.'
fix(17,'With Elemental Memory',('Watch','With Elemental Memory, a Frostbolt after a Fireball also applies its Burn; secondary effects stack up fast.'))
# Bastion of Faith
E[18]['whys']['Divine Detonation'] = 'Payoff: spend Block and Barrier as AoE Holy damage.'
E[18]['questions'] = []
# Purifier
fix(19,'Purge the Wicked removes',('By design','Purge the Wicked removes all debuffs on the target, including a teammate\'s Poison or Bleed (designer decision).'))
fix(19,'Generic cleanses cannot',('Fixed','Paladin\'s Bleed cleanse is Stanch the Wound (Green); Light of Dawn (Gold) also removes Bleed.'))
E[19]['questions'] = []
# Righteous Crusader
fix(20,'A bad draw',('Fixed','Fixed: Onward and Raise the Banner dig for the card type you need next.'))
E[20]['cards'] = {'Twin Verdict':1,'Balanced Guard':1,'Crusader Aura':1,'Divine Favor':1,'Avenging Wrath':1,'Ardent Defense':1,
  'Tempered Zeal':1,'Seek Guidance':1,'Hammer of Wrath':1,'Avenging Strike':1,'Divine Shield':1,'Seal of Light':1,
  'Sword and Board':3,'Guarded Advance':2,'Onward':1,'Raise the Banner':2}
E[20]['whys']['Onward'] = 'Attack that digs for a Skill, keeping the alternation going.'
E[20]['whys']['Raise the Banner'] = 'Block and Barrier that digs for an Attack.'
# Equilibrium
fix(23,'Weak solo',('Fixed','Improved: Penance (White, 0) and Sacrificial Light give solo Equilibrium HP to heal back for damage.'))
