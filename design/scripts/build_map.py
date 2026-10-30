import openpyxl, sys, runpy, collections
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
db, mp, out = sys.argv[1], sys.argv[2], sys.argv[3]
M = runpy.run_path(mp); MAP, EN = M['MAP'], M['ENEMIES']
import os
GS = runpy.run_path(os.path.join(os.path.dirname(mp),'gear_system.py')); POOLS, DROPS = GS['POOLS'], GS['DROPS']
BASESLOT = {b[0]:b[2] for b in GS['BASES']}
ws = openpyxl.load_workbook(db, data_only=True)['Card Database']
cards=[]
for r in range(6, ws.max_row+1):
    if ws.cell(r,1).value:
        pv=ws.cell(r,50).value or ''
        cards.append(dict(id=ws.cell(r,1).value,name=ws.cell(r,2).value,cls=ws.cell(r,4).value,rar=ws.cell(r,5).value,dt=ws.cell(r,8).value,syn=ws.cell(r,14).value or '',text=pv.split(' | ',1)[1] if ' | ' in pv else ''))
byname={(c['cls'],c['name']):c for c in cards}
errs=[]
# ---- validate decks
for e in EN:
    n=sum(k for nm,k,_c,_k,_f in e['deck'] if not nm.startswith('PHASE 2'))
    want={'Elite':15,'Boss':20}.get(e['role'],10)
    if n!=want: errs.append(f"{e['name']}: deck {n} != {want}")
    for cls,g in e.get('golds',{}).items():
        c=byname.get((cls,g))
        if not c or c['rar']!='Gold': errs.append(f"{e['name']}: bad gold {cls} {g}")
# ---- pick W/G/B cards per class for the 9 regular enemies
regs=[e for e in EN if e['role']=='Regular']
pick={}
for cls,cx in MAP['boss_codexes'].items():
    def score(c): return (3 if cx in c['syn'] else 0)+(1 if c['dt']=='Physical' else 0)+(0.5 if 'Any' in c['syn'] else 0)
    pool=lambda rar: sorted([c for c in cards if c['cls']==cls and c['rar']==rar], key=lambda c:(-score(c),c['id']))
    pick[cls]=dict(White=pool('White')[:9], Green=pool('Green')[:7], Blue=pool('Blue')[:5])
# card slots: tier 1 mobs White 0-4; tier 2 mobs White 5-6 then Green 0-2; tier 3 mobs Green 3-4 then Blue 0-2;
# elites: early White 7-8, mid Green 5-6, late Blue 3-4
def reg_card(cls,i):
    W,G,B=pick[cls]['White'],pick[cls]['Green'],pick[cls]['Blue']
    return (W[0:5]+W[5:7]+G[0:3]+G[3:5]+B[0:3])[i]
def elite_card(cls,j):
    W,G,B=pick[cls]['White'],pick[cls]['Green'],pick[cls]['Blue']
    return [W[7],W[8],G[5],G[6],B[3],B[4]][j]
