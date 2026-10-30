# Cards added after deck testing found unintended holes, plus renames to avoid clashing with keyword names.
RENAMES = {
    ('Mage', 'Living Bomb'): 'Arm Living Bomb',   # card name clashed with the Living Bomb status card
    ('Mage', 'Hex'): 'Hexing Word',               # clashed with the Hex status card
    ('Mage', 'Slow'): 'Temporal Drag',            # clashed with the Slow keyword
    ('Mage', 'Exposure'): 'Lay Bare',             # clashed with the Exposure keyword
}
T = 'Added after deck testing: '
PATCHES = {
 'Rogue': [
  ('Kick While Down','Green','Attack','Single Enemy','Shadow',10,'No','No','Saboteur','Damage; Discard',
   "Deal [X] damage, plus [Y] for each card the target discarded or exhausted this round.",[('[X]','Damage',4),('[Y]','Damage per card',5)],
   T+'Saboteur had no damage payoff for its disruption, so its decks could not close fights.'),
 ],
 'Mage': [
  ('Void Lance','Green','Skill','Single Enemy','Arcane',20,'No','No','Entropy','Damage; Mana Burn',
   "Deal [X] Arcane damage, plus 1 for every [Y] mana the target is missing from its maximum.",[('[X]','Damage',10),('[Y]','Missing mana per bonus',2)],
   T+'Entropy decks drained mana but had no way to turn that into a win.'),
  ('Arcane Overflow','Blue','Skill','All Enemies','Arcane',0,'No','No','Barrier Savant; Heart of Winter','Damage; AoE; Mana',
   "Spend all your mana. Deal Arcane damage equal to [X]% of the mana spent to all enemies.",[('[X]','Mana as damage (%)',50)],
   T+'Mana Shell and banking decks had no mana payoff below Gold except Falling Star.'),
 ],
 'Paladin': [
  ('Mark of Guilt','White','Skill','Single Enemy','Holy',10,'No','No','Purifier','Vulnerability; Damage',
   "Deal [X] Holy damage and apply [Y] Vulnerable.",[('[X]','Damage',3),('[Y]','Vulnerable',10)],
   T+'Purifier wants many different debuffs on a target, but Paladin had no Vulnerable source.'),
  ('Sacrificial Light','Green','Skill','Self','None',10,'No','No','Equilibrium','Self-harm; Healing',
   "Lose [X] HP. Your next heal this turn is doubled.",[('[X]','HP lost',10)],
   T+'Solo Equilibrium could not deal damage at full HP because healing needs missing HP to be effective.'),
 ],
}
