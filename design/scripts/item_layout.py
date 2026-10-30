# Item layout draft 1: every base, its implicits, and stat weights (chance of each affix roll).
STATS = ['Stamina','Strength','Intelligence','Dexterity','Spirit','Initiative','Crit Chance','Crit Damage','Resistance','Elemental/Holy Damage',
 'Max Mana','Mana Regen','Health Regen','Recovery','Thorns','Luck','Multi-hit Chance','Multiplay Chance','Multicast Chance','Bleed Chance',
 'Party Recovery','Lifesteal','Defense Gain','All Resistances','Efficiency']
NEW_STATS = [  # proposed definitions for the new weapon stats
 ('Multi-hit Chance','%','Chance an Attack hits one extra time (1H Sword).'),
 ('Multiplay Chance','%','Chance a card you play is played again for free (2H Sword).'),
 ('Multicast Chance','%','Chance a Spell is cast again for free (Air Staff).'),
 ('Bleed Chance','%','Chance each Attack hit applies Bleed (1H Axe).'),
 ('Party Recovery','','Every ally (you included) recovers this much HP each turn (Nature Staff). Recovery = HP each turn; Health Regen = HP after each fight.'),
 ('Lifesteal','%','Heal for this % of the damage you deal (Shadow Staff).'),
 ('Defense Gain','%','Increases all Block, Parry, Dodge and Barrier you gain (Tower Shield, proposed).'),
]
WEAPON_ONLY = ['Multi-hit Chance','Multiplay Chance','Multicast Chance','Bleed Chance','Party Recovery','Lifesteal']
RES_CHANCE = 0.12   # Resistance has the same chance per draw on every item
TWO_HAND_STATS = 1.8   # 2H weapons roll 1.8x values and count as both hand slots in gear score
# Armor type modifiers (x weight). Missing = x1.
TYPES = {
 'Plate':   {'Dexterity':2,'Stamina':2,'Thorns':2,'Health Regen':1.5,'Crit Chance':0.5,'Crit Damage':0.5,'Intelligence':0.25,'Spirit':0.25,'Max Mana':0.25,'Mana Regen':0.25},
 'Leather': {'Strength':2,'Crit Chance':2,'Crit Damage':2,'Initiative':1.5,'Thorns':0.5,'Intelligence':0.5,'Spirit':0.5,'Max Mana':0.5,'Mana Regen':0.5},
 'Cloth':   {'Intelligence':2,'Spirit':2,'Max Mana':2,'Mana Regen':2,'Strength':0.25,'Dexterity':0.5,'Stamina':0.5,'Thorns':0.25},
 'None':    {},
}
# Slot base weights (before armor type). 0 / missing = cannot roll. Scale: 1 rare, 3 low, 6 normal, 10 high.
SLOTW = {
 'Helm':    {'Stamina':6,'Strength':3,'Intelligence':6,'Dexterity':3,'Spirit':6,'Crit Damage':3,'Resistance':6,'Max Mana':5,'Luck':3},
 'Chest':   {'Stamina':8,'Strength':4,'Intelligence':4,'Dexterity':6,'Spirit':4,'Crit Chance':4,'Crit Damage':3,'Resistance':8,'Max Mana':3,'Health Regen':4,'Recovery':3,'Thorns':4},
 'Bracers': {'Stamina':2,'Strength':3,'Intelligence':3,'Dexterity':3,'Spirit':2,'Crit Chance':10,'Crit Damage':10,'Resistance':3,'Thorns':4},
 'Gloves':  {'Stamina':2,'Strength':3,'Intelligence':3,'Dexterity':2,'Crit Chance':12,'Crit Damage':12,'Elemental/Holy Damage':4,'Luck':3},
 'Belt':    {'Stamina':8,'Strength':5,'Intelligence':3,'Dexterity':5,'Spirit':3,'Resistance':5,'Health Regen':8,'Recovery':6},
 'Pants':   {'Stamina':8,'Strength':5,'Intelligence':5,'Dexterity':6,'Spirit':3,'Crit Chance':2,'Resistance':6,'Health Regen':4},
 'Boots':   {'Stamina':6,'Strength':3,'Intelligence':3,'Dexterity':6,'Spirit':2,'Initiative':8,'Resistance':6,'Health Regen':2,'Luck':2},
 'Cloak':   {'Stamina':5,'Strength':2,'Intelligence':2,'Dexterity':3,'Spirit':4,'Initiative':6,'Resistance':8,'Max Mana':6,'Mana Regen':5,'Luck':4},
 'Ring':    {'Stamina':4,'Strength':5,'Intelligence':5,'Dexterity':4,'Spirit':4,'Initiative':5,'Crit Chance':4,'Crit Damage':3,'Resistance':4,'Elemental/Holy Damage':4,'Max Mana':5,'Mana Regen':4,'Luck':8,'Efficiency':2},
 'Amulet':  {'Stamina':3,'Strength':5,'Intelligence':5,'Dexterity':3,'Spirit':5,'Crit Chance':4,'Crit Damage':4,'Elemental/Holy Damage':6,'Luck':5,'Efficiency':2},
 'Codex':   {'Stamina':6,'Strength':5,'Intelligence':5,'Dexterity':5,'Spirit':5,'Max Mana':4,'Recovery':4,'All Resistances':6,'Efficiency':2},
 'Kite Shield':  {'Stamina':5,'Strength':5,'Dexterity':8,'Crit Chance':3,'Crit Damage':3,'Health Regen':2,'Thorns':10},
 'Tower Shield': {'Stamina':8,'Strength':2,'Dexterity':10,'Health Regen':4,'Thorns':6,'Defense Gain':6},
 'Focus':        {'Stamina':3,'Intelligence':6,'Dexterity':10,'Spirit':5,'Elemental/Holy Damage':4,'Max Mana':4,'Mana Regen':3},
}
STR_W = {'Strength':10,'Crit Chance':5,'Crit Damage':5,'Elemental/Holy Damage':4,'Dexterity':2,'Stamina':2,'Luck':2,'Efficiency':2,'Intelligence':1,'Spirit':1}
INT_W = {'Intelligence':10,'Elemental/Holy Damage':8,'Crit Chance':4,'Crit Damage':4,'Spirit':4,'Max Mana':3,'Mana Regen':3,'Luck':2,'Efficiency':2,'Strength':1}
HYB_W = {'Strength':6,'Intelligence':6,'Spirit':5,'Elemental/Holy Damage':8,'Crit Chance':3,'Crit Damage':3,'Stamina':2,'Luck':2,'Efficiency':2}
# weapons: name, hands, family weights, signature stat (2nd implicit + weight 8 as an affix), status
WEAPONS = [
 ('1H Axe','1H',STR_W,'Bleed Chance','yours'),('1H Sword','1H',STR_W,'Multi-hit Chance','yours'),('Dagger','1H',STR_W,'Crit Damage','yours'),
 ('1H Mace','1H',HYB_W,'Elemental/Holy Damage','yours (Paladin, Holy)'),('Wand','1H',INT_W,'Elemental/Holy Damage','proposed (caster 1H)'),
 ('2H Axe','2H',STR_W,'Crit Chance','yours'),('2H Sword','2H',STR_W,'Multiplay Chance','yours'),('2H Maul','2H',STR_W,'Crit Damage','yours'),
 ('Arcane Staff','2H',INT_W,'Multicast Chance','yours'),('Fire Staff','2H',INT_W,'Crit Damage','yours'),('Frost Staff','2H',INT_W,'Mana Regen','yours'),
 ('Nature Staff','2H',INT_W,'Party Recovery','yours'),('Shadow Staff','2H',INT_W,'Lifesteal','yours'),
 ('2H Warhammer','2H',HYB_W,'Elemental/Holy Damage','yours (Paladin, Holy)'),
]
for n,h,fam,sig,_ in WEAPONS:
    w=dict(fam); w[sig]=max(w.get(sig,0),8); SLOTW[n]=w
