import openpyxl, sys, copy
from openpyxl.formula.translate import Translator
from openpyxl.styles import Alignment
p = sys.argv[1]
wb = openpyxl.load_workbook(p); ws = wb['Card Database']
last = int(ws.tables['CardScalingDatabase'].ref.split(':')[1][2:])
NIN, PREV = 49, range(50,56)
base = {c: ws.cell(6,c).value for c in PREV}
sty = {c: ws.cell(6,c)._style for c in range(1,56)}
rows = [[ws.cell(r,c).value for c in range(1,NIN+1)] for r in range(6,last+1)]
POOL = {'White':'No limit','Green':'Green pool: 6 per deck','Blue':'Blue pool: 4 per deck','Gold':'Gold pool: 2 per deck'}
byname = {r[1]: r for r in rows if r[3]=='Warrior'}
def setrar(name, rar, note):
    r = byname[name]; r[4]=rar; r[12]=POOL[rar]; r[16]=note
# --- changes to existing cards
ls = byname['Last Stand']
setrar('Last Stand','Gold','Moved to Gold with a downside (designer feedback). Assumed: 5% of MAX HP per card.')
ls[2]="Discard your hand. Heal [X]% of your max HP for each card discarded. Exhaust."; ls[18]='Max HP healed per card (%)'; ls[19]=5
setrar('Focused Fury','Gold','Moved to Gold (designer feedback).')
setrar('Mana Sever','Blue','Moved to Blue (designer feedback). Values unchanged; could rise to fit the Blue budget.')
iw = byname['Iron Will']; setrar('Iron Will','Green','Moved to Green; now 10 Block and 5 mana (designer feedback).'); iw[19]=10; iw[27]=5
# --- new cards
N='New (designer request). Codex Synergy is affinity, not ownership.'
S,SE='Self','Single Enemy'
def card(name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=N,exh='No',ret='No'):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]='Warrior'; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]=exh; r[11]=ret; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card('Forge-Hardened','Green','Skill',S,'None',10,'Bulwark; Any','Block; Damage conversion',"Gain [X] Block. The next attack you take is converted to Fire damage.",[('[X]','Block',6)]),
 card('Rimeguard','Green','Skill',S,'None',10,'Bulwark; Any','Block; Damage conversion',"Gain [X] Block. The next attack you take is converted to Frost damage.",[('[X]','Block',6)]),
 card('Tempered Steel','Blue','Skill',S,'None',20,'Any','Damage conversion',"Until your next turn, all damage you take is converted to Fire damage.",[],N+' With 75% Fire Resistance this is up to a 75% damage cut for a turn.'),
 card('Elemental Ward','Blue','Skill',S,'None',20,'Any','Damage conversion',"Choose an element. Until your next turn, all damage you take is converted to that element.",[]),
 card('Bloodthirst','Green','Attack',SE,'Physical',10,'Bloodbound; Any','Damage; Healing; Lifesteal',"Deal [X] damage. Heal for [Y]% of the damage dealt to the target's HP.",[('[X]','Damage',8),('[Y]','Lifesteal (%)',50)],N+' Not explicitly confirmed; remove if unwanted.'),
 card('Catch Your Breath','White','Skill',S,'None',0,'Any','Mana; Status Cards',"Gain [X] mana. Add a Dazed to your discard pile.",[('[X]','Mana gained',10)]),
 card('Hidden Reserves','Green','Skill',S,'None',0,'Any','Mana; Card Draw; On draw',"Unplayable. When you draw this card, gain [X] mana and draw 1 card.",[('[X]','Mana gained',20)],N+' Mana version of Living Bomb: triggers again after every reshuffle, so it grows in long fights.'),
 card('Battle Rhythm','Green','Skill',S,'None',10,'Any','Mana; Efficiency',"Your Attacks cost [X] less mana this turn.",[('[X]','Mana cost reduction',5)]),
 card('Steady Pace','Green','Power',S,'None',20,'Any','Mana regen',"Gain [X] mana regeneration for the rest of combat.",[('[X]','Mana regen',10)]),
 card('Deep Reserves','Gold','Power',S,'None',20,'Colossus; Any','Max mana',"Gain [X] maximum mana for the rest of combat.",[('[X]','Max mana',30)]),
 card('Spoils of War','Blue','Skill',S,'None',10,'Any','Mana',"If an enemy dies this turn, gain [X] mana.",[('[X]','Mana gained',30)],N+' Mana carries between fights, so this banks mana for the next one.'),
 card('Conditioning','Green','Power',S,'None',10,'Any','Max mana; Mana regen',"Gain [X] maximum mana and [Y] mana regeneration for the rest of combat.",[('[X]','Max mana',10),('[Y]','Mana regen',5)]),
 card('War Chest','Green','Skill',S,'None',10,'Colossus; Any','Mana; Retain',"Retain. If this is in your hand at the end of your turn, gain [X] mana.",[('[X]','Mana gained',10)],ret='Yes'),
 card('Second Lung','Blue','Power',S,'None',20,'Any','Mana regen',"Gain [X] mana regeneration for the rest of combat.",[('[X]','Mana regen',20)]),
 card('Marathon','Blue','Power',S,'None',20,'Any','Mana regen; Scaling',"At the start of each turn, your mana regeneration increases by [X] for the rest of combat.",[('[X]','Regen increase per turn',5)]),
 card('Momentum','Green','Power',S,'None',20,'Sunderer; Hemorrhage','Card Draw',"Whenever you play your 3rd Attack in a turn, draw 1 card.",[]),
 card('Battle Plan','Green','Skill',S,'None',10,'Any','Card Draw',"Next turn, draw [X] extra cards.",[('[X]','Extra cards',3)],N+' Made Green: 3 cards for 10 mana is above the White budget.'),
 card('Survey the Field','Green','Skill',S,'None',10,'Any','Card Draw; Tutor',"Look at the top [X] cards of your draw pile. Put 1 into your hand and the rest back in any order.",[('[X]','Cards looked at',3)]),
 card('Reckless Abandon','Blue','Skill',S,'None',0,'Any','Discard; Card Draw',"Discard your hand, then draw that many cards plus [X].",[('[X]','Bonus cards',1)]),
 card('Fall Back','Green','Skill',S,'None',0,'Colossus; Any','Discard; Card Draw',"Discard your hand. Next turn, draw that many extra cards.",[]),
 card('Blood Ritual','Blue','Power',S,'None',20,'Bloodbound','Card Draw; Self-harm',"At the start of each turn, draw [X] extra card and lose [Y] HP.",[('[X]','Extra cards',1),('[Y]','HP lost',5)]),
 card('Marching Orders','Green','Skill',S,'None',20,'Any','Card Draw; Scaling',"Draw 1 extra card next turn, 2 the turn after, and 3 the turn after that.",[]),
 card('Reckless Fury','Blue','Power',S,'None',10,'Bloodbound; Sunderer','Strength; Self-harm; Scaling',"Gain [X] Strength for the rest of combat. At the start of each turn, lose HP equal to the number of turns since you played this.",[('[X]','Strength',5)],N+' Interpretation of the ramping-cost idea: 1 HP, then 2, then 3...'),
 card('Adrenaline Surge','Green','Skill',S,'None',10,'Any','Strength; Decay',"Gain [X] Strength. It decreases by 1 at the start of each turn.",[('[X]','Strength',6)]),
]
ids=[r[0] for r in rows]
nxt = max(int(x[4:]) for x in ids if x.startswith('WAR'))+1
for k,r in enumerate(new): r[0]=f'WAR-{nxt+k:04d}'
pos = max(i for i,x in enumerate(ids) if x.startswith('WAR'))+1
rows = rows[:pos]+new+rows[pos:]
nlast=5+len(rows)
for k,vals in enumerate(rows):
    r=6+k
    for c in range(1,NIN+1): ws.cell(r,c).value=vals[c-1]
    for c in PREV: ws.cell(r,c).value=Translator(base[c],origin=ws.cell(6,c).coordinate).translate_formula(ws.cell(r,c).coordinate)
    for c in range(1,56): ws.cell(r,c)._style=copy.copy(sty[c])
    ws.cell(r,17).alignment=Alignment(wrap_text=True,vertical='top'); ws.row_dimensions[r].height=42
ws.tables['CardScalingDatabase'].ref=f'A5:BC{nlast}'
wb.save(p); print(nxt, nxt+len(new)-1, nlast)