GEAR={
 'Bristleback Boar':[('Boar-Hide Boots','Boots','+3 Stamina',3),('Tusk Ring','Ring','+1 Strength, +1% Critical Chance',1.5)],
 'Camp Thief':[("Thief's Gloves",'Gloves','+2 Luck',3),('Lockpick Amulet','Amulet','Point pool 5 (draw / regen)',1.5)],
 'Dire Wolf':[('Wolf-Pelt Cloak','Cloak','+2 Initiative',3),('Fang Ring','Ring','+2 Strength',1.5)],
 'Cave Bear':[('Bearskin Chest','Chest','+5 Stamina',2),('Clawed Bracers','Bracers','+2 Strength, +1 Dexterity',1.5)],
 'Werewolf Marauder':[('Moonhide Pants','Pants','+3 Dexterity, +2 Initiative',2),('Feral Ring','Ring','+2 Strength, +2% Critical Chance',1)],
 'Fallen Knight':[("Knight's Greathelm",'Helm','+5 Stamina, +2 Dexterity',2),('Oathbreaker Blade','Weapon','+3 Strength',1.5)],
 'Deserter':[("Deserter's Boots",'Boots','+2 Initiative',3),('Tarnished Ring','Ring','+2 Strength',1.5)],
 'Scrap Hound':[('Hound-Tooth Amulet','Amulet','Point pool 4 (draw / regen)',2),('Chewed Gloves','Gloves','+1% Critical Chance',3)],
 'Shield Recruit':[("Recruit's Bracers",'Bracers','+2 Dexterity',3),('Conscript Helm','Helm','+3 Stamina',2)],
 'Bandit Cutthroat':[("Cutthroat's Cloak",'Cloak','+10 Max Mana',2),('Bandit Belt','Belt','+2 Strength',3)],
 'Iron Sentry':[('Gate Plate','Chest','+4 Stamina',2),('Sentry Core Ring','Ring','+10 Max Mana',1)],
 'Mercenary Sergeant':[("Sergeant's Legguards",'Pants','+2 Dexterity',3),('Command Amulet','Amulet','Point pool 6 (draw / regen)',1)],
 'Siegebreaker Ogre':[('Ogre Knuckles','Gloves','+3 Strength',2),('Ram-Hide Belt','Belt','+5 Stamina',2)],
 'Warforged Bulwark':[('Warforged Shield','Off-hand','+3 Dexterity',2),('Plated Boots','Boots','+4 Stamina',2)],
 'Pit Duelist':[("Duelist's Blade",'Weapon','+2% Critical Chance',2),('Arena Bracers','Bracers','+2 Strength, +1 Initiative',1.5)],
 'Gravel King':[('Gravel Crown','Helm','+3 Strength, +3 Stamina',3),("King's Ransom Ring",'Ring','+3 Luck',2)],
 'Sergeant Ironjaw':[("Ironjaw's Pauldron Cloak",'Cloak','+3 Dexterity, +10 Max Mana',3),('Drill Whistle Amulet','Amulet','Point pool 7 (draw / regen)',2)],
 'Clockwork Juggernaut':[('Mainspring Chest','Chest','+6 Stamina',3),('Cog Ring','Ring','+15 Max Mana',2)],
 'The Twin Blades':[('Sisters\' Twin Daggers','Weapon','+3% Critical Chance',3),('Mirrored Gloves','Gloves','+2 Strength, +2 Dexterity',2)],
 'Pit Champion':[("Champion's Belt",'Belt','+3 Strength, +3 Stamina',3),('Laurel Helm','Helm','+3 Initiative',2)],
 'The Quartermaster':[('Ledger Codex Satchel','Belt','+3 Luck',3),('Requisition Ring','Ring','+5 Mana Regeneration',2)],
 'Warlord Gorrath, the Iron Tide':[('Iron Tide Greaves','Pants','+5 Stamina, +3 Dexterity',4),("Warlord's Seal",'Ring','+4 Strength',2)],
}
TYPE={ # name: (creature, type, weak to). ~90% Physical type on the Physical map; weaknesses vary so different builds shine
 'Deserter':('Human','Physical','Arcane'), 'Scrap Hound':('Beast','Physical','Fire'), 'Shield Recruit':('Human','Physical','Arcane'),
 'Bristleback Boar':('Beast','Physical','Fire'), 'Camp Thief':('Human','Physical','Arcane'),
 'Bandit Cutthroat':('Human','Physical','Arcane'), 'Iron Sentry':('Construct','Physical','Frost'), 'Mercenary Sergeant':('Human','Physical','Arcane'),
 'Dire Wolf':('Beast','Physical','Fire'), 'Cave Bear':('Beast','Physical','Fire'),
 'Siegebreaker Ogre':('Giant','Physical','Nature'), 'Warforged Bulwark':('Construct','Physical','Frost'), 'Pit Duelist':('Human','Physical','Arcane'),
 'Werewolf Marauder':('Cursed beast','Nature','Fire'), 'Fallen Knight':('Oathbroken','Shadow','Arcane'),
 'Gravel King':('Human','Physical','Arcane'), 'Sergeant Ironjaw':('Human','Physical','Arcane'), 'Clockwork Juggernaut':('Construct','Physical','Frost'),
 'The Twin Blades':('Human','Physical','Arcane'), 'Pit Champion':('Human','Physical','Arcane'), 'The Quartermaster':('Human','Physical','Arcane'),
 'Warlord Gorrath, the Iron Tide':('Human','Physical','Arcane'),
}
DMG={ # the few non-Physical enemy attacks on the Physical map (target ~90% Physical)
 ('Fallen Knight','Shadow Slash'):'Shadow',
 ('Werewolf Marauder','Blood Hunger'):'Shadow',
 ('Clockwork Juggernaut','Steam Burst'):'Fire', ('Clockwork Juggernaut','Overload'):'Arcane',
 ('The Quartermaster','Bill of Charges'):'Arcane',
}
def dtype(e,nm,kind): return DMG.get((e['name'],nm), 'Physical' if kind=='Attack' else '-')
GOLD_COINS={1:'5-10',2:'10-20',3:'20-35','Elite':'60-100','Boss':'250-400'}
F='Arial'; hdr=Font(name=F,bold=True,color='FFFFFF',size=10); body=Font(name=F,size=10); wrap=Alignment(wrap_text=True,vertical='top')
TF={1:'ECFDF5',2:'FEF9C3',3:'FFEDD5','Elite':'F3E8FF','Boss':'FEE2E2'}
LIGHT={'Warrior':'FDECEA','Rogue':'EAF5EA','Mage':'E8F0FD','Paladin':'FDF6E3'}
wb=openpyxl.Workbook()
def head(sh,row,cols,color='1F2937'):
    for j,h in enumerate(cols,start=1):
        c=sh.cell(row,j,h); c.font=hdr; c.fill=PatternFill('solid',fgColor=color); c.alignment=Alignment(wrap_text=True,vertical='center')
