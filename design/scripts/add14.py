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
N='New (designer request). Codex Synergy is affinity, not ownership.'
def card(name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=N):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]='Warrior'; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]='No'; r[11]='No'; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card('Killer Instinct','Blue','Skill','Self','None',20,'Hemorrhage; Any','Critical Strike',"For the next 2 turns, gain [X]% Critical Chance and [Y]% Critical Damage.",[('[X]','Crit chance (%)',25),('[Y]','Crit damage (%)',50)],N+' 25% chance and +50% damage (crits become 2x instead of 1.5x).'),
 card('Lacerate','White','Attack','Single Enemy','Physical',10,'Hemorrhage','Damage; Bleed; Critical Strike',"Deal [X] damage. If this crits, apply [Y] Bleed.",[('[X]','Damage',4),('[Y]','Bleed',8)]),
 card('Sever','Green','Attack','Single Enemy','Physical',10,'Hemorrhage','Damage; Bleed; Critical Strike',"Deal [X] damage. If this crits, the target's Bleed deals its damage immediately (an extra tick).",[('[X]','Damage',6)],N+' Toned down from doubling Bleed to an instant extra tick (designer feedback).'),
 card('Scent of Blood','Blue','Skill','All Enemies','None',10,'Hemorrhage; Bloodbound','Card Draw; Bleed',"Draw 1 card for each enemy with Bleed.",[]),
 card('Crimson Whirl','Green','Attack','All Enemies','Physical',20,'Hemorrhage; Any','Damage; Bleed; AoE',"Swing your weapon in a circle: deal [X] damage and apply [Y] Bleed to all enemies. Breaks Stealth.",[('[X]','Damage',6),('[Y]','Bleed',5)]),
]
ids=[r[0] for r in rows]
nxt=max(int(x[4:]) for x in ids if x.startswith('WAR'))+1
for k,r in enumerate(new): r[0]=f'WAR-{nxt+k:04d}'
pos=max(i for i,x in enumerate(ids) if x.startswith('WAR'))+1
rows=rows[:pos]+new+rows[pos:]
nlast=5+len(rows)
for k,vals in enumerate(rows):
    r=6+k
    for c in range(1,NIN+1): ws.cell(r,c).value=vals[c-1]
    for c in PREV: ws.cell(r,c).value=Translator(base[c],origin=ws.cell(6,c).coordinate).translate_formula(ws.cell(r,c).coordinate)
    for c in range(1,56): ws.cell(r,c)._style=copy.copy(sty[c])
    ws.cell(r,17).alignment=Alignment(wrap_text=True,vertical='top'); ws.row_dimensions[r].height=42
ws.tables['CardScalingDatabase'].ref=f'A5:BC{nlast}'
wb.save(p); print(nxt, nlast)