ARMOR_NAMES = {
 'Helm':('Greathelm','Leather Cap','Cloth Hood'),'Chest':('Cuirass','Jerkin','Robe'),'Bracers':('Vambraces','Leather Bracers','Wraps'),
 'Gloves':('Gauntlets','Leather Gloves','Handwraps'),'Belt':('Girdle','Leather Belt','Sash'),'Pants':('Greaves','Breeches','Leggings'),
 'Boots':('Sabatons','Leather Boots','Slippers'),
}
BASES = []  # name, slot, type, hands, implicit 1, implicit 2, notes
for slot,(p,l,c) in ARMOR_NAMES.items():
    for nm,t in ((p,'Plate'),(l,'Leather'),(c,'Cloth')):
        BASES.append((nm,slot,t,'','Map resistance','Initiative' if slot=='Boots' else '',''))
BASES += [('Cloak','Cloak','None','','Map resistance','','No armor type'),('Ring','Ring','None','','Map resistance','','Flexible slot'),
 ('Amulet','Amulet','None','','Map resistance','Draw / regen pool','Pool: White 6, Green 7, Blue 8, Purple 9'),
 ('Codex','Codex','None','','Map resistance','','Only source of All Resistances'),
 ('Kite Shield','Kite Shield','None','Off-hand','Map resistance','Thorns','Aggressive shield (proposed implicit)'),
 ('Tower Shield','Tower Shield','None','Off-hand','Map resistance','Defense Gain','Defensive shield: more Block from every card'),
 ('Focus','Focus','None','Off-hand','Map resistance','Elemental damage (one element)','Caster off-hand: implicit rolls one element (Fire, Frost, Nature, Arcane, Shadow or Holy)')]
for n,h,fam,sig,st in WEAPONS:
    hands='1H (main or off-hand)' if h=='1H' else '2H (both hands)'
    note=st if h=='1H' else st+'; stats x1.8, counts as both hand slots in gear score'
    BASES.append((n,n,'None',hands,'Map resistance',sig,note))