def widths(sh,ws_): 
    for j,w in enumerate(ws_,start=1): sh.column_dimensions[openpyxl.utils.get_column_letter(j)].width=w
# ---- Overview
ov=wb.active; ov.title='Overview'
lines=[(f"Map 1: {MAP['name']} (Physical)",'t'),(MAP['theme'],'i'),('',None),
('How many unique enemies a map needs','h'),
('22 per map: 15 regular enemies (5 per tier), 6 elites and 1 boss.',None),
('A run is about 14 rows (12-15 nodes from start to boss). A typical path: 8-10 regular fights, 2-3 elites, 2 rest sites, the rest shrines and merchants. The full grid holds 2-8 rest sites.',None),
('Why 6 elites: each drops 1 Gold per class = 24 Golds per map, so 6 maps cover all 139 Golds. Every regular drops 1 card per class and every elite 1 extra card per class: 21 cards per class per map, enough for 6 maps to cover all 439 White, Green and Blue cards. Every enemy is worth farming for every class.',None),
('Tiers follow the map rows: Tier 1 on rows 1-4 is small fry (boars, thieves, deserters, hounds, recruits) with plain attacks and Block; Tier 2 on rows 5-9 is beasts and soldiers (wolves, bears, cutthroats, sentries, sergeants) adding Bleed, Weak, Vulnerable, Slow and team buffs; Tier 3 on rows 10-14 is monsters and champions (werewolves, fallen knights, ogres, warforged, duelists) adding Stun, Dazed, block shred, Disarm, Thorns and lifesteal. Elites appear in their listed rows; the boss is row 15.',None),
('Styles: Balanced 5 attacks / 5 defenses, Aggressive 8 / 2, Defensive 2 / 8 (10-card decks). Elites have 15 cards, the boss 20 plus a phase-2 shuffle.',None),
('',None),('Map rules used here (proposals marked)','h'),
('Party scaling: one enemy per player at regular and elite nodes. Bosses stay single: HP x1 / x2.2 / x3.3 / x4.4 for 1-4 players (more than linear, because groups have more crowd control), and boss damage +20% per extra player.',None),
('Enemy turns: Tier 1 draws 2, later enemies draw 3; enemies pay mana like players. All enemy cards in hand are shown as intents.',None),
('Map levels (+1, +2, ...): enemy HP x1.5 and damage x1.3 per level, compounding; gear rolls x1.2 per level. Higher levels can drop cards already upgraded.',None),
('Prototype tuning (v1.2): all damage and HP here are x2 damage and x1.5 HP of the first draft; regulars regenerate enough mana to play their whole hand; enemy Block resets at the start of each enemy turn.',None),
('Player baseline: 100 HP for every class (decided); Stamina adds HP on top. Enemy numbers here were first drafted against 80 HP, so early fights will feel slightly easier until balancing.',None),
('Map element (decided): about 90% of enemy attack cards deal Physical and about 90% of enemies are Physical type (they resist Physical). Weaknesses vary: humans to Arcane, beasts to Fire, constructs to Frost, giants to Nature. Type resistance is 5% on the base map, +5% per map level, up to 100% at +19; damage type is set per enemy card.',None),
('Off-element threats (visible through the fog, so you can route around them): Fallen Knight\'s Shadow Slash (34 Shadow, one copy), Werewolf Marauder\'s Shadow lifesteal, Clockwork Juggernaut\'s Fire and Arcane bursts, The Quartermaster\'s Arcane bills. Full Physical Resistance gear does nothing against these.',None),
('Beating high resistance: Penetration stats on gear ignore enemy resistance, and Legendary items can convert your damage type (e.g. a sword that turns all your Physical damage into Fire).',None),
('Loot: cards, codexes and gold are on Loot Tables (each line rolls independently). Gear is on Gear Drops: each kill makes 2 or more gear rolls, each picking a rarity and a base from that enemy\'s pool; every base drops from 3-6 enemies and carries the Fire Resistance implicit. Luck raises every chance. Drop uniqueness (decided): every Blue and Gold card drops from exactly one enemy in the whole game; White cards may drop from several enemies and Green cards from a few.',None),
('',None),('Gearing and pushing path','h'),
('1. Fresh character (starter deck): clear Physical +0. Tier 1 enemies drop cheap stat rings, boots and gloves; every enemy drops a card for your class.',None),
('2. Build your deck: farm the elite that holds your Gold cards (each elite drops one Gold per class) and the regulars holding your Blues.',None),
('3. Prepare for the next map: all gear here rolls Fire Resistance, which you need for the Fire map (Fire drops Frost Resistance, and so on around the ladder).',None),
('4. Chase your codex: Warlord Gorrath drops the Colossus, Ninja, Barrier Savant and Righteous Crusader codexes. Push map levels for better affixes and pre-upgraded cards.',None),
('5. Push Physical +N: enemy Physical resistance climbs, so bring off-element damage (Fire for beasts, Arcane for humans, Frost for constructs) and Physical Resistance from the Arcane map. Penetration gear comes later.',None),
('',None),
('Questions for you','h'),
('1. Legendary gear: a new rarity above Purple (fixed special effect such as damage conversion, plus random stats)?',None)]
for i,(t,k) in enumerate(lines,start=1):
    c=ov.cell(i,1,t); c.alignment=wrap
    c.font={'t':Font(name=F,bold=True,size=16),'i':Font(name=F,italic=True,size=10,color='4B5563'),'h':Font(name=F,bold=True,size=12)}.get(k,body)
