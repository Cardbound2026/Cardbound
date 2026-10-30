import openpyxl, sys, copy
from openpyxl.formula.translate import Translator
from openpyxl.styles import Alignment, Font
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src); ws = wb['Card Database']
last = int(ws.tables['CardScalingDatabase'].ref.split(':')[1][2:])
NIN, PREV = 49, range(50,56)
base = {c: ws.cell(6,c).value for c in PREV}
sty = {c: ws.cell(6,c)._style for c in range(1,56)}
rows = [[ws.cell(r,c).value for c in range(1,NIN+1)] for r in range(6,last+1)]
POOL = {'White':'No limit','Green':'Green pool: 6 per deck','Blue':'Blue pool: 4 per deck','Gold':'Gold pool: 2 per deck'}
def find(cls, name): return next(r for r in rows if r[3]==cls and r[1]==name)
def settoks(r, toks):
    for c in (17,18,19,20,25,26,27,28): r[c]=None
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)], toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
DN = 'Designer change (Draft 8).'
# --- edits to existing cards
r=find('Mage','Fireball'); r[2]="Deal [X] Fire damage and apply [Y] Burn."; settoks(r,[('[X]','Damage',7),('[Y]','Burn',3)]); r[16]=DN+' Burn reduced 7 to 3.'
r=find('Mage','Frostbolt'); r[2]="Deal [X] Frost damage. Reduce the target's mana regeneration by [Y] for 2 turns. Stacks."; settoks(r,[('[X]','Damage',5),('[Y]','Mana regen reduction',2)]); r[16]=DN+' Damage 7 to 5; regen reduction lasts 2 turns.'
r=find('Mage','Arcane Missiles'); r[2]="Deal [X] Arcane damage. Steal [Y] mana from the target."; settoks(r,[('[X]','Damage',5),('[Y]','Mana stolen',3)]); r[16]=DN+' Damage 7 to 5.'
r=find('Mage','Arcane Bolt'); r[2]="Deal [X] Arcane damage. Burn [Y] of the target's mana."; settoks(r,[('[X]','Damage',5),('[Y]','Mana burned',7)]); r[16]=DN+' Damage 7 to 5. (Assumed "arcane blast" in the notes meant this basic spell.)'
r=find('Paladin','Divine Detonation'); r[2]="Expend your Block and Barrier, dealing Holy damage equal to [X]% of the total to all enemies."; r[16]=(r[16] or '')+' '+DN+' Now spends Block and Barrier.'
r=find('Rogue','Sharpened Stars'); r[16]=(r[16] or '')+' '+DN+' Stacks with Shuriken Storm (doubled Shurikens hit all enemies).'
r=find('Rogue','Accelerant Venom'); r[2]="Poison ticks twice each turn; each tick removes 1 stack."; r[16]=(r[16] or '')+' '+DN+' Clarified: two ticks, each losing 1 stack.'
# --- new cards
NN='New (designer request, Draft 8). Codex Synergy is affinity, not ownership.'
def card(cls,name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=NN,exh='No'):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]=cls; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]=exh; r[11]='No'; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    settoks(r,toks); return r
REV="Remove Stealth from the target. It is Revealed (cannot enter Stealth) until the end of its next turn."
NEW = {
'Warrior':[
 card('Warrior','Flush Out','Green','Skill','Single Enemy','Physical',10,'Any','Damage; Revealed; Anti-Stealth',"Deal [X] damage. "+REV,[('[X]','Damage',5)],NN+' A Skill, so it can target a Stealthed enemy.'),
 card('Warrior','Iron Constitution','Green','Skill','Self','None',10,'Bulwark; Riposte; Any','Poison; Block',"For the next 2 turns, Poison damage you take is Physical and can be Blocked.",[]),
],
'Rogue':[
 card('Rogue','Fade to Black','Gold','Skill','Self','None',20,'Nightstalker','Cleanse; Bleed; Poison; Burn; Stealth',"Remove all Bleed, Poison and Burn from yourself, then enter Stealth.",[],NN+' Removes Bleed, unlike generic cleanses.'),
 card('Rogue','Dust in the Eyes','Green','Skill','Single Enemy','Physical',10,'Any','Damage; Revealed; Anti-Stealth',"Deal [X] damage. "+REV,[('[X]','Damage',5)]),
 card('Rogue','Corrosive Toxin','Green','Skill','Single Enemy','Nature',10,'Venomancer','Buff removal; Poison',"Remove 1 buff from the target, then apply [X] Poison.",[('[X]','Poison',4)],NN+' Counter to Iron Constitution and Purity of Body.'),
 card('Rogue','Grievous Shiv','Green','Attack','Single Enemy','Physical',0,'Venomancer; Nightstalker; Any','Damage; Grievous Wound',"Deal [X] damage. Apply Grievous Wound for 2 turns (healing received reduced by [Y]%).",[('[X]','Damage',3),('[Y]','Healing reduction (%)',50)],NN+' 0-cost, so it can be played from Stealth.'),
 card('Rogue','Tourniquet','Green','Skill','Self','None',10,'Any','Cleanse; Bleed; Dodge',"Remove all Bleed from yourself. Gain [X] Dodge per stack removed.",[('[X]','Dodge per stack',2)]),
 card('Rogue','Quartermaster','Green','Power','Self','None',10,'Ninja','Mana; Hand overflow',"Whenever a card would be added to your full hand, gain [X] mana. (The card goes to your discard pile.)",[('[X]','Mana',3)]),
 card('Rogue','Bankrupt','Gold','Attack','Single Enemy','Shadow',20,'Saboteur','Damage; Exhaust',"Deal [X] damage for every card the target has had exhausted this combat.",[('[X]','Damage per card',5)],NN+' Interpreted as cards lost to Exhaust; tell me if you meant total cards remaining.'),
],
'Mage':[
 card('Mage','Ice Bolt','White','Skill','Single Enemy','Frost',10,'Heart of Winter; Archmage','Damage; Chill',"Deal [X] Frost damage and apply [Y] Chill.",[('[X]','Damage',5),('[Y]','Chill',4)],NN+' Basic Chill source now that Frostbolt reduces regen.'),
 card('Mage','Faerie Fire','Green','Skill','Single Enemy','Arcane',10,'Any','Damage; Revealed; Anti-Stealth',"Deal [X] Arcane damage. "+REV,[('[X]','Damage',5)]),
 card('Mage','Malediction Mirror','Blue','Power','Self','Arcane',20,'Entropy; Any','Debuff reflection',"At the start of your turn, move all debuffs on you to the enemies that applied them.",[],NN+' Aggressive Mage answer to Poison and debuffs. Made Blue because it works every turn; tell me if it should be Green.'),
 card('Mage','Cauterizing Flame','Green','Skill','Self','Fire',10,'Any','Cleanse; Bleed; Barrier',"Remove all Bleed from yourself. Gain [X] Barrier per stack removed.",[('[X]','Barrier per stack',2)]),
],
'Paladin':[
 card('Paladin','Light Reveals All','Green','Skill','Single Enemy','Holy',10,'Any','Damage; Revealed; Anti-Stealth',"Deal [X] Holy damage. "+REV,[('[X]','Damage',5)]),
 card('Paladin','Purity of Body','Green','Skill','Self','None',10,'Bastion of Faith; Any','Poison; Block',"For the next 2 turns, Poison damage you take is Physical and can be Blocked.",[]),
 card('Paladin','Onward','White','Attack','Single Enemy','Physical',10,'Righteous Crusader','Damage; Card Draw; Alternation',"Deal [X] damage. Draw cards until you draw a Skill; discard the others.",[('[X]','Damage',5)]),
 card('Paladin','Raise the Banner','White','Skill','Self','None',10,'Righteous Crusader','Block; Barrier; Card Draw; Alternation',"Gain [X] Block and [Y] Barrier. Draw cards until you draw an Attack; discard the others.",[('[X]','Block',3),('[Y]','Barrier',3)]),
 card('Paladin','Penance','White','Skill','Self','None',0,'Equilibrium; Any','Self-harm; Block; Barrier',"Lose [X] HP. Gain [Y] Block and [Y] Barrier.",[('[X]','HP lost',10),('[Y]','Block and Barrier',3)],NN+' In Equilibrium (no Block or Barrier) only the HP loss applies, which is the point: it sets up effective heals.'),
],
}
PFX={'Warrior':'WAR','Rogue':'ROG','Mage':'MAG','Paladin':'PAL'}
for cls, new in NEW.items():
    ids=[r[0] for r in rows]; p=PFX[cls]
    nxt=max(int(x[4:]) for x in ids if x.startswith(p))+1
    for k,r in enumerate(new): r[0]=f'{p}-{nxt+k:04d}'
    pos=max(i for i,x in enumerate(ids) if x.startswith(p))+1
    rows=rows[:pos]+new+rows[pos:]
