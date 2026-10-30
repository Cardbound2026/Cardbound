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
ms = next(r for r in rows if r[1]=='Mana Sever' and r[3]=='Warrior')
ms[19] = 20; ms[16] = 'Moved to Blue; burn raised 10 to 20 so it competes with Mana Break (designer feedback).'
N='New (designer request). Codex Synergy is affinity, not ownership.'
def card(name,typ,tgt,dt,mana,syn,tags,text,toks,note=N):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]='Warrior'; r[4]='Blue'; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]='No'; r[11]='No'; r[12]='Blue pool: 4 per deck'; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card('Bully','Attack','Single Enemy','Physical',20,'Bulwark; Bloodbound; Any','Damage; HP check',
      "Deal [X] damage. If your current HP is higher than the target's, deal [Y] more.",[('[X]','Damage',16),('[Y]','Bonus damage',16)],
      N+' Compares current HP with the target. Punishes Bloodbound players who are low, rewards Stamina-heavy builds.'),
 card('Fortify','Skill','Self','None',20,'Bulwark','Block; Over time',
      "At the start of each of your next 5 turns, gain [X] Block.",[('[X]','Block per turn',10)],
      N+' 50 Block total for 20 mana, but spread over 5 turns.'),
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