ov.column_dimensions['A'].width=130
r=ov.max_row+2
ov.cell(r,1,'Physical share of enemy attack cards (formula over Enemy Decks):').font=Font(name=F,bold=True,size=10)
ov.cell(r,2,"=SUMIFS('Enemy Decks'!C:C,'Enemy Decks'!F:F,\"Physical\")/SUMIFS('Enemy Decks'!C:C,'Enemy Decks'!E:E,\"Attack\")").number_format='0%'
ov.cell(r+1,1,'Physical-type enemies (formula over Roster):').font=Font(name=F,bold=True,size=10)
ov.cell(r+1,2,"=COUNTIF(Roster!G:G,\"Physical\")/(COUNTA(Roster!A:A)-1)").number_format='0%'
ov.column_dimensions['B'].width=10
# ---- Roster
ro=wb.create_sheet('Roster'); head(ro,1,['Enemy','Tier','Map rows','Role','Style','Creature','Type (resists)','Weak to (takes 125%)','Attack cards by damage type','HP (solo)','Draw','Mana (max / regen)','Deck size','Description','Signature drops (Golds, codexes or gear bases)'])
for e in EN:
    size=sum(k for nm,k,_,_,_ in e['deck'] if not nm.startswith('PHASE 2'))
    sig = ', '.join(e['golds'].values()) if 'golds' in e else (', '.join(MAP['boss_codexes'][c]+' codex' for c in MAP['boss_codexes']) if e.get('codexes') else ', '.join(POOLS[e['name']]))
    cr,ty,wk=TYPE[e['name']]
    dc=collections.Counter()
    for nm,k,_c,kind,_f in e['deck']:
        if kind=='Attack': dc[dtype(e,nm,kind).split(' ')[0]]+=k
    deals=', '.join(f'{t} ({n})' for t,n in dc.most_common())
    ro.append([e['name'],str(e['tier']),e['rows'],e['role'],e['arch'],cr,ty,wk,deals,e['hp'],str(e['draw']),e['mana'],size,e['desc'],sig])
    for c in ro[ro.max_row]: c.font=body; c.alignment=wrap; c.fill=PatternFill('solid',fgColor=TF[e['tier']])
    ro.cell(ro.max_row,1).font=Font(name=F,bold=True,size=10)
