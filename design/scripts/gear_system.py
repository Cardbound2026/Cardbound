# Gear system first pass.
# Item level (ilvl) = total "points" rolled on the item (implicit + affixes).
# Every affix is balanced to 10 points max on a White item at map +0; the implicit to 5.
# Ranges scale with rarity (multiplier) and map level (x 1.2 per level), floor and ceiling together.
RARITY = [  # name, affixes, roll multiplier
 ('White', 1, 1.0), ('Green', 2, 1.1), ('Blue', 3, 1.2), ('Purple (Epic)', 4, 1.3),
]
LEVEL_STEP = 1.2   # every roll range grows x1.2 per map level (geometric), matching enemies at x1.5 HP / x1.3 damage per level
ENEMY_HP_GROWTH = 1.5
ENEMY_DMG_GROWTH = 1.3
# stat, unit, points per unit, min at +0 White, max at +0 White, slots (Any = every slot)
STATS = [  # stat, unit, points per unit, min and max at +0 White, where (filled from the item layout)
 ('Map resistance (implicit)','%',1,1,5,'Implicit on every item: Fire Resistance on the Physical map'),
 ('Stamina','',1,2,10,''),('Strength','',2,1,5,''),('Intelligence','',2,1,5,''),('Dexterity','',2,1,5,''),('Spirit','',2,1,5,''),
 ('Initiative','',2,1,5,''),('Crit Chance','%',2,1,5,''),('Crit Damage','%',0.5,4,20,''),('Resistance','%',1,2,10,''),
 ('Elemental/Holy Damage','%',1,2,10,''),('Max Mana','',0.4,5,25,''),('Mana Regen','',1,2,10,''),('Health Regen','',1,2,10,''),
 ('Recovery','',1,2,10,''),('Thorns','',3,1,3,'Small on purpose: hits every time you are struck'),('Luck','',2,1,5,''),
 ('Multi-hit Chance','%',2,1,5,''),('Multiplay Chance','%',2,1,5,''),('Multicast Chance','%',2,1,5,''),('Bleed Chance','%',2,1,5,''),
 ('Party Recovery','',2,1,5,''),('Lifesteal','%',2,1,5,''),('Defense Gain','%',1,2,10,''),('All Resistances','%',3,1,3,''),
 ('Efficiency','%',2,1,5,'Purple only'),
]
# Gear drop rolls per kill and chance per roll (each roll is independent; multiple items can drop)
DROPS = [  # enemy group, rolls per kill, White, Green, Blue, Purple  (Oct 30: Green and Blue raised about 1.5x)
 ('Tier 1 regular',2,30,3,0,0),
 ('Tier 2 regular',2,40,7.5,0.75,0),
 ('Tier 3 regular',2,60,8,1.5,0),
 ('Elite',3,70,22,6,0.5),
 ('Boss',5,60,35,12,2),
]
# Map 1 item bases: name, archetype (a base in item_layout.py), label, notes. All carry the Fire Resistance implicit on this map.
# Every map drops all 21 armor archetypes, Cloak, Ring, Amulet, the 3 off-hands, the 1H weapons and the 2H axe/sword/maul/warhammer.
# Staves follow the resistance ladder: each map drops the staff of the next map's element (Map 1 Physical -> Fire Staff).
# Codexes drop only from bosses (card-side loot), so they are not in these pools.
BASES = [
 ('Warband Helm','Greathelm','Plate Helm',''),('Iron Cuirass','Cuirass','Plate Chest',''),('Iron Bracers','Vambraces','Plate Bracers',''),
 ('Iron Gauntlets','Gauntlets','Plate Gloves',''),('War Girdle','Girdle','Plate Belt',''),('Legguards','Greaves','Plate Pants',''),('Iron Sabatons','Sabatons','Plate Boots',''),
 ("Scout's Cap",'Leather Cap','Leather Helm',''),('Brigandine','Jerkin','Leather Chest','The triple-crit chase chest'),("Archer's Bracers",'Leather Bracers','Leather Bracers',''),
 ('Leather Gauntlets','Leather Gloves','Leather Gloves',''),('War Belt','Leather Belt','Leather Belt',''),('Riding Breeches','Breeches','Leather Pants',''),('March Boots','Leather Boots','Leather Boots',''),
 ('Hedge-Mage Hood','Cloth Hood','Cloth Helm',''),('Camp Robe','Robe','Cloth Chest',''),('Linen Wraps','Wraps','Cloth Bracers',''),
 ("Scribe's Handwraps",'Handwraps','Cloth Gloves',''),("Officer's Sash",'Sash','Cloth Belt',''),('Quilted Leggings','Leggings','Cloth Pants',''),('Pilgrim Slippers','Slippers','Cloth Boots',''),
 ('Campaign Cloak','Cloak','Cloak',''),('Ember-Warded Ring','Ring','Ring',''),("Soldier's Signet",'Ring','Ring','Second ring name, same odds'),("Soldier's Pendant",'Amulet','Amulet','Draw / regen pool'),
 ('Kite Shield','Kite Shield','Kite Shield, off-hand',''),('Pavise','Tower Shield','Tower Shield, off-hand',''),('Battle Focus','Focus','Focus, off-hand',''),
 ('Hatchet','1H Axe','1H Axe',''),('Arming Sword','1H Sword','1H Sword',''),('Dirk','Dagger','Dagger',''),('Flanged Mace','1H Mace','1H Mace',''),('Ashwood Wand','Wand','Wand',''),
 ('Bearded Greataxe','2H Axe','2H Axe',''),('Zweihander','2H Sword','2H Sword',''),('War Maul','2H Maul','2H Maul',''),('Siege Hammer','2H Warhammer','2H Warhammer',''),
 ('Cinder Quarterstaff','Fire Staff','Fire Staff','Next map\'s staff (Fire)'),
]
POOLS = {
 'Deserter':['Arming Sword','Riding Breeches','March Boots','Campaign Cloak',"Soldier's Signet",'Hatchet'],
 'Scrap Hound':['Leather Gauntlets','Ember-Warded Ring','War Belt','Linen Wraps','Pilgrim Slippers','Dirk'],
 'Shield Recruit':['Kite Shield','Iron Bracers','Warband Helm','Iron Sabatons','Legguards','Pavise'],
 'Bristleback Boar':['Brigandine','War Belt','March Boots','Quilted Leggings','Hatchet','Iron Gauntlets'],
 'Camp Thief':['Dirk',"Soldier's Signet",'Leather Gauntlets',"Scout's Cap","Scribe's Handwraps","Archer's Bracers"],
 'Bandit Cutthroat':['Dirk','Campaign Cloak','Ember-Warded Ring','Riding Breeches',"Archer's Bracers",'Bearded Greataxe'],
 'Iron Sentry':['Iron Cuirass','Kite Shield','Iron Bracers','War Girdle','Iron Sabatons','Flanged Mace'],
 'Mercenary Sergeant':['Warband Helm',"Soldier's Pendant",'Arming Sword',"Officer's Sash",'Zweihander','Iron Gauntlets'],
 'Dire Wolf':['Campaign Cloak','Quilted Leggings','Ember-Warded Ring',"Scout's Cap",'Pilgrim Slippers','Camp Robe'],
 'Cave Bear':['War Maul','Brigandine','War Belt','Hedge-Mage Hood','Linen Wraps','Bearded Greataxe'],
 'Siegebreaker Ogre':['War Maul','Siege Hammer','Legguards','Iron Cuirass','Leather Gauntlets','Riding Breeches'],
 'Warforged Bulwark':['Pavise','Battle Focus','Iron Bracers','War Girdle','Iron Sabatons','Ashwood Wand'],
 'Pit Duelist':['Arming Sword',"Soldier's Signet",'March Boots','Zweihander',"Scout's Cap","Archer's Bracers"],
 'Werewolf Marauder':['Cinder Quarterstaff','Camp Robe',"Soldier's Pendant",'Bearded Greataxe','Hedge-Mage Hood',"Scribe's Handwraps"],
 'Fallen Knight':['Warband Helm','Battle Focus','Cinder Quarterstaff','Flanged Mace','Siege Hammer',"Officer's Sash"],
 'Gravel King':['Warband Helm','Ember-Warded Ring','War Maul',"Soldier's Pendant",'Iron Cuirass','Pavise','Siege Hammer','Quilted Leggings'],
 'Sergeant Ironjaw':['Campaign Cloak','Kite Shield','Iron Bracers','Legguards','Zweihander',"Officer's Sash",'Iron Gauntlets','Linen Wraps'],
 'Clockwork Juggernaut':['Brigandine','Battle Focus','Cinder Quarterstaff','Leather Gauntlets','Ashwood Wand','War Girdle','Iron Sabatons','Pilgrim Slippers'],
 'The Twin Blades':['Dirk','Arming Sword',"Soldier's Signet",'March Boots','Hatchet',"Archer's Bracers",'Riding Breeches','Flanged Mace'],
 'Pit Champion':['War Belt','Warband Helm','Bearded Greataxe','Ember-Warded Ring','Flanged Mace',"Scout's Cap",'Quilted Leggings','Legguards'],
 'The Quartermaster':["Soldier's Pendant",'Campaign Cloak','Battle Focus','Camp Robe','Linen Wraps','Pilgrim Slippers','Ashwood Wand','Hedge-Mage Hood'],
 'Warlord Gorrath, the Iron Tide':['Ember-Warded Ring','Brigandine','Kite Shield','Arming Sword','War Maul','Camp Robe','Cinder Quarterstaff','Iron Cuirass',"Scribe's Handwraps","Soldier's Pendant"],
}
# Which stats roll on which items now lives in item_layout.py (weights per base).
DECK_SCORE = {'White':15,'Green':28,'Blue':42,'Gold':59}
DECK_RANK_STEP = 1.9/3   # rank 10 lines up with the top map level (+19)
DECK_CORE = 20   # deck level counts the deck's 20 best cards (all of them if the deck is smaller)

PURPLE_RULE = 'Purple (Epic) items drop only from elites and bosses.'
# Amulet draw / regen point pool by rarity (1 point = 1 card drawn or 10 mana regen). Not counted in ilvl.
AMULET_POOL = [('No amulet',1,'1 draw, 10 regen baseline'),('White',6,'basic amulet: 4 draw / 20 regen'),('Green',7,''),('Blue',8,''),('Purple (Epic)',9,'e.g. 5 draw / 40 regen or 6 draw / 30 regen')]

MAX_MAP_LEVEL = 19   # item level 100 = perfect Purple from this map level