nlast=5+len(rows)
for k,vals in enumerate(rows):
    r=6+k
    for c in range(1,NIN+1): ws.cell(r,c).value=vals[c-1]
    for c in PREV: ws.cell(r,c).value=Translator(base[c],origin=ws.cell(6,c).coordinate).translate_formula(ws.cell(r,c).coordinate)
    for c in range(1,56): ws.cell(r,c)._style=copy.copy(sty[c])
    ws.cell(r,17).alignment=Alignment(wrap_text=True,vertical='top'); ws.row_dimensions[r].height=42
ws.tables['CardScalingDatabase'].ref=f'A5:BC{nlast}'
s=wb['Review Notes']; st=s.max_row+2
for i,(t,h) in enumerate([('Draft 8: designer notes applied',1),
 ('New: anti-Stealth card per class (Revealed), Poison-as-Physical for Block classes, buff-stripping Corrosive Toxin, Grievous Shiv (healing reduction), a Bleed cleanse per class at Green, Quartermaster (hand overflow mana), Bankrupt, Fade to Black, Ice Bolt, Malediction Mirror, Onward, Raise the Banner, Penance.',0),
 ('Changed: Fireball 7 + 3 Burn; Frostbolt 5 damage and 2-turn regen reduction; Arcane Missiles and Arcane Bolt 5 damage; Divine Detonation spends Block and Barrier.',0)]):
    c=s.cell(st+i,1,t); c.font=Font(name='Aptos',bold=bool(h),size=12 if h else 11); c.alignment=Alignment(wrap_text=True,vertical='top')
wb.save(out); print('rows',len(rows))