widths(ro,[26,7,9,8,24,12,10,11,20,8,10,14,7,54,48]); ro.freeze_panes='B2'
# ---- Enemy Decks
dk=wb.create_sheet('Enemy Decks'); head(dk,1,['Enemy','Card','Copies','Cost','Kind','Damage type','Effect'])
for e in EN:
    for nm,k,cost,kind,eff in e['deck']:
        dk.append([e['name'],nm,k,cost,kind,dtype(e,nm,kind),eff])
        for c in dk[dk.max_row]: c.font=body; c.alignment=wrap; c.fill=PatternFill('solid',fgColor=TF[e['tier']])
    r=dk.max_row+1; dk.cell(r,2,'Deck total').font=Font(name=F,bold=True,size=10)
    first=r-len(e['deck']); dk.cell(r,3,f'=SUMIFS(C{first}:C{r-1},B{first}:B{r-1},"<>PHASE 2*")').font=Font(name=F,bold=True,size=10)
widths(dk,[26,24,7,6,8,14,76]); dk.freeze_panes='A2'
# ---- Loot
lt=wb.create_sheet('Loot Tables'); head(lt,1,['Enemy','Item','Item type','Class','Rarity','Base drop %','Notes'])
def add(e,item,typ,cls,rar,pct,note):
    lt.append([e['name'],item,typ,cls,rar,pct,note])
    for c in lt[lt.max_row]: c.font=body; c.alignment=wrap; c.fill=PatternFill('solid',fgColor=LIGHT.get(cls,TF[e['tier']]))
ri=0; ei=0
for e in EN:
    if e['role']=='Regular':
        for cls in MAP['boss_codexes']:
            c=reg_card(cls,ri); add(e,c['name'],'Card',cls,c['rar'],{'White':5,'Green':2,'Blue':1}[c['rar']],c['text'])
        ri+=1
    if e['role']=='Elite':
        for cls,g in e['golds'].items(): add(e,g,'Card',cls,'Gold',1.5,byname[(cls,g)]['text'])
        for cls in MAP['boss_codexes']:
            c=elite_card(cls,ei); add(e,c['name'],'Card',cls,c['rar'],{'White':6,'Green':3,'Blue':2}[c['rar']],c['text'])
        ei+=1
    if e.get('codexes'):
        for cls,cx in MAP['boss_codexes'].items(): add(e,f'{cx} Codex','Codex',cls,'Codex',3,'Fixed codex passive plus random affixes; cannot be upgraded.')
    add(e,'Gold coins','Currency','Any','-',100,GOLD_COINS[e['tier']]+' gold')
widths(lt,[26,26,12,9,13,10,80]); lt.freeze_panes='A2'; lt.auto_filter.ref=f'A1:G{lt.max_row}'
gd=wb.create_sheet('Gear Drops'); head(gd,1,['Enemy','Tier','Gear rolls per kill','White % per roll','Green % per roll','Blue % per roll','Purple % per roll','Base pool (one picked per roll)','Expected items per kill'])
GROUP={1:'Tier 1 regular',2:'Tier 2 regular',3:'Tier 3 regular','Elite':'Elite','Boss':'Boss'}
DR={g:(n,w,gr,b,pu) for g,n,w,gr,b,pu in DROPS}
for e in EN:
    n,w,gr,b,pu=DR[GROUP[e['tier']]]; r=gd.max_row+1
    gd.append([e['name'],str(e['tier']),n,w,gr,b,pu,', '.join(f"{x} ({BASESLOT[x]})" for x in POOLS[e['name']]),f'=C{r}*SUM(D{r}:G{r})/100'])
    for c in gd[r]: c.font=body; c.alignment=wrap; c.fill=PatternFill('solid',fgColor=TF[e['tier']])
    gd.cell(r,9).number_format='0.00'
gd.cell(gd.max_row+2,1,'Every item carries the map implicit (Fire Resistance) and random affixes by rarity: White 1, Green 2, Blue 3, Purple 4. Item level = total points rolled; see the Gear System workbook.').font=Font(name=F,italic=True,size=9,color='4B5563')
widths(gd,[26,7,9,9,9,9,9,70,10]); gd.freeze_panes='B2'
for sh in (ro,dk,lt,gd): sh.auto_filter.ref=sh.dimensions
wb.save(out); print('errors',errs or 'none','| loot rows',lt.max_row-1)
