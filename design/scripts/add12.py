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
W = {r[1]: r for r in rows if r[3]=='Warrior'}
ds = W['Double Strike']; ds[16]=(ds[16] or '')+' Rule: the replay repeats the first result (designer decision). Watch combos with Limit Break and Thousand Cuts.'
N='New (designer request). Codex Synergy is affinity, not ownership.'
def card(name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=N,ret='No'):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]='Warrior'; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]='No'; r[11]=ret; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card('Brace for Impact','White','Skill','Self','None',0,'Colossus; Any','Block; Mana',"Gain [X] Block. At the start of your next turn, gain [Y] mana.",[('[X]','Block',5),('[Y]','Mana next turn',5)],N+' Cost set to 0 so it is worth a card slot; raise to 10 if too strong.'),
 card('Hunker Down','White','Skill','Self','None',10,'Colossus; Bulwark','Block; Mana',"Gain [X] Block. At the start of your next turn, gain [Y] mana.",[('[X]','Block',8),('[Y]','Mana next turn',5)],N+' Toned down from 10 mana to 5 (designer feedback).'),
 card('Seismic Slam','Blue','Attack','All Enemies','Physical',30,'Colossus','Damage; AoE; Mana',"Deal damage to all enemies equal to [X]% of your current mana. Your mana is not spent beyond this card's cost.",[('[X]','Current mana as damage (%)',50)]),
 card('Wind Up','Green','Skill','Self','None',10,'Colossus','Damage; Retain; Next card',"Retain. Your next Attack deals +1 damage for every [X] mana it costs.",[('[X]','Mana per bonus damage',5)],ret='Yes'),
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
